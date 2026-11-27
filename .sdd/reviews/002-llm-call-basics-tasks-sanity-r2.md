# 002-llm-call-basics: task-graph sanity review, round 2 (final)

Reviewer: independent fresh-context review. Date: 2026-11-27.
Inputs read directly: spec.md, plan.md, tasks.md (revised), traceability.md, `tasks-generation.md`,
`tasks-parallel-analysis.md`, and the first review. I also read the repository files the tasks rely on
(`tsconfig.json`, `vitest.config.ts`, `mise.toml`, `docs-structure.test.ts`, `repo-policy.test.ts`,
`hooks-config.test.ts`, `verify-offline-contract.test.ts`, `check-model-ids.mjs`, the allowlist).
I recomputed the dependency, coverage, `_Traces:_` and boundary relations with a script (kept outside the repo).

## Mechanical checks that passed

- **Dependencies**: no forward references, no cycles, no missing IDs across the 28 sub-tasks
  (1.1 to 1.4, 2.1 to 2.2, 3.1 to 3.7, 4.1 to 4.4, 5.1 to 5.3, 6.1 to 6.2, 7.1 to 7.2, 8.1 to 8.4).
- **Coverage**: all 61 acceptance criteria (1.1 to 8.9) are in at least one sub-task `_Requirements:_`. None is extra.
- **Boundaries**: every `_Boundary:_` path is in plan.md's File Structure Plan. Every sub-task boundary is
  inside its major task's boundary, except major 4 (see F7).
- **RED before GREEN**: only dependencies and run config (1.x, 2.x) precede the tests. 5.1 (`mise.toml` `hello`)
  follows the 3.6 RED. 5.2 (`hello.ts`) follows the 4.3 GREEN. This matches plan "実装順の制約".
- **(P)**: 7.1 `{AGENTS.md, README.md}` and 7.2 `{tech.md, structure.md}` are disjoint from each other
  and from 5.3 and 6.x.
- **Design column**: for every REQ, the DES set in traceability.md equals the union of the sub-tasks' `_Traces:_`.

## First review: repair status

- F1 repaired: 2.1 runs `next build` and keeps the output in its Implementation Notes. 8.3 copies it to R-4.
- F2 repaired: the 2.5 test moved into 3.4's timed `describe` (3.2 says so, and 3.4 now carries 2.5).
- F3 repaired: 3.4 now has the retryable, retryable, non-retryable case, the `maxRetries: 0` not-retryable case, and
  the tag is correct.
- F4 repaired: 6.1's completion is concrete (see F8 for a fragility).
- F5 partly repaired: 8.1 was split into 8.1 and 8.2. 8.2 is fine. 8.1 has a stale sentence and a narrow `_Depends:_` (F2, F5 below).
- F6 repaired: 8.3 has the network-off run, with a stated waiver path.
- F7, F10 to F14, F17: repaired or acceptable.
- Not repaired but low and unchanged (F15, F16, F18): not re-raised, except F6 below.

## Findings

### F1 [MEDIUM] traceability.md is stale after the 3.4 change and the 8.1/8.2 split
- **Task / file**: `traceability.md` table rows REQ-002, REQ-006, REQ-008, and the "Gaps" section.
- **Problem**: the table is supposed to mirror the tasks' `_Traces:_`. Recomputed from tasks.md:
  - REQ-002 lacks `T-3.4`. Task 3.4 now carries 2.5 and `_Traces:_ REQ-002, ...`. The row lists only `T-3.2, T-4.1`.
  - REQ-006 lacks `T-8.3`. Task 8.3 has `_Traces:_ REQ-006, REQ-008, ...`.
  - REQ-008 lists `T-8.2` but task 8.2 now traces only `REQ-006`. REQ-008 lacks `T-8.4`, which traces `REQ-008`.
  - The "Gaps" bullet says "R-3: 8.1、R-4: 8.2、R-6: 8.3". After the renumbering it is R-3: 8.1 and 8.2, R-4: 8.3, R-6: 8.4.
- **Fix**: set REQ-002 to `T-3.2, T-3.4, T-4.1`. Add `T-8.3` to REQ-006. In REQ-008, replace `T-8.2` with `T-8.4`
  (keep `T-8.3`). Fix the R-n to task mapping in "Gaps". The Design column needs no change.

### F2 [MEDIUM] Task 8.1: a stale sentence contradicts its own boundary
- **Task**: 8.1 completion: "直したことを R-3 に書く（境界の 3 つのテストファイルに限る）".
- **Problem**: after the split, 8.1's boundary has two test files (`llm-call-basics.test.ts`,
  `llm-call-basics-contract.test.ts`). The "3" is a leftover from the unsplit task, which included
  `hello-task.test.ts` and `repo-policy.test.ts` (now in 8.2). An implementer cannot tell whether editing `hello-task.test.ts`
  from 8.1 is allowed.
- **Fix**: write "境界の 2 つのテストファイル" (or name them).

### F3 [LOW-MEDIUM] Tasks 7.1 and 7.2 marked (P): self-contained verification is not met against 6.1
- **Task**: 7.1, 7.2 (`_Depends:_ 5.3`) and 6.1 (`_Depends:_ 5.3`).
- **Problem**: 6.1, 7.1 and 7.2 are all eligible once 5.3 is done, and their boundaries are disjoint. But 7.1's completion
  runs `mise run test`, which fails while 6.1 is done and 6.2 is not (6.1's own completion says two `docs-structure`
  tests are red). So 7.1 cannot be verified independently of 6.1, which breaks rule 3 of `tasks-parallel-analysis.md`. The only guard is
  prose in the wave table ("別の波にする"). The graph itself allows it. The wave table says "6.1 の記録を使うため別の波"
  but the 6.1 dependency is on 5.3, not on the wave.
