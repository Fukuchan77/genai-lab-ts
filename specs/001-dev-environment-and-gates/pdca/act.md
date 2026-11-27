# Act Phase — 001-dev-environment-and-gates

PDCA Act: Check の結果から学びを整理し、再利用できるパターンと防止策にする。
入力は [check.md](check.md)。作成日 2026-11-27。

## Check Phase Summary

計画の受け入れ基準はほぼすべて満たした。`mise run verify` は `main` で緑（unit 235/235、`@smoke` 2/2）、CI の必須チェック `verify` も緑。段 1 の合格条件（ネットワーク不要で通る、秘密値 commit の拒否）は自動テストで確かめられた。残りは Node 27 の E2E 失敗（記録済み）だけ。AGENTS.md の "Current state" の古さと Dependabot の Insights の未確認は 2026-11-27 に解消した。

## Outcome

**Success**（段 1 の合格条件は満たした）。確認の残りは Node 27 の扱いだけで、「記録して非ブロック」と決定済みのため、spec 001 は完了と判断できる。

## Success Pattern OR Mistake Record

### If successful — Pattern

- **Problem**: ゲートやテストが「通っている」ことは、それが違反を捕まえることの証拠にならない。実装の途中で、壊しても緑のままのテストが 3 件見つかった。
- **Solution**: 受け入れテストごとに、対象の検査を**値を変えて壊し**、そのテストが失敗することを確かめる（PROVE）。戻すときは Edit で、`diff` で壊す前と一致を確かめる。
- **Implementation**: [`.sdd/patterns/prove-gates-by-breaking-their-value.md`](../../../.sdd/patterns/prove-gates-by-breaking-their-value.md)
- **Benefits**: 空虚なテストを、マージの前に見つけられる。ゲートが「効く」と言える根拠になる。ほかの spec（002 以降）にもそのまま使える。
- **Evidence**:
  - `specs/001-dev-environment-and-gates/research.md` R-10（各 PROVE の表）
  - do.md の 4.1（`exact: true` を足すまで、見出しを変えても通った）、4.3（`.invalid` は遮断しなくても DNS 失敗で同じ結果になった）、5.2（ignore 済みファイルが走査対象外の場所にあった）
- Saved to: `.sdd/patterns/prove-gates-by-breaking-their-value.md`

### If challenged — Mistake Record

事故 2 件を記録した。どちらも成果物の合否は変えなかったが、作業の証拠を損ねた。

- **What happened**: 外部の変更を `cp` で上書き（`sandbox.ts`、`check-commit-msg.mjs`）。拒否された Edit のあとに中途半端な状態が残り、フラグが重複した（`lefthook.yml`）。
- **Root cause**: 復元に `cp` を使い、上書き前に内容を確かめなかった。拒否のたびに状態を確かめず、次の Edit を重ねた。
- **Impact**: `check-commit-msg.mjs` の外部変更の中身は再現できない。`lefthook.yml` の問題は `verify` の失敗として見つかり、コミット前に直った。
- **Prevention**: 復元は Edit と `diff` で行う。拒否や外部の変更の通知のたびに、次の操作の前に状態を確かめる。
- Saved to: `.sdd/mistakes/001-dev-environment-and-gates-2026-11-27.md`

## Learnings → Rules Mapping

