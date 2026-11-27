import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { callModel } from "@/lib/ai/basics";
import { resolveTool, runCommand } from "./helpers/sandbox";

/**
 * Contract of `src/lib/ai/basics.ts` that a behavior test cannot show (spec 002, 1.1, 1.2, 1.3, 1.9):
 * the compile-time shape of the settings and the model, the imports of the module, and the
 * `server-only` mark. The `@ts-expect-error` lines are checked by `mise run typecheck`, which is part of
 * `mise run verify`: a directive that is no longer needed is itself a type error.
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const BASICS_PATH = "src/lib/ai/basics.ts";

function model(): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    doGenerate: {
      content: [{ type: "text", text: "ok" }],
      finishReason: { unified: "stop", raw: "stop" },
      usage: {
        inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
        outputTokens: { total: 1, text: 1, reasoning: undefined },
      },
      warnings: [],
    },
  });
}

describe("types of the settings and the model (1.2, 1.3)", () => {
  it("rejects keys that are not settings at compile time, and does not forward them at run time (1.2)", async () => {
    const mock = model();

    // Each directive covers one line with one extra key, so no other type error can hide behind it.
    // @ts-expect-error topP is not a setting of this lab
    await callModel(mock, { prompt: "p", topP: 0.5 }).catch(() => undefined);
    // @ts-expect-error instructions is the SDK's name; the lab's name is system
    await callModel(mock, { prompt: "p", instructions: "i" }).catch(() => undefined);
    // @ts-expect-error abortSignal belongs to a later stage
    await callModel(mock, { prompt: "p", abortSignal: AbortSignal.abort() }).catch(() => undefined);

    // Type widened, the same keys must still not reach the model.
    const widened: { prompt: string } & Record<string, unknown> = {
      prompt: "p",
      topP: 0.5,
      instructions: "SNEAKED",
    };
    const checked = model();
    await callModel(checked, widened);
    expect(checked.doGenerateCalls[0]?.topP).toBeUndefined();
    expect(JSON.stringify(checked.doGenerateCalls[0]?.prompt)).not.toContain("SNEAKED");
  });

  it("requires a prompt at compile time (1.2)", () => {
    const mock = model();
    // The call is never run: the type error is the check.
    const rejects = () =>
      // @ts-expect-error prompt is required
      callModel(mock, {});

    expect(typeof rejects).toBe("function");
  });

  it("takes a model object, not a string model ID, at compile time (1.1, 1.3)", () => {
    // The call is never run: a string would make the SDK build an AI Gateway model, which needs the
    // network and a key. The text is not shaped like a model ID, so check:model-ids does not match it.
    const rejects = () =>
      // @ts-expect-error a string is not a model object
      callModel("not-a-model-object", { prompt: "p" });

    expect(typeof rejects).toBe("function");
  });
});

describe("imports of basics.ts (1.1)", () => {
  it("imports only server-only and ai", () => {
    const source = readFileSync(join(REPO_ROOT, BASICS_PATH), "utf8");
    // `import ... from "x"`, `import "x"`, `export ... from "x"` and dynamic `import("x")`.
    const specifiers = [
      ...source.matchAll(/(?:^|\n)\s*(?:import|export)\s[^;]*?from\s+["']([^"']+)["']/g),
      ...source.matchAll(/(?:^|\n)\s*import\s+["']([^"']+)["']/g),
      ...source.matchAll(/\bimport\(\s*["']([^"']+)["']\s*\)/g),
      ...source.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g),
    ].map((match) => match[1]);

    expect(specifiers.length, "basics.ts must import something").toBeGreaterThan(0);
    expect([...new Set(specifiers)].sort()).toEqual(["ai", "server-only"]);
  });
});

describe("server-only mark (1.9)", { timeout: 120_000 }, () => {
  /** Imports basics.ts in a child Node process. The child runs Node's type stripping, as hello does. */
  function importBasics(extraArgs: readonly string[]) {
    return runCommand(
      [
        resolveTool("node"),
        ...extraArgs,
        "--input-type=module",
        "--eval",
        `await import(${JSON.stringify(`./${BASICS_PATH}`)});`,
      ],
      { cwd: REPO_ROOT },
    );
  }

  it("fails to load under the default conditions, and the output names server-only", () => {
    const result = importBasics([]);

    expect(result.spawnError).toBeNull();
    expect(result.status, "default conditions: status").not.toBe(0);
    expect(`${result.stdout}${result.stderr}`).toContain("server-only");
  });

  it("loads under the react-server condition", () => {
    const result = importBasics(["--conditions=react-server"]);

    expect(result.spawnError).toBeNull();
    expect(result.status, `react-server: status (stderr: ${result.stderr.slice(0, 500)})`).toBe(0);
  });
});
