# 001-dev-environment-and-gates — Discovery & Research Log

`/sdd-plan` で作成した調査記録。設計判断の根拠（実測と公式ドキュメント）と、実装時に追記する
検証記録の置き場を兼ねる。版番号はすべて**確認日つきの参考値**で、正本は `mise.toml`、
`package.json`、`pnpm-lock.yaml`（plan §2.1、憲章 原則 9）。

- 確認日: 2026-11-22（JST）。時刻つきの値は UTC。
- 実行環境: macOS（arm64）、mise 2026.11.12、ユーザー全体設定の Node 26.13.1 / pnpm 12.22.0。
- ZIP: `~/Downloads/genai-lab.zip`（SHA-256 `21ec78c32564cc2e8d9b388882e123a715475c9f41f4d6a59ca67810aa4e892b`）。
  scratchpad の専用ディレクトリに展開して読んだ。リポジトリには展開していない。

## Discovery type

New feature（full）。リポジトリにアプリコードがなく、ZIP 足場の取り込みとゲート一式を新設するため。

## Investigations

### I-1 ZIP 足場の構成と、spec 001 で取り込む範囲

- **Question**: ZIP に何が入っていて、Clarifications 1 問目（B: 基盤のみ）でどれを取り込むか。
- **Findings**: ZIP は 23 ファイル。基盤（`mise.toml`、`mise.node27.toml`、`package.json`、
  `pnpm-workspace.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、`next.config.ts`、
  `vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、`.github/workflows/ci.yml`、
  `README.md`）と、段 3〜6 のアプリコード（`src/app/{layout,page}.tsx`、`src/app/api/chat/route.ts`、
  `src/lib/ai/{agent,extract-task,model}.ts`）とテスト（`tests/unit/{agent-approval,extract-task}.test.ts`、
  `tests/e2e/chat.smoke.spec.ts`）。`security-daily.yml`、`dependabot.yml`、`model-allowlist.ts`、
  `check-model-ids` は ZIP に**ない**（plan §2.2・§3.2 で追加したもの）。
- **ZIP の基盤ファイルで plan §2.2 以外に直す必要があるもの**:
  - `mise.toml` の `verify` が `depends = ["check", "security"]`（mise は depends を並列実行する）で、
    security（ネットワーク必要）を含む → Clarifications 2 問目と 3.6 に反する。
  - `lefthook.yml` に commit-msg と `check:model-ids` がない（7.1・7.2）。`assert_lefthook_installed` が
    ない（I-4、7.7）。
  - `playwright.config.ts` が CI で `retries: 1`、`reuseExistingServer: !CI`、ポート 3000 → 憲章 原則 3
    （リトライで隠さない、決定論）に反する。
  - `ci.yml` が matrix 1 ジョブ（必須チェック名が `verify ()` / `verify (node27)` になる）、タグ指定の
    `uses:`、security を verify に含める前提。
  - `package.json` に AI SDK 一式と `@vitejs/plugin-react`（段 1 のコードは使わない）。
- **Evidence**: 展開先の全ファイルを読んだ（scratchpad `zip-extract/genai-lab/`）。

### I-2 採用候補の版と公開日時（24h ゲート）

- **Question**: 設計時点で、24h ゲート（`minimumReleaseAge: 1440`）を満たす候補版はどれか。
- **Findings**: 下表「External dependencies」のとおり。注意点:
  - **Next.js**: canary の最新 `16.5.0-canary.60`（2026-11-21T23:57Z）は確認時点で 24h 未満。
    24h を満たす最新は `16.5.0-canary.59`（2026-11-20T23:53Z）。canary はほぼ毎日出るため、実装時に
    改めて「24h を満たす最新」を選び、その公開日時を記録する（1.3）。
  - **TypeScript**: dist-tag は `beta = 7.1.0-beta`（2026-10-20）、`latest = 7.0.2`（stable）、
    `rc = 7.0.1-rc`（7.0 系の古い RC）。**7.1 の RC / stable は未公開** → 12.6 に該当し beta を据え置く
    （実装時に再確認、12.5 / 12.6）。`typescript@7.1.0-beta` は `bin.tsc` を持つ。
  - **jdx/mise-action**: 最新 `v5.3.0`（2026-11-21T17:01Z）は 24h 未満。`v5.2.10`（2026-11-18）が候補。
    Actions にも同じ 24h 規律を適用する（Dependabot の `cooldown` と揃える）。
  - **Node 27**: `27.0.0-alpha.0.1.1`（2026-11-17）が最新 alpha。ZIP の `27.0.0-alpha.0.1.0` より新しい。
- **Evidence**: `pnpm view <pkg> dist-tags --json`、`pnpm view <pkg> time --json`、
  `gh api repos/<owner>/<repo>/releases`（2026-11-22 実行）。

### I-3 mise: タスク、別名、環境ファイル、prerelease

- **Question**: verify の直列化、`gate` 別名、`:` を含むタスク名、`MISE_ENV=node27` の合成、Node 27 alpha
  の解決に追加設定が要るか。
- **Findings**:
  - `[tasks.verify] alias = "gate"` で `mise run gate` が verify を実行する。
  - `[tasks."check:model-ids"]` のような `:` 入りの名前で `mise run check:model-ids` が動く。
  - `run = [...]` の配列は先頭から直列に実行し、**最初の失敗で止まって非 0** を返す（後続を実行しない）。
  - `MISE_ENV=node27` で `mise.node27.toml` が `mise.toml` の上に合成され、node だけが上書きされる
    （`mise config ls` で両ファイルが読まれ、`mise ls --current node` が `27.0.0-alpha.0.1.1`）。
  - `mise ls-remote node` は `--prerelease` なしでも `27.0.0-alpha.*` を列挙する。`prereleases` は実在する
    mise 設定（既定 `false`）。exact 版を指定すれば `prereleases = false` のままで解決できた。
    **install（11.2）は未実行**で、実装時に確かめる。
- **Evidence**: scratchpad の probe（`probe-node-mise.sh`）出力:
  `mise run gate` → `[verify] $ node -v` / `v26.13.1`、失敗配列 → `exit=1`・後続の出力 0 件、
  `MISE_ENV=node27 mise ls --current node` → `27.0.0-alpha.0.1.1 (missing)`、
  `mise settings get prereleases` → `false`、`mise settings get no_such_setting_xyz` → `Unknown setting`。

### I-4 lefthook: ツール不在時のフックの終了コード（7.7）

- **Question**: mise を有効にしていない Git クライアントでフックが「省略して成功」にならないか。
- **Findings**:
  - lefthook 2.2.2 の生成フック（`internal/templates/hook.tmpl`）は、lefthook 本体が見つからないとき
    `echo "Can't find lefthook in PATH"` で終わり、**終了コード 0（検査なしで成功）** になる。
    `assert_lefthook_installed: true` のときだけ `exit 1` する。→ **7.7 には `assert_lefthook_installed: true`
    が必須**。
  - `lefthook install` は install 時の lefthook の絶対パス（`os.Executable()`、mise の install 先）をフックに
    埋め込む。PATH に lefthook がなくても本体は起動し、ジョブ側のツール（gitleaks 等）が見つからず
    失敗する。mise で lefthook を上げて旧版が消えると埋め込みパスが無効になり、PATH 探索に落ちる。
  - 実測（`assert_lefthook_installed: true`、`PATH=/usr/bin:/bin`）: 埋め込みパスあり → `exit=1`
    （gitleaks 不在でジョブ失敗）。埋め込みパスを無効化 → `Can't find lefthook in PATH` +
    `ERROR: Operation is aborted due to lefthook settings.` → `exit=1`。
  - 副作用: 探索の途中で `swift package --build-path .build/lefthook` が試され、作業ツリーに `.build/` が
    できることがある（実測）。`.gitignore` に追加する。
  - `LEFTHOOK=0` はフック全体を明示的に無効にする（回避手段。憲章 Additional Constraints の回避規律の対象）。
  - 追加の実測（2026-11-22、plan レビュー）: 一時リポジトリで生成したフック内の lefthook の絶対パスを
    存在しないパスに書き換え、`PATH=/usr/bin:/bin` で実行 → `assert_lefthook_installed: true` は exit 1
    （`Can't find lefthook in PATH` + `Operation is aborted`）、`false` は exit 0。`LEFTHOOK_BIN=/nonexistent` は
    フック先頭の分岐で直接実行されて 127 になり、assert の有無で差が出ない。stage されたファイルがないと
    ジョブは skip され exit 0（レビュアーの実測）。lefthook 2.2.2 は `lefthook.json` を設定として読む。
    → 7.7 の自動テストは「ファイルを stage」「埋め込みパスを書き換え」「assert=false の対照」で組む。
- **Evidence**: `gh api repos/evilmartians/lefthook/contents/internal/templates/hook.tmpl?ref=v2.2.2`、
  `docs/configuration/assert_lefthook_installed.md`（"When set to true, fail (with exit status 1) if lefthook
  executable can't be found"）、scratchpad の probe 出力。

### I-5 lefthook: 設定の機械可読な取得（8.3）

- **Question**: テストが `lefthook.yml` の secrets ジョブの引数を、YAML パーサーを依存に足さずに取得できるか。
- **Findings**: `lefthook dump --format=json`（2.2.2）は、`lefthook-local.yml` などを合成した**実際に使われる
  設定**を JSON で出力する。`pre-commit.jobs[].{name,run}`、`pre-push.piped`、`pre-commit.parallel`、
  `assert_lefthook_installed` を読める。→ YAML ライブラリを追加しない（憲章 原則 10）。
- **Evidence**: `lefthook dump --help`（`--format string 'yaml', 'toml', or 'json'`）と、probe 設定の
  `lefthook dump --format=json` 出力。

### I-6 gitleaks: staged 検査・全履歴・redact（3.12、8.x）

- **Question**: 一時リポジトリ（HEAD なし）で `gitleaks git --pre-commit --staged --redact` が期待どおりの
  終了コードを返し、出力に値を含めないか。現在の履歴に検出はあるか。
- **Findings**（gitleaks 8.30.1）:
  - HEAD のない新規リポジトリで、秘密値なしのファイルだけを stage → `exit=0`。
  - 実行時に組み立てた偽の GitHub PAT（`"gh" + "p_"` + 36 文字の乱数英数字）を stage → `exit=1`、
    `RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件。
  - 現リポジトリの全履歴 `gitleaks git --redact` → `6 commits scanned`、`no leaks found`。
  - `gitleaks git` の既定は `git log -p -U0 --full-history --all --diff-filter=tuxdb`（`--log-level debug` の
    `executing:` 行）で、**すべてのローカル ref（別ブランチ・stash）**を走査する。`--log-opts=HEAD` を付けると
    `git log -p -U0 HEAD` になり、HEAD から到達できるコミットだけを走査する（同じく 6 commits、検出なし、
    exit 0。2026-11-22 確認）。→ 3.7 の決定論のため verify の `check:secrets` は `--log-opts=HEAD` を使う
    （spec Clarifications「plan レビュー後の決定」）。
  - `--ignore-gitleaks-allow`（`gitleaks:allow` コメントを無視する）は 8.30.1 の `gitleaks git --help` にある。
    設定の探索順は `--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`。
  - mise のシムは、プロジェクトの `mise.toml` かグローバルで版が決まっていないと
    `No version is set for shim: gitleaks` で失敗する。テストは verify（`mise run test`）経由で
    mise 管理の PATH から gitleaks を呼ぶ前提にする。
  - git はフック実行中に `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスへ渡す。pre-push の Vitest が
    一時リポジトリで git を呼ぶとき、これを引き継ぐと**実リポジトリの index を操作する**おそれがある。
    → テストの子プロセス環境から `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`
    を設定する（plan の Error Handling に記載）。
- **Evidence**: scratchpad `probe-gitleaks.sh` の出力、`gitleaks git --redact --no-banner` の出力。

### I-7 Node 26: `.mjs` から `.ts` の import（`check:model-ids`）

- **Question**: `scripts/check-model-ids.mjs` が、ビルドなしで `src/lib/ai/model-allowlist.ts` を import
  できるか。
- **Findings**: Node 26.13.1 は型ストリップが既定で有効で、`as const` / `satisfies` / 型 export だけの
  `.ts` を `.mjs` から import でき、警告も出ない。`node:fs` の `globSync` も存在する。
  → allowlist の値を文字列解析せず、モジュールとして読む。allowlist は消去可能な構文だけで書く
  （`enum` などを使わない）。
- **Evidence**: probe 出力 `{"openai":["x-model-a"],"anthropic":["x-model-b"]}` / `function` / `exit=0`。

### I-8 pnpm 12: install スクリプト、release-age、audit、outdated

- **Question**: 1.4・1.5・1.8・4.2〜4.5・5.3 を満たす設定と終了コード。
- **Findings**（pnpm.io の docs、2026-11-22 の main）:
  - `strictDepBuilds` の既定は **`true`**: `allowBuilds` に載っていない install スクリプトがあると install が
    **非 0** で終わる。未記載のものは install 時に `pnpm-workspace.yaml` へプレースホルダーとして自動追記
    される。→ スクリプトを持つ依存を**すべて** `allowBuilds` に `true` / `false` で列挙し、理由をコメントで
    書く（1.5、1.8）。`onlyBuiltDependencies` などは v11 で削除済み。
  - `minimumReleaseAge` を明示すると `minimumReleaseAgeStrict` が既定 `true` になり、24h を満たす版が
    ないと解決自体が失敗する（黙って新しい版へ落ちない）。
  - `pnpm audit`: advisory が audit level 以上なら `exit 1`。`--ignore-registry-errors` を付けると registry
    の非 200 を成功扱いにする → **付けない**（4.4）。除外は `audit.ignore`（GHSA ID の一覧、
    `pnpm-workspace.yaml`）。旧 `auditConfig.ignoreGhsas` は非推奨。
  - `pnpm outdated`: **更新候補が 1 つでもあると `exit 1`**。→ outdated タスクの終了コードの意味を文書化する
    （5.3 は一覧の出力だけを求める）。
- **Evidence**: `pnpm/pnpm.io` の `docs/settings/build.md`（strictDepBuilds、allowBuilds）、
  `docs/settings/dependency-resolution.md`（minimumReleaseAge、minimumReleaseAgeStrict）、
  `docs/cli/audit.md`（exit code、`--ignore-registry-errors`、`audit.ignore`）、`docs/cli/outdated.md`。
  **registry 到達不能時の実際の終了コード（4.4）と、osv-scanner の同条件は実装時に実測する**。

### I-9 Biome 2.6.8: ルール名と preset

- **Question**: 2.2 の 3 ルールの所属グループと、ZIP の `linter.rules.preset` が有効な書き方か。
- **Findings**: `linter.rules.preset`（`recommended | all | none`、既定 `recommended`）が正式で、
  `linter.rules.recommended` は非推奨。`noUnusedVariables` / `noUnusedImports` は `correctness`、
  `noExplicitAny` は `suspicious` にある。→ 3 ルールを明示的に `"error"` にする（既定の重大度に依存しない）。
- **Evidence**: `biomejs/biome` タグ `@biomejs/biome@2.6.8` の
  `packages/@biomejs/biome/configuration_schema.json`。

### I-10 Vitest 5.1.1 / Playwright 1.65.1: 0 件時の挙動とリトライ

- **Question**: 3.8・3.9 を既定の挙動で満たせるか。
- **Findings**:
  - Vitest `passWithNoTests` の既定は `false`（テストファイルが見つからなければ失敗）。
  - Playwright は `--pass-with-no-tests` を付けたときだけ 0 件で成功する（既定は失敗）。
    `--fail-on-flaky-tests`、`forbidOnly`、`retries` が設定にある。
  - → 既定に頼りつつ、`vitest.config.ts` に `passWithNoTests: false` を明記し、実設定を使う自己検査テストで
    回帰を検出する。
- **Evidence**: `vitest-dev/vitest@v5.1.1` の `docs/config/passwithnotests.md`、
  `microsoft/playwright@v1.65.1` の `docs/src/test-cli-js.md`（`--pass-with-no-tests`）と
  `docs/src/test-api/class-testconfig.md`。

### I-11 Next.js 16.5 canary: 型生成と tsconfig

- **Question**: `tsc --noEmit` を `next dev` の実行有無に左右されず決定論的にできるか。
- **Findings**: `next typegen` は `.next/types` と `next-env.d.ts` を生成し、dev サーバーが動いていなければ
  `.next/dev/types` を削除する。公式手順は `next typegen && tsc --noEmit`。`next-env.d.ts` は
  `.gitignore` に入れる。`next dev` / `next build` は `tsconfig.json` に推奨値を書き足すことがある →
  取り込み時に一度 `next dev` を起動して書き足しを受け入れ、verify 後に作業ツリーが変わらないことを
  確かめる（CI でも検査する）。
- **Evidence**: `vercel/next.js@v16.5.0-canary.59` の `docs/01-app/03-api-reference/06-cli/next.mdx`
  （`next typegen` の節）と `docs/01-app/03-api-reference/05-config/02-typescript.mdx`（`next-env.d.ts`）。
  `next@16.5.0-canary.59` の peerDependencies は `react` / `react-dom` が `^18.2.0 || ^19.0.0` で
  `typescript` を含まない。

