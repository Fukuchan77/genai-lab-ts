# 002-llm-call-basics: task-graph sanity review

Reviewer: independent fresh-context review. Date: 2026-11-27.
Inputs read directly: spec.md, plan.md, tasks.md (draft), traceability.md, `tasks-generation.md`,
`tasks-parallel-analysis.md`. I also read the repository files the tasks rely on (`vitest.config.ts`,
`tsconfig.json`, `mise.toml`, `pnpm-workspace.yaml`, `package.json`, `.env.example`, the allowlist,
`tests/unit/docs-structure.test.ts`, `tests/unit/verify-offline-contract.test.ts`,
`tests/unit/repo-policy.test.ts`, `scripts/check-model-ids.mjs`, research.md I-8 and I-10 and the R-n skeleton).

## Mechanical checks that passed

- **Coverage**: all 61 acceptance criteria (1.1 to 8.9) appear in at least one sub-task `_Requirements:_`.
  traceability.md is consistent with the `_Traces:_` lines.
- **Boundaries**: every `_Boundary:_` path is in plan.md's File Structure Plan. `spec.json` is excluded
  with a stated reason. The `spec.md` "plan 時の追記" exists, so no task is needed for it.
- **Dependency graph**: no cycles and no forward references.
  Order: 1.1, 1.2, then (1.3, 1.4, 2.1), 2.2, 3.1 to 3.4, (3.5, 3.6), 3.7, 4.1 to 4.4, 5.1 to 5.3, 6.1, 6.2, (7.1, 7.2), 8.1 to 8.3.
- **Test-first ordering** (plan "実装順の制約"): only dependencies and run config come before the tests.
  `mise.toml` `hello` (5.1) comes after the `hello-task` RED (3.6). `hello.ts` (5.2) comes after the
  `callModel` GREEN (4.3).
- **(P) markers**: 7.1 `{AGENTS.md, README.md}` and 7.2 `{tech.md, structure.md}` are disjoint, and neither shares a file with 5.3 or 6.x.

The findings below are what remains.

## Findings

### F1 [MEDIUM] Task 8.2: the "state after 2.1" `next build` cannot be reproduced at 8.2
- **Problem**: 8.2 asks for `pnpm exec next build` "in the state after task 2.1 and in the final state", and R-4 is
  written in 8.2. By 8.2 the repo is far past 2.1. Task 2.1's completion condition has no `next build`, and 2.1's
  boundary excludes research.md, so nothing captures that run. This is a hidden prerequisite, and it protects against the
  `tsconfig.json` rewrite risk named in research.md "Risks".
- **Fix**: add to 2.1's completion: "run `pnpm exec next build`, then `git status --porcelain`, and keep the output
  for R-4". Alternatively, have 8.2 run the first build in a worktree at the CP-A commit. State which, and where the
  output is kept until 8.2.

### F2 [MEDIUM] Tasks 3.2 and 3.4: the 2.5 retry test is placed outside the timed, no-wait describe
- **Problem**: 3.2 includes the 2.5 test ("success after retry returns the successful attempt's usage"). That test
  needs a retryable exception with `retry-after-ms: "0"` and a mock that fails then succeeds. Those helpers and the 1000 ms
  `describe` timeout are introduced only in 3.4. The 2.5 test is therefore written before its helper and outside the timed `describe`.
  The SDK's default backoff is seconds, so a test that omits the header would wait in real time.
  The spec NFR and "spec への追記 4" apply 1 s to every test in `llm-call-basics.test.ts`, yet the tasks enforce it only on the 4.x describe.
- **Fix**: move the 2.5 test into 3.4's timed `describe`, or state in 3.2 that it uses the same helpers and
  `retry-after-ms: "0"`. Say which sub-task introduces the helpers. Optionally set the file-level `testTimeout` to
  1000 ms (plan allows a `describe`-level one, so confirm with plan).

### F3 [MEDIUM] Task 3.4: the retry-error test list omits cases that plan and C6 document
- **Problem**: plan "Error Handling" and the C6 guide state that retryable, retryable, non-retryable at the last
  allowed attempt gives `retries-exhausted` with `cause` being the non-retryable exception. 3.4 and 8.1 ("reason の判定を逆にする") do not test it, so the
  guide documents untested behavior. Also missing: non-retryable first error with `maxRetries: 0`
  (normalization branch X4, attempts 1, `not-retryable`). 3.4 tags "retryable then non-retryable, 2 attempts" as 4.3, but
  spec 4.3 says "試行 1 回". That scenario has no acceptance criterion (see F19).
- **Fix**: add both cases to 3.4. Tag the 2-attempt case with 4.6 and the plan's ADR-5, not 4.3.

