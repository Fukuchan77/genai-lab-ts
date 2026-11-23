import { expect, test } from "@playwright/test";

// Control input for gate-self-check.test.ts (c): one executed @smoke test passes.
test("passes @smoke", () => {
  expect(1 + 1).toBe(2);
});
