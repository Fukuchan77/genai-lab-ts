HEAD: bb2740c987e9502d531f0275240e9f28356806d5

## Critique
### [MEDIUM] `explain()` 内での間接的な例外文字列化による prompt 漏えいを静的テストが検出できない (prior: stands, fixed)
**Location**: tests/unit/hello-task.test.ts:135
**Issue**: 現在の検査は `console.*` の直接引数だけを制限し、`explain(error)` の実装が `cause` を文字列化して prompt を漏えいさせる回帰を見逃します。
**Evidence**: テストは `console.error(explain(error))` を許可し（`tests/unit/hello-task.test.ts:141-146`）、禁止するのはソース全体の `.message` 参照だけです（`:148-149`）。一方で仕様 5.7 は prompt / system 本文を出力しないことを要求し、tasks.md:402-403 は `cause` 全体および例外メッセージの出力を明示的に禁止しています。`scripts/hello.ts:45-49` の安全な実装を `return String(error.cause);` に変えても、`console` 呼び出しは依然として `console.error(explain(error))` のままであり、`.message` も現れません。
**Confidence**: high
**Proof**: 使い捨て worktree で `scripts/hello.ts:49` を `return String(error.cause);` に置換し、`pnpm exec vitest run tests/unit/hello-task.test.ts` を実行します。この静的テストは GREEN のままです。しかし `APICallError` の `String()` はそのメッセージを含むため、prompt を含むプロバイダ例外なら標準エラーへ漏えいします。
**Fix**: `explain()` の本体を TypeScript AST で検査し、返却値に `cause` の直接文字列化、`String`、`JSON.stringify`、`toString`、テンプレート展開を使えないようにしてください。許可する情報を `reason`、`attempts`、例外の `name`、HTTP status code に限定し、`String(error.cause)` と `JSON.stringify(error.cause)` の変異を R-3 の非空虚確認へ追加してください。

## Verdict
REQUEST_CHANGES

## Adjudication

Adjudicated by the calling session (Claude Code, `/sdd-ship`), 2026-11-27.

| Finding | Decision | Evidence |
|---------|----------|----------|
| [MEDIUM] `explain()` の間接的な文字列化を静的テストが検出できない | stands (MEDIUM) | `scripts/hello.ts:49` を `return String(error.cause);` に変えて `pnpm exec vitest run tests/unit/hello-task.test.ts` を実行すると `Tests 8 passed (8)`、終了コード 0。変異は `git checkout -- scripts/hello.ts` で戻し、`git status --porcelain` に追跡ファイルの変更なし。現行の `hello.ts` は安全（`name` と HTTP status だけを出す）で、欠陥は 5.7 を拘束するテストの弱さ。修正はテストコードの変更になるため、`/sdd-ship` では judgment に分類し自動修正しない |

Caller verdict: REQUEST_CHANGES (one MEDIUM stands; the fix edits test code, so it goes back to `/sdd-impl`).
