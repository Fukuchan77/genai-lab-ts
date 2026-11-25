import { expect, it } from "vitest";

// Control input for network-guard.test.ts (b): a test that makes no network access passes.
it("makes no network access", () => {
  expect(1 + 1).toBe(2);
});
