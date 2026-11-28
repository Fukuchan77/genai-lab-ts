# PDCA Do — 002-llm-call-basics

`/sdd-impl` が書く実装ログ。コマンドと出力の証拠は [research.md](../research.md) の R-1〜R-7 にある。

## 2026-11-27

### タスク 1（1.1〜1.4）: 依存の宣言と導入 — 完了
- RED（1.1）: `repo-policy.test.ts` の追加 1 件が `permissions must have an \`ai\` entry` で失敗。
- 4 依存（`ai` 7.0.183、`@ai-sdk/openai-compatible` 3.0.96、`server-only` 0.0.1、`zod` 4.6.7）を exact で追加。
  すべて公開から 24h 以上。`pnpm install` 成功、`--frozen-lockfile` 成功、`Agent skills awaiting approval` なし（R-1、R-7）。
- 1.3 の照合は全行「一致」。`GatewayError` は `ai` から export されない → 4.2 の判定は `APICallError` のみ（R-1）。
- 1.4 `mise run security` は終了コード 0（osv: No issues found、audit: No known vulnerabilities）。

### タスク 2（2.1、2.2）: 型検査とテストの実行設定 — 完了
- `tsconfig.json` に 3 設定と `scripts/**/*.ts` を追加。`mise run typecheck` 成功。`next build` 後も
  `git status --porcelain` は同じ（`tsconfig.json` の差分は意図した 4 項目だけ）。
- `server-only` の alias（完全一致）と空のスタブを追加。`mise run test` は既存 236 件がすべて GREEN。

### タスク 3（3.1〜3.7）: 合格判定テストの RED — 完了
- 3 ファイルを作成。RED を確認して R-2 に記録（実装がないための失敗であることをメッセージで確認）。

### タスク 4（4.1〜4.4）: `callModel` — 完了
- GREEN: 初回は `llm-call-basics.test.ts` の 2.3 の 3 件が失敗。原因はテストの補助関数 `success()` の既定引数が
  明示的な `undefined` を既定値に置き換えたこと（実装ではない）。引数をオブジェクトに変えて解消（R-2）。
- 型検査・Biome・`check:model-ids` は成功。`mise run test` は 14 ファイル 320 件のうち失敗なし（5 完了後）。
- PROVE（非空虚の確認）はタスク 8.1・8.2 でまとめて行う（tasks.md の設計）。

### タスク 5（5.1、5.2）: `hello` タスクとスクリプト — 完了。5.3 は未実施
- 5.3（実測）は Ollama が要るため、ユーザーの環境の操作を依頼する（`mise run hello` の実行が自動モードで拒否された）。
- 5.1・5.2 の実装後に `mise run verify`（API キーの環境変数を外して）が全 6 検査で成功。

### Step 4.5 VDD レビュー（タスク 1〜5.2）
- トリガー: `dependency:`（package.json、pnpm-lock.yaml）と `test-modified:`（`repo-policy.test.ts` に 1 件追加）。
- Codex の報告: `.sdd/reviews/002-llm-call-basics-1-5.2-codex.md`。MEDIUM 1 件（hello の静的テストが弱い）は再現して
  修正し、4 つの変異で非空虚を確認した。LOW 1 件（do.md の境界）は却下。

### タスク 5.3（hello の実測）— 途中
- (a) 成功: `mise run hello` が応答 `Hello.`、`inputTokens: 38`、`outputTokens: 3` を表示（ユーザーの環境）。終了コードは未確認。
- (e) `node scripts/hello.ts` は `server-only` の例外（ユーザーの環境）。
- (b)(c)、終了コード、秒数は未確認。R-5 に記録し、5.3 は未完了のまま。

### タスク 5.3（hello の実測）— 完了
- (a) 成功: 終了コード 0、4 行の出力（ユーザーの環境）。
- (b) Ollama 停止: 終了コード 1、接続できないことと起動方法、`ollama pull` の案内。
- (c) モデル未取得: 終了コード 1、`ollama pull` の案内。
- 秒数: (b) 6 s（NFR の 15 秒以内）、(c) 1 s。R-5 に記録。

### タスク 6（6.1、6.2）: 段 2 の解説 — 完了
- `docs/stages/2-llm-call-basics.md` を 6 つの `##` 見出しで書いた。`docs-structure.test.ts` は 12 件 GREEN
  （4 節の順序、参照する `tests/` パスの実在）。`check:model-ids`（0 件）と Biome も成功。
