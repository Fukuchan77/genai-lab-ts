import type { FullResult, Reporter, TestCase, TestResult } from "@playwright/test/reporter";

/**
 * Fails the whole run when no test was executed (spec 001, 3.9).
 *
 * Playwright exits 0 when every selected test skips itself (measured with 1.65.1, research.md I-15),
 * and `--grep` matching nothing is the only case it already rejects. This reporter counts tests whose
 * result is not `skipped` and returns a failed status when there are none.
 */
export const NO_TESTS_EXECUTED_MESSAGE = "no tests were executed";

export default class RequireExecutedTests implements Reporter {
  private executed = 0;

  onTestEnd(_test: TestCase, result: TestResult): void {
    if (result.status !== "skipped") this.executed++;
  }

  async onEnd(): Promise<{ status: FullResult["status"] } | undefined> {
    if (this.executed > 0) return undefined;
    process.stderr.write(`${NO_TESTS_EXECUTED_MESSAGE}\n`);
    return { status: "failed" };
  }
}
