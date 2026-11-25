HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
reviewer: sdd-reviewer (codex unavailable: not logged in)

# 001-dev-environment-and-gates — Plan Review（/sdd-validate-plan Step 3.5、round 1）

- 対象: `specs/001-dev-environment-and-gates/plan.md`（未コミット、840 行）、`research.md`、`spec.md`
- 参照: `.sdd/memory/constitution.md` 1.0.0、`.sdd/steering/*.md`、`AGENTS.md`、`specs/000-development-plan/plan.md`
- prior reviews: なし（`.sdd/reviews/` は本ファイルが最初）
- Risk trigger: なし（タスク生成前の plan 相互レビュー）。**注記**: Codex が使えないため Claude が代行した。
  plan の作成者も Claude 系なら、これは憲章 原則 11 / AGENTS.md の「別モデルファミリーによるレビュー」を
  満たさない（finding 29）。

## 実測（probe）の要約

scratchpad で実行（リポジトリは変更していない）。

| Probe | 結果 |
|-------|------|
| `vite.mergeConfig({test:{include:[A]}},{test:{include:[B]}})`（vite 8.3.8） | `include: [A, B]`。配列は**連結**され、置き換えにならない |
| lefthook 2.2.2: `assert_lefthook_installed: true`、ステージ済みファイルなし、`PATH=/usr/bin:/bin` で `.git/hooks/pre-commit` | `(skip) no matching staged files` → **exit 0** |
| 同上、ファイルをステージ | gitleaks が 127 → exit 1。`assert_lefthook_installed` を消しても同じ（フックに埋め込まれた絶対パスで lefthook が起動するため） |
| `lefthook dump --format=json` | `assert_lefthook_installed`、`pre-commit.parallel`、`pre-push.piped`、`jobs[].{name,run}` が取れる。`{1}` はそのまま。dump を `lefthook.json` として読み戻せる |
| gitleaks 8.30.1 `gitleaks git --redact`（HEAD は clean。秘密値はローカルの別ブランチ、または stash にだけある） | どちらも **exit 1**。ブランチを消すと exit 0。HEAD ではなく `--all` のローカル ref を走査している |
| `mise ls --current --json`（mise 2026.11.12、一時プロジェクト） | ユーザー全体設定のツール（`deno latest`、`pnpm latest`、`node 26` など）が `source.path=~/.config/mise/config.toml` 付きで混ざる |
| `mise tasks ls --json` | `aliases`、`run` が取れる。`run = [{task="check"}, …]` の要素は**オブジェクト**になる。どちらの書き方でも最初の失敗で止まり、同じ終了コードを返す |
| `pnpm config get <key> --json`（pnpm 12.22.0） | `pnpm-workspace.yaml` の `minimumReleaseAge`、`savePrefix`、`allowBuilds` を読める。`strictDepBuilds` は `null`（未設定のときは報告されない） |
| `git commit`（`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_*` を除いた状態、macOS） | ホスト名から作った identity で成功した。Linux ランナーでは「unable to auto-detect email address」になる見込み（未実測） |

Playwright の `--list` / `test.fail()` の probe は、権限の都合で実行できなかった（該当する finding は確信度で区別した）。

## Critique

### [HIGH] CI が依存の install 前に `mise run runtime` を実行し、`pnpm exec tsc -v` / `pnpm exec next --version` で失敗する
**Location**: specs/001-dev-environment-and-gates/plan.md:332
**Issue**: `runtime` タスクは `node_modules` に入る bin（tsc、next）を呼ぶ。CI はこれを `pnpm install --frozen-lockfile` の前に実行するので、必須ジョブ `verify` が最初のステップで赤くなる。
**Evidence**: 「mise-action（SHA 固定、mise 本体の版も exact 指定）→ `mise run runtime` → `pnpm install --frozen-lockfile` →」と、C5 の「`runtime`: … `pnpm exec tsc -v`、`pnpm exec next --version` …」。Interfaces の CI 表でも「runtime → install（frozen）→ browsers → verify」。
**Confidence**: high
**Proof**: クリーンな checkout で `mise install && mise run runtime` を実行する → `pnpm exec tsc` が "Command not found" で非 0（`run` 配列は最初の失敗で止まる。probe で確認済み）。
**Fix**: CI の順序を `mise-action → pnpm install --frozen-lockfile → mise run runtime → playwright install → verify → security` に変える。verify-node27 も同じにする。security-daily で runtime を使う場合も install の後に置く。

