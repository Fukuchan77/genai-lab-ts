# 002-llm-call-basics — Discovery & Research Log

`/sdd-plan` で行った調査・判断・リスクの記録。I-n は調査、ADR-n は設計判断、R-n は実装時の記録
（`/sdd-impl` で追記）。版番号は確認日つきの参考値で、正本は `package.json` と `pnpm-lock.yaml`
（憲章 原則 9）。モデル ID は本書にも書かず、「allowlist の `ollama` のモデル」と呼ぶ（spec Clarifications、
憲章 原則 5）。

調査日: 2026-11-27（UTC 07:48 前後）。調査環境: リポジトリの外の使い捨てディレクトリ
（スクラッチパッドの `probe/`）に、`pnpm-workspace.yaml` をリポジトリと同じ供給網の設定
（`minimumReleaseAge: 1440`、`minimumReleaseAgeStrict: true`、`strictDepBuilds: true`、`savePrefix: ""`）にして
候補の依存を入れ、Node 26.13.1 / pnpm 12.22.0 / Vitest 5.1.2 / TypeScript 7.1.0-beta で実行した。
使い捨てディレクトリはコミットしない。

## Discovery type

New feature（full）。段 2 は本リポジトリで最初に AI SDK を入れて LLM を呼ぶ段で、外部依存
（AI SDK、プロバイダ、`server-only`）と実行経路（Node の型の除去、`react-server` 条件）が新しい。
既存の足場（mise タスク、Vitest の通信ガード、`check:model-ids`、docs の構造テスト）には拡張として載る。

## Investigations

### I-1 候補の版と公開日時（24h ゲート、8.3）

- **Question**: 段 2 で入れる依存の、調査時点で公開から 24 時間以上たった最新の安定版はどれか。
- **Findings**（基準時刻 2026-11-27T07:48Z、24h 前 = 2026-11-26T07:48Z）:

  | Package | 候補版 | 公開（UTC） | 24h |
  |---------|--------|-------------|-----|
  | `ai` | 7.0.183 | 2026-11-26T04:37Z | 満たす |
  | `@ai-sdk/openai-compatible` | 3.0.96 | 2026-11-26T04:34Z | 満たす |
  | `server-only` | 0.0.1 | 2022-09-03T01:07Z | 満たす |
  | `zod` | 4.6.7 | 2026-10-12T16:29Z | 満たす |
  | （参考、不採用）`ollama-ai-provider-v2` | 4.1.0 | 2026-10-22T14:40Z | 満たす |
  | （参考、不採用）`ai-sdk-ollama` | 4.6.3 | 2026-11-05T22:06Z | 満たす |
  | （計測専用、ADR-10）`@vitest/coverage-v8` | 5.1.2 | 2026-11-25T11:50Z | 満たす |

  `@ai-sdk/ollama` は npm に存在しない（`pnpm view @ai-sdk/ollama` → `404 Not Found`）。`ai` は 7.0.x が
  ほぼ毎日出るため、実装時に改めて 24h を満たす版を確かめて R-1 に記録する。
- **Evidence**: `pnpm view <pkg> time --json`（スクラッチパッドの `s002/time-*.json`）、
  `pnpm install` が `minimumReleaseAge: 1440` のもとで成功（`Packages: +52`、`Done in 2.4s using pnpm v12.22.0`）。

### I-2 Ollama のプロバイダの候補（8.1、ADR-1）

- **Question**: Ollama を AI SDK 7 から呼ぶパッケージはどれか。公式のものはあるか。
- **Findings**:
  - AI SDK の公式文書は、Ollama を**コミュニティのプロバイダ**として 2 つ挙げる（`ollama-ai-provider-v2`: Ollama の
    HTTP API を直接呼ぶ、既定の接続先 `http://localhost:11434/api`。`ai-sdk-ollama`: Ollama 公式の JS クライアントを使う）。
    Vercel が保守する `@ai-sdk/ollama` はない。
  - 同じ文書の「Self-Hosted Models」節は、「OpenAI の仕様に対応した自前ホストのプロバイダは
    OpenAI Compatible Provider で使える」と書く。`@ai-sdk/openai-compatible` は `ai` と同じリポジトリ
    （`github.com/vercel/ai`）・同じリリース列で出る公式パッケージ。
  - Ollama の公式文書は、ローカルサーバーの OpenAI 互換 API の base URL を `http://localhost:11434/v1` と定める
    （Ollama 独自 API は `http://localhost:11434/api`）。`/v1/chat/completions` は `temperature`、`max_tokens`、
    `messages`（system / user）を受け付け、応答の `usage` に `prompt_tokens` / `completion_tokens` を返す。
  - 依存の形（npm の `dependencies` / `peerDependencies`）:
    - `@ai-sdk/openai-compatible@3.0.96`: `@ai-sdk/provider` 4.0.39 と `@ai-sdk/provider-utils` 5.0.85（`ai@7.0.183` と
      完全に同じ exact 版）、peer `zod ^3.25.76 || ^4.1.8`。ライセンス Apache-2.0。
    - `ollama-ai-provider-v2@4.1.0`: 上の 2 つを `^` 範囲で、peer `ai ^7.0.0`・`zod ^4.0.16`。個人の保守。Apache-2.0。
    - `ai-sdk-ollama@4.6.3`: 上の 2 つに加え `ollama`・`jsonrepair` に依存。個人の保守。MIT。
  - `.env.example` の既存の注記は `OLLAMA_BASE_URL` を「Ollama's OpenAI-compatible endpoint」と説明している
    （段 6 の想定と一致する）。
- **Evidence**: `node_modules/ai/docs/02-foundations/02-providers-and-models.mdx`（同梱文書、7.0.183）、
  Context7 `/vercel/ai` の `content/providers/05-community-providers/30-ollama.mdx` と
  `content/providers/04-openai-compatible-providers/index.mdx`、Context7 `/ollama/ollama` の
  `docs/api/introduction.mdx`（Base URLs 表）と `docs/api/openai-compatibility.mdx`、`pnpm view <pkg>@<ver> dependencies
  peerDependencies license repository.url`。

### I-3 `generateText` の設定項目と、モデルへ渡る生成要求（1.4〜1.8、ADR-2）

- **Question**: 呼び出し設定の 5 項目は `generateText` のどの名前に当たり、モックモデルからはどう見えるか。
- **Findings**（`ai@7.0.183`）:
  - 型定義の `Prompt` は `instructions?: Instructions` と `system?: Instructions` を持ち、`system` は
    `@deprecated Use \`instructions\` instead.`。`prompt: string | Array<ModelMessage>`。
    `LanguageModelCallOptions` は `maxOutputTokens?`・`temperature?` などを持つ。`maxRetries` は `RequestOptions` 側。
  - 同梱文書 `25-settings.mdx`: 「`maxRetries` — Maximum number of retries. Set to 0 to disable retries. Default: `2`.」。
    実装 `src/util/prepare-retries.ts` も `defaultMaxRetries = 2`、整数でない・負の値を `InvalidArgumentError` で拒否する。
  - モックの `doGenerateCalls[0]`（実測）:
    - `instructions: "SYS", prompt: "USER"` → `prompt` は
      `[{"role":"system","content":"SYS"},{"role":"user","content":[{"type":"text","text":"USER"}]}]`（system が先）。
    - `instructions` を省略 → `[{"role":"user","content":[{"type":"text","text":"USER"}]}]`（system のメッセージなし）。
    - `temperature: 0.3, maxOutputTokens: 42` → 生成要求に `0.3`・`42` がそのまま入る。省略すると値は `undefined`。
    - ツールを渡さないとき `tools` は `undefined`（`toolChoice` は `{ type: "auto" }` が入る）。
      `generateText` は `doGenerate` だけを呼び、`doStreamCalls` は空。