### I-12 Dependabot: cooldown と pnpm 12

- **Question**: 10.11・10.12 を満たす設定があるか。pnpm 12 の lockfile を扱えるか。
- **Findings**: `cooldown.default-days` で公開からの待機日数を指定できる（npm と GitHub Actions で対応）。
  指定しない場合も既定で 3 日の cooldown がかかるが、本リポジトリは 24h 規律を明示するため
  `default-days: 1` を書く。cooldown は version updates にだけ効き、security updates には効かない。
  supported ecosystems の表で pnpm は v12 まで対応（feature flag 付きの記述）。mise.toml のツールは
  Dependabot の対象外 → `mise run outdated` で週次に確認する。
- **Evidence**: `github/docs` の
  `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`（`cooldown` 節）と
  `supported-ecosystems-and-repositories.md`（pnpm 行）。

### I-13 GitHub リポジトリ設定（10.2）

- **Question**: verify 失敗時のマージブロックに、リポジトリ側の設定が要るか。
- **Findings**: ruleset `protect-main`（id 27838452、対象 `~DEFAULT_BRANCH`）があるが `enforcement: disabled`
  で、`required_status_checks` を持たない。→ 10.2 には ruleset の有効化と必須チェック `verify` の追加が
  要る。リポジトリ外の設定変更なので、実装時に内容を示してユーザーの確認を得てから行う。
- **Evidence**: `gh api repos/Fukuchan77/genai-lab-ts/rulesets/27838452`。

### I-14 モデル ID の命名形式（6.4）

- **Question**: allowlist 未登録の ID を検出するための、プロバイダごとの命名形式。
- **Findings**: Web 検索のスニペットでは、OpenAI は `gpt-<数字>…`（`-sol` / `-luna` などの接尾辞を含む）と
  `o<数字>…`、Google は `gemini-<数字>…`、Anthropic は `claude-<ファミリー>-<数字>…` の形式が使われている。
  検索結果は版の記述が食い違っており、**具体的な ID は採用根拠にしない**。allowlist に登録する ID は、
  実装時に各プロバイダの公式ドキュメント（OpenAI models、Anthropic models overview、Gemini API models、
  Ollama library）で存在を確認して記録する（6.2）。
- **Evidence**: WebSearch（developers.openai.com/api/docs/models、ai.google.dev/gemini-api/docs/models の
  検索結果）。公式ページの本文確認は実装時。

### I-15 実行 0 件の検出: Biome / Vitest / Playwright の実測（3.8、3.9、plan 検証 round 2）

- **Question**: Biome 2.6.8 に `suspicious.noSkippedTests` があるか、何を検出するか。Vitest 5.1.1 と Playwright
  1.65.1 で、「全部 skip / todo」の実行は何で止まるか。
- **Findings**（使い捨てディレクトリで `pnpm add --save-exact`、2026-11-23 実測）:
  - Biome 2.6.8: `configuration_schema.json` に `noSkippedTests` がある。`it.skip(…)`、`describe.skip(…)`、
    テスト本体内の `test.skip(true, …)` を `lint/suspicious/noSkippedTests`（FIXABLE、error）で検出する。
    **`it.todo(…)` と `test.info().skip(…)` は検出しない**。
  - Vitest 5.1.1: `include` を絞った設定で `it.todo` だけ → **exit 0**（"1 todo"）。reporter なしでは実行 0 件を
    止められない。`.ts` の custom reporter（`vitest/node` の `Reporter`、`onTestRunEnd` で `allTests()` の
    `result().state` を数え、0 件なら `process.exitCode = 1`）は、`it.todo` のみ → 1、`it.skip` のみ → 1、
    1 件通る → 0 だった。
  - Playwright 1.65.1: `@smoke` のテストが全部 skip → reporter なしで **exit 0**。`.mjs` の custom reporter
    （`onTestEnd` で `status !== "skipped"` を数え、`onEnd` で `{ status: "failed" }` を返す）で exit 1、1 件通る
    → exit 0。`--grep` が一致 0 件 → `Error: No tests found`、exit 1。`--list` も同じ（一致 0 件で exit 1、
    一致ありで exit 0）。**設定の reporter は `--list` でも `onTestEnd` を呼ばれず実行 0 件として exit 1 に
    なる**ため、`--list` を使う検査は `--reporter=list` で上書きする（上書きすると exit 0 / 1 が一致の有無に
    従う）。`--list` は `webServer` を起動しない（起動コマンドが書くファイルができなかった）。
  - `.ts` の Playwright reporter の読み込みは**未実測**（`.mjs` で確認）。
- **Evidence**: 使い捨てディレクトリ（コミットしない）での実行出力。Biome のルールは
  `@biomejs/biome@2.6.8` の `configuration_schema.json`。公式ドキュメントでの確認は実装時（R-9）。

### I-16 子プロセスのツール解決と mise タスクの形（plan 検証 round 2）

- **Question**: `isolatedEnv()` の PATH とツール解決で、テストの子プロセスが起動できるか。`mise tasks ls --json` の
  `run` はどんな形か。
- **Findings**（2026-11-23 実測、mise 2026.11.12 / pnpm 12.22.0 / macOS）:
  - `env -i PATH=/usr/bin:/bin node -v` → `No such file or directory`、exit 127。`node_modules/.bin/vitest` は
    shebang のシェルスクリプトで、`pnpm` のディレクトリ + `/usr/bin:/bin` の PATH では `exec: node: not found`。
    node のディレクトリを PATH に足すと起動する。`pnpm` 本体は単体のバイナリ（Mach-O）で node に依存しない。
  - `git` は mise で管理しない（`[tools]` の 5 ツールに入れない）。この開発機の `git` は PATH 上の
    `/opt/homebrew/bin/git`（`/usr/bin/git` もある）。mise のプロジェクト設定がない状態で `mise which git` は
    exit 1。→ `resolveTool("git")` は `mise which` に頼れず、PATH から探す。
  - `mise tasks ls --json`: `run = [{ task = "a" }, { task = "b" }]` → `[{"task":"a"},{"task":"b"}]`、
    `run = ["mise run a", "mise run b"]` → 文字列の配列、`run = "pnpm exec vitest run"` → `["pnpm exec vitest run"]`
    （単一の文字列も配列）。
- **Evidence**: 使い捨てディレクトリでの実行出力。
- **Implication**: plan C6 の `isolatedEnv()` は `dirname(process.execPath)` を PATH の先頭に置き、
  `resolveTool` は mise 管理のツールと OS 付属の `git` を別の経路で解決する。「非 0」だけの assert は ENOENT /
  127 でも通るので、`expectGateFailure` で理由を確かめる。

### I-18 `next dev` が AGENTS.md を書き換える仕組みと、Partial Prefetching の警告（2026-11-23、ユーザーの決定）

- **Question**: `next dev` が `AGENTS.md` に追記した 2 ブロック（`nextjs-agent-rules`、`nextjs-agent-upgrade`）と、起動時の
  `cacheComponents` / `partialPrefetching` の警告をどう扱うか。
- **Findings**（Next.js 16.5.0-canary.60 に同梱のドキュメントとソース）:
  - 2 ブロックは `agentRules`（既定で有効）と `experimental.agentUpgrade`（既定 `"security"`）が書く。16.5.0 から
    **`next dev` の起動ごとに同期**し、手で消しても次の起動で戻る（`docs/…/next-config-js/agentRules.md`、`agentUpgrade.md` の
    Version History。`dist/server/lib/generate-agent-files.js`）。`agentRules: false` と `experimental.agentUpgrade: false` を
    設定すると、次の `next dev` がブロックを取り除き、ほかの内容は残す。
  - `cacheComponents` を `partialPrefetching` なしで有効にすると、起動時に `true` か `false` を設定するよう警告が出る。`false` は
    「段階的に移行する間、以前の prefetch の挙動を保つ」ための値で、ルートごとに `export const prefetch = 'partial'` で移行し、
    全ルートが済んだらグローバルの値を `true` にして、ルートごとの export を codemod で消す
    （`docs/01-app/02-guides/adopting-partial-prefetching.md` の「Adopting incrementally」、
    `docs/…/route-segment-config/prefetch.md`）。
  - 起動時に `Route / is rendering with server caches disabled` も出るが、これは開発サーバーで、要求の `cache-control: no-cache`
    などでキャッシュを迂回したときの表示（`dist/server/app-render/app-render.js` の `isBypassingCachesInDev`）。設定の不備ではない。
- **決定（ユーザー）**: `AGENTS.md` のブロックは、必要な情報を適切な節に残し、不要なコメントは消す。`next.config.ts` は
  `partialPrefetching: false` のまま、対応できたルートを 1 つずつ有効にする。
- **実装**: `next.config.ts` に `partialPrefetching: false`、`agentRules: false`、`experimental.agentUpgrade: false` を足した（それぞれに
  理由のコメント）。`AGENTS.md` からマーカーつきの 2 ブロックを消し、案内の要点（同梱のドキュメントを先に読む・非推奨の
  告知に従う）と、版上げの経路（週次の `mise run outdated` と `build(deps):` の commit。`next upgrade` は使わない）を
  「Scope and dependencies」節に移した。`next upgrade` の使い分けは私の判断で、ユーザーの指示の範囲に入るかは要確認。
- **Evidence**: 変更後に `mise run e2e`（`next dev` を起動）を実行し、`AGENTS.md` の SHA-256 が前後で同一（ブロックが戻らない）、
  `partialPrefetching` の警告が出ないことを確かめた。`repo-policy.test.ts` に 4 件の検査を足した（R-10）。

### I-19 Dependabot の設定（タスク 8.3、2026-11-23）

- **Question**: 10.11（npm と GitHub Actions の週次の更新提案）と 10.12（公開から 24 時間未満の版を提案しない）を満たす書き方。
- **Findings**（`github/docs` の `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`、
  `gh api` で取得）:
  - `cooldown.default-days` は公開からの待機日数。cooldown 対応の表に「NPM and Yarn」と GitHub Actions があり、どちらも
    `default-days` に対応する（SemVer ごとの日数は npm だけ）。未設定でも既定で 3 日の cooldown がかかるが、24h 規律を明示する
    ため `1` を書く。**cooldown は version updates にだけ効き、security updates には効かない**。
  - `commit-message.prefix` は、末尾が英字なら Dependabot がコロンを足す。`include: "scope"` は `(deps)` のような scope を付ける
    → `build(deps): …` になる。
  - `groups.<IDENTIFIER>.patterns` に一致した更新は 1 つの PR にまとまる。`"*"` で npm の全依存。
  - pnpm は `package-ecosystem: "npm"` で扱われ、pnpm v12 も対応表にある（feature flag 付きの表記）。
- **Evidence**: 参照ドキュメントの該当節（`commit-message`、`cooldown`、`groups`、supported ecosystems の表）を読んだ。GitHub が
  実際に設定を受理するか（スキーマの有効性）は、既定ブランチに入った後の Insights で確かめる（タスク 12.7）。

### I-17 入れ子実行の baseURL・argv・環境変数（plan 検証 round 4）

- **Question**: `baseURL` を持たない入れ子の Playwright 設定で E2E の通信ガードが働くか。同じフラグを重ねた
  argv はどう解釈されるか。外側の Vitest ワーカーから入れ子のランナーへ何が渡り、出力の一致判定に影響するか。
- **Findings**（使い捨てディレクトリ、Playwright 1.65.1 / Vitest 5.1.1 / chromium、macOS、2026-11-23 実測）:
  - `webServer` も `use.baseURL` もない設定の auto fixture で `baseURL` は `undefined`。`context.route("**/*")` は
    `page.setContent('<img src="https://….invalid/…">')` の画像要求とページ内の `fetch` の 2 件を捕まえ、
    `fetch` は `TypeError: Failed to fetch` で reject した。比較を `baseURL !== undefined && 同一オリジン` と書けば
    すべて遮断になる。
  - `playwright test --grep @smoke --grep @nomatch` → 0 件（`Error: No tests found`、exit 1）。逆順は `@smoke` の
    1 件。`--config A --config B` は B を使う。→ 同じフラグは最後の値が効く（文書化された挙動ではない）。
  - 外側の Vitest テストから `env: process.env` で起動した子に、`TEST=true`、`VITEST=true`、`NODE_ENV=test`、
    `VITEST_MODE=RUN`、`VITEST_POOL_ID=1`、`VITEST_WORKER_ID=1` が渡った（入れ子の実行自体は exit 0）。
  - `FORCE_COLOR=1` / `FORCE_COLOR=0` のどちらでも Vitest の出力に ANSI のエスケープが入り（26 か所）、
    `NO_COLOR=1` を足しても変わらない。`FORCE_COLOR` と `NO_COLOR` を両方とも設定しない場合、Vitest・Playwright
    のどちらも 0 か所。ANSI があっても `No test files found` の部分一致は成立した。
- **Evidence**: 使い捨てディレクトリでの実行出力（コミットしない）。
- **Implication**: plan C7 の fixture は `baseURL` 未定義ですべてを遮断する。C6 の `editArgv` は `--config` を
  追加・`--grep` / `--reporter` を置き換えて各 1 個にする。`isolatedEnv({ nested: true })` は `VITEST*`・`TEST`・
  `FORCE_COLOR`・`NODE_ENV` を除く。

## Existing patterns to reuse

| Pattern | Location | Why reuse |
|---------|----------|-----------|
| ZIP の基盤ファイル | `genai-lab.zip` の `mise.toml` ほか | spec の Scope が「取り込みと §2.2 の修正」と定める |
| `mise.<env>.toml` の差分構成 | ZIP の `mise.node27.toml` | I-3 で合成を確認済み。node だけを上書きできる |
| Playwright `page.route` による SSE モック | ZIP の `tests/e2e/chat.smoke.spec.ts` | 段 3 で使う。段 1 は ZIP 検証（12.4）の対象として実行だけする |
| 検証記録の見出し（結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順） | plan §3.3（next-agentic-stack の形式） | 11.5 が同じ見出しを求める。本文は複製しない |
| Conventional Commits の type 一覧 | sdd-tdd-kit の committing-changes（plan §4） | commit-msg 検査の語彙を揃える。実装はリポジトリ内の小さなスクリプト |

## External dependencies

設計時点（2026-11-22）の候補。実装時に「24h を満たす版」を改めて確認し、採用版と公開日時を
「実装時の記録 R-1」に書く（1.3）。

| Dependency | Version（候補） | Published（UTC） | Purpose | Verified |
|------------|-----------------|------------------|---------|----------|
| Node.js | 26.13.1 | 2026-11-11T16:44Z | 既定レーン | mise ls-remote / GitHub release |
| Node.js（alpha） | 27.0.0-alpha.0.1.1 | 2026-11-17T03:48Z | Node 27 レーン | mise ls-remote（install は実装時） |
| pnpm | 12.22.0 | 2026-11-17T20:20Z | パッケージ管理 | GitHub release |
| lefthook | 2.2.2 | 2026-10-13T09:20Z | Git フック | probe で install・dump・hook 実行 |
| gitleaks | 8.30.1 | 2026-03-21T02:17Z | シークレットスキャン | probe で staged / 全履歴を実行 |
| osv-scanner | 2.7.1 | 2026-11-09T04:15Z | OSV 脆弱性検査 | GitHub release（実行は実装時） |
| next | 16.5.0-canary.59 | 2026-11-20T23:53Z | プレースホルダーページ・E2E の webServer | npm time（canary.60 は 24h 未満） |
| react / react-dom | 19.3.1 | 2026-10-14 | 同上 | npm time |
| typescript | 7.1.0-beta | 2026-10-20T16:45Z | 型検査（`tsc`） | npm time・`bin.tsc` |
| @types/node | 26.6.6 | 2026-10-28 | Node 型 | npm time |
| @types/react / @types/react-dom | 19.3.0 | 2026-09-09 | React 型 | npm time |
| @biomejs/biome | 2.6.8 | 2026-11-15T14:34Z | lint / format | npm time・schema |
| vitest | 5.1.1 | 2026-11-18T07:35Z | unit テスト | npm time・docs |
| @playwright/test | 1.65.1 | 2026-11-13T21:12Z | E2E テスト | npm time・docs |
| actions/checkout | v7.0.1 | 2026-07-20 | CI | GitHub release（SHA は実装時に解決） |
| jdx/mise-action | v5.2.10 | 2026-11-18 | CI でツールを install | GitHub release（v5.3.0 は 24h 未満） |

段 1 では使わないため**入れない**依存（ADR-4）: `ai`、`@ai-sdk/*`、`zod`、`@vitejs/plugin-react`、
`server-only`。ZIP 検証（12.2〜12.4）の使い捨て環境でだけ入れる。

## Architecture decisions

### ADR-1: verify はタスクの直列チェーンにする

- **Context**: ZIP の verify は `depends` による並列実行で、ネットワークが必要な security を含む。
  `next typegen`（typecheck）と `next dev`（E2E）が `.next/` を同時に書く競合もある。3.6・3.7 と
  Clarifications 2 問目がある。
- **Decision**: `verify` は `run` 配列で `check` → `typecheck` → `check:model-ids` → `check:secrets` →
  `test` → `e2e` を直列に呼ぶ。最初の失敗で止まり非 0（I-3）。`gate` は `alias`。security は別タスク。
