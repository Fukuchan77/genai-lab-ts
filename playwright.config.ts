import { defineConfig, devices } from "@playwright/test";

// A dedicated port, defined once. Never 3000: a developer's own dev server must not be reused.
const PORT = 3100;
const ORIGIN = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "tests/e2e",
  // Retries would hide flaky tests (constitution principle 3).
  retries: 0,
  forbidOnly: true,
  // Fails the run when no test was executed, e.g. every @smoke test skipped (spec 001, 3.9).
  reporter: [["list"], ["./tests/e2e/reporters/require-executed-tests.ts"]],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: {
    baseURL: ORIGIN,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${PORT}`,
    url: ORIGIN,
    // Always start our own server, so the tests never run against a stale or foreign one.
    reuseExistingServer: false,
    env: { NEXT_TELEMETRY_DISABLED: "1" },
  },
});