### [HIGH] E2E 通信ガードの自己検査が `test.fail()` に頼っており、どんな失敗でも合格になる（空振り）
**Location**: specs/001-dev-environment-and-gates/plan.md:313
**Issue**: `test.fail()` は失敗の原因を区別しない。ガードが壊れても、`.invalid` への `fetch` は DNS エラーで reject する（オフラインでも同じ）。そのためテスト本体が throw するか、遷移やセレクタのタイムアウトで落ちれば「期待どおりの失敗」として緑になる。3.11 / 9.6 の根拠として非空虚ではない。
**Evidence**: 「`test.fail()`。`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。ガードが働けば teardown で失敗し、期待どおりの失敗として合格する。ガードが壊れると『予期せず成功』で失敗する」。research の Risks にも「`test.fail()` が auto fixture の teardown 失敗を『期待どおりの失敗』として扱うか未確認」とある。
**Confidence**: high（`test.fail()` が原因を問わないことは Playwright の仕様。teardown の扱いは未確認）
**Proof**: fixture の `route.abort` と記録を消す（ガードを壊す）→ ページ内の `fetch('https://x.invalid')` が `TypeError: Failed to fetch` で reject → `page.evaluate` が throw → `test.fail()` の下で合格。
**Fix**: `test.fail()` をやめる。fixture に「違反の一覧を公開し、teardown で失敗させるかどうかを切り替えるオプション」（例: `networkGuardMode: "record"`）を足し、自己検査ではページ内の fetch の reject を握りつぶしたうえで `expect(violations).toEqual([{ method: "GET", url: … }])` と直接確かめる。別案として、unit 側（`network-guard.test.ts`）と同じように入れ子の `playwright test` で fixture spec を実行し、非 0 と、ガードに固有のエラーメッセージが出力に含まれることを確かめる。

### [HIGH] 入れ子実行の fixture 設定を `mergeConfig` で作ると `include` が連結され、unit スイート全体（自分自身を含む）が再帰的に実行されうる
**Location**: specs/001-dev-environment-and-gates/plan.md:273
**Issue**: Vite / Vitest の `mergeConfig` は配列を連結する。そのため fixture 設定の `include` は `["tests/unit/**/*.test.ts", "tests/fixtures/gate/…"]` になる。CLI のファイル指定を忘れたり、`network` のように本体のテストファイルにも一致する指定をしたりすると、`network-guard.test.ts` が自分を入れ子で起動し、プロセスが増え続ける。
**Evidence**: 「実設定を `mergeConfig` した `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の `vitest run` を 2 回起動する」「ファイル名は本体の `include`（`*.test.ts`）に一致させない」。後者は include が置き換わる前提で書かれているが、実際には置き換わらない。
**Confidence**: high（連結は実測）/ medium（再帰が実際に起きるかは実装しだい）
**Proof**: `node -e` で `mergeConfig({test:{include:['tests/unit/**/*.test.ts']}},{test:{include:['tests/fixtures/gate/*.fixture.ts']}}).test.include` を出力 → 2 要素（scratchpad の probe 出力）。
**Fix**: fixture 設定では `mergeConfig` の後で `test.include` を**代入で上書き**し、fixture のファイルだけにする（`setupFiles` は実設定から引き継ぐ）。あわせて再帰を防ぐ: 入れ子の子に `GATE_NESTED=1` を渡し、入れ子を起動するテストはこの変数があれば即座に失敗する。`gate-self-check.test.ts` の (a) にも同じ防止を入れる。

### [MEDIUM] 7.7 の実行時の検査（最小 PATH でフックを実行 → 非 0）が書いたとおりには成り立たず、`assert_lefthook_installed` の分岐も通らない
**Location**: specs/001-dev-environment-and-gates/plan.md:294
**Issue**: ステージ済みファイルがないと lefthook は全ジョブを skip して exit 0 になる。ステージしても、lefthook は埋め込まれた絶対パスで起動し、ジョブ側のツール不在（127）で落ちる。このため `assert_lefthook_installed` を消しても結果が変わらず、「lefthook が見つからない」分岐（mise の自動 prune で旧版が消えたときの典型例）を検査していない。
**Evidence**: 「一時リポジトリに `lefthook.yml` を置いて `lefthook install` → … そのフックを `PATH=/usr/bin:/bin` で実行 → 非 0（7.7、I-4）」。research I-4 にも「埋め込みパスあり → exit=1（gitleaks 不在でジョブ失敗）」とある。
**Confidence**: high（実測: ステージなし exit 0、ステージあり exit 1、assert の有無で差がない）
**Proof**: 本レビューの probe。`assert_lefthook_installed` を外した `lefthook.yml` でも、ステージありの実行は exit 1 のまま。
**Fix**: 2 つのケースに分ける。(1) ファイルをステージしてから最小 PATH で実行 → 非 0。(2) `LEFTHOOK_BIN=/nonexistent` を渡すか、フックの埋め込みパスを一時リポジトリ内で無効化して実行 → 非 0 で、出力に "Can't find lefthook" が含まれる。(2) は `assert_lefthook_installed: false` の対照で exit 0 になることも確かめる（非空虚）。

### [MEDIUM] フック経由の秘密値テスト（C10 の 5）が、git の identity なしで commit する。Linux CI では両方のケースが非 0 になり、拒否の原因も確かめない
**Location**: specs/001-dev-environment-and-gates/plan.md:244
**Issue**: `isolatedEnv()` は `GIT_*` を除き、グローバル設定を `/dev/null` にするので `user.name` / `user.email` がない。macOS ではホスト名から作った identity で commit が通るが（実測）、Linux ランナーでは「unable to auto-detect email address」で失敗しうる。そうなると「偽キーの commit が非 0」は gitleaks と無関係に成立し、対照の「秘密値なしの commit が 0」だけが落ちる（プラットフォームで結果が変わる）。
**Evidence**: 「偽キーを含む `git commit` が非 0、秘密値なしの `git commit` が 0 で終わることを確かめる」と、C6 の「`isolatedEnv()`（`GIT_*`、`GITLEAKS_*`、`LEFTHOOK*` を除き、`GIT_CONFIG_GLOBAL=/dev/null` …）」。
**Confidence**: medium（macOS は実測、Linux は git の既知の挙動からの推定）
**Proof**: ubuntu-24.04 で `env -u GIT_AUTHOR_EMAIL … GIT_CONFIG_GLOBAL=/dev/null git commit -m "feat: x"` を実行する（hostname にドメインがなければ fatal）。
**Fix**: `isolatedEnv()` で `GIT_*` を除いた**後に**、`GIT_AUTHOR_NAME/EMAIL`、`GIT_COMMITTER_NAME/EMAIL` に固定の偽の値を入れる（または `git -c user.name=… -c user.email=… commit`）。拒否のケースでは、終了コードに加えて (a) `git rev-parse --verify HEAD` が失敗する、または HEAD が変わっていないこと（commit が作られていない）、(b) 出力に gitleaks の検出（RuleID など）があり、偽キーの値は含まれないことを確かめる。