### F4 [MEDIUM] Task 6.1: the stated completion condition cannot be observed
- **Problem**: 6.1 says `docs-structure.test.ts` "矛盾しない". The new file will fail two existing tests until 6.2 is done.
  One is "has the four sections in order". The other is "names no tests/ path" (it requires at least 1 path).
  6.1 writes only 読む and 動かす, and `mise run test` is red between 6.1 and 6.2. The condition is vague and unverifiable.
- **Fix**: merge 6.1 and 6.2 into one task, using the seams already listed in the header note. Or rewrite 6.1's
  completion as: "`docs-structure.test.ts` fails only on `has the four sections in order` and `links only test paths` for this file,
  and `check:model-ids` passes". Also state that the full `mise run test` is expected red until 6.2.

### F5 [MEDIUM] Task 8.1: too large, boundary too narrow, depends too narrow
- **Problem**:
  - 8.1 has about 18 break-and-restore cases across 4 test files. The header lists the "大きくなりやすい" sub-tasks and omits 8.1.
  - Its "fix the test if breaking does not fail" step edits `llm-call-basics.test.ts`, `hello-task.test.ts` and
    `repo-policy.test.ts`. None of them is in 8.1's boundary (only the contract test is), and the task defers to
    asking the user, which makes ownership ambiguous.
  - 8.1 depends only on 5.3 (the major task says 6 and 7). Breaking `basics.ts` and `mise.toml`
    could run concurrently with 6.2 and 7.1 under `mise run check` and `mise run test`, and 7.1's completion runs `mise run check`.
- **Fix**: split 8.1 into 8.1a (`basics.ts` mutations) and 8.1b (hello, mise, workspace and test-config mutations), or add it to the
  split-seam list. Add the three test files to its boundary. Set its `_Depends:_` to `6.2, 7.1, 7.2`.

### F6 [MEDIUM] Task 8.2: the "network cannot connect" half of 6.5 is not exercised
- **Problem**: spec 6.5 requires the same pass/fail "with no API-key variable and **no network**". 8.2 removes only the
  key variables. plan "Requirements Traceability" points to R-4 plus the existing `verify-offline-contract.test.ts`, but that
  test checks composition only (its own header says the no-network run was measured once, in spec 001 R-3).
  Nothing shows the new unit tests still pass with the network down.
- **Fix**: add to 8.2 a run of `mise run test` (or `pnpm exec vitest run tests/unit/llm-call-*.test.ts`) under the same
  network-off method as spec 001 R-3, with the result in R-4. If that is deliberately waived, record the waiver.

### F7 [LOW-MEDIUM] Task 1.1: the RED memo has no persistent home
- **Problem**: 1.1 says to "メモする" the RED failure for R-2, but its boundary excludes research.md. After 1.2 the test is
  GREEN, so 3.7 cannot regenerate that evidence. The memo would live only in context, and 3.7's completion requires the
  `repo-policy.test.ts` RED entry.
- **Fix**: add research.md to 1.1's boundary and have 1.1 append the RED output to R-2 immediately. Or have 1.2 record it
  (1.2 already owns research.md), and state this in 1.1.

### F8 [LOW-MEDIUM] Task 5.2: hello's five fixed values are unspecified, and NFR 15 s depends on one
- **Problem**: 5.2 requires explicit values for `temperature`, `maxOutputTokens` and `maxRetries`, but gives none.
  The NFR (case b) of 15 s depends on `maxRetries`. research.md I-8 measured about 6 s at 2 retries, and exponential backoff
  makes 4 or more retries risk the limit. The 6.2 exercises ("maxRetries: 0 で速くなる") assume a baseline.
- **Fix**: specify the values (for example `maxRetries: 2`, a small `maxOutputTokens`, a low `temperature`), or say "use
  `DEFAULT_MAX_RETRIES`' value, not above 2".

### F9 [LOW] Task 4.1: the expected RED/GREEN state of 3.2 and 3.4 tests is imprecise
- **Problem**: 4.1 says the 3.4 tests "RED のまま残る" and 3.1 to 3.3 go GREEN. But 3.2's 2.5 test and
  3.4's attempt-count tests (4.1, 4.5) only need `maxRetries` passed through to the SDK, so 4.1 turns them GREEN. Only the
  `reason`, `attempts` and `CallFailedError` tests stay RED. An implementer may suspect a false pass or a bug.
- **Fix**: state the expectation as "only the `CallFailedError` classification tests stay RED until 4.2".

### F10 [LOW] Header: CP-C omits 7.1
- **Problem**: CP-C is "6.2 と 7.2 の完了後". 7.1 (AGENTS.md, README.md) is in the same wave and is not named.
- **Fix**: "after 6.2, 7.1 and 7.2".

### F11 [LOW] Task 7.1: completion misses gates that read AGENTS.md and README.md
- **Problem**: the completion runs only `mise run check`. But `repo-policy.test.ts` asserts AGENTS.md contains
  `node_modules/next/dist/docs/`. `docs-structure.test.ts` asserts README.md still shows `mise activate`, `mise run setup`
  and `git worktree add`. `check:model-ids` scans README.md.
