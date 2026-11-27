<!-- status: in-progress -->

# 002-llm-call-basics — Implementation Tasks

`/sdd-tasks` が生成した。規則は `~/.claude/sdd/rules/tasks-generation.md` と
`tasks-parallel-analysis.md`。要件は [spec.md](spec.md)、設計は [plan.md](plan.md)、根拠と実装時の記録は
[research.md](research.md)、要件との対応表は [traceability.md](traceability.md)。

## 規約

- `- [ ]` 未着手、`- [x]` 完了、`- [ ]*` 後回し可の任意テスト（本 spec にはない。受け入れテストはすべて必須）。
- `(P)` は、依存がなく、`_Boundary:_` が同時に動けるどのタスクとも重ならないサブタスクだけに付ける。
- すべてのタスク（major と sub）が `_Boundary:_` と `_Depends:_` を持つ。`_Requirements:_` は受け入れ基準の
  番号だけをカンマ区切りで並べる。
- `_Traces:_` の ID: `REQ-00n` は spec.md の Requirement n。`DES-2.n` は plan.md「Components」の C`n` の見出しにある
  ID（DES-2.1 = C1 … DES-2.7 = C7）。「Interfaces / Contracts」と「Error Handling & Edge Cases」は ID を持たず、
  それを実装する C の ID に含める。
- 括弧に入れた数字（`（1.1）`）は受け入れ基準の番号。サブタスクを指すときは「タスク 1.1」と書く。
- テストを伴うサブタスクは、先に失敗するテストを書いて **RED を確認してから**実装する（憲章 原則 4）。
  「記録」と書いた項目は、コマンド・出力・確認日を research.md の指定の R-n に残す（R-1 版と security、R-2 RED と GREEN、
  R-3 非空虚、R-4 verify と `git status`、R-5 hello の実測、R-6 分岐カバレッジ、R-7 権限）。
- `_Boundary:_` は plan.md「File Structure Plan」の表のファイルだけ。成果物をコミットしない使い捨て環境
  （タスク 8.4 の worktree。タスク 8.1・8.2 で一時的に壊して戻すファイルは境界に含める）は別。
  `specs/002-llm-call-basics/spec.json` は SDD コマンドが更新するため担当タスクを置かない。`.sdd/reviews/` の
  敵対的レビューの記録は `/sdd-impl` の手順で作る。
- **ブランチとコミット**: いまは `main` にいるため、最初のコミットの前に `feat/llm-call-basics` を作る。未コミットの
  spec 文書（`specs/002-llm-call-basics/`、`.sdd/reviews/002-llm-call-basics-plan-codex.md`）は、タスク 1 の前に
  別のコミット（`docs(spec)`）にする。コミットはユーザーの確認を得て行うチェックポイントにまとめる:
  **CP-A** タスク 2 の完了後（`build(deps)`、設定）、**CP-B** タスク 5.2 の完了後（テスト、`basics.ts`、hello）、
  **CP-C** タスク 6.2、7.1、7.2 の完了後（解説、統治文書）、**CP-D** タスク 8 の完了後（記録）。RED の間は
  `mise run typecheck` が失敗する（`basics.ts` がないため）ので、CP-B より前にテストだけをコミットしない。
- `pnpm install`、`mise install`、`pnpm exec` などが auto mode で拒否されたら、ユーザーに実行を頼み、貼られた出力を
  R-n に記録する（spec 001 の実績）。
- 大きくなりやすいサブタスク（3.4、4.1、5.2、6.1、8.1）は、実装中に 3 時間を超えそうなら次の継ぎ目で分け、番号は振り直さず
  Implementation Notes に記録する。3.4: 再試行して成功する系／失敗の分類の系。4.1: 検証と型／`generateText` 呼び出しと結果変換。
  5.2: 成功の表示／失敗の分類。6.1: 「読む」／「動かす」。8.1: 壊す対象を `basics.ts` の検証・変換／再試行・分類に分ける。

## 実装順の制約（plan.md「File Structure Plan」末尾）

1. 合格判定テストより先に置くのは、依存（タスク 1）と実行設定（タスク 2）だけ。`src/lib/ai/basics.ts` はタスク 4.1 まで
   存在しないため、タスク 3 のテストは import の失敗で RED になる（R-2）。
2. `mise.toml` の `hello` タスク（5.1）は `hello-task.test.ts` の RED（3.6）のあとに加える。`scripts/hello.ts`（5.2）は
   `callModel` の GREEN（4.3）のあとに書く。hello は自動テストを持たない（6.8）ため、動作は 5.3 の実測で確かめる。
3. タスク 8.1・8.2（壊して戻す）は、`git diff` で復元を確かめるため CP-B のコミットのあとに行う。タスク 8.4 の worktree は
   コミット済みの HEAD から作る。worktree ごとに `mise trust`、`mise install`、`pnpm install --frozen-lockfile` が要る。

## 並列化の報告

`(P)` を付けたのは 7.1 と 7.2 の 2 つだけ。解説の 6.1 と 6.2 は同じファイルを書き、6.2 は 6.1 に依存するため直列にする。
そのほかは `research.md`、`basics.ts`、同じテストファイルを複数のタスクが書くか、前のタスクの出力を使うため直列にする。
判断に迷うもの（2.1 と 2.2 は `tsconfig.json` が `*.config.ts` を型検査に含めるため、互いの途中の状態に影響される。
5.3 は `research.md` を書き、ユーザーの環境（Ollama）を要する）は `(P)` を付けていない。`/sdd-fleet` で並列化するときは、
下表の組だけを同じ波にする。

| 波 | 並列にできるサブタスク | 前提 | 境界が重ならない根拠 |
|----|------------------------|------|----------------------|
| A | 7.1（`AGENTS.md`、`README.md`）、7.2（`.sdd/steering/tech.md`、`.sdd/steering/structure.md`） | 6.2 | 書くファイルが互いに重ならない。6.1・6.2（`docs/stages/2-llm-call-basics.md`）と 5.3（`research.md`）も境界は重ならないが、6.1 は 5.3 の記録（`node scripts/hello.ts` の直接実行の結果）を使うため、波 A の前提 5.3 を満たしたあとの別の波にする |

---

## 1. 依存の宣言と導入

_Boundary:_ `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tests/unit/repo-policy.test.ts`, `specs/002-llm-call-basics/research.md`
_Depends:_ none
_Requirements:_ 8.1, 8.2, 8.3, 8.4, 8.5
_Traces:_ REQ-008, DES-2.1

plan C1 の表が段 2 の依存の宣言の正本。ここで入れるのは `ai`、`@ai-sdk/openai-compatible`、`server-only`、`zod` の 4 つだけ
（`@vitest/coverage-v8` は計測専用でタスク 8.4 の worktree にだけ入れ、`package.json` に入れない）。