### [MEDIUM] 秘密値テストの gitleaks は一時リポジトリの既定設定で動き、リポジトリの実効設定とずれうる
**Location**: specs/001-dev-environment-and-gates/plan.md:237
**Issue**: gitleaks は設定を「`--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`」の順で探す。テストの target は一時リポジトリなので、本物のリポジトリに `.gitleaks.toml`（例: `disabledRules`、`useDefault = false`）があっても使われない。フックでは検出されない値が、テストでは検出されて緑になる。
**Evidence**: 手順 6「リポジトリに `.gitleaksignore` がなく、gitleaks の設定ファイルに allowlist がないことを確かめる」（設定ファイルが存在しうる前提）。`gitleaks git --help` の "order of precedence … 4. (target path)/.gitleaks.toml"。
**Confidence**: high
**Proof**: リポジトリのルートに `[extend]\nuseDefault = true\ndisabledRules = ["github-pat"]` の `.gitleaks.toml` を置く → 実際の pre-commit は `ghp_…` を通すが、C10 のテストは緑のまま。
**Fix**: 方針を 1 つ決めて plan に書く。案 A: リポジトリに gitleaks の設定ファイルを置かないこととし、テストでその不在を確かめる。案 B: リポジトリの `.gitleaks.toml` があれば一時リポジトリへコピーしてから実行する。あわせて、8.5 の「インライン除外コメントを使わない」を機械的に守らせるため、secrets ジョブと `check:secrets` に `--ignore-gitleaks-allow` を付ける（hooks-config の検査対象にも加える）。

### [MEDIUM] `check:secrets`（`gitleaks git`）は HEAD ではなく、すべてのローカル ref（別ブランチ、stash）を走査する。verify の合否が「同一コミット」で決まらない
**Location**: specs/001-dev-environment-and-gates/plan.md:460
**Issue**: `--log-opts` を指定しない `gitleaks git` は `--all` 相当で走査する。そのため、開発者の手元のブランチや stash にある値で、どのブランチの verify も赤くなる。CI では checkout が取得した ref だけが対象になるので、手元と CI の結果も一致しない。
**Evidence**: spec 3.7「同一コミット・同一環境で … 3 回とも同じ合否」と NFR「同一コミットで同じ合否を返す」。plan の表「`check:secrets` | `gitleaks git --redact --verbose`（全履歴）」。
**Confidence**: high（実測: HEAD は clean で、秘密値がローカルブランチや stash にだけあっても exit 1）
**Proof**: 本レビューの probe（`gl-refs.sh`）。
**Fix**: 「全履歴」の範囲を決めて plan と research に書く（例: `--log-opts="--full-history HEAD"` で HEAD から到達できる履歴だけを走査し、他のブランチは各ブランチの CI で検査する）。現状の `--all` を保つなら、ローカル ref に依存することを 3.7 の例外として明記し、spec 側で判断する（ユーザー判断）。

### [MEDIUM] `mise ls --current --json` にユーザー全体設定のツールが混ざり、1.1 の検査が開発機で落ちるか、漏れる
**Location**: specs/001-dev-environment-and-gates/plan.md:298
**Issue**: `mise ls --current` はグローバル設定のツール（`latest`、`26` など）も返す。そのまま「exact で `latest` を含まない」と検査すると、この開発機では必ず落ち、CI では通る。逆にツールを source で絞らないと、プロジェクトの `mise.toml` に書き忘れたツールをグローバル設定が黙って補い、検出できない。CI の verify-node27 ジョブは `MISE_ENV=node27` を継承するので、「既定レーン」の照会も node27 になり、11.1 の比較が自明に真になる。
**Evidence**: 「`mise ls --current --json` の要求版が exact で `latest` を含まない（既定レーンと `MISE_ENV=node27` の両方）（1.1）。2 つのレーンで node 以外のツールの版が等しい（11.1）」。
**Confidence**: high（実測: `deno latest`、`pnpm latest`、`node 26` が `~/.config/mise/config.toml` 由来で出力された）
**Proof**: 本レビューの probe（`mise1.sh`）。
**Fix**: `source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけを対象にする。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）がすべてプロジェクトのファイル由来であることを確かめる。子プロセスの環境では、既定レーンは `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示する。グローバル設定を無効にしたい場合は `MISE_GLOBAL_CONFIG_FILE=/dev/null` も検討する。

### [MEDIUM] 3.8 / 3.9 は「ファイル 0 件 / 一致 0 件」だけを扱い、「実行 0 件（全部 skip）」が緑のまま通る
**Location**: specs/001-dev-environment-and-gates/plan.md:624
**Issue**: Vitest は、テストがすべて `skip` / `todo` なら exit 0 で終わる。Playwright も、`@smoke` のテストがすべて `test.skip` なら exit 0 になる。spec は「実行件数が 0 件」を失敗と定めているが、plan の仕組み（`passWithNoTests: false`、`--pass-with-no-tests` を付けない）と自己検査は、ファイルや grep の一致が 0 件の場合しか扱わない。
**Evidence**: spec 3.8「unit テストの**実行件数**が 0 件だった場合 … 非 0」、3.9「`@smoke` に一致する E2E テストが 0 件」。plan「unit テストファイルが 0 件 → Vitest が非 0」。
**Confidence**: medium（Vitest / Playwright が skip のみで exit 0 になるのは既知の挙動。この環境では未実測）
**Proof**: すべての `it` を `it.skip` にして `pnpm exec vitest run` → exit 0。
**Fix**: 実行件数を数えて判定する。例: Vitest は JSON reporter（または custom reporter）で `numPassedTests + numFailedTests > 0` を確かめ、0 なら失敗させる。Playwright は `--reporter=json` の `stats.expected + unexpected > 0`、または `globalTeardown` で数える。さらに `skip` / `todo` を禁止する Biome ルール（`noSkippedTests` など）を検討する。自己検査に「全 skip → 非 0」のケースを加える。