- **Alternatives**: `depends` で並列（速いが、出力が混ざり、`.next/` の競合で決定論を損なう）。
  ZIP どおり security を含める（オフラインで失敗し 3.5・3.6 に反する）。
- **Consequences**: 実行時間は並列より長い。所要時間は NFR として実測して記録する。

### ADR-2: フックは mise タスクを呼び、staged 専用の 2 ジョブだけ素のコマンドにする

- **Context**: 7.8 はフックと verify / security が同じ検査対象・判定基準を使うことを求める。8.3 はテストが
  secrets ジョブの引数を `lefthook.yml` から取ることを求める。
- **Decision**: `typecheck`、`check:model-ids`、`security:osv`、`security:audit`、`test`、`e2e` のジョブは
  `mise run <task>` を呼ぶ。staged 専用の `gitleaks git --pre-commit --staged --redact --verbose` と
  `pnpm exec biome check --staged …` だけを素のコマンドにする（gitleaks には plan レビュー後に
  `--ignore-gitleaks-allow` を加えた）。設定テストが、各ジョブの参照するタスクが
  `mise.toml` に実在することを確かめる。
- **Alternatives**: 全ジョブに素のコマンドを書く（ZIP。verify との二重定義になり、ずれても気づけない）。
- **Consequences**: フックの実行に mise が必須になる（7.7 の前提と一致。README に明記、13.4）。

### ADR-3: `assert_lefthook_installed: true` を設定する

- **Context**: I-4 のとおり、既定ではフックが lefthook を見つけられないと終了コード 0 で通過する。
- **Decision**: `lefthook.yml` の先頭に `assert_lefthook_installed: true`。設定テストでこの値を検査し、
  最小の PATH でフックが非 0 になることを自動テストで確かめる。
- **Alternatives**: `.githooks/` の自前スクリプト（D4 に反する）。README の注意だけ（7.7 を満たさない）。
- **Consequences**: lefthook を消した環境では commit / push ができない。回避は `--no-verify` / `LEFTHOOK=0`
  で、憲章の回避規律（環境要因の証明と PR 本文への記録）に従う。

### ADR-4: package.json には段 1 のコードが使う依存だけを入れる

- **Context**: Clarifications 1 問目で、ZIP のアプリコードは取り込まない。ZIP の package.json は AI SDK、
  プロバイダ 4 種、Zod、`@vitejs/plugin-react` を含む。
- **Decision**: dependencies は `next`、`react`、`react-dom`。devDependencies は `@biomejs/biome`、
  `@playwright/test`、`@types/node`、`@types/react`、`@types/react-dom`、`typescript`、`vitest`。
  AI SDK・プロバイダ・Zod・`server-only` は、最初に import する段（002 以降）の plan で宣言して入れる。
  ZIP の全依存は使い捨て環境（ADR-9）でだけ入れ、その版と結果を各段へ引き継ぐ。
- **Alternatives**: ZIP の依存をすべて今入れる（使わない依存が audit の対象と攻撃面を増やし、実際に使う段の
  時点では pin が古くなる。plan §2.1 の「現時点の採用版」の考え方に合わない）。
- **Consequences**: plan §2 の技術スタック表の AI 行は段 002 以降で満たされる。plan §8.5 の改訂注記
  （13.10）にこの扱いを書く。**設計承認時に確認してほしい判断**。

### ADR-5: 未モック通信の遮断は依存を足さずに実装する

- **Context**: 3.10・3.11・9.5。MSW などは新しい依存になる（原則 10）。HTTP クライアントだけを差し替えると、
  `node:net` を直接使う経路が漏れる。
