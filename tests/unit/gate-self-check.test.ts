import { describe, expect, it } from "vitest";
import {
  type CommandResult,
  editArgv,
  expectGateFailure,
  expectGateSuccess,
  isolatedEnv,
  runCommand,
  taskArgv,
} from "./helpers/sandbox";

/**
 * Self-checks of the gate itself (spec 001, C12). The argv under test is read from the `test` task in
 * mise.toml, so a flag such as --passWithNoTests added to the task makes these tests fail.
 */

function runNested(argv: readonly string[]): CommandResult {
  return runCommand(argv, { env: isolatedEnv({ nested: true }) });
}

// Nested runs start real Vitest processes (spec 001, C6).
describe("gate self-check: Vitest", { timeout: 120_000 }, () => {
  it("(a) fails when no test file matches", () => {
    const result = runNested([
      ...taskArgv("test"),
      "--maxWorkers=1",
      "tests/does-not-exist/zzz-no-such-file",
    ]);
    expectGateFailure(result, { output: "No test files found" });
  });

  it("(b) fails when files exist but no test is executed (todo only)", () => {
    const result = runNested([
      ...taskArgv("test"),
      "--maxWorkers=1",
      "--config",
      "tests/fixtures/gate/vitest.fixture.config.ts",
      "tests/fixtures/gate/all-todo.fixture.ts",
    ]);
    expectGateFailure(result, { output: "no tests were executed" });
  });
});

// Nested Playwright runs (spec 001, C12). They use the fixture config, which loads the real reporter.
describe("gate self-check: Playwright", { timeout: 120_000 }, () => {
  const FIXTURE_CONFIG = "tests/fixtures/gate/e2e/playwright.fixture.config.ts";

  it("(c) fails when the only @smoke test is skipped, and passes when one test runs", () => {
    const skipped = runNested([
      ...editArgv(taskArgv("e2e"), { config: FIXTURE_CONFIG }),
      "tests/fixtures/gate/e2e/all-skip.fixture.ts",
    ]);
    expectGateFailure(skipped, { output: "no tests were executed" });

    const passed = runNested([
      ...editArgv(taskArgv("e2e"), { config: FIXTURE_CONFIG }),
      "tests/fixtures/gate/e2e/one-pass.fixture.ts",
    ]);
    expectGateSuccess(passed);
  });

  it("(d) fails with 'No tests found' when no @smoke test matches, and lists them otherwise", () => {
    const base = editArgv(taskArgv("e2e"), { reporter: "list" });
    const none = runNested([...editArgv(base, { grep: "@no-such-tag" }), "--list"]);
    expectGateFailure(none, { output: "No tests found" });

    const listed = runNested([...base, "--list"]);
    expectGateSuccess(listed);
    const listing = `${listed.stdout}${listed.stderr}`;
    expect(listing).toContain("placeholder.smoke.spec.ts");
    expect(listing).toContain("network-guard.smoke.spec.ts");
    // pre-push runs these; the budget is one or two smoke tests (plan D5).
    expect(listing).toMatch(/Total: 2 tests in 2 files/);
  });

  it("(e) fails an E2E test in teardown when it requests an external origin, naming the origin only", () => {
    const argv = editArgv(taskArgv("e2e"), { config: FIXTURE_CONFIG });
    const blocked = runNested([...argv, "tests/fixtures/gate/e2e/external-request.fixture.ts"]);
    expectGateFailure(blocked, {
      output: /external origin\(s\) without a mock: http:\/\/127\.0\.0\.1:\d+\./,
    });
    expect(`${blocked.stdout}${blocked.stderr}`).not.toContain("not-a-secret");

    const clean = runNested([...argv, "tests/fixtures/gate/e2e/no-external-request.fixture.ts"]);
    expectGateSuccess(clean);
  });
});
