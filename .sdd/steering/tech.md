# Technology

技術上の決定と規約。依存の一覧ではなく、将来の判断を導くものを残す。
MUST / MUST NOT の正本は [.sdd/memory/constitution.md](../memory/constitution.md)。ここでは
その原則を「どう書くか」の形で示す。

> 状態（2026-11-25 確認）: 段 1（spec 001）で足場を取り込み済み（`mise.toml`、`mise.node27.toml`、
> `package.json`、`lefthook.yml`、CI、`src/` / `tests/` の基盤）。AI SDK・Zod・shadcn/ui は後続の段で
> 導入する。下表の版は確認日つきの参考値で、正本は `mise.toml`、`package.json`、`pnpm-lock.yaml`。
> 版番号を合否に使わない。

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Runtime | Node.js 26 LTS（既定）/ Node 27 alpha（検証レーン） | `mise.toml` / `mise.node27.toml`（`MISE_ENV=node27`） |
| Package manager | pnpm 12.22 以上 | `mise.toml` と `package.json#packageManager` を一致させる |
| Language | TypeScript 7.1 beta（Go ネイティブ） | `strict`。stable / RC が出たら切り替える |
| Framework | Next.js 16.5 canary（App Router / Turbopack）+ React 19.3 | RSC 既定 |
| AI | Vercel AI SDK 7（`ai`, `@ai-sdk/react`, 各プロバイダ） | テストは `ai/test` のモックモデル |
| Validation | Zod 4.6 | システム境界で一度だけ検証 |
| UI | shadcn/ui + Tailwind CSS v4 | spec 002 以降で導入 |
| Lint / Format | Biome | 単一の規約 |
| Testing | Vitest（unit）/ Playwright（E2E） | 未モック通信は失敗 |
| Hooks / Security | lefthook / gitleaks / osv-scanner / `pnpm audit` | `mise.toml` で exact pin |
| Data store | なし | 永続化は扱わない（RAG は範囲外） |

## Key Decisions

- **exact pin は「現時点の採用版」** — 据え置くためではなく採用時点を明示するため。脆弱性検出・
  週次の更新確認・stable 公開を契機に上げる（plan §2.1、憲章 原則 9）。
- **24h ゲートを外さない** — `minimumReleaseAge: 1440`、`minimumReleaseAgeExclude` は使わない。
  プレリリースも 24h 経過済みの特定版へ pin する（D3）。
- **フックは lefthook** — pre-commit は並列の速いゲート、pre-push は安い順に直列（D4）。
- **E2E は pre-push に smoke 1〜2 本、残りは CI** — `@smoke` タグで選ぶ（D5）。
- **モデル ID は allowlist だけ** — `src/lib/ai/model-allowlist.ts` を唯一の定義とし、
  `check:model-ids` で直書きを検出する。
- **Node 27 は分離検証** — main は Node 26 LTS が必須 CI。Node 27 alpha は `mise.node27.toml`
  （`MISE_ENV=node27`）と CI の `verify-node27`（`continue-on-error`）で分離検証する。`exp/node27` は
  Node 27 でだけ必要な修正が生じた時点で作る（憲章 Additional Constraints）。

## Conventions

- **Commands**: `mise run <task>` → `pnpm exec <cmd>` の順。素のツールを直接実行しない。
- **Gate command**: `mise run verify`（別名 `mise run gate`）。オフラインで決定論的な検査を
  `check`（Biome の lint・format チェック）→ `typecheck`（`next typegen` → `tsc --noEmit`）→
  `check:model-ids` → `check:secrets`（gitleaks、HEAD から到達できる全履歴）→ `test`（Vitest）→
  `e2e`（Playwright `@smoke`）の順に実行し、最初の失敗で止まる。
- **Security command**: `mise run security`（`security:osv` → `security:audit`）。ネットワークが必要な
  `osv-scanner` と `pnpm audit --audit-level=high` で、verify には含めない（憲章 原則 3）。CI の必須ジョブ
  `verify` は verify と security の両方を実行するので、分離で検査は減らない。手元のフックは、pre-commit が
  lint・型・モデル ID・staged の秘密値を、pre-push が security と単体テスト・E2E smoke を実行する。フックの
  各ジョブは対応する mise タスクと同じ検査を呼ぶ。
