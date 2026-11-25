# 001-dev-environment-and-gates — Implementation Tasks

`/sdd-tasks` が生成した。規則は `~/.claude/sdd/rules/tasks-generation.md` と
`tasks-parallel-analysis.md`。要件は [spec.md](spec.md)、設計は [plan.md](plan.md)、根拠と実装時の記録は
[research.md](research.md)、要件との対応表は [traceability.md](traceability.md)。

## 規約

- `- [ ]` 未着手、`- [x]` 完了、`- [ ]*` 後回し可の任意テスト（本 spec にはない。受け入れテストはすべて必須）。
- `(P)` は、依存がなく、`_Boundary:_` が同時に動けるどのタスクとも重ならないサブタスクだけに付ける。
- すべてのタスク（major と sub）が `_Boundary:_` と `_Depends:_` を持つ。`_Requirements:_` は受け入れ基準の
  番号だけをカンマ区切りで並べる。
- `_Traces:_` の ID: `REQ-00n` は spec.md の Requirement n。`DES-1.n` は plan.md「Components」の C`n`、
  `DES-2.1` は「Interfaces / Contracts」、`DES-3.1` は「Error Handling & Edge Cases」。plan.md の見出しに
  ID がないため、この対応を本ファイルと traceability.md で定義する。
- 括弧に入れた数字（`（1.1）`、`（9.9）`）は受け入れ基準の番号。サブタスクを指すときは「タスク 1.1」と書く（2 つは同じ形式で区別できないため）。
- テストを伴うサブタスクは、先に失敗するテストを書いて **RED を確認してから**実装する（憲章 原則 4）。
  「実測」「記録」と書いた項目は、コマンド・出力・確認日を research.md の指定の R-n に残す。
- `_Boundary:_` は plan.md「File Structure Plan」の表のファイルだけ。成果物をコミットしない使い捨て環境
  （タスク 10 の ZIP 展開先、テスト用の一時リポジトリ）は境界に含めない。
- `specs/001-dev-environment-and-gates/spec.json` は SDD コマンドが更新するため、担当タスクを置かない。
- コミットは、ユーザーの確認を得て行うチェックポイント（タスク 9.2、11.5、12.5）にまとめる。タスク 3.2 と 4.1 は、task 1〜2 で作ったファイルの整形・型エラーを直すため、`_Boundary:_` にそれらのファイルを含める。タスク 5.1、5.2、6.1 は、自分が作るファイルが `mise run check` を通ることを完了条件に含める。
- 大きくなりやすいサブタスク（タスク 2.1、5.2、7.5、12.1。以下の「2.1:」などもタスク番号）は、実装中に 3 時間を超えそうなら次の継ぎ目で分け、番号は振り直さず Implementation Notes に記録する。2.1: `editArgv` とそのテスト（5、6）／それ以外。5.2: 走査・除外の規則／検出パターンと命名形式のテスト。7.5: ケース 1〜3 のテスト／実リポジトリへの `lefthook install`。12.1: オフライン・3 回連続の実測／実行時間・README の確認。

## 実装順の制約（plan.md「File Structure Plan」末尾）

1. 最初の失敗するテストを動かすために要る最小の基盤（`package.json`・`pnpm-workspace.yaml`・
   `pnpm-lock.yaml`・`vitest.config.ts`・`mise.toml` の `[tools]` と `test`）はタスク 1 で先に作る。
   以後のゲート設定は、それを検査するテストを先に書く。
2. `sandbox.ts` と `network-guard.ts` は、子プロセスや一時リポジトリを使う他のテストより先に作る（タスク 2）。
3. 実リポジトリへの `lefthook install` は、`lefthook.yml` と `hooks-config.test.ts` が緑になった後（タスク 7.5）。
4. ruleset の変更は、CI の `verify` ジョブが一度緑になった後（タスク 12.6）。ユーザーの確認を得てから適用する。
5. 作業用コピー（`git worktree`）はコミット済みの HEAD から作るため、それを使うタスク 9.3 と 12.1〜12.4 は、先にコミットのチェックポイント（タスク 9.2、11.5）を済ませる。コピーごとに `mise trust`、`mise install`、`pnpm install --frozen-lockfile`、`pnpm exec playwright install chromium` が要る。
6. `security-daily.yml` の `workflow_dispatch` 実行と Dependabot の設定確認は、既定ブランチにファイルが入ってからでないとできない（GitHub の仕様）。PR のマージ後に行うタスク 12.7 に分ける。マージはユーザーの操作で、本 spec のタスクには含めない。

## 並列化の報告

`(P)` を付けたのは 8.2、8.3、11.1、11.2、11.3 の 5 つだけ。`mise.toml`・`research.md`・
`gate-self-check.test.ts`・`repo-policy.test.ts` など共有ファイルを複数のタスクが書くため、それ以外は直列に
する。判断に迷うものは `(P)` を付けていない（例: 6.2 は完了条件が `mise run test` と `mise run check` で、同時に動く他のタスクが作業中だと自己完結しないため直列）。`/sdd-fleet` で並列化するときは、下表の組だけを同じ波にする。

| 波 | 並列にできるサブタスク | 前提 | 境界が重ならない根拠 |
|----|------------------------|------|----------------------|
| A | 8.2（`security-daily.yml`、`hooks-config.test.ts` の追記）、8.3（`dependabot.yml`、`repo-policy.test.ts` の追記） | 8.2・8.3 とも 8.1 | 書くファイルが互いに重ならない（テストファイルも 8.2 は `hooks-config`、8.3 は `repo-policy` と分ける）。8.1 が `repo-policy.test.ts` と `hooks-config.test.ts` の両方に書くため、どちらも 8.1 の完了後に始める。9.1 は `repo-policy.test.ts` を拡張し、CI・Dependabot の設定ファイルが揃ってから Node 27 レーンを足すため、8.2 と 8.3 の完了を待つ |
| B | 11.1（解説・README）、11.2（憲章・steering）、11.3（`AGENTS.md`・計画 000） | 9.3 | 書くファイルが 3 者で重ならない。11.4 は `package.json` を書き換えうるので、11.1〜11.3 の完了後に行う |

---

## 1. ツールチェーンの固定と最小のテストランナー

_Boundary:_ `mise.toml`, `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `vitest.config.ts`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ none
_Requirements:_ 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 3.8, 12.5, 12.6
_Traces:_ REQ-001, REQ-003, REQ-012, DES-1.1, DES-1.6

最初の失敗するテストを動かすための最小の基盤。憲章 原則 4 の例外はこのタスクに限り、以後のゲート設定は
検査するテストを先に書く。

- [x] 1.1 ランタイムとツールの exact pin を `mise.toml` に書く
  - 各ツール（node は 26 LTS 系列、pnpm、lefthook、gitleaks、osv-scanner）について、**公開から 24 時間以上
    経った最新の版**を選び、版・公開日時・確認日を research.md の R-1 に記録する（取得は `pnpm view`、
    `gh api repos/<owner>/<repo>/releases` など。1.3）。
  - `[tools]` に 5 ツールを exact な版番号で書く。`latest` などのタグや範囲指定を含めない（1.1）。
    `[env]` に `NEXT_TELEMETRY_DISABLED = "1"`。ZIP の `[settings] prereleases = false` は既定値なので書かない。
  - 完了条件: `mise trust` のあと `mise install` が終了コード 0。`mise ls --current --json` で 5 ツールすべてが、リポジトリの
    `mise.toml` 由来で exact な版になっている。
  _Boundary:_ `mise.toml`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ none
  _Requirements:_ 1.1, 1.3
  _Traces:_ REQ-001, DES-1.1
- [x] 1.2 npm 依存の exact pin・24h ゲート・install スクリプトの遮断を設定し、lockfile を生成する
  - `package.json`: `name`、`private: true`、`type: "module"`、`packageManager`（`mise.toml` の pnpm と同じ版。
    1.6）、`engines.node` は `">=<Node 26 LTS の採用版> || >=27.0.0-alpha"`（1.7）、`scripts` は `dev`・`build`・
    `start` のみ（検査は mise タスクに一本化し、`package.json` に重複させない）。
  - 依存は ADR-4 の一覧に限る。`dependencies` は `next`・`react`・`react-dom`、`devDependencies` は
    `@biomejs/biome`・`@playwright/test`・`@types/node`・`@types/react`・`@types/react-dom`・`typescript`・
    `vitest`。すべて exact で、`latest`・`canary`・`beta` などの dist-tag と `^`・`~`・`*`・`>=` を含めない
    （1.2）。AI SDK・プロバイダ・Zod・`server-only` は入れない。Next.js は 24h を満たす最新の canary を選ぶ。
  - TypeScript は 7.1 の RC または stable が公開から 24 時間以上経っていればそちらに切り替えて R-7 に記録
    する（12.5）。なければ確認日とその時点の公開状況を R-7 に記録して beta を据え置く（12.6）。
  - `pnpm-workspace.yaml`: `minimumReleaseAge: 1440`、`minimumReleaseAgeStrict: true`、`strictDepBuilds: true`（どちらも pnpm の既定値だが、既定が変わっても gate が弱まらないよう明記する。I-8）、`savePrefix: ""`、`allowBuilds`（install スクリプトを持つ
    依存を**すべて**列挙し、各行に許可理由のコメント。`sharp: false`）。`minimumReleaseAgeExclude` は書かない
    （1.4、1.5）。`overrides` と `audit.ignore` は必要が生じたときだけ。
  - `pnpm install` で `pnpm-lock.yaml` を生成する。`Ignored build scripts` の出力で `allowBuilds` を確定し、
    自動で追記されたプレースホルダーを残さない。peerDependency の警告は全文と扱い（`overrides` で解消、または
    受容した理由）を R-2 に記録する（1.9）。採用版の公開日時は R-1 に追記する（1.3）。
  - 完了条件: クリーンな状態から `pnpm install --frozen-lockfile` が終了コード 0（1.8）。`pnpm exec tsc -v`・
    `pnpm exec next --version`・`pnpm exec vitest --version` が動く。
  _Boundary:_ `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 1.1
  _Requirements:_ 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 12.5, 12.6
  _Traces:_ REQ-001, REQ-012, DES-1.1
- [x] 1.3 最小の `vitest.config.ts` と `test` タスクを置く
  - `vitest.config.ts`: `include: ["tests/unit/**/*.test.ts"]`、`environment: "node"`、`passWithNoTests: false`
    （既定と同じ値を明記）、`allowOnly: false`、`resolve.alias` の `@` → `src`。`@vitejs/plugin-react` は使わ
    ない（ADR-4）。`setupFiles` と `reporters` はタスク 2 でテストを先に書いてから足す。
  - `mise.toml` に `test`（`pnpm exec vitest run`、`description` あり）を足す。
  - 完了条件: テストファイルが 0 件の状態で `mise run test` が非 0 になり、出力に `No test files found` が
    ある（3.8 のファイル 0 件の部分。タスク 2.3 の自己検査が後でこれを恒久的に確かめる）。
  _Boundary:_ `vitest.config.ts`, `mise.toml`
  _Depends:_ 1.2
  _Requirements:_ 3.8
  _Traces:_ REQ-003, DES-1.6

### Implementation Notes

- 公開日時順で「24 時間以上の最新版」を選ぶと、バックポートの古い版（react 19.1.10）を拾う。react 系は
  `dist-tags.latest` と突き合わせ、semver 順で選ぶ。`mise ls --json` はツール名をキーにした辞書で返る
  （配列ではない）。タスク 3.3 の `repo-policy.test.ts` はこの形で読む。
- このセッションの auto mode 判定は `mise trust` / `mise install` / `pnpm install` / `pnpm exec` を拒否した。
  ユーザーの手元での実行結果を貼ってもらい、R-1 / R-2 に記録した。`mise run test` は後から実行できた。
- 編集後の hook がファイルをタブインデントに整形する（Biome の既定）。タスク 3.2 で `biome.json` に
  `indentStyle: "space"`、`indentWidth: 2` を指定して揃える。
- タスク 1.3 の RED は `mise run test`（ファイル 0 件）→ exit 1、`No test files found`。
  `passWithNoTests: false` を `true` に変えた場合の確認は、タスク 2.3 の自己検査が恒久的に担う。

---

## 2. テスト基盤（サンドボックス・通信ガード・実行 0 件ガード）

_Boundary:_ `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`
_Depends:_ 1
_Requirements:_ 3.7, 3.8, 3.10, 8.8, 9.5, 9.6
_Traces:_ REQ-003, REQ-008, REQ-009, DES-1.6, DES-1.12, DES-3.1

子プロセスや一時リポジトリを使う他のテストが乗る土台。各サブタスクは、先にテストを書いて RED を確認する。
子プロセスを使うテストファイルは `describe(…, { timeout })` で timeout を明示する（初期値 60 秒。実測で見直し
R-11 に記録）。`runCommand` の既定タイムアウトは 30 秒でテストの timeout より短くする。