- [ ] 1.1 `ai` の agent skill を拒否する設定を検査するテストを先に書き、RED を確認する
  - `tests/unit/repo-policy.test.ts` に、`pnpm-workspace.yaml` の `permissions` が `ai` の `skills` を `false` にしていることを
    検査するテストを足す（ADR-9）。既存のテストの書き方（YAML を読んで構造を見る）に合わせ、`minimumReleaseAge` などの
    既存の検査は変えない。
  - 完了条件: `pnpm exec vitest run tests/unit/repo-policy.test.ts` が、追加したテストだけ失敗する（`permissions` がまだない
    ため）。失敗のメッセージを、下の Implementation Notes にメモする（R-2 への記録はタスク 3.7。research.md はこのタスクの境界外）。
  _Boundary:_ `tests/unit/repo-policy.test.ts`
  _Depends:_ none
  _Requirements:_ 8.2
  _Traces:_ REQ-008, DES-2.1
- [ ] 1.2 4 つの依存を exact 版で加え、lockfile と agent skill の拒否を設定する
  - 版は、実装時に**公開から 24 時間以上たった最新の安定版**を `pnpm view <pkg> time --json` で確かめて選ぶ（調査時の候補は
    research.md I-1。`ai` は 7.0.x がほぼ毎日出るため、候補をそのまま使わない）。版・公開日時・確認日を R-1 に記録する。
  - `package.json`: 4 つ（`ai`、`@ai-sdk/openai-compatible`、`server-only`、`zod`）を `dependencies` に exact 版で加える
    （plan: 「上の 4 つを `dependencies` に exact 版で加える。`scripts` は変えない」）。範囲指定（`^`、`~`、`*`、`>=`）と
    dist-tag（`latest`、`canary`、`beta`）を含めない。`@ai-sdk/anthropic`・`@ai-sdk/openai`・`@ai-sdk/google`・
    `@ai-sdk/react`・`tsx`・Ollama のコミュニティのプロバイダは入れない（8.4）。
  - `pnpm-workspace.yaml`: `permissions` に `ai` の `skills: false` を、理由（第三者が同梱する指示文を承認しない。同梱文書は
    承認しなくても読める。I-11）のコメントつきで書く（`pnpm approve '!ai'` と同じ結果）。`minimumReleaseAge` などの既存の
    設定と `allowBuilds` は変えない（install スクリプトを持つ依存は加わらない。I-12）。
  - `pnpm install` で `pnpm-lock.yaml` を更新する。`minimumReleaseAge: 1440` を満たさない版は install が失敗するので、
    その場合は版を下げる（`minimumReleaseAgeExclude` を書かない）。
  - 完了条件: クリーンな状態から `pnpm install --frozen-lockfile` が終了コード 0 で、`Agent skills awaiting approval` と
    `Ignored build scripts` が出ない。`pnpm permissions list` の出力を R-7 に記録する。タスク 1.1 のテストが GREEN で、
    `mise run test` の既存のテストが通る。`package.json` の第三者依存が C1 の 4 つと既存のものだけである。
  _Boundary:_ `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `specs/002-llm-call-basics/research.md`
  _Depends:_ 1.1
  _Requirements:_ 8.1, 8.2, 8.3, 8.4
  _Traces:_ REQ-008, DES-2.1
- [ ] 1.3 install 直後に、採用版の同梱文書・型定義・実装で plan の前提を確かめる
  - 採用版の `node_modules/ai/docs/`、公開の `.d.ts`（`ai` と `ai/test`）、再試行の実装を読み、research.md I-3〜I-7 の主張を
    確かめる: `generateText` の `instructions`、`maxRetries` の既定値、`RetryError` の `reason`、`APICallError.isRetryable`、
    `retry-after-ms` の扱い、`usage` の `inputTokens` / `outputTokens` の型（`number | undefined`）、`MockLanguageModelV4` の
    名前と `doGenerateCalls`、`GatewayError` が `ai` から export されるか（ADR-5 の判定の形を決める）。
  - probe のコードはリポジトリの外（スクラッチパッド）に置き、コミットしない。結果を「主張 / 同梱文書 / 型定義 / probe」の
    対応表にして R-1 に記録する。
  - 完了条件: 対応表の全行が「一致」。**主張が変わっていたら、テスト（タスク 3）を書く前に STOP し、plan.md を直す**
    （`plan.md` はこのタスクの境界に含めない。直すのは `/sdd-plan` の再実行か、ユーザーとの合意のうえでの別の編集）。
  _Boundary:_ `specs/002-llm-call-basics/research.md`
  _Depends:_ 1.2
  _Requirements:_ 8.5
  _Traces:_ REQ-008, DES-2.1
- [ ] 1.4 `mise run security` を実行して R-1 に記録する
  - 新しい依存に high 以上の advisory がないことを `mise run security`（osv-scanner、`pnpm audit --audit-level=high`）で
    確かめる。ネットワークが要る。実行できない場合は、その理由と代わりに確かめた方法を記録し、未実行のまま
    完了にしない。
  - 完了条件: 終了コード 0 の出力（要約）と確認日が R-1 にある。advisory が出たら、`main` にもあるもの（段 2 の依存と無関係）と
    段 2 の依存で新しく出たものを分けて記録し、後者は版を変えるか、受容の理由を記録してユーザーに確認する。
  _Boundary:_ `specs/002-llm-call-basics/research.md`
  _Depends:_ 1.2
  _Requirements:_ 8.3
  _Traces:_ REQ-008, DES-2.1

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 2. 型検査とテストの実行設定

_Boundary:_ `tsconfig.json`, `vitest.config.ts`, `tests/unit/setup/server-only-stub.ts`
_Depends:_ 1
_Requirements:_ 1.3, 1.9, 6.1
_Traces:_ REQ-001, REQ-006, DES-2.4

テストより先に置く実行設定（憲章 原則 4 の例外は、plan「実装順の制約」で範囲を限った 2 つのサブタスクだけ）。

- [ ] 2.1 `tsconfig.json` に Node の型の除去に合わせた設定を足す
  - `compilerOptions` に `allowImportingTsExtensions: true`、`verbatimModuleSyntax: true`、`erasableSyntaxOnly: true` を加え、
    `include` に `scripts/**/*.ts` を加える（ADR-7）。既存の設定は変えない（`isolatedModules: true` も残す）。
  - 完了条件: `mise run typecheck` が成功する（既存のコードが新しい設定で通ること。I-10）。`git status --porcelain` に、
    `next typegen` が `tsconfig.json` に加えた意図しない書き換えがない（差分は本タスクの 4 項目だけ）。
    続けて `pnpm exec next build` を 1 回実行し、その後の `git status --porcelain` が同じであることを確かめる。
    両方の出力（要約）を、下の Implementation Notes に残す（タスク 8.3 が R-4 へ写す。research.md はこのタスクの
    境界外）。
  _Boundary:_ `tsconfig.json`
  _Depends:_ 1.2
  _Requirements:_ 1.3
  _Traces:_ REQ-001, DES-2.4
- [ ] 2.2 Vitest で `server-only` だけを空のモジュールに置き換える
  - `tests/unit/setup/server-only-stub.ts`: 何も export しない空のモジュール。`server-only` の代わりに Vitest が読むこと、
    実際の `server-only` は既定の条件で例外を投げること（I-9）を、英語のコメントで書く。
  - `vitest.config.ts`: `resolve.alias` に `server-only` → `tests/unit/setup/server-only-stub.ts` を**完全一致**で加える
    （`@` の alias、`setupFiles`、`reporters`、`passWithNoTests`、`allowOnly` は変えない。ADR-8）。`react-server` 条件を
    Vitest 全体に有効にしない。
  - 完了条件: `mise run test` が、既存のテストすべてについて成功する。`mise run typecheck` が成功する。
    alias が実際に効くことの最初の証拠はタスク 4.3（`basics.ts` を Vitest が読めること）で、ここでは設定が既存のテストを
    壊さないことだけを確かめる。
  _Boundary:_ `vitest.config.ts`, `tests/unit/setup/server-only-stub.ts`
  _Depends:_ 2.1
  _Requirements:_ 1.9, 6.1
  _Traces:_ REQ-001, REQ-006, DES-2.4

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 3. 合格判定テストを先に書く（RED）

_Boundary:_ `tests/unit/llm-call-basics.test.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `tests/unit/hello-task.test.ts`, `specs/002-llm-call-basics/research.md`
_Depends:_ 1, 2
_Requirements:_ 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 5.3, 5.7, 5.8, 5.9, 6.1, 6.2, 6.3, 6.4, 6.6, 6.8
_Traces:_ REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, DES-2.5

