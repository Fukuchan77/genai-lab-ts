HEAD: bb2740c987e9502d531f0275240e9f28356806d5

# 3.6 review rounds (Codex, read-only)

Eight rounds on tests/unit/hello-task.test.ts. Every MEDIUM finding was reproduced with a reverted mutation of
scripts/hello.ts before it was fixed. Round-by-round table and the final design: specs/002-llm-call-basics/research.md, R-3
("explain() の出力の検査"). The full raw output of each round was not kept.

- Rounds 1-6: a bypass each round (brace in a template; local assigned from PROMPT; regex literal; prompt as a literal; prompt split
  and joined; PULL_COMMAND from PROMPT; console?.error; node:fs + Symbol.hasInstance; catch-local const explain). All reproduced.
  Round 3 switched the check from a text scanner to the syntax tree (typescript/sync).
- User decision (2026-11-27): rounds 5 and 6 target hostile rewrites and conflict with the documented provider swap, so those
  rules were removed. The check targets realistic regressions only.
- Round 7 (after the shrink): MEDIUM `await Promise.reject(error)` lets the caught error escape (reproduced, fixed); LOW no refusal
  case for console.debug/console.warn (fixed).
- Round 8 (last): LOW only, "no code change needed". Verdict: APPROVE_WITH_NOTES.
