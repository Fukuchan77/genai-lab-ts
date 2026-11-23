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
- **R-2 install と peer 警告**（1.8、1.9、plan §8 の 3 項目目）: `pnpm install --frozen-lockfile` の終了コード、
  peer 警告の全文と扱い、`allowBuilds` の各項目と理由。
- **R-3 オフラインと決定論**（3.5、3.7）: ネットワーク切断・API キー未設定での `mise run verify` の結果、
  3 回連続実行の合否、verify 後の `git status --porcelain`。
- **R-4 security の失敗系**（4.2〜4.4）: registry 到達不能時の `pnpm audit` / osv-scanner の終了コード。
- **R-5 モデル ID の根拠**（6.2）: 登録した ID ごとの公式ドキュメントの URL と確認日。
- **R-6 ZIP 検証**（12.1〜12.4、plan §8 の 5 項目）: 使い捨て環境の再現手順、ファイルごとの型エラー、
  AI SDK 7 の API 名の有無、SSE モックの解釈結果、引き継ぎ先の段。
- **R-7 TypeScript 7.1 の公開状況**（12.5、12.6）: 確認日、RC / stable の有無と公開日時、採用した版。
- **R-8 Node 27 レーン**（11.2、11.3）: `MISE_ENV=node27 mise install` の出力と必要だった設定。
- **R-9 ゲートの違反時の動作**（9.6）: 3.8・3.9・3.11 の違反状態と、verify の該当構成要素の終了コード。
- **R-10 非空虚の確認**（9.7）: 受け入れテストごとに、壊した対象、壊し方、失敗したことの出力。
- **R-11 実行時間**（NFR）: pre-commit 全体、pre-push 全体、E2E `@smoke`、verify 全体（開発機と CI）。
