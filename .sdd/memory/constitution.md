<!--
SYNC IMPACT REPORT
Version Change: 1.0.0 → 1.1.0（MINOR。spec 001 Clarifications 2026-11-22 / 2026-11-23、要件 13.7）
  経緯: 1.0.0（2026-11-22、初版制定）
Modified Principles:
  - 原則 3: verify（= gate）をオフラインで決定論的な検査に限り、ネットワークが必要な検査を
    `mise run security` に分ける。pre-push と CI の必須ジョブが両方を実行し、検査は減らない
  - 原則 8: gitleaks の全履歴スキャンの置き場を verify（HEAD から到達できる履歴）に合わせて明確化
Modified Sections:
  - Additional Constraints「Node のレーン」: Node 27 alpha の分離検証は `mise.node27.toml` と CI の
    `verify-node27` で行い、`exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る、と明確化
Added Sections:
  - none
Removed Sections:
  - none
Templates Status:
  ✅ ~/.claude/sdd/templates/specs/plan.md, spec.md, tasks.md - 確認のみ、変更不要
  ✅ .sdd/steering/tech.md, structure.md - 同じ変更で verify / security の分離と実際の構成に合わせた
  ✅ AGENTS.md - コマンド表（verify と security の分離）と "Current state" を spec 001 タスク 11.3 で同期した
  ✅ specs/000-development-plan/plan.md - §4・§7 M1・§8.5・Constitution Compliance に改訂注記を
     spec 001 タスク 11.3 で入れた
  ✅ README.md - コマンド一覧（verify と security）を spec 001 タスク 11.1 で同期した
Deferred Items:
  - TODO(BRANCH_COVERAGE): 分岐カバレッジのしきい値（spec 001〜002 の実測ベースラインで決定）
  - TODO(E2E_BUDGET): pre-push の E2E smoke の時間上限（plan §4 の目安 60 秒を、spec 003 の実測で確定）
-->

# genai-lab-ts Constitution

本憲章は、`specs/000-development-plan/plan.md`（全体計画、決定事項 D1〜D6）のうち、**段（spec 001〜008）
をまたいで譲れない判断基準**を統治規範として昇格したものである。各原則には**検証方法**を併記する。
検証方法を持たない原則は適合を判定できないため、本憲章には置かない。

本リポジトリは、生成 AI アプリ開発を 1 段ずつ積み上げる入門ハンズオン・ラボである。したがって
「動くこと」に加えて、「学習者が API キーなしで同じ手順・同じ結果を再現できること」と「原則を破ると
テストかゲートが落ちること」を品質の定義に含める。運用ルールは卒業先の `from-genai-to-agentic-ai` の
憲章に揃え、本文は複製せず相互リンクで済ませる。

## Core Principles

### 1. 入門ラボの範囲を守る

本リポジトリは、単一の Next.js アプリで Level 1（生成 AI）〜 Level 2 入口（ツール呼び出し）までを扱う
入門ラボであり続けることが MUST である（D1）。

- RAG、ワークフローパターン、マルチエージェント、MCP、長時間実行ハーネス、本格的な Agent Evals を
  実装してはならない（MUST NOT）。これらは `from-genai-to-agentic-ai` の該当モジュールへリンクする。
- 兄弟リポジトリ（`from-genai-to-agentic-ai`、`next-agentic-stack`、`sdd-tdd-kit`）の本文やコードを
  複製してはならない（MUST NOT）。参照はリンクで行う。
- 段の追加・削除・範囲変更は、全体計画（spec 000）の改訂を先に行う。

**根拠**: 範囲が膨らむと卒業先の 19 モジュールと重複し、入門ラボとしての「小さく読める」価値を失う。

**検証**: `/sdd-plan` と `/sdd-analyze` で、各段の要件が上記の扱わない領域に入っていないことを確認する。

### 2. 1 段は spec・解説・実装・合格テストで完成する

各段は、`specs/<NNN>-<slug>/`、解説 `docs/stages/<n>-<slug>.md`、対応するソース、合格判定テストの
4 点を揃えて完成とすることが MUST である。

- 段の番号と spec 番号は一致する（段 1 = spec 001）。計画外の作業は 009 以降を順に使う。
- 解説は「読む → 動かす → 改造する → テストで合格を確かめる」の順で書き、合格条件ごとに対応する
  テストのパスを示す。
- 1 段 = 1 PR とする。大きい段は spec PR と実装 PR に分けてよい。

**根拠**: テストに結びつかない解説は、実装と乖離しても誰も気づかない。合格条件をテストで判定できる
ことが、学習者にとっての到達基準になる。

**検証**: `/sdd-validate-impl` と `/sdd-ship` で 4 点の実在と、解説が参照するテストパスの実在を確認する。

### 3. 品質ゲートは 1 つで、決定論的で、空振りしない

`mise run verify` は、オフラインで決定論的な検査（lint と format チェック、typecheck、`check:model-ids`、
gitleaks による HEAD から到達できる全履歴のシークレットスキャン、ユニットテスト、E2E smoke）を 1 コマンドで
実行する唯一の検証入口であることが MUST である。`mise run gate` は `verify` の別名として定義し、同じ処理を
実行する。ネットワークが必要な検査（`osv-scanner`、`pnpm audit --audit-level=high`）は `mise run security`
に分け、verify に含めてはならない（MUST NOT）。

- lefthook のフックと CI は、verify と security と同じ mise タスク（またはその構成要素）を実行する。
  pre-push と CI の必須ジョブ（`verify`）は verify の検査と security の**両方**を実行し、分離によって検査を
  減らしてはならない（MUST NOT）。フックは `--no-verify` で回避できるため、CI の verify ジョブを省略しては
  ならない（MUST NOT）。
- security はレジストリや脆弱性データベースに到達できないときに失敗する。到達できないことを合格として
  扱ってはならない（MUST NOT）。
- verify は API キーとネットワークを必要としない。未モックのネットワークアクセス（Vitest の
  `fetch`、Playwright の未定義ルート）はテストを失敗させる。
- 同一コミットでは常に同じ合否を返す。不安定なテストはリトライやスキップで隠さず、原因を直す。
- 実行したテストが 0 件の場合は失敗させる（Vitest の `passWithNoTests` を有効にしない。Playwright の
  `--grep @smoke` が 0 件なら失敗とする）。
- テストは**非空虚**でなければならない。対象ロジックを壊した変更で落ちることを確認していないテストは、
  合格条件の根拠として数えない。

**根拠**: 「API キーなしで全テストが決定論的に通る」ことは本ラボの前提である。空振りの緑は、壊れた
教材を合格させる。

**検証**: CI の verify ジョブ（必須。`mise run verify` と `mise run security` を実行）、verify の構成を
検査するテスト（`tests/unit/verify-offline-contract.test.ts`）、`vitest.config.ts` /
`playwright.config.ts` の未モック通信の遮断、`/sdd-impl` の RED 確認記録。

### 4. テストを先に書く

実装コードは、それを要求する失敗するテストより先に書いてはならない（MUST NOT）。
RED（失敗を確認）→ GREEN（最小実装）→ REFACTOR の順序を守る。既に動くコードに合わせて後から
テストを書くことを禁ずる。不具合修正では、修正前に失敗する再現テストを先に追加する。

テストが予期せず落ちたときは、スキップ・リトライ・期待値の緩和ではなく、**停止して根本原因を特定
する**ことが MUST である。

**検証**: `tdd-enforcement` skill の適用、コミット履歴でテストが実装に先行しているかのレビュー。

### 5. モデルは注入し、モデル ID は allowlist だけに書く

- LLM を呼ぶ関数は、モデルを引数で受け取ることが MUST である。テストでは `ai/test` のモック
  モデル（`MockLanguageModelV4` 等）に差し替え、実 LLM を呼んではならない（MUST NOT）。
- モデル ID は `src/lib/ai/model-allowlist.ts` を唯一の定義とし、他のコード・設定・文書に直書きして
  はならない（MUST NOT、テスト fixture を除く）。環境変数（`AI_MODEL`、`AI_PROVIDER`）は allowlist 内
  の値だけを受け付け、不正値は起動時に Zod で拒否する。
- 構造化出力は `Output.object({ schema })` を使う。`generateObject` / `streamObject` を使っては
  ならない（MUST NOT）。

**根拠**: モデルの注入はテストの決定論性を、allowlist は ID の散在と存在しないモデルの指定を防ぐ。
非推奨 API を使うと、卒業先と異なる書き方を教えることになる。

**検証**: pre-commit と verify の `check:model-ids`、`generateObject` / `streamObject` のリポジトリ走査
テスト（段 4 の合格条件）。

### 6. エージェントは必ず止まり、危険な操作は承認を待つ

- エージェントの生成は `createGuardedAgent`（`src/lib/ai/agent.ts`）に集約し、それ以外の
  `new ToolLoopAgent` を置いてはならない（MUST NOT）。
- すべてのエージェントは、最大ステップ数、累積トークン使用量、実行時間の **3 種の停止条件**を持つ
  ことが MUST である。停止理由は閉じた語彙（`completed`、`step-limit`、`token-budget`、`timeout`、
  `aborted`、`error`）の 1 つとして結果に含める。語彙の変更は本憲章の改正を要する。
- 書き込み・破壊的なツールは `toolApproval` で承認待ちにする。承認要否はサーバー側のコードで決め、
  クライアントが送る値で決めてはならない（MUST NOT）。
- ツール結果と外部入力はデータとして扱い、指示として解釈・実行しない。`eval` / `new Function` を
  使ってはならない（MUST NOT）。

**根拠**: 止まらないエージェントと読まれずに通る承認は、入門段階で最初に身につけるべき安全策の
欠如である。語彙を卒業先と揃えることで、学習者はそのまま次へ進める。

**検証**: 停止理由ごとのユニットテストと破壊的ツールの承認待ちテスト（段 5 の合格条件）、
`new ToolLoopAgent` と `eval` / `new Function` のリポジトリ走査テスト。

### 7. 型と境界を固定する

- TypeScript は `strict` で型検査を通す。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを
  導入してはならない（MUST NOT）。
- システム境界（HTTP リクエスト、環境変数、ツール入力、LLM の構造化出力）を越えるデータは Zod で
  検証する。リクエストスキーマは未知のフィールドを拒否する厳格なスキーマとする。内部コードは検証済み
  の型を信頼し、防御的な再検証を重ねない。
- React Server Components を既定とし、`"use client"` はブラウザ状態や対話性が必要な末端に限る。
  サーバー専用モジュール（API キー参照、Zod スキーマを含む AI 呼び出し）は `server-only` とし、
  クライアントバンドルに含めてはならない（MUST NOT）。
- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
  件数・文字数・バイト数・レート・エージェント反復回数に明示的な上限を持つことが MUST である。

**根拠**: 境界での一度の検証と型の一貫性は、プレリリース版の破壊的変更を早期に検出し、秘密情報の
漏えい経路を塞ぐ。

**検証**: verify の typecheck と Biome、Zod 拒否のユニットテスト、上限超過が 400 / 413 / 429 になる
テスト（段 8 の合格条件）。

### 8. 秘密情報とサプライチェーンを守る

- API キーは環境変数からのみ読み込み、サーバー側でのみ参照する。`.env` / `.env*.local` をコミット
  せず、変数名だけの `.env.example` を提供する。
- 生のプロンプト、ツール引数の値、秘密情報をログに出力しない。シークレットスキャンは `--redact` で
  検出値を出力しない。
- gitleaks を pre-commit（ステージ済み変更）と verify（HEAD から到達できる全履歴。CI は `fetch-depth: 0`）
  で実行する。
  `gitleaks dir` をシークレットスキャンに使ってはならない（MUST NOT）。
- 依存は公開から 24 時間未満の版を採用しない（`minimumReleaseAge: 1440`）。プレリリースを含め
  `minimumReleaseAgeExclude` で除外してはならない（MUST NOT、D3）。
- 依存とツールは exact pin とし、`latest` / `canary` / `beta` などのタグや範囲指定を使ってはならない
  （MUST NOT）。install スクリプトは既定で遮断し、`allowBuilds` で許可するパッケージには許可理由を記す。
- CI は `--frozen-lockfile` で実行し、`osv-scanner` と `pnpm audit --audit-level=high` を通す。
  GitHub Actions の `uses:` はコミット SHA で固定し、各ジョブの `permissions:` を最小にする。

**根拠**: プレリリース版を積極的に使うラボほど、公開直後の不正版や秘密情報の混入に対する防御を
強く保つ必要がある。

**検証**: lefthook の pre-commit / pre-push、CI の verify と `security-daily`、`pnpm-workspace.yaml` と
ワークフロー定義のレビュー（`/sdd-analyze`）。

### 9. 事実は実測で確定し、版は現時点の採用版として扱う

- ライブラリの API、版、モデル ID、ツールの振る舞いに関する主張は、公式ドキュメント（Context7、
  インストール済みの `node_modules/next/dist/docs/` 等）の確認と、実インストール・実行による実測を
  根拠に記録することが MUST である。ZIP ガイドの記述や記憶を根拠にしてはならない（MUST NOT）。
- exact pin した版は「確認日つきの現時点の採用版」であり、据え置く対象ではない（plan §2.1）。
  版の正本は `mise.toml`、`package.json`、`pnpm-lock.yaml` とし、文書の版番号は参考値として扱う。
- 合格条件は「その時点の pin で verify と CI が緑」とする。テストや文書で特定の版番号をハードコード
  して検査してはならない（MUST NOT）。Node は `engines` の範囲と LTS 系列で判定する。
- 脆弱性検出時は 24h 経過済みの修正版へ上げる。上げられない場合は `overrides` で推移的依存だけを
  上げるか、退役条件付きの除外を記録する。版を上げる commit は `build(deps):` / `fix(security):` とし、
  理由（advisory ID、release note）を本文に書く。
- 誤りが判明した記述は、実測結果で置き換える。

**根拠**: AI SDK 7、TypeScript 7.1 beta、Next.js canary は記述と実物がずれやすい。版番号を合否に
使うと、正しいセキュリティ更新がテストを壊す。

**検証**: 各段の `research.md` の Evidence 欄、`/sdd-analyze`、版番号を検査するテストがないことの
レビュー。

### 10. 依存は plan に宣言してから追加する

`plan.md`（全体計画または各段の plan）に宣言されていない第三者依存の追加を禁ずる（MUST NOT）。
追加が必要なときは、標準ライブラリや既存依存で代替できない理由を添えて、先に plan を改正する。
CI ジョブ、外部サービス、インフラの追加も同じ規律に従う。API キーを要する機能は、キーがない場合の
モック経路またはスキップを必ず持つ。

**検証**: `/sdd-analyze` で `package.json` の依存と plan の宣言を突き合わせる。

### 11. 段階ゲートを飛ばさない

- 段は番号順（001 → 008）に実装する。後続段の spec を先に起草してよいが、実装は先行段の `/sdd-ship`
  完了後に始める。受け入れ基準の事後緩和を禁ずる。
- 各 spec の要件・設計・タスクの各フェーズは**人間が承認**する。一括の自動承認を禁ずる。
- 各実装フェーズの完了後に、作成者と異なるモデルファミリーで敵対的レビューを 1 回行う。レビューは
  報告のみとし、指摘の採否は証拠（テスト、コマンド、引用）で決める。
- レビュー記録は 1 ラウンド 1 ファイルとし、過去のラウンドを上書きしない。

**根拠**: 各段は前の段の成果の上に積み上がる。誤読された要件は下流のすべてが継承する。

**検証**: 各 `spec.json` の `approvals`、`.sdd/reviews/` の記録、PR の順序。

## Additional Constraints

**ツールチェーン**: ランタイム、パッケージマネージャ、フック・セキュリティツールは `mise.toml` で
固定する。コマンドは `mise run <task>` → `pnpm exec <cmd>` の順で実行し、素のツールを直接実行しない。
フックは mise 管理のツールを PATH から呼ぶため、mise を有効にした環境を前提とする（README に明記）。

**Node のレーン**: 既定は Node 26 LTS（`mise.toml`）で、必須 CI とする。Node 27 alpha は
`mise.node27.toml`（`MISE_ENV=node27`）と CI の `verify-node27` で分離検証し、CI では `continue-on-error`
とする。`exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る。
Node 27 でだけ必要な修正は Node 26 で壊れないことを確認してから main に入れる。検証結果は失敗を含めて
`docs/node27/YYYY-MM-DD-<topic>.md` に 1 検証 1 ファイルで残す。

