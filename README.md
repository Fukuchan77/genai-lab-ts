# genai-lab-ts
Experimental Generative AI app lab built with Next.js, React, TypeScript, Vercel AI SDK, Zod, Node, and DevSecOps Git hooks.

生成 AI のスキルを 1 段ずつ積み上げる、初学者向けのハンズオンラボ。1 つの Next.js アプリの上で、LLM の呼び出しから
承認つきのツール呼び出しまでを順に作る。すべてのテストは API キーとネットワークなしで、決定論的に通る。

段ごとの解説は [docs/stages/](docs/stages/) にある。最初は
[段 1: 開発環境とゲート](docs/stages/1-dev-environment-and-gates.md)。

## セットアップ

ツールの版は [mise](https://mise.jdx.dev/) で固定している。Node・pnpm・lefthook・gitleaks・osv-scanner を個別に
入れる必要はない。版の正本は `mise.toml` と `package.json`、`pnpm-lock.yaml` で、文書に書く版番号は確認日つきの
参考値に過ぎない（例: 2026-11-25 時点の既定レーンは Node 26 LTS）。

### 1. mise をシェルで有効にする

```bash
# zsh の例。bash なら zsh を bash に置き換える
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc
exec zsh
```

### 2. ツールと依存を入れ、フックを登録する

```bash
git clone <this-repository-url> genai-lab-ts
cd genai-lab-ts
mise trust && mise install   # mise.toml を信頼し、固定した版のツールを入れる
mise run setup               # lockfile どおりの依存、テスト用ブラウザ（Chromium）、Git フックの登録
```

`mise run setup` は `pnpm install --frozen-lockfile`、`pnpm exec playwright install chromium`、`lefthook install`
を順に実行する。

### 3. ゲートを通す

```bash
mise run verify
```

lint・整形・型・モデル ID・秘密値・単体テスト・E2E smoke をまとめて検査する。ネットワークは要らない。

### 注意: mise を有効にしていない Git クライアントではフックが失敗する

Git フック（lefthook）は、mise が管理するツールを `PATH` から呼ぶ。mise を有効にしていないシェルや、
mise を読み込まない GUI の Git クライアントから commit・push すると、ツールが見つからずにフックが**失敗する**
（素通りはしない）。そのときは mise を有効にしたターミナルから操作する。

## コマンド

| 目的 | コマンド |
| --- | --- |
| ゲート一式（オフライン）: lint、整形、型、モデル ID、秘密値の履歴、単体テスト、E2E smoke | `mise run verify`（別名 `mise run gate`） |
| 依存の脆弱性検査（ネットワークが必要）: osv-scanner、`pnpm audit` | `mise run security` |
| lint と整形の検査だけ | `mise run check` |
| 型検査だけ | `mise run typecheck` |
| 単体テスト | `mise run test` |
| E2E smoke | `mise run e2e` |
| モデル ID の直書きの検査 | `mise run check:model-ids` |
| 秘密値の検査（`HEAD` から到達できる履歴） | `mise run check:secrets` |
| 更新候補の一覧（何も書き換えない） | `mise run outdated` |
| 使っている版の表示（記録用。合否はない） | `mise run runtime` |
| 単体テストを 1 ファイルだけ | `pnpm exec vitest run tests/unit/<subject>.test.ts` |

- `verify` はオフラインで決定論的な検査だけを持つ。ネットワークが必要な検査は `security` に分けてある。
  CI の必須ジョブは `verify` と `security` を両方実行する。手元では、pre-commit が lint・型・モデル ID・staged の
  秘密値を、pre-push が `security` と単体テスト・E2E smoke を実行する（下の「Git フック」）。
- `mise run outdated` の後半の `pnpm outdated` は、更新候補があると **exit 1** になる。これは「候補がある」という
  答えであり、故障ではない。

## Git フック

| フック | 実行するもの |
| --- | --- |
| pre-commit（並列） | gitleaks（staged の変更）、Biome（staged のファイル）、型検査、モデル ID の検査 |
| commit-msg | Conventional Commits の形式の検査 |
| pre-push（順に。最初の失敗で止まる） | osv-scanner、`pnpm audit`、単体テスト、E2E smoke |

## Node 27 レーンの検証

既定レーンを壊さずに Node 27 alpha で同じ検査を実行するには、別の git worktree を作る。`node_modules` は
既定レーンと**共有しない**（worktree ごとに install する）。worktree は commit から作るので、先に作業ツリーの
変更を commit しておく。

```bash
git worktree add --detach ../genai-lab-ts-node27 HEAD
cd ../genai-lab-ts-node27

export MISE_ENV=node27                 # mise.node27.toml で node だけを上書きする（このシェルの中だけ）
mise trust
mise install
pnpm install --frozen-lockfile        # この worktree 専用の node_modules
pnpm exec playwright install chromium

mise run runtime
mise run verify

cd - && git worktree remove ../genai-lab-ts-node27
unset MISE_ENV                         # 既定レーン（Node 26）に戻す
```

`MISE_ENV` を残したままだと、元の作業ツリーでも Node 27 で動き続ける。

Git フックは worktree 間で共有されるので、worktree で `lefthook install` はしない。結果は
`docs/node27/YYYY-MM-DD-<topic>.md` に記録する（例: [docs/node27/](docs/node27/)）。

## 依存の更新

- 依存とツールは、公開から 24 時間以上たった版に exact で固定する。
- Dependabot は npm と GitHub Actions の更新を週 1 回提案する。version updates には 1 日の cooldown がかかる。
- Dependabot の **security updates は cooldown の対象外**で、公開から 24 時間未満の修正版の PR が来ることがある。
  その PR は、修正版の公開から 24 時間たってからマージする。

## 統治文書

- 憲章（プロジェクトの原則。最優先）: [.sdd/memory/constitution.md](.sdd/memory/constitution.md)
- 全体計画: [specs/000-development-plan/plan.md](specs/000-development-plan/plan.md)
- steering（製品・技術・構成の規約）: [.sdd/steering/](.sdd/steering/)
- エージェント向けの作業規則: [AGENTS.md](AGENTS.md)