- **Decision**:
  - unit: Vitest の `setupFiles`（`tests/unit/setup/network-guard.ts`）で `net.Socket.prototype.connect` と
    `globalThis.fetch` を置き換え、呼ばれたら `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で
    違反があればそのテストを失敗させる（呼び出し側が例外を握りつぶしても失敗する）。
  - E2E: `tests/e2e/fixtures.ts` の auto fixture が `context.route("**/*")` で全リクエストを受け、
    テスト対象のオリジン以外を `abort` して記録し、teardown で違反があれば失敗させる。テスト個別の
    `page.route` のモックは context の route より優先されるので、モック済みの通信は fixture に届かない。
    E2E は `@playwright/test` ではなく `fixtures.ts` から `test` を import する（Biome の
    `noRestrictedImports` で強制）。
- **Alternatives**: MSW の `onUnhandledRequest: "error"`（依存追加、`net` 直叩きを捕まえない）。
  Playwright の `--offline` 相当の context 設定（同一オリジンの dev サーバーまで止まる）。
- **Consequences**: unit テストはローカルホストを含む全ソケット接続を禁止する。将来ソケットが必要な段は、
  その段の plan で例外の仕組みを宣言する。

### ADR-6: `check:model-ids` は git の追跡対象＋未追跡（ignore 以外）を走査する

- **Context**: 6.3〜6.7。開発者は `.env.local` に実際のモデル ID を書く（gitignore 済み）。単純なファイル
  走査だと、それを検出してローカルで失敗し、`node_modules` も辿る。
- **Decision**: `git -C <root> ls-files --cached --others --exclude-standard` で候補を列挙し、走査対象の
  規則（6.5）と除外（allowlist ファイル、`tests/fixtures/**`）で絞る。検出は「allowlist の全 ID」＋
  「プロバイダ命名形式の正規表現」。allowlist は Node の型ストリップで import する（I-7）。
- **Alternatives**: `fs.globSync` での走査（ignore 済みの秘密ファイルまで読む）。allowlist を正規表現で
  文字列解析（書式の変更で壊れる）。
- **Consequences**: git が必要（全環境にある）。テストは一時ディレクトリを `git init` して入力を置く。

### ADR-7: CI は verify と verify-node27 を別ジョブにする

- **Context**: 10.1〜10.4。ZIP の matrix だと必須チェック名が `verify ()` になり、ruleset で指定しにくい。
  週次 schedule は Node 27 レーンだけに要る。
- **Decision**: `verify`（既定レーン、verify + security、必須）と `verify-node27`（`MISE_ENV=node27`、
  verify のみ、`continue-on-error: true`）を別ジョブにする。`verify` は `schedule` では動かさない。
  日次の security は別ワークフロー `security-daily.yml`。
- **Alternatives**: matrix（チェック名が不安定、`continue-on-error` の式が読みにくい）。
- **Consequences**: ステップが 2 ジョブで重複する。重複は 6 ステップ程度で、composite action は作らない。

### ADR-8: commit-msg はリポジトリ内のスクリプトで検査する

- **Context**: 7.4。commitlint は依存が多い（原則 10）。
- **Decision**: `scripts/check-commit-msg.mjs <msg-file>` が 1 行目を Conventional Commits の正規表現で
  検査する。git が生成する `Merge …` / `Revert "…"` と `fixup!` / `squash!` / `amend!` は通す。
- **Alternatives**: `@commitlint/cli` + `@commitlint/config-conventional`。
- **Consequences**: 規則の範囲は 1 行目の形式に限る（本文・フッターの書式は検査しない）。

### ADR-9: ZIP のアプリコードは使い捨て環境で検証する

- **Context**: Requirement 12。ZIP のアプリコードは `src/` / `tests/` に入れない（12.7）。
- **Decision**: リポジトリ外の一時ディレクトリに ZIP を展開し、`package.json` の dist-tag と範囲を
  24h を満たす exact 版に置き換えて install し、`tsc --noEmit`、型定義の API 名の照合、unit テスト、
  E2E smoke を実行する。結果は「実装時の記録 R-6」に、ファイルごと・API ごとに書く。使い捨て環境の
  成果物はコミットしない。
- **Alternatives**: リポジトリ内の一時ブランチ（ZIP のコードが履歴に残り、12.7 の趣旨に反する）。
- **Consequences**: 手順は再現手順として記録し、段 003〜006 の spec が参照する。

## Risks & open questions

- ⚠️ Next.js canary はほぼ毎日出る。canary の変更で `next typegen` や `next dev` の挙動が変わりうる —
  mitigation: exact pin、週次の `mise run outdated`、CI の「verify 後に作業ツリーが変わらない」検査。
- ⚠️ TypeScript 7.1 beta（Go ネイティブ）は Next.js の tsconfig 書き足しや language service plugin
  （`plugins: [{ "name": "next" }]`）を解釈しない可能性がある — mitigation: `tsc --noEmit` が通ることを
  実装時に確認し、効かない設定は理由を記録して外す。
- ⚠️ `net.Socket.prototype.connect` の置き換えが Vitest のワーカー通信を妨げる可能性 — mitigation:
  実装時に `pool` の既定で確認する。妨げる場合は置き換えをテスト本体の実行時だけに限る。
- ✅ （plan レビューで解消）E2E ガードの自己検査は `test.fail()` を使わず、`failOnBlockedRequest: false` と
  `blockedRequests` の assert で行う（`test.fail()` は失敗の原因を区別しないため）。teardown で失敗する経路は
  R-10 に記録する。
- ✅ （round 2 で解消）`playwright test --list` は 0 件で exit 1、webServer を起動しない（I-15）。ただし
  設定の reporter が `--list` でも実行 0 件として失敗するので、`--reporter=list` で上書きして使う。
- ⚠️ Node 27 alpha の install（11.2）と、Node 27 で Next canary / TS 7.1 beta が動くか — mitigation:
  失敗でも記録すれば完了条件を満たす（11.3、11.6）。
- ⚠️ ruleset の変更（10.2）はリポジトリ外の設定 — mitigation: 実装時に差分を示して確認を取る。
- ✅ （round 2 で解消）Vitest 5.1.1 の custom reporter は `onTestRunEnd` で `process.exitCode = 1` にして実行全体を
  非 0 にできる。Playwright の reporter `onEnd` は `{ status: "failed" }` を返すと exit 1 になる（I-15。
  Playwright の `.ts` reporter の読み込みだけ未実測で、実装時に R-9 で確かめる）。
- ❓ 入れ子の Playwright 実行（`webServer` なし）で、`page.setContent` から出る外部要求を `context.route` が
  捕まえるか — to resolve in: 実装（R-9。成り立たない場合の代替は plan C12 に記載）。
- ❓ allowlist に登録する具体的なモデル ID — to resolve in: 実装（6.2、公式ドキュメントで確認）。
- ❓ `pnpm audit` / osv-scanner の registry 到達不能時の終了コード（4.4） — to resolve in: 実装
  （プロキシを到達不能なポートに向けて実測）。
- ❓ install スクリプトを持つ依存の一覧（`allowBuilds` の中身） — to resolve in: 実装（`pnpm install` の
  `Ignored build scripts` 出力）。

## 実装時の記録（/sdd-impl で追記）

各記録は、実行したコマンド、結果、根拠（公式ドキュメントの参照先と実行出力）、確認日を持つ。

- **R-1 採用版と公開日時**（1.1〜1.3、1.6、1.7）: 採用した全依存・ツール・Actions の版、公開日時、確認日。

  **`mise run runtime` の実出力（タスク 7.3、2026-11-23、5.1）**: 終了コード 0。`node` v26.13.1、`pnpm` 12.22.0、TypeScript
  `Version 7.1.0-beta`、Next.js `v16.5.0-canary.60`、lefthook 2.2.2、gitleaks 8.30.1、osv-scanner 2.7.1（osv-scalibr 0.5.3）。
  **`mise run outdated` の実出力（5.3）**: 終了コード 0。`mise All tools are up to date`（`mise outdated --bump` で範囲外の
  新版を見られる旨も表示）。`pnpm outdated` は何も出力せず exit 0。この時点で、固定した npm 依存に更新候補はない
  （24 時間未満の版は pnpm の `minimumReleaseAge` が候補から外す）。**候補がある場合に `pnpm outdated` が exit 1 に
  なることは、この実行では確かめていない**（I-8 の公式ドキュメントの記述のまま）。
  **`outdated` が何も書かないこと（5.4）**: 実行の前後で `git status --porcelain`、`git diff --stat`、`package.json`・
  `pnpm-lock.yaml`・`mise.toml` の SHA-256 がいずれも同一だった。

  **ツール（タスク 1.1、確認日 2026-11-23 06:03Z）**。取得は `mise ls-remote node`、
  `pnpm view pnpm time --json`、`gh api repos/<owner>/<repo>/releases`。公開から 24 時間以上のものだけを採用した。

  | Tool | 採用版 | 公開（UTC） | 経過 | 備考 |
  |------|--------|-------------|------|------|
  | node | 26.13.1 | 2026-11-11T16:44Z | 11 日 | 26 LTS 系列の最新 |
  | pnpm | 12.22.0 | 2026-11-17T20:01Z | 5 日 | 12.23.0（2026-11-22T13:21Z）は 24 時間未満のため見送り |
  | node（Node 27 レーン） | 27.0.0-alpha.0.1.1 | 2026-11-17T03:48Z | 6 日 | `mise.node27.toml`。タスク 9.1 で採用（R-8） |
  | lefthook | 2.2.2 | 2026-10-13T09:20Z | 41 日 | 最新 |
  | gitleaks | 8.30.1 | 2026-03-21T02:17Z | 247 日 | 最新 |
  | osv-scanner | 2.7.1 | 2026-11-09T04:15Z | 14 日 | 最新 |

  確認（2026-11-23）: ユーザーが `mise trust` と `mise install` を実行済み。`mise ls --current --json` で 5 ツール
  すべてが `source.path` = リポジトリの `mise.toml`、`requested_version` = exact、`installed = true`。
  `node -v` → v26.13.1、`pnpm -v` → 12.22.0、`lefthook version` → 2.2.2、`gitleaks version` → 8.30.1、
  `osv-scanner --version` → 2.7.1。
  （`mise ls --json` はツール名をキーにした辞書で返る。後続のテストもこの形で読む。）

  **npm 依存（タスク 1.2、確認日 2026-11-23 06:10Z）**。取得は `pnpm view <pkg> time --json`。24 時間以上経った最新版を
  semver 順で選んだ（公開日時順だとバックポートの react 19.1.10 を拾うため、react 系は `dist-tags.latest` で確認）。

  | Package | 採用版 | 公開（UTC） | 備考 |
  |---------|--------|-------------|------|
  | next | 16.5.0-canary.60 | 2026-11-21T23:57Z | canary.61（2026-11-22T23:56Z）は 24 時間未満のため見送り |
  | react / react-dom | 19.3.1 | 2026-10-14T16:47Z / 16:49Z | `latest` と一致 |
  | @biomejs/biome | 2.6.8 | 2026-11-15T14:34Z | |
  | @playwright/test | 1.65.1 | 2026-11-13T21:12Z | |
  | @types/node | 26.6.6 | 2026-10-28T18:36Z | |
  | @types/react / @types/react-dom | 19.3.0 | 2026-09-09T18:08Z / 18:07Z | |
  | typescript | 7.1.0-beta | 2026-10-20T16:45Z | 7.1 の RC / stable は未公開（R-7） |
  | vitest | 5.1.1 | 2026-11-18T07:35Z | |

  `engines.node` の下限は `>=26.13.1`（mise の node と同じ採用版）。

  **GitHub Actions と CI の mise（タスク 8.1、確認日 2026-11-23 12:31Z）**。取得は `gh api repos/<owner>/<repo>/releases` と
  `gh api repos/<owner>/<repo>/git/ref/tags/<tag>`（軽量タグで、オブジェクトが直接 commit を指す）。

  | 対象 | 採用 | 公開（UTC） | 経過 | 固定した SHA |
  |------|------|-------------|------|--------------|
  | actions/checkout | v7.0.1 | 2026-07-20T15:10Z | 約 126 日 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
  | jdx/mise-action | v5.3.0 | 2026-11-21T17:01Z | 43.5 時間 | `924e7c586e33d7d4bae9c14e26c5d22e2beb6e78` |
  | mise 本体（mise-action の `version`） | 2026.11.12 | 2026-11-21T11:26Z | 49.1 時間 | （版で指定。手元の mise と同じ） |

  設計時（I-2）は mise-action の最新 v5.3.0 が 24 時間未満で、v5.2.10 を候補にしていた。実装時の確認で v5.3.0 が 24 時間を
  超えていたため、24h 規律に従い最新の v5.3.0 を採用した。mise-action v5.3.0 の入力には `minimum_release_age`（既定 `24h`）がある。
  **最終確認（タスク 11.4、確認日 2026-11-25T11:52Z）**: 採用した全版を取り直した。取得は `pnpm view <pkg>@<ver> time --json`
  （package.json の 10 件と pnpm）、`gh api repos/<owner>/<repo>/releases/tags/<tag> --jq .published_at`（node 2 系列、lefthook、
  gitleaks、osv-scanner、actions/checkout、jdx/mise-action、mise 本体）、`gh api repos/<owner>/<repo>/git/ref/tags/<tag>`（Actions の SHA）。
  **すべて公開から 24 時間以上で、公開日時は上の表と一致した**（取り下げ・再公開なし）。経過が最も短いのは next
  16.5.0-canary.60（83.9 時間）、次いで jdx/mise-action v5.3.0（90.8 時間）と mise 2026.11.12（96.4 時間）。
  Actions のタグは引き続き表の SHA の commit を指し（`object.type` = `commit`）、`ci.yml` の `uses:` の SHA と一致する。
  版は切り替えていない（`package.json`・`pnpm-lock.yaml` は変更なし）。
- **R-2 install と peer 警告**（1.8、1.9、plan §8 の 3 項目目）: `pnpm install --frozen-lockfile` の終了コード、
  peer 警告の全文と扱い、`allowBuilds` の各項目と理由。

  **初回の `pnpm install`（タスク 1.2、2026-11-23、開発者の手元の macOS ターミナルで実行。出力を貼り付けてもらった）**:
  - 出力の要点: `Packages: +65`、`Done in 3.7s using pnpm v12.22.0`。`dependencies` と `devDependencies` は
    package.json の 10 件と一致。
  - `Ignored build scripts` の行は出ていない。peer 警告（`WARN` / `peer`）も出ていない。
  - 生成された `pnpm-lock.yaml` は `lockfileVersion: '9.0'`。`pnpm-workspace.yaml` は install 後も変わっていない。
  - lockfile に `sharp@0.35.5`（next の依存）と `fsevents@2.3.3` がある。`requiresBuild` の記載は lockfile に
    見つからなかった。`strictDepBuilds: true` かつ `allowBuilds: {}` で install が成功し、`Ignored build scripts` も
    出なかったので、未許可の install スクリプトを持つ依存はない。

  **`allowBuilds` の確定（タスク 1.2）**: 許可する依存はなし。`sharp: false` だけを理由つきで明記した（要件 1.5。
  next の画像最適化用で本ラボは使わない）。`pnpm-workspace.yaml` のコメントに理由がある。

  **`--frozen-lockfile` と版（開発者の手元、2026-11-23。出力を貼り付けてもらった）**: `allowBuilds` を足す前の設定で
  `pnpm install --frozen-lockfile` → `✓ Lockfile passes supply-chain policies`、`Lockfile is up to date`、`Done in 45ms`。
  `pnpm exec tsc -v` → `Version 7.1.0-beta`、`pnpm exec next --version` → `Next.js v16.5.0-canary.60`、
  `pnpm exec vitest --version` → `vitest/5.1.1 darwin-arm64 node-v26.13.1`。
  `sharp: false` を足した後の `--frozen-lockfile`（開発者の手元、2026-11-23）: `Already up to date`、`exit=0`。
  `git status --short` で `pnpm-lock.yaml` と `pnpm-workspace.yaml` は書き換わっていない。peer 警告は出なかったので
  `overrides` は不要（1.9）。

  **ZIP の使い捨て環境の `pnpm install`（タスク 10.1、2026-11-23、開発者の手元の macOS ターミナル。出力を貼り付けてもらった）**:
  リポジトリと同じ `pnpm-workspace.yaml`（`minimumReleaseAge: 1440`、`minimumReleaseAgeExclude` なし、`strictDepBuilds: true`、
  `sharp: false`）で、AI SDK・プロバイダ・Zod・`@vitejs/plugin-react` を足した 18 依存を exact で入れた。
  - 終了: `Packages: +93`、`resolved 93, reused 90, downloaded 11, added 93`、`Done in 2.1s using pnpm v12.22.0`。
    出力に `WARN`・`peer` を含む行はなく、**peer 警告は 0 件**（1.9、plan §8 の 3 項目目）。`Ignored build scripts` の行もない
    （`strictDepBuilds: true` のまま成功。未許可の install スクリプトを持つ依存はない）。`overrides` は不要。
  - peer の解決（lockfile で確認）: `ai` 系の `zod` peer（`^3.25.76 || ^4.1.8`）は 4.6.7 で満たされる。`@ai-sdk/react` の `react`
    peer（`^18 || ~19.0.1 || ~19.1.2 || ^19.2.1`）は 19.3.1 で満たされる。`@vitejs/plugin-react@6.3.0` の `vite`（`^8.0.0`）は
    `autoInstallPeers: true` で `vite@8.3.8` が入った。`next` は `@playwright/test`・`@types/node` を peer に取り込んで解決された。
  - **新しい出力**: `Agent skills awaiting approval: ai.` / `Run "pnpm approve" to review them.`。`ai@7.0.179` は `skills/` ディレクトリを
    同梱している（tarball で確認）。これは peer 警告でも install スクリプトでもなく、pnpm 12 の「エージェント用スキルの承認待ち」の通知。
    **`pnpm approve` は実行していない**（使い捨て環境でもリポジトリでも）。`ai` を初めて入れる段 2 の spec で、承認するか・
    `pnpm-workspace.yaml` にどう書くかを決める（引き継ぎ）。`pnpm approve` の仕様は本記録の範囲では公式ドキュメントで確認していない。
  - 解決された版（`node_modules/<pkg>/package.json` で確認）: ai 7.0.179、@ai-sdk/react 4.0.183、@ai-sdk/anthropic 4.0.107、
    zod 4.6.7、next 16.5.0-canary.60、react 19.3.1、typescript 7.1.0-beta、vitest 5.1.1。
  - `pnpm install --frozen-lockfile` の 2 回目: `✓ Lockfile passes supply-chain policies`、`Lockfile is up to date`、`Done in 43ms`、`exit=0`。
- **R-3 オフラインと決定論**（3.5、3.7）: ネットワーク切断・API キー未設定での `mise run verify` の結果、
  3 回連続実行の合否、verify 後の `git status --porcelain`。

  **初回の `mise run verify`（タスク 7.1、2026-11-23、macOS、ネットワークあり）**: 終了コード 0、`mise run gate` も 0。`check:secrets` は
  `12 commits scanned` / `no leaks found`。所要時間は約 10.6 秒（user 21.0s）。**ネットワークを切った実行と、3 回連続の
  実行は未実施**で、タスク 12.1 で行う。ここで確かめたのは、`verify` が参照するタスクの構成だけ
  （`verify-offline-contract.test.ts`）。

  **オフライン・API キーなしの 3 回連続実行（タスク 12.1、2026-11-25、macOS 27.2 / Apple M2、コミット 8afb1f0）**:
  - 作業用コピー: 実リポジトリの HEAD をローカルに `git clone` した使い捨てのコピー（スクラッチ領域。`mise run setup` の
    `lefthook install` が worktree だと実リポジトリと共有のフックを書き換えるため、worktree ではなく clone にした）。
  - ネットワークの遮断: Wi-Fi は切らず、タスク本文の代替手段（到達不能なプロキシ）を使った。`HTTP_PROXY`・`HTTPS_PROXY`・
    `ALL_PROXY`（小文字も）と `npm_config_proxy`・`npm_config_https_proxy` を `http://127.0.0.1:9`（何も listen していない）に、
    `NODE_USE_ENV_PROXY=1` で Node の `fetch` もプロキシを使わせ、`NO_PROXY=127.0.0.1,localhost` で E2E の Web サーバー
    だけを通した。同じ環境で効き目を確かめた: `curl https://registry.npmjs.org/` は exit 7（`Failed to connect to 127.0.0.1
    port 9`）、`node -e 'fetch("https://registry.npmjs.org/")'` は `ECONNREFUSED`。`sandbox-exec` での OS レベルの遮断は
    このセッションの権限で拒否されたため使っていない。プロキシを無視して直接接続するプログラムはこの方法では止まらない
    （unit はネットワークガード、E2E は外部オリジン遮断の fixture がそれぞれ別に止める）。
  - API キー: `env -u` で、名前が `API_KEY`・`_TOKEN` を含む変数と `AI_PROVIDER`・`AI_MODEL`・`OLLAMA*` をすべて外した。
    実行環境の中で名前に `API_KEY` を含む変数は 0 個（`compgen -e | grep -i API_KEY | wc -l` → 0）。
  - 結果（`mise run verify`）:

    | 回 | 終了コード | 所要 | 実行前後の `git status --porcelain` と HEAD | 要点 |
    |----|-----------|------|---------------------------------------------|------|
    | 1 | 0 | 24 s | 同一（0 行） | Biome 39 files、`check:model-ids` 39 files / 0 findings、gitleaks `21 commits scanned` / `no leaks found`、Vitest 11 files / 234 passed、`@smoke` 2 passed |
    | 2 | 0 | 19 s | 同一（0 行） | 同上 |
    | 3 | 0 | 19 s | 同一（0 行） | 同上 |

    3 回とも同じ合否・同じ件数で、verify は追跡ファイルを書き換えなかった（3.1、3.5、3.7）。1 回目だけ遅いのは
    `next typegen`・Next.js の初回コンパイルのキャッシュによる（2 回目以降 19 s で安定）。
- **R-4 security の失敗系**（4.2〜4.4）: registry 到達不能時の `pnpm audit` / osv-scanner の終了コード。

  **正常系（タスク 7.2、2026-11-23、macOS、ネットワークあり）**: `mise run security` は終了コード 0。osv-scanner は
  `Scanned …/pnpm-lock.yaml file and found 173 packages`、`No issues found`。`pnpm audit --audit-level=high` は
  `No known vulnerabilities found`。失敗系（到達不能・advisory ありの終了コード）はタスク 12.4 で測った（下記）。

  **失敗系（タスク 12.4、2026-11-25、macOS 27.2、コミット 8afb1f0 の使い捨て clone）**:

  | 失敗系 | 作り方 | 実行 | 終了コード | 出力の要点 |
  |--------|--------|------|-----------|------------|
  | registry に到達できない（4.4） | `HTTP(S)_PROXY`・`ALL_PROXY`（小文字も）・`npm_config_(https_)proxy` を `http://127.0.0.1:9` に | `mise run security:audit` | 1（70 s） | `Failed to request the audit endpoint (at https://registry.npmjs.org/-/npm/v1/security/advisories/bulk)`、`Connection refused (os error 61)`、`[security:audit] ERROR task failed` |
  | advisory の取得先に到達できない（4.4） | 同上 | `mise run security:osv` | 127（21 s） | `Post "https://api.osv.dev/v1/querybatch": proxyconnect tcp: dial tcp 127.0.0.1:9: connect: connection refused`（4 回の再試行の後）。`Total 0 packages affected …` と表示しても 0 にはならない |
  | 同上（親タスク） | 同上 | `mise run security` | 127（17 s） | `security:osv` で止まり、`security:audit` は起動しない |
  | high 以上の advisory（4.2） | `pnpm add --save-exact lodash@4.17.20`（2020 年公開。24h ゲートはそのまま。`package.json` 1 行、`pnpm-lock.yaml` 8 行の追加） | `mise run security:audit` | 1 | `4 vulnerabilities found`、`Severity: 2 moderate \| 2 high`（GHSA-r5fr-rjxr-66jc ほか） |
  | 既知の脆弱性を持つ依存（4.3） | 同上 | `mise run security:osv` | 1 | lodash 4.17.20 に GHSA-29mw-wpgm-hmr9、GHSA-35jh-r3h4-6jhm、GHSA-r5fr-rjxr-66jc、GHSA-xxjr-mmjv-4gpg の 4 件 |

  どの失敗系も 0 にならなかったので、タスク 7.2 を開き直す必要はない。osv-scanner の 127 は「一般的なエラー」、1 は
  「脆弱性あり」を表し（公式の Return Codes 表 https://google.github.io/osv-scanner/output/ 、2026-11-25 確認）、到達不能と
  検出を終了コードで区別できる。`pnpm audit` はどちらも 1 で、区別は出力による。
  実験の後、clone を HEAD に戻して `pnpm install --frozen-lockfile`（`- lodash 4.17.20`）で元の依存に戻した。

  **lockfile だけで動くか（タスク 8.2、2026-11-23）**: `git ls-files --cached --others --exclude-standard -z` で作業ツリーのファイルだけを
  新しい一時ディレクトリにコピーし（`node_modules` は含まれない）、`mise trust` のあと `mise run security` を実行した。
  osv-scanner は `pnpm-lock.yaml` から 173 パッケージを読んで `No issues found`、`pnpm audit` は `No known vulnerabilities found`、
  終了コード 0。実行後も `node_modules` は作られなかった。→ `security-daily.yml` に `pnpm install` は入れない。
- **R-5 モデル ID の根拠**（6.2）: 登録した ID ごとの公式ドキュメントの URL と確認日。

  **登録した 7 件（タスク 5.1、確認日 2026-11-23）**。記憶や ZIP ガイドでなく、各プロバイダの公式ページを WebFetch で
  取得して確認した。確認できなかった ID は登録していない。

  | Provider | ID | 公式ページ（URL） | ページの記述（要点） |
  |----------|----|--------------------|----------------------|
  | anthropic | `claude-fable-5-2` | https://platform.claude.com/docs/en/about-claude/models/overview | 「Latest models」表の `Claude API ID` 行に `claude-fable-5-2`（Claude Fable 5.2）。退役は 2027-11-09 より前にはならない |
  | anthropic | `claude-opus-5-5` | 同上 | 同表に `claude-opus-5-5`（Claude Opus 5.5） |
  | anthropic | `claude-sonnet-5-5` | 同上 | 同表に `claude-sonnet-5-5`（Claude Sonnet 5.5） |
  | anthropic | `claude-haiku-5-5` | 同上 | 同表に `claude-haiku-5-5`（Claude Haiku 5.5） |
  | openai | `gpt-6.2-sol` | https://developers.openai.com/api/docs/models と https://developers.openai.com/api/docs/models/gpt-6.2-sol | 一覧に `gpt-6.2-sol`（バランス型）。個別ページの `model` パラメータが `gpt-6.2-sol`、別名・スナップショットの記載なし |
  | google | `gemini-3.1-flash-lite` | https://aistudio.google.com/docs/models（`https://ai.google.dev/gemini-api/docs/models` から 301 でリダイレクト） | 一覧と個別の確認で `gemini-3.1-flash-lite` が `Stable` バッジ、停止日の表示なし。同名の `-preview` は「Shut down」 |
  | ollama | `llama3.2:3b` | https://ollama.com/library/llama3.2 と https://ollama.com/library/llama3.2/tags | タグ一覧に `llama3.2:3b`（2.0GB、128K context）があり `latest` ラベル付き。`ollama run llama3.2` が 3B を引く |

  採用の判断: プロバイダごとに最低 1 件。Anthropic は現行の 4 モデルすべて（公式の「Latest models」表）。OpenAI・Google・Ollama は、
  検証に使う小さく安い現行モデルを 1 件ずつにした。OpenAI の一覧の他の ID（`gpt-6.2-astra` など）や、Google の
  `gemini-3.8-flash`・`gemini-3.5-flash-lite` は、ページに存在するが本段では使わないため登録しない（必要になった段で足す）。
  Claude の ID には日付なしのピン留めスナップショットが使われる（同ページ「Claude API ID」の注記）。

  `node -e "import('./src/lib/ai/model-allowlist.ts')"` は成功した（型ストリップ。I-7）。
- **R-6 ZIP 検証**（12.1〜12.4、plan §8 の 5 項目）: 使い捨て環境の再現手順、ファイルごとの型エラー、
  AI SDK 7 の API 名の有無、SSE モックの解釈結果、引き継ぎ先の段。

  確認日はすべて 2026-11-23。実行は開発者の手元の macOS（node v26.13.1、pnpm 12.22.0）。コマンドの出力は貼り付けてもらった
  （このセッションの自動判定が `pnpm install` と `pnpm exec` を拒否したため。タスク 1.2 と同じ運用）。

  **plan §8 の 5 項目の記録先（12.1）**

  | plan §8 の項目 | 確認方法 | 結果 | 記録先 |
  |-----------------|----------|------|--------|
  | 1. `MISE_ENV=node27 mise install` が alpha を解決できるか | タスク 9.1 で実行 | 解決できた。`prereleases = true` は不要 | R-8（確認日 2026-11-23） |
  | 2. AI SDK 7 の API 名・モックの content の形 | tarball の型定義の照合、公式ドキュメント、ZIP の unit テストの実行 | 9 項目すべて存在。ZIP の unit テストは 4/4 緑 | 本 R-6（下の表） |
  | 3. `next@canary` + `typescript@beta` が peer 警告なしで入るか | 使い捨て環境の `pnpm install` | peer 警告 0 件 | R-2（ZIP の使い捨て環境の節） |
  | 4. E2E の SSE モックが `useChat` で解釈されるか | 使い捨て環境で `playwright test --grep @smoke` | 解釈された（1 件）。もう 1 件はロケーターの曖昧さで失敗 | 本 R-6（下の SSE の節） |
  | 5. TypeScript 7.1 の RC / stable | `pnpm view typescript dist-tags` | 未公開。beta を据え置き | R-7（確認日 2026-11-23。タスク 11.4 で再確認） |

  R-7 と R-8 がタスク 1.2 と 9.1 で記録済みであることは、本タスクで読んで確かめた。

  **再現手順（10.1）。使い捨て環境はリポジトリの外に作り、コミットしない（12.7）。削除はタスク 10.4（下の「リポジトリの確認」を参照）**
  1. `mktemp -d` で新しい空ディレクトリを作り、`~/Downloads/genai-lab.zip` を `unzip` で展開する（展開先で何も実行しない）。
  2. `package.json` の依存を下の exact 版に書き換える。`packageManager` は `pnpm@12.22.0`。`pnpm-workspace.yaml` はリポジトリのものを
     そのままコピーする（`minimumReleaseAgeExclude` なし）。ZIP の `mise.toml` と `mise.node27.toml` は `latest` を含むので削除し、
     ツールはリポジトリの pin（node 26.13.1、pnpm 12.22.0）を使う。
  3. `pnpm install` → `pnpm exec tsc --noEmit` → `pnpm exec vitest run` → `pnpm exec playwright install chromium` →
     `pnpm exec playwright test --grep @smoke`。
  4. 一時ディレクトリを削除する。ZIP のコードとテストは `src/`・`tests/` に入れない。

  **採用した版（24h を満たす最新の exact 版。基準時刻 2026-11-22T13:42Z、`registry.npmjs.org` の `time` で確認）**

  | 依存 | 版 | 公開（UTC） | 由来 |
  |------|----|-------------|------|
  | ai | 7.0.179 | 2026-11-20T23:21Z | ZIP の `^7.0.0` を置換（最新かつ 24h 以上） |
  | @ai-sdk/anthropic | 4.0.107 | 2026-11-20T16:50Z | ZIP の `latest` を置換 |
  | @ai-sdk/openai | 4.0.122 | 2026-11-20T16:51Z | 同上 |
  | @ai-sdk/google | 4.0.124 | 2026-11-20T23:18Z | 同上 |
  | @ai-sdk/openai-compatible | 3.0.94 | 2026-11-20T16:52Z | 同上 |
  | @ai-sdk/react | 4.0.183 | 2026-11-20T23:28Z | 同上。4.0.184（2026-11-22T22:26Z）は基準時刻に 24h 未満なので不採用 |
  | zod | 4.6.7 | 2026-10-12T16:29Z | ZIP の `^4.6.0` を置換 |
  | @vitejs/plugin-react | 6.3.0 | 2026-11-09T06:12Z | ZIP の `latest` を置換 |
  | next / react / react-dom / typescript / vitest / @playwright/test / @biomejs/biome / @types/* | リポジトリと同じ（R-1） | R-1 | 共有する依存は C1 の版 |

  TypeScript は R-7 のとおり 7.1.0-beta のまま（切り替えていない）なので、R-6 の実行時の版と R-1 は一致する。

  **型検査（10.2、12.2）**: `pnpm exec tsc --noEmit` → **出力なし、終了コード 0。ファイルごとの型エラーは 0 件**
  （ZIP の 5 つのアプリファイルと 3 つのテストを含む）。
  - 注意 1: 貼り付けてもらった 2 つ目のブロックは `pnpm install --frozen-lockfile` の出力と `exit=0` が 2 つで、`tsc` 自身の出力はなかった。
    これを「`tsc` は出力なし、`exit=0`」と解釈して記録する。`tsconfig.tsbuildinfo` が 22:55 に作られ、診断の記録（`messageText`）は 0 件だった
    ことと矛盾しない。
  - 注意 2: `tsc` が読んだ `tsconfig.json` は、`next dev`（E2E の `webServer`）が 22:52 に書き換えた後のものだった。`next dev` が足したのは
    `allowJs: true`、`esModuleInterop: true`、`include` の `.next/dev/types/**/*.ts`（`next dev` のログに
    `esModuleInterop was set to true (requirement for SWC / babel)`）。ZIP の元の `tsconfig.json` のままでの `tsc` は実行していない。
  - 注意 3: 型が通ることと、非推奨でないことは別。ZIP の `route.ts` と `extract-task.ts` は `streamText` / `generateText` に `system:` を渡すが、
    `ai@7.0.179` の型定義では `system` は `@deprecated Use \`instructions\` instead.`（`index-CM_8u8gB.d.ts` の 1076・3626・3975 行付近）。`tsc` は通る。
    公式ドキュメントの例は `instructions` を使う。

  **AI SDK 7 の API 名の照合（10.2、12.3）**。照合元: `npm pack ai@7.0.179` の tarball（`dist/index-CM_8u8gB.d.ts`、`dist/test/index.d.ts`）、
  公式ドキュメント（Context7 の `/vercel/ai`。`content/docs/03-agents/06-tool-approvals.mdx`、
  `03-ai-sdk-core/15-tools-and-tool-calling.mdx`、`02-getting-started/02-nextjs-app-router.mdx`、`cookbook/01-next/20-stream-text.mdx`、
  `03-ai-sdk-core/55-testing.mdx`、`07-reference/01-ai-sdk-core/70-is-step-count.mdx`）、使い捨て環境の unit テストの実行。

  | API 名 | 型定義（ai@7.0.179） | 公式ドキュメント | 実行での確認 | 使う段 |
  |--------|---------------------|-------------------|----------------|--------|
  | `toolApproval` | あり。`streamText` / `generateText` / `ToolLoopAgent` の設定（`ToolApprovalConfiguration`）。値は `'not-applicable' \| 'approved' \| 'denied' \| 'user-approval'` か、`type` と `reason` を持つオブジェクト、関数 | あり（`ToolLoopAgent` の例に `toolApproval: { runCommand: 'user-approval' }`） | `agent-approval.test.ts` が緑 | 5 |
  | `isStepCount` | あり（`declare function isStepCount(stepCount: number): StopCondition`） | あり（`stopWhen: isStepCount(5)`） | `agent.ts` の型検査が通る | 5 |
  | `toUIMessageStream` | あり（`declare function toUIMessageStream({ stream, tools, ... })`）。`StreamTextResult` のメソッド版は `@deprecated` | あり（`toUIMessageStream({ stream: result.stream })`） | `route.ts` の型検査が通る。E2E はサーバーをモックしたため実行していない | 3 |
  | `createUIMessageStreamResponse` | あり（`declare function createUIMessageStreamResponse({ status, statusText, headers, stream, keepAliveMs, consumeSseStream })`） | あり（同上） | 同上 | 3 |
  | `convertToModelMessages` | あり | あり（`messages: await convertToModelMessages(messages)`） | 型検査が通る | 3 |
  | `ToolLoopAgent` | あり | あり | `agent-approval.test.ts` が緑 | 5 |
  | `Output`（`Output.object`） | あり | あり（`generateText({ output: Output.object({ schema }) })`） | `extract-task.test.ts` が 3/3 緑 | 4 |
  | `MockLanguageModelV4`（`ai/test`） | あり（`dist/test/index.d.ts` の `class MockLanguageModelV4 implements LanguageModelV4`。`ai/test` の `exports` に `./test`） | あり（テストの節にモックの例） | `agent-approval.test.ts` と `extract-task.test.ts` が緑 | 4、5、7 |
  | content の `tool-approval-request` 型 | あり。`ToolApprovalRequestOutput`（`approvalId`、`toolCall`、`reason?`）と、UI メッセージのチャンク（`approvalId`、`toolCallId`、`reason?`、`isAutomatic?`、`signature?`） | あり（承認待ちの `tool-approval-request`） | `agent-approval.test.ts` の `result.content.filter(p => p.type === "tool-approval-request")` が 1 件で緑 | 5 |

  差異（ZIP と 7.0.179 の実際）: 上の 9 項目はすべて存在し、ZIP が使う名前と形は一致した。名前の不一致は見つからなかった。差異は次の 2 点だけで、
  どちらも ZIP の誤りではなく非推奨に近い書き方である。
  1. `system:`（`route.ts`、`extract-task.ts`）は非推奨で、`instructions:` が正（`agent.ts` は既に `instructions`）。段 3（`route.ts`）と段 4
     （`extract-task.ts`）の spec で `instructions` に直す。
  2. `StreamTextResult` のメソッド版 `toUIMessageStream` は非推奨で、ZIP が使う独立関数の `toUIMessageStream({ stream: result.stream })` が正。
  （`agent-approval.test.ts` のモックの content の形 `tool-call` → `tool-approval-request` は 7.0.179 の実際の挙動と合っていた。）

  **unit テスト（10.3、12.4）**: `pnpm exec vitest run` → `RUN v5.1.1`、`Test Files 2 passed (2)`、`Tests 4 passed (4)`、`Duration 223ms`
  （`agent-approval.test.ts` 1 件、`extract-task.test.ts` 3 件）。`extract-task.test.ts` は Zod 4.6.7 の `.validate()`（空入力の拒否）を
  実行で通しており、段 4 の前提（Zod 4.6 の `.validate()`）が 4.6.7 で成り立つ根拠になる。

  **E2E smoke と SSE モック（10.3、12.4、plan §8 の 4 項目目）**: `pnpm exec playwright test --grep @smoke` → 2 件実行、**1 件緑・1 件赤**、
  終了コード非 0（`1 failed` / `1 passed (4.1s)`）。
  - 緑: `@smoke streams a mocked reply`。`page.route("**/api/chat", …)` が返した SSE（`x-vercel-ai-ui-message-stream: v1`、`start`・`text-start`・
    `text-delta`・`text-end`・`finish`・`data: [DONE]`）を、`@ai-sdk/react@4.0.183` の `useChat` が解釈し、`[data-role="assistant"]` に
    `Hello from the mocked model` が描画された。**SSE モックは `useChat` のパーサーで解釈された**（根拠は画面の描画）。
  - 赤: `@smoke shows retry on server error`（`chat.smoke.spec.ts:36`）。原因は `test-results/…/error-context.md` に残っていた:
    `getByRole('alert')` が 2 要素に解決され、strict mode violation になった。1 つはページの `<p role="alert">`、もう 1 つは Next.js の
    `<div role="alert" aria-live="assertive" id="__next-route-announcer__">`。ページのスナップショットには `alert: An error occurred. Retry`
    と Retry ボタンが出ており、**リトライの UI 自体は動いている**。失敗は ZIP のテストのロケーターが曖昧なため（型・モックの形式・パーサーの
    変更が原因ではない）。段 3 の spec で、`page.getByRole("alert").filter({ hasText: … })` のようにアプリ側の要素に絞る
    （引き継ぎ。ZIP のコードは直さない）。
  - あわせて `next dev` が使い捨て環境で行ったこと（`.next/dev/logs/next-development.log`）: `tsconfig.json` の書き換え（上記）、`AGENTS.md` の生成
    （`Generated AGENTS.md for AI agents`、`Generated upgrade instructions in AGENTS.md`）、`Route / is rendering with server caches disabled`
    の警告（`Cache Components enabled`）。リポジトリは `next.config.ts` の `agentRules: false` と `experimental.agentUpgrade: false` で前者を止めている
    （I-18）。ZIP の `playwright.config.ts` は専用ポートでなく 3000 で、`reuseExistingServer: !process.env.CI`（段 1 の設定は専用ポートと
    `reuseExistingServer: false`）。段 3 では段 1 の設定に合わせる。

  **引き継ぎ先**

  | 項目 | 段 |
  |------|----|
  | `system:` → `instructions:`、`route.ts`、`getByRole('alert')` の曖昧さ、`useChat` の描画の確認 | 3（ストリーミング UI） |
  | `extract-task.ts` の `system:` → `instructions:`、Zod 4.6.7 の `.validate()` は実行で確認済み | 4（構造化出力） |
  | `toolApproval`・`isStepCount`・`tool-approval-request` は存在、`createGuardedAgent` への集約 | 5（ツールと承認） |
  | `pnpm approve`（`Agent skills awaiting approval: ai.`）の扱い | 2（`ai` を初めて入れる段） |
  | `MockLanguageModelV4` の content の形は 7.0.179 と一致 | 7（テストと簡易評価） |

  **使い捨て環境のパスの扱い（10.1）**: リポジトリの外の `mktemp -d` のディレクトリで、コミットしない。成果物は本 R-6 と R-2 だけ。

  **リポジトリの確認（10.4、2026-11-23）**: `git ls-files` と存在確認で、`src/app/api/`、`src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`、
  `tests/unit/agent-approval.test.ts`、`tests/unit/extract-task.test.ts`、`tests/e2e/chat.smoke.spec.ts` はいずれも tracked=0、存在しない。
  `git status --porcelain` に ZIP 由来のファイルはなく、`git worktree list` はメインの作業ツリーだけ。
  **使い捨て環境の削除（2026-11-23）**: このセッションでは自動判定が `rm` を拒否したため、開発者が手元で削除した。対象は `$TMPDIR` 配下の
  3 ディレクトリ（`genai-zip-verify-hxUdvf`、展開した ZIP と `node_modules` を含む。`ai-extract-vjOAhs`、`ai-pack-6ipjIl`、`ai@7.0.179` の
  tarball の展開先）。削除後に `ls -d` で 3 つとも `No such file or directory` を確認した。
  補足: `git ls-files -- src/lib/ai` は 1 件を返すが、`src/lib/ai/model-allowlist.ts`（タスク 5.1 の成果物）で ZIP のコードではない。