- **Evidence**: `node_modules/ai/dist/index-D1zb0Eh5.d.ts`（`type Prompt` 1068 行付近、`LanguageModelCallOptions` 912 行付近）、
  `node_modules/ai/docs/03-ai-sdk-core/25-settings.mdx` 115〜117 行、`node_modules/ai/src/util/prepare-retries.ts`、
  probe テスト `t/probe.test.ts` の出力（`PROMPT`、`SETTINGS`、`OMITTED` の行）。

### I-4 usage の型と未報告時の値（2.2、2.3、2.5）

- **Question**: 結果の usage はどの形で、モデルが報告しない項目はどうなるか。
- **Findings**:
  - `LanguageModelUsage` は `inputTokens: number | undefined`、`outputTokens: number | undefined` のほか
    `inputTokenDetails`・`outputTokenDetails`・`totalTokens`・`raw?` を持つ。
  - モック（LanguageModelV4）の usage は入れ子の形（`inputTokens: { total, noCache, cacheRead, cacheWrite }`、
    `outputTokens: { total, text, reasoning }`）で、`generateText` の結果では `total` が `inputTokens` / `outputTokens` になる。
  - 出力側を `total: undefined` にすると結果の `outputTokens` は `undefined` のまま（0 で埋めない）。
  - 1 回目が失敗し 2 回目が成功した呼び出しの usage は、2 回目の値（`{ i: 20, o: 200 }`）。失敗した試行は usage を持たない。
- **Evidence**: `index-D1zb0Eh5.d.ts` 348 行付近の `type LanguageModelUsage`、`docs/03-ai-sdk-core/55-testing.mdx`
  （モックの usage の形）、probe の `USAGE {"inputTokens":7,...}`（出力側は未定義）、`usage-after-retry {"i":20,"o":200}`。

### I-5 再試行の仕組み（4.1〜4.8、ADR-5、ADR-6）

- **Question**: `maxRetries` の再試行は何を対象にし、失敗時にどの例外を投げるか。テストで待ち時間をなくせるか。
- **Findings**（`@ai-sdk/provider-utils@5.0.85` の `retryWithExponentialBackoffInternal`、`ai` の
  `retryWithExponentialBackoffRespectingRetryHeaders`）:
  - 再試行の対象: `APICallError` で `isRetryable === true`（または `GatewayError` で同じ）。間隔は初回 2000 ms、
    倍率 2 の指数バックオフ。応答ヘッダーの `retry-after-ms` / `retry-after` が 0〜60 秒なら、その値を使う。
  - 投げる例外（判定の順）:
    1. 中断（abort）の例外 → そのまま投げる。
    2. `maxRetries === 0` → 元の例外をそのまま投げる（包まない）。
    3. 試行回数 > `maxRetries` → `RetryError`（`reason: "maxRetriesExceeded"`、`errors` = 全試行の例外、
       `lastError` = 最後の例外）。**この判定は再試行可否より先**に行われる。
    4. 再試行可能 → 待って再試行。
    5. 1 回目で再試行しない例外 → 元の例外をそのまま投げる。
    6. それ以外（再試行のあとで再試行しない例外）→ `RetryError`（`reason: "errorNotRetryable"`）。
  - `RetryError.message` は最後の例外のメッセージを埋め込む（`Failed after 3 attempts. Last error: AI_APICallError: busy`）。
    `APICallError` は `requestBodyValues`（送った本文。prompt を含む）を持つ。
  - 実測（モックの `doGenerate` が例外を投げる。再試行可能な例外は `statusCode: 503`・`retry-after-ms: "0"`）:

    | 失敗の並び（r = 再試行可能、f = 再試行しない） | `maxRetries` | 結果 | 試行回数 | 所要 |
    |------|------|------|------|------|
    | r, r, 成功 | 2 | 成功 | 3 | 3 ms |
    | r が続く | 2 | `RetryError` / `maxRetriesExceeded` | 3 | 3 ms |
    | r が続く | 0 | `APICallError`（包まれない） | 1 | 0 ms |
    | f | 2 | `APICallError`（包まれない） | 1 | — |
    | r, f | 2 | `RetryError` / `errorNotRetryable` | 2 | — |
    | r, r, f | 2 | `RetryError` / `maxRetriesExceeded` | 3 | — |

  - `retry-after-ms` を付けない接続失敗では、`maxRetries: 2` で 2000 ms + 4000 ms を待つ（I-8 の実測 6.0 秒）。
- **Evidence**: `node_modules/.pnpm/@ai-sdk+provider-utils@5.0.85_zod@4.6.7/node_modules/@ai-sdk/provider-utils/src/retry-with-exponential-backoff.ts`、
  `node_modules/ai/src/util/retry-with-exponential-backoff.ts`、`node_modules/ai/src/util/retry-error.ts`、probe の出力
  （`2fail-then-ok`、`exhaust`、`exhaust0`、`fatal-first`、`retry-then-fatal`、`r-r-f` の行）。
  公式文書（8.5）: `content/docs/07-reference/05-ai-sdk-errors/ai-retry-error.mdx`（`RetryError` の `reason`・`lastError`・
  `errors`・`message` の各項目と `RetryError.isInstance`。`reason` の値の一覧は載っていない）、
  `content/docs/03-ai-sdk-core/25-settings.mdx`（「`maxRetries` — … Set to 0 to disable retries. Default: `2`.」）。
  いずれも Context7 `/vercel/ai`（main ブランチ、2026-11-27 確認）。採用版の同梱文書（`node_modules/ai/docs/`）での
  照合は R-1 で行う。

### I-6 AI SDK が呼び出し前に検証しない値（3.1〜3.4、ADR-4）

- **Question**: 不正な設定値は AI SDK が呼び出し前に拒否するか。
- **Findings**:
  - `prompt: ""` は拒否されず、空のテキストの user メッセージで 1 回呼ばれる。
  - `temperature: NaN` は拒否されず 1 回呼ばれる。
  - `maxRetries` は整数でない・負の値を `InvalidArgumentError` で拒否する（I-3）が、`NaN` の扱いは版に依存しうる。
  - `instructions: ""` は空の system メッセージとして送られる（`[{"role":"system","content":""}, ...]`）。
  - したがって 3.1〜3.4 はラボの呼び出し関数が自分で検証しないと満たせない。
- **Evidence**: probe の `EMPTY_PROMPT ok calls 1`、`NAN temp ok calls 1`、`EMPTY_SYS [...]` の行。

