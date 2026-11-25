HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
reviewer: codex (round 4)

## Critique
### [CRITICAL] 入れ子 Playwright 実行で `baseURL` が未定義のまま実物の通信 fixture を通す
**Location**: specs/001-dev-environment-and-gates/plan.md:371-377, 469-476, 699-708
**Issue**: `webServer` と `use.baseURL` を持たない入れ子設定で、`baseURL` と request origin を比較する実物の `networkGuard` を起動するため、3.11 の主経路が `baseURL` 未定義時に失敗するか、比較規則が未定義のままになる。
**Evidence**: C12 は入れ子設定を「`webServer` なし」で実行し、「本物の `tests/e2e/fixtures.ts` の auto fixture を通す」とする一方、C7 は fixture が「`baseURL` と異なるオリジン」を遮断すると定義している。`playwright.fixture.config.ts` に `use.baseURL` の値または `baseURL` 不在時の許可規則は指定されていない。これは文書照合で確認した問題であり、未実装の fixture に対する実行結果は推論である。
**Confidence**: high
**Proof**: 実装後に `pnpm exec playwright test --config tests/fixtures/gate/e2e/playwright.fixture.config.ts tests/fixtures/gate/e2e/external-request.fixture.ts --grep @smoke` を実行し、`baseURL` を `new URL()` などで参照する fixture が `undefined` を処理できること、および外部 origin のみを teardown で失敗にできることを確認する。
**Fix**: 入れ子設定にネットワーク接続を伴わない固定の `use.baseURL` を明示するか、`tests/e2e/fixtures.ts` に `baseURL` が未定義の場合は同一 origin を許可しないという明確な分岐を定義し、`external-request` と `no-external-request` の両方でその分岐を検証する。

### [HIGH] 入れ子 Playwright 用の argv 変換が実タスク定義と矛盾し、fixture config を確実に選べない
**Location**: specs/001-dev-environment-and-gates/plan.md:371-381, 642-643
**Issue**: `e2e` タスクに `--config` が存在しないのに C12 はそれを「置き換える」とし、さらに既存の `--grep @smoke` に別の `--grep` を追加するため、入れ子実行の最終 argv が一意に定義されていない。
**Evidence**: タスク契約は `e2e | pnpm exec playwright test --grep @smoke` であり、`--config` を含まない。それに対して C12 は「`e2e` の argv の `--config` をこの設定に置き換えて実行する」とし、0 件ケースでは「`e2e` の argv … + `--grep <一致しないタグ>`」とする。文書上、`--config` は追加すべきなのか、存在しないオプションをどう置換するのか、重複した `--grep` のどちらを有効にするのかが規定されていない。これは文書照合で確認した問題である。
**Confidence**: high
**Proof**: argv 生成ヘルパーのテストで `mise tasks ls --json` が返す実際の `e2e` argv を入力にし、各 nested case の最終 argv に `--config` がちょうど 1 個、`--grep` がちょうど 1 個、`--reporter` が必要な場合にちょうど 1 個だけあることを assert する。
**Fix**: argv を文字列連結せず token 配列として編集する契約を追加する。`--config` は存在すれば置換・なければ追加、`--grep` と `--reporter` は既存値を置換する、と明示し、そのヘルパー自身を unit test で検証する。

### [MEDIUM] 入れ子 Vitest / Playwright が外側 worker の制御環境と色出力を無制限に継承する
**Location**: specs/001-dev-environment-and-gates/plan.md:212-223, 226-231, 352-381
**Issue**: `isolatedEnv()` が除外対象以外を親から継承するため、入れ子ランナーが `VITEST_*`、`NODE_ENV`、`FORCE_COLOR`、`NO_COLOR` など外側 Vitest worker の状態に依存し、出力正規表現を含む自己検査の macOS / ubuntu-24.04 間の再現性が保証されない。
**Evidence**: `isolatedEnv()` は `GIT_*`、`GITLEAKS_*`、`LEFTHOOK*`、`MISE_ENV` だけを除外し、「それ以外は親から引き継ぐ」とする。同じ計画は `expectGateFailure()` で stdout + stderr の文言一致を必須にし、nested runner の成功・失敗を `No test files found`、`no tests were executed`、`UnmockedNetworkError` 等の出力で判定する。環境変数による実際の Vitest 5.1.1 / Playwright 1.65.1 の差異は本レビューでは未実測であり、この点は推論である。
**Confidence**: medium
**Proof**: `VITEST_POOL_ID=sentinel FORCE_COLOR=1 NO_COLOR=0 NODE_ENV=production mise run test -- tests/unit/gate-self-check.test.ts` と、これらを設定しない実行を比較し、nested Vitest / Playwright の終了コード・判定対象出力・子プロセス環境が一致することを確認する。
**Fix**: nested runner 用に `isolatedEnv()` の許可リストまたは専用 option を設け、少なくとも `VITEST_*` を除去し、`NODE_ENV` と色出力を明示値へ固定する。必要な Playwright browser path だけは個別に引き継ぐ理由を計画へ記録する。