- **R-7 TypeScript 7.1 の公開状況**（12.5、12.6）: 確認日、RC / stable の有無と公開日時、採用した版。

  **2026-11-23 確認（タスク 1.2、12.6 に該当）**: `pnpm view typescript dist-tags --json` は `latest` = 7.0.2、
  `beta` = 7.1.0-beta（2026-10-20T16:45Z）、`rc` = 7.0.1-rc（7.0 系の古い RC）、`next` = 7.1.0-dev.20261121.1。
  7.1 の RC / stable は未公開のため、beta（7.1.0-beta）を据え置く。タスク 11.4 で再確認する。

  **2026-11-25T11:52Z 再確認（タスク 11.4）**: `pnpm view typescript dist-tags --json` は `latest` = 7.0.2、`beta` = 7.1.0-beta、
  `rc` = 7.0.1-rc（7.0 系）、`next` = 7.1.0-dev.20261125.1。`pnpm view typescript time --json` で `7.1` から始まる dev 以外の版は
  `7.1.0-beta`（2026-10-20T16:45:47Z）だけ。**7.1 の RC / stable はまだ公開されていない**ので、7.1.0-beta を据え置く（12.6）。
  切り替えをしていないため、12.5 の `mise run verify` のやり直しは不要。次の確認は週次の `mise run outdated` で行う。
- **R-8 Node 27 レーン**（11.2、11.3）: `MISE_ENV=node27 mise install` の出力と必要だった設定。

  **採用版と install（タスク 9.1、2026-11-23）**: `mise ls-remote node` の 27 系は `27.0.0-alpha.0.0.0` / `.0.1.0` / `.0.1.1`。GitHub の
  `nodejs/node` のリリースでは `v27.0.0-alpha.0.1.1` が 2026-11-17T03:48Z 公開（約 6 日）で、24 時間を満たす最新。これを
  `mise.node27.toml` に exact で書いた。
  `mise trust --show` → `trusted`（リポジトリのディレクトリ単位で信頼済みで、新しい `mise.node27.toml` の追加で信頼をやり直す
  必要はなかった）。`MISE_ENV=node27 mise config ls` は `mise.toml` と `mise.node27.toml` の両方を読む。
  `MISE_ENV=node27 mise install` → 終了コード 0、`✓ node@27.0.0-alpha.0.1.1 12.9s node-v27.0.0-alpha.0.1.1-darwin-arm64.tar.gz`。
  **`[settings] prereleases = true` は不要だった**（`mise settings get prereleases` は `false` のまま。exact な版の指定で解決する。
  I-3 の予想どおり）。`MISE_ENV=node27 mise exec -- node -v` → `v27.0.0-alpha.0.1.1`、既定レーンは `v26.13.1` のまま。
  install 中に npm の `install-scripts` 警告（esbuild、fsevents）が出たが、これは開発者の `~/.default-npm-packages`
  （`typescript`、`tsx`、`typesync`）を mise がグローバルに入れたときのもので、リポジトリの依存とは関係しない。

  **Node 27 での verify（タスク 9.3、2026-11-23、commit 4073d84 の worktree、macOS）**: 終了コード 1。単体テストは 223/224
  （落ちた 1 件は worktree に未コミットの `AGENTS.md` がないため。Node 26 でも同じ失敗。コピーすると 224/224）。
  E2E は Next.js 開発サーバーの `rawHeaders.hasOwnProperty is not a function` で `webServer` が 60 秒で時間切れ、テスト 0 件
  （同じ worktree の Node 26 は 2/2）。`check`、`typecheck`、`check:model-ids`、`check:secrets`、`security` は通過。
  詳細は `docs/node27/2026-11-23-initial-lane.md`。Linux は未確認（タスク 12.5）。

  **Linux（CI の `verify-node27`、タスク 12.5、2026-11-25、PR #2 の run 45614530248、コミット fe8e9a6、ubuntu）**:
  `node` v27.0.0-alpha.0.1.1。`mise run verify` は終了コード 1。`check`〜`check:secrets` は通過、`test` は **234/234 で通過**、
  `e2e` は macOS と同じく `[WebServer] TypeError: rawHeaders.hasOwnProperty is not a function`（と `headers.hasOwnProperty`）が
  繰り返され、`Error: Timed out waiting 60000ms from config.webServer.`、`no tests were executed` で失敗した。
  `docs/node27/` の記録との突き合わせ: 未解決事項 1（E2E）は Linux でも同じ症状で再現し、OS に依存しない。未解決事項 2
  （`AGENTS.md` による単体テスト 1 件の失敗）は、タスク 11.5 で `AGENTS.md` をコミットした後の commit では出なかった
  （見込みどおり）。記録と食い違う結果はない。未解決事項 3（Linux 未確認）はこの結果で埋まる。ジョブは失敗したが
  `continue-on-error` によりワークフロー全体は `success` だった（10.3、10.4）。
