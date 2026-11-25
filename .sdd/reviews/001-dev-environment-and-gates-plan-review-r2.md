HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
reviewer: sdd-reviewer (codex unavailable: not logged in)

# 001-dev-environment-and-gates — Plan Review（/sdd-validate-plan Step 3.5、round 2）

- 対象: `specs/001-dev-environment-and-gates/plan.md`（945 行、全文を読んだ）、`research.md`、`spec.md`
- 参照: 前回レビュー `.sdd/reviews/001-dev-environment-and-gates-plan-review.md`（Critique、Adjudication、Resolution）、`.sdd/memory/constitution.md`、`AGENTS.md`
- Risk trigger: なし（タスク生成前の plan 相互レビュー）。codex が使えないため Claude が代行した。
  作成者も Claude 系なので、憲章 原則 11 / AGENTS.md の別モデルファミリー要件は満たさない（round 1 の finding 29 と同じ注記）。
- 前回の HIGH 3 件（CI の install 順、`test.fail()`、`mergeConfig` の include 連結）は plan に反映済みで、確認した。
  再掲はしない。`GATE_NESTED` の二重防止は採用されていないが、include の代入で再帰は防げるため、再掲しない。

## 実測（probe）と推論の区別

scratchpad（`/tmp/r2probe/`）で実行した。リポジトリは変更していない。

| 対象 | 種別 | 結果 |
|------|------|------|
| `mise which git`（git を `[tools]` に含まない一時プロジェクト、mise 2026.11.12） | 実測 | exit 1、`git is not a mise bin`。このマシンの git は `/opt/homebrew/bin/git` で mise 管理外 |
| `mise which gitleaks` / `lefthook` / `node` | 実測 | いずれも exit 0、`~/.local/share/mise/installs/...` の絶対パス |
| `env -i PATH=/usr/bin:/bin` で `node -v`、`pnpm -v`（shell 経由） | 実測 | `node` は ENOENT（127）、`pnpm` は command not found（127） |
| `spawnSync("node", …, { env: { PATH: "/usr/bin:/bin" } })` | 実測 | `error.code = ENOENT`。`spawnSync("git", …)` は成功。`process.execPath` は成功 |
| `#!/usr/bin/env node` のスクリプトを `PATH=/usr/bin:/bin` で直接実行 | 実測 | 127。node_modules の JS bin（vitest、tsc など）も同じ経路で失敗する（pnpm の .bin shim も `node` を PATH から呼ぶ。こちらは一般論で未実測） |
| `mise tasks ls --json` の `verify` の `run` | 実測 | `[{"task":"check"},{"task":"test"}]`（オブジェクト要素） |
| gitleaks 8.30.1 の `--staged --redact --verbose` / `--log-opts=HEAD` の出力 | **未実測**（権限の拒否で実行できず） | 下記 finding で「未確認」として扱う |
| Vitest reporter / Playwright `onEnd` の終了コード上書き、`playwright test --list` の挙動 | 未実測（plan 自身が R-9 に回している） | 推論のみ |
| Biome 2.6.8 の `suspicious/noSkippedTests` の存在 | 未実測 | 推論のみ（research I-9 には 3 ルールしか記録がない） |
| Linux（ubuntu-24.04）での挙動 | 未実測 | 推論のみ |

## Critique

