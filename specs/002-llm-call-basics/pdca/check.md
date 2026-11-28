# Check Phase — 002-llm-call-basics

PDCA Check: 実装の結果（[do.md](do.md)）を計画（[plan.md](../plan.md)、[tasks.md](../tasks.md)）と比べる。
`/sdd-reflect` が 2026-11-28 に生成した。証拠のコマンドと出力は [research.md](../research.md) の R-1〜R-7 にある。

## Expectations vs. Results

| Expectation (from plan) | Result (from do) | Status |
|-------------------------|------------------|--------|
| 4 依存を exact 版で追加し、公開から 24h 以上、agent skill を拒否（C1、1.1〜1.4） | `ai` 7.0.183 ほか 4 件。`--frozen-lockfile` 成功、`mise run security` 終了コード 0（R-1、R-7） | ✅ |
| `callModel` が注入されたモデルで `generateText` を 1 回呼び、5 設定・2 項目の usage・`CallFailedError` を返す（C2、REQ-001〜004） | 実装済み。分岐カバレッジ 100%（33/33、R-6）。PROVE で 26 か所すべて失敗（R-3） | ✅ |
| 段 2 の合格判定テストは API キーとネットワークなしで決定論的に通る（REQ-006、NFR） | `mise run verify` 終了コード 0、14 ファイル 387 件。CI の必須チェック `verify`（ubuntu）が PR #10 で緑 | ✅ |
| モックだけのテストは 1 件 1 秒以内（NFR） | `llm-call-basics.test.ts` の `describe` に 1000 ms のタイムアウト。超過なし | ✅ |
| hello は Ollama 未起動で 15 秒以内に案内して終わる（NFR、5.3） | (b) 6 s、(c) 1 s、(a) 終了コード 0（ユーザーの環境での実測、R-5） | ✅ |
| hello の静的検査（タスク 3.6）は `process.env` の不在と `callModel` の引数を確かめる小さなテスト | `/sdd-ship` の Codex 指摘で `explain()` 内の漏えいを捕まえないと分かり、構文木の検査に作り直した。約 980 行、72 件 | ⚠️ 規模が想定を大きく超えた |
| 段 2 の解説（4 節 + 2 節）と統治文書の同期（C6、C7） | `docs-structure.test.ts` 12 件 GREEN。「改造する」の課題 5 は実測で確認 | ✅ |
| 1 段 = 1 PR | PR #10（`feat/llm-call-basics` → `main`）を作成 | ✅ |

## Test & Quality Outcomes

- Tests: unit 387/387（14 ファイル）、E2E `@smoke` 2/2。分岐カバレッジ（`basics.ts`）100%（33/33）。
- Lint/type checks: Biome、`tsc --noEmit`、`check:model-ids`、`check:secrets` すべて成功（pre-commit とローカルの gate）。
- CI（PR #10）: `verify` pass（1m10s）。`typescript/sync`（ネイティブのコンパイラを子プロセスで起動）が ubuntu で動くことは、
  これで確かめられた。`verify-node27` は fail。原因は既知の E2E の失敗（`rawHeaders.hasOwnProperty is not a function`、
  [docs/node27/2026-11-23-initial-lane.md](../../../docs/node27/2026-11-23-initial-lane.md)）で、Node 27 でもユニットテストの
  14 ファイルは通った。
- Performance vs. targets: hello の失敗経路は 6 s（目標 15 s 以内）。モックのテストは 1 件 1 s 以内。
- 非空虚: PROVE は合わせて 58 か所（26 か所 + 3.6 の回避 32 通り）。すべてで、壊すとテストが失敗した。対照の 2 件
  （`detail` の改名、解説どおりのプロバイダ差し替え）は通った。

## Requirements Coverage

- Covered: 8/8 要件（REQ-001〜008）、受け入れ基準 62/62（[traceability.md](../traceability.md) の Gaps）。
- Gaps: なし。ただし traceability.md の Test 列と Commit 列が空のまま（`/sdd-ship` が埋めるはずだった）。PR #10 の本文には、
  コミットの内容から割り当てた要件 → コミットの表がある。

## Deviations from Design

- **タスク 3.6 の検査方式**: tasks.md では文字列の静的検査（`process.env` の不在、`callModel(` の引数）を想定していた。
  `/sdd-ship` の MEDIUM 指摘を受けて、`typescript/sync` の構文木と閉じた規則の集合に変えた。依存は増えていない
  （`typescript` に同梱の beta API）。`_Boundary:_` は変えていない。
- **検査の範囲**: ユーザーの判断（2026-11-27）で、敵対的な書き換え（組み込みの上書き、`Symbol.hasInstance`、`node:fs` の追加、
  catch の中で整形関数を替える）は対象外にした。解説の「プロバイダを変える方法」と矛盾しないことを優先した。
- **振る舞いでの検査は先送り**: `explain()` を `src/` の関数にして偽のエラーを渡す案は、`hello.ts` と `src/` の変更を伴うので、
  段 3 以降の候補として残した。

## Issues Encountered

| Issue | Root cause | Resolution |
|-------|-----------|------------|
| `llm-call-basics.test.ts` の 2.3 の 3 件が GREEN にならない（タスク 4） | テストの補助関数 `success()` の既定引数が、明示的な `undefined` を既定値に置き換えた | 引数をオブジェクトに変えた（R-2） |
| hello の静的テストが弱い（Step 4.5、MEDIUM） | `console.*` の直接の引数しか見ていなかった | 4 つの変異で非空虚を確認して修正（`.sdd/reviews/002-llm-call-basics-1-5.2-codex.md`） |
| `explain()` の中で `String(error.cause)` にしても 8 件が GREEN（`/sdd-ship`、MEDIUM） | 漏えいを防ぐ検査を、文字列で「書かれていないこと」として表していた。何を防ぐか（現実的な回帰か、敵対的な書き換えか）を決めないまま検査を書いた | 構文木の検査に変え、Codex を 8 回回した。5・6 回目で足した規則は範囲の決定で外した（[mistake record](../../../.sdd/mistakes/002-llm-call-basics-2026-11-28.md)） |
| `mise run hello` が自動モードで拒否された（5.3） | Ollama への実接続は手動の操作 | ユーザーの環境で実測してもらい、R-5 に記録 |
| ネットワークを切った実行（6.5）の証拠がユーザーの申告だけ | 切断の状態を出力で示す手段がなかった | 申告として R-4 に記録（出力に証拠の行はない、と明記） |
| `/sdd-ship` の REQUEST_CHANGES のあとの再実装が未コミットのまま、autopilot の状態が `next: pr` を返した | 状態スクリプトは「未チェックのタスク数」で判定し、ship の差し戻しと再実装を追わない | ユーザーの承認を得て 2 コミット（`34e7d65`、`cd1211d`）にしてから push した |

## Assessment

計画した要件はすべて満たし、ゲートは非空虚であることを確かめた（PROVE 58 か所、分岐 100%）。CI の必須チェックも緑。
本番の意味での「出荷」はない学習用の段だが、段 2 の合格条件（モックだけで呼び出しの基本が確かめられる、hello で実物に
つながる）は満たしたので、PR #10 はマージできる状態にある。課題は 1 件。タスク 3.6 の静的検査が想定の数倍の大きさになり、
レビューの往復が 8 回かかった。これは成果物の合否ではなく、進め方の問題として Act で扱う。
