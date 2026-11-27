# Check Phase — 001-dev-environment-and-gates

PDCA Check: 実装結果（Do）と計画（plan.md / spec.md の受け入れ基準）を比べる。
入力は [do.md](do.md)、根拠は [research.md](../research.md)、確認日は 2026-11-27。

## Expectations vs. Results

| 期待（spec / plan） | 結果（do / research） | 状態 |
|---|---|---|
| 3.1〜3.4 `mise run verify` がオフライン検査を直列に実行し、全部通ったときだけ 0 | 2026-11-27 に `mise run verify` を再実行し exit 0。unit 235/235、`@smoke` 2/2 | ✅ |
| 3.5・3.7 ネットワーク遮断・同一環境で 3 回連続 同じ合否 | 12.1。到達不能プロキシで 3 回とも exit 0（24 s / 19 s / 19 s）、実行前後で `git status` 不変（R-3） | ✅ |
| 3.2・3.8・3.9・3.11 違反状態で該当構成要素が非 0 | 12.2 の (a)〜(d1)〜(d3) は確認。(d4) 秘密値 commit と (e) 検出値の非出力は、管理された秘密値ブロックが実験 commit を拒否したため手動では実施できず、ユーザー判断で `gitleaks-pre-commit.test.ts` を証拠にした | ⚠️ 手動の記録は代替 |
| 3.12 検出値を出力しない | `check:secrets` の出力に検出値が含まれないことを自動テストで確認（6.1、7.1） | ✅ |
| 4.1〜4.4 security が到達不能・advisory で非 0 | 12.4。到達不能は audit 1（70 s、リトライ）・osv 127。lodash 4.17.20 は audit 1、osv 1 | ✅ |
| 7.5・7.6 pre-push が osv → audit → unit → smoke の順で直列、失敗で停止 | 7.5 で実リポジトリの `lefthook run pre-push` が 4 ジョブを順に実行し全部通過（17.22 s）。12.1 で、差分にファイルがない push では `no matching push files` で全ジョブ skip することを確認（R-11） | ✅ 制約あり |
| 8.1〜8.8 秘密値を含む commit の拒否を自動テストで確かめる | `gitleaks-pre-commit.test.ts`。偽キーは実行時生成、フック経由で commit が作られないことを確認 | ✅ |
| 9.7 受け入れテストが非空虚 | 12.3 と各タスクの PROVE（R-10）。実施中に、壊しても失敗しないテストが 3 件（4.1、4.3、5.2）見つかり直した。壊す編集が効かず確かめられなかった例が 2 件（3.1、4.3）あり、いずれもやり直した（詳細は [act.md](act.md)） | ✅ |
| 10.1・10.2 `verify` を必須チェックにし、失敗でマージをブロック | CI run 45614530248 で `verify` 成功（78 s）。ruleset `protect-main` に `verify` を追加（12.6） | ✅ |
| 10.3・10.4 Node 27 ジョブは参考、失敗してもワークフロー全体は失敗しない | `verify-node27` は E2E で失敗、ワークフローは success（12.5） | ✅ |
| 10.5 security-daily が毎日動き、失敗は通知 | 定期実行（11-26）と手動実行（run 45919206349、11-27）が成功（12.7） | ✅ |
| 10.11・10.12 Dependabot の週次・cooldown 設定 | 主根拠: `.github/dependabot.yml` と `repo-policy.test.ts` の Dependabot の検査、PR #4 の提案版がすべて 24 時間以上前の公開（cooldown の比較）。再検証できる証拠: `Dependabot Updates` の最新 6 件がすべて `success`（run ID は R-9）。補助: 2026-11-27 にユーザーが Insights で設定エラーの表示がないことを目視で確認 | ✅ |
| 11.1〜11.6 Node 27 レーンの設定と初回記録（失敗を含む） | `mise.node27.toml`、`docs/node27/2026-11-23-initial-lane.md`（5 見出し）。E2E が Node 27 で失敗（`rawHeaders.hasOwnProperty`）。spec は失敗の記録を求めている | ✅ 記録どおり（緑ではない） |
| 12.5・12.6 TypeScript 7.1 の RC / stable が 24 時間以上公開されたら切り替え、未公開なら据え置き | 2026-11-27 時点で `rc` = 7.0.1-rc、`latest` = 7.0.2、`beta` = 7.1.0-beta。7.1 は dev 版のみ。beta 据え置きが正しい | ✅ |
| 13.1〜13.12 解説・README・統治文書の整合 | 解説の 4 節、README、憲章 1.1.0、AGENTS.md、plan 000 の注記を作成。AGENTS.md の "Current state" は、マージ後に古くなっていたため 2026-11-27 に更新した（`mise run test` 235/235） | ✅ |