- [x] 2.1 一時リポジトリ・ツール解決・隔離環境・子プロセス実行のヘルパー `sandbox.ts` を作る
  - 先に `tests/unit/sandbox.test.ts` を書く: (1) `isolatedEnv()` の環境で `node -v`、`git --version`、
    `gitleaks version`、`lefthook version`、`pnpm exec vitest --version` が `expectGateSuccess` になる。
    (2) 親に `GIT_DIR`・`GIT_INDEX_FILE`・`MISE_ENV`・`LEFTHOOK` を設定しても子の環境に現れない。
    (3) `resolveTool("git")` が絶対パスを返し、`resolveTool("no-such-tool")` が原因を示して失敗する。
    (4) `expectGateFailure` が、`status` 127、`spawnError` あり、`status` 0、出力不一致のいずれも拒否し、
    実際に非 0 で出力が一致したときだけ通る。(5) `isolatedEnv({ nested: true })` に親の `VITEST_POOL_ID`・
    `FORCE_COLOR=1`・`NODE_ENV` が現れない。(6) `editArgv` が合成した argv に対し、`--config` を追加（既存なら
    置換）し、`--grep` と `--reporter=` を置換し、編集後は各フラグがちょうど 1 つになる（実際の `e2e` argv での
    確認はタスク 4.2）。
  - 実装: `useTempGitRepo()`（一時ディレクトリ + `git init`、`onTestFinished` で成否を問わず削除。8.8）、
    `resolveTool(name)`（mise 管理のツール `node`・`pnpm`・`gitleaks`・`lefthook`・`osv-scanner` は
    リポジトリのルートを cwd に `mise which` を 1 回。`git` と `mise` は親の `PATH` を先頭から探す。
    node_modules の bin はルートの `node_modules/.bin/` から。見つからなければスキップせず原因を示して失敗）、
    `isolatedEnv(options?)`（`GIT_*`・`GITLEAKS_*`・`LEFTHOOK*`・`MISE_ENV` を除く。
    `GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`、`.invalid` ドメインの固定の偽 identity。`PATH` は
    `dirname(process.execPath)`、`pnpm`・`gitleaks`・`lefthook`・`git`・`mise` のディレクトリ、`/usr/bin`、
    `/bin` の順で重複なし。`options.pathDirs` はこの組み立てを置き換え、`options.nested` は `VITEST*`・`TEST`・
    `FORCE_COLOR`・`NODE_ENV` も除く）、`editArgv(argv, edits)`、`runCommand()`（シェルを介さない
    `spawnSync`、既定の環境は `isolatedEnv()`、親の環境を使うときは `env: "inherit"` を明示、`CommandResult` は
    `spawnError` を持つ）、`expectGateFailure(result, { output })`（`status` が数値で 0 でない、`spawnError` が
    `null`、`status` が 126 / 127 でない、出力が `output` に一致）、`expectGateSuccess(result)`。
  - 完了条件: `mise run test` が緑。`PATH` の組み立てを壊す（`dirname(process.execPath)` を外す）と (1) が
    失敗する。
  _Boundary:_ `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`
  _Depends:_ 1.3
  _Requirements:_ 3.7, 8.8
  _Traces:_ REQ-003, REQ-008, DES-1.6, DES-3.1
- [x] 2.2 unit の未モック通信ガードと、その自己検査を作る
  - 先に `tests/unit/network-guard.test.ts` と入力 `tests/fixtures/gate/vitest.fixture.config.ts`・
    `unmocked-network.fixture.ts`・`no-network.fixture.ts` を書く。入れ子の `vitest run` を 2 回起動する。
    fixture 設定は実設定を `mergeConfig` で引き継ぐが、`mergeConfig` は配列を連結するため、`test.include` は
    マージ後に `["tests/fixtures/gate/*.fixture.ts"]` を**代入して置き換える**（連結のままだと入れ子で本体を
    再帰起動する）。実行されたテストファイルが指定した fixture 1 件だけであることを出力から確かめる。
    (a) `unmocked-network.fixture.ts`（`fetch` と `net.connect` を呼び、例外を握りつぶす）→
    `expectGateFailure`（出力に `UnmockedNetworkError`）。(b) `no-network.fixture.ts` → `expectGateSuccess`
    （対照）。入れ子の環境は `isolatedEnv({ nested: true })`、`--maxWorkers=1`。
  - 実装: `tests/unit/setup/network-guard.ts` が `net.Socket.prototype.connect` と `globalThis.fetch` を
    置き換え、呼ばれると `UnmockedNetworkError`（`name` が固定のエラー）を投げて違反を記録する。メッセージは
    接続先のホストとポート（または URL の origin）だけを含み、クエリやヘッダーを含めない。違反の記録は `NetworkViolation`（`kind`: `"socket" | "fetch"`、`target`: `string`）。`afterEach` で
    違反があればそのテストを失敗させて記録を空にする。違反の消去手段を公開しない。`vitest.config.ts` の
    `setupFiles` に登録する。
  - リスク確認: `net.Socket.prototype.connect` の置き換えが Vitest のワーカー通信を妨げないか、`pool` の既定で
    確かめる。妨げる場合は置き換えをテスト本体の実行時だけに限る。結果を Implementation Notes に残す。
  - 完了条件: `mise run test` が緑。ガードを外す（`setupFiles` を消す）と (a) が失敗する。
  _Boundary:_ `tests/unit/setup/network-guard.ts`, `tests/unit/network-guard.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `vitest.config.ts`
  _Depends:_ 2.1
  _Requirements:_ 3.10, 9.5
  _Traces:_ REQ-003, REQ-009, DES-1.6, DES-1.12
- [x] 2.3 unit の実行 0 件ガード（reporter）と、その自己検査を作る
  - 先に `tests/unit/gate-self-check.test.ts` の Vitest 部分を書く。`mise tasks ls --json` から `test` タスクの
    `run`（要素は文字列または `{ task }`。型ガードで絞る）を取り、その argv に引数を足して実行する
    （タスクに `--passWithNoTests` などが足されたら落ちる）。(a) `test` の argv + どのファイルにも一致しない
    フィルタ → `expectGateFailure`、出力に `No test files found`（ファイル 0 件）。(b) `test` の argv +
    `--config tests/fixtures/gate/vitest.fixture.config.ts` + `tests/fixtures/gate/all-todo.fixture.ts`
    （`it.todo` だけ）→ `expectGateFailure`、出力に `no tests were executed`（実行 0 件。reporter だけが止める）。
    対照は `network-guard.test.ts` の (b)（実行 1 件以上で 0）。`it.skip` だけの fixture は置かない
    （Biome の `noSkippedTests` に検出されるため）。
  - 実装: `tests/unit/setup/require-executed-tests.ts`（Vitest の custom reporter。`vitest/node` の `Reporter`
    を実装し、`onTestRunEnd(testModules)` で `children.allTests()` の `result().state` が `passed` / `failed` の
    件数を数え、0 件なら固定メッセージ `no tests were executed` を stderr に出して `process.exitCode = 1`）。
    `vitest.config.ts` に `reporters: ["default", "./tests/unit/setup/require-executed-tests.ts"]` を足す。
  - 完了条件: `mise run test` が緑。reporter を外すと (b) が失敗する（reporter なしでは `it.todo` のみで 0
    になる）。
  _Boundary:_ `tests/unit/setup/require-executed-tests.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`
  _Depends:_ 2.2
  _Requirements:_ 3.8, 9.6
  _Traces:_ REQ-003, REQ-009, DES-1.6, DES-1.12

### Implementation Notes

- `net.Socket.prototype.connect` と `fetch` の置き換えは、Vitest の既定の pool で外側・入れ子の実行ともに動いた
  （ワーカー通信を妨げない）。置き換えをテスト本体の実行時だけに限る必要はなかった。
- ファイル 0 件は `passWithNoTests: false` と reporter の二重のガードで、片方を外しても (a) は落ちない（実測。
  両方を外すと落ちる）。実行 0 件（todo のみ）を止めるのは reporter だけで、(b) が守る。PROVE の記録は R-10。
- `editArgv` は `config` と `reporter` を「置換または追記」、`grep` を「置換のみ」にした。タスク文と plan が
  `--reporter` の追記を明示していないが、`e2e` の argv に `--reporter` がなく、`--list` の検査で必要になるため。
- PROVE の元に戻す操作は、全体コピーでなく Edit で行う（2.1 で外部変更を上書きしかけた）。

---

## 3. 静的解析の設定とリポジトリ規約テスト

_Boundary:_ `tsconfig.json`, `next.config.ts`, `biome.json`, `mise.toml`, `tests/unit/static-analysis.test.ts`, `tests/unit/repo-policy.test.ts`, `.env.example`, `.gitignore`, `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`, `package.json`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 2
_Requirements:_ 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.8, 3.9, 9.8, 9.9, 13.5, 13.6
_Traces:_ REQ-001, REQ-002, REQ-003, REQ-009, REQ-013, DES-1.2, DES-1.3, DES-1.12, DES-1.16

- [x] 3.1 `tsconfig.json`・`next.config.ts` と、型検査の自己検査を作る
  - 先に `tests/unit/static-analysis.test.ts` の tsc 部分を書く。一時リポジトリに実際の `tsconfig.json` と
    `.gitignore` をコピーし、`node_modules` はリポジトリのものへのシンボリックリンクにする。違反ファイルを
    実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に置く。`tsc --noEmit -p`（`resolveTool` で
    解決した bin、`isolatedEnv()`）で、`src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方の
    ファイルのパス（2.5）。違反のないファイルだけ → `expectGateSuccess`（対照）。TS 7.1 beta が
    シンボリックリンクの `node_modules` を解決できない場合は一時ディレクトリへのコピーに切り替え、理由を R-10
    に記録する。
  - `tsconfig.json`: ZIP の値を基に `strict: true`、`noUncheckedIndexedAccess: true`、`noEmit: true`、
    `types: ["node"]`、`paths: { "@/*": ["./src/*"] }`。`include` は `next-env.d.ts`、`src/**`、`tests/**`、
    `*.config.ts`、`.next/types/**/*.ts`。`next.config.ts` は ZIP の内容（`cacheComponents: true`）を型検査が
    通る形で取り込む。
  - task 2 で作ったファイルに型エラーが出た場合は、この task の Boundary 内で直す。
  - 完了条件: `mise run test` が緑、`pnpm exec tsc --noEmit` が終了コード 0、`pnpm exec tsc --showConfig` の出力で `strict` が `true`。
  _Boundary:_ `tsconfig.json`, `next.config.ts`, `tests/unit/static-analysis.test.ts`, `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 2.3
  _Requirements:_ 2.3, 2.5
  _Traces:_ REQ-002, DES-1.2, DES-1.12
- [x] 3.2 `biome.json` と `check` タスク、lint の自己検査を作る
  - 先に `static-analysis.test.ts` に Biome 部分を足す。実際の `biome.json` を一時リポジトリにコピーし、
    明示的な `any`、未使用の変数、未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` →
    `expectGateFailure`、出力に `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`
    （2.4、3.8、3.9）。`it.todo` と `test.info().skip(…)` は検出されないので「通る」側のケースとして置く
    （実行 0 件は reporter が止める。タスク 2.3、4.2）。`tests/e2e/` の `@playwright/test` 直接 import は失敗し、
    `tests/e2e/fixtures.ts` は通る（ADR-5）。対照: 違反のないファイルだけ → `expectGateSuccess`。
    `--stdin-file-path` は `files.includes` を迂回するので使わない。
  - `biome.json`: `linter.rules.preset: "recommended"`、`correctness.noUnusedVariables` /
    `correctness.noUnusedImports` / `suspicious.noExplicitAny` / `suspicious.noSkippedTests` を `"error"`。
    `vcs.enabled: true`、`vcs.clientKind: "git"`、`vcs.useIgnoreFile: true`。`files.includes` はコード・JSON・
    設定に限り、`specs/`・`.sdd/`・`docs/` の Markdown は対象にしない。`overrides` で `tests/e2e/**`
    （`tests/e2e/fixtures.ts` を除く）の `@playwright/test` 直接 import を `noRestrictedImports` で禁止する。
  - `biome.json` の `formatter` は `indentStyle: "space"`、`indentWidth: 2` とする（pnpm が書く `package.json` と同じ形に揃え、`package.json` の整形エラーを避ける）。
  - `mise.toml` に `check`（`pnpm exec biome check .`）を足す。
  - 完了条件: `mise run check` が、それまでに書いたファイルすべてで終了コード 0（整形が要るファイルは
    `biome format --write` で直す。`package.json`・`tsconfig.json`・`next.config.ts` を含め、直してよいのはこの task の Boundary のファイルだけ）。`mise run test` が緑。
  _Boundary:_ `biome.json`, `mise.toml`, `tests/unit/static-analysis.test.ts`, `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`, `package.json`, `tsconfig.json`, `next.config.ts`
  _Depends:_ 3.1
  _Requirements:_ 2.1, 2.2, 2.4, 3.8, 3.9
  _Traces:_ REQ-002, REQ-003, DES-1.2, DES-1.3, DES-1.12