- **Preflight command**: なし（段 1 では設けない）。clone 後は `mise run setup`（lockfile からの install、
  テスト用ブラウザ、フックの登録）。補助タスクは `runtime`（版の記録、合否なし）と `outdated`（更新候補の
  一覧）。フックは mise を有効にした環境が前提。
- **Typing**: TS `strict`。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを入れない。
  Biome の `noUnusedVariables` / `noUnusedImports` / `noExplicitAny` は `error`。
- **Boundaries**: HTTP リクエスト・環境変数・ツール入力・LLM 構造化出力は Zod で検証する。
  リクエストスキーマは厳格（未知フィールドを拒否）。内部では検証済みの型を信頼する。
- **Model injection**: LLM を呼ぶ関数はモデルを引数で受け取る。

  ```ts
  // Pattern: the caller decides the model; tests pass a mock.
  export async function summarize(model: LanguageModel, input: string) { /* ... */ }
  ```

- **Structured output**: `Output.object({ schema })` を使う。`generateObject` / `streamObject` は使わない。
- **Agents**: `createGuardedAgent`（`src/lib/ai/agent.ts`）経由でのみ作る。停止条件はステップ数・
  累積トークン・実行時間の 3 種。停止理由は閉じた語彙
  `completed | step-limit | token-budget | timeout | aborted | error`。
- **Tool approval**: 書き込み・破壊的なツールは `toolApproval` で承認待ち。要否はサーバー側で決める。
- **Untrusted data**: ツール結果と外部入力はデータとして扱う。`eval` / `new Function` を使わない。
- **Server / client**: RSC 既定。`"use client"` は対話が必要な末端だけ。API キー参照や AI 呼び出しの
  モジュールは `server-only`。
- **Errors**: テストが予期せず落ちたら、スキップ・リトライ・期待値の緩和ではなく原因を直す。
- **Testing**: TDD（RED → GREEN → REFACTOR）。unit は `ai/test` のモックモデル、E2E は Playwright
  `page.route` で UI message stream（SSE）をモックする。`passWithNoTests` を有効にしない。
  テストは対象ロジックを壊すと落ちること（非空虚）を確認する。版番号をテストで検査しない。
- **Logging**: 生のプロンプト、ツール引数の値、秘密情報をログに出さない。
- **Commits**: Conventional Commits（英語）。版上げは `build(deps):` / `fix(security):` で、
  advisory ID や release note を本文に書く。

## Supply Chain

- 依存とツールは exact pin。`latest` / `canary` / `beta` タグや範囲指定を使わない。
- install スクリプトは既定で遮断し、`allowBuilds` で許可するものには理由を記す。
- CI は `--frozen-lockfile`、`osv-scanner`、`pnpm audit --audit-level=high` を通す（`mise run security`。
  CI の verify ジョブと毎日の `security-daily` で実行）。
- GitHub Actions の `uses:` はコミット SHA で固定し、ジョブごとに `permissions:` を最小にする。
- gitleaks は 2 か所で実行する。pre-commit はステージ済みの変更だけ
  （`gitleaks git --pre-commit --staged --redact`）。verify の `check:secrets` は HEAD から到達できる全履歴
  （`gitleaks git --redact --log-opts=HEAD`。CI は `fetch-depth: 0` で取得）。gitleaks 既定の `git log --all`
  は他のブランチや stash も読み、結果が ref の有無で変わるため使わない。どちらも `--ignore-gitleaks-allow`
  で行内の許可コメントを無効にする。`gitleaks dir` は使わない。
- 新しい第三者依存・CI ジョブ・外部サービスは、plan に宣言してから追加する（憲章 原則 10）。

## Constraints

- `mise run verify` は API キーとネットワークを必要としない。同一コミットで常に同じ合否を返す。
  ネットワークが必要な検査は `mise run security` に置き、到達できないときは失敗させる。
- API キーは環境変数からのみ、サーバー側でのみ参照する。`.env.example` は変数名だけを置く。
- `AI_PROVIDER` / `AI_MODEL` は allowlist 内の値だけを受け付け、不正値は起動時に Zod で拒否する。
- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
  件数・文字数・バイト数・レート・反復回数に明示的な上限を持つ（400 / 413 / 429）。
- ライブラリの API・版・モデル ID に関する主張は、公式ドキュメントと実インストール・実行で確かめて
  `research.md` の Evidence に残す。記憶や ZIP ガイドの記述を根拠にしない。
- 未決: 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)）、pre-push E2E の時間上限
  （TODO(E2E_BUDGET)、目安 60 秒）。
