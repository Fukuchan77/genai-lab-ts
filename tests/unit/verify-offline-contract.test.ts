import { describe, expect, it } from "vitest";
import { expectGateSuccess, resolveTool, runCommand, taskRun } from "./helpers/sandbox";

/**
 * `mise run verify` is the single offline, deterministic gate (spec 001, requirements 3.1 to 3.6).
 * This file checks its composition. It does not run the network off: that is measured once in
 * research.md R-3. What it can prove is that nothing needing the network is wired into verify.
 */

/** The six checks verify runs, in order (3.1, 3.6). */
const VERIFY_TASKS = [
  "check",
  "typecheck",
  "check:model-ids",
  "check:secrets",
  "test",
  "e2e",
] as const;

/** Tools that work without the network. A tool that is not here must be judged before it joins verify. */
const OFFLINE_TOOLS = ["biome", "tsc", "next", "vitest", "playwright", "gitleaks", "node"];

/** Words that mean "needs the network or changes the install" (3.6). */
const FORBIDDEN_IN_VERIFY = [
  "security",
  "pnpm audit",
  "osv-scanner",
  "pnpm install",
  "playwright install",
  "outdated",
  "curl",
  "wget",
];

/** The task name a run entry refers to: `{ task = "x" }` or the text `mise run x`. */
function referencedTask(entry: string | { readonly task: string }): string | undefined {
  if (typeof entry !== "string") return entry.task;
  const match = /^mise run (\S+)$/.exec(entry.trim());
  return match?.[1];
}

/** The leaf commands of a task, following task references recursively (3.5, 3.6). */
function leafCommands(name: string, seen: Set<string> = new Set()): string[] {
  if (seen.has(name)) throw new Error(`task "${name}" refers to itself`);
  const next = new Set(seen).add(name);
  const leaves: string[] = [];
  for (const entry of taskRun(name)) {
    const reference = referencedTask(entry);
    if (reference !== undefined) {
      leaves.push(...leafCommands(reference, next));
    } else if (typeof entry === "string") {
      leaves.push(entry);
    }
  }
  return leaves;
}

/** Every task that verify runs, directly or through another task. */
function tasksReachedFrom(name: string, found: Set<string> = new Set()): Set<string> {
  for (const entry of taskRun(name)) {
    const reference = referencedTask(entry);
    if (reference !== undefined && !found.has(reference)) {
      found.add(reference);
      tasksReachedFrom(reference, found);
    }
  }
  return found;
}

/** The program a leaf command starts: the word after `pnpm exec`, or the first word. */
function programOf(command: string): string {
  const words = command.trim().split(/\s+/);
  if (words[0] === "pnpm" && words[1] === "exec") return words[2] ?? "";
  return words[0] ?? "";
}

// `mise tasks ls` runs in a child process (spec 001, C6).
describe("verify offline contract", { timeout: 120_000 }, () => {
  it("runs the six checks in order and nothing else, one after another (3.1, 3.6)", () => {
    const direct = taskRun("verify").map(referencedTask);
    expect(direct).toEqual([...VERIFY_TASKS]);
  });

  it("reaches exactly the six checks, with no task hidden behind them (3.5)", () => {
    expect([...tasksReachedFrom("verify")].sort()).toEqual([...VERIFY_TASKS].sort());
  });

  it("contains no command that needs the network or changes the install (3.6)", () => {
    const commands = leafCommands("verify");
    expect(commands.length, "verify must reach real commands").toBeGreaterThan(0);
    for (const command of commands) {
      for (const word of FORBIDDEN_IN_VERIFY) {
        expect(command, `"${command}" contains "${word}"`).not.toContain(word);
      }
    }
  });

  it("starts only tools known to work offline (3.5)", () => {
    for (const command of leafCommands("verify")) {
      expect(OFFLINE_TOOLS, `"${command}" starts "${programOf(command)}"`).toContain(
        programOf(command),
      );
    }
  });

  it("is also reachable as `gate`, with the same checks (3.3)", () => {
    const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
    expectGateSuccess(result);
    const tasks: unknown = JSON.parse(result.stdout);
    if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
    const verify = tasks.find(
      (task): task is { name: string; aliases: unknown } =>
        typeof task === "object" && task !== null && "name" in task && task.name === "verify",
    );
    expect(verify?.aliases).toEqual(["gate"]);
  });

  it("gives every task a description (3.4)", () => {
    const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
    expectGateSuccess(result);
    const tasks: unknown = JSON.parse(result.stdout);
    if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
    for (const task of tasks) {
      if (typeof task !== "object" || task === null) continue;
      const record = task as { name?: unknown; description?: unknown };
      expect(
        typeof record.description === "string" && record.description.trim() !== "",
        `task "${String(record.name)}" needs a description`,
      ).toBe(true);
    }
  });
});