憲章 原則 4: 実装（タスク 4・5）より先に、ここで 3 ファイルを書いて RED を確認する。`src/lib/ai/basics.ts` はまだ
ないため、`llm-call-basics*.test.ts` は import の失敗で RED になる。`hello-task.test.ts` は `hello` タスクと
`scripts/hello.ts` がないため RED になる。テストは `MockLanguageModelV4`（`ai/test`）だけを使い、実 LLM・Ollama・ネットワークに
接続せず、hello を import も実行もしない（6.1、6.8）。試行回数は `doGenerateCalls.length` で数える（6.2）。テストの文字列に
モデル ID の形の文字列を書かない（`check:model-ids` が `tests/` を走査する）。テストの補助（成功の結果を作る関数、
再試行可能な例外・再試行しない例外を作る関数、決めた順に失敗と成功を返すモック）は `llm-call-basics.test.ts` の中に置く。

- [ ] 3.1 役割と設定の受け渡しのテスト（1.1、1.2、1.4〜1.8）
  - `tests/unit/llm-call-basics.test.ts` を作り、次を検証する: 渡したモックの生成が呼ばれること（1.1）、`system` ありで
    `doGenerateCalls[0].prompt` が system 役割 → user 役割の順で本文が一致すること（1.4）、`system` 省略で user 役割 1 件だけ
    （1.5）、`temperature` / `maxOutputTokens` の値がそのまま渡ること（1.6）、省略時はモデルが受け取る値が `undefined`
    （1.7。キーの有無は見ない。spec への追記 3）、`tools` が `undefined`・`doStreamCalls` が空・`doGenerateCalls` が 1 件
    （1.8）、変数経由で型を広げて余分なキーを持つ設定を渡しても、余分なキーが生成要求に現れないこと（1.2）。
  - 完了条件: ファイルが存在し、`pnpm exec vitest run tests/unit/llm-call-basics.test.ts` が `basics.ts` の import の失敗で
    RED になる（タスク 3.7 で記録）。
  _Boundary:_ `tests/unit/llm-call-basics.test.ts`
  _Depends:_ 1.3, 2.2
  _Requirements:_ 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 6.1, 6.2, 6.3
  _Traces:_ REQ-001, REQ-006, DES-2.5
- [ ] 3.2 結果と usage のテスト（2.1〜2.4）
  - 同じファイルに足す: 前後の空白を含むテキストが一致すること（2.1）、入力・出力のトークン数が同じ数値で返ること（2.2）、
    片方または両方が未報告のとき `undefined` で 0 でなく、キーは存在すること（2.3）、結果のキーが `text` と `usage` の 2 つ、
    `usage` のキーが `inputTokens` と `outputTokens` の 2 つだけで、値が plain な値であること（2.4）。再試行のあとに成功したときの usage（2.5）は、
    実時間を待たないよう、タスク 3.4 の時間制限つき `describe` に置く。
  - 完了条件: 追加したテストが `basics.ts` の import の失敗で RED のまま。
  _Boundary:_ `tests/unit/llm-call-basics.test.ts`
  _Depends:_ 3.1
  _Requirements:_ 2.1, 2.2, 2.3, 2.4, 6.2
  _Traces:_ REQ-002, REQ-006, DES-2.5
- [ ] 3.3 設定値の拒否のテスト（3.1〜3.5）
  - 同じファイルに足す。不正値の表ごとに、`CallConfigError` で reject すること、`field` が不正な項目の名前であること、
    `doGenerateCalls` が 0 件であることを検証する。制約は plan の Data Model の表のとおり:
    `prompt` は「空白以外の文字を 1 つ以上含む」（不正値: `""`、半角・改行・タブ・全角空白だけ）、`temperature` は
    「有限の数」（不正値: `NaN`、`Infinity`、`-Infinity`。負の有限値は受け付ける）、`maxOutputTokens` は「1 以上の整数」
    （不正値: `0`、`-1`、`1.5`、`NaN`、`Infinity`）、`maxRetries` は「0 以上の整数」（不正値: `-1`、`1.5`、`NaN`、
    `Infinity`）。境界の正しい値（`maxOutputTokens: 1`、`maxRetries: 0`、`temperature: 0`）は受け付ける。複数の項目が不正なとき
    `prompt` → `temperature` → `maxOutputTokens` → `maxRetries` の順で最初の項目が `field` になる。エラーのメッセージに
    `prompt` と `system` の本文（目印の文字列）が現れない（3.5）。
  - 完了条件: 追加したテストが `basics.ts` の import の失敗で RED のまま。
  _Boundary:_ `tests/unit/llm-call-basics.test.ts`
  _Depends:_ 3.2
  _Requirements:_ 3.1, 3.2, 3.3, 3.4, 3.5, 6.3
  _Traces:_ REQ-003, REQ-006, DES-2.5
- [ ] 3.4 再試行とエラーのテスト（2.5、4.1〜4.7）
  - 同じファイルに、この `describe` だけ 1 件 1000 ms のタイムアウトを付けて足す（NFR。ADR-6）。再試行可能な例外は
    `APICallError` で `isRetryable: true` と `responseHeaders` の `retry-after-ms: "0"` を持ち、実時間を待たない。
    `maxRetries` ごとに次を検証する: k 回（1 ≤ k ≤ `maxRetries`）失敗したあと成功して試行が k + 1 回（4.1）、
    `maxRetries` + 1 回続けて失敗して試行が `maxRetries` + 1 回で `CallFailedError`（`reason` は `retries-exhausted`、
    `attempts` が一致。4.2）、再試行しない例外で試行 1 回・`not-retryable`（4.3）、再試行可能 → 再試行しない例外で試行 2 回・
    `not-retryable`（plan の分類。4.3 の「試行 1 回」は最初の失敗が再試行しない例外の場合）、再試行可能・再試行可能・
    再試行しない例外の順で、それが許された最後の試行なら `retries-exhausted`（plan ADR-5、「Error Handling」。`cause` は
    再試行しない例外）、`maxRetries: 0` で再試行しない例外のとき試行 1 回・`not-retryable`、`maxRetries: 0` で再試行可能な例外の
    とき試行 1 回・`retries-exhausted`（4.4）、再試行のあとに成功したとき、成功した試行の usage が返ること（2.5。失敗した試行の
    値と異なる値を使って区別する）、`maxRetries` 省略で試行 3 回（4.5）、
    `cause` が最後の試行の例外と同一であること（4.6）、SDK の例外のメッセージに目印の文字列を入れても `CallFailedError` の
    メッセージに現れないこと（4.7）。`reason` は plan のとおり `"retries-exhausted" | "not-retryable"` の 2 値。
  - 完了条件: 追加したテストが `basics.ts` の import の失敗で RED のまま。
  _Boundary:_ `tests/unit/llm-call-basics.test.ts`
  _Depends:_ 3.3
  _Requirements:_ 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.2, 6.3
  _Traces:_ REQ-002, REQ-004, REQ-006, DES-2.5
