import { defineConfig } from "vitest/config";
import base from "../../../vitest.config";

// Nested run used by the gate self-checks (spec 001, C12). It inherits everything from the real
// config (setupFiles, resolve, reporters) but replaces `include` by assignment. mergeConfig would
// concatenate the arrays, so the real `tests/unit/**` glob would still match and the nested run
// would start itself again.
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/fixtures/gate/*.fixture.ts"],
  },
});
