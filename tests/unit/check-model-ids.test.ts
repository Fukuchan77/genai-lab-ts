import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it, onTestFinished } from "vitest";
import { MODEL_ALLOWLIST, PROVIDERS } from "@/lib/ai/model-allowlist";
import {
  createTempGitRepo,
  expectGateFailure,
  expectGateSuccess,
  resolveTool,
  runCommand,
} from "./helpers/sandbox";

describe("model allowlist shape (6.1)", () => {
  it("lists exactly the four providers", () => {
    expect([...PROVIDERS].sort()).toEqual(["anthropic", "google", "ollama", "openai"]);
  });

  it("has at least one non-empty model ID per provider", () => {
    for (const provider of PROVIDERS) {
      const ids = MODEL_ALLOWLIST[provider];
      expect(ids.length, `${provider} needs at least one model ID`).toBeGreaterThan(0);
      for (const id of ids) {
        expect(id.trim(), `${provider}: empty or blank ID`).not.toBe("");
        expect(id, `${provider}: IDs must not contain whitespace`).not.toMatch(/\s/);
      }
    }
  });

  it("has no duplicate IDs across providers", () => {
    const all = PROVIDERS.flatMap((provider) => [...MODEL_ALLOWLIST[provider]]);
    expect(new Set(all).size).toBe(all.length);
  });
});

// ---------------------------------------------------------------------------------------------
// check:model-ids (spec 001, C8 / 6.3-6.7 / 9.4).
//
// Every model ID used as test input is built at run time (from the allowlist, or by joining parts),
// so this file contains no literal that the check would flag in itself.
// ---------------------------------------------------------------------------------------------

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const SCRIPT = join(REPO_ROOT, "scripts", "check-model-ids.mjs");
const ALLOWLIST_FILE = "src/lib/ai/model-allowlist.ts";
const KNOWN_ID = MODEL_ALLOWLIST.anthropic[0];

const join_ = (...parts: string[]): string => parts.join("");

function cli(args: readonly string[]) {
  return runCommand([resolveTool("node"), SCRIPT, ...args]);
}

function write(dir: string, path: string, content: string | Buffer): void {
  const full = join(dir, path);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content);
}

/** A temporary git repository with the real allowlist and the given files (nothing is staged). */
function repoWith(files: Readonly<Record<string, string>>, options: { allowlist?: boolean } = {}) {
  const dir = createTempGitRepo();
  if (options.allowlist !== false) {
    mkdirSync(dirname(join(dir, ALLOWLIST_FILE)), { recursive: true });
    copyFileSync(join(REPO_ROOT, ALLOWLIST_FILE), join(dir, ALLOWLIST_FILE));
  }
  for (const [path, content] of Object.entries(files)) write(dir, path, content);
  return dir;
}

function expectFindings(result: ReturnType<typeof cli>, pattern: string | RegExp): void {
  expectGateFailure(result, { output: pattern });
  expect(result.status, "findings exit with 1").toBe(1);
}

function expectNoFindings(result: ReturnType<typeof cli>, scanned?: number): void {
  expectGateSuccess(result);
  const match = /scanned (\d+) files, 0 findings/.exec(result.stdout);
  expect(match, `stdout should report the scan: ${result.stdout}`).not.toBeNull();
  if (scanned !== undefined) expect(Number(match?.[1])).toBe(scanned);
}

function expectUsageOrEnvironmentError(result: ReturnType<typeof cli>, output: string | RegExp) {
  expectGateFailure(result, { output });
  expect(result.status, "usage and environment errors exit with 2").toBe(2);
}