- [x] 3.3 リポジトリ規約テスト `repo-policy.test.ts` と、`.env.example`・`.gitignore` を整える
  - 先に `tests/unit/repo-policy.test.ts` を書く（値はツールの出力か JSON から読み、版番号を期待値にしない。
    9.9）。(a) `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。(b) `minimumReleaseAge` が
    1440 で `minimumReleaseAgeExclude` がない（1.4）。`minimumReleaseAgeStrict` と `strictDepBuilds` が `true` と明記されている（1.4、1.5）。(c) `sharp` の `allowBuilds` が `false`（1.5）。`pnpm-workspace.yaml` は行単位の正規表現で読む（YAML ライブラリは plan に宣言がないため足さない）。
    (d) `packageManager` の版が `mise ls --current --json`（`source.path` がリポジトリの設定のものだけに絞る）の
    pnpm の版と**一致**する（1.6。2 つの設定の比較）。(e) ルートに ESLint / Prettier などの設定ファイルがない
    （2.1）。(f) `biome.json` の 3 ルールが `"error"`（2.2）。(g) `tsc --showConfig` の `strict` が真（2.3）。
    (h) `git ls-files --cached --others --exclude-standard`（初回 commit 前でも空にならない）で `*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
    (i) `.env.example` の各行が値を持たない（13.5）。(j) `git check-ignore` で `.env`、`.env.local`、`.next/`、
    `test-results/`、`playwright-report/`、`lefthook-local.yml` が無視される（13.6）。CI の SHA 固定と secret 参照（タスク 8.1）、
    Node 27 レーンの版（タスク 9.1）のケースは、対象ファイルを作るタスクで足す。
  - `.env.example`: 変数名だけ（`AI_PROVIDER=`、`AI_MODEL=`、各プロバイダの API キー名、`OLLAMA_BASE_URL=`。
    名前は ZIP の `.env.example` に合わせる）。値を書かない。
  - `.gitignore`: 既存の `.env` / `.env.*`（`!.env.example`）/ `.next` / Playwright 成果物に加えて
    `next-env.d.ts`、`mise.local.toml`、`mise.*.local.toml`、`.vitest/`、`.build/`、`.env*.local`、`lefthook-local.*`、`.lefthook-local.*`（`lefthook dump` が手元の `lefthook-local.yml` を合成するため。plan C16）を足す。
  - 完了条件: `mise run test` と `mise run check` が緑。`package.json` に `^` を 1 つ足すと (a) が、テストファイルを `src/` に置くと (h) が失敗する。
  _Boundary:_ `tests/unit/repo-policy.test.ts`, `.env.example`, `.gitignore`
  _Depends:_ 3.2
  _Requirements:_ 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 9.8, 9.9, 13.5, 13.6
  _Traces:_ REQ-001, REQ-002, REQ-009, REQ-013, DES-1.12, DES-1.16

### Implementation Notes

- 保存のたびに走る post-edit hook は Biome を実行する。`biome.json` がない間はタブインデントで整形され、タスク 3.2 で
  `biome check --write` が 13 ファイルを一括で整えた。`use` で始まる関数は `useHookAtTopLevel` に引っかかるため、
  ヘルパーは `createTempGitRepo()` にした（タスク文の `useTempGitRepo` から名前を変えた）。
- PROVE は Edit で壊して Edit で戻す。整形 hook が空白を変えるため、`old_string` が一致せず Edit が失敗しても
  壊していない状態のテストが緑になり、証明にならない。値そのものを変える壊し方（`true` → `false` など）が確実。
  終了後は、壊す前に取ったコピーと `diff` で一致を確かめた（復元には使っていない）。
- `.env.example` は ZIP の 2 行（`AI_PROVIDER=ollama`、`OLLAMA_BASE_URL=…`）から値を外した。要件 13.5 は名前だけを許す。
- 3.3 の (g)（`tsc --showConfig` の `strict`）の PROVE は 3.1 の `strict: false` で `static-analysis.test.ts` が落ちることまで。
  `repo-policy.test.ts` の該当ケース単独で落ちることは確かめていない（R-10 に明記）。

---

## 4. E2E 基盤とプレースホルダーアプリ

_Boundary:_ `playwright.config.ts`, `tsconfig.json`, `mise.toml`, `src/app/layout.tsx`, `src/app/page.tsx`, `tests/e2e/fixtures.ts`, `tests/e2e/reporters/require-executed-tests.ts`, `tests/e2e/placeholder.smoke.spec.ts`, `tests/e2e/network-guard.smoke.spec.ts`, `tests/unit/repo-policy.test.ts`, `tests/fixtures/gate/e2e/playwright.fixture.config.ts`, `tests/fixtures/gate/e2e/all-skip.fixture.ts`, `tests/fixtures/gate/e2e/one-pass.fixture.ts`, `tests/fixtures/gate/e2e/external-request.fixture.ts`, `tests/fixtures/gate/e2e/no-external-request.fixture.ts`, `tests/unit/gate-self-check.test.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/static-analysis.test.ts`, `tests/unit/helpers/sandbox.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 2, 3
_Requirements:_ 2.5, 3.4, 3.9, 3.11, 9.1, 9.2, 9.3, 9.6
_Traces:_ REQ-002, REQ-003, REQ-009, DES-1.7, DES-1.11, DES-1.12

- [x] 4.1 プレースホルダーページ、最小の E2E 設定、`e2e` と `typecheck` タスクを作る
  - 先に `tests/e2e/placeholder.smoke.spec.ts` を書く: `@smoke` タグ付き。`tests/e2e/fixtures.ts` から `test` を
    import し、`/` を開いてレベル 1 の見出し `genai-lab-ts` が表示されることを確かめる（9.3）。
    `fixtures.ts` はこの時点では `@playwright/test` の `test` / `expect` をそのまま export するだけの最小形
    （ガードはタスク 4.3 でテストを先に書いてから足す）。ページがない状態で実行して **RED を確認**する。
  - 先に `tests/unit/repo-policy.test.ts` にページの検査を足す（**RED を確認**: ページがない）: `src/app/page.tsx` と `src/app/layout.tsx` が `"use client"`、`process.env`、`ai` と `@ai-sdk/` の import を含まない（9.1、9.2）。
  - `playwright.config.ts`: `testDir: "tests/e2e"`、`retries: 0`、`forbidOnly: true`、`projects` は chromium のみ、
    `use.baseURL` は専用ポートの `http://127.0.0.1:<port>`、`webServer` は
    `pnpm exec next dev --hostname 127.0.0.1 --port <port>`、`reuseExistingServer: false`、
    `env: { NEXT_TELEMETRY_DISABLED: "1" }`。ポート番号は設定ファイルの 1 か所で定義する。`reporter` はタスク 4.2 で足す。
  - `src/app/layout.tsx`: `<html lang="ja">` のルートレイアウトと `metadata`。`next/font/google` など
    ネットワークを使う機能を使わない。`src/app/page.tsx`: RSC。`<h1>` に `genai-lab-ts`、本文に段 1 の案内。
    `"use client"`、AI SDK、`process.env` の参照を含めない（9.1、9.2）。
  - `mise.toml` に `e2e`（`pnpm exec playwright test --grep @smoke`）と `typecheck`（`pnpm exec next typegen` →
    `pnpm exec tsc --noEmit`）を足す（3.4、2.5）。`pnpm exec playwright install chromium` を実行しておく。
  - `next dev` が `tsconfig.json` に書き足す値は、初回に受け入れて固定する。TS 7.1 beta が解釈しない設定
    （`plugins: [{ "name": "next" }]` など）は、`tsc --noEmit` が通ることを確かめ、効かないものは理由を
    Implementation Notes に記録して外す。
  - 既存ファイルに型エラーが出た場合は、この task の Boundary 内で直す。
  - 完了条件: `mise run e2e` が緑（1 件）、`mise run typecheck` が終了コード 0、`mise run check` が緑。
    `page.tsx` の見出しを変えると `placeholder.smoke.spec.ts` が失敗する。
  _Boundary:_ `playwright.config.ts`, `tsconfig.json`, `mise.toml`, `src/app/layout.tsx`, `src/app/page.tsx`, `tests/e2e/fixtures.ts`, `tests/e2e/placeholder.smoke.spec.ts`, `tests/unit/repo-policy.test.ts`, `tests/unit/static-analysis.test.ts`, `tests/unit/helpers/sandbox.ts`, `tests/unit/sandbox.test.ts`, `tests/unit/setup/network-guard.ts`, `tests/unit/setup/require-executed-tests.ts`, `tests/unit/network-guard.test.ts`, `tests/unit/gate-self-check.test.ts`, `tests/fixtures/gate/vitest.fixture.config.ts`, `tests/fixtures/gate/unmocked-network.fixture.ts`, `tests/fixtures/gate/no-network.fixture.ts`, `tests/fixtures/gate/all-todo.fixture.ts`, `vitest.config.ts`
  _Depends:_ 3.3
  _Requirements:_ 2.5, 3.4, 9.1, 9.2, 9.3
  _Traces:_ REQ-002, REQ-003, REQ-009, DES-1.7, DES-1.11, DES-1.12
- [x] 4.2 E2E の実行 0 件ガード（reporter）と、入れ子の Playwright 実行による自己検査を作る
  - 先に `gate-self-check.test.ts` に Playwright 部分を足す。入れ子実行の設定は
    `tests/fixtures/gate/e2e/playwright.fixture.config.ts`（`testDir` は `tests/fixtures/gate/e2e`、`testMatch` は
    `**/*.fixture.ts`、`webServer` なし、`reporter` は本物の reporter）。`e2e` タスクの argv（`mise tasks ls
    --json`）に `editArgv` で `--config` を足して実行する。(c) `all-skip.fixture.ts`（`@smoke` の 1 件が
    `test.info().skip(true, …)` で skip）→ `expectGateFailure`、出力に `no tests were executed`（3.9）。対照
    `one-pass.fixture.ts` → `expectGateSuccess`。(d) 本物の設定の `e2e` argv に `--list` と `--reporter=list` を
    加え、`--grep` の値を一致しないタグに置き換える → 出力に `No tests found`。対照: 同じ argv で
    `--grep @smoke` → 成功し、出力に `placeholder` の `@smoke` テストが並ぶ（`network-guard` の `@smoke` はタスク 4.4 で
    追加して、この対照を拡張する）。入れ子の環境は `isolatedEnv({ nested: true })`。
  - `tests/unit/sandbox.test.ts` に (6) を足す: `editArgv` が実際の `e2e` argv に対し `--config` を 1 個、
    `--grep` を 1 個にする。
  - 実装: `tests/e2e/reporters/require-executed-tests.ts`（Playwright の custom reporter。`onTestEnd` で
    status が `skipped` 以外を数え、`onEnd` で 0 件なら固定メッセージ `no tests were executed` を stderr に出して
    `{ status: "failed" }` を返す。型は `@playwright/test/reporter` から import）。`playwright.config.ts` に
    `reporter: [["list"], ["./tests/e2e/reporters/require-executed-tests.ts"]]` を足す。
  - `.ts` の reporter を設定から読み込めるかを実測し、R-9 に記録する。読めない場合は `.mjs` + JSDoc の型に
    する。
  - 完了条件: `mise run test` と `mise run e2e` が緑。reporter を外すと (c) が失敗する（reporter なしでは全部
    skip でも exit 0）。
  _Boundary:_ `tests/e2e/reporters/require-executed-tests.ts`, `playwright.config.ts`, `tests/fixtures/gate/e2e/playwright.fixture.config.ts`, `tests/fixtures/gate/e2e/all-skip.fixture.ts`, `tests/fixtures/gate/e2e/one-pass.fixture.ts`, `tests/unit/gate-self-check.test.ts`, `tests/unit/sandbox.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 4.1, 2.3
  _Requirements:_ 3.9, 9.6
  _Traces:_ REQ-003, REQ-009, DES-1.7, DES-1.12
- [x] 4.3 E2E の外部オリジン遮断（auto fixture）と、teardown で失敗する経路の自己検査を作る
  - 先に入力 `tests/fixtures/gate/e2e/external-request.fixture.ts`（`tests/e2e/fixtures.ts` から `test` を import
    し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画）と
    `no-external-request.fixture.ts`（外部要求なしの対照）、`gate-self-check.test.ts` の (e) を書く:
    既定の `failOnBlockedRequest: true` で → `expectGateFailure`、出力に fixture の teardown のメッセージ（遮断した
    URL の origin。クエリは含まない）。対照 → `expectGateSuccess`。stub の `fixtures.ts` で **RED を確認**する。
  - 実装: `tests/e2e/fixtures.ts` が `test`（auto fixture `networkGuard`）と `expect` を export する。
    `networkGuard` は `context.route("**/*")` で受けた要求のうち `baseURL` と異なる origin を
    `route.abort("blockedbyclient")` して `{ method, url }` を記録し、同一 origin は `route.fallback()`。
    `baseURL` が未定義のときは許可する origin がなく、すべての要求を遮断する。`data:` / `blob:` は対象外。
    記録は fixture `blockedRequests`（`readonly ExternalRequestViolation[]`）として公開し、option fixture
    `failOnBlockedRequest`（既定 `true`）が `false` のときだけ teardown の失敗を止める。teardown では、
    `failOnBlockedRequest` が真で記録が空でなければ失敗する。
  - 前提の確認: `webServer` も `baseURL` もない設定で、`page.setContent` から出した外部要求を `context.route` が
    捕まえることは macOS で実測済み。Linux ランナーでの確認は CI の結果（タスク 12.5）で R-9 に残す。成り立たない
    場合は、入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）
    を足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いて**ユーザーに
    確認する**（3.11 の主経路を記録だけにする決定は、このタスクでは行わない）。
  - 完了条件: `mise run test` と `mise run e2e` が緑。`route.abort` を `route.fallback` に変えると (e) が失敗する。
  _Boundary:_ `tests/e2e/fixtures.ts`, `tests/fixtures/gate/e2e/external-request.fixture.ts`, `tests/fixtures/gate/e2e/no-external-request.fixture.ts`, `tests/unit/gate-self-check.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 4.2
  _Requirements:_ 3.11, 9.6
  _Traces:_ REQ-003, REQ-009, DES-1.7, DES-1.12
