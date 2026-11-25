# Adversarial Review — 001-dev-environment-and-gates, tasks 11.1–11.4

- Date: 2026-11-25
- Reviewer: Claude (sdd-reviewer fallback). **Codex unavailable**: `codex exec` failed with
  `Missing environment variable: ICA_OPENAI_API_KEY`. The docs were written by Claude, so this review
  does not meet the cross-family rule in AGENTS.md "Cross-Agent Review". A Codex pass is still owed
  once the key is available.
- Scope: working tree vs HEAD 4073d84. Files: `docs/stages/1-dev-environment-and-gates.md` (new),
  `tests/unit/docs-structure.test.ts` (untracked), `README.md`, `.sdd/memory/constitution.md`,
  `.sdd/steering/tech.md`, `.sdd/steering/structure.md`, `AGENTS.md`,
  `specs/000-development-plan/plan.md`, `research.md` (R-1 "最終確認（タスク 11.4" block and R-7
  "2026-11-25T11:52Z 再確認" block only).
- Ground truth checked: `mise.toml`, `mise.node27.toml`, `lefthook.yml`, `.github/workflows/ci.yml`,
  `.github/workflows/security-daily.yml`, `.github/dependabot.yml`, `package.json`, `vitest.config.ts`,
  `playwright.config.ts`, `biome.json`, `scripts/check-model-ids.mjs`, `src/app/page.tsx`,
  `tests/e2e/fixtures.ts`, `tests/unit/helpers/sandbox.ts`, and the test names in every test file the
  guide cites.
- Prior reviews read: `001-dev-environment-and-gates-plan-*.md` (plan rounds only; none cover task 11).
  The codex-r4 item "`exp/node27` vs constitution Node lane" (resolved, user decision A) is carried out
  correctly by this change. No finding below repeats a prior resolved one.

## Commands run (read-only)

