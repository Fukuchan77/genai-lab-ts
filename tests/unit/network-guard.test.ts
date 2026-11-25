import { describe, expect, it } from "vitest";
import {
  expectGateFailure,
  expectGateSuccess,
  isolatedEnv,
  resolveTool,
  runCommand,
} from "./helpers/sandbox";

const FIXTURE_CONFIG = "tests/fixtures/gate/vitest.fixture.config.ts";

/**
 * Runs one fixture file in a nested Vitest. The positional filter selects a single file, so the
 * output can be checked for "exactly one file ran" (spec 001, 2.2).
 */
function runNestedVitest(fixtureFile: string) {
  return runCommand(
    [
      resolveTool("pnpm"),
      "exec",
      "vitest",
      "run",
      "--config",
      FIXTURE_CONFIG,
      "--maxWorkers=1",
      fixtureFile,
    ],
    { env: isolatedEnv({ nested: true }) },
  );
}

// Nested runs start real Vitest processes, which are slow on a cold cache (spec 001, C6).
describe("unit network guard", { timeout: 120_000 }, () => {
  it("(a) fails a test that reaches the network without a mock", () => {
    const result = runNestedVitest("tests/fixtures/gate/unmocked-network.fixture.ts");
    expectGateFailure(result, { output: "UnmockedNetworkError" });
    const output = `${result.stdout}${result.stderr}`;
    expect(output).toMatch(/Test Files\s+1 failed \(1\)/);
    // Both channels are reported, by host and port or origin only.
    expect(output).toContain("fetch: https://fixture.invalid");
    expect(output).toContain("socket: 127.0.0.1:9");
    // The query string of the URL must not reach the output.
    expect(output).not.toContain("not-a-secret");
  });

  it("(b) control: the same run passes when the fixture makes no network access", () => {
    const result = runNestedVitest("tests/fixtures/gate/no-network.fixture.ts");
    expectGateSuccess(result);
    expect(`${result.stdout}${result.stderr}`).toMatch(/Test Files\s+1 passed \(1\)/);
  });
});
