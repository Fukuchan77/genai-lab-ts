import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { expectGateSuccess, resolveTool, runCommand, taskRun } from "./helpers/sandbox";

/**
 * Static checks of the `hello` task and `scripts/hello.ts` (spec 002, 5.3, 5.7, 5.8, 5.9). The script is
 * only read as text: it is never imported or run here, because it needs a local Ollama (6.8). Its
 * behavior is measured by hand and recorded in research.md R-5.
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const HELLO_COMMAND = "node --conditions=react-server scripts/hello.ts";
const SETTINGS = ["system", "prompt", "temperature", "maxOutputTokens", "maxRetries"] as const;

function readText(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

/** The task a run entry refers to: `{ task = "x" }` or the text `mise run x`. */
function referencedTask(entry: string | { readonly task: string }): string | undefined {
  if (typeof entry !== "string") return entry.task;
  return /^mise run (\S+)$/.exec(entry.trim())?.[1];
}

/** Every task reached from `name` through references, and the leaf commands on the way. */
function reach(name: string, tasks = new Set<string>(), commands: string[] = []) {
  for (const entry of taskRun(name)) {
    const reference = referencedTask(entry);
    if (reference !== undefined) {
      if (!tasks.has(reference)) {
        tasks.add(reference);
        reach(reference, tasks, commands);
      }
    } else if (typeof entry === "string") {
      commands.push(entry);
    }
  }
  return { tasks, commands };
}

/** Tracked and untracked (not ignored) files of the repository. */
function repositoryFiles(): string[] {
  const result = runCommand([
    resolveTool("git"),
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  expectGateSuccess(result);
  return result.stdout.split("\0").filter((file) => file !== "");
}

// Child processes run mise and git (spec 001 convention).
describe("hello task", { timeout: 120_000 }, () => {
  it("is one command, `node --conditions=react-server scripts/hello.ts` (5.8)", () => {
    expect(taskRun("hello")).toEqual([HELLO_COMMAND]);
  });

  it("has a description (5.8)", () => {
    const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
    expectGateSuccess(result);
    const tasks: unknown = JSON.parse(result.stdout);
    if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
    const hello = tasks.find(
      (task): task is { description?: unknown } =>
        typeof task === "object" && task !== null && "name" in task && task.name === "hello",
    );
    expect(typeof hello?.description === "string" && hello.description.trim() !== "").toBe(true);
  });

  it.each(["verify", "security"])("is not reached from the %s task (5.9)", (name) => {
    const { tasks, commands } = reach(name);

    expect([...tasks]).not.toContain("hello");
    for (const command of commands) {
      expect(command, `${name} runs "${command}"`).not.toContain("hello");
    }
  });

  it("is not referenced by the git hooks or the CI workflows (5.9)", () => {
    const files = repositoryFiles().filter(
      (file) => file === "lefthook.yml" || /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file),
    );
    expect(files, "lefthook.yml and the workflows must be found").toContain("lefthook.yml");
    expect(files.length).toBeGreaterThan(1);

    for (const file of files) {
      const text = readText(file);
      expect(text, `${file} mentions the hello task`).not.toMatch(/mise run hello/);
      expect(text, `${file} mentions the hello script`).not.toContain("scripts/hello");
    }
  });
});

describe("scripts/hello.ts, read as text only (5.3, 5.7, 6.8)", () => {
  /** The source without comments, so that a word in a comment cannot satisfy or break a check. */
  const code = () =>
    readText("scripts/hello.ts")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

  it("does not read environment variables (5.7)", () => {
    expect(code()).not.toContain("process.env");
    expect(code()).not.toContain("import.meta.env");
  });

  it("calls callModel in exactly one place, with all five settings written out (5.3)", () => {
    const text = code();
    const calls = [...text.matchAll(/\bcallModel\(/g)];
    expect(calls, "callModel( must appear once, outside comments").toHaveLength(1);

    // The argument list: from the opening parenthesis to its matching closing parenthesis.
    const open = (calls[0]?.index ?? 0) + "callModel".length;
    let depth = 0;
    let end = open;
    for (let index = open; index < text.length; index += 1) {
      if (text[index] === "(") depth += 1;
      if (text[index] === ")") depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
    const args = text.slice(open, end + 1);
    for (const setting of SETTINGS) {
      expect(args, `the callModel( arguments must name ${setting}`).toMatch(
        new RegExp(`\\b${setting}\\b`),
      );
    }
  });

  it("prints only allowed values: never the prompt, the system text, or an error object (5.7)", () => {
    const text = code();
    // Every console call, with its argument text up to the end of the statement.
    const outputs = [...text.matchAll(/console\.\w+\(([^;]*)\);/g)].map((match) => match[1] ?? "");
    expect(outputs.length, "the script must print something").toBeGreaterThan(0);

    for (const output of outputs) {
      expect(output, `console output: ${output}`).not.toMatch(/\b(PROMPT|SYSTEM)\b/);
      // An error is only ever printed through explain(), which prints its type and a summary.
      if (/\b(error|cause)\b/.test(output)) {
        expect(output, `console output: ${output}`).toMatch(/^explain\(error\)$/);
      }
    }
    // Messages are never read to decide what to print (5.6).
    expect(text).not.toMatch(/\.message\b/);
  });
});
