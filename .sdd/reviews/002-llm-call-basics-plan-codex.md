HEAD: 43d2ad0c8c84e8a7381854830fbd3899d013f84a

## Critique

### [HIGH] 型エラー用の文字列モデル呼び出しを実行すると、オフラインの unit test が破綻する
**Location**: specs/002-llm-call-basics/plan.md:198-202  
**Issue**: `@ts-expect-error` を付けた文字列モデル ID の呼び出しまで実行する設計は、モックではなく AI Gateway 経路を使いうるため、決定論的・オフラインな合格判定テストにできない。  
**Evidence**: plan は「`文字列のモデル ID` の直上に `// @ts-expect-error`」を置き、「`指令を含む呼び出しは実行もし`」とする一方、research ADR-3 は「文字列を渡すと SDK が内部で Gateway のモデルを作り、ネットワークと Gateway の鍵が要る」と記録している。  
**Confidence**: high  
**Proof**: 依存追加後、文字列モデル ID の抑制付き呼び出しを有効な設定で実行する契約テストを `pnpm exec vitest run tests/unit/llm-call-basics-contract.test.ts` で走らせる。既存の Vitest 通信ガードにより `UnmockedNetworkError` になるか、Gateway 起因で失敗する。  
**Fix**: 文字列モデル ID の負の型検査は、実行しない型専用宣言または到達不能ブロックに分離する。実行する例は `MockLanguageModelV4` を渡すものだけに限定し、その方針を C5 と契約テストの設計に明記する。  

### [MEDIUM] `maxRetries: 0` の再試行可能な `GatewayError` を誤分類する
**Location**: specs/002-llm-call-basics/plan.md:74-76  
**Issue**: 未ラップ例外の分類が `APICallError.isRetryable` だけを判定するため、research が SDK の再試行対象として明記する `GatewayError` を `not-retryable` に分類する可能性がある。  
**Evidence**: flowchart は「`maxRetries が 0` で `APICallError.isRetryable`」だけを `retries-exhausted` にするが、research.md:106 は再試行対象を「`APICallError` で `isRetryable === true`（または `GatewayError` で同じ）」としている。  
**Confidence**: medium  
**Proof**: 最終採用版で再試行可能な `GatewayError` を投げる `MockLanguageModelV4` を作り、`maxRetries: 0` の `CallFailedError.reason` が `retries-exhausted` になることを `pnpm exec vitest run tests/unit/llm-call-basics.test.ts -t "GatewayError"` で検証する。現設計どおりなら `not-retryable` になるか、`GatewayError` が `APICallError` の部分型であることを実証する必要がある。  
**Fix**: 採用版のエラー階層を確認し、SDK が再試行可能と判定するエラーを網羅する共通 predicate を ADR-5、フローチャート、実装契約に定義する。`APICallError` と `GatewayError` の `maxRetries: 0` を個別にテストする。  

### [MEDIUM] `server-only` の子プロセス契約テストは Vitest の通信ガードを継承しない
**Location**: specs/002-llm-call-basics/plan.md:203-205  
**Issue**: 子プロセスの Node は親 Vitest プロセスで差し替えた `fetch` と `net.Socket.prototype.connect` を継承しないため、この検証経路での未モック通信をゲートが阻止できない。  
**Evidence**: plan は Node 子プロセスで `basics.ts` を import すると定めるが、既存の `tests/unit/setup/network-guard.ts:70-81` は親プロセスの `net.Socket.prototype.connect` と `globalThis.fetch` だけを差し替える。  
**Confidence**: high  
**Proof**: 子プロセスが読む一時 fixture に `await fetch("http://127.0.0.1:1")` または `net.connect()` を加え、`pnpm exec vitest run tests/unit/llm-call-basics-contract.test.ts -t "server-only"` を実行する。親の `UnmockedNetworkError` ではなく、子プロセス固有の接続結果に依存すればガード未継承が示される。  
**Fix**: 子プロセス用の ESM preload を追加し、`node --import <network-guard-preload>` で既定条件・`react-server` 条件の双方を起動する。preload が通信を明示的に拒否する自己検査も追加する。  

