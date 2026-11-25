import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTempGitRepo,
  expectGateFailure,
  expectGateSuccess,
  resolveTool,
  runCommand,
  taskArgv,
} from "./helpers/sandbox";

/**
 * A commit that contains a secret is refused by the pre-commit `secrets` job (spec 001, requirements 8.1
 * to 8.8, the stage 1 acceptance condition). The arguments come from `lefthook.yml` through
 * `lefthook dump`, so a changed job is tested as changed (8.3).
 *
 * The fake key is built at run time from random bytes, and its recognisable prefix is joined from two
 * parts, so no file in the repository contains a value that gitleaks detects (8.4). No output check
 * prints the key: comparisons are booleans, and failure messages carry only its length (8.6).
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** A GitHub personal access token shape that gitleaks' default rules detect: prefix + 36 characters. */
function fakeToken(): string {
  let body = "";
  for (const byte of randomBytes(36)) body += ALPHABET.charAt(byte % ALPHABET.length);
  return ["gh", "p_"].join("") + body;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The `secrets` job of pre-commit, as the merged configuration that lefthook really uses. */
function secretsJob(): Record<string, unknown> {
  const dump = runCommand([resolveTool("lefthook"), "dump", "--format=json"], { cwd: REPO_ROOT });
  expectGateSuccess(dump);
  const config: unknown = JSON.parse(dump.stdout);
  if (!isRecord(config)) throw new Error("lefthook dump: expected an object");
  const preCommit = config["pre-commit"];
  if (!isRecord(preCommit) || !Array.isArray(preCommit.jobs)) {
    throw new Error("lefthook dump: pre-commit has no jobs");
  }
  const job = preCommit.jobs.find((entry) => isRecord(entry) && entry.name === "secrets");
  if (!isRecord(job)) throw new Error('lefthook dump: pre-commit has no job named "secrets"');
  return job;
}

/** The job's `run` split on whitespace, the way the test (and the hook) invoke it without a shell. */
function secretsArgv(): string[] {
  const run = secretsJob().run;
  if (typeof run !== "string") throw new Error("the secrets job has no string `run`");
  return run.split(/\s+/).filter((token) => token !== "");
}

/** The gitleaks command of the secrets job with its program replaced by an absolute path. */
function gitleaksCommand(): string[] {
  const [program, ...args] = secretsArgv();
  if (program !== "gitleaks")
    throw new Error(`the secrets job must run gitleaks, not "${program}"`);
  return [resolveTool("gitleaks"), ...args];
}

/** The `check:secrets` task of mise.toml as an argv, with gitleaks as an absolute path. */
function checkSecretsCommand(): string[] {
  const [program, ...args] = taskArgv("check:secrets");
  if (program === undefined || !program.endsWith("gitleaks")) {
    throw new Error(`check:secrets must run gitleaks, not "${program}"`);
  }
  return [program, ...args];
}

function git(dir: string, ...args: string[]) {
  return runCommand([resolveTool("git"), ...args], { cwd: dir });
}

function stage(dir: string, file: string, content: string): void {
  writeFileSync(join(dir, file), content);
  expectGateSuccess(git(dir, "add", "--", file));
}

/** True when the output contains the key. Booleans only: a failed `toContain` would print the key. */
function leaks(output: string, key: string): boolean {
  return output.includes(key);
}

// Real gitleaks, lefthook and git run in child processes (spec 001, C6).
describe("secret commit refusal", { timeout: 120_000 }, () => {
  it("defines the secrets job as a plain gitleaks command without shell syntax (8.3)", () => {
    const argv = secretsArgv();
    expect(argv[0]).toBe("gitleaks");
    for (const token of argv) {
      expect(token, `shell metacharacter in "${token}"`).not.toMatch(/[;&|<>$`\\(){}*?!"'~]/);
    }
  });

  it("makes gitleaks exit non-zero for a staged secret (8.1)", () => {
    const dir = createTempGitRepo();
    stage(dir, "config.txt", `token = "${fakeToken()}"\n`);
    expectGateFailure(runCommand(gitleaksCommand(), { cwd: dir }), { output: /RuleID/ });
  });

  it("does not print the secret value (8.6)", () => {
    const dir = createTempGitRepo();
    const key = fakeToken();
    stage(dir, "config.txt", `token = "${key}"\n`);
    const result = runCommand(gitleaksCommand(), { cwd: dir });
    expectGateFailure(result, { output: /RuleID/ });
    const output = `${result.stdout}${result.stderr}`;
    expect(leaks(output, key), `the output leaked a secret of length ${key.length}`).toBe(false);
  });

  it("makes gitleaks exit 0 when only files without secrets are staged (8.2)", () => {
    const dir = createTempGitRepo();
    stage(dir, "notes.txt", "nothing secret here\n");
    expectGateSuccess(runCommand(gitleaksCommand(), { cwd: dir }));
  });

  it("is not switched off by a gitleaks:allow comment (8.5)", () => {
    const dir = createTempGitRepo();
    stage(dir, "config.txt", `token = "${fakeToken()}" # gitleaks:allow\n`);
    expectGateFailure(runCommand(gitleaksCommand(), { cwd: dir }), { output: /RuleID/ });
  });

  it("keeps gitleaks on its default rules: no config or ignore file at the root (8.5)", () => {
    for (const file of [".gitleaks.toml", ".gitleaksignore"]) {
      expect(
        existsSync(join(REPO_ROOT, file)),
        `${file} would make the hook and this test diverge`,
      ).toBe(false);
    }
  });

  describe("through the real git hook (7.3)", () => {
    /** A repository whose only hook is the real secrets job, installed with lefthook. */
    function repoWithSecretsHook(): string {
      const dir = createTempGitRepo();
      const config = {
        assert_lefthook_installed: true,
        "pre-commit": { parallel: true, jobs: [secretsJob()] },
      };
      writeFileSync(join(dir, "lefthook.json"), JSON.stringify(config));
      expectGateSuccess(runCommand([resolveTool("lefthook"), "install"], { cwd: dir }));
      return dir;
    }

    it("refuses a commit that contains a secret and leaves no commit behind", () => {
      const dir = repoWithSecretsHook();
      const key = fakeToken();
      stage(dir, "config.txt", `token = "${key}"\n`);

      const commit = git(dir, "commit", "-m", "chore: add config");
      expectGateFailure(commit, { output: /RuleID/ });
      const output = `${commit.stdout}${commit.stderr}`;
      expect(leaks(output, key), `the hook output leaked a secret of length ${key.length}`).toBe(
        false,
      );
      expectGateFailure(git(dir, "rev-parse", "--verify", "HEAD"), { output: /fatal/ });
    });

    it("accepts a commit without secrets and creates it (control)", () => {
      const dir = repoWithSecretsHook();
      stage(dir, "notes.txt", "nothing secret here\n");

      expectGateSuccess(git(dir, "commit", "-m", "chore: add notes"));
      const head = git(dir, "rev-parse", "--verify", "HEAD");
      expectGateSuccess(head);
      expect(head.stdout.trim()).toMatch(/^[0-9a-f]{40}$/);
    });
  });

  // `check:secrets` is the scan of the commit history that `verify` runs (3.1, 3.12). It uses the same
  // fake key, but commits it first, because it reads history and not the index.
  describe("check:secrets over the commit history (3.12)", () => {
    function commitWithoutHook(dir: string, message: string) {
      // The temporary repository has no hook installed, so a plain commit goes through.
      expectGateSuccess(git(dir, "commit", "-m", message));
    }

    it("exits non-zero for a committed secret, names the rule, and never prints the value", () => {
      const dir = createTempGitRepo();
      const key = fakeToken();
      stage(dir, "config.txt", `token = "${key}"\n`);
      commitWithoutHook(dir, "chore: add config");

      const result = runCommand(checkSecretsCommand(), { cwd: dir });
      expectGateFailure(result, { output: /RuleID/ });
      const output = `${result.stdout}${result.stderr}`;
      expect(leaks(output, key), `the output leaked a secret of length ${key.length}`).toBe(false);
    });

    it("control: a history without secrets exits 0", () => {
      const dir = createTempGitRepo();
      stage(dir, "notes.txt", "nothing secret here\n");
      commitWithoutHook(dir, "chore: add notes");
      expectGateSuccess(runCommand(checkSecretsCommand(), { cwd: dir }));
    });

    it("scans only what HEAD reaches, not other branches (3.7)", () => {
      const dir = createTempGitRepo();
      stage(dir, "notes.txt", "nothing secret here\n");
      commitWithoutHook(dir, "chore: add notes");
      expectGateSuccess(git(dir, "switch", "--quiet", "-c", "side"));
      stage(dir, "config.txt", `token = "${fakeToken()}"\n`);
      commitWithoutHook(dir, "chore: add config on a side branch");
      expectGateSuccess(git(dir, "switch", "--quiet", "-"));

      // HEAD is back on the first branch, whose history is clean, so the scan passes. A scan of every
      // ref would find the key on `side` and make the result depend on which branches exist.
      expectGateSuccess(runCommand(checkSecretsCommand(), { cwd: dir }));
    });
  });
});