- 「改造する」の課題 5 は実測で確かめた: `DEFAULT_MAX_RETRIES` を 3 にすると、`maxRetries` を省略したときの試行回数のテスト
  1 件だけが失敗する。戻して `diff` で一致を確認した。
- プロバイダごとの import は、AI SDK の同梱文書（`node_modules/ai/docs/`）で `anthropic` / `openai` / `google` の
  名前を確かめた。

### タスク 7（7.1、7.2）: 統治文書の同期 — 完了
- `AGENTS.md`（Current state、`mise run hello`、`src/` の記述、Code rules 2 行）、`README.md`（コマンド表、段 2 へのリンク）、
  `.sdd/steering/tech.md`、`.sdd/steering/structure.md` を実物に合わせた。書いたパスと名前は `ls` と `mise tasks ls` で照合済み。
  `No AI code` は `AGENTS.md` から消えた。

### タスク 8.1、8.2（PROVE）— 完了
- 26 か所を 1 か所ずつ壊し、すべて対応するテストが失敗し、戻して `git diff` が空だった（R-3）。テストの修正は不要。
- `reason` の判定を逆にすると 11 件、`maxRetries` を SDK に渡さないと 8 件が落ちる。`DEFAULT_MAX_RETRIES`、`system` を
  `instructions` に渡さない、4.7 のメッセージ漏れは 1 件ずつ落ちる。

### タスク 8.4（分岐カバレッジ）— 完了
- `basics.ts` の分岐カバレッジは 100%（33/33）。使い捨ての worktree で測り、消した。`package.json` に依存は入っていない（R-6）。

### タスク 8.3 — 完了
- `mise run verify`（API キーの環境変数を外す）は終了コード 0、323 件、`git status` に意図しない変更なし。`next build` も同様（R-4）。
- ネットワークを切った実行（6.5）: ユーザーが 3 ファイル 85 件、終了コード 0 を報告（R-4）。切断は申告で、出力に証拠の行はない。

### タスク 3.6 の再実装（`/sdd-ship` の Codex 指摘 MEDIUM への対応）
- 指摘: 5.7 の静的テストが `explain()` の内部での `cause` の文字列化を捕まえない。再現した（`return String(error.cause);` で
  修正前の 8 件が GREEN）。
- 経緯: 手書きの走査は 2 回続けて回避されたため、Step 7 に従い調査を別のエージェントに分け、`typescript/sync` の構文木に切り替えた。
  その後 Codex を 6 回回し、再現できた回避をすべて塞いだ（このとき検査は約 1,200 行、82 件になった）。
- ユーザーの判断（2026-11-27）: 検査を 4 回目の範囲まで縮める（5・6 回目の import・宣言の検査は、解説の「プロバイダを変える方法」
  に反するため外す）。beta API への依存は受け入れる。`pdca/do.md` の扱いは現状のまま（境界外で記録するだけ）。
- 縮小の実施: 5・6 回目のルールと拒否ケースを外した（約 1,200 行 → 約 980 行、82 件 → 72 件）。縮小後のレビュー（Codex 7 回目）は
  MEDIUM 1 件（`await Promise.reject(error)` で catch からエラーが逃げる）と LOW 1 件（`console.debug` の拒否ケースがない）。
  どちらも再現して直した（`error` は `explain(error)` の引数と `explain()` の中だけ、という規則）。8 回目は APPROVE_WITH_NOTES
  （指摘は LOW 1 件で「コード変更は不要」）。
- `hello.ts` は変えていない（実装は元から安全で、弱かったのはテスト）。
- PROVE: 縮小後のテストで、1〜4 回目と 7 回目の回避 32 通りがすべて失敗し、`detail` の改名と、解説どおりのプロバイダ差し替えは
  通った（R-3）。
- 検証: `mise run verify` は終了コード 0、14 ファイル 387 件。
- 未確認: `typescript/sync`（子プロセス）が CI の ubuntu で動くこと。lockfile に linux-x64 のバイナリがあることしか確認していない。
  push して CI を見るまでは未確認のまま。動かなければ、`explain()` を `src/` の関数にして偽のエラーで検査する案に切り替える。
- コードの行数が約 980 行のため、タスク 3.6 の想定より大きい。`_Boundary:_`（`tests/unit/hello-task.test.ts`）は変えていない。