**フックの回避**: フックが環境要因で失敗した場合は、ベースブランチで同じ失敗が再現するなど環境要因で
あることを先に示す。そのうえで回避（`--no-verify` 等）を 1 回だけ提案し、CI が担う検査と回避の事実を
PR 本文に記録する。

**lint / format**: Biome を単一の規約とし、`noUnusedVariables` / `noUnusedImports` / `noExplicitAny` は
`error` とする。

**UI**: shadcn/ui と Tailwind CSS v4 を標準とする（spec 002 以降で導入）。

**テストのモック**: ユニットテストは `ai/test` のモックモデル、E2E は Playwright `page.route` による
UI message stream（SSE）のモックを使う。pre-push の E2E は `@smoke` の 1〜2 本に限り、残りは CI で
実行する（D5）。時間上限は TODO(E2E_BUDGET)。

**品質目標**: 分岐カバレッジのしきい値は TODO(BRANCH_COVERAGE)。根拠のない数値を先に固定すると
原則 9 に反するため、実測ベースラインを取得してから決める。

**言語**: spec、解説、憲章、steering の散文は日本語。コード、識別子、コメント、パス、コミット
メッセージ、PR タイトル・本文は英語（D6）。ルートの `AGENTS.md` は英語で維持する。

## Governance

- **Authority**: 本憲章はアドホックな判断に優先する。ただし本憲章は spec を置き換えない。個別の要件と
  数値は spec が正本を持ち、本憲章は「どの判断基準が譲れないか」を定める。spec と本憲章が矛盾する
  場合は、spec を改訂するか本憲章を改正するかを明示的に決め、両者を同じ変更で更新する。