## Test & Quality Outcomes

- Tests: unit 235/235 passed（11 ファイル）、E2E `@smoke` 2/2 passed（2026-11-27 の `mise run verify` 実測）
- Lint / type checks: `mise run check` と `tsc --noEmit` は verify に含まれ、exit 0
- `check:model-ids`: 0 findings（`scanned 39 files` 時点。以後も 0）
- `check:secrets`: 履歴 12 commit で検出 0（7.1 時点）
- Performance vs. targets:
  - `mise run verify`: 24 s / 19 s / 19 s（クリーンな clone、R-11）
  - pre-push 全体: 17.22 s（開発機、7.5）、19.5 s（clone、12.1）
  - E2E `@smoke`: 2.5 s（2026-11-27）。目安 60 秒に十分余裕がある（TODO(E2E_BUDGET) は spec 003 で確定）
  - 子プロセスのテストの最長: 3.3 s。timeout 120 s は実測より大幅に長く、tasks.md の「60 秒」の記述とは違う（R-11）

## Requirements Coverage

- Covered: 対応する受け入れ基準のうち、自動テストまたは実行記録が残るもの。全 13 要件を対象とする。
  - ✅ 完全に確認: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.1〜10.12、11.1〜11.7、12.1〜12.7、13.1〜13.12
  - ⚠️ 代替: 12.2 の (d4)・(e) の手動記録（自動テストで代替）
- Gaps:
  - ~~10.11・10.12: Insights の目視確認が未実施~~ → 2026-11-27 にユーザーが確認済み（エラー表示なし）。補助の観測で、主根拠は設定・自己検査・run ID（R-9）
  - ~~13.8: AGENTS.md の "Current state" が「マージ前」の記述のまま~~ → 2026-11-27 に更新済み
  - **12.2 (d4)・(e)**: 手動の実験はされていない（ユーザーが自動テストを証拠にすると決定）

## Deviations from Design

計画（plan.md / tasks.md）と実装の違い。いずれも do.md または research.md に理由を記録済み。

- `editArgv` の `--config` と `--reporter` は、なければ追記する。計画は置換だけを書いていた。`e2e` の argv に `--reporter` がなく、`--list` の検査で必要になったため（2.1）
- `useTempGitRepo` を `createTempGitRepo` に改名。`use*` の名前が Biome の `useHookAtTopLevel` に引っかかったため（3.1）
- `check:model-ids` の入力を一時リポジトリに置く形にし、allowlist を型ストリップで読む（5.2）。`\b` の境界は計画と違い、ハイフンが違いを生むと実測（R-9）
- 有効な設定を変更: `next.config.ts` に `partialPrefetching: false` と `agentRules: false`、`experimental.agentUpgrade: false` を足した（ユーザー判断。`next dev` が AGENTS.md を書き換えるため）
- `.env.example` は ZIP の値（`AI_PROVIDER=ollama` など）を外し、変数名だけにした（13.5 の要件どおり）
- 入れ子の Playwright のテストは、`.invalid` ドメインではなくローカルの HTTP サーバーに向けた。`.invalid` は遮断しなくても DNS 失敗で同じ結果になり、ガードの有効性を示せなかったため（4.4）
- 憲章 principle 8 の gitleaks の位置を verify と揃えた。計画外の変更だが、一貫性のためにユーザーに伝えて承認を得た（11.2）
- Node 27 のワークフローは同じ検査を実行し、E2E の失敗を許容している。計画どおり
- 12.1 の clone で測定した。worktree は `lefthook install` が実リポジトリと共有のフックを書き換えるため使わなかった（計画の注記どおり）

