import { copyFileSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTempGitRepo,
  expectGateFailure,
  expectGateSuccess,
  resolveTool,
  runCommand,
} from "./helpers/sandbox";

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/**
 * Self-checks of the static analysis gates (spec 001, 2.4 and 2.5). Each test copies the real config
 * files into a temporary repository, so a weakened config fails here. node_modules is a symlink to
 * the repository's, and the violating files sit at the real scan paths.
 */
function populateSandbox(dir: string, configFiles: readonly string[]): string {
  for (const file of configFiles) {
    copyFileSync(join(REPO_ROOT, file), join(dir, file));
  }
  symlinkSync(join(REPO_ROOT, "node_modules"), join(dir, "node_modules"), "dir");
  return dir;
}

function writeFiles(dir: string, files: Readonly<Record<string, string>>): void {
  for (const [path, content] of Object.entries(files)) {
    const full = join(dir, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
}

// Child processes run real tsc / Biome (spec 001, C6).
describe("static analysis: tsc", { timeout: 120_000 }, () => {
  const tsc = (dir: string) =>
    runCommand([resolveTool("tsc"), "--noEmit", "-p", "tsconfig.json"], {
      cwd: dir,
    });

  it("fails on a type error in src/ and in tests/ and names both files (2.5)", () => {
    const dir = populateSandbox(createTempGitRepo(), ["tsconfig.json", ".gitignore"]);
    writeFiles(dir, {
      "src/bad-source.ts": 'export const n: number = "not a number";\n',
      "tests/unit/bad-unit.test.ts": "export const s: string = 42;\n",
      "tests/e2e/bad-e2e.spec.ts": "export const b: boolean = null;\n",
    });
    const result = tsc(dir);
    expectGateFailure(result, { output: "src/bad-source.ts" });
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain("tests/unit/bad-unit.test.ts");
    expect(output).toContain("tests/e2e/bad-e2e.spec.ts");
  });

  it("rejects an implicit any, which only strict mode catches (2.3)", () => {
    const dir = populateSandbox(createTempGitRepo(), ["tsconfig.json", ".gitignore"]);
    writeFiles(dir, {
      "src/implicit-any.ts": "export function f(x) { return x; }\n",
    });
    expectGateFailure(tsc(dir), { output: "src/implicit-any.ts" });
  });

  it("control: files without type errors pass", () => {
    const dir = populateSandbox(createTempGitRepo(), ["tsconfig.json", ".gitignore"]);
    writeFiles(dir, {
      "src/ok.ts": "export const n: number = 1;\n",
      "tests/unit/ok.test.ts": 'export const s: string = "ok";\n',
    });
    expectGateSuccess(tsc(dir));
  });
});

// Child processes run real Biome (spec 001, C6).
describe("static analysis: Biome", { timeout: 120_000 }, () => {
  const biome = (dir: string) => runCommand([resolveTool("biome"), "check", "."], { cwd: dir });
  const sandbox = () => populateSandbox(createTempGitRepo(), ["biome.json", ".gitignore"]);

  it("fails on explicit any, unused variables and unused imports, naming each rule (2.4)", () => {
    const dir = sandbox();
    writeFiles(dir, {
      "src/explicit-any.ts": "export const a: any = 1;\n",
      "src/unused-variable.ts": "export function f() {\n  const unused = 1;\n}\n",
      "tests/unit/unused-import.test.ts":
        'import { join } from "node:path";\n\nexport const x = 1;\n',
    });
    const result = biome(dir);
    expectGateFailure(result, { output: "noExplicitAny" });
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain("noUnusedVariables");
    expect(output).toContain("noUnusedImports");
  });

  it("fails on it.skip, describe.skip and test.skip inside a test body (3.8, 3.9)", () => {
    const dir = sandbox();
    writeFiles(dir, {
      "tests/unit/it-skip.test.ts": 'import { it } from "vitest";\n\nit.skip("later", () => {});\n',
      "tests/unit/describe-skip.test.ts":
        'import { describe } from "vitest";\n\ndescribe.skip("later", () => {});\n',
      "tests/e2e/body-skip.spec.ts":
        'import { test } from "vitest";\n\ntest("later", () => {\n  test.skip(true, "later");\n});\n',
    });
    const result = biome(dir);
    expectGateFailure(result, { output: "noSkippedTests" });
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain("tests/unit/it-skip.test.ts");
    expect(output).toContain("tests/unit/describe-skip.test.ts");
    expect(output).toContain("tests/e2e/body-skip.spec.ts");
  });

  it("does not flag it.todo or test.info().skip: the execution-count reporters stop those (3.8, 3.9)", () => {
    const dir = sandbox();
    writeFiles(dir, {
      "tests/unit/todo.test.ts": 'import { it } from "vitest";\n\nit.todo("later");\n',
      "tests/e2e/fixtures.ts":
        'import { test } from "@playwright/test";\n\ntest("skips from info", () => {\n  test.info().skip(true, "reason");\n});\n',
    });
    expectGateSuccess(biome(dir));
  });

  it("forbids importing @playwright/test directly in tests/e2e, except in fixtures.ts (ADR-5)", () => {
    const dir = sandbox();
    writeFiles(dir, {
      "tests/e2e/direct.spec.ts":
        'import { test } from "@playwright/test";\n\ntest("direct", () => {});\n',
    });
    expectGateFailure(biome(dir), {
      output: "tests/e2e/direct.spec.ts",
    });
    const allowed = sandbox();
    writeFiles(allowed, {
      "tests/e2e/fixtures.ts": 'import { test } from "@playwright/test";\n\nexport { test };\n',
    });
    expectGateSuccess(biome(allowed));
  });

  it("control: clean, formatted files pass", () => {
    const dir = sandbox();
    writeFiles(dir, {
      "src/ok.ts": "export const n: number = 1;\n",
      "tests/unit/ok.test.ts":
        'import { expect, it } from "vitest";\n\nit("works", () => {\n  expect(1).toBe(1);\n});\n',
    });
    expectGateSuccess(biome(dir));
  });
});
