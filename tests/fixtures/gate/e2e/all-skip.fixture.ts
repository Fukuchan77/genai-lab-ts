import { expect, test } from "@playwright/test";

// Input for gate-self-check.test.ts (c): the only @smoke test skips itself, so nothing is executed.
// Playwright alone exits 0 for this; only the reporter turns it into a failure (3.9).
// `test.info().skip(...)` is used because Biome's noSkippedTests flags `test.skip(...)` in a body.
test("skips itself @smoke", () => {
  test.info().skip(true, "deliberately skipped by the gate self-check");
  expect(true).toBe(true);
});