- [x] 4.4 外部通信の遮断と記録を確かめる `@smoke` を足し、`@smoke` の一覧の自己検査を拡張する
  - 先に `tests/e2e/network-guard.smoke.spec.ts` を書く: `@smoke`。`test.fail()` は**使わない**（失敗の原因を
    区別しないため）。`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め、`/` を開いてページ内
    から外部オリジン（`.invalid` ドメイン）へ `fetch` する。本文で (a) fixture の `blockedRequests` にその URL が
    1 件記録されている、(b) ページ内の `fetch` が失敗した、の 2 点を assert する。
  - `gate-self-check.test.ts` の (d) の対照を拡張し、`--grep @smoke` の一覧に `network-guard` と `placeholder` の
    `@smoke` テストが並ぶことを確かめる。
  - 完了条件: `mise run e2e` が 2 件で緑。ガードを壊す（`failOnBlockedRequest` の遮断を外す）と (a) が失敗する。
    pre-push の `@smoke` は 2 本で D5 の 1〜2 本に収まる。
  _Boundary:_ `tests/e2e/network-guard.smoke.spec.ts`, `tests/unit/gate-self-check.test.ts`
  _Depends:_ 4.3
  _Requirements:_ 3.11, 9.6
  _Traces:_ REQ-003, REQ-009, DES-1.7, DES-1.12

### Implementation Notes

- Playwright の入れ子設定では、`testDir` と reporter のパスが作業ディレクトリでなく設定ファイルからの相対で解決される
  （plan の `testDir: "tests/fixtures/gate/e2e"` は 0 件になった）。R-9 に記録した。
- `.invalid` ドメインへの要求は、`route.abort` を外しても DNS 失敗で同じ結果になり、遮断が効いているかを区別できない。
  ガードの検査は、実際に応答するローカルサーバー（`127.0.0.1` のランダムなポート）に向け、`hits === 0` と
  `outcome === "blocked"` を assert する形にした。plan の記述からの変更で、R-9 に記録した。
- `getByRole(..., { name })` は部分一致なので、見出しの検査は `exact: true` が要る（4.1 の PROVE で、変えた見出しでも通った）。
- PROVE の「壊す」Edit が失敗しても、壊れていないテストは緑になる。毎回、壊す前のコピーと `diff` で復元を確かめ、
  壊した状態の失敗の出力そのものを読んだ。

---

## 5. モデル ID の allowlist と直書き検査

_Boundary:_ `src/lib/ai/model-allowlist.ts`, `scripts/check-model-ids.mjs`, `tests/unit/check-model-ids.test.ts`, `mise.toml`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 3
_Requirements:_ 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 9.4
_Traces:_ REQ-006, REQ-009, DES-1.8, DES-2.1, DES-3.1

- [x] 5.1 モデル ID の allowlist を、形状のテストを先に書いて作り、各 ID の根拠を記録する
  - 先に `tests/unit/check-model-ids.test.ts` に allowlist の形状テストを書く（**RED を確認**: ファイルがなく import に失敗する）: `PROVIDERS` が `openai`・`anthropic`・`google`・`ollama` の 4 つ、`MODEL_ALLOWLIST` の各プロバイダに 1 件以上の空でない文字列があり、全体で重複がない。
  - `src/lib/ai/model-allowlist.ts`（消去可能な構文だけで書く。`enum` や `namespace` を使わない。Node の型
    ストリップで import できること）: `PROVIDERS`（`"openai" | "anthropic" | "google" | "ollama"` の readonly
    タプル）、`type Provider`、`MODEL_ALLOWLIST`（`as const satisfies Record<Provider, readonly string[]>`）、
    `type AllowedModelId<P extends Provider = Provider>`。`server-only` は import しない。
  - 登録する各 ID について、プロバイダの**公式ドキュメント**で存在を確認し、URL と確認日を R-5 に記録する
    （6.2）。記憶や ZIP ガイドの記述を根拠にしない。プロバイダごとに少なくとも 1 件を登録し、確認できなかった
    ID は登録しない。
  - 完了条件: `pnpm exec tsc --noEmit` が通る。`node -e "import('./src/lib/ai/model-allowlist.ts')"` が成功する
    （型ストリップ。I-7）。R-5 に ID 数と同じ件数の根拠がある。`mise run check` が、この task が作るファイルで緑。
  _Boundary:_ `src/lib/ai/model-allowlist.ts`, `tests/unit/check-model-ids.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 3.3
  _Requirements:_ 6.1, 6.2
  _Traces:_ REQ-006, DES-1.8