### I-7 モックモデル `MockLanguageModelV4`（6.1〜6.3）

- **Question**: モックの名前、import 元、記録できる内容は何か。
- **Findings**: `ai/test` が `MockLanguageModelV4` を export する（`ai` の `exports` に `./test`）。`doGenerate` には
  結果のオブジェクト、結果の配列、関数のいずれかを渡せる。関数なら呼ばれるたびに例外を投げたり結果を変えたりできる。
  `doGenerateCalls` / `doStreamCalls` に生成要求（`LanguageModelV4CallOptions`）が記録される。結果の形は
  `content`（`{ type: "text", text }`）、`finishReason: { unified, raw }`、`usage`（I-4 の入れ子）、`warnings`。
- **Evidence**: `node_modules/ai/dist/test/index.d.ts` 132〜149 行、`node_modules/ai/docs/03-ai-sdk-core/55-testing.mdx`、
  probe テストの実行（`Tests 2 passed (2)`）。

### I-8 Ollama への実際の接続（5.1、5.4〜5.7、NFR の応答性）

- **Question**: `@ai-sdk/openai-compatible` で Ollama を呼んだとき、成功・未起動・モデル未取得はそれぞれどう見えるか。
- **Findings**（Ollama 0.40.18、macOS、`node --conditions=react-server` で probe の hello を実行。`maxRetries: 2`）:

  | 状況 | 例外 | 最後の試行の例外 | 試行 | 所要 |
  |------|------|------------------|------|------|
  | 接続先が閉じたポート（未起動に相当） | `RetryError` / `maxRetriesExceeded` | `APICallError`、`isRetryable: true`、`statusCode` なし、メッセージ `Cannot connect to API: connect ECONNREFUSED …`、`cause.code: "ECONNREFUSED"` | 3 | 6036 ms |
  | 起動済み・allowlist のモデルが未取得 | `APICallError`（包まれない） | 同左。`statusCode: 404`、`isRetryable: false`、本文 `{"error":{"message":"model '<id>' not found","type":"not_found_error",…}}` | 1 | 60 ms |
  | 起動済み・取得済みのモデル（allowlist の ID と同じモデルの別タグで確認） | なし（成功） | — | 1 | 2651 ms |

  成功時の結果は `{"text":"Hello!","usage":{"inputTokens":34,"outputTokens":3}}`（usage を報告する）。
  Ollama のソース（`server/routes.go` の ChatHandler）も、モデルがないとき 404 と `model '<name>' not found` を返し、
  OpenAI 互換層がそれを `not_found_error` の形に包むと示す。
  `@ai-sdk/openai-compatible` の `src/` は環境変数を読まない（`process.env`・`loadApiKey`・`loadSetting` の出現 0 件）。
  `apiKey` を渡さなければ `Authorization` ヘッダーも付けない。
- **判定に使える性質**: 「`APICallError` で `statusCode` がない」= HTTP の応答を受け取れなかった（接続できない）。
  「`statusCode === 404`」= 固定の base URL のもとではモデル未取得。メッセージの文字列は判定に使わない。
- **Evidence**: probe の `scripts/hello.ts` の出力 3 行（`ERR AI_RetryError maxRetriesExceeded 3 …`、
  `ERR AI_APICallError - 1 {"status":404,…}`、`OK {"text":"Hello!",…}`）、Context7 `/ollama/ollama`
  （`server/routes.go`、`openai/openai.go`）、`grep -rn "process.env\|loadApiKey\|loadSetting" src`（0 件）。

### I-9 `server-only` と読み込み条件（1.9、ADR-8）

- **Question**: `server-only` を import するモジュールを、hello スクリプト・Vitest・Next.js のそれぞれで読めるか。
- **Findings**:
  - `server-only@0.0.1` の `exports` は `{ ".": { "react-server": "./empty.js", "default": "./index.js" } }`。
  - Node の既定の条件で probe の `basics.ts` を読むと、`server-only/index.js` が
    `Error: This module cannot be imported from a Client Component module. …` を投げる。
  - `node --conditions=react-server scripts/hello.ts` は読み込める（I-8 の実行はすべてこの形）。`ai` と
    `@ai-sdk/openai-compatible` の `exports` は `react-server` 条件を持たないため、解決先は変わらない。
  - Vitest 5.1.2 は既定で同じ例外を投げる（`Tests no tests`）。`resolve.alias` で `server-only` を空のモジュールに
    置き換えると通る（`Tests 1 passed (1)`）。
- **Evidence**: `pnpm view server-only exports`、`pnpm view ai@7.0.183 exports`、`pnpm view @ai-sdk/openai-compatible@3.0.96 exports`、
  probe の `node scripts/hello.ts`（既定の条件）と `node --conditions=react-server scripts/hello.ts` の出力、
  probe の `vitest run t/basics.test.ts`（alias なし / あり）。

### I-10 TypeScript: `.ts` 拡張子の import と、Node の型の除去で動く書き方（ADR-7）

- **Question**: hello スクリプトが `src/lib/ai/*.ts` を Node から直接 import し、同時に `tsc` で型検査されるには何が要るか。
- **Findings**:
  - Node は拡張子つきの相対 import（`../src/lib/ai/basics.ts`）を要する。`tsc` は既定でこれを
    `TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.` で拒否する。
  - Node の型の除去は、消せる構文だけを扱い（enum、パラメータプロパティ、実行時コードを持つ namespace は不可）、
    型だけの import に `type` が付いていないと実行時に「export がない」で失敗する。`verify` は hello を実行しない
    （5.9）ため、これを静的に止めるには `tsc` の設定が要る。
  - `--verbatimModuleSyntax --erasableSyntaxOnly` を付けると、`import { LanguageModel } from "ai"`（型を値として import）が
    `TS1484`、`enum` が `TS1294` になる。
  - リポジトリの現在のコードは `--allowImportingTsExtensions --verbatimModuleSyntax --erasableSyntaxOnly --incremental false`
    で `tsc --noEmit` が成功する（作業ツリーに変化なし）。
  - Next.js の `writeConfigurationDefaults` は `verbatimModuleSyntax: true` のとき `isolatedModules` を要求しない分岐を持ち、
    利用者の追加の設定を消さない。Next.js の同梱文書（`from-vite.md`）の tsconfig 例は `allowImportingTsExtensions: true` を含む。
  - `tsconfig.json` の `include` に `scripts/` がないため、現状では `scripts/*.ts` は型検査されない。
  - 余分なキーを持つ object リテラルと、文字列のモデル ID を渡す呼び出しは、それぞれ直上の `// @ts-expect-error` で
    型エラーとして扱える（設定を足した probe で `tsc` 成功。指令が不要になれば `tsc` が失敗する）。
- **Evidence**: probe の `tsc --noEmit -p tsconfig.json`（設定なし: TS5097 が 2 件 / 設定あり: エラーなし）、
  `src/bad.ts` を使った TS1484・TS1294 の出力、リポジトリでの `pnpm exec tsc --noEmit --incremental false …`（exit 0、
  `git status --porcelain` は `specs/002-llm-call-basics/` だけ）、`node_modules/next/dist/lib/typescript/writeConfigurationDefaults.js`
  172 行付近、`node_modules/next/dist/docs/01-app/02-guides/migrating/from-vite.md` 119 行。