- [ ] 3.5 型と読み込み条件の契約テスト（1.1、1.2、1.3、1.9）
  - `tests/unit/llm-call-basics-contract.test.ts` を作る。**型**: 余分なキー（`topP`、`instructions`、`abortSignal` など）を書いた
    object リテラルの行、`prompt` のない設定、文字列のモデル ID の直上に `// @ts-expect-error` を置く。各指令は 1 行に 1 つの
    キーだけを持つ行に付け、別の原因の型エラーを吸収しない。実行するのは余分なキーの検査だけ（変数で型を広げて
    `MockLanguageModelV4` に渡し、余分なキーが生成要求に現れないことを確かめる）。**文字列のモデル ID の呼び出しは実行しない**
    （呼ばない関数の本体に置き、`expect(typeof rejects).toBe("function")` で変数を使う。`it.skip` を使わない。ADR-3）。文字列は
    モデル ID の形に見えないものにする。**境界（1.1）**: `src/lib/ai/basics.ts` の import 元が `server-only` と `ai` だけ。
    **サーバー専用の印（1.9）**: 子プロセスの Node で `basics.ts` を import させ、既定の条件では非 0 で終わり出力に
    `server-only` を含むこと、`--conditions=react-server` では 0 で終わること（例外のメッセージの文面は見ない）。
  - 子プロセスを起動するテストは、既存の慣例の 120 秒のタイムアウトを付ける（spec への追記 4）。
  - 完了条件: ファイルが存在し、`basics.ts` が存在しないため RED（import の失敗、子プロセスの (b)、型エラー）。
    `mise run typecheck` も同じ理由で失敗する（CP-B より前にコミットしない）。
  _Boundary:_ `tests/unit/llm-call-basics-contract.test.ts`
  _Depends:_ 1.3, 2.2
  _Requirements:_ 1.1, 1.2, 1.3, 1.9, 6.1, 6.4
  _Traces:_ REQ-001, REQ-006, DES-2.5
- [ ] 3.6 `hello` タスクとスクリプトの静的な検査のテスト（5.3、5.7、5.8、5.9）
  - `tests/unit/hello-task.test.ts` を作る。`mise.toml` のタスク `hello` が 1 つのコマンド
    `node --conditions=react-server scripts/hello.ts` と説明（description）を持つこと（5.8）。`verify` と `security` から
    （`{ task = ... }` の参照をたどって）`hello` に届かないこと、`lefthook.yml` と `.github/workflows/` のどのファイルも `hello` の
    タスクとスクリプトを参照しないこと（5.9）。`scripts/hello.ts` を**読むだけ**（import も実行もしない。6.8）の静的な検査:
    `process.env` と `import.meta.env` が現れないこと（5.7）、`callModel(` の呼び出しがちょうど 1 か所で、その引数に
    `system`・`prompt`・`temperature`・`maxOutputTokens`・`maxRetries` の 5 つが現れること（5.3）。既存の
    `verify-offline-contract.test.ts` の TOML の読み方に合わせる。`mise` などの子プロセスを起動するテストは、既存の慣例の
    120 秒のタイムアウトを付ける（spec への追記 4）。
  - 完了条件: `hello` タスクと `scripts/hello.ts` がないため RED。
  _Boundary:_ `tests/unit/hello-task.test.ts`
  _Depends:_ 2.2
  _Requirements:_ 5.3, 5.7, 5.8, 5.9, 6.1, 6.8
  _Traces:_ REQ-005, REQ-006, DES-2.5
- [ ] 3.7 RED の記録（6.6）
  - タスク 1.1（major task 1 の Implementation Notes のメモ）と 3.1〜3.6 の RED を、コマンドと失敗のメッセージ（要約）つきで R-2 に残す。各テストファイルが
    「実装がないために」失敗していること（テストの書き間違いによる失敗でないこと）を、メッセージで示す。
  - 完了条件: R-2 に、`llm-call-basics.test.ts`、`llm-call-basics-contract.test.ts`、`hello-task.test.ts`、`repo-policy.test.ts`
    の 4 ファイルの RED（コマンド、終了コード、失敗の要約）と確認日がある。
  _Boundary:_ `specs/002-llm-call-basics/research.md`
  _Depends:_ 3.4, 3.5, 3.6
  _Requirements:_ 6.6
  _Traces:_ REQ-006, DES-2.5

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 4. 呼び出し関数 `callModel`（GREEN）