### [MEDIUM] 0 件の自己検査が `test` / `e2e` タスクの定義を通らず、タスクに足したフラグで穴が開いても検出できない
**Location**: specs/001-dev-environment-and-gates/plan.md:277
**Issue**: (a) は「実際の `vitest.config.ts` のまま」の `vitest run`、(b) は `playwright test --list` を直接起動する。`mise.toml` の `test` に `--passWithNoTests`、`e2e` に `--pass-with-no-tests` を足しても、自己検査は緑のままになる。また `--list` は本番の実行経路と違う。
**Evidence**: 「(a) 実際の `vitest.config.ts` のまま、対象が 0 件になる選択で入れ子の `vitest run` → 非 0（3.8）。(b) `playwright test --list --grep <一致しないタグ>` → 非 0」。
**Confidence**: high
**Proof**: `mise.toml` の `[tasks.test] run` を `pnpm exec vitest run --passWithNoTests` に変える → `gate-self-check.test.ts` は緑のまま、verify も緑。
**Fix**: `mise tasks ls --json` から `test` / `e2e` の `run` を取り出す。`hooks-config.test.ts` で、`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、`--only-changed` などが含まれないことを確かめる。0 件の実行も、そのコマンドの argv に一致しないフィルタを足して行う。Playwright で `--list` を使うなら、`--list` が本番経路と同じ「No tests found」判定を通ることを R-9 で実測する。

### [MEDIUM] verify が 6 つの構成要素をすべて含むことを検査していない（例: e2e を外しても緑）
**Location**: specs/001-dev-environment-and-gates/plan.md:291
**Issue**: hooks-config は「`gate` 別名」と「security 系を参照しない」だけを確かめる。verify の `run` から `e2e` や `check:secrets` を消しても、自動テストも CI も緑のまま。3.1 の根拠は「CI `verify` ジョブ、R-3」だけで、CI が緑であることは e2e が実行されたことを示さない。
**Evidence**: 「`verify` の別名に `gate` があり（3.3）、`verify` の構成要素が `security` 系を参照せず（3.6）」とトレーサビリティ「3.1 | C3 | CI `verify` ジョブ、R-3」。
**Confidence**: high
**Proof**: `[tasks.verify] run` から `{task="e2e"}` を削除 → `mise run verify` は緑のまま、テストも落ちない。
**Fix**: hooks-config で、`verify` の `run` が `check`、`typecheck`、`check:model-ids`、`check:secrets`、`test`、`e2e` をこの順で**ちょうど**参照すること（`{task=…}` の形も `mise run …` の形も受ける）、`security` が `security:osv` と `security:audit` を参照することを確かめる。ci.yml が `mise run verify` と `mise run security` を含むことも regex で確かめる（10.1）。

### [MEDIUM] 2.4 / 2.5（`any`・未使用・型エラーで verify が非 0）は一度きりの記録 R-10 だけで、設定の後退を検出できない
**Location**: specs/001-dev-environment-and-gates/plan.md:747
**Issue**: `biome.json` の `files.includes` から `src/` や `tests/` が外れたり、`tsconfig.json` の `include` が縮んだりしても、verify は緑のまま。repo-policy はルールの重大度（2.2）と `strict`（2.3）しか見ないので、実際にその規則が適用されていることは確かめていない。
**Evidence**: 「2.4 | C2, C3 | R-10（`any`・未使用変数・未使用 import を入れて verify が非 0）」「2.5 | … | R-10」。
**Confidence**: high
**Proof**: `biome.json` の `files.includes` を `["*.json"]` にする → `src/` の `any` が素通りし、どのテストも落ちない。
**Fix**: 安い自動テストを足す。一時ディレクトリに実際の `biome.json` / `tsconfig.json` と、`src/x.ts` / `tests/unit/x.test.ts` 相当の違反ファイルを置き、`pnpm exec biome check` と `tsc --noEmit -p` が非 0 になることを確かめる（対照として違反なしでは 0）。または `biome check --stdin-file-path=src/probe.ts` で `noExplicitAny` などのルール名が出ることを確かめる。

### [MEDIUM] 子プロセスの多い unit テストに Vitest 既定の `testTimeout`（5 秒）が適用され、決定論（3.7）を損なう
**Location**: specs/001-dev-environment-and-gates/plan.md:170
**Issue**: 入れ子の `vitest run`（3 回）、`playwright test --list`、`lefthook install` と commit、gitleaks、`mise tasks ls`、`pnpm config get` を、並列のワーカーから同時に実行する。既定の 5 秒では、CI や負荷の高い開発機でタイムアウトし、緑と赤が入れ替わりうる。
**Evidence**: `vitest.config.ts` の契約に `testTimeout` がない（`include`、`environment`、`setupFiles`、`passWithNoTests`、`allowOnly`、`resolve.alias` だけ）。`runCommand()` は「タイムアウト付き」だが、テスト自体の上限は既定のまま。
**Confidence**: medium
**Proof**: CI（ubuntu-24.04、2 vCPU）で `mise run test` を 3 回実行し、`network-guard.test.ts` / `gate-self-check.test.ts` の所要時間を見る（R-11 で測る）。
**Fix**: 子プロセスを使うテストファイルに明示的な `testTimeout` を付け（実測にもとづく値）、`runCommand` のタイムアウトはそれより短くする。入れ子のワーカー数は `--pool=forks --maxWorkers=1` などで抑える。R-3 の 3 回連続実行は CI でも行う。

### [MEDIUM] 憲章の改訂を PATCH としているが、原則 3 の「唯一の検証入口」の再定義にあたる
**Location**: specs/001-dev-environment-and-gates/plan.md:403
**Issue**: 原則 3 は「verify は … セキュリティ検査 … を 1 コマンドで実行する唯一の検証入口」と定めている。security を別の入口に分けるのは、表現の明確化ではなく原則の再定義である。Governance の Versioning policy では MAJOR（再定義）か、少なくとも MINOR（実質的な変更）にあたる。
**Evidence**: 憲章「MAJOR: 後方非互換な変更（原則の削除・再定義）… PATCH: 明確化・表現修正」と spec 13.7「原則 3 を … PATCH 改訂し」。plan「原則 3 の PATCH 改訂（1.0.0 → 1.0.1）」。
**Confidence**: medium（分類の解釈）
**Proof**: 改訂前後の原則 3 の文言を比べる。「verify が唯一の入口でセキュリティを含む」が「verify と security の 2 入口」に変わる。
**Fix**: spec の判断が要る（spec 側の変更。ユーザー判断）。13.7 を MINOR（1.1.0）に変えるか、PATCH とする理由（例: 「pre-push と CI 必須ジョブが両方を実行するので、保証は減らない」）を Sync Impact Report に書く。plan の Constitution Compliance の行もそれに合わせる。

### [MEDIUM] `CLAUDE.md` がリポジトリに存在しないため、13.11 と File Structure の「CLAUDE.md を変更せずにコミット」が実行できない
**Location**: specs/001-dev-environment-and-gates/plan.md:597
**Issue**: リポジトリには `CLAUDE.md` がどこにもない（`git status` の未追跡は `.sdd/`、`AGENTS.md`、`specs/001-…` だけ）。spec の前提「`AGENTS.md` / `CLAUDE.md` は … 作成済み（未コミット）」が事実と食い違う。
**Evidence**: plan「`CLAUDE.md` | Commit | 変更せずに本 spec の PR に含める」と spec 13.11「未コミットの憲章、steering、`AGENTS.md`、`CLAUDE.md` を含める」。
**Confidence**: high
**Proof**: `ls /Users/Shared/codes/genai-lab-ts/CLAUDE.md` → No such file。`find . -name CLAUDE.md` → 0 件。
**Fix**: spec の判断が要る（ユーザー判断）。(a) `CLAUDE.md`（例: `@AGENTS.md` を取り込むだけの 1 行）を作り、File Structure を「Create」に直す。(b) 13.11 から `CLAUDE.md` を外す。どちらかを決めて spec と plan を揃える。

### [LOW] ファイル一覧をループで検査するテストが、対象 0 件で空振りする（zero-case）
**Location**: specs/001-dev-environment-and-gates/plan.md:310
**Issue**: `docs/stages/*.md` や `docs/node27/*.md` が 0 件なら、見出しの検査は何もせずに通る（11.5 は 1 件以上を求める）。`uses:` の SHA 検査も、regex が 1 行も拾わなければ通る。13.2 の「本文中の `tests/…` のパスがすべて実在」も、パスが 0 件なら通る。
**Evidence**: 「`docs/stages/*.md` が … 順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。`docs/node27/*.md` が 5 つの見出しを持つ（11.5）」「ワークフローのすべての `uses:` が 40 桁の SHA で固定」。
**Confidence**: high
**Proof**: `docs/node27/` を空にする → `docs-structure.test.ts` は緑。
**Fix**: 件数の下限を確かめる。`docs/stages/1-dev-environment-and-gates.md` が存在する、`docs/node27/*.md` が 1 件以上、`uses:` が 1 件以上、13.2 の 2 つの合格条件それぞれに参照パスが 1 件以上ある。

### [LOW] `runCommand()` の既定が `isolatedEnv()` ではなく、隔離が C10 にしか明記されていない
**Location**: specs/001-dev-environment-and-gates/plan.md:248
**Issue**: `check-model-ids.test.ts`（一時リポジトリで `git ls-files`）や `hooks-config.test.ts`（一時リポジトリで `lefthook install`）が pre-push の中で実行されると、`GIT_DIR` / `GIT_INDEX_FILE` を引き継ぐおそれがある。最悪の場合、`lefthook install` が本物のリポジトリのフックを書き換える。
**Evidence**: C10「子プロセスは `isolatedEnv()` で実行する（I-6）」。C12 の各テストには隔離の記述がない。
**Confidence**: medium
**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、一時ディレクトリで `lefthook install` を実行する → 対象の git dir を確かめる。
**Fix**: `runCommand()` の既定の環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。

### [LOW] unit 通信ガードの検査が `afterEach` だけで、取りこぼす経路がある
**Location**: specs/001-dev-environment-and-gates/plan.md:516
**Issue**: `afterAll` や最後のテストの後に起きた違反（握りつぶされたもの）は検査されない。`dgram` と DNS 解決（`dns.lookup`）は遮断の対象外。入れ子の fixture の通信先も決まっていないので、ガードが壊れていると実際に外へ出る。
**Evidence**: 「`afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする」。
**Confidence**: medium
**Proof**: `afterAll(() => { try { fetch('http://127.0.0.1:9') } catch {} })` を持つテストファイル → 緑。
**Fix**: setupFile の `afterAll` でも違反を検査する。`dgram.createSocket` と `dns.lookup` / `dns.promises` も置き換えるか、対象外であることを ADR-5 に書く。fixture の通信先は `.invalid` か `127.0.0.1:9` に固定する。

### [LOW] E2E ガードはブラウザの HTTP だけを見ており、Next サーバー側からの外部通信と WebSocket を扱わない
**Location**: specs/001-dev-environment-and-gates/plan.md:518
**Issue**: `context.route` は、dev サーバーのプロセス（RSC やルートハンドラ）が出す外部通信を捕まえない。外部 WebSocket も `context.route` の対象外（`routeWebSocket` が必要）。段 1 では問題にならないが、段 003 以降で 3.5 / 3.11 の穴になる。
**Evidence**: 「`networkGuard` は `context.route("**/*")` で受けたリクエストのうち、`baseURL` と異なるオリジンを `abort` して記録」。
**Confidence**: medium
**Proof**: RSC で `await fetch('https://example.com')` を行うページを E2E で開く → ガードは反応しない。
**Fix**: この限界を ADR-5 に書く。外部 WebSocket の遮断（`context.routeWebSocket`）を足す。サーバー側については、webServer の env で外部通信が失敗する設定（例: Node の env proxy を閉じたポートへ向ける）を段 003 の plan で宣言する。