### I-11 pnpm 12 の「Agent skills awaiting approval: ai.」（spec 001 からの引き継ぎ、ADR-9）

- **Question**: `ai` を入れると出る承認待ちは何で、どう扱うか。
- **Findings**:
  - `ai` は `skills/ai-sdk/SKILL.md`（コーディングエージェント向けの指示）を同梱する。pnpm 12 はこれを依存の
    「権限」として扱い、承認されるまで `Agent skills awaiting approval: ai.` を表示する。install は成功し、
    `--frozen-lockfile` も exit 0（承認待ちは失敗にならない）。
  - `pnpm approve '!ai'`（拒否）は `pnpm-workspace.yaml` に `permissions: { ai: { skills: false } }` を書き、以後の
    install で表示が消える。
  - SKILL.md の内容は「記憶を信じず、`node_modules/ai/docs/` と `node_modules/ai/src/` の同梱文書を読む」こと、
    AI Gateway を最初の選択肢として勧めることなど。同梱文書は skill を承認しなくても読める。
- **Evidence**: `pnpm install` の出力、`pnpm permissions list`（`Awaiting approval: ai skills`）、`pnpm approve --help`、
  `pnpm approve '!ai'` 後の `pnpm-workspace.yaml`、`node_modules/ai/skills/ai-sdk/SKILL.md` の冒頭。

### I-12 依存の閉包（8.1、8.2）

- **Question**: 段 2 の依存を入れると、本番依存の閉包に何が加わるか。
- **Findings**: `ai`、`@ai-sdk/gateway`、`@ai-sdk/provider`、`@ai-sdk/provider-utils`、`@ai-sdk/openai-compatible`、
  `@standard-schema/spec`、`@vercel/oidc`、`@workflow/serde`、`eventsource-parser`、`json-schema`、`server-only`、`zod` の
  12 パッケージ。`@ai-sdk/openai-compatible` が加えるのは自身だけ（依存は `ai` と同じ exact 版で重複しない）。
  `zod` は `ai`・`@ai-sdk/gateway`・`@ai-sdk/provider-utils`・`@ai-sdk/openai-compatible` の peer（`peerDependenciesMeta` に
  optional の指定はない）。install スクリプトを持つパッケージはなかった（`Ignored build scripts` の表示なし）。
- **Evidence**: probe の `pnpm list --prod --depth Infinity --parseable`、`pnpm why zod`、`pnpm view ai@7.0.183 peerDependencies`。

## Existing patterns to reuse

| Pattern | Location | Why reuse |
|---------|----------|-----------|
| 子プロセスでツールを実行して合否を見る（`runCommand`、`resolveTool`、`expectGateFailure` / `expectGateSuccess`） | `tests/unit/helpers/sandbox.ts` | 1.9 の読み込み条件の検査を、既存のゲート自己検査と同じ書き方にする |
| mise タスクの中身を読む（`taskRun`）と、参照の再帰的な展開 | `tests/unit/helpers/sandbox.ts`、`tests/unit/verify-offline-contract.test.ts` | 5.8・5.9（hello タスクの形と、verify / security から届かないこと）を同じ方法で調べる |
| 解説の 4 節の順序と、参照する `tests/` パスの実在 | `tests/unit/docs-structure.test.ts` | `docs/stages/` のすべての解説に効くため、段 2 の解説（7.1、7.5）は追加の実装なしで検査される |
| モデル ID の直書き検出 | `scripts/check-model-ids.mjs`（`src/`、`scripts/`、`tests/`、`docs/` を走査） | 5.2・7.8・8.6 は既存の `check:model-ids` で検査される |
| Node の型の除去で読める `.ts`（消せる構文だけ） | `src/lib/ai/model-allowlist.ts` の冒頭コメント | hello スクリプトと `basics.ts` も同じ制約に従う。ADR-7 で `tsc` に守らせる |
| `allowBuilds` に判断と理由を書く | `pnpm-workspace.yaml` | 依存の権限（agent skills）の判断も同じファイルに理由つきで書く（ADR-9） |
| 使い捨て環境での計測・照合 | spec 001 research.md の ADR-9（ZIP の照合） | 分岐カバレッジの計測を、依存を足さずに行う（ADR-10） |

## External dependencies

宣言の正本は plan.md の C1。下表は調査時点の候補版（I-1）。

| Dependency | Version（候補） | 種別 | Purpose | Verified |
|------------|-----------------|------|---------|----------|
| `ai` | 7.0.183 | dependencies | `generateText`、`APICallError` / `RetryError`、`ai/test` の `MockLanguageModelV4` | 型定義・同梱文書・probe の実行（I-3〜I-7） |
| `@ai-sdk/openai-compatible` | 3.0.96 | dependencies | hello スクリプトで Ollama の OpenAI 互換 API を呼ぶ | 実 Ollama で成功・未起動・未取得を実測（I-8） |
| `server-only` | 0.0.1 | dependencies | 呼び出し関数のモジュールをサーバー専用にする印 | 既定の条件で例外、`react-server` で空（I-9） |
| `zod` | 4.6.7 | dependencies | `ai` と `@ai-sdk/openai-compatible` の必須の peer。段 2 のコードは import しない | `pnpm install` で peer を満たす（I-12） |
| `@vitest/coverage-v8` | 5.1.2 | 宣言のみ（`package.json` に入れない） | 分岐カバレッジの計測（NFR）。使い捨ての worktree でだけ入れる | npm の公開日時（I-1）。計測は実装時（R-6） |

## Architecture decisions

### ADR-1: Ollama は `@ai-sdk/openai-compatible` で、Ollama の OpenAI 互換 API を呼ぶ

- **Context**: 公式の Ollama 専用プロバイダはなく（I-2）、AI SDK の文書はコミュニティの 2 パッケージと
  OpenAI Compatible Provider を挙げる。入門ラボは供給網の防御を強く保つ（憲章 原則 8）。段 6 で `AI_PROVIDER` による
  切り替えを作る。
- **Decision**: `@ai-sdk/openai-compatible` の `createOpenAICompatible({ name: "ollama", baseURL })` を使い、
  `baseURL` は Ollama の公式文書が示すローカルの OpenAI 互換 API（`http://localhost:11434/v1`）を hello スクリプトの
  定数として書く。環境変数は読まない（spec の前提）。
- **Alternatives**:
  - `ollama-ai-provider-v2`: 既定の接続先を持ち、Ollama 独自の機能（モデルの詳細な実行設定）を使える。しかし個人の保守で、
    `ai` とは別のリリース列。段 2 は Ollama 独自の機能を使わない。
  - `ai-sdk-ollama`: Ollama 公式クライアントの上に作られるが、`ollama`・`jsonrepair` などの推移的依存が増える。