### [MEDIUM] 要件 8.5 が要求する公式ドキュメントの根拠が、再試行の API 主張には不足している
**Location**: specs/002-llm-call-basics/research.md:101-132  
**Issue**: `RetryError.reason`、再試行対象、`APICallError.isRetryable`、`retry-after-ms` の主張は内部ソースと probe に依存しており、spec 8.5 が求める「公式ドキュメントの確認」を記録していない。  
**Evidence**: spec.md:341-344 は API 主張について「公式ドキュメントの確認と実インストール・実行の結果」を要求するが、I-5 の Evidence は `provider-utils` と `ai` の `src`、および probe 出力のみである。  
**Confidence**: high  
**Proof**: `research.md` の I-5 Evidence と、依存導入後の `node_modules/ai/docs/` を照合し、再試行対象・header 処理・`RetryError` reason を裏付ける同梱公式文書または公開 API 型の位置が記録されているか確認する。  
**Fix**: 採用する exact version を install した直後に、同梱公式文書・公開 `.d.ts`・probe の対応表を R-1 に追加する。公開契約でない `RetryError.reason` に依存するなら、その不安定性と版更新時の必須再検証手順を ADR-5 に明記する。  

### [MEDIUM] 省略した生成設定を「含めない」という 1.7 を、設計もテストも証明していない
**Location**: specs/002-llm-call-basics/plan.md:124-126  
**Issue**: `temperature` と `maxOutputTokens` を `undefined` でも常に `generateText` に渡す設計と、値が `undefined` であることだけを見るテストでは、要件 1.7 の「生成要求に含めず」を保証できない。  
**Evidence**: plan は `temperature: config.temperature` と `maxOutputTokens: config.maxOutputTokens` を常に渡し、C5 は省略時に `undefined` を確認するとするが、spec.md:149-150 は省略項目を「生成要求に含めず」と定める。  
**Confidence**: medium  
**Proof**: `doGenerateCalls[0]` に対して `Object.hasOwn(call, "temperature")` と `Object.hasOwn(call, "maxOutputTokens")` を検査するテストを追加し、`undefined` の own property が残るかを `pnpm exec vitest run tests/unit/llm-call-basics.test.ts -t "omitted settings"` で確認する。  
**Fix**: 条件付き object composition で省略された設定を `generateText` 引数から除外するか、採用版 SDK が SDK 境界で当該 property を確実に除外する probe と、property 不在を確認するテストを設ける。  

### [LOW] 複数の受入基準が「レビュー」だけに留まり、壊しても再現可能に失敗しない (prior: stands as notes)
**Location**: specs/002-llm-call-basics/plan.md:585-619  
**Issue**: hello の 5.3・5.6・5.7、解説の 7.2〜7.4・7.6〜7.9、統治文書同期の 8.8・8.9 はレビューまたは手作業記録だけで、計画中のゲートが違反を確実に検出しない。  
**Evidence**: traceability は 5.3 を「レビュー」、5.6・5.7 を「レビュー」、7.2〜7.4・7.6〜7.9・8.8・8.9 も「レビュー」とする。既存 `tests/unit/docs-structure.test.ts` のコメントは「Only structure is checked」であり、本文の要件を検査しない。001 の prior review でも「安く自動化できる要件を『レビュー』に残している」は LOW として残っている。  
**Confidence**: high  
**Proof**: 実装後に `scripts/hello.ts` の `callModel` 呼び出しから `maxRetries` を削除する、または解説から段 6 への案内を削除し、それぞれ `pnpm exec vitest run tests/unit/hello-task.test.ts` と `pnpm exec vitest run tests/unit/docs-structure.test.ts` を実行する。計画中のテストは通過する。  
**Fix**: `hello.ts` 自体を実行せずに、静的契約テストまたは純粋な分類・表示ヘルパーの unit test を追加する。解説・統治文書は、必要見出し、段番号案内、プロバイダ変更時の plan 改訂、環境変数名、必須テストパスを検査する stage-2 専用契約テストで保護する。  

### [LOW] AI SDK API 主張は、この checkout に入る実物の依存からは検証不能である
**Location**: specs/002-llm-call-basics/research.md:68-153  
**Issue**: 現在の checkout に `node_modules/ai` がないため、`instructions`、`maxRetries`、`RetryError`、`MockLanguageModelV4`、usage、`retry-after-ms` の主張を採用版の同梱 docs・型定義から独立に確認できない。  
**Evidence**: 確認結果は `ai not installed` であり、C1 も採用版を「実装時に」決定するとしている。  
**Confidence**: high  
**Proof**: `mise exec -- node -e 'import { existsSync } from "node:fs"; process.exit(existsSync("node_modules/ai/package.json") ? 0 : 1)'` を実行する。現時点では終了コード 1 となる。  
**Fix**: C1 の依存追加直後、lockfile で確定した版の `node_modules/ai/docs`、公開型、`ai/test` 型、retry 実装を再確認し、I-3〜I-7 の probe 結果を R-1 に記録することを tasks.md の実装開始条件にする。  