### [CRITICAL] isolatedEnv の PATH に node と pnpm が入らず、テストが起動する Node 系ツールがすべて ENOENT（127）になる
**Location**: specs/001-dev-environment-and-gates/plan.md:189-199（`resolveTool` / `isolatedEnv`）、同 316-318（gate-self-check の (a)）、同 322-323（(c)）、同 350（7.7 case 1）
**Issue**: `PATH` を「resolveTool() で解決したツールのディレクトリ + `/usr/bin:/bin`」に限定しているため、`node`、`pnpm`、`mise` を解決する経路がなく、子プロセスの Node 系コマンドは起動できない。
**Evidence**: 「`PATH` は `resolveTool()` で解決したツールのディレクトリ + `/usr/bin:/bin` にする（フック経由で起動する gitleaks が一時リポジトリでも見つかるように）」（plan.md:198-199）。`resolveTool` の対象は「`gitleaks`、`lefthook`、`git` など」（同 190）で、`node`、`pnpm`、`mise` は明記されていない。一方、gate-self-check は「`mise tasks ls --json` から取得」した argv を実行する（同 316-317）。`test` の `run` は `pnpm exec vitest run` であり、network-guard の入れ子実行は `vitest run` を起動する（同 311-314）。
**Confidence**: high（ENOENT と 127 は probe で確認。どの子プロセスがどの名前で呼ばれるかは plan の記述からの推論）
**Proof**: `env -i PATH=/usr/bin:/bin /usr/bin/env node -v` → `No such file or directory`（exit 127）。`spawnSync("node", ["-v"], { env: { PATH: "/usr/bin:/bin" } })` → `error.code === "ENOENT"`。実装どおりに `pnpm exec vitest run` を isolatedEnv で起動すると、network-guard の (a)・(b) も gate-self-check も動かない。
**Fix**: 次のどちらかを plan に書く。(1) `isolatedEnv()` が PATH に `resolveTool("node")`、`resolveTool("pnpm")`、`resolveTool("mise")` のディレクトリを含める。入れ子の vitest は `process.execPath` と `node_modules/vitest` の実体ファイルで起動し、bin の shebang に頼らない。(2) 入れ子実行の子プロセス環境を「既定 PATH に node を含める」ものとして定義し、その根拠を R-9 で実測する。あわせて、`runCommand` が使う環境を明示し、`pnpm` や `mise` を素の名前で呼ぶ箇所をすべて `resolveTool` の絶対パスに置き換える。