- **R-9 ゲートの違反時の動作**（9.6）: 3.8・3.9・3.11 の違反状態と、verify の該当構成要素の終了コード。

  **フックの実行（タスク 7.5、2026-11-23、lefthook 2.2.2、macOS）**。一時リポジトリでの 5 件のケースは、組んだ直後に緑だった
  （検査対象の構成は 7.4 までにできているため）。代わりに、ケースごとに検査対象を壊して失敗することを RED として確かめた。
  壊したのはテストの入力だけで、実リポジトリのファイルは触っていない。

  | ケース | 壊し方（RED） | 失敗の出力（要点） |
  |--------|----------------|----------------------|
  | 1. `lefthook install` で 3 つのフックができる（7.1） | `lefthook install` の呼び出しを外した | `pre-commit should be installed: expected false to be true` |
  | 2. ジョブのツールが PATH にない（7.7） | 失敗を期待するケースを、ツールがある既定の `isolatedEnv()` で実行した | `…/.git/hooks/pre-commit: status should be non-zero: expected +0 not to be +0` |
  | 3. lefthook 本体が見つからない（7.7） | 埋め込まれた lefthook の絶対パスを書き換えずに実行した | 出力に `Can't find lefthook in PATH` がなく失敗（lefthook が起動し、ANSI 付きの通常の出力になった） |
  | 3'. 同上（`assert_lefthook_installed` の効き目） | 既定の設定を `assert_lefthook_installed: false` にした | `status should be non-zero: expected +0 not to be +0`（lefthook がないのに exit 0 で通過する） |

  緑の状態で確かめた文言: ツール不在では lefthook がジョブの 127 を終了コード 1 にし、出力に `gitleaks` が出る。lefthook 本体が
  見つからない場合は終了コード 1 で `Can't find lefthook in PATH`。対照として、`assert_lefthook_installed: false` では同じ操作が
  exit 0 になる（I-4 の実測と一致）。
  生成されたフックは、`LEFTHOOK_BIN` → PATH の `lefthook` → install 時の絶対パス → `node_modules` 内の lefthook → … の順に探す
  （`.git/hooks/pre-commit` を読んで確認）。ケース 3 はこの順の 3 番目の絶対パスを壊して再現している。

  **実リポジトリへの install と pre-push の起動（タスク 7.5、2026-11-23、開発者の手元のターミナルで実行、出力を貼り付け）**:
  `mise run setup` → `pnpm install --frozen-lockfile`（`Lockfile is up to date`、`Done in 39ms`）、
  `pnpm exec playwright install chromium`（導入済みで出力なし）、`lefthook install`（`sync hooks: ✔️(commit-msg, pre-push,
  pre-commit)`）。`.git/hooks` に `commit-msg`、`pre-commit`、`pre-push` の 3 つ。push はせず `lefthook run pre-push` →
  `osv-scanner` 6.06 s、`pnpm-audit` 0.48 s、`unit-tests` 7.66 s、`e2e-smoke` 3.03 s の順にすべて ✔️、合計 17.22 s、
  終了コード 0（7.5、7.6 のうち起動と順序。失敗時に後続を止めることは `piped: true` の設定テストで確かめている）。
  commit-msg と pre-commit の実リポジトリでの起動はタスク 9.2 のコミットで、実際の `git push` での起動はタスク 12.5 で確かめる。

  **入れ子の実行の色（タスク 6.1、2026-11-23、開発者の macOS ターミナル）**: 入れ子の Vitest の出力に ANSI が混ざり、
  `network-guard.test.ts` の `Test Files  1 failed (1)` / `1 passed (1)` の判定が 2 件失敗した。`FORCE_COLOR` と `NO_COLOR` は
  どちらも未設定、`TERM=xterm-256color`、`COLORTERM=truecolor`。入れ子の Vitest を直接実行して `cat -v` で ESC を数えた:
  既定 6 行、`FORCE_TTY=false` 0、`TERM=dumb` 0、`TERM` を外す 6、`NO_COLOR=1` 0。つまり色を出す変数がなくても `TERM` だけで
  色が出た。調査（I-17）の「どちらも設定しなければ ANSI は出ない」は、この機械では成り立たなかった。
  同じコマンドが、この記録を書いた Claude Code のセッションの環境（macOS、Node 26.13.1、Vitest 5.1.1、TERM=xterm-256color）
  では ESC 0 行で再現しなかった。原因（機械ごとの違い）は特定できていない。対処: `isolatedEnv({ nested: true })` が
  `NO_COLOR=1` と `FORCE_TTY=false` を設定する（`sandbox.test.ts` に検査を追加）。手元で 116/116 になったことで確認した。
  tinyrainbow の判定（`vitest/dist/chunks/tinyrainbow.*.js`）は `FORCE_TTY !== "false"` かつ `TERM !== "dumb"` を色ありとして
  読むが、その式だけでは再現しない機械の違いは説明できなかった。

  **`\b` と日本語（タスク 5.2、2026-11-23、Node 26.13.1）**: tasks.md は「日本語の文中の ID も検出（`\b` の挙動）」と書き、
  最初は plan も私の実装コメントも「`\b` は日本語の文字と英字の間に境界を持たない」と前提した。実測では、日本語の文字に
  接していても `\b` と今の先読み・後読みのどちらも同じ ID を検出する（4 通りで 1 件ずつ）。差が出るのは `-` の扱いで、
  `my-<ID>` のようにハイフンでつながった語の末尾を、`\b` は検出し、今の境界は検出しない。コメントと日本語のテストの題名を
  実測に合わせて直し、ハイフンの末尾のケースを追加した。`\b` への置き換えは、このハイフンのケースだけが落とす。

  **`.ts` の Playwright reporter（タスク 4.2、2026-11-23、Playwright 1.65.1、macOS）**: 設定から `.ts` の reporter を
  読み込める。`.mjs` + JSDoc への切り替えは不要。ただし reporter のパスは設定ファイルの `rootDir` からの相対で
  解決される（`loadReporter` が `path.resolve(config.rootDir, file)` を呼ぶ）ため、入れ子の設定
  `tests/fixtures/gate/e2e/playwright.fixture.config.ts` からは `../../../e2e/reporters/require-executed-tests.ts` と書く。
  **外部要求の捕捉（タスク 4.3、2026-11-23、Playwright 1.65.1、chromium、macOS）**: `webServer` も `baseURL` もない入れ子の設定で、
  `page.setContent` の後に `page.evaluate` から出した `fetch` を `context.route("**/*")` が捕まえ、`route.abort("blockedbyclient")` で
  ブラウザ側は reject（`blocked`）になった。teardown で `failOnBlockedRequest` が真なら失敗する。**Linux ランナーでの確認は
  未実施**で、タスク 12.5 の CI の結果で追記する。
  最初の fixture（`.invalid` ドメインへの `fetch`）は、`abort` を `fallback` に変えても失敗した。DNS が解決せず
  要求が失敗するだけで、`abort` が効いているかを区別できなかったため。ローカルの HTTP サーバー（`127.0.0.1` のランダムな
  ポート）に向け直し、`hits` が 0 であることと `outcome` が `blocked` であることを assert して初めて区別できた。
  plan の「`.invalid` ドメイン」の指定からの変更。
  同様に、その設定の `testDir` も作業ディレクトリでなく設定ファイルからの相対で、`"tests/fixtures/gate/e2e"` と
  書くと 0 件になる（`--list` でも `Total: 0 tests in 0 files`）ため `"."` にした。plan が想定した
  `testDir: "tests/fixtures/gate/e2e"` からの変更。

  **実リポジトリでのフックの起動（タスク 9.2、2026-11-23、lefthook 2.2.2、macOS、コミット 9958028〜4073d84）**:
  - 不正な形式の commit メッセージ（`bad message without type`）は、`commit-msg` の `conventional` が終了コード 1 で拒否した。
    出力は `commit rejected: the subject does not follow Conventional Commits.` と期待する形式。commit は作られず、HEAD は 12d5639 のままだった。
  - 正しい形式（`chore(tooling): …` など 5 件）は、`pre-commit` の `model-ids`・`secrets`・`biome`・`typecheck` がすべて ✔️、
    続けて `commit-msg` の `conventional` が ✔️ になり、commit できた。`secrets` は gitleaks で `no leaks found`、
    `model-ids` は `scanned 36 files, 0 findings`、`typecheck` は `tsc --noEmit` まで通った。
  - 9.2 の commit は 5 件に分けた（tooling、src、tests・scripts、ci・hooks、spec 進捗）。`research.md` と `AGENTS.md` は残した。
    コミット前に `mise run verify` を実行し、終了コード 0、単体テスト 224/224、`@smoke` の E2E 2/2 を確認した。

  **違反状態での verify の構成要素（タスク 12.2、2026-11-25、macOS 27.2、コミット 8afb1f0 の使い捨て clone）**。違反を 1 つずつ
  作り、ケースごとに clone を HEAD に戻した（`git reset --hard` と `git clean -fd`。clone は R-3 と同じもの）。「起動した
  タスク」は mise の `[<task>] $ …` の行から読んだ。

  | ケース | 違反の作り方 | 実行 | 終了コード | 起動したタスク | 出力の要点 | 同じ違反を捕まえる自動テスト |
  |--------|--------------|------|-----------|----------------|------------|------------------------------|
  | (a) test の対象 0 件（3.8） | `git rm tests/unit/*.test.ts` | `mise run test` | 1 | test | `No test files found, exiting with code 1`、`no tests were executed`、`[test] ERROR task failed` | `gate-self-check.test.ts` (a)（ファイル 0 件）、(b)（todo のみ） |
  | (b) `@smoke` を全部 skip（3.9） | 2 つの `*.smoke.spec.ts` の `test(` を `test.skip(` に | `mise run e2e` | 1 | e2e | `2 skipped`、`no tests were executed` | `gate-self-check.test.ts` (c)。`check` の Biome `noSkippedTests` も同じ変更を拒否する（R-10） |
  | (c) E2E から外部オリジンへ未モックの要求（3.11） | `page.evaluate` で `fetch("https://example.com/")` する `@smoke` を追加 | `mise run e2e` | 1 | e2e | 追加した 1 件が `✘`、`Error: the test requested 1 external origin(s) without a mock: https://example.com. Mock the request with page.route instead.`。既存の 2 件は ✓ | `gate-self-check.test.ts` (e)、`network-guard.smoke.spec.ts` |
  | (d1) lint | `src/lint-violation.ts` に `export const value: any = 1;` | `mise run verify` | 1 | check のみ | `lint/suspicious/noExplicitAny`、`Found 1 error.` | `static-analysis.test.ts`（Biome） |
  | (d2) 型 | `src/type-violation.ts` に `export const value: number = "not a number";` | `mise run verify` | 2 | check、typecheck | `src/type-violation.ts(1,14): error TS2322: Type 'string' is not assignable to type 'number'.` | `static-analysis.test.ts`（tsc） |
  | (d3) モデル ID | allowlist の Anthropic の 1 件目を `src/model-id-violation.ts` に文字列で書いた（スクリプトは実行時に allowlist から読み、ID を持たない） | `mise run verify` | 1 | check、typecheck、check:model-ids | `src/model-id-violation.ts:1:23: <ID> (allowlist)` | `check-model-ids.test.ts` |
  | (d4) 秘密値の履歴 | **未実施**（下記） | — | — | — | — | `gitleaks-pre-commit.test.ts`「check:secrets over the commit history」（一時リポジトリで commit し、非 0・RuleID あり・値なし） |
  | (e) 検出値を出力しない（3.12） | **未実施**（下記） | — | — | — | — | 同上と、`check:secrets` から `--redact` を外す R-10 の行 |

  (d1)〜(d3) は、どれも壊した構成要素で止まり、後続（`check:secrets`、`test`、`e2e`）は起動しなかった（3.2）。
  (d4)・(e) の未実施の理由: 偽の GitHub トークンの形をした値を clone で `git -c core.hooksPath=/dev/null commit` しようとした
  ところ、この開発機に管理者が導入している社外製の秘密値ブロック（Git の外側から commit を検査する仕組み）が commit を拒否した
  （`COMMIT BLOCKED`、`detected GitHub personal access token`）。commit が作られないため `mise run verify` は exit 0
  （`21 commits scanned`、`no leaks found`）で、違反状態を作れていない。出力に偽の値は含まれなかった（長さ 40 の値を
  `grep -F` で検索して 0 件）。管理された統制を回避する操作は行っていない。
  **ユーザーの決定（2026-11-25）**: (d4)・(e) は自動テストを証拠として受け入れる。`gitleaks-pre-commit.test.ts` の
  「exits non-zero for a committed secret, names the rule, and never prints the value」が、隔離した一時リポジトリに偽の値を
  commit して `check:secrets` の argv（`mise.toml` から読む）を実行し、非 0・`RuleID` あり・値なしを毎回の verify で確かめる。
  非空虚であることは R-10 の `check:secrets` の `--redact` を外す行で示した。verify が失敗した構成要素で止まり後続を
  実行しないこと（3.2）は、同じ直列チェーンの (d1)〜(d3) で示した。
  付記: 単体テストの一時リポジトリは `GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` で隔離しているため（`sandbox.ts`）、
  その中の commit にはこの統制がかからない（`gitleaks-pre-commit.test.ts` が通るのはこのため）。

  **実際の push と CI（タスク 12.5、2026-11-25、コミット fe8e9a6、PR #2）**:
  - `git push -u origin feat/dev-environment-and-gates`（リモートに同名ブランチなし。`git fetch` で `couldn't find remote ref`
    を確認してから実行）で pre-push が起動し、`osv-scanner` 1.12 s → `pnpm-audit` 0.60 s → `unit-tests` 15.06 s →
    `e2e-smoke` 3.14 s の順に 4 ジョブがすべて ✔️、合計 29.50 s、push は成功した（7.5、7.6）。新しいブランチの push では
    push するファイルがあるため skip されない（R-11 の `no matching push files` の場合と対照）。
  - CI（`ci.yml`、`pull_request`、run 45614530248、ubuntu）: `verify` ジョブは `success`。`mise run runtime` の版は開発機と同じ
    （v26.13.1、pnpm 12.22.0、TypeScript 7.1.0-beta、Next.js v16.5.0-canary.60、lefthook 2.2.2、gitleaks 8.30.1、
    osv-scanner 2.7.1）。`mise run verify`: Biome 39 files、`check:model-ids` 0 findings、gitleaks `22 commits scanned` /
    `no leaks found`（`fetch-depth: 0` で PR のマージコミットまでの全履歴）、Vitest 234/234、`@smoke` 2 passed。
    `mise run security`: osv-scanner `found 173 packages` / `No issues found`、`pnpm audit` `No known vulnerabilities found`。
    最後の `git status --porcelain` の確認も通過（1.8、10.1、10.6、10.7）。security-daily.yml が未実行のうちは、この
    `verify` ジョブの `mise run security` の緑を暫定の証拠とする（10.5 はタスク 12.7）。
  - Linux での外部要求の遮断（3.11、タスク 12.2 の続き）: 同じ `verify` ジョブで `network-guard.smoke.spec.ts`「the
    external-origin guard blocks and records an unmocked request」が ✓（658 ms）。遮断と記録を assert するテストなので、
    chromium on Linux でも `context.route` が別オリジンの要求を止めている。`gate-self-check.test.ts` (e)（teardown で失敗する
    経路）も同じジョブの 234 件に含まれて通った。

  **ruleset `protect-main` の必須チェック（タスク 12.6、2026-11-25、ユーザーの確認を得て適用）**: 適用前は
  `enforcement: disabled`、rules は `deletion`・`non_fast_forward`・`pull_request`（承認 0）、`required_status_checks` なし
  （I-13 と同じ）。`gh api -X PUT repos/<owner>/<repo>/rulesets/27838452` で、既存の rules・`conditions`（`~DEFAULT_BRANCH`）・
  `bypass_actors`（空）をそのまま残し、`enforcement: active` と `required_status_checks`（`context: verify`、`integration_id:
  15368`。PR の check run の `app.id` が 15368 / `github-actions` であることを先に確認）を加えた。
  適用後の `gh api …/rulesets/27838452`: `enforcement: active`、rules は `deletion`、`non_fast_forward`、`pull_request`、
  `required_status_checks: [{context: verify, integration_id: 15368}]`。必須チェックは `verify` だけで、`verify-node27` は
  含まない（10.2）。PR #2 の `mergeStateStatus` は `UNSTABLE`（必須でない `verify-node27` の失敗だけ。`verify` は SUCCESS）。
  有効化で、既定ブランチの削除・force push の禁止と PR の必須も効き始めた。bypass はない。