- **Amendment procedure**: 変更提案（理由、影響する原則と成果物、提案するバージョン増分）→ レビュー →
  バージョン昇格 → Sync Impact Report と改訂履歴への記録。原則の追加・削除・再定義は、影響する
  `plan.md` / `tasks.md` / `AGENTS.md` の同期確認を伴う。
- **Versioning policy**（セマンティック）:
  - MAJOR: 後方非互換な変更（原則の削除・再定義）。
  - MINOR: 原則・節の追加、または実質的な拡張。
  - PATCH: 明確化・表現修正。
- **Compliance review**: 設計とタスクを MUST 原則に対して検査する（`/sdd-plan` の Constitution
  Compliance 表、`/sdd-tasks`、`/sdd-analyze`）。違反は重大問題として扱う。加えて原則 11 に従い、
  各実装フェーズの完了後に敵対的レビューを行う。
- **Review cadence**: プレリリース版の stable 移行（TypeScript 7.1、Next.js 16.5 等）、Node の LTS
  節目、卒業先リポジトリの憲章改正時に本憲章を再確認する。
- **本憲章の正本**: `.sdd/memory/constitution.md`（git 追跡対象）。

## 改訂履歴

| 版 | 日付 | 種別 | 主な変更内容 |
| :--- | :--- | :--- | :--- |
| 1.0.0 | 2026-11-22 | 初版 | spec 000 の全体計画（§2.1 版方針、§4 ゲート、§5 共通ルール、D1〜D6）から原則 1〜11 を制定。Additional Constraints / Governance を新設 |
| 1.1.0 | 2026-11-25 | MINOR | 原則 3 を改訂: verify（= gate）はオフラインで決定論的な検査に限り、ネットワークが必要な `osv-scanner` / `pnpm audit` は `mise run security` に分ける。pre-push と CI 必須ジョブが両方を実行するため検査は減らない（spec 001 Clarifications 2026-11-22）。原則 8 の gitleaks の置き場を verify（HEAD から到達できる履歴）に合わせて明確化。Additional Constraints の Node のレーンを、分離検証は `mise.node27.toml` と CI の `verify-node27` で行い、ブランチ `exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る、と明確化（同 2026-11-23）。要件 13.7 |

### 未決事項（Deferred）

- **TODO(BRANCH_COVERAGE)**: 分岐カバレッジのしきい値。spec 002 のユニットテスト実装後に実測
  ベースラインを取り、決定して本憲章へ反映する（MINOR）。
- **TODO(E2E_BUDGET)**: pre-push の E2E smoke の時間上限。plan §4 の目安 60 秒を spec 003 の実測で
  確定する（PATCH）。

---

**Version**: 1.1.0 |
**Ratified**: 2026-11-22 |
**Last amended**: 2026-11-25