_Boundary:_ `src/lib/ai/basics.ts`, `tests/unit/llm-call-basics.test.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `tests/unit/hello-task.test.ts`, `tests/unit/repo-policy.test.ts`, `tests/unit/setup/server-only-stub.ts`, `vitest.config.ts`, `tsconfig.json`, `specs/002-llm-call-basics/research.md`
_Depends:_ 3
_Requirements:_ 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.4
_Traces:_ REQ-001, REQ-002, REQ-003, REQ-004, REQ-006, DES-2.2

plan C2 と「Interfaces / Contracts」のとおり、`src/lib/ai/basics.ts` の 1 ファイルを 3 つの継ぎ目で書く。import するのは
`server-only` と `ai` だけ（1.1）。型は plan の宣言（`ModelObject`、`CallConfig`、`CallUsage`、`CallResult`、
`CallConfigField`、`CallFailureReason`、`DEFAULT_MAX_RETRIES`、2 つの例外クラス、`callModel`）に従い、`any` と型アサーションを
使わず、`enum` などの消せない構文を使わない（`erasableSyntaxOnly`）。型だけの import には `type` を付ける。コメントは英語。

- [ ] 4.1 型・例外クラス・設定の検証・`generateText` 呼び出し・結果の変換を書く
  - モジュールの最初の文で `server-only` を import する（1.9）。`DEFAULT_MAX_RETRIES` は 2（4.5）。`ModelObject` は
    `Exclude<LanguageModel, string>`（ADR-3）。型は `readonly`。`CallUsage` の 2 項目は `number | undefined` で、`?:` の
    省略可能な形にしない。
  - 検証は `prompt` → `temperature` → `maxOutputTokens` → `maxRetries` の順に行い、最初に不正だった項目で `CallConfigError` を
    投げる（モデルは呼ばない）。省略した項目は検証しない。規則: `prompt` は空白以外の文字を 1 つ以上含む、`temperature` は
    有限の数、`maxOutputTokens` は 1 以上の整数、`maxRetries` は 0 以上の整数。`system` は検証しない。メッセージは項目名と
    満たすべき条件だけで、値・`prompt`・`system` を含めない。`name` はクラス名。
  - `generateText` には `model`、`instructions: config.system`、`prompt`、`temperature`、`maxOutputTokens`、
    `maxRetries: config.maxRetries ?? DEFAULT_MAX_RETRIES` の 6 つだけを渡す。`config` を展開（spread）しない。`tools`・
    `messages`・`abortSignal` は渡さない。成功したら `{ text, usage: { inputTokens, outputTokens } }` を新しい object で返す
    （`text` は加工せず、`undefined` は `undefined` のまま）。`callModel` は `async` 関数で、失敗は reject だけで伝える。
  - `CallFailedError` のクラスは、このタスクでは `reason`・`attempts` と `cause`（`super(message, { cause })`。フィールドとして
    宣言し直さない）を持つ形だけ定義し、例外の分類（タスク 4.2）は書かない（SDK の例外はそのまま通す）。
  - 完了条件: `pnpm exec vitest run tests/unit/llm-call-basics.test.ts` で、タスク 3.1〜3.3 のテスト（役割・設定・結果・usage・
    設定値の拒否）が GREEN。3.4 のうち `CallFailedError` を期待するテスト（`reason`・`attempts`・メッセージ・`cause`）は、分類をタスク 4.2 で書くまで
    RED のまま残る（成功系の再試行のテストは SDK の再試行で GREEN になりうる）。`mise run check` と `mise run typecheck` が
    `basics.ts` について成功する。
  _Boundary:_ `src/lib/ai/basics.ts`
  _Depends:_ 3.7
  _Requirements:_ 1.1, 1.2, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.5
  _Traces:_ REQ-001, REQ-002, REQ-003, REQ-004, DES-2.2
- [ ] 4.2 SDK の失敗を `CallFailedError` に正規化する
  - `generateText` の例外を、plan Architecture Overview の「失敗の正規化」の規則で `CallFailedError` にして投げる:
    `RetryError` で `reason` が `maxRetriesExceeded` → `retries-exhausted`（`attempts` は `errors.length`、`cause` は最後の
    例外）／ `RetryError` でそれ以外 → `not-retryable`（同じ `attempts`・`cause`）／ 包まれていない例外で `maxRetries` が 0 かつ
    SDK が再試行対象と見る例外（`isRetryable` な `APICallError`。タスク 1.3 で `GatewayError` が export されていれば
    それも）→ `retries-exhausted`（`attempts` は 1）／ それ以外 → `not-retryable`（`attempts` は 1）。
  - メッセージは `reason` と `attempts` だけから作る（例: 「The model call failed after 3 attempts: retries exhausted」の形）。
    `cause` のメッセージ・`prompt`・`system` を含めない（4.7）。`cause` は最後の試行の例外をそのまま持つ（4.6）。
    判定に例外のメッセージの文字列を使わない。
  - 完了条件: `pnpm exec vitest run tests/unit/llm-call-basics.test.ts` が、タスク 3.4 のテストを含めてすべて GREEN。
    再試行のテストの各件が 1000 ms 以内に終わる。
  _Boundary:_ `src/lib/ai/basics.ts`
  _Depends:_ 4.1
  _Requirements:_ 4.1, 4.2, 4.3, 4.4, 4.6, 4.7
  _Traces:_ REQ-004, DES-2.2
- [ ] 4.3 契約テストと型検査を GREEN にし、GREEN を記録する
  - `tests/unit/llm-call-basics-contract.test.ts` が GREEN（型の指令が必要であること、import 元が `server-only` と `ai` だけ、
    子プロセスの Node で既定の条件では失敗し `--conditions=react-server` では成功すること）。`mise run typecheck` が成功する
    （`@ts-expect-error` がすべて必要）。
  - GREEN になった各ファイルのコマンドと結果を R-2 に追記する。`hello-task.test.ts` だけは、タスク 5 まで RED のままで
    よい（記録に明記する）。
  - 完了条件: `mise run typecheck` が成功。`mise run test` の失敗が `hello-task.test.ts` だけ。R-2 に GREEN の記録がある。
  _Boundary:_ `src/lib/ai/basics.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `specs/002-llm-call-basics/research.md`
  _Depends:_ 4.2
  _Requirements:_ 1.3, 1.9, 6.4
  _Traces:_ REQ-001, REQ-006, DES-2.2