- **R-10 非空虚の確認**（9.7）: 受け入れテストごとに、壊した対象、壊し方、失敗したことの出力。

  | テスト | 壊した対象 | 壊し方 | 失敗の出力（要点） | 確認日 |
  |--------|-----------|--------|---------------------|--------|
  | `docs-structure.test.ts`「has the five headings in order」 | `docs/node27/2026-11-23-initial-lane.md` | 見出し「未解決事項」を `###` に下げた | `missing heading among 結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順: expected [ +0, 1, 2, -1, 3 ] to not include -1` | 2026-11-23 |
  | 同上 | 同上 | 「結論」を別名にした | `expected [ -1, 1, 2, 3, 4 ] to not include -1` | 2026-11-23 |
  | 同上 | 同上 | 「検証した版」と「通したゲート」を入れ替えた | `headings are out of order: expected [ +0, 2, 1, 3, 4 ] to deeply equal [ +0, 1, 2, 3, 4 ]` | 2026-11-23 |
  | `docs-structure.test.ts`「names every record YYYY-MM-DD-<topic>.md」 | `docs/node27/` | `notes.md` を置いた | `notes.md does not match YYYY-MM-DD-<topic>.md` | 2026-11-23 |
  | `docs-structure.test.ts`「holds at least one record」 | `docs/node27/` | 記録がない状態（RED） | `docs/node27/ has no .md record: expected 0 to be greater than or equal to 1` | 2026-11-23 |

  | テスト | 壊した対象 | 壊し方 | 失敗の出力（要点） | 確認日 |
  |--------|-----------|--------|---------------------|--------|
  | `sandbox.test.ts`「runs the gate tools in the isolated environment」 | `sandbox.ts` の `buildPath` | `dirname(process.execPath)` を PATH の組み立てから外した | `pnpm exec vitest --version: status (stderr: …/node_modules/.bin/vitest: line 109: exec: node: not found): expected 127 to be +0`。他の 8 件は通った | 2026-11-23 |

  | `network-guard.test.ts` (a) | `vitest.config.ts` の `setupFiles` | `tests/unit/setup/network-guard.ts` の登録を外した | `…unmocked-network.fixture.ts: status should be non-zero: expected +0 not to be +0`。(b) と他の 9 件は通った | 2026-11-23 |

  | `gate-self-check.test.ts` (b) | `vitest.config.ts` の `reporters` | `require-executed-tests.ts` の登録を外した | `…all-todo.fixture.ts: status should be non-zero: expected +0 not to be +0`。(a) と他の 11 件は通った | 2026-11-23 |
  | `gate-self-check.test.ts` (a) | `vitest.config.ts` の `passWithNoTests` | `false` を `true` にした（reporter も外した状態で確認） | `…zzz-no-such-file: status should be non-zero: expected +0 not to be +0`。(b) も同時に失敗 | 2026-11-23 |

  | `static-analysis.test.ts`（tsc） | `tsconfig.json` の `strict` | `true` を `false` にした | 「implicit any」が `status should be non-zero: expected +0 not to be +0` で失敗。「src と tests の型エラー」が `expected 'src/bad-source.ts(1,14): error TS2322…' to contain 'tests/e2e/bad-e2e.spec.ts'` で失敗（`boolean = null` は strictNullChecks でのみエラー）。対照は通った | 2026-11-23 |

  | `static-analysis.test.ts`（Biome）「any / 未使用変数 / 未使用 import」 | `biome.json` の `noExplicitAny` | `"off"` にした | `expected 'src/unused-variable.ts:2:9 lint/corre…' to contain 'noExplicitAny'`（他の 2 規則は検出され続けた） | 2026-11-23 |
  | 同上 | `noUnusedImports` | `"off"` にした | `expected 'src/explicit-any.ts:1:17 lint/suspici…' to contain 'noUnusedImports'` | 2026-11-23 |
  | 同上 | `noUnusedVariables` | `"off"` にした | `expected 'src/explicit-any.ts:1:17 lint/suspici…' to contain 'noUnusedVariables'` | 2026-11-23 |
  | `static-analysis.test.ts`（Biome）「it.skip / describe.skip / test.skip」 | `noSkippedTests` | `"off"` にした | `biome check .: status should be non-zero: expected +0 not to be +0` | 2026-11-23 |
  | `static-analysis.test.ts`（Biome）「@playwright/test の直接 import」 | overrides の `noRestrictedImports` | `level` を `"off"` にした | `biome check .: status should be non-zero: expected +0 not to be +0`（`fixtures.ts` の通る側は影響なし） | 2026-11-23 |

  | 同上（ADR-5 の例外） | `biome.json` の overrides の `!tests/e2e/fixtures.ts` | 例外を外した | `tests/e2e/fixtures.ts:1:22 lint/style/noRestrictedImports` で ADR-5 の「通る」側が失敗。`it.todo` の検査も、その中で書く `fixtures.ts` が `@playwright/test` を import するため失敗 | 2026-11-23 |

  | `repo-policy.test.ts` (a) 依存の exact pin | `package.json` の react | `19.3.1` を `^19.3.1` にした | `dependencies.react: expected '^19.3.1' to match /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/` | 2026-11-23 |
  | `repo-policy.test.ts` (b) 24h ゲート | `pnpm-workspace.yaml` の `minimumReleaseAge` | `1440` を `60` にした | `expected [ 'minimumReleaseAge: 60', …(5) ] to include 'minimumReleaseAge: 1440'` | 2026-11-23 |
  | `repo-policy.test.ts` (c) sharp の install スクリプト | `allowBuilds` の `sharp` | `false` を `true` にした | `expected [ 'sharp: true' ] to include 'sharp: false'` | 2026-11-23 |
  | `repo-policy.test.ts` (d) packageManager と mise の pnpm | `package.json` の `packageManager` | `pnpm@12.22.0` を `pnpm@12.21.0` にした | `expected 'pnpm@12.21.0' to be 'pnpm@12.22.0'` | 2026-11-23 |
  | `repo-policy.test.ts` (e) ESLint / Prettier 設定なし | ルートのファイル | `.prettierrc.json` を作った | `expected [ '.prettierrc.json' ] to deeply equal []` | 2026-11-23 |
  | `repo-policy.test.ts` (f) Biome の 3 ルール | `biome.json` の `noUnusedVariables` | `error` を `warn` にした | `expected 'warn' to be 'error'` | 2026-11-23 |
  | `repo-policy.test.ts` (h) テストファイルの配置 | `src/misplaced.test.ts` | `src/` にテストファイルを置いた | `expected [ 'src/misplaced.test.ts' ] to deeply equal []` | 2026-11-23 |
  | `repo-policy.test.ts` (i) `.env.example` に値なし | `.env.example` の `OPENAI_API_KEY` | 値 `not-a-real-value` を付けた | `each line must be NAME= with no value: expected 'OPENAI_API_KEY=not-a-real-value' to match /^[A-Z][A-Z0-9_]*=$/` | 2026-11-23 |
  | `repo-policy.test.ts` (j) `.gitignore` | `.gitignore` の `lefthook-local.*` | その行を消した | `git check-ignore -q -- lefthook-local.yml: status … expected 1 to be +0` | 2026-11-23 |
  | `repo-policy.test.ts` (g) `strict` | `tsconfig.json` の `strict` | 3.1 の行を参照（`static-analysis.test.ts` と同じ `tsc --showConfig` の対象。`repo-policy.test.ts` 単独の PROVE は未実施） | — | — |

  | `placeholder.smoke.spec.ts` | `src/app/page.tsx` の `<h1>` | `genai-lab-ts` を `genai-lab-ts-broken` にした | 1 回目は**通ってしまった**（`getByRole` の `name` は既定で部分一致）。`exact: true` を足して再実施: `✘ … placeholder.smoke.spec.ts`、`Expected: visible`、`Error: element(s) not found`、`1 failed` | 2026-11-23 |
  | `repo-policy.test.ts` ページ (9.2) | `src/app/page.tsx` | 先頭に `"use client";` を足した | `expected '"use client";\n// Placeholder for sta…' not to match /^\s*["']use client["']/m` | 2026-11-23 |
  | `repo-policy.test.ts` ページ (9.1) | `src/app/layout.tsx` | `process.env.APP_TITLE` を参照した | `expected 'import type { ReactNode } from "react…' not to contain 'process.env'` | 2026-11-23 |
  | `repo-policy.test.ts` ページ (9.1) | `src/app/page.tsx` | `import { generateText } from "ai"` を足した | `expected 'import { generateText } from "ai";\n/…' not to match /from\s+["'](ai|@ai-sdk\/…` | 2026-11-23 |

  | `gate-self-check.test.ts` (c) | `playwright.fixture.config.ts` の `reporter` | `require-executed-tests.ts` の登録を外した（`[["list"]]` のみ） | `… all-skip.fixture.ts: status shou…`（`status should be non-zero`。reporter なしでは全部 skip でも exit 0） | 2026-11-23 |
  | `gate-self-check.test.ts` (c) | `require-executed-tests.ts` の `onTestEnd` | `skipped` も実行済みに数えた（`this.executed++` のみ） | 同上: `status should be non-zero` | 2026-11-23 |
  | `gate-self-check.test.ts` (d) | `mise.toml` の `e2e` タスク | `--pass-with-no-tests` を足した | `… --grep @no-such-tag --pass-with-no-tests --reporter list --list: status should be non-zero: expected +0 not to be +0` | 2026-11-23 |

  | `gate-self-check.test.ts` (e) | `tests/e2e/fixtures.ts` の `route.abort` | `route.fallback()` に変えた（記録は残す） | `expected '\nRunning 1 test using 1 worker\n\n  …' not to contain 'not-a-secret'`（要求が実サーバーに届き、入れ子側の `expect(outcome).toBe("blocked")` が `Expected: "blocked"` で失敗。その本文にクエリが出るため） | 2026-11-23 |
  | `gate-self-check.test.ts` (e) | `tests/e2e/fixtures.ts` の teardown の判定 | `if (false && failOnBlockedRequest && …)` にして teardown の失敗を止めた | `… external-request.fixture.ts: status should be non-zero: expected +0 not to be +0` | 2026-11-23 |

  | `network-guard.smoke.spec.ts` (b) | `tests/e2e/fixtures.ts` の `route.abort` | `route.fallback()` に変えた | `Expected: "blocked"` / `Received: "reached"`（`network-guard.smoke.spec.ts:38`。ローカルサーバーに要求が届いた） | 2026-11-23 |
  | `network-guard.smoke.spec.ts` (a) | `fixtures.ts` の `violations.push(...)` | 記録の行を消した | `expect(received).toEqual(expected)`、`blockedRequests` が空配列（期待は `GET http://127.0.0.1:<port>/external` の 1 件） | 2026-11-23 |
  | `placeholder.smoke.spec.ts` と `network-guard.smoke.spec.ts` | `fixtures.ts` の同一オリジンの許可 | `allowedOrigin` の分岐を無効にした（`false && …`） | `2 failed`。`navigating to "http://127.0.0.1:3100/"` で `page.goto` が遮断された（baseURL への要求も止まる） | 2026-11-23 |
  | `gate-self-check.test.ts` (d) の拡張 | `tests/e2e/network-guard.smoke.spec.ts` | ファイルがない状態（RED） | `expected 'Listing tests:\n  [chromium] › placeh…' to contain 'network-guard.smoke.spec.ts'` | 2026-11-23 |

  | `check-model-ids.test.ts`（allowlist の形状） | `model-allowlist.ts` の `ollama` | `[]` にした | `ollama needs at least one model ID: expected 0 to be greater than 0` | 2026-11-23 |
  | 同上 | `ollama` の ID | `google` と同じ ID にした | `has no duplicate IDs across providers`: `expected 6 to be 7` | 2026-11-23 |
  | 同上 | `PROVIDERS` | `ollama` を外した | `lists exactly the four providers`: `expected [ 'anthropic', 'google', 'openai' ] to deeply equal …` | 2026-11-23 |

  | `check-model-ids.test.ts` | `check-model-ids.mjs` の Anthropic の系列 | `fable` を系列の一覧から外した | `flags claude-fable-77 as anthropic` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | OpenAI の `o<数字>` パターン | パターンを消した | `flags o7 as openai` と `flags o7-mini as openai` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | `EXCLUDED_PREFIXES` | `tests/fixtures/` の除外を外した | `ignores tests/fixtures/** (6.6)` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | `EXCLUDED_FILES` | allowlist ファイルの除外を外した | `ignores the allowlist file itself (6.1)` ほか 3 件（`exits 0 …`、`does not flag ordinary words …`、`ignores tests/fixtures/** …`）が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | `git ls-files` の `--exclude-standard` | 外した | 1 回目は**どのテストも失敗しなかった**（ignore したファイルを `ignored/` に置いたため、走査対象外の `ignored/` で除外されていた）。ファイルを `src/ignored/` に置き直して再実施: `ignores files that git ignores … (ADR-6)` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | 終了コード（環境エラー） | `process.exit(2)` を `process.exit(0)` にした | 使い方の誤り・git 失敗・allowlist 読み込み失敗の 6 件が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | 終了コード（検出） | `process.exit(1)` を `process.exit(0)` にした | 走査対象の種類ごとの検出ケース（`src/feature.ts` ほか）が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | 桁位置 | `column` を 0 始まりにした | `is reported with path:line:column in …` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | NUL バイトの除外 | `buffer.includes(0)` の行を消した | `skips files that contain a NUL byte` が失敗 | 2026-11-23 |
  | `check-model-ids.test.ts` | 単語境界 | `(?<![A-Za-z0-9_-])` を `\b` にした | `does not flag an ID that is only the tail of a longer hyphenated word` が失敗。1 回目の試みは別の理由で結果が空だった（下記） | 2026-11-23 |

  | `gitleaks-pre-commit.test.ts` | `lefthook.yml` の secrets ジョブ | `--redact` を外した | `does not print the secret value (8.6)` と、フック経由の `refuses a commit that contains a secret …` が失敗: `the output leaked a secret of length 40: expected true to be false`（値は表示されず長さだけ） | 2026-11-23 |
  | `gitleaks-pre-commit.test.ts` | 同上 | `--staged` を外した | `makes gitleaks exit non-zero for a staged secret (8.1)`、`does not print the secret value (8.6)`、`is not switched off by a gitleaks:allow comment (8.5)`、フック経由の拒否の 4 件が失敗（未 commit の履歴を見るため、stage しただけの秘密値を検出しない） | 2026-11-23 |
  | `gitleaks-pre-commit.test.ts` | 同上 | `--ignore-gitleaks-allow` を外した（開発者の手元で実施） | `is not switched off by a gitleaks:allow comment (8.5)` の 1 件だけが失敗: `…/gitleaks git --pre-commit --staged --redact --verbose: status should be non-zero: expected +0 not to be +0`。戻すと 116/116 | 2026-11-23 |

  | `check-commit-msg.test.ts` | `TYPES` | `perf` を外した | `accepts perf: x` と、期待する形式の説明の検査（型の一覧に `perf` を含む）が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | `CONVENTIONAL` の scope | `[^()\s]+` を `[^()\s]*` にした（空の scope を許す） | `rejects "feat(): x"` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | `CONVENTIONAL` の `!` | `!?` を外した | `accepts a scope and a breaking-change marker in feat!: x` と `… feat(api)!: x` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | `CONVENTIONAL` の件名 | 末尾の `\S`（空白でない文字）を外した | `rejects "feat: "` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | `subjectLine` | `#` で始まる行を読み飛ばさなくした | `skips comment and blank lines before the subject, as the editor template does` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | `GIT_GENERATED` | `Merge ` を外した | `accepts Merge branch "main"` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | 引数の数 | `argv.length !== 1` を `< 1` にした | `rejects a call with two arguments` が失敗 | 2026-11-23 |
  | `check-commit-msg.test.ts` | 拒否時の終了コード | `return 1` を `return 0` にした | 拒否を期待する 12 件（`rejects "unknown: x"`、`rejects "Feat: x"`、`rejects "feat x"` ほか）が失敗 | 2026-11-23 |

  | `verify-offline-contract.test.ts` | `mise.toml` の `verify` | `{ task = "security" }` を足した（タスクが存在しない状態） | 構成の 4 件が失敗: `expected [ 'check', 'typecheck', …(5) ] to deeply equal [ 'check', 'typecheck', …(4) ]`、`mise task "security" does not exist` | 2026-11-23 |
  | `verify-offline-contract.test.ts` | 同上 | ネットワークを使う実コマンドのタスク（`pnpm audit --audit-level=high`）を `verify` から参照させた | 4 件が失敗: `"pnpm audit --audit-level=high" contains "pnpm audit"`、`starts "pnpm": expected [ 'biome', 'tsc', 'next', …(4) ] to include 'pnpm'` | 2026-11-23 |
  | `verify-offline-contract.test.ts` | 同上 | `check:secrets` と `test` の順を入れ替えた | `runs the six checks in order and nothing else, one after another (3.1, 3.6)` が失敗 | 2026-11-23 |
  | `verify-offline-contract.test.ts` | `alias` | `gate` を `gates` にした | `is also reachable as \`gate\`, with the same checks (3.3)` が失敗: `expected [ 'gates' ] to deeply equal [ 'gate' ]` | 2026-11-23 |
  | `gitleaks-pre-commit.test.ts`（`check:secrets`） | `check:secrets` の `--redact` | 外した | `exits non-zero for a committed secret, names the rule, and never prints the value` が失敗: `the output leaked a secret of length 40` | 2026-11-23 |
  | `gitleaks-pre-commit.test.ts`（`check:secrets`） | `check:secrets` の `--log-opts=HEAD` | 外した | `scans only what HEAD reaches, not other branches (3.7)` が失敗（別ブランチの秘密値を見て、HEAD が clean でも非 0 になる） | 2026-11-23 |

  | `hooks-config.test.ts`（security） | `mise.toml` の `security` | `security:osv` と `security:audit` の順を入れ替えた | `runs security:osv then security:audit, in that order and nothing else (4.1)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | `security:audit` | `--ignore-registry-errors` を足した | `fails on high advisories and does not hide registry errors (4.2, 4.4)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | 同上 | `--audit-level=high` を `critical` にした | 同上が失敗: `expected 'pnpm audit --audit-level=critical' to contain '--audit-level=high'` | 2026-11-23 |
  | `hooks-config.test.ts`（security） | 同上 | `|| true` を付けた | 同上が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | `security:osv` | `--lockfile=pnpm-lock.yaml` を `package.json` にした | `scans pnpm-lock.yaml with osv-scanner and cannot turn a failure into success (4.3)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | 同上 | `|| true` を付けた | 同上が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | `osvIgnoreProblems`（除外の記録形式、4.5） | 退役条件の検査を無効にした（`else if (false)`） | `rejects an osv exclusion without ignoreUntil, without a reason, or without a retirement` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security） | `auditIgnoreProblems`（同上） | `Retire when:` の検査を無効にした（`if (false)`） | `rejects an audit.ignore entry that lacks either comment, and checks every entry` が失敗 | 2026-11-23 |

  | `hooks-config.test.ts`（補助タスク） | `runtime` | `lefthook version` の行を消した | `runtime prints the seven tool versions, in order, and compares none of them (5.1, 5.2)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（補助タスク） | 同上 | `osv-scanner --version | grep 2.7.1` にした（版を照合する形） | 1 回目は**一覧の完全一致で先に落ち**、照合を禁じる検査には届かなかった。一覧の比較をパイプ・`&&`・`||` の手前までにして再実施: `osv-scanner --version | grep 2.7.1: expected … not to match /\|\||&&|;|\bgrep\b|==|\btest\b|\[/` | 2026-11-23 |
  | `hooks-config.test.ts`（補助タスク） | `outdated` | `pnpm outdated` を `pnpm update` にした | `outdated lists tool updates, then npm updates, and writes nothing (5.3, 5.4)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（補助タスク） | 同上 | `pnpm outdated || true` にした（終了コードを隠す） | 同上が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（補助タスク） | `setup` | `pnpm install --frozen-lockfile` から `--frozen-lockfile` を外した | `setup installs from the lockfile, installs the browser, then registers the hooks (13.3)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（補助タスク） | `verify` | `{ task = "setup" }` を足した | `keeps all three out of verify, which must stay offline (3.6)` ほか、`verify` の構成の 4 件が失敗 | 2026-11-23 |

  | `hooks-config.test.ts`（フック） | `lefthook.yml` の pre-commit のジョブ名 | `model-ids` を `model-id-check` にした | `runs four pre-commit jobs in parallel (7.2)` と `runs the whole type check and the model-ID check through mise … (7.2, 7.8)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | pre-push のジョブの順 | `unit-tests` と `e2e-smoke` を入れ替えた | `runs pre-push one job after another, cheapest first, stopping at the first failure (7.5, 7.6)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | pre-push の `piped` | `piped: true` を `parallel: true` にした | 同上が失敗: `expected undefined to be true` | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | `assert_lefthook_installed` | `false` にした | `asserts that lefthook is installed, so a missing lefthook fails the hook (7.7)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | pre-push のジョブが呼ぶ mise タスク | `security:audit` を存在しない `security:audits` にした | `only refers to mise tasks that exist (7.8)` が `hook refers to the missing mise task "security:audits"` で失敗。ほかに pre-push の順と、`uses the same audit threshold …` も失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | commit-msg のジョブ | `{1}`（メッセージファイルの引数）を外した | `has a commit-msg job that runs the Conventional Commits check on the message file (7.4)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（フック） | biome のジョブ | `--no-errors-on-unmatched` だけを外した | `checks the staged files with Biome without failing on files it does not handle (7.2)` が失敗 | 2026-11-23 |

  | `repo-policy.test.ts`（Next.js の設定） | `next.config.ts` の `partialPrefetching` | `false` を `true` にした | `keeps Partial Prefetching off globally while routes adopt it one at a time` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Next.js の設定） | `experimental.agentUpgrade` | `false` を既定値 `"security"` にした | `stops next dev from rewriting AGENTS.md, whose guidance is kept by hand` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Next.js の設定） | `AGENTS.md` の案内 | `node_modules/next/dist/docs/` の記述を消した | `keeps the guidance of the removed block in AGENTS.md: read the bundled docs first` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Next.js の設定） | `AGENTS.md` | `<!-- BEGIN:nextjs-agent-rules -->` の空ブロックを戻した | `keeps no managed Next.js block in AGENTS.md` が失敗 | 2026-11-23 |

  | `repo-policy.test.ts`（CI） | `ci.yml` の checkout（2 か所） | SHA をタグ `@v7.0.1` にした | `pins every \`uses:\` to a 40-character commit SHA (10.8)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（CI） | `verify-node27` の `env` | `OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}` を足した | `refers to no secret other than GITHUB_TOKEN … (10.10)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify` ジョブ | `mise run security` の行を消した | `runs verify and security in the required verify job (10.1)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify-node27` | `mise run security` を足した | `runs verify, and not security, in the Node 27 job (10.3)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify` ジョブ | `continue-on-error: true` を足した | `lets only the Node 27 job fail … (10.4)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify-node27` | `continue-on-error: true` を消した | 同上が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify` の checkout | `fetch-depth: 0` を `1` にした | `checks out the full history in the verify job … (10.6)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | 2 つのジョブの install | `--frozen-lockfile` を外した | `installs only from the lockfile, in every job (10.7)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | 最上位の `permissions` | `{}` を `write-all` にした | `grants nothing at the top and only \`contents: read\` to each job (10.9)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify` の `if` | `github.event_name != 'schedule'` を消した | `keeps the verify job off the weekly schedule …` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（CI） | `verify` の最後のステップ | `git status --porcelain` の確認を消した | `does not let verify change tracked files (I-11)` が失敗 | 2026-11-23 |

  | `hooks-config.test.ts`（security-daily） | `security-daily.yml` の `cron` | 毎日（`* * *`）を週 1 回（`* * 1`）にした | `runs every day on a schedule, and by hand (10.5)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security-daily） | `workflow_dispatch` | 消した | 同上が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security-daily） | ジョブのステップ | `mise run security` を `mise run runtime` にした | `runs the security task and nothing that writes to the repository (10.5)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security-daily） | ジョブの `permissions` | `contents: read` を `write` にした | `grants nothing at the top and contents: read to its job (10.9)` が失敗 | 2026-11-23 |
  | `hooks-config.test.ts`（security-daily） | checkout の `persist-credentials` | `false` を `true` にした | `does not keep the checkout's credentials on disk … (10.9)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（CI、共通の規則） | `security-daily.yml` の mise-action | SHA をタグ `@v5.3.0` にした | `pins every \`uses:\` to a 40-character commit SHA (10.8)` が失敗（8.1 の規則がこのファイルも走査する） | 2026-11-23 |
  | `repo-policy.test.ts`（CI、共通の規則） | 同上の `with` | `github_token: ${{ secrets.ANTHROPIC_API_KEY }}` を足した | `refers to no secret other than GITHUB_TOKEN … (10.10)` が失敗 | 2026-11-23 |

  | `repo-policy.test.ts`（Dependabot） | npm の `schedule.interval` | `weekly` を `daily` にした | `checks npm weekly at the repository root (10.11)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Dependabot） | npm の `cooldown.default-days` | `1` を `0` にした | `waits at least a day after a release before proposing it for npm (10.12)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Dependabot） | `github-actions` の項目 | 項目ごと消した | エコシステムの一覧と、`github-actions` の 3 件（週次・cooldown・commit-message）が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Dependabot） | npm の `commit-message.prefix` | `build` を `chore` にした | `writes commits as \`build(deps):\` … (npm)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Dependabot） | npm の `groups` | 消した | `groups all npm updates into one weekly pull request` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Dependabot） | `updates` | 3 つ目のエコシステム（`docker`）を足した | `declares version 2 and exactly the npm and github-actions ecosystems (10.11)` が失敗 | 2026-11-23 |

  | `repo-policy.test.ts`（Node 27 レーン） | `mise.node27.toml` | `pnpm = "12.21.0"` を足した | `changes only node between the two lanes …` と `declares nothing but node in mise.node27.toml (11.1)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Node 27 レーン） | 同上の node | `27.0.0-alpha.0.1.1` を範囲 `27` にした | `pins node to an exact Node 27 version in the node27 lane … (1.1, 11.1)` が失敗 | 2026-11-23 |
  | `repo-policy.test.ts`（Node 27 レーン） | 同上の node | 既定レーンと同じ `26.13.1` にした | 同上と `changes only node between the two lanes …` が失敗 | 2026-11-23 |

  補足（2026-11-23 実測）: `passWithNoTests: true` にして reporter を残すと、(a) は**通る**（13/13）。ファイル 0 件でも
  reporter の `onTestRunEnd` が走り、実行 0 件として exit 1 にするため。つまり (a) の「ファイル 0 件で失敗」は
  `passWithNoTests: false` と reporter の二重のガードで、どちらか片方を外しても (a) は落ちない。両方を外したときだけ
  落ちる（上の行）。(b)（todo のみ）を守るのは reporter だけ。

  RED（実装前）: `Cannot find module './helpers/sandbox'` でスイートが失敗（2026-11-23）。
  `gate-self-check.test.ts` の RED（reporter 実装前）: (b) が `status should be non-zero: expected +0 not to be +0` で失敗、(a) は通った。
  `network-guard.test.ts` の RED（ガード実装前）: (a) が `status should be non-zero: expected +0 not to be +0` で失敗、(b) は通った。

  **残りの行（タスク 12.3、2026-11-25、コミット 8afb1f0 の使い捨て clone、破壊ごとに clone を HEAD に戻した）**。上の表で
  行がなかった項目と、`hooks-config.test.ts` の実行ケース（タスク 7.5、R-9）の再確認。

  | テスト | 壊した対象 | 壊し方 | 失敗の出力（要点） | 確認日 |
  |--------|-----------|--------|---------------------|--------|
  | `gitleaks-pre-commit.test.ts`「keeps gitleaks on its default rules …（8.5）」 | リポジトリのルート | `.gitleaks.toml`（`[extend] useDefault = true`）を置いた | `.gitleaks.toml would make the hook and this test diverge: expected true to be false`。1 failed / 10 passed | 2026-11-25 |
  | `repo-policy.test.ts` (g)「enables TypeScript strict mode (2.3)」 | `tsconfig.json` の `strict` | `true` を `false` にした | `expected false to be true`。1 failed / 45 passed（上の「未実施」の行を埋める） | 2026-11-25 |
  | `hooks-config.test.ts` ケース 1（7.1） | 「registers the three hook files」の `lefthook install` | 呼び出しを消した | `pre-commit should be installed: expected false to be true`（R-9 の 7.5 の記録と同じ） | 2026-11-25 |
  | `hooks-config.test.ts` ケース 2（7.7） | 「fails, naming gitleaks …」の環境 | `isolatedEnv({ pathDirs: [] })` を `isolatedEnv()`（ツールあり）にした | `…/.git/hooks/pre-commit: status should be non-zero: expected +0 not to be +0`（同上） | 2026-11-25 |
  | `hooks-config.test.ts` ケース 3（7.7） | 「fails with a clear message …」 | `breakEmbeddedLefthookPath(dir)` を消した | `output: expected '…╭───…' to match /Can't find lefthook in PATH/`（lefthook が起動した。同上） | 2026-11-25 |
  | `hooks-config.test.ts` ケース 3'（7.7） | `repoWithHook` の既定 | `assertInstalled ?? true` を `?? false` にした | 同じテストが `status should be non-zero: expected +0 not to be +0`（同上） | 2026-11-25 |
  | `docs-structure.test.ts`（段の解説・README、タスク 11.1） | `docs/stages/1-…md` と `README.md` | 「改造する」を消す／「読む」と「動かす」を入れ替える／存在しない `tests/unit/nope.test.ts` を書く／`tests/` を `tezts/` にする／`Stage1.md` を足す／README から 3 つのコマンドを 1 つずつ消す | 順に `missing section …`、`sections are out of order`、`names tests/ paths that do not exist`、`names no tests/ path`、`does not match <n>-<slug>.md`、`README.md does not mention …`（PROVE の記録は `pdca/do.md` のタスク 11.1） | 2026-11-25 |

  **一時ディレクトリの後始末（8.8、同日）**: Node の `os.tmpdir()`（`/var/folders/…/T`）直下の `genai-lab-test-*` を数えた。
  `gitleaks-pre-commit.test.ts` の成功の実行（11 passed）の前後とも 0 件。`lefthook.yml` の secrets ジョブから `--redact` を外して
  一時リポジトリの中で 2 件を失敗させた実行（`the output leaked a secret of length 40` ほか、2 failed / 9 passed）の前後とも
  0 件。一時リポジトリがこのディレクトリに作られていること自体は、`hooks-config.test.ts` の失敗の出力のパス
  （`/var/folders/…/T/genai-lab-test-OzuTT2/.git/hooks/pre-commit`）で確かめた。削除は `createTempGitRepo` の
  `onTestFinished` が、テストの成否に関係なく行う。
  **静的解析の違反で非 0（2.4、2.5）**: 上の表の `static-analysis.test.ts` の行（`strict`、各ルールの `off`）と、R-9 の
  (d1)・(d2)（verify が `check`・`typecheck` で exit 1・2 になり止まる）。