- **Consequences**:
  - `ai` と同じ保守者・同じリリース列・同じ exact の内部依存で、閉包に加わるのは 1 パッケージ（I-12）。Dependabot の
    npm グループでも `ai` と一緒に上がる。
  - 既定の接続先を持たないため、base URL の定数を 1 つ書く。spec の前提「Ollama プロバイダの既定のローカルアドレス」は、
    この定数（Ollama 公式の既定値）として満たす（spec Clarifications 2026-11-27 の plan 時の追記）。
  - モデル未取得は OpenAI 形式の 404、未起動は `statusCode` のない `APICallError` として判別できる（I-8）。
  - 段 6 の `.env.example` の `OLLAMA_BASE_URL`（OpenAI 互換の接続先）と同じ前提になる。

### ADR-2: ラボの設定項目 `system` は、AI SDK の `instructions` に渡す

- **Context**: spec は設定項目を `system` と名付ける（Clarifications）。`ai@7.0.183` の `system` は非推奨で、
  `instructions` が正（I-3、spec 001 research.md R-6 の注意 3）。
- **Decision**: 呼び出し設定の名前は spec どおり `system`（役割の名前と一致して学びやすい）とし、`generateText` には
  `instructions: config.system` として渡す。非推奨の `system:` は使わない。
- **Alternatives**: 設定項目も `instructions` にする（spec の決定と glossary を変えることになる）。`system:` を渡す
  （非推奨 API を教えることになり、憲章 原則 5 の根拠「非推奨 API を使うと卒業先と異なる書き方を教える」に反する）。
- **Consequences**: 解説の「読む」節で、ラボの `system` が SDK の `instructions` に当たり、モデルへは system 役割の
  メッセージとして届く（I-3）ことを 1 か所で説明する。

### ADR-3: 呼び出し関数は、モデルのオブジェクトだけを受け取る（文字列のモデル ID を型で拒否する）

- **Context**: AI SDK の `LanguageModel` 型は文字列（`GlobalProviderModelId`、既定は AI Gateway のモデル ID）を含む。
  文字列を渡すと SDK が内部で Gateway のモデルを作り、ネットワークと Gateway の鍵が要る。1.1 は「関数の内部で
  プロバイダやモデルを生成しない」と定める。`ai` は `LanguageModelV4` を export しない。
- **Decision**: 引数の型を `Exclude<LanguageModel, string>`（ラボの型名 `ModelObject`）にする。
- **Alternatives**: `LanguageModel` をそのまま受ける（文字列で Gateway が使われうる）。`@ai-sdk/provider` から
  `LanguageModelV4` を import する（推移的依存を直接の依存に加える必要があり、宣言が 1 つ増える）。
- **Consequences**: 文字列を渡す呼び出しは型検査で失敗する（`@ts-expect-error` で検査、I-10）。`MockLanguageModelV4` と
  `createOpenAICompatible` が返すモデルはそのまま渡せる。

### ADR-4: 設定値は呼び出し関数が自前で検証し、ラボの例外 `CallConfigError` で拒否する

- **Context**: AI SDK は空の prompt や `NaN` の温度を拒否しない（I-6）。3.5 は不正な項目の名前を判別でき、本文を
  含まない例外を求める。憲章 原則 7 の Zod 検証はシステム境界（HTTP、環境変数、ツール入力、構造化出力）が対象で、
  関数の引数は型で守られている。
- **Decision**: `generateText` を呼ぶ前に、`prompt`（空白以外の文字を 1 つ以上）→ `temperature`（`Number.isFinite`）→
  `maxOutputTokens`（`Number.isInteger` かつ 1 以上）→ `maxRetries`（`Number.isInteger` かつ 0 以上）の順に調べ、最初に
  不正だった項目を `field` に持つ `CallConfigError` で reject する。メッセージは項目名と条件だけで、値も本文も含めない。
- **Alternatives**: Zod のスキーマ（段 2 のコードが Zod を import することになり、境界でない場所に Zod を置く例を
  教える）。AI SDK の `InvalidArgumentError` に任せる（3.1・3.2 を満たさない。I-6）。
- **Consequences**: 検証の規則は 4 行の条件で読める。`system` は検証しない（spec の 3 章に規則がない。空文字列は SDK に
  そのまま渡り、空の system メッセージになる。I-6）。

### ADR-5: AI SDK の失敗は `CallFailedError` に正規化し、メッセージはラボが組み立てる

- **Context**: AI SDK は状況によって元の例外か `RetryError` を投げる（I-5）。4.6 は「使い切った」か「再試行しない
  例外だった」かの判別と最後の失敗原因を、4.7 は prompt / system の本文を含まないメッセージを求める。`RetryError.message`
  は最後の例外のメッセージを埋め込み、`APICallError` は送った本文を `requestBodyValues` に持つ（I-5）。
- **Decision**: `generateText` の例外を次の規則で `CallFailedError`（`reason`、`attempts`、`cause`）に包み直す。
  - `RetryError` で `reason === "maxRetriesExceeded"` → `reason: "retries-exhausted"`。それ以外の `RetryError` →
    `"not-retryable"`。`attempts` は `errors.length`、`cause` は `lastError`。
  - 包まれていない例外 → `attempts: 1`、`cause` はその例外。`maxRetries === 0` で SDK が再試行対象と見る例外なら
    `"retries-exhausted"`、それ以外は `"not-retryable"`。再試行対象の判定は SDK の `shouldRetry` と同じ形にする:
    `APICallError` で `isRetryable === true`、加えて `ai` が `GatewayError` を export していれば `GatewayError` で
    `isRetryable === true`。export されていなければ `APICallError` だけで判定し、段 2 は Gateway のモデルを渡さない
    （ADR-3）ので対象外と記す。どちらかは install 直後の再確認（R-1）で決める。
  - メッセージは `reason` と `attempts` だけから作り、`cause` のメッセージを写さない。
- **Alternatives**: SDK の例外をそのまま投げる（4.6 の判別が状況ごとに 3 通りになり、4.7 を満たさない）。
  ラボが試行回数を自分で数える（モデルを包む層が要り、「再試行は SDK に任せる」に反する）。
- **Consequences**: 最後の 1 回が再試行しない例外でも、それが許された最後の試行なら SDK に合わせて
  `"retries-exhausted"` になる（I-5 の r, r, f）。`cause` は SDK の例外のままなので、送った本文を含みうる。
  hello スクリプトは `cause` を丸ごと出力しない（5.7、C3）。
  - `RetryError` の `reason` の値（`maxRetriesExceeded` / `errorNotRetryable`）は SDK のソース由来で、公式文書
    （`ai-retry-error.mdx`）は `reason` という項目があることしか書かない。公開の約束ではないため、版を上げると変わりうる。
    4.2・4.3 のテストは `reason` の分類の変化で失敗するので、版の更新時に気づける。失敗したら SDK の変更を調べて
    ADR-5 を直し、テストを緩めない。

### ADR-6: 再試行のテストは、モックの例外に `retry-after-ms: "0"` を付けて待ち時間をなくす

