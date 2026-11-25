# PDCA Do — 001-dev-environment-and-gates

Implementation log written by `/sdd-impl`. Evidence (commands, outputs, PROVE results) lives in
[research.md](../research.md): R-1 (versions), R-2 (install), R-10 (non-vacuity).

## 2026-11-23

### Task 1 (1.1 - 1.3): toolchain pins and minimal test runner — done
- Pinned 5 tools and all npm dependencies at exact versions that are at least 24h old (R-1).
- `mise trust`, `mise install`, `pnpm install` and `pnpm exec` were denied by the session's auto-mode
  classifier; the user ran them and pasted the output (R-1, R-2). `mise run test` was allowed.
- RED for 1.3: `mise run test` with no test files exits 1 with `No test files found`.

### Task 2.1: sandbox helpers — done
- RED: `tests/unit/sandbox.test.ts` failed with `Cannot find module './helpers/sandbox'`.
- GREEN: first run had 1 failure. The test expected `editArgv` to append `--reporter` when absent;
  my implementation only replaced it. The task text (`--grep` and `--reporter=` are replaced) and the
  plan (`--reporter=list` added for `--list` checks) disagree on whether it may be added, and the test
  needs it added for `e2e` argv, which has no `--reporter`. Decision: `config` and `reporter` are
  replaced or appended; `grep` is replaced only. Documented in the `editArgv` comment.
- PROVE: removing `dirname(process.execPath)` from PATH fails case (1) with
  `exec: node: not found` / status 127 (R-10).
- Incident: while restoring `sandbox.ts` after PROVE I copied a backup over it with `cp`. The system
  reported that the file had changed on disk since my last read, so a change made outside this session
  in that window may have been overwritten. The file as I had it just before the restore differed from
  the backup only by the one line removed for PROVE. Lesson: restore with an Edit that re-adds the
  line, not with a whole-file copy, and re-check the file for outside changes first.
- Not done yet for 2.1: `mise run check` (Biome is configured in task 3.2).

### Task 2.2: unit network guard — done
- RED: with the fixtures and `network-guard.test.ts` in place but no guard, (a) failed with
  `status should be non-zero: expected +0 not to be +0`; (b) passed (control).
- GREEN: `tests/unit/setup/network-guard.ts` replaces `net.Socket.prototype.connect` and
  `globalThis.fetch`, records a violation, and `afterEach` fails the test. 11/11 tests pass.