- **R-11 実行時間**（NFR）: pre-commit 全体、pre-push 全体、E2E `@smoke`、verify 全体（開発機と CI）。

  **開発機（タスク 12.1、2026-11-25、macOS 27.2 / Apple M2 8 コア、コミット 8afb1f0 の clean な clone）**。壁時計の時間。

  | 対象 | 所要 | 内訳・条件 |
  |------|------|------------|
  | pre-commit 全体（`lefthook run pre-commit`） | 1.3 s | `.tsx` 1 ファイルを stage。並列の 4 ジョブ: secrets 0.45 s、model-ids 0.48 s、biome 0.59 s、typecheck 0.98 s |
  | pre-push 全体（`lefthook run pre-push --force`） | 19.5 s | 直列: osv-scanner 1.42 s、pnpm-audit 0.51 s、unit-tests 14.32 s、e2e-smoke 2.97 s。ネットワークあり |
  | E2E `@smoke`（`mise run e2e`） | 3.5 s | 2 passed（Playwright の表示 2.5〜3.0 s）。目安の 60 s に対して十分に短い（TODO(E2E_BUDGET) は未確定のため合否に使わない） |
  | `mise run verify` 全体 | 19〜24 s | R-3 の 3 回（オフライン）。1 回目 24 s、2・3 回目 19 s |
  | `mise run test` | 14.3 s | 234 件。Vitest の `Duration` 14.5〜15.2 s |

  - `--force` を付けた理由: clone の origin は実リポジトリで、同じコミットを指すため、素の `lefthook run pre-push` は
    `no matching push files` で 4 ジョブすべてを **skip** し、0.11 s・exit 0 で終わった。lefthook 2.2.2 の pre-push は、push する
    ファイルが 1 つもないとジョブを実行しない（`--force` の説明は `do not skip if no files changed`）。ファイルの変更を含む
    通常の push では実行される（タスク 7.5 の `lefthook run pre-push` は 4 ジョブとも実行）。ファイルを変えない push
    （空のコミットだけ、または既にリモートにあるコミットの push）ではフックの検査が走らない。CI の `verify` ジョブは
    push ごとに `verify` と `security` を実行するので、検査そのものは抜けない。
  - 子プロセスを使うテストの timeout: 実際の設定は `describe` ごとに 120 s（tasks.md の「初期値 60 秒」より長い）、
    `runCommand` は 30 s（`tests/unit/helpers/sandbox.ts` の `timeoutMs ?? 30_000`）。1 件あたりの最長は 3.3 s
    （`gitleaks-pre-commit.test.ts`「refuses a commit that contains a secret …」）、次いで 3.2 s（`gate-self-check.test.ts` (e)）、
    2.6 s（`hooks-config.test.ts` の対照ケース）。どちらの上限にも 9 倍以上の余裕があるので**変えない**。

  **CI（タスク 12.5、2026-11-25、run 45614530248、GitHub-hosted ubuntu）**。ステップの開始・終了時刻から。

  | 対象 | `verify` ジョブ | `verify-node27` ジョブ |
  |------|-----------------|------------------------|
  | ジョブ全体 | 78 s（12:31:14〜12:32:32） | 106 s（失敗） |
  | mise-action（ツールの導入） | 6 s | 8 s |
  | `pnpm install --frozen-lockfile` | 2 s | 2 s |
  | `playwright install --with-deps chromium` | 40 s | 19 s |
  | `mise run verify` | 18 s（うち unit 約 13 s、`@smoke` 2.7 s） | 71 s（unit 通過の後、`webServer` の 60 s の時間切れ） |
  | `mise run security` | 0.6 s | 実行しない |

  ジョブの時間の半分はブラウザの導入で、ゲート自体（`verify` + `security`）は約 19 s。開発機の 19〜24 s と同程度。