- **Context**: 既定の間隔では `maxRetries: 2` で 6 秒待つ（I-5）。NFR は実時間の待ちに依存せず 1 件 1 秒以内を求める。
- **Decision**: テストの再試行可能な例外（`APICallError`、`statusCode` 429 / 503、`isRetryable: true`）に応答ヘッダー
  `retry-after-ms: "0"` を付ける。SDK は 0〜60 秒のこの値を待ち時間に使う（I-5）。再試行のテストを含む `describe` に
  1 件 1000 ms のタイムアウトを付け、SDK がこのヘッダーを読まなくなった場合は時間切れで失敗させる。
- **Alternatives**: Vitest の偽のタイマー（`vi.useFakeTimers` と `runAllTimersAsync`）。待ちは消せるが、テストごとに
  時計の差し替えと reject の扱い（先に `expect` を付けてからタイマーを進める）が要り、入門のテストが読みにくくなる。
- **Consequences**: テストの例外は、実際のレート制限の応答（`retry-after-ms`）と同じ形になる。SDK の挙動が変われば
  時間切れで気づける（版の更新時）。

### ADR-7: hello スクリプトは Node の型の除去で実行し、`tsc` の設定で同じ制約を守らせる

- **Context**: spec の前提は `node --conditions=react-server scripts/hello.ts`。Node は `.ts` 拡張子の import と消せる構文を
  要し、型だけの import には `type` が要る（I-10）。hello は `verify` で実行されない（5.9）。依存を足さない（`tsx` は入れない）。
- **Decision**: `tsconfig.json` に `allowImportingTsExtensions: true`、`verbatimModuleSyntax: true`、
  `erasableSyntaxOnly: true` を加え、`include` に `scripts/**/*.ts` を加える。hello スクリプトは
  `../src/lib/ai/basics.ts` と `../src/lib/ai/model-allowlist.ts` を拡張子つきで import する。
- **Alternatives**: `tsx` などの実行器を入れる（依存が増える）。hello を `.mjs` にする（型検査されず、学習者が読む
  コードから型が消える）。
- **Consequences**: Node で動かない書き方は `mise run typecheck`（verify と pre-commit）で止まる。既存のコードは新しい設定で
  通る（I-10）。Next.js の型生成と `next dev` が `tsconfig.json` を書き換えないことは、CI の「作業ツリー不変」ステップと
  実装時の `git status` で確かめる（R-4）。

### ADR-8: `server-only` は、Vitest では空のモジュールに置き換え、1.9 は Node の読み込み条件で確かめる

- **Context**: spec の前提で、Vitest は alias、Next.js は何もしない、hello は `react-server` 条件と決まっている。1.9 は
  `mise run verify` の中で検査する（6.4）。
- **Decision**: `vitest.config.ts` の `resolve.alias` で `server-only` だけを `tests/unit/setup/server-only-stub.ts`（空の
  モジュール）に置き換える。1.9 の検査は、Node を子プロセスで起動して `src/lib/ai/basics.ts` を import させ、
  (a) 既定の条件では `server-only` の例外で失敗し、(b) `--conditions=react-server` では成功することを確かめる。
- **Alternatives**: ソースの先頭に `import "server-only"` があることを文字列で調べる（読み込みの実際を見ないため、
  `import` の位置や再 export の誤りを見逃しうる）。`react-server` 条件を Vitest 全体に有効にする（段 3 以降で React の
  解決先が変わる。spec の前提で不採用）。
- **Consequences**: (b) は hello と同じ実行経路（Node の型の除去 + `react-server`）で `basics.ts` が読めることも示し、
  ADR-7 の静的な検査を実行で裏づける。子プロセスは `node` だけを使い、ネットワークに触れない。

### ADR-9: `ai` が同梱する agent skill は承認しない

- **Context**: pnpm 12 は `ai` の SKILL.md を承認待ちとして表示する（I-11）。依存が同梱する指示文は第三者の入力で、
  リポジトリのエージェントへの指示は `AGENTS.md` に置く。同梱文書は skill なしで読める。
- **Decision**: `pnpm-workspace.yaml` に `permissions: { ai: { skills: false } }` を理由のコメントつきで書く
  （`pnpm approve '!ai'` と同じ結果）。`AGENTS.md` には、AI SDK の API は `node_modules/ai/docs/` の同梱文書で確かめる、と
  1 行足す。
- **Alternatives**: 承認する（依存の更新のたびに、エージェントへの指示が第三者の判断で変わる）。放置する（install の
  たびに表示が出て、判断が記録に残らない）。
- **Consequences**: 判断が設定に残り、`repo-policy.test.ts` で弱まらないよう検査する。

### ADR-10: 分岐カバレッジは使い捨ての worktree で計測し、計測用の依存は `package.json` に入れない

- **Context**: NFR は段 2 の実装後に呼び出し関数のモジュールの分岐カバレッジを測って記録することを求め、しきい値は
  合否に使わない（TODO(BRANCH_COVERAGE)）。Vitest の計測には `@vitest/coverage-v8` が要る（I-1）。
- **Decision**: `git worktree add` で作った使い捨ての作業ツリーに `@vitest/coverage-v8`（`vitest` と同じ版）を入れ、
  `tests/unit/llm-call-basics*.test.ts` を `--coverage.include=src/lib/ai/basics.ts` で実行して R-6 に記録する。
  作業ツリーは計測後に消し、コミットしない。plan の C1 にこの依存を「計測専用・`package.json` に入れない」として宣言する
  （原則 10）。
- **Alternatives**: `devDependencies` に入れて `mise run coverage` を作る（ゲートに使わない依存と週次の更新が増える。
  しきい値を憲章で決めた時点で、そのための spec で入れる）。
- **Consequences**: 計測は再現手順（コマンド）つきで記録され、リポジトリの依存は増えない。

## Risks & open questions

- ⚠️ `ai` 7.0.x はほぼ毎日出る。実装時の版で I-3〜I-7 の前提（`instructions`、`RetryError` の reason、`retry-after-ms`、
  モックの usage の形）が変わりうる — mitigation: 実装の最初に R-1 で版を確定し、合格判定テストの RED / GREEN で前提を
  確かめる。テストは版番号を見ない。
- ⚠️ `tsconfig.json` の 3 設定と `include` の追加が、Next.js の `next typegen` / `next dev` に書き換えられる — mitigation:
  I-10 の分岐を確認済み。実装時に `mise run verify` 後の `git status --porcelain` を R-4 に記録する。CI は作業ツリーの
  変化で失敗する。
- ⚠️ 新しい依存に高い深刻度の advisory がある — mitigation: 実装時に `mise run security` を実行して R-1 に記録する。
- ⚠️ 1.9 の子プロセスの検査は `node_modules` の `server-only` の実装（例外を投げる `index.js`）に依存する — mitigation:
  (a) は例外のメッセージではなく「終了コード非 0 と `server-only` の名前」を見る。`server-only` は 2022 年から版が変わって
  いない（I-1）。
- ⚠️ 1 件 1000 ms のタイムアウトが、遅い CI の初回の呼び出しで足りない — mitigation: モックの呼び出しは数 ms（I-5）。
  タイムアウトは再試行のテストの `describe` だけに付け、import の時間は含まれない。失敗したら原因（実時間の待ちの
  混入か、環境の遅さか）を調べ、値を緩める前に根拠を R-n に残す。