### [LOW] `tsconfig` 変更後の Next.js production build を確認する手順がない
**Location**: specs/002-llm-call-basics/plan.md:438-443  
**Issue**: `mise run verify` は `next typegen` と `tsc --noEmit` までであり、Node type stripping 用の TypeScript 設定が Next.js production build を壊さないことを計画上は確認しない。  
**Evidence**: `mise.toml` の `typecheck` は `next typegen` と `tsc --noEmit` だけで、R-4 は `mise run verify` と `git status --porcelain` の記録だけを要求する。  
**Confidence**: medium  
**Proof**: stage 2 の設定・ソース導入後に `pnpm exec next build` を実行する。型検査は通っても Next compiler の設定処理で失敗する場合、計画中の検証では捕捉されない。  
**Fix**: tsconfig 変更直後と最終検証後に `pnpm exec next build` を実行し、結果を R-4 に記録する。gate へ build を含めるかは、実行時間と決定論を別 spec で判断する。  

## Verdict
REQUEST_CHANGES

## Adjudication

Adjudicated by the calling session (Claude) on 2026-11-27. `node_modules/ai` is not installed in this checkout, so Proofs that need the SDK were checked against plan/research text, the repo's existing tests, and the official AI SDK docs (Context7 `/vercel/ai`).

| # | Finding | Decision | Evidence |
|---|---------|----------|----------|
| 1 | HIGH: string model ID `@ts-expect-error` call is also executed | stands (HIGH) → **fixed in plan.md C5** (string-ID line sits in a never-called function; only the extra-key call runs) | plan.md:199-202 lists "文字列のモデル ID" among the directive lines and then says "指令を含む呼び出しは実行もし"; research ADR-3 says a string makes the SDK build a Gateway model (network + key). Executing it cannot be offline/deterministic. |
| 2 | MEDIUM: `maxRetries: 0` + retryable `GatewayError` misclassified | stands, downgraded to LOW → **fixed in ADR-5 and the plan flowchart** (predicate mirrors the SDK `shouldRetry`; shape fixed at R-1) | SDK `shouldRetry` accepts `APICallError` or `GatewayError` with `isRetryable` (Context7, `packages/ai/src/util/retry-with-exponential-backoff.ts`). ADR-5 checks only `APICallError`. Unreachable in stage 2 (no gateway model is passed), so LOW; merged into the ADR-5 predicate fix. |
| 3 | MEDIUM: child-process `server-only` test does not inherit the network guard | dismissed | Spec 001 already runs child processes (tsc, Biome, mise, git) through `tests/unit/helpers/sandbox.ts` without the in-process guard; the child here only imports `server-only` and `ai`, which perform no I/O at import. No new risk class. |
| 4 | MEDIUM: 8.5 official-doc evidence missing for retry claims | stands (MEDIUM) → **fixed in research.md I-5 and ADR-5** | research.md I-5 Evidence cites only `src/` files and probes. Official docs exist and partly cover it: `07-reference/05-ai-sdk-errors/ai-retry-error.mdx` (properties `reason`, `lastError`, `errors`, without the value set) and `03-ai-sdk-core/25-settings.mdx` (`maxRetries` default 2). The `reason` values are source-only. |
| 5 | MEDIUM: 1.7 "含めず" not proven by `undefined` check | escalated → **resolved by the user's recommended option (a): a value of `undefined` at the model satisfies 1.7; recorded in spec.md Clarifications** | plan.md:124-126 passes the fields unconditionally; spec 1.7 says "生成要求に含めず". The SDK builds the call options itself, so an own-property check at the mock may be unachievable; what "含めない" means at the mock boundary needs a recorded interpretation. Unverified without install. |
| 6 | LOW: several ACs verified by review only (prior: stands as notes) | stands (LOW) → **partly fixed: 5.3 and 5.7 get a static read-only check in hello-task.test.ts; the rest stay review-only** | plan.md:585-619. 5.3 and 5.7 (no `process.env`, one `callModel` call site) can be checked statically without running hello (6.8 forbids executing it, not reading it). |
| 7 | LOW: AI SDK claims unverifiable in this checkout | dismissed as a separate item (the re-check after install is now a completion condition in plan C1 and R-1) | Expected before C1; research I-1..I-12 used an isolated probe install, and Risks + R-1 already require re-checking on the adopted version. Folded into #4. |
| 8 | LOW: no `next build` check after tsconfig change | stands (LOW) → **fixed: R-4 records two one-off `next build` runs** | `playwright.config.ts` webServer runs `next dev`, and `typecheck` is `next typegen` + `tsc`; nothing runs `next build`. One-off run recorded in R-4 is cheap. |

Caller verdict: REQUEST_CHANGES on the plan text (one HIGH, fixable in plan wording); no CRITICAL.