### [LOW] security の検査に「本当に検査した」ことを示す正の対照がない（osv-scanner と pnpm 12 の lockfile）
**Location**: specs/001-dev-environment-and-gates/plan.md:464
**Issue**: R-4 は到達不能時の終了コードしか測らない。osv-scanner が pnpm 12 の lockfile を 0 パッケージとして読んでも exit 0 になりうるが、それを検出する手段がない。
**Evidence**: 「R-4 security の失敗系（4.2〜4.4）: registry 到達不能時の `pnpm audit` / osv-scanner の終了コード」と、トレーサビリティ「4.2 | C4 | R-4」「4.3 | C4 | R-4」。
**Confidence**: low（pnpm 12 の lockfile 形式への osv-scanner の対応は未確認）
**Proof**: `osv-scanner scan source --lockfile=pnpm-lock.yaml --format=json` の出力に含まれるパッケージ数を、`pnpm ls --depth Infinity` の件数と比べる。
**Fix**: R-4 に正の対照を加える。既知の脆弱な版を含む使い捨ての lockfile で両ツールが非 0 になること、実際の lockfile で走査したパッケージ数が 0 より大きいことを記録する。

### [LOW] 安く自動化できる要件を「レビュー」に残している
**Location**: specs/001-dev-environment-and-gates/plan.md:793
**Issue**: 9.2（`page.tsx` に `"use client"` がない）、10.4（`continue-on-error`）、10.6（`fetch-depth: 0`）、10.7（`--frozen-lockfile`）、10.9（`permissions: {}` と各ジョブの `contents: read`）、10.11 / 10.12（`interval: weekly`、`cooldown.default-days`）は、repo-policy の regex で数行で検査できる。
**Evidence**: トレーサビリティ「9.2 | C11 | レビュー」「10.6 | C13 | レビュー（`fetch-depth: 0`）」「10.9 | C13 | レビュー」「10.12 | C13 | レビュー（`cooldown.default-days: 1`）」。
**Confidence**: high
**Proof**: ci.yml から `fetch-depth: 0` を消す → どの自動テストも落ちず、CI の gitleaks は浅い履歴だけを走査して緑になる。
**Fix**: `repo-policy.test.ts` にこれらの regex 検査を足す。特に 10.6 は、`check:secrets` の中で `git rev-parse --is-shallow-repository` が `false` であることも確かめる（浅い clone で全履歴の検査が空振りしない）。