describe("check:model-ids", { timeout: 120_000 }, () => {
  describe("clean input (6.7, 9.4)", () => {
    it("exits 0 and reports how many files were scanned", () => {
      const dir = repoWith({
        "src/clean.ts": "export const answer = 42;\n",
        "README.md": "# Title\n",
        "docs/note.md": "No model names here.\n",
      });
      expectNoFindings(cli(["--root", dir]), 3);
    });
  });

  describe("an allowlisted ID in each kind of scan target (6.3, 6.5)", () => {
    const TARGETS = [
      "src/feature.ts",
      "scripts/tool.mjs",
      "tests/unit/example.test.ts",
      "vitest.extra.config.ts",
      "package.json",
      "docs/guide.md",
      "README.md",
      ".github/workflows/ci.yml",
      ".env.example",
    ];

    it.each(TARGETS)("is reported with path:line:column in %s", (target) => {
      // package.json has to stay valid JSON: Node reads it when it imports the allowlist.
      const prefix = target === "package.json" ? '{\n  "model": "' : 'const model = "';
      const content =
        target === "package.json"
          ? `${prefix}${KNOWN_ID}"\n}\n`
          : `first line\n${prefix}${KNOWN_ID}";\n`;
      const line = target === "package.json" ? 2 : 2;
      const dir = repoWith({ [target]: content });
      const column = (target === "package.json" ? '  "model": "' : prefix).length + 1;
      expectFindings(cli(["--root", dir]), `${target}:${line}:${column}: ${KNOWN_ID} (allowlist)`);
    });

    it("finds an ID inside Japanese text", () => {
      const lead = "日本語の説明: ";
      const dir = repoWith({ "docs/ja.md": `${lead}${KNOWN_ID} を使う\n` });
      expectFindings(
        cli(["--root", dir]),
        `docs/ja.md:1:${lead.length + 1}: ${KNOWN_ID} (allowlist)`,
      );
    });

    it("does not flag an ID that is only the tail of a longer hyphenated word", () => {
      // \b would match here because `-` is a word boundary; the token-aware boundary does not.
      const dir = repoWith({ "docs/tail.md": `my-${KNOWN_ID}-extra and x${KNOWN_ID}\n` });
      expectNoFindings(cli(["--root", dir]));
    });

    it("reports every occurrence and exits 1", () => {
      const dir = repoWith({ "src/two.ts": `${KNOWN_ID}\n${KNOWN_ID}\n` });
      const result = cli(["--root", dir]);
      expectFindings(result, "src/two.ts:1:1");
      expect(result.stderr).toContain("src/two.ts:2:1");
    });
  });

  describe("IDs that are not in the allowlist but follow a provider's naming (6.4)", () => {
    const SAMPLES: ReadonlyArray<{ provider: string; match: string }> = [
      { provider: "openai", match: join_("gpt", "-77-test") },
      { provider: "openai", match: join_("gpt", "-oss-77b") },
      { provider: "openai", match: join_("o", "7") },
      { provider: "openai", match: join_("o", "7", "-mini") },
      { provider: "openai", match: join_("chat", "gpt-latest") },
      { provider: "anthropic", match: join_("claude", "-opus-77") },
      { provider: "anthropic", match: join_("claude", "-sonnet-77") },
      { provider: "anthropic", match: join_("claude", "-haiku-77") },
      { provider: "anthropic", match: join_("claude", "-fable-77") },
      { provider: "anthropic", match: join_("claude", "-mythos-77") },
      { provider: "anthropic", match: join_("claude", "-instant-77") },
      { provider: "anthropic", match: join_("claude", "-77-test") },
      { provider: "google", match: join_("gemini", "-77-pro") },
      { provider: "google", match: join_("gemma", "-77") },
      { provider: "ollama", match: join_("llama", "77") },
      { provider: "ollama", match: join_("codellama", "77") },
      { provider: "ollama", match: join_("mistral", ":7b") },
      { provider: "ollama", match: join_("mixtral", "77") },
      { provider: "ollama", match: join_("qwen", "77") },
      { provider: "ollama", match: join_("phi", "77") },
      { provider: "ollama", match: join_("deepseek-r", "77") },
      { provider: "ollama", match: join_("deepseek-coder", "77") },
      { provider: "ollama", match: join_("gemma", "77") },
      { provider: "ollama", match: join_("granite", "77") },
      { provider: "ollama", match: join_("smollm", "77") },
    ];

    it.each(SAMPLES)("flags $match as $provider", ({ provider, match }) => {
      const dir = repoWith({ "src/model.ts": `use ${match} here\n` });
      expectFindings(cli(["--root", dir]), `src/model.ts:1:5: ${match} (pattern:${provider})`);
    });

    it("does not flag ordinary words that merely contain a provider name", () => {
      const dir = repoWith({
        "docs/words.md": "Ollama runs locally. OLLAMA_BASE_URL is set. Claude Code is a tool.\n",
      });
      expectNoFindings(cli(["--root", dir]));
    });
  });

  describe("excluded and out-of-scope files", () => {
    it("ignores the allowlist file itself (6.1)", () => {
      const dir = repoWith({});
      expectNoFindings(cli(["--root", dir]), 0);
    });

    it("ignores tests/fixtures/** (6.6)", () => {
      const dir = repoWith({ "tests/fixtures/data.ts": `export const id = "${KNOWN_ID}";\n` });
      expectNoFindings(cli(["--root", dir]), 0);
    });

    it("ignores files that git ignores, such as a local env file (ADR-6)", () => {
      const dir = repoWith({
        // Under src/, a scan target: only git's ignore rule can keep this file out of the scan.
        ".gitignore": "src/ignored/\n",
        "src/ignored/local.ts": `export const id = "${KNOWN_ID}";\n`,
        "src/ok.ts": "export const ok = true;\n",
      });
      expectNoFindings(cli(["--root", dir]), 1);
    });

    it("does not scan files outside the listed targets", () => {
      const dir = repoWith({
        "specs/note.md": `${KNOWN_ID}\n`,
        "AGENTS.md": `${KNOWN_ID}\n`,
        "pnpm-lock.yaml": `${KNOWN_ID}\n`,
        "src/ok.ts": "export const ok = true;\n",
      });
      expectNoFindings(cli(["--root", dir]), 1);
    });

    it("skips files that contain a NUL byte", () => {
      const dir = repoWith({ "src/ok.ts": "export const ok = true;\n" });
      write(dir, "src/binary.ts", Buffer.concat([Buffer.from([0]), Buffer.from(KNOWN_ID)]));
      expectNoFindings(cli(["--root", dir]), 1);
    });
  });

  describe("usage and environment errors exit with 2, never 0 (9.4)", () => {
    it("rejects an unknown argument", () => {
      expectUsageOrEnvironmentError(cli(["--bogus"]), /usage:/);
    });

    it("rejects a positional argument", () => {
      expectUsageOrEnvironmentError(cli(["some/dir"]), /usage:/);
    });

    it("rejects --root without a value", () => {
      expectUsageOrEnvironmentError(cli(["--root"]), /usage:/);
    });

    it("fails when the root is not a git repository", () => {
      const dir = mkdtempSync(join(tmpdir(), "genai-lab-nogit-"));
      onTestFinished(() => rmSync(dir, { recursive: true, force: true }));
      expectUsageOrEnvironmentError(cli(["--root", dir]), /git/);
    });

    it("fails when the allowlist file is missing", () => {
      const dir = repoWith({ "src/ok.ts": "export const ok = true;\n" }, { allowlist: false });
      expectUsageOrEnvironmentError(cli(["--root", dir]), new RegExp(ALLOWLIST_FILE));
    });

    it("fails when the allowlist file has the wrong shape", () => {
      const dir = repoWith(
        { [ALLOWLIST_FILE]: "export const MODEL_ALLOWLIST = 1;\n" },
        { allowlist: false },
      );
      expectUsageOrEnvironmentError(cli(["--root", dir]), /MODEL_ALLOWLIST/);
    });
  });

  describe("the real repository", () => {
    it("does not flag the script, this test, or any other file (completion condition)", () => {
      const result = cli(["--root", REPO_ROOT]);
      expectGateSuccess(result);
      const match = /scanned (\d+) files, 0 findings/.exec(result.stdout);
      expect(Number(match?.[1])).toBeGreaterThan(0);
    });
  });
});