- **Fix**: make 7.1 and 7.2 depend on `5.3, 6.2`, which keeps them parallel to each other and removes the race. Change the
  wave table's prerequisite to "5.3, 6.2". Alternatively, drop 7.1's `mise run test` from the (P) completion and run it in 8.3.

### F4 [LOW-MEDIUM] Task 8.1: `_Depends:_ 5.3` lets it run beside 6.2, 7.1 and 7.2
- **Task**: 8.1 (and 8.2 transitively).
- **Problem**: 8.1 breaks `basics.ts` and the tests, then runs `mise run test`. 6.2, 7.1 and 7.2 also run `mise run check` or `test`
  and `check:model-ids`. The major task says 8 depends on 6 and 7, but the sub-task edges do not. The first review (F5) asked for
  `6.2, 7.1, 7.2`; the split did not change this. In a fleet run, a temporarily broken `basics.ts` fails someone else's gate.
- **Fix**: set 8.1 `_Depends:_` to `5.3, 6.2, 7.1, 7.2`.

### F5 [LOW] Tasks 3.5 and 3.6: no timeout for tests that spawn child processes or `mise`
- **Problem**: plan "spec への追記 4" excludes the contract test and `mise` tests from the 1 s limit and says they follow the
  existing convention (120 s). 3.5 spawns a Node child that loads `ai` (twice), and 3.6 follows `verify-offline-contract.test.ts`
  (which runs `mise tasks ls`). Neither task says to set the 120 s timeout. Vitest's default 5 s can flake on a cold start.
- **Fix**: add to 3.5 and 3.6: "子プロセス・mise を起動するテストは 120 秒のタイムアウトを付ける（plan の追記 4）".

### F6 [LOW] Task 5.3: a failure there needs edits outside its boundary
- **Problem**: 5.3's boundary is research.md only. Its completion says that if the elapsed time exceeds 15 s, or (a) fails, the
  task is not complete and `maxRetries` or the base URL should be revisited. Those edits are in `scripts/hello.ts`
  (5.2's boundary). Ownership of the fix is undefined, and CP-B has already been committed by then.
- **Fix**: say that 5.3 may return to 5.2 for a fix, and that the fix is recorded as a new commit after CP-B.

### F7 [LOW] Major task 4: header lists differ from the sub-tasks
- **Problem**: major 4's `_Boundary:_` omits files that 4.3 and 4.4 own (the contract test, `tsconfig.json`, the other tests).
  Its `_Requirements:_` contains 6.2 (no sub-task of 4 carries it) and lacks 1.3 and 6.4 (4.3 carries them).
  This is a container-only inconsistency; no sub-task is wrong.
- **Fix**: make the major's lists the union of its sub-tasks.

### F8 [LOW] Task 6.1: "exactly two docs-structure tests fail" is brittle
- **Problem**: the two failures hold only if 6.1 writes no `tests/` path. The "読む" text asks to explain the injected model
  (mock tests), and if the author names `tests/unit/llm-call-basics.test.ts` there, the "links only test paths" test
  passes and the stated expectation is false. The sentence under "6 節" ("次の順で") also lists only the first four names.
- **Fix**: say "at most these two fail, and nothing else changes". Then list the six `##` headings in order once.

### F9 [LOW] Task 5.2: dangling reference for the Ollama base URL
- **Problem**: 5.2 says the base URL was confirmed by "タスク 1.3 の調査と research.md I-8・ADR-1". Task 1.3's claim list
  does not include the Ollama base URL, so the reference to 1.3 is empty.
- **Fix**: drop "タスク 1.3 の調査と" or add the base URL check to 1.3.

### F10 [LOW] Header: the "large sub-task" list names 3.3 but not 3.4, and 3.3's seam fits 3.4
- **Problem**: the list is "3.3、4.1、5.2、6.1" with 3.3 split as "成功系／失敗系". 3.3 is the rejection table, so "success/failure"
  fits the retry task 3.4 better. 3.4 carries about 10 scenarios across `maxRetries` values and is the largest test task. 8.1 has
  about 12 break-and-restore cycles and is also not listed.
- **Fix**: list 3.4 (seam: success-after-retry / exhausted and not-retryable) and 8.1 in the header, and correct the 3.3 seam.

### F11 [LOW, prior: low] Task 3.7 depends on a memo in Implementation Notes
- **Problem**: 3.7 must put 1.1's RED in R-2, but 1.1 is GREEN by then. The only source is the 1.1 memo in major 1's
  Implementation Notes (a repair of the first review's F7). 3.7's text does not say to copy it from there.
- **Fix**: add "1.1 の RED は、タスク 1 の Implementation Notes のメモから写す" to 3.7.

## Contradictions with spec and plan

None found. The 8.x numbering is consistent in tasks.md (header lines 22 and 44, 2.1 note, 8.3, 8.4). Only traceability.md is stale (F1).

## Summary

Nothing sends the work back to spec.md or plan.md. The graph is acyclic, test-first order holds, boundaries are legal and
coverage is 61/61. The first review's F1 to F6 are repaired. The repairs left one real inconsistency in traceability.md (F1)
and one contradiction inside 8.1 (F2); F3 and F4 are dependency edges that the repairs did not tighten. All fixes are
small text edits in tasks.md and traceability.md.

VERDICT: NEEDS_FIXES