### [LOW] Data Model の `MiseTaskInfo.run: readonly string[]` が、タスク参照の形と合わない
**Location**: specs/001-dev-environment-and-gates/plan.md:445
**Issue**: `run = [{ task = "check" }, …]` を使うと、`mise tasks ls --json` の `run` の要素は `{ "task": "check" }` というオブジェクトになる。
**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」。
**Confidence**: high（実測）
**Proof**: probe の出力 `verify ['gate'] [{'task': 'check'}, {'task': 'fail'}, 'echo AFTER']`。
**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。verify の書き方（`{task=…}` か `mise run …` か）を ADR-1 で決める。

### [LOW] Node 27 の worktree 手順に `mise trust` がない
**Location**: specs/001-dev-environment-and-gates/plan.md:357
**Issue**: 新しい worktree はパスが変わるので、mise の信頼の対象外になる。`mise install` は設定が信頼されていないとして失敗する。
**Evidence**: 「`git worktree add --detach ../genai-lab-ts-node27 HEAD` で別 worktree を作り、`MISE_ENV=node27` で `mise install` → …」。
**Confidence**: medium
**Proof**: 新しい worktree で `MISE_ENV=node27 mise install` を実行する → 「not trusted」のエラー。
**Fix**: README の手順に `mise trust`（worktree 側の `mise.toml` と `mise.node27.toml`）を加える。

### [LOW] `strictDepBuilds` を既定値に頼っている
**Location**: specs/001-dev-environment-and-gates/plan.md:672
**Issue**: 1.5 の「既定で実行しない」は pnpm の既定値に依存する。`pnpm config get strictDepBuilds` は `null` を返すので、既定の変更や設定の上書きを検出できない。`passWithNoTests` には「既定と同じ値を明記」した方針があるが、ここには適用していない。
**Evidence**: 「install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0」。probe の `strictDepBuilds => null`。
**Confidence**: medium
**Proof**: `pnpm config get strictDepBuilds --json` → `null`。
**Fix**: `pnpm-workspace.yaml` に `strictDepBuilds: true` を明記し、repo-policy で確かめる。`minimumReleaseAgeStrict: true` も同じように扱う。

### [LOW] 8.6 のアサーションの書き方しだいで、失敗時のメッセージに偽キーが出る
**Location**: specs/001-dev-environment-and-gates/plan.md:242
**Issue**: `expect(output).not.toContain(key)` が失敗すると、Vitest は期待値として偽キーをそのまま表示する。CI のログに、本物らしい形の `ghp_…` が残る。
**Evidence**: 「出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）」。
**Confidence**: medium
**Proof**: 偽キーを含む文字列に対して `expect(s).not.toContain(key)` を失敗させる → 差分に key が表示される。
**Fix**: `expect(output.includes(key)).toBe(false)` のように真偽値で比べ、メッセージにはキーの長さと prefix だけを出す。

