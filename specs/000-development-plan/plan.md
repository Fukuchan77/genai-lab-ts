# 000-development-plan — genai-lab-ts 開発計画（設計案）

- 作成日: 2026-11-22
- spec 番号: **000**（全体計画）。実装の各段は spec 001 から始まる（§7）
- 状態: **設計案（決定事項反映済み・レビュー待ち）**。実装前の計画で、コードは含まない。2026-11-22 に §9 の D1〜D6 をすべて推奨案で決定した
- 入力:
  - `genai-lab.zip`（5 フェーズの足場コード一式）と、付属ガイド「Learning roadmap and environment setup guide for building generative AI apps」（2026-11-22）
  - [`next-agentic-stack`](https://github.com/Fukuchan77/next-agentic-stack)（TypeScript ベータ検証レーン）
  - [`from-genai-to-agentic-ai`](https://github.com/Fukuchan77/from-genai-to-agentic-ai)（4 フェーズ・19 モジュールの学習パス）
  - [`sdd-tdd-kit`](https://github.com/Fukuchan77/sdd-tdd-kit)（SDD + TDD の Claude Code / Codex 設定）
  - 共有会話リンク（claude.ai/share/…）: ログインが必要なページで本文を取得できなかったため、**本計画には反映していない**。必要な決定があれば本文を貼ってもらい追補する

---

## Summary

genai-lab-ts を from-genai-to-agentic-ai の前段となる入門ラボとし、8 段の学習ロードマップを単一の Next.js アプリで段階的に実装する。Node 26.13.1 LTS を既定、Node 27 alpha を `mise.node27.toml` + `exp/node27` で分離検証し、lefthook のフックと CI で同じ `mise run verify` を強制する。依存は公開から 24 時間以上たった版へ exact pin するが、その版は設計時点のスナップショットであり、脆弱性スキャンや更新チェックの結果で上げていく（§2.1）。

## 1. 目的と位置づけ

genai-lab-ts は、**生成 AI アプリ開発を基礎から 1 段ずつ積み上げるハンズオン・ラボ**とする。
各段は「読む → 動かす → 改造する → テストで合格を確かめる」の単位で、API キーなしでも全テストが決定論的に通る。

### 既存リポジトリとの役割分担（案）

| リポジトリ | 役割 | genai-lab-ts との関係 |
| --- | --- | --- |
| **genai-lab-ts（本リポジトリ）** | 単一 Next.js アプリで、Level 1（生成 AI）〜 Level 2 入口（ツール呼び出し）までを小さな段で学ぶラボ | — |
| from-genai-to-agentic-ai | モノレポで 19 モジュールを本番品質まで進める学習パス | 本ラボの卒業先。RAG・ワークフロー・マルチエージェント・Evals は本ラボで扱わず、該当モジュールへリンクする |
| next-agentic-stack | TS 7 / Node 26 / Next canary などの次の版を先に動かすベータ検証レーン | 版の採否と既知の落とし穴の参照元。検証記録の形式（`docs/beta-lane/`）を Node 27 検証で流用する |
| sdd-tdd-kit | SDD パイプラインと TDD の運用ルール | 本ラボの開発手順そのもの（§6） |

運用ルールは from-genai-to-agentic-ai に揃える。**相互リンクで済ませ、本文やコードを複製しない**。

> この役割分担は §9 の D1 で確定した（2026-11-22）。

---

## 2. 技術スタック（2026-11-22 の設計時点で確認した版）

下表の版は**設計時点（2026-11-22）に確認した版**で、実装・運用中に固定し続けるものではない（§2.1）。ZIP のガイドで確認済みの版を基準にし、兄弟リポジトリで実績のある **exact pin** 方式に寄せる。

| 領域 | 採用 | 固定方法 |
| --- | --- | --- |
| ランタイム（既定） | Node.js 26.13.1 "Lithium"（LTS） | `mise.toml` で exact pin |
| ランタイム（検証） | Node.js 27.0.0-alpha.0.1.0 | `mise.node27.toml`（`MISE_ENV=node27`） |
| パッケージ管理 | pnpm 12.22.x（`pnpm audit` の文字列 ID 修正を含む 12.22 以上） | `mise.toml` と `package.json#packageManager` を一致させる |
| 言語 | TypeScript 7.1 beta（Go ネイティブ） | `package.json` で exact pin |
| フレームワーク | Next.js 16.5 canary（App Router / Turbopack）+ React 19.3 | exact pin |
| AI | Vercel AI SDK 7（`ai`, `@ai-sdk/react`, 各プロバイダ） | `^7` ではなく exact pin（`latest` は使わない） |
| 検証 | Zod 4.6 | exact pin |
| Lint / Format | Biome 2.6.8 | exact pin |
| テスト | Vitest 5.1 / Playwright 1.65 | exact pin |
| UI | shadcn/ui + Tailwind CSS v4（兄弟リポジトリの ADR-0008 に合わせる。導入は spec 002 以降） | — |
| フック / セキュリティ | lefthook / gitleaks 8.30.x / osv-scanner v2 | `mise.toml` で exact pin（`latest` は使わない） |

### 2.1 バージョン方針: pin は「固定」ではなく「現時点の採用版」

exact pin は「いつ、どの版を採用したか」を lockfile と設定に明示するための手段で、版を据え置くための手段ではない。次の契機で版は上がる前提で設計する。

| 契機 | 検出手段 | 対応 |
| --- | --- | --- |
| commit / push 時の脆弱性検出 | pre-push の `osv-scanner` / `pnpm audit`、CI の同じゲート | 修正版（24h 経過済み）へ上げる。上げられない場合は `overrides` で推移的依存だけを上げるか、退役条件付きの除外を記録する |
| 日次の advisory 更新 | `security-daily` ワークフロー（lockfile 不変でも赤くなる） | 同上 |
| 更新候補の定期確認 | `mise run outdated`、Dependabot | 週 1 回まとめて上げる。プレリリース（Next canary / TS beta / Node 27 alpha）は stable や RC の公開を合図に切り替える |
| LTS / メジャーの節目 | Node の release schedule、各ライブラリの release note | 新しい段の spec として計画し直す（例: TypeScript 7.1 stable、Node 28 LTS） |

完了検査（各 spec の `/sdd-validate-impl`、`/sdd-ship`、M ごとの完了条件）は次のように扱う。

- 合格条件は「**その時点の pin で `mise run verify` と CI が緑**」とし、本書や spec に書いた特定の版番号に一致することを条件にしない。
- 本書・spec・README に書く版番号は「確認日つきの参考値」とし、正本は `mise.toml`、`package.json`、`pnpm-lock.yaml` とする。版を上げても本書を書き換える義務はない（大きな節目だけ追記する）。
- 版を上げた commit は Conventional Commits の `build(deps):` / `fix(security):` とし、理由（advisory ID や release note）を本文に書く。
- テストやドキュメントで版番号をハードコードして検査しない（`mise run runtime` の出力は記録用で、合否には使わない）。Node は `engines` の範囲（`>=26.13.0`）と LTS 系列で判定する。

### 2.2 ZIP からの変更点

| ZIP の記述 | 本計画 | 理由 |
| --- | --- | --- |
| `node = "26"`、`lefthook/gitleaks/osv-scanner = "latest"` | すべて exact pin | 公開直後の不正版を自動取得しない（next-agentic-stack の `mise.toml` の方針） |
| `package.json` の `"latest"` / `"canary"` / `"beta"` | 公開から 24 時間以上たった特定版に exact pin | `minimumReleaseAgeExclude` で 24h ゲートを外さずに済む（next-agentic-stack の `pnpm-workspace.yaml`） |
| `minimumReleaseAgeExclude: [next, @next/*, typescript]` | 削除（D3） | 同上 |
| `allowBuilds: { sharp: true }` | `sharp: false` | ビルド済みバイナリ（`@img/sharp-*`）で動くため、install スクリプトは不要と監査済み |
| `actions/checkout@v5` などタグ指定 | コミット SHA pin + Dependabot | サプライチェーン対策 |
| `AI_MODEL` を環境変数で自由入力 | `model-allowlist.ts` を唯一の定義にし、環境変数は allowlist 内から選ぶ | モデル ID の散在を防ぐ（両兄弟リポジトリの方針、`check:model-ids`） |

---

## 3. 環境構成: Node 26 LTS 既定 + Node 27 Alpha の分離検証

### 3.1 構成

```
main                 … Node 26 LTS（mise.toml）。必須 CI
  └ mise.node27.toml … Node 27 alpha の差分だけを持つ。main にコミットしておく
exp/node27           … Node 27 でのみ必要な修正を置く長命ブランチ（任意）
../genai-lab-node27  … exp/node27 の git worktree（node_modules を ABI ごとに分離）
```

- `mise.node27.toml` は main に置き、CI の matrix が同じファイルを使う（ZIP の設計どおり）。
- Node 27 でだけ必要な修正は `exp/node27` に置き、main へは「Node 26 でも壊れない」ことを確認してから入れる。
- worktree を分ける理由: ネイティブモジュールが Node ABI ごとにビルドされるため、`node_modules` を共有しない。

### 3.2 CI

| job | `MISE_ENV` | 失敗時 | トリガー |
| --- | --- | --- | --- |
| verify（必須） | `""` | マージをブロック | push（main / `exp/**`）・PR |
| verify-node27（参考） | `node27` | `continue-on-error`（ブロックしない） | 同上 + 週次 schedule |
| security-daily | `""` | 通知のみ | 毎日（advisory はロックファイルが不変でも赤くなるため） |

### 3.3 Node 27 の検証記録

next-agentic-stack の `docs/beta-lane/TEMPLATE.md` と同じ見出し（結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順）で `docs/node27/YYYY-MM-DD-<topic>.md` に残す。
alpha の新版は `mise ls-remote node --prerelease | grep 27.0.0-alpha` で確認し、上げるたびに 1 記録を書く。

---

## 4. Git フック（セキュリティ + テスト自動化）

lefthook を採用する（D4）。pre-commit は数秒で終わる並列ゲート、pre-push は安い順に直列で止まる厳格ゲート。
`--no-verify` で回避できるため、CI は同じ `mise run verify` を実行する。

| フック | ジョブ | コマンド | 防ぐもの |
| --- | --- | --- | --- |
| pre-commit | secrets | `gitleaks git --pre-commit --staged --redact` | API キーの誤コミット |
| pre-commit | biome | `pnpm exec biome check --staged --no-errors-on-unmatched` | lint / format 違反 |
| pre-commit | typecheck | `pnpm exec tsc --noEmit` | 型エラー |
| pre-commit | model-ids | `mise run check:model-ids` | allowlist 外のモデル ID 直書き |
| commit-msg | conventional | Conventional Commits 検査（sdd-tdd-kit の `committing-changes` に合わせる） | 不揃いな履歴 |
| pre-push | osv-scanner | `osv-scanner scan source --lockfile=pnpm-lock.yaml` | 依存の既知 CVE（OSV） |
| pre-push | pnpm-audit | `pnpm audit --audit-level=high` | npm advisory |
| pre-push | unit-tests | `pnpm exec vitest run` | ロジックの回帰（モック LLM） |
| pre-push | e2e-smoke | `pnpm exec playwright test --grep @smoke` | UI フローの破損（`/api/chat` をモック） |

補足:

- フックは mise 管理のツールを PATH から呼ぶ。mise を有効にしていない Git クライアントでは失敗するため、README に明記する（from-genai-to-agentic-ai と同じ注意）。
- pre-push の E2E が 60 秒を超えるようになったら、smoke を 1〜2 本に絞るか CI 側へ移す。
- `mise run security` は全履歴の `gitleaks git` を含み、CI は `fetch-depth: 0` で実行する。

---

## 5. 学習ロードマップ（段の設計）

ZIP の 5 フェーズを土台に、**API を呼ぶ前の基礎（段 1〜2）**と**卒業の橋渡し（段 8）**を足して 8 段にする。段の番号はそのまま spec 番号（段 1 = `specs/001-…`）になる。
各段は 1 つの spec（`specs/00<n>-<slug>/`）、1 つの解説 `docs/stages/<n>-<slug>.md`、対応するソース、合格判定テストを持つ。

| 段（spec） | 学ぶこと | 主なファイル（予定） | 合格条件（自動テスト） |
| --- | --- | --- | --- |
| 1. 開発環境とゲート | ZIP の足場の取り込みと実地検証、mise / pnpm 12 / lefthook / gitleaks / osv-scanner、Node 26 と 27 の切り替え、constitution / steering | §8.5 の全ファイル | `mise run verify` がネットワーク不要で通る。秘密値を含む commit がフックで拒否される |
| 2. LLM 呼び出しの基礎 | `generateText`、system / user、温度・最大トークン、usage、エラーと再試行 | `src/lib/ai/basics.ts`, `scripts/hello.ts` | モックモデルで出力・usage・再試行回数を検証 |
| 3. ストリーミング UI | `streamText` → UI message stream、`useChat`、中断（Stop）、再送 | `src/app/api/chat/route.ts`, `src/app/page.tsx` | トークン単位で表示され、Stop で中断される（E2E @smoke） |
| 4. 構造化出力 | `Output.object({ schema })`、Zod 4.6 `.validate()`、スキーマ違反の扱い | `src/lib/ai/extract-task.ts` | スキーマ違反が例外になる。`generateObject` の使用はリポジトリ走査で失敗 |
| 5. ツールと承認 | `ToolLoopAgent`、`toolApproval`、停止条件 3 種（ステップ・トークン・時間）、ツール結果をデータとして扱う | `src/lib/ai/agent.ts`（`createGuardedAgent` に集約） | 破壊的ツールが承認待ちになる。停止理由ごとにテスト |
| 6. プロバイダ抽象化 | OpenAI / Anthropic / Google / Ollama を `AI_PROVIDER` で切替、モデル allowlist | `src/lib/ai/model.ts`, `model-allowlist.ts` | 環境変数だけで切り替わる。不正値は起動時に Zod で拒否 |
| 7. テストと簡易評価 | `MockLanguageModelV4`、Playwright `page.route` の SSE モック、出力の採点（ルールベース） | `tests/unit/*`, `tests/e2e/*` | gate がネットワークなしで通る。未モックの通信はテスト失敗 |
| 8. 安全性と卒業 | プロンプトインジェクションの基本、入力上限・レート制限、次に学ぶこと | `src/lib/ai/limits.ts`, `docs/stages/8-next-steps.md` | 上限超過が 400 / 413 / 429 になる。from-genai-to-agentic-ai の対応モジュールへのリンクがある |

扱わないもの（卒業先へリンク）: RAG、ワークフローパターン、マルチエージェント、MCP、長時間実行ハーネス、Agent Evals の本格版。

各段の共通ルール（from-genai-to-agentic-ai の constitution から採る）:

- モデルは引数で注入し、テストではモックに差し替える。
- 構造化出力は `Output.object` を使い、`generateObject` / `streamObject` は使わない。
- すべてのエージェントは停止条件 3 種を持ち、停止理由を閉じた語彙で返す。
- モデル ID は allowlist だけに書く。

---

## 6. 開発プロセス（sdd-tdd-kit）

sdd-tdd-kit のパイプラインで段ごとに進める。

1. **ガバナンス（spec 001 の最初に 1 回）**: `/sdd-constitution` で `.sdd/memory/constitution.md` を作る（§5 の共通ルールと §4 のゲートを原則化）。`/sdd-steering` で `.sdd/steering/` を作り、`AGENTS.md` を置く。
2. **段ごと**: `/sdd-init` → `/sdd-spec`（EARS 形式）→ `/sdd-plan` → `/sdd-validate-plan` → `/sdd-tasks` → `/sdd-impl`（TDD: 失敗するテストを先に書く）→ `/sdd-ship` → `/sdd-reflect`。
3. **成果物の置き場**: `specs/000-development-plan/` は本書（全体計画）だけを持つ。各段は `specs/<NNN>-<slug>/`（spec / plan / tasks / traceability / pdca）で、NNN は段の番号（001〜008）。計画外の作業（例: 版上げで大きな変更が要るもの）は 009 以降を順に使う。
4. **1 段 = 1 PR**（大きい段は spec PR と実装 PR に分ける）。

---

## 7. マイルストーン

| M | spec | 内容 | 完了条件 |
| --- | --- | --- | --- |
| M1 | 001 | 段 1: 足場の取り込みと実地検証、ゲート、Node 27 検証レーン（`exp/node27`、CI matrix、初回の `docs/node27/` 記録）、constitution / steering / AGENTS.md | ZIP ガイドの未検証 5 項目（§8）をすべて解消し、その時点の pin で Node 26 LTS の `mise run verify` と CI が緑。Node 27 alpha の結果（失敗を含む）を記録 |
| M2 | 002〜003 | 段 2〜3: LLM 呼び出しの基礎、ストリーミング UI | 各段の合格条件テストが緑 |
| M3 | 004〜006 | 段 4〜6: 構造化出力、ツールと承認、プロバイダ抽象化 | 同上 |
| M4 | 007〜008 | 段 7〜8: テストと簡易評価、安全性と卒業、README のロードマップ表 | 全段が緑。from-genai-to-agentic-ai 側にも本ラボへのリンクを提案 |

本書（spec 000）は本 PR のレビュー承認で「確定」とし、マイルストーンには数えない。

## 8. リスクと spec 001 で最初に確かめること

ZIP の足場は `pnpm install` / `mise run verify` を実行していない（ガイドの「Caveats」）。spec 001 の冒頭で次を順に確認する。

- [ ] `MISE_ENV=node27 mise install` が alpha を解決できるか（`prereleases` 設定が必要かも含めて）
- [ ] `tests/unit/agent-approval.test.ts` のモック content の形（`tool-call` / `tool-approval-request`）が AI SDK 7 の実際の型と合うか
- [ ] `next@canary` + `typescript@beta` が peerDependency の警告なしで入るか
- [ ] E2E の SSE モックが `useChat` のパーサーと合うか（初回の `pnpm e2e:smoke`）
- [ ] TypeScript 7.1 RC / stable が出たら beta から切り替える

その他のリスク:

- Next canary はほぼ毎日出る。exact pin にしたうえで、`mise run outdated`（next-agentic-stack の `scripts/check-updates.mjs` 相当）で更新候補を出し、週 1 回まとめて上げる。
- Node 27 alpha は ABI や API が予告なく変わる。必須 CI にはしない。
- AI SDK 7 の API 名（`toolApproval`、`isStepCount`、`toUIMessageStream` など）は ZIP ガイド執筆時点の記述で、spec 001 で型定義と照合する。

---

## 8.5 File Structure Plan（spec 001 で作るファイル）

spec 001 の tasks.md は、ここに挙げたファイルだけを `_Boundary:_` にできる。段 2 以降のファイルは各段の spec（`specs/002-…` 以降）で定める。

| File | Create/Modify | Responsibility |
| --- | --- | --- |
| `mise.toml` | Create | Node 26 LTS / pnpm 12 / lefthook / gitleaks / osv-scanner を、作成時点で 24h 以上たった版に exact pin し、`check` `security` `test` `e2e` `verify` `runtime` `outdated` タスクを定義する |
| `mise.node27.toml` | Create | Node 27 alpha の版だけを上書きする |
| `package.json` | Create | 依存の exact pin、`packageManager`、`engines`、スクリプト |
| `pnpm-workspace.yaml` | Create | `minimumReleaseAge: 1440`（除外なし）、`allowBuilds`、`overrides` |
| `pnpm-lock.yaml` | Create | 依存グラフの固定 |
| `lefthook.yml` | Create | pre-commit / commit-msg / pre-push のゲート（§4） |
| `biome.json` | Create | lint / format 設定 |
| `tsconfig.json` | Create | `target: es2026`、`types: ["node"]` |
| `next.config.ts` | Create | Next.js 設定 |
| `vitest.config.ts` / `playwright.config.ts` | Create | テストランナー設定（未モック通信を失敗させる） |
| `.env.example` | Create | 変数名だけを置く |
| `.gitignore` | Modify | `.env*.local`、`.next`、テスト成果物を追加 |
| `.github/workflows/ci.yml` | Create | verify（必須）と verify-node27（参考）の matrix |
| `.github/workflows/security-daily.yml` | Create | 毎日の `pnpm audit` / osv-scanner |
| `.github/dependabot.yml` | Create | Actions と npm の更新提案 |
| `src/app/**`, `src/lib/ai/**`, `tests/**` | Create | ZIP の足場を §2 の修正込みで取り込む |
| `src/lib/ai/model-allowlist.ts` | Create | モデル ID の唯一の定義 |
| `scripts/check-model-ids.mjs` | Create | allowlist 外のモデル ID を検出する |
| `.sdd/memory/constitution.md` | Create | §5 の共通ルールと §4 のゲートを原則化する |
| `.sdd/steering/*` | Create | プロダクト・技術・構成の steering |
| `AGENTS.md` | Create | エージェント向けの作業ルールとコマンド一覧 |
| `README.md` | Modify | セットアップ、Node 27 検証手順、ロードマップ表 |

## Constitution Compliance

本リポジトリにはまだ `.sdd/memory/constitution.md` がない。spec 001 の最初のタスクで作成し、以降の spec / plan はそれに照らして検証する。

## 9. 決定事項（2026-11-22、すべて推奨案を採用）

| ID | 論点 | 決定 | 採らなかった選択肢 |
| --- | --- | --- | --- |
| D1 | 本ラボの位置づけ | from-genai-to-agentic-ai の**前段となる入門ラボ**（Level 1〜2 入口に絞る） | 独立した総合ロードマップにする（19 モジュールと重複する） |
| D2 | 共有会話の扱い | 本文が届いたら、決定事項があれば本書に追補する（現時点では未反映） | 反映しない |
| D3 | プレリリースの 24h ゲート | ゲートは外さず、24h 以上たった版へ exact pin | ZIP どおり `minimumReleaseAgeExclude` で next / typescript を除外 |
| D4 | フック管理 | lefthook（ZIP の設計、並列・直列の制御が楽） | `.githooks/` の素の shell（from-genai-to-agentic-ai と同じ） |
| D5 | pre-push の E2E | smoke 1〜2 本を pre-push、残りは CI | すべて CI に移す |
| D6 | 解説の言語 | 散文は日本語、識別子・パス・コードは英語（兄弟リポジトリと同じ） | 英語 |