### [CRITICAL] `resolveTool("git")` が `mise which git` で解決できず、一時 git リポジトリを使う 4 つのテストファイルが両方のプラットフォームで動かない
**Location**: specs/001-dev-environment-and-gates/plan.md:189-190（`resolveTool`）、同 186-187（`useTempGitRepo`）、同 264-268（C10 の手順 2）、同 96（`[tools]` に git がない）
**Issue**: `resolveTool(name)` は `mise which <name>` を使うが、git は `mise.toml` の `[tools]` に含まれないため mise は解決できない。
**Evidence**: 「`resolveTool(name)`: リポジトリのルートを cwd にして `mise which <name>` を 1 回だけ実行し、絶対パスを返す（`gitleaks`、`lefthook`、`git` など）」（plan.md:189-190）。`[tools]` は「`node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定」（同 96）。`useTempGitRepo()` は「一時ディレクトリ + `git init`」（同 186-187）。
**Confidence**: high（`mise which git` の失敗は probe で確認。CI の `mise-action` も git を mise 管理にしないのは plan の `[tools]` から推論。Linux での `/usr/bin/git` の存在は未実測）
**Proof**: git を含まない `mise.toml` のプロジェクトで `mise which git` → `mise ERROR git is not a mise bin`、exit 1。この状態で `useTempGitRepo()` を呼ぶ 4 ファイル（`gitleaks-pre-commit`、`hooks-config`、`check-model-ids`、`static-analysis`）と C10 手順 5 はすべて最初の `resolveTool("git")` で失敗する。`verify` は macOS と Linux の両方で赤になる。
**Fix**: git の解決方法を 1 つ決めて plan に書く。例: `git` は `resolveTool` の対象から外し、`isolatedEnv` の PATH に `/usr/bin:/bin` を入れて、`git` を素の名前で呼ぶ（Apple の `/usr/bin/git` と Linux の `/usr/bin/git` で動くことを R-9 で実測する）。または `mise.toml` の `[tools]` に git を入れ、その版を `repo-policy` の検査に加える。どちらにしても、`resolveTool` の失敗メッセージが「git が見つからない」原因を示すことを、テストで確かめる。

### [HIGH] 「非 0 で終わる」だけを確かめるテストは、ツール不在（127）でも緑になる（fake pass）
**Location**: specs/001-dev-environment-and-gates/plan.md:316-318（gate-self-check の (a)）、同 322-325（(c)）、同 350（hooks-config の 7.7 case 1）
**Issue**: 0 件の自己検査と 7.7 case 1 は、終了コードが非 0 であることだけを assert する。コマンドが見つからない（上記 CRITICAL の 2 件）ことでも非 0 になるため、検査対象の動作を確かめないまま緑になる。
**Evidence**: 「(a) `test` の argv + どのファイルにも一致しないフィルタ → 非 0（ファイル 0 件。3.8）」（plan.md:318）。「(c) `e2e` の argv + `--list` + `--grep <一致しないタグ>` → 非 0（3.9）」（同 322-323）。「1. ジョブのツールが見つからない: `PATH=/usr/bin:/bin` で pre-commit フックを実行 → 非 0」（同 350-351）。対照は (b) と case 2 にしかない。
**Confidence**: high（ENOENT が 127 を返すことは probe で確認。assert が終了コードだけであることは plan の文面から確認）
**Proof**: gate-self-check (a) の argv の `pnpm` を解決できない PATH で実行すると、exit 127 のまま `expect(status).not.toBe(0)` が通る。同じ状態で `UnmockedNetworkError` の出力を見る network-guard の (a) は落ちるので、差は assert の書き方にある。
**Fix**: (a) と (c) に、reporter やランナーの固有の出力（「No test files found」、Playwright の該当メッセージ）を assert する。対照として、同じ argv で一致する 1 件を含むテストを実行すると 0 になることを確かめる。7.7 case 1 は、stage 後の出力に gitleaks ではなく「ツール不在」の原因が出ることを assert する。`status === 127` を明示的に区別し、ツール不在と検査失敗を分ける。

### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
**Confidence**: high
**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。

### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
**Confidence**: high
**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。

### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
**Confidence**: high
**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。

### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
**Confidence**: high
**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。

### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。

### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。

### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。

### [LOW] `runCommand` と `useTempGitRepo` の既定の環境が `isolatedEnv()` に結びついていない（prior: round-1 LOW は未適用）
**Location**: specs/001-dev-environment-and-gates/plan.md:187-188（C6 の `runCommand`）、同 280-281（C10 だけに isolatedEnv を明記）、同 750-752（Error Handling）
**Issue**: Error Handling は「pre-push で動く unit テストが GIT_* を引き継ぐ危険」への対策として isolatedEnv を挙げるが、C6 の契約は `runCommand` と `useTempGitRepo` の既定環境を定めていない。対策は C10 にしか結びついていない。
**Evidence**: 「`runCommand()`（シェルを介さない `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）」（plan.md:187-188）。「子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）」は C10 の記述（同 280-281）。
**Confidence**: medium（pre-push 中の GIT_DIR 継承は research I-6 の記述に依る。本レビューでは未実測）
**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、`check-model-ids` の CLI を一時リポジトリの `--root` で実行し、対象の git dir を確かめる。
**Fix**: `runCommand` の既定環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。

### [LOW] 状態遷移図（Architecture）の pre-push から verify への矢印が、pre-push の定義と食い違う
**Location**: specs/001-dev-environment-and-gates/plan.md:57（mermaid の `PP -->|mise run| VER`）
**Issue**: 図の pre-push は `security:osv → security:audit → test → e2e` を直列に呼ぶと書かれているのに、`VER`（verify）への矢印がある。verify は pre-push から呼ばれない。
**Evidence**: 「`PP -->|mise run| SEC`」「`PP -->|mise run| VER`」（plan.md:56-57）。lefthook の表（同 566-569）は pre-push の 4 ジョブがそれぞれ `security:osv`、`security:audit`、`test`、`e2e` を呼ぶと定める。
**Confidence**: high
**Proof**: 図と表を突き合わせると、`VER` への矢印だけが表と一致しない。
**Fix**: 図から `PP -->|mise run| VER` を消す。

