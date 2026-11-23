# Structure

コードの置き方のパターン。ファイルツリーを列挙せず、パターンと例を残す。

> 状態（2026-11-22）: コード未作成。以下は spec 000 の計画（§5、§8.5）に基づく予定の構成で、
> 段 1 で足場を取り込んだあとに実物と照合して更新する。

## Organization Pattern

**段（stage）単位の積み上げ。** 1 つの段は、互いに参照し合う 4 点で完成する（憲章 原則 2）。

```
specs/005-tools-approval/          # 要件・設計・タスク（spec 番号 = 段番号）
docs/stages/5-tools-approval.md    # 解説: 読む → 動かす → 改造する → テストで合格を確かめる
src/lib/ai/agent.ts                # 実装（段が持つ責務の単一の置き場）
tests/unit/agent-approval.test.ts  # 合格判定テスト（解説から参照される）
```

アプリ自体は単一の Next.js App Router アプリ。AI 関連のロジックは `src/lib/ai/` に、UI と
ルートハンドラは `src/app/` に分ける。

## Directory Map (high level)

| Path | Holds |
|------|-------|
| `src/app/` | App Router のページとルートハンドラ（例: `api/chat/route.ts`） |
| `src/lib/ai/` | LLM 呼び出し・構造化出力・エージェント・プロバイダ・上限などのサーバー側ロジック |
| `tests/unit/` | Vitest。モックモデルでロジックを検証 |
| `tests/e2e/` | Playwright。`/api/chat` を SSE モックして UI フローを検証 |
| `scripts/` | 実行用の小さなスクリプトとリポジトリ検査（例: `check-model-ids.mjs`、`hello.ts`） |
| `docs/stages/` | 段ごとの解説 |
| `docs/node27/` | Node 27 alpha の検証記録（1 検証 1 ファイル） |
| `specs/` | `000-development-plan/`（全体計画）と各段の spec |
| `.github/workflows/` | `ci.yml`（verify / verify-node27）、`security-daily.yml` |

ルート直下の設定ファイル（`mise.toml`、`package.json`、`pnpm-workspace.yaml`、`lefthook.yml`、
`biome.json`、`tsconfig.json`、各テストランナー設定）は版とゲートの正本。

## Single Points of Definition

規約を 1 か所に集約し、検査で守らせるもの。新しいコードはここを経由する。

| 概念 | 唯一の置き場 | 守らせる検査 |
|------|--------------|--------------|
| モデル ID | `src/lib/ai/model-allowlist.ts` | `check:model-ids`（テスト fixture は除く） |
| エージェント生成 | `src/lib/ai/agent.ts` の `createGuardedAgent` | `new ToolLoopAgent` のリポジトリ走査テスト |
| プロバイダ選択 | `src/lib/ai/model.ts` | 環境変数の Zod 検証テスト |
| 入力上限・レート | `src/lib/ai/limits.ts`（段 8） | 400 / 413 / 429 のテスト |

## Naming Conventions

- **spec**: `specs/<NNN>-<slug>/`。NNN は段番号（001〜008）、計画外の作業は 009 以降を順に使う。
- **解説**: `docs/stages/<n>-<slug>.md`。`n` は先頭ゼロなしの段番号、`slug` は spec と揃える。
- **Node 27 記録**: `docs/node27/YYYY-MM-DD-<topic>.md`。見出しは「結論 / 検証した版 / 通したゲート /
  未解決事項 / 再現手順」。
- **ソース・テスト**: kebab-case のファイル名（`extract-task.ts`、`agent-approval.test.ts`）。
  テストは `<subject>.test.ts`。
- **シンボル**: 関数・変数は camelCase（`createGuardedAgent`）、型は PascalCase。
- **E2E タグ**: pre-push で走らせる 1〜2 本に `@smoke` を付ける。
- **言語**: spec・解説・steering の散文は日本語。コード・識別子・コメント・パス・コミットは英語。
  ルートの `AGENTS.md` は英語。

## Import / Dependency Rules

- `src/app/` は `src/lib/ai/` を呼んでよい。逆方向（`lib` → `app`）は持たない。
- `src/lib/ai/` のうち API キー参照や AI 呼び出しを含むモジュールは `server-only` を import し、
  クライアントコンポーネントから import しない。
- `"use client"` のコンポーネントは対話が必要な末端に置き、サーバー専用モジュールに依存しない。
- LLM を呼ぶ関数はモデルを引数で受け取る。モジュール内でプロバイダを直接生成しない
  （生成は `model.ts` に集約）。
- テストは実 LLM・実ネットワークに依存しない。

## Where Things Go

- 新しい段 → `specs/<NNN>-<slug>/` + `docs/stages/<n>-<slug>.md` + `src/` の実装 + `tests/` の合格テスト
- 新しい AI ロジック → `src/lib/ai/<concept>.ts`（責務ごとに 1 ファイル）
- 新しいルート / ページ → `src/app/`（ルートハンドラは境界で Zod 検証する）
- リポジトリ全体の規約検査（禁止 API・モデル ID の走査など）→ `scripts/` か `tests/unit/` の走査テスト
- テスト → `tests/unit/`（Vitest）または `tests/e2e/`（Playwright）。ソースの隣には置かない
- 段の範囲外になった内容 → 実装せず、卒業先の該当モジュールへのリンクを解説に書く
