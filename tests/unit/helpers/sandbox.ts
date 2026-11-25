import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { expect, onTestFinished } from "vitest";

/**
 * Helpers for tests that run real tools (mise, git, gitleaks, lefthook, pnpm, vitest, biome, tsc)
 * in child processes. Spec 001, C6 / C12: every child gets a controlled environment, tools are
 * resolved to absolute paths, and "the gate refused" is distinguished from "the tool is missing".
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..", "..");

/** Tools that mise manages (declared in mise.toml). Resolved with `mise which` from the repo root. */
const MISE_TOOLS = new Set(["node", "pnpm", "gitleaks", "lefthook", "osv-scanner"]);

/** Tools that are not in mise.toml. Found on the parent PATH. */
const PATH_TOOLS = new Set(["git", "mise"]);

/** node_modules binaries. Shebang scripts, so they need `node` on PATH (see I-16). */
const NODE_MODULE_TOOLS = new Set(["biome", "tsc", "vitest", "playwright"]);

export const KNOWN_TOOLS: ReadonlySet<string> = new Set([
  ...MISE_TOOLS,
  ...PATH_TOOLS,
  ...NODE_MODULE_TOOLS,
]);

export interface CommandResult {
  readonly argv: readonly string[];
  readonly status: number | null;
  readonly signal: string | null;
  readonly stdout: string;
  readonly stderr: string;
  /** `spawnSync`'s error code (e.g. "ENOENT") when the process could not start; otherwise null. */
  readonly spawnError: string | null;
}

export interface IsolatedEnvOptions {
  /** Replaces the computed PATH directory list; `/usr/bin:/bin` is still appended. */
  readonly pathDirs?: readonly string[];
  /** Nested Vitest / Playwright runs: also drop VITEST*, TEST, FORCE_COLOR and NODE_ENV. */
  readonly nested?: boolean;
}

const FAKE_IDENTITY = {
  GIT_AUTHOR_NAME: "Sandbox Test",
  GIT_AUTHOR_EMAIL: "sandbox@test.invalid",
  GIT_COMMITTER_NAME: "Sandbox Test",
  GIT_COMMITTER_EMAIL: "sandbox@test.invalid",
} as const;

/**
 * Resolves a tool to an absolute path.
 * - mise-managed tools: `mise which` from the repo root (one call per tool, cached).
 * - git / mise: first match on the parent PATH.
 * - node_modules binaries: `<repo>/node_modules/.bin/<name>`.
 * Throws with the cause when nothing is found; never skips.
 */
export function resolveTool(name: string): string {
  if (!KNOWN_TOOLS.has(name)) {
    throw new Error(`resolveTool: "${name}" is not a known sandbox tool (add it to sandbox.ts)`);
  }
  const cached = resolvedCache.get(name);
  if (cached !== undefined) return cached;

  let path: string | undefined;
  if (MISE_TOOLS.has(name)) {
    path = miseWhich(name);
  } else if (PATH_TOOLS.has(name)) {
    path = findOnParentPath(name);
  } else {
    const bin = join(REPO_ROOT, "node_modules", ".bin", name);
    path = existsSync(bin) ? bin : undefined;
  }
  if (path === undefined) {
    throw new Error(
      `resolveTool: could not find "${name}". ` +
        (MISE_TOOLS.has(name)
          ? "Run `mise trust && mise install` in the repo root."
          : NODE_MODULE_TOOLS.has(name)
            ? "Run `pnpm install --frozen-lockfile` in the repo root."
            : `Install it and make sure it is on PATH.`),
    );
  }
  resolvedCache.set(name, path);
  return path;
}

const resolvedCache = new Map<string, string>();

function miseWhich(name: string): string | undefined {
  const result = spawnSync("mise", ["which", name], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: { ...process.env },
  });
  if (result.status !== 0) return undefined;
  const path = result.stdout.trim();
  return path.length > 0 && isAbsolute(path) && existsSync(path) ? path : undefined;
}

function findOnParentPath(name: string): string | undefined {
  for (const dir of (process.env.PATH ?? "").split(delimiter)) {
    if (dir.length === 0) continue;
    const candidate = join(dir, name);
    if (existsSync(candidate)) return candidate;
  }
  return undefined;
}

/**
 * The environment for a child process.
 * Parent variables are inherited except GIT_*, GITLEAKS_*, LEFTHOOK*, MISE_ENV (and, when nested,
 * VITEST*, TEST, FORCE_COLOR, NODE_ENV). Git is pinned to a fixed identity and no global config.
 */
