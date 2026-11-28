# Act Phase — 002-llm-call-basics

PDCA Act: Check の結果から学びを整理し、再利用できるパターンと防止策にする。
入力は [check.md](check.md)。作成日 2026-11-28。

## Check Phase Summary

要件 8 件と受け入れ基準 62 件をすべて満たした。`mise run verify` は 387/387 と E2E 2/2 で緑、PR #10 の必須チェック `verify` も緑。
PROVE は 58 か所すべてで失敗を確かめ、`basics.ts` の分岐カバレッジは 100%。hello の失敗経路は 6 s（目標 15 s）。
課題はタスク 3.6 の 1 件だけ。hello の静的検査が `/sdd-ship` で差し戻され、レビューを 8 往復して約 980 行になった。

## Outcome

**Success**（課題 1 件つき）。段 2 の合格条件は満たし、PR #10 はマージできる状態にある。課題は成果物の合否ではなく進め方のもので、
下の Mistake Record にまとめた。

## Success Pattern OR Mistake Record

### If successful — Pattern

新しいパターンは作らず、spec 001 の PROVE パターンを更新した。

- **Problem**: テストが通っても、違反を捕まえる保証はない。逆に、厳しすぎる検査は正当な変更まで拒む。
- **Solution**: 値を変えて壊し、失敗を確かめる（spec 001 と同じ）。加えて、**通るべき正当な変更**を対照として入れ、緑のままで
  あることを確かめる（手順 7 を追加）。
- **Implementation**: [`.sdd/patterns/prove-gates-by-breaking-their-value.md`](../../../.sdd/patterns/prove-gates-by-breaking-their-value.md)
- **Benefits**: 空虚なテストと厳しすぎるテストを、どちらもマージ前に見つけられる。
- **Evidence**: research.md R-3。`callModel` の 26 か所と `explain()` の回避 32 通りがすべて失敗し、対照 2 件は通った。対照によって、
  5・6 回目の import の規則が解説の「プロバイダを変える方法」と衝突していると分かった。
- Saved to: `.sdd/patterns/prove-gates-by-breaking-their-value.md`（Evidence と手順 7 を追記）

### If challenged — Mistake Record

- **What happened**: `hello.ts` が prompt や `cause` を出さないこと（5.7）の静的検査が、Codex のレビューのたびに回避された。
  構文木の検査に変えても回避が続き、6 回目で約 1,200 行・82 件になった。ユーザーが範囲を決めたあとは 2 回で収束した（約 980 行・72 件）。
  あわせて、ship の差し戻しのあとの未コミットの再実装を、状態スクリプトが「出荷済み」と判定した。
- **Root cause**: 検査が防ぐ相手（現実的な回帰か、敵対的な書き換えか）を、spec・plan・tasks に書いていなかった。振る舞いの要求
  （出力に含まれない）を、構文の性質（ソースに書かれていない）で近似した。import できないスクリプトに、振る舞いで確かめる継ぎ目を
  用意しなかった。
- **Impact**: 3.6 が想定の数倍の規模になり、5・6 回目の規則は手戻りになった。テストは beta の API（`typescript/sync`）に依存する。
- **Prevention**: 「漏らさない」要件の plan に脅威モデルを 1 行書いて、レビューの依頼文にも渡す。振る舞いの要求は継ぎ目を作って
  振る舞いで確かめる。同じ種類の回避が 2 回続いたら、範囲をユーザーに確かめる。pr 段の最初に作業ツリーを確かめる。
- Saved to: `.sdd/mistakes/002-llm-call-basics-2026-11-28.md`

## Learnings → Rules Mapping

| Learning | Candidate rule / steering update |
|----------|----------------------------------|
| 範囲を決めない敵対的レビューは収束しない | `adversarial-review` / `codex-review` の依頼文に「Threat scope」欄を設け、plan の脅威モデルの行を写す。根拠は 1 件なので、まず `.sdd/mistakes/` に留め、段 3 以降で再発したら skill に上げる |
| 同じ種類の回避が続いたら止まって範囲を確かめる | `/sdd-impl` Step 7（調査を別のエージェントに分ける）の手前に、「同じ種類の指摘が 2 回続いたら範囲をユーザーに確かめる」を足す候補。ユーザーの承認が要る |
| 振る舞いの要求を構文で近似すると脆い | `test-strategy` に「import できないスクリプトの出力は、整形の関数を `src/` に出して偽の入力で確かめる」を足す候補。段 3 で `explain()` を移すときに実例を作ってから判断する |
| PROVE の対照（通るべき変更）で、厳しすぎる検査に気づけた | パターンに手順 7 として追記済み。`tdd-workflow.md` Phase 3.5 に 1 行足す候補（ユーザーの承認が要る） |
| ship の差し戻しを状態スクリプトが追わない | `sdd-autopilot-state.sh next` が、追跡ファイルの変更や最新の ship レビューの REQUEST_CHANGES を警告する候補。当面は pr 段の最初に `git status` を確かめる |
| traceability.md の Test 列と Commit 列が空のまま | `/sdd-ship` の完了条件に「traceability.md の該当行を埋めた」を入れる候補 |
| 手動の操作（Ollama、ネットワーク切断）の証拠が申告だけ | 依頼するときに、出力に残る証拠の行（終了コード、`ping` の失敗など）を一緒に貼ってもらう手順を先に渡す（spec 001 の補足と同じ趣旨） |

## Process Improvements

- **plan で検査の範囲を決める**: 段 3 以降で「〜を漏らさない」「〜を出さない」の要件が出たら、plan の該当 C 節に脅威モデルを書き、
  `/sdd-validate-plan` で確かめる。
- **振る舞いの継ぎ目を先に作る**: 実物のモデルや `server-only` に依存するコードは、出力を作る部分を純粋関数として `src/` に置き、
  テストから偽の入力で呼べるようにする。
- **差し戻しのあとは ship をやり直す**: `/sdd-ship` が REQUEST_CHANGES のときは、再実装・コミット・ship の再実行までを 1 つの流れにして、
  未コミットのまま次の段に進まない。
- **traceability.md を ship で埋める**: 今回は空のまま PR を作り、PR 本文の表は手で作った。

## Next Actions

優先度の高い順。担当はユーザー（判断・操作が必要なもの）と Claude（ファイルの編集）に分ける。

1. **【ユーザー】PR #10 をレビューしてマージする**。`verify` は緑。`verify-node27` の失敗は既知の E2E の問題で、ユニットテストは
   Node 27 でも通っている。
2. ~~**【Claude・マージ前】未コミットのファイルをコミットする**~~ → **済（2026-11-28、`f239c23`）**。
3. ~~**【Claude】traceability.md の Test 列と Commit 列を埋める**~~ → **済（2026-11-28）**。PR 本文の表と、各テストファイルが
   引用する受け入れ基準の番号から割り当てた。
4. **【ユーザー】Learnings → Rules の候補を判断する**: `/sdd-impl` Step 7 の手前の確認、`tdd-workflow.md` Phase 3.5 の対照、
   `sdd-autopilot-state.sh` の警告。いずれもグローバルの skill の変更なので、承認があってから入れる。
5. **【段 3】`explain()` を `src/` の関数に移す**ことを段 3 の plan で検討する。移せば、3.6 の構文木の検査の大部分を振る舞いの
   テストに置き換えられ、beta API への依存も外せる。
6. **【週次】`typescript` を上げるときは `hello-task.test.ts` を先に走らせる**（`typescript/sync` は beta の公開 API）。