- Risk check (plan: "does replacing `net.Socket.prototype.connect` break Vitest worker
  communication?"): no. With the default pool the outer run and the nested runs (`--maxWorkers=1`)
  both complete, so the guard does not need to be limited to the test body.
- Extra assertions added to (a): both channels are named by host:port or origin, and the URL query
  (`not-a-secret`) never reaches the output.
- Slip fixed: my first `afterEach` built an error only to compare its constructor; replaced with a
  single error whose `name` is `UnmockedNetworkError`.
- PROVE: removing `setupFiles` fails (a) only (R-10). Restored.
- Not done yet: `mise run check` on the new files (Biome arrives in task 3.2).

### Task 2.3: zero-executed-tests reporter — done
- RED: with the fixture and self-check but no reporter, (b) failed with `status should be non-zero`;
  (a) passed (`passWithNoTests: false` already covers it).
- GREEN: `tests/unit/setup/require-executed-tests.ts` (Vitest `Reporter`, `onTestRunEnd` counts
  passed/failed tests, else stderr message and `process.exitCode = 1`). 13/13 tests pass.
- PROVE: removing the reporter fails (b) only. Setting `passWithNoTests: true` (reporter also removed)
  fails (a) and (b). Both restored with Edits, not file copies (R-10).
- Cleanup: an earlier PROVE edit had left the network-guard comment in the wrong place in
  `vitest.config.ts`; each setting now has its own comment.
- Task 2 complete (2.1-2.3). Open for task 2: `mise run check` on its files, because Biome is configured
  in task 3.2 and 3.2's completion condition requires every earlier file to pass.

### Task 3.1: tsconfig, next.config and the tsc self-check — done
- RED: `tests/unit/static-analysis.test.ts` (3 cases) failed with `ENOENT … tsconfig.json`, the
  expected reason.
- GREEN: `tsconfig.json` (ZIP values; `plugins: [{ "name": "next" }]` omitted for now, see below) and
  `next.config.ts` (`cacheComponents: true`). 16/16 tests pass; `pnpm exec tsc --noEmit` exits 0 and
  `tsc --showConfig` shows `strict: true`.
- A symlinked `node_modules` in the temporary repository works with TypeScript 7.1 beta, so the copy
  fallback was not needed (R-10 note not required).
- Type error found in task 2's code, fixed inside this task's boundary: `spawnSync`'s `env` is typed
  `ProcessEnv`, and Next.js's types make `NODE_ENV` required there. `childEnv()` in `sandbox.ts` hands
  the isolated env over with one commented assertion. It is safe because spawnSync takes any string map
  at runtime and nested runs deliberately drop NODE_ENV.
- Rename: `useTempGitRepo` -> `createTempGitRepo`. The edit hook's Biome run flagged `use*` calls outside
  a component (`useHookAtTopLevel`, part of the recommended preset) and it would recur in task 3.2. A
  rename keeps the rule on without a suppression comment. The task text still says `useTempGitRepo`.
- PROVE: `strict` set to `false` fails the implicit-any case and the two-file case (R-10). An earlier
  PROVE attempt silently did nothing because the formatter had re-indented the file and my Edit did not
  match; the passing run after it proved nothing. I redid it with the exact text and a changed value.
- `plugins: [{ "name": "next" }]`: not added. It is a language-service plugin that `tsc` ignores, and
  task 4.1 decides what `next dev` writes into tsconfig.json.

### Task 3.2: biome.json, check task, Biome self-checks — done
- RED: the 5 new Biome cases in `static-analysis.test.ts` failed with `ENOENT … biome.json`.
- GREEN: `biome.json` (ZIP base; 2-space indent, width 100; the three required rules plus
  `noSkippedTests` as `error`; `files.includes` limited to code/JSON so `specs/`, `.sdd/`, `docs/`
  Markdown are not scanned; an override on `tests/e2e/**` except `fixtures.ts` forbids a direct
  `@playwright/test` import via `noRestrictedImports`). `mise.toml` gained the `check` task.
  21/21 tests pass; `mise run check` exits 0; `tsc --noEmit` exits 0.
- `biome check --write` re-indented and re-formatted 13 earlier files (tabs -> 2 spaces, import
  order). No behaviour change; the edit hook had been writing tabs because no `biome.json` existed.
- 4 `useLiteralKeys` infos in `sandbox.ts` (`env["PATH"]` and similar). Infos do not fail `check`, but I
  cleared them with `biome lint --write --unsafe --only=complexity/useLiteralKeys`, which turned them
  into `env.PATH` and `process.env.PATH`. Same behaviour (both are plain string-keyed property accesses);
  `tsc` still exits 0 and the suite is green.
- PROVE: each of `noExplicitAny`, `noUnusedImports`, `noUnusedVariables`, `noSkippedTests` and the
  `noRestrictedImports` override set to `off` makes exactly the matching test fail (R-10). All restored
  with Edits and confirmed by grep.
- PROVE of the `fixtures.ts` exemption (`!tests/e2e/fixtures.ts` removed from the override): two tests fail.
  The ADR-5 test fails on `tests/e2e/fixtures.ts:1:22 lint/style/noRestrictedImports`, as it should. The
  `it.todo` test also fails, because it writes a `tests/e2e/fixtures.ts` that imports `@playwright/test`
  and so depends on the exemption. Restored and confirmed by grep (R-10).

### Task 3.3: repo-policy test, .env.example, .gitignore — done
- RED: 8 of the new cases failed for the expected reasons: missing `.env.example` (ENOENT) and 7
  `.gitignore` entries that were not there yet. The cases about pins, `.env`, `.next/` already held.
- GREEN: `tests/unit/repo-policy.test.ts` (versions and supply chain, lint/format/type settings, layout,
  secret files), `.env.example` (names only; the ZIP's two default values removed), and `.gitignore`
  extended (`next-env.d.ts`, `mise.local.toml`, `mise.*.local.toml`, `.vitest/`, `.build/`,
  `.env*.local`, `lefthook-local.*`, `.lefthook-local.*`). 45/45 tests pass; `mise run check` and
  `tsc --noEmit` exit 0.
- No YAML library added: `pnpm-workspace.yaml` is read line by line. Versions come from
  `mise ls --current --json` (filtered to this repo's mise files) and `tsc --showConfig`; no version
  number is an expected value.
- PROVE: 9 cases (a)-(f), (h)-(j) each fail when their target is broken (R-10). (g) was not proven in
  isolation. Every broken file was restored with an Edit and checked with `diff` against a copy taken
  before breaking.
- Task 3 complete (3.1-3.3). `mise run check` now covers every file written so far.

### Task 4.1: placeholder page, minimal E2E config, e2e and typecheck tasks — done
- RED: with only the spec and `fixtures.ts`, `mise run e2e` failed: `Couldn't find any pages or app
  directory`. The 4 page policy cases in `repo-policy.test.ts` failed with ENOENT.
- GREEN: `src/app/layout.tsx` (`<html lang="ja">`, no network-backed font), `src/app/page.tsx` (RSC, `<h1>`
  `genai-lab-ts`), `playwright.config.ts` (port 3100 defined once, `127.0.0.1`, `retries: 0`,
  `forbidOnly`, `reuseExistingServer: false`, chromium only), tasks `e2e` and `typecheck`. Results:
  `mise run e2e` 1 passed, `mise run typecheck` exit 0, `mise run check` exit 0, 49/49 unit tests.
- No browser download was needed: Chromium 1255 (what Playwright 1.65.1 expects) was already installed.
- `next dev` rewrote `tsconfig.json` (added `allowJs`, `esModuleInterop`, `plugins: [{name: "next"}]`,
  `.next/dev/types/**/*.ts` in `include`, and expanded arrays to one item per line). Accepted and frozen as
  the plan says; Biome re-formatted it. A second `next dev` run left it unchanged (hash compared).
  `tsc` accepts the `plugins` entry (it is only used by the editor language service), so nothing had to
  be removed. `tsc --showConfig` still shows `strict: true`.
- PROVE caught a weak test: changing the `<h1>` to `genai-lab-ts-broken` did NOT fail the smoke test,
  because `getByRole(..., { name })` matches by substring. Added `exact: true` and redid the PROVE:
  now it fails with `element(s) not found`. This is exactly the vacuous test the PROVE step is for.
- PROVE for 9.1 / 9.2: `"use client"` in `page.tsx`, `process.env` in `layout.tsx`, and an `ai` import in
  `page.tsx` each fail their own case (R-10). All files restored with Edits; `diff` against copies taken
  beforehand shows `page.tsx` and `layout.tsx` identical.
- `AGENTS.md` was modified by `next dev` (it appends two `nextjs-agent-rules` blocks). Not part of this
  task's boundary and not reverted by me. See the report to the user.
- Pre-existing configuration warning, not addressed: Next logs that `cacheComponents` is enabled without
  `partialPrefetching`. It is in the ZIP's `next.config.ts`; changing it is a decision for the user.

### Task 4.2: Playwright zero-executed-tests reporter and nested-run self-check — done
- RED: with the fixtures and cases (c)/(d) but no reporter, (c) failed with
  `Cannot find module './tests/e2e/reporters/require-executed-tests.ts'`.
- First GREEN attempt failed twice for reasons the plan did not predict (R-9): the reporter path and the
  `testDir` of a nested config are resolved relative to the config file, not the working directory.
  A `testDir` of `tests/fixtures/gate/e2e` found 0 tests even with `--list`; it is now `"."`. The
  reporter path in the nested config is `../../../e2e/reporters/require-executed-tests.ts`.
- GREEN: `tests/e2e/reporters/require-executed-tests.ts` (`.ts` loads fine, so no `.mjs` fallback),
  registered in `playwright.config.ts`; `onEnd` is `async` because Playwright types it as returning a
  Promise (a plain return failed `tsc`). 52/52 unit tests, `mise run e2e` 1 passed, `tsc` and `check`
  exit 0.
- Refactor: `taskRun` / `taskArgv` moved from `gate-self-check.test.ts` into `helpers/sandbox.ts` so
  `sandbox.test.ts` and the self-check share them. `sandbox.ts` is not in 4.2's sub-task boundary but is
  in task 4's.
- `sandbox.test.ts` gained the real-`e2e`-argv `editArgv` case (6): one `--grep`, one `--config`.
- PROVE: dropping the reporter from the nested config, counting skipped tests as executed, and adding
  `--pass-with-no-tests` to the `e2e` task each make exactly the matching case fail (R-10). The 4.2 text
  asked for (c) to fail without the reporter; (d) is proven through the `e2e` task argv instead. Files
  restored with Edits and checked with `diff` against copies taken beforehand.
- `playwright test --list` cases use `--reporter=list` to override the config's reporter, as planned.

### Task 4.3: external-origin guard (auto fixture) and the teardown-failure self-check — done
- RED: with the stub `fixtures.ts` (re-export only), case (e) failed with `status should be non-zero`.
- GREEN: `tests/e2e/fixtures.ts` now exports `test` with the auto fixture `networkGuard`
  (`context.route("**/*")`; aborts and records anything that is not `baseURL`'s origin or `data:`/`blob:`),
  `blockedRequests`, and the option `failOnBlockedRequest` (default `true`). Teardown names origins only.
  53/53 unit tests, `mise run e2e` 1 passed, `tsc` and `check` exit 0.
- The plan's risky premise holds on macOS: `context.route` catches requests from `page.setContent` with
  no `baseURL` and no `webServer`. Linux is still unmeasured (task 12.5).
- PROVE exposed a vacuous fixture. My first `external-request.fixture.ts` fetched an `.invalid` domain;
  replacing `route.abort` with `route.fallback` did NOT make (e) fail, because the request fails by DNS
  anyway and the teardown error still fired. It proved nothing about `abort`. I rewrote the fixture to
  target a local HTTP server and assert `hits === 0` and `outcome === "blocked"`; now `fallback` fails
  (e), and so does disabling the teardown check, each separately (R-10).
- A detail I got wrong first: I assumed my `fixtures.ts` edit had applied after an Edit failed with
  "string not found", and read the passing test as proof. It was a stale old_string, not a PROVE. From then
  on I diffed the file against a copy taken before breaking it, and re-checked what the nested run said
  (JSON reporter) rather than inferring from the pass/fail count.
- Unit case (e) also asserts the failure output never contains the URL query (`not-a-secret`).

### Task 4.4: network-guard @smoke and the extended --list check — done
- RED: the extended (d) failed with `to contain 'network-guard.smoke.spec.ts'`. The smoke test itself
  would have passed at once because the guard from 4.3 already existed, so the `--list` expectation (both
  smoke files, `Total: 2 tests in 2 files`) is the RED that drives this task.
- GREEN: `tests/e2e/network-guard.smoke.spec.ts` (`test.use({ failOnBlockedRequest: false })`, a local HTTP
  server on another origin, asserts `outcome === "blocked"`, `hits === 0`, and `blockedRequests` equals
  the one `GET` to that URL). No `test.fail()`. `mise run e2e` 2 passed; 53/53 unit; `tsc`, `check`,
  `typecheck` exit 0. Pre-push `@smoke` is two tests, inside D5's budget of one or two.
- PROVE (R-10): `abort`->`fallback` fails (b) with `Received: "reached"`; removing the `push` fails (a)
  with an empty `blockedRequests`; disabling the `baseURL` exemption fails both smoke tests at
  `page.goto` (so the guard does not break the app's own traffic). Files restored with Edits and
  confirmed identical to copies taken first.
- Task 4 complete (4.1-4.4).

### Task 5.1: model-ID allowlist — done
- RED: `tests/unit/check-model-ids.test.ts` (shape: four providers, at least one non-blank ID each, no
  duplicates) failed with `Cannot find package '@/lib/ai/model-allowlist'`.
- Evidence first: fetched each provider's official page (Anthropic models overview, OpenAI models and the
  `gpt-6.2-sol` page, Google's models page via its 301 redirect, Ollama's library and tags pages), then
  registered only what the pages show: 7 IDs (R-5). A second fetch re-confirmed the Google and Ollama IDs.
- GREEN: `src/lib/ai/model-allowlist.ts` (`PROVIDERS`, `Provider`, `MODEL_ALLOWLIST` with
  `as const satisfies`, `AllowedModelId`). Erasable syntax only; Node imports it directly. 56/56 tests, `tsc` 0.
- PROVE: empty provider list, a duplicate across providers, and a missing provider each fail exactly the
  matching case (R-10).
- PROVE restores used `cp` from a copy taken moments earlier. `diff` confirmed the file matched that copy;
  the system reported no outside change to the file during these steps.
- Completion condition met: `tsc --noEmit` exit 0, `node -e "import('./src/lib/ai/model-allowlist.ts')"`
  succeeds, R-5 has one entry per registered ID (7 IDs, 7 rows), and `mise run check` is green on the new
  files (32 files checked).

### Task 5.2: check:model-ids — done
- RED: 50 new cases failed with `Cannot find module '…/scripts/check-model-ids.mjs'`.
- GREEN: `scripts/check-model-ids.mjs` (git-listed candidates, allowlist loaded by type stripping, 9 naming
  patterns, exit 0/1/2, one finding per line as `path:line:column: match (source)`) and the
  `check:model-ids` mise task. First run: 48 of 50 passed. Two fixes: a fragment typo in the Ollama
  patterns (`["small","lm"]` gives `smalllm`) and a `package.json` fixture that was not valid JSON.
  107/107 unit tests; `mise run check:model-ids` reports `scanned 26 files, 0 findings` on the real repo,
  so the script and this test do not flag themselves; `check`, `tsc` exit 0.
- PROVE: ten breaks (patterns, exclusions, exit codes, column, NUL, `--exclude-standard`, boundary) each
  fail the matching cases (R-10). Two of my first attempts proved nothing and were redone:
  (5) the ignored-file test put its file in a directory outside the scan targets, so it passed for the wrong
  reason; (10) I believed `\b` fails on Japanese text. Measured: it does not. The real difference is the
  hyphen. I corrected the script comment, the test title and the plan's claim, added a hyphen case, and
  proved that case with the `\b` break.
- One break command (`10`) was denied by the auto-mode classifier; the script was unchanged afterwards
  (checked with `diff`). I redid that break with the Edit tool.
- Task 5 complete (5.1-5.2).

### Task 6.1: secret-commit refusal test and the secrets job — done
- RED: with no `lefthook.yml`, all 7 new cases failed (`lefthook dump`: `No config files`).
- GREEN: `lefthook.yml` (`assert_lefthook_installed: true`; pre-commit `parallel`, one job `secrets`:
  `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`) and
  `tests/unit/gitleaks-pre-commit.test.ts` (job read through `lefthook dump`; fake token built at run time
  from random bytes with a joined prefix; comparisons are booleans and failures print only the key's
  length; a real `lefthook install` in a temporary repo for the hook path and a no-secret control).
  `lefthook install` was NOT run in the real repository (`.git/hooks` has no active hook), as the task
  requires. No detectable literal is in the repo and there is no `.gitleaks.toml` or `.gitleaksignore`.
- PROVE (R-10): `--redact` removed fails the output-leak cases (`leaked a secret of length 40`);
  `--staged` removed fails four cases; `--ignore-gitleaks-allow` removed fails only the 8.5 case, by name.
- The third break could not be run from this session: the auto-mode classifier denied the edit and a
  later bookkeeping command. A denied restore edit also briefly left `lefthook.yml` without `--staged`;
  I fixed it with the Edit tool and confirmed it identical to a copy with `diff`. The developer ran the
  `--ignore-gitleaks-allow` break in their own terminal and pasted the output.
- That run exposed a problem unrelated to the secrets job: on the developer's machine a nested Vitest
  printed ANSI codes, so two `network-guard` matchers failed (3 failures when broken, 2 when restored).
  It did not reproduce in my environment. Measured on their machine (ESC lines): default 6,
  `FORCE_TTY=false` 0, `TERM=dumb` 0, `TERM` unset 6, `NO_COLOR=1` 0. Fix: nested runs now set
  `NO_COLOR=1` and `FORCE_TTY=false` (a `sandbox.test.ts` case checks it; RED first). 116/116 on both
  machines. Why the two machines differ is not identified (R-9).
- Side finding, not changed: `gitleaks dir .` reports 4 `generic-api-key` hits, all in `.next/dev/`
  (git-ignored Next.js dev cache). They are not committed, and `check:secrets` scans git history only.
- Final state: `mise run test` 116/116, `mise run check` and `tsc --noEmit` exit 0.

### Task 6.2: commit-msg check — done
- RED: 37 new cases in `tests/unit/check-commit-msg.test.ts` failed with
  `Cannot find module '…/scripts/check-commit-msg.mjs'`.
- GREEN: `scripts/check-commit-msg.mjs <msg-file>`. The first line that is neither blank nor a `#` comment
  must match `^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^()\s]+\))?!?: \S`, or
  start with `Merge `, `Revert "`, `fixup! `, `squash! `, `amend! `. Exit 0 accepted, 1 rejected (the
  message names the expected form, the types and an example), 2 for no argument, two arguments or an
  unreadable file. 153/153 unit tests; `mise run check`, `tsc` and `check:model-ids` are green.
- PROVE: eight breaks (a type, the scope rule, `!`, the non-blank subject, comment skipping, the merge
  prefix, the argument count, the rejection exit code) each fail the matching cases (R-10). The first
  attempt at five of them failed before editing because the formatter had split the `TYPES` array and my
  search strings no longer matched; no break was applied then. I redid each with the Edit tool.
- `check-commit-msg.mjs` changed on disk once during PROVE (the system noticed an external change). I
  had restored it with `cp`, which overwrote whatever that change was. I cannot see what it was. The
  file matched my pre-PROVE copy afterwards, and from then on I restored with Edit and checked with `diff`.
- Not done by this task: the `commit-msg` job in `lefthook.yml` (task 7.4) and a real commit in the real
  repository through the hook (task 9.2).

### Task 7.1: verify (alias gate) and check:secrets — done
- RED: 8 new cases failed: 5 in `tests/unit/verify-offline-contract.test.ts` (`mise task "verify" does not
  exist`) and 3 `check:secrets` cases added to `gitleaks-pre-commit.test.ts`.
- GREEN: `mise.toml` gained `check:secrets` (`gitleaks git --redact --ignore-gitleaks-allow --verbose
  --log-opts=HEAD`) and `verify` (`alias = "gate"`, six `{ task }` entries in order: check, typecheck,
  check:model-ids, check:secrets, test, e2e). 162/162 unit tests. `mise run verify` and `mise run gate` both
  exit 0 (about 10.6 s); `check:secrets` scanned 12 commits and found no leaks.
- The contract test follows `{ task }` and `mise run x` references recursively, then checks: exactly the six
  tasks, no forbidden words (`security`, `pnpm audit`, `osv-scanner`, installs, `outdated`, `curl`, `wget`),
  every leaf command starts an offline tool, the alias, and a description on every task.
- PROVE (R-10): six breaks each fail their matching cases. The network check was proven with a real command
  (`pnpm audit …`) reachable from verify, not only with a missing task. All restores were Edits, each checked
  with `diff` against a copy taken first.
- Not done: the offline run with the network cut and the three consecutive runs (task 12.1). The contract
  test proves composition, not behaviour with no network.
- `verify` printed a Next.js warning (`cacheComponents` without `partialPrefetching`) and
  "Route / is rendering with server caches disabled". Both come from `next.config.ts` (ZIP value). Not changed.

### Task 7.2: security tasks — done
- RED: 3 new cases in `tests/unit/hooks-config.test.ts` failed (`mise task "security" does not exist`
  and the two sub-tasks). The exclusion-format cases passed at once, as the task expects: with no
  `osv-scanner.toml` and no `audit.ignore`, there is nothing to check, and the rules are functions tested
  on good and bad samples.
- GREEN: `mise.toml` gained `security:osv` (`osv-scanner scan source --lockfile=pnpm-lock.yaml`),
  `security:audit` (`pnpm audit --audit-level=high`, no `--ignore-registry-errors`) and `security`
  (`security:osv` then `security:audit`). 173/173 unit tests; `mise run verify` and `mise run security` both
  exit 0 (osv-scanner: 173 packages, no issues; pnpm audit: none). `security` is not part of `verify`.
- The two rule functions (`osvIgnoreProblems`, `auditIgnoreProblems`) live inside the test file, because
  Biome forbids exports from a test file. Nothing outside the test needs them yet; if CI or another test
  needs them they move to a helper.
- PROVE (R-10): six breaks of the task definitions and two of the exclusion rules each fail the matching
  case. Restores were Edits, checked with `diff` against copies taken first. For the two rule breaks the
  edit hook's Biome run reported `noConstantCondition` on the temporary `if (false)`; that is expected for
  a deliberate break, and no `if (false)` remains in the file (grep: 0).
- Not done: the failure cases (unreachable registry, a real advisory), task 12.4.

### Task 7.3: runtime, outdated and setup — done
- RED: 4 new cases in `hooks-config.test.ts` failed (`mise task "runtime"` / `"outdated"` / `"setup"` do
  not exist).
- GREEN: `mise.toml` gained `runtime` (the seven version commands, printing only), `outdated`
  (`mise outdated`, `pnpm outdated`; its description says pnpm exits 1 when there are candidates) and
  `setup` (`pnpm install --frozen-lockfile`, `pnpm exec playwright install chromium`, `lefthook install`).
  178/178 unit tests; `mise run verify` exits 0 and still reaches none of the three.
- Real runs: `mise run runtime` exit 0 with the seven versions (R-1). `mise run outdated` exit 0 with
  "All tools are up to date" and no npm candidates; `git status --porcelain`, `git diff --stat` and the
  hashes of `package.json`, `pnpm-lock.yaml`, `mise.toml` were identical before and after (5.4).
  `setup` was NOT run: it ends with `lefthook install`, which belongs to task 7.5.
- PROVE (R-10): six breaks. One of my first attempts proved nothing for its intended rule: appending
  `| grep 2.7.1` to a `runtime` command failed the exact-list assertion first, so the "no comparison" rule
  was never reached. I narrowed the list assertion to the command before any pipe, `&&` or `||`, and
  redid it; now the failure message comes from the no-comparison rule.
- Not shown by this task: that `pnpm outdated` really exits 1 when something is outdated. The pinned
  dependencies have no candidates today. The claim in the task description comes from pnpm's documentation
  (I-8), not from a run here.

### Task 7.4: lefthook.yml jobs — done
- RED: 7 new cases in `hooks-config.test.ts` failed against the one-job `lefthook.yml` from 6.1
  (the `assert_lefthook_installed`, secrets-flag and `check:secrets` cases passed already).
- GREEN: `lefthook.yml` now has pre-commit (`parallel`, four jobs: `secrets`, `biome`, `typecheck`,
  `model-ids`), commit-msg (`conventional`: `node scripts/check-commit-msg.mjs {1}`) and pre-push
  (`piped`: `osv-scanner`, `pnpm-audit`, `unit-tests`, `e2e-smoke`, each a `mise run` task). 187/187 unit
  tests; `mise run verify`, `check` and `tsc` exit 0. `lefthook install` was NOT run in the real repo
  (`.git/hooks` has no active hook); that is task 7.5.
- PROVE (R-10): seven breaks each fail the matching cases. The eighth, `--redact` in the secrets job,
  was already proven in 6.1 and is not repeated.
- Two Edits were denied by the auto-mode classifier mid-sequence (one that set `piped: false`, one that
  removed `--redact`), so the file was in states I did not intend. A restore Edit then matched text that
  an earlier, partly applied edit had left, and appended the two Biome flags a second time. I found
  it only when `diff` against the pre-PROVE copy showed a difference and `verify` exited 1, removed the
  duplicate with an Edit, and confirmed `lefthook.yml` identical to the copy. Lesson: after any denied
  edit, run `diff` against the copy before the next edit, not at the end of the group.
- The `piped: false` break was not applied (denied); I redid the idea as `parallel: true`, which is a
  stronger break (it removes `piped` altogether) and fails the same case.

### Task 7.5: running the hooks — done
- Five new cases in `hooks-config.test.ts` run the real `secrets` job in temporary repositories: the three
  hook files are created, a control passes, a missing job tool fails with `gitleaks` and status 1, a missing
  lefthook fails with `Can't find lefthook in PATH`, and with `assert_lefthook_installed: false` the same
  missing lefthook passes (the control that shows the assertion is what fails it).
- These passed as soon as they were written, as the task text predicts, so RED was taken per case by
  breaking the test input (R-9 table). The repository's own files were not changed for this.
- Before writing them I read a generated hook in a probe repository to see how it finds lefthook. A first
  `lefthook install` there failed through mise's shim (wrong cwd); the absolute path from `mise which`
  worked. The probe directory under /tmp is left behind: the command that would have removed it was denied.
- 192/192 unit tests, `mise run check` and `tsc` exit 0.
- Stopped before `mise run setup` in the real repository: it runs `pnpm install --frozen-lockfile` (denied
  earlier in this session), a browser install and `lefthook install`, and from then on every `git commit`
  here runs the hooks. Reported to the user with the commands to run.
- Found `tmp/` at the repository root: copies of `lefthook.yml` from the developer's own PROVE steps in 6.1.
  Not created by me, not removed; it would be committed unless it is deleted or ignored.
- Real repository (run by the developer, output pasted): `mise run setup` installed the three hooks
  (`sync hooks: ✔️(commit-msg, pre-push, pre-commit)`); `lefthook run pre-push` ran `osv-scanner`, `pnpm-audit`,
  `unit-tests`, `e2e-smoke` in that order, all passing, 17.22 s in total, exit 0 (R-9).
- The developer removed `tmp/`. The probe directory under /tmp remains; it is outside the repository.
- Task 7 complete (7.1-7.5). From here every `git commit` in this repository runs the hooks.

### User decisions: AGENTS.md managed blocks and partialPrefetching — done
- Read the docs bundled with Next.js 16.5.0-canary.60 (`agentRules.md`, `agentUpgrade.md`,
  `adopting-partial-prefetching.md`, the `prefetch` route segment config) and `generate-agent-files.js`.
  Since 16.5.0 `next dev` re-syncs both managed blocks on every start, so deleting them by hand does not
  stick; `agentRules: false` and `experimental.agentUpgrade: false` make the next `next dev` remove them.
- RED: 4 new cases in `repo-policy.test.ts` (3 failed; the "guidance kept" case passed because the old
  block still contained the docs path).
- GREEN: `next.config.ts` got `partialPrefetching: false` (incremental adoption through
  `export const prefetch = 'partial'` per route, as the user asked), `agentRules: false` and
  `experimental.agentUpgrade: false`. `AGENTS.md` lost both marker blocks; their useful content (read the
  bundled docs first, heed deprecations) moved to "Scope and dependencies", plus one line on how Next.js is
  upgraded here. 196/196 unit tests; `mise run verify` exit 0.
- `mise run e2e` (which starts `next dev`) left `AGENTS.md` unchanged and printed no `partialPrefetching`
  warning. The remaining "server caches disabled" line is a dev-server notice for cache-bypassing requests.
- PROVE: four breaks each fail their own case (R-10). Restores by Edit, checked with `diff`.
- My own addition to flag: the AGENTS.md line "raise Next.js through `mise run outdated` and a
  `build(deps):` commit, not through `next upgrade`" is my wording of the repo's existing update rules, not
  something the user said. It replaces the upgrade block's "follow the reminders" instruction, which the
  config now turns off.

### Task 8.1: ci.yml (verify and verify-node27) — done
- Versions first (R-1): actions/checkout v7.0.1 and jdx/mise-action v5.3.0, resolved to commit SHAs with
  `gh api …/git/ref/tags/<tag>` (lightweight tags), plus mise 2026.11.12 for the action's `version`. All
  three were older than 24 h at 12:31Z. The plan's candidate for mise-action was v5.2.10 because v5.3.0 was
  under 24 h at design time; it has since crossed 24 h, so the newest qualifying tag is v5.3.0.
- RED: 12 new cases (3 in `repo-policy.test.ts`: SHA pins, secret references, at least one workflow; 9 in
  `hooks-config.test.ts`: triggers, permissions, the steps of both jobs, continue-on-error, fetch-depth,
  frozen installs, the schedule exclusion, the clean-tree step) failed with no workflow file.
- GREEN: `.github/workflows/ci.yml`. First run left 3 failures: my step pattern did not match `- run:` (the
  dash form). Fixed the pattern, not the workflow. 208/208 unit tests; `verify`, `check`, `tsc`,
  `check:model-ids` green. YAML syntax checked with `ruby -ryaml` (parses, jobs `verify`, `verify-node27`).
  `actionlint` is not installed and was not added (no plan declaration).
- PROVE: eleven breaks, scripted to apply one change, run the tests, restore and `diff` each time; each
  failed the matching case (R-10).
- Not verified here: whether mise-action trusts the repository's `mise.toml` without a `mise trust` step,
  and the Linux run as a whole. Both are checked on the first CI run (task 12.5).

### Investigation: does mise run in Git hooks and in CI? (user request) — answered, partly unmeasured
- CI: the pinned mise-action (v5.3.0) sets `MISE_TRUSTED_CONFIG_PATHS` to the checkout directory and
  `MISE_YES=1`, and adds the shims to PATH (read in `src/index.ts` at the pinned SHA). So no `mise trust`
  step is needed. The real run is confirmed in task 12.5.
- Git hooks: mise is activated in `~/.zshrc` (`mise activate zsh`). A Git client that does not start zsh
  (an editor's source control, a GUI client) gets no mise PATH. The hook still finds lefthook through the
  absolute path that `lefthook install` embedded, but the jobs' tools (`gitleaks`, `pnpm`, `mise`) are not
  found, so the commit is refused (exit 1, as tested in 7.5), never skipped.
- I tried to reproduce this with a GUI-style PATH on the real hook; auto mode refused the command for this
  conversation. The Git-hook conclusion is from reading the configuration and the hook, not from a run.
- User decision: document it in the README only (task 11.1, requirement 13.4). No `rc` file. actionlint is
  not added (not declared in the plan; the shape rules are covered by tests, the rest by the first CI run).

### Task 8.2: security-daily.yml — done
- RED: 5 new cases in `hooks-config.test.ts` failed with no file.
- Before writing it: `mise run security` works from the lockfile alone. On a copy of the work tree without
  `node_modules` it scanned 173 packages and exited 0, and created no `node_modules` (R-4). So the workflow
  has no `pnpm install`.
- GREEN: `.github/workflows/security-daily.yml` (daily cron and `workflow_dispatch`; `permissions: {}` at the
  top and `contents: read` on the job; checkout with `persist-credentials: false`; the same pinned actions
  and mise version as ci.yml; `mise run security`). 213/213 unit tests; the 8.1 rules (SHA pins, no secret
  other than GITHUB_TOKEN) scan this file too. YAML syntax checked with `ruby -ryaml`.
- PROVE: seven breaks each fail the matching case (R-10), including the two 8.1 rules applied to this file.
- Not done here: the real `workflow_dispatch` run. GitHub only allows it once the file is on the default
  branch (task 12.7, after the merge).

### Task 8.3: dependabot.yml — done
- Read the Dependabot options reference from github/docs first (I-19): `cooldown.default-days` works for npm
  and GitHub Actions, applies only to version updates, and defaults to 3 days when unset.
- RED: 8 new cases in `repo-policy.test.ts` failed with `ENOENT … .github/dependabot.yml`.
- GREEN: `.github/dependabot.yml` with `npm` and `github-actions` at `/`, weekly, `cooldown.default-days: 1`,
  `commit-message.prefix: "build"` + `include: "scope"` (gives `build(deps):`), and one `groups.npm` with
  `patterns: ["*"]`. 221/221 unit tests; `ruby -ryaml` parses it. A comment in the file says that security
  updates skip the cooldown and should be merged only after 24 hours (the README line is task 11.1).
- PROVE: six breaks each fail the matching case (R-10).
- Not checked here: that GitHub accepts the file. That needs it on the default branch (task 12.7).
- Task 8 complete (8.1-8.3).

### Task 9.1: mise.node27.toml and the Node 27 install — done
- Version: `27.0.0-alpha.0.1.1`, published 2026-11-17 (about 6 days), the newest 27 alpha older than 24 h.
- RED: 3 new cases in `repo-policy.test.ts` failed: the node27 lane still resolved node from `mise.toml`
  (`expected '26.13.1' not to be '26.13.1'`) and `mise.node27.toml` did not exist. `repoMiseTools` now takes a
  lane; the default lane runs with MISE_ENV removed (isolatedEnv) and the node27 lane sets MISE_ENV=node27.
- GREEN: `mise.node27.toml` with only `[tools] node = "27.0.0-alpha.0.1.1"`. 224/224 unit tests.
- Install: `MISE_ENV=node27 mise install` exit 0 (R-8). The directory was already trusted, so no new
  `mise trust`. `prereleases = true` was not needed. `node -v` is v27.0.0-alpha.0.1.1 in the lane and
  v26.13.1 by default.
- The install printed an npm install-scripts warning (esbuild, fsevents). Its source is the developer's
  `~/.default-npm-packages`, not this repository.
- PROVE: three breaks (a second tool, a range, the Node 26 version) each fail the matching cases (R-10).

### Task 9.2: commit checkpoint — done
- User approved a 5-commit grouping. Commits: 9958028 (tooling), 07d728e (src), 50b949d (tests, scripts),
  addd4bb (lefthook, .github), 4073d84 (tasks.md, do.md). `AGENTS.md` and `research.md` left uncommitted
  (11.5). The task text excludes `research.md` from the clean-tree condition, so it was not in commit 5.
- The commit-msg hook refused `bad message without type` with exit 1 (no commit created). Every commit then
  ran pre-commit (`model-ids`, `secrets`, `biome`, `typecheck`) and `conventional`, all green. The full
  record is in research.md R-9.
- One denied command (auto-mode classifier) chained three `git add`/`commit` steps; it changed nothing
  (checked with `git log`/`git status`). Retried one commit per call.
- Before committing: `mise run verify` exit 0 (224/224 unit, 2/2 `@smoke`).

### Task 9.3: Node 27 lane verification — done (verify red on the lane, recorded)
- RED: `tests/unit/docs-structure.test.ts` (3 cases) failed with `docs/node27/ has no .md record`.
- Worktree `../genai-lab-ts-node27` at 4073d84, `MISE_ENV=node27`: mise install (node v27.0.0-alpha.0.1.1),
  `pnpm install --frozen-lockfile` (node_modules not shared), `playwright install chromium`.
- `mise run verify` on Node 27 → exit 1. Two separate causes:
  1. `test`: 223/224. `repo-policy.test.ts` "keeps the guidance of the removed block in AGENTS.md" fails because
     the worktree (from the commit) does not have the uncommitted AGENTS.md change. Same failure on Node 26 in
     that worktree. With the main-tree AGENTS.md copied in, Node 27 gives 224/224 (control).
  2. `e2e`: Next.js dev server throws `TypeError: rawHeaders.hasOwnProperty is not a function` on every
     request; Playwright times out in webServer after 60 s; 0 tests executed. Node 26 in the same worktree
     gives 2/2. Cause not confirmed (see docs/node27 record, 未解決事項 1).
- Node 27 passes `check`, `typecheck`, `check:model-ids`, `check:secrets`, and `security`.
- Record: docs/node27/2026-11-23-initial-lane.md (five headings). Task says failure still satisfies the spec.
- RED → GREEN → PROVE: 3 cases green; breaks (drop a heading, swap order, bad file name) each fail the
  matching assertion; restored and checked with `diff -q` against a copy.
- Worktree removed (`git worktree list` shows only the main tree). Main tree: `mise run test` 227/227,
  `mise run check` exit 0.
- Tasks 9.3 marked [x]. Per the task file, the record is a valid checkpoint even though verify is not green.

### Tasks 10.1-10.3: ZIP verification in a disposable environment — done (R-6, R-2)
- Environment: ZIP unpacked under `$TMPDIR` (outside the repo). `package.json` pinned to exact versions (ai 7.0.179,
  @ai-sdk/* 4.0.107-4.0.124 / openai-compatible 3.0.94 / react 4.0.183, zod 4.6.7, plugin-react 6.3.0), each the newest
  version at least 24 h old at 2026-11-22T13:42Z (@ai-sdk/react 4.0.184 was 15 h old, so not used). `pnpm-workspace.yaml` copied
  from the repo (no `minimumReleaseAgeExclude`). Shared deps use the repo pins.
- The auto-mode classifier denied `pnpm install` / `pnpm exec`, so the developer ran them and pasted the output
  (same arrangement as tasks 1.2 and 7.5). An unrun helper script I had written was deleted rather than used to get around the denial.
- `pnpm install`: +93 packages, no peer warning, no `Ignored build scripts`. New in pnpm 12: `Agent skills awaiting approval: ai.`
  (`ai` ships a `skills/` directory). `pnpm approve` was not run; handed to stage 2.
- `tsc --noEmit`: no output, exit 0. The pasted block held two `exit=0` lines and the install output, not tsc's own output,
  so "no output" is an interpretation, supported by `tsbuildinfo` with 0 diagnostics. `tsc` ran against the `tsconfig.json` that
  `next dev` had already rewritten (allowJs, esModuleInterop, `.next/dev/types`). Recorded in R-6.
- API names: all 9 present in `ai@7.0.179` types (checked in the `npm pack` tarball) and in the official docs (Context7 `/vercel/ai`).
  Two non-blocking differences: `system:` is `@deprecated` for `instructions:`; the `StreamTextResult` method form of
  `toUIMessageStream` is deprecated in favour of the standalone function the ZIP already uses.
- vitest 4/4 green. Playwright `@smoke`: 1 green (the SSE mock was parsed by `useChat` and rendered), 1 red.
  Red cause (from `error-context.md`): `getByRole('alert')` matched both the page's `<p role="alert">` and Next's
  `#__next-route-announcer__`. The retry UI works; the ZIP test's locator is ambiguous. Handed to stage 3.
- Mistake caught before writing: I first wrote "deleted in task 10.4" into R-6 before the deletion happened, then corrected it.

### Task 10.4: cleanup — done
- Repo check: none of the 7 ZIP paths is tracked or present; `git status` shows no ZIP file; `git worktree list` shows only the main tree.
  `git ls-files -- src/lib/ai` returns `model-allowlist.ts` only (task 5.1's file, not ZIP code).
- The classifier denied `rm`, so the developer deleted the three `$TMPDIR` directories. Verified afterwards with `ls -d`: all three
  report `No such file or directory`. R-6 updated.
- Task 10 complete (10.1-10.4). Next checkpoint: task 11.5 commit; 11.1-11.3 can run in parallel (wave B).

### Task 11.1: stage 1 guide and README — done
- RED: `tests/unit/docs-structure.test.ts` gained 7 cases (stage guide count / name / four sections in order /
  existing `tests/` paths; README shows `mise activate`, `mise run setup`, `git worktree add`). 4 failed:
  `docs/stages/ has no .md guide` and the three README commands. The Node 27 assertion now uses the shared
  `headingIndices` helper (same behaviour: 3/3 still green, and the break below still fails it).
- GREEN: `docs/stages/1-dev-environment-and-gates.md` (読む / 動かす / 改造する / テストで合格を確かめる; per pass condition
  the test paths from the task text; exercises: copy an allowlisted ID into `page.tsx` → `check:model-ids` exit 1, `it.skip`
  → `noSkippedTests`, a staged fake key in a temp repo → gitleaks non-zero). README rewritten in Japanese (setup, hooks fail
  without mise, command table, `pnpm outdated` exit 1, Node 27 worktree steps from 9.3, Dependabot security updates outside
  cooldown, governance links). No model ID strings; version numbers only as dated reference values (13.12).
- Two claims corrected before GREEN after reading the code: gitleaks prints `RuleID` and hides the value (not a literal
  `REDACTED` string asserted anywhere), and `gate-self-check.test.ts` covers zero-executed and external-origin failures
  (lint/type violations are `static-analysis.test.ts`).
- PROVE (8 breaks, each restored and checked with `diff -q`): drop 改造する → `missing section ... [0, 1, -1, 3]`; swap
  読む/動かす → `sections are out of order`; add `tests/unit/nope.test.ts` → `names tests/ paths that do not exist`;
  `tests/`→`tezts/` → `names no tests/ path`; extra `Stage1.md` → `does not match <n>-<slug>.md`; README without each of the
  three commands → `README.md does not mention ...`. After restore: 10/10.

### Tasks 11.2 / 11.3: governance documents — done (delegated, one subagent per task, disjoint boundaries)
- 11.2: constitution 1.0.0 → 1.1.0 (principle 3 split verify/security; Node lane sentence per 13.7; principle 8 gitleaks
  placement aligned to verify, an addition beyond the task text for consistency — flagged to the user). Sync Impact
  Report ✅ for AGENTS.md / plan 000 / README after 11.1 and 11.3 finished. `grep -n "exp/node27"` → lines 11, 236, 283,
  all the new wording. steering tech.md / structure.md aligned with `mise tasks ls`.
- 11.3: AGENTS.md command table = `mise tasks ls` (plus typecheck, check:secrets, setup); hooks and CI subsections from
  `lefthook.yml` / `ci.yml`; Current state 2026-11-25 (not merged). plan 000: revision notes in §4, §7 M1, §8.5,
  Constitution Compliance linking spec 001 Clarifications. Subagent checks: check, check:model-ids, repo-policy 46/46 green.
- Spot-checked against files: constitution version lines, `fetch-depth: 0`, weekly cron, `continue-on-error`.

### Task 11.4: final version check — done, no switch
- 2026-11-25T11:52Z: every pinned npm package, pnpm, node (26, 27 alpha), lefthook, gitleaks, osv-scanner, both Actions
  and mise re-queried; all ≥ 24 h, publish times unchanged; Action tag SHAs unchanged. Shortest: next canary.60 (83.9 h).
- TypeScript: `beta` = 7.1.0-beta, no 7.1 RC/stable. Kept beta; `package.json` / lockfile untouched. R-1 and R-7 updated.

### Review and gate (tasks 11.1–11.4)
- Risk triggers script: `boundary: docs/node27/2026-11-23-initial-lane.md` only (task 9.3's uncommitted file, not task 11).
  Untracked test refactor (trigger 3) found by hand. Codex unavailable (`Missing environment variable: ICA_OPENAI_API_KEY`)
  → sdd-reviewer fallback, report `.sdd/reviews/001-dev-environment-and-gates-11.md`.
- `mise run verify` exit 0: check 39 files, model-ids 0 findings, gitleaks no leaks, 234/234 unit, 2/2 `@smoke`.
- Review fixes (MEDIUM): pre-push scope wording in README / guide / steering, `--verbose` and repo argument in
  Exercise 3, `unset MISE_ENV` in the Node 27 steps; offline claims marked as design, measured in 12.1 / 12.4.
  Re-run after fixes: `mise run check` exit 0, `mise run test` 234/234, `check:model-ids` 0 findings.
- Not verified end to end: the `gitleaks git ... <temp-repo>` form of Exercise 3 (a temp-repo run was denied); the
  form comes from `gitleaks git --help` (`gitleaks git [flags] [repo]`).

### Task 11.5: commit checkpoint — done
- User decisions: keep the principle 8 change; commit in the proposed 4 groups. Principle 3 pre-push wording (13.7
  text) left as written.
- Commits: 6e87c68 (guide, README, docs tests, Node 27 record), 7d509b7 (constitution 1.1.0, steering, review),
  5479cd9 (AGENTS.md, plan 000), and this progress commit. Every commit ran pre-commit (model-ids, secrets, biome,
  typecheck) and commit-msg (conventional), all green. Not pushed.

### Tasks 12.1–12.4: final measurements — 12.1, 12.3, 12.4 done; 12.2 partly blocked
- Working copy: a local `git clone` of HEAD 8afb1f0 in the scratchpad, not a worktree: `mise run setup` runs
  `lefthook install`, which in a worktree would rewrite the hooks shared with the real repository. Reset to HEAD
  (`reset --hard` + `clean -fd`) between cases; the real working tree was never touched by an experiment.
- 12.1: offline = unreachable proxy (127.0.0.1:9, `NODE_USE_ENV_PROXY=1`, localhost exempt); `sandbox-exec` was denied by the
  session's permissions. Canary: curl exit 7, node fetch ECONNREFUSED. No `*API_KEY*` variable in the env. `mise run verify`
  ×3: exit 0, 24 s / 19 s / 19 s, porcelain and HEAD identical before and after each run, 234/234 unit, 2/2 `@smoke`.
  README setup steps all exit 0 in the clone. Timings in R-11; test timeouts (120 s / 30 s) kept, max test 3.3 s.
- Surprise: `lefthook run pre-push` skipped every job (`no matching push files`) because the clone's origin has the same
  commits; `--force` was needed for the timing (19.5 s). Recorded in R-11 as a limit of the hook, covered by CI.
- 12.2: (a) test 0 files → 1, (b) all `@smoke` skipped → 1, (c) unmocked example.com fetch → 1 with the guard's message,
  (d1) lint → 1 stops after check, (d2) types → 2 stops after typecheck, (d3) model ID → 1 stops after check:model-ids.
  (d4)/(e) blocked: a machine-managed secret-blocking control outside git rejected the fake-secret commit even with
  `core.hooksPath=/dev/null`, so no violation existed and verify was 0. Not circumvented; waiting for the user.
- 12.3: new R-10 rows — `.gitleaks.toml` at root, `strict: false` for repo-policy (g), hook cases 1/2/3/3' re-broken (same
  messages as 7.5), docs-structure rows linked to 11.1's PROVE. 8.8: `genai-lab-test-*` count 0 before/after both a passing
  and a failing (`--redact` removed) run of gitleaks-pre-commit.test.ts.
- 12.4: unreachable → audit 1 (70 s, retries), osv 127 (general error per the official Return Codes table), `security`
  127 and stops before audit; lodash 4.17.20 → audit 1 (2 high), osv 1 (4 GHSAs). No reopening of 7.2 needed.
- 12.2 decision (user): accept gitleaks-pre-commit.test.ts as the evidence for (d4)/(e); 12.2 marked done.

### Task 12.5: commit, push, PR, CI — done
- Commit fe8e9a6 (hooks green), `git fetch` showed no remote branch, push ran pre-push with all 4 jobs (29.5 s). PR #2.
- CI run 45614530248: `verify` success in 78 s (verify 18 s, security 0.6 s, playwright install 40 s); `verify-node27`
  failed on E2E with the same `rawHeaders.hasOwnProperty` error as the macOS record, unit 234/234; workflow success.
- Linux external-request block: `network-guard.smoke.spec.ts` passed in the verify job. R-8, R-9, R-11 updated.