| Command | Result |
| --- | --- |
| `mise tasks ls` | 13 tasks: check, check:model-ids, check:secrets, e2e, outdated, runtime, security, security:audit, security:osv, setup, test, typecheck, verify (alias gate) |
| `pnpm exec vitest run tests/unit/docs-structure.test.ts` | 10/10 passed |
| `mise run check:model-ids` | `scanned 39 files, 0 findings` |
| `grep -F -f <11 allowlist strings>` over AGENTS.md, constitution, steering, plan 000, README, docs | no match (AGENTS.md and `.sdd/**` are not in the script's scan set, so this grep is the only check for them) |
| `mise run verify` | exit 0; gitleaks `no leaks found`; 234/234 unit; 2/2 `@smoke`; `git status` unchanged afterwards |
| `pnpm view typescript dist-tags --json` | `latest` 7.0.2, `beta` 7.1.0-beta, `rc` 7.0.1-rc, `next` 7.1.0-dev.20261125.1 (matches R-7) |
| gitleaks 8.30.1 in a scratch repo with a runtime-built fake `ghp_` token: `gitleaks git --pre-commit --staged --redact` vs the same with `--verbose` | without `--verbose`: only `WRN leaks found: 1`, exit 1, **no RuleID line**. With `--verbose`: `Secret: REDACTED`, `RuleID: github-pat`, exit 1 |

## Risk trigger resolution

**(a) Existing test modified (untracked `docs-structure.test.ts`, Node 27 assertion refactored into
`headingIndices`)** — explained away, medium confidence. The pre-refactor version was never committed,
so it cannot be diffed; `git` has no baseline. Judged on the current code against 11.5:
`headingIndices` maps each of the five expected headings to `indexOf` in the level-2 heading list; the
case asserts no `-1` (all present) and that the index list equals its ascending sort (in order). That is
exactly "has the five headings in this order" (11.5). The three PROVE breaks recorded for task 9.3 (drop a
heading, swap two, bad file name) each hit one of the current assertions (`not.toContain(-1)`, the sort
equality, `NODE27_FILE_NAME`). `it.each(files)` over an empty list is guarded by "holds at least one
record". The test is non-vacuous today (10/10 green; it reads real files under `REPO_ROOT`).

**(b) Governance amendment** — confirmed in part.
- 1.0.0 → 1.1.0 MINOR, Sync Impact Report, revision history, `Last amended` are all updated (13.7). The
  Node-lane sentence matches 13.7 word for word in substance, and `grep -n exp/node27` on the
  constitution returns lines 11, 236, 283, all new wording (old "`exp/node27` で分離検証" is gone).
- Principle 8 edit (gitleaks placement): **needed for consistency, not scope creep in substance**. The
  old text ("CI（全履歴）") was not false, but after the amendment principle 3 lists gitleaks in `verify`,
  and Clarification 2026-11-22 (plan-review session) narrows the scan to HEAD-reachable history, which
  "全履歴" no longer describes. It changes no rule and is recorded in the Sync Impact Report and the
  history row. It is still outside the amendment scope that 13.7 enumerates, so the user should
  acknowledge it at the 11.5 checkpoint (see LOW finding below).
- One wording defect: principle 3's new MUST says pre-push runs both verify's checks and security,
  which `lefthook.yml` does not do (MEDIUM finding below).

**(c) Codex unavailable** — confirmed; noted above.

## Boundary and dependency check

| Changed file | Declared in | Verdict |
| --- | --- | --- |
| `docs/stages/1-dev-environment-and-gates.md`, `README.md`, `tests/unit/docs-structure.test.ts` | 11.1 | in boundary |
| `.sdd/memory/constitution.md`, `.sdd/steering/tech.md`, `.sdd/steering/structure.md` | 11.2 | in boundary |
| `AGENTS.md`, `specs/000-development-plan/plan.md` | 11.3 | in boundary |
| `research.md` (R-1, R-7 blocks) | 11.4 | in boundary |
| `package.json`, `pnpm-lock.yaml` | 11.4 | unchanged (no TS switch; consistent with R-7) |
| `specs/001-.../tasks.md`, `pdca/do.md` | none of 11.1–11.4 | SDD bookkeeping; listed in 11.5's commit set (LOW, below) |
| `docs/node27/2026-11-23-initial-lane.md` | task 9.3 | not task 11 |

No new third-party dependency, CI job, or external service.

## Critique

### [MEDIUM] Constitution, README and stage guide say pre-push runs all of `verify` plus `security`; lefthook does not
**Location**: .sdd/memory/constitution.md:80 (also :7, :283), README.md:66-67, docs/stages/1-dev-environment-and-gates.md:37, .sdd/steering/tech.md:50-51
**Issue**: The pre-push hook runs `security:osv`, `security:audit`, `test`, `e2e` only. It does not run `check`, `typecheck`, `check:model-ids` or `check:secrets` (full history). So "pre-push runs both verify and security" is false as written, and the constitution makes it a MUST that the current hooks do not meet on a literal reading.
**Evidence**: constitution:80 "pre-push と CI の必須ジョブ（`verify`）は verify の検査と security の**両方**を実行し"; guide:37 "pre-push フックと CI はどちらも両方を実行する"; `lefthook.yml` pre-push jobs: `mise run security:osv`, `mise run security:audit`, `mise run test`, `mise run e2e`. README:77 (hook table) and AGENTS.md ("the pre-push hook runs `security` together with `verify`'s unit and E2E tests") state it correctly, so the repo now contradicts itself. Spec 7.5 fixes pre-push to exactly those four jobs; the loose phrase comes from 13.7 / Clarification 2 ("pre-push と CI 必須ジョブが両方を実行する"). The "checks are not reduced" intent still holds: pre-push never ran full-history gitleaks (plan 000 §4), and CI runs everything.
**Confidence**: high
**Fix**: Docs change (spec intent stands): reword the constitution bullet, its Sync Impact line and history row, README:67, guide:37 and tech.md:50 the way AGENTS.md does ("pre-push は security と verify の test・e2e を、CI の必須ジョブは verify と security の全体を実行する"). The 13.7 phrase is ambiguous; ask the user whether to tighten 13.7 too (undecided, spec owner).

### [MEDIUM] Exercise 3 says the gitleaks command prints the matched RuleID; without `--verbose` it does not
**Location**: docs/stages/1-dev-environment-and-gates.md:94-95
**Issue**: The exercise tells the learner to run `gitleaks git --pre-commit --staged --redact` and expect a non-zero exit "and the matched rule (`RuleID`) is shown". gitleaks 8.30.1 prints finding details only with `--verbose`.
**Evidence**: Guide: "`gitleaks git --pre-commit --staged --redact` を実行する。終了コードが 0 以外になり、一致したルール（`RuleID`）が表示される". Measured in a scratch repo with a runtime-built fake token: without `--verbose` the output is the banner, `0 commits scanned`, `WRN leaks found: 1`, exit 1, no RuleID. With `--verbose`: `Secret: REDACTED`, `RuleID: github-pat`. The real hook (`lefthook.yml`) uses `--redact --ignore-gitleaks-allow --verbose`.
**Confidence**: high
**Fix**: Use the hook's exact command in the exercise (`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`), or drop the RuleID claim. "値そのものは表示されない" then matches the observed `Secret: REDACTED`.

### [MEDIUM] README Node 27 procedure exports `MISE_ENV=node27` and never unsets it
**Location**: README.md:89, README.md:98
**Issue**: `export MISE_ENV=node27` stays set after `cd - && git worktree remove ...`, so the learner's shell is still on the Node 27 lane in the main tree. The next `mise run verify` there, and any hook run from that shell, uses Node 27 alpha. That lane's E2E currently fails (`rawHeaders.hasOwnProperty`, docs/node27 record).
**Evidence**: README:89 `export MISE_ENV=node27  # mise.node27.toml で node だけを上書きする`; README:98 `cd - && git worktree remove ../genai-lab-ts-node27`; no `unset MISE_ENV`. AGENTS.md uses the scoped form `MISE_ENV=node27 mise install`.
**Confidence**: high (fact); medium (how likely learners hit it)
**Fix**: Add `unset MISE_ENV` before or with `cd -`, or run the block in a subshell, or prefix each command (`MISE_ENV=node27 mise ...`). Keep the steps the same as 9.3 otherwise (11.7).

### [LOW] Exercise 3 runs gitleaks in a temp directory outside the project, where `mise activate` may not put it on PATH
**Location**: docs/stages/1-dev-environment-and-gates.md:90-94
**Issue**: README step 1 sets up `mise activate`, which exposes tools only inside directories whose config sets them. A temp dir outside the repo gets no gitleaks unless the learner has it globally, so step 2 can fail with "command not found" before the exercise starts.
**Evidence**: README:20 `eval "$(mise activate zsh)"`; the guide says to `git init` a temp directory and run `gitleaks ...` there. It works on this machine only through a global shim (`~/.local/share/mise/shims/gitleaks`).
**Confidence**: medium
**Fix**: Run it from the repo against the temp path (`gitleaks git --pre-commit --staged ... <tmpdir>`), or use `mise exec -C <repo> -- gitleaks ...`, or say to `cd` back into the repo first.

### [LOW] AGENTS.md "Current state" describes the in-progress branch, not the state after stage 1
**Location**: AGENTS.md:10-19
**Issue**: 13.8 asks for "段 1 完了後の状態". The text says stage 1 "is implemented on the branch `feat/dev-environment-and-gates` and is still in progress until its PR is merged". It goes stale the moment the PR merges and would then mislead agents on `main`.
**Evidence**: "is implemented on the branch `feat/dev-environment-and-gates` and is still in progress until its PR is merged into `main`".
**Confidence**: medium
**Fix**: State the post-merge state (stage 1 complete: foundation only, no AI code; stage 2 next) and drop the branch name. Alternatively, plan an explicit update in 12.x after merge.

### [LOW] `docs-structure` test checks a weaker condition than 13.2 and lets directories and stripped link prefixes pass
**Location**: tests/unit/docs-structure.test.ts:25, :107-115
**Issue**: The test passes when the guide names at least one existing path under `tests/`, anywhere in the file. It does not check that each pass condition names a test. `existsSync` also accepts a directory (`tests/unit/` or a glob prefix `tests/unit/*.test.ts` both reduce to `tests/unit`), and the regex drops the relative prefix, so a broken link such as `(../tests/unit/x.test.ts)` still counts as existing. Placeholder paths (`tests/<x>`) are skipped silently.
**Evidence**: `const TEST_PATH = /\btests\/[\w./-]*\w/g;` and `paths.length > 0` plus `existsSync(join(REPO_ROOT, path))`. 13.2: "合格条件…ごとに、合格を判定するテストのパスを示し、そのパスはリポジトリに実在する". The task text scoped the test to "本文中の `tests/…` のパスがすべて実在する", so this matches the task, and the review (above) confirms the guide's per-condition tables by hand.
**Confidence**: medium
**Fix**: Optional hardening: require `statSync(path).isFile()`, and check that the 「テストで合格を確かめる」 section has at least one test path under each `### 合格条件` subheading. Resolving link targets relative to the guide's directory would also catch bad relative links.

### [LOW] 13.4 and 11.7's "node_modules is not shared" have no structural check
**Location**: tests/unit/docs-structure.test.ts:28, :118-125
**Issue**: The README check covers only three substrings (`mise activate`, `mise run setup`, `git worktree add`). Removing the 13.4 section or the per-worktree `pnpm install` would keep the gate green. The README content is correct today (README:44-48, :81-92).
**Evidence**: `const README_COMMANDS = ["mise activate", "mise run setup", "git worktree add"] as const;` (matches the task text).
**Confidence**: high (gap); low (impact)
**Fix**: Optional: add `pnpm install --frozen-lockfile` within the Node 27 section and a heading or keyword for the 13.4 note to the README check.

### [LOW] Principle 8 and a new principle-3 MUST NOT go beyond the amendment scope 13.7 enumerates
**Location**: .sdd/memory/constitution.md:84-85, :170-171, Sync Impact Report :9
**Issue**: 13.7 lists principle 3 and the Node-lane constraint. The amendment also rewrites principle 8's gitleaks bullet and adds "security …到達できないことを合格として扱ってはならない（MUST NOT）" to principle 3. Both are consistent with the spec (Clarification 2026-11-22, HEAD-reachable scan; requirement 4.4), and do.md records that the principle 8 change was flagged to the user. The Governance amendment procedure still calls for a reviewed proposal.
**Evidence**: Sync Impact Report "原則 8: gitleaks の全履歴スキャンの置き場を verify（HEAD から到達できる履歴）に合わせて明確化"; spec 13.7 does not mention principle 8.
**Confidence**: high (fact); low (that it is a problem)
**Fix**: Have the user approve both additions explicitly at the 11.5 checkpoint, and record that in the PR body. No text change needed.

### [LOW] The guide states offline behaviour that research.md records as not yet measured
**Location**: docs/stages/1-dev-environment-and-gates.md:58-59; README.md:42
**Issue**: "ネットワークを切った状態でも `mise run verify` …結果は変わらない" and "`mise run security` はネットワークがないと失敗する" are stated as fact. R-3 and R-4 say the network-off verify run and the unreachable-registry failure are not done yet (tasks 12.1 and 12.4).
**Evidence**: R-3: "ネットワークを切った実行と、3 回連続の実行は未実施で、タスク 12.1 で行う"; R-4: "失敗系（到達不能・advisory ありの終了コード）は未実施で、タスク 12.4 で測る".
**Confidence**: high
**Fix**: Keep the text (it is the designed behaviour), but make 12.1 and 12.4 re-read these two sentences against the measurement and fix them if they differ.

### [LOW] Plan 000 Summary still describes `exp/node27` separation and "the same `mise run verify`" in hooks and CI, with no revision note
**Location**: specs/000-development-plan/plan.md:17
**Issue**: The Summary says "Node 27 alpha を `mise.node27.toml` + `exp/node27` で分離検証し、lefthook のフックと CI で同じ `mise run verify` を強制する". Both halves are superseded by the Clarifications. §4, §7 M1, §8.5 and Constitution Compliance got notes; the Summary did not. 13.10 only requires §7 M1 and §8.5, so this is not a requirement miss.
**Evidence**: plan.md:17 quoted above.
**Confidence**: high
**Fix**: Add a one-line revision note under the Summary that points to the §4 and §7 notes.

### [LOW] "Run a single file" block lists a command that runs every `@smoke` test
**Location**: docs/stages/1-dev-environment-and-gates.md:120-125
**Issue**: Under "1 つのファイルだけを実行するには", `pnpm exec playwright test --grep @smoke` runs all smoke tests, not one file.
**Evidence**: "1 つのファイルだけを実行するには、次のようにする。" followed by `pnpm exec playwright test --grep @smoke`.
**Confidence**: high
**Fix**: Use `pnpm exec playwright test tests/e2e/network-guard.smoke.spec.ts`, or relabel the line as "E2E の smoke だけ".

### [LOW] `listMarkdown` swallows every readdir error
**Location**: tests/unit/docs-structure.test.ts:33-41
**Issue**: `catch { return []; }` turns any error (permissions, ENOTDIR) into an empty list. It is not a false green, because the "holds at least one" cases then fail, but the failure message ("has no .md record") hides the real cause.
**Evidence**: `} catch { return []; }`
**Confidence**: high
**Fix**: Catch only `ENOENT` and rethrow everything else.

### [LOW] Heading parser treats only column-0 backtick fences as code
**Location**: tests/unit/docs-structure.test.ts:44-57
**Issue**: Indented fences (inside list items) and `~~~` fences are not recognised, so a `## 読む` line inside such a block would count as a section heading. No current document is affected.
**Evidence**: `if (line.startsWith("```"))`
**Confidence**: low
**Fix**: Match `/^\s*(```|~~~)/`.

### [LOW] Edits to tasks.md and pdca/do.md are outside the 11.1–11.4 boundaries
**Location**: specs/001-dev-environment-and-gates/tasks.md, specs/001-dev-environment-and-gates/pdca/do.md
**Issue**: Checkbox updates, Implementation Notes and the do.md log are outside every declared `_Boundary:_` of 11.1–11.4. This is standard `/sdd-impl` bookkeeping, and 11.5's commit list includes `tasks.md`.
**Evidence**: `git diff HEAD --stat` lists both files. 11.5's commit list names `tasks.md` but not `pdca/do.md`.
**Confidence**: high (fact); low (impact)
**Fix**: Add `pdca/do.md` to 11.5's commit list (or note that bookkeeping files are exempt), so 11.5's `git status --porcelain` empty condition can be met.

### [LOW] Principle 3's title still says the quality gate is one
**Location**: .sdd/memory/constitution.md:71
**Issue**: The heading "品質ゲートは 1 つで…" now sits over a principle that defines two entry points (`verify` and `security`), which a reader may misread.
**Evidence**: "### 3. 品質ゲートは 1 つで、決定論的で、空振りしない" next to the new "`mise run security` に分け".
**Confidence**: low
**Fix**: Optional: leave it as is (verify is still the single offline gate) or add "（オフラインの検証入口）" to the title.

## Checks that passed (evidence)

- 13.1: guide headings `## 読む` / `## 動かす` / `## 改造する` / `## テストで合格を確かめる` in order; test green.
- 13.2: per-condition tables cite exactly the task-text paths; all six files exist; each table description matches the test names (`verify-offline-contract` "runs the six checks in order…", "contains no command that needs the network…"; `gate-self-check` (a)–(e); `network-guard` (a)/(b); `gitleaks-pre-commit` "through the real git hook (7.3)" refuse + control; `hooks-config` "gives the secrets job the same flags as the check:secrets task", "fails … when the job's tool is not on PATH", "when lefthook itself cannot be found").
- Guide facts: verify order (`check`→`typecheck`→`check:model-ids`→`check:secrets`→`test`→`e2e`) matches `mise.toml`; CI verify job runs `verify` then `security`; `vitest.config.ts` loads the network guard and zero-test reporter; four pre-commit job names match; Exercise 1 output format `${path}:${line}:${column}: ${match} (${source})`, exit 1, `pattern:<provider>` match the script, and `src/app/page.tsx` has a `<p>`; Exercise 2 `noSkippedTests` is `error` in biome.json.
- 13.3/13.4/11.7: README has `mise activate`, `mise trust && mise install`, `mise run setup` (its three commands match `mise.toml`), the hooks-fail-without-mise note, the worktree steps (`--detach … HEAD`, per-worktree `pnpm install --frozen-lockfile`, no `lefthook install`, `git worktree remove`) that match C14 and 9.3; `pnpm outdated` exit 1; Dependabot weekly + 1-day cooldown + security-updates note match `dependabot.yml`.
- 13.8: every task in the AGENTS.md command table exists in `mise tasks ls`; hooks and CI subsections match `lefthook.yml` / `ci.yml` (including `verify-node27` weekly via `schedule`, `continue-on-error`, the tracked-files check); stage numbers for `model.ts` (6), `agent.ts` (5), `limits.ts` (8) match plan 000 §5.
- 13.9: tech.md Gate/Security command text matches `mise.toml`; gitleaks flags match `lefthook.yml` and `check:secrets`; structure.md roles for `tests/unit/setup/`, `tests/unit/helpers/` (sandbox exports: `resolveTool`, `isolatedEnv`, `runCommand`, `createTempGitRepo`), `tests/e2e/reporters/`, and `tests/fixtures/gate/` (excluded by `include: tests/unit/**/*.test.ts` and `testDir: tests/e2e`) match the files.
- 13.10: plan 000 has notes in §4, §7 M1, §8.5 and Constitution Compliance; the `spec.md#clarifications` anchor resolves to `## Clarifications`.
- 13.12: the only version number in README/guide is "2026-11-25 時点の既定レーンは Node 26 LTS" (dated); the tech.md status note marks its table as dated reference values. No test asserts a version.
- No model ID strings in docs, README, AGENTS.md, constitution, steering or plan 000.
- 1.3 / 12.5 / 12.6 (11.4): R-1 recheck dated 2026-11-25T11:52Z; the stated elapsed hours (next canary.60 83.9 h, mise-action 90.8 h, mise 96.4 h) recompute correctly from the R-1 publish times; R-7 dist-tags match a live `pnpm view` now; no switch, `package.json` and lockfile unchanged.