## Issues Encountered

| Issue | Root cause | Resolution |
|---|---|---|
| 壊しても失敗しないテストが 3 件（4.1 の見出し、4.3 の外部通信、5.2 の ignore 検査）、壊す編集が効いていなかった PROVE が 2 件（3.1、4.3） | 4.1: `getByRole(..., { name })` が部分一致。4.3: `.invalid` は遮断しなくても DNS 失敗で同じ結果になる。5.2: ignore 済みファイルを走査対象外のディレクトリに置いていた。3.1・4.3: formatter が Edit の `old_string` を変えていた、または古い文字列に一致した | PROVE で見つけて直した。`exact: true`、ローカルサーバーと `hits === 0` の検査、ファイルを走査対象の場所に置き直し、値を変える壊し方に統一（[pattern](../../../.sdd/patterns/prove-gates-by-breaking-their-value.md)） |
| 入れ子の Vitest が開発者の端末で ANSI を出し、2 件のマッチャーが失敗 | 原因は未特定。計測では `FORCE_TTY=false` と `NO_COLOR=1` で 0 件になる | 入れ子実行の環境で `NO_COLOR=1`、`FORCE_TTY=false` を設定。ただし機械ごとに違う理由は特定できていない（R-9） |
| Node 27 で Next.js の dev サーバーが `rawHeaders.hasOwnProperty is not a function` で落ちる | Node 27 alpha と Next.js canary.60 の非互換と推定。原因は未確認 | 初回記録に残し、`verify-node27` は非ブロックのまま。`exp/node27` は Node 27 専用の修正が必要になったときに作る（spec の決定） |
| `restore` の `cp` が、システム通知で示された外部の変更を上書きした（`sandbox.ts`、`check-commit-msg.mjs`） | 復元に `cp` を使い、直前の読み込みと内容が違うことを確かめなかった | 以降は Edit で戻し、`diff` で確かめた。詳細は [mistakes](../../../.sdd/mistakes/001-dev-environment-and-gates-2026-11-27.md) |
| 拒否された Edit が `lefthook.yml` を中途半端な状態で残し、フラグが 2 回入った | 途中で拒否された Edit の後に、復元の Edit が古い文字列に一致した | `diff` で気づき、重複を Edit で取り除いた。以後は拒否のたびに `diff` を取る |
| Dependabot が TypeScript の夜間ビルド（`7.1.0-dev.…`）を提案（PR #4） | `dependabot.yml` の `ignore` を入れる前に、夜間ビルドの `next` タグを拾った | PR #4 は閉じ、ignore 規則を入れた PR #5 がマージされた（`>= 7.1.0-dev, < 7.1.0-rc`） |
| 12.2 の (d4)・(e) を手動で実施できなかった | 管理された秘密値ブロックが、実験用の偽の秘密値 commit を `core.hooksPath=/dev/null` でも拒否した | ユーザー判断で `gitleaks-pre-commit.test.ts` を証拠にした。手動の実験は行っていない |
| AGENTS.md "Current state" が、マージ後も「マージ前」の記述のまま | 12.7 の完了条件に、AGENTS.md の更新が含まれていなかった | 2026-11-27 に更新（マージ済み、`verify` が必須チェック、Node 27 の E2E 失敗の記録へのリンク） |

## Assessment

計画の受け入れ基準はほぼすべて満たした。段 1 の合格条件（verify がネットワーク不要で通る、秘密値を含む commit がフックで拒否される）は、どちらも自動テストで確かめられ、`main` にマージ済みで CI の必須チェック `verify` も緑になった。

残っているのは次の 2 点で、いずれも段 1 の合格を妨げるものではない。
1. Node 27 レーンの E2E が失敗している（spec が失敗の記録を許容している。原因は未確認）
2. 12.2 の (d4)・(e) は手動の実験ではなく自動テストで代替している

AGENTS.md の "Current state"（13.8）と Dependabot の Insights の確認（10.11・10.12）は 2026-11-27 に解消した。

本番に出せる状態かという問いには、段 1 はラボの基盤なので「はい」と答えられる。AI コードはまだ存在しない（段 2 以降で追加する）ため、AI の本番運用の判断は対象外。
