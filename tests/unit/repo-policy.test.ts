import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { expectGateSuccess, isolatedEnv, resolveTool, runCommand } from "./helpers/sandbox";

/**
 * Static rules of the repository (spec 001, C12 "repo-policy"). Values are read from tool output or
 * parsed files, and no version number is used as an expected value (9.9).
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** An exact version: `1.2.3` or `1.2.3-canary.4`. Ranges and dist-tags do not match. */
const EXACT_VERSION = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

function readJson(path: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(readText(path));
  if (!isRecord(parsed)) throw new Error(`${path}: expected a JSON object`);
  return parsed;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== "string") throw new Error(`expected a string at "${key}"`);
  return value;
}

/** Lines of a YAML file without comments and blank lines (the files are read line by line). */
function yamlLines(path: string): string[] {
  return readText(path)
    .split("\n")
    .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
}

/** The indented lines under a top-level YAML key, trimmed. */
function yamlBlock(lines: readonly string[], key: string): string[] {
  const start = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (start === -1) return [];
  const block: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (!/^\s/.test(line)) break;
    block.push(line.trim());
  }
  return block;
}

interface MiseTool {
  readonly version: string;
  readonly requestedVersion: string;
  readonly sourcePath: string;
}

/**
 * Tools from `mise ls --current --json`, limited to those declared in this repository's own mise files.
 * `lane` selects the environment: the default lane runs without MISE_ENV (isolatedEnv drops it), and the
 * node27 lane sets MISE_ENV=node27 explicitly, the way the CI verify-node27 job does.
 */
function repoMiseTools(lane: "default" | "node27" = "default"): Map<string, MiseTool[]> {
  const env = isolatedEnv();
  if (lane === "node27") env.MISE_ENV = "node27";
  const result = runCommand([resolveTool("mise"), "ls", "--current", "--json"], {
    cwd: REPO_ROOT,
    env,
  });
  expectGateSuccess(result);
  const parsed: unknown = JSON.parse(result.stdout);
  if (!isRecord(parsed)) throw new Error("mise ls --json: expected an object keyed by tool name");
  const tools = new Map<string, MiseTool[]>();
  for (const [name, entries] of Object.entries(parsed)) {
    if (!Array.isArray(entries)) continue;
    for (const entry of entries) {
      if (!isRecord(entry) || !isRecord(entry.source)) continue;
      const sourcePath = entry.source.path;
      if (typeof sourcePath !== "string" || !sourcePath.startsWith(`${REPO_ROOT}/`)) continue;
      const list = tools.get(name) ?? [];
      list.push({
        version: String(entry.version),
        requestedVersion: String(entry.requested_version),
        sourcePath,
      });
      tools.set(name, list);
    }
  }
  return tools;
}

/** Runs `git` in the repository and returns stdout. */
function git(args: readonly string[]) {
  return runCommand([resolveTool("git"), ...args], { cwd: REPO_ROOT });
}