- [ ] 4.4 `mise run check` を通す
  - `mise run check`（Biome）が、タスク 1〜4 で足したファイルすべてについて成功する。違反は `biome.json` を変えずに
    コードを直す。
  - 完了条件: `mise run check` が終了コード 0。
  _Boundary:_ `src/lib/ai/basics.ts`, `tests/unit/llm-call-basics.test.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `tests/unit/hello-task.test.ts`, `tests/unit/repo-policy.test.ts`, `tests/unit/setup/server-only-stub.ts`, `vitest.config.ts`, `tsconfig.json`
  _Depends:_ 4.3
  _Requirements:_ 6.4
  _Traces:_ REQ-006, DES-2.2

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 5. hello スクリプトと `hello` タスク

_Boundary:_ `mise.toml`, `scripts/hello.ts`, `specs/002-llm-call-basics/research.md`
_Depends:_ 4
_Requirements:_ 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 8.5, 8.6
_Traces:_ REQ-005, REQ-008, DES-2.3

hello は自動テストを持たない（6.8）。形はタスク 3.6 の `hello-task.test.ts`（静的な検査）で守り、振る舞いはタスク 5.3 の実測で
確かめる。

- [ ] 5.1 `mise.toml` に `hello` タスクを加える
  - タスク `hello`: `run = "node --conditions=react-server scripts/hello.ts"`（1 つのコマンド）、`description` は「手元の Ollama の
    モデルを 1 回呼び、応答と usage を表示する。Ollama が要る。verify に含まれない」の要点を英語で書く（plan の mise タスクの
    表）。`verify`・`security` の構成と `depends` / `{ task = }` の参照は変えない（5.9）。
  - 完了条件: `mise tasks ls` に `hello` が表示される。`pnpm exec vitest run tests/unit/hello-task.test.ts` が、タスクの形の
    検査（5.8、5.9）について GREEN になり、`scripts/hello.ts` の静的な検査だけが（ファイルがないため）RED のまま。
  _Boundary:_ `mise.toml`
  _Depends:_ 4.3
  _Requirements:_ 5.8, 5.9
  _Traces:_ REQ-005, DES-2.3
- [ ] 5.2 `scripts/hello.ts` を書く
  - 上から順に読める 1 ファイル。構成（plan C3）: (1) import は `@ai-sdk/openai-compatible` の `createOpenAICompatible`、
    `ai` の `APICallError`、`../src/lib/ai/basics.ts` の `callModel` と例外クラス、`../src/lib/ai/model-allowlist.ts` の
    `MODEL_ALLOWLIST`（`.ts` 拡張子つき、型だけの import には `type`。ADR-7）。(2) 定数: Ollama の公式文書が示すローカルの
    OpenAI 互換 API の base URL（research.md I-8・ADR-1 で確かめた値を、Ollama の公式文書で再確認する。環境変数を読まない）、モデル ID
    （`MODEL_ALLOWLIST.ollama` の先頭。文字列で書かない。5.2）、固定の `system` と `prompt`（引数を受け取らない）。
    固定の `system` と `prompt` は英語の短い 1 文ずつ、5 項目の値は `temperature: 0.2`、`maxOutputTokens: 256`、
    `maxRetries: 2`（既定値を明示。未起動時の案内まで約 6 秒で NFR の 15 秒以内。解説の「改造する」が書き換える値）にする。
    (3) モデル生成の 1 行 `const model = <provider>(<model ID>)`。(4) `callModel` の呼び出しを 1 か所に置き、`system`・
    `prompt`・`temperature`・`maxOutputTokens`・`maxRetries` の 5 項目すべてに値を書く（5.3）。(5) 成功時: 使ったモデル ID、
    応答テキスト、`inputTokens` / `outputTokens`（未報告は `unknown`）を標準出力に書き、終了コード 0（5.1）。
    (6) 失敗時: 標準エラーに案内を書き、`process.exitCode = 1` にする。分類は `CallFailedError` の `cause` が `APICallError` で
    `statusCode` がない → 接続できない（Ollama の起動方法 = アプリを起動するか `ollama serve`、と `ollama pull <allowlist の ID>`。
    5.4）、`statusCode === 404` → モデルが未取得（`ollama pull <allowlist の ID>`。5.5）、それ以外 → 失敗の種類
    （`CallFailedError` なら `reason` と `attempts`、`CallConfigError` なら `field`、それ以外は例外の `name`）と概要（`cause` の
    `name` と、あれば HTTP の状態コード。5.6）。判定に例外のメッセージの文字列を使わない。
  - 出力してはいけないもの: `prompt` と `system` の本文、`cause` の丸ごと（`requestBodyValues` を含む）、例外のメッセージの
    中身（`console.error(error)` のように例外を丸ごと出力しない）。`process.env`・`import.meta.env` を読まない
    （`apiKey` を渡さない。5.7）。
  - 完了条件: `pnpm exec vitest run tests/unit/hello-task.test.ts` が GREEN（`mise run test` の全件が GREEN）。
    `mise run typecheck`（`scripts/**/*.ts` を含む）、`mise run check`、`mise run check:model-ids` が成功する（8.6）。
  _Boundary:_ `scripts/hello.ts`
  _Depends:_ 5.1
  _Requirements:_ 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.6
  _Traces:_ REQ-005, REQ-008, DES-2.3
- [ ] 5.3 hello を実測して R-5 に記録する
  - 次の 3 つの状況で `mise run hello` を実行し、終了コードと標準出力・標準エラー、開始から終了までの秒数を R-5 に記録する:
    (a) Ollama を起動し allowlist の `ollama` のモデルを取得済み → 応答テキストと usage が表示され終了コード 0（5.1）、
    (b) Ollama を止めた → 起動方法と `ollama pull` が標準エラーに表示され終了コード 1、**開始から 15 秒以内**（5.4、NFR）、
    (c) Ollama は起動しているがモデルが未取得（モデルを消さずに済むよう、(a) より先に、モデルを取得する前に (b)(c) を行う。
    取得済みなら、ユーザーの了承なしに `ollama rm` しない）→ `ollama pull` だけが表示され終了コード 1（5.5）。
    あわせて、(d) 出力に `prompt` と `system` の本文が含まれないこと（5.7）、(e) 既定の条件で直接実行（`node scripts/hello.ts`）
    すると `server-only` の例外になること（解説の根拠）を確かめて記録する。
  - Ollama の操作（導入、起動・停止、`ollama pull`、`ollama rm`）はユーザーの環境の操作なので、ユーザーに依頼し、貼られた出力を
    記録する。(a) が確認できない（Ollama が使えない）場合は、その事実と未確認である理由を R-5 に書き、(b)(c) だけで完了に
    せず、ユーザーに残りの確認を求める。
  - 完了条件: R-5 に (a)〜(e) の結果と確認日がある。15 秒を超えたら、`maxRetries` の値と解説の説明を見直すかをユーザーに確認する
    （spec の NFR を満たさないため、タスクを完了にしない）。
  - (a)〜(e) のどれかが満たされず `scripts/hello.ts` を直すときは、このタスクの中で直し（境界に含む）、5.2 の完了条件
    （`hello-task.test.ts`、`typecheck`、`check`、`check:model-ids`）を再び通してから測り直す。直したことは CP-B のあとの
    新しいコミットにし、R-5 に理由とあわせて書く。
  _Boundary:_ `scripts/hello.ts`, `specs/002-llm-call-basics/research.md`
  _Depends:_ 5.2
  _Requirements:_ 5.1, 5.4, 5.5, 5.6, 5.7, 8.5
  _Traces:_ REQ-005, REQ-008, DES-2.3

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 6. 段 2 の解説

_Boundary:_ `docs/stages/2-llm-call-basics.md`
_Depends:_ 5
_Requirements:_ 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.6
_Traces:_ REQ-007, REQ-008, DES-2.6

解説は 1 ファイル（`docs/stages/2-llm-call-basics.md`）を前半・後半の 2 サブタスクで書く。散文は日本語、コード・識別子・パスは
英語。モデル ID の文字列を書かない（`check:model-ids` が `docs/` を走査する。7.8）。版番号を書くときは確認日つきの参考値に
する。兄弟リポジトリの本文を写さず、リンクだけを示す。`##` 見出しは次の 6 つをこの順に置く: `読む`、`動かす`、`改造する`、
`テストで合格を確かめる`、`プロバイダを変える方法`、`この段で扱わないこと`（plan C6）。先頭の 4 つは既存の
`docs-structure.test.ts` が検査する名前である。

- [ ] 6.1 「読む」「動かす」の 2 節を書く
  - ファイルの冒頭（`#` 見出しと、段の目的・合格条件の 1 段落）と、`## 読む`、`## 動かす` を書く。
  - 「読む」: `generateText`、system / user の役割（ラボの `system` が SDK の `instructions` に当たること。ADR-2）、
    `temperature`、`maxOutputTokens`、usage（未報告は `undefined`）、エラーと再試行（`maxRetries`、既定 2、`retries-exhausted` /
    `not-retryable`。`retries-exhausted` は最後の失敗の種類によらず「許された試行を使い切った」意味で、`cause` は再試行しない
    例外のこともある）の 6 つを、`src/lib/ai/basics.ts` の関数・型の名前と対応づけて説明する（7.2）。モデルを引数で受け取る理由
    （テストでモックに差し替える）にも触れる。
  - 「動かす」: Ollama の導入と起動 → allowlist の `ollama` のモデルの取得（`ollama pull` に渡す ID は
    `src/lib/ai/model-allowlist.ts` を見る。`mise run hello` が未取得時に正確なコマンドを表示する）→ `mise run hello` →
    成功時の表示（応答テキストと usage、未報告は `unknown`）の順（7.3）。`node scripts/hello.ts` の直接実行は
    `server-only` の例外になるため `mise run hello` を使うこと（タスク 5.3 (e) の記録）を書く。
  - 完了条件: `mise run check:model-ids` と `mise run check` が成功する。`pnpm exec vitest run tests/unit/docs-structure.test.ts`
    では、失敗してよいのはこのファイルの「4 節が順に揃う」と「`tests/` のパスを持つ」の多くても 2 つだけ（6.2 でまだ
    書いていないため。「読む」でテストのパスに触れれば後者は通る）で、それ以外のテストとファイルの結果は変わらない。
  _Boundary:_ `docs/stages/2-llm-call-basics.md`
  _Depends:_ 5.3
  _Requirements:_ 7.1, 7.2, 7.3, 7.8
  _Traces:_ REQ-007, DES-2.6
