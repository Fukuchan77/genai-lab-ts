import type { Reporter, TestModule } from "vitest/node";

/**
 * Fails the whole run when no test was executed (spec 001, 3.8).
 *
 * Vitest exits 0 when test files exist but every test is `todo` or `skip` ("1 todo" is not a
 * failure), and `passWithNoTests: false` only covers "no test files". This reporter counts tests that
 * reached `passed` or `failed` and sets a non-zero exit code when there are none. Measured with
 * Vitest 5.1.1 (research.md I-15): it is the only guard for the todo-only case.
 */
export const NO_TESTS_EXECUTED_MESSAGE = "no tests were executed";

export default class RequireExecutedTests implements Reporter {
  onTestRunEnd(testModules: ReadonlyArray<TestModule>): void {
    let executed = 0;
    for (const testModule of testModules) {
      for (const testCase of testModule.children.allTests()) {
        const state = testCase.result().state;
        if (state === "passed" || state === "failed") executed++;
      }
    }
    if (executed === 0) {
      process.stderr.write(`${NO_TESTS_EXECUTED_MESSAGE}\n`);
      process.exitCode = 1;
    }
  }
}