### [LOW] `lefthook-local.yml` が gitignore されておらず、`lefthook dump` はこれを合成する
**Location**: specs/001-dev-environment-and-gates/plan.md:401
**Issue**: `lefthook-local.yml` は手元でジョブを上書き・skip できる。dump はこれを合成するので、開発機の状態が hooks-config と C10 の結果を変える。誤ってコミットされるおそれもある。
**Evidence**: research I-5「`lefthook-local.yml` などを合成した実際に使われる設定」。plan の `.gitignore` の追加項目に含まれていない。
**Confidence**: medium
**Proof**: `lefthook-local.yml` に `pre-commit: { jobs: [{ name: secrets, skip: true }] }` を置く → dump が変わり、実際のフックで secrets が skip される。
**Fix**: `.gitignore` に `lefthook-local.yml` を加える。hooks-config で、合成後の secrets ジョブに `skip` がないことも確かめる。

### [LOW] lefthook のフォールバック経路が、版を固定していない lefthook をネットワークから取得しうる
**Location**: research.md:83
**Issue**: 埋め込みパスが無効になると（この開発機では mise の自動 prune が有効）、フックは `mint run csjones/lefthook-plugin` や `uv run lefthook` などへ順に落ちる。そこで版を固定していない lefthook を取得・実行しうる。
**Evidence**: probe で見た生成フックの `call_lefthook()`（`mint run …`、`uv run lefthook`、`swift package …`、`mise exec -- lefthook`）。research I-4「mise で lefthook を上げて旧版が消えると埋め込みパスが無効になり、PATH 探索に落ちる」。
**Confidence**: medium
**Proof**: lefthook を上げて旧版を prune する → `mint` がある環境でフックを実行する。
**Fix**: README に「lefthook を上げたら `lefthook install` を再実行する」と書き、`mise run setup` に含める。この経路を research I-4 の副作用に記録する。

### [LOW] 開発者の `next dev` が同じディレクトリで動いているときの pre-push E2E の挙動が未確認
**Location**: specs/001-dev-environment-and-gates/plan.md:687
**Issue**: plan は同じポートの場合だけを扱う。よくあるのは「別のポートで、同じプロジェクトの `next dev` が動いている」状態で、Next 16 の `.next/dev` のロックなどで 2 つ目が起動できないと、push の可否が手元の状態で変わる。
**Evidence**: 「開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで … 失敗として表面化する」。
**Confidence**: low
**Proof**: `pnpm exec next dev --port 3000` を起動したまま `mise run e2e` を実行する。
**Fix**: R-3 か R-9 で実測する。衝突する場合は、webServer の `distDir` を分ける（例: 環境変数で `.next-e2e`）などの対処を plan に書く。

### [LOW] TypeScript 7.1 beta（ネイティブ）が `tsc --showConfig` に対応しているか未確認
**Location**: specs/001-dev-environment-and-gates/plan.md:304
**Issue**: 2.3 の検査が、未検証の CLI フラグに依存している。
**Evidence**: 「`tsc --showConfig` の `strict` が真（2.3）」。research に `--showConfig` の確認がない。
**Confidence**: low
**Proof**: `pnpm exec tsc --showConfig`（typescript@7.1.0-beta）の終了コードと出力。
**Fix**: 実装時に確かめて research に記録する。対応していなければ `tsconfig.json` を JSONC として読む（コメントを除いて `JSON.parse`）。