// Child processes run mise, git and tsc (spec 001, C6).
describe("repo policy", { timeout: 120_000 }, () => {
  describe("versions and supply chain", () => {
    it("pins every dependency in package.json to an exact version (1.2)", () => {
      const pkg = readJson("package.json");
      for (const field of ["dependencies", "devDependencies"]) {
        const deps = pkg[field];
        if (!isRecord(deps)) throw new Error(`package.json: "${field}" is missing`);
        for (const [name, version] of Object.entries(deps)) {
          expect(version, `${field}.${name}`).toMatch(EXACT_VERSION);
        }
      }
    });

    it("pins the five tools in mise.toml to exact versions (1.1)", () => {
      const tools = repoMiseTools();
      for (const name of ["node", "pnpm", "lefthook", "gitleaks", "osv-scanner"]) {
        const entries = tools.get(name) ?? [];
        expect(entries, `${name} must come from this repository's mise config`).not.toHaveLength(0);
        for (const entry of entries) {
          expect(entry.requestedVersion, `${name} requested version`).toMatch(EXACT_VERSION);
        }
      }
    });

    it("pins node to an exact Node 27 version in the node27 lane, from mise.node27.toml (1.1, 11.1)", () => {
      const node = repoMiseTools("node27").get("node") ?? [];
      expect(node, "node must come from this repository's mise config").toHaveLength(1);
      expect(node[0]?.sourcePath).toBe(join(REPO_ROOT, "mise.node27.toml"));
      expect(node[0]?.requestedVersion).toMatch(EXACT_VERSION);
      expect(node[0]?.requestedVersion).toMatch(/^27\./);
    });

    it("changes only node between the two lanes; every other tool keeps its mise.toml version (11.1)", () => {
      const lanes = { default: repoMiseTools("default"), node27: repoMiseTools("node27") };
      for (const name of ["pnpm", "lefthook", "gitleaks", "osv-scanner"]) {
        const inDefault = lanes.default.get(name)?.[0];
        const inNode27 = lanes.node27.get(name)?.[0];
        expect(inNode27?.requestedVersion, `${name} in the node27 lane`).toBe(
          inDefault?.requestedVersion,
        );
        expect(inNode27?.sourcePath, `${name} in the node27 lane`).toBe(
          join(REPO_ROOT, "mise.toml"),
        );
      }
      expect(lanes.node27.get("node")?.[0]?.requestedVersion).not.toBe(
        lanes.default.get("node")?.[0]?.requestedVersion,
      );
    });

    it("declares nothing but node in mise.node27.toml (11.1)", () => {
      const lines = readText("mise.node27.toml")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line !== "" && !line.startsWith("#"));
      expect(lines[0]).toBe("[tools]");
      expect(
        lines.filter((line) => !line.startsWith("[")).map((line) => line.split("=")[0]?.trim()),
      ).toEqual(["node"]);
    });

    it("keeps the 24h release-age gate and the install-script gates explicit (1.4, 1.5)", () => {
      const lines = yamlLines("pnpm-workspace.yaml");
      expect(lines).toContain("minimumReleaseAge: 1440");
      expect(lines).toContain("minimumReleaseAgeStrict: true");
      expect(lines).toContain("strictDepBuilds: true");
      expect(lines.some((line) => line.startsWith("minimumReleaseAgeExclude"))).toBe(false);
    });

    it("does not allow the install script of sharp (1.5)", () => {
      const allowBuilds = yamlBlock(yamlLines("pnpm-workspace.yaml"), "allowBuilds");
      expect(allowBuilds).toContain("sharp: false");
      expect(allowBuilds).not.toContain("sharp: true");
    });

    it("refuses the agent skill that the `ai` package ships (spec 002, ADR-9)", () => {
      // Instructions bundled by a dependency are third-party input; the repository's own agent guidance
      // lives in AGENTS.md. `pnpm approve '!ai'` writes `permissions: { ai: { skills: false } }`.
      const permissions = yamlBlock(yamlLines("pnpm-workspace.yaml"), "permissions");
      const start = permissions.indexOf("ai:");
      expect(start, "permissions must have an `ai` entry").toBeGreaterThanOrEqual(0);
      const entry: string[] = [];
      for (const line of permissions.slice(start + 1)) {
        // yamlBlock trims lines, so the next sibling key is the first line that is not `skills:`.
        if (!line.startsWith("skills:")) break;
        entry.push(line);
      }
      expect(entry).toEqual(["skills: false"]);
    });

    it("uses the same pnpm version in package.json packageManager and in mise (1.6)", () => {
      const packageManager = stringField(readJson("package.json"), "packageManager");
      const pnpm = repoMiseTools().get("pnpm") ?? [];
      expect(pnpm, "pnpm must come from this repository's mise config").toHaveLength(1);
      expect(packageManager).toBe(`pnpm@${pnpm[0]?.version}`);
    });
  });

  describe("lint, format and type settings", () => {
    it("has no ESLint or Prettier configuration at the root (2.1)", () => {
      const result = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
      expectGateSuccess(result);
      const rootFiles = result.stdout
        .split("\0")
        .filter((file) => file !== "" && !file.includes("/"));
      const offenders = rootFiles.filter((file) => /^(\.?eslint|\.?prettier)/i.test(file));
      expect(offenders).toEqual([]);
      const pkg = readJson("package.json");
      expect(pkg.eslintConfig).toBeUndefined();
      expect(pkg.prettier).toBeUndefined();
    });

    it("sets the three Biome rules to error (2.2)", () => {
      const biome = readJson("biome.json");
      const linter = biome.linter;
      if (!isRecord(linter) || !isRecord(linter.rules)) throw new Error("biome.json: linter.rules");
      const { correctness, suspicious } = linter.rules;
      if (!isRecord(correctness) || !isRecord(suspicious))
        throw new Error("biome.json: rule groups");
      expect(correctness.noUnusedVariables).toBe("error");
      expect(correctness.noUnusedImports).toBe("error");
      expect(suspicious.noExplicitAny).toBe("error");
    });

    it("enables TypeScript strict mode (2.3)", () => {
      const result = runCommand([resolveTool("tsc"), "--showConfig"], { cwd: REPO_ROOT });
      expectGateSuccess(result);
      const config: unknown = JSON.parse(result.stdout);
      if (!isRecord(config) || !isRecord(config.compilerOptions)) {
        throw new Error("tsc --showConfig: compilerOptions is missing");
      }
      expect(config.compilerOptions.strict).toBe(true);
    });
  });

  describe("layout", () => {
    it("keeps *.test.ts and *.spec.ts only under tests/unit and tests/e2e (9.8)", () => {
      const result = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
      expectGateSuccess(result);
      const files = result.stdout.split("\0").filter((file) => file !== "");
      expect(files.length, "git must list the repository files").toBeGreaterThan(0);
      const testFiles = files.filter((file) => /\.(test|spec)\.[cm]?[jt]sx?$/.test(file));
      expect(testFiles.length, "the repository already has unit tests").toBeGreaterThan(0);
      const misplaced = testFiles.filter(
        (file) => !file.startsWith("tests/unit/") && !file.startsWith("tests/e2e/"),
      );
      expect(misplaced).toEqual([]);
    });
  });

  describe("CI workflows", () => {
    /** Every workflow file under .github/workflows, as text. */
    function workflows(): Array<{ path: string; text: string }> {
      const result = git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"]);
      expectGateSuccess(result);
      return result.stdout
        .split("\0")
        .filter((file) => /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file))
        .map((path) => ({ path, text: readText(path) }));
    }

    it("has at least one workflow to check", () => {
      expect(workflows().length).toBeGreaterThan(0);
    });

    it("pins every `uses:` to a 40-character commit SHA (10.8)", () => {
      for (const { path, text } of workflows()) {
        const uses = [...text.matchAll(/^\s*(?:-\s*)?uses:\s*(\S+)/gm)].map(
          (match) => match[1] ?? "",
        );
        expect(uses.length, `${path} should use at least one action`).toBeGreaterThan(0);
        for (const reference of uses) {
          expect(reference, `${path}: ${reference}`).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
        }
      }
    });

    it("refers to no secret other than GITHUB_TOKEN, so no AI provider key reaches CI (10.10)", () => {
      for (const { path, text } of workflows()) {
        const secrets = [...text.matchAll(/secrets\.([A-Za-z0-9_]+)/g)].map((match) => match[1]);
        for (const secret of secrets) {
          expect(secret, `${path} refers to secrets.${secret}`).toBe("GITHUB_TOKEN");
        }
      }
    });
  });

  describe("Dependabot", () => {
    /**
     * The `updates:` entries of .github/dependabot.yml, each as its own block of text. Read line by line:
     * the plan declares no YAML library.
     */
    function updateEntries(): string[] {
      const lines = readText(".github/dependabot.yml").split("\n");
      const start = lines.findIndex((line) => /^updates:\s*$/.test(line));
      if (start === -1) return [];
      const entries: string[][] = [];
      for (const line of lines.slice(start + 1)) {
        if (/^\S/.test(line)) break;
        if (/^ {2}- /.test(line)) entries.push([line]);
        else entries.at(-1)?.push(line);
      }
      return entries.map((entry) => entry.join("\n"));
    }

    function entryFor(ecosystem: string): string {
      const entry = updateEntries().find((text) =>
        new RegExp(`package-ecosystem:\\s*"?${ecosystem}"?\\s*$`, "m").test(text),
      );
      if (entry === undefined) throw new Error(`dependabot.yml has no "${ecosystem}" entry`);
      return entry;
    }

    it("declares version 2 and exactly the npm and github-actions ecosystems (10.11)", () => {
      expect(readText(".github/dependabot.yml")).toMatch(/^version: 2\s*$/m);
      const ecosystems = updateEntries().map(
        (text) => /package-ecosystem:\s*"?([\w-]+)"?/.exec(text)?.[1],
      );
      expect(ecosystems.sort()).toEqual(["github-actions", "npm"]);
    });

    it.each(["npm", "github-actions"])("checks %s weekly at the repository root (10.11)", (eco) => {
      const entry = entryFor(eco);
      expect(entry).toMatch(/^\s+directory:\s*"\/"\s*$/m);
      expect(entry).toMatch(/^\s+schedule:\s*\n\s+interval:\s*"?weekly"?\s*$/m);
    });

    it.each(["npm", "github-actions"])(
      "waits at least a day after a release before proposing it for %s (10.12)",
      (eco) => {
        const match = /^\s+cooldown:\s*\n\s+default-days:\s*(\d+)\s*$/m.exec(entryFor(eco));
        expect(match, `${eco} needs cooldown.default-days`).not.toBeNull();
        expect(Number(match?.[1])).toBeGreaterThanOrEqual(1);
      },
    );

    it.each(["npm", "github-actions"])(
      "writes commits as `build(deps):`, as the repository's version bumps require (%s)",
      (eco) => {
        const entry = entryFor(eco);
        expect(entry).toMatch(
          /^\s+commit-message:\s*\n\s+prefix:\s*"build"\s*\n\s+include:\s*"scope"\s*$/m,
        );
      },
    );

    it("groups all npm updates into one weekly pull request", () => {
      expect(entryFor("npm")).toMatch(
        /^\s+groups:\s*\n\s+npm:\s*\n\s+patterns:\s*\n\s+- "\*"\s*$/m,
      );
    });

    it("does not propose TypeScript nightly (-dev) builds (R-7)", () => {
      // Checks the channel, not a version number: the range must start at a -dev build and stop before an rc.
      expect(entryFor("npm")).toMatch(
        /^\s+ignore:\s*\n\s+- dependency-name:\s*"typescript"\s*\n\s+versions:\s*\[">= [\d.]+-dev, < [\d.]+-rc"\]\s*$/m,
      );
    });
  });

  describe("Next.js configuration", () => {
    const config = () => readText("next.config.ts");

    it("keeps Partial Prefetching off globally while routes adopt it one at a time", () => {
      // The migration guide's incremental path: the global flag stays false, and each ready route
      // exports `prefetch = 'partial'`. Setting it explicitly also silences the startup warning.
      expect(config()).toMatch(/^\s*cacheComponents:\s*true,/m);
      expect(config()).toMatch(/^\s*partialPrefetching:\s*false,/m);
    });

    it("stops next dev from rewriting AGENTS.md, whose guidance is kept by hand", () => {
      // Both options default to on, and next dev re-adds their managed blocks on every start.
      expect(config()).toMatch(/^\s*agentRules:\s*false,/m);
      expect(config()).toMatch(/^\s*agentUpgrade:\s*false,/m);
    });

    it("keeps no managed Next.js block in AGENTS.md", () => {
      expect(readText("AGENTS.md")).not.toMatch(/<!-- (BEGIN|END):nextjs-agent-/);
    });

    it("keeps the guidance of the removed block in AGENTS.md: read the bundled docs first", () => {
      const agents = readText("AGENTS.md");
      expect(agents).toContain("node_modules/next/dist/docs/");
    });
  });

  describe("placeholder page", () => {
    const pages = ["src/app/page.tsx", "src/app/layout.tsx"];

    it.each(pages)("%s is a Server Component with no client directive (9.2)", (path) => {
      expect(readText(path)).not.toMatch(/^\s*["']use client["']/m);
    });

    it.each(pages)("%s does not call AI or read the environment (9.1)", (path) => {
      const source = readText(path);
      expect(source).not.toContain("process.env");
      expect(source).not.toMatch(/from\s+["'](ai|@ai-sdk\/[^"']*)["']/);
    });
  });

  describe("secret files", () => {
    it("has an .env.example that holds variable names only (13.5)", () => {
      const lines = readText(".env.example")
        .split("\n")
        .filter((line) => line.trim() !== "" && !line.trim().startsWith("#"));
      expect(lines.length, ".env.example should list variable names").toBeGreaterThan(0);
      for (const line of lines) {
        expect(line, "each line must be NAME= with no value").toMatch(/^[A-Z][A-Z0-9_]*=$/);
      }
    });

    it.each([
      ".env",
      ".env.local",
      ".env.production.local",
      ".next/",
      "test-results/",
      "playwright-report/",
      "lefthook-local.yml",
      ".lefthook-local.yml",
      "next-env.d.ts",
      "mise.local.toml",
      "mise.node27.local.toml",
      ".vitest/",
      ".build/",
    ])("git ignores %s (13.6)", (path) => {
      expectGateSuccess(git(["check-ignore", "-q", "--", path]));
    });

    it("does not ignore .env.example, which must stay tracked (13.5, 13.6)", () => {
      const result = git(["check-ignore", "-q", "--", ".env.example"]);
      expect(result.spawnError).toBeNull();
      expect(result.status, "git check-ignore exits 1 when the path is not ignored").toBe(1);
    });
  });
});
