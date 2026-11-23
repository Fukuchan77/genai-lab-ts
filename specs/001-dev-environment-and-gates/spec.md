# 001-dev-environment-and-gates

## Project Description

spec 001（開発環境とゲート）

段 1「開発環境とゲート」。`genai-lab.zip` の足場を取り込み、実地検証する（`pnpm install` と
`mise run verify` を実際に通す）。mise / pnpm 12 / lefthook / gitleaks / osv-scanner によるゲート、
Node 26 LTS 既定と Node 27 alpha 検証レーンの切り替え、CI（verify 必須 + verify-node27 参考 +
security-daily）、Dependabot を整える。

- 全体計画: [specs/000-development-plan/plan.md](../000-development-plan/plan.md) の §2〜§4、§5 段 1、
  §7 M1、§8、§8.5
- 原則: [.sdd/memory/constitution.md](../../.sdd/memory/constitution.md)（特に原則 3・8・9・10）
- M1 完了条件（plan §7）: ZIP ガイドの未検証項目（plan §8）をすべて解消し、その時点の pin で
  Node 26 LTS の `mise run verify` と CI が緑。Node 27 alpha の結果（失敗を含む）を
  `docs/node27/` に記録する。
- 段 1 の合格条件（plan §5）: `mise run verify` がネットワーク不要で通る。秘密値を含む commit が
  フックで拒否される。

## Clarifications

### Session 2026-11-22

- Q: spec 001 で、ZIP に入っている段 3〜5 用のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、
  `extract-task.ts`、`model.ts` とその unit / E2E テスト）を `src/` と `tests/` に取り込むか？
  → A: **B（基盤のみ取り込む）**。設定ファイル・CI・フックと、ゲート自体を検査する最小テスト、
  プレースホルダーページ（`@smoke` 1 本）だけを入れる。ZIP のアプリコードは使い捨て環境で型照合し
  （plan §8 の未検証項目）、結果を `research.md` に記録して各段へ引き継ぐ。plan §8.5 の
  `src/app/**`, `src/lib/ai/**`, `tests/**` 行は本決定に合わせて改訂注記を入れる。
- Q: `mise run verify` に、ネットワークが必要なセキュリティ検査（`pnpm audit` と `osv-scanner`）を
  含めるか？ → A: **A（verify と security を分ける）**。`verify`（= `gate`）はオフラインで決定論的な
  lint / format / typecheck / `check:model-ids` / gitleaks（全履歴）/ unit / E2E smoke。`security` は
  ネットワークが必要な `pnpm audit --audit-level=high` / `osv-scanner`。pre-push と CI の必須ジョブは
  両方を実行するので検査は減らない。constitution 原則 3（MINOR 改訂）と AGENTS.md のコマンド表を
  合わせて直す。
- Q: 段 1 の合格条件「秘密値を含む commit がフックで拒否される」を、どう確かめるか？
  → A: **A（自動テスト、値は実行時生成）**。Vitest のテストが一時ディレクトリに git リポジトリを作り、
  実行時に組み立てた偽のキーを stage して、`lefthook.yml` と同じ引数の gitleaks が非 0 で終わること、
  秘密値なしなら 0 で終わることを確かめる。検出される形の値をソースに直書きせず、`.gitleaksignore`
  や allowlist での除外も使わない。オフラインで verify に含まれる。
- Q: Node 27 alpha 検証レーンで、spec 001 はどこまでを完了条件にするか？
  → A: **A（設定 + CI + 記録。ブランチは必要時）**。`mise.node27.toml`、CI の `verify-node27`
  （`continue-on-error`）、初回の `docs/node27/YYYY-MM-DD-<topic>.md` 記録（失敗でも可）、README の
  worktree 手順までを完了条件とする。`exp/node27` は Node 27 専用の修正が実際に必要になったときに作る。
  plan §7 M1 の記述を合わせて直す。

### Session 2026-11-22（plan レビュー後の決定）

- Q: 原則 3 の改訂の版は？ → A: **MINOR（1.0.0 → 1.1.0）**。検査は security タスクへ移るだけで減らない
  ため後方非互換（MAJOR）ではないが、「唯一の検証入口」の中身を変える実質的な変更で、表現の修正
  （PATCH）ではない。13.7 を合わせて直す。