export function isolatedEnv(options: IsolatedEnvOptions = {}): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (value === undefined) continue;
    if (isExcluded(key, options.nested === true)) continue;
    env[key] = value;
  }
  env.GIT_CONFIG_GLOBAL = "/dev/null";
  env.GIT_CONFIG_NOSYSTEM = "1";
  Object.assign(env, FAKE_IDENTITY);
  env.PATH = buildPath(options.pathDirs);
  if (options.nested === true) {
    // The output of nested runs is matched against plain text such as "Test Files  1 failed (1)".
    // Not setting any colour variable is not enough: on the developer's machine a nested Vitest
    // coloured its output from TERM alone (research.md R-9). NO_COLOR is the documented switch, and
    // FORCE_TTY=false is the one Vitest's own colour check reads.
    env.NO_COLOR = "1";
    env.FORCE_TTY = "false";
  }
  return env;
}

function isExcluded(key: string, nested: boolean): boolean {
  if (key.startsWith("GIT_") || key.startsWith("GITLEAKS_") || key.startsWith("LEFTHOOK"))
    return true;
  if (key === "MISE_ENV") return true;
  if (
    nested &&
    (key.startsWith("VITEST") || key === "TEST" || key === "FORCE_COLOR" || key === "NODE_ENV")
  ) {
    return true;
  }
  return false;
}

/**
 * PATH order: dirname(process.execPath) (so `node` is found from shebang scripts), the directories of
 * the resolved pnpm / gitleaks / lefthook / git / mise, then /usr/bin and /bin. Duplicates removed.
 * `pathDirs` replaces the computed list (still followed by /usr/bin:/bin).
 */
function buildPath(pathDirs: readonly string[] | undefined): string {
  const dirs =
    pathDirs !== undefined
      ? [...pathDirs]
      : [
          dirname(process.execPath),
          ...["pnpm", "gitleaks", "lefthook", "git", "mise"].map((tool) =>
            dirname(resolveTool(tool)),
          ),
        ];
  dirs.push("/usr/bin", "/bin");
  return [...new Set(dirs)].join(delimiter);
}

/**
 * Edits an argv (token array) in place of string concatenation (spec 001, C12 "入れ子実行の argv").
 * - `config` and `reporter`: replace the value, or append the flag when it is absent (the real `e2e`
 *   argv has neither; the reporter normally comes from the config file).
 * - `grep`: replace the value only; it is never added.
 * An existing flag is never duplicated (Playwright takes the last value, which would hide which one
 * wins), so afterwards each edited flag appears exactly once.
 */
export function editArgv(
  argv: readonly string[],
  edits: {
    readonly config?: string;
    readonly grep?: string;
    readonly reporter?: string;
  },
): string[] {
  let out = [...argv];
  if (edits.config !== undefined) out = setFlag(out, "--config", edits.config, { append: true });
  if (edits.grep !== undefined) out = setFlag(out, "--grep", edits.grep, { append: false });
  if (edits.reporter !== undefined)
    out = setFlag(out, "--reporter", edits.reporter, { append: true });
  return out;
}

/**
 * Sets a flag to one value. Removes every existing occurrence (`--flag v`, `--flag=v`), then places
 * the flag once: at the old first position when it existed, or at the end when `append` is set.
 * A flag that is absent and not `append` is not added (there is nothing to replace).
 */
function setFlag(
  argv: readonly string[],
  flag: string,
  value: string,
  options: { readonly append: boolean },
): string[] {
  const out: string[] = [];
  let firstIndex: number | undefined;
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i] as string;
    if (token === flag) {
      if (firstIndex === undefined) firstIndex = out.length;
      i++; // skip the value token
      continue;
    }
    if (token.startsWith(`${flag}=`)) {
      if (firstIndex === undefined) firstIndex = out.length;
      continue;
    }
    out.push(token);
  }
  if (firstIndex !== undefined) {
    out.splice(firstIndex, 0, flag, value);
  } else if (options.append) {
    out.push(flag, value);
  }
  return out;
}

/**
 * Resolves the `env` option of runCommand into what `spawnSync` accepts.
 *
 * The type assertion is needed because Next.js augments `NodeJS.ProcessEnv` to require `NODE_ENV`,
 * while a child environment may deliberately omit it (nested runs drop NODE_ENV, see isolatedEnv).
 * At runtime `spawnSync` accepts any string map, so the assertion does not hide a real mismatch.
 */
