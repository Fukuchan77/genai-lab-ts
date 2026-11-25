# 段 1: 開発環境とゲート

この段では、まだ AI を呼ばない。以後のすべての段が乗る土台として、ツールの版を固定し、1 つのコマンドで
lint・型・テストをまとめて検査できるようにする。仕様は
[specs/001-dev-environment-and-gates/spec.md](../../specs/001-dev-environment-and-gates/spec.md)。

段 1 の合格条件は 2 つ。

1. `mise run verify` が API キーとネットワークなしで通る。
2. 秘密値を含む commit が Git フックで拒否される。

## 読む

まず、検査がどこに定義されているかを読む。検査の定義は 1 か所にしかない。

| ファイル | 読むところ |
| --- | --- |
| [mise.toml](../../mise.toml) | `[tools]` の版の固定と、`[tasks]` の検査の定義。`verify` が 6 つの検査を順に呼ぶ |
| [lefthook.yml](../../lefthook.yml) | Git フック。各ジョブは `mise.toml` のタスクと同じ検査を呼ぶ |
| [.github/workflows/ci.yml](../../.github/workflows/ci.yml) | CI。手元と同じ `mise run verify` と `mise run security` を実行する |
| [vitest.config.ts](../../vitest.config.ts) | 単体テストの設定。未モックの通信と、実行 0 件を失敗にする仕掛けを読み込む |
| [src/lib/ai/model-allowlist.ts](../../src/lib/ai/model-allowlist.ts) | モデル ID を書いてよい唯一のファイル |

`mise run verify` が実行する検査は、次の順に並ぶ。最初に失敗した検査で止まる。

| 順 | タスク | 何を確かめるか |
| --- | --- | --- |
| 1 | `check` | Biome の lint と整形 |
| 2 | `typecheck` | Next.js のルート型を生成してから `tsc --noEmit` |
| 3 | `check:model-ids` | モデル ID が許可リストの外に書かれていないか |
| 4 | `check:secrets` | `HEAD` から到達できる commit の履歴に秘密値がないか（gitleaks） |
| 5 | `test` | 単体テスト（Vitest） |
| 6 | `e2e` | ブラウザの `@smoke` テスト（Playwright） |

ネットワークが必要な検査（osv-scanner と `pnpm audit`）は `verify` に入れず、`mise run security` に分けてある。
`verify` は同じ commit なら何度実行しても同じ結果になる。`security` は脆弱性データベースの更新で結果が
変わる。CI の必須ジョブは `verify` と `security` を両方実行する。手元では、pre-commit が lint・型・モデル ID・
staged の秘密値を、pre-push が `security` と単体テスト・E2E smoke を実行する。

テストの側にも、空振りを防ぐ仕掛けがある。

- [tests/unit/setup/network-guard.ts](../../tests/unit/setup/network-guard.ts): 単体テストからの未モックの
  通信を失敗にする。
- [tests/unit/setup/require-executed-tests.ts](../../tests/unit/setup/require-executed-tests.ts): 実行された
  テストが 0 件なら失敗にする。
- [tests/e2e/fixtures.ts](../../tests/e2e/fixtures.ts): E2E でページが外部オリジンへ要求したら記録し、
  テストを失敗にする。

## 動かす

セットアップは [README.md](../../README.md) の手順に従う（mise の有効化、`mise trust && mise install`、
`mise run setup`）。そのあと、次を実行する。

```bash
mise run verify      # 6 つの検査を順に。最後に Playwright の結果が出る
mise run runtime     # 使っている Node・pnpm・TypeScript などの版を表示する（記録用。合否はない）
```

ネットワークを切った状態でも `mise run verify` を実行してみる。`verify` はネットワークを使わない設計なので、
結果は変わらないはずである。逆に `mise run security` はネットワークがないと失敗するように作ってある。到達できない
ことを「問題なし」と扱わないためである（どちらも spec 001 の最終検証で実測し、research.md の R-3・R-4 に記録する）。

commit すると pre-commit フックが動く。ターミナルに `secrets`・`biome`・`typecheck`・`model-ids` の 4 つの
ジョブが並んで表示されることを確かめる。

## 改造する