- Q: `CLAUDE.md` を本 spec の PR に含めるか？ → A: **含めない**。リポジトリに存在しないため、13.11 から外す。
- Q: verify の gitleaks 全履歴スキャンの範囲は？ → A: **HEAD から到達できる履歴に限る**
  （`--log-opts=HEAD`）。gitleaks の既定（`git log --all`）は別ブランチや stash も走査し、3.7 の決定論を
  崩すため。

### Session 2026-11-23（plan レビュー round 4 後の決定）

- Q: 憲章 Additional Constraints の「Node 27 alpha は `mise.node27.toml` と `exp/node27` で分離検証」と、
  Clarifications 4 問目（`exp/node27` は必要時に作る）の食い違いをどう扱うか？ → A: **原則 3 と同じ
  1.1.0 の改訂で明確化する**。Node 27 alpha の分離検証は `mise.node27.toml`（`MISE_ENV=node27`）と CI の
  `verify-node27` で行い、`exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る、と書き換える。
  13.7 の範囲をこの明確化まで広げる。

### 前提（質問せずに置いた仮定）

- constitution（`.sdd/memory/constitution.md`）、steering（`.sdd/steering/*`）、`AGENTS.md` は
  plan §6 のガバナンス手順で作成済み（未コミット）。spec 001 ではこれらを新規に作らず、本 spec の
  PR に含めてコミットし、上の決定に合わせた改訂（原則 3 の MINOR、AGENTS.md のコマンド表と
  "Current state"）だけを行う。

## Scope

- In scope:
  - ZIP の基盤ファイルの取り込みと §2.2 の修正（`mise.toml`、`mise.node27.toml`、`package.json`、
    `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、
    `next.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、
    `.github/workflows/*`、`.github/dependabot.yml`）
  - `src/lib/ai/model-allowlist.ts` と `scripts/check-model-ids.mjs`（`check:model-ids`）
  - ゲート自体を検査する最小のユニットテスト（0 件で失敗、未モック通信で失敗、など）と、
    プレースホルダーページ 1 枚 + `@smoke` E2E 1 本（pre-push と verify が空振りしないため）
  - ZIP のアプリコード（段 3〜5 相当）の使い捨て環境での型照合と、`research.md` への記録
    （plan §8 の未検証項目の解消）
  - `mise run verify`（オフライン・決定論的）と `mise run security`（ネットワーク必要）の分離、
    両方を pre-push と CI 必須ジョブで実行
  - 秘密値を含む commit が gitleaks で拒否されることの自動テスト（偽キーは実行時生成）
  - Node 27 レーン: `mise.node27.toml`、CI の `verify-node27`（参考・非ブロック）、初回記録
  - 解説 `docs/stages/1-dev-environment-and-gates.md`、初回の `docs/node27/` 記録、README 更新
    （mise 有効化の注意、Node 27 worktree 手順）
  - 改訂: plan §7 M1・§8.5 の注記、constitution 原則 3（MINOR）、AGENTS.md のコマンド表と
    "Current state"
- Out of scope:
  - ZIP のアプリコード（`src/app/api/chat/route.ts`、`src/app/page.tsx` の chat UI、
    `src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`）とその unit / E2E テストの `src/` / `tests/`
    への取り込み（各段 003〜006 の spec で TDD により実装する）
  - shadcn/ui・Tailwind CSS の導入（spec 002 以降）
  - `exp/node27` ブランチの作成と push（Node 27 専用の修正が必要になった時点で行う）
  - Node 27 alpha で verify が緑になること（結果の記録だけを求める）

## Glossary

| Term | Definition |
|------|------------|
| ZIP 足場 | `genai-lab.zip` に含まれる設定ファイル・CI・フック・アプリコード一式。ガイドの記述は未検証（plan §8） |
| 基盤ファイル | ZIP 足場のうち、Scope の In scope に列挙した設定・CI・フック・Dependabot のファイル |
| verify タスク | `mise run verify`。オフラインで決定論的な単一の検証入口。`mise run gate` はその別名 |
| security タスク | `mise run security`。ネットワークを必要とする依存の脆弱性検査（`pnpm audit`、osv-scanner） |
| 既定レーン | `MISE_ENV` を設定しない状態。Node 26 LTS で動き、CI の必須ジョブになる |
| Node 27 レーン | `MISE_ENV=node27` の状態。Node 27 alpha で動き、CI では参考ジョブ（非ブロック）になる |
| 使い捨て環境 | リポジトリ外の一時ディレクトリなど、結果をコミットしない検証用の作業場所 |
| 偽キー | 秘密値の検出テスト用に、テスト実行時に組み立てる本物ではない鍵文字列 |
| モデル ID | LLM プロバイダのモデルを指す識別子文字列。唯一の定義は `src/lib/ai/model-allowlist.ts` |
| 非空虚 | 対象の検査やロジックを壊すと、そのテストが失敗することを確認済みであること |
| research.md | `specs/001-dev-environment-and-gates/research.md`。公式ドキュメントと実測による根拠の記録 |

## Requirements

<!--
Generated by /sdd-spec in EARS format. Each requirement heading carries a
leading NUMERIC id only (e.g. "Requirement 1"). Acceptance criteria are
numbered hierarchically (1.1, 1.2). Keywords WHEN / WHILE / IF / THEN /
WHERE / THE / SHALL are kept in English; the rest is Japanese.
-->

### Requirement 1: 依存とツールの版固定

ラボの保守者として、公開直後の不正版を自動で取り込まず、いつどの版を採用したかを設定と lockfile で
追えるようにしたい（plan §2.1・§2.2、D3、憲章 原則 8・9）。

**Acceptance Criteria**

1.1 THE `mise.toml` と `mise.node27.toml` SHALL ランタイムとツール（Node、pnpm、lefthook、gitleaks、
osv-scanner）の版を exact な版番号で指定し、`latest` などのタグや範囲指定を含まない。

1.2 THE `package.json` SHALL `dependencies` と `devDependencies` のすべての版を exact な版番号で指定し、
`latest`・`canary`・`beta` などの dist-tag や範囲指定（`^`、`~`、`*`、`>=` など）を含まない。

1.3 THE リポジトリ SHALL 採用する各版を、採用時点で公開から 24 時間以上経過したものに限り、その版の
公開日時と確認日を research.md に記録する。

1.4 THE `pnpm-workspace.yaml` SHALL `minimumReleaseAge: 1440` を指定し、`minimumReleaseAgeExclude` を
含まない。

1.5 THE `pnpm-workspace.yaml` SHALL 依存の install スクリプトを既定で実行しない設定とし、`allowBuilds`
で許可するパッケージごとに許可理由を記す。`sharp` の install スクリプトは許可しない。

1.6 THE `package.json` SHALL `packageManager` に `mise.toml` が指定する pnpm と同じ版を指定する。

1.7 THE `package.json` SHALL `engines.node` に Node 26 LTS 系列を下限とする範囲を指定する。

1.8 WHEN 開発者がクリーンな checkout で README の手順どおりに依存を lockfile 固定（`--frozen-lockfile`）で
install したとき、THE リポジトリ SHALL 終了コード 0 で install を完了する。

1.9 IF install 時に peerDependency の警告が出た場合、THEN THE リポジトリ SHALL その警告文と扱い
（`overrides` で解消した、または受容した理由）を research.md に記録する。

### Requirement 2: lint・format・型検査の設定

ラボの保守者として、規約を 1 か所に集約し、型の抜け道を設定で塞ぎたい（憲章 原則 7、Additional
Constraints の lint / format）。

**Acceptance Criteria**

2.1 THE リポジトリ SHALL lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定
ファイルを含まない。

2.2 THE `biome.json` SHALL `noUnusedVariables`、`noUnusedImports`、`noExplicitAny` を `error` とする。

2.3 THE `tsconfig.json` SHALL `strict` を有効にする。

2.4 IF 検査対象のソースに明示的な `any`、未使用の変数、未使用の import のいずれかが含まれる場合、THEN THE
verify タスク SHALL 非 0 で終了する。

2.5 IF 検査対象のソースに型エラーが含まれる場合、THEN THE verify タスク SHALL 非 0 で終了する。

### Requirement 3: verify ゲート

ラボの保守者と学習者として、API キーもネットワークもない環境で、同じコミットなら常に同じ合否を返し、
空振りしない検証入口が 1 つだけほしい（段 1 の合格条件、憲章 原則 3）。

**Acceptance Criteria**

3.1 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL lint、format チェック、
型検査、`check:model-ids`、gitleaks による git 全履歴（HEAD から到達できるコミット）のシークレットスキャン、unit テスト、E2E `@smoke`
テストを実行し、すべてが成功した場合に限り終了コード 0 を返す。

3.2 IF 3.1 の構成要素のいずれかが失敗した場合、THEN THE verify タスク SHALL 非 0 で終了する。

3.3 WHEN 開発者が `mise run gate` を実行したとき、THE gate タスク SHALL verify タスクと同じ検査を実行し、
同じ終了コードを返す。

3.4 THE `mise.toml` SHALL verify の構成要素を個別に実行するタスク（lint / format の `check`、unit の
`test`、E2E の `e2e`、`check:model-ids`）を持つ。

3.5 WHILE ネットワークに接続できず、AI プロバイダの API キーを表す環境変数が 1 つも設定されていない状態で、
THE verify タスク SHALL 依存とテスト用ブラウザが install 済みであれば 3.1 の検査を完了し、ネットワーク
接続時と同じ合否を返す。

3.6 THE verify タスク SHALL ネットワークを必要とする検査（`pnpm audit`、osv-scanner）を含まない。

3.7 WHEN 同一コミット・同一環境で verify タスクを 3 回連続で実行したとき、THE verify タスク SHALL 3 回
とも同じ合否を返す。

3.8 IF unit テストの実行件数が 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。

3.9 IF `@smoke` に一致する E2E テストが 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。

3.10 IF unit テストがモックされていないネットワークアクセスを行った場合、THEN THE unit テストの実行環境
SHALL そのテストを失敗させる。

3.11 IF E2E テストが、テスト対象アプリのオリジン以外へのリクエストのうちモックが定義されていないものを
発した場合、THEN THE E2E テストの実行環境 SHALL そのテストを失敗させる。

3.12 IF gitleaks の全履歴スキャンが秘密値を検出した場合、THEN THE verify タスク SHALL 非 0 で終了し、
検出した値そのものを出力しない。

### Requirement 4: security タスク

ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。

**Acceptance Criteria**

4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
終了コード 0 を返す。

4.2 IF `pnpm audit` が high 以上の advisory を検出した場合、THEN THE security タスク SHALL 非 0 で終了する。

4.3 IF osv-scanner が lockfile の依存に既知の脆弱性を検出した場合、THEN THE security タスク SHALL 非 0 で
終了する。

4.4 IF advisory の取得先に到達できない場合、THEN THE security タスク SHALL 成功として扱わず、非 0 で
終了する。

4.5 WHERE 脆弱性の除外を記録する場合、THE リポジトリ SHALL 除外ごとに対象の advisory ID、理由、退役条件を
記す。

### Requirement 5: 記録用・更新確認用の補助タスク

ラボの保守者として、検証記録に残す実行環境の版と、週次で上げる更新候補を、合否とは切り離して
確かめたい（plan §2.1、§8.5）。

**Acceptance Criteria**

5.1 WHEN 開発者が `mise run runtime` を実行したとき、THE runtime タスク SHALL Node、pnpm、TypeScript、
Next.js、lefthook、gitleaks、osv-scanner の実際の版を出力し、終了コード 0 を返す。

5.2 THE runtime タスク SHALL 出力した版を特定の期待値と照合しない。

5.3 WHEN 開発者が `mise run outdated` を実行したとき、THE outdated タスク SHALL `package.json` の依存の
更新候補を一覧で出力する。

5.4 THE outdated タスク SHALL `package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない。

### Requirement 6: モデル ID の allowlist と直書き検査

ラボの保守者として、モデル ID の散在と存在しないモデルの指定を防ぐため、モデル ID を 1 か所にだけ
書かせ、それ以外の直書きを機械的に検出したい（憲章 原則 5、plan §2.2）。

**Acceptance Criteria**

6.1 THE リポジトリ SHALL モデル ID を `src/lib/ai/model-allowlist.ts` にだけ定義する。

6.2 THE `src/lib/ai/model-allowlist.ts` SHALL 登録する各モデル ID について、プロバイダの公式ドキュメントで
存在を確認した根拠を research.md に記録する。

6.3 WHEN `mise run check:model-ids` を実行し、allowlist ファイルとテスト fixture 以外の走査対象ファイルに
モデル ID の文字列が含まれていたとき、THE `check:model-ids` SHALL 非 0 で終了し、該当するファイルパスと
行番号を出力する。

6.4 THE `check:model-ids` SHALL allowlist に登録された ID に加えて、allowlist に未登録でもプロバイダの
モデル ID の命名形式に一致する文字列を検出する。

6.5 THE `check:model-ids` SHALL ソースコード、スクリプト、テスト、ルートの設定ファイル、`docs/`、
`README.md` を走査対象とする。

6.6 WHERE ファイルがテスト fixture の置き場として指定されている場合、THE `check:model-ids` SHALL その
ファイルを検出対象から除く。

6.7 WHEN 走査対象にモデル ID の直書きがないとき、THE `check:model-ids` SHALL 終了コード 0 を返す。

### Requirement 7: Git フック

ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。

**Acceptance Criteria**

7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
pre-push の 3 つのフックを git に登録する。

7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
実行する。

7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
拒否する。

7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
commit を拒否する。

7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。

7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
実行せずに push を拒否する。

7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
フック SHALL 検査を省略して成功とせず、非 0 で終了する。

7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。

### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）

学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。

**Acceptance Criteria**

8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
が非 0 で終了することを確かめる。

8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。

8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
変わったときは変更後の引数で検査する。

8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
リテラルで含めない。

8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
コメントを使わない。

8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
ことを確かめる。

8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。

8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。

### Requirement 9: 最小アプリとゲートの自己検査

ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。

**Acceptance Criteria**

9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
参照を行わない。

9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。

9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
プレースホルダーページの見出しが表示されることを確かめる。

9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
直書きのない入力に対して 0 で終了することを確かめる。

9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
ことを確かめる。

9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
非 0 になることを、自動テストまたは実行記録で示す。

9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
そのテストが失敗すること（非空虚）を確認した記録を残す。

9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。

9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。

### Requirement 10: CI と Dependabot

ラボの保守者として、フックを回避した変更も同じ検査で止め、依存とツールの更新候補を自動で受け取りたい
（plan §3.2、憲章 原則 3・8）。

**Acceptance Criteria**

10.1 WHEN `main` または `exp/**` への push、あるいは pull request が発生したとき、THE CI SHALL 既定レーンの
verify ジョブで verify タスクと security タスクを実行する。

10.2 IF 既定レーンの verify ジョブが失敗した場合、THEN THE CI SHALL その pull request の `main` への
マージをブロックする。

10.3 WHEN 10.1 と同じイベント、または週 1 回の定期実行が発生したとき、THE CI SHALL Node 27 レーンの
verify-node27 ジョブで verify タスクを実行する。

10.4 IF verify-node27 ジョブが失敗した場合、THEN THE CI SHALL ワークフロー全体を失敗とせず、マージを
ブロックしない。

10.5 WHEN 毎日の定期実行の時刻になったとき、THE security-daily ワークフロー SHALL 既定ブランチで security
タスクを実行し、失敗した場合はワークフローを失敗として通知する。

10.6 THE CI SHALL git 全履歴のシークレットスキャンを行うジョブで、全履歴を取得してから検査する。

10.7 THE CI SHALL 依存を lockfile 固定（`--frozen-lockfile`）で install する。

10.8 THE ワークフロー定義 SHALL すべての `uses:` をコミット SHA で固定する。

10.9 THE ワークフロー定義 SHALL 各ジョブの `permissions:` を、そのジョブが必要とする最小の権限だけに
限る。

10.10 THE ワークフロー定義 SHALL AI プロバイダの API キーを表す secret を参照しない。

10.11 THE `.github/dependabot.yml` SHALL GitHub Actions と npm の依存について、週 1 回の更新提案を設定する。

10.12 THE `.github/dependabot.yml` SHALL 公開から 24 時間未満の版を更新提案しない設定を持つ。

### Requirement 11: Node 27 alpha 検証レーン

ラボの保守者として、既定レーンを壊さずに Node 27 alpha での動作を継続的に確かめ、結果（失敗を含む）を
残したい（Clarifications 4 問目、plan §3、憲章 Additional Constraints の Node のレーン）。

**Acceptance Criteria**

11.1 THE `mise.node27.toml` SHALL Node の版だけを上書きし、それ以外のツールの版は `mise.toml` の指定を
引き継ぐ。

11.2 WHEN 開発者が `MISE_ENV=node27 mise install` を実行したとき、THE Node 27 レーン SHALL Node 27 alpha
を install する。

11.3 IF `MISE_ENV=node27 mise install` が Node 27 alpha を解決できなかった場合、THEN THE リポジトリ SHALL
失敗の出力と、解決に必要だった設定（prerelease の扱いなど）または未解決である旨を research.md に記録する。

11.4 WHEN 開発者が `MISE_ENV=node27 mise run verify` を実行したとき、THE Node 27 レーン SHALL 既定レーンと
同じ検査を Node 27 alpha で実行する。

11.5 THE リポジトリ SHALL `docs/node27/YYYY-MM-DD-<topic>.md` に初回の検証記録を 1 件以上持ち、その記録は
「結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順」の見出しを持つ。

11.6 IF Node 27 レーンの verify が失敗した場合、THEN THE 検証記録 SHALL 失敗した検査と出力の要点を
「未解決事項」に記す。

11.7 THE README SHALL Node 27 レーン用の git worktree を作り、`node_modules` を既定レーンと共有せずに
検証する手順を記す。

### Requirement 12: ZIP 未検証項目の解消と記録

ラボの保守者として、ZIP ガイドの未検証の記述を実測で確定し、段 3〜6 が根拠のある前提から始められる
ようにしたい（plan §7 M1・§8、Clarifications 1 問目、憲章 原則 9）。

**Acceptance Criteria**

12.1 THE research.md SHALL plan §8 の未検証 5 項目それぞれについて、確認方法、実行したコマンド、結果、
根拠（公式ドキュメントの参照先と実行出力）、確認日を記録する。

12.2 WHEN ZIP のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、`extract-task.ts`、`model.ts`）と
その unit / E2E テストを使い捨て環境で型検査したとき、THE research.md SHALL ファイルごとの型エラーと、
AI SDK 7 の実際の型との差異を、引き継ぎ先の段（003〜006）とともに記録する。

12.3 THE research.md SHALL ZIP が使う AI SDK 7 の API 名（`toolApproval`、`isStepCount`、
`toUIMessageStream` など）が、install した版の型定義に存在するかどうかを API ごとに記録する。

12.4 WHEN ZIP の E2E smoke テストを使い捨て環境で実行したとき、THE research.md SHALL SSE モックが
`useChat` のパーサーで解釈されたかどうかと、その実行出力を記録する。

12.5 WHEN 実装時点で TypeScript 7.1 の RC または stable が公開から 24 時間以上経過しているとき、THE
リポジトリ SHALL beta からその版へ切り替え、切り替えたことを research.md に記録する。

12.6 IF 実装時点で TypeScript 7.1 の RC と stable がどちらも公開されていないか、公開から 24 時間未満の場合、
THEN THE research.md SHALL 確認日とその時点の公開状況を記録し、beta を据え置く。

12.7 THE リポジトリ SHALL ZIP のアプリコードとそのテストを `src/` と `tests/` に含めない。

### Requirement 13: 解説・README・統治文書の更新

学習者として段 1 を「読む → 動かす → 改造する → テストで合格を確かめる」で進めたい。ラボの保守者として、
本 spec の決定と統治文書・計画の記述を一致させたい（憲章 原則 2、Governance）。

**Acceptance Criteria**

13.1 THE 解説 `docs/stages/1-dev-environment-and-gates.md` SHALL 「読む → 動かす → 改造する → テストで
合格を確かめる」の順の節を持つ。

13.2 THE 解説 SHALL 段 1 の合格条件（verify がネットワーク不要で通る、秘密値を含む commit がフックで
拒否される）ごとに、合格を判定するテストのパスを示し、そのパスはリポジトリに実在する。

13.3 THE README SHALL mise の有効化、ツールと依存とテスト用ブラウザの install、フックの登録までの
セットアップ手順を記す。

13.4 THE README SHALL mise を有効にしていない Git クライアントではフックが失敗することを明記する。

13.5 THE `.env.example` SHALL 変数名だけを持ち、値を持たない。

13.6 THE `.gitignore` SHALL `.env`、`.env*.local`、`.next`、テスト成果物（レポートとトレース）を
git の追跡対象から除く。

13.7 THE 憲章 SHALL 原則 3 を「verify はオフラインで決定論的な検査、ネットワークが必要な検査は security
タスクに分け、pre-push と CI 必須ジョブが両方を実行する」内容に MINOR 改訂（1.0.0 → 1.1.0）し、同じ改訂で
Additional Constraints の Node のレーンを「Node 27 alpha は `mise.node27.toml`（`MISE_ENV=node27`）と CI の
`verify-node27` で分離検証し、`exp/node27` は Node 27 でだけ必要な修正が生じた時点で作る」内容に明確化して、
版、Sync Impact Report、改訂履歴を更新する。

13.8 THE `AGENTS.md` SHALL コマンド表を実在する `mise.toml` のタスクと一致させ、"Current state" を段 1
完了後の状態に更新する。

13.9 THE steering（`tech.md` の Gate command、`structure.md` の状態注記）SHALL verify と security の分離と、
取り込んだ実際の構成に合わせて更新される。

13.10 THE plan（`specs/000-development-plan/plan.md`）SHALL §7 M1（`exp/node27` は必要時に作る）と §8.5
（`src/app/**`、`src/lib/ai/**`、`tests/**` は基盤のみ取り込む）に、本 spec の Clarifications を参照する
改訂注記を持つ。

13.11 THE 本 spec の PR SHALL 未コミットの憲章、steering、`AGENTS.md` を含める。

13.12 THE 文書 SHALL 記載する版番号を確認日つきの参考値として示し、合否の条件にしない。

## Non-Functional Requirements

- **オフライン・決定論**: verify タスクは API キーとネットワークを必要とせず、同一コミットで同じ合否を
  返す（3.5、3.7）。ネットワークを使う検査は security タスクと CI の install 工程に限る。
- **実行時間（記録）**: 初回実装時に、pre-commit フック全体、pre-push フック全体、E2E `@smoke`、verify
  タスク全体の実行時間を、既定レーンの開発機と CI のそれぞれで測り research.md に記録する。pre-push の
  E2E smoke は 60 秒以内を目安とするが、TODO(E2E_BUDGET) が spec 003 で確定するまでは合否に使わない。
- **セキュリティ**: シークレットスキャンの出力は検出値を含まない（3.12、8.6）。CI は AI プロバイダの
  secret を参照せず、ジョブの権限を最小にする（10.9、10.10）。
- **実行環境**: 既定レーンは macOS（zsh、mise 有効）の開発機と GitHub Actions の Linux ランナーの両方で
  verify が緑になる。
- **言語**: spec、解説、steering、憲章の散文は日本語。コード、識別子、コメント、パス、コミット
  メッセージ、`AGENTS.md` は英語。

## Out of Scope / Future Work

- ZIP のアプリコード（chat route・chat UI・エージェント・構造化出力・プロバイダ選択）の実装は段 003〜006
  の spec で TDD により行う。12.2〜12.4 の記録をその入力にする。
- shadcn/ui と Tailwind CSS v4 の導入（spec 002 以降）。
- `exp/node27` ブランチの作成と push（Node 27 専用の修正が実際に必要になった時点）。
- Node 27 alpha で verify が緑になること（本 spec は結果の記録までを求める）。
- 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)、spec 002 の実測で決定）。
- pre-push E2E smoke の時間上限の確定（TODO(E2E_BUDGET)、spec 003 の実測で決定）。

---

_Initialized: 2026-11-22T12:05:52Z_ | _Requirements generated: 2026-11-22_
