import { defineConfig } from "@playwright/test";

// Nested Playwright run used by the gate self-checks (spec 001, C12). It has no webServer and no
// baseURL, and it loads the real zero-executed-tests reporter, so only the inputs differ from the
// real config. Paths here are relative to this file. Its tests never match the real testDir.
export default defineConfig({
  // Relative to this file, not to the working directory.
  testDir: ".",
  testMatch: "**/*.fixture.ts",
  retries: 0,
  forbidOnly: true,
  projects: [{ name: "chromium" }],
  reporter: [["list"], ["../../../e2e/reporters/require-executed-tests.ts"]],
});