- ⚠️ hello の「未起動」の判定（`statusCode` のない `APICallError`）は、DNS の失敗や途中切断も含む — mitigation: base URL は
  ローカルの固定値なので、実際に起こるのは接続拒否。案内文は「Ollama に接続できない」と書き、起動方法とモデル取得の
  両方を示す（5.4）。
- ❓ `maxRetries` を大きくしたときの待ち時間（2 s、4 s、8 s…）を解説の「改造する」でどう扱うか — to resolve in: 解説の
  執筆（tasks）。案: `maxRetries` を 0 にして未起動時の終了が速くなることを確かめる課題にする。

## 実装時の記録（/sdd-impl で追記）

- R-1 採用版と公開日時、`mise run security` の結果（8.3、8.5）。install 直後に、採用版の `node_modules/ai/docs/`・
  公開の `.d.ts`（`ai`、`ai/test`）・再試行の実装で I-3〜I-7 の主張を照合した対応表（主張 / 同梱文書 / 型定義 / probe）と、
  `GatewayError` が `ai` から export されるか（ADR-5 の判定の形を決める）
- R-2 合格判定テストの RED の記録（6.6）
- R-3 非空虚の確認: 壊した箇所と失敗のメッセージ（6.7）
- R-4 `mise run verify` の結果と、実行後の `git status --porcelain`（ADR-7）。あわせて、tsconfig を変えたあとと最終検証の
  あとに `pnpm exec next build` を 1 回ずつ実行した結果と、その後の `git status --porcelain`（verify は `next build` を
  通らないため。gate には入れない）
- R-5 hello スクリプトの実測: 成功、未起動（開始から案内までの秒数。NFR 15 秒以内）、モデル未取得（5.1、5.4、5.5）
- R-6 分岐カバレッジの計測結果と再現手順（NFR、ADR-10）
- R-7 install 後の `pnpm permissions list` と、`Agent skills awaiting approval` が出ないこと（ADR-9）

---

# 実装時の記録（詳細）

確認日: 2026-11-27（UTC 10:37 前後）。

## R-1 採用版、照合、`mise run security`

### 採用版（8.3）

`pnpm view <pkg> time --json` で確かめた。基準は 2026-11-27T10:37Z、24h 前は 2026-11-26T10:37Z。
`ai` の dist-tag `latest` は調査時（I-1）と同じ 7.0.183。24h を満たす最新の安定版でもある
（7.0.183 は 2026-11-26T04:37Z。これより新しい 7.0.x は出ていない）。

| Package | 採用版 | 公開（UTC） | 24h |
|---------|--------|-------------|-----|
| `ai` | 7.0.183 | 2026-11-26T04:37:00Z | 満たす |
| `@ai-sdk/openai-compatible` | 3.0.96 | 2026-11-26T04:34:16Z | 満たす |
| `server-only` | 0.0.1 | 2022-09-03T01:07:26Z | 満たす |
| `zod` | 4.6.7 | 2026-10-12T16:29:37Z | 満たす |

`pnpm install` は `minimumReleaseAge: 1440`（除外なし）のもとで成功（`Packages: +12`）。
`pnpm install --frozen-lockfile` も成功し、`Agent skills awaiting approval` と `Ignored build scripts` は出ない。

### install 直後の照合（タスク 1.3）

probe のコードはリポジトリの外（`node --input-type=module -e` の 1 回の実行）で、コミットしていない。

| 主張（research.md） | 同梱文書・ソース | 型定義 | probe（実行） | 結果 |
|---------------------|------------------|--------|---------------|------|
| I-3 `instructions` が正で `system` は非推奨 | — | `dist/index-*.d.ts` 1072 行 `instructions?: Instructions`、1076 行 `@deprecated Use \`instructions\` instead.` | `doGenerateCalls[0].prompt` = `[{"role":"system","content":"SYS"},{"role":"user","content":[{"type":"text","text":"USER"}]}]` | 一致 |
| I-3 `temperature` / `maxOutputTokens` がそのまま届く | — | — | `0.3` / `42` | 一致 |
| I-3 ツールなしで `tools` は `undefined`、`doStream` は呼ばれない | — | — | `tools undefined`、`doStreamCalls.length` = 0 | 一致 |
| I-3 `maxRetries` の既定は 2 | `docs/03-ai-sdk-core/25-settings.mdx` 117 行「Default: `2`.」 | — | `src/util/prepare-retries.ts` 15 行 `defaultMaxRetries = 2`。`maxRetries: 1.5` は `AI_InvalidArgumentError` | 一致 |
| I-4 usage は `number \| undefined` | — | `index-*.d.ts` 352・373 行 | 出力側を `total: undefined` にすると `outputTokens` は `undefined`（0 にならない） | 一致 |
| I-5 `RetryError` の `reason` は `maxRetriesExceeded` / `errorNotRetryable` | `src/util/retry-error.ts` 8〜9 行 | — | 下の表 | 一致 |
| I-5 `retry-after-ms` を待ち時間に使う | `src/util/retry-with-exponential-backoff.ts` 28 行 | — | 下の表（再試行 3 回が数 ms） | 一致 |
| I-5 `APICallError.isRetryable` で再試行を判定 | 同上 | — | 下の表 | 一致 |
| I-7 `MockLanguageModelV4`、`doGenerateCalls`、`doStreamCalls` | — | `dist/test/index.d.ts` 132〜140 行 | 実行して利用 | 一致 |
| ADR-5 `GatewayError` が `ai` から export されるか | — | `grep GatewayError dist/index.d.ts` は 0 件（`@ai-sdk/gateway` から import するだけ） | `typeof ai.GatewayError` = `undefined` | **export されない**。判定は `APICallError` だけで行う（ADR-5 の「export されていなければ」の分岐） |

失敗の並びごとの実測（`r` = `isRetryable: true`、`f` = `false`、どちらも `retry-after-ms: "0"`）:

| 並び | `maxRetries` | 結果 | 試行 | I-5 の表 |
|------|------|------|------|----------|
| r, r, 成功 | 2 | 成功 | 3 | 一致 |
| r, r, r | 2 | `RetryError` / `maxRetriesExceeded`、`errors` 3 件、`lastError` は `APICallError` | 3 | 一致 |
| r | 0 | `APICallError`（包まれない） | 1 | 一致 |
| f | 2 | `APICallError`（包まれない） | 1 | 一致 |
| r, f | 2 | `RetryError` / `errorNotRetryable`、`errors` 2 件 | 2 | 一致 |
| r, r, f | 2 | `RetryError` / `maxRetriesExceeded`、`errors` 3 件 | 3 | 一致 |

全行が「一致」。plan.md を直す必要はない。ただし `GatewayError` は export されないため、タスク 4.2 の
「包まれていない例外で `maxRetries` が 0」の判定は `APICallError` で `isRetryable === true` だけにする。

### `mise run security`（8.3、タスク 1.4）