- [x] 5.2 `check:model-ids` を、テストを先に書いて作る
  - 先に `tests/unit/check-model-ids.test.ts` を書く。一時リポジトリ（`useTempGitRepo`）に入力を置いて CLI を
    実行し、ID は allowlist を import して、または命名形式に一致する文字列を**実行時に連結**して作る
    （テスト自身が検出されないため）。ケース: 直書きなし → 0 と走査ファイル数（6.7）、走査対象の種類ごと
    （`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の allowlist ID → 1 と
    `path:line:column`（6.3、6.5）、日本語の文中の ID も検出（`\b` の挙動）、allowlist に未登録で命名形式に
    一致 → 1 と `source` が `pattern:`（6.4）、allowlist ファイル内 → 0（6.1）、`tests/fixtures/**` 内 → 0
    （6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外（`specs/`）→ 0、git リポジトリでない root →
    2（9.4）。**RED を確認**してから実装する。
  - `scripts/check-model-ids.mjs`（CLI 契約）: 引数は `[--root <dir>]`（省略時は `process.cwd()`、それ以外の
    引数は使い方の誤りで exit 2）。走査候補は `git -C <root> ls-files --cached --others --exclude-standard -z`。
    走査対象は `src/**`、`scripts/**`、`tests/**`、`docs/**`、`.github/**`、`README.md`、`.env.example`、ルート直下の
    `*.{ts,mts,cts,js,mjs,cjs,json,jsonc,yaml,yml,toml}`。除外は `src/lib/ai/model-allowlist.ts`、
    `tests/fixtures/**`、`pnpm-lock.yaml`、NUL バイトを含むファイル。検出は allowlist の全 ID（単語境界つきの
    完全一致）と、プロバイダ命名形式の正規表現（OpenAI: `gpt-<数字>`・`gpt-oss-`・`o<数字>` 系・`chatgpt-`、
    Anthropic: `claude-<ファミリーまたは数字>`、Google: `gemini-<数字>`・`gemma-<数字>`、Ollama: 代表的な
    ライブラリ名 + 数字またはタグ。名前の例は I-14）。正規表現は**自分自身のソースに一致しない書き方**にし、
    スクリプト自身を除外しない。exit 0 は検出 0 件（stdout に走査ファイル数と 0 件の要約）、exit 1 は 1 件以上
    （stderr に 1 件 1 行で `<path>:<line>:<column>: <match> (<source>)`）、exit 2 は使い方の誤り・git の失敗・
    allowlist の読み込み失敗（0 にしない）。allowlist は `<root>/src/lib/ai/model-allowlist.ts` を型ストリップで import して読み（見つからなければ exit 2）、テストは一時リポジトリへ実物の allowlist をコピーする（plan に明記がないため本 task で決める）。検出の記録 `ModelIdFinding` は `path`: root からの相対パス（POSIX 区切り）、`line` / `column`: 1 始まり、`match`: 一致した文字列、`source`: `"allowlist"` または `` `pattern:${string}` ``（plan の Data Model どおり）。
  - `mise.toml` に `check:model-ids`（`node scripts/check-model-ids.mjs`）を足す。
  - 完了条件: `mise run test`、`mise run check`、`mise run check:model-ids` が緑。リポジトリ全体に対する `check:model-ids` が
    スクリプト自身と本テストを検出しない。正規表現から 1 つの接頭辞を外すと対応するテストケースが失敗する。
  _Boundary:_ `scripts/check-model-ids.mjs`, `tests/unit/check-model-ids.test.ts`, `mise.toml`
  _Depends:_ 5.1, 2.3
  _Requirements:_ 6.1, 6.3, 6.4, 6.5, 6.6, 6.7, 9.4
  _Traces:_ REQ-006, REQ-009, DES-1.8, DES-2.1, DES-3.1

### Implementation Notes

- 検出パターンと許可 ID はテストの中でも実行時に組み立てる（`join_` と allowlist の import）。リテラルを書くと、
  `check:model-ids` が自分のテストを検出する。実リポジトリへの実行（`scanned 26 files, 0 findings`）が、スクリプトと
  テストが自分を検出しないことの確認になる。
- 正規表現の断片を `["small", "lm"].join("")` と書いたら `smalllm` になり、パターンが何にも一致しなかった（`smollm`）。
  断片を結合する書き方は、結合後の文字列をテストで確かめないと間違いに気づけない。サンプルごとの `it.each` が拾った。
- PROVE の 5 番目（`--exclude-standard` を外す）は最初、何も失敗しなかった。ignore 済みファイルを置いた `ignored/` が
  走査対象外のディレクトリで、別の理由で除外されていたため。ファイルを `src/ignored/` に置き直して初めて意味のある検査になった。
- tasks.md の「`\b` の挙動」は実測と食い違った。R-9 に記録した（`\b` と今の境界の違いはハイフン）。
- `package.json` を走査対象の例に使うには、有効な JSON にしないと、Node が allowlist を import するときに
  `Invalid package config` で失敗する（一時リポジトリに置いた `package.json` を Node が読むため）。

---

## 6. 秘密値 commit の拒否と commit-msg 検査

_Boundary:_ `lefthook.yml`, `tests/unit/gitleaks-pre-commit.test.ts`, `scripts/check-commit-msg.mjs`, `tests/unit/check-commit-msg.test.ts`
_Depends:_ 2, 3
_Requirements:_ 7.3, 7.4, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
_Traces:_ REQ-007, REQ-008, DES-1.9, DES-1.10, DES-2.1

- [x] 6.1 秘密値を含む commit の拒否を、テストを先に書いて作る（段 1 の合格条件）
  - 先に `tests/unit/gitleaks-pre-commit.test.ts` を書く（**RED を確認**: `lefthook.yml` がない状態で失敗する）。
    1. `lefthook dump --format=json` から `pre-commit.jobs[name="secrets"].run` を取り、空白で分割した argv の
       先頭が `gitleaks` であること、シェルのメタ文字を含まないことを確かめる（8.3）。
    2. `useTempGitRepo()` で一時リポジトリを作り、`crypto.randomBytes` から組み立てた偽キー（gitleaks の既定
       ルールが検出する形。prefix は文字列連結で組み、**検出される形のリテラルをソースに置かない**。8.4）を
       ファイルに書いて stage し、取得した argv で gitleaks を実行して非 0 を確かめる（8.1）。
    3. 出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）。比較は `output.includes(key)` の真偽値で行い（`expect(output).not.toContain(key)` は失敗時に偽キーを差分へ表示する）、失敗メッセージには偽キーの長さだけを出す。
    4. 秘密値なしのファイルだけを stage して同じ argv で実行し、0 を確かめる（8.2）。
    5. フック経由: dump から secrets ジョブだけを抜き出した `lefthook.json` を一時リポジトリに置いて
       `lefthook install` し、偽キーを含む `git commit` → 非 0、commit が作られていない（`git rev-parse
       --verify HEAD` が失敗するか HEAD が変わらない）、出力に gitleaks の検出（`RuleID`）があり偽キーの値を含
       まない（7.3）。秘密値なしの `git commit` → 0、HEAD が新しい commit を指す（対照。identity は
       `isolatedEnv()` の固定値）。
    6. リポジトリのルートに `.gitleaks.toml` と `.gitleaksignore` が**ない**ことを確かめる（8.5。一時リポジトリの
       gitleaks は既定の設定で動くため、設定があるとフックとテストで検出規則がずれる）。
    - 子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ。ネットワークを使わず、
      一時ディレクトリは成否を問わず削除する（8.7、8.8）。
  - 実装: `lefthook.yml` を作り、先頭に `assert_lefthook_installed: true`、pre-commit は `parallel: true` で
    `secrets` ジョブ `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose` を定義する
    （他のジョブはタスク 7.4 で足す）。`gitleaks:allow` のインライン除外コメントは `--ignore-gitleaks-allow`
    で無効にする。
  - 完了条件: `mise run test` と `mise run check` が緑。`--redact` を外すと (3) が失敗し、`--staged` を外すと (2) が失敗する。
    実リポジトリには `lefthook install` を**まだ実行しない**（実装順の制約 3）。
  _Boundary:_ `lefthook.yml`, `tests/unit/gitleaks-pre-commit.test.ts`
  _Depends:_ 2.3, 1.1, 3.2
  _Requirements:_ 7.3, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8
  _Traces:_ REQ-007, REQ-008, DES-1.9, DES-1.10
- [x] 6.2 commit-msg の検査スクリプトを、テストを先に書いて作る
  - 先に `tests/unit/check-commit-msg.test.ts` を書く（**RED を確認**）: 正しい形式（type、scope、`!`）→ 0、
    type 不明・コロンなし・件名が空 → 1、`Merge …` / `Revert "…"` / `fixup! …` / `squash! …` / `amend! …` → 0、
    `#` で始まる行と空行の無視、引数なし・読めないファイル → 2（7.4）。
  - `scripts/check-commit-msg.mjs <msg-file>`（CLI 契約）: 判定対象は `#` で始まる行と空行を除いた最初の行。
    合格は `^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([^()\s]+\))?!?: \S` に一致、
    または `Merge `・`Revert "`・`fixup! `・`squash! `・`amend! ` で始まる。exit 0 は合格、1 は不合格（期待する
    形式と例を stderr に出す）、2 は引数なし・読めない。
  - 完了条件: `mise run test` と `mise run check` が緑。type の一覧から 1 つ外すと対応するケースが失敗する。
  _Boundary:_ `scripts/check-commit-msg.mjs`, `tests/unit/check-commit-msg.test.ts`
  _Depends:_ 2.3, 3.2
  _Requirements:_ 7.4
  _Traces:_ REQ-007, DES-1.9, DES-2.1

### Implementation Notes

- 入れ子の Vitest の出力に、`TERM` だけで ANSI の色が混ざる機械があった（開発者の手元。この記録を書いた
  セッションの環境では再現しない）。`isolatedEnv({ nested: true })` が `NO_COLOR=1` と `FORCE_TTY=false` を設定して
  対処した。調査（I-17）の「色の変数を設定しなければ ANSI は出ない」は、機械ごとに成り立たなかった（R-9）。
- 手元でしか再現しない問題は、こちらの環境で緑でも修正の証拠にならない。環境変数を 1 つずつ外して数える実測を、
  手元で取ってもらってから、原因の候補を絞った。
- PROVE は、PROVE のたびに「壊す前のコピーとの `diff`」で復元を確かめる。復元を `cp` で行うと、外部の変更を
  黙って上書きしうる（`check-commit-msg.mjs` で外部変更の通知があり、以後は Edit で戻して `diff` で確認した）。
- 自動判定（auto mode）が、セキュリティの検査のフラグを外す操作を拒否することがある。その場合は、手元のターミナルで
  実行してもらい、出力を貼ってもらう（`--ignore-gitleaks-allow` の PROVE）。

---

## 7. verify・security・補助タスクと Git フック

_Boundary:_ `mise.toml`, `pnpm-workspace.yaml`, `osv-scanner.toml`, `package.json`, `pnpm-lock.yaml`, `lefthook.yml`, `tests/unit/verify-offline-contract.test.ts`, `tests/unit/hooks-config.test.ts`, `tests/unit/gitleaks-pre-commit.test.ts`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 4, 5, 6
_Requirements:_ 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 8.5, 13.3
_Traces:_ REQ-003, REQ-004, REQ-005, REQ-007, REQ-008, REQ-013, DES-1.3, DES-1.4, DES-1.5, DES-1.9, DES-1.12, DES-2.1, DES-3.1

- [x] 7.1 `verify`（別名 `gate`）と `check:secrets` を、構成のテストを先に書いて作る
  - 先に `tests/unit/gitleaks-pre-commit.test.ts` に `check:secrets` のケースを足す（3.12。**RED を確認**: タスクがない）: `mise tasks ls --json` から `check:secrets` の `run`（argv）を取り、`useTempGitRepo()` の一時リポジトリに偽キーを含む commit を作る（フックは入れない）。その argv の gitleaks を `resolveTool()` の絶対パスで実行し、非 0、出力に `RuleID` があり偽キーの値が含まれない（6.1 の (3) と同じ真偽値の比較）ことを確かめる。対照: 偽キーのない commit だけの履歴 → 0。
  - 先に `tests/unit/verify-offline-contract.test.ts` と `tests/unit/hooks-config.test.ts` のタスク側を書く
    （**RED を確認**）。`mise tasks ls --json` を読む（`run` の要素は文字列または `{ task }`。単一の文字列の
    `run` も配列で返る。型ガードで絞る）。
    - `check`・`test`・`e2e`・`check:model-ids` が実在する（3.4）。`verify` の別名に `gate` がある（3.3）。
      `verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
      この順で**過不足なく**参照する（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）。
    - `check:secrets` が `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。
    - `test` / `e2e` の `run` が結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、
      `--last-failed`、`--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
    - `verify-offline-contract.test.ts`: `verify` の `run` を再帰的に辿り（`{ task }` は参照先へ、文字列は葉の
      コマンドとして集める）、(a) 辿ったタスクの集合が上の 6 つと過不足なく一致する、(b) 葉のコマンドのどれも
      `security`、`pnpm audit`、`osv-scanner`、`pnpm install`、`playwright install`、`outdated`、`curl`、`wget` を
      含まない、(c) 葉のコマンドの実行ファイル（`pnpm exec` の後ろの語、または先頭語）が、テスト内に列挙した
      オフラインのツール（`biome`、`tsc`、`next`、`vitest`、`playwright`、`gitleaks`、`node`）のどれかである
      （3.5、3.6）。
  - `mise.toml` に `check:secrets`（`gitleaks git --redact --ignore-gitleaks-allow --verbose --log-opts=HEAD`。
    HEAD から到達できる履歴に限る。既定の `--all` は別ブランチ・stash も走査し 3.7 を崩す）と、`verify`
    （`alias = "gate"`、`run` に 6 タスクを `{ task = "<name>" }` で直列に並べる。最初の失敗で止まる）を足す。
    すべてのタスクに `description` を付ける。
  - 完了条件: `mise run verify` と `mise run gate` が終了コード 0（初回の `check:secrets` は履歴上の検出が 0 件で
    あることを確かめる。検出があれば**値を出さずに**原因を調べ、履歴の書き換えはユーザーに確認する）。
    構成要素を 1 つ壊すと verify が非 0 になる（記録はタスク 12.2）。
  _Boundary:_ `mise.toml`, `tests/unit/verify-offline-contract.test.ts`, `tests/unit/hooks-config.test.ts`, `tests/unit/gitleaks-pre-commit.test.ts`
  _Depends:_ 4.4, 5.2, 6.1
  _Requirements:_ 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 8.5
  _Traces:_ REQ-003, REQ-008, DES-1.3, DES-1.10, DES-1.12, DES-2.1
- [x] 7.2 `security` タスク群を、構成のテストを先に書いて作る
  - 先に `hooks-config.test.ts` に足す（**RED を確認**）: `security` が `security:osv` → `security:audit` を
    この順で過不足なく参照する（4.1）。`security:audit` が `--audit-level=high` を含み、`--ignore-registry-errors`
    と `|| true` を含まない（4.2、4.4）。`security:osv` が `pnpm-lock.yaml` を対象にする（4.3）。除外の記録形式（4.5）は、
    ファイルがある場合だけ検査する条件付きのケースにする: `osv-scanner.toml` の各 `[[IgnoredVulns]]` が `id`・
    `ignoreUntil`・`reason` を持ち、`pnpm-workspace.yaml` の `audit.ignore` の各行に理由と退役条件のコメントがある。
    どちらのファイルもない間は、何も検査せず通る（除外がないことが正しい状態）。
  - `mise.toml` に `security:osv`（`osv-scanner scan source --lockfile=pnpm-lock.yaml`）、`security:audit`
    （`pnpm audit --audit-level=high`）、`security`（この順の直列）を足す。除外を記録する必要が生じた場合だけ、
    osv-scanner は `osv-scanner.toml` の `[[IgnoredVulns]]`（`id`、`ignoreUntil`、`reason` に退役条件を含める）、
    pnpm は `pnpm-workspace.yaml` の `audit.ignore`（GHSA ID の各行に理由と退役条件のコメント）に書く（4.5）。
    除外がない間はどちらも作らない。
  - 完了条件: `mise run security` が終了コード 0（ネットワークあり）。advisory が見つかった場合は、修正版へ
    上げる（24h ゲートを満たす版）か、4.5 の形式で除外を記録する。到達不能時の終了コードの実測はタスク 12.4。
  _Boundary:_ `mise.toml`, `pnpm-workspace.yaml`, `osv-scanner.toml`, `package.json`, `pnpm-lock.yaml`, `tests/unit/hooks-config.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 7.1
  _Requirements:_ 4.1, 4.2, 4.3, 4.4, 4.5
  _Traces:_ REQ-004, DES-1.4, DES-1.12
- [x] 7.3 補助タスク `runtime`・`outdated`・`setup` を、構成のテストを先に書いて作る
  - 実装（次の bullet のテストを先に書いて **RED を確認**してから行う）。`runtime`: `node -v`、`pnpm -v`、`pnpm exec tsc -v`、`pnpm exec next --version`、`lefthook version`、
    `gitleaks version`、`osv-scanner --version` を出力し、期待値と照合せず終了コード 0 を返す（5.1、5.2）。
    `outdated`: `mise outdated`（ツール）→ `pnpm outdated`（npm 依存）。`pnpm outdated` は候補があると
    exit 1 になる。終了コードを隠さず、この意味を `description` に書く（5.3）。`setup`: `pnpm install
    --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install`（13.3）。
  - 先に `hooks-config.test.ts` に足すテスト: `runtime`・`outdated`・`setup` が実在し、`outdated` が `package.json`・
    `pnpm-lock.yaml`・`mise.toml` を書き換えるコマンド（`update`、`upgrade`、`--write` など）を含まない
    （5.4）。**`setup` はまだ実行しない**（`lefthook install` が入るため。実装順の制約 3。タスク 7.5 で実行）。
  - 完了条件: `mise run runtime` が終了コード 0 で 7 種の版を出力する。`mise run outdated` の実行前後で
    `git status --porcelain` と `git diff --stat` が同じであることを R-1 に記録する（5.4）。出力の一覧も R-1 に
    残す（5.3）。
  _Boundary:_ `mise.toml`, `tests/unit/hooks-config.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 7.2
  _Requirements:_ 5.1, 5.2, 5.3, 5.4, 13.3
  _Traces:_ REQ-005, REQ-013, DES-1.5, DES-1.12
- [x] 7.4 `lefthook.yml` のジョブをすべて定義する（フックの構成をテストで先に固定）
  - 先に `hooks-config.test.ts` にフック側を足す（**RED を確認**）。`lefthook dump --format=json` を読む:
    `assert_lefthook_installed` が真（7.7）。pre-commit が `parallel` で 4 ジョブ（7.2）。commit-msg の
    ジョブがある（7.4）。pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
    （7.5、7.6）。`mise run <task>` で参照するタスクがすべて `mise.toml` に実在する（7.8）。secrets ジョブが
    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含む（7.8、8.5）。
  - `lefthook.yml` を完成させる。pre-commit（`parallel: true`）: `secrets`（6.1 で作成済み）、`biome`
    （`pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true`）、`typecheck`
    （`mise run typecheck`。glob で絞らない）、`model-ids`（`mise run check:model-ids`）。commit-msg: `conventional`
    （`node scripts/check-commit-msg.mjs {1}`）。pre-push（`piped: true`、安い順に直列）: `osv-scanner`
    （`mise run security:osv`）、`pnpm-audit`（`mise run security:audit`）、`unit-tests`（`mise run test`）、
    `e2e-smoke`（`mise run e2e`）。
  - 完了条件: `mise run test` が緑。ジョブ名を 1 つ変える、または pre-push の順序を入れ替えると
    `hooks-config.test.ts` が失敗する。**実リポジトリへの `lefthook install` はまだしない。**
  _Boundary:_ `lefthook.yml`, `tests/unit/hooks-config.test.ts`
  _Depends:_ 7.3, 6.2
  _Requirements:_ 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
  _Traces:_ REQ-007, DES-1.9, DES-1.12, DES-2.1
- [x] 7.5 フックの実行（ツール不在・lefthook 不在）を確かめ、実リポジトリに `lefthook install` する
  - `hooks-config.test.ts` に実行ケースを足す。検査される構成は 7.4 までに作ってあるので、ケースは足した直後に緑になりうる。そのため通常の RED（実装がなくて失敗する）が得られない。代わりに**ケースごとに、検査対象を壊した状態で失敗することを確かめる（RED）**。下のケースの括弧内が壊し方で、一時リポジトリ内の設定・入力だけを壊し、実リポジトリのファイルは書き換えない。壊した状態で失敗しないケースは、緑に進まずテストを直す。RED の結果（ケース、壊し方、失敗の出力の要点）を R-9 に表で記録する。タスク 12.3 の非空虚の確認は、この RED の再確認として残す。lefthook は stage されたファイルがないと
    ジョブを skip して exit 0 になるため、どのケースもファイルを stage してから実行する。
    1. 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフックファイルができる（7.1）。
       （RED: `lefthook install` の呼び出しを外すと、フックファイルが 0 件で失敗する。）
    2. ジョブのツールが見つからない: `lefthook dump --format=json` から secrets ジョブだけを抜き出した
       `lefthook.json` を置いて `lefthook install` し、`isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で
       pre-commit フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える）、`spawnError` なし、
       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ設定と
       non-secret の staged ファイルを既定の `isolatedEnv()` で実行 → 0（ツール不在以外の理由で落ちて
       いないことを除く）。secrets ジョブだけを使うのは、他のジョブが一時リポジトリの mise 設定と
       `node_modules` を要するため。
       （RED: 失敗を期待するケースを `pathDirs: [gitleaks のあるディレクトリ]` で実行すると、ツールが見つかって
       終了コード 0 になり、失敗の assert が落ちる。）
    3. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
       `Can't find lefthook in PATH`（`expectGateFailure`）。対照: `assert_lefthook_installed: false` にした設定で
       同じ操作 → 0。`LEFTHOOK_BIN` を偽のパスにする方法は使わない（この分岐を通らず 127 で終わる）。
       （RED: 設定を `assert_lefthook_installed: false` にした状態で失敗ケースを実行すると 0 になり、失敗の
       assert が落ちる。）
  - 3 ケースの RED を確かめ、元に戻して緑になったことを確かめてから、実リポジトリで `mise run setup` を実行して `lefthook install` を行う。push はせず、`lefthook run pre-push` で pre-push の 4 ジョブが順に起動して成功することを確かめ、結果を R-9 に記録する。commit-msg と pre-commit の実リポジトリでの起動は タスク 9.2 のコミットで確かめ、実際の `git push` での起動は タスク 12.5 で確かめる。
  - 完了条件: `mise run test` が緑。`.git/hooks/pre-commit`・`commit-msg`・`pre-push` が存在する。`lefthook run pre-push` が終了コード 0。
  _Boundary:_ `tests/unit/hooks-config.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 7.4
  _Requirements:_ 7.1, 7.3, 7.7
  _Traces:_ REQ-007, DES-1.9, DES-1.12, DES-3.1

### Implementation Notes

- 自動判定（auto mode）が拒否した Edit のあとは、次の Edit の前に、壊す前のコピーとの `diff` を取る。7.4 で、拒否と部分適用が
  重なって `lefthook.yml` のフラグが二重に追記され、全ゲートの最後に `verify` の終了コード 1 で初めて気づいた。
- 破壊の 1 回目が、意図した規則まで届かないことがある（7.3 の `| grep` は一覧の完全一致で先に落ちた）。失敗の出力が、
  狙った規則の文言から出ていることを毎回確かめる。
- 構成がすでにできた後に書く実行ケース（7.5）は、通常の RED が得られない。ケースごとにテストの入力を壊して RED を取り、
  R-9 に表で残した。
- 実リポジトリに影響する操作（`mise run setup` によるフックの導入）は、開発者の手元で実行してもらった。以後、このリポジトリの
  `git commit` ではフックが走る。

---

## 8. CI と Dependabot

_Boundary:_ `.github/workflows/ci.yml`, `.github/workflows/security-daily.yml`, `.github/dependabot.yml`, `tests/unit/repo-policy.test.ts`, `tests/unit/hooks-config.test.ts`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 7
_Requirements:_ 1.8, 10.1, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12
_Traces:_ REQ-001, REQ-010, DES-1.13, DES-2.1

- [x] 8.1 `ci.yml`（verify・verify-node27）を、文字列検査のテストを先に書いて作る
  - 先にテストを足す（**RED を確認**）。`repo-policy.test.ts`（静的な規約）: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）、`secrets.` の参照が `GITHUB_TOKEN` 以外にない（10.10）。`hooks-config.test.ts`（`ci.yml` の文字列）: `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が `mise run verify` を含む（10.1、10.3）、最上位が `permissions: {}` で各ジョブが `permissions:` を持つ（10.9）。同じファイルに、ゲートを空振りさせうる設定の検査も足す: `verify` ジョブの checkout が `fetch-depth: 0`（10.6）、`pnpm install` がすべて `--frozen-lockfile` 付き（10.7）、`verify-node27` が `continue-on-error: true` で `verify` には `continue-on-error` がない（10.4）。いずれも、設定を 1 つ外すと失敗することを RED で確かめる。
  - `.github/workflows/ci.yml`: トリガーは `push`（`main`、`exp/**`）、`pull_request`、週次 `schedule`、
    `workflow_dispatch`。最上位 `permissions: {}`、各ジョブ `permissions: { contents: read }`。
    - `verify`（必須チェック名）: `if: github.event_name != 'schedule'`、`runs-on: ubuntu-24.04`。checkout
      （SHA 固定、`fetch-depth: 0`、`persist-credentials: false`。10.6）→ mise-action（SHA 固定、mise 本体の版も
      exact 指定）→ `pnpm install --frozen-lockfile`（10.7）→ `mise run runtime` →
      `pnpm exec playwright install --with-deps chromium` → `mise run verify` → `mise run security` →
      `git status --porcelain` が空であることの確認（verify が追跡ファイルを書き換えないこと）。
    - `verify-node27`: `continue-on-error: true`、`env: { MISE_ENV: node27 }`。security を除く同じ手順（10.3、
      10.4）。
  - 各 `uses:` の SHA は、タグの公開から **24 時間以上経ったもの**を選び、タグをコメントで併記し、公開日時を
    R-1 に記録する。AI プロバイダの secret を参照しない。mise-action が新しい設定ファイルを信頼して install できることを CI のログで確かめる（`mise trust` が要る場合は手順に足す）。
  - 完了条件: `mise run test` が緑。`actionlint` が使えるなら実行する（使えない場合は `ruby -ryaml` による YAML の構文検査のみ。
    その旨を Implementation Notes に書く）。CI での実行結果はタスク 12.5 で確かめる。
  _Boundary:_ `.github/workflows/ci.yml`, `tests/unit/repo-policy.test.ts`, `tests/unit/hooks-config.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 7.5
  _Requirements:_ 1.8, 10.1, 10.3, 10.4, 10.6, 10.7, 10.8, 10.9, 10.10
  _Traces:_ REQ-010, REQ-001, DES-1.13, DES-2.1
- [x] 8.2 (P) `security-daily.yml` を、存在のテストを先に書いて作る
  - 先に `hooks-config.test.ts` に「`security-daily.yml` が存在し、`mise run security` を含み、毎日の `schedule` を持つ」を足す（**RED を確認**: ファイルがない）。
  - 毎日の `schedule` と `workflow_dispatch`。checkout（SHA 固定、`persist-credentials: false`）→ mise-action →
    `mise run security`。`permissions: { contents: read }`、最上位 `permissions: {}`。失敗はワークフローの失敗
    として GitHub の通知に乗る（10.5）。`security` が lockfile だけで動くかをローカルで確かめる（未コミットのため clone は使えない。`git ls-files --cached --others --exclude-standard -z` で作業ツリーのファイルだけを一時ディレクトリへコピーし、`node_modules` なしで `mise trust` → `mise run security`）。`node_modules` が要る場合は
    `pnpm install --frozen-lockfile` を足す。結果は Implementation Notes に書く。
  - `8.1` で足した SHA 固定・secret 参照のテストが、このファイルも走査して緑になる。
  - 完了条件: `mise run test` が緑。手動実行の結果は、既定ブランチにファイルが入った後のタスク 12.7 で確かめる。
  _Boundary:_ `.github/workflows/security-daily.yml`, `tests/unit/hooks-config.test.ts`
  _Depends:_ 8.1
  _Requirements:_ 10.5, 10.8, 10.9, 10.10
  _Traces:_ REQ-010, DES-1.13
- [x] 8.3 (P) `dependabot.yml` を作る
  - `npm` と `github-actions`（いずれも `directory: "/"`、`schedule.interval: weekly`、`cooldown.default-days: 1`、
    `commit-message.prefix: "build"` + `include: "scope"` で `build(deps):`）。npm は 1 つのグループにまとめる
    （週 1 回まとめて上げる）。公開から 24 時間未満の版を version updates で提案しない（10.11、10.12）。
    Dependabot の security updates は cooldown の対象外で、24h 経過後にマージする（Error Handling の記載
    どおり）。この運用は README に 1 行書く（タスク 11.1）。
  - 先に `repo-policy.test.ts` に足す（**RED を確認**: ファイルがない。`hooks-config.test.ts` は 8.2 の境界なので使わない）: `npm` と `github-actions` の 2 エコシステムが
    あり、それぞれ `schedule.interval: weekly`（10.11）と `cooldown.default-days` が 1 以上（10.12）。YAML は
    行単位の正規表現で読む（YAML ライブラリは plan に宣言がないため足さない）。値を `daily` や 0 に変えると失敗することを確かめる。
    GitHub が設定を受理するか（スキーマの有効性）は、テストでは確かめられないのでマージ後のタスク 12.7 に残す。
  - 完了条件: YAML として構文が正しく（`ruby -ryaml -e 'YAML.load_file(ARGV[0])' <file>` で確かめる。macOS 標準。依存は足さない）、`dependabot.yml` のスキーマ（公式ドキュメント）に反しない。
    設定の有効性は GitHub 側の読み込みで確かめる（マージ後のタスク 12.7 で Dependabot の設定エラーがないことを確認）。
  _Boundary:_ `.github/dependabot.yml`, `tests/unit/repo-policy.test.ts`
  _Depends:_ 8.1
  _Requirements:_ 10.11, 10.12
  _Traces:_ REQ-010, DES-1.13

### Implementation Notes

- Actions の SHA は `gh api repos/<o>/<r>/git/ref/tags/<tag>` で解決した（3 つとも軽量タグで、直接 commit を指す）。設計時に
  24 時間未満だった mise-action v5.3.0 は実装時に 24 時間を超えたので、計画の候補 v5.2.10 でなく v5.3.0 を採用した（R-1）。
- mise-action は `MISE_TRUSTED_CONFIG_PATHS` を checkout 先に設定し、`MISE_YES=1` と shims の PATH 追加も行う（固定した SHA の
  `src/index.ts`）。CI に `mise trust` のステップは要らない。実際の挙動はタスク 12.5 の最初の CI 実行で確かめる。
- `security` は lockfile だけで動く（`node_modules` なしの作業ツリーのコピーで終了コード 0）。`security-daily.yml` は install しない。
- actionlint は計画に宣言がなく、ユーザーの判断で入れない。YAML の構文は `ruby -ryaml`、規則はテストで確かめた。
- ワークフローの YAML を行単位で読むテストは、`- run:` と `  run:` の両方の書き方を受ける（最初の版は前者に一致しなかった）。

---

## 9. Node 27 alpha 検証レーン

_Boundary:_ `mise.node27.toml`, `tests/unit/repo-policy.test.ts`, `tests/unit/docs-structure.test.ts`, `docs/node27/<YYYY-MM-DD>-initial-lane.md`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 8
_Requirements:_ 7.3, 7.4, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6
_Traces:_ REQ-007, REQ-011, DES-1.9, DES-1.12, DES-1.14

- [x] 9.1 `mise.node27.toml` を、版の整合テストを先に書いて作り、install を試す
  - 先に `repo-policy.test.ts` に足す（**RED を確認**）: `mise ls --current --json` を、`source.path` がリポジトリの
    `mise.toml` / `mise.node27.toml` のものだけに絞って読む。既定レーンは子プロセスの環境から `MISE_ENV` を
    削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の `verify-node27` は `MISE_ENV` を継承
    するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。版番号そのものは期待値にしない（9.9）。
  - `mise.node27.toml`: `[tools] node = "<24h を満たす最新の 27 alpha>"` だけ（11.1）。alpha の公開日時と確認日を
    R-1 に記録する。
  - `mise trust`（新しい設定ファイルのため）のあと `MISE_ENV=node27 mise install` を実行し、出力と結果を R-8 に記録する（11.2）。alpha を解決できなかった場合は、
    失敗の出力と、解決に必要だった設定（`[settings] prereleases = true` など）、または未解決である旨を記録
    する（11.3）。`prereleases = true` は install に必要だった場合だけ `mise.node27.toml` に書き、理由を R-8
    に記録する。
  - 完了条件: `mise run test` が緑。R-8 に実行コマンドと出力がある。
  _Boundary:_ `mise.node27.toml`, `tests/unit/repo-policy.test.ts`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 8.1, 8.2, 8.3
  _Requirements:_ 11.1, 11.2, 11.3
  _Traces:_ REQ-011, DES-1.14
- [x] 9.2 ここまでの実装をコミットする（チェックポイント。ユーザーの確認つき）
  - `git status` で未コミットの変更を確かめ、コミットの分け方を示してユーザーの確認を得てから commit する。Conventional Commits（英語）で、版上げは `build(deps):`。憲章・steering・`AGENTS.md`・`.sdd/reviews/` は タスク 11.5 まで残してよい。push はしない。
  - 実リポジトリで pre-commit と commit-msg が実際に起動することを確かめ、R-9 に記録する: 不正な形式の commit メッセージが拒否され、正しい形式なら commit できる。pre-commit の `secrets`・`biome`・`typecheck`・`model-ids` が通る（7.3、7.4）。フックが落ちた場合は、落ちた検査を持つタスクを開き直し、そのタスクの Boundary 内で直す（この task の Boundary では直さない）。
  - 完了条件: `git log` に Conventional Commits 形式の commit があり、タスク 11.5 まで残すと決めたファイルと、この task が R-9 を書いた research.md を除いて `git status --porcelain` が空。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 9.1
  _Requirements:_ 7.3, 7.4
  _Traces:_ REQ-007, DES-1.9
- [x] 9.3 Node 27 レーンで verify を実行し、初回の検証記録を書く
  - 先に `tests/unit/docs-structure.test.ts` の Node 27 記録部分を書く（**RED を確認**）: `docs/node27/*.md` が
    見出し「結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順」を持つ（11.5）。stage 解説の部分はタスク
    11.1 で足す。
  - `git worktree add --detach ../genai-lab-ts-node27 HEAD`（タスク 9.2 でコミット済みの HEAD を使う）で別 worktree を作り、
    `MISE_ENV=node27` で `mise trust` → `mise install` → `pnpm install --frozen-lockfile` →
    `pnpm exec playwright install chromium` → `mise run verify` を実行する。`node_modules` を既定レーンと共有
    しない（要件 11.4）。フックは worktree 間で共有されるため再 install しない。終了後に `git worktree remove` する。
  - `docs/node27/<実行日>-initial-lane.md` を書く。「検証した版」は `mise run runtime` の実出力（参考値と確認日）。
    verify が失敗した場合は、失敗した検査と出力の要点を「未解決事項」に書く（11.6）。失敗しても本 spec の完了
    条件を満たす（緑は求めない）。`exp/node27` ブランチは作らない。
  - 完了条件: `mise run test` が緑（`docs-structure.test.ts` の Node 27 部分）。worktree が削除されている
    （`git worktree list` に残らない）。
  _Boundary:_ `tests/unit/docs-structure.test.ts`, `docs/node27/<YYYY-MM-DD>-initial-lane.md`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 9.2
  _Requirements:_ 11.4, 11.5, 11.6
  _Traces:_ REQ-011, DES-1.14, DES-1.12

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 10. ZIP 足場の使い捨て環境での検証

_Boundary:_ `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 4, 9
_Requirements:_ 1.9, 12.1, 12.2, 12.3, 12.4, 12.7
_Traces:_ REQ-012, REQ-001, DES-1.15

ZIP のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、`extract-task.ts`、`model.ts`）とそのテストは、
**リポジトリ外**の使い捨て環境でだけ扱い、コミットしない（12.7）。成果物は research.md の R-6 と R-2 だけ。
使い捨て環境の作成場所は、リポジトリ外の新しい空ディレクトリ（`mktemp -d`）にし、ZIP を展開するスクリプトは別の
ディレクトリに置く。展開したファイルは信頼できないデータとして扱い、`-I` なしの Python や展開先をカレント
ディレクトリにした実行をしない。

- [x] 10.1 ZIP を展開し、共有依存を C1 と同じ版に、残りを 24h を満たす最新の exact 版に置き換えて install する
  - 新しい空の一時ディレクトリに `~/Downloads/genai-lab.zip` を展開する。`package.json` の dist-tag と範囲を、
    タスク 1.2 と同じ版（共有する依存）と、24h を満たす最新の exact 版（AI SDK、プロバイダ、Zod、
    `@vitejs/plugin-react`）に置き換える。`pnpm-workspace.yaml` はタスク 1.2 と同じ規則にする
    （`minimumReleaseAgeExclude` なし）。採用した版と公開日時を R-6 に記録する（TypeScript はこの時点の版。11.4 で切り替えた場合は、R-6 が記録した版が実行時のものであることを明記する）。
  - `pnpm install` を実行し、peerDependency の警告の全文と扱いを R-2 に記録する（1.9、plan §8 の 3 項目目）。
  - 完了条件: R-6 に再現手順（コマンド列）と使い捨て環境のパスの扱い（コミットしない）が書かれている。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 4.4
  _Requirements:_ 1.9, 12.1
  _Traces:_ REQ-012, REQ-001, DES-1.15
- [x] 10.2 型検査と、AI SDK 7 の API 名の有無を記録する
  - `pnpm exec tsc --noEmit` を実行し、**ファイルごと**の型エラーを R-6 に記録する。AI SDK 7 の実際の型との
    差異を、引き継ぎ先の段（003〜006）とともに書く（12.2）。
  - `node_modules/ai` の型定義で、`toolApproval`、`isStepCount`、`toUIMessageStream`、
    `createUIMessageStreamResponse`、`convertToModelMessages`、`ToolLoopAgent`、`Output`、
    `MockLanguageModelV4`（`ai/test`）、content の `tool-approval-request` 型の有無を **API ごとに**照合し、
    表で R-6 に記録する（12.3、plan §8 の 2 項目目）。公式ドキュメントの参照先（Context7 または公式サイト）と
    確認日を併記する（12.1）。
  - 完了条件: R-6 に、型エラーの一覧、API 名ごとの有無、引き継ぎ先の段がある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 10.1
  _Requirements:_ 12.1, 12.2, 12.3
  _Traces:_ REQ-012, DES-1.15
- [x] 10.3 ZIP のテストと E2E smoke を実行し、SSE モックの解釈を記録する
  - `pnpm exec vitest run` と `pnpm exec playwright test --grep @smoke` を実行し、結果と出力の要点を R-6 に
    記録する。SSE モックが `useChat` のパーサーで解釈されたかどうかを、画面上の描画または要求の記録を根拠に
    書く（12.4、plan §8 の 4 項目目）。失敗した場合は原因（型の差異、モックの形式、パーサーの変更など）と
    引き継ぎ先の段を書く。
  - plan §8 の 5 項目（Node 27 の install、AI SDK 7 の API 名、peer 警告、SSE モック、TypeScript 7.1 の公開状況）
    それぞれについて、確認方法・実行したコマンド・結果・根拠・確認日が R-2・R-6・R-7・R-8 のどこにあるかを
    R-6 の冒頭に一覧する（12.1。R-7 と R-8 はタスク 1.2 と 9.1 で記録済みであることを確かめる）。
  - 完了条件: 5 項目のすべてに、記録先と確認日がある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 10.2, 9.1
  _Requirements:_ 12.1, 12.4
  _Traces:_ REQ-012, DES-1.15
- [x] 10.4 使い捨て環境を削除し、ZIP のコードがリポジトリに入っていないことを確かめる
  - 使い捨て環境のディレクトリを削除する。リポジトリで `git ls-files` と `git status --porcelain` を実行し、
    `src/app/api/`、`src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`、`tests/unit/agent-approval.test.ts`、
    `tests/unit/extract-task.test.ts`、`tests/e2e/chat.smoke.spec.ts` が存在しないことを確かめ、結果を R-6 に
    1 行で記録する（12.7）。
  - 完了条件: 上記のパスが追跡対象にも未追跡にも存在しない。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 10.3
  _Requirements:_ 12.7
  _Traces:_ REQ-012, DES-1.15

### Implementation Notes

- 自動判定（auto mode）は、使い捨て環境の `pnpm install` / `pnpm exec` と `rm` も拒否した。開発者の手元で実行して出力を貼ってもらった。
  貼り付けの取り違え（`tsc` の欄に install の出力が入った）は、起きた前提で記録し、補う証拠（`tsbuildinfo`、`mtime`）を R-6 に書いた。
- ZIP のテストが失敗したら、まず `test-results/*/error-context.md` を読む。`@smoke` の赤は、型でもモックでもなく `getByRole('alert')` が
  Next の route announcer と重なったロケーターの曖昧さだった。`next dev` は使い捨て環境の `tsconfig.json` も書き換える。
- 「削除した」と書く記録は、削除を確かめてから書く（R-6 に先に書いて直した）。pnpm 12 の `Agent skills awaiting approval` は peer 警告でも
  install スクリプトでもない新しい通知で、段 2 に引き継いだ。

---

## 11. 解説・README・統治文書

_Boundary:_ `docs/stages/1-dev-environment-and-gates.md`, `README.md`, `tests/unit/docs-structure.test.ts`, `.sdd/memory/constitution.md`, `.sdd/steering/tech.md`, `.sdd/steering/structure.md`, `AGENTS.md`, `specs/000-development-plan/plan.md`, `docs/node27/<YYYY-MM-DD>-initial-lane.md`, `package.json`, `pnpm-lock.yaml`, `specs/001-dev-environment-and-gates/research.md`
_Depends:_ 8, 9
_Requirements:_ 1.3, 11.7, 12.5, 12.6, 13.1, 13.2, 13.3, 13.4, 13.7, 13.8, 13.9, 13.10, 13.11, 13.12
_Traces:_ REQ-001, REQ-011, REQ-012, REQ-013, DES-1.1, DES-1.16, DES-3.1

11.1〜11.3 は書くファイルが重ならず、いずれも実在する構成（9.3 まで完了）を前提にする。文書中の版番号は
「確認日つきの参考値」と明記し、合否の条件にしない（13.12）。散文は日本語、`AGENTS.md` は英語。

- [x] 11.1 (P) 段 1 の解説と README を、構造テストを先に書いて作る
  - 先に `tests/unit/docs-structure.test.ts` の解説部分を足す（**RED を確認**）: `docs/stages/*.md` が「読む →
    動かす → 改造する → テストで合格を確かめる」の順の見出しを持つ（13.1）。本文中の `tests/…` のパスが
    すべて実在する（13.2）。`README.md` に `mise activate`、`mise run setup`、`git worktree add` の記述がある（13.3、11.7）。
  - `docs/stages/1-dev-environment-and-gates.md`: 上の 4 節。段 1 の合格条件ごとに、合格を判定するテストの
    パスを示す。オフライン verify → `tests/unit/verify-offline-contract.test.ts`（構成）、
    `tests/unit/network-guard.test.ts`、`tests/unit/gate-self-check.test.ts`、
    `tests/e2e/network-guard.smoke.spec.ts`。秘密値を含む commit の拒否 →
    `tests/unit/gitleaks-pre-commit.test.ts`、`tests/unit/hooks-config.test.ts`。「改造する」には、ゲートを 1 つ
    壊して失敗を観察する演習（例: 偽の直書きを足して `mise run check:model-ids` を落とす）を含める。
  - `README.md`: mise の有効化（`mise activate`）、`mise trust && mise install`、`mise run setup`、
    `mise run verify`、mise を有効にしていない Git クライアントではフックが失敗すること（13.3、13.4）、コマンド
    一覧、`pnpm outdated` が候補ありで exit 1 になること、Node 27 レーン用の git worktree を作り `node_modules` を
    既定レーンと共有せずに検証する手順（9.3 で実行した手順と同じもの。11.7）、Dependabot の security updates は
    cooldown の対象外で 24h 経過後にマージする運用、統治文書（憲章、steering、計画）へのリンク。
  - 解説にはモデル ID の文字列を書かない（`docs/**` と `README.md` は `check:model-ids` の走査対象。手順だけを書く）。
  - 完了条件: `mise run test`、`mise run check`、`mise run check:model-ids` が緑。README の clean な作業用コピーでの確認は、コミット後のタスク 12.1 で行う。
  _Boundary:_ `docs/stages/1-dev-environment-and-gates.md`, `README.md`, `tests/unit/docs-structure.test.ts`
  _Depends:_ 9.3
  _Requirements:_ 11.7, 13.1, 13.2, 13.3, 13.4, 13.12
  _Traces:_ REQ-011, REQ-013, DES-1.16
- [x] 11.2 (P) 憲章を MINOR 改訂し、steering を実際の構成に合わせる
  - `.sdd/memory/constitution.md`: 原則 3 を「verify はオフラインで決定論的な検査、ネットワークが必要な検査は
    security タスクに分け、pre-push と CI 必須ジョブが両方を実行する」内容に改訂する（1.0.0 → 1.1.0）。同じ
    改訂で、Additional Constraints の Node のレーンを「Node 27 alpha は `mise.node27.toml`（`MISE_ENV=node27`）と
    CI の `verify-node27` で分離検証し、`exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る」に明確化
    する。版、Sync Impact Report、改訂履歴を更新する（13.7）。
  - `.sdd/steering/tech.md`: Gate command（verify と security の分離。`mise run verify` が含む構成要素）、
    Supply Chain の gitleaks の置き場（pre-commit は staged、verify は HEAD から到達できる全履歴）、Key Decisions の
    Node 27 の分離検証の記述、状態注記（2026-11-22 時点の「コード未作成」を、取り込み後の状態と確認日に）を
    直す。`.sdd/steering/structure.md`: 状態注記と、`tests/unit/setup/`・`tests/unit/helpers/`・
    `tests/fixtures/` の役割を足す（13.9）。`product.md` は対象外（状態注記は spec 002 で合わせる）。
  - 完了条件: 憲章の版の表記が 1.1.0。Node のレーンの文が 13.7 の文言に一致し、旧文（`exp/node27` で分離検証する）が残っていない（`grep -n "exp/node27" .sdd/memory/constitution.md` の各行を読んで確かめる）。Sync Impact Report と改訂履歴に旧版 1.0.0 が経緯として残るのは正しい。
    steering の記述が `mise.toml` のタスク名と一致する（`mise tasks ls` と突き合わせる）。
  _Boundary:_ `.sdd/memory/constitution.md`, `.sdd/steering/tech.md`, `.sdd/steering/structure.md`
  _Depends:_ 9.3
  _Requirements:_ 13.7, 13.9, 13.12
  _Traces:_ REQ-013, DES-1.16, DES-3.1
- [x] 11.3 (P) `AGENTS.md` と全体計画に、本 spec の決定を反映する
  - `AGENTS.md`（英語）: コマンド表を実在する `mise.toml` のタスク（`verify`・`gate`・`check`・`security`・`test`・
    `e2e`・`check:model-ids`・`outdated`・`runtime`・`setup`）と一致させ、"Current state" を段 1 完了後の状態に
    更新する。Architecture の "(planned)" のうち実在するものを直す。`mise run verify` と `mise run security` の
    分離、pre-push が両方を実行することを書く（13.8）。
  - `specs/000-development-plan/plan.md`: §4（gitleaks 全履歴は verify に移る）、§7 M1（`exp/node27` は必要時に
    作る）、§8.5（`src/` / `tests/` は基盤のみ、`gate` は別名、ADR-4 の依存の扱い）、Constitution Compliance 節
    （憲章が制定済みであること）に、本 spec の Clarifications を参照する改訂注記を入れる（13.10）。
  - 完了条件: `AGENTS.md` のコマンド表の各タスク名が `mise tasks ls` に存在する。名前の変更や件数の変更が
    あった箇所について、旧名・旧件数を grep して残っていないことを確かめる。
  _Boundary:_ `AGENTS.md`, `specs/000-development-plan/plan.md`
  _Depends:_ 9.3
  _Requirements:_ 13.8, 13.10, 13.12
  _Traces:_ REQ-013, DES-1.16
- [x] 11.4 採用版を最終確認し、TypeScript 7.1 の公開状況を再確認する
  - 採用した全依存・ツール・Actions・Node 27 alpha の版が、確認日の時点でも公開から 24 時間以上であることを R-1 の表で再確認し（1.3）、TypeScript 7.1 の RC / stable の公開状況を再確認して R-7 を更新する。24 時間以上経った RC / stable があれば、タスク 1.2 の手順で`package.json`・`pnpm-lock.yaml` をその版に切り替えて `mise run verify` を通し直し、R-7 に記録する（12.5、12.6）。切り替えは タスク 11.5 のコミットに含める。
  - 完了条件: R-1 と R-7 に確認日がある。切り替えた場合は `mise run verify` が緑。
  _Boundary:_ `package.json`, `pnpm-lock.yaml`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 9.3, 11.1, 11.2, 11.3
  _Requirements:_ 1.3, 12.5, 12.6
  _Traces:_ REQ-001, REQ-012, DES-1.1
- [x] 11.5 解説・統治文書を含めてコミットする（チェックポイント。ユーザーの確認つき）
  - タスク 9.2 のコミットの後に増えた変更を、内容を変えずに本 spec のブランチへコミットする（13.11）: 憲章（1.1.0）、steering、`AGENTS.md`、`.sdd/reviews/`、解説・README・`docs-structure.test.ts`、`docs/node27/` の記録、計画 000 の改訂、research.md の R-n（タスク 9.x〜11.4 で追記した分）、タスク 11.4 で版を切り替えた場合の `package.json`・`pnpm-lock.yaml`、SDD の進捗（`specs/001-dev-environment-and-gates/` の `tasks.md`・`traceability.md`・`spec.json`）。コミットの分け方を示してユーザーの確認を得る。pre-commit の各ジョブが通ることを確かめる。push はしない。
  - 完了条件: `git status --porcelain` が空。
  _Boundary:_ `.sdd/memory/constitution.md`, `.sdd/steering/tech.md`, `.sdd/steering/structure.md`, `AGENTS.md`, `specs/000-development-plan/plan.md`, `docs/stages/1-dev-environment-and-gates.md`, `README.md`, `tests/unit/docs-structure.test.ts`, `docs/node27/<YYYY-MM-DD>-initial-lane.md`, `package.json`, `pnpm-lock.yaml`, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 11.1, 11.2, 11.3, 11.4
  _Requirements:_ 13.11
  _Traces:_ REQ-013, DES-1.16

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

---

## 12. 最終検証・記録・CI 確認

_Boundary:_ `specs/001-dev-environment-and-gates/research.md`, リポジトリ設定（ruleset `protect-main`。ファイル外）
_Depends:_ 10, 11
_Requirements:_ 1.8, 2.4, 2.5, 3.1, 3.2, 3.5, 3.7, 3.11, 3.12, 4.2, 4.3, 4.4, 7.5, 7.6, 8.8, 9.6, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.11, 10.12, 11.4, 13.3, 13.11
_Traces:_ REQ-001, REQ-002, REQ-003, REQ-004, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-013, DES-1.3, DES-1.4, DES-1.12, DES-1.13, DES-3.1

実測の記録は research.md の R-3、R-4、R-9、R-10、R-11 に書く（コマンド、結果、根拠、確認日）。**一時的に検査を
壊す操作は、作業ツリーを書き換えずに、リポジトリ外の `git worktree add --detach` で作った作業用コピーで行い**、
終了後に削除する（`git checkout` / `restore` / `stash` を未コミットの変更に使わない）。コピーは タスク 11.5 のコミットから作るので、作るたびに `mise trust`、`mise install`、`pnpm install --frozen-lockfile`、`pnpm exec playwright install chromium` を実行する。実装フェーズごとの
別モデルファミリー（Codex）による敵対的レビューは `/sdd-impl` が `.sdd/reviews/` に 1 ラウンド 1 ファイルで残す
ので、本タスクの外で行う。

- [ ] 12.1 オフライン・決定論・実行時間を実測し、README の手順を clean な作業用コピーで確かめる
  - ネットワークを切り（Wi-Fi を切る、または到達不能なプロキシ）、AI プロバイダの API キーを表す環境変数を1 つも設定しない状態で `mise run verify` を実行する。同一コミット・同一環境で 3 回連続で実行し、3 回とも同じ合否であること、各回の前後で `git status --porcelain` の出力が変わらないこと（verify が追跡ファイルを書き換えない）を確かめる（3.5、3.7、3.1）。**research.md への記録（R-3）は 3 回の実行をすべて終えてから行う**（編集で作業ツリーが変わり、確認が崩れないようにする）。
  - 実行時間を R-11 に記録する: pre-commit フック全体、pre-push フック全体、E2E `@smoke`、`mise run verify` 全体を、開発機で測る（CI の値はタスク 12.5 で追記）。pre-push の E2E smoke の 60 秒は目安で、TODO(E2E_BUDGET) が確定するまで合否に使わない。子プロセスを使うテストの timeout（初期値 60 秒）と `runCommand` の 30 秒を、実測の最大値と照らして見直し、変えた場合は理由を書く。
  - README のセットアップ手順を、コミット済みの HEAD から作った clean な作業用コピーで上から実行して通ることを確かめ、結果を Implementation Notes に書く（13.3）。
  - README の手順やコードの不備で失敗した場合は、担当タスクを開き直してその Boundary 内で直し、タスク 11.5 の追加コミットとして commit し、作業用コピーを作り直して 3 回の測定をやり直す。
  - 完了条件: R-3 と R-11 に実測値と確認日がある。3 回とも終了コード 0。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 11.5, 10.4
  _Requirements:_ 3.1, 3.5, 3.7, 13.3
  _Traces:_ REQ-003, REQ-013, DES-1.3, DES-1.12
- [ ] 12.2 ゲートの違反状態で、verify の構成要素が非 0 になることを記録する
  - 作業用コピーで、違反を 1 つずつ作って該当する構成要素の終了コードと出力の要点を R-9 に記録する（9.6、
    3.2）: (a) `test` の対象を 0 件にする（3.8）、(b) `@smoke` を全部 skip にする（3.9）、(c) E2E から外部
    オリジンへ未モックの要求を出す（3.11）、(d) 構成要素（lint・型・`check:model-ids`・`check:secrets`）を
    1 つずつ壊して `mise run verify` が非 0 になり**後続を実行しない**こと（3.2）。(e) `check:secrets` の
    検出で、出力に検出値が含まれないこと（3.12）。
  - 自動テスト（`gate-self-check.test.ts`、`network-guard.smoke.spec.ts`）が同じ違反を捕まえていることを、
    (a)〜(c) の記録に併記する。Linux ランナーでの外部要求の遮断は、タスク 12.5 が R-9 に追記する。
  - (d)・(e) は偽の秘密値を含む commit が要る。実リポジトリのフックは worktree と共有され `secrets` ジョブが拒否するため、使い捨ての作業用コピーに限り `git -c core.hooksPath=/dev/null commit` で作る。偽の値は実行時に組み立て、コピーごと削除する（実リポジトリでは使わない）。
  - 完了条件: R-9 の (a)〜(e) すべてに終了コードと出力がある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 12.1
  _Requirements:_ 3.2, 3.11, 3.12, 9.6
  _Traces:_ REQ-003, REQ-009, DES-1.12
- [ ] 12.3 受け入れテストが非空虚であることを確認し、記録する
  - 本 spec の受け入れテストごとに、**対象の検査またはロジックを壊すとそのテストが失敗する**ことを作業用
    コピーで確かめ、壊した対象・壊し方・失敗の出力を R-10 に表で記録する（9.7）。対象: `sandbox.test.ts`、
    `network-guard.test.ts`、`gate-self-check.test.ts`、`gitleaks-pre-commit.test.ts`（`--staged` を外す、
    `--redact` を外す、設定ファイルを置く、`check:secrets` から `--redact` を外す）、`check-model-ids.test.ts`、`check-commit-msg.test.ts`、
    `hooks-config.test.ts`、`verify-offline-contract.test.ts`、`repo-policy.test.ts`、`static-analysis.test.ts`
    （`strict` を外す、ルールを `off` にする）、`docs-structure.test.ts`、`network-guard.smoke.spec.ts`、
    `placeholder.smoke.spec.ts`。`hooks-config.test.ts` の実行ケース（タスク 7.5）は、7.5 で R-9 に記録した RED
    （ケースごとの壊し方）を作業用コピーで再現して再確認する。
  - 一時ディレクトリの後始末（8.8）: `gitleaks-pre-commit.test.ts` を成功・失敗の両方で実行した後に、一時
    ディレクトリが残っていないことを R-10 に記録する。静的解析（2.4、2.5）が違反で非 0 になることも同じ表で
    示す。
  - 完了条件: 受け入れテストのすべてに行がある。壊しても失敗しないテストは、担当タスクを開き直してその Boundary 内でテストを直し、タスク 11.5 の追加コミットとして commit してから再確認する。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 12.2
  _Requirements:_ 2.4, 2.5, 8.8, 9.7
  _Traces:_ REQ-002, REQ-008, REQ-009, DES-1.12
- [ ] 12.4 security の失敗系（到達不能・advisory）を実測する
  - `pnpm audit` と osv-scanner を、registry・advisory の取得先に到達できない状態（プロキシを到達不能なポートに
    向ける、または `--offline` 相当）で実行し、終了コードを R-4 に記録する。**成功扱い（0）にならないこと**を
    確かめる（4.4）。0 になる場合は、担当タスク 7.2 を開き直し、その Boundary 内（`mise.toml`、`hooks-config.test.ts`）で構成のテストを先に直して`security:*` に失敗させる処理を足し、タスク 11.5 の追加コミットとして commit する。
  - high 以上の advisory で `pnpm audit` が、既知の脆弱性を持つ依存で osv-scanner が、それぞれ非 0 になることを、
    作業用コピーで既知の脆弱な版を `package.json` と lockfile に入れて確かめ、結果を R-4 に記録する（4.2、4.3）。
    24h ゲートは作業用コピーの実験でも外さない（`minimumReleaseAgeExclude` を使わない）。
  - 完了条件: R-4 に 3 つの失敗系の終了コードと出力の要点がある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 12.1
  _Requirements:_ 4.2, 4.3, 4.4
  _Traces:_ REQ-004, DES-1.4, DES-3.1
- [ ] 12.5 記録をコミットし、push・PR を作成し、CI の緑を確認する
  - タスク 9.2 と 11.5 のコミットの後に増えた変更（research.md の R-3〜R-11 の追記）を `git status` で確かめ、合意したグルーピングで commit する。Conventional Commits（英語）。憲章（1.1.0）、steering、`AGENTS.md` が タスク 11.5 のコミットに含まれていることを `git log` で確かめる（13.11）。ブランチ名は `feat/dev-environment-and-gates` のまま。
  - push の前に、リモートの同名ブランチを `git fetch origin <branch>` で確認する。pre-push フックは
    osv-scanner、`pnpm audit`、unit、`@smoke` を実行する（この push で 4 ジョブが順に起動することを R-9 に記録する。7.5、7.6）。フックが環境要因で落ちた場合は、同じ失敗が
    base ブランチで再現するか、差分が届かない失敗であることを示してから、**ユーザーに skip の可否を一度だけ
    確認**し、skip した場合は PR 本文に記録して CI が代わりに確かめる検査を書く。
  - **push と PR の作成は外向きの操作なので、ユーザーの確認を得てから行う。**
  - CI の `verify` ジョブが緑になることを確認する（1.8、10.1、10.6、10.7）。`verify-node27` が実行され、失敗してもワークフロー全体が失敗にならないこと（10.3、10.4）、Node 27 の結果を `docs/node27/` の記録と突き合わせ、差があれば R-8 に記録して `docs/node27/` への追記が要るかをユーザーに報告する（要件 11.4）。CI の実行時間を R-11 に、Linux での外部要求の遮断を R-9 に追記する（タスク 12.2 の続き）。`security-daily.yml` の実行と Dependabot の確認は、マージ後のタスク 12.7 で行う。PR の `verify` ジョブが `mise run security` を実行して緑になることを、それまでの暫定の証拠として R-9 に書く。
  - 完了条件: PR の `verify` が緑。R-9 と R-11 に CI の結果がある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 11.5, 12.3, 12.4
  _Requirements:_ 1.8, 3.11, 7.5, 7.6, 10.1, 10.3, 10.4, 10.6, 10.7, 11.4, 13.11
  _Traces:_ REQ-001, REQ-003, REQ-007, REQ-010, REQ-011, REQ-013, DES-1.13
- [ ] 12.6 ruleset `protect-main` に必須チェック `verify` を加える
  - CI の `verify` ジョブが一度緑になった後に行う（実装順の制約 4）。現在の ruleset の内容と、
    `required_status_checks` に `verify` を加えた差分を示し、**ユーザーの確認を得てから**適用する。
  - 適用後、`gh api` で ruleset の内容を取得し、必須チェックに `verify` があること（`verify-node27` は含めない）を
    確かめて、結果を research.md の R-9 に追記する（10.2）。ユーザーが適用を見送った場合は、その旨と
    理由を記録して完了とせず、ユーザーに報告する。
  - 完了条件: 必須チェックに `verify` があり、`verify-node27` がない。
  _Boundary:_ リポジトリ設定（ruleset `protect-main`。ファイル外）, `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 12.5
  _Requirements:_ 10.2
  _Traces:_ REQ-010, DES-1.13
- [ ] 12.7 マージ後に `security-daily.yml` と Dependabot を確認する
  - PR が `main` にマージされた後（マージはユーザーの操作）に行う。`security-daily.yml` を `workflow_dispatch` で 1 回実行して結果を確認する（10.5）。Dependabot の設定エラーがないことを GitHub の Insights で確認する（10.11、10.12）。結果を R-9 に追記する。
  - research.md への追記は、マージ後の別の小さな commit（`docs:`）になる。ブランチの扱いはユーザーに確認する。ユーザーがマージ後の確認を見送った場合は、10.5・10.11・10.12 が未確認である旨を報告する。
  - 完了条件: `security-daily.yml` の手動実行が成功し、Dependabot の設定エラーがない。結果が R-9 にある。
  _Boundary:_ `specs/001-dev-environment-and-gates/research.md`
  _Depends:_ 12.6
  _Requirements:_ 10.5, 10.11, 10.12
  _Traces:_ REQ-010, DES-1.13

### Implementation Notes

<!-- Empty at generation. Implementer appends 1-3 bullet learnings after
completing this major task. -->