### [LOW] どの要件も求めていない `setup` タスク（Unrequested behavior）
**Location**: specs/001-dev-environment-and-gates/plan.md:469
**Issue**: `setup` タスクは 3.4 / 5.x / 13.3 のどれも要求しておらず、spec 000 §8.5 のタスク一覧にもない。README の手順をまとめるだけなので害は小さいが、plan での宣言だけで追加されている。
**Evidence**: 「`setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3」。
**Confidence**: medium
**Proof**: spec の要件を `setup` で検索 → 0 件。
**Fix**: 残すなら、追加の理由を ADR に一行書く（13.3 の手順をコマンド 1 つにまとめるため）。spec 000 §8.5 の改訂注記（13.10）にも含める。

### [LOW] 本レビューは別モデルファミリーによるレビューの要件を満たさない（プロセス）
**Location**: .sdd/memory/constitution.md:209
**Issue**: Codex が使えないので Claude が代行した。plan の作成者も Claude 系なら、AGENTS.md の Cross-Agent Review の前提（死角が同じ系統で重なる）を満たさない。
**Evidence**: 憲章「作成者と異なるモデルファミリーで敵対的レビューを 1 回行う」と AGENTS.md「Codex reviews what Claude wrote」。
**Confidence**: high
**Proof**: `codex login status` → Not logged in（タスクの前提）。
**Fix**: Codex が使えるようになったら、plan（または最初の実装フェーズ）を Codex で再レビューする。今回の代行は spec.json の承認記録か PR 本文に明記する。

## 強み（判断材料）

- 検査の定義を `mise.toml` に集約し、フックと CI はタスク名で呼ぶ設計（ADR-2）。`lefthook dump --format=json` と
  `mise tasks ls --json` で機械的に突き合わせられることは実測で確認できた。
- `assert_lefthook_installed` の必要性（I-4）と、フック実行中の `GIT_*` 環境の危険（I-6）を実測で押さえている。
- unit の通信ガードの自己検査は、入れ子実行に対照（no-network）と出力メッセージの照合を持っており、非空虚の設計として妥当。
  include の連結だけ直せばよい。
- 偽キーを実行時に組み立て、allowlist を使わない方針は、要件 8 の意図に合っている。

## GO / NO-GO

**GO（条件付き）**。CRITICAL はない。HIGH の 3 件（CI の手順順序、`test.fail()` の空振り、`mergeConfig` の include 連結）は、
tasks.md を作る前に plan へ反映すること。MEDIUM のうち CLAUDE.md の不在と憲章の版の分類は spec の判断（ユーザー）、
gitleaks の走査範囲（`--all`）は設計判断が要る。

## Verdict
REQUEST_CHANGES

## Hallucination Signal
forced: false

## Adjudication

Orchestrator: Claude (/sdd-validate-plan). Codex unavailable (`codex login status`: Not logged in); this round is same-family and does not satisfy constitution principle 11's cross-family requirement.

| Finding | Decision | Evidence |
|---------|----------|----------|
| [HIGH] CI runs `mise run runtime` before `pnpm install` | stands | plan.md:332 order `runtime → pnpm install`; runtime calls `pnpm exec tsc -v` / `next --version` |
| [HIGH] E2E guard self-check relies on `test.fail()` | stands (raised independently by orchestrator) | plan.md:313; `test.fail()` accepts any failure cause |
| [HIGH] `mergeConfig` concatenates `include` → recursive nested run | stands | reviewer probe: vite 8.3.8 `mergeConfig` yields 2-element include |
| [MEDIUM] `check:secrets` scans all local refs | stands (raised independently by orchestrator) | orchestrator probe: gitleaks 8.30.1 debug `git log -p -U0 --full-history --all` |
| [MEDIUM] Constitution amendment classed PATCH | escalated | Governance: "MAJOR: 原則の削除・再定義"; spec 13.7 fixes PATCH → user decision |
| [MEDIUM] `CLAUDE.md` does not exist | escalated | `ls CLAUDE.md` → No such file; spec 13.11 requires committing it |
| [MEDIUM] 7.7 minimal-PATH hook test is vacuous | stands | reviewer probe (lefthook 2.2.2) |
| [MEDIUM] Hook-driven commit lacks git identity | stands | `GIT_CONFIG_GLOBAL=/dev/null` removes user.name/email |
| [MEDIUM] gitleaks in temp repo ignores repo config | stands | reviewer probe |
| [MEDIUM] `mise ls --current --json` mixes global tools | stands | reviewer probe (mise 2026.11.12) |
| [MEDIUM] 0-executed (all skipped) not covered by 3.8/3.9 | stands | plan.md:624 checks file count only |
| [MEDIUM] Zero-test self-check bypasses task definitions | stands | plan.md:277 invokes runner directly |
| [MEDIUM] verify composition not fully checked | stands | plan.md:291 checks alias and absence of security only |
| [MEDIUM] 2.4/2.5 evidenced only by one-off R-10 | stands | plan.md:747 |
| [MEDIUM] Vitest default 5s testTimeout for subprocess tests | stands | plan.md:170 sets no timeout |
| (orchestrator) [MEDIUM] mise shims fail with cwd outside project | stands | orchestrator probe: `lefthook version` in mktemp repo → `No version is set for shim` |
| LOW items (16) | stands as notes | see Critique; none blocks task generation |

Verdict after adjudication: REQUEST_CHANGES (3 HIGH stand). Plan-review decision: GO conditional on the HIGH fixes.

## Resolution (2026-11-22, orchestrator)

User decisions on escalated items: constitution amendment is MINOR (1.0.0 → 1.1.0) and spec 13.7 updated; `CLAUDE.md` removed from 13.11 and the File Structure Plan; `check:secrets` scans HEAD-reachable history only (`--log-opts=HEAD`, probed: `git log -p -U0 HEAD`, 6 commits, exit 0).

HIGH findings applied to plan.md: CI step order is now install → runtime (both jobs); nested Vitest fixture config replaces `test.include` after `mergeConfig` and asserts only the fixture ran; the E2E guard self-check drops `test.fail()` in favour of `failOnBlockedRequest: false` + asserting `blockedRequests`.

MEDIUM findings applied to plan.md (user decision: fix before tasks.md):
- 7.7 hook test: stage a file first; case 1 minimal PATH → non-0; case 2 rewrite the embedded lefthook path → exit 1 with `Can't find lefthook in PATH`, control `assert_lefthook_installed: false` → 0 (orchestrator probe, lefthook 2.2.2; `LEFTHOOK_BIN` returns 127 either way, so not used).
- C10: `isolatedEnv()` sets a fixed fake git identity; the reject case asserts no commit was created and gitleaks `RuleID` appears without the key value.
- gitleaks config: no `.gitleaks.toml` / `.gitleaksignore` in the repo (asserted); `--ignore-gitleaks-allow` on the secrets job and `check:secrets`.
- mise ls: filter by `source.path` to project files, require the 5 tools from them; strip `MISE_ENV` for the default lane, set it explicitly for node27.
- Zero executed tests: Biome `suspicious.noSkippedTests: "error"`; Vitest and Playwright `require-executed-tests` reporters; self-check with an `it.todo`-only fixture.
- Zero-test self-checks run the `test` / `e2e` task argv from `mise tasks ls --json`; hooks-config rejects loosening flags.
- hooks-config asserts the exact ordered composition of `verify` and `security`, and that `ci.yml` calls them.
- New `tests/unit/static-analysis.test.ts` for 2.4 / 2.5 in a temp repo with the real configs (`--stdin-file-path` bypasses `files.includes`, so not used).
- Explicit per-file timeouts (initial 60 s), `runCommand` 30 s, nested Vitest `--maxWorkers=1`.
- Orchestrator finding: `resolveTool()` resolves absolute tool paths from the repo root (`mise which`), and `isolatedEnv()` builds PATH from them.

LOW findings are not applied (except `vcs.enabled` / `clientKind`, now explicit in C2).