- コマンド: `mise run security`。終了コード 0。
- `security:osv`: `Scanned … pnpm-lock.yaml file and found 195 packages` / `No issues found`。
- `security:audit`: `No known vulnerabilities found`。
- 段 2 の依存で新しく出た advisory はない。

## R-7 依存の権限（ADR-9）

`pnpm permissions list`（2026-11-27）:

```
Denied:
  ai     skills
  sharp  build
```

`pnpm install --frozen-lockfile` の出力に `Agent skills awaiting approval` も `Ignored build scripts` も出ない。
`pnpm-workspace.yaml` の `permissions: { ai: { skills: false } }` は `repo-policy.test.ts` が検査する。

## R-2 合格判定テストの RED と GREEN（6.6）

### RED（2026-11-27、`basics.ts` と `hello` タスクの実装前）

| ファイル | コマンド | 終了コード | 失敗の要約（実装がないために落ちている根拠） |
|----------|----------|-----------|--------------------------------------------------|
| `tests/unit/repo-policy.test.ts`（追加した 1 件、タスク 1.1） | `mise run test`（`pnpm-workspace.yaml` に `permissions` を書く前） | 1 | `AssertionError: permissions must have an \`ai\` entry: expected -1 to be greater than or equal to 0`。ほかの 235 件は通過。`permissions` を足したあと 48 件すべて GREEN |
| `tests/unit/llm-call-basics.test.ts`（タスク 3.1〜3.4） | `pnpm exec vitest run tests/unit/llm-call-basics.test.ts` | 1 | `Error: Cannot find package '@/lib/ai/basics' imported from …/llm-call-basics.test.ts`（スイートが 0 件で失敗。`basics.ts` がない） |
| `tests/unit/llm-call-basics-contract.test.ts`（タスク 3.5） | `pnpm exec vitest run tests/unit/llm-call-basics-contract.test.ts` | 1 | 同じ `Cannot find package '@/lib/ai/basics'`。子プロセスの検査は `basics.ts` がないため import できない |
| `tests/unit/hello-task.test.ts`（タスク 3.6） | `pnpm exec vitest run tests/unit/hello-task.test.ts` | 1 | 7 件中 4 件が失敗: `mise task "hello" does not exist`（5.8 の 2 件）、`scripts/hello.ts` がない（5.7、5.3 の 2 件）。残る 3 件（5.9。`hello` に届かないことの否定の検査）は、タスクがまだないため通る |
| 型検査 | `mise run typecheck` | 1 | `TS2307: Cannot find module '@/lib/ai/basics'`。`@ts-expect-error` の 5 行が `TS2578: Unused '@ts-expect-error' directive`（`callModel` が型 `any` になるため。`basics.ts` ができると必要になる） |

5.9 の 3 件は「届かないこと」を否定で調べるため、実装前から通る。非空虚の確認は R-3（`verify` から `hello` を
参照させると落ちること）で行う。

### GREEN（2026-11-27、タスク 4.3）

| ファイル | コマンド | 結果 |
|----------|----------|------|
| `tests/unit/llm-call-basics.test.ts` | `pnpm exec vitest run tests/unit/llm-call-basics.test.ts` | 終了コード 0。71 件 GREEN |
| `tests/unit/llm-call-basics-contract.test.ts` | `pnpm exec vitest run tests/unit/llm-call-basics-contract.test.ts` | 終了コード 0。6 件 GREEN（子プロセスの既定の条件は非 0 で `server-only` を含む出力、`--conditions=react-server` は 0） |
| `tests/unit/repo-policy.test.ts` | `pnpm exec vitest run tests/unit/repo-policy.test.ts` | 終了コード 0。48 件 GREEN |
| `tests/unit/hello-task.test.ts` | `mise run test` | **タスク 5 まで RED のまま**（`hello` タスクと `scripts/hello.ts` がないため 4 件失敗）。残る 3 件は通る |
| 型検査 | `mise run typecheck` | 終了コード 0（`@ts-expect-error` の 5 行がすべて必要） |
| 全体 | `mise run test` | 14 ファイル中 13 が GREEN、失敗は `hello-task.test.ts` の 4 件だけ。316 件 GREEN |

RED のときと比べ、`llm-call-basics.test.ts` は 0 件（スイートの失敗）から 71 件が実行された。

実装中の 1 件の修正: 最初の `success()` は `input = 3` のような既定引数を持ち、`undefined` を明示的に渡しても
既定値に置き換わって 2.3 の 3 件が落ちた（実装の誤りでなくテストの補助関数の誤り）。引数をオブジェクト
`{ input, output }` に変えて、`undefined` が保たれるようにした。

## R-5 hello スクリプトの実測（5.3、ユーザーの環境で実施）

確認日: 2026-11-27。Ollama の操作はユーザーが行い、貼られた出力を記録する。秒数は `date +%s` の差で測った（`time` の出力は貼られなかった）。

| 状況 | 実行 | 標準出力 | 標準エラー | 終了コード | 秒数 | 判定 |
|------|------|----------|------------|-----------|------|------|
| (a) Ollama 起動、`llama3.2:3b` 取得済み | `mise run hello; echo "exit=$?"` | `model: llama3.2:3b` / `reply: Hello.` / `inputTokens: 38` / `outputTokens: 3` | なし | 0 | 未測定（5.3 の完了条件は (b) の秒数だけを求める） | 5.1 を満たす |
| (b) Ollama 停止 | `start=$(date +%s); mise run hello; echo "exit=$?"; echo "elapsed=$(( $(date +%s) - start ))s"` | なし | `Could not connect to Ollama.` / 起動方法（open the Ollama app, or run `ollama serve`）/ `ollama pull llama3.2:3b` | 1 | **6 s** | 5.4 を満たす。NFR（15 秒以内）を満たす |
| (c) Ollama 起動、モデル未取得 | 同上 | なし | `Ollama is running, but the model is not pulled yet. Pull it:` / `ollama pull llama3.2:3b` | 1 | 1 s | 5.5 を満たす |
| (d) prompt / system の本文を出さない | 上の全出力 | 本文を含まない | 本文を含まない | — | — | 満たす（貼られた 3 状況の出力に限る） |
| (e) 既定の条件で直接実行 | `node scripts/hello.ts` | なし | `server-only/index.js:1` の `Error: This module cannot be imported from a Client Component module…` | 未確認 | — | `server-only` の例外（I-9）。解説の根拠 |

メモ:
- (a) の入力トークン数 38 は、`system` と `prompt` を含む値として妥当（I-8 の実測 34 と同程度）。
- (c) の確認で `llama3.2:3b` は取り除かれた状態（I-8 の判定ロジックは `statusCode === 404` で分岐するため、(c) はモデル未取得の経路を通った）。
- (b) の 6 秒は I-8 の実測（約 6 秒）と一致し、NFR の 15 秒以内を満たす。`maxRetries` の既定値 2 は変えない。
- (e) の終了コードは未取得（任意。`server-only` の例外は出力で確認済み）。
- 5.3 完了（2026-11-27）。モデルを戻すには `ollama pull llama3.2:3b`（後続のタスクでは不要）。