## Verdict
REQUEST_CHANGES

Three MEDIUM findings are verifiable factual errors in the docs this task delivers (pre-push scope, the
gitleaks RuleID claim, the leaked `MISE_ENV`). One of them is also a constitution MUST that the current
hooks do not literally meet. Each fix is a small wording or command change, and none needs a spec change
except the optional tightening of 13.7.

## Hallucination Signal
forced: false

## Adjudication (orchestrating session, 2026-11-25)

| Finding | Decision | Evidence / action |
| --- | --- | --- |
| M1 pre-push scope overstated | stands (docs) / escalated (constitution) | `lefthook.yml` pre-push = security:osv, security:audit, test, e2e. Fixed README, stage guide, steering tech.md to say: CI required job runs verify + security; locally pre-commit + pre-push split them. Constitution principle 3 wording follows spec 13.7 text verbatim → user decision |
| M2 Exercise 3 output | stands, fixed | `gitleaksCommand()` reuses the hook argv (with `--verbose`). Exercise now adds `--verbose`, runs from the repo with the temp repo as the `[repo]` argument (`gitleaks git [flags] [repo]` from `--help`), and notes the non-verbose output |
| M3 `MISE_ENV` left set | stands, fixed | README Node 27 block ends with `unset MISE_ENV` and a note |
| L6 offline claims unmeasured | stands, fixed | guide now says "by design", measurement in R-3/R-4 (task 12.1/12.4) |
| L principle 8 beyond 13.7 | escalated | user to approve at the 11.5 checkpoint |
| L4 test checks less than 13.2 | dismissed for now | task text and plan C12 define the check as "paths exist"; per-condition linkage is reviewed by hand. Directory paths do exist |
| L5 AGENTS.md Current state | dismissed | the PR is not merged; describing it as merged would be false. Revisit after merge (task 12.5) |
| Other LOWs | deferred | recorded in this report; none affects a requirement's pass condition |

Verdict after fixes: APPROVE_WITH_NOTES (no CRITICAL/HIGH; MEDIUMs fixed). Cross-family (Codex) review still owed: `codex exec` failed with `Missing environment variable: ICA_OPENAI_API_KEY`.
