import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTempGitRepo,
  expectGateFailure,
  expectGateSuccess,
  isolatedEnv,
  resolveTool,
  runCommand,
  taskRun,
} from "./helpers/sandbox";

/**
 * Configuration of the security task and, in later tasks, of the hooks and CI (spec 001, C12).
 * This part covers `security` (requirements 4.1 to 4.5).
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** The task a run entry refers to: `{ task = "x" }` or the text `mise run x`. */
function referencedTask(entry: string | { readonly task: string }): string | undefined {
  if (typeof entry !== "string") return entry.task;
  return /^mise run (\S+)$/.exec(entry.trim())?.[1];
}

/** The single command of a task as one string. */
function commandOf(name: string): string {
  const run = taskRun(name);
  const [first, ...rest] = run;
  if (typeof first !== "string" || rest.length > 0) {
    throw new Error(`task "${name}" must be a single command, got ${JSON.stringify(run)}`);
  }
  return first;
}

// ---------------------------------------------------------------------------------------------
// Recording an exclusion (4.5). The files exist only when an advisory is excluded on purpose, so the
// rules are functions over text: they are tested on samples, and applied to the real files if present.
// ---------------------------------------------------------------------------------------------

/**
 * Problems in an osv-scanner.toml. Each `[[IgnoredVulns]]` block needs `id`, `ignoreUntil` and a
 * `reason`. The reason has to say when the exclusion ends.
 */
function osvIgnoreProblems(toml: string): string[] {
  const problems: string[] = [];
  const blocks = toml.split(/^\[\[IgnoredVulns\]\]\s*$/m).slice(1);
  blocks.forEach((block, index) => {
    const label = `[[IgnoredVulns]] #${index + 1}`;
    const field = (name: string) =>
      new RegExp(`^\\s*${name}\\s*=\\s*(.+?)\\s*$`, "m").exec(block)?.[1];
    if (field("id") === undefined) problems.push(`${label}: missing id`);
    if (field("ignoreUntil") === undefined) problems.push(`${label}: missing ignoreUntil`);
    const reason = field("reason");
    if (reason === undefined) {
      problems.push(`${label}: missing reason`);
    } else if (!/retire/i.test(reason)) {
      problems.push(`${label}: the reason must state when the exclusion is retired`);
    }
  });
  return problems;
}

/**
 * Problems in the `audit.ignore` list of a pnpm-workspace.yaml. Each advisory ID needs comment lines
 * right above it that give a `Reason:` and a `Retire when:`.
 */
function auditIgnoreProblems(yaml: string): string[] {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => /^audit:\s*$/.test(line));
  if (start === -1) return [];
  const problems: string[] = [];
  let inIgnore = false;
  let comments: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== "" && !/^\s/.test(line)) break; // left the audit block
    if (/^\s+ignore:\s*$/.test(line)) {
      inIgnore = true;
      continue;
    }
    if (!inIgnore) continue;
    const comment = /^\s*#\s?(.*)$/.exec(line);
    if (comment) {
      comments.push(comment[1] ?? "");
      continue;
    }
    const item = /^\s*-\s+(\S+)/.exec(line);
    if (item) {
      const text = comments.join("\n");
      if (!/Reason:/i.test(text)) problems.push(`${item[1]}: missing "Reason:" comment above it`);
      if (!/Retire when:/i.test(text)) {
        problems.push(`${item[1]}: missing "Retire when:" comment above it`);
      }
    }
    comments = [];
  }
  return problems;
}

