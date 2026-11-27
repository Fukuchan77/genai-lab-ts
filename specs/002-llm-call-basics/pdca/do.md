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