- [ ] 6.2 「改造する」「テストで合格を確かめる」「プロバイダを変える方法」「この段で扱わないこと」を書く
  - `## 改造する`: 課題を 1 つ以上（7.4）。例: `temperature` を変えて応答の揺れを見る、`maxOutputTokens` を小さくして
    `outputTokens` と途中で切れる応答を見る、`maxRetries: 0` にして Ollama 未起動時の終了が速くなることを見る（research.md の
    「❓」への答え）、`maxOutputTokens: 0` にして `CallConfigError` を見る。テスト側の課題（`DEFAULT_MAX_RETRIES` を変えて
    4.5 のテストが落ちることを見る）も 1 つ置く。
  - `## テストで合格を確かめる`: 合格条件（出力、usage、再試行の回数）ごとに、判定するテストのパス
    （`tests/unit/llm-call-basics.test.ts` など。**リポジトリに実在するパスだけ**で、`llm-call-basics*.test.ts` のような
    glob を書かない。`docs-structure.test.ts` が実在確認に失敗する。7.5）と、`mise run test` / `mise run verify` を
    示す。
  - `## プロバイダを変える方法`: Anthropic、OpenAI、Google のそれぞれについて、(1) 入れるパッケージ（`@ai-sdk/anthropic`、
    `@ai-sdk/openai`、`@ai-sdk/google`）と、先に plan を改正すること（憲章 原則 10）、(2) hello スクリプトで差し替える
    モデル生成の 1 行と import、(3) API キーの環境変数名（`.env.example` の `ANTHROPIC_API_KEY`・`OPENAI_API_KEY`・
    `GOOGLE_GENERATIVE_AI_API_KEY`）、(4) モデル ID は allowlist の該当プロバイダのものに限ること、を示す（7.6）。段 2 の時点では
    パッケージが入っておらず実行できないことと、環境変数による切り替え（`AI_PROVIDER`、`OLLAMA_BASE_URL` を含む）は段 6 で扱う
    ことを明記する（7.7）。
  - `## この段で扱わないこと`: ストリーミング（段 3）、構造化出力（段 4）、タイムアウトと中断（段 5）は
    `specs/000-development-plan/plan.md` §5 の表へリンクし、自作の再試行は `from-genai-to-agentic-ai` の該当モジュールへの
    リンクを示す（7.9。本文を写さない）。
  - 完了条件: `pnpm exec vitest run tests/unit/docs-structure.test.ts` が GREEN（4 節の順序、参照する `tests/` パスの実在）。
    `mise run check:model-ids` と `mise run check` が成功する。
  _Boundary:_ `docs/stages/2-llm-call-basics.md`
  _Depends:_ 6.1
  _Requirements:_ 7.1, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8.6
  _Traces:_ REQ-007, REQ-008, DES-2.6

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 7. 統治文書の同期

_Boundary:_ `AGENTS.md`, `README.md`, `.sdd/steering/tech.md`, `.sdd/steering/structure.md`
_Depends:_ 5
_Requirements:_ 8.8, 8.9
_Traces:_ REQ-008, DES-2.7

plan C7 のうち、`spec.md` の Clarifications への「plan 時の追記」4 点は `/sdd-plan` の時点で書かれていることを確認済み
（spec.md の「plan 時の追記（2026-11-27）」節）。`research.md` の R-1〜R-7 は各タスクが記録する。ここでは残りの 4 ファイルを
実物に合わせる。書くのは実装で確かめた事実だけで、版番号は確認日つきの参考値にする。

- [ ] 7.1 (P) `AGENTS.md` と `README.md` を段 2 の状態に合わせる（英語）
  - `AGENTS.md`: "Current state" を段 2（`generateText` の呼び出しと Ollama の実行例が入った状態。未マージなら PR の状態を
    正確に書く）に、コマンド表に `mise run hello`（Ollama が要る。`verify` に含まれない）を加え、Architecture の `src/` の
    記述に `src/lib/ai/basics.ts` と `scripts/hello.ts` を加える（8.8）。Code rules に 2 行を加える: Node が直接実行するコード
    （`scripts/*.ts` とそれが import するもの）は消せる構文と `import type` に限り `tsconfig.json` が守らせること、AI SDK の API は
    `node_modules/ai/docs/` の同梱文書で確かめること（ADR-7、ADR-9）。
  - `README.md`: コマンド表に `mise run hello` の行を加える。
  - 完了条件: `mise run check` が成功する。「Current state」に出てくる記述（ファイル名、タスク名）がリポジトリに実在する
    （`mise tasks ls` と `ls` で照合）。`grep -n 'No AI code' AGENTS.md` が空。`mise run test` と `mise run check:model-ids` も成功する（`README.md` と
    `AGENTS.md` を走査・検査する既存のテストがあるため）。
  _Boundary:_ `AGENTS.md`, `README.md`
  _Depends:_ 5.3, 6.2
  _Requirements:_ 8.8
  _Traces:_ REQ-008, DES-2.7
- [ ] 7.2 (P) steering の 2 ファイルを段 2 の状態に合わせる（日本語）
  - `.sdd/steering/tech.md`: 状態の注記（確認日つき）、Stack の AI の行（`ai`、Ollama 用の `@ai-sdk/openai-compatible`、
    `server-only`、peer の `zod`）、Conventions（`system` ではなく `instructions` に渡すこと、Node の型の除去と
    `react-server` 条件で動かすスクリプト、依存の agent skill を承認しないこと）を更新する。
  - `.sdd/steering/structure.md`: 状態の注記（確認日つき）、Directory Map の `scripts/`（`hello.ts` が実在する状態）と
    `tests/unit/setup/`（`server-only-stub.ts`）を更新する。
  - 完了条件: 両ファイルに書いたパス・名前がリポジトリに実在する。状態の注記の日付と内容が段 2 の実物（`package.json` の依存、`scripts/hello.ts` の有無）と一致する。
  _Boundary:_ `.sdd/steering/tech.md`, `.sdd/steering/structure.md`
  _Depends:_ 5.3, 6.2
  _Requirements:_ 8.9
  _Traces:_ REQ-008, DES-2.7

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 8. 最終検証と記録

