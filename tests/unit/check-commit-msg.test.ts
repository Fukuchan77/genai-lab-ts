import { writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  createTempGitRepo,
  expectGateFailure,
  expectGateSuccess,
  resolveTool,
  runCommand,
} from "./helpers/sandbox";

/**
 * commit-msg check (spec 001, requirement 7.4, research.md ADR-8). The rule applies to the first line
 * that is neither blank nor a git comment (a line starting with "#"). The line must follow Conventional
 * Commits, or be a message that git writes itself.
 */

const SCRIPT = resolve(import.meta.dirname, "..", "..", "scripts", "check-commit-msg.mjs");

/** Runs the check on a message written to a temporary file. */
function checkMessage(text: string) {
  const dir = createTempGitRepo();
  const file = join(dir, "COMMIT_EDITMSG");
  writeFileSync(file, text);
  return runCommand([resolveTool("node"), SCRIPT, file]);
}

function expectAccepted(text: string): void {
  expectGateSuccess(checkMessage(text));
}

function expectRejected(text: string): void {
  const result = checkMessage(text);
  expectGateFailure(result, { output: /Conventional Commits/ });
  expect(result.status, "a rejected message exits with 1").toBe(1);
}

// The check runs as a child process (spec 001, C6).
describe("check-commit-msg", { timeout: 120_000 }, () => {
  describe("accepts Conventional Commits (7.4)", () => {
    it.each([
      "build: x",
      "chore: x",
      "ci: x",
      "docs: x",
      "feat: x",
      "fix: x",
      "perf: x",
      "refactor: x",
      "revert: x",
      "style: x",
      "test: x",
    ])("accepts %s", (subject) => {
      expectAccepted(`${subject}\n`);
    });

    it.each(["feat(parser): x", "feat(parser/core): x", "feat!: x", "feat(api)!: x"])(
      "accepts a scope and a breaking-change marker in %s",
      (subject) => {
        expectAccepted(`${subject}\n`);
      },
    );
  });

  describe("accepts messages that git generates (7.4)", () => {
    it.each([
      'Merge branch "main"',
      'Revert "feat: x"',
      "fixup! feat: x",
      "squash! fix: x",
      "amend! docs: x",
    ])("accepts %s", (subject) => {
      expectAccepted(`${subject}\n`);
    });
  });

  describe("rejects other subjects (7.4)", () => {
    it.each([
      "unknown: x",
      "Feat: x",
      "feat x",
      "feat:",
      "feat: ",
      "feat(): x",
      "feat(a b): x",
      "feat(a)!x: y",
      "feat!(a): x",
    ])("rejects %j", (subject) => {
      expectRejected(`${subject}\n`);
    });

    it("rejects a message that is empty, or holds only comments", () => {
      expectRejected("");
      expectRejected(
        "\n\n# Please enter the commit message.\n# lines starting with '#' are ignored\n",
      );
    });
  });

  describe("judges only the first line that is not blank or a comment (7.4)", () => {
    it("accepts a valid subject followed by a body that does not conform", () => {
      expectAccepted("feat: add parser\n\nThis body is free text and is not checked.\n");
    });

    it("skips comment and blank lines before the subject, as the editor template does", () => {
      expectAccepted(
        "# Please enter the commit message for your changes.\n\n# Changes:\n\nfeat: add parser\n",
      );
    });

    it("rejects a non-conforming subject even when a later line conforms", () => {
      expectRejected("wrong subject\nfeat: x\n");
    });
  });

  describe("usage and read errors exit with 2 (7.4)", () => {
    it("rejects a call without a file argument", () => {
      const result = runCommand([resolveTool("node"), SCRIPT]);
      expectGateFailure(result, { output: /usage:/ });
      expect(result.status).toBe(2);
    });

    it("rejects a call with two arguments", () => {
      const file = join(createTempGitRepo(), "COMMIT_EDITMSG");
      writeFileSync(file, "feat: x\n");
      const result = runCommand([resolveTool("node"), SCRIPT, file, file]);
      expectGateFailure(result, { output: /usage:/ });
      expect(result.status).toBe(2);
    });

    it("exits with 2 when the file cannot be read", () => {
      const missing = join(createTempGitRepo(), "no-such-message");
      const result = runCommand([resolveTool("node"), SCRIPT, missing]);
      expectGateFailure(result, { output: /cannot read/ });
      expect(result.status).toBe(2);
    });
  });

  it("explains the expected form and gives an example when it rejects (7.4)", () => {
    const result = checkMessage("wrong subject\n");
    expectGateFailure(result, { output: /Conventional Commits/ });
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toContain("<type>(<scope>)?!?: <subject>");
    expect(output).toContain("example: feat(parser): accept empty input");
    expect(output).toContain(
      "build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test",
    );
  });
});
