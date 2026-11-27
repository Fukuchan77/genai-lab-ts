import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      // Exact match only: `server-only` must not capture other package names. Spec 002, ADR-8.
      {
        find: /^server-only$/,
        replacement: fileURLToPath(
          new URL("./tests/unit/setup/server-only-stub.ts", import.meta.url),
        ),
      },
    ],
  },
  test: {
    include: ["tests/unit/**/*.test.ts"],
    environment: "node",
    // Fails any test that reaches the network without a mock (spec 001, 3.10).
    setupFiles: ["tests/unit/setup/network-guard.ts"],
    // Fails the run when no test was executed, e.g. only todo/skip (spec 001, 3.8).
    reporters: ["default", "./tests/unit/setup/require-executed-tests.ts"],
    // Same as the defaults, written out so that a changed default cannot weaken the gate (3.8).
    passWithNoTests: false,
    allowOnly: false,
  },
});
