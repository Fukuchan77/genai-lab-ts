import { expect, test } from "../../../e2e/fixtures";

// Control input for gate-self-check.test.ts (e): no external request, so the same run passes.
test("makes no external request @smoke", async ({ page }) => {
  await page.setContent("<p>no external request</p>");
  await expect(page.getByText("no external request")).toBeVisible();
});
