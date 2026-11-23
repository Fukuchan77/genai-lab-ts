import { existsSync, statSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type CommandResult,
  createTempGitRepo,
  editArgv,
  expectGateFailure,
  expectGateSuccess,
  isolatedEnv,
  resolveTool,
  runCommand,
  taskArgv,
} from "./helpers/sandbox";

// The child processes here start pnpm, vitest and friends, which can take far longer than the
// default 60 s file timeout on a cold cache (spec 001, C6).
describe("sandbox helpers", { timeout: 120_000 }, () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("runs the gate tools in the isolated environment", () => {
    const env = isolatedEnv();
    const commands: string[][] = [
      [resolveTool("node"), "-v"],
      [resolveTool("git"), "--version"],
      [resolveTool("gitleaks"), "version"],
      [resolveTool("lefthook"), "version"],
      [resolveTool("pnpm"), "exec", "vitest", "--version"],
    ];
    for (const argv of commands) {
      expectGateSuccess(runCommand(argv, { env }));
    }
  });

  it("does not pass parent GIT_*, GITLEAKS_*, LEFTHOOK*, or MISE_ENV to the child", () => {
    vi.stubEnv("GIT_DIR", "/nonexistent-git-dir");
    vi.stubEnv("GIT_INDEX_FILE", "/nonexistent-index");
    vi.stubEnv("GITLEAKS_CONFIG", "/nonexistent-gitleaks.toml");
    vi.stubEnv("LEFTHOOK", "0");
    vi.stubEnv("MISE_ENV", "node27");
    // process.execPath, not resolveTool("node"): with MISE_ENV=node27 stubbed, `mise which` would
    // resolve a different node.
    const result = runCommand([
      process.execPath,
      "-e",
      "process.stdout.write(JSON.stringify(Object.keys(process.env)))",
    ]);
    expectGateSuccess(result);
    const keys: string[] = JSON.parse(result.stdout);
    for (const forbidden of [
      "GIT_DIR",
      "GIT_INDEX_FILE",
      "GITLEAKS_CONFIG",
      "LEFTHOOK",
      "MISE_ENV",
    ]) {
      expect(keys).not.toContain(forbidden);
    }
    expect(keys).toContain("GIT_CONFIG_GLOBAL");
  });

  it("resolves git to an absolute path and explains the cause for an unknown tool", () => {
    const git = resolveTool("git");
    expect(isAbsolute(git)).toBe(true);
    expect(existsSync(git)).toBe(true);
    expect(() => resolveTool("no-such-tool")).toThrow(/not a known sandbox tool/);
  });

  it("rejects a missing command, a spawn error, a zero exit, and mismatched output", () => {
    const base: CommandResult = {
      argv: ["fake-tool"],
      status: 1,
      signal: null,
      stdout: "",
      stderr: "boom",
      spawnError: null,
    };
    expect(() => expectGateFailure({ ...base, status: 127 }, { output: "boom" })).toThrow();
    expect(() =>
      expectGateFailure({ ...base, status: null, spawnError: "ENOENT" }, { output: "boom" }),
    ).toThrow();
    expect(() => expectGateFailure({ ...base, status: 0 }, { output: "boom" })).toThrow();
    expect(() => expectGateFailure(base, { output: "other" })).toThrow();
    expect(() => expectGateFailure(base, { output: "boom" })).not.toThrow();
  });

  it("accepts a real non-zero exit whose output matches, and rejects a real 127", () => {
    const node = resolveTool("node");
    expectGateFailure(runCommand([node, "-e", "console.error('boom'); process.exit(3)"]), {
      output: "boom",
    });
    expect(() =>
      expectGateFailure(runCommand([node, "-e", "process.exit(127)"]), {
        output: "",
      }),
    ).toThrow();
  });

  it("turns colour off for nested runs whatever the parent terminal says", () => {
    // Measured on the developer's machine (research.md R-9): with TERM=xterm-256color and no FORCE_COLOR
    // or NO_COLOR, a nested Vitest still printed ANSI codes, which broke the output matchers.
    // NO_COLOR, FORCE_TTY=false and TERM=dumb each turned it off there.
    vi.stubEnv("TERM", "xterm-256color");
    vi.stubEnv("COLORTERM", "truecolor");
    vi.stubEnv("FORCE_TTY", "true");
    const nested = isolatedEnv({ nested: true });
    expect(nested.NO_COLOR).toBe("1");
    expect(nested.FORCE_TTY).toBe("false");
    expect(nested).not.toHaveProperty("FORCE_COLOR");
    // Not nested: the parent's terminal settings are left alone.
    const plain = isolatedEnv();
    expect(plain.TERM).toBe("xterm-256color");
    expect(plain).not.toHaveProperty("NO_COLOR", "1");
  });

  it("drops VITEST*, TEST, FORCE_COLOR, and NODE_ENV from the nested environment", () => {
    vi.stubEnv("VITEST_POOL_ID", "1");
    vi.stubEnv("VITEST_WORKER_ID", "1");
    vi.stubEnv("TEST", "true");
    vi.stubEnv("FORCE_COLOR", "1");
    vi.stubEnv("NODE_ENV", "production");
    const nested = Object.keys(isolatedEnv({ nested: true }));
    for (const forbidden of [
      "VITEST_POOL_ID",
      "VITEST_WORKER_ID",
      "TEST",
      "FORCE_COLOR",
      "NODE_ENV",
    ]) {
      expect(nested).not.toContain(forbidden);
    }
  });

  it("replaces --config, --grep and --reporter so that each flag appears exactly once", () => {
    const argv = [
      "/bin/vitest",
      "run",
      "--config",
      "a.ts",
      "--grep",
      "old",
      "--reporter=dot",
      "--grep=older",
    ];
    const edited = editArgv(argv, {
      config: "b.ts",
      grep: "@smoke",
      reporter: "list",
    });
    expect(flagValues(edited, "--config")).toEqual(["b.ts"]);
    expect(flagValues(edited, "--grep")).toEqual(["@smoke"]);
    expect(flagValues(edited, "--reporter")).toEqual(["list"]);
    expect(edited.filter((token) => token === "run")).toHaveLength(1);
  });

  it("appends --config and --reporter when the argv has none", () => {
    const argv = ["pnpm", "exec", "playwright", "test", "--grep", "@smoke"];
    const edited = editArgv(argv, {
      config: "tests/fixtures/gate/e2e/playwright.fixture.config.ts",
      reporter: "list",
    });
    expect(flagValues(edited, "--config")).toEqual([
      "tests/fixtures/gate/e2e/playwright.fixture.config.ts",
    ]);
    expect(flagValues(edited, "--reporter")).toEqual(["list"]);
    expect(flagValues(edited, "--grep")).toEqual(["@smoke"]);
  });

  it("edits the real e2e task argv so that --config and --grep appear exactly once (6)", () => {
    const argv = taskArgv("e2e");
    expect(flagValues(argv, "--grep")).toEqual(["@smoke"]);
    expect(flagValues(argv, "--config")).toEqual([]);
    const edited = editArgv(argv, {
      config: "tests/fixtures/gate/e2e/playwright.fixture.config.ts",
    });
    expect(flagValues(edited, "--config")).toEqual([
      "tests/fixtures/gate/e2e/playwright.fixture.config.ts",
    ]);
    expect(flagValues(edited, "--grep")).toEqual(["@smoke"]);
    const regrepped = editArgv(edited, { grep: "@other" });
    expect(flagValues(regrepped, "--grep")).toEqual(["@other"]);
    expect(flagValues(regrepped, "--config")).toHaveLength(1);
  });

  it("creates a temporary git repository in a directory outside the working tree", () => {
    const dir = createTempGitRepo();
    expect(statSync(dir).isDirectory()).toBe(true);
    expect(existsSync(join(dir, ".git"))).toBe(true);
  });
});

/** Values of a flag in an argv, accepting both `--flag value` and `--flag=value`. */
function flagValues(argv: readonly string[], flag: string): string[] {
  const values: string[] = [];
  argv.forEach((token, index) => {
    if (token === flag) {
      const next = argv[index + 1];
      if (next !== undefined) values.push(next);
    } else if (token.startsWith(`${flag}=`)) {
      values.push(token.slice(flag.length + 1));
    }
  });
  return values;
}
