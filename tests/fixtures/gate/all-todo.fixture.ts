import { it } from "vitest";

// Input for gate-self-check.test.ts (b): every test is a todo, so no test is executed. Vitest alone
// exits 0 for this; only the require-executed-tests reporter turns it into a failure (3.8).
// (An `it.skip` fixture is avoided on purpose: Biome's noSkippedTests would flag it.)
it.todo("is declared but never executed");