### [LOW] 「他の lint / format ツールの設定ファイルを含まない」の検査対象が「など」で曖昧
**Location**: specs/001-dev-environment-and-gates/plan.md:367（repo-policy の規約検査）
**Issue**: 2.1 の検査は「ルートに ESLint / Prettier などの設定ファイルがない」とだけ書かれ、対象の一覧がない。`package.json` の `eslintConfig` や `prettier` キーも対象かどうか決まっていない。
**Evidence**: 「ルートに ESLint / Prettier などの設定ファイルがない（2.1）」（plan.md:367）。spec 2.1「lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定ファイルを含まない」（spec.md:157-158）。
**Confidence**: medium
**Proof**: `.eslintrc.json`、`eslint.config.mjs`、`.prettierrc`、`prettier.config.js`、`dprint.json`、`.stylelintrc`、`package.json` の `eslintConfig` / `prettier` キーのそれぞれを置いたとき、repo-policy が落ちるかを確かめる。
**Fix**: 対象の一覧をテストに書き、`package.json` のキーも検査する。

### [LOW] 5.4（outdated はファイルを変えない）が R-1 の一度きりの記録だけで、自動化されていない
**Location**: specs/001-dev-environment-and-gates/plan.md:875（5.4 のトレーサビリティ）
**Issue**: `outdated` が `package.json`、`pnpm-lock.yaml`、`mise.toml` を変えないことは、タスク実行の前後で `git status` を比べれば自動化できるが、計画は R-1 の記録に頼る。
**Evidence**: 「5.4 | C5 | R-1（実行前後の `git status`）」（plan.md:875）。spec 5.4「`package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない」（spec.md:246-247）。
**Confidence**: high
**Proof**: `outdated` の run に `package.json` の書き換えを足した状態で、現在の計画のテストがすべて緑のままになることを確かめる。
**Fix**: hooks-config か専用テストで、`outdated` を実行する前後の三つのファイルのハッシュを比べる（ネットワークを使うため、CI の security-daily に置くか、R-1 の記録を残す判断を plan に書く）。

### [LOW] 3.12（`check:secrets` が検出値を出力しない）の自動テストがなく、hooks-config はフラグの有無だけを確かめる
**Location**: specs/001-dev-environment-and-gates/plan.md:342（hooks-config の `check:secrets` 検査）、同 866（3.12 のトレーサビリティ）
**Issue**: hooks-config は `--redact` の存在を確かめるだけで、`check:secrets` が検出時に値を出さないことは確かめない。pre-commit 側（C10）とは別に、verify 側の出力は自動検査されていない。
**Evidence**: 「`check:secrets` が `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）」（plan.md:341-342）。3.12 のトレーサビリティは「`tests/unit/hooks-config.test.ts`（`--redact`）、R-10」（同 866）。
**Confidence**: medium
**Proof**: 偽キーを HEAD のコミットに入れた一時リポジトリで `check:secrets` の argv を実行し、stdout と stderr に生の値がないことを確かめる。
**Fix**: C10 と同じ要領で、一時リポジトリの履歴に偽キーを入れて `check:secrets` の argv を実行するテストを追加する。

## 前回の指摘の扱い（再掲しなかったもの）