### [MEDIUM] Node 27 の `exp/node27` 方針が現行 Constitution と未解決のまま残っている
**Location**: specs/001-dev-environment-and-gates/plan.md:532-541, 583, 922-932
**Issue**: plan は `exp/node27` を「専用修正が必要な時点」に限定する一方、現行 Constitution は Node 27 alpha を `mise.node27.toml` と `exp/node27` で分離検証することを要求しており、どちらを正本として実装するかが確定していない。
**Evidence**: C14 は「`exp/node27` ブランチ（必要になった時点の別作業）」を Does NOT own とし、C16 の憲章改訂対象は原則 3 の MINOR 改訂だけである。他方、Constitution の Additional Constraints は「Node 27 alpha は `mise.node27.toml`（`MISE_ENV=node27`）と `exp/node27` で分離検証」とする。plan 自身も「同じ改訂で明確化することを推奨」としているが、成果物契約にはその改訂を含めていない。これは文書照合で確認した問題である。
**Confidence**: high
**Proof**: `rg -n 'exp/node27|Node 27 alpha' .sdd/memory/constitution.md specs/001-dev-environment-and-gates/plan.md specs/001-dev-environment-and-gates/spec.md` を実行し、憲章側が無条件、plan/spec 側が条件付きであることを確認する。
**Fix**: 人間の Clarification を正本とするなら、同じ 1.1.0 改訂で Constitution の Node lane 制約を「Node 27 専用の修正が必要な場合に `exp/node27` を作る」へ更新し、C16・File Structure Plan・Constitution Compliance にその変更を明記する。憲章を変更しないなら、plan を `exp/node27` 作成を含む設計へ戻す。

## Verdict
REJECT
## Orchestrator findings (Claude, /sdd-validate-plan Step 3, round 4)

### [LOW] Constitution Compliance cites research I-1〜I-14, but I-15 / I-16 now carry evidence
**Location**: specs/001-dev-environment-and-gates/plan.md:928
**Fix**: Change to `I-1〜I-16`.

### [LOW] Nested Playwright timeout note says "5 秒を超える場合" while C6 sets 60 s per subprocess test file
**Location**: specs/001-dev-environment-and-gates/plan.md:482-483 vs 183-185, 494-496
**Fix**: Reword to "the file timeout (initial 60 s)" so tasks do not pick up the stale 5 s figure.

### [LOW] spec.json shows `design.approved: true` (updated_at 2026-11-22T12:52), which predates the round-2 and round-3 plan edits
**Location**: specs/001-dev-environment-and-gates/spec.json
**Fix**: The user re-confirms design approval for the current plan.md before `/sdd-tasks`.

## Probes (orchestrator, round 4)

Scratch dir `/tmp/biomeprobe.NR5ZJ1/r4/` (Playwright 1.65.1, Vitest 5.1.1, chromium-1255, macOS). Repo untouched.

| Probe | Result |
|-------|--------|
| auto fixture with `baseURL` undefined (no webServer, no `use.baseURL`), `page.setContent('<img src="https://probe.invalid/a.png">')` + in-page `fetch` | `BASEURL=undefined`; `context.route` captured both requests (`img` and `fetch`), `fetch` rejected `TypeError: Failed to fetch`. Guard written as `baseURL !== undefined && sameOrigin` blocks everything. Also resolves plan.md:477-478's "未実測の前提" (setContent + context.route) |
| `playwright test --list --reporter=list --grep @smoke --grep @nomatch` | `Error: No tests found`, exit 1 (last `--grep` wins). Reversed order lists the `@smoke` test |
| `playwright test --config A --config B` | B is used (last `--config` wins) |
| nested `vitest run` spawned from an outer Vitest test with `env: process.env` | child inherits `TEST=true, VITEST=true, NODE_ENV=test, VITEST_MODE=RUN, VITEST_POOL_ID=1, VITEST_WORKER_ID=1`; nested run still exit 0 |
| `FORCE_COLOR=1 vitest run <no-match>` | output contains ANSI escapes; the substring `No test files found` still matched (1 hit) |

