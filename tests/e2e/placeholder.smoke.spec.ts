import { expect, test } from "./fixtures";

test("the placeholder page shows its heading @smoke", async ({ page }) => {
  await page.goto("/");
  // `exact` matters: by default the name is a case-insensitive substring match.
  await expect(
    page.getByRole("heading", { level: 1, name: "genai-lab-ts", exact: true }),
  ).toBeVisible();
});