function childEnv(env: Record<string, string> | "inherit" | undefined): NodeJS.ProcessEnv {
  if (env === "inherit") return process.env;
  return (env ?? isolatedEnv()) as NodeJS.ProcessEnv;
}

/** Runs a command without a shell. The default environment is isolatedEnv(); pass "inherit" for the parent's. */
export function runCommand(
  argv: readonly string[],
  options: {
    readonly cwd?: string;
    readonly env?: Record<string, string> | "inherit";
    readonly timeoutMs?: number;
  } = {},
): CommandResult {
  const [command, ...args] = argv;
  if (command === undefined) throw new Error("runCommand: empty argv");
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? REPO_ROOT,
    encoding: "utf8",
    env: childEnv(options.env),
    timeout: options.timeoutMs ?? 30_000,
    maxBuffer: 64 * 1024 * 1024,
  });
  return {
    argv,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    spawnError: result.error ? ((result.error as NodeJS.ErrnoException).code ?? "UNKNOWN") : null,
  };
}

/**
 * Asserts that the gate refused: status is a number other than 0, no spawn error, status is neither
 * 126 nor 127 (not executable / not found), and the combined output matches `output`.
 */
export function expectGateFailure(
  result: CommandResult,
  options: { readonly output: string | RegExp },
): void {
  const combined = `${result.stdout}${result.stderr}`;
  const label = result.argv.join(" ");
  expect(result.spawnError, `${label}: spawn error`).toBeNull();
  expect(typeof result.status, `${label}: status should be a number`).toBe("number");
  expect(result.status, `${label}: status should be non-zero`).not.toBe(0);
  expect(
    [126, 127],
    `${label}: status ${result.status} means not executable / not found`,
  ).not.toContain(result.status);
  if (typeof options.output === "string") {
    expect(combined, `${label}: output`).toContain(options.output);
  } else {
    expect(combined, `${label}: output`).toMatch(options.output);
  }
}

/** Asserts that the command ran and exited 0 without a spawn error. */
export function expectGateSuccess(result: CommandResult): void {
  const label = result.argv.join(" ");
  expect(result.spawnError, `${label}: spawn error`).toBeNull();
  expect(result.status, `${label}: status (stderr: ${result.stderr.slice(0, 500)})`).toBe(0);
}

/**
 * Creates an empty git repository in a new temporary directory. The directory is removed when the
 * test finishes, whether it passed or failed (spec 001, 8.8).
 */
export function createTempGitRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "genai-lab-test-"));
  onTestFinished(() => {
    rmSync(dir, { recursive: true, force: true });
  });
  const init = runCommand([resolveTool("git"), "init", "--quiet", dir]);
  expectGateSuccess(init);
  return dir;
}

export type MiseRunEntry = string | { readonly task: string };

function isRunEntry(value: unknown): value is MiseRunEntry {
  if (typeof value === "string") return true;
  return (
    typeof value === "object" &&
    value !== null &&
    "task" in value &&
    typeof (value as { task: unknown }).task === "string"
  );
}

/**
 * The `run` entries of a mise task, read from `mise tasks ls --json`. A single-string `run` also
 * comes back as an array (research.md I-16). Throws when the task does not exist.
 */
export function taskRun(name: string): MiseRunEntry[] {
  const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
  if (result.status !== 0) {
    throw new Error(`mise tasks ls failed: ${result.stderr}`);
  }
  const tasks: unknown = JSON.parse(result.stdout);
  if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
  for (const task of tasks) {
    if (typeof task !== "object" || task === null) continue;
    const record = task as { name?: unknown; run?: unknown };
    if (record.name !== name) continue;
    if (!Array.isArray(record.run) || !record.run.every(isRunEntry)) {
      throw new Error(`task "${name}": unexpected run shape ${JSON.stringify(record.run)}`);
    }
    return record.run;
  }
  throw new Error(`mise task "${name}" does not exist`);
}

/** The single command of a task as an argv, with the program resolved to an absolute path. */
export function taskArgv(name: string): string[] {
  const run = taskRun(name);
  const [first, ...rest] = run;
  if (first === undefined || rest.length > 0 || typeof first !== "string") {
    throw new Error(`task "${name}" must be a single command, got ${JSON.stringify(run)}`);
  }
  const [program, ...args] = first.split(/\s+/);
  if (program === undefined) throw new Error(`task "${name}" is empty`);
  return [resolveTool(program), ...args];
}