- round 1 の HIGH 3 件は plan に反映済み。CI の順序（plan.md:416-417）、`test.fail()` の撤去（同 388-394）、include の代入（同 307-311）を確認した。
- round 1 の MEDIUM のうち、7.7 の 2 ケース、C10 の identity、gitleaks の設定ファイル不在、`mise ls` の source 絞り込み、`verify` の構成検査、zero-case の argv 検査、static-analysis、Vitest の timeout、CLAUDE.md の削除、憲章 1.1.0 は反映済み。
- round 1 の LOW のうち、以下は未適用のまま。新しい証拠がなく、revision で悪化していないため再掲しない（prior: LOW, not applied）: `lefthook-local.yml` の gitignore 漏れ、repo-policy の件数下限（zero-case の LOW）、`strictDepBuilds` の明記、`setup` タスクの要件外、Node 27 worktree の `mise trust`、osv-scanner の正の対照、E2E のポート衝突、TypeScript 7.1 の `--showConfig`、`expect(output).not.toContain` の表示、`.invalid` 以外の経路、`dgram` / `dns`、WebSocket、CI の一部の「レビュー」扱い、別モデル要件、`lefthook` の mint フォールバック。

## 強み（判断材料）

- `mise.toml` を検査の唯一の定義とし、フックと CI がタスク名で呼ぶ構成は、round 1 からの一貫性を保っている。
- `lefthook dump --format=json` を、C10 とフック検査の共通の入力にしたことは、実測（`run` の抽出と `lefthook.json` の読み戻し）で裏づけられた。
- E2E の自己検査は、`test.fail()` をやめ、記録された `blockedRequests` を直接 assert する形になった。round 1 の空振りの原因は取り除かれている。

## GO / NO-GO（plan-review.md の基準）

**NO-GO**。CRITICAL が 2 件あり、いずれも plan の記述どおりに実装すると、テストの基盤（子プロセスの起動と一時 git リポジトリ）が macOS と Linux の両方で動かない。plan-review.md の NO-GO 基準「unfeasible approach」に当たる。どちらも、plan の記述を直せば解消する（PATH の構成と git の解決方法）。tasks.md を作る前に直すこと。HIGH と MEDIUM のうち、spec の判断が要るのは次の 2 点（ユーザー判断）: 13.2 の合格判定の対象（テストか実行記録か）、E2E の既定の遮断経路を自動化するか R-10 の記録とするか。

## Verdict
REQUEST_CHANGES

## Hallucination Signal
forced: false

## 件数（重大度別）
- CRITICAL: 2
- HIGH: 1
- MEDIUM: 7
- LOW: 5
- 合計: 15

## 検証の残り（未実測の範囲）
- gitleaks 8.30.1 の `--verbose` 付き argv の出力（権限の拒否で未実行）。finding の MEDIUM（低確信）の根拠。
- Vitest / Playwright の reporter による終了コードの上書き、`playwright test --list` の 0 件時の挙動（plan が R-9 に回しているため、本レビューでは扱わない）。
- Biome 2.6.8 の `noSkippedTests`（スキーマ未確認）。
- Linux ランナーでの `/usr/bin/git` と identity の挙動（推論のみ）。
- 試験に使った一時ファイルは `/tmp/r2probe/` にあり、リポジトリには置いていない。

## Adjudication

Orchestrator: Claude (/sdd-validate-plan). Codex unavailable (`codex login status`: Not logged in); this round is same-family, so it still does not satisfy constitution principle 11.

| Finding | Decision | Evidence |
|---------|----------|----------|
| [CRITICAL] `isolatedEnv()` PATH lacks node / pnpm | stands | orchestrator re-run: `env -i PATH=/usr/bin:/bin node -v` → "No such file or directory", exit 127 |
| [CRITICAL] `resolveTool("git")` via `mise which git` | stands | `git` is not in the plan's `[tools]` (plan.md:96); `mise which git` exit 1; git is `/opt/homebrew/bin/git` here. (No `mise.toml` exists yet, so the exit code alone proves little; the plan's tool list does.) |
| [HIGH] "non-zero" asserts pass on ENOENT (127) | stands | follows from the two CRITICALs; plan.md:316-323, 350 |
| [MEDIUM] 13.2 judgement test, E2E default-block path automation | escalated | spec decision (user) |
| other MEDIUM / LOW | stands as notes | see report |