## Adjudication

Orchestrator: Claude (/sdd-validate-plan). Codex ran (codex-cli 0.171.0, read-only, effort high): cross-family round.

| Finding | Decision | Evidence |
|---------|----------|----------|
| (Codex) [CRITICAL] nested Playwright `baseURL` undefined | stands, downgraded to MEDIUM | Contract gap is real (plan.md:264, 371-374 define no `baseURL` rule for the nested config). Not infeasible: probe shows the guard works with `baseURL` undefined when the "no baseURL → no allowed origin" branch is explicit. A naive `new URL(baseURL)` would fail both `(e)` and its control loudly (no fake pass) |
| (Codex) [HIGH] argv edit for `--config` / `--grep` undefined | stands, downgraded to MEDIUM | plan.md:374 says "replace `--config`" but the `e2e` argv (plan.md:643) has none. Probe: Playwright takes the last `--grep` / `--config`, so appending is deterministic today, but the plan relies on undocumented last-wins. Define token-level edit (add `--config`; replace `--grep` value) |
| (Codex) [MEDIUM] nested runners inherit outer worker env / color | stands | probe: `VITEST_*`, `NODE_ENV=test`, `TEST=true` inherited; `FORCE_COLOR=1` injects ANSI into asserted output |
| (Codex) [MEDIUM] `exp/node27` vs constitution Node lane | escalated | constitution.md:223-224 vs spec Clarification 4; plan.md:932 itself defers to the user. Expanding the 1.1.0 amendment beyond 13.7 is a spec decision |
| (Claude) [LOW] x3 | stands | see above |

Caller verdict: no CRITICAL / HIGH after adjudication → APPROVE_WITH_NOTES. /sdd-validate-plan decision: GO, with the three MEDIUM plan edits and the escalated decision settled before `/sdd-tasks`.

## Resolution (round 4, 2026-11-23)

User decision on the escalated item: option A. The 1.1.0 constitution amendment also clarifies the Node lane (`exp/node27` is created only when a Node-27-only fix is needed). Spec Clarifications (Session 2026-11-23) added and 13.7 widened.

| Finding | Resolution | Where |
|---------|------------|-------|
| (Codex) [MEDIUM, was CRITICAL] nested Playwright `baseURL` undefined | fixed: guard rule "no `baseURL` → no allowed origin, block all"; the setContent + `context.route` premise is now measured (Linux left to R-9) | plan C7, E2E fixture contract, C12 (e) premise; research I-17 |
| (Codex) [MEDIUM, was HIGH] argv editing | fixed: `editArgv` token-level contract (add/replace `--config`, replace `--grep` / `--reporter`, exactly one each), tested in `sandbox.test.ts` (6); case (d) reworded to replace `--grep` | plan C6, C12 "入れ子実行の argv", File Structure |
| (Codex) [MEDIUM] nested env inheritance | fixed: `isolatedEnv({ nested: true })` drops `VITEST*`, `TEST`, `FORCE_COLOR`, `NODE_ENV`; measured that `FORCE_COLOR=0` still colors Vitest and `NO_COLOR` does not help, so unset rather than set; tested in `sandbox.test.ts` (5) | plan C6, C12 "入れ子実行の環境"; research I-17 |
| (Codex) [MEDIUM] `exp/node27` vs constitution | fixed per user decision A | spec Clarifications, 13.7; plan C16, File Structure, Constitution Compliance |
| (Claude) [LOW] I-1〜I-14 | fixed: I-1〜I-17 | plan Constitution Compliance |
| (Claude) [LOW] stale 5 s timeout note | fixed: refers to the 60 s file timeout | plan C12 |
| (Claude) [LOW] design approval predates edits | open: user re-approves design | spec.json |

Remaining: none at CRITICAL / HIGH / MEDIUM. Plan decision: GO, pending the user's design re-approval.