- **Fix**: add `mise run test` and `mise run check:model-ids` to 7.1's completion, and say to keep those strings.

### F12 [LOW] Task 6.2: the doc path regex can fail on a glob
- **Problem**: `docs-structure.test.ts` `TEST_PATH` is `/\btests\/[\w./-]*\w/g`. Writing
  `tests/unit/llm-call-basics*.test.ts` (the form used in plan's diagram) captures `tests/unit/llm-call-basics`, which does not exist, and the
  test fails. 6.2 says "実在するパスだけ" without warning about globs.
- **Fix**: add "write full file paths; no globs and no wildcards" to 6.2.

### F13 [LOW] Task 2.2: completion does not prove the alias works
- **Problem**: "existing tests pass" is satisfied even if the `server-only` alias is wrong or absent. The first real
  evidence is at 4.3. That is acceptable for ordering but leaves 2.2 without an observable result.
- **Fix**: note "alias verified at 4.3" in 2.2. Or add a temporary check (a throwaway test importing `server-only`, removed
  before the commit).

### F14 [LOW] Tasks 1.3 and 1.4: probe location and pre-existing advisories
- **Problem**: 1.3's table has a "probe" column, which means running code, but no location is given. A probe file in the repo would
  violate the boundary. 1.4 does not separate advisories that already exist on `main` from those the new dependencies add. The base-branch
  rule in AGENTS.md says to report them separately.
- **Fix**: say that probes run from a scratch directory outside the repo (or via `node -e`). In 1.4, record the baseline advisory
  state (for example by checking `main` first) to separate new from pre-existing findings.

### F15 [LOW] Task 4.4 and 4.3: boundaries too narrow for likely fixes
- **Problem**: Biome checks `**/*.json`, so `package.json` and `pnpm-lock.yaml` formatting can fail `mise run check`, but
  neither is in 4.4's boundary. 4.3 (GREEN of the contract test) may need to fix `llm-call-basics-contract.test.ts`, which is not in its boundary.
- **Fix**: add `package.json` to 4.4 and the contract test file to 4.3, or say that out-of-boundary fixes need the user's consent.

### F16 [LOW] Task 5.3: destructive step and external blocker
- **Problem**: case (c) uses `ollama rm` on the user's model, which then needs a re-pull of a multi-GB file. 5.3 needs the user's Ollama, and 6.1
  and 8.x depend on it. The task says to ask the user, which is reasonable, but the gating is only in prose.
- **Fix**: offer a non-destructive way to get case (c) (for example a temporary local constant, as in research.md I-8's probe).
  Say that 6.1 must not start until 5.3 is resolved or the user explicitly defers (a)/(c).

### F17 [LOW] Task 7.2: the `grep '段 1'` check is a poor oracle
- **Problem**: steering files may legitimately say "段 1" (history, links to spec 001). The grep would flag legitimate text or
  miss stale text phrased differently.
- **Fix**: replace it with specific stale-state strings (for example "AI のコードはまだ無い") or a manual read.

### F18 [LOW] Sub-task `_Depends:_` is narrower than the major task's
- **Problem**: major 2 depends on 1, but 2.1 depends only on 1.2 (not 1.3, the premise check that may stop the plan). Major 7 depends
  on 5, but 7.1 and 7.2 depend on 5.2, and the parallel table says "前提 5.2". 7.1 writes the "Current state" and command table
  about hello before 5.3 has verified it, while 7.1 itself says to write only verified facts.
- **Fix**: make 2.1 depend on 1.3 and 7.1 depend on 5.3 (5.3 and 7.x remain disjoint, so the wave is unchanged). Or
  state explicitly that the sub-task depends override the major's.

### F19 [LOW, note for spec/plan owners, not a blocker] 4.3 and 4.6 versus the plan's last-attempt rule
- **Problem**: spec 4.3 and 4.6 speak of a "再試行しないエラー" with 1 attempt, and of telling "使い切った" apart from "再試行しないエラーだった".
  ADR-5 and plan "Error Handling" say that a non-retryable error at the last allowed attempt is reported as `retries-exhausted`.
  The plan documents this and the guide explains it, so this is a design choice, not a deviation. But no acceptance criterion covers it, so
  F3's test would be added with no requirement to trace.
- **Fix**: none needed for the tasks. Optionally add a spec note under 4.6.

## Summary

No finding sends the work back to spec.md or plan.md (F19 is a note only). The graph is acyclic, the boundaries
are legal, and coverage is 61/61. The fixes are to the task text: F1 to F6 should be repaired before approval,
and the rest are cheap to fold into the same pass.

VERDICT: NEEDS_FIXES