_Boundary:_ `src/lib/ai/basics.ts`, `scripts/hello.ts`, `mise.toml`, `pnpm-workspace.yaml`, `tests/unit/llm-call-basics.test.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `tests/unit/hello-task.test.ts`, `tests/unit/repo-policy.test.ts`, `specs/002-llm-call-basics/research.md`
_Depends:_ 6, 7
_Requirements:_ 6.5, 6.7, 8.5, 8.7
_Traces:_ REQ-006, REQ-008, DES-2.5, DES-2.7

壊して戻す作業（8.1、8.2）は、コミット済みの状態（CP-B 以降）から `git diff` で復元を確かめられるときだけ行う。戻すときは
ファイル全体のコピーではなく Edit で元の行に戻し、`git diff` が空であることを確かめる（spec 001 の教訓）。

- [ ] 8.1 呼び出し関数とその契約テストが非空虚であることを確かめて R-3 に記録する（6.7）
  - 対象のロジックを 1 か所ずつ壊し、対応するテストが失敗することと失敗のメッセージを記録し、すぐ戻して `git diff` が空であること
    を確かめる。壊し方（失敗するテストの対応）: `DEFAULT_MAX_RETRIES` を変える（4.5）、`maxRetries` を SDK に渡さない
    （4.1〜4.4）、`system` を `instructions` に渡さない（1.4）、`temperature` / `maxOutputTokens` を落とす（1.6）、未報告の
    トークン数を 0 で埋める（2.3）、検証の 1 項目を外す（3.1〜3.4）、`CallFailedError` のメッセージに `cause` のメッセージを
    入れる（4.7）、`reason` の判定を逆にする（4.2、4.3）、`import "server-only"` を消す（1.9）、`basics.ts` に `server-only` と
    `ai` 以外の import を足す（1.1）、`config` を展開（spread）して `generateText` に渡す（1.2）、契約テストの
    `@ts-expect-error` の行の型を広げて指令を不要にする（1.3。`mise run typecheck` が失敗すること）。
  - 完了条件: R-3 に、壊した箇所・失敗したテスト名・失敗のメッセージ（要約）の表がある。すべて戻したあと `git status --porcelain`
    に意図しない変更がなく、`mise run test` が GREEN。壊してもテストが失敗しない箇所があれば、そのテストファイルを直し、
    直したことを R-3 に書く（境界の 2 つのテストファイルに限る）。
  _Boundary:_ `src/lib/ai/basics.ts`, `tests/unit/llm-call-basics.test.ts`, `tests/unit/llm-call-basics-contract.test.ts`, `specs/002-llm-call-basics/research.md`
  _Depends:_ 5.3, 6.2, 7.1, 7.2
  _Requirements:_ 6.7
  _Traces:_ REQ-006, DES-2.5
- [ ] 8.2 hello タスク・hello の静的な検査・依存設定のテストが非空虚であることを確かめて R-3 に追記する（6.7）
  - 1 か所ずつ壊し、戻して `git diff` が空であることを確かめる: `mise.toml` の `hello` のコマンドを変える・`verify` から
    `hello` を参照させる（5.8、5.9）、`scripts/hello.ts` に `process.env` を足す・`callModel(` を 2 か所にする（5.3、5.7）、
    `pnpm-workspace.yaml` の `permissions` を消す（ADR-9）。
  - 完了条件: R-3 に同じ形式の表がある。すべて戻したあと `git status --porcelain` に意図しない変更がなく、`mise run test` が
    GREEN。失敗しない箇所があれば、`hello-task.test.ts` か `repo-policy.test.ts` を直す。
  _Boundary:_ `mise.toml`, `scripts/hello.ts`, `pnpm-workspace.yaml`, `tests/unit/hello-task.test.ts`, `tests/unit/repo-policy.test.ts`, `specs/002-llm-call-basics/research.md`
  _Depends:_ 8.1
  _Requirements:_ 6.7
  _Traces:_ REQ-006, DES-2.5
- [ ] 8.3 `mise run verify` と作業ツリーの確認を行って R-4 に記録する（6.5、8.7）
  - `mise run verify` が終了コード 0（6 つの検査がすべて通り、段 2 のテストが実行されている）。API キーを表す環境変数
    （`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`GOOGLE_GENERATIVE_AI_API_KEY`）を外して実行しても同じ合否になること。実行後の
    `git status --porcelain` に意図しない変更（`tsconfig.json` や `next-env.d.ts` の書き換え）がないこと（ADR-7）。
  - `pnpm exec next build` を最終状態で実行し、その後の `git status --porcelain` を、タスク 2.1 の Implementation Notes に残した
    「tsconfig を変えた直後」の結果とあわせて R-4 に記録する
    （verify は `next build` を通らないため。gate には入れない）。
  - 6.5 のネットワーク遮断: 段 2 の新しいテスト 3 ファイル（`llm-call-basics.test.ts`、`llm-call-basics-contract.test.ts`、
    `hello-task.test.ts`）を、ネットワークを切った状態（ユーザーに Wi-Fi などを切ってもらう）で実行し、接続できる状態と同じ合否
    であることを R-4 に記録する。切れない場合は、その理由と、既存の通信ガード（`tests/unit/setup/network-guard.ts`）が未モックの
    通信を失敗させることを根拠にした免除を R-4 に書き、ユーザーに確認する。
  - `.env.example` が変更されておらず（`git diff --stat -- .env.example` が空）、既存の `repo-policy.test.ts` が通ること（8.7）。
  - 任意の参考記録: `MISE_ENV=node27 mise install` のあと `MISE_ENV=node27 mise run verify` の結果（失敗しても段 2 の合否には
    使わない。Node 27 でだけ必要な修正が出たら、ユーザーに伝えて `docs/node27/` への記録を別に決める）。
  - 完了条件: R-4 に各コマンドの終了コードと `git status --porcelain` の出力がある。失敗があれば原因を調べ（再試行しない）、
    ベースブランチ `main` でも起きる失敗は新しい失敗と分けて記録する。
  _Boundary:_ `specs/002-llm-call-basics/research.md`
  _Depends:_ 8.1, 8.2, 6.2, 7.1, 7.2
  _Requirements:_ 6.5, 8.7
  _Traces:_ REQ-006, REQ-008, DES-2.5
- [ ] 8.4 呼び出し関数の分岐カバレッジを使い捨ての worktree で測って R-6 に記録する（NFR、ADR-10）
  - コミット済みの HEAD から `git worktree add` で作業ツリーを作り、`mise trust`、`mise install`、
    `pnpm install --frozen-lockfile` のあと `@vitest/coverage-v8`（`vitest` と同じ版。24h を満たす版を確かめる）を、
    `package.json` を保存しない形（例: `pnpm add --save-exact -D` した変更をコミットしない）で入れる。
    `tests/unit/llm-call-basics*.test.ts` を `--coverage.include=src/lib/ai/basics.ts` つきで実行し、分岐カバレッジの数値と
    再現手順（コマンド）を R-6 に記録する。計測後に worktree を消す。しきい値は合否に使わない。
  - 完了条件: R-6 に数値、コマンド、`@vitest/coverage-v8` の版、worktree を消したことがある。メインの作業ツリーの
    `package.json` と `pnpm-lock.yaml` に `@vitest/coverage-v8` がない（`git diff` が空）。
  _Boundary:_ `specs/002-llm-call-basics/research.md`
  _Depends:_ 8.3
  _Requirements:_ 8.5
  _Traces:_ REQ-008, DES-2.5

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->