| Learning | Candidate rule / steering update |
|----------|----------------------------------|
| 壊しても緑のテストが実装中に 3 件見つかった | PROVE は `test-strategy/tdd-workflow.md` Phase 3.5 に既にある。足りなかった「壊した直後に `diff` で編集が効いたことを確かめる」を 1 行追加した（2026-11-27、ユーザー承認）。外部通信・走査対象のように、壊さなくても同じ結果になる入力の選び方は、根拠が 2 件のため `.sdd/patterns/` に留める |
| `cp` で戻すと外部の変更を上書きした | 作業中のファイルを `cp` で戻さない。`tdd-enforcement` か `sub-agent-coordination` の作業規則に一行足す候補。ユーザーの global AGENTS.md の「Keep uncommitted work safe」と同じ趣旨 |
| 拒否された Edit で状態が分からなくなった | 拒否のたびに `diff` で状態を確かめてから次の編集をする。`pdca-cycle` か `error-handling` の「STOP → investigate」に組み込む候補 |
| 手元でだけ再現する失敗（ANSI 色） | 再現しない環境の緑を、修正の証拠として書かない。計測を依頼する前に、変数を 1 つずつ外す手順を渡す。`error-handling` の Root Cause First に含める候補 |
| 憲章 principle 8 の gitleaks 位置を、計画外に変えた | 計画外の変更は、理由と一緒にユーザーに伝えて承認を得る（今回は実施済み）。手順として明文化するかは保留 |
| TypeScript 7.1 の RC / stable は未公開、beta を据え置き | 次回の `mise run outdated` で再確認する。`dependabot.yml` の ignore（PR #5）で、夜間ビルドは既に除外済み |
| Dependabot の Insights は CLI で読めない | 人の目視は補助に留め、主根拠は設定・自己検査・`gh run list --workflow "Dependabot Updates"` の run ID（再検証できる）にする。`/dependency-security-refresh` の手順に、この確認を入れる候補 |

## Process Improvements

- **PROVE をタスクの完了条件に入れる**: 今回は PROVE を各タスクに書いたが、壊す編集が効いたかを確かめ忘れた例が 2 件あった。次の spec では、PROVE の記録に「壊す前後の `diff`」と「該当テストの失敗行」を必ず残す。
- **外向きの操作の前に状態を確かめる**: 12.2 の (d4)・(e) は、管理された秘密値ブロックで手動の実験が行えなかった。実験の前に、そのツールの制約を確かめておく。
- **完了条件を実際の検査と揃える**: 12.7 の完了条件に AGENTS.md の更新がなかったため、マージ後の "Current state" が古いまま残った。`/sdd-ship` の完了条件に、ドキュメントの現況の確認を入れる候補。
- **do.md の記録を事実と照合してから Check に使う**: 今回、PR #4 が「open」と書かれていたが、実際は closed だった。Check の前に `gh pr view` で状態を確かめた。

## Next Actions

優先度の高い順に、担当はユーザー（操作が必要なもの）と Claude（ファイルの編集）に分ける。

1. ~~**【Claude・すぐ】AGENTS.md の "Current state" を更新する**（13.8）~~ → **済（2026-11-27）**。マージ済み、`verify` が必須チェック、Node 27 の E2E 失敗の記録へのリンクを反映。grep で古い記述が残っていないこと、`mise run test` 235/235 を確認。
2. ~~**【ユーザー】Dependabot の設定を GitHub の Insights で確かめる**（10.11、10.12）~~ → **済（2026-11-27）**。エラー表示なし、直近の実行もエラーなし。補助の観測として R-9 に追記し、再検証できる証拠として `Dependabot Updates` の run ID 6 件を併記した。
3. **【ユーザー・判断】Node 27 の E2E 失敗の原因を調べるかどうかを決める**。`rawHeaders.hasOwnProperty is not a function` は Next.js canary と Node 27 alpha の非互換と推定されるが、未確認。Node 27 の修正が要るかどうかは、`exp/node27` を作る条件になる（spec の決定どおり）。
4. ~~**【Claude・次の spec 前】`test-strategy` に PROVE の手順を書き加える**~~ → **済（2026-11-27）**。PROVE 自体は既存。`tdd-workflow.md` Phase 3.5 の手順 1 に、壊した直後の `diff` の確認を 1 行追加した。復元前の外部変更の確認（事故 1）をスキルに足すかは未決定。
5. **【ユーザー】PR #4 の TypeScript 夜間ビルドの件は閉じた**（PR #5 で ignore 済み）。対応は不要。
6. **【次の段】段 2（`/sdd-spec` からの次の stage）**: 段 1 の完了を確認したら、次の spec に進む。段 2 の plan で、AI SDK 7 の型照合の結果（R-6）を入力にする。ZIP の `Playwright @smoke` の locator の曖昧さ（`getByRole('alert')`）は、段 3 の spec の入力に残す。

## 完了の判断

spec 001 の「完了」の条件は、AGENTS.md の "Current state" の更新と Dependabot の確認で、どちらも 2026-11-27 に済んだ。Node 27 E2E の扱い（3）は「記録して非ブロック」で決定済みなので、調査は任意。実質の残りはない。