describe("security task configuration", { timeout: 120_000 }, () => {
  it("runs security:osv then security:audit, in that order and nothing else (4.1)", () => {
    expect(taskRun("security").map(referencedTask)).toEqual(["security:osv", "security:audit"]);
  });

  it("fails on high advisories and does not hide registry errors (4.2, 4.4)", () => {
    const command = commandOf("security:audit");
    expect(command).toContain("pnpm audit");
    expect(command).toContain("--audit-level=high");
    // --ignore-registry-errors turns an unreachable registry into success (4.4).
    expect(command).not.toContain("--ignore-registry-errors");
    // `|| true` turns any failure into success.
    expect(command).not.toMatch(/\|\|\s*(true|:)/);
    expect(command).not.toContain(";");
  });

  it("scans pnpm-lock.yaml with osv-scanner and cannot turn a failure into success (4.3)", () => {
    const command = commandOf("security:osv");
    expect(command).toMatch(/^osv-scanner\s+scan\s+source\b/);
    expect(command).toContain("--lockfile=pnpm-lock.yaml");
    expect(command).not.toMatch(/\|\|\s*(true|:)/);
    expect(command).not.toContain(";");
  });

  describe("recording an exclusion (4.5)", () => {
    const GOOD_OSV = [
      "[[IgnoredVulns]]",
      'id = "GHSA-aaaa-bbbb-cccc"',
      "ignoreUntil = 2027-01-31",
      'reason = "Dev-only dependency, not reachable. Retire when the fixed version passes the 24h gate."',
      "",
    ].join("\n");

    it("accepts an osv exclusion that has id, ignoreUntil and a reason with a retirement", () => {
      expect(osvIgnoreProblems(GOOD_OSV)).toEqual([]);
    });

    it("rejects an osv exclusion without ignoreUntil, without a reason, or without a retirement", () => {
      expect(osvIgnoreProblems(GOOD_OSV.replace(/^ignoreUntil.*\n/m, ""))).toEqual([
        "[[IgnoredVulns]] #1: missing ignoreUntil",
      ]);
      expect(osvIgnoreProblems(GOOD_OSV.replace(/^reason.*\n/m, ""))).toEqual([
        "[[IgnoredVulns]] #1: missing reason",
      ]);
      expect(osvIgnoreProblems(GOOD_OSV.replace(/ Retire when[^"]*/, ""))).toEqual([
        "[[IgnoredVulns]] #1: the reason must state when the exclusion is retired",
      ]);
    });

    it("checks every [[IgnoredVulns]] block, not only the first", () => {
      const problems = osvIgnoreProblems(
        `${GOOD_OSV}\n[[IgnoredVulns]]\nid = "GHSA-dddd-eeee-ffff"\n`,
      );
      expect(problems).toEqual([
        "[[IgnoredVulns]] #2: missing ignoreUntil",
        "[[IgnoredVulns]] #2: missing reason",
      ]);
    });

    const GOOD_AUDIT = [
      "audit:",
      "  ignore:",
      "    # Reason: only reachable through a dev tool that never sees untrusted input.",
      "    # Retire when: the fixed version has passed the 24h gate.",
      "    - GHSA-aaaa-bbbb-cccc",
      "",
    ].join("\n");

    it("accepts an audit.ignore entry with a Reason and a Retire when comment", () => {
      expect(auditIgnoreProblems(GOOD_AUDIT)).toEqual([]);
    });

    it("rejects an audit.ignore entry that lacks either comment, and checks every entry", () => {
      expect(auditIgnoreProblems(GOOD_AUDIT.replace(/^.*Retire when.*\n/m, ""))).toEqual([
        'GHSA-aaaa-bbbb-cccc: missing "Retire when:" comment above it',
      ]);
      expect(auditIgnoreProblems(GOOD_AUDIT.replace(/^.*Reason:.*\n/m, ""))).toEqual([
        'GHSA-aaaa-bbbb-cccc: missing "Reason:" comment above it',
      ]);
      expect(auditIgnoreProblems(`${GOOD_AUDIT}    - GHSA-dddd-eeee-ffff\n`)).toEqual([
        'GHSA-dddd-eeee-ffff: missing "Reason:" comment above it',
        'GHSA-dddd-eeee-ffff: missing "Retire when:" comment above it',
      ]);
    });

    it("ignores a workspace file that has no audit block", () => {
      expect(auditIgnoreProblems("minimumReleaseAge: 1440\n")).toEqual([]);
    });

    // The real files exist only when an advisory is excluded. Without them nothing is checked: having no
    // exclusion is the correct state.
    it("holds the real osv-scanner.toml, if it exists, to the same rule", () => {
      const path = join(REPO_ROOT, "osv-scanner.toml");
      if (!existsSync(path)) return;
      expect(osvIgnoreProblems(readFileSync(path, "utf8"))).toEqual([]);
    });

    it("holds the real pnpm-workspace.yaml audit.ignore, if it has one, to the same rule", () => {
      const path = join(REPO_ROOT, "pnpm-workspace.yaml");
      expect(auditIgnoreProblems(readFileSync(path, "utf8"))).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------------------------
// Auxiliary tasks (requirements 5.1 to 5.4, 13.3): runtime, outdated and setup. None of them is part
// of `verify`. These tests only read the task definitions; `setup` is never run from a test, because
// it installs the git hooks.
// ---------------------------------------------------------------------------------------------

/** The commands of a task, each as one string. Every entry must be a plain command. */
function commandsOf(name: string): string[] {
  return taskRun(name).map((entry) => {
    if (typeof entry !== "string") {
      throw new Error(`task "${name}" must hold plain commands, got ${JSON.stringify(entry)}`);
    }
    return entry;
  });
}

function descriptionOf(name: string): string {
  const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
  expectGateSuccess(result);
  const tasks: unknown = JSON.parse(result.stdout);
  if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
  for (const task of tasks) {
    if (typeof task === "object" && task !== null && "name" in task && task.name === name) {
      const description = (task as { description?: unknown }).description;
      return typeof description === "string" ? description : "";
    }
  }
  throw new Error(`mise task "${name}" does not exist`);
}

describe("auxiliary tasks", { timeout: 120_000 }, () => {
  it("runtime prints the seven tool versions, in order, and compares none of them (5.1, 5.2)", () => {
    const commands = commandsOf("runtime");
    // Compare only the program and its first argument, so the next check can tell a changed command
    // apart from a wrapped one (a pipe, a comparison, a masked exit code).
    expect(commands.map((command) => command.split(/\s+\|\s+|\s+&&\s+|\s+\|\|\s+/)[0])).toEqual([
      "node -v",
      "pnpm -v",
      "pnpm exec tsc -v",
      "pnpm exec next --version",
      "lefthook version",
      "gitleaks version",
      "osv-scanner --version",
    ]);
    for (const command of commands) {
      // A comparison or a masked exit code would make the task a pass/fail check.
      expect(command, command).not.toMatch(/\|\||&&|;|\bgrep\b|==|\btest\b|\[/);
    }
  });

  it("outdated lists tool updates, then npm updates, and writes nothing (5.3, 5.4)", () => {
    const commands = commandsOf("outdated");
    expect(commands).toEqual(["mise outdated", "pnpm outdated"]);
    const writers = new Set([
      "update",
      "upgrade",
      "up",
      "add",
      "install",
      "remove",
      "uninstall",
      "--write",
      "-w",
      "--save",
      "--latest",
    ]);
    for (const command of commands) {
      for (const word of command.split(/\s+/)) {
        expect(writers.has(word), `"${command}" contains the writing word "${word}"`).toBe(false);
      }
      expect(command, command).not.toMatch(/\|\||&&|;/);
    }
  });

  it("outdated says in its description that pnpm outdated exits 1 when there are candidates (5.3)", () => {
    const description = descriptionOf("outdated");
    expect(description).toMatch(/exit/i);
    expect(description).toMatch(/\b1\b/);
  });

  it("setup installs from the lockfile, installs the browser, then registers the hooks (13.3)", () => {
    expect(commandsOf("setup")).toEqual([
      "pnpm install --frozen-lockfile",
      "pnpm exec playwright install chromium",
      "lefthook install",
    ]);
  });

  it("keeps all three out of verify, which must stay offline (3.6)", () => {
    const reached = tasksReachedByVerify();
    for (const name of ["runtime", "outdated", "setup"]) {
      expect(reached.has(name), `${name} must not be reachable from verify`).toBe(false);
    }
  });
});

/** Every task verify reaches through `{ task }` entries. */
function tasksReachedByVerify(found: Set<string> = new Set(), name = "verify"): Set<string> {
  for (const entry of taskRun(name)) {
    const reference = referencedTask(entry);
    if (reference !== undefined && !found.has(reference)) {
      found.add(reference);
      tasksReachedByVerify(found, reference);
    }
  }
  return found;
}

// ---------------------------------------------------------------------------------------------
// Hook configuration (requirements 7.2 to 7.8). The merged configuration that lefthook really uses
// is read with `lefthook dump`, so a lefthook-local file or a changed job is seen as it is.
// ---------------------------------------------------------------------------------------------

interface HookJob {
  readonly name: string;
  readonly run: string;
}

interface HookConfig {
  readonly assertInstalled: unknown;
  readonly hooks: Readonly<
    Record<
      string,
      { readonly parallel: unknown; readonly piped: unknown; readonly jobs: HookJob[] }
    >
  >;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hookConfig(): HookConfig {
  const dump = runCommand([resolveTool("lefthook"), "dump", "--format=json"], { cwd: REPO_ROOT });
  expectGateSuccess(dump);
  const parsed: unknown = JSON.parse(dump.stdout);
  if (!isObject(parsed)) throw new Error("lefthook dump: expected an object");
  const hooks: Record<string, { parallel: unknown; piped: unknown; jobs: HookJob[] }> = {};
  for (const [name, value] of Object.entries(parsed)) {
    if (!isObject(value) || !Array.isArray(value.jobs)) continue;
    const jobs = value.jobs.map((job): HookJob => {
      if (!isObject(job) || typeof job.name !== "string" || typeof job.run !== "string") {
        throw new Error(`lefthook dump: a job of "${name}" needs a string name and run`);
      }
      return { name: job.name, run: job.run };
    });
    hooks[name] = { parallel: value.parallel, piped: value.piped, jobs };
  }
  return { assertInstalled: parsed.assert_lefthook_installed, hooks };
}

function jobsOf(config: HookConfig, hook: string): HookJob[] {
  const entry = config.hooks[hook];
  if (entry === undefined) throw new Error(`lefthook.yml defines no "${hook}" hook`);
  return entry.jobs;
}

describe("git hooks configuration", { timeout: 120_000 }, () => {
  it("asserts that lefthook is installed, so a missing lefthook fails the hook (7.7)", () => {
    expect(hookConfig().assertInstalled).toBe(true);
  });

  it("runs four pre-commit jobs in parallel (7.2)", () => {
    const config = hookConfig();
    expect(config.hooks["pre-commit"]?.parallel).toBe(true);
    expect(jobsOf(config, "pre-commit").map((job) => job.name)).toEqual([
      "secrets",
      "biome",
      "typecheck",
      "model-ids",
    ]);
  });

  it("checks the staged files with Biome without failing on files it does not handle (7.2)", () => {
    const biome = jobsOf(hookConfig(), "pre-commit").find((job) => job.name === "biome");
    expect(biome?.run).toBe(
      "pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true",
    );
  });

  it("runs the whole type check and the model-ID check through mise, not on a file glob (7.2, 7.8)", () => {
    const jobs = jobsOf(hookConfig(), "pre-commit");
    expect(jobs.find((job) => job.name === "typecheck")?.run).toBe("mise run typecheck");
    expect(jobs.find((job) => job.name === "model-ids")?.run).toBe("mise run check:model-ids");
  });

  it("has a commit-msg job that runs the Conventional Commits check on the message file (7.4)", () => {
    expect(jobsOf(hookConfig(), "commit-msg")).toEqual([
      { name: "conventional", run: "node scripts/check-commit-msg.mjs {1}" },
    ]);
  });

  it("runs pre-push one job after another, cheapest first, stopping at the first failure (7.5, 7.6)", () => {
    const config = hookConfig();
    expect(config.hooks["pre-push"]?.piped).toBe(true);
    expect(jobsOf(config, "pre-push")).toEqual([
      { name: "osv-scanner", run: "mise run security:osv" },
      { name: "pnpm-audit", run: "mise run security:audit" },
      { name: "unit-tests", run: "mise run test" },
      { name: "e2e-smoke", run: "mise run e2e" },
    ]);
  });

  it("only refers to mise tasks that exist (7.8)", () => {
    const config = hookConfig();
    const referenced = Object.values(config.hooks)
      .flatMap((hook) => hook.jobs)
      .flatMap((job) => {
        const match = /^mise run (\S+)$/.exec(job.run);
        return match?.[1] === undefined ? [] : [match[1]];
      });
    expect(referenced.length, "the hooks should call mise tasks").toBeGreaterThan(0);
    for (const task of referenced) {
      expect(() => taskRun(task), `hook refers to the missing mise task "${task}"`).not.toThrow();
    }
  });

  it("gives the secrets job the same flags as the check:secrets task, plus --staged (7.8, 8.5)", () => {
    const secrets = jobsOf(hookConfig(), "pre-commit").find((job) => job.name === "secrets");
    expect(secrets?.run).toBeDefined();
    const flags = (secrets?.run ?? "").split(/\s+/);
    for (const required of ["--pre-commit", "--staged", "--redact", "--ignore-gitleaks-allow"]) {
      expect(flags, `the secrets job needs ${required}`).toContain(required);
    }
    // The verify task scans history with the same redaction and the same ignore handling.
    const task = commandOf("check:secrets").split(/\s+/);
    expect(task).toContain("--redact");
    expect(task).toContain("--ignore-gitleaks-allow");
  });

  it("uses the same audit threshold in the hook as in the security task (7.8)", () => {
    // The hook calls the mise task, so the threshold can only live in one place.
    expect(commandOf("security:audit")).toContain("--audit-level=high");
    const pnpmAudit = jobsOf(hookConfig(), "pre-push").find((job) => job.name === "pnpm-audit");
    expect(pnpmAudit?.run).toBe("mise run security:audit");
  });
});

// ---------------------------------------------------------------------------------------------
// Running the hooks (requirements 7.1, 7.3, 7.7). A temporary repository gets only the `secrets` job,
// because the other jobs need this repository's mise config and node_modules. lefthook skips every job
// when nothing is staged, so each case stages a file first.
// ---------------------------------------------------------------------------------------------

describe("running the hooks in a temporary repository", { timeout: 120_000 }, () => {
  /** The `secrets` job of the real configuration, as a lefthook.json of its own. */
  function secretsOnlyConfig(options: { assertInstalled: boolean }): string {
    const job = hookConfig().hooks["pre-commit"]?.jobs.find((entry) => entry.name === "secrets");
    if (job === undefined) throw new Error("the real lefthook.yml has no secrets job");
    return JSON.stringify({
      assert_lefthook_installed: options.assertInstalled,
      "pre-commit": { parallel: true, jobs: [job] },
    });
  }

  /** A repository with the hook installed and one harmless file staged. */
  function repoWithHook(options: { assertInstalled?: boolean } = {}): string {
    const dir = createTempGitRepo();
    writeFileSync(
      join(dir, "lefthook.json"),
      secretsOnlyConfig({ assertInstalled: options.assertInstalled ?? true }),
    );
    expectGateSuccess(runCommand([resolveTool("lefthook"), "install"], { cwd: dir }));
    writeFileSync(join(dir, "notes.txt"), "nothing secret here\n");
    expectGateSuccess(runCommand([resolveTool("git"), "add", "--", "notes.txt"], { cwd: dir }));
    return dir;
  }

  function runPreCommitHook(dir: string, env: Record<string, string>) {
    return runCommand(["/bin/sh", join(dir, ".git", "hooks", "pre-commit")], { cwd: dir, env });
  }

  /** Points the lefthook path embedded in the installed hook at nothing, as a removed mise version does. */
  function breakEmbeddedLefthookPath(dir: string): void {
    const hookPath = join(dir, ".git", "hooks", "pre-commit");
    const hook = readFileSync(hookPath, "utf8");
    const lefthook = resolveTool("lefthook");
    expect(hook, "the hook embeds the absolute path of lefthook").toContain(lefthook);
    writeFileSync(hookPath, hook.replaceAll(lefthook, join(dir, "no-such-lefthook")));
  }

  it("registers the three hook files with lefthook install (7.1)", () => {
    const dir = createTempGitRepo();
    // The real configuration, as it is, so a missing hook section would show here.
    copyFileSync(join(REPO_ROOT, "lefthook.yml"), join(dir, "lefthook.yml"));
    expectGateSuccess(runCommand([resolveTool("lefthook"), "install"], { cwd: dir }));
    for (const hook of ["pre-commit", "commit-msg", "pre-push"]) {
      expect(existsSync(join(dir, ".git", "hooks", hook)), `${hook} should be installed`).toBe(
        true,
      );
    }
  });

  it("control: with the tools on PATH the same staged file passes (7.3, 7.7)", () => {
    const dir = repoWithHook();
    expectGateSuccess(runPreCommitHook(dir, isolatedEnv()));
  });

  it("fails, naming gitleaks, when the job's tool is not on PATH (7.7)", () => {
    const dir = repoWithHook();
    // pathDirs [] leaves only /usr/bin:/bin. lefthook itself is still found through the absolute path
    // that `lefthook install` wrote into the hook, so it is the job's tool that is missing.
    const result = runPreCommitHook(dir, isolatedEnv({ pathDirs: [] }));
    expectGateFailure(result, { output: /gitleaks/ });
    expect(result.status, "lefthook turns the job's 127 into 1").toBe(1);
  });

  it("fails with a clear message when lefthook itself cannot be found (7.7)", () => {
    const dir = repoWithHook();
    breakEmbeddedLefthookPath(dir);
    const result = runPreCommitHook(dir, isolatedEnv({ pathDirs: [] }));
    expectGateFailure(result, { output: /Can't find lefthook in PATH/ });
    expect(result.status).toBe(1);
  });

  it("control: without the assertion, the same missing lefthook passes silently (7.7)", () => {
    const dir = repoWithHook({ assertInstalled: false });
    breakEmbeddedLefthookPath(dir);
    expectGateSuccess(runPreCommitHook(dir, isolatedEnv({ pathDirs: [] })));
  });
});

// ---------------------------------------------------------------------------------------------
// The CI workflow (requirements 10.1, 10.3, 10.4, 10.6, 10.7, 10.9). It is read as text, line by
// line, because the plan declares no YAML library. Each check looks inside one job's block.
// ---------------------------------------------------------------------------------------------

const CI_PATH = join(REPO_ROOT, ".github", "workflows", "ci.yml");

function ciText(): string {
  return readFileSync(CI_PATH, "utf8");
}

/**
 * The block of one job: from `  <name>:` under `jobs:` to the next job at the same indent. Empty when
 * the job is missing.
 */
function jobBlock(text: string, name: string): string {
  const lines = text.split("\n");
  const jobsAt = lines.findIndex((line) => /^jobs:\s*$/.test(line));
  if (jobsAt === -1) return "";
  const start = lines.findIndex((line, index) => index > jobsAt && line === `  ${name}:`);
  if (start === -1) return "";
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^ {2}\S/.test(line) || /^\S/.test(line));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/** The `run:` commands of a job, one string per step. A step is written `- run: ...` or `  run: ...`. */
function runSteps(block: string): string[] {
  return [...block.matchAll(/^\s+(?:-\s+)?run:\s*(.+)$/gm)].map((match) => (match[1] ?? "").trim());
}

describe("CI workflow", { timeout: 120_000 }, () => {
  it("runs on push to main and exp/**, on pull requests, weekly and by hand (10.1, 10.3)", () => {
    const text = ciText();
    expect(text).toMatch(/^ {2}push:\s*\n {4}branches:\s*\[main, "exp\/\*\*"\]/m);
    expect(text).toMatch(/^ {2}pull_request:\s*$/m);
    expect(text).toMatch(/^ {2}schedule:\s*\n {4}- cron: "[^"]+"/m);
    expect(text).toMatch(/^ {2}workflow_dispatch:\s*$/m);
  });

  it("grants nothing at the top and only `contents: read` to each job (10.9)", () => {
    const text = ciText();
    expect(text).toMatch(/^permissions: \{\}\s*$/m);
    for (const job of ["verify", "verify-node27"]) {
      expect(jobBlock(text, job), `${job} needs its own permissions`).toMatch(
        /^ {4}permissions:\s*\n {6}contents: read\s*$/m,
      );
    }
  });

  it("runs verify and security in the required verify job (10.1)", () => {
    const steps = runSteps(jobBlock(ciText(), "verify"));
    expect(steps).toContain("mise run verify");
    expect(steps).toContain("mise run security");
  });

  it("runs verify, and not security, in the Node 27 job (10.3)", () => {
    const steps = runSteps(jobBlock(ciText(), "verify-node27"));
    expect(steps).toContain("mise run verify");
    expect(steps).not.toContain("mise run security");
  });

  it("lets only the Node 27 job fail without failing the workflow (10.4)", () => {
    const text = ciText();
    expect(jobBlock(text, "verify-node27")).toMatch(/^ {4}continue-on-error: true\s*$/m);
    expect(jobBlock(text, "verify")).not.toContain("continue-on-error");
  });

  it("checks out the full history in the verify job, for the history scan (10.6)", () => {
    expect(jobBlock(ciText(), "verify")).toMatch(/^ {10}fetch-depth: 0\s*$/m);
  });

  it("installs only from the lockfile, in every job (10.7)", () => {
    const text = ciText();
    const installs = [...text.matchAll(/pnpm install\b.*$/gm)].map((match) => match[0]);
    expect(installs.length, "both jobs install dependencies").toBeGreaterThanOrEqual(2);
    for (const install of installs) {
      expect(install).toContain("--frozen-lockfile");
    }
  });

  it("keeps the verify job off the weekly schedule, which is for Node 27 only", () => {
    expect(jobBlock(ciText(), "verify")).toMatch(/^ {4}if: github\.event_name != 'schedule'\s*$/m);
  });

  it("does not let verify change tracked files (I-11)", () => {
    expect(runSteps(jobBlock(ciText(), "verify")).join("\n")).toContain("git status --porcelain");
  });
});

// ---------------------------------------------------------------------------------------------
// The daily security workflow (requirement 10.5). It runs the network checks every day, so a new
// advisory is reported even when no one pushes. Its failure shows as a failed workflow run.
// ---------------------------------------------------------------------------------------------

const DAILY_PATH = join(REPO_ROOT, ".github", "workflows", "security-daily.yml");

describe("daily security workflow", { timeout: 120_000 }, () => {
  it("exists in the repository", () => {
    expect(existsSync(DAILY_PATH), "security-daily.yml is missing").toBe(true);
  });

  it("runs every day on a schedule, and by hand (10.5)", () => {
    const text = readFileSync(DAILY_PATH, "utf8");
    // `* * *` after the time: every day of the month, every month, every weekday.
    expect(text).toMatch(/^ {2}schedule:\s*\n {4}- cron: "\d+ \d+ \* \* \*"\s*$/m);
    expect(text).toMatch(/^ {2}workflow_dispatch:\s*$/m);
  });

  it("runs the security task and nothing that writes to the repository (10.5)", () => {
    const steps = runSteps(jobBlock(readFileSync(DAILY_PATH, "utf8"), "security"));
    expect(steps).toContain("mise run security");
    for (const step of steps) {
      expect(step, `"${step}" should not change the repository`).not.toMatch(
        /\bgit (commit|push)\b|\bpnpm update\b/,
      );
    }
  });

  it("grants nothing at the top and contents: read to its job (10.9)", () => {
    const text = readFileSync(DAILY_PATH, "utf8");
    expect(text).toMatch(/^permissions: \{\}\s*$/m);
    expect(jobBlock(text, "security")).toMatch(/^ {4}permissions:\s*\n {6}contents: read\s*$/m);
  });

  it("does not keep the checkout's credentials on disk, since the scan needs none (10.9)", () => {
    expect(jobBlock(readFileSync(DAILY_PATH, "utf8"), "security")).toMatch(
      /^ {10}persist-credentials: false\s*$/m,
    );
  });
});
