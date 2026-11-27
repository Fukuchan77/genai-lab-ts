HEAD: 2b4d2163343c8d9b7ee72c5092d0917bc6bbab69

## Critique
### [MEDIUM] `hello` の静的テストが必須の呼び出し・秘密保持を実際には拘束していない
**Location**: tests/unit/hello-task.test.ts:101
**Issue**: 現在のテストは環境変数の参照と生テキスト上の `callModel(` しか確認しないため、実際のモデル呼び出しを消したり、prompt・system・生の例外を出力したりする回帰が GREEN になり得ます。
**Evidence**: `expect(source()).not.toContain("process.env")` と `expect(source()).not.toContain("import.meta.env")` だけが 5.7 を検査し、5.3 は `/\bcallModel\(/g` の文字列検索だけです。これはコメント内の `callModel(` でも一致します。一方、spec.md:268-279 は「呼び出しを 1 か所に持つ」こと、および「`prompt` と `system` の本文を出力せず」を要求し、tasks.md:397-403 は `console.error(error)`、`cause` 全体、例外メッセージ文字列による分類を明示的に禁じています。依存追加のトリガーは plan C1 が宣言する `"ai"`, `"@ai-sdk/openai-compatible"`, `"server-only"`, `"zod"` の4件と `package.json` が一致し、`repo-policy.test.ts` の追加も `ai.skills: false` の検査だけなので、これらのトリガー自体は説明可能です。
**Confidence**: high
**Proof**: 隔離 worktree で実際の `await callModel(...)` を削除し、同じ形の `callModel(` をコメントに残すか、`catch` に `console.error(PROMPT)` または `console.error(error)` を加えて `pnpm exec vitest run tests/unit/hello-task.test.ts` を実行すると、現行テストは失敗しません。
**Fix**: TypeScript AST を用いる静的テストに変え、実コードの `callModel` 呼び出しが1件で5設定を持つこと、成功時の出力が許可された値だけであること、失敗時が `console.error(explain(error))` に限定されることを検査してください。少なくとも `PROMPT`、`SYSTEM`、`error`、`error.cause`、`error.message` の直接出力と、メッセージ文字列による分類を拒否し、非空虚確認にも対応する変異を加えてください。

### [LOW] PDCA Do 記録が承認済みのタスク境界外に追加されている
**Location**: specs/002-llm-call-basics/pdca/do.md:1
**Issue**: `pdca/do.md` は、完了済みのタスク 1.1–5.2 のどの `_Boundary:_` にも、plan の File Structure Plan にも含まれていません。
**Evidence**: plan.md:471 は「`tasks.md` の `_Boundary:_` は、この表のファイルだけを対象にできる」と定めていますが、plan.md:475-495 の表に `specs/002-llm-call-basics/pdca/do.md` はありません。タスク 1.1–5.2 の境界には依存・設定・実装・テスト・`research.md` が含まれますが、当該 PDCA ファイルは含まれません。
**Confidence**: medium
**Proof**: `rg -n '_Boundary:' specs/002-llm-call-basics/tasks.md` と `sed -n '469,495p' specs/002-llm-call-basics/plan.md` を実行すると、当該パスが宣言されていないことを確認できます。
**Fix**: この実装段階で PDCA Do を作成する必要があるなら、plan と該当タスクの境界に `specs/002-llm-call-basics/pdca/do.md` を追加して承認を得てください。不要なら、この変更セットから外してください。

## Verdict
REQUEST_CHANGES

## Adjudication

Reviewed by the implementing session (Claude), 2026-11-27. Codex was the reviewer, Claude the author.

| Finding | Decision | Evidence |
|---|---|---|
| MEDIUM: hello static test does not constrain the call or the output | **stands, fixed** | Reproduced: renaming the real call to `callModel2` while keeping `callModel(` in a comment left `hello-task.test.ts` at 7 passed. Fix in `tests/unit/hello-task.test.ts`: comments are stripped before matching, and a new test checks every `console.*` argument (no `PROMPT` / `SYSTEM`; an `error` or `cause` is printed only as `explain(error)`) and rejects `.message`. Re-proved with 4 mutations of `scripts/hello.ts` (comment-only call, `console.error(PROMPT)`, `console.error(error)`, `.message`): each fails exactly one test; restored file is identical to the green copy; 8 of 8 pass. |
| LOW: `pdca/do.md` is outside the task boundaries | **dismissed** | `/sdd-impl` Step 6 requires logging in `specs/<feature>/pdca/do.md`, and spec 001 has the same file. It is a process log, not a deliverable, so the plan's File Structure Plan (deliverables) does not list it. |

Verdict after adjudication: APPROVE_WITH_NOTES. No CRITICAL or HIGH finding stands. The dependency trigger is explained by plan C1 (4 declared packages, exact pins, 24h rule met, agent skill refused). The `repo-policy.test.ts` trigger is one added test; no existing test changed.