ゲートを 1 つわざと壊し、失敗を観察してから元に戻す。どの演習も、最後に `git diff` が空になるまで戻すこと。

### 演習 1: モデル ID を直書きする

1. [src/lib/ai/model-allowlist.ts](../../src/lib/ai/model-allowlist.ts) の `MODEL_ALLOWLIST` から、ID を 1 つ
   コピーする。
2. [src/app/page.tsx](../../src/app/page.tsx) の `<p>` の文中に、その ID を貼り付ける。
3. `mise run check:model-ids` を実行する。終了コード 1 で失敗し、`ファイル:行:列: 一致した文字列 (allowlist)` の形で表示される。
4. 貼り付けた ID を消し、もう一度実行して通ることを確かめる。

許可リストにない ID でも、プロバイダの命名規則に合う文字列なら `pattern:<provider>` として検出される。
モデル ID を許可リストの 1 か所だけに置くのは、モデルを替えるときに直す場所を 1 つにするためである。

### 演習 2: テストを飛ばす

1. [tests/unit/docs-structure.test.ts](../../tests/unit/docs-structure.test.ts) の `it(` を 1 つ `it.skip(` に
   書き換える。
2. `mise run check` を実行する。Biome の `noSkippedTests` で失敗する。
3. 元に戻す。

テストを飛ばして緑にすることは、このラボでは「合格」に数えない。

### 演習 3: 秘密値の commit を拒否させる

自分の作業リポジトリを汚さないよう、一時ディレクトリで試す。

1. `git init` した一時ディレクトリに、本物に見える形式の API キー（gitleaks の既定ルールに一致するもの）を
   書いたファイルを置き、`git add` する。値は実在しない架空のものにする。
2. このリポジトリのディレクトリ（mise が gitleaks を用意する場所）で
   `gitleaks git --pre-commit --staged --redact --verbose <一時ディレクトリ>` を実行する。終了コードが 0 以外になり、
   一致したルール（`RuleID`）が表示される。`--redact` を付けているので、値そのものは表示されない。
   `--verbose` を外すと `leaks found: 1` だけになる（pre-commit フックは `--verbose` 付きで実行する）。
3. 一時ディレクトリを削除する。

この演習と同じことを、テストが一時リポジトリで自動的に行っている（次の節）。

## テストで合格を確かめる

段 1 の合格条件ごとに、合格を判定するテストを示す。`mise run verify` が緑なら、どれも通っている。

### 合格条件 1: `verify` がネットワークなしで通る

| テスト | 確かめること |
| --- | --- |
| [tests/unit/verify-offline-contract.test.ts](../../tests/unit/verify-offline-contract.test.ts) | `verify` の構成。6 つの検査がこの順に並び、ネットワークや install を必要とするものが入っていない |
| [tests/unit/network-guard.test.ts](../../tests/unit/network-guard.test.ts) | 単体テストから未モックの通信をすると失敗する |
| [tests/unit/gate-self-check.test.ts](../../tests/unit/gate-self-check.test.ts) | ゲートが空振りしない。Vitest と Playwright はテストの実行 0 件で失敗し、E2E は外部オリジンへの要求で失敗する |
| [tests/e2e/network-guard.smoke.spec.ts](../../tests/e2e/network-guard.smoke.spec.ts) | E2E でページが外部オリジンへ要求すると、それが記録されて遮断される |

### 合格条件 2: 秘密値を含む commit がフックで拒否される

| テスト | 確かめること |
| --- | --- |
| [tests/unit/gitleaks-pre-commit.test.ts](../../tests/unit/gitleaks-pre-commit.test.ts) | 一時リポジトリで、秘密値を含む commit が実際のフックで拒否され、値が出力に出ない。秘密値のない commit は通る |
| [tests/unit/hooks-config.test.ts](../../tests/unit/hooks-config.test.ts) | フックの構成。pre-commit の `secrets` ジョブが `check:secrets` と同じフラグを使い、ツールや lefthook がないとフックが失敗する |

1 つのファイルだけを実行するには、次のようにする。

```bash
pnpm exec vitest run tests/unit/gitleaks-pre-commit.test.ts
pnpm exec playwright test --grep @smoke
```

次の段（段 2）では、このゲートの上に最初の LLM 呼び出しを足す。
