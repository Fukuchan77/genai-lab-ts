HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
reviewer: codex (round 3)

Reading additional input from stdin...
OpenAI Codex v0.171.0
--------
workdir: /Users/Shared/codes/genai-lab-ts
model: gpt-advantage-assist
provider: ica
approval: never
sandbox: read-only
reasoning effort: high
reasoning summaries: none
session id: 01a205b1-5b5b-7601-9810-19fcbcebe7fd
--------
user
You are reviewing a technical plan that a different agent wrote.
Do not edit any file. Report findings only.

Read first, in this order:
- specs/001-dev-environment-and-gates/spec.md (requirements: all)
- specs/001-dev-environment-and-gates/plan.md
- specs/001-dev-environment-and-gates/research.md
- .sdd/memory/constitution.md
- .sdd/steering/tech.md, .sdd/steering/structure.md
- .sdd/reviews/001-dev-environment-and-gates-plan-review.md (round 1) and
  .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md (round 2):
  prior decisions. Tag repeats `(prior: <decision>)`. Check whether the two
  round-2 CRITICALs (isolatedEnv PATH lacking node/pnpm; resolveTool("git")
  via `mise which git`) and the round-2 HIGH (non-zero asserts passing on
  ENOENT/127) are actually resolved in the current plan.md.

Target: specs/001-dev-environment-and-gates/plan.md (round 3 review)
Review trigger: none (pre-task-generation plan review). This is the first
round reviewed by a different model family than the author (Claude).

Focus on: feasibility of the test harness on macOS and Linux (ubuntu-24.04)
CI runners; requirement coverage and traceability (every acceptance criterion
in spec.md maps to a design element and a test or recorded check); fake-pass
risks in gate self-tests; constitution MUST / MUST NOT violations; internal
contradictions between plan sections; undefined key boundaries.

Apply the Zero-Tolerance List in ~/.agents/skills/adversarial-review/SKILL.md.
Plan review only: also apply ~/.agents/sdd/rules/plan-review.md.

You may run read-only probes (e.g. `mise which`, `gitleaks --help`,
`node -e`) in a scratch directory outside the repo to back a claim; say
which claims are measured and which are inferred.

Write the report in Japanese (code, paths, identifiers in English).
Report every finding, including LOW and uncertain ones, in exactly this format:

## Critique
### [CRITICAL|HIGH|MEDIUM|LOW] <title>
**Location**: path:line
**Issue**: one sentence
**Evidence**: quoted code or spec clause
**Confidence**: high | medium | low
**Proof**: a test or command that would demonstrate the issue
**Fix**: concrete action

## Verdict
REJECT | REQUEST_CHANGES | APPROVE_WITH_NOTES | APPROVE
exec
/bin/zsh -lc "printf '%s\\n' '--- adversarial-review skill ---'; cat \""'$HOME/.agents/skills/adversarial-review/SKILL.md"; printf '"'%s\\n' '--- plan-review rules ---'; cat \""'$HOME/.agents/sdd/rules/plan-review.md"' in /Users/Shared/codes/genai-lab-ts
 succeeded in 84ms:
--- adversarial-review skill ---
---
name: adversarial-review
description: Use this skill for post-hoc scrutiny of code, specs, or tests produced by another agent or a prior session — applied by codex-review (Codex) or, as its fallback, the sdd-reviewer subagent from /sdd-impl Step 4.5 and /review-consolidate, or when the user asks for an "adversarial review" or "adversary pass". Checks for placeholder comments, lazy error handling, missing edge cases, fake-pass tests, and unjustified spec deviations. Not for initial authoring.
---

# Adversarial Review

## Role

Review work another agent wrote, looking for broken invariants, spec
deviations, and hidden debt; treat it as unverified until evidence shows
otherwise. Work from the Input Contract only — spec, tests, diff, prior
reviews — in a fresh context, so the author's reasoning doesn't anchor you.

## Zero-Tolerance List

- Placeholder comments (`TODO` / `FIXME` without linked issue ID)
- Lazy error handling (generic catch-all, swallowed exceptions)
- O(n²) or worse where O(n) is reachable
- Missing edge cases: null, empty, boundary, overflow, concurrent access
- Unjustified deviations from spec.md — state who must change: code (spec
  stands), spec (cite the written evidence of intent), or undecided. Never
  infer intent from git history, and don't report design choices (layout,
  wording, library, API style) as requirement deviations
- **Unrequested behavior**: observable behavior no requirement asks for
  (extra endpoint, flag, actor, or side effect)
- **One-sided permission tests**: a "who may" rule tested only for the
  permitted actor, or an effect tested without checking what must stay unchanged
- Security anti-patterns (string SQL, unescaped shell, weak crypto)
- Hard-coded values substituted for general logic
- Boundary violations: modifying files outside the task's `_Boundary:_` declaration without an explicit plan.md update
- **Tautological tests**: expected values copied from the implementation's observed
  output instead of derived from the requirement. Verify against the requirement text,
  not against the code — such a test passes no matter how wrong the behavior is
- **Fake pass**: any false-green pattern from
  `~/.claude/skills/test-strategy/tdd-workflow.md` Phase 3.5 (empty or skipped bodies,
  always-true assertions, assertions on the mock, swallowed exceptions, zero-case
  parametrization, target never imported), or a build/gate script that exits 0
  without running anything. Missing PROVE evidence is itself a finding
- **Undeclared dependencies**: a third-party dependency the plan does not declare,
  or infrastructure provisioned to make a test pass

## Input Contract

```
<risk_trigger>{why this review was spawned — e.g. "boundary violation: src/other/x.py", "new dependency: redis", "existing test modified", "coverage drop", "no PROVE evidence". Empty for a manual /review}</risk_trigger>
<prior_reviews>{contents of .sdd/reviews/ matching current scope — read before assigning severity}</prior_reviews>
<spec>{spec.md content}</spec>
<tests>{test sources}</tests>
<implementation>{diff or full files}</implementation>
```

- When `<risk_trigger>` is set, address it explicitly in the critique: confirmed, or
  explained away with evidence. A review that never mentions its trigger is incomplete.

- If a finding matches one resolved or downgraded in prior_reviews, still report it, tagged (prior: <decision>). Re-raise its severity only with new evidence, and leave inherited-resolved items out of the verdict.

## Output Contract (STRICT format)

Report every issue you find, including ones you are unsure of or rate LOW; coverage is the goal at this stage. Give each a confidence so /review-consolidate or the Builder can rank and filter.

```
## Critique

### [CRITICAL|HIGH|MEDIUM|LOW] <title>
**Location**: path:line
**Issue**: one sentence
**Evidence**: quoted code or spec clause
**Confidence**: high | medium | low
**Fix**: concrete action

## Verdict
REJECT | REQUEST_CHANGES | APPROVE_WITH_NOTES | APPROVE

## Hallucination Signal
forced: true|false
```

## Output Location

When spawned by `/sdd-impl` Step 4.5, write the full critique to
`.sdd/reviews/<feature>-<task-id>.md` and return only the verdict plus the top three
findings. Chat is for the verdict; the file is the record.

## Termination

Set `forced: true` when every remaining finding is one you had to stretch for — nothing you could defend with quoted evidence. That ends the review loop; set it honestly rather than inventing findings to keep the loop going.

## Dispute Resolution

1. Second pass in a FRESH context with Builder's rebuttal attached.
2. If still disagreement after pass 2: invoke a third model as referee.
3. Maximum 5 review cycles per task; additional cycles require Architect waiver.
--- plan-review rules ---
# Technical Plan Review Process

Used by `/sdd-validate-plan` for an interactive quality gate before task
generation. Quality assurance, not perfection seeking.

## Process

1. **Analysis**: Read spec, plan, and steering. Build a mental model of
   how the design satisfies each requirement.
2. **Critical issues**: Detail the top 3 concerns that would materially threaten success (correctness, feasibility, traceability, security/performance risk); list any further concerns as one line each with severity. Style nits are out of scope for this gate.
3. **Strengths**: Note genuine strengths where they inform the decision.
4. **Decision**: Give a clear **GO / NO-GO** with rationale.

## Issue format

For each critical issue:

```
### [SEVERITY] <short title>
- Where: <plan.md section / requirement ID>
- Problem: <one or two sentences>
- Impact: <why it threatens success>
- Suggested fix: <implementable action>
```

## Decision criteria

- **GO**: No CRITICAL issues; risks are acceptable and acknowledged.
- **NO-GO**: Any unresolved CRITICAL issue (missing requirement coverage,
  unfeasible approach, constitution MUST violation, undefined key boundary).

## Constraints

- Be interactive: engage the user, do not lecture.
- Every suggestion must be actionable.
- Report in the target language from `spec.json`.

**Considering output formats**

I need to ensure that conflict output matches the user's exact format without any extra details or hallucination. It’s important to follow the strict report requirements. I should prioritize checking the first source in the specified order, like using `test -f mise && nl`. However, if mise isn't part of the requested sources, maybe there's no need to run that tool. The instruction says to check it first, but it might not matter now. I'll focus on getting the specifications right!
exec
/bin/zsh -lc 'nl -ba specs/001-dev-environment-and-gates/spec.md' in /Users/Shared/codes/genai-lab-ts
 succeeded in 233ms:
     1	# 001-dev-environment-and-gates
     2	
     3	## Project Description
     4	
     5	spec 001（開発環境とゲート）
     6	
     7	段 1「開発環境とゲート」。`genai-lab.zip` の足場を取り込み、実地検証する（`pnpm install` と
     8	`mise run verify` を実際に通す）。mise / pnpm 12 / lefthook / gitleaks / osv-scanner によるゲート、
     9	Node 26 LTS 既定と Node 27 alpha 検証レーンの切り替え、CI（verify 必須 + verify-node27 参考 +
    10	security-daily）、Dependabot を整える。
    11	
    12	- 全体計画: [specs/000-development-plan/plan.md](../000-development-plan/plan.md) の §2〜§4、§5 段 1、
    13	  §7 M1、§8、§8.5
    14	- 原則: [.sdd/memory/constitution.md](../../.sdd/memory/constitution.md)（特に原則 3・8・9・10）
    15	- M1 完了条件（plan §7）: ZIP ガイドの未検証項目（plan §8）をすべて解消し、その時点の pin で
    16	  Node 26 LTS の `mise run verify` と CI が緑。Node 27 alpha の結果（失敗を含む）を
    17	  `docs/node27/` に記録する。
    18	- 段 1 の合格条件（plan §5）: `mise run verify` がネットワーク不要で通る。秘密値を含む commit が
    19	  フックで拒否される。
    20	
    21	## Clarifications
    22	
    23	### Session 2026-11-22
    24	
    25	- Q: spec 001 で、ZIP に入っている段 3〜5 用のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、
    26	  `extract-task.ts`、`model.ts` とその unit / E2E テスト）を `src/` と `tests/` に取り込むか？
    27	  → A: **B（基盤のみ取り込む）**。設定ファイル・CI・フックと、ゲート自体を検査する最小テスト、
    28	  プレースホルダーページ（`@smoke` 1 本）だけを入れる。ZIP のアプリコードは使い捨て環境で型照合し
    29	  （plan §8 の未検証項目）、結果を `research.md` に記録して各段へ引き継ぐ。plan §8.5 の
    30	  `src/app/**`, `src/lib/ai/**`, `tests/**` 行は本決定に合わせて改訂注記を入れる。
    31	- Q: `mise run verify` に、ネットワークが必要なセキュリティ検査（`pnpm audit` と `osv-scanner`）を
    32	  含めるか？ → A: **A（verify と security を分ける）**。`verify`（= `gate`）はオフラインで決定論的な
    33	  lint / format / typecheck / `check:model-ids` / gitleaks（全履歴）/ unit / E2E smoke。`security` は
    34	  ネットワークが必要な `pnpm audit --audit-level=high` / `osv-scanner`。pre-push と CI の必須ジョブは
    35	  両方を実行するので検査は減らない。constitution 原則 3（MINOR 改訂）と AGENTS.md のコマンド表を
    36	  合わせて直す。
    37	- Q: 段 1 の合格条件「秘密値を含む commit がフックで拒否される」を、どう確かめるか？
    38	  → A: **A（自動テスト、値は実行時生成）**。Vitest のテストが一時ディレクトリに git リポジトリを作り、
    39	  実行時に組み立てた偽のキーを stage して、`lefthook.yml` と同じ引数の gitleaks が非 0 で終わること、
    40	  秘密値なしなら 0 で終わることを確かめる。検出される形の値をソースに直書きせず、`.gitleaksignore`
    41	  や allowlist での除外も使わない。オフラインで verify に含まれる。
    42	- Q: Node 27 alpha 検証レーンで、spec 001 はどこまでを完了条件にするか？
    43	  → A: **A（設定 + CI + 記録。ブランチは必要時）**。`mise.node27.toml`、CI の `verify-node27`
    44	  （`continue-on-error`）、初回の `docs/node27/YYYY-MM-DD-<topic>.md` 記録（失敗でも可）、README の
    45	  worktree 手順までを完了条件とする。`exp/node27` は Node 27 専用の修正が実際に必要になったときに作る。
    46	  plan §7 M1 の記述を合わせて直す。
    47	
    48	### Session 2026-11-22（plan レビュー後の決定）
    49	
    50	- Q: 原則 3 の改訂の版は？ → A: **MINOR（1.0.0 → 1.1.0）**。検査は security タスクへ移るだけで減らない
    51	  ため後方非互換（MAJOR）ではないが、「唯一の検証入口」の中身を変える実質的な変更で、表現の修正
    52	  （PATCH）ではない。13.7 を合わせて直す。
    53	- Q: `CLAUDE.md` を本 spec の PR に含めるか？ → A: **含めない**。リポジトリに存在しないため、13.11 から外す。
    54	- Q: verify の gitleaks 全履歴スキャンの範囲は？ → A: **HEAD から到達できる履歴に限る**
    55	  （`--log-opts=HEAD`）。gitleaks の既定（`git log --all`）は別ブランチや stash も走査し、3.7 の決定論を
    56	  崩すため。
    57	
    58	### 前提（質問せずに置いた仮定）
    59	
    60	- constitution（`.sdd/memory/constitution.md`）、steering（`.sdd/steering/*`）、`AGENTS.md` は
    61	  plan §6 のガバナンス手順で作成済み（未コミット）。spec 001 ではこれらを新規に作らず、本 spec の
    62	  PR に含めてコミットし、上の決定に合わせた改訂（原則 3 の MINOR、AGENTS.md のコマンド表と
    63	  "Current state"）だけを行う。
    64	
    65	## Scope
    66	
    67	- In scope:
    68	  - ZIP の基盤ファイルの取り込みと §2.2 の修正（`mise.toml`、`mise.node27.toml`、`package.json`、
    69	    `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、
    70	    `next.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、
    71	    `.github/workflows/*`、`.github/dependabot.yml`）
    72	  - `src/lib/ai/model-allowlist.ts` と `scripts/check-model-ids.mjs`（`check:model-ids`）
    73	  - ゲート自体を検査する最小のユニットテスト（0 件で失敗、未モック通信で失敗、など）と、
    74	    プレースホルダーページ 1 枚 + `@smoke` E2E 1 本（pre-push と verify が空振りしないため）
    75	  - ZIP のアプリコード（段 3〜5 相当）の使い捨て環境での型照合と、`research.md` への記録
    76	    （plan §8 の未検証項目の解消）
    77	  - `mise run verify`（オフライン・決定論的）と `mise run security`（ネットワーク必要）の分離、
    78	    両方を pre-push と CI 必須ジョブで実行
    79	  - 秘密値を含む commit が gitleaks で拒否されることの自動テスト（偽キーは実行時生成）
    80	  - Node 27 レーン: `mise.node27.toml`、CI の `verify-node27`（参考・非ブロック）、初回記録
    81	  - 解説 `docs/stages/1-dev-environment-and-gates.md`、初回の `docs/node27/` 記録、README 更新
    82	    （mise 有効化の注意、Node 27 worktree 手順）
    83	  - 改訂: plan §7 M1・§8.5 の注記、constitution 原則 3（MINOR）、AGENTS.md のコマンド表と
    84	    "Current state"
    85	- Out of scope:
    86	  - ZIP のアプリコード（`src/app/api/chat/route.ts`、`src/app/page.tsx` の chat UI、
    87	    `src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`）とその unit / E2E テストの `src/` / `tests/`
    88	    への取り込み（各段 003〜006 の spec で TDD により実装する）
    89	  - shadcn/ui・Tailwind CSS の導入（spec 002 以降）
    90	  - `exp/node27` ブランチの作成と push（Node 27 専用の修正が必要になった時点で行う）
    91	  - Node 27 alpha で verify が緑になること（結果の記録だけを求める）
    92	
    93	## Glossary
    94	
    95	| Term | Definition |
    96	|------|------------|
    97	| ZIP 足場 | `genai-lab.zip` に含まれる設定ファイル・CI・フック・アプリコード一式。ガイドの記述は未検証（plan §8） |
    98	| 基盤ファイル | ZIP 足場のうち、Scope の In scope に列挙した設定・CI・フック・Dependabot のファイル |
    99	| verify タスク | `mise run verify`。オフラインで決定論的な単一の検証入口。`mise run gate` はその別名 |
   100	| security タスク | `mise run security`。ネットワークを必要とする依存の脆弱性検査（`pnpm audit`、osv-scanner） |
   101	| 既定レーン | `MISE_ENV` を設定しない状態。Node 26 LTS で動き、CI の必須ジョブになる |
   102	| Node 27 レーン | `MISE_ENV=node27` の状態。Node 27 alpha で動き、CI では参考ジョブ（非ブロック）になる |
   103	| 使い捨て環境 | リポジトリ外の一時ディレクトリなど、結果をコミットしない検証用の作業場所 |
   104	| 偽キー | 秘密値の検出テスト用に、テスト実行時に組み立てる本物ではない鍵文字列 |
   105	| モデル ID | LLM プロバイダのモデルを指す識別子文字列。唯一の定義は `src/lib/ai/model-allowlist.ts` |
   106	| 非空虚 | 対象の検査やロジックを壊すと、そのテストが失敗することを確認済みであること |
   107	| research.md | `specs/001-dev-environment-and-gates/research.md`。公式ドキュメントと実測による根拠の記録 |
   108	
   109	## Requirements
   110	
   111	<!--
   112	Generated by /sdd-spec in EARS format. Each requirement heading carries a
   113	leading NUMERIC id only (e.g. "Requirement 1"). Acceptance criteria are
   114	numbered hierarchically (1.1, 1.2). Keywords WHEN / WHILE / IF / THEN /
   115	WHERE / THE / SHALL are kept in English; the rest is Japanese.
   116	-->
   117	
   118	### Requirement 1: 依存とツールの版固定
   119	
   120	ラボの保守者として、公開直後の不正版を自動で取り込まず、いつどの版を採用したかを設定と lockfile で
   121	追えるようにしたい（plan §2.1・§2.2、D3、憲章 原則 8・9）。
   122	
   123	**Acceptance Criteria**
   124	
   125	1.1 THE `mise.toml` と `mise.node27.toml` SHALL ランタイムとツール（Node、pnpm、lefthook、gitleaks、
   126	osv-scanner）の版を exact な版番号で指定し、`latest` などのタグや範囲指定を含まない。
   127	
   128	1.2 THE `package.json` SHALL `dependencies` と `devDependencies` のすべての版を exact な版番号で指定し、
   129	`latest`・`canary`・`beta` などの dist-tag や範囲指定（`^`、`~`、`*`、`>=` など）を含まない。
   130	
   131	1.3 THE リポジトリ SHALL 採用する各版を、採用時点で公開から 24 時間以上経過したものに限り、その版の
   132	公開日時と確認日を research.md に記録する。
   133	
   134	1.4 THE `pnpm-workspace.yaml` SHALL `minimumReleaseAge: 1440` を指定し、`minimumReleaseAgeExclude` を
   135	含まない。
   136	
   137	1.5 THE `pnpm-workspace.yaml` SHALL 依存の install スクリプトを既定で実行しない設定とし、`allowBuilds`
   138	で許可するパッケージごとに許可理由を記す。`sharp` の install スクリプトは許可しない。
   139	
   140	1.6 THE `package.json` SHALL `packageManager` に `mise.toml` が指定する pnpm と同じ版を指定する。
   141	
   142	1.7 THE `package.json` SHALL `engines.node` に Node 26 LTS 系列を下限とする範囲を指定する。
   143	
   144	1.8 WHEN 開発者がクリーンな checkout で README の手順どおりに依存を lockfile 固定（`--frozen-lockfile`）で
   145	install したとき、THE リポジトリ SHALL 終了コード 0 で install を完了する。
   146	
   147	1.9 IF install 時に peerDependency の警告が出た場合、THEN THE リポジトリ SHALL その警告文と扱い
   148	（`overrides` で解消した、または受容した理由）を research.md に記録する。
   149	
   150	### Requirement 2: lint・format・型検査の設定
   151	
   152	ラボの保守者として、規約を 1 か所に集約し、型の抜け道を設定で塞ぎたい（憲章 原則 7、Additional
   153	Constraints の lint / format）。
   154	
   155	**Acceptance Criteria**
   156	
   157	2.1 THE リポジトリ SHALL lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定
   158	ファイルを含まない。
   159	
   160	2.2 THE `biome.json` SHALL `noUnusedVariables`、`noUnusedImports`、`noExplicitAny` を `error` とする。
   161	
   162	2.3 THE `tsconfig.json` SHALL `strict` を有効にする。
   163	
   164	2.4 IF 検査対象のソースに明示的な `any`、未使用の変数、未使用の import のいずれかが含まれる場合、THEN THE
   165	verify タスク SHALL 非 0 で終了する。
   166	
   167	2.5 IF 検査対象のソースに型エラーが含まれる場合、THEN THE verify タスク SHALL 非 0 で終了する。
   168	
   169	### Requirement 3: verify ゲート
   170	
   171	ラボの保守者と学習者として、API キーもネットワークもない環境で、同じコミットなら常に同じ合否を返し、
   172	空振りしない検証入口が 1 つだけほしい（段 1 の合格条件、憲章 原則 3）。
   173	
   174	**Acceptance Criteria**
   175	
   176	3.1 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL lint、format チェック、
   177	型検査、`check:model-ids`、gitleaks による git 全履歴（HEAD から到達できるコミット）のシークレットスキャン、unit テスト、E2E `@smoke`
   178	テストを実行し、すべてが成功した場合に限り終了コード 0 を返す。
   179	
   180	3.2 IF 3.1 の構成要素のいずれかが失敗した場合、THEN THE verify タスク SHALL 非 0 で終了する。
   181	
   182	3.3 WHEN 開発者が `mise run gate` を実行したとき、THE gate タスク SHALL verify タスクと同じ検査を実行し、
   183	同じ終了コードを返す。
   184	
   185	3.4 THE `mise.toml` SHALL verify の構成要素を個別に実行するタスク（lint / format の `check`、unit の
   186	`test`、E2E の `e2e`、`check:model-ids`）を持つ。
   187	
   188	3.5 WHILE ネットワークに接続できず、AI プロバイダの API キーを表す環境変数が 1 つも設定されていない状態で、
   189	THE verify タスク SHALL 依存とテスト用ブラウザが install 済みであれば 3.1 の検査を完了し、ネットワーク
   190	接続時と同じ合否を返す。
   191	
   192	3.6 THE verify タスク SHALL ネットワークを必要とする検査（`pnpm audit`、osv-scanner）を含まない。
   193	
   194	3.7 WHEN 同一コミット・同一環境で verify タスクを 3 回連続で実行したとき、THE verify タスク SHALL 3 回
   195	とも同じ合否を返す。
   196	
   197	3.8 IF unit テストの実行件数が 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   198	
   199	3.9 IF `@smoke` に一致する E2E テストが 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   200	
   201	3.10 IF unit テストがモックされていないネットワークアクセスを行った場合、THEN THE unit テストの実行環境
   202	SHALL そのテストを失敗させる。
   203	
   204	3.11 IF E2E テストが、テスト対象アプリのオリジン以外へのリクエストのうちモックが定義されていないものを
   205	発した場合、THEN THE E2E テストの実行環境 SHALL そのテストを失敗させる。
   206	
   207	3.12 IF gitleaks の全履歴スキャンが秘密値を検出した場合、THEN THE verify タスク SHALL 非 0 で終了し、
   208	検出した値そのものを出力しない。
   209	
   210	### Requirement 4: security タスク
   211	
   212	ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
   213	ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。
   214	
   215	**Acceptance Criteria**
   216	
   217	4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
   218	--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
   219	終了コード 0 を返す。
   220	
   221	4.2 IF `pnpm audit` が high 以上の advisory を検出した場合、THEN THE security タスク SHALL 非 0 で終了する。
   222	
   223	4.3 IF osv-scanner が lockfile の依存に既知の脆弱性を検出した場合、THEN THE security タスク SHALL 非 0 で
   224	終了する。
   225	
   226	4.4 IF advisory の取得先に到達できない場合、THEN THE security タスク SHALL 成功として扱わず、非 0 で
   227	終了する。
   228	
   229	4.5 WHERE 脆弱性の除外を記録する場合、THE リポジトリ SHALL 除外ごとに対象の advisory ID、理由、退役条件を
   230	記す。
   231	
   232	### Requirement 5: 記録用・更新確認用の補助タスク
   233	
   234	ラボの保守者として、検証記録に残す実行環境の版と、週次で上げる更新候補を、合否とは切り離して
   235	確かめたい（plan §2.1、§8.5）。
   236	
   237	**Acceptance Criteria**
   238	
   239	5.1 WHEN 開発者が `mise run runtime` を実行したとき、THE runtime タスク SHALL Node、pnpm、TypeScript、
   240	Next.js、lefthook、gitleaks、osv-scanner の実際の版を出力し、終了コード 0 を返す。
   241	
   242	5.2 THE runtime タスク SHALL 出力した版を特定の期待値と照合しない。
   243	
   244	5.3 WHEN 開発者が `mise run outdated` を実行したとき、THE outdated タスク SHALL `package.json` の依存の
   245	更新候補を一覧で出力する。
   246	
   247	5.4 THE outdated タスク SHALL `package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない。
   248	
   249	### Requirement 6: モデル ID の allowlist と直書き検査
   250	
   251	ラボの保守者として、モデル ID の散在と存在しないモデルの指定を防ぐため、モデル ID を 1 か所にだけ
   252	書かせ、それ以外の直書きを機械的に検出したい（憲章 原則 5、plan §2.2）。
   253	
   254	**Acceptance Criteria**
   255	
   256	6.1 THE リポジトリ SHALL モデル ID を `src/lib/ai/model-allowlist.ts` にだけ定義する。
   257	
   258	6.2 THE `src/lib/ai/model-allowlist.ts` SHALL 登録する各モデル ID について、プロバイダの公式ドキュメントで
   259	存在を確認した根拠を research.md に記録する。
   260	
   261	6.3 WHEN `mise run check:model-ids` を実行し、allowlist ファイルとテスト fixture 以外の走査対象ファイルに
   262	モデル ID の文字列が含まれていたとき、THE `check:model-ids` SHALL 非 0 で終了し、該当するファイルパスと
   263	行番号を出力する。
   264	
   265	6.4 THE `check:model-ids` SHALL allowlist に登録された ID に加えて、allowlist に未登録でもプロバイダの
   266	モデル ID の命名形式に一致する文字列を検出する。
   267	
   268	6.5 THE `check:model-ids` SHALL ソースコード、スクリプト、テスト、ルートの設定ファイル、`docs/`、
   269	`README.md` を走査対象とする。
   270	
   271	6.6 WHERE ファイルがテスト fixture の置き場として指定されている場合、THE `check:model-ids` SHALL その
   272	ファイルを検出対象から除く。
   273	
   274	6.7 WHEN 走査対象にモデル ID の直書きがないとき、THE `check:model-ids` SHALL 終了コード 0 を返す。
   275	
   276	### Requirement 7: Git フック
   277	
   278	ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
   279	D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。
   280	
   281	**Acceptance Criteria**
   282	
   283	7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
   284	pre-push の 3 つのフックを git に登録する。
   285	
   286	7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
   287	gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
   288	実行する。
   289	
   290	7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
   291	拒否する。
   292	
   293	7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
   294	commit を拒否する。
   295	
   296	7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
   297	--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。
   298	
   299	7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
   300	実行せずに push を拒否する。
   301	
   302	7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
   303	フック SHALL 検査を省略して成功とせず、非 0 で終了する。
   304	
   305	7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
   306	判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。
   307	
   308	### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）
   309	
   310	学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
   311	自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。
   312	
   313	**Acceptance Criteria**
   314	
   315	8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
   316	`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
   317	が非 0 で終了することを確かめる。
   318	
   319	8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
   320	テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。
   321	
   322	8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
   323	変わったときは変更後の引数で検査する。
   324	
   325	8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
   326	リテラルで含めない。
   327	
   328	8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
   329	コメントを使わない。
   330	
   331	8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
   332	ことを確かめる。
   333	
   334	8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。
   335	
   336	8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。
   337	
   338	### Requirement 9: 最小アプリとゲートの自己検査
   339	
   340	ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
   341	壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。
   342	
   343	**Acceptance Criteria**
   344	
   345	9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
   346	参照を行わない。
   347	
   348	9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。
   349	
   350	9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
   351	プレースホルダーページの見出しが表示されることを確かめる。
   352	
   353	9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
   354	直書きのない入力に対して 0 で終了することを確かめる。
   355	
   356	9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
   357	ことを確かめる。
   358	
   359	9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
   360	非 0 になることを、自動テストまたは実行記録で示す。
   361	
   362	9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
   363	そのテストが失敗すること（非空虚）を確認した記録を残す。
   364	
   365	9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。
   366	
   367	9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。
   368	
   369	### Requirement 10: CI と Dependabot
   370	
   371	ラボの保守者として、フックを回避した変更も同じ検査で止め、依存とツールの更新候補を自動で受け取りたい
   372	（plan §3.2、憲章 原則 3・8）。
   373	
   374	**Acceptance Criteria**
   375	
   376	10.1 WHEN `main` または `exp/**` への push、あるいは pull request が発生したとき、THE CI SHALL 既定レーンの
   377	verify ジョブで verify タスクと security タスクを実行する。
   378	
   379	10.2 IF 既定レーンの verify ジョブが失敗した場合、THEN THE CI SHALL その pull request の `main` への
   380	マージをブロックする。
   381	
   382	10.3 WHEN 10.1 と同じイベント、または週 1 回の定期実行が発生したとき、THE CI SHALL Node 27 レーンの
   383	verify-node27 ジョブで verify タスクを実行する。
   384	
   385	10.4 IF verify-node27 ジョブが失敗した場合、THEN THE CI SHALL ワークフロー全体を失敗とせず、マージを
   386	ブロックしない。
   387	
   388	10.5 WHEN 毎日の定期実行の時刻になったとき、THE security-daily ワークフロー SHALL 既定ブランチで security
   389	タスクを実行し、失敗した場合はワークフローを失敗として通知する。
   390	
   391	10.6 THE CI SHALL git 全履歴のシークレットスキャンを行うジョブで、全履歴を取得してから検査する。
   392	
   393	10.7 THE CI SHALL 依存を lockfile 固定（`--frozen-lockfile`）で install する。
   394	
   395	10.8 THE ワークフロー定義 SHALL すべての `uses:` をコミット SHA で固定する。
   396	
   397	10.9 THE ワークフロー定義 SHALL 各ジョブの `permissions:` を、そのジョブが必要とする最小の権限だけに
   398	限る。
   399	
   400	10.10 THE ワークフロー定義 SHALL AI プロバイダの API キーを表す secret を参照しない。
   401	
   402	10.11 THE `.github/dependabot.yml` SHALL GitHub Actions と npm の依存について、週 1 回の更新提案を設定する。
   403	
   404	10.12 THE `.github/dependabot.yml` SHALL 公開から 24 時間未満の版を更新提案しない設定を持つ。
   405	
   406	### Requirement 11: Node 27 alpha 検証レーン
   407	
   408	ラボの保守者として、既定レーンを壊さずに Node 27 alpha での動作を継続的に確かめ、結果（失敗を含む）を
   409	残したい（Clarifications 4 問目、plan §3、憲章 Additional Constraints の Node のレーン）。
   410	
   411	**Acceptance Criteria**
   412	
   413	11.1 THE `mise.node27.toml` SHALL Node の版だけを上書きし、それ以外のツールの版は `mise.toml` の指定を
   414	引き継ぐ。
   415	
   416	11.2 WHEN 開発者が `MISE_ENV=node27 mise install` を実行したとき、THE Node 27 レーン SHALL Node 27 alpha
   417	を install する。
   418	
   419	11.3 IF `MISE_ENV=node27 mise install` が Node 27 alpha を解決できなかった場合、THEN THE リポジトリ SHALL
   420	失敗の出力と、解決に必要だった設定（prerelease の扱いなど）または未解決である旨を research.md に記録する。
   421	
   422	11.4 WHEN 開発者が `MISE_ENV=node27 mise run verify` を実行したとき、THE Node 27 レーン SHALL 既定レーンと
   423	同じ検査を Node 27 alpha で実行する。
   424	
   425	11.5 THE リポジトリ SHALL `docs/node27/YYYY-MM-DD-<topic>.md` に初回の検証記録を 1 件以上持ち、その記録は
   426	「結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順」の見出しを持つ。
   427	
   428	11.6 IF Node 27 レーンの verify が失敗した場合、THEN THE 検証記録 SHALL 失敗した検査と出力の要点を
   429	「未解決事項」に記す。
   430	
   431	11.7 THE README SHALL Node 27 レーン用の git worktree を作り、`node_modules` を既定レーンと共有せずに
   432	検証する手順を記す。
   433	
   434	### Requirement 12: ZIP 未検証項目の解消と記録
   435	
   436	ラボの保守者として、ZIP ガイドの未検証の記述を実測で確定し、段 3〜6 が根拠のある前提から始められる
   437	ようにしたい（plan §7 M1・§8、Clarifications 1 問目、憲章 原則 9）。
   438	
   439	**Acceptance Criteria**
   440	
   441	12.1 THE research.md SHALL plan §8 の未検証 5 項目それぞれについて、確認方法、実行したコマンド、結果、
   442	根拠（公式ドキュメントの参照先と実行出力）、確認日を記録する。
   443	
   444	12.2 WHEN ZIP のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、`extract-task.ts`、`model.ts`）と
   445	その unit / E2E テストを使い捨て環境で型検査したとき、THE research.md SHALL ファイルごとの型エラーと、
   446	AI SDK 7 の実際の型との差異を、引き継ぎ先の段（003〜006）とともに記録する。
   447	
   448	12.3 THE research.md SHALL ZIP が使う AI SDK 7 の API 名（`toolApproval`、`isStepCount`、
   449	`toUIMessageStream` など）が、install した版の型定義に存在するかどうかを API ごとに記録する。
   450	
   451	12.4 WHEN ZIP の E2E smoke テストを使い捨て環境で実行したとき、THE research.md SHALL SSE モックが
   452	`useChat` のパーサーで解釈されたかどうかと、その実行出力を記録する。
   453	
   454	12.5 WHEN 実装時点で TypeScript 7.1 の RC または stable が公開から 24 時間以上経過しているとき、THE
   455	リポジトリ SHALL beta からその版へ切り替え、切り替えたことを research.md に記録する。
   456	
   457	12.6 IF 実装時点で TypeScript 7.1 の RC と stable がどちらも公開されていないか、公開から 24 時間未満の場合、
   458	THEN THE research.md SHALL 確認日とその時点の公開状況を記録し、beta を据え置く。
   459	
   460	12.7 THE リポジトリ SHALL ZIP のアプリコードとそのテストを `src/` と `tests/` に含めない。
   461	
   462	### Requirement 13: 解説・README・統治文書の更新
   463	
   464	学習者として段 1 を「読む → 動かす → 改造する → テストで合格を確かめる」で進めたい。ラボの保守者として、
   465	本 spec の決定と統治文書・計画の記述を一致させたい（憲章 原則 2、Governance）。
   466	
   467	**Acceptance Criteria**
   468	
   469	13.1 THE 解説 `docs/stages/1-dev-environment-and-gates.md` SHALL 「読む → 動かす → 改造する → テストで
   470	合格を確かめる」の順の節を持つ。
   471	
   472	13.2 THE 解説 SHALL 段 1 の合格条件（verify がネットワーク不要で通る、秘密値を含む commit がフックで
   473	拒否される）ごとに、合格を判定するテストのパスを示し、そのパスはリポジトリに実在する。
   474	
   475	13.3 THE README SHALL mise の有効化、ツールと依存とテスト用ブラウザの install、フックの登録までの
   476	セットアップ手順を記す。
   477	
   478	13.4 THE README SHALL mise を有効にしていない Git クライアントではフックが失敗することを明記する。
   479	
   480	13.5 THE `.env.example` SHALL 変数名だけを持ち、値を持たない。
   481	
   482	13.6 THE `.gitignore` SHALL `.env`、`.env*.local`、`.next`、テスト成果物（レポートとトレース）を
   483	git の追跡対象から除く。
   484	
   485	13.7 THE 憲章 SHALL 原則 3 を「verify はオフラインで決定論的な検査、ネットワークが必要な検査は security
   486	タスクに分け、pre-push と CI 必須ジョブが両方を実行する」内容に MINOR 改訂（1.0.0 → 1.1.0）し、版、Sync Impact Report、
   487	改訂履歴を更新する。
   488	
   489	13.8 THE `AGENTS.md` SHALL コマンド表を実在する `mise.toml` のタスクと一致させ、"Current state" を段 1
   490	完了後の状態に更新する。
   491	
   492	13.9 THE steering（`tech.md` の Gate command、`structure.md` の状態注記）SHALL verify と security の分離と、
   493	取り込んだ実際の構成に合わせて更新される。
   494	
   495	13.10 THE plan（`specs/000-development-plan/plan.md`）SHALL §7 M1（`exp/node27` は必要時に作る）と §8.5
   496	（`src/app/**`、`src/lib/ai/**`、`tests/**` は基盤のみ取り込む）に、本 spec の Clarifications を参照する
   497	改訂注記を持つ。
   498	
   499	13.11 THE 本 spec の PR SHALL 未コミットの憲章、steering、`AGENTS.md` を含める。
   500	
   501	13.12 THE 文書 SHALL 記載する版番号を確認日つきの参考値として示し、合否の条件にしない。
   502	
   503	## Non-Functional Requirements
   504	
   505	- **オフライン・決定論**: verify タスクは API キーとネットワークを必要とせず、同一コミットで同じ合否を
   506	  返す（3.5、3.7）。ネットワークを使う検査は security タスクと CI の install 工程に限る。
   507	- **実行時間（記録）**: 初回実装時に、pre-commit フック全体、pre-push フック全体、E2E `@smoke`、verify
   508	  タスク全体の実行時間を、既定レーンの開発機と CI のそれぞれで測り research.md に記録する。pre-push の
   509	  E2E smoke は 60 秒以内を目安とするが、TODO(E2E_BUDGET) が spec 003 で確定するまでは合否に使わない。
   510	- **セキュリティ**: シークレットスキャンの出力は検出値を含まない（3.12、8.6）。CI は AI プロバイダの
   511	  secret を参照せず、ジョブの権限を最小にする（10.9、10.10）。
   512	- **実行環境**: 既定レーンは macOS（zsh、mise 有効）の開発機と GitHub Actions の Linux ランナーの両方で
   513	  verify が緑になる。
   514	- **言語**: spec、解説、steering、憲章の散文は日本語。コード、識別子、コメント、パス、コミット
   515	  メッセージ、`AGENTS.md` は英語。
   516	
   517	## Out of Scope / Future Work
   518	
   519	- ZIP のアプリコード（chat route・chat UI・エージェント・構造化出力・プロバイダ選択）の実装は段 003〜006
   520	  の spec で TDD により行う。12.2〜12.4 の記録をその入力にする。
   521	- shadcn/ui と Tailwind CSS v4 の導入（spec 002 以降）。
   522	- `exp/node27` ブランチの作成と push（Node 27 専用の修正が実際に必要になった時点）。
   523	- Node 27 alpha で verify が緑になること（本 spec は結果の記録までを求める）。
   524	- 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)、spec 002 の実測で決定）。
   525	- pre-push E2E smoke の時間上限の確定（TODO(E2E_BUDGET)、spec 003 の実測で決定）。
   526	
   527	---
   528	
   529	_Initialized: 2026-11-22T12:05:52Z_ | _Requirements generated: 2026-11-22_

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '1,180p'
printf '%s\\n' '--- 181-360 ---'
nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '181,360p'
printf '%s\\n' '--- 361-529 ---'
nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '361,529p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 163ms:
     1	# 001-dev-environment-and-gates
     2	
     3	## Project Description
     4	
     5	spec 001（開発環境とゲート）
     6	
     7	段 1「開発環境とゲート」。`genai-lab.zip` の足場を取り込み、実地検証する（`pnpm install` と
     8	`mise run verify` を実際に通す）。mise / pnpm 12 / lefthook / gitleaks / osv-scanner によるゲート、
     9	Node 26 LTS 既定と Node 27 alpha 検証レーンの切り替え、CI（verify 必須 + verify-node27 参考 +
    10	security-daily）、Dependabot を整える。
    11	
    12	- 全体計画: [specs/000-development-plan/plan.md](../000-development-plan/plan.md) の §2〜§4、§5 段 1、
    13	  §7 M1、§8、§8.5
    14	- 原則: [.sdd/memory/constitution.md](../../.sdd/memory/constitution.md)（特に原則 3・8・9・10）
    15	- M1 完了条件（plan §7）: ZIP ガイドの未検証項目（plan §8）をすべて解消し、その時点の pin で
    16	  Node 26 LTS の `mise run verify` と CI が緑。Node 27 alpha の結果（失敗を含む）を
    17	  `docs/node27/` に記録する。
    18	- 段 1 の合格条件（plan §5）: `mise run verify` がネットワーク不要で通る。秘密値を含む commit が
    19	  フックで拒否される。
    20	
    21	## Clarifications
    22	
    23	### Session 2026-11-22
    24	
    25	- Q: spec 001 で、ZIP に入っている段 3〜5 用のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、
    26	  `extract-task.ts`、`model.ts` とその unit / E2E テスト）を `src/` と `tests/` に取り込むか？
    27	  → A: **B（基盤のみ取り込む）**。設定ファイル・CI・フックと、ゲート自体を検査する最小テスト、
    28	  プレースホルダーページ（`@smoke` 1 本）だけを入れる。ZIP のアプリコードは使い捨て環境で型照合し
    29	  （plan §8 の未検証項目）、結果を `research.md` に記録して各段へ引き継ぐ。plan §8.5 の
    30	  `src/app/**`, `src/lib/ai/**`, `tests/**` 行は本決定に合わせて改訂注記を入れる。
    31	- Q: `mise run verify` に、ネットワークが必要なセキュリティ検査（`pnpm audit` と `osv-scanner`）を
    32	  含めるか？ → A: **A（verify と security を分ける）**。`verify`（= `gate`）はオフラインで決定論的な
    33	  lint / format / typecheck / `check:model-ids` / gitleaks（全履歴）/ unit / E2E smoke。`security` は
    34	  ネットワークが必要な `pnpm audit --audit-level=high` / `osv-scanner`。pre-push と CI の必須ジョブは
    35	  両方を実行するので検査は減らない。constitution 原則 3（MINOR 改訂）と AGENTS.md のコマンド表を
    36	  合わせて直す。
    37	- Q: 段 1 の合格条件「秘密値を含む commit がフックで拒否される」を、どう確かめるか？
    38	  → A: **A（自動テスト、値は実行時生成）**。Vitest のテストが一時ディレクトリに git リポジトリを作り、
    39	  実行時に組み立てた偽のキーを stage して、`lefthook.yml` と同じ引数の gitleaks が非 0 で終わること、
    40	  秘密値なしなら 0 で終わることを確かめる。検出される形の値をソースに直書きせず、`.gitleaksignore`
    41	  や allowlist での除外も使わない。オフラインで verify に含まれる。
    42	- Q: Node 27 alpha 検証レーンで、spec 001 はどこまでを完了条件にするか？
    43	  → A: **A（設定 + CI + 記録。ブランチは必要時）**。`mise.node27.toml`、CI の `verify-node27`
    44	  （`continue-on-error`）、初回の `docs/node27/YYYY-MM-DD-<topic>.md` 記録（失敗でも可）、README の
    45	  worktree 手順までを完了条件とする。`exp/node27` は Node 27 専用の修正が実際に必要になったときに作る。
    46	  plan §7 M1 の記述を合わせて直す。
    47	
    48	### Session 2026-11-22（plan レビュー後の決定）
    49	
    50	- Q: 原則 3 の改訂の版は？ → A: **MINOR（1.0.0 → 1.1.0）**。検査は security タスクへ移るだけで減らない
    51	  ため後方非互換（MAJOR）ではないが、「唯一の検証入口」の中身を変える実質的な変更で、表現の修正
    52	  （PATCH）ではない。13.7 を合わせて直す。
    53	- Q: `CLAUDE.md` を本 spec の PR に含めるか？ → A: **含めない**。リポジトリに存在しないため、13.11 から外す。
    54	- Q: verify の gitleaks 全履歴スキャンの範囲は？ → A: **HEAD から到達できる履歴に限る**
    55	  （`--log-opts=HEAD`）。gitleaks の既定（`git log --all`）は別ブランチや stash も走査し、3.7 の決定論を
    56	  崩すため。
    57	
    58	### 前提（質問せずに置いた仮定）
    59	
    60	- constitution（`.sdd/memory/constitution.md`）、steering（`.sdd/steering/*`）、`AGENTS.md` は
    61	  plan §6 のガバナンス手順で作成済み（未コミット）。spec 001 ではこれらを新規に作らず、本 spec の
    62	  PR に含めてコミットし、上の決定に合わせた改訂（原則 3 の MINOR、AGENTS.md のコマンド表と
    63	  "Current state"）だけを行う。
    64	
    65	## Scope
    66	
    67	- In scope:
    68	  - ZIP の基盤ファイルの取り込みと §2.2 の修正（`mise.toml`、`mise.node27.toml`、`package.json`、
    69	    `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、
    70	    `next.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、
    71	    `.github/workflows/*`、`.github/dependabot.yml`）
    72	  - `src/lib/ai/model-allowlist.ts` と `scripts/check-model-ids.mjs`（`check:model-ids`）
    73	  - ゲート自体を検査する最小のユニットテスト（0 件で失敗、未モック通信で失敗、など）と、
    74	    プレースホルダーページ 1 枚 + `@smoke` E2E 1 本（pre-push と verify が空振りしないため）
    75	  - ZIP のアプリコード（段 3〜5 相当）の使い捨て環境での型照合と、`research.md` への記録
    76	    （plan §8 の未検証項目の解消）
    77	  - `mise run verify`（オフライン・決定論的）と `mise run security`（ネットワーク必要）の分離、
    78	    両方を pre-push と CI 必須ジョブで実行
    79	  - 秘密値を含む commit が gitleaks で拒否されることの自動テスト（偽キーは実行時生成）
    80	  - Node 27 レーン: `mise.node27.toml`、CI の `verify-node27`（参考・非ブロック）、初回記録
    81	  - 解説 `docs/stages/1-dev-environment-and-gates.md`、初回の `docs/node27/` 記録、README 更新
    82	    （mise 有効化の注意、Node 27 worktree 手順）
    83	  - 改訂: plan §7 M1・§8.5 の注記、constitution 原則 3（MINOR）、AGENTS.md のコマンド表と
    84	    "Current state"
    85	- Out of scope:
    86	  - ZIP のアプリコード（`src/app/api/chat/route.ts`、`src/app/page.tsx` の chat UI、
    87	    `src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`）とその unit / E2E テストの `src/` / `tests/`
    88	    への取り込み（各段 003〜006 の spec で TDD により実装する）
    89	  - shadcn/ui・Tailwind CSS の導入（spec 002 以降）
    90	  - `exp/node27` ブランチの作成と push（Node 27 専用の修正が必要になった時点で行う）
    91	  - Node 27 alpha で verify が緑になること（結果の記録だけを求める）
    92	
    93	## Glossary
    94	
    95	| Term | Definition |
    96	|------|------------|
    97	| ZIP 足場 | `genai-lab.zip` に含まれる設定ファイル・CI・フック・アプリコード一式。ガイドの記述は未検証（plan §8） |
    98	| 基盤ファイル | ZIP 足場のうち、Scope の In scope に列挙した設定・CI・フック・Dependabot のファイル |
    99	| verify タスク | `mise run verify`。オフラインで決定論的な単一の検証入口。`mise run gate` はその別名 |
   100	| security タスク | `mise run security`。ネットワークを必要とする依存の脆弱性検査（`pnpm audit`、osv-scanner） |
   101	| 既定レーン | `MISE_ENV` を設定しない状態。Node 26 LTS で動き、CI の必須ジョブになる |
   102	| Node 27 レーン | `MISE_ENV=node27` の状態。Node 27 alpha で動き、CI では参考ジョブ（非ブロック）になる |
   103	| 使い捨て環境 | リポジトリ外の一時ディレクトリなど、結果をコミットしない検証用の作業場所 |
   104	| 偽キー | 秘密値の検出テスト用に、テスト実行時に組み立てる本物ではない鍵文字列 |
   105	| モデル ID | LLM プロバイダのモデルを指す識別子文字列。唯一の定義は `src/lib/ai/model-allowlist.ts` |
   106	| 非空虚 | 対象の検査やロジックを壊すと、そのテストが失敗することを確認済みであること |
   107	| research.md | `specs/001-dev-environment-and-gates/research.md`。公式ドキュメントと実測による根拠の記録 |
   108	
   109	## Requirements
   110	
   111	<!--
   112	Generated by /sdd-spec in EARS format. Each requirement heading carries a
   113	leading NUMERIC id only (e.g. "Requirement 1"). Acceptance criteria are
   114	numbered hierarchically (1.1, 1.2). Keywords WHEN / WHILE / IF / THEN /
   115	WHERE / THE / SHALL are kept in English; the rest is Japanese.
   116	-->
   117	
   118	### Requirement 1: 依存とツールの版固定
   119	
   120	ラボの保守者として、公開直後の不正版を自動で取り込まず、いつどの版を採用したかを設定と lockfile で
   121	追えるようにしたい（plan §2.1・§2.2、D3、憲章 原則 8・9）。
   122	
   123	**Acceptance Criteria**
   124	
   125	1.1 THE `mise.toml` と `mise.node27.toml` SHALL ランタイムとツール（Node、pnpm、lefthook、gitleaks、
   126	osv-scanner）の版を exact な版番号で指定し、`latest` などのタグや範囲指定を含まない。
   127	
   128	1.2 THE `package.json` SHALL `dependencies` と `devDependencies` のすべての版を exact な版番号で指定し、
   129	`latest`・`canary`・`beta` などの dist-tag や範囲指定（`^`、`~`、`*`、`>=` など）を含まない。
   130	
   131	1.3 THE リポジトリ SHALL 採用する各版を、採用時点で公開から 24 時間以上経過したものに限り、その版の
   132	公開日時と確認日を research.md に記録する。
   133	
   134	1.4 THE `pnpm-workspace.yaml` SHALL `minimumReleaseAge: 1440` を指定し、`minimumReleaseAgeExclude` を
   135	含まない。
   136	
   137	1.5 THE `pnpm-workspace.yaml` SHALL 依存の install スクリプトを既定で実行しない設定とし、`allowBuilds`
   138	で許可するパッケージごとに許可理由を記す。`sharp` の install スクリプトは許可しない。
   139	
   140	1.6 THE `package.json` SHALL `packageManager` に `mise.toml` が指定する pnpm と同じ版を指定する。
   141	
   142	1.7 THE `package.json` SHALL `engines.node` に Node 26 LTS 系列を下限とする範囲を指定する。
   143	
   144	1.8 WHEN 開発者がクリーンな checkout で README の手順どおりに依存を lockfile 固定（`--frozen-lockfile`）で
   145	install したとき、THE リポジトリ SHALL 終了コード 0 で install を完了する。
   146	
   147	1.9 IF install 時に peerDependency の警告が出た場合、THEN THE リポジトリ SHALL その警告文と扱い
   148	（`overrides` で解消した、または受容した理由）を research.md に記録する。
   149	
   150	### Requirement 2: lint・format・型検査の設定
   151	
   152	ラボの保守者として、規約を 1 か所に集約し、型の抜け道を設定で塞ぎたい（憲章 原則 7、Additional
   153	Constraints の lint / format）。
   154	
   155	**Acceptance Criteria**
   156	
   157	2.1 THE リポジトリ SHALL lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定
   158	ファイルを含まない。
   159	
   160	2.2 THE `biome.json` SHALL `noUnusedVariables`、`noUnusedImports`、`noExplicitAny` を `error` とする。
   161	
   162	2.3 THE `tsconfig.json` SHALL `strict` を有効にする。
   163	
   164	2.4 IF 検査対象のソースに明示的な `any`、未使用の変数、未使用の import のいずれかが含まれる場合、THEN THE
   165	verify タスク SHALL 非 0 で終了する。
   166	
   167	2.5 IF 検査対象のソースに型エラーが含まれる場合、THEN THE verify タスク SHALL 非 0 で終了する。
   168	
   169	### Requirement 3: verify ゲート
   170	
   171	ラボの保守者と学習者として、API キーもネットワークもない環境で、同じコミットなら常に同じ合否を返し、
   172	空振りしない検証入口が 1 つだけほしい（段 1 の合格条件、憲章 原則 3）。
   173	
   174	**Acceptance Criteria**
   175	
   176	3.1 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL lint、format チェック、
   177	型検査、`check:model-ids`、gitleaks による git 全履歴（HEAD から到達できるコミット）のシークレットスキャン、unit テスト、E2E `@smoke`
   178	テストを実行し、すべてが成功した場合に限り終了コード 0 を返す。
   179	
   180	3.2 IF 3.1 の構成要素のいずれかが失敗した場合、THEN THE verify タスク SHALL 非 0 で終了する。
--- 181-360 ---
   181	
   182	3.3 WHEN 開発者が `mise run gate` を実行したとき、THE gate タスク SHALL verify タスクと同じ検査を実行し、
   183	同じ終了コードを返す。
   184	
   185	3.4 THE `mise.toml` SHALL verify の構成要素を個別に実行するタスク（lint / format の `check`、unit の
   186	`test`、E2E の `e2e`、`check:model-ids`）を持つ。
   187	
   188	3.5 WHILE ネットワークに接続できず、AI プロバイダの API キーを表す環境変数が 1 つも設定されていない状態で、
   189	THE verify タスク SHALL 依存とテスト用ブラウザが install 済みであれば 3.1 の検査を完了し、ネットワーク
   190	接続時と同じ合否を返す。
   191	
   192	3.6 THE verify タスク SHALL ネットワークを必要とする検査（`pnpm audit`、osv-scanner）を含まない。
   193	
   194	3.7 WHEN 同一コミット・同一環境で verify タスクを 3 回連続で実行したとき、THE verify タスク SHALL 3 回
   195	とも同じ合否を返す。
   196	
   197	3.8 IF unit テストの実行件数が 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   198	
   199	3.9 IF `@smoke` に一致する E2E テストが 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   200	
   201	3.10 IF unit テストがモックされていないネットワークアクセスを行った場合、THEN THE unit テストの実行環境
   202	SHALL そのテストを失敗させる。
   203	
   204	3.11 IF E2E テストが、テスト対象アプリのオリジン以外へのリクエストのうちモックが定義されていないものを
   205	発した場合、THEN THE E2E テストの実行環境 SHALL そのテストを失敗させる。
   206	
   207	3.12 IF gitleaks の全履歴スキャンが秘密値を検出した場合、THEN THE verify タスク SHALL 非 0 で終了し、
   208	検出した値そのものを出力しない。
   209	
   210	### Requirement 4: security タスク
   211	
   212	ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
   213	ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。
   214	
   215	**Acceptance Criteria**
   216	
   217	4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
   218	--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
   219	終了コード 0 を返す。
   220	
   221	4.2 IF `pnpm audit` が high 以上の advisory を検出した場合、THEN THE security タスク SHALL 非 0 で終了する。
   222	
   223	4.3 IF osv-scanner が lockfile の依存に既知の脆弱性を検出した場合、THEN THE security タスク SHALL 非 0 で
   224	終了する。
   225	
   226	4.4 IF advisory の取得先に到達できない場合、THEN THE security タスク SHALL 成功として扱わず、非 0 で
   227	終了する。
   228	
   229	4.5 WHERE 脆弱性の除外を記録する場合、THE リポジトリ SHALL 除外ごとに対象の advisory ID、理由、退役条件を
   230	記す。
   231	
   232	### Requirement 5: 記録用・更新確認用の補助タスク
   233	
   234	ラボの保守者として、検証記録に残す実行環境の版と、週次で上げる更新候補を、合否とは切り離して
   235	確かめたい（plan §2.1、§8.5）。
   236	
   237	**Acceptance Criteria**
   238	
   239	5.1 WHEN 開発者が `mise run runtime` を実行したとき、THE runtime タスク SHALL Node、pnpm、TypeScript、
   240	Next.js、lefthook、gitleaks、osv-scanner の実際の版を出力し、終了コード 0 を返す。
   241	
   242	5.2 THE runtime タスク SHALL 出力した版を特定の期待値と照合しない。
   243	
   244	5.3 WHEN 開発者が `mise run outdated` を実行したとき、THE outdated タスク SHALL `package.json` の依存の
   245	更新候補を一覧で出力する。
   246	
   247	5.4 THE outdated タスク SHALL `package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない。
   248	
   249	### Requirement 6: モデル ID の allowlist と直書き検査
   250	
   251	ラボの保守者として、モデル ID の散在と存在しないモデルの指定を防ぐため、モデル ID を 1 か所にだけ
   252	書かせ、それ以外の直書きを機械的に検出したい（憲章 原則 5、plan §2.2）。
   253	
   254	**Acceptance Criteria**
   255	
   256	6.1 THE リポジトリ SHALL モデル ID を `src/lib/ai/model-allowlist.ts` にだけ定義する。
   257	
   258	6.2 THE `src/lib/ai/model-allowlist.ts` SHALL 登録する各モデル ID について、プロバイダの公式ドキュメントで
   259	存在を確認した根拠を research.md に記録する。
   260	
   261	6.3 WHEN `mise run check:model-ids` を実行し、allowlist ファイルとテスト fixture 以外の走査対象ファイルに
   262	モデル ID の文字列が含まれていたとき、THE `check:model-ids` SHALL 非 0 で終了し、該当するファイルパスと
   263	行番号を出力する。
   264	
   265	6.4 THE `check:model-ids` SHALL allowlist に登録された ID に加えて、allowlist に未登録でもプロバイダの
   266	モデル ID の命名形式に一致する文字列を検出する。
   267	
   268	6.5 THE `check:model-ids` SHALL ソースコード、スクリプト、テスト、ルートの設定ファイル、`docs/`、
   269	`README.md` を走査対象とする。
   270	
   271	6.6 WHERE ファイルがテスト fixture の置き場として指定されている場合、THE `check:model-ids` SHALL その
   272	ファイルを検出対象から除く。
   273	
   274	6.7 WHEN 走査対象にモデル ID の直書きがないとき、THE `check:model-ids` SHALL 終了コード 0 を返す。
   275	
   276	### Requirement 7: Git フック
   277	
   278	ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
   279	D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。
   280	
   281	**Acceptance Criteria**
   282	
   283	7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
   284	pre-push の 3 つのフックを git に登録する。
   285	
   286	7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
   287	gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
   288	実行する。
   289	
   290	7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
   291	拒否する。
   292	
   293	7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
   294	commit を拒否する。
   295	
   296	7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
   297	--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。
   298	
   299	7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
   300	実行せずに push を拒否する。
   301	
   302	7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
   303	フック SHALL 検査を省略して成功とせず、非 0 で終了する。
   304	
   305	7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
   306	判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。
   307	
   308	### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）
   309	
   310	学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
   311	自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。
   312	
   313	**Acceptance Criteria**
   314	
   315	8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
   316	`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
   317	が非 0 で終了することを確かめる。
   318	
   319	8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
   320	テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。
   321	
   322	8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
   323	変わったときは変更後の引数で検査する。
   324	
   325	8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
   326	リテラルで含めない。
   327	
   328	8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
   329	コメントを使わない。
   330	
   331	8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
   332	ことを確かめる。
   333	
   334	8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。
   335	
   336	8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。
   337	
   338	### Requirement 9: 最小アプリとゲートの自己検査
   339	
   340	ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
   341	壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。
   342	
   343	**Acceptance Criteria**
   344	
   345	9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
   346	参照を行わない。
   347	
   348	9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。
   349	
   350	9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
   351	プレースホルダーページの見出しが表示されることを確かめる。
   352	
   353	9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
   354	直書きのない入力に対して 0 で終了することを確かめる。
   355	
   356	9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
   357	ことを確かめる。
   358	
   359	9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
   360	非 0 になることを、自動テストまたは実行記録で示す。
--- 361-529 ---
   361	
   362	9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
   363	そのテストが失敗すること（非空虚）を確認した記録を残す。
   364	
   365	9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。
   366	
   367	9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。
   368	
   369	### Requirement 10: CI と Dependabot
   370	
   371	ラボの保守者として、フックを回避した変更も同じ検査で止め、依存とツールの更新候補を自動で受け取りたい
   372	（plan §3.2、憲章 原則 3・8）。
   373	
   374	**Acceptance Criteria**
   375	
   376	10.1 WHEN `main` または `exp/**` への push、あるいは pull request が発生したとき、THE CI SHALL 既定レーンの
   377	verify ジョブで verify タスクと security タスクを実行する。
   378	
   379	10.2 IF 既定レーンの verify ジョブが失敗した場合、THEN THE CI SHALL その pull request の `main` への
   380	マージをブロックする。
   381	
   382	10.3 WHEN 10.1 と同じイベント、または週 1 回の定期実行が発生したとき、THE CI SHALL Node 27 レーンの
   383	verify-node27 ジョブで verify タスクを実行する。
   384	
   385	10.4 IF verify-node27 ジョブが失敗した場合、THEN THE CI SHALL ワークフロー全体を失敗とせず、マージを
   386	ブロックしない。
   387	
   388	10.5 WHEN 毎日の定期実行の時刻になったとき、THE security-daily ワークフロー SHALL 既定ブランチで security
   389	タスクを実行し、失敗した場合はワークフローを失敗として通知する。
   390	
   391	10.6 THE CI SHALL git 全履歴のシークレットスキャンを行うジョブで、全履歴を取得してから検査する。
   392	
   393	10.7 THE CI SHALL 依存を lockfile 固定（`--frozen-lockfile`）で install する。
   394	
   395	10.8 THE ワークフロー定義 SHALL すべての `uses:` をコミット SHA で固定する。
   396	
   397	10.9 THE ワークフロー定義 SHALL 各ジョブの `permissions:` を、そのジョブが必要とする最小の権限だけに
   398	限る。
   399	
   400	10.10 THE ワークフロー定義 SHALL AI プロバイダの API キーを表す secret を参照しない。
   401	
   402	10.11 THE `.github/dependabot.yml` SHALL GitHub Actions と npm の依存について、週 1 回の更新提案を設定する。
   403	
   404	10.12 THE `.github/dependabot.yml` SHALL 公開から 24 時間未満の版を更新提案しない設定を持つ。
   405	
   406	### Requirement 11: Node 27 alpha 検証レーン
   407	
   408	ラボの保守者として、既定レーンを壊さずに Node 27 alpha での動作を継続的に確かめ、結果（失敗を含む）を
   409	残したい（Clarifications 4 問目、plan §3、憲章 Additional Constraints の Node のレーン）。
   410	
   411	**Acceptance Criteria**
   412	
   413	11.1 THE `mise.node27.toml` SHALL Node の版だけを上書きし、それ以外のツールの版は `mise.toml` の指定を
   414	引き継ぐ。
   415	
   416	11.2 WHEN 開発者が `MISE_ENV=node27 mise install` を実行したとき、THE Node 27 レーン SHALL Node 27 alpha
   417	を install する。
   418	
   419	11.3 IF `MISE_ENV=node27 mise install` が Node 27 alpha を解決できなかった場合、THEN THE リポジトリ SHALL
   420	失敗の出力と、解決に必要だった設定（prerelease の扱いなど）または未解決である旨を research.md に記録する。
   421	
   422	11.4 WHEN 開発者が `MISE_ENV=node27 mise run verify` を実行したとき、THE Node 27 レーン SHALL 既定レーンと
   423	同じ検査を Node 27 alpha で実行する。
   424	
   425	11.5 THE リポジトリ SHALL `docs/node27/YYYY-MM-DD-<topic>.md` に初回の検証記録を 1 件以上持ち、その記録は
   426	「結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順」の見出しを持つ。
   427	
   428	11.6 IF Node 27 レーンの verify が失敗した場合、THEN THE 検証記録 SHALL 失敗した検査と出力の要点を
   429	「未解決事項」に記す。
   430	
   431	11.7 THE README SHALL Node 27 レーン用の git worktree を作り、`node_modules` を既定レーンと共有せずに
   432	検証する手順を記す。
   433	
   434	### Requirement 12: ZIP 未検証項目の解消と記録
   435	
   436	ラボの保守者として、ZIP ガイドの未検証の記述を実測で確定し、段 3〜6 が根拠のある前提から始められる
   437	ようにしたい（plan §7 M1・§8、Clarifications 1 問目、憲章 原則 9）。
   438	
   439	**Acceptance Criteria**
   440	
   441	12.1 THE research.md SHALL plan §8 の未検証 5 項目それぞれについて、確認方法、実行したコマンド、結果、
   442	根拠（公式ドキュメントの参照先と実行出力）、確認日を記録する。
   443	
   444	12.2 WHEN ZIP のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、`extract-task.ts`、`model.ts`）と
   445	その unit / E2E テストを使い捨て環境で型検査したとき、THE research.md SHALL ファイルごとの型エラーと、
   446	AI SDK 7 の実際の型との差異を、引き継ぎ先の段（003〜006）とともに記録する。
   447	
   448	12.3 THE research.md SHALL ZIP が使う AI SDK 7 の API 名（`toolApproval`、`isStepCount`、
   449	`toUIMessageStream` など）が、install した版の型定義に存在するかどうかを API ごとに記録する。
   450	
   451	12.4 WHEN ZIP の E2E smoke テストを使い捨て環境で実行したとき、THE research.md SHALL SSE モックが
   452	`useChat` のパーサーで解釈されたかどうかと、その実行出力を記録する。
   453	
   454	12.5 WHEN 実装時点で TypeScript 7.1 の RC または stable が公開から 24 時間以上経過しているとき、THE
   455	リポジトリ SHALL beta からその版へ切り替え、切り替えたことを research.md に記録する。
   456	
   457	12.6 IF 実装時点で TypeScript 7.1 の RC と stable がどちらも公開されていないか、公開から 24 時間未満の場合、
   458	THEN THE research.md SHALL 確認日とその時点の公開状況を記録し、beta を据え置く。
   459	
   460	12.7 THE リポジトリ SHALL ZIP のアプリコードとそのテストを `src/` と `tests/` に含めない。
   461	
   462	### Requirement 13: 解説・README・統治文書の更新
   463	
   464	学習者として段 1 を「読む → 動かす → 改造する → テストで合格を確かめる」で進めたい。ラボの保守者として、
   465	本 spec の決定と統治文書・計画の記述を一致させたい（憲章 原則 2、Governance）。
   466	
   467	**Acceptance Criteria**
   468	
   469	13.1 THE 解説 `docs/stages/1-dev-environment-and-gates.md` SHALL 「読む → 動かす → 改造する → テストで
   470	合格を確かめる」の順の節を持つ。
   471	
   472	13.2 THE 解説 SHALL 段 1 の合格条件（verify がネットワーク不要で通る、秘密値を含む commit がフックで
   473	拒否される）ごとに、合格を判定するテストのパスを示し、そのパスはリポジトリに実在する。
   474	
   475	13.3 THE README SHALL mise の有効化、ツールと依存とテスト用ブラウザの install、フックの登録までの
   476	セットアップ手順を記す。
   477	
   478	13.4 THE README SHALL mise を有効にしていない Git クライアントではフックが失敗することを明記する。
   479	
   480	13.5 THE `.env.example` SHALL 変数名だけを持ち、値を持たない。
   481	
   482	13.6 THE `.gitignore` SHALL `.env`、`.env*.local`、`.next`、テスト成果物（レポートとトレース）を
   483	git の追跡対象から除く。
   484	
   485	13.7 THE 憲章 SHALL 原則 3 を「verify はオフラインで決定論的な検査、ネットワークが必要な検査は security
   486	タスクに分け、pre-push と CI 必須ジョブが両方を実行する」内容に MINOR 改訂（1.0.0 → 1.1.0）し、版、Sync Impact Report、
   487	改訂履歴を更新する。
   488	
   489	13.8 THE `AGENTS.md` SHALL コマンド表を実在する `mise.toml` のタスクと一致させ、"Current state" を段 1
   490	完了後の状態に更新する。
   491	
   492	13.9 THE steering（`tech.md` の Gate command、`structure.md` の状態注記）SHALL verify と security の分離と、
   493	取り込んだ実際の構成に合わせて更新される。
   494	
   495	13.10 THE plan（`specs/000-development-plan/plan.md`）SHALL §7 M1（`exp/node27` は必要時に作る）と §8.5
   496	（`src/app/**`、`src/lib/ai/**`、`tests/**` は基盤のみ取り込む）に、本 spec の Clarifications を参照する
   497	改訂注記を持つ。
   498	
   499	13.11 THE 本 spec の PR SHALL 未コミットの憲章、steering、`AGENTS.md` を含める。
   500	
   501	13.12 THE 文書 SHALL 記載する版番号を確認日つきの参考値として示し、合否の条件にしない。
   502	
   503	## Non-Functional Requirements
   504	
   505	- **オフライン・決定論**: verify タスクは API キーとネットワークを必要とせず、同一コミットで同じ合否を
   506	  返す（3.5、3.7）。ネットワークを使う検査は security タスクと CI の install 工程に限る。
   507	- **実行時間（記録）**: 初回実装時に、pre-commit フック全体、pre-push フック全体、E2E `@smoke`、verify
   508	  タスク全体の実行時間を、既定レーンの開発機と CI のそれぞれで測り research.md に記録する。pre-push の
   509	  E2E smoke は 60 秒以内を目安とするが、TODO(E2E_BUDGET) が spec 003 で確定するまでは合否に使わない。
   510	- **セキュリティ**: シークレットスキャンの出力は検出値を含まない（3.12、8.6）。CI は AI プロバイダの
   511	  secret を参照せず、ジョブの権限を最小にする（10.9、10.10）。
   512	- **実行環境**: 既定レーンは macOS（zsh、mise 有効）の開発機と GitHub Actions の Linux ランナーの両方で
   513	  verify が緑になる。
   514	- **言語**: spec、解説、steering、憲章の散文は日本語。コード、識別子、コメント、パス、コミット
   515	  メッセージ、`AGENTS.md` は英語。
   516	
   517	## Out of Scope / Future Work
   518	
   519	- ZIP のアプリコード（chat route・chat UI・エージェント・構造化出力・プロバイダ選択）の実装は段 003〜006
   520	  の spec で TDD により行う。12.2〜12.4 の記録をその入力にする。
   521	- shadcn/ui と Tailwind CSS v4 の導入（spec 002 以降）。
   522	- `exp/node27` ブランチの作成と push（Node 27 専用の修正が実際に必要になった時点）。
   523	- Node 27 alpha で verify が緑になること（本 spec は結果の記録までを求める）。
   524	- 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)、spec 002 の実測で決定）。
   525	- pre-push E2E smoke の時間上限の確定（TODO(E2E_BUDGET)、spec 003 の実測で決定）。
   526	
   527	---
   528	
   529	_Initialized: 2026-11-22T12:05:52Z_ | _Requirements generated: 2026-11-22_

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '58,220p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 118ms:
    58	### 前提（質問せずに置いた仮定）
    59	
    60	- constitution（`.sdd/memory/constitution.md`）、steering（`.sdd/steering/*`）、`AGENTS.md` は
    61	  plan §6 のガバナンス手順で作成済み（未コミット）。spec 001 ではこれらを新規に作らず、本 spec の
    62	  PR に含めてコミットし、上の決定に合わせた改訂（原則 3 の MINOR、AGENTS.md のコマンド表と
    63	  "Current state"）だけを行う。
    64	
    65	## Scope
    66	
    67	- In scope:
    68	  - ZIP の基盤ファイルの取り込みと §2.2 の修正（`mise.toml`、`mise.node27.toml`、`package.json`、
    69	    `pnpm-workspace.yaml`、`pnpm-lock.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、
    70	    `next.config.ts`、`vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、
    71	    `.github/workflows/*`、`.github/dependabot.yml`）
    72	  - `src/lib/ai/model-allowlist.ts` と `scripts/check-model-ids.mjs`（`check:model-ids`）
    73	  - ゲート自体を検査する最小のユニットテスト（0 件で失敗、未モック通信で失敗、など）と、
    74	    プレースホルダーページ 1 枚 + `@smoke` E2E 1 本（pre-push と verify が空振りしないため）
    75	  - ZIP のアプリコード（段 3〜5 相当）の使い捨て環境での型照合と、`research.md` への記録
    76	    （plan §8 の未検証項目の解消）
    77	  - `mise run verify`（オフライン・決定論的）と `mise run security`（ネットワーク必要）の分離、
    78	    両方を pre-push と CI 必須ジョブで実行
    79	  - 秘密値を含む commit が gitleaks で拒否されることの自動テスト（偽キーは実行時生成）
    80	  - Node 27 レーン: `mise.node27.toml`、CI の `verify-node27`（参考・非ブロック）、初回記録
    81	  - 解説 `docs/stages/1-dev-environment-and-gates.md`、初回の `docs/node27/` 記録、README 更新
    82	    （mise 有効化の注意、Node 27 worktree 手順）
    83	  - 改訂: plan §7 M1・§8.5 の注記、constitution 原則 3（MINOR）、AGENTS.md のコマンド表と
    84	    "Current state"
    85	- Out of scope:
    86	  - ZIP のアプリコード（`src/app/api/chat/route.ts`、`src/app/page.tsx` の chat UI、
    87	    `src/lib/ai/agent.ts`、`extract-task.ts`、`model.ts`）とその unit / E2E テストの `src/` / `tests/`
    88	    への取り込み（各段 003〜006 の spec で TDD により実装する）
    89	  - shadcn/ui・Tailwind CSS の導入（spec 002 以降）
    90	  - `exp/node27` ブランチの作成と push（Node 27 専用の修正が必要になった時点で行う）
    91	  - Node 27 alpha で verify が緑になること（結果の記録だけを求める）
    92	
    93	## Glossary
    94	
    95	| Term | Definition |
    96	|------|------------|
    97	| ZIP 足場 | `genai-lab.zip` に含まれる設定ファイル・CI・フック・アプリコード一式。ガイドの記述は未検証（plan §8） |
    98	| 基盤ファイル | ZIP 足場のうち、Scope の In scope に列挙した設定・CI・フック・Dependabot のファイル |
    99	| verify タスク | `mise run verify`。オフラインで決定論的な単一の検証入口。`mise run gate` はその別名 |
   100	| security タスク | `mise run security`。ネットワークを必要とする依存の脆弱性検査（`pnpm audit`、osv-scanner） |
   101	| 既定レーン | `MISE_ENV` を設定しない状態。Node 26 LTS で動き、CI の必須ジョブになる |
   102	| Node 27 レーン | `MISE_ENV=node27` の状態。Node 27 alpha で動き、CI では参考ジョブ（非ブロック）になる |
   103	| 使い捨て環境 | リポジトリ外の一時ディレクトリなど、結果をコミットしない検証用の作業場所 |
   104	| 偽キー | 秘密値の検出テスト用に、テスト実行時に組み立てる本物ではない鍵文字列 |
   105	| モデル ID | LLM プロバイダのモデルを指す識別子文字列。唯一の定義は `src/lib/ai/model-allowlist.ts` |
   106	| 非空虚 | 対象の検査やロジックを壊すと、そのテストが失敗することを確認済みであること |
   107	| research.md | `specs/001-dev-environment-and-gates/research.md`。公式ドキュメントと実測による根拠の記録 |
   108	
   109	## Requirements
   110	
   111	<!--
   112	Generated by /sdd-spec in EARS format. Each requirement heading carries a
   113	leading NUMERIC id only (e.g. "Requirement 1"). Acceptance criteria are
   114	numbered hierarchically (1.1, 1.2). Keywords WHEN / WHILE / IF / THEN /
   115	WHERE / THE / SHALL are kept in English; the rest is Japanese.
   116	-->
   117	
   118	### Requirement 1: 依存とツールの版固定
   119	
   120	ラボの保守者として、公開直後の不正版を自動で取り込まず、いつどの版を採用したかを設定と lockfile で
   121	追えるようにしたい（plan §2.1・§2.2、D3、憲章 原則 8・9）。
   122	
   123	**Acceptance Criteria**
   124	
   125	1.1 THE `mise.toml` と `mise.node27.toml` SHALL ランタイムとツール（Node、pnpm、lefthook、gitleaks、
   126	osv-scanner）の版を exact な版番号で指定し、`latest` などのタグや範囲指定を含まない。
   127	
   128	1.2 THE `package.json` SHALL `dependencies` と `devDependencies` のすべての版を exact な版番号で指定し、
   129	`latest`・`canary`・`beta` などの dist-tag や範囲指定（`^`、`~`、`*`、`>=` など）を含まない。
   130	
   131	1.3 THE リポジトリ SHALL 採用する各版を、採用時点で公開から 24 時間以上経過したものに限り、その版の
   132	公開日時と確認日を research.md に記録する。
   133	
   134	1.4 THE `pnpm-workspace.yaml` SHALL `minimumReleaseAge: 1440` を指定し、`minimumReleaseAgeExclude` を
   135	含まない。
   136	
   137	1.5 THE `pnpm-workspace.yaml` SHALL 依存の install スクリプトを既定で実行しない設定とし、`allowBuilds`
   138	で許可するパッケージごとに許可理由を記す。`sharp` の install スクリプトは許可しない。
   139	
   140	1.6 THE `package.json` SHALL `packageManager` に `mise.toml` が指定する pnpm と同じ版を指定する。
   141	
   142	1.7 THE `package.json` SHALL `engines.node` に Node 26 LTS 系列を下限とする範囲を指定する。
   143	
   144	1.8 WHEN 開発者がクリーンな checkout で README の手順どおりに依存を lockfile 固定（`--frozen-lockfile`）で
   145	install したとき、THE リポジトリ SHALL 終了コード 0 で install を完了する。
   146	
   147	1.9 IF install 時に peerDependency の警告が出た場合、THEN THE リポジトリ SHALL その警告文と扱い
   148	（`overrides` で解消した、または受容した理由）を research.md に記録する。
   149	
   150	### Requirement 2: lint・format・型検査の設定
   151	
   152	ラボの保守者として、規約を 1 か所に集約し、型の抜け道を設定で塞ぎたい（憲章 原則 7、Additional
   153	Constraints の lint / format）。
   154	
   155	**Acceptance Criteria**
   156	
   157	2.1 THE リポジトリ SHALL lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定
   158	ファイルを含まない。
   159	
   160	2.2 THE `biome.json` SHALL `noUnusedVariables`、`noUnusedImports`、`noExplicitAny` を `error` とする。
   161	
   162	2.3 THE `tsconfig.json` SHALL `strict` を有効にする。
   163	
   164	2.4 IF 検査対象のソースに明示的な `any`、未使用の変数、未使用の import のいずれかが含まれる場合、THEN THE
   165	verify タスク SHALL 非 0 で終了する。
   166	
   167	2.5 IF 検査対象のソースに型エラーが含まれる場合、THEN THE verify タスク SHALL 非 0 で終了する。
   168	
   169	### Requirement 3: verify ゲート
   170	
   171	ラボの保守者と学習者として、API キーもネットワークもない環境で、同じコミットなら常に同じ合否を返し、
   172	空振りしない検証入口が 1 つだけほしい（段 1 の合格条件、憲章 原則 3）。
   173	
   174	**Acceptance Criteria**
   175	
   176	3.1 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL lint、format チェック、
   177	型検査、`check:model-ids`、gitleaks による git 全履歴（HEAD から到達できるコミット）のシークレットスキャン、unit テスト、E2E `@smoke`
   178	テストを実行し、すべてが成功した場合に限り終了コード 0 を返す。
   179	
   180	3.2 IF 3.1 の構成要素のいずれかが失敗した場合、THEN THE verify タスク SHALL 非 0 で終了する。
   181	
   182	3.3 WHEN 開発者が `mise run gate` を実行したとき、THE gate タスク SHALL verify タスクと同じ検査を実行し、
   183	同じ終了コードを返す。
   184	
   185	3.4 THE `mise.toml` SHALL verify の構成要素を個別に実行するタスク（lint / format の `check`、unit の
   186	`test`、E2E の `e2e`、`check:model-ids`）を持つ。
   187	
   188	3.5 WHILE ネットワークに接続できず、AI プロバイダの API キーを表す環境変数が 1 つも設定されていない状態で、
   189	THE verify タスク SHALL 依存とテスト用ブラウザが install 済みであれば 3.1 の検査を完了し、ネットワーク
   190	接続時と同じ合否を返す。
   191	
   192	3.6 THE verify タスク SHALL ネットワークを必要とする検査（`pnpm audit`、osv-scanner）を含まない。
   193	
   194	3.7 WHEN 同一コミット・同一環境で verify タスクを 3 回連続で実行したとき、THE verify タスク SHALL 3 回
   195	とも同じ合否を返す。
   196	
   197	3.8 IF unit テストの実行件数が 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   198	
   199	3.9 IF `@smoke` に一致する E2E テストが 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   200	
   201	3.10 IF unit テストがモックされていないネットワークアクセスを行った場合、THEN THE unit テストの実行環境
   202	SHALL そのテストを失敗させる。
   203	
   204	3.11 IF E2E テストが、テスト対象アプリのオリジン以外へのリクエストのうちモックが定義されていないものを
   205	発した場合、THEN THE E2E テストの実行環境 SHALL そのテストを失敗させる。
   206	
   207	3.12 IF gitleaks の全履歴スキャンが秘密値を検出した場合、THEN THE verify タスク SHALL 非 0 で終了し、
   208	検出した値そのものを出力しない。
   209	
   210	### Requirement 4: security タスク
   211	
   212	ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
   213	ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。
   214	
   215	**Acceptance Criteria**
   216	
   217	4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
   218	--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
   219	終了コード 0 を返す。
   220	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '118,420p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 103ms:
   118	### Requirement 1: 依存とツールの版固定
   119	
   120	ラボの保守者として、公開直後の不正版を自動で取り込まず、いつどの版を採用したかを設定と lockfile で
   121	追えるようにしたい（plan §2.1・§2.2、D3、憲章 原則 8・9）。
   122	
   123	**Acceptance Criteria**
   124	
   125	1.1 THE `mise.toml` と `mise.node27.toml` SHALL ランタイムとツール（Node、pnpm、lefthook、gitleaks、
   126	osv-scanner）の版を exact な版番号で指定し、`latest` などのタグや範囲指定を含まない。
   127	
   128	1.2 THE `package.json` SHALL `dependencies` と `devDependencies` のすべての版を exact な版番号で指定し、
   129	`latest`・`canary`・`beta` などの dist-tag や範囲指定（`^`、`~`、`*`、`>=` など）を含まない。
   130	
   131	1.3 THE リポジトリ SHALL 採用する各版を、採用時点で公開から 24 時間以上経過したものに限り、その版の
   132	公開日時と確認日を research.md に記録する。
   133	
   134	1.4 THE `pnpm-workspace.yaml` SHALL `minimumReleaseAge: 1440` を指定し、`minimumReleaseAgeExclude` を
   135	含まない。
   136	
   137	1.5 THE `pnpm-workspace.yaml` SHALL 依存の install スクリプトを既定で実行しない設定とし、`allowBuilds`
   138	で許可するパッケージごとに許可理由を記す。`sharp` の install スクリプトは許可しない。
   139	
   140	1.6 THE `package.json` SHALL `packageManager` に `mise.toml` が指定する pnpm と同じ版を指定する。
   141	
   142	1.7 THE `package.json` SHALL `engines.node` に Node 26 LTS 系列を下限とする範囲を指定する。
   143	
   144	1.8 WHEN 開発者がクリーンな checkout で README の手順どおりに依存を lockfile 固定（`--frozen-lockfile`）で
   145	install したとき、THE リポジトリ SHALL 終了コード 0 で install を完了する。
   146	
   147	1.9 IF install 時に peerDependency の警告が出た場合、THEN THE リポジトリ SHALL その警告文と扱い
   148	（`overrides` で解消した、または受容した理由）を research.md に記録する。
   149	
   150	### Requirement 2: lint・format・型検査の設定
   151	
   152	ラボの保守者として、規約を 1 か所に集約し、型の抜け道を設定で塞ぎたい（憲章 原則 7、Additional
   153	Constraints の lint / format）。
   154	
   155	**Acceptance Criteria**
   156	
   157	2.1 THE リポジトリ SHALL lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定
   158	ファイルを含まない。
   159	
   160	2.2 THE `biome.json` SHALL `noUnusedVariables`、`noUnusedImports`、`noExplicitAny` を `error` とする。
   161	
   162	2.3 THE `tsconfig.json` SHALL `strict` を有効にする。
   163	
   164	2.4 IF 検査対象のソースに明示的な `any`、未使用の変数、未使用の import のいずれかが含まれる場合、THEN THE
   165	verify タスク SHALL 非 0 で終了する。
   166	
   167	2.5 IF 検査対象のソースに型エラーが含まれる場合、THEN THE verify タスク SHALL 非 0 で終了する。
   168	
   169	### Requirement 3: verify ゲート
   170	
   171	ラボの保守者と学習者として、API キーもネットワークもない環境で、同じコミットなら常に同じ合否を返し、
   172	空振りしない検証入口が 1 つだけほしい（段 1 の合格条件、憲章 原則 3）。
   173	
   174	**Acceptance Criteria**
   175	
   176	3.1 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL lint、format チェック、
   177	型検査、`check:model-ids`、gitleaks による git 全履歴（HEAD から到達できるコミット）のシークレットスキャン、unit テスト、E2E `@smoke`
   178	テストを実行し、すべてが成功した場合に限り終了コード 0 を返す。
   179	
   180	3.2 IF 3.1 の構成要素のいずれかが失敗した場合、THEN THE verify タスク SHALL 非 0 で終了する。
   181	
   182	3.3 WHEN 開発者が `mise run gate` を実行したとき、THE gate タスク SHALL verify タスクと同じ検査を実行し、
   183	同じ終了コードを返す。
   184	
   185	3.4 THE `mise.toml` SHALL verify の構成要素を個別に実行するタスク（lint / format の `check`、unit の
   186	`test`、E2E の `e2e`、`check:model-ids`）を持つ。
   187	
   188	3.5 WHILE ネットワークに接続できず、AI プロバイダの API キーを表す環境変数が 1 つも設定されていない状態で、
   189	THE verify タスク SHALL 依存とテスト用ブラウザが install 済みであれば 3.1 の検査を完了し、ネットワーク
   190	接続時と同じ合否を返す。
   191	
   192	3.6 THE verify タスク SHALL ネットワークを必要とする検査（`pnpm audit`、osv-scanner）を含まない。
   193	
   194	3.7 WHEN 同一コミット・同一環境で verify タスクを 3 回連続で実行したとき、THE verify タスク SHALL 3 回
   195	とも同じ合否を返す。
   196	
   197	3.8 IF unit テストの実行件数が 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   198	
   199	3.9 IF `@smoke` に一致する E2E テストが 0 件だった場合、THEN THE verify タスク SHALL 非 0 で終了する。
   200	
   201	3.10 IF unit テストがモックされていないネットワークアクセスを行った場合、THEN THE unit テストの実行環境
   202	SHALL そのテストを失敗させる。
   203	
   204	3.11 IF E2E テストが、テスト対象アプリのオリジン以外へのリクエストのうちモックが定義されていないものを
   205	発した場合、THEN THE E2E テストの実行環境 SHALL そのテストを失敗させる。
   206	
   207	3.12 IF gitleaks の全履歴スキャンが秘密値を検出した場合、THEN THE verify タスク SHALL 非 0 で終了し、
   208	検出した値そのものを出力しない。
   209	
   210	### Requirement 4: security タスク
   211	
   212	ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
   213	ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。
   214	
   215	**Acceptance Criteria**
   216	
   217	4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
   218	--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
   219	終了コード 0 を返す。
   220	
   221	4.2 IF `pnpm audit` が high 以上の advisory を検出した場合、THEN THE security タスク SHALL 非 0 で終了する。
   222	
   223	4.3 IF osv-scanner が lockfile の依存に既知の脆弱性を検出した場合、THEN THE security タスク SHALL 非 0 で
   224	終了する。
   225	
   226	4.4 IF advisory の取得先に到達できない場合、THEN THE security タスク SHALL 成功として扱わず、非 0 で
   227	終了する。
   228	
   229	4.5 WHERE 脆弱性の除外を記録する場合、THE リポジトリ SHALL 除外ごとに対象の advisory ID、理由、退役条件を
   230	記す。
   231	
   232	### Requirement 5: 記録用・更新確認用の補助タスク
   233	
   234	ラボの保守者として、検証記録に残す実行環境の版と、週次で上げる更新候補を、合否とは切り離して
   235	確かめたい（plan §2.1、§8.5）。
   236	
   237	**Acceptance Criteria**
   238	
   239	5.1 WHEN 開発者が `mise run runtime` を実行したとき、THE runtime タスク SHALL Node、pnpm、TypeScript、
   240	Next.js、lefthook、gitleaks、osv-scanner の実際の版を出力し、終了コード 0 を返す。
   241	
   242	5.2 THE runtime タスク SHALL 出力した版を特定の期待値と照合しない。
   243	
   244	5.3 WHEN 開発者が `mise run outdated` を実行したとき、THE outdated タスク SHALL `package.json` の依存の
   245	更新候補を一覧で出力する。
   246	
   247	5.4 THE outdated タスク SHALL `package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない。
   248	
   249	### Requirement 6: モデル ID の allowlist と直書き検査
   250	
   251	ラボの保守者として、モデル ID の散在と存在しないモデルの指定を防ぐため、モデル ID を 1 か所にだけ
   252	書かせ、それ以外の直書きを機械的に検出したい（憲章 原則 5、plan §2.2）。
   253	
   254	**Acceptance Criteria**
   255	
   256	6.1 THE リポジトリ SHALL モデル ID を `src/lib/ai/model-allowlist.ts` にだけ定義する。
   257	
   258	6.2 THE `src/lib/ai/model-allowlist.ts` SHALL 登録する各モデル ID について、プロバイダの公式ドキュメントで
   259	存在を確認した根拠を research.md に記録する。
   260	
   261	6.3 WHEN `mise run check:model-ids` を実行し、allowlist ファイルとテスト fixture 以外の走査対象ファイルに
   262	モデル ID の文字列が含まれていたとき、THE `check:model-ids` SHALL 非 0 で終了し、該当するファイルパスと
   263	行番号を出力する。
   264	
   265	6.4 THE `check:model-ids` SHALL allowlist に登録された ID に加えて、allowlist に未登録でもプロバイダの
   266	モデル ID の命名形式に一致する文字列を検出する。
   267	
   268	6.5 THE `check:model-ids` SHALL ソースコード、スクリプト、テスト、ルートの設定ファイル、`docs/`、
   269	`README.md` を走査対象とする。
   270	
   271	6.6 WHERE ファイルがテスト fixture の置き場として指定されている場合、THE `check:model-ids` SHALL その
   272	ファイルを検出対象から除く。
   273	
   274	6.7 WHEN 走査対象にモデル ID の直書きがないとき、THE `check:model-ids` SHALL 終了コード 0 を返す。
   275	
   276	### Requirement 7: Git フック
   277	
   278	ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
   279	D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。
   280	
   281	**Acceptance Criteria**
   282	
   283	7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
   284	pre-push の 3 つのフックを git に登録する。
   285	
   286	7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
   287	gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
   288	実行する。
   289	
   290	7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
   291	拒否する。
   292	
   293	7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
   294	commit を拒否する。
   295	
   296	7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
   297	--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。
   298	
   299	7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
   300	実行せずに push を拒否する。
   301	
   302	7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
   303	フック SHALL 検査を省略して成功とせず、非 0 で終了する。
   304	
   305	7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
   306	判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。
   307	
   308	### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）
   309	
   310	学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
   311	自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。
   312	
   313	**Acceptance Criteria**
   314	
   315	8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
   316	`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
   317	が非 0 で終了することを確かめる。
   318	
   319	8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
   320	テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。
   321	
   322	8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
   323	変わったときは変更後の引数で検査する。
   324	
   325	8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
   326	リテラルで含めない。
   327	
   328	8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
   329	コメントを使わない。
   330	
   331	8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
   332	ことを確かめる。
   333	
   334	8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。
   335	
   336	8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。
   337	
   338	### Requirement 9: 最小アプリとゲートの自己検査
   339	
   340	ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
   341	壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。
   342	
   343	**Acceptance Criteria**
   344	
   345	9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
   346	参照を行わない。
   347	
   348	9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。
   349	
   350	9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
   351	プレースホルダーページの見出しが表示されることを確かめる。
   352	
   353	9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
   354	直書きのない入力に対して 0 で終了することを確かめる。
   355	
   356	9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
   357	ことを確かめる。
   358	
   359	9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
   360	非 0 になることを、自動テストまたは実行記録で示す。
   361	
   362	9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
   363	そのテストが失敗すること（非空虚）を確認した記録を残す。
   364	
   365	9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。
   366	
   367	9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。
   368	
   369	### Requirement 10: CI と Dependabot
   370	
   371	ラボの保守者として、フックを回避した変更も同じ検査で止め、依存とツールの更新候補を自動で受け取りたい
   372	（plan §3.2、憲章 原則 3・8）。
   373	
   374	**Acceptance Criteria**
   375	
   376	10.1 WHEN `main` または `exp/**` への push、あるいは pull request が発生したとき、THE CI SHALL 既定レーンの
   377	verify ジョブで verify タスクと security タスクを実行する。
   378	
   379	10.2 IF 既定レーンの verify ジョブが失敗した場合、THEN THE CI SHALL その pull request の `main` への
   380	マージをブロックする。
   381	
   382	10.3 WHEN 10.1 と同じイベント、または週 1 回の定期実行が発生したとき、THE CI SHALL Node 27 レーンの
   383	verify-node27 ジョブで verify タスクを実行する。
   384	
   385	10.4 IF verify-node27 ジョブが失敗した場合、THEN THE CI SHALL ワークフロー全体を失敗とせず、マージを
   386	ブロックしない。
   387	
   388	10.5 WHEN 毎日の定期実行の時刻になったとき、THE security-daily ワークフロー SHALL 既定ブランチで security
   389	タスクを実行し、失敗した場合はワークフローを失敗として通知する。
   390	
   391	10.6 THE CI SHALL git 全履歴のシークレットスキャンを行うジョブで、全履歴を取得してから検査する。
   392	
   393	10.7 THE CI SHALL 依存を lockfile 固定（`--frozen-lockfile`）で install する。
   394	
   395	10.8 THE ワークフロー定義 SHALL すべての `uses:` をコミット SHA で固定する。
   396	
   397	10.9 THE ワークフロー定義 SHALL 各ジョブの `permissions:` を、そのジョブが必要とする最小の権限だけに
   398	限る。
   399	
   400	10.10 THE ワークフロー定義 SHALL AI プロバイダの API キーを表す secret を参照しない。
   401	
   402	10.11 THE `.github/dependabot.yml` SHALL GitHub Actions と npm の依存について、週 1 回の更新提案を設定する。
   403	
   404	10.12 THE `.github/dependabot.yml` SHALL 公開から 24 時間未満の版を更新提案しない設定を持つ。
   405	
   406	### Requirement 11: Node 27 alpha 検証レーン
   407	
   408	ラボの保守者として、既定レーンを壊さずに Node 27 alpha での動作を継続的に確かめ、結果（失敗を含む）を
   409	残したい（Clarifications 4 問目、plan §3、憲章 Additional Constraints の Node のレーン）。
   410	
   411	**Acceptance Criteria**
   412	
   413	11.1 THE `mise.node27.toml` SHALL Node の版だけを上書きし、それ以外のツールの版は `mise.toml` の指定を
   414	引き継ぐ。
   415	
   416	11.2 WHEN 開発者が `MISE_ENV=node27 mise install` を実行したとき、THE Node 27 レーン SHALL Node 27 alpha
   417	を install する。
   418	
   419	11.3 IF `MISE_ENV=node27 mise install` が Node 27 alpha を解決できなかった場合、THEN THE リポジトリ SHALL
   420	失敗の出力と、解決に必要だった設定（prerelease の扱いなど）または未解決である旨を research.md に記録する。

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '210,368p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
   210	### Requirement 4: security タスク
   211	
   212	ラボの保守者として、ネットワークが必要な依存の脆弱性検査を verify から分けつつ、検査そのものは減らさ
   213	ないようにしたい（Clarifications 2 問目、憲章 原則 8、plan §2.1）。
   214	
   215	**Acceptance Criteria**
   216	
   217	4.1 WHEN 開発者が `mise run security` を実行したとき、THE security タスク SHALL `pnpm audit
   218	--audit-level=high` と、`pnpm-lock.yaml` を対象とする osv-scanner を実行し、両方が成功した場合に限り
   219	終了コード 0 を返す。
   220	
   221	4.2 IF `pnpm audit` が high 以上の advisory を検出した場合、THEN THE security タスク SHALL 非 0 で終了する。
   222	
   223	4.3 IF osv-scanner が lockfile の依存に既知の脆弱性を検出した場合、THEN THE security タスク SHALL 非 0 で
   224	終了する。
   225	
   226	4.4 IF advisory の取得先に到達できない場合、THEN THE security タスク SHALL 成功として扱わず、非 0 で
   227	終了する。
   228	
   229	4.5 WHERE 脆弱性の除外を記録する場合、THE リポジトリ SHALL 除外ごとに対象の advisory ID、理由、退役条件を
   230	記す。
   231	
   232	### Requirement 5: 記録用・更新確認用の補助タスク
   233	
   234	ラボの保守者として、検証記録に残す実行環境の版と、週次で上げる更新候補を、合否とは切り離して
   235	確かめたい（plan §2.1、§8.5）。
   236	
   237	**Acceptance Criteria**
   238	
   239	5.1 WHEN 開発者が `mise run runtime` を実行したとき、THE runtime タスク SHALL Node、pnpm、TypeScript、
   240	Next.js、lefthook、gitleaks、osv-scanner の実際の版を出力し、終了コード 0 を返す。
   241	
   242	5.2 THE runtime タスク SHALL 出力した版を特定の期待値と照合しない。
   243	
   244	5.3 WHEN 開発者が `mise run outdated` を実行したとき、THE outdated タスク SHALL `package.json` の依存の
   245	更新候補を一覧で出力する。
   246	
   247	5.4 THE outdated タスク SHALL `package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない。
   248	
   249	### Requirement 6: モデル ID の allowlist と直書き検査
   250	
   251	ラボの保守者として、モデル ID の散在と存在しないモデルの指定を防ぐため、モデル ID を 1 か所にだけ
   252	書かせ、それ以外の直書きを機械的に検出したい（憲章 原則 5、plan §2.2）。
   253	
   254	**Acceptance Criteria**
   255	
   256	6.1 THE リポジトリ SHALL モデル ID を `src/lib/ai/model-allowlist.ts` にだけ定義する。
   257	
   258	6.2 THE `src/lib/ai/model-allowlist.ts` SHALL 登録する各モデル ID について、プロバイダの公式ドキュメントで
   259	存在を確認した根拠を research.md に記録する。
   260	
   261	6.3 WHEN `mise run check:model-ids` を実行し、allowlist ファイルとテスト fixture 以外の走査対象ファイルに
   262	モデル ID の文字列が含まれていたとき、THE `check:model-ids` SHALL 非 0 で終了し、該当するファイルパスと
   263	行番号を出力する。
   264	
   265	6.4 THE `check:model-ids` SHALL allowlist に登録された ID に加えて、allowlist に未登録でもプロバイダの
   266	モデル ID の命名形式に一致する文字列を検出する。
   267	
   268	6.5 THE `check:model-ids` SHALL ソースコード、スクリプト、テスト、ルートの設定ファイル、`docs/`、
   269	`README.md` を走査対象とする。
   270	
   271	6.6 WHERE ファイルがテスト fixture の置き場として指定されている場合、THE `check:model-ids` SHALL その
   272	ファイルを検出対象から除く。
   273	
   274	6.7 WHEN 走査対象にモデル ID の直書きがないとき、THE `check:model-ids` SHALL 終了コード 0 を返す。
   275	
   276	### Requirement 7: Git フック
   277	
   278	ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
   279	D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。
   280	
   281	**Acceptance Criteria**
   282	
   283	7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
   284	pre-push の 3 つのフックを git に登録する。
   285	
   286	7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
   287	gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
   288	実行する。
   289	
   290	7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
   291	拒否する。
   292	
   293	7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
   294	commit を拒否する。
   295	
   296	7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
   297	--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。
   298	
   299	7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
   300	実行せずに push を拒否する。
   301	
   302	7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
   303	フック SHALL 検査を省略して成功とせず、非 0 で終了する。
   304	
   305	7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
   306	判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。
   307	
   308	### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）
   309	
   310	学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
   311	自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。
   312	
   313	**Acceptance Criteria**
   314	
   315	8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
   316	`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
   317	が非 0 で終了することを確かめる。
   318	
   319	8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
   320	テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。
   321	
   322	8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
   323	変わったときは変更後の引数で検査する。
   324	
   325	8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
   326	リテラルで含めない。
   327	
   328	8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
   329	コメントを使わない。
   330	
   331	8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
   332	ことを確かめる。
   333	
   334	8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。
   335	
   336	8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。
   337	
   338	### Requirement 9: 最小アプリとゲートの自己検査
   339	
   340	ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
   341	壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。
   342	
   343	**Acceptance Criteria**
   344	
   345	9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
   346	参照を行わない。
   347	
   348	9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。
   349	
   350	9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
   351	プレースホルダーページの見出しが表示されることを確かめる。
   352	
   353	9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
   354	直書きのない入力に対して 0 で終了することを確かめる。
   355	
   356	9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
   357	ことを確かめる。
   358	
   359	9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
   360	非 0 になることを、自動テストまたは実行記録で示す。
   361	
   362	9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
   363	そのテストが失敗すること（非空虚）を確認した記録を残す。
   364	
   365	9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。
   366	
   367	9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。
   368	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/spec.md | sed -n '276,462p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 92ms:
   276	### Requirement 7: Git フック
   277	
   278	ラボの保守者として、commit と push の時点で速いゲートと厳格なゲートを自動で走らせたい（plan §4、D4、
   279	D5）。フックは `--no-verify` で回避できるため、CI（Requirement 10）が同じ検査を担う。
   280	
   281	**Acceptance Criteria**
   282	
   283	7.1 WHEN 開発者が README のセットアップ手順を完了したとき、THE lefthook SHALL pre-commit、commit-msg、
   284	pre-push の 3 つのフックを git に登録する。
   285	
   286	7.2 WHEN 開発者が `git commit` を実行したとき、THE pre-commit フック SHALL ステージ済み変更に対する
   287	gitleaks（`--redact` 付き）、ステージ済みファイルに対する Biome、型検査、`check:model-ids` を並列に
   288	実行する。
   289	
   290	7.3 IF pre-commit フックのいずれかのジョブが失敗した場合、THEN THE pre-commit フック SHALL commit を
   291	拒否する。
   292	
   293	7.4 IF commit メッセージが Conventional Commits の形式に従わない場合、THEN THE commit-msg フック SHALL
   294	commit を拒否する。
   295	
   296	7.5 WHEN 開発者が `git push` を実行したとき、THE pre-push フック SHALL osv-scanner、`pnpm audit
   297	--audit-level=high`、unit テスト、E2E `@smoke` テストをこの順に直列で実行する。
   298	
   299	7.6 IF pre-push フックのいずれかのジョブが失敗した場合、THEN THE pre-push フック SHALL 後続のジョブを
   300	実行せずに push を拒否する。
   301	
   302	7.7 IF フックが呼ぶツールが PATH 上に見つからない場合（mise が有効でない Git クライアントなど）、THEN THE
   303	フック SHALL 検査を省略して成功とせず、非 0 で終了する。
   304	
   305	7.8 THE `lefthook.yml` SHALL 各ジョブで、verify タスクと security タスクの対応する構成要素と同じ検査対象と
   306	判定基準（audit のしきい値、gitleaks の `--redact` など）を使う。
   307	
   308	### Requirement 8: 秘密値を含む commit の拒否（段 1 の合格条件）
   309	
   310	学習者とラボの保守者として、秘密値を含む commit がフックで拒否されることを、手作業ではなく verify の
   311	自動テストで確かめたい（Clarifications 3 問目、憲章 原則 8）。
   312	
   313	**Acceptance Criteria**
   314	
   315	8.1 WHEN unit テストが一時ディレクトリに git リポジトリを作り、偽キーを含むファイルを stage して、
   316	`lefthook.yml` の pre-commit secrets ジョブと同じ引数で gitleaks を実行したとき、THE テスト SHALL gitleaks
   317	が非 0 で終了することを確かめる。
   318	
   319	8.2 WHEN 同じテストが秘密値を含まないファイルだけを stage して同じ引数で gitleaks を実行したとき、THE
   320	テスト SHALL gitleaks が終了コード 0 で終了することを確かめる。
   321	
   322	8.3 THE テスト SHALL gitleaks に渡す引数を `lefthook.yml` の secrets ジョブの定義から取得し、定義が
   323	変わったときは変更後の引数で検査する。
   324	
   325	8.4 THE テスト SHALL 偽キーを実行時に組み立て、gitleaks が検出する形の値をリポジトリのどのファイルにも
   326	リテラルで含めない。
   327	
   328	8.5 THE リポジトリ SHALL このテストを通すために `.gitleaksignore`、gitleaks の allowlist、インライン除外
   329	コメントを使わない。
   330	
   331	8.6 IF gitleaks が偽キーを検出した場合、THEN THE テスト SHALL gitleaks の出力に偽キーの値が含まれない
   332	ことを確かめる。
   333	
   334	8.7 THE テスト SHALL ネットワークを使わずに完了し、verify タスクの unit テストに含まれる。
   335	
   336	8.8 WHEN テストが終了したとき（成功・失敗を問わず）、THE テスト SHALL 作成した一時ディレクトリを削除する。
   337	
   338	### Requirement 9: 最小アプリとゲートの自己検査
   339	
   340	ラボの保守者として、アプリコードを持たない段 1 でも verify と pre-push が空振りせず、ゲートそのものが
   341	壊れたら気づけるようにしたい（Clarifications 1 問目、憲章 原則 3）。
   342	
   343	**Acceptance Criteria**
   344	
   345	9.1 THE アプリ SHALL ルート `/` にプレースホルダーページを 1 枚持ち、そのページは AI の呼び出しと API キーの
   346	参照を行わない。
   347	
   348	9.2 THE プレースホルダーページ SHALL React Server Component として描画し、`"use client"` を含まない。
   349	
   350	9.3 THE E2E テスト SHALL `@smoke` タグ付きのテストを 1 本以上持ち、そのテストは `/` を開いて
   351	プレースホルダーページの見出しが表示されることを確かめる。
   352	
   353	9.4 THE unit テスト SHALL `check:model-ids` が、モデル ID を直書きした検査用の入力に対して非 0 で終了し、
   354	直書きのない入力に対して 0 で終了することを確かめる。
   355	
   356	9.5 THE unit テスト SHALL unit テストの実行環境がモックされていないネットワークアクセスを失敗させる
   357	ことを確かめる。
   358	
   359	9.6 THE リポジトリ SHALL 3.8、3.9、3.11 のゲート動作それぞれについて、違反する状態で verify の該当構成要素が
   360	非 0 になることを、自動テストまたは実行記録で示す。
   361	
   362	9.7 THE リポジトリ SHALL 本 spec の受け入れテストそれぞれについて、対象の検査またはロジックを壊すと
   363	そのテストが失敗すること（非空虚）を確認した記録を残す。
   364	
   365	9.8 THE リポジトリ SHALL テストを `tests/unit/` と `tests/e2e/` にだけ置き、ソースの隣に置かない。
   366	
   367	9.9 THE テスト SHALL ランタイム・ツール・依存の版番号を期待値として検査しない。
   368	
   369	### Requirement 10: CI と Dependabot
   370	
   371	ラボの保守者として、フックを回避した変更も同じ検査で止め、依存とツールの更新候補を自動で受け取りたい
   372	（plan §3.2、憲章 原則 3・8）。
   373	
   374	**Acceptance Criteria**
   375	
   376	10.1 WHEN `main` または `exp/**` への push、あるいは pull request が発生したとき、THE CI SHALL 既定レーンの
   377	verify ジョブで verify タスクと security タスクを実行する。
   378	
   379	10.2 IF 既定レーンの verify ジョブが失敗した場合、THEN THE CI SHALL その pull request の `main` への
   380	マージをブロックする。
   381	
   382	10.3 WHEN 10.1 と同じイベント、または週 1 回の定期実行が発生したとき、THE CI SHALL Node 27 レーンの
   383	verify-node27 ジョブで verify タスクを実行する。
   384	
   385	10.4 IF verify-node27 ジョブが失敗した場合、THEN THE CI SHALL ワークフロー全体を失敗とせず、マージを
   386	ブロックしない。
   387	
   388	10.5 WHEN 毎日の定期実行の時刻になったとき、THE security-daily ワークフロー SHALL 既定ブランチで security
   389	タスクを実行し、失敗した場合はワークフローを失敗として通知する。
   390	
   391	10.6 THE CI SHALL git 全履歴のシークレットスキャンを行うジョブで、全履歴を取得してから検査する。
   392	
   393	10.7 THE CI SHALL 依存を lockfile 固定（`--frozen-lockfile`）で install する。
   394	
   395	10.8 THE ワークフロー定義 SHALL すべての `uses:` をコミット SHA で固定する。
   396	
   397	10.9 THE ワークフロー定義 SHALL 各ジョブの `permissions:` を、そのジョブが必要とする最小の権限だけに
   398	限る。
   399	
   400	10.10 THE ワークフロー定義 SHALL AI プロバイダの API キーを表す secret を参照しない。
   401	
   402	10.11 THE `.github/dependabot.yml` SHALL GitHub Actions と npm の依存について、週 1 回の更新提案を設定する。
   403	
   404	10.12 THE `.github/dependabot.yml` SHALL 公開から 24 時間未満の版を更新提案しない設定を持つ。
   405	
   406	### Requirement 11: Node 27 alpha 検証レーン
   407	
   408	ラボの保守者として、既定レーンを壊さずに Node 27 alpha での動作を継続的に確かめ、結果（失敗を含む）を
   409	残したい（Clarifications 4 問目、plan §3、憲章 Additional Constraints の Node のレーン）。
   410	
   411	**Acceptance Criteria**
   412	
   413	11.1 THE `mise.node27.toml` SHALL Node の版だけを上書きし、それ以外のツールの版は `mise.toml` の指定を
   414	引き継ぐ。
   415	
   416	11.2 WHEN 開発者が `MISE_ENV=node27 mise install` を実行したとき、THE Node 27 レーン SHALL Node 27 alpha
   417	を install する。
   418	
   419	11.3 IF `MISE_ENV=node27 mise install` が Node 27 alpha を解決できなかった場合、THEN THE リポジトリ SHALL
   420	失敗の出力と、解決に必要だった設定（prerelease の扱いなど）または未解決である旨を research.md に記録する。
   421	
   422	11.4 WHEN 開発者が `MISE_ENV=node27 mise run verify` を実行したとき、THE Node 27 レーン SHALL 既定レーンと
   423	同じ検査を Node 27 alpha で実行する。
   424	
   425	11.5 THE リポジトリ SHALL `docs/node27/YYYY-MM-DD-<topic>.md` に初回の検証記録を 1 件以上持ち、その記録は
   426	「結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順」の見出しを持つ。
   427	
   428	11.6 IF Node 27 レーンの verify が失敗した場合、THEN THE 検証記録 SHALL 失敗した検査と出力の要点を
   429	「未解決事項」に記す。
   430	
   431	11.7 THE README SHALL Node 27 レーン用の git worktree を作り、`node_modules` を既定レーンと共有せずに
   432	検証する手順を記す。
   433	
   434	### Requirement 12: ZIP 未検証項目の解消と記録
   435	
   436	ラボの保守者として、ZIP ガイドの未検証の記述を実測で確定し、段 3〜6 が根拠のある前提から始められる
   437	ようにしたい（plan §7 M1・§8、Clarifications 1 問目、憲章 原則 9）。
   438	
   439	**Acceptance Criteria**
   440	
   441	12.1 THE research.md SHALL plan §8 の未検証 5 項目それぞれについて、確認方法、実行したコマンド、結果、
   442	根拠（公式ドキュメントの参照先と実行出力）、確認日を記録する。
   443	
   444	12.2 WHEN ZIP のアプリコード（`route.ts`、`page.tsx`、`agent.ts`、`extract-task.ts`、`model.ts`）と
   445	その unit / E2E テストを使い捨て環境で型検査したとき、THE research.md SHALL ファイルごとの型エラーと、
   446	AI SDK 7 の実際の型との差異を、引き継ぎ先の段（003〜006）とともに記録する。
   447	
   448	12.3 THE research.md SHALL ZIP が使う AI SDK 7 の API 名（`toolApproval`、`isStepCount`、
   449	`toUIMessageStream` など）が、install した版の型定義に存在するかどうかを API ごとに記録する。
   450	
   451	12.4 WHEN ZIP の E2E smoke テストを使い捨て環境で実行したとき、THE research.md SHALL SSE モックが
   452	`useChat` のパーサーで解釈されたかどうかと、その実行出力を記録する。
   453	
   454	12.5 WHEN 実装時点で TypeScript 7.1 の RC または stable が公開から 24 時間以上経過しているとき、THE
   455	リポジトリ SHALL beta からその版へ切り替え、切り替えたことを research.md に記録する。
   456	
   457	12.6 IF 実装時点で TypeScript 7.1 の RC と stable がどちらも公開されていないか、公開から 24 時間未満の場合、
   458	THEN THE research.md SHALL 確認日とその時点の公開状況を記録し、beta を据え置く。
   459	
   460	12.7 THE リポジトリ SHALL ZIP のアプリコードとそのテストを `src/` と `tests/` に含めない。
   461	
   462	### Requirement 13: 解説・README・統治文書の更新

**Planning next steps**

I feel like I've done enough for now, so the next step is to read through what I've accomplished. I'll also need to think about line counts to help plan any longer sections. It's pretty crucial to make sure everything fits together, and I want to get it organized for smooth reading. I'm curious to see how it all flows once I start reading things over again. So, let’s get to it!
exec
/bin/zsh -lc 'nl -ba specs/001-dev-environment-and-gates/plan.md' in /Users/Shared/codes/genai-lab-ts
 succeeded in 62ms:
     1	# 001-dev-environment-and-gates — Technical Plan
     2	
     3	承認済みの要件（WHAT）を設計（HOW）に落とす。実装コードは含まない。根拠は
     4	[research.md](research.md)（I-n は調査、ADR-n は設計判断、R-n は実装時の記録）。
     5	
     6	## Summary
     7	
     8	ZIP 足場の基盤ファイルを plan §2.2 の修正と本 spec の決定（Clarifications 1〜4）を反映して取り込み、
     9	`mise.toml` のタスクを唯一の検査定義とする。`verify`（別名 `gate`）はオフラインで決定論的な検査を
    10	直列に実行し、ネットワークが必要な検査は `security` に分ける。lefthook のフックと CI はこれらの
    11	タスクを呼ぶだけにして、検査の二重定義をなくす（ADR-1、ADR-2）。
    12	
    13	アプリは RSC のプレースホルダーページ 1 枚だけを持つ。unit / E2E の実行環境は依存を足さずに
    14	未モック通信を失敗させ（ADR-5）、ゲート自体を壊すと落ちる自己検査テストを置く。秘密値を含む commit の
    15	拒否は、実行時に生成した偽キーで一時リポジトリを検査する自動テストで確かめる（Requirement 8）。
    16	ZIP のアプリコードは使い捨て環境で型照合し、結果だけを research.md に残す（ADR-9）。
    17	
    18	## Architecture Overview
    19	
    20	```mermaid
    21	flowchart LR
    22	  subgraph Dev["開発者の操作"]
    23	    C[git commit]
    24	    P[git push]
    25	    V[mise run verify / gate]
    26	  end
    27	
    28	  subgraph Hooks["lefthook.yml（assert_lefthook_installed）"]
    29	    PC["pre-commit（並列）<br/>secrets: gitleaks --staged --redact<br/>biome: --staged<br/>typecheck / model-ids"]
    30	    CM["commit-msg<br/>check-commit-msg.mjs"]
    31	    PP["pre-push（直列・最初の失敗で停止）<br/>security:osv → security:audit → test → e2e"]
    32	  end
    33	
    34	  subgraph Tasks["mise.toml のタスク（検査の唯一の定義）"]
    35	    VER["verify（alias gate）<br/>check → typecheck → check:model-ids<br/>→ check:secrets → test → e2e"]
    36	    SEC["security<br/>security:osv → security:audit"]
    37	    AUX["runtime / outdated / setup"]
    38	  end
    39	
    40	  subgraph Harness["テスト実行環境"]
    41	    UG["Vitest setupFiles<br/>network-guard（net / fetch 遮断）"]
    42	    EG["Playwright fixtures.ts<br/>外部オリジン遮断"]
    43	  end
    44	
    45	  subgraph CI["GitHub Actions"]
    46	    J1["ci.yml: verify（必須）<br/>verify + security + 作業ツリー不変"]
    47	    J2["ci.yml: verify-node27<br/>MISE_ENV=node27、continue-on-error"]
    48	    J3["security-daily.yml<br/>security（毎日）"]
    49	  end
    50	
    51	  C --> PC
    52	  C --> CM
    53	  P --> PP
    54	  V --> VER
    55	  PC -->|mise run| VER
    56	  PP -->|mise run| SEC
    57	  PP -->|mise run| VER
    58	  VER --> UG
    59	  VER --> EG
    60	  J1 --> VER
    61	  J1 --> SEC
    62	  J2 --> VER
    63	  J3 --> SEC
    64	```
    65	
    66	- **検査の定義は `mise.toml` に 1 か所**。フックと CI はタスク名で呼ぶ。素のコマンドを書くのは
    67	  staged 専用の 2 ジョブ（gitleaks、Biome）だけで、設定テストがフックとタスクの対応を検査する（ADR-2）。
    68	- **verify はオフライン**。構成要素は lint / format（Biome）、型検査（`next typegen && tsc`）、
    69	  `check:model-ids`、gitleaks 全履歴、unit、E2E `@smoke`。ネットワークを使うのは `security` と、
    70	  CI の install 工程だけ（3.6、NFR）。
    71	- **既定レーンと Node 27 レーン**は同じタスクを使い、`MISE_ENV=node27` で node の版だけが変わる
    72	  （11.1、11.4）。
    73	- **ゲートの自己検査**: 0 件実行、未モック通信、モデル ID 直書き、秘密値 commit、フックのツール不在を、
    74	  実設定を使う自動テストで「違反すると非 0 になる」ことまで確かめる（9.4〜9.7）。
    75	
    76	段 1 で取り込まない ZIP のアプリコードは、リポジトリ外の使い捨て環境で検証する（ADR-9）。
    77	
    78	```mermaid
    79	flowchart TD
    80	  Z["genai-lab.zip"] -->|基盤ファイル + §2.2 修正| R["リポジトリ（src/・tests/ は段 1 の最小構成）"]
    81	  Z -->|アプリコードとテスト| T["使い捨て環境（リポジトリ外の一時ディレクトリ）"]
    82	  T -->|"install・tsc・型定義照合・vitest・playwright @smoke"| RS["research.md R-6<br/>ファイル別の型エラー / API 名の有無 / SSE 解釈 / 引き継ぎ先の段"]
    83	  RS --> S["段 003〜006 の spec の入力"]
    84	```
    85	
    86	## Components
    87	
    88	各コンポーネントの「Does NOT own」は tasks.md の `_Boundary:_` が参照する契約である。複数の
    89	コンポーネントが同じファイルを持つ場合（`mise.toml` など）は、ファイル内の担当範囲で分ける。
    90	
    91	### C1 ToolchainPins
    92	
    93	- **Responsibility**: ランタイム・ツール・npm 依存の採用版を exact に固定し、24h ゲートと install
    94	  スクリプトの遮断を設定で強制する。
    95	- **Public interface**:
    96	  - `mise.toml` の `[tools]`: `node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定。
    97	    `[env]` に `NEXT_TELEMETRY_DISABLED = "1"`。ZIP の `[settings] prereleases = false` は既定値なので書かない。
    98	  - `package.json`: `name`、`private: true`、`type: "module"`、`packageManager: "pnpm@<mise と同じ版>"`、
    99	    `engines.node: ">=<Node 26 LTS の採用版> || >=27.0.0-alpha"`（semver で alpha を受けるため。I-2）、
   100	    `scripts`（`dev`、`build`、`start` のみ。検査は mise タスクに一本化し、`package.json` に検査スクリプトを
   101	    重複させない）、`dependencies` / `devDependencies` は ADR-4 の一覧を exact 版で。
   102	  - `pnpm-workspace.yaml`: `minimumReleaseAge: 1440`、`savePrefix: ""`（`pnpm add` が `^` を付けない）、
   103	    `allowBuilds`（install スクリプトを持つ依存を**すべて**列挙し、各行に理由のコメント。`sharp: false`）、
   104	    必要な場合だけ `overrides` と `audit.ignore`（C4）。`minimumReleaseAgeExclude` は書かない。
   105	  - `pnpm-lock.yaml`: `pnpm install` で生成し、CI は `--frozen-lockfile`。
   106	- **Owns**: 採用版の正本（設定と lockfile）。`allowBuilds` の判断と理由。
   107	- **Does NOT own**: タスク定義（C3〜C5）、Node 27 の版（C14）、採用根拠の記録（C15 の research.md R-1・R-2）。
   108	- **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
   109	
   110	### C2 StaticAnalysisConfig
   111	
   112	- **Responsibility**: lint / format / 型検査の規約を `biome.json` と `tsconfig.json` に集約する。
   113	- **Public interface**:
   114	  - `biome.json`: `linter.rules.preset: "recommended"`（I-9）、`correctness.noUnusedVariables` /
   115	    `correctness.noUnusedImports` / `suspicious.noExplicitAny` を `"error"`。`suspicious.noSkippedTests` も
   116	    `"error"`（Biome 2.6.8 に実在する。`it.skip` / `describe.skip` / テスト本体内の `test.skip(…)` を検出し、
   117	    `it.todo` と `test.info().skip(…)` は検出しないことを実測した（I-15）。`.fixme` / `xit` は未確認。静的な検査は
   118	    1 段目で、実行 0 件の最終的な止め手は 2 つの reporter（C6・C7）。3.8、3.9）。
   119	    `vcs.enabled: true`、`vcs.clientKind: "git"`、`vcs.useIgnoreFile: true`（`--staged` と ignore の読み込みに
   120	    `enabled` と `clientKind` が要る。ZIP の値を保つ）。
   121	    `files.includes` はコード・JSON・設定に限り、`specs/`・`.sdd/`・`docs/` の Markdown は対象にしない。
   122	    `overrides` で `tests/e2e/**`（`tests/e2e/fixtures.ts` を除く）の `@playwright/test` 直接 import を
   123	    `noRestrictedImports` で禁止する（ADR-5）。
   124	  - `tsconfig.json`: ZIP の値を基に `strict: true`、`noUncheckedIndexedAccess: true`、`noEmit: true`、
   125	    `types: ["node"]`、`paths: { "@/*": ["./src/*"] }`。`include` に `next-env.d.ts`、`src/**`、`tests/**`、
   126	    `*.config.ts`、`.next/types/**/*.ts`。`next dev` が書き足す値は取り込み時に受け入れて固定する（I-11）。
   127	  - `next.config.ts`: ZIP の内容（`cacheComponents: true`）を型検査が通る形で取り込む。
   128	- **Owns**: 規約の値。
   129	- **Does NOT own**: 規約を実行するタスク（C3 の `check` / `typecheck`）、フックでの staged 実行（C9）。
   130	- **Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5
   131	
   132	### C3 VerifyTask
   133	
   134	- **Responsibility**: オフラインで決定論的な検査を、`mise run verify`（別名 `gate`）1 つで直列に実行する。
   135	- **Public interface**（`mise.toml` の `[tasks.*]`、詳細は Interfaces の表）:
   136	  `check`、`typecheck`、`check:model-ids`、`check:secrets`、`test`、`e2e`、`verify`（`alias = "gate"`）。
   137	  `verify` は `run` 配列で 6 タスクをこの順に呼び、最初の失敗で止まる（ADR-1、I-3）。他のタスクを呼ぶ
   138	  `verify` と `security` は `{ task = "<name>" }` の書き方で書く。`mise tasks ls --json` では `{"task":"<name>"}`
   139	  というオブジェクトになり、通常のコマンドは単一の文字列でも `["pnpm exec vitest run"]` のように配列になる
   140	  （I-16）。
   141	- **Owns**: verify の構成要素・順序・判定基準（gitleaks の `--redact`、Vitest / Playwright の呼び方）。
   142	- **Does NOT own**: ネットワークが必要な検査（C4）、テストランナーの設定（C6・C7）、モデル ID 検査の中身（C8）。
   143	- **Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 11.4
   144	
   145	### C4 SecurityTask
   146	
   147	- **Responsibility**: ネットワークを使う依存の脆弱性検査を verify から分けて実行し、到達不能を成功扱いに
   148	  しない。
   149	- **Public interface**: `security:osv`（`osv-scanner scan source --lockfile=pnpm-lock.yaml`）、
   150	  `security:audit`（`pnpm audit --audit-level=high`、`--ignore-registry-errors` は付けない）、
   151	  `security`（`security:osv` → `security:audit` の直列）。
   152	  除外を記録する場合の形式: osv-scanner は `osv-scanner.toml` の `[[IgnoredVulns]]`（`id`、`ignoreUntil`、
   153	  `reason` に退役条件を含める）、pnpm は `pnpm-workspace.yaml` の `audit.ignore`（GHSA ID の各行に
   154	  理由と退役条件のコメント）。除外がない間はどちらも作らない。
   155	- **Owns**: security の構成要素と除外の記録形式。
   156	- **Does NOT own**: CI での実行タイミング（C13）、フックでの実行（C9）、版上げ自体（C1）。
   157	- **Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5
   158	
   159	### C5 AuxiliaryTasks
   160	
   161	- **Responsibility**: 合否と切り離した記録用・更新確認用・セットアップ用のタスクを提供する。
   162	- **Public interface**:
   163	  - `runtime`: `node -v`、`pnpm -v`、`pnpm exec tsc -v`、`pnpm exec next --version`、`lefthook version`、
   164	    `gitleaks version`、`osv-scanner --version` を出力する。期待値と照合しない。
   165	  - `outdated`: `mise outdated`（ツール）→ `pnpm outdated`（npm 依存）。ファイルを変更しない。
   166	    `pnpm outdated` は候補があると `exit 1` になる（I-8）。この意味を `description` と README に書き、
   167	    終了コードを隠さない。
   168	  - `setup`: `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install`。
   169	    README のセットアップ手順の最後の 3 手順をまとめる。
   170	- **Owns**: 上記 3 タスク。
   171	- **Does NOT own**: 版の決定（C1）、検査の合否（C3・C4）。
   172	- **Requirements**: 5.1, 5.2, 5.3, 5.4, 13.3
   173	
   174	### C6 UnitTestHarness
   175	
   176	- **Responsibility**: unit テストの実行環境を、0 件で失敗し、未モック通信でテストが失敗する状態に固定する。
   177	- **Public interface**:
   178	  - `vitest.config.ts`: `include: ["tests/unit/**/*.test.ts"]`、`environment: "node"`、
   179	    `setupFiles: ["tests/unit/setup/network-guard.ts"]`、`passWithNoTests: false`（既定と同じ値を明記）、
   180	    `allowOnly: false`、`resolve.alias` の `@` → `src`。`@vitejs/plugin-react` は使わない（ADR-4）。
   181	    `reporters: ["default", "./tests/unit/setup/require-executed-tests.ts"]`。`testTimeout` は既定（5 秒）の
   182	    まま、子プロセスを使うテストファイルは `describe(…, { timeout })` で明示する（初期値 60 秒、R-11 の
   183	    実測で見直す）。
   184	  - `tests/unit/setup/require-executed-tests.ts`: Vitest の custom reporter。実行を終えたテスト
   185	    （passed + failed）が 0 件なら、実行全体を失敗させる（ファイルはあるが全部 `todo` / `skip` の場合。
   186	    3.8）。`vitest/node` の `Reporter` を実装し、`onTestRunEnd(testModules)` で各モジュールの
   187	    `children.allTests()` の `result().state` が `passed` / `failed` の件数を数え、0 件なら固定メッセージ
   188	    `no tests were executed` を stderr に出して `process.exitCode = 1` にする。Vitest 5.1.1 で実測済み
   189	    （`.ts` の reporter を読み込めること、`it.todo` のみ → 1、`it.skip` のみ → 1、1 件実行 → 0。reporter なしで
   190	    `it.todo` のみだと 0 で、reporter が唯一のガードであること。I-15）。型検査は実装時に通す。自己検査（C12）で
   191	    非 0 になることを確かめる。
   192	  - `tests/unit/setup/network-guard.ts`: `net.Socket.prototype.connect` と `globalThis.fetch` を置き換え、
   193	    呼ばれると `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で違反があればそのテストを
   194	    失敗させる。違反の消去手段は公開しない（ADR-5）。
   195	  - `tests/unit/helpers/sandbox.ts`: `useTempGitRepo()`（一時ディレクトリ + `git init`、終了時に
   196	    `onTestFinished` で必ず削除）、`resolveTool(name)`、`isolatedEnv(options?)`、`runCommand()`（シェルを介さない
   197	    `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）、
   198	    `expectGateFailure()` / `expectGateSuccess()`。
   199	    - `resolveTool(name)`: 解決元を 2 種に分け、どの名前がどちらかを 1 か所の表で持つ。
   200	      (1) mise 管理のツール（`node`、`pnpm`、`gitleaks`、`lefthook`、`osv-scanner`）: リポジトリのルートを cwd に
   201	      して `mise which <name>` を 1 回だけ実行し、絶対パスを返す。
   202	      (2) OS 付属のツール（`git`）: `git` は `[tools]` に入れない設計（C1 の 5 ツール）で、`mise which git` では
   203	      解決できない（I-16）。親プロセスの `PATH` を先頭から探し、実行可能な絶対パスを返す（子プロセスは使わない）。
   204	      node_modules の bin（`biome`、`tsc`、`vitest`）はルートの `node_modules/.bin/` から解決する。これらは
   205	      shebang のスクリプトで、実行には `node` が PATH に要る（I-16）。mise の shim は cwd がプロジェクト外だと
   206	      `No version is set for shim` で失敗する（実測）ため、一時リポジトリで PATH 上の名前に頼らない。
   207	      見つからなければ、原因を示すメッセージでテストを失敗させる（スキップしない）。
   208	    - `isolatedEnv(options?)`: `GIT_*`、`GITLEAKS_*`、`LEFTHOOK*`、`MISE_ENV` を除く（それ以外は親から引き継ぐ。
   209	      `HOME` など）。そのうえで
   210	      `GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`、固定の偽の identity（`GIT_AUTHOR_NAME` /
   211	      `GIT_AUTHOR_EMAIL` / `GIT_COMMITTER_NAME` / `GIT_COMMITTER_EMAIL`。`.invalid` ドメイン）を設定する
   212	      （Linux ランナーでは identity がないと commit 自体が失敗し、拒否の原因が gitleaks か区別できない）。
   213	      `PATH` は次のディレクトリを先頭からこの順に並べ、重複を除いて作る（親の `PATH` は引き継がない）:
   214	      `dirname(process.execPath)`（テストを実行している Node。`pnpm exec` と `node_modules/.bin` のスクリプトが
   215	      `node` を PATH から探すため必須。`PATH=/usr/bin:/bin` だけでは `node: not found`（127）になる。I-16）、
   216	      `resolveTool()` で解決した `pnpm`・`gitleaks`・`lefthook`・`git` のディレクトリ、`/usr/bin`、`/bin`。
   217	      フック経由で起動する gitleaks が一時リポジトリでも見つかる。`options.pathDirs` を渡すと、この組み立てを
   218	      その配列 + `/usr/bin:/bin` に置き換える（7.7 の「ツール不在」ケースが `[]` で使う。C12）。
   219	    - `runCommand()`: 既定の環境は `isolatedEnv()`。親の環境をそのまま使うときは `env: "inherit"` を明示する
   220	      （隔離しない実行を、書き忘れでなく意図として残す）。`CommandResult` は `spawnError`（`spawnSync` の
   221	      `error.code`。`ENOENT` など。なければ `null`）を持つ。
   222	    - `expectGateFailure(result, { output })`: 「ゲートが拒否した」ことを次のすべてで確かめる。`status` が数値で
   223	      0 でない、`spawnError` が `null`、`status` が 126 / 127 でない、stdout + stderr が `output`（正規表現または
   224	      文字列）に一致する。ツールや `node` が見つからないだけの失敗を、拒否と取り違えない。ツール不在を
   225	      期待する 7.7 のケースは、フックの終了コード 1 と出力のツール名で確かめる（この関数の対象外ではなく、
   226	      `output` に不在を示す文言を渡す）。`expectGateSuccess(result)` は `status` が 0 で `spawnError` が `null`
   227	      であることを確かめる。「非 0」を assert するテストは、必ず対照の成功ケースを併置する。
   228	  - `tests/unit/sandbox.test.ts`: `sandbox.ts` の契約を確かめる。(1) `isolatedEnv()` の環境で `node -v`、
   229	    `git --version`、`gitleaks version`、`lefthook version`、`pnpm exec vitest --version` が `expectGateSuccess`
   230	    になる（子の環境で実際に起動できる。PATH を直前の状態に戻すと失敗する）。(2) 親に `GIT_DIR` /
   231	    `GIT_INDEX_FILE` / `MISE_ENV` / `LEFTHOOK` を設定しても子の環境に現れない。(3) `resolveTool("git")` が
   232	    絶対パスを返し、`resolveTool("no-such-tool")` が原因を示して失敗する。(4) `expectGateFailure` が、
   233	    `status` 127、`spawnError` あり、`status` 0、出力不一致のいずれも拒否し、実際に非 0 で出力が一致した
   234	    ときだけ通る。
   235	- **Owns**: unit の実行規則と、子プロセス・一時リポジトリの安全な扱い。
   236	- **Does NOT own**: 個々の受け入れテストの中身（C10・C12）、E2E（C7）。
   237	- **Requirements**: 3.7, 3.8, 3.10, 8.8, 9.7, 9.8
   238	
   239	### C7 E2EHarness
   240	
   241	- **Responsibility**: E2E の実行環境を、0 件で失敗し、外部オリジンへの未モック通信でテストが失敗し、
   242	  既存のサーバーを再利用しない状態に固定する。
   243	- **Public interface**:
   244	  - `playwright.config.ts`: `testDir: "tests/e2e"`、`retries: 0`、`forbidOnly: true`、`projects` は
   245	    chromium のみ、`use.baseURL` は専用ポートの `http://127.0.0.1:<port>`、`webServer` は
   246	    `pnpm exec next dev --hostname 127.0.0.1 --port <port>`、`reuseExistingServer: false`、
   247	    `env: { NEXT_TELEMETRY_DISABLED: "1" }`。ポート番号は設定ファイルの 1 か所で定義する。
   248	    `reporter: [["list"], ["./tests/e2e/reporters/require-executed-tests.ts"]]`。
   249	  - `tests/e2e/reporters/require-executed-tests.ts`: Playwright の custom reporter。`onEnd` で、実行された
   250	    テスト（status が `skipped` 以外）が 0 件なら `{ status: "failed" }` を返して実行全体を失敗させる
   251	    （`@smoke` に一致するテストが全部 skip の場合。3.9）。`onTestEnd` で数え、0 件のときは固定メッセージ
   252	    `no tests were executed` を stderr に出す。型は `@playwright/test/reporter` から import する
   253	    （Biome の `noRestrictedImports` が禁じるのは `@playwright/test` の直接 import だけ）。
   254	    Playwright 1.65.1 の実測（I-15）: 全部 skip だと reporter なしでは **exit 0** になり、この reporter が唯一の
   255	    ガード。`onEnd` が `{ status: "failed" }` を返すと exit 1 になる（`.mjs` の reporter で確認。`.ts` の
   256	    reporter を設定から読み込めることは未確認で、実装時に R-9 で確かめる。読めない場合は `.mjs` + JSDoc の型に
   257	    する）。この reporter は `--list` でも走り、実行 0 件として失敗する。`--list` を使う検査は
   258	    `--reporter=list` で設定の reporter を上書きする。
   259	  - `tests/e2e/fixtures.ts`: `test`（auto fixture `networkGuard` を持つ）と `expect` を export する。
   260	    `networkGuard` は `context.route("**/*")` で受けたリクエストのうち、`baseURL` と異なるオリジンを
   261	    `abort` して記録し、teardown で違反があれば失敗させる。同一オリジンは `route.fallback()`。
   262	    記録は fixture `blockedRequests` として公開し、option fixture `failOnBlockedRequest`（既定 `true`）が
   263	    `false` のときだけ teardown の失敗を止める（自己検査専用。C12）。
   264	- **Owns**: E2E の実行規則と外部通信の遮断。
   265	- **Does NOT own**: 個々の E2E テスト（C11・C12）、`/api/chat` の SSE モック（段 003）。
   266	- **Requirements**: 3.9, 3.11, 9.8
   267	
   268	### C8 ModelIdGuard
   269	
   270	- **Responsibility**: モデル ID の唯一の定義を持ち、それ以外の場所への直書きを検出する。
   271	- **Public interface**:
   272	  - `src/lib/ai/model-allowlist.ts`（消去可能な構文だけで書く。I-7）:
   273	    `PROVIDERS`（`"openai" | "anthropic" | "google" | "ollama"` の readonly タプル）、`type Provider`、
   274	    `MODEL_ALLOWLIST`（`as const satisfies Record<Provider, readonly string[]>`）、
   275	    `type AllowedModelId<P extends Provider = Provider>`。登録する ID は実装時に公式ドキュメントで確認する
   276	    （research.md R-5、6.2）。`server-only` は import しない（秘密値を読まず、段 1 で未導入）。
   277	  - `scripts/check-model-ids.mjs`: CLI 契約は Interfaces の表。走査の候補は
   278	    `git ls-files --cached --others --exclude-standard`（ADR-6）。検出は allowlist の全 ID と、プロバイダ
   279	    命名形式の正規表現（OpenAI: `gpt-<数字>`・`gpt-oss-`・`o<数字>` 系・`chatgpt-`、Anthropic:
   280	    `claude-<ファミリーまたは数字>`、Google: `gemini-<数字>`・`gemma-<数字>`、Ollama: 代表的な
   281	    ライブラリ名 + 数字またはタグ）。正規表現は**自分自身のソースに一致しない書き方**にし、スクリプト自身を
   282	    除外しない。
   283	- **Owns**: モデル ID の値、走査対象と除外の規則、検出パターン。
   284	- **Does NOT own**: `AI_PROVIDER` / `AI_MODEL` の Zod 検証とプロバイダ生成（段 006 の `model.ts`）、
   285	  タスク登録（C3）、フック登録（C9）。
   286	- **Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
   287	
   288	### C9 GitHooks
   289	
   290	- **Responsibility**: commit と push の時点で、verify / security と同じ判定基準の検査を自動で実行し、
   291	  ツール不在を成功扱いにしない。
   292	- **Public interface**: `lefthook.yml`（Interfaces の表）。先頭に `assert_lefthook_installed: true`
   293	  （ADR-3）。pre-commit は `parallel: true`、pre-push は `piped: true`。
   294	  `scripts/check-commit-msg.mjs <msg-file>`（ADR-8、CLI 契約は Interfaces）。
   295	- **Owns**: フックとジョブの構成、commit メッセージの規則。
   296	- **Does NOT own**: 各検査の中身（C3・C4・C8 のタスク）、フック設定の自動検査（C12 の
   297	  `hooks-config.test.ts`）、秘密値 commit の受け入れテスト（C10）。
   298	- **Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   299	
   300	### C10 SecretCommitTest
   301	
   302	- **Responsibility**: 秘密値を含む commit がフックの secrets ジョブで拒否されることを、オフラインの
   303	  自動テストで確かめる（段 1 の合格条件）。
   304	- **Public interface**: `tests/unit/gitleaks-pre-commit.test.ts`。
   305	  1. `lefthook dump --format=json` から `pre-commit.jobs[name="secrets"].run` を取り、空白で分割した argv の
   306	     先頭が `gitleaks` であること、シェルのメタ文字を含まないことを確かめる（8.3、I-5）。
   307	  2. `useTempGitRepo()` で一時リポジトリを作り、`crypto.randomBytes` から組み立てた偽キー（gitleaks の
   308	     既定ルールが検出する形。prefix は文字列連結で組み、検出される形のリテラルをソースに置かない）を
   309	     ファイルに書いて stage し、取得した argv で gitleaks を実行して非 0 を確かめる（8.1、8.4）。
   310	  3. 出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）。
   311	  4. 秘密値なしのファイルだけを stage して同じ argv で実行し、0 を確かめる（8.2）。
   312	  5. フック経由の確認: dump から secrets ジョブだけを抜き出した `lefthook.json`（lefthook 2.2.2 が読むことを
   313	     実測）を一時リポジトリに置いて `lefthook install` し、次を確かめる（段 1 の合格条件「フックで拒否
   314	     される」、7.3）。
   315	     - 偽キーを含む `git commit` → 非 0、commit が作られていない（`git rev-parse --verify HEAD` が失敗するか
   316	       HEAD が変わらない）、出力に gitleaks の検出（`RuleID`）があり偽キーの値を含まない。
   317	     - 秘密値なしの `git commit` → 0、HEAD が新しい commit を指す（対照。identity は `isolatedEnv()` の固定値）。
   318	  6. 設定の一致（8.5）: リポジトリのルートに gitleaks の設定ファイル（`.gitleaks.toml`、`.gitleaksignore`）が
   319	     **ない**ことを確かめる。一時リポジトリの gitleaks は既定の設定で動くため、リポジトリ側に設定があると
   320	     フックとテストで検出規則がずれる。設定が必要になった段は、その plan でテストへのコピー方法を決める。
   321	  子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）。`gitleaks:allow`
   322	  のインライン除外コメントは、secrets ジョブと `check:secrets` の `--ignore-gitleaks-allow` で無効にする
   323	  （8.5 を機械的に守らせる）。
   324	- **Owns**: 偽キーの生成規則と、このテストの判定。
   325	- **Does NOT own**: secrets ジョブの定義（C9）、一時リポジトリと環境の扱い（C6 の `sandbox.ts`）。
   326	- **Requirements**: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 7.3
   327	
   328	### C11 PlaceholderApp
   329	
   330	- **Responsibility**: 段 1 でも verify と pre-push の E2E が空振りしないよう、AI を呼ばない最小のページを
   331	  提供する。
   332	- **Public interface**:
   333	  - `src/app/layout.tsx`: `<html lang="ja">` のルートレイアウトと `metadata`。`next/font/google` など
   334	    ネットワークを使う機能を使わない。
   335	  - `src/app/page.tsx`: RSC。`<h1>` に `genai-lab-ts`、本文に段 1 の案内。`"use client"`、AI SDK、
   336	    `process.env` の参照を含まない。
   337	  - `tests/e2e/placeholder.smoke.spec.ts`: `@smoke` タグ。`/` を開き、レベル 1 の見出し `genai-lab-ts`
   338	    が表示されることを確かめる。`tests/e2e/fixtures.ts` から import する。
   339	- **Owns**: プレースホルダーの表示内容。
   340	- **Does NOT own**: チャット UI と `/api/chat`（段 003）、E2E の実行規則（C7）。
   341	- **Requirements**: 9.1, 9.2, 9.3
   342	
   343	### C12 GateSelfChecks
   344	
   345	- **Responsibility**: ゲートそのもの（0 件実行、未モック通信、モデル ID 検査、フック構成、commit-msg、
   346	  文書の参照）が壊れたら落ちる自己検査を提供する。
   347	- **Public interface**（すべて版番号を期待値にしない。9.9）:
   348	  - `tests/unit/network-guard.test.ts`: `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の
   349	    `vitest run` を 2 回起動する。fixture 設定は実設定を `mergeConfig` で引き継ぐが、`mergeConfig` は配列を
   350	    **連結**する（vite 8.3.8 で実測）ため、`test.include` はマージ後に
   351	    `["tests/fixtures/gate/*.fixture.ts"]` を**代入して置き換える**（連結のままだと本体の
   352	    `tests/unit/**/*.test.ts` が残り、このテスト自身を入れ子で再帰起動する）。各実行では、実行された
   353	    テストファイルが指定した fixture 1 件だけであることを出力から確かめる。(a) `unmocked-network.fixture.ts`
   354	    （`fetch` と `net.connect` を呼び、例外を握りつぶす）→ `expectGateFailure`（出力に `UnmockedNetworkError`）。
   355	    (b) `no-network.fixture.ts` → `expectGateSuccess`（対照。失敗の原因がガードであることを示す）（3.10、9.5）。
   356	  - `tests/unit/gate-self-check.test.ts`: 0 件の検査を、ランナーを直接呼ばずに **`mise.toml` の `test` /
   357	    `e2e` タスクの `run`**（`mise tasks ls --json` から取得。要素は文字列または `{ task }` で、型ガードで絞る）の
   358	    argv に引数を足して実行する（タスクに `--passWithNoTests` などが足されたら、この検査が落ちる）。
   359	    入れ子の Vitest は `--maxWorkers=1`。すべて `expectGateFailure`（失敗の理由を出力で確かめる）と、
   360	    対照の `expectGateSuccess` をそれぞれ併置する。
   361	    - Vitest: (a) `test` の argv + どのファイルにも一致しないフィルタ → 失敗、出力に `No test files found`
   362	      （ファイル 0 件。3.8）。(b) `test` の argv + `--config tests/fixtures/gate/vitest.fixture.config.ts` +
   363	      `tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけを持つ）→ 失敗、出力に `no tests were executed`
   364	      （実行 0 件。reporter だけが止める。I-15）。`it.skip` だけの fixture は置かない（リポジトリの Biome
   365	      `noSkippedTests` に検出され、`biome-ignore` や lint の対象外で逃がすと 3.8 の静的ガードを弱めるため。
   366	      `it.skip` のみの実行を reporter が止めることは I-15 の実測で確かめた）。対照は `network-guard.test.ts` の (b)（実行 1 件以上で 0）。
   367	    - Playwright: 入れ子実行は専用の設定 `tests/fixtures/gate/e2e/playwright.fixture.config.ts` を使う。
   368	      `testDir` は `tests/fixtures/gate/e2e`、`testMatch` は `**/*.fixture.ts`、`webServer` なし、`reporter` は
   369	      本物の `tests/e2e/reporters/require-executed-tests.ts` を読み込む（reporter だけを実物にし、設定の取り違えを
   370	      避ける）。`e2e` の argv の `--config` をこの設定に置き換えて実行する。
   371	      (c) `all-skip.fixture.ts`（`@smoke` の 1 件が `test.info().skip(true, …)` で skip する）→ 失敗、出力に
   372	      `no tests were executed`（3.9。reporter なしでは exit 0 になる。I-15）。対照 `one-pass.fixture.ts`（`@smoke`
   373	      の 1 件が通る）→ 成功。`--grep` の対象は `@smoke` のまま（`e2e` タスクの argv どおり）。
   374	      (d) `e2e` の argv（本物の設定）+ `--list` + `--reporter=list` + `--grep <一致しないタグ>` → 失敗、出力に
   375	      `No tests found`（3.9。`--list` は webServer を起動せず、0 件で exit 1 になる。I-15）。対照: 同じ argv で
   376	      `--grep @smoke` → 成功し、出力に `network-guard` と `placeholder` の `@smoke` テストが並ぶ（`--reporter=list`
   377	      を付けるのは、設定の reporter が `--list` でも実行 0 件として失敗するため）。
   378	  - `tests/unit/check-model-ids.test.ts`: 一時リポジトリに入力を置いて CLI を実行する。ID は allowlist を
   379	    import して、または命名形式に一致する文字列を実行時に連結して作る。ケース: 直書きなし → 0（6.7）、
   380	    走査対象の種類ごと（`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の
   381	    allowlist ID → 1 と `path:line`（6.3、6.5）、未登録で命名形式に一致 → 1（6.4）、allowlist ファイル内
   382	    → 0（6.1）、`tests/fixtures/**` 内 → 0（6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外
   383	    （`specs/`）→ 0、git リポジトリでない root → 2（9.4）。
   384	  - `tests/unit/hooks-config.test.ts`: `lefthook dump --format=json` と `mise tasks ls --json` を読む。
   385	    `assert_lefthook_installed` が真（7.7）、pre-commit が並列で 4 ジョブ（7.2）、commit-msg ジョブがある
   386	    （7.4）、pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
   387	    （7.5、7.6）、`mise run <task>` で参照するタスクがすべて実在する（7.8）、secrets ジョブが
   388	    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含み `security:audit` が `--audit-level=high` を
   389	    含む（7.8、8.5）。
   390	    タスク側: `check`・`test`・`e2e`・`check:model-ids` が実在し（3.4）、`verify` の別名に `gate` があり
   391	    （3.3）、`verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
   392	    この順で**過不足なく**参照し（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）、
   393	    `security` が `security:osv` → `security:audit` をこの順で過不足なく参照する（4.1）。`check:secrets` が
   394	    `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。`test` / `e2e` の `run` が
   395	    結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、
   396	    `--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
   397	    CI 側: `ci.yml` の `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が
   398	    `mise run verify` を含む（文字列の検査。10.1、10.3）。
   399	    フックの実行（7.1、7.7、I-4）: 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフック
   400	    ファイルができる（7.1）。続けて 2 つのケースを確かめる。lefthook は stage されたファイルがないと
   401	    ジョブを skip して exit 0 になる（実測）ため、どちらもファイルを stage してから実行する。
   402	    1. ジョブのツールが見つからない: `isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で pre-commit
   403	       フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える。round 1 の実測）、`spawnError` なし、
   404	       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ staged
   405	       ファイルを、既定の `isolatedEnv()`（ツールが PATH にある）で実行 → 0。ツール不在でなく別の理由で
   406	       落ちているのを、この対照で除く。
   407	    2. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
   408	       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
   409	       `Can't find lefthook in PATH`（`expectGateFailure`）。対照として
   410	       `assert_lefthook_installed: false` にした設定で同じ操作 → 0（lefthook 2.2.2 で実測: true は exit 1、
   411	       false は exit 0）。`LEFTHOOK_BIN` を偽のパスにする方法は、この分岐を通らず 127 で終わる（実測）ので
   412	       使わない。
   413	  - `tests/unit/check-commit-msg.test.ts`: 正しい形式（type、scope、`!`）→ 0、type 不明・コロンなし・
   414	    件名が空 → 1、`Merge …` / `fixup! …` → 0、コメント行の無視（7.4）。
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。
   431	  - `tests/unit/static-analysis.test.ts`（2.4、2.5 の自動化。設定の後退を検出する）: 一時リポジトリに
   432	    実際の `biome.json`・`tsconfig.json`・`.gitignore` をコピーし、`node_modules` はリポジトリのものへの
   433	    シンボリックリンクにする。違反ファイルを、実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に
   434	    置く。
   435	    - Biome（`resolveTool` で解決した bin。`isolatedEnv()` で実行する）: 明示的な `any`、未使用の変数、
   436	      未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` → `expectGateFailure`、出力に
   437	      `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`（2.4、3.8、3.9。Biome 2.6.8 で
   438	      `it.skip` / `describe.skip` / 本体内の `test.skip` が `noSkippedTests` で検出されることを実測。I-15）。
   439	      `it.todo` と `test.info().skip(…)` は検出されない（実測）ので、ここでは「通る」側のケースとして置き、
   440	      その実行 0 件は reporter（C6・C7）が止めることを `gate-self-check.test.ts` が確かめる。`--stdin-file-path` は `files.includes` を迂回する（Biome の公式ドキュメント）ので使わない。
   441	    - `tsc --noEmit -p`: `src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方のファイルのパス（2.5）。
   442	    - 対照: 違反のないファイルだけ → どちらも `expectGateSuccess`。
   443	    TS 7.1 beta がシンボリックリンクの `node_modules` を解決できない場合は、一時ディレクトリへのコピーに
   444	    切り替え、理由を R-10 に記録する。
   445	  - `tests/unit/docs-structure.test.ts`: `docs/stages/*.md` が「読む → 動かす → 改造する → テストで合格を
   446	    確かめる」の順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。
   447	    `docs/node27/*.md` が 5 つの見出しを持つ（11.5）。
   448	  - `tests/e2e/network-guard.smoke.spec.ts`: `@smoke`。`test.fail()` は**使わない**（失敗の原因を区別せず、
   449	    `page.goto` の失敗など無関係な失敗でも合格になるため）。`test.use({ failOnBlockedRequest: false })` で
   450	    teardown の失敗を止め、`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。
   451	    本文で次の 2 点を assert する: (a) fixture の `blockedRequests` に、その URL が 1 件記録されている、
   452	    (b) ページ内の `fetch` が失敗した（ブラウザまで届いていない）。ガードが壊れると (a) が失敗する
   453	    （3.11、9.6）。
   454	  - 既定の `failOnBlockedRequest: true` で teardown が失敗する経路（3.11 の主経路。上のスモークは
   455	    `failOnBlockedRequest: false` で teardown を止めるので、この経路は通らない）も自動テストにする。
   456	    `tests/unit/gate-self-check.test.ts` に、入れ子の Playwright 実行を 1 つ足す（上の
   457	    `playwright.fixture.config.ts` を使う。`webServer` なしで、本物の `tests/e2e/fixtures.ts` の auto fixture を
   458	    通す）。入力は `tests/fixtures/gate/e2e/external-request.fixture.ts`: `tests/e2e/fixtures.ts` から `test` を
   459	    import し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画する。
   460	    (e) → 失敗、出力に fixture の teardown のメッセージ（遮断した URL の origin。クエリは含まない）。
   461	    対照 `no-external-request.fixture.ts`（外部要求なし）→ 成功。
   462	    **未実測の前提**: `webServer` なしの `about:blank` + `page.setContent` から出す外部要求を、`context.route`
   463	    が捕まえること。実装時に R-9 で確かめる。成り立たない場合は、この経路を R-10 の記録だけに戻さず、
   464	    入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）を
   465	    足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いてユーザーに
   466	    確認する（3.11 の主経路を記録だけにする決定は、本 plan では行わない）。
   467	    ブラウザが使えない環境（未 install）では、スキップせず原因を示して失敗する（C6 の方針）。入れ子実行が
   468	    5 秒を超える場合は R-11 に記録して timeout を見直す。
   469	  - 入れ子実行の入力:
   470	    - Vitest: `tests/fixtures/gate/vitest.fixture.config.ts`、`tests/fixtures/gate/unmocked-network.fixture.ts`、
   471	      `tests/fixtures/gate/no-network.fixture.ts`、`tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけ。
   472	      Biome の `noSkippedTests` は `todo` を対象にしないので、リポジトリの lint は通る。実測）。
   473	    - Playwright: `tests/fixtures/gate/e2e/playwright.fixture.config.ts`、`all-skip.fixture.ts`、`one-pass.fixture.ts`、
   474	      `external-request.fixture.ts`、`no-external-request.fixture.ts`。skip は `test.info().skip(true, …)` で書く
   475	      （本体内の `test.skip(…)` は Biome が検出するため。実測）。
   476	    - ファイル名は本体の `include`（`*.test.ts`）と Playwright の本体 `testDir`（`tests/e2e`）に一致させない。
   477	      Vitest の fixture は `tests/fixtures/gate/` 直下、Playwright の fixture は `tests/fixtures/gate/e2e/` に分ける
   478	      （`testMatch: "**/*.fixture.ts"` が互いの fixture を拾わないように）。
   479	  - 子プロセスを使うテストファイル（`network-guard`、`gate-self-check`、`gitleaks-pre-commit`、
   480	    `hooks-config`、`check-model-ids`、`static-analysis`、`repo-policy`、`sandbox`）は
   481	    `describe(…, { timeout })` で timeout を明示する（C6）。
   482	- **Owns**: 自己検査の判定と、非空虚の確認手順（research.md R-10）。
   483	- **Does NOT own**: 検査対象の設定そのもの（C2〜C9）。
   484	- **Requirements**: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4,
   485	  3.6, 3.8, 3.9, 3.12, 4.1, 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 8.5, 10.1, 10.3, 10.8, 10.10, 11.1, 11.5, 13.1,
   486	  13.2, 13.5, 13.6
   487	
   488	### C13 CIWorkflows
   489	
   490	- **Responsibility**: フックを回避した変更も同じタスクで止め、依存と Actions の更新候補を週次で受け取る。
   491	- **Public interface**:
   492	  - `.github/workflows/ci.yml`: トリガー `push`（`main`、`exp/**`）、`pull_request`、週次 `schedule`、
   493	    `workflow_dispatch`。最上位 `permissions: {}`、各ジョブ `permissions: { contents: read }`。
   494	    - `verify`（必須チェック名）: `if: github.event_name != 'schedule'`、`runs-on: ubuntu-24.04`。
   495	      checkout（SHA 固定、`fetch-depth: 0`、`persist-credentials: false`）→ mise-action（SHA 固定、mise
   496	      本体の版も exact 指定）→ `pnpm install --frozen-lockfile` → `mise run runtime`（`pnpm exec tsc` /
   497	      `next` を呼ぶため install の後）→
   498	      `pnpm exec playwright install --with-deps chromium` → `mise run verify` → `mise run security` →
   499	      `git status --porcelain` が空であることの確認（verify が追跡ファイルを書き換えないこと。I-11）。
   500	    - `verify-node27`: `continue-on-error: true`、`env: { MISE_ENV: node27 }`。security を除く同じ手順。
   501	  - `.github/workflows/security-daily.yml`: 毎日の `schedule` と `workflow_dispatch`。checkout → mise-action →
   502	    `mise run security`。lockfile だけで動くかを実装時に確かめ、`node_modules` が要る場合は
   503	    `pnpm install --frozen-lockfile` を足す。失敗はワークフローの失敗として GitHub の通知に乗る。
   504	  - `.github/dependabot.yml`: `npm` と `github-actions`（いずれも `directory: "/"`、`schedule.interval: weekly`、
   505	    `cooldown.default-days: 1`、`commit-message.prefix: "build"` + `include: "scope"` で `build(deps):`）。
   506	    npm は 1 つのグループにまとめる（plan §2.1 の週 1 回まとめて上げる）。
   507	  - リポジトリ設定（ファイル外）: ruleset `protect-main` を有効にし、`required_status_checks` に `verify`
   508	    を加える（I-13）。実装時に差分を示し、ユーザーの確認を得てから適用する。
   509	- **Owns**: CI のジョブ構成、権限、Actions の SHA、Dependabot の設定、必須チェックの指定。
   510	- **Does NOT own**: 検査の中身（C3・C4）、AI プロバイダの secret（参照しない）。
   511	- **Requirements**: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12
   512	
   513	### C14 Node27Lane
   514	
   515	- **Responsibility**: 既定レーンを壊さずに Node 27 alpha で同じ検査を実行し、結果を失敗も含めて残す。
   516	- **Public interface**:
   517	  - `mise.node27.toml`: `[tools] node = "<24h を満たす最新の 27 alpha>"` だけ。`[settings] prereleases = true`
   518	    は install に必要だった場合だけ書き、理由を R-8 に記録する（I-3）。
   519	  - CI の `verify-node27`（C13 が持つ）。
   520	  - `docs/node27/<YYYY-MM-DD>-initial-lane.md`: 見出し「結論 / 検証した版 / 通したゲート / 未解決事項 /
   521	    再現手順」。verify が失敗した場合は、失敗した検査と出力の要点を「未解決事項」に書く。
   522	  - README の Node 27 節: `git worktree add --detach ../genai-lab-ts-node27 HEAD` で別 worktree を作り、
   523	    `MISE_ENV=node27` で `mise install` → `pnpm install --frozen-lockfile` → `mise run verify` を実行し、
   524	    終了後に `git worktree remove` する手順。フックは worktree 間で共有されるため再 install しない。
   525	- **Owns**: Node 27 の版、初回記録、worktree 手順。
   526	- **Does NOT own**: `exp/node27` ブランチ（必要になった時点の別作業）、Node 27 で verify が緑になること。
   527	- **Requirements**: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
   528	
   529	### C15 ZipVerification
   530	
   531	- **Responsibility**: ZIP ガイドの未検証項目（plan §8 の 5 項目）を実測で確定し、段 003〜006 の入力として
   532	  research.md に残す。
   533	- **Public interface**（手順。成果物は research.md だけ）:
   534	  1. リポジトリ外の一時ディレクトリに ZIP を展開する。
   535	  2. `package.json` の dist-tag と範囲を、C1 と同じ版（共有する依存）と、24h を満たす最新の exact 版
   536	     （AI SDK、プロバイダ、Zod、`@vitejs/plugin-react`）に置き換える。`pnpm-workspace.yaml` は C1 と同じ
   537	     規則にする（`minimumReleaseAgeExclude` なし）。
   538	  3. `pnpm install` → peer 警告の記録（R-2、plan §8 の 3 項目目）。
   539	  4. `pnpm exec tsc --noEmit` → ファイルごとの型エラーと AI SDK 7 の実際の型との差異（12.2）。
   540	  5. `node_modules/ai` の型定義で `toolApproval`、`isStepCount`、`toUIMessageStream`、
   541	     `createUIMessageStreamResponse`、`convertToModelMessages`、`ToolLoopAgent`、`Output`、
   542	     `MockLanguageModelV4`（`ai/test`）、content の `tool-approval-request` 型の有無を API ごとに照合（12.3、
   543	     plan §8 の 2 項目目）。
   544	  6. `pnpm exec vitest run` と `pnpm exec playwright test --grep @smoke` → SSE モックが `useChat` で
   545	     解釈されたか（12.4、plan §8 の 4 項目目）。
   546	  7. 一時ディレクトリを削除する。ZIP のコードとテストは `src/` / `tests/` に入れない（12.7）。
   547	  あわせて、リポジトリ側で `MISE_ENV=node27 mise install`（R-8、plan §8 の 1 項目目）と TypeScript 7.1 の
   548	  RC / stable の公開状況（R-7、12.5 / 12.6、plan §8 の 5 項目目）を確認する。
   549	- **Owns**: research.md の R-1〜R-11 の記録。
   550	- **Does NOT own**: ZIP のアプリコードの修正と実装（段 003〜006）。
   551	- **Requirements**: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 1.3, 1.9, 6.2, 11.3
   552	
   553	### C16 DocsAndGovernance
   554	
   555	- **Responsibility**: 学習者向けの解説と README、統治文書と計画の記述を、本 spec の決定と取り込んだ実際の
   556	  構成に一致させる。
   557	- **Public interface**:
   558	  - `docs/stages/1-dev-environment-and-gates.md`: 節「読む / 動かす / 改造する / テストで合格を確かめる」。
   559	    合格条件ごとの判定テストのパス（オフライン verify → `tests/unit/network-guard.test.ts`・
   560	    `tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`、秘密値 commit の拒否 →
   561	    `tests/unit/gitleaks-pre-commit.test.ts`・`tests/unit/hooks-config.test.ts`）。
   562	  - `README.md`: mise の有効化（`mise activate`）、`mise trust && mise install`、`mise run setup`、
   563	    `mise run verify`、mise を有効にしていない Git クライアントではフックが失敗すること、コマンド一覧、
   564	    Node 27 の worktree 手順（C14）、統治文書へのリンク。
   565	  - `.env.example`: 変数名だけ（`AI_PROVIDER=`、`AI_MODEL=`、各 API キー、`OLLAMA_BASE_URL=`）。値を書かない。
   566	  - `.gitignore`: 既存の `.env` / `.env.*`（`!.env.example`）/ `.next` / Playwright 成果物に加えて、
   567	    `next-env.d.ts`、`mise.local.toml`、`mise.*.local.toml`、`.vitest/`、`.build/`（I-4 の副作用）。
   568	  - `.sdd/memory/constitution.md`: 原則 3 の MINOR 改訂（1.0.0 → 1.1.0）、Sync Impact Report、改訂履歴。
   569	  - `AGENTS.md`: コマンド表を実在するタスクと一致させ、"Current state" を段 1 完了後に更新する。
   570	  - `.sdd/steering/tech.md`（Gate command、Supply Chain の gitleaks の置き場）、`structure.md`（状態注記、
   571	    `tests/unit/setup/`・`tests/unit/helpers/`・`tests/fixtures/` の役割）、`product.md`（状態注記）。
   572	  - `specs/000-development-plan/plan.md`: §4（gitleaks 全履歴は verify に移る）、§7 M1（`exp/node27` は
   573	    必要時に作る）、§8.5（`src/` / `tests/` は基盤のみ、`gate` 別名、ADR-4 の依存の扱い）、
   574	    Constitution Compliance 節（憲章が制定済みであること）に、本 spec の Clarifications を参照する改訂注記。
   575	  - 文書中の版番号は「確認日つきの参考値」と明記し、合否の条件にしない。
   576	- **Owns**: 解説、README、統治文書と計画の記述の整合。
   577	- **Does NOT own**: 文書構造の自動検査（C12 の `docs-structure.test.ts`）、research.md（C15）。
   578	- **Requirements**: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 13.12, 11.7
   579	
   580	## Data Model
   581	
   582	段 1 は永続データを持たない。以下は、設定とテストの間で受け渡す型である。外部ツールの JSON 出力は
   583	`unknown` として受け、型ガードで絞ってから使う（`any` と根拠のない型アサーションを使わない。憲章 原則 7）。
   584	
   585	```mermaid
   586	erDiagram
   587	  PROVIDER ||--|{ MODEL_ID : "MODEL_ALLOWLIST"
   588	  SCANNED_FILE ||--o{ MODEL_ID_FINDING : "check:model-ids"
   589	  MODEL_ID ||--o{ MODEL_ID_FINDING : "source = allowlist"
   590	  LEFTHOOK_JOB }o--o| MISE_TASK : "run = mise run <task>"
   591	  TEST ||--o{ NETWORK_VIOLATION : "guard records"
   592	```
   593	
   594	| Entity | Field | Type | Notes |
   595	|--------|-------|------|-------|
   596	| `Provider` | — | `(typeof PROVIDERS)[number]` | `"openai" \| "anthropic" \| "google" \| "ollama"` |
   597	| `MODEL_ALLOWLIST` | `[P in Provider]` | `readonly string[]`（`as const`） | 唯一の定義（6.1）。値は R-5 で確認 |
   598	| `AllowedModelId<P>` | — | `(typeof MODEL_ALLOWLIST)[P][number]` | 段 006 の Zod 検証が使う |
   599	| `ModelIdFinding` | `path` | `string` | root からの相対パス（POSIX 区切り） |
   600	| | `line` / `column` | `number` | 1 始まり |
   601	| | `match` | `string` | 一致した文字列（モデル ID は秘密値ではない） |
   602	| | `source` | `"allowlist"` または `` `pattern:${string}` ``（テンプレートリテラル型） | 検出の根拠（6.4 の区別） |
   603	| `CommandResult` | `status` | `number \| null` | `spawnSync` の終了コード。シグナル終了は `null` |
   604	| | `signal` | `NodeJS.Signals \| null` | |
   605	| | `stdout` / `stderr` | `string` | UTF-8 |
   606	| `LefthookDump`（部分） | `assert_lefthook_installed` | `boolean \| undefined` | `lefthook dump --format=json` |
   607	| | `"pre-commit" \| "commit-msg" \| "pre-push"` | `HookConfig \| undefined` | |
   608	| `HookConfig` | `parallel` / `piped` | `boolean \| undefined` | |
   609	| | `jobs` | `ReadonlyArray<{ name: string; run: string }>` | |
   610	| `MiseTaskRunItem` | — | `string \| { task: string }` | `run` の 1 要素。`{ task = "check" }` は `{"task":"check"}` になる。型ガード `isTaskRef(item)` で絞る（実測。I-16） |
   611	| `MiseTaskInfo`（部分） | `name` / `aliases` / `run` | `string` / `readonly string[]` / `ReadonlyArray<MiseTaskRunItem>` | `mise tasks ls --json`。単一の文字列の `run` も配列で返る（実測。I-16） |
   612	| `NetworkViolation`（unit） | `kind` / `target` | `"socket" \| "fetch"` / `string` | ガードが記録し `afterEach` で検査 |
   613	| `ExternalRequestViolation`（E2E） | `method` / `url` | `string` / `string` | fixture が記録し teardown で検査 |
   614	
   615	## Interfaces / Contracts
   616	
   617	### mise タスク（`mise.toml`）
   618	
   619	すべてのタスクは `description` を持つ。`verify` と `security` の構成要素は直列で、最初の失敗で止まる（I-3）。
   620	
   621	| Task | 実行内容 | ネットワーク | 呼び出し元 | Req |
   622	|------|----------|--------------|------------|-----|
   623	| `check` | `pnpm exec biome check .` | 不要 | verify | 2.4, 3.4 |
   624	| `typecheck` | `pnpm exec next typegen` → `pnpm exec tsc --noEmit` | 不要 | verify、pre-commit | 2.5 |
   625	| `check:model-ids` | `node scripts/check-model-ids.mjs` | 不要 | verify、pre-commit | 6.3 |
   626	| `check:secrets` | `gitleaks git --redact --ignore-gitleaks-allow --verbose --log-opts=HEAD`（HEAD から到達できる全履歴。既定の `--all` は別ブランチ・stash も走査し 3.7 を崩す） | 不要 | verify | 3.12 |
   627	| `test` | `pnpm exec vitest run` | 不要 | verify、pre-push | 3.4 |
   628	| `e2e` | `pnpm exec playwright test --grep @smoke` | 不要 | verify、pre-push | 3.4 |
   629	| `verify`（`alias = "gate"`） | `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` | 不要 | 開発者、CI | 3.1〜3.3 |
   630	| `security:osv` | `osv-scanner scan source --lockfile=pnpm-lock.yaml` | 必要 | security、pre-push | 4.3 |
   631	| `security:audit` | `pnpm audit --audit-level=high` | 必要 | security、pre-push | 4.2 |
   632	| `security` | `security:osv` → `security:audit` | 必要 | CI、security-daily | 4.1 |
   633	| `runtime` | 7 種の版の出力（C5） | 不要 | CI のログ | 5.1, 5.2 |
   634	| `outdated` | `mise outdated` → `pnpm outdated`（候補ありで exit 1） | 必要 | 週次の手作業 | 5.3, 5.4 |
   635	| `setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3 |
   636	
   637	### lefthook ジョブ（`lefthook.yml`）
   638	
   639	| Hook | 実行方式 | Job name | run | Req |
   640	|------|----------|----------|-----|-----|
   641	| （全体） | — | — | `assert_lefthook_installed: true` | 7.7 |
   642	| pre-commit | `parallel: true` | `secrets` | `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose` | 7.2, 8.3, 8.5 |
   643	| | | `biome` | `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true` | 7.2 |
   644	| | | `typecheck` | `mise run typecheck` | 7.2, 7.8 |
   645	| | | `model-ids` | `mise run check:model-ids` | 7.2, 7.8 |
   646	| commit-msg | — | `conventional` | `node scripts/check-commit-msg.mjs {1}` | 7.4 |
   647	| pre-push | `piped: true` | `osv-scanner` | `mise run security:osv` | 7.5, 7.8 |
   648	| | | `pnpm-audit` | `mise run security:audit` | 7.5, 7.8 |
   649	| | | `unit-tests` | `mise run test` | 7.5, 7.8 |
   650	| | | `e2e-smoke` | `mise run e2e` | 7.5, 7.8 |
   651	
   652	pre-commit の typecheck は glob で絞らない（`tsconfig.json` や `package.json` だけの変更でも型は変わりうる）。
   653	
   654	### CLI: `scripts/check-model-ids.mjs`
   655	
   656	| 項目 | 契約 |
   657	|------|------|
   658	| 引数 | `[--root <dir>]`。省略時は `process.cwd()`。それ以外の引数は使い方の誤り |
   659	| 走査候補 | `git -C <root> ls-files --cached --others --exclude-standard -z` |
   660	| 走査対象（6.5） | `src/**`、`scripts/**`、`tests/**`、`docs/**`、`.github/**`、`README.md`、`.env.example`、ルート直下の `*.{ts,mts,cts,js,mjs,cjs,json,jsonc,yaml,yml,toml}` |
   661	| 除外 | `src/lib/ai/model-allowlist.ts`（6.1）、`tests/fixtures/**`（6.6）、`pnpm-lock.yaml`、NUL バイトを含むファイル |
   662	| 検出 | allowlist の全 ID（単語境界つきの完全一致）と、プロバイダ命名形式の正規表現（C8） |
   663	| exit 0 | 検出 0 件。stdout に走査ファイル数と 0 件の要約（6.7） |
   664	| exit 1 | 検出 1 件以上。stderr に 1 件 1 行で `<path>:<line>:<column>: <match> (<source>)`（6.3） |
   665	| exit 2 | 使い方の誤り、git の失敗（root が git リポジトリでない等）、allowlist の読み込み失敗。0 にしない |
   666	
   667	### CLI: `scripts/check-commit-msg.mjs`
   668	
   669	| 項目 | 契約 |
   670	|------|------|
   671	| 引数 | `<msg-file>`（lefthook の `{1}`） |
   672	| 判定対象 | `#` で始まる行と空行を除いた最初の行 |
   673	| 合格 | `^(build\|chore\|ci\|docs\|feat\|fix\|perf\|refactor\|revert\|style\|test)(\([^()\s]+\))?!?: \S` に一致、または `Merge `・`Revert "`・`fixup! `・`squash! `・`amend! ` で始まる |
   674	| exit 0 / 1 / 2 | 合格 / 不合格（期待する形式と例を stderr に出す）/ 引数なし・読めない |
   675	
   676	### unit の通信ガード（`tests/unit/setup/network-guard.ts`）
   677	
   678	- `net.Socket.prototype.connect` と `globalThis.fetch` を置き換える。ローカルホスト・UNIX ソケットを含め
   679	  例外なく遮断する。
   680	- 呼ばれたら `UnmockedNetworkError`（`name` が固定のエラー）を投げ、違反を記録する。メッセージには接続先の
   681	  ホストとポート（または URL のオリジン）だけを含め、クエリやヘッダーは含めない。
   682	- `afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする。
   683	
   684	### E2E fixture（`tests/e2e/fixtures.ts`）
   685	
   686	- `export const test`（`@playwright/test` の `test.extend` に auto fixture `networkGuard` を加えたもの）、
   687	  `export { expect }`。
   688	- 許可: `baseURL` と同じオリジン。`data:` / `blob:` は route の対象外。
   689	- 遮断: それ以外のオリジンを `route.abort("blockedbyclient")` し、`{ method, url }` を記録する。
   690	- 公開: `blockedRequests`（`readonly ExternalRequestViolation[]`）と option fixture
   691	  `failOnBlockedRequest: boolean`（既定 `true`）。
   692	- teardown: `failOnBlockedRequest` が真で記録が空でなければ失敗する。テスト個別の `page.route` は context の
   693	  route より優先される。
   694	
   695	### CI ジョブ
   696	
   697	| Workflow / job | トリガー | 実行 | 失敗時 | 権限 | Req |
   698	|----------------|----------|------|--------|------|-----|
   699	| `ci.yml` / `verify` | push（`main`、`exp/**`）、PR、手動 | install（frozen）→ runtime → browsers → verify → security → 作業ツリー不変の確認 | マージをブロック（ruleset の必須チェック） | `contents: read` | 10.1, 10.2, 10.6, 10.7 |
   700	| `ci.yml` / `verify-node27` | 同上 + 週次 schedule | `MISE_ENV=node27` で install → runtime → browsers → verify | `continue-on-error`（ブロックしない） | `contents: read` | 10.3, 10.4 |
   701	| `security-daily.yml` / `security` | 毎日 schedule、手動 | security | ワークフロー失敗として通知 | `contents: read` | 10.5 |
   702	
   703	共通: `uses:` はコミット SHA（タグをコメントで併記）（10.8）、checkout は `persist-credentials: false`、
   704	AI プロバイダの secret を参照しない（10.10）。
   705	
   706	### 記録の形式
   707	
   708	- Node 27 の検証記録（11.5）: `docs/node27/YYYY-MM-DD-<topic>.md`、見出し「結論 / 検証した版 / 通したゲート /
   709	  未解決事項 / 再現手順」。
   710	- 脆弱性の除外（4.5）: C4 の形式。除外ごとに advisory ID、理由、退役条件（期限または条件）。
   711	- research.md の実装時の記録（R-1〜R-11）: コマンド、結果、根拠、確認日。
   712	
   713	## File Structure Plan
   714	
   715	tasks.md の `_Boundary:_` にできるのは、この表のファイル（と表末尾のリポジトリ設定）だけである。
   716	「Commit」は未コミットのファイルを内容を変えずに本 spec の PR に含めることを表す（13.11）。
   717	
   718	| File | Create/Modify | Responsibility | Component |
   719	|------|---------------|----------------|-----------|
   720	| `mise.toml` | Create | ツールの exact pin、`[env]`、verify / security / 補助タスクを定義する | C1, C3, C4, C5 |
   721	| `mise.node27.toml` | Create | Node 27 alpha の版だけを上書きする | C14 |
   722	| `package.json` | Create | 段 1 が使う依存の exact pin、`packageManager`、`engines`、起動用 scripts を持つ | C1 |
   723	| `pnpm-workspace.yaml` | Create | 24h ゲート、`savePrefix`、`allowBuilds`（理由つき）、必要時の `overrides` / `audit.ignore` を持つ | C1, C4 |
   724	| `pnpm-lock.yaml` | Create | 依存グラフを固定する（`pnpm install` が生成） | C1 |
   725	| `osv-scanner.toml` | Create（条件付き） | 脆弱性の除外を記録する必要が生じたときだけ、除外ごとの ID・理由・退役条件を持つ | C4 |
   726	| `lefthook.yml` | Create | pre-commit / commit-msg / pre-push のジョブと `assert_lefthook_installed` を定義する | C9 |
   727	| `biome.json` | Create | lint / format の唯一の規約と E2E の import 制限を持つ | C2 |
   728	| `tsconfig.json` | Create | `strict` を含む型検査の設定を持つ | C2 |
   729	| `next.config.ts` | Create | Next.js の設定を持つ | C2 |
   730	| `vitest.config.ts` | Create | unit の対象、0 件失敗、通信ガードの setupFiles を定義する | C6 |
   731	| `playwright.config.ts` | Create | E2E の対象、リトライなし、専用ポートの webServer を定義する | C7 |
   732	| `.env.example` | Create | 将来の段が使う環境変数の名前だけを示す | C16 |
   733	| `.gitignore` | Modify | 秘密ファイル・生成物・テスト成果物・ローカル設定を追跡対象から外す | C16 |
   734	| `.github/workflows/ci.yml` | Create | verify（必須）と verify-node27（参考）のジョブを定義する | C13 |
   735	| `.github/workflows/security-daily.yml` | Create | 毎日の security タスクを定義する | C13 |
   736	| `.github/dependabot.yml` | Create | npm と Actions の週次更新提案を cooldown つきで定義する | C13 |
   737	| `src/app/layout.tsx` | Create | ルートレイアウトを RSC で提供する | C11 |
   738	| `src/app/page.tsx` | Create | AI を呼ばないプレースホルダーページを RSC で提供する | C11 |
   739	| `src/lib/ai/model-allowlist.ts` | Create | モデル ID の唯一の定義を持つ | C8 |
   740	| `scripts/check-model-ids.mjs` | Create | allowlist 外のモデル ID の直書きを検出する | C8 |
   741	| `scripts/check-commit-msg.mjs` | Create | commit メッセージの 1 行目を Conventional Commits の形式で検査する | C9 |
   742	| `tests/unit/setup/network-guard.ts` | Create | unit の未モック通信を失敗させる | C6 |
   743	| `tests/unit/helpers/sandbox.ts` | Create | 一時 git リポジトリ、ツールの絶対パス解決、隔離した環境変数（固定の偽 identity）、子プロセス実行を提供する | C6 |
   744	| `tests/unit/setup/require-executed-tests.ts` | Create | 実行 0 件（全部 todo / skip）の unit 実行を失敗させる Vitest reporter | C6 |
   745	| `tests/unit/gitleaks-pre-commit.test.ts` | Create | 秘密値を含む commit が secrets ジョブで拒否されることを確かめる | C10 |
   746	| `tests/unit/network-guard.test.ts` | Create | 未モック通信がテストを失敗させることを入れ子実行で確かめる | C12 |
   747	| `tests/unit/gate-self-check.test.ts` | Create | unit と `@smoke` の 0 件実行が失敗することを確かめる | C12 |
   748	| `tests/unit/check-model-ids.test.ts` | Create | `check:model-ids` の検出・除外・終了コードを確かめる | C12 |
   749	| `tests/unit/hooks-config.test.ts` | Create | フックの構成、タスクとの対応、ツール不在時の失敗を確かめる | C12 |
   750	| `tests/unit/check-commit-msg.test.ts` | Create | commit-msg の合否判定を確かめる | C12 |
   751	| `tests/unit/repo-policy.test.ts` | Create | 版の固定、lint / 型の規約、テストの配置、CI の固定、秘密ファイルの扱いを静的に確かめる | C12 |
   752	| `tests/unit/static-analysis.test.ts` | Create | 実際の Biome / tsc 設定が走査対象の違反で非 0 になることを確かめる（2.4、2.5） | C12 |
   753	| `tests/unit/docs-structure.test.ts` | Create | 解説の節順と参照パス、Node 27 記録の見出しを確かめる | C12 |
   754	| `tests/fixtures/gate/vitest.fixture.config.ts` | Create | 実設定を引き継ぐ入れ子実行用の Vitest 設定を持つ | C12 |
   755	| `tests/fixtures/gate/unmocked-network.fixture.ts` | Create | ガードに捕まるべき通信を行う入れ子実行の入力 | C12 |
   756	| `tests/fixtures/gate/no-network.fixture.ts` | Create | 通信しない対照の入れ子実行の入力 | C12 |
   757	| `tests/fixtures/gate/all-todo.fixture.ts` | Create | `it.todo` だけを持つ、実行 0 件の入れ子実行の入力 | C12 |
   758	| `tests/fixtures/gate/e2e/playwright.fixture.config.ts` | Create | 本物の reporter を使う入れ子の Playwright 実行用の設定（webServer なし） | C12 |
   759	| `tests/fixtures/gate/e2e/all-skip.fixture.ts` | Create | `@smoke` が `test.info().skip()` で全部 skip する入れ子実行の入力 | C12 |
   760	| `tests/fixtures/gate/e2e/one-pass.fixture.ts` | Create | `@smoke` が 1 件通る対照の入力 | C12 |
   761	| `tests/fixtures/gate/e2e/external-request.fixture.ts` | Create | 外部オリジンへ要求を出し、teardown の失敗を引き出す入力 | C12 |
   762	| `tests/fixtures/gate/e2e/no-external-request.fixture.ts` | Create | 外部要求のない対照の入力 | C12 |
   763	| `tests/unit/sandbox.test.ts` | Create | `sandbox.ts` の契約（隔離した環境で node / git / gitleaks / lefthook / pnpm が起動する、`expectGateFailure` が 127 を拒否する）を確かめる | C6 |
   764	| `tests/e2e/fixtures.ts` | Create | 外部オリジンを遮断する auto fixture つきの `test` / `expect` を提供する | C7 |
   765	| `tests/e2e/reporters/require-executed-tests.ts` | Create | 実行 0 件（全部 skip）の E2E 実行を失敗させる Playwright reporter | C7 |
   766	| `tests/e2e/placeholder.smoke.spec.ts` | Create | プレースホルダーの見出しを確かめる `@smoke` テスト | C11 |
   767	| `tests/e2e/network-guard.smoke.spec.ts` | Create | 外部オリジンへの通信が遮断・記録されることを確かめる `@smoke` テスト | C12 |
   768	| `docs/stages/1-dev-environment-and-gates.md` | Create | 段 1 の解説（読む → 動かす → 改造する → テストで合格を確かめる） | C16 |
   769	| `docs/node27/<YYYY-MM-DD>-initial-lane.md` | Create | Node 27 alpha の初回検証記録（日付は実行日） | C14 |
   770	| `README.md` | Modify | セットアップ、mise の注意、コマンド、Node 27 の worktree 手順を記す | C16, C14 |
   771	| `.sdd/memory/constitution.md` | Modify + Commit | 原則 3 を MINOR 改訂（1.1.0）し、Sync Impact Report と改訂履歴を更新する | C16 |
   772	| `.sdd/steering/tech.md` | Modify + Commit | Gate command と gitleaks の置き場を実際の構成に合わせる | C16 |
   773	| `.sdd/steering/structure.md` | Modify + Commit | 状態注記とテスト補助ディレクトリの役割を実際の構成に合わせる | C16 |
   774	| `.sdd/steering/product.md` | Modify + Commit | 状態注記を段 1 完了後に合わせる | C16 |
   775	| `AGENTS.md` | Modify + Commit | コマンド表と "Current state" を実在するタスクに合わせる | C16 |
   776	| `specs/000-development-plan/plan.md` | Modify | §4・§7 M1・§8.5・Constitution Compliance に改訂注記を入れる | C16 |
   777	| `specs/001-dev-environment-and-gates/research.md` | Modify | 実装時の記録 R-1〜R-11 を追記する | C15 |
   778	| `specs/001-dev-environment-and-gates/spec.json` | Modify | SDD のフェーズと承認状態を更新する（SDD コマンドが行う） | — |
   779	
   780	生成物でコミットしないもの: `next-env.d.ts`、`.next/`、`test-results/`、`playwright-report/`、`.vitest/`、
   781	`*.tsbuildinfo`。ZIP のアプリコードとテストは作らない（12.7）。
   782	
   783	リポジトリ設定（ファイル外、C13）: ruleset `protect-main` の有効化と必須チェック `verify` の追加。
   784	適用前にユーザーの確認を得る。
   785	
   786	実装順の制約（tasks.md への入力）:
   787	
   788	1. 最初の失敗するテストを動かすには `package.json`・`pnpm-workspace.yaml`・`pnpm-lock.yaml`・
   789	   `vitest.config.ts`・`mise.toml` の `[tools]` と `test` タスクが要る。これらはテストランナーの起動に
   790	   必要な最小限だけを先に作り、以後のゲート設定はそれを検査するテストを先に書く（憲章 原則 4）。
   791	2. `tests/unit/helpers/sandbox.ts` と `tests/unit/setup/network-guard.ts` は、子プロセスや一時リポジトリを
   792	   使う他のテストより先に用意する。
   793	3. `lefthook install` は、`lefthook.yml` と `hooks-config.test.ts` が緑になってから行う（未完成の
   794	   フックで commit が止まらないようにする）。
   795	4. ruleset の変更は、CI の `verify` ジョブが一度緑になってから行う。
   796	
   797	## Error Handling & Edge Cases
   798	
   799	**ゲートの失敗を成功に変えない**
   800	
   801	- verify / security の構成要素のどれかが非 0 → 後続を実行せず非 0（3.2、4.1、I-3）。
   802	- unit テストファイルが 0 件 → Vitest が非 0（3.8、`passWithNoTests: false`）。ファイルはあるが実行 0 件（全部
   803	  `todo` / `skip`）→ reporter `require-executed-tests.ts` が非 0 にする。`.skip` は Biome の `noSkippedTests` でも
   804	  止める。`.only` の混入 → `allowOnly: false`
   805	  で失敗（3.7 の決定論）。
   806	- `@smoke` が 0 件 → Playwright が非 0（3.9、`--pass-with-no-tests` を使わない）。一致はするが全部 skip →
   807	  reporter `require-executed-tests.ts` が `onEnd` で failed にする（reporter がなければ exit 0 になる。実測、
   808	  I-15）。この 2 つは `gate-self-check.test.ts` が実行して確かめる。
   809	- 子プロセスが ENOENT / 126 / 127 で落ちた → 「ゲートの拒否」として数えない。`expectGateFailure` が
   810	  `spawnError`、126 / 127 を拒否し、出力で失敗の理由を確かめる（`sandbox.ts`、`sandbox.test.ts`）。
   811	- `test` / `e2e` タスクに結果を緩めるフラグが足される → `hooks-config.test.ts` が検出し、0 件の自己検査も
   812	  タスクの argv を通して落ちる。
   813	- unit の未モック通信 → その場で `UnmockedNetworkError`。呼び出し側が例外を握りつぶしても `afterEach` で
   814	  失敗する（3.10）。
   815	- E2E の外部オリジンへの未モック通信 → `abort` し、teardown で失敗する（3.11）。
   816	- gitleaks の全履歴スキャンで検出 → 非 0、値は `REDACTED`（3.12、I-6）。走査は `--log-opts=HEAD` で HEAD から
   817	  到達できるコミットに限り、ローカルの別ブランチや stash で合否が変わらないようにする（3.7）。
   818	- `pnpm audit` / osv-scanner が advisory の取得先に到達できない → 非 0 のまま。
   819	  `--ignore-registry-errors` や `|| true` で包まない（4.4）。実際の終了コードは R-4 で実測する。
   820	- 修正版に上げられない脆弱性 → C4 の形式で除外を記録する。osv-scanner の `ignoreUntil` を過ぎると自動で
   821	  再び失敗する（4.5、憲章 原則 9）。
   822	- `pnpm outdated` の `exit 1` は「候補あり」を意味する。タスクは終了コードを隠さず、意味を文書化する（5.3）。
   823	- `check:model-ids` で root が git リポジトリでない、git が失敗した、allowlist を読めない → exit 2（0 にしない）。
   824	
   825	**フックとツールの不在**
   826	
   827	- lefthook 本体が見つからない → `assert_lefthook_installed: true` で exit 1（7.7、I-4）。mise で lefthook を上げて
   828	  旧版が消え、フックに埋め込まれたパスが無効になった場合がこれにあたる（`hooks-config.test.ts` のケース 2）。
   829	- lefthook は見つかるがジョブのツール（`mise`、`gitleaks`、`pnpm`、`node`）が PATH にない → ジョブが 127 で
   830	  失敗し、フックが非 0（7.3、7.7）。README に「mise を有効にしていない Git クライアントではフックが失敗する」と
   831	  書く（13.4）。
   832	- pre-push の途中で失敗 → `piped: true` で後続を実行せず push を拒否（7.6）。
   833	- `--no-verify` / `LEFTHOOK=0` による回避 → CI の `verify` が同じ検査を行う。回避は憲章の規律（環境要因の
   834	  証明、PR 本文への記録）に従う。
   835	- unit テストが gitleaks / lefthook / git を見つけられない → スキップせず、原因を示すメッセージで失敗する
   836	  （憲章 原則 3）。
   837	
   838	**テストの安全性と後始末**
   839	
   840	- フック実行中の git は `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスに渡す。pre-push で動く unit テストが
   841	  それを引き継いで一時リポジトリの git を実行すると、実リポジトリの index を操作しうる → `isolatedEnv()` で
   842	  `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` を設定する（I-6）。`GITLEAKS_CONFIG`
   843	  など設定を差し替える変数と `LEFTHOOK` / `LEFTHOOK_BIN` も除く。
   844	- テストの成否にかかわらず一時ディレクトリを削除する → `onTestFinished` で登録（8.8）。
   845	- 偽キーは実行時にだけ存在し、リポジトリのファイルにも gitleaks の出力にも残らない（8.4、8.6）。
   846	- 子プロセスにはタイムアウトを付け、ハングをテスト失敗として扱う。`runCommand` のタイムアウト（既定 30 秒）は
   847	  テストファイルの timeout（初期値 60 秒）より短くし、CI の 2 vCPU でも既定の 5 秒で緑と赤が入れ替わらない
   848	  ようにする（3.7。値は R-11 の実測で見直す）。
   849	- 一時リポジトリを cwd にすると mise の shim が `No version is set for shim` で失敗する → ツールは
   850	  `resolveTool()` でリポジトリのルートから絶対パスを解決して呼ぶ。`pnpm exec vitest run <file>` を単体で
   851	  実行した場合も同じ結果になる。
   852	- `GIT_CONFIG_GLOBAL=/dev/null` で identity が消え、Linux では `git commit` 自体が失敗する → `isolatedEnv()` が
   853	  固定の偽の identity を設定し、拒否のケースは「commit が作られていない」ことと gitleaks の検出を出力で
   854	  確かめる（拒否の原因を gitleaks に限定する）。
   855	
   856	**モデル ID 検査の誤検出と漏れ**
   857	
   858	- 開発者の `.env.local` に実際の `AI_MODEL` がある → gitignore 済みなので走査しない（ADR-6）。
   859	- テスト fixture にモデル ID が要る → `tests/fixtures/**` に置く（6.6）。unit テスト本体は allowlist を import
   860	  する。
   861	- 検出パターンのソース自体が一致する → パターンを「接頭辞の直後に正規表現の記号が来る」書き方にし、
   862	  自己検出しないことをリポジトリ全体の `check:model-ids` で常時確かめる（6.4）。
   863	- 日本語の文中の ID → JavaScript の `\b` は ASCII 基準で、日本語の文字は境界として扱われる。テストに日本語の
   864	  文脈を含める。
   865	
   866	**依存と install**
   867	
   868	- install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0
   869	  （1.5、1.8、I-8）。`allowBuilds` に理由つきで追加し、自動追記されたプレースホルダーを残さない。
   870	- 24h を満たす版がない（exact pin が新しすぎる）→ `minimumReleaseAgeStrict` により解決が失敗する
   871	  （1.3、1.4）。24h を満たす版を選び直す。
   872	- `packageManager` と mise の pnpm がずれる → pnpm が別版へ切り替えようとしてネットワークを使う →
   873	  `repo-policy.test.ts` が検出する（1.6）。
   874	- `pnpm add` が `^` を付ける → `savePrefix: ""` で exact にし、`repo-policy.test.ts` が検出する（1.2）。
   875	- Dependabot の security updates は cooldown の対象外 → 公開から 24h 未満の修正版の PR が来ても、
   876	  CI の install と憲章 原則 8 に従い 24h 経過後にマージする（10.12 の範囲は version updates）。
   877	
   878	**決定論**
   879	
   880	- `next dev` が `tsconfig.json` に値を書き足す → 取り込み時に受け入れて固定し、CI の「作業ツリー不変」で
   881	  再発を検出する（3.7、I-11）。
   882	- `tsc` の結果が直前の `next dev` の有無で変わる → `typecheck` は必ず `next typegen` を先に実行する（I-11）。
   883	- 開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで、別アプリを
   884	  検査せずに失敗として表面化する（3.7）。
   885	- 同一コミットで 3 回連続の verify → 同じ合否（R-3 に記録）。
   886	
   887	**Node 27 レーン**
   888	
   889	- `MISE_ENV=node27 mise install` が alpha を解決できない → 出力と必要だった設定、または未解決である旨を
   890	  R-8 に記録する（11.3）。
   891	- Node 27 で verify が失敗 → CI は `continue-on-error` でブロックしない（10.4）。失敗した検査と出力の要点を
   892	  `docs/node27/` の「未解決事項」に書く（11.6）。
   893	
   894	**TypeScript 7.1**
   895	
   896	- 実装時に 7.1 の RC / stable が公開から 24h 以上 → 切り替えて R-7 に記録する（12.5）。未公開または 24h 未満
   897	  → 確認日と公開状況を記録し beta を据え置く（12.6）。2026-11-22 時点は未公開（I-2）。
   898	
   899	## Constitution Compliance
   900	
   901	対象: `.sdd/memory/constitution.md` 1.0.0。
   902	
   903	| Principle | Status | Notes |
   904	|-----------|--------|-------|
   905	| 1. 入門ラボの範囲を守る | ✅ | 扱わない領域を含まない。兄弟リポジトリの本文・コードを複製しない（検証記録の見出しは plan §3.3 の形式名だけを使う） |
   906	| 2. spec・解説・実装・合格テストで完成 | ✅ | 4 点を File Structure Plan に持つ。解説の参照パスの実在は `docs-structure.test.ts` が検査する |
   907	| 3. ゲートは 1 つ・決定論・空振りしない | ⚠️ | 設計は Clarifications 2 問目に従い、ネットワークが必要な検査を `security` に分ける。現行の原則 3 は「verify がセキュリティ検査を含み、フックと CI は同じ verify を実行する」と読めるため、**同じ PR で MINOR 改訂（1.1.0）が要る**（13.7、C16）。それ以外の要求（オフライン、未モック通信の遮断、0 件で失敗、リトライなし、非空虚の記録 R-10）は満たす |
   908	| 4. テストを先に書く | ⚠️ | テストランナー自体（`package.json`・lockfile・`vitest.config.ts`・`mise.toml` の `test`）は最初の RED より前に要る。File Structure Plan の「実装順の制約」で最小限に限り、以後のゲート設定は検査テストを先に書く。tasks.md でこの順序を明示すること |
   909	| 5. モデルは注入し、ID は allowlist だけ | ✅ | `model-allowlist.ts` が唯一の定義、`check:model-ids` を verify と pre-commit で実行。段 1 は LLM を呼ばない |
   910	| 6. エージェントは止まり、承認を待つ | N/A | 段 005 の範囲 |
   911	| 7. 型と境界を固定する | ✅ | `strict`、Biome の 3 ルールを `error`、`any` なし。外部ツールの JSON は `unknown` + 型ガード。ページは RSC。`server-only` が必要なモジュールは段 1 にない |
   912	| 8. 秘密情報とサプライチェーン | ✅ | gitleaks は pre-commit（staged、`--redact`）と CI（verify 内の全履歴、`fetch-depth: 0`）。`gitleaks dir` は使わない。24h ゲート（除外なし）、exact pin、`allowBuilds` の理由つき列挙（`sharp: false`）、`--frozen-lockfile`、osv-scanner と `pnpm audit --audit-level=high`、SHA 固定、最小権限、`persist-credentials: false`、`.env.example` は名前だけ。ガードのメッセージはクエリやヘッダーを含めない |
   913	| 9. 事実は実測、版は現時点の採用版 | ✅ | 根拠は research.md（I-1〜I-14）。版番号は参考値で、テストは版番号を期待値にしない（`repo-policy.test.ts` は exact であることと 2 つの設定の一致だけを見る） |
   914	| 10. 依存は plan に宣言してから | ✅ | 依存は ADR-4 の一覧に限る（plan §2 の部分集合）。CI ジョブ（verify、verify-node27、security-daily）と Dependabot は plan §3.2・§8.5 で宣言済み。CI の「作業ツリー不変」ステップは本 plan で宣言する。新しい外部サービスはない |
   915	| 11. 段階ゲートを飛ばさない | ✅ | 段 001 が最初の段。今回の `-y` は要件の承認にだけ作用し、spec.json の要件はすでに承認済みだった。設計とタスクは人間が承認する。実装フェーズごとに別モデルファミリー（Codex）の敵対的レビューを `.sdd/reviews/` に 1 ラウンド 1 ファイルで残す |
   916	| Additional Constraints: ツールチェーン | ✅ | mise で固定し、フックは PATH 上の mise 管理ツールを呼ぶ。README に明記（13.4） |
   917	| Additional Constraints: Node のレーン | ⚠️ | 憲章は「`mise.node27.toml` と `exp/node27` で分離検証」と書くが、Clarifications 4 問目で `exp/node27` は必要時に作ると決めた。矛盾ではないが誤読されうる → **原則 3 の MINOR と同じ改訂で「`exp/node27` は Node 27 専用の修正が必要になった時点で作る」と明確化することを推奨**（13.7 の範囲の拡張になるため、設計承認時に判断してほしい） |
   918	| Additional Constraints: フックの回避 | ✅ | `--no-verify` / `LEFTHOOK=0` は CI が補う。回避は環境要因の証明と PR 本文への記録 |
   919	| Additional Constraints: lint / format | ✅ | Biome 単一、3 ルール `error` |
   920	| Additional Constraints: テストのモック | ✅ | E2E は `page.route`（段 003 から SSE モック）。pre-push の `@smoke` は 2 本（プレースホルダー、通信ガードの自己検査）で D5 の 1〜2 本に収まる |
   921	| Additional Constraints: 品質目標・言語 | ✅ | カバレッジのしきい値は TODO(BRANCH_COVERAGE) のまま。散文は日本語、コード・識別子・`AGENTS.md` は英語 |
   922	
   923	CRITICAL な違反はない。⚠️ の 3 件は、本 spec のタスク（13.7 の改訂、実装順の明示）で解消する。
   924	
   925	## Requirements Traceability
   926	
   927	検証欄の `R-n` は research.md の実装時の記録、「レビュー」は `/sdd-validate-impl` と敵対的レビューでの確認を表す。
   928	
   929	| Requirement ID | Component(s) | 検証 |
   930	|----------------|--------------|------|
   931	| 1.1 | C1, C14 | `tests/unit/repo-policy.test.ts` |
   932	| 1.2 | C1 | `tests/unit/repo-policy.test.ts` |
   933	| 1.3 | C1, C15 | R-1 |
   934	| 1.4 | C1 | `tests/unit/repo-policy.test.ts` |
   935	| 1.5 | C1 | `tests/unit/repo-policy.test.ts`（`sharp`）、R-2（各項目の理由） |
   936	| 1.6 | C1 | `tests/unit/repo-policy.test.ts` |
   937	| 1.7 | C1 | レビュー、R-1 |
   938	| 1.8 | C1, C5, C13 | CI の `pnpm install --frozen-lockfile`、R-2 |
   939	| 1.9 | C15 | R-2 |
   940	| 2.1 | C2 | `tests/unit/repo-policy.test.ts` |
   941	| 2.2 | C2 | `tests/unit/repo-policy.test.ts` |
   942	| 2.3 | C2 | `tests/unit/repo-policy.test.ts` |
   943	| 2.4 | C2, C3, C12 | `tests/unit/static-analysis.test.ts`、R-10 |
   944	| 2.5 | C2, C3, C12 | `tests/unit/static-analysis.test.ts`、R-10 |
   945	| 3.1 | C3, C12 | `tests/unit/hooks-config.test.ts`（構成要素と順序）、CI `verify` ジョブ、R-3 |
   946	| 3.2 | C3 | R-9（構成要素ごとの失敗で非 0）、I-3 |
   947	| 3.3 | C3 | `tests/unit/hooks-config.test.ts` |
   948	| 3.4 | C3 | `tests/unit/hooks-config.test.ts` |
   949	| 3.5 | C3, C6, C7 | R-3（ネットワーク切断・API キー未設定での実行） |
   950	| 3.6 | C3 | `tests/unit/hooks-config.test.ts` |
   951	| 3.7 | C3, C7 | R-3（3 回連続）、CI の作業ツリー不変 |
   952	| 3.8 | C2, C6, C12 | `tests/unit/gate-self-check.test.ts`（ファイル 0 件・実行 0 件）、`tests/unit/static-analysis.test.ts`（`noSkippedTests`） |
   953	| 3.9 | C2, C7, C12 | `tests/unit/gate-self-check.test.ts`（全部 skip、`--list` の一致 0 件）、`tests/unit/static-analysis.test.ts`（`noSkippedTests`） |
   954	| 3.10 | C6, C12 | `tests/unit/network-guard.test.ts` |
   955	| 3.11 | C7, C12 | `tests/e2e/network-guard.smoke.spec.ts`（遮断と記録）、`tests/unit/gate-self-check.test.ts`（既定の `failOnBlockedRequest: true` で teardown が失敗する経路） |
   956	| 3.12 | C3 | `tests/unit/hooks-config.test.ts`（`--redact`）、R-10 |
   957	| 4.1 | C4, C12 | `tests/unit/hooks-config.test.ts`（構成要素と順序）、CI `verify` ジョブ |
   958	| 4.2 | C4 | R-4 |
   959	| 4.3 | C4 | R-4 |
   960	| 4.4 | C4 | R-4（registry 到達不能） |
   961	| 4.5 | C4 | レビュー（除外が生じたとき） |
   962	| 5.1 | C5 | CI の `mise run runtime` のログ |
   963	| 5.2 | C5 | レビュー |
   964	| 5.3 | C5 | R-1（実行出力） |
   965	| 5.4 | C5 | R-1（実行前後の `git status`） |
   966	| 6.1 | C8 | verify の `check:model-ids`、`tests/unit/check-model-ids.test.ts` |
   967	| 6.2 | C8, C15 | R-5 |
   968	| 6.3 | C8 | `tests/unit/check-model-ids.test.ts` |
   969	| 6.4 | C8 | `tests/unit/check-model-ids.test.ts` |
   970	| 6.5 | C8 | `tests/unit/check-model-ids.test.ts` |
   971	| 6.6 | C8 | `tests/unit/check-model-ids.test.ts` |
   972	| 6.7 | C8 | `tests/unit/check-model-ids.test.ts` |
   973	| 7.1 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   974	| 7.2 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   975	| 7.3 | C9, C10 | `tests/unit/gitleaks-pre-commit.test.ts`（フック経由） |
   976	| 7.4 | C9, C12 | `tests/unit/check-commit-msg.test.ts`、`tests/unit/hooks-config.test.ts` |
   977	| 7.5 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   978	| 7.6 | C9, C12 | `tests/unit/hooks-config.test.ts`（`piped`） |
   979	| 7.7 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   980	| 7.8 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   981	| 8.1 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   982	| 8.2 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   983	| 8.3 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   984	| 8.4 | C10 | `tests/unit/gitleaks-pre-commit.test.ts`、verify の `check:secrets` |
   985	| 8.5 | C9, C10 | `tests/unit/gitleaks-pre-commit.test.ts`（設定ファイルの不在）、`tests/unit/hooks-config.test.ts`（`--ignore-gitleaks-allow`） |
   986	| 8.6 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   987	| 8.7 | C10, C6 | verify の `test` に含まれる（`tests/unit/**`）、通信ガード下で緑 |
   988	| 8.8 | C10, C6 | `tests/unit/helpers/sandbox.ts` の `onTestFinished`、R-10 |
   989	| 9.1 | C11 | レビュー、`tests/e2e/placeholder.smoke.spec.ts`（外部通信なしで緑） |
   990	| 9.2 | C11 | レビュー |
   991	| 9.3 | C11 | `tests/e2e/placeholder.smoke.spec.ts` |
   992	| 9.4 | C12 | `tests/unit/check-model-ids.test.ts` |
   993	| 9.5 | C12 | `tests/unit/network-guard.test.ts` |
   994	| 9.6 | C12 | `tests/unit/gate-self-check.test.ts`、`tests/e2e/network-guard.smoke.spec.ts`、R-9（構成要素ごとの終了コードの実行記録） |
   995	| 9.7 | C12 | R-10 |
   996	| 9.8 | C6, C7, C12 | `tests/unit/repo-policy.test.ts` |
   997	| 9.9 | C12 | レビュー |
   998	| 10.1 | C13, C12 | `tests/unit/hooks-config.test.ts`（`ci.yml` の文字列）、CI の実行結果 |
   999	| 10.2 | C13 | ruleset の設定（I-13）、レビュー |
  1000	| 10.3 | C13, C12 | `tests/unit/hooks-config.test.ts`（`ci.yml` の文字列）、CI の実行結果 |
  1001	| 10.4 | C13 | レビュー（`continue-on-error`） |
  1002	| 10.5 | C13 | security-daily の手動実行の結果 |
  1003	| 10.6 | C13 | レビュー（`fetch-depth: 0`） |
  1004	| 10.7 | C13 | レビュー |
  1005	| 10.8 | C13 | `tests/unit/repo-policy.test.ts` |
  1006	| 10.9 | C13 | レビュー |
  1007	| 10.10 | C13 | `tests/unit/repo-policy.test.ts` |
  1008	| 10.11 | C13 | レビュー |
  1009	| 10.12 | C13 | レビュー（`cooldown.default-days: 1`） |
  1010	| 11.1 | C14, C1 | `tests/unit/repo-policy.test.ts` |
  1011	| 11.2 | C14 | R-8 |
  1012	| 11.3 | C14, C15 | R-8 |
  1013	| 11.4 | C14, C3 | CI `verify-node27` の実行結果 |
  1014	| 11.5 | C14, C12 | `tests/unit/docs-structure.test.ts` |
  1015	| 11.6 | C14 | `docs/node27/` の記録 |
  1016	| 11.7 | C14, C16 | レビュー |
  1017	| 12.1 | C15 | R-6、R-7、R-8 |
  1018	| 12.2 | C15 | R-6 |
  1019	| 12.3 | C15 | R-6 |
  1020	| 12.4 | C15 | R-6 |
  1021	| 12.5 | C15 | R-7 |
  1022	| 12.6 | C15 | R-7 |
  1023	| 12.7 | C15 | レビュー |
  1024	| 13.1 | C16, C12 | `tests/unit/docs-structure.test.ts` |
  1025	| 13.2 | C16, C12 | `tests/unit/docs-structure.test.ts` |
  1026	| 13.3 | C16, C5 | レビュー |
  1027	| 13.4 | C16 | レビュー |
  1028	| 13.5 | C16, C12 | `tests/unit/repo-policy.test.ts` |
  1029	| 13.6 | C16, C12 | `tests/unit/repo-policy.test.ts` |
  1030	| 13.7 | C16 | レビュー |
  1031	| 13.8 | C16 | レビュー |
  1032	| 13.9 | C16 | レビュー |
  1033	| 13.10 | C16 | レビュー |
  1034	| 13.11 | C16 | レビュー（PR の差分） |
  1035	| 13.12 | C16 | レビュー |

**Planning the approach**

I need to create a full plan for the task at hand, which is a bit tricky. The user is asking for specific sections and prior criticals, so I'll have to read the plan thoroughly. It seems sensible to split things into sections, like from 86-220, and manage commands separately within the output limits. It's about ensuring clarity while meeting those requirements effectively! Let's make this work smoothly.
exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '86,240p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 94ms:
    86	## Components
    87	
    88	各コンポーネントの「Does NOT own」は tasks.md の `_Boundary:_` が参照する契約である。複数の
    89	コンポーネントが同じファイルを持つ場合（`mise.toml` など）は、ファイル内の担当範囲で分ける。
    90	
    91	### C1 ToolchainPins
    92	
    93	- **Responsibility**: ランタイム・ツール・npm 依存の採用版を exact に固定し、24h ゲートと install
    94	  スクリプトの遮断を設定で強制する。
    95	- **Public interface**:
    96	  - `mise.toml` の `[tools]`: `node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定。
    97	    `[env]` に `NEXT_TELEMETRY_DISABLED = "1"`。ZIP の `[settings] prereleases = false` は既定値なので書かない。
    98	  - `package.json`: `name`、`private: true`、`type: "module"`、`packageManager: "pnpm@<mise と同じ版>"`、
    99	    `engines.node: ">=<Node 26 LTS の採用版> || >=27.0.0-alpha"`（semver で alpha を受けるため。I-2）、
   100	    `scripts`（`dev`、`build`、`start` のみ。検査は mise タスクに一本化し、`package.json` に検査スクリプトを
   101	    重複させない）、`dependencies` / `devDependencies` は ADR-4 の一覧を exact 版で。
   102	  - `pnpm-workspace.yaml`: `minimumReleaseAge: 1440`、`savePrefix: ""`（`pnpm add` が `^` を付けない）、
   103	    `allowBuilds`（install スクリプトを持つ依存を**すべて**列挙し、各行に理由のコメント。`sharp: false`）、
   104	    必要な場合だけ `overrides` と `audit.ignore`（C4）。`minimumReleaseAgeExclude` は書かない。
   105	  - `pnpm-lock.yaml`: `pnpm install` で生成し、CI は `--frozen-lockfile`。
   106	- **Owns**: 採用版の正本（設定と lockfile）。`allowBuilds` の判断と理由。
   107	- **Does NOT own**: タスク定義（C3〜C5）、Node 27 の版（C14）、採用根拠の記録（C15 の research.md R-1・R-2）。
   108	- **Requirements**: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9
   109	
   110	### C2 StaticAnalysisConfig
   111	
   112	- **Responsibility**: lint / format / 型検査の規約を `biome.json` と `tsconfig.json` に集約する。
   113	- **Public interface**:
   114	  - `biome.json`: `linter.rules.preset: "recommended"`（I-9）、`correctness.noUnusedVariables` /
   115	    `correctness.noUnusedImports` / `suspicious.noExplicitAny` を `"error"`。`suspicious.noSkippedTests` も
   116	    `"error"`（Biome 2.6.8 に実在する。`it.skip` / `describe.skip` / テスト本体内の `test.skip(…)` を検出し、
   117	    `it.todo` と `test.info().skip(…)` は検出しないことを実測した（I-15）。`.fixme` / `xit` は未確認。静的な検査は
   118	    1 段目で、実行 0 件の最終的な止め手は 2 つの reporter（C6・C7）。3.8、3.9）。
   119	    `vcs.enabled: true`、`vcs.clientKind: "git"`、`vcs.useIgnoreFile: true`（`--staged` と ignore の読み込みに
   120	    `enabled` と `clientKind` が要る。ZIP の値を保つ）。
   121	    `files.includes` はコード・JSON・設定に限り、`specs/`・`.sdd/`・`docs/` の Markdown は対象にしない。
   122	    `overrides` で `tests/e2e/**`（`tests/e2e/fixtures.ts` を除く）の `@playwright/test` 直接 import を
   123	    `noRestrictedImports` で禁止する（ADR-5）。
   124	  - `tsconfig.json`: ZIP の値を基に `strict: true`、`noUncheckedIndexedAccess: true`、`noEmit: true`、
   125	    `types: ["node"]`、`paths: { "@/*": ["./src/*"] }`。`include` に `next-env.d.ts`、`src/**`、`tests/**`、
   126	    `*.config.ts`、`.next/types/**/*.ts`。`next dev` が書き足す値は取り込み時に受け入れて固定する（I-11）。
   127	  - `next.config.ts`: ZIP の内容（`cacheComponents: true`）を型検査が通る形で取り込む。
   128	- **Owns**: 規約の値。
   129	- **Does NOT own**: 規約を実行するタスク（C3 の `check` / `typecheck`）、フックでの staged 実行（C9）。
   130	- **Requirements**: 2.1, 2.2, 2.3, 2.4, 2.5
   131	
   132	### C3 VerifyTask
   133	
   134	- **Responsibility**: オフラインで決定論的な検査を、`mise run verify`（別名 `gate`）1 つで直列に実行する。
   135	- **Public interface**（`mise.toml` の `[tasks.*]`、詳細は Interfaces の表）:
   136	  `check`、`typecheck`、`check:model-ids`、`check:secrets`、`test`、`e2e`、`verify`（`alias = "gate"`）。
   137	  `verify` は `run` 配列で 6 タスクをこの順に呼び、最初の失敗で止まる（ADR-1、I-3）。他のタスクを呼ぶ
   138	  `verify` と `security` は `{ task = "<name>" }` の書き方で書く。`mise tasks ls --json` では `{"task":"<name>"}`
   139	  というオブジェクトになり、通常のコマンドは単一の文字列でも `["pnpm exec vitest run"]` のように配列になる
   140	  （I-16）。
   141	- **Owns**: verify の構成要素・順序・判定基準（gitleaks の `--redact`、Vitest / Playwright の呼び方）。
   142	- **Does NOT own**: ネットワークが必要な検査（C4）、テストランナーの設定（C6・C7）、モデル ID 検査の中身（C8）。
   143	- **Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 11.4
   144	
   145	### C4 SecurityTask
   146	
   147	- **Responsibility**: ネットワークを使う依存の脆弱性検査を verify から分けて実行し、到達不能を成功扱いに
   148	  しない。
   149	- **Public interface**: `security:osv`（`osv-scanner scan source --lockfile=pnpm-lock.yaml`）、
   150	  `security:audit`（`pnpm audit --audit-level=high`、`--ignore-registry-errors` は付けない）、
   151	  `security`（`security:osv` → `security:audit` の直列）。
   152	  除外を記録する場合の形式: osv-scanner は `osv-scanner.toml` の `[[IgnoredVulns]]`（`id`、`ignoreUntil`、
   153	  `reason` に退役条件を含める）、pnpm は `pnpm-workspace.yaml` の `audit.ignore`（GHSA ID の各行に
   154	  理由と退役条件のコメント）。除外がない間はどちらも作らない。
   155	- **Owns**: security の構成要素と除外の記録形式。
   156	- **Does NOT own**: CI での実行タイミング（C13）、フックでの実行（C9）、版上げ自体（C1）。
   157	- **Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5
   158	
   159	### C5 AuxiliaryTasks
   160	
   161	- **Responsibility**: 合否と切り離した記録用・更新確認用・セットアップ用のタスクを提供する。
   162	- **Public interface**:
   163	  - `runtime`: `node -v`、`pnpm -v`、`pnpm exec tsc -v`、`pnpm exec next --version`、`lefthook version`、
   164	    `gitleaks version`、`osv-scanner --version` を出力する。期待値と照合しない。
   165	  - `outdated`: `mise outdated`（ツール）→ `pnpm outdated`（npm 依存）。ファイルを変更しない。
   166	    `pnpm outdated` は候補があると `exit 1` になる（I-8）。この意味を `description` と README に書き、
   167	    終了コードを隠さない。
   168	  - `setup`: `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install`。
   169	    README のセットアップ手順の最後の 3 手順をまとめる。
   170	- **Owns**: 上記 3 タスク。
   171	- **Does NOT own**: 版の決定（C1）、検査の合否（C3・C4）。
   172	- **Requirements**: 5.1, 5.2, 5.3, 5.4, 13.3
   173	
   174	### C6 UnitTestHarness
   175	
   176	- **Responsibility**: unit テストの実行環境を、0 件で失敗し、未モック通信でテストが失敗する状態に固定する。
   177	- **Public interface**:
   178	  - `vitest.config.ts`: `include: ["tests/unit/**/*.test.ts"]`、`environment: "node"`、
   179	    `setupFiles: ["tests/unit/setup/network-guard.ts"]`、`passWithNoTests: false`（既定と同じ値を明記）、
   180	    `allowOnly: false`、`resolve.alias` の `@` → `src`。`@vitejs/plugin-react` は使わない（ADR-4）。
   181	    `reporters: ["default", "./tests/unit/setup/require-executed-tests.ts"]`。`testTimeout` は既定（5 秒）の
   182	    まま、子プロセスを使うテストファイルは `describe(…, { timeout })` で明示する（初期値 60 秒、R-11 の
   183	    実測で見直す）。
   184	  - `tests/unit/setup/require-executed-tests.ts`: Vitest の custom reporter。実行を終えたテスト
   185	    （passed + failed）が 0 件なら、実行全体を失敗させる（ファイルはあるが全部 `todo` / `skip` の場合。
   186	    3.8）。`vitest/node` の `Reporter` を実装し、`onTestRunEnd(testModules)` で各モジュールの
   187	    `children.allTests()` の `result().state` が `passed` / `failed` の件数を数え、0 件なら固定メッセージ
   188	    `no tests were executed` を stderr に出して `process.exitCode = 1` にする。Vitest 5.1.1 で実測済み
   189	    （`.ts` の reporter を読み込めること、`it.todo` のみ → 1、`it.skip` のみ → 1、1 件実行 → 0。reporter なしで
   190	    `it.todo` のみだと 0 で、reporter が唯一のガードであること。I-15）。型検査は実装時に通す。自己検査（C12）で
   191	    非 0 になることを確かめる。
   192	  - `tests/unit/setup/network-guard.ts`: `net.Socket.prototype.connect` と `globalThis.fetch` を置き換え、
   193	    呼ばれると `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で違反があればそのテストを
   194	    失敗させる。違反の消去手段は公開しない（ADR-5）。
   195	  - `tests/unit/helpers/sandbox.ts`: `useTempGitRepo()`（一時ディレクトリ + `git init`、終了時に
   196	    `onTestFinished` で必ず削除）、`resolveTool(name)`、`isolatedEnv(options?)`、`runCommand()`（シェルを介さない
   197	    `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）、
   198	    `expectGateFailure()` / `expectGateSuccess()`。
   199	    - `resolveTool(name)`: 解決元を 2 種に分け、どの名前がどちらかを 1 か所の表で持つ。
   200	      (1) mise 管理のツール（`node`、`pnpm`、`gitleaks`、`lefthook`、`osv-scanner`）: リポジトリのルートを cwd に
   201	      して `mise which <name>` を 1 回だけ実行し、絶対パスを返す。
   202	      (2) OS 付属のツール（`git`）: `git` は `[tools]` に入れない設計（C1 の 5 ツール）で、`mise which git` では
   203	      解決できない（I-16）。親プロセスの `PATH` を先頭から探し、実行可能な絶対パスを返す（子プロセスは使わない）。
   204	      node_modules の bin（`biome`、`tsc`、`vitest`）はルートの `node_modules/.bin/` から解決する。これらは
   205	      shebang のスクリプトで、実行には `node` が PATH に要る（I-16）。mise の shim は cwd がプロジェクト外だと
   206	      `No version is set for shim` で失敗する（実測）ため、一時リポジトリで PATH 上の名前に頼らない。
   207	      見つからなければ、原因を示すメッセージでテストを失敗させる（スキップしない）。
   208	    - `isolatedEnv(options?)`: `GIT_*`、`GITLEAKS_*`、`LEFTHOOK*`、`MISE_ENV` を除く（それ以外は親から引き継ぐ。
   209	      `HOME` など）。そのうえで
   210	      `GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`、固定の偽の identity（`GIT_AUTHOR_NAME` /
   211	      `GIT_AUTHOR_EMAIL` / `GIT_COMMITTER_NAME` / `GIT_COMMITTER_EMAIL`。`.invalid` ドメイン）を設定する
   212	      （Linux ランナーでは identity がないと commit 自体が失敗し、拒否の原因が gitleaks か区別できない）。
   213	      `PATH` は次のディレクトリを先頭からこの順に並べ、重複を除いて作る（親の `PATH` は引き継がない）:
   214	      `dirname(process.execPath)`（テストを実行している Node。`pnpm exec` と `node_modules/.bin` のスクリプトが
   215	      `node` を PATH から探すため必須。`PATH=/usr/bin:/bin` だけでは `node: not found`（127）になる。I-16）、
   216	      `resolveTool()` で解決した `pnpm`・`gitleaks`・`lefthook`・`git` のディレクトリ、`/usr/bin`、`/bin`。
   217	      フック経由で起動する gitleaks が一時リポジトリでも見つかる。`options.pathDirs` を渡すと、この組み立てを
   218	      その配列 + `/usr/bin:/bin` に置き換える（7.7 の「ツール不在」ケースが `[]` で使う。C12）。
   219	    - `runCommand()`: 既定の環境は `isolatedEnv()`。親の環境をそのまま使うときは `env: "inherit"` を明示する
   220	      （隔離しない実行を、書き忘れでなく意図として残す）。`CommandResult` は `spawnError`（`spawnSync` の
   221	      `error.code`。`ENOENT` など。なければ `null`）を持つ。
   222	    - `expectGateFailure(result, { output })`: 「ゲートが拒否した」ことを次のすべてで確かめる。`status` が数値で
   223	      0 でない、`spawnError` が `null`、`status` が 126 / 127 でない、stdout + stderr が `output`（正規表現または
   224	      文字列）に一致する。ツールや `node` が見つからないだけの失敗を、拒否と取り違えない。ツール不在を
   225	      期待する 7.7 のケースは、フックの終了コード 1 と出力のツール名で確かめる（この関数の対象外ではなく、
   226	      `output` に不在を示す文言を渡す）。`expectGateSuccess(result)` は `status` が 0 で `spawnError` が `null`
   227	      であることを確かめる。「非 0」を assert するテストは、必ず対照の成功ケースを併置する。
   228	  - `tests/unit/sandbox.test.ts`: `sandbox.ts` の契約を確かめる。(1) `isolatedEnv()` の環境で `node -v`、
   229	    `git --version`、`gitleaks version`、`lefthook version`、`pnpm exec vitest --version` が `expectGateSuccess`
   230	    になる（子の環境で実際に起動できる。PATH を直前の状態に戻すと失敗する）。(2) 親に `GIT_DIR` /
   231	    `GIT_INDEX_FILE` / `MISE_ENV` / `LEFTHOOK` を設定しても子の環境に現れない。(3) `resolveTool("git")` が
   232	    絶対パスを返し、`resolveTool("no-such-tool")` が原因を示して失敗する。(4) `expectGateFailure` が、
   233	    `status` 127、`spawnError` あり、`status` 0、出力不一致のいずれも拒否し、実際に非 0 で出力が一致した
   234	    ときだけ通る。
   235	- **Owns**: unit の実行規則と、子プロセス・一時リポジトリの安全な扱い。
   236	- **Does NOT own**: 個々の受け入れテストの中身（C10・C12）、E2E（C7）。
   237	- **Requirements**: 3.7, 3.8, 3.10, 8.8, 9.7, 9.8
   238	
   239	### C7 E2EHarness
   240	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '132,238p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 91ms:
   132	### C3 VerifyTask
   133	
   134	- **Responsibility**: オフラインで決定論的な検査を、`mise run verify`（別名 `gate`）1 つで直列に実行する。
   135	- **Public interface**（`mise.toml` の `[tasks.*]`、詳細は Interfaces の表）:
   136	  `check`、`typecheck`、`check:model-ids`、`check:secrets`、`test`、`e2e`、`verify`（`alias = "gate"`）。
   137	  `verify` は `run` 配列で 6 タスクをこの順に呼び、最初の失敗で止まる（ADR-1、I-3）。他のタスクを呼ぶ
   138	  `verify` と `security` は `{ task = "<name>" }` の書き方で書く。`mise tasks ls --json` では `{"task":"<name>"}`
   139	  というオブジェクトになり、通常のコマンドは単一の文字列でも `["pnpm exec vitest run"]` のように配列になる
   140	  （I-16）。
   141	- **Owns**: verify の構成要素・順序・判定基準（gitleaks の `--redact`、Vitest / Playwright の呼び方）。
   142	- **Does NOT own**: ネットワークが必要な検査（C4）、テストランナーの設定（C6・C7）、モデル ID 検査の中身（C8）。
   143	- **Requirements**: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.12, 11.4
   144	
   145	### C4 SecurityTask
   146	
   147	- **Responsibility**: ネットワークを使う依存の脆弱性検査を verify から分けて実行し、到達不能を成功扱いに
   148	  しない。
   149	- **Public interface**: `security:osv`（`osv-scanner scan source --lockfile=pnpm-lock.yaml`）、
   150	  `security:audit`（`pnpm audit --audit-level=high`、`--ignore-registry-errors` は付けない）、
   151	  `security`（`security:osv` → `security:audit` の直列）。
   152	  除外を記録する場合の形式: osv-scanner は `osv-scanner.toml` の `[[IgnoredVulns]]`（`id`、`ignoreUntil`、
   153	  `reason` に退役条件を含める）、pnpm は `pnpm-workspace.yaml` の `audit.ignore`（GHSA ID の各行に
   154	  理由と退役条件のコメント）。除外がない間はどちらも作らない。
   155	- **Owns**: security の構成要素と除外の記録形式。
   156	- **Does NOT own**: CI での実行タイミング（C13）、フックでの実行（C9）、版上げ自体（C1）。
   157	- **Requirements**: 4.1, 4.2, 4.3, 4.4, 4.5
   158	
   159	### C5 AuxiliaryTasks
   160	
   161	- **Responsibility**: 合否と切り離した記録用・更新確認用・セットアップ用のタスクを提供する。
   162	- **Public interface**:
   163	  - `runtime`: `node -v`、`pnpm -v`、`pnpm exec tsc -v`、`pnpm exec next --version`、`lefthook version`、
   164	    `gitleaks version`、`osv-scanner --version` を出力する。期待値と照合しない。
   165	  - `outdated`: `mise outdated`（ツール）→ `pnpm outdated`（npm 依存）。ファイルを変更しない。
   166	    `pnpm outdated` は候補があると `exit 1` になる（I-8）。この意味を `description` と README に書き、
   167	    終了コードを隠さない。
   168	  - `setup`: `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install`。
   169	    README のセットアップ手順の最後の 3 手順をまとめる。
   170	- **Owns**: 上記 3 タスク。
   171	- **Does NOT own**: 版の決定（C1）、検査の合否（C3・C4）。
   172	- **Requirements**: 5.1, 5.2, 5.3, 5.4, 13.3
   173	
   174	### C6 UnitTestHarness
   175	
   176	- **Responsibility**: unit テストの実行環境を、0 件で失敗し、未モック通信でテストが失敗する状態に固定する。
   177	- **Public interface**:
   178	  - `vitest.config.ts`: `include: ["tests/unit/**/*.test.ts"]`、`environment: "node"`、
   179	    `setupFiles: ["tests/unit/setup/network-guard.ts"]`、`passWithNoTests: false`（既定と同じ値を明記）、
   180	    `allowOnly: false`、`resolve.alias` の `@` → `src`。`@vitejs/plugin-react` は使わない（ADR-4）。
   181	    `reporters: ["default", "./tests/unit/setup/require-executed-tests.ts"]`。`testTimeout` は既定（5 秒）の
   182	    まま、子プロセスを使うテストファイルは `describe(…, { timeout })` で明示する（初期値 60 秒、R-11 の
   183	    実測で見直す）。
   184	  - `tests/unit/setup/require-executed-tests.ts`: Vitest の custom reporter。実行を終えたテスト
   185	    （passed + failed）が 0 件なら、実行全体を失敗させる（ファイルはあるが全部 `todo` / `skip` の場合。
   186	    3.8）。`vitest/node` の `Reporter` を実装し、`onTestRunEnd(testModules)` で各モジュールの
   187	    `children.allTests()` の `result().state` が `passed` / `failed` の件数を数え、0 件なら固定メッセージ
   188	    `no tests were executed` を stderr に出して `process.exitCode = 1` にする。Vitest 5.1.1 で実測済み
   189	    （`.ts` の reporter を読み込めること、`it.todo` のみ → 1、`it.skip` のみ → 1、1 件実行 → 0。reporter なしで
   190	    `it.todo` のみだと 0 で、reporter が唯一のガードであること。I-15）。型検査は実装時に通す。自己検査（C12）で
   191	    非 0 になることを確かめる。
   192	  - `tests/unit/setup/network-guard.ts`: `net.Socket.prototype.connect` と `globalThis.fetch` を置き換え、
   193	    呼ばれると `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で違反があればそのテストを
   194	    失敗させる。違反の消去手段は公開しない（ADR-5）。
   195	  - `tests/unit/helpers/sandbox.ts`: `useTempGitRepo()`（一時ディレクトリ + `git init`、終了時に
   196	    `onTestFinished` で必ず削除）、`resolveTool(name)`、`isolatedEnv(options?)`、`runCommand()`（シェルを介さない
   197	    `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）、
   198	    `expectGateFailure()` / `expectGateSuccess()`。
   199	    - `resolveTool(name)`: 解決元を 2 種に分け、どの名前がどちらかを 1 か所の表で持つ。
   200	      (1) mise 管理のツール（`node`、`pnpm`、`gitleaks`、`lefthook`、`osv-scanner`）: リポジトリのルートを cwd に
   201	      して `mise which <name>` を 1 回だけ実行し、絶対パスを返す。
   202	      (2) OS 付属のツール（`git`）: `git` は `[tools]` に入れない設計（C1 の 5 ツール）で、`mise which git` では
   203	      解決できない（I-16）。親プロセスの `PATH` を先頭から探し、実行可能な絶対パスを返す（子プロセスは使わない）。
   204	      node_modules の bin（`biome`、`tsc`、`vitest`）はルートの `node_modules/.bin/` から解決する。これらは
   205	      shebang のスクリプトで、実行には `node` が PATH に要る（I-16）。mise の shim は cwd がプロジェクト外だと
   206	      `No version is set for shim` で失敗する（実測）ため、一時リポジトリで PATH 上の名前に頼らない。
   207	      見つからなければ、原因を示すメッセージでテストを失敗させる（スキップしない）。
   208	    - `isolatedEnv(options?)`: `GIT_*`、`GITLEAKS_*`、`LEFTHOOK*`、`MISE_ENV` を除く（それ以外は親から引き継ぐ。
   209	      `HOME` など）。そのうえで
   210	      `GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`、固定の偽の identity（`GIT_AUTHOR_NAME` /
   211	      `GIT_AUTHOR_EMAIL` / `GIT_COMMITTER_NAME` / `GIT_COMMITTER_EMAIL`。`.invalid` ドメイン）を設定する
   212	      （Linux ランナーでは identity がないと commit 自体が失敗し、拒否の原因が gitleaks か区別できない）。
   213	      `PATH` は次のディレクトリを先頭からこの順に並べ、重複を除いて作る（親の `PATH` は引き継がない）:
   214	      `dirname(process.execPath)`（テストを実行している Node。`pnpm exec` と `node_modules/.bin` のスクリプトが
   215	      `node` を PATH から探すため必須。`PATH=/usr/bin:/bin` だけでは `node: not found`（127）になる。I-16）、
   216	      `resolveTool()` で解決した `pnpm`・`gitleaks`・`lefthook`・`git` のディレクトリ、`/usr/bin`、`/bin`。
   217	      フック経由で起動する gitleaks が一時リポジトリでも見つかる。`options.pathDirs` を渡すと、この組み立てを
   218	      その配列 + `/usr/bin:/bin` に置き換える（7.7 の「ツール不在」ケースが `[]` で使う。C12）。
   219	    - `runCommand()`: 既定の環境は `isolatedEnv()`。親の環境をそのまま使うときは `env: "inherit"` を明示する
   220	      （隔離しない実行を、書き忘れでなく意図として残す）。`CommandResult` は `spawnError`（`spawnSync` の
   221	      `error.code`。`ENOENT` など。なければ `null`）を持つ。
   222	    - `expectGateFailure(result, { output })`: 「ゲートが拒否した」ことを次のすべてで確かめる。`status` が数値で
   223	      0 でない、`spawnError` が `null`、`status` が 126 / 127 でない、stdout + stderr が `output`（正規表現または
   224	      文字列）に一致する。ツールや `node` が見つからないだけの失敗を、拒否と取り違えない。ツール不在を
   225	      期待する 7.7 のケースは、フックの終了コード 1 と出力のツール名で確かめる（この関数の対象外ではなく、
   226	      `output` に不在を示す文言を渡す）。`expectGateSuccess(result)` は `status` が 0 で `spawnError` が `null`
   227	      であることを確かめる。「非 0」を assert するテストは、必ず対照の成功ケースを併置する。
   228	  - `tests/unit/sandbox.test.ts`: `sandbox.ts` の契約を確かめる。(1) `isolatedEnv()` の環境で `node -v`、
   229	    `git --version`、`gitleaks version`、`lefthook version`、`pnpm exec vitest --version` が `expectGateSuccess`
   230	    になる（子の環境で実際に起動できる。PATH を直前の状態に戻すと失敗する）。(2) 親に `GIT_DIR` /
   231	    `GIT_INDEX_FILE` / `MISE_ENV` / `LEFTHOOK` を設定しても子の環境に現れない。(3) `resolveTool("git")` が
   232	    絶対パスを返し、`resolveTool("no-such-tool")` が原因を示して失敗する。(4) `expectGateFailure` が、
   233	    `status` 127、`spawnError` あり、`status` 0、出力不一致のいずれも拒否し、実際に非 0 で出力が一致した
   234	    ときだけ通る。
   235	- **Owns**: unit の実行規則と、子プロセス・一時リポジトリの安全な扱い。
   236	- **Does NOT own**: 個々の受け入れテストの中身（C10・C12）、E2E（C7）。
   237	- **Requirements**: 3.7, 3.8, 3.10, 8.8, 9.7, 9.8
   238	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '184,199p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 90ms:
   184	  - `tests/unit/setup/require-executed-tests.ts`: Vitest の custom reporter。実行を終えたテスト
   185	    （passed + failed）が 0 件なら、実行全体を失敗させる（ファイルはあるが全部 `todo` / `skip` の場合。
   186	    3.8）。`vitest/node` の `Reporter` を実装し、`onTestRunEnd(testModules)` で各モジュールの
   187	    `children.allTests()` の `result().state` が `passed` / `failed` の件数を数え、0 件なら固定メッセージ
   188	    `no tests were executed` を stderr に出して `process.exitCode = 1` にする。Vitest 5.1.1 で実測済み
   189	    （`.ts` の reporter を読み込めること、`it.todo` のみ → 1、`it.skip` のみ → 1、1 件実行 → 0。reporter なしで
   190	    `it.todo` のみだと 0 で、reporter が唯一のガードであること。I-15）。型検査は実装時に通す。自己検査（C12）で
   191	    非 0 になることを確かめる。
   192	  - `tests/unit/setup/network-guard.ts`: `net.Socket.prototype.connect` と `globalThis.fetch` を置き換え、
   193	    呼ばれると `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で違反があればそのテストを
   194	    失敗させる。違反の消去手段は公開しない（ADR-5）。
   195	  - `tests/unit/helpers/sandbox.ts`: `useTempGitRepo()`（一時ディレクトリ + `git init`、終了時に
   196	    `onTestFinished` で必ず削除）、`resolveTool(name)`、`isolatedEnv(options?)`、`runCommand()`（シェルを介さない
   197	    `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）、
   198	    `expectGateFailure()` / `expectGateSuccess()`。
   199	    - `resolveTool(name)`: 解決元を 2 種に分け、どの名前がどちらかを 1 か所の表で持つ。

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '239,470p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 112ms:
   239	### C7 E2EHarness
   240	
   241	- **Responsibility**: E2E の実行環境を、0 件で失敗し、外部オリジンへの未モック通信でテストが失敗し、
   242	  既存のサーバーを再利用しない状態に固定する。
   243	- **Public interface**:
   244	  - `playwright.config.ts`: `testDir: "tests/e2e"`、`retries: 0`、`forbidOnly: true`、`projects` は
   245	    chromium のみ、`use.baseURL` は専用ポートの `http://127.0.0.1:<port>`、`webServer` は
   246	    `pnpm exec next dev --hostname 127.0.0.1 --port <port>`、`reuseExistingServer: false`、
   247	    `env: { NEXT_TELEMETRY_DISABLED: "1" }`。ポート番号は設定ファイルの 1 か所で定義する。
   248	    `reporter: [["list"], ["./tests/e2e/reporters/require-executed-tests.ts"]]`。
   249	  - `tests/e2e/reporters/require-executed-tests.ts`: Playwright の custom reporter。`onEnd` で、実行された
   250	    テスト（status が `skipped` 以外）が 0 件なら `{ status: "failed" }` を返して実行全体を失敗させる
   251	    （`@smoke` に一致するテストが全部 skip の場合。3.9）。`onTestEnd` で数え、0 件のときは固定メッセージ
   252	    `no tests were executed` を stderr に出す。型は `@playwright/test/reporter` から import する
   253	    （Biome の `noRestrictedImports` が禁じるのは `@playwright/test` の直接 import だけ）。
   254	    Playwright 1.65.1 の実測（I-15）: 全部 skip だと reporter なしでは **exit 0** になり、この reporter が唯一の
   255	    ガード。`onEnd` が `{ status: "failed" }` を返すと exit 1 になる（`.mjs` の reporter で確認。`.ts` の
   256	    reporter を設定から読み込めることは未確認で、実装時に R-9 で確かめる。読めない場合は `.mjs` + JSDoc の型に
   257	    する）。この reporter は `--list` でも走り、実行 0 件として失敗する。`--list` を使う検査は
   258	    `--reporter=list` で設定の reporter を上書きする。
   259	  - `tests/e2e/fixtures.ts`: `test`（auto fixture `networkGuard` を持つ）と `expect` を export する。
   260	    `networkGuard` は `context.route("**/*")` で受けたリクエストのうち、`baseURL` と異なるオリジンを
   261	    `abort` して記録し、teardown で違反があれば失敗させる。同一オリジンは `route.fallback()`。
   262	    記録は fixture `blockedRequests` として公開し、option fixture `failOnBlockedRequest`（既定 `true`）が
   263	    `false` のときだけ teardown の失敗を止める（自己検査専用。C12）。
   264	- **Owns**: E2E の実行規則と外部通信の遮断。
   265	- **Does NOT own**: 個々の E2E テスト（C11・C12）、`/api/chat` の SSE モック（段 003）。
   266	- **Requirements**: 3.9, 3.11, 9.8
   267	
   268	### C8 ModelIdGuard
   269	
   270	- **Responsibility**: モデル ID の唯一の定義を持ち、それ以外の場所への直書きを検出する。
   271	- **Public interface**:
   272	  - `src/lib/ai/model-allowlist.ts`（消去可能な構文だけで書く。I-7）:
   273	    `PROVIDERS`（`"openai" | "anthropic" | "google" | "ollama"` の readonly タプル）、`type Provider`、
   274	    `MODEL_ALLOWLIST`（`as const satisfies Record<Provider, readonly string[]>`）、
   275	    `type AllowedModelId<P extends Provider = Provider>`。登録する ID は実装時に公式ドキュメントで確認する
   276	    （research.md R-5、6.2）。`server-only` は import しない（秘密値を読まず、段 1 で未導入）。
   277	  - `scripts/check-model-ids.mjs`: CLI 契約は Interfaces の表。走査の候補は
   278	    `git ls-files --cached --others --exclude-standard`（ADR-6）。検出は allowlist の全 ID と、プロバイダ
   279	    命名形式の正規表現（OpenAI: `gpt-<数字>`・`gpt-oss-`・`o<数字>` 系・`chatgpt-`、Anthropic:
   280	    `claude-<ファミリーまたは数字>`、Google: `gemini-<数字>`・`gemma-<数字>`、Ollama: 代表的な
   281	    ライブラリ名 + 数字またはタグ）。正規表現は**自分自身のソースに一致しない書き方**にし、スクリプト自身を
   282	    除外しない。
   283	- **Owns**: モデル ID の値、走査対象と除外の規則、検出パターン。
   284	- **Does NOT own**: `AI_PROVIDER` / `AI_MODEL` の Zod 検証とプロバイダ生成（段 006 の `model.ts`）、
   285	  タスク登録（C3）、フック登録（C9）。
   286	- **Requirements**: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
   287	
   288	### C9 GitHooks
   289	
   290	- **Responsibility**: commit と push の時点で、verify / security と同じ判定基準の検査を自動で実行し、
   291	  ツール不在を成功扱いにしない。
   292	- **Public interface**: `lefthook.yml`（Interfaces の表）。先頭に `assert_lefthook_installed: true`
   293	  （ADR-3）。pre-commit は `parallel: true`、pre-push は `piped: true`。
   294	  `scripts/check-commit-msg.mjs <msg-file>`（ADR-8、CLI 契約は Interfaces）。
   295	- **Owns**: フックとジョブの構成、commit メッセージの規則。
   296	- **Does NOT own**: 各検査の中身（C3・C4・C8 のタスク）、フック設定の自動検査（C12 の
   297	  `hooks-config.test.ts`）、秘密値 commit の受け入れテスト（C10）。
   298	- **Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   299	
   300	### C10 SecretCommitTest
   301	
   302	- **Responsibility**: 秘密値を含む commit がフックの secrets ジョブで拒否されることを、オフラインの
   303	  自動テストで確かめる（段 1 の合格条件）。
   304	- **Public interface**: `tests/unit/gitleaks-pre-commit.test.ts`。
   305	  1. `lefthook dump --format=json` から `pre-commit.jobs[name="secrets"].run` を取り、空白で分割した argv の
   306	     先頭が `gitleaks` であること、シェルのメタ文字を含まないことを確かめる（8.3、I-5）。
   307	  2. `useTempGitRepo()` で一時リポジトリを作り、`crypto.randomBytes` から組み立てた偽キー（gitleaks の
   308	     既定ルールが検出する形。prefix は文字列連結で組み、検出される形のリテラルをソースに置かない）を
   309	     ファイルに書いて stage し、取得した argv で gitleaks を実行して非 0 を確かめる（8.1、8.4）。
   310	  3. 出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）。
   311	  4. 秘密値なしのファイルだけを stage して同じ argv で実行し、0 を確かめる（8.2）。
   312	  5. フック経由の確認: dump から secrets ジョブだけを抜き出した `lefthook.json`（lefthook 2.2.2 が読むことを
   313	     実測）を一時リポジトリに置いて `lefthook install` し、次を確かめる（段 1 の合格条件「フックで拒否
   314	     される」、7.3）。
   315	     - 偽キーを含む `git commit` → 非 0、commit が作られていない（`git rev-parse --verify HEAD` が失敗するか
   316	       HEAD が変わらない）、出力に gitleaks の検出（`RuleID`）があり偽キーの値を含まない。
   317	     - 秘密値なしの `git commit` → 0、HEAD が新しい commit を指す（対照。identity は `isolatedEnv()` の固定値）。
   318	  6. 設定の一致（8.5）: リポジトリのルートに gitleaks の設定ファイル（`.gitleaks.toml`、`.gitleaksignore`）が
   319	     **ない**ことを確かめる。一時リポジトリの gitleaks は既定の設定で動くため、リポジトリ側に設定があると
   320	     フックとテストで検出規則がずれる。設定が必要になった段は、その plan でテストへのコピー方法を決める。
   321	  子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）。`gitleaks:allow`
   322	  のインライン除外コメントは、secrets ジョブと `check:secrets` の `--ignore-gitleaks-allow` で無効にする
   323	  （8.5 を機械的に守らせる）。
   324	- **Owns**: 偽キーの生成規則と、このテストの判定。
   325	- **Does NOT own**: secrets ジョブの定義（C9）、一時リポジトリと環境の扱い（C6 の `sandbox.ts`）。
   326	- **Requirements**: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 7.3
   327	
   328	### C11 PlaceholderApp
   329	
   330	- **Responsibility**: 段 1 でも verify と pre-push の E2E が空振りしないよう、AI を呼ばない最小のページを
   331	  提供する。
   332	- **Public interface**:
   333	  - `src/app/layout.tsx`: `<html lang="ja">` のルートレイアウトと `metadata`。`next/font/google` など
   334	    ネットワークを使う機能を使わない。
   335	  - `src/app/page.tsx`: RSC。`<h1>` に `genai-lab-ts`、本文に段 1 の案内。`"use client"`、AI SDK、
   336	    `process.env` の参照を含まない。
   337	  - `tests/e2e/placeholder.smoke.spec.ts`: `@smoke` タグ。`/` を開き、レベル 1 の見出し `genai-lab-ts`
   338	    が表示されることを確かめる。`tests/e2e/fixtures.ts` から import する。
   339	- **Owns**: プレースホルダーの表示内容。
   340	- **Does NOT own**: チャット UI と `/api/chat`（段 003）、E2E の実行規則（C7）。
   341	- **Requirements**: 9.1, 9.2, 9.3
   342	
   343	### C12 GateSelfChecks
   344	
   345	- **Responsibility**: ゲートそのもの（0 件実行、未モック通信、モデル ID 検査、フック構成、commit-msg、
   346	  文書の参照）が壊れたら落ちる自己検査を提供する。
   347	- **Public interface**（すべて版番号を期待値にしない。9.9）:
   348	  - `tests/unit/network-guard.test.ts`: `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の
   349	    `vitest run` を 2 回起動する。fixture 設定は実設定を `mergeConfig` で引き継ぐが、`mergeConfig` は配列を
   350	    **連結**する（vite 8.3.8 で実測）ため、`test.include` はマージ後に
   351	    `["tests/fixtures/gate/*.fixture.ts"]` を**代入して置き換える**（連結のままだと本体の
   352	    `tests/unit/**/*.test.ts` が残り、このテスト自身を入れ子で再帰起動する）。各実行では、実行された
   353	    テストファイルが指定した fixture 1 件だけであることを出力から確かめる。(a) `unmocked-network.fixture.ts`
   354	    （`fetch` と `net.connect` を呼び、例外を握りつぶす）→ `expectGateFailure`（出力に `UnmockedNetworkError`）。
   355	    (b) `no-network.fixture.ts` → `expectGateSuccess`（対照。失敗の原因がガードであることを示す）（3.10、9.5）。
   356	  - `tests/unit/gate-self-check.test.ts`: 0 件の検査を、ランナーを直接呼ばずに **`mise.toml` の `test` /
   357	    `e2e` タスクの `run`**（`mise tasks ls --json` から取得。要素は文字列または `{ task }` で、型ガードで絞る）の
   358	    argv に引数を足して実行する（タスクに `--passWithNoTests` などが足されたら、この検査が落ちる）。
   359	    入れ子の Vitest は `--maxWorkers=1`。すべて `expectGateFailure`（失敗の理由を出力で確かめる）と、
   360	    対照の `expectGateSuccess` をそれぞれ併置する。
   361	    - Vitest: (a) `test` の argv + どのファイルにも一致しないフィルタ → 失敗、出力に `No test files found`
   362	      （ファイル 0 件。3.8）。(b) `test` の argv + `--config tests/fixtures/gate/vitest.fixture.config.ts` +
   363	      `tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけを持つ）→ 失敗、出力に `no tests were executed`
   364	      （実行 0 件。reporter だけが止める。I-15）。`it.skip` だけの fixture は置かない（リポジトリの Biome
   365	      `noSkippedTests` に検出され、`biome-ignore` や lint の対象外で逃がすと 3.8 の静的ガードを弱めるため。
   366	      `it.skip` のみの実行を reporter が止めることは I-15 の実測で確かめた）。対照は `network-guard.test.ts` の (b)（実行 1 件以上で 0）。
   367	    - Playwright: 入れ子実行は専用の設定 `tests/fixtures/gate/e2e/playwright.fixture.config.ts` を使う。
   368	      `testDir` は `tests/fixtures/gate/e2e`、`testMatch` は `**/*.fixture.ts`、`webServer` なし、`reporter` は
   369	      本物の `tests/e2e/reporters/require-executed-tests.ts` を読み込む（reporter だけを実物にし、設定の取り違えを
   370	      避ける）。`e2e` の argv の `--config` をこの設定に置き換えて実行する。
   371	      (c) `all-skip.fixture.ts`（`@smoke` の 1 件が `test.info().skip(true, …)` で skip する）→ 失敗、出力に
   372	      `no tests were executed`（3.9。reporter なしでは exit 0 になる。I-15）。対照 `one-pass.fixture.ts`（`@smoke`
   373	      の 1 件が通る）→ 成功。`--grep` の対象は `@smoke` のまま（`e2e` タスクの argv どおり）。
   374	      (d) `e2e` の argv（本物の設定）+ `--list` + `--reporter=list` + `--grep <一致しないタグ>` → 失敗、出力に
   375	      `No tests found`（3.9。`--list` は webServer を起動せず、0 件で exit 1 になる。I-15）。対照: 同じ argv で
   376	      `--grep @smoke` → 成功し、出力に `network-guard` と `placeholder` の `@smoke` テストが並ぶ（`--reporter=list`
   377	      を付けるのは、設定の reporter が `--list` でも実行 0 件として失敗するため）。
   378	  - `tests/unit/check-model-ids.test.ts`: 一時リポジトリに入力を置いて CLI を実行する。ID は allowlist を
   379	    import して、または命名形式に一致する文字列を実行時に連結して作る。ケース: 直書きなし → 0（6.7）、
   380	    走査対象の種類ごと（`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の
   381	    allowlist ID → 1 と `path:line`（6.3、6.5）、未登録で命名形式に一致 → 1（6.4）、allowlist ファイル内
   382	    → 0（6.1）、`tests/fixtures/**` 内 → 0（6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外
   383	    （`specs/`）→ 0、git リポジトリでない root → 2（9.4）。
   384	  - `tests/unit/hooks-config.test.ts`: `lefthook dump --format=json` と `mise tasks ls --json` を読む。
   385	    `assert_lefthook_installed` が真（7.7）、pre-commit が並列で 4 ジョブ（7.2）、commit-msg ジョブがある
   386	    （7.4）、pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
   387	    （7.5、7.6）、`mise run <task>` で参照するタスクがすべて実在する（7.8）、secrets ジョブが
   388	    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含み `security:audit` が `--audit-level=high` を
   389	    含む（7.8、8.5）。
   390	    タスク側: `check`・`test`・`e2e`・`check:model-ids` が実在し（3.4）、`verify` の別名に `gate` があり
   391	    （3.3）、`verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
   392	    この順で**過不足なく**参照し（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）、
   393	    `security` が `security:osv` → `security:audit` をこの順で過不足なく参照する（4.1）。`check:secrets` が
   394	    `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。`test` / `e2e` の `run` が
   395	    結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、
   396	    `--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
   397	    CI 側: `ci.yml` の `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が
   398	    `mise run verify` を含む（文字列の検査。10.1、10.3）。
   399	    フックの実行（7.1、7.7、I-4）: 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフック
   400	    ファイルができる（7.1）。続けて 2 つのケースを確かめる。lefthook は stage されたファイルがないと
   401	    ジョブを skip して exit 0 になる（実測）ため、どちらもファイルを stage してから実行する。
   402	    1. ジョブのツールが見つからない: `isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で pre-commit
   403	       フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える。round 1 の実測）、`spawnError` なし、
   404	       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ staged
   405	       ファイルを、既定の `isolatedEnv()`（ツールが PATH にある）で実行 → 0。ツール不在でなく別の理由で
   406	       落ちているのを、この対照で除く。
   407	    2. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
   408	       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
   409	       `Can't find lefthook in PATH`（`expectGateFailure`）。対照として
   410	       `assert_lefthook_installed: false` にした設定で同じ操作 → 0（lefthook 2.2.2 で実測: true は exit 1、
   411	       false は exit 0）。`LEFTHOOK_BIN` を偽のパスにする方法は、この分岐を通らず 127 で終わる（実測）ので
   412	       使わない。
   413	  - `tests/unit/check-commit-msg.test.ts`: 正しい形式（type、scope、`!`）→ 0、type 不明・コロンなし・
   414	    件名が空 → 1、`Merge …` / `fixup! …` → 0、コメント行の無視（7.4）。
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。
   431	  - `tests/unit/static-analysis.test.ts`（2.4、2.5 の自動化。設定の後退を検出する）: 一時リポジトリに
   432	    実際の `biome.json`・`tsconfig.json`・`.gitignore` をコピーし、`node_modules` はリポジトリのものへの
   433	    シンボリックリンクにする。違反ファイルを、実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に
   434	    置く。
   435	    - Biome（`resolveTool` で解決した bin。`isolatedEnv()` で実行する）: 明示的な `any`、未使用の変数、
   436	      未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` → `expectGateFailure`、出力に
   437	      `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`（2.4、3.8、3.9。Biome 2.6.8 で
   438	      `it.skip` / `describe.skip` / 本体内の `test.skip` が `noSkippedTests` で検出されることを実測。I-15）。
   439	      `it.todo` と `test.info().skip(…)` は検出されない（実測）ので、ここでは「通る」側のケースとして置き、
   440	      その実行 0 件は reporter（C6・C7）が止めることを `gate-self-check.test.ts` が確かめる。`--stdin-file-path` は `files.includes` を迂回する（Biome の公式ドキュメント）ので使わない。
   441	    - `tsc --noEmit -p`: `src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方のファイルのパス（2.5）。
   442	    - 対照: 違反のないファイルだけ → どちらも `expectGateSuccess`。
   443	    TS 7.1 beta がシンボリックリンクの `node_modules` を解決できない場合は、一時ディレクトリへのコピーに
   444	    切り替え、理由を R-10 に記録する。
   445	  - `tests/unit/docs-structure.test.ts`: `docs/stages/*.md` が「読む → 動かす → 改造する → テストで合格を
   446	    確かめる」の順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。
   447	    `docs/node27/*.md` が 5 つの見出しを持つ（11.5）。
   448	  - `tests/e2e/network-guard.smoke.spec.ts`: `@smoke`。`test.fail()` は**使わない**（失敗の原因を区別せず、
   449	    `page.goto` の失敗など無関係な失敗でも合格になるため）。`test.use({ failOnBlockedRequest: false })` で
   450	    teardown の失敗を止め、`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。
   451	    本文で次の 2 点を assert する: (a) fixture の `blockedRequests` に、その URL が 1 件記録されている、
   452	    (b) ページ内の `fetch` が失敗した（ブラウザまで届いていない）。ガードが壊れると (a) が失敗する
   453	    （3.11、9.6）。
   454	  - 既定の `failOnBlockedRequest: true` で teardown が失敗する経路（3.11 の主経路。上のスモークは
   455	    `failOnBlockedRequest: false` で teardown を止めるので、この経路は通らない）も自動テストにする。
   456	    `tests/unit/gate-self-check.test.ts` に、入れ子の Playwright 実行を 1 つ足す（上の
   457	    `playwright.fixture.config.ts` を使う。`webServer` なしで、本物の `tests/e2e/fixtures.ts` の auto fixture を
   458	    通す）。入力は `tests/fixtures/gate/e2e/external-request.fixture.ts`: `tests/e2e/fixtures.ts` から `test` を
   459	    import し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画する。
   460	    (e) → 失敗、出力に fixture の teardown のメッセージ（遮断した URL の origin。クエリは含まない）。
   461	    対照 `no-external-request.fixture.ts`（外部要求なし）→ 成功。
   462	    **未実測の前提**: `webServer` なしの `about:blank` + `page.setContent` から出す外部要求を、`context.route`
   463	    が捕まえること。実装時に R-9 で確かめる。成り立たない場合は、この経路を R-10 の記録だけに戻さず、
   464	    入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）を
   465	    足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いてユーザーに
   466	    確認する（3.11 の主経路を記録だけにする決定は、本 plan では行わない）。
   467	    ブラウザが使えない環境（未 install）では、スキップせず原因を示して失敗する（C6 の方針）。入れ子実行が
   468	    5 秒を超える場合は R-11 に記録して timeout を見直す。
   469	  - 入れ子実行の入力:
   470	    - Vitest: `tests/fixtures/gate/vitest.fixture.config.ts`、`tests/fixtures/gate/unmocked-network.fixture.ts`、

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '288,430p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 89ms:
   288	### C9 GitHooks
   289	
   290	- **Responsibility**: commit と push の時点で、verify / security と同じ判定基準の検査を自動で実行し、
   291	  ツール不在を成功扱いにしない。
   292	- **Public interface**: `lefthook.yml`（Interfaces の表）。先頭に `assert_lefthook_installed: true`
   293	  （ADR-3）。pre-commit は `parallel: true`、pre-push は `piped: true`。
   294	  `scripts/check-commit-msg.mjs <msg-file>`（ADR-8、CLI 契約は Interfaces）。
   295	- **Owns**: フックとジョブの構成、commit メッセージの規則。
   296	- **Does NOT own**: 各検査の中身（C3・C4・C8 のタスク）、フック設定の自動検査（C12 の
   297	  `hooks-config.test.ts`）、秘密値 commit の受け入れテスト（C10）。
   298	- **Requirements**: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8
   299	
   300	### C10 SecretCommitTest
   301	
   302	- **Responsibility**: 秘密値を含む commit がフックの secrets ジョブで拒否されることを、オフラインの
   303	  自動テストで確かめる（段 1 の合格条件）。
   304	- **Public interface**: `tests/unit/gitleaks-pre-commit.test.ts`。
   305	  1. `lefthook dump --format=json` から `pre-commit.jobs[name="secrets"].run` を取り、空白で分割した argv の
   306	     先頭が `gitleaks` であること、シェルのメタ文字を含まないことを確かめる（8.3、I-5）。
   307	  2. `useTempGitRepo()` で一時リポジトリを作り、`crypto.randomBytes` から組み立てた偽キー（gitleaks の
   308	     既定ルールが検出する形。prefix は文字列連結で組み、検出される形のリテラルをソースに置かない）を
   309	     ファイルに書いて stage し、取得した argv で gitleaks を実行して非 0 を確かめる（8.1、8.4）。
   310	  3. 出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）。
   311	  4. 秘密値なしのファイルだけを stage して同じ argv で実行し、0 を確かめる（8.2）。
   312	  5. フック経由の確認: dump から secrets ジョブだけを抜き出した `lefthook.json`（lefthook 2.2.2 が読むことを
   313	     実測）を一時リポジトリに置いて `lefthook install` し、次を確かめる（段 1 の合格条件「フックで拒否
   314	     される」、7.3）。
   315	     - 偽キーを含む `git commit` → 非 0、commit が作られていない（`git rev-parse --verify HEAD` が失敗するか
   316	       HEAD が変わらない）、出力に gitleaks の検出（`RuleID`）があり偽キーの値を含まない。
   317	     - 秘密値なしの `git commit` → 0、HEAD が新しい commit を指す（対照。identity は `isolatedEnv()` の固定値）。
   318	  6. 設定の一致（8.5）: リポジトリのルートに gitleaks の設定ファイル（`.gitleaks.toml`、`.gitleaksignore`）が
   319	     **ない**ことを確かめる。一時リポジトリの gitleaks は既定の設定で動くため、リポジトリ側に設定があると
   320	     フックとテストで検出規則がずれる。設定が必要になった段は、その plan でテストへのコピー方法を決める。
   321	  子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）。`gitleaks:allow`
   322	  のインライン除外コメントは、secrets ジョブと `check:secrets` の `--ignore-gitleaks-allow` で無効にする
   323	  （8.5 を機械的に守らせる）。
   324	- **Owns**: 偽キーの生成規則と、このテストの判定。
   325	- **Does NOT own**: secrets ジョブの定義（C9）、一時リポジトリと環境の扱い（C6 の `sandbox.ts`）。
   326	- **Requirements**: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 7.3
   327	
   328	### C11 PlaceholderApp
   329	
   330	- **Responsibility**: 段 1 でも verify と pre-push の E2E が空振りしないよう、AI を呼ばない最小のページを
   331	  提供する。
   332	- **Public interface**:
   333	  - `src/app/layout.tsx`: `<html lang="ja">` のルートレイアウトと `metadata`。`next/font/google` など
   334	    ネットワークを使う機能を使わない。
   335	  - `src/app/page.tsx`: RSC。`<h1>` に `genai-lab-ts`、本文に段 1 の案内。`"use client"`、AI SDK、
   336	    `process.env` の参照を含まない。
   337	  - `tests/e2e/placeholder.smoke.spec.ts`: `@smoke` タグ。`/` を開き、レベル 1 の見出し `genai-lab-ts`
   338	    が表示されることを確かめる。`tests/e2e/fixtures.ts` から import する。
   339	- **Owns**: プレースホルダーの表示内容。
   340	- **Does NOT own**: チャット UI と `/api/chat`（段 003）、E2E の実行規則（C7）。
   341	- **Requirements**: 9.1, 9.2, 9.3
   342	
   343	### C12 GateSelfChecks
   344	
   345	- **Responsibility**: ゲートそのもの（0 件実行、未モック通信、モデル ID 検査、フック構成、commit-msg、
   346	  文書の参照）が壊れたら落ちる自己検査を提供する。
   347	- **Public interface**（すべて版番号を期待値にしない。9.9）:
   348	  - `tests/unit/network-guard.test.ts`: `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の
   349	    `vitest run` を 2 回起動する。fixture 設定は実設定を `mergeConfig` で引き継ぐが、`mergeConfig` は配列を
   350	    **連結**する（vite 8.3.8 で実測）ため、`test.include` はマージ後に
   351	    `["tests/fixtures/gate/*.fixture.ts"]` を**代入して置き換える**（連結のままだと本体の
   352	    `tests/unit/**/*.test.ts` が残り、このテスト自身を入れ子で再帰起動する）。各実行では、実行された
   353	    テストファイルが指定した fixture 1 件だけであることを出力から確かめる。(a) `unmocked-network.fixture.ts`
   354	    （`fetch` と `net.connect` を呼び、例外を握りつぶす）→ `expectGateFailure`（出力に `UnmockedNetworkError`）。
   355	    (b) `no-network.fixture.ts` → `expectGateSuccess`（対照。失敗の原因がガードであることを示す）（3.10、9.5）。
   356	  - `tests/unit/gate-self-check.test.ts`: 0 件の検査を、ランナーを直接呼ばずに **`mise.toml` の `test` /
   357	    `e2e` タスクの `run`**（`mise tasks ls --json` から取得。要素は文字列または `{ task }` で、型ガードで絞る）の
   358	    argv に引数を足して実行する（タスクに `--passWithNoTests` などが足されたら、この検査が落ちる）。
   359	    入れ子の Vitest は `--maxWorkers=1`。すべて `expectGateFailure`（失敗の理由を出力で確かめる）と、
   360	    対照の `expectGateSuccess` をそれぞれ併置する。
   361	    - Vitest: (a) `test` の argv + どのファイルにも一致しないフィルタ → 失敗、出力に `No test files found`
   362	      （ファイル 0 件。3.8）。(b) `test` の argv + `--config tests/fixtures/gate/vitest.fixture.config.ts` +
   363	      `tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけを持つ）→ 失敗、出力に `no tests were executed`
   364	      （実行 0 件。reporter だけが止める。I-15）。`it.skip` だけの fixture は置かない（リポジトリの Biome
   365	      `noSkippedTests` に検出され、`biome-ignore` や lint の対象外で逃がすと 3.8 の静的ガードを弱めるため。
   366	      `it.skip` のみの実行を reporter が止めることは I-15 の実測で確かめた）。対照は `network-guard.test.ts` の (b)（実行 1 件以上で 0）。
   367	    - Playwright: 入れ子実行は専用の設定 `tests/fixtures/gate/e2e/playwright.fixture.config.ts` を使う。
   368	      `testDir` は `tests/fixtures/gate/e2e`、`testMatch` は `**/*.fixture.ts`、`webServer` なし、`reporter` は
   369	      本物の `tests/e2e/reporters/require-executed-tests.ts` を読み込む（reporter だけを実物にし、設定の取り違えを
   370	      避ける）。`e2e` の argv の `--config` をこの設定に置き換えて実行する。
   371	      (c) `all-skip.fixture.ts`（`@smoke` の 1 件が `test.info().skip(true, …)` で skip する）→ 失敗、出力に
   372	      `no tests were executed`（3.9。reporter なしでは exit 0 になる。I-15）。対照 `one-pass.fixture.ts`（`@smoke`
   373	      の 1 件が通る）→ 成功。`--grep` の対象は `@smoke` のまま（`e2e` タスクの argv どおり）。
   374	      (d) `e2e` の argv（本物の設定）+ `--list` + `--reporter=list` + `--grep <一致しないタグ>` → 失敗、出力に
   375	      `No tests found`（3.9。`--list` は webServer を起動せず、0 件で exit 1 になる。I-15）。対照: 同じ argv で
   376	      `--grep @smoke` → 成功し、出力に `network-guard` と `placeholder` の `@smoke` テストが並ぶ（`--reporter=list`
   377	      を付けるのは、設定の reporter が `--list` でも実行 0 件として失敗するため）。
   378	  - `tests/unit/check-model-ids.test.ts`: 一時リポジトリに入力を置いて CLI を実行する。ID は allowlist を
   379	    import して、または命名形式に一致する文字列を実行時に連結して作る。ケース: 直書きなし → 0（6.7）、
   380	    走査対象の種類ごと（`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の
   381	    allowlist ID → 1 と `path:line`（6.3、6.5）、未登録で命名形式に一致 → 1（6.4）、allowlist ファイル内
   382	    → 0（6.1）、`tests/fixtures/**` 内 → 0（6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外
   383	    （`specs/`）→ 0、git リポジトリでない root → 2（9.4）。
   384	  - `tests/unit/hooks-config.test.ts`: `lefthook dump --format=json` と `mise tasks ls --json` を読む。
   385	    `assert_lefthook_installed` が真（7.7）、pre-commit が並列で 4 ジョブ（7.2）、commit-msg ジョブがある
   386	    （7.4）、pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
   387	    （7.5、7.6）、`mise run <task>` で参照するタスクがすべて実在する（7.8）、secrets ジョブが
   388	    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含み `security:audit` が `--audit-level=high` を
   389	    含む（7.8、8.5）。
   390	    タスク側: `check`・`test`・`e2e`・`check:model-ids` が実在し（3.4）、`verify` の別名に `gate` があり
   391	    （3.3）、`verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
   392	    この順で**過不足なく**参照し（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）、
   393	    `security` が `security:osv` → `security:audit` をこの順で過不足なく参照する（4.1）。`check:secrets` が
   394	    `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。`test` / `e2e` の `run` が
   395	    結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、
   396	    `--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
   397	    CI 側: `ci.yml` の `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が
   398	    `mise run verify` を含む（文字列の検査。10.1、10.3）。
   399	    フックの実行（7.1、7.7、I-4）: 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフック
   400	    ファイルができる（7.1）。続けて 2 つのケースを確かめる。lefthook は stage されたファイルがないと
   401	    ジョブを skip して exit 0 になる（実測）ため、どちらもファイルを stage してから実行する。
   402	    1. ジョブのツールが見つからない: `isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で pre-commit
   403	       フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える。round 1 の実測）、`spawnError` なし、
   404	       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ staged
   405	       ファイルを、既定の `isolatedEnv()`（ツールが PATH にある）で実行 → 0。ツール不在でなく別の理由で
   406	       落ちているのを、この対照で除く。
   407	    2. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
   408	       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
   409	       `Can't find lefthook in PATH`（`expectGateFailure`）。対照として
   410	       `assert_lefthook_installed: false` にした設定で同じ操作 → 0（lefthook 2.2.2 で実測: true は exit 1、
   411	       false は exit 0）。`LEFTHOOK_BIN` を偽のパスにする方法は、この分岐を通らず 127 で終わる（実測）ので
   412	       使わない。
   413	  - `tests/unit/check-commit-msg.test.ts`: 正しい形式（type、scope、`!`）→ 0、type 不明・コロンなし・
   414	    件名が空 → 1、`Merge …` / `fixup! …` → 0、コメント行の無視（7.4）。
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '343,520p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
   343	### C12 GateSelfChecks
   344	
   345	- **Responsibility**: ゲートそのもの（0 件実行、未モック通信、モデル ID 検査、フック構成、commit-msg、
   346	  文書の参照）が壊れたら落ちる自己検査を提供する。
   347	- **Public interface**（すべて版番号を期待値にしない。9.9）:
   348	  - `tests/unit/network-guard.test.ts`: `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の
   349	    `vitest run` を 2 回起動する。fixture 設定は実設定を `mergeConfig` で引き継ぐが、`mergeConfig` は配列を
   350	    **連結**する（vite 8.3.8 で実測）ため、`test.include` はマージ後に
   351	    `["tests/fixtures/gate/*.fixture.ts"]` を**代入して置き換える**（連結のままだと本体の
   352	    `tests/unit/**/*.test.ts` が残り、このテスト自身を入れ子で再帰起動する）。各実行では、実行された
   353	    テストファイルが指定した fixture 1 件だけであることを出力から確かめる。(a) `unmocked-network.fixture.ts`
   354	    （`fetch` と `net.connect` を呼び、例外を握りつぶす）→ `expectGateFailure`（出力に `UnmockedNetworkError`）。
   355	    (b) `no-network.fixture.ts` → `expectGateSuccess`（対照。失敗の原因がガードであることを示す）（3.10、9.5）。
   356	  - `tests/unit/gate-self-check.test.ts`: 0 件の検査を、ランナーを直接呼ばずに **`mise.toml` の `test` /
   357	    `e2e` タスクの `run`**（`mise tasks ls --json` から取得。要素は文字列または `{ task }` で、型ガードで絞る）の
   358	    argv に引数を足して実行する（タスクに `--passWithNoTests` などが足されたら、この検査が落ちる）。
   359	    入れ子の Vitest は `--maxWorkers=1`。すべて `expectGateFailure`（失敗の理由を出力で確かめる）と、
   360	    対照の `expectGateSuccess` をそれぞれ併置する。
   361	    - Vitest: (a) `test` の argv + どのファイルにも一致しないフィルタ → 失敗、出力に `No test files found`
   362	      （ファイル 0 件。3.8）。(b) `test` の argv + `--config tests/fixtures/gate/vitest.fixture.config.ts` +
   363	      `tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけを持つ）→ 失敗、出力に `no tests were executed`
   364	      （実行 0 件。reporter だけが止める。I-15）。`it.skip` だけの fixture は置かない（リポジトリの Biome
   365	      `noSkippedTests` に検出され、`biome-ignore` や lint の対象外で逃がすと 3.8 の静的ガードを弱めるため。
   366	      `it.skip` のみの実行を reporter が止めることは I-15 の実測で確かめた）。対照は `network-guard.test.ts` の (b)（実行 1 件以上で 0）。
   367	    - Playwright: 入れ子実行は専用の設定 `tests/fixtures/gate/e2e/playwright.fixture.config.ts` を使う。
   368	      `testDir` は `tests/fixtures/gate/e2e`、`testMatch` は `**/*.fixture.ts`、`webServer` なし、`reporter` は
   369	      本物の `tests/e2e/reporters/require-executed-tests.ts` を読み込む（reporter だけを実物にし、設定の取り違えを
   370	      避ける）。`e2e` の argv の `--config` をこの設定に置き換えて実行する。
   371	      (c) `all-skip.fixture.ts`（`@smoke` の 1 件が `test.info().skip(true, …)` で skip する）→ 失敗、出力に
   372	      `no tests were executed`（3.9。reporter なしでは exit 0 になる。I-15）。対照 `one-pass.fixture.ts`（`@smoke`
   373	      の 1 件が通る）→ 成功。`--grep` の対象は `@smoke` のまま（`e2e` タスクの argv どおり）。
   374	      (d) `e2e` の argv（本物の設定）+ `--list` + `--reporter=list` + `--grep <一致しないタグ>` → 失敗、出力に
   375	      `No tests found`（3.9。`--list` は webServer を起動せず、0 件で exit 1 になる。I-15）。対照: 同じ argv で
   376	      `--grep @smoke` → 成功し、出力に `network-guard` と `placeholder` の `@smoke` テストが並ぶ（`--reporter=list`
   377	      を付けるのは、設定の reporter が `--list` でも実行 0 件として失敗するため）。
   378	  - `tests/unit/check-model-ids.test.ts`: 一時リポジトリに入力を置いて CLI を実行する。ID は allowlist を
   379	    import して、または命名形式に一致する文字列を実行時に連結して作る。ケース: 直書きなし → 0（6.7）、
   380	    走査対象の種類ごと（`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の
   381	    allowlist ID → 1 と `path:line`（6.3、6.5）、未登録で命名形式に一致 → 1（6.4）、allowlist ファイル内
   382	    → 0（6.1）、`tests/fixtures/**` 内 → 0（6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外
   383	    （`specs/`）→ 0、git リポジトリでない root → 2（9.4）。
   384	  - `tests/unit/hooks-config.test.ts`: `lefthook dump --format=json` と `mise tasks ls --json` を読む。
   385	    `assert_lefthook_installed` が真（7.7）、pre-commit が並列で 4 ジョブ（7.2）、commit-msg ジョブがある
   386	    （7.4）、pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
   387	    （7.5、7.6）、`mise run <task>` で参照するタスクがすべて実在する（7.8）、secrets ジョブが
   388	    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含み `security:audit` が `--audit-level=high` を
   389	    含む（7.8、8.5）。
   390	    タスク側: `check`・`test`・`e2e`・`check:model-ids` が実在し（3.4）、`verify` の別名に `gate` があり
   391	    （3.3）、`verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
   392	    この順で**過不足なく**参照し（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）、
   393	    `security` が `security:osv` → `security:audit` をこの順で過不足なく参照する（4.1）。`check:secrets` が
   394	    `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。`test` / `e2e` の `run` が
   395	    結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、
   396	    `--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
   397	    CI 側: `ci.yml` の `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が
   398	    `mise run verify` を含む（文字列の検査。10.1、10.3）。
   399	    フックの実行（7.1、7.7、I-4）: 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフック
   400	    ファイルができる（7.1）。続けて 2 つのケースを確かめる。lefthook は stage されたファイルがないと
   401	    ジョブを skip して exit 0 になる（実測）ため、どちらもファイルを stage してから実行する。
   402	    1. ジョブのツールが見つからない: `isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で pre-commit
   403	       フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える。round 1 の実測）、`spawnError` なし、
   404	       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ staged
   405	       ファイルを、既定の `isolatedEnv()`（ツールが PATH にある）で実行 → 0。ツール不在でなく別の理由で
   406	       落ちているのを、この対照で除く。
   407	    2. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
   408	       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
   409	       `Can't find lefthook in PATH`（`expectGateFailure`）。対照として
   410	       `assert_lefthook_installed: false` にした設定で同じ操作 → 0（lefthook 2.2.2 で実測: true は exit 1、
   411	       false は exit 0）。`LEFTHOOK_BIN` を偽のパスにする方法は、この分岐を通らず 127 で終わる（実測）ので
   412	       使わない。
   413	  - `tests/unit/check-commit-msg.test.ts`: 正しい形式（type、scope、`!`）→ 0、type 不明・コロンなし・
   414	    件名が空 → 1、`Merge …` / `fixup! …` → 0、コメント行の無視（7.4）。
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。
   431	  - `tests/unit/static-analysis.test.ts`（2.4、2.5 の自動化。設定の後退を検出する）: 一時リポジトリに
   432	    実際の `biome.json`・`tsconfig.json`・`.gitignore` をコピーし、`node_modules` はリポジトリのものへの
   433	    シンボリックリンクにする。違反ファイルを、実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に
   434	    置く。
   435	    - Biome（`resolveTool` で解決した bin。`isolatedEnv()` で実行する）: 明示的な `any`、未使用の変数、
   436	      未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` → `expectGateFailure`、出力に
   437	      `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`（2.4、3.8、3.9。Biome 2.6.8 で
   438	      `it.skip` / `describe.skip` / 本体内の `test.skip` が `noSkippedTests` で検出されることを実測。I-15）。
   439	      `it.todo` と `test.info().skip(…)` は検出されない（実測）ので、ここでは「通る」側のケースとして置き、
   440	      その実行 0 件は reporter（C6・C7）が止めることを `gate-self-check.test.ts` が確かめる。`--stdin-file-path` は `files.includes` を迂回する（Biome の公式ドキュメント）ので使わない。
   441	    - `tsc --noEmit -p`: `src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方のファイルのパス（2.5）。
   442	    - 対照: 違反のないファイルだけ → どちらも `expectGateSuccess`。
   443	    TS 7.1 beta がシンボリックリンクの `node_modules` を解決できない場合は、一時ディレクトリへのコピーに
   444	    切り替え、理由を R-10 に記録する。
   445	  - `tests/unit/docs-structure.test.ts`: `docs/stages/*.md` が「読む → 動かす → 改造する → テストで合格を
   446	    確かめる」の順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。
   447	    `docs/node27/*.md` が 5 つの見出しを持つ（11.5）。
   448	  - `tests/e2e/network-guard.smoke.spec.ts`: `@smoke`。`test.fail()` は**使わない**（失敗の原因を区別せず、
   449	    `page.goto` の失敗など無関係な失敗でも合格になるため）。`test.use({ failOnBlockedRequest: false })` で
   450	    teardown の失敗を止め、`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。
   451	    本文で次の 2 点を assert する: (a) fixture の `blockedRequests` に、その URL が 1 件記録されている、
   452	    (b) ページ内の `fetch` が失敗した（ブラウザまで届いていない）。ガードが壊れると (a) が失敗する
   453	    （3.11、9.6）。
   454	  - 既定の `failOnBlockedRequest: true` で teardown が失敗する経路（3.11 の主経路。上のスモークは
   455	    `failOnBlockedRequest: false` で teardown を止めるので、この経路は通らない）も自動テストにする。
   456	    `tests/unit/gate-self-check.test.ts` に、入れ子の Playwright 実行を 1 つ足す（上の
   457	    `playwright.fixture.config.ts` を使う。`webServer` なしで、本物の `tests/e2e/fixtures.ts` の auto fixture を
   458	    通す）。入力は `tests/fixtures/gate/e2e/external-request.fixture.ts`: `tests/e2e/fixtures.ts` から `test` を
   459	    import し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画する。
   460	    (e) → 失敗、出力に fixture の teardown のメッセージ（遮断した URL の origin。クエリは含まない）。
   461	    対照 `no-external-request.fixture.ts`（外部要求なし）→ 成功。
   462	    **未実測の前提**: `webServer` なしの `about:blank` + `page.setContent` から出す外部要求を、`context.route`
   463	    が捕まえること。実装時に R-9 で確かめる。成り立たない場合は、この経路を R-10 の記録だけに戻さず、
   464	    入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）を
   465	    足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いてユーザーに
   466	    確認する（3.11 の主経路を記録だけにする決定は、本 plan では行わない）。
   467	    ブラウザが使えない環境（未 install）では、スキップせず原因を示して失敗する（C6 の方針）。入れ子実行が
   468	    5 秒を超える場合は R-11 に記録して timeout を見直す。
   469	  - 入れ子実行の入力:
   470	    - Vitest: `tests/fixtures/gate/vitest.fixture.config.ts`、`tests/fixtures/gate/unmocked-network.fixture.ts`、
   471	      `tests/fixtures/gate/no-network.fixture.ts`、`tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけ。
   472	      Biome の `noSkippedTests` は `todo` を対象にしないので、リポジトリの lint は通る。実測）。
   473	    - Playwright: `tests/fixtures/gate/e2e/playwright.fixture.config.ts`、`all-skip.fixture.ts`、`one-pass.fixture.ts`、
   474	      `external-request.fixture.ts`、`no-external-request.fixture.ts`。skip は `test.info().skip(true, …)` で書く
   475	      （本体内の `test.skip(…)` は Biome が検出するため。実測）。
   476	    - ファイル名は本体の `include`（`*.test.ts`）と Playwright の本体 `testDir`（`tests/e2e`）に一致させない。
   477	      Vitest の fixture は `tests/fixtures/gate/` 直下、Playwright の fixture は `tests/fixtures/gate/e2e/` に分ける
   478	      （`testMatch: "**/*.fixture.ts"` が互いの fixture を拾わないように）。
   479	  - 子プロセスを使うテストファイル（`network-guard`、`gate-self-check`、`gitleaks-pre-commit`、
   480	    `hooks-config`、`check-model-ids`、`static-analysis`、`repo-policy`、`sandbox`）は
   481	    `describe(…, { timeout })` で timeout を明示する（C6）。
   482	- **Owns**: 自己検査の判定と、非空虚の確認手順（research.md R-10）。
   483	- **Does NOT own**: 検査対象の設定そのもの（C2〜C9）。
   484	- **Requirements**: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4,
   485	  3.6, 3.8, 3.9, 3.12, 4.1, 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 8.5, 10.1, 10.3, 10.8, 10.10, 11.1, 11.5, 13.1,
   486	  13.2, 13.5, 13.6
   487	
   488	### C13 CIWorkflows
   489	
   490	- **Responsibility**: フックを回避した変更も同じタスクで止め、依存と Actions の更新候補を週次で受け取る。
   491	- **Public interface**:
   492	  - `.github/workflows/ci.yml`: トリガー `push`（`main`、`exp/**`）、`pull_request`、週次 `schedule`、
   493	    `workflow_dispatch`。最上位 `permissions: {}`、各ジョブ `permissions: { contents: read }`。
   494	    - `verify`（必須チェック名）: `if: github.event_name != 'schedule'`、`runs-on: ubuntu-24.04`。
   495	      checkout（SHA 固定、`fetch-depth: 0`、`persist-credentials: false`）→ mise-action（SHA 固定、mise
   496	      本体の版も exact 指定）→ `pnpm install --frozen-lockfile` → `mise run runtime`（`pnpm exec tsc` /
   497	      `next` を呼ぶため install の後）→
   498	      `pnpm exec playwright install --with-deps chromium` → `mise run verify` → `mise run security` →
   499	      `git status --porcelain` が空であることの確認（verify が追跡ファイルを書き換えないこと。I-11）。
   500	    - `verify-node27`: `continue-on-error: true`、`env: { MISE_ENV: node27 }`。security を除く同じ手順。
   501	  - `.github/workflows/security-daily.yml`: 毎日の `schedule` と `workflow_dispatch`。checkout → mise-action →
   502	    `mise run security`。lockfile だけで動くかを実装時に確かめ、`node_modules` が要る場合は
   503	    `pnpm install --frozen-lockfile` を足す。失敗はワークフローの失敗として GitHub の通知に乗る。
   504	  - `.github/dependabot.yml`: `npm` と `github-actions`（いずれも `directory: "/"`、`schedule.interval: weekly`、
   505	    `cooldown.default-days: 1`、`commit-message.prefix: "build"` + `include: "scope"` で `build(deps):`）。
   506	    npm は 1 つのグループにまとめる（plan §2.1 の週 1 回まとめて上げる）。
   507	  - リポジトリ設定（ファイル外）: ruleset `protect-main` を有効にし、`required_status_checks` に `verify`
   508	    を加える（I-13）。実装時に差分を示し、ユーザーの確認を得てから適用する。
   509	- **Owns**: CI のジョブ構成、権限、Actions の SHA、Dependabot の設定、必須チェックの指定。
   510	- **Does NOT own**: 検査の中身（C3・C4）、AI プロバイダの secret（参照しない）。
   511	- **Requirements**: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 10.11, 10.12
   512	
   513	### C14 Node27Lane
   514	
   515	- **Responsibility**: 既定レーンを壊さずに Node 27 alpha で同じ検査を実行し、結果を失敗も含めて残す。
   516	- **Public interface**:
   517	  - `mise.node27.toml`: `[tools] node = "<24h を満たす最新の 27 alpha>"` だけ。`[settings] prereleases = true`
   518	    は install に必要だった場合だけ書き、理由を R-8 に記録する（I-3）。
   519	  - CI の `verify-node27`（C13 が持つ）。
   520	  - `docs/node27/<YYYY-MM-DD>-initial-lane.md`: 見出し「結論 / 検証した版 / 通したゲート / 未解決事項 /

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '378,487p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 79ms:
   378	  - `tests/unit/check-model-ids.test.ts`: 一時リポジトリに入力を置いて CLI を実行する。ID は allowlist を
   379	    import して、または命名形式に一致する文字列を実行時に連結して作る。ケース: 直書きなし → 0（6.7）、
   380	    走査対象の種類ごと（`src/`、`scripts/`、`tests/`、ルートの設定、`docs/`、`README.md`、`.github/`）の
   381	    allowlist ID → 1 と `path:line`（6.3、6.5）、未登録で命名形式に一致 → 1（6.4）、allowlist ファイル内
   382	    → 0（6.1）、`tests/fixtures/**` 内 → 0（6.6）、gitignore 済みファイル内 → 0（ADR-6）、走査対象外
   383	    （`specs/`）→ 0、git リポジトリでない root → 2（9.4）。
   384	  - `tests/unit/hooks-config.test.ts`: `lefthook dump --format=json` と `mise tasks ls --json` を読む。
   385	    `assert_lefthook_installed` が真（7.7）、pre-commit が並列で 4 ジョブ（7.2）、commit-msg ジョブがある
   386	    （7.4）、pre-push が `piped` で `osv-scanner` → `pnpm-audit` → `unit-tests` → `e2e-smoke` の順
   387	    （7.5、7.6）、`mise run <task>` で参照するタスクがすべて実在する（7.8）、secrets ジョブが
   388	    `--pre-commit --staged --redact --ignore-gitleaks-allow` を含み `security:audit` が `--audit-level=high` を
   389	    含む（7.8、8.5）。
   390	    タスク側: `check`・`test`・`e2e`・`check:model-ids` が実在し（3.4）、`verify` の別名に `gate` があり
   391	    （3.3）、`verify` の `run` が `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` を
   392	    この順で**過不足なく**参照し（`{ task = … }` と `mise run …` のどちらの書き方も受ける。3.1、3.6）、
   393	    `security` が `security:osv` → `security:audit` をこの順で過不足なく参照する（4.1）。`check:secrets` が
   394	    `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）。`test` / `e2e` の `run` が
   395	    結果を緩めるフラグ（`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、
   396	    `--only-changed`、`--allowOnly`）を含まない（3.7〜3.9）。
   397	    CI 側: `ci.yml` の `verify` ジョブが `mise run verify` と `mise run security` を、`verify-node27` が
   398	    `mise run verify` を含む（文字列の検査。10.1、10.3）。
   399	    フックの実行（7.1、7.7、I-4）: 一時リポジトリに実際の設定を置いて `lefthook install` → 3 つのフック
   400	    ファイルができる（7.1）。続けて 2 つのケースを確かめる。lefthook は stage されたファイルがないと
   401	    ジョブを skip して exit 0 になる（実測）ため、どちらもファイルを stage してから実行する。
   402	    1. ジョブのツールが見つからない: `isolatedEnv({ pathDirs: [] })`（`PATH=/usr/bin:/bin`）で pre-commit
   403	       フックを実行 → 終了コード 1（lefthook がジョブの 127 を 1 に変える。round 1 の実測）、`spawnError` なし、
   404	       出力に不在のツール名（`gitleaks`）。実際の文言は R-9 に記録して正規表現に固定する。対照: 同じ staged
   405	       ファイルを、既定の `isolatedEnv()`（ツールが PATH にある）で実行 → 0。ツール不在でなく別の理由で
   406	       落ちているのを、この対照で除く。
   407	    2. lefthook 本体が見つからない: 生成されたフック内の lefthook の絶対パスを一時リポジトリ内で存在しない
   408	       パスに書き換え、`isolatedEnv({ pathDirs: [] })` で実行 → 終了コード 1、出力に
   409	       `Can't find lefthook in PATH`（`expectGateFailure`）。対照として
   410	       `assert_lefthook_installed: false` にした設定で同じ操作 → 0（lefthook 2.2.2 で実測: true は exit 1、
   411	       false は exit 0）。`LEFTHOOK_BIN` を偽のパスにする方法は、この分岐を通らず 127 で終わる（実測）ので
   412	       使わない。
   413	  - `tests/unit/check-commit-msg.test.ts`: 正しい形式（type、scope、`!`）→ 0、type 不明・コロンなし・
   414	    件名が空 → 1、`Merge …` / `fixup! …` → 0、コメント行の無視（7.4）。
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。
   431	  - `tests/unit/static-analysis.test.ts`（2.4、2.5 の自動化。設定の後退を検出する）: 一時リポジトリに
   432	    実際の `biome.json`・`tsconfig.json`・`.gitignore` をコピーし、`node_modules` はリポジトリのものへの
   433	    シンボリックリンクにする。違反ファイルを、実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に
   434	    置く。
   435	    - Biome（`resolveTool` で解決した bin。`isolatedEnv()` で実行する）: 明示的な `any`、未使用の変数、
   436	      未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` → `expectGateFailure`、出力に
   437	      `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`（2.4、3.8、3.9。Biome 2.6.8 で
   438	      `it.skip` / `describe.skip` / 本体内の `test.skip` が `noSkippedTests` で検出されることを実測。I-15）。
   439	      `it.todo` と `test.info().skip(…)` は検出されない（実測）ので、ここでは「通る」側のケースとして置き、
   440	      その実行 0 件は reporter（C6・C7）が止めることを `gate-self-check.test.ts` が確かめる。`--stdin-file-path` は `files.includes` を迂回する（Biome の公式ドキュメント）ので使わない。
   441	    - `tsc --noEmit -p`: `src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方のファイルのパス（2.5）。
   442	    - 対照: 違反のないファイルだけ → どちらも `expectGateSuccess`。
   443	    TS 7.1 beta がシンボリックリンクの `node_modules` を解決できない場合は、一時ディレクトリへのコピーに
   444	    切り替え、理由を R-10 に記録する。
   445	  - `tests/unit/docs-structure.test.ts`: `docs/stages/*.md` が「読む → 動かす → 改造する → テストで合格を
   446	    確かめる」の順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。
   447	    `docs/node27/*.md` が 5 つの見出しを持つ（11.5）。
   448	  - `tests/e2e/network-guard.smoke.spec.ts`: `@smoke`。`test.fail()` は**使わない**（失敗の原因を区別せず、
   449	    `page.goto` の失敗など無関係な失敗でも合格になるため）。`test.use({ failOnBlockedRequest: false })` で
   450	    teardown の失敗を止め、`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。
   451	    本文で次の 2 点を assert する: (a) fixture の `blockedRequests` に、その URL が 1 件記録されている、
   452	    (b) ページ内の `fetch` が失敗した（ブラウザまで届いていない）。ガードが壊れると (a) が失敗する
   453	    （3.11、9.6）。
   454	  - 既定の `failOnBlockedRequest: true` で teardown が失敗する経路（3.11 の主経路。上のスモークは
   455	    `failOnBlockedRequest: false` で teardown を止めるので、この経路は通らない）も自動テストにする。
   456	    `tests/unit/gate-self-check.test.ts` に、入れ子の Playwright 実行を 1 つ足す（上の
   457	    `playwright.fixture.config.ts` を使う。`webServer` なしで、本物の `tests/e2e/fixtures.ts` の auto fixture を
   458	    通す）。入力は `tests/fixtures/gate/e2e/external-request.fixture.ts`: `tests/e2e/fixtures.ts` から `test` を
   459	    import し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画する。
   460	    (e) → 失敗、出力に fixture の teardown のメッセージ（遮断した URL の origin。クエリは含まない）。
   461	    対照 `no-external-request.fixture.ts`（外部要求なし）→ 成功。
   462	    **未実測の前提**: `webServer` なしの `about:blank` + `page.setContent` から出す外部要求を、`context.route`
   463	    が捕まえること。実装時に R-9 で確かめる。成り立たない場合は、この経路を R-10 の記録だけに戻さず、
   464	    入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）を
   465	    足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いてユーザーに
   466	    確認する（3.11 の主経路を記録だけにする決定は、本 plan では行わない）。
   467	    ブラウザが使えない環境（未 install）では、スキップせず原因を示して失敗する（C6 の方針）。入れ子実行が
   468	    5 秒を超える場合は R-11 に記録して timeout を見直す。
   469	  - 入れ子実行の入力:
   470	    - Vitest: `tests/fixtures/gate/vitest.fixture.config.ts`、`tests/fixtures/gate/unmocked-network.fixture.ts`、
   471	      `tests/fixtures/gate/no-network.fixture.ts`、`tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけ。
   472	      Biome の `noSkippedTests` は `todo` を対象にしないので、リポジトリの lint は通る。実測）。
   473	    - Playwright: `tests/fixtures/gate/e2e/playwright.fixture.config.ts`、`all-skip.fixture.ts`、`one-pass.fixture.ts`、
   474	      `external-request.fixture.ts`、`no-external-request.fixture.ts`。skip は `test.info().skip(true, …)` で書く
   475	      （本体内の `test.skip(…)` は Biome が検出するため。実測）。
   476	    - ファイル名は本体の `include`（`*.test.ts`）と Playwright の本体 `testDir`（`tests/e2e`）に一致させない。
   477	      Vitest の fixture は `tests/fixtures/gate/` 直下、Playwright の fixture は `tests/fixtures/gate/e2e/` に分ける
   478	      （`testMatch: "**/*.fixture.ts"` が互いの fixture を拾わないように）。
   479	  - 子プロセスを使うテストファイル（`network-guard`、`gate-self-check`、`gitleaks-pre-commit`、
   480	    `hooks-config`、`check-model-ids`、`static-analysis`、`repo-policy`、`sandbox`）は
   481	    `describe(…, { timeout })` で timeout を明示する（C6）。
   482	- **Owns**: 自己検査の判定と、非空虚の確認手順（research.md R-10）。
   483	- **Does NOT own**: 検査対象の設定そのもの（C2〜C9）。
   484	- **Requirements**: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4,
   485	  3.6, 3.8, 3.9, 3.12, 4.1, 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 8.5, 10.1, 10.3, 10.8, 10.10, 11.1, 11.5, 13.1,
   486	  13.2, 13.5, 13.6
   487	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '415,487p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 91ms:
   415	  - `tests/unit/repo-policy.test.ts`（リポジトリの静的な規約。値はツールの出力か JSON から読む）:
   416	    - 版: `package.json` の全依存が exact（範囲記号・dist-tag なし）（1.2）。`mise ls --current --json` の
   417	      出力を、`source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけに絞る（ユーザー全体の
   418	      設定のツールが混ざる。実測）。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）が
   419	      すべてプロジェクトのファイル由来で、要求版が exact、`latest` を含まない（1.1）。既定レーンは子プロセスの
   420	      環境から `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示して照会する（CI の
   421	      verify-node27 は `MISE_ENV` を継承するため）。2 つのレーンで node 以外のツールの版が等しい（11.1）。`minimumReleaseAge` が 1440 で `minimumReleaseAgeExclude` が
   422	      ない（1.4）。`sharp` の `allowBuilds` が `false`（1.5）。`packageManager` の版が mise の pnpm の版と
   423	      **一致**する（1.6。2 つの設定の比較で、固定値の照合ではない）。
   424	    - 規約: ルートに ESLint / Prettier などの設定ファイルがない（2.1）。`biome.json` の 3 ルールが `"error"`
   425	      （2.2）。`tsc --showConfig` の `strict` が真（2.3）。
   426	    - 配置: `git ls-files` で、`*.test.ts` / `*.spec.ts` が `tests/unit/` と `tests/e2e/` の外にない（9.8）。
   427	    - CI: ワークフローのすべての `uses:` が 40 桁の SHA で固定されている（10.8）。`secrets.` の参照が
   428	      `GITHUB_TOKEN` 以外にない（10.10）。
   429	    - 秘密ファイル: `.env.example` の各行が値を持たない（13.5）。`git check-ignore` で `.env`、`.env.local`、
   430	      `.next/`、`test-results/`、`playwright-report/` が無視される（13.6）。
   431	  - `tests/unit/static-analysis.test.ts`（2.4、2.5 の自動化。設定の後退を検出する）: 一時リポジトリに
   432	    実際の `biome.json`・`tsconfig.json`・`.gitignore` をコピーし、`node_modules` はリポジトリのものへの
   433	    シンボリックリンクにする。違反ファイルを、実際の走査対象と同じパス（`src/`、`tests/unit/`、`tests/e2e/`）に
   434	    置く。
   435	    - Biome（`resolveTool` で解決した bin。`isolatedEnv()` で実行する）: 明示的な `any`、未使用の変数、
   436	      未使用の import、`it.skip`、`describe.skip`、テスト本体内の `test.skip(…)` → `expectGateFailure`、出力に
   437	      `noExplicitAny`・`noUnusedVariables`・`noUnusedImports`・`noSkippedTests`（2.4、3.8、3.9。Biome 2.6.8 で
   438	      `it.skip` / `describe.skip` / 本体内の `test.skip` が `noSkippedTests` で検出されることを実測。I-15）。
   439	      `it.todo` と `test.info().skip(…)` は検出されない（実測）ので、ここでは「通る」側のケースとして置き、
   440	      その実行 0 件は reporter（C6・C7）が止めることを `gate-self-check.test.ts` が確かめる。`--stdin-file-path` は `files.includes` を迂回する（Biome の公式ドキュメント）ので使わない。
   441	    - `tsc --noEmit -p`: `src/` と `tests/` に型エラー → `expectGateFailure`、出力に両方のファイルのパス（2.5）。
   442	    - 対照: 違反のないファイルだけ → どちらも `expectGateSuccess`。
   443	    TS 7.1 beta がシンボリックリンクの `node_modules` を解決できない場合は、一時ディレクトリへのコピーに
   444	    切り替え、理由を R-10 に記録する。
   445	  - `tests/unit/docs-structure.test.ts`: `docs/stages/*.md` が「読む → 動かす → 改造する → テストで合格を
   446	    確かめる」の順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。
   447	    `docs/node27/*.md` が 5 つの見出しを持つ（11.5）。
   448	  - `tests/e2e/network-guard.smoke.spec.ts`: `@smoke`。`test.fail()` は**使わない**（失敗の原因を区別せず、
   449	    `page.goto` の失敗など無関係な失敗でも合格になるため）。`test.use({ failOnBlockedRequest: false })` で
   450	    teardown の失敗を止め、`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。
   451	    本文で次の 2 点を assert する: (a) fixture の `blockedRequests` に、その URL が 1 件記録されている、
   452	    (b) ページ内の `fetch` が失敗した（ブラウザまで届いていない）。ガードが壊れると (a) が失敗する
   453	    （3.11、9.6）。
   454	  - 既定の `failOnBlockedRequest: true` で teardown が失敗する経路（3.11 の主経路。上のスモークは
   455	    `failOnBlockedRequest: false` で teardown を止めるので、この経路は通らない）も自動テストにする。
   456	    `tests/unit/gate-self-check.test.ts` に、入れ子の Playwright 実行を 1 つ足す（上の
   457	    `playwright.fixture.config.ts` を使う。`webServer` なしで、本物の `tests/e2e/fixtures.ts` の auto fixture を
   458	    通す）。入力は `tests/fixtures/gate/e2e/external-request.fixture.ts`: `tests/e2e/fixtures.ts` から `test` を
   459	    import し、`page.setContent` で外部オリジン（`.invalid` ドメイン）への要求を出すページを描画する。
   460	    (e) → 失敗、出力に fixture の teardown のメッセージ（遮断した URL の origin。クエリは含まない）。
   461	    対照 `no-external-request.fixture.ts`（外部要求なし）→ 成功。
   462	    **未実測の前提**: `webServer` なしの `about:blank` + `page.setContent` から出す外部要求を、`context.route`
   463	    が捕まえること。実装時に R-9 で確かめる。成り立たない場合は、この経路を R-10 の記録だけに戻さず、
   464	    入れ子実行の設定に最小の静的サーバー（`webServer` に Node の組み込み `http` を使う 1 行のコマンド）を
   465	    足して `/` を配信する案に切り替える。それでも自動化できないときだけ、理由を R-10 に書いてユーザーに
   466	    確認する（3.11 の主経路を記録だけにする決定は、本 plan では行わない）。
   467	    ブラウザが使えない環境（未 install）では、スキップせず原因を示して失敗する（C6 の方針）。入れ子実行が
   468	    5 秒を超える場合は R-11 に記録して timeout を見直す。
   469	  - 入れ子実行の入力:
   470	    - Vitest: `tests/fixtures/gate/vitest.fixture.config.ts`、`tests/fixtures/gate/unmocked-network.fixture.ts`、
   471	      `tests/fixtures/gate/no-network.fixture.ts`、`tests/fixtures/gate/all-todo.fixture.ts`（`it.todo` だけ。
   472	      Biome の `noSkippedTests` は `todo` を対象にしないので、リポジトリの lint は通る。実測）。
   473	    - Playwright: `tests/fixtures/gate/e2e/playwright.fixture.config.ts`、`all-skip.fixture.ts`、`one-pass.fixture.ts`、
   474	      `external-request.fixture.ts`、`no-external-request.fixture.ts`。skip は `test.info().skip(true, …)` で書く
   475	      （本体内の `test.skip(…)` は Biome が検出するため。実測）。
   476	    - ファイル名は本体の `include`（`*.test.ts`）と Playwright の本体 `testDir`（`tests/e2e`）に一致させない。
   477	      Vitest の fixture は `tests/fixtures/gate/` 直下、Playwright の fixture は `tests/fixtures/gate/e2e/` に分ける
   478	      （`testMatch: "**/*.fixture.ts"` が互いの fixture を拾わないように）。
   479	  - 子プロセスを使うテストファイル（`network-guard`、`gate-self-check`、`gitleaks-pre-commit`、
   480	    `hooks-config`、`check-model-ids`、`static-analysis`、`repo-policy`、`sandbox`）は
   481	    `describe(…, { timeout })` で timeout を明示する（C6）。
   482	- **Owns**: 自己検査の判定と、非空虚の確認手順（research.md R-10）。
   483	- **Does NOT own**: 検査対象の設定そのもの（C2〜C9）。
   484	- **Requirements**: 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 1.1, 1.2, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 3.4,
   485	  3.6, 3.8, 3.9, 3.12, 4.1, 7.1, 7.2, 7.4, 7.5, 7.6, 7.7, 7.8, 8.5, 10.1, 10.3, 10.8, 10.10, 11.1, 11.5, 13.1,
   486	  13.2, 13.5, 13.6
   487	

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '513,690p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
   513	### C14 Node27Lane
   514	
   515	- **Responsibility**: 既定レーンを壊さずに Node 27 alpha で同じ検査を実行し、結果を失敗も含めて残す。
   516	- **Public interface**:
   517	  - `mise.node27.toml`: `[tools] node = "<24h を満たす最新の 27 alpha>"` だけ。`[settings] prereleases = true`
   518	    は install に必要だった場合だけ書き、理由を R-8 に記録する（I-3）。
   519	  - CI の `verify-node27`（C13 が持つ）。
   520	  - `docs/node27/<YYYY-MM-DD>-initial-lane.md`: 見出し「結論 / 検証した版 / 通したゲート / 未解決事項 /
   521	    再現手順」。verify が失敗した場合は、失敗した検査と出力の要点を「未解決事項」に書く。
   522	  - README の Node 27 節: `git worktree add --detach ../genai-lab-ts-node27 HEAD` で別 worktree を作り、
   523	    `MISE_ENV=node27` で `mise install` → `pnpm install --frozen-lockfile` → `mise run verify` を実行し、
   524	    終了後に `git worktree remove` する手順。フックは worktree 間で共有されるため再 install しない。
   525	- **Owns**: Node 27 の版、初回記録、worktree 手順。
   526	- **Does NOT own**: `exp/node27` ブランチ（必要になった時点の別作業）、Node 27 で verify が緑になること。
   527	- **Requirements**: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7
   528	
   529	### C15 ZipVerification
   530	
   531	- **Responsibility**: ZIP ガイドの未検証項目（plan §8 の 5 項目）を実測で確定し、段 003〜006 の入力として
   532	  research.md に残す。
   533	- **Public interface**（手順。成果物は research.md だけ）:
   534	  1. リポジトリ外の一時ディレクトリに ZIP を展開する。
   535	  2. `package.json` の dist-tag と範囲を、C1 と同じ版（共有する依存）と、24h を満たす最新の exact 版
   536	     （AI SDK、プロバイダ、Zod、`@vitejs/plugin-react`）に置き換える。`pnpm-workspace.yaml` は C1 と同じ
   537	     規則にする（`minimumReleaseAgeExclude` なし）。
   538	  3. `pnpm install` → peer 警告の記録（R-2、plan §8 の 3 項目目）。
   539	  4. `pnpm exec tsc --noEmit` → ファイルごとの型エラーと AI SDK 7 の実際の型との差異（12.2）。
   540	  5. `node_modules/ai` の型定義で `toolApproval`、`isStepCount`、`toUIMessageStream`、
   541	     `createUIMessageStreamResponse`、`convertToModelMessages`、`ToolLoopAgent`、`Output`、
   542	     `MockLanguageModelV4`（`ai/test`）、content の `tool-approval-request` 型の有無を API ごとに照合（12.3、
   543	     plan §8 の 2 項目目）。
   544	  6. `pnpm exec vitest run` と `pnpm exec playwright test --grep @smoke` → SSE モックが `useChat` で
   545	     解釈されたか（12.4、plan §8 の 4 項目目）。
   546	  7. 一時ディレクトリを削除する。ZIP のコードとテストは `src/` / `tests/` に入れない（12.7）。
   547	  あわせて、リポジトリ側で `MISE_ENV=node27 mise install`（R-8、plan §8 の 1 項目目）と TypeScript 7.1 の
   548	  RC / stable の公開状況（R-7、12.5 / 12.6、plan §8 の 5 項目目）を確認する。
   549	- **Owns**: research.md の R-1〜R-11 の記録。
   550	- **Does NOT own**: ZIP のアプリコードの修正と実装（段 003〜006）。
   551	- **Requirements**: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 1.3, 1.9, 6.2, 11.3
   552	
   553	### C16 DocsAndGovernance
   554	
   555	- **Responsibility**: 学習者向けの解説と README、統治文書と計画の記述を、本 spec の決定と取り込んだ実際の
   556	  構成に一致させる。
   557	- **Public interface**:
   558	  - `docs/stages/1-dev-environment-and-gates.md`: 節「読む / 動かす / 改造する / テストで合格を確かめる」。
   559	    合格条件ごとの判定テストのパス（オフライン verify → `tests/unit/network-guard.test.ts`・
   560	    `tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`、秘密値 commit の拒否 →
   561	    `tests/unit/gitleaks-pre-commit.test.ts`・`tests/unit/hooks-config.test.ts`）。
   562	  - `README.md`: mise の有効化（`mise activate`）、`mise trust && mise install`、`mise run setup`、
   563	    `mise run verify`、mise を有効にしていない Git クライアントではフックが失敗すること、コマンド一覧、
   564	    Node 27 の worktree 手順（C14）、統治文書へのリンク。
   565	  - `.env.example`: 変数名だけ（`AI_PROVIDER=`、`AI_MODEL=`、各 API キー、`OLLAMA_BASE_URL=`）。値を書かない。
   566	  - `.gitignore`: 既存の `.env` / `.env.*`（`!.env.example`）/ `.next` / Playwright 成果物に加えて、
   567	    `next-env.d.ts`、`mise.local.toml`、`mise.*.local.toml`、`.vitest/`、`.build/`（I-4 の副作用）。
   568	  - `.sdd/memory/constitution.md`: 原則 3 の MINOR 改訂（1.0.0 → 1.1.0）、Sync Impact Report、改訂履歴。
   569	  - `AGENTS.md`: コマンド表を実在するタスクと一致させ、"Current state" を段 1 完了後に更新する。
   570	  - `.sdd/steering/tech.md`（Gate command、Supply Chain の gitleaks の置き場）、`structure.md`（状態注記、
   571	    `tests/unit/setup/`・`tests/unit/helpers/`・`tests/fixtures/` の役割）、`product.md`（状態注記）。
   572	  - `specs/000-development-plan/plan.md`: §4（gitleaks 全履歴は verify に移る）、§7 M1（`exp/node27` は
   573	    必要時に作る）、§8.5（`src/` / `tests/` は基盤のみ、`gate` 別名、ADR-4 の依存の扱い）、
   574	    Constitution Compliance 節（憲章が制定済みであること）に、本 spec の Clarifications を参照する改訂注記。
   575	  - 文書中の版番号は「確認日つきの参考値」と明記し、合否の条件にしない。
   576	- **Owns**: 解説、README、統治文書と計画の記述の整合。
   577	- **Does NOT own**: 文書構造の自動検査（C12 の `docs-structure.test.ts`）、research.md（C15）。
   578	- **Requirements**: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 13.12, 11.7
   579	
   580	## Data Model
   581	
   582	段 1 は永続データを持たない。以下は、設定とテストの間で受け渡す型である。外部ツールの JSON 出力は
   583	`unknown` として受け、型ガードで絞ってから使う（`any` と根拠のない型アサーションを使わない。憲章 原則 7）。
   584	
   585	```mermaid
   586	erDiagram
   587	  PROVIDER ||--|{ MODEL_ID : "MODEL_ALLOWLIST"
   588	  SCANNED_FILE ||--o{ MODEL_ID_FINDING : "check:model-ids"
   589	  MODEL_ID ||--o{ MODEL_ID_FINDING : "source = allowlist"
   590	  LEFTHOOK_JOB }o--o| MISE_TASK : "run = mise run <task>"
   591	  TEST ||--o{ NETWORK_VIOLATION : "guard records"
   592	```
   593	
   594	| Entity | Field | Type | Notes |
   595	|--------|-------|------|-------|
   596	| `Provider` | — | `(typeof PROVIDERS)[number]` | `"openai" \| "anthropic" \| "google" \| "ollama"` |
   597	| `MODEL_ALLOWLIST` | `[P in Provider]` | `readonly string[]`（`as const`） | 唯一の定義（6.1）。値は R-5 で確認 |
   598	| `AllowedModelId<P>` | — | `(typeof MODEL_ALLOWLIST)[P][number]` | 段 006 の Zod 検証が使う |
   599	| `ModelIdFinding` | `path` | `string` | root からの相対パス（POSIX 区切り） |
   600	| | `line` / `column` | `number` | 1 始まり |
   601	| | `match` | `string` | 一致した文字列（モデル ID は秘密値ではない） |
   602	| | `source` | `"allowlist"` または `` `pattern:${string}` ``（テンプレートリテラル型） | 検出の根拠（6.4 の区別） |
   603	| `CommandResult` | `status` | `number \| null` | `spawnSync` の終了コード。シグナル終了は `null` |
   604	| | `signal` | `NodeJS.Signals \| null` | |
   605	| | `stdout` / `stderr` | `string` | UTF-8 |
   606	| `LefthookDump`（部分） | `assert_lefthook_installed` | `boolean \| undefined` | `lefthook dump --format=json` |
   607	| | `"pre-commit" \| "commit-msg" \| "pre-push"` | `HookConfig \| undefined` | |
   608	| `HookConfig` | `parallel` / `piped` | `boolean \| undefined` | |
   609	| | `jobs` | `ReadonlyArray<{ name: string; run: string }>` | |
   610	| `MiseTaskRunItem` | — | `string \| { task: string }` | `run` の 1 要素。`{ task = "check" }` は `{"task":"check"}` になる。型ガード `isTaskRef(item)` で絞る（実測。I-16） |
   611	| `MiseTaskInfo`（部分） | `name` / `aliases` / `run` | `string` / `readonly string[]` / `ReadonlyArray<MiseTaskRunItem>` | `mise tasks ls --json`。単一の文字列の `run` も配列で返る（実測。I-16） |
   612	| `NetworkViolation`（unit） | `kind` / `target` | `"socket" \| "fetch"` / `string` | ガードが記録し `afterEach` で検査 |
   613	| `ExternalRequestViolation`（E2E） | `method` / `url` | `string` / `string` | fixture が記録し teardown で検査 |
   614	
   615	## Interfaces / Contracts
   616	
   617	### mise タスク（`mise.toml`）
   618	
   619	すべてのタスクは `description` を持つ。`verify` と `security` の構成要素は直列で、最初の失敗で止まる（I-3）。
   620	
   621	| Task | 実行内容 | ネットワーク | 呼び出し元 | Req |
   622	|------|----------|--------------|------------|-----|
   623	| `check` | `pnpm exec biome check .` | 不要 | verify | 2.4, 3.4 |
   624	| `typecheck` | `pnpm exec next typegen` → `pnpm exec tsc --noEmit` | 不要 | verify、pre-commit | 2.5 |
   625	| `check:model-ids` | `node scripts/check-model-ids.mjs` | 不要 | verify、pre-commit | 6.3 |
   626	| `check:secrets` | `gitleaks git --redact --ignore-gitleaks-allow --verbose --log-opts=HEAD`（HEAD から到達できる全履歴。既定の `--all` は別ブランチ・stash も走査し 3.7 を崩す） | 不要 | verify | 3.12 |
   627	| `test` | `pnpm exec vitest run` | 不要 | verify、pre-push | 3.4 |
   628	| `e2e` | `pnpm exec playwright test --grep @smoke` | 不要 | verify、pre-push | 3.4 |
   629	| `verify`（`alias = "gate"`） | `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` | 不要 | 開発者、CI | 3.1〜3.3 |
   630	| `security:osv` | `osv-scanner scan source --lockfile=pnpm-lock.yaml` | 必要 | security、pre-push | 4.3 |
   631	| `security:audit` | `pnpm audit --audit-level=high` | 必要 | security、pre-push | 4.2 |
   632	| `security` | `security:osv` → `security:audit` | 必要 | CI、security-daily | 4.1 |
   633	| `runtime` | 7 種の版の出力（C5） | 不要 | CI のログ | 5.1, 5.2 |
   634	| `outdated` | `mise outdated` → `pnpm outdated`（候補ありで exit 1） | 必要 | 週次の手作業 | 5.3, 5.4 |
   635	| `setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3 |
   636	
   637	### lefthook ジョブ（`lefthook.yml`）
   638	
   639	| Hook | 実行方式 | Job name | run | Req |
   640	|------|----------|----------|-----|-----|
   641	| （全体） | — | — | `assert_lefthook_installed: true` | 7.7 |
   642	| pre-commit | `parallel: true` | `secrets` | `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose` | 7.2, 8.3, 8.5 |
   643	| | | `biome` | `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true` | 7.2 |
   644	| | | `typecheck` | `mise run typecheck` | 7.2, 7.8 |
   645	| | | `model-ids` | `mise run check:model-ids` | 7.2, 7.8 |
   646	| commit-msg | — | `conventional` | `node scripts/check-commit-msg.mjs {1}` | 7.4 |
   647	| pre-push | `piped: true` | `osv-scanner` | `mise run security:osv` | 7.5, 7.8 |
   648	| | | `pnpm-audit` | `mise run security:audit` | 7.5, 7.8 |
   649	| | | `unit-tests` | `mise run test` | 7.5, 7.8 |
   650	| | | `e2e-smoke` | `mise run e2e` | 7.5, 7.8 |
   651	
   652	pre-commit の typecheck は glob で絞らない（`tsconfig.json` や `package.json` だけの変更でも型は変わりうる）。
   653	
   654	### CLI: `scripts/check-model-ids.mjs`
   655	
   656	| 項目 | 契約 |
   657	|------|------|
   658	| 引数 | `[--root <dir>]`。省略時は `process.cwd()`。それ以外の引数は使い方の誤り |
   659	| 走査候補 | `git -C <root> ls-files --cached --others --exclude-standard -z` |
   660	| 走査対象（6.5） | `src/**`、`scripts/**`、`tests/**`、`docs/**`、`.github/**`、`README.md`、`.env.example`、ルート直下の `*.{ts,mts,cts,js,mjs,cjs,json,jsonc,yaml,yml,toml}` |
   661	| 除外 | `src/lib/ai/model-allowlist.ts`（6.1）、`tests/fixtures/**`（6.6）、`pnpm-lock.yaml`、NUL バイトを含むファイル |
   662	| 検出 | allowlist の全 ID（単語境界つきの完全一致）と、プロバイダ命名形式の正規表現（C8） |
   663	| exit 0 | 検出 0 件。stdout に走査ファイル数と 0 件の要約（6.7） |
   664	| exit 1 | 検出 1 件以上。stderr に 1 件 1 行で `<path>:<line>:<column>: <match> (<source>)`（6.3） |
   665	| exit 2 | 使い方の誤り、git の失敗（root が git リポジトリでない等）、allowlist の読み込み失敗。0 にしない |
   666	
   667	### CLI: `scripts/check-commit-msg.mjs`
   668	
   669	| 項目 | 契約 |
   670	|------|------|
   671	| 引数 | `<msg-file>`（lefthook の `{1}`） |
   672	| 判定対象 | `#` で始まる行と空行を除いた最初の行 |
   673	| 合格 | `^(build\|chore\|ci\|docs\|feat\|fix\|perf\|refactor\|revert\|style\|test)(\([^()\s]+\))?!?: \S` に一致、または `Merge `・`Revert "`・`fixup! `・`squash! `・`amend! ` で始まる |
   674	| exit 0 / 1 / 2 | 合格 / 不合格（期待する形式と例を stderr に出す）/ 引数なし・読めない |
   675	
   676	### unit の通信ガード（`tests/unit/setup/network-guard.ts`）
   677	
   678	- `net.Socket.prototype.connect` と `globalThis.fetch` を置き換える。ローカルホスト・UNIX ソケットを含め
   679	  例外なく遮断する。
   680	- 呼ばれたら `UnmockedNetworkError`（`name` が固定のエラー）を投げ、違反を記録する。メッセージには接続先の
   681	  ホストとポート（または URL のオリジン）だけを含め、クエリやヘッダーは含めない。
   682	- `afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする。
   683	
   684	### E2E fixture（`tests/e2e/fixtures.ts`）
   685	
   686	- `export const test`（`@playwright/test` の `test.extend` に auto fixture `networkGuard` を加えたもの）、
   687	  `export { expect }`。
   688	- 許可: `baseURL` と同じオリジン。`data:` / `blob:` は route の対象外。
   689	- 遮断: それ以外のオリジンを `route.abort("blockedbyclient")` し、`{ method, url }` を記録する。
   690	- 公開: `blockedRequests`（`readonly ExternalRequestViolation[]`）と option fixture

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '553,755p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 89ms:
   553	### C16 DocsAndGovernance
   554	
   555	- **Responsibility**: 学習者向けの解説と README、統治文書と計画の記述を、本 spec の決定と取り込んだ実際の
   556	  構成に一致させる。
   557	- **Public interface**:
   558	  - `docs/stages/1-dev-environment-and-gates.md`: 節「読む / 動かす / 改造する / テストで合格を確かめる」。
   559	    合格条件ごとの判定テストのパス（オフライン verify → `tests/unit/network-guard.test.ts`・
   560	    `tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`、秘密値 commit の拒否 →
   561	    `tests/unit/gitleaks-pre-commit.test.ts`・`tests/unit/hooks-config.test.ts`）。
   562	  - `README.md`: mise の有効化（`mise activate`）、`mise trust && mise install`、`mise run setup`、
   563	    `mise run verify`、mise を有効にしていない Git クライアントではフックが失敗すること、コマンド一覧、
   564	    Node 27 の worktree 手順（C14）、統治文書へのリンク。
   565	  - `.env.example`: 変数名だけ（`AI_PROVIDER=`、`AI_MODEL=`、各 API キー、`OLLAMA_BASE_URL=`）。値を書かない。
   566	  - `.gitignore`: 既存の `.env` / `.env.*`（`!.env.example`）/ `.next` / Playwright 成果物に加えて、
   567	    `next-env.d.ts`、`mise.local.toml`、`mise.*.local.toml`、`.vitest/`、`.build/`（I-4 の副作用）。
   568	  - `.sdd/memory/constitution.md`: 原則 3 の MINOR 改訂（1.0.0 → 1.1.0）、Sync Impact Report、改訂履歴。
   569	  - `AGENTS.md`: コマンド表を実在するタスクと一致させ、"Current state" を段 1 完了後に更新する。
   570	  - `.sdd/steering/tech.md`（Gate command、Supply Chain の gitleaks の置き場）、`structure.md`（状態注記、
   571	    `tests/unit/setup/`・`tests/unit/helpers/`・`tests/fixtures/` の役割）、`product.md`（状態注記）。
   572	  - `specs/000-development-plan/plan.md`: §4（gitleaks 全履歴は verify に移る）、§7 M1（`exp/node27` は
   573	    必要時に作る）、§8.5（`src/` / `tests/` は基盤のみ、`gate` 別名、ADR-4 の依存の扱い）、
   574	    Constitution Compliance 節（憲章が制定済みであること）に、本 spec の Clarifications を参照する改訂注記。
   575	  - 文書中の版番号は「確認日つきの参考値」と明記し、合否の条件にしない。
   576	- **Owns**: 解説、README、統治文書と計画の記述の整合。
   577	- **Does NOT own**: 文書構造の自動検査（C12 の `docs-structure.test.ts`）、research.md（C15）。
   578	- **Requirements**: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10, 13.11, 13.12, 11.7
   579	
   580	## Data Model
   581	
   582	段 1 は永続データを持たない。以下は、設定とテストの間で受け渡す型である。外部ツールの JSON 出力は
   583	`unknown` として受け、型ガードで絞ってから使う（`any` と根拠のない型アサーションを使わない。憲章 原則 7）。
   584	
   585	```mermaid
   586	erDiagram
   587	  PROVIDER ||--|{ MODEL_ID : "MODEL_ALLOWLIST"
   588	  SCANNED_FILE ||--o{ MODEL_ID_FINDING : "check:model-ids"
   589	  MODEL_ID ||--o{ MODEL_ID_FINDING : "source = allowlist"
   590	  LEFTHOOK_JOB }o--o| MISE_TASK : "run = mise run <task>"
   591	  TEST ||--o{ NETWORK_VIOLATION : "guard records"
   592	```
   593	
   594	| Entity | Field | Type | Notes |
   595	|--------|-------|------|-------|
   596	| `Provider` | — | `(typeof PROVIDERS)[number]` | `"openai" \| "anthropic" \| "google" \| "ollama"` |
   597	| `MODEL_ALLOWLIST` | `[P in Provider]` | `readonly string[]`（`as const`） | 唯一の定義（6.1）。値は R-5 で確認 |
   598	| `AllowedModelId<P>` | — | `(typeof MODEL_ALLOWLIST)[P][number]` | 段 006 の Zod 検証が使う |
   599	| `ModelIdFinding` | `path` | `string` | root からの相対パス（POSIX 区切り） |
   600	| | `line` / `column` | `number` | 1 始まり |
   601	| | `match` | `string` | 一致した文字列（モデル ID は秘密値ではない） |
   602	| | `source` | `"allowlist"` または `` `pattern:${string}` ``（テンプレートリテラル型） | 検出の根拠（6.4 の区別） |
   603	| `CommandResult` | `status` | `number \| null` | `spawnSync` の終了コード。シグナル終了は `null` |
   604	| | `signal` | `NodeJS.Signals \| null` | |
   605	| | `stdout` / `stderr` | `string` | UTF-8 |
   606	| `LefthookDump`（部分） | `assert_lefthook_installed` | `boolean \| undefined` | `lefthook dump --format=json` |
   607	| | `"pre-commit" \| "commit-msg" \| "pre-push"` | `HookConfig \| undefined` | |
   608	| `HookConfig` | `parallel` / `piped` | `boolean \| undefined` | |
   609	| | `jobs` | `ReadonlyArray<{ name: string; run: string }>` | |
   610	| `MiseTaskRunItem` | — | `string \| { task: string }` | `run` の 1 要素。`{ task = "check" }` は `{"task":"check"}` になる。型ガード `isTaskRef(item)` で絞る（実測。I-16） |
   611	| `MiseTaskInfo`（部分） | `name` / `aliases` / `run` | `string` / `readonly string[]` / `ReadonlyArray<MiseTaskRunItem>` | `mise tasks ls --json`。単一の文字列の `run` も配列で返る（実測。I-16） |
   612	| `NetworkViolation`（unit） | `kind` / `target` | `"socket" \| "fetch"` / `string` | ガードが記録し `afterEach` で検査 |
   613	| `ExternalRequestViolation`（E2E） | `method` / `url` | `string` / `string` | fixture が記録し teardown で検査 |
   614	
   615	## Interfaces / Contracts
   616	
   617	### mise タスク（`mise.toml`）
   618	
   619	すべてのタスクは `description` を持つ。`verify` と `security` の構成要素は直列で、最初の失敗で止まる（I-3）。
   620	
   621	| Task | 実行内容 | ネットワーク | 呼び出し元 | Req |
   622	|------|----------|--------------|------------|-----|
   623	| `check` | `pnpm exec biome check .` | 不要 | verify | 2.4, 3.4 |
   624	| `typecheck` | `pnpm exec next typegen` → `pnpm exec tsc --noEmit` | 不要 | verify、pre-commit | 2.5 |
   625	| `check:model-ids` | `node scripts/check-model-ids.mjs` | 不要 | verify、pre-commit | 6.3 |
   626	| `check:secrets` | `gitleaks git --redact --ignore-gitleaks-allow --verbose --log-opts=HEAD`（HEAD から到達できる全履歴。既定の `--all` は別ブランチ・stash も走査し 3.7 を崩す） | 不要 | verify | 3.12 |
   627	| `test` | `pnpm exec vitest run` | 不要 | verify、pre-push | 3.4 |
   628	| `e2e` | `pnpm exec playwright test --grep @smoke` | 不要 | verify、pre-push | 3.4 |
   629	| `verify`（`alias = "gate"`） | `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` | 不要 | 開発者、CI | 3.1〜3.3 |
   630	| `security:osv` | `osv-scanner scan source --lockfile=pnpm-lock.yaml` | 必要 | security、pre-push | 4.3 |
   631	| `security:audit` | `pnpm audit --audit-level=high` | 必要 | security、pre-push | 4.2 |
   632	| `security` | `security:osv` → `security:audit` | 必要 | CI、security-daily | 4.1 |
   633	| `runtime` | 7 種の版の出力（C5） | 不要 | CI のログ | 5.1, 5.2 |
   634	| `outdated` | `mise outdated` → `pnpm outdated`（候補ありで exit 1） | 必要 | 週次の手作業 | 5.3, 5.4 |
   635	| `setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3 |
   636	
   637	### lefthook ジョブ（`lefthook.yml`）
   638	
   639	| Hook | 実行方式 | Job name | run | Req |
   640	|------|----------|----------|-----|-----|
   641	| （全体） | — | — | `assert_lefthook_installed: true` | 7.7 |
   642	| pre-commit | `parallel: true` | `secrets` | `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose` | 7.2, 8.3, 8.5 |
   643	| | | `biome` | `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true` | 7.2 |
   644	| | | `typecheck` | `mise run typecheck` | 7.2, 7.8 |
   645	| | | `model-ids` | `mise run check:model-ids` | 7.2, 7.8 |
   646	| commit-msg | — | `conventional` | `node scripts/check-commit-msg.mjs {1}` | 7.4 |
   647	| pre-push | `piped: true` | `osv-scanner` | `mise run security:osv` | 7.5, 7.8 |
   648	| | | `pnpm-audit` | `mise run security:audit` | 7.5, 7.8 |
   649	| | | `unit-tests` | `mise run test` | 7.5, 7.8 |
   650	| | | `e2e-smoke` | `mise run e2e` | 7.5, 7.8 |
   651	
   652	pre-commit の typecheck は glob で絞らない（`tsconfig.json` や `package.json` だけの変更でも型は変わりうる）。
   653	
   654	### CLI: `scripts/check-model-ids.mjs`
   655	
   656	| 項目 | 契約 |
   657	|------|------|
   658	| 引数 | `[--root <dir>]`。省略時は `process.cwd()`。それ以外の引数は使い方の誤り |
   659	| 走査候補 | `git -C <root> ls-files --cached --others --exclude-standard -z` |
   660	| 走査対象（6.5） | `src/**`、`scripts/**`、`tests/**`、`docs/**`、`.github/**`、`README.md`、`.env.example`、ルート直下の `*.{ts,mts,cts,js,mjs,cjs,json,jsonc,yaml,yml,toml}` |
   661	| 除外 | `src/lib/ai/model-allowlist.ts`（6.1）、`tests/fixtures/**`（6.6）、`pnpm-lock.yaml`、NUL バイトを含むファイル |
   662	| 検出 | allowlist の全 ID（単語境界つきの完全一致）と、プロバイダ命名形式の正規表現（C8） |
   663	| exit 0 | 検出 0 件。stdout に走査ファイル数と 0 件の要約（6.7） |
   664	| exit 1 | 検出 1 件以上。stderr に 1 件 1 行で `<path>:<line>:<column>: <match> (<source>)`（6.3） |
   665	| exit 2 | 使い方の誤り、git の失敗（root が git リポジトリでない等）、allowlist の読み込み失敗。0 にしない |
   666	
   667	### CLI: `scripts/check-commit-msg.mjs`
   668	
   669	| 項目 | 契約 |
   670	|------|------|
   671	| 引数 | `<msg-file>`（lefthook の `{1}`） |
   672	| 判定対象 | `#` で始まる行と空行を除いた最初の行 |
   673	| 合格 | `^(build\|chore\|ci\|docs\|feat\|fix\|perf\|refactor\|revert\|style\|test)(\([^()\s]+\))?!?: \S` に一致、または `Merge `・`Revert "`・`fixup! `・`squash! `・`amend! ` で始まる |
   674	| exit 0 / 1 / 2 | 合格 / 不合格（期待する形式と例を stderr に出す）/ 引数なし・読めない |
   675	
   676	### unit の通信ガード（`tests/unit/setup/network-guard.ts`）
   677	
   678	- `net.Socket.prototype.connect` と `globalThis.fetch` を置き換える。ローカルホスト・UNIX ソケットを含め
   679	  例外なく遮断する。
   680	- 呼ばれたら `UnmockedNetworkError`（`name` が固定のエラー）を投げ、違反を記録する。メッセージには接続先の
   681	  ホストとポート（または URL のオリジン）だけを含め、クエリやヘッダーは含めない。
   682	- `afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする。
   683	
   684	### E2E fixture（`tests/e2e/fixtures.ts`）
   685	
   686	- `export const test`（`@playwright/test` の `test.extend` に auto fixture `networkGuard` を加えたもの）、
   687	  `export { expect }`。
   688	- 許可: `baseURL` と同じオリジン。`data:` / `blob:` は route の対象外。
   689	- 遮断: それ以外のオリジンを `route.abort("blockedbyclient")` し、`{ method, url }` を記録する。
   690	- 公開: `blockedRequests`（`readonly ExternalRequestViolation[]`）と option fixture
   691	  `failOnBlockedRequest: boolean`（既定 `true`）。
   692	- teardown: `failOnBlockedRequest` が真で記録が空でなければ失敗する。テスト個別の `page.route` は context の
   693	  route より優先される。
   694	
   695	### CI ジョブ
   696	
   697	| Workflow / job | トリガー | 実行 | 失敗時 | 権限 | Req |
   698	|----------------|----------|------|--------|------|-----|
   699	| `ci.yml` / `verify` | push（`main`、`exp/**`）、PR、手動 | install（frozen）→ runtime → browsers → verify → security → 作業ツリー不変の確認 | マージをブロック（ruleset の必須チェック） | `contents: read` | 10.1, 10.2, 10.6, 10.7 |
   700	| `ci.yml` / `verify-node27` | 同上 + 週次 schedule | `MISE_ENV=node27` で install → runtime → browsers → verify | `continue-on-error`（ブロックしない） | `contents: read` | 10.3, 10.4 |
   701	| `security-daily.yml` / `security` | 毎日 schedule、手動 | security | ワークフロー失敗として通知 | `contents: read` | 10.5 |
   702	
   703	共通: `uses:` はコミット SHA（タグをコメントで併記）（10.8）、checkout は `persist-credentials: false`、
   704	AI プロバイダの secret を参照しない（10.10）。
   705	
   706	### 記録の形式
   707	
   708	- Node 27 の検証記録（11.5）: `docs/node27/YYYY-MM-DD-<topic>.md`、見出し「結論 / 検証した版 / 通したゲート /
   709	  未解決事項 / 再現手順」。
   710	- 脆弱性の除外（4.5）: C4 の形式。除外ごとに advisory ID、理由、退役条件（期限または条件）。
   711	- research.md の実装時の記録（R-1〜R-11）: コマンド、結果、根拠、確認日。
   712	
   713	## File Structure Plan
   714	
   715	tasks.md の `_Boundary:_` にできるのは、この表のファイル（と表末尾のリポジトリ設定）だけである。
   716	「Commit」は未コミットのファイルを内容を変えずに本 spec の PR に含めることを表す（13.11）。
   717	
   718	| File | Create/Modify | Responsibility | Component |
   719	|------|---------------|----------------|-----------|
   720	| `mise.toml` | Create | ツールの exact pin、`[env]`、verify / security / 補助タスクを定義する | C1, C3, C4, C5 |
   721	| `mise.node27.toml` | Create | Node 27 alpha の版だけを上書きする | C14 |
   722	| `package.json` | Create | 段 1 が使う依存の exact pin、`packageManager`、`engines`、起動用 scripts を持つ | C1 |
   723	| `pnpm-workspace.yaml` | Create | 24h ゲート、`savePrefix`、`allowBuilds`（理由つき）、必要時の `overrides` / `audit.ignore` を持つ | C1, C4 |
   724	| `pnpm-lock.yaml` | Create | 依存グラフを固定する（`pnpm install` が生成） | C1 |
   725	| `osv-scanner.toml` | Create（条件付き） | 脆弱性の除外を記録する必要が生じたときだけ、除外ごとの ID・理由・退役条件を持つ | C4 |
   726	| `lefthook.yml` | Create | pre-commit / commit-msg / pre-push のジョブと `assert_lefthook_installed` を定義する | C9 |
   727	| `biome.json` | Create | lint / format の唯一の規約と E2E の import 制限を持つ | C2 |
   728	| `tsconfig.json` | Create | `strict` を含む型検査の設定を持つ | C2 |
   729	| `next.config.ts` | Create | Next.js の設定を持つ | C2 |
   730	| `vitest.config.ts` | Create | unit の対象、0 件失敗、通信ガードの setupFiles を定義する | C6 |
   731	| `playwright.config.ts` | Create | E2E の対象、リトライなし、専用ポートの webServer を定義する | C7 |
   732	| `.env.example` | Create | 将来の段が使う環境変数の名前だけを示す | C16 |
   733	| `.gitignore` | Modify | 秘密ファイル・生成物・テスト成果物・ローカル設定を追跡対象から外す | C16 |
   734	| `.github/workflows/ci.yml` | Create | verify（必須）と verify-node27（参考）のジョブを定義する | C13 |
   735	| `.github/workflows/security-daily.yml` | Create | 毎日の security タスクを定義する | C13 |
   736	| `.github/dependabot.yml` | Create | npm と Actions の週次更新提案を cooldown つきで定義する | C13 |
   737	| `src/app/layout.tsx` | Create | ルートレイアウトを RSC で提供する | C11 |
   738	| `src/app/page.tsx` | Create | AI を呼ばないプレースホルダーページを RSC で提供する | C11 |
   739	| `src/lib/ai/model-allowlist.ts` | Create | モデル ID の唯一の定義を持つ | C8 |
   740	| `scripts/check-model-ids.mjs` | Create | allowlist 外のモデル ID の直書きを検出する | C8 |
   741	| `scripts/check-commit-msg.mjs` | Create | commit メッセージの 1 行目を Conventional Commits の形式で検査する | C9 |
   742	| `tests/unit/setup/network-guard.ts` | Create | unit の未モック通信を失敗させる | C6 |
   743	| `tests/unit/helpers/sandbox.ts` | Create | 一時 git リポジトリ、ツールの絶対パス解決、隔離した環境変数（固定の偽 identity）、子プロセス実行を提供する | C6 |
   744	| `tests/unit/setup/require-executed-tests.ts` | Create | 実行 0 件（全部 todo / skip）の unit 実行を失敗させる Vitest reporter | C6 |
   745	| `tests/unit/gitleaks-pre-commit.test.ts` | Create | 秘密値を含む commit が secrets ジョブで拒否されることを確かめる | C10 |
   746	| `tests/unit/network-guard.test.ts` | Create | 未モック通信がテストを失敗させることを入れ子実行で確かめる | C12 |
   747	| `tests/unit/gate-self-check.test.ts` | Create | unit と `@smoke` の 0 件実行が失敗することを確かめる | C12 |
   748	| `tests/unit/check-model-ids.test.ts` | Create | `check:model-ids` の検出・除外・終了コードを確かめる | C12 |
   749	| `tests/unit/hooks-config.test.ts` | Create | フックの構成、タスクとの対応、ツール不在時の失敗を確かめる | C12 |
   750	| `tests/unit/check-commit-msg.test.ts` | Create | commit-msg の合否判定を確かめる | C12 |
   751	| `tests/unit/repo-policy.test.ts` | Create | 版の固定、lint / 型の規約、テストの配置、CI の固定、秘密ファイルの扱いを静的に確かめる | C12 |
   752	| `tests/unit/static-analysis.test.ts` | Create | 実際の Biome / tsc 設定が走査対象の違反で非 0 になることを確かめる（2.4、2.5） | C12 |
   753	| `tests/unit/docs-structure.test.ts` | Create | 解説の節順と参照パス、Node 27 記録の見出しを確かめる | C12 |
   754	| `tests/fixtures/gate/vitest.fixture.config.ts` | Create | 実設定を引き継ぐ入れ子実行用の Vitest 設定を持つ | C12 |
   755	| `tests/fixtures/gate/unmocked-network.fixture.ts` | Create | ガードに捕まるべき通信を行う入れ子実行の入力 | C12 |

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '618,860p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 77ms:
   618	
   619	すべてのタスクは `description` を持つ。`verify` と `security` の構成要素は直列で、最初の失敗で止まる（I-3）。
   620	
   621	| Task | 実行内容 | ネットワーク | 呼び出し元 | Req |
   622	|------|----------|--------------|------------|-----|
   623	| `check` | `pnpm exec biome check .` | 不要 | verify | 2.4, 3.4 |
   624	| `typecheck` | `pnpm exec next typegen` → `pnpm exec tsc --noEmit` | 不要 | verify、pre-commit | 2.5 |
   625	| `check:model-ids` | `node scripts/check-model-ids.mjs` | 不要 | verify、pre-commit | 6.3 |
   626	| `check:secrets` | `gitleaks git --redact --ignore-gitleaks-allow --verbose --log-opts=HEAD`（HEAD から到達できる全履歴。既定の `--all` は別ブランチ・stash も走査し 3.7 を崩す） | 不要 | verify | 3.12 |
   627	| `test` | `pnpm exec vitest run` | 不要 | verify、pre-push | 3.4 |
   628	| `e2e` | `pnpm exec playwright test --grep @smoke` | 不要 | verify、pre-push | 3.4 |
   629	| `verify`（`alias = "gate"`） | `check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e` | 不要 | 開発者、CI | 3.1〜3.3 |
   630	| `security:osv` | `osv-scanner scan source --lockfile=pnpm-lock.yaml` | 必要 | security、pre-push | 4.3 |
   631	| `security:audit` | `pnpm audit --audit-level=high` | 必要 | security、pre-push | 4.2 |
   632	| `security` | `security:osv` → `security:audit` | 必要 | CI、security-daily | 4.1 |
   633	| `runtime` | 7 種の版の出力（C5） | 不要 | CI のログ | 5.1, 5.2 |
   634	| `outdated` | `mise outdated` → `pnpm outdated`（候補ありで exit 1） | 必要 | 週次の手作業 | 5.3, 5.4 |
   635	| `setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3 |
   636	
   637	### lefthook ジョブ（`lefthook.yml`）
   638	
   639	| Hook | 実行方式 | Job name | run | Req |
   640	|------|----------|----------|-----|-----|
   641	| （全体） | — | — | `assert_lefthook_installed: true` | 7.7 |
   642	| pre-commit | `parallel: true` | `secrets` | `gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose` | 7.2, 8.3, 8.5 |
   643	| | | `biome` | `pnpm exec biome check --staged --no-errors-on-unmatched --files-ignore-unknown=true` | 7.2 |
   644	| | | `typecheck` | `mise run typecheck` | 7.2, 7.8 |
   645	| | | `model-ids` | `mise run check:model-ids` | 7.2, 7.8 |
   646	| commit-msg | — | `conventional` | `node scripts/check-commit-msg.mjs {1}` | 7.4 |
   647	| pre-push | `piped: true` | `osv-scanner` | `mise run security:osv` | 7.5, 7.8 |
   648	| | | `pnpm-audit` | `mise run security:audit` | 7.5, 7.8 |
   649	| | | `unit-tests` | `mise run test` | 7.5, 7.8 |
   650	| | | `e2e-smoke` | `mise run e2e` | 7.5, 7.8 |
   651	
   652	pre-commit の typecheck は glob で絞らない（`tsconfig.json` や `package.json` だけの変更でも型は変わりうる）。
   653	
   654	### CLI: `scripts/check-model-ids.mjs`
   655	
   656	| 項目 | 契約 |
   657	|------|------|
   658	| 引数 | `[--root <dir>]`。省略時は `process.cwd()`。それ以外の引数は使い方の誤り |
   659	| 走査候補 | `git -C <root> ls-files --cached --others --exclude-standard -z` |
   660	| 走査対象（6.5） | `src/**`、`scripts/**`、`tests/**`、`docs/**`、`.github/**`、`README.md`、`.env.example`、ルート直下の `*.{ts,mts,cts,js,mjs,cjs,json,jsonc,yaml,yml,toml}` |
   661	| 除外 | `src/lib/ai/model-allowlist.ts`（6.1）、`tests/fixtures/**`（6.6）、`pnpm-lock.yaml`、NUL バイトを含むファイル |
   662	| 検出 | allowlist の全 ID（単語境界つきの完全一致）と、プロバイダ命名形式の正規表現（C8） |
   663	| exit 0 | 検出 0 件。stdout に走査ファイル数と 0 件の要約（6.7） |
   664	| exit 1 | 検出 1 件以上。stderr に 1 件 1 行で `<path>:<line>:<column>: <match> (<source>)`（6.3） |
   665	| exit 2 | 使い方の誤り、git の失敗（root が git リポジトリでない等）、allowlist の読み込み失敗。0 にしない |
   666	
   667	### CLI: `scripts/check-commit-msg.mjs`
   668	
   669	| 項目 | 契約 |
   670	|------|------|
   671	| 引数 | `<msg-file>`（lefthook の `{1}`） |
   672	| 判定対象 | `#` で始まる行と空行を除いた最初の行 |
   673	| 合格 | `^(build\|chore\|ci\|docs\|feat\|fix\|perf\|refactor\|revert\|style\|test)(\([^()\s]+\))?!?: \S` に一致、または `Merge `・`Revert "`・`fixup! `・`squash! `・`amend! ` で始まる |
   674	| exit 0 / 1 / 2 | 合格 / 不合格（期待する形式と例を stderr に出す）/ 引数なし・読めない |
   675	
   676	### unit の通信ガード（`tests/unit/setup/network-guard.ts`）
   677	
   678	- `net.Socket.prototype.connect` と `globalThis.fetch` を置き換える。ローカルホスト・UNIX ソケットを含め
   679	  例外なく遮断する。
   680	- 呼ばれたら `UnmockedNetworkError`（`name` が固定のエラー）を投げ、違反を記録する。メッセージには接続先の
   681	  ホストとポート（または URL のオリジン）だけを含め、クエリやヘッダーは含めない。
   682	- `afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする。
   683	
   684	### E2E fixture（`tests/e2e/fixtures.ts`）
   685	
   686	- `export const test`（`@playwright/test` の `test.extend` に auto fixture `networkGuard` を加えたもの）、
   687	  `export { expect }`。
   688	- 許可: `baseURL` と同じオリジン。`data:` / `blob:` は route の対象外。
   689	- 遮断: それ以外のオリジンを `route.abort("blockedbyclient")` し、`{ method, url }` を記録する。
   690	- 公開: `blockedRequests`（`readonly ExternalRequestViolation[]`）と option fixture
   691	  `failOnBlockedRequest: boolean`（既定 `true`）。
   692	- teardown: `failOnBlockedRequest` が真で記録が空でなければ失敗する。テスト個別の `page.route` は context の
   693	  route より優先される。
   694	
   695	### CI ジョブ
   696	
   697	| Workflow / job | トリガー | 実行 | 失敗時 | 権限 | Req |
   698	|----------------|----------|------|--------|------|-----|
   699	| `ci.yml` / `verify` | push（`main`、`exp/**`）、PR、手動 | install（frozen）→ runtime → browsers → verify → security → 作業ツリー不変の確認 | マージをブロック（ruleset の必須チェック） | `contents: read` | 10.1, 10.2, 10.6, 10.7 |
   700	| `ci.yml` / `verify-node27` | 同上 + 週次 schedule | `MISE_ENV=node27` で install → runtime → browsers → verify | `continue-on-error`（ブロックしない） | `contents: read` | 10.3, 10.4 |
   701	| `security-daily.yml` / `security` | 毎日 schedule、手動 | security | ワークフロー失敗として通知 | `contents: read` | 10.5 |
   702	
   703	共通: `uses:` はコミット SHA（タグをコメントで併記）（10.8）、checkout は `persist-credentials: false`、
   704	AI プロバイダの secret を参照しない（10.10）。
   705	
   706	### 記録の形式
   707	
   708	- Node 27 の検証記録（11.5）: `docs/node27/YYYY-MM-DD-<topic>.md`、見出し「結論 / 検証した版 / 通したゲート /
   709	  未解決事項 / 再現手順」。
   710	- 脆弱性の除外（4.5）: C4 の形式。除外ごとに advisory ID、理由、退役条件（期限または条件）。
   711	- research.md の実装時の記録（R-1〜R-11）: コマンド、結果、根拠、確認日。
   712	
   713	## File Structure Plan
   714	
   715	tasks.md の `_Boundary:_` にできるのは、この表のファイル（と表末尾のリポジトリ設定）だけである。
   716	「Commit」は未コミットのファイルを内容を変えずに本 spec の PR に含めることを表す（13.11）。
   717	
   718	| File | Create/Modify | Responsibility | Component |
   719	|------|---------------|----------------|-----------|
   720	| `mise.toml` | Create | ツールの exact pin、`[env]`、verify / security / 補助タスクを定義する | C1, C3, C4, C5 |
   721	| `mise.node27.toml` | Create | Node 27 alpha の版だけを上書きする | C14 |
   722	| `package.json` | Create | 段 1 が使う依存の exact pin、`packageManager`、`engines`、起動用 scripts を持つ | C1 |
   723	| `pnpm-workspace.yaml` | Create | 24h ゲート、`savePrefix`、`allowBuilds`（理由つき）、必要時の `overrides` / `audit.ignore` を持つ | C1, C4 |
   724	| `pnpm-lock.yaml` | Create | 依存グラフを固定する（`pnpm install` が生成） | C1 |
   725	| `osv-scanner.toml` | Create（条件付き） | 脆弱性の除外を記録する必要が生じたときだけ、除外ごとの ID・理由・退役条件を持つ | C4 |
   726	| `lefthook.yml` | Create | pre-commit / commit-msg / pre-push のジョブと `assert_lefthook_installed` を定義する | C9 |
   727	| `biome.json` | Create | lint / format の唯一の規約と E2E の import 制限を持つ | C2 |
   728	| `tsconfig.json` | Create | `strict` を含む型検査の設定を持つ | C2 |
   729	| `next.config.ts` | Create | Next.js の設定を持つ | C2 |
   730	| `vitest.config.ts` | Create | unit の対象、0 件失敗、通信ガードの setupFiles を定義する | C6 |
   731	| `playwright.config.ts` | Create | E2E の対象、リトライなし、専用ポートの webServer を定義する | C7 |
   732	| `.env.example` | Create | 将来の段が使う環境変数の名前だけを示す | C16 |
   733	| `.gitignore` | Modify | 秘密ファイル・生成物・テスト成果物・ローカル設定を追跡対象から外す | C16 |
   734	| `.github/workflows/ci.yml` | Create | verify（必須）と verify-node27（参考）のジョブを定義する | C13 |
   735	| `.github/workflows/security-daily.yml` | Create | 毎日の security タスクを定義する | C13 |
   736	| `.github/dependabot.yml` | Create | npm と Actions の週次更新提案を cooldown つきで定義する | C13 |
   737	| `src/app/layout.tsx` | Create | ルートレイアウトを RSC で提供する | C11 |
   738	| `src/app/page.tsx` | Create | AI を呼ばないプレースホルダーページを RSC で提供する | C11 |
   739	| `src/lib/ai/model-allowlist.ts` | Create | モデル ID の唯一の定義を持つ | C8 |
   740	| `scripts/check-model-ids.mjs` | Create | allowlist 外のモデル ID の直書きを検出する | C8 |
   741	| `scripts/check-commit-msg.mjs` | Create | commit メッセージの 1 行目を Conventional Commits の形式で検査する | C9 |
   742	| `tests/unit/setup/network-guard.ts` | Create | unit の未モック通信を失敗させる | C6 |
   743	| `tests/unit/helpers/sandbox.ts` | Create | 一時 git リポジトリ、ツールの絶対パス解決、隔離した環境変数（固定の偽 identity）、子プロセス実行を提供する | C6 |
   744	| `tests/unit/setup/require-executed-tests.ts` | Create | 実行 0 件（全部 todo / skip）の unit 実行を失敗させる Vitest reporter | C6 |
   745	| `tests/unit/gitleaks-pre-commit.test.ts` | Create | 秘密値を含む commit が secrets ジョブで拒否されることを確かめる | C10 |
   746	| `tests/unit/network-guard.test.ts` | Create | 未モック通信がテストを失敗させることを入れ子実行で確かめる | C12 |
   747	| `tests/unit/gate-self-check.test.ts` | Create | unit と `@smoke` の 0 件実行が失敗することを確かめる | C12 |
   748	| `tests/unit/check-model-ids.test.ts` | Create | `check:model-ids` の検出・除外・終了コードを確かめる | C12 |
   749	| `tests/unit/hooks-config.test.ts` | Create | フックの構成、タスクとの対応、ツール不在時の失敗を確かめる | C12 |
   750	| `tests/unit/check-commit-msg.test.ts` | Create | commit-msg の合否判定を確かめる | C12 |
   751	| `tests/unit/repo-policy.test.ts` | Create | 版の固定、lint / 型の規約、テストの配置、CI の固定、秘密ファイルの扱いを静的に確かめる | C12 |
   752	| `tests/unit/static-analysis.test.ts` | Create | 実際の Biome / tsc 設定が走査対象の違反で非 0 になることを確かめる（2.4、2.5） | C12 |
   753	| `tests/unit/docs-structure.test.ts` | Create | 解説の節順と参照パス、Node 27 記録の見出しを確かめる | C12 |
   754	| `tests/fixtures/gate/vitest.fixture.config.ts` | Create | 実設定を引き継ぐ入れ子実行用の Vitest 設定を持つ | C12 |
   755	| `tests/fixtures/gate/unmocked-network.fixture.ts` | Create | ガードに捕まるべき通信を行う入れ子実行の入力 | C12 |
   756	| `tests/fixtures/gate/no-network.fixture.ts` | Create | 通信しない対照の入れ子実行の入力 | C12 |
   757	| `tests/fixtures/gate/all-todo.fixture.ts` | Create | `it.todo` だけを持つ、実行 0 件の入れ子実行の入力 | C12 |
   758	| `tests/fixtures/gate/e2e/playwright.fixture.config.ts` | Create | 本物の reporter を使う入れ子の Playwright 実行用の設定（webServer なし） | C12 |
   759	| `tests/fixtures/gate/e2e/all-skip.fixture.ts` | Create | `@smoke` が `test.info().skip()` で全部 skip する入れ子実行の入力 | C12 |
   760	| `tests/fixtures/gate/e2e/one-pass.fixture.ts` | Create | `@smoke` が 1 件通る対照の入力 | C12 |
   761	| `tests/fixtures/gate/e2e/external-request.fixture.ts` | Create | 外部オリジンへ要求を出し、teardown の失敗を引き出す入力 | C12 |
   762	| `tests/fixtures/gate/e2e/no-external-request.fixture.ts` | Create | 外部要求のない対照の入力 | C12 |
   763	| `tests/unit/sandbox.test.ts` | Create | `sandbox.ts` の契約（隔離した環境で node / git / gitleaks / lefthook / pnpm が起動する、`expectGateFailure` が 127 を拒否する）を確かめる | C6 |
   764	| `tests/e2e/fixtures.ts` | Create | 外部オリジンを遮断する auto fixture つきの `test` / `expect` を提供する | C7 |
   765	| `tests/e2e/reporters/require-executed-tests.ts` | Create | 実行 0 件（全部 skip）の E2E 実行を失敗させる Playwright reporter | C7 |
   766	| `tests/e2e/placeholder.smoke.spec.ts` | Create | プレースホルダーの見出しを確かめる `@smoke` テスト | C11 |
   767	| `tests/e2e/network-guard.smoke.spec.ts` | Create | 外部オリジンへの通信が遮断・記録されることを確かめる `@smoke` テスト | C12 |
   768	| `docs/stages/1-dev-environment-and-gates.md` | Create | 段 1 の解説（読む → 動かす → 改造する → テストで合格を確かめる） | C16 |
   769	| `docs/node27/<YYYY-MM-DD>-initial-lane.md` | Create | Node 27 alpha の初回検証記録（日付は実行日） | C14 |
   770	| `README.md` | Modify | セットアップ、mise の注意、コマンド、Node 27 の worktree 手順を記す | C16, C14 |
   771	| `.sdd/memory/constitution.md` | Modify + Commit | 原則 3 を MINOR 改訂（1.1.0）し、Sync Impact Report と改訂履歴を更新する | C16 |
   772	| `.sdd/steering/tech.md` | Modify + Commit | Gate command と gitleaks の置き場を実際の構成に合わせる | C16 |
   773	| `.sdd/steering/structure.md` | Modify + Commit | 状態注記とテスト補助ディレクトリの役割を実際の構成に合わせる | C16 |
   774	| `.sdd/steering/product.md` | Modify + Commit | 状態注記を段 1 完了後に合わせる | C16 |
   775	| `AGENTS.md` | Modify + Commit | コマンド表と "Current state" を実在するタスクに合わせる | C16 |
   776	| `specs/000-development-plan/plan.md` | Modify | §4・§7 M1・§8.5・Constitution Compliance に改訂注記を入れる | C16 |
   777	| `specs/001-dev-environment-and-gates/research.md` | Modify | 実装時の記録 R-1〜R-11 を追記する | C15 |
   778	| `specs/001-dev-environment-and-gates/spec.json` | Modify | SDD のフェーズと承認状態を更新する（SDD コマンドが行う） | — |
   779	
   780	生成物でコミットしないもの: `next-env.d.ts`、`.next/`、`test-results/`、`playwright-report/`、`.vitest/`、
   781	`*.tsbuildinfo`。ZIP のアプリコードとテストは作らない（12.7）。
   782	
   783	リポジトリ設定（ファイル外、C13）: ruleset `protect-main` の有効化と必須チェック `verify` の追加。
   784	適用前にユーザーの確認を得る。
   785	
   786	実装順の制約（tasks.md への入力）:
   787	
   788	1. 最初の失敗するテストを動かすには `package.json`・`pnpm-workspace.yaml`・`pnpm-lock.yaml`・
   789	   `vitest.config.ts`・`mise.toml` の `[tools]` と `test` タスクが要る。これらはテストランナーの起動に
   790	   必要な最小限だけを先に作り、以後のゲート設定はそれを検査するテストを先に書く（憲章 原則 4）。
   791	2. `tests/unit/helpers/sandbox.ts` と `tests/unit/setup/network-guard.ts` は、子プロセスや一時リポジトリを
   792	   使う他のテストより先に用意する。
   793	3. `lefthook install` は、`lefthook.yml` と `hooks-config.test.ts` が緑になってから行う（未完成の
   794	   フックで commit が止まらないようにする）。
   795	4. ruleset の変更は、CI の `verify` ジョブが一度緑になってから行う。
   796	
   797	## Error Handling & Edge Cases
   798	
   799	**ゲートの失敗を成功に変えない**
   800	
   801	- verify / security の構成要素のどれかが非 0 → 後続を実行せず非 0（3.2、4.1、I-3）。
   802	- unit テストファイルが 0 件 → Vitest が非 0（3.8、`passWithNoTests: false`）。ファイルはあるが実行 0 件（全部
   803	  `todo` / `skip`）→ reporter `require-executed-tests.ts` が非 0 にする。`.skip` は Biome の `noSkippedTests` でも
   804	  止める。`.only` の混入 → `allowOnly: false`
   805	  で失敗（3.7 の決定論）。
   806	- `@smoke` が 0 件 → Playwright が非 0（3.9、`--pass-with-no-tests` を使わない）。一致はするが全部 skip →
   807	  reporter `require-executed-tests.ts` が `onEnd` で failed にする（reporter がなければ exit 0 になる。実測、
   808	  I-15）。この 2 つは `gate-self-check.test.ts` が実行して確かめる。
   809	- 子プロセスが ENOENT / 126 / 127 で落ちた → 「ゲートの拒否」として数えない。`expectGateFailure` が
   810	  `spawnError`、126 / 127 を拒否し、出力で失敗の理由を確かめる（`sandbox.ts`、`sandbox.test.ts`）。
   811	- `test` / `e2e` タスクに結果を緩めるフラグが足される → `hooks-config.test.ts` が検出し、0 件の自己検査も
   812	  タスクの argv を通して落ちる。
   813	- unit の未モック通信 → その場で `UnmockedNetworkError`。呼び出し側が例外を握りつぶしても `afterEach` で
   814	  失敗する（3.10）。
   815	- E2E の外部オリジンへの未モック通信 → `abort` し、teardown で失敗する（3.11）。
   816	- gitleaks の全履歴スキャンで検出 → 非 0、値は `REDACTED`（3.12、I-6）。走査は `--log-opts=HEAD` で HEAD から
   817	  到達できるコミットに限り、ローカルの別ブランチや stash で合否が変わらないようにする（3.7）。
   818	- `pnpm audit` / osv-scanner が advisory の取得先に到達できない → 非 0 のまま。
   819	  `--ignore-registry-errors` や `|| true` で包まない（4.4）。実際の終了コードは R-4 で実測する。
   820	- 修正版に上げられない脆弱性 → C4 の形式で除外を記録する。osv-scanner の `ignoreUntil` を過ぎると自動で
   821	  再び失敗する（4.5、憲章 原則 9）。
   822	- `pnpm outdated` の `exit 1` は「候補あり」を意味する。タスクは終了コードを隠さず、意味を文書化する（5.3）。
   823	- `check:model-ids` で root が git リポジトリでない、git が失敗した、allowlist を読めない → exit 2（0 にしない）。
   824	
   825	**フックとツールの不在**
   826	
   827	- lefthook 本体が見つからない → `assert_lefthook_installed: true` で exit 1（7.7、I-4）。mise で lefthook を上げて
   828	  旧版が消え、フックに埋め込まれたパスが無効になった場合がこれにあたる（`hooks-config.test.ts` のケース 2）。
   829	- lefthook は見つかるがジョブのツール（`mise`、`gitleaks`、`pnpm`、`node`）が PATH にない → ジョブが 127 で
   830	  失敗し、フックが非 0（7.3、7.7）。README に「mise を有効にしていない Git クライアントではフックが失敗する」と
   831	  書く（13.4）。
   832	- pre-push の途中で失敗 → `piped: true` で後続を実行せず push を拒否（7.6）。
   833	- `--no-verify` / `LEFTHOOK=0` による回避 → CI の `verify` が同じ検査を行う。回避は憲章の規律（環境要因の
   834	  証明、PR 本文への記録）に従う。
   835	- unit テストが gitleaks / lefthook / git を見つけられない → スキップせず、原因を示すメッセージで失敗する
   836	  （憲章 原則 3）。
   837	
   838	**テストの安全性と後始末**
   839	
   840	- フック実行中の git は `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスに渡す。pre-push で動く unit テストが
   841	  それを引き継いで一時リポジトリの git を実行すると、実リポジトリの index を操作しうる → `isolatedEnv()` で
   842	  `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` を設定する（I-6）。`GITLEAKS_CONFIG`
   843	  など設定を差し替える変数と `LEFTHOOK` / `LEFTHOOK_BIN` も除く。
   844	- テストの成否にかかわらず一時ディレクトリを削除する → `onTestFinished` で登録（8.8）。
   845	- 偽キーは実行時にだけ存在し、リポジトリのファイルにも gitleaks の出力にも残らない（8.4、8.6）。
   846	- 子プロセスにはタイムアウトを付け、ハングをテスト失敗として扱う。`runCommand` のタイムアウト（既定 30 秒）は
   847	  テストファイルの timeout（初期値 60 秒）より短くし、CI の 2 vCPU でも既定の 5 秒で緑と赤が入れ替わらない
   848	  ようにする（3.7。値は R-11 の実測で見直す）。
   849	- 一時リポジトリを cwd にすると mise の shim が `No version is set for shim` で失敗する → ツールは
   850	  `resolveTool()` でリポジトリのルートから絶対パスを解決して呼ぶ。`pnpm exec vitest run <file>` を単体で
   851	  実行した場合も同じ結果になる。
   852	- `GIT_CONFIG_GLOBAL=/dev/null` で identity が消え、Linux では `git commit` 自体が失敗する → `isolatedEnv()` が
   853	  固定の偽の identity を設定し、拒否のケースは「commit が作られていない」ことと gitleaks の検出を出力で
   854	  確かめる（拒否の原因を gitleaks に限定する）。
   855	
   856	**モデル ID 検査の誤検出と漏れ**
   857	
   858	- 開発者の `.env.local` に実際の `AI_MODEL` がある → gitignore 済みなので走査しない（ADR-6）。
   859	- テスト fixture にモデル ID が要る → `tests/fixtures/**` に置く（6.6）。unit テスト本体は allowlist を import
   860	  する。

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '676,940p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 89ms:
   676	### unit の通信ガード（`tests/unit/setup/network-guard.ts`）
   677	
   678	- `net.Socket.prototype.connect` と `globalThis.fetch` を置き換える。ローカルホスト・UNIX ソケットを含め
   679	  例外なく遮断する。
   680	- 呼ばれたら `UnmockedNetworkError`（`name` が固定のエラー）を投げ、違反を記録する。メッセージには接続先の
   681	  ホストとポート（または URL のオリジン）だけを含め、クエリやヘッダーは含めない。
   682	- `afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする。
   683	
   684	### E2E fixture（`tests/e2e/fixtures.ts`）
   685	
   686	- `export const test`（`@playwright/test` の `test.extend` に auto fixture `networkGuard` を加えたもの）、
   687	  `export { expect }`。
   688	- 許可: `baseURL` と同じオリジン。`data:` / `blob:` は route の対象外。
   689	- 遮断: それ以外のオリジンを `route.abort("blockedbyclient")` し、`{ method, url }` を記録する。
   690	- 公開: `blockedRequests`（`readonly ExternalRequestViolation[]`）と option fixture
   691	  `failOnBlockedRequest: boolean`（既定 `true`）。
   692	- teardown: `failOnBlockedRequest` が真で記録が空でなければ失敗する。テスト個別の `page.route` は context の
   693	  route より優先される。
   694	
   695	### CI ジョブ
   696	
   697	| Workflow / job | トリガー | 実行 | 失敗時 | 権限 | Req |
   698	|----------------|----------|------|--------|------|-----|
   699	| `ci.yml` / `verify` | push（`main`、`exp/**`）、PR、手動 | install（frozen）→ runtime → browsers → verify → security → 作業ツリー不変の確認 | マージをブロック（ruleset の必須チェック） | `contents: read` | 10.1, 10.2, 10.6, 10.7 |
   700	| `ci.yml` / `verify-node27` | 同上 + 週次 schedule | `MISE_ENV=node27` で install → runtime → browsers → verify | `continue-on-error`（ブロックしない） | `contents: read` | 10.3, 10.4 |
   701	| `security-daily.yml` / `security` | 毎日 schedule、手動 | security | ワークフロー失敗として通知 | `contents: read` | 10.5 |
   702	
   703	共通: `uses:` はコミット SHA（タグをコメントで併記）（10.8）、checkout は `persist-credentials: false`、
   704	AI プロバイダの secret を参照しない（10.10）。
   705	
   706	### 記録の形式
   707	
   708	- Node 27 の検証記録（11.5）: `docs/node27/YYYY-MM-DD-<topic>.md`、見出し「結論 / 検証した版 / 通したゲート /
   709	  未解決事項 / 再現手順」。
   710	- 脆弱性の除外（4.5）: C4 の形式。除外ごとに advisory ID、理由、退役条件（期限または条件）。
   711	- research.md の実装時の記録（R-1〜R-11）: コマンド、結果、根拠、確認日。
   712	
   713	## File Structure Plan
   714	
   715	tasks.md の `_Boundary:_` にできるのは、この表のファイル（と表末尾のリポジトリ設定）だけである。
   716	「Commit」は未コミットのファイルを内容を変えずに本 spec の PR に含めることを表す（13.11）。
   717	
   718	| File | Create/Modify | Responsibility | Component |
   719	|------|---------------|----------------|-----------|
   720	| `mise.toml` | Create | ツールの exact pin、`[env]`、verify / security / 補助タスクを定義する | C1, C3, C4, C5 |
   721	| `mise.node27.toml` | Create | Node 27 alpha の版だけを上書きする | C14 |
   722	| `package.json` | Create | 段 1 が使う依存の exact pin、`packageManager`、`engines`、起動用 scripts を持つ | C1 |
   723	| `pnpm-workspace.yaml` | Create | 24h ゲート、`savePrefix`、`allowBuilds`（理由つき）、必要時の `overrides` / `audit.ignore` を持つ | C1, C4 |
   724	| `pnpm-lock.yaml` | Create | 依存グラフを固定する（`pnpm install` が生成） | C1 |
   725	| `osv-scanner.toml` | Create（条件付き） | 脆弱性の除外を記録する必要が生じたときだけ、除外ごとの ID・理由・退役条件を持つ | C4 |
   726	| `lefthook.yml` | Create | pre-commit / commit-msg / pre-push のジョブと `assert_lefthook_installed` を定義する | C9 |
   727	| `biome.json` | Create | lint / format の唯一の規約と E2E の import 制限を持つ | C2 |
   728	| `tsconfig.json` | Create | `strict` を含む型検査の設定を持つ | C2 |
   729	| `next.config.ts` | Create | Next.js の設定を持つ | C2 |
   730	| `vitest.config.ts` | Create | unit の対象、0 件失敗、通信ガードの setupFiles を定義する | C6 |
   731	| `playwright.config.ts` | Create | E2E の対象、リトライなし、専用ポートの webServer を定義する | C7 |
   732	| `.env.example` | Create | 将来の段が使う環境変数の名前だけを示す | C16 |
   733	| `.gitignore` | Modify | 秘密ファイル・生成物・テスト成果物・ローカル設定を追跡対象から外す | C16 |
   734	| `.github/workflows/ci.yml` | Create | verify（必須）と verify-node27（参考）のジョブを定義する | C13 |
   735	| `.github/workflows/security-daily.yml` | Create | 毎日の security タスクを定義する | C13 |
   736	| `.github/dependabot.yml` | Create | npm と Actions の週次更新提案を cooldown つきで定義する | C13 |
   737	| `src/app/layout.tsx` | Create | ルートレイアウトを RSC で提供する | C11 |
   738	| `src/app/page.tsx` | Create | AI を呼ばないプレースホルダーページを RSC で提供する | C11 |
   739	| `src/lib/ai/model-allowlist.ts` | Create | モデル ID の唯一の定義を持つ | C8 |
   740	| `scripts/check-model-ids.mjs` | Create | allowlist 外のモデル ID の直書きを検出する | C8 |
   741	| `scripts/check-commit-msg.mjs` | Create | commit メッセージの 1 行目を Conventional Commits の形式で検査する | C9 |
   742	| `tests/unit/setup/network-guard.ts` | Create | unit の未モック通信を失敗させる | C6 |
   743	| `tests/unit/helpers/sandbox.ts` | Create | 一時 git リポジトリ、ツールの絶対パス解決、隔離した環境変数（固定の偽 identity）、子プロセス実行を提供する | C6 |
   744	| `tests/unit/setup/require-executed-tests.ts` | Create | 実行 0 件（全部 todo / skip）の unit 実行を失敗させる Vitest reporter | C6 |
   745	| `tests/unit/gitleaks-pre-commit.test.ts` | Create | 秘密値を含む commit が secrets ジョブで拒否されることを確かめる | C10 |
   746	| `tests/unit/network-guard.test.ts` | Create | 未モック通信がテストを失敗させることを入れ子実行で確かめる | C12 |
   747	| `tests/unit/gate-self-check.test.ts` | Create | unit と `@smoke` の 0 件実行が失敗することを確かめる | C12 |
   748	| `tests/unit/check-model-ids.test.ts` | Create | `check:model-ids` の検出・除外・終了コードを確かめる | C12 |
   749	| `tests/unit/hooks-config.test.ts` | Create | フックの構成、タスクとの対応、ツール不在時の失敗を確かめる | C12 |
   750	| `tests/unit/check-commit-msg.test.ts` | Create | commit-msg の合否判定を確かめる | C12 |
   751	| `tests/unit/repo-policy.test.ts` | Create | 版の固定、lint / 型の規約、テストの配置、CI の固定、秘密ファイルの扱いを静的に確かめる | C12 |
   752	| `tests/unit/static-analysis.test.ts` | Create | 実際の Biome / tsc 設定が走査対象の違反で非 0 になることを確かめる（2.4、2.5） | C12 |
   753	| `tests/unit/docs-structure.test.ts` | Create | 解説の節順と参照パス、Node 27 記録の見出しを確かめる | C12 |
   754	| `tests/fixtures/gate/vitest.fixture.config.ts` | Create | 実設定を引き継ぐ入れ子実行用の Vitest 設定を持つ | C12 |
   755	| `tests/fixtures/gate/unmocked-network.fixture.ts` | Create | ガードに捕まるべき通信を行う入れ子実行の入力 | C12 |
   756	| `tests/fixtures/gate/no-network.fixture.ts` | Create | 通信しない対照の入れ子実行の入力 | C12 |
   757	| `tests/fixtures/gate/all-todo.fixture.ts` | Create | `it.todo` だけを持つ、実行 0 件の入れ子実行の入力 | C12 |
   758	| `tests/fixtures/gate/e2e/playwright.fixture.config.ts` | Create | 本物の reporter を使う入れ子の Playwright 実行用の設定（webServer なし） | C12 |
   759	| `tests/fixtures/gate/e2e/all-skip.fixture.ts` | Create | `@smoke` が `test.info().skip()` で全部 skip する入れ子実行の入力 | C12 |
   760	| `tests/fixtures/gate/e2e/one-pass.fixture.ts` | Create | `@smoke` が 1 件通る対照の入力 | C12 |
   761	| `tests/fixtures/gate/e2e/external-request.fixture.ts` | Create | 外部オリジンへ要求を出し、teardown の失敗を引き出す入力 | C12 |
   762	| `tests/fixtures/gate/e2e/no-external-request.fixture.ts` | Create | 外部要求のない対照の入力 | C12 |
   763	| `tests/unit/sandbox.test.ts` | Create | `sandbox.ts` の契約（隔離した環境で node / git / gitleaks / lefthook / pnpm が起動する、`expectGateFailure` が 127 を拒否する）を確かめる | C6 |
   764	| `tests/e2e/fixtures.ts` | Create | 外部オリジンを遮断する auto fixture つきの `test` / `expect` を提供する | C7 |
   765	| `tests/e2e/reporters/require-executed-tests.ts` | Create | 実行 0 件（全部 skip）の E2E 実行を失敗させる Playwright reporter | C7 |
   766	| `tests/e2e/placeholder.smoke.spec.ts` | Create | プレースホルダーの見出しを確かめる `@smoke` テスト | C11 |
   767	| `tests/e2e/network-guard.smoke.spec.ts` | Create | 外部オリジンへの通信が遮断・記録されることを確かめる `@smoke` テスト | C12 |
   768	| `docs/stages/1-dev-environment-and-gates.md` | Create | 段 1 の解説（読む → 動かす → 改造する → テストで合格を確かめる） | C16 |
   769	| `docs/node27/<YYYY-MM-DD>-initial-lane.md` | Create | Node 27 alpha の初回検証記録（日付は実行日） | C14 |
   770	| `README.md` | Modify | セットアップ、mise の注意、コマンド、Node 27 の worktree 手順を記す | C16, C14 |
   771	| `.sdd/memory/constitution.md` | Modify + Commit | 原則 3 を MINOR 改訂（1.1.0）し、Sync Impact Report と改訂履歴を更新する | C16 |
   772	| `.sdd/steering/tech.md` | Modify + Commit | Gate command と gitleaks の置き場を実際の構成に合わせる | C16 |
   773	| `.sdd/steering/structure.md` | Modify + Commit | 状態注記とテスト補助ディレクトリの役割を実際の構成に合わせる | C16 |
   774	| `.sdd/steering/product.md` | Modify + Commit | 状態注記を段 1 完了後に合わせる | C16 |
   775	| `AGENTS.md` | Modify + Commit | コマンド表と "Current state" を実在するタスクに合わせる | C16 |
   776	| `specs/000-development-plan/plan.md` | Modify | §4・§7 M1・§8.5・Constitution Compliance に改訂注記を入れる | C16 |
   777	| `specs/001-dev-environment-and-gates/research.md` | Modify | 実装時の記録 R-1〜R-11 を追記する | C15 |
   778	| `specs/001-dev-environment-and-gates/spec.json` | Modify | SDD のフェーズと承認状態を更新する（SDD コマンドが行う） | — |
   779	
   780	生成物でコミットしないもの: `next-env.d.ts`、`.next/`、`test-results/`、`playwright-report/`、`.vitest/`、
   781	`*.tsbuildinfo`。ZIP のアプリコードとテストは作らない（12.7）。
   782	
   783	リポジトリ設定（ファイル外、C13）: ruleset `protect-main` の有効化と必須チェック `verify` の追加。
   784	適用前にユーザーの確認を得る。
   785	
   786	実装順の制約（tasks.md への入力）:
   787	
   788	1. 最初の失敗するテストを動かすには `package.json`・`pnpm-workspace.yaml`・`pnpm-lock.yaml`・
   789	   `vitest.config.ts`・`mise.toml` の `[tools]` と `test` タスクが要る。これらはテストランナーの起動に
   790	   必要な最小限だけを先に作り、以後のゲート設定はそれを検査するテストを先に書く（憲章 原則 4）。
   791	2. `tests/unit/helpers/sandbox.ts` と `tests/unit/setup/network-guard.ts` は、子プロセスや一時リポジトリを
   792	   使う他のテストより先に用意する。
   793	3. `lefthook install` は、`lefthook.yml` と `hooks-config.test.ts` が緑になってから行う（未完成の
   794	   フックで commit が止まらないようにする）。
   795	4. ruleset の変更は、CI の `verify` ジョブが一度緑になってから行う。
   796	
   797	## Error Handling & Edge Cases
   798	
   799	**ゲートの失敗を成功に変えない**
   800	
   801	- verify / security の構成要素のどれかが非 0 → 後続を実行せず非 0（3.2、4.1、I-3）。
   802	- unit テストファイルが 0 件 → Vitest が非 0（3.8、`passWithNoTests: false`）。ファイルはあるが実行 0 件（全部
   803	  `todo` / `skip`）→ reporter `require-executed-tests.ts` が非 0 にする。`.skip` は Biome の `noSkippedTests` でも
   804	  止める。`.only` の混入 → `allowOnly: false`
   805	  で失敗（3.7 の決定論）。
   806	- `@smoke` が 0 件 → Playwright が非 0（3.9、`--pass-with-no-tests` を使わない）。一致はするが全部 skip →
   807	  reporter `require-executed-tests.ts` が `onEnd` で failed にする（reporter がなければ exit 0 になる。実測、
   808	  I-15）。この 2 つは `gate-self-check.test.ts` が実行して確かめる。
   809	- 子プロセスが ENOENT / 126 / 127 で落ちた → 「ゲートの拒否」として数えない。`expectGateFailure` が
   810	  `spawnError`、126 / 127 を拒否し、出力で失敗の理由を確かめる（`sandbox.ts`、`sandbox.test.ts`）。
   811	- `test` / `e2e` タスクに結果を緩めるフラグが足される → `hooks-config.test.ts` が検出し、0 件の自己検査も
   812	  タスクの argv を通して落ちる。
   813	- unit の未モック通信 → その場で `UnmockedNetworkError`。呼び出し側が例外を握りつぶしても `afterEach` で
   814	  失敗する（3.10）。
   815	- E2E の外部オリジンへの未モック通信 → `abort` し、teardown で失敗する（3.11）。
   816	- gitleaks の全履歴スキャンで検出 → 非 0、値は `REDACTED`（3.12、I-6）。走査は `--log-opts=HEAD` で HEAD から
   817	  到達できるコミットに限り、ローカルの別ブランチや stash で合否が変わらないようにする（3.7）。
   818	- `pnpm audit` / osv-scanner が advisory の取得先に到達できない → 非 0 のまま。
   819	  `--ignore-registry-errors` や `|| true` で包まない（4.4）。実際の終了コードは R-4 で実測する。
   820	- 修正版に上げられない脆弱性 → C4 の形式で除外を記録する。osv-scanner の `ignoreUntil` を過ぎると自動で
   821	  再び失敗する（4.5、憲章 原則 9）。
   822	- `pnpm outdated` の `exit 1` は「候補あり」を意味する。タスクは終了コードを隠さず、意味を文書化する（5.3）。
   823	- `check:model-ids` で root が git リポジトリでない、git が失敗した、allowlist を読めない → exit 2（0 にしない）。
   824	
   825	**フックとツールの不在**
   826	
   827	- lefthook 本体が見つからない → `assert_lefthook_installed: true` で exit 1（7.7、I-4）。mise で lefthook を上げて
   828	  旧版が消え、フックに埋め込まれたパスが無効になった場合がこれにあたる（`hooks-config.test.ts` のケース 2）。
   829	- lefthook は見つかるがジョブのツール（`mise`、`gitleaks`、`pnpm`、`node`）が PATH にない → ジョブが 127 で
   830	  失敗し、フックが非 0（7.3、7.7）。README に「mise を有効にしていない Git クライアントではフックが失敗する」と
   831	  書く（13.4）。
   832	- pre-push の途中で失敗 → `piped: true` で後続を実行せず push を拒否（7.6）。
   833	- `--no-verify` / `LEFTHOOK=0` による回避 → CI の `verify` が同じ検査を行う。回避は憲章の規律（環境要因の
   834	  証明、PR 本文への記録）に従う。
   835	- unit テストが gitleaks / lefthook / git を見つけられない → スキップせず、原因を示すメッセージで失敗する
   836	  （憲章 原則 3）。
   837	
   838	**テストの安全性と後始末**
   839	
   840	- フック実行中の git は `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスに渡す。pre-push で動く unit テストが
   841	  それを引き継いで一時リポジトリの git を実行すると、実リポジトリの index を操作しうる → `isolatedEnv()` で
   842	  `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` を設定する（I-6）。`GITLEAKS_CONFIG`
   843	  など設定を差し替える変数と `LEFTHOOK` / `LEFTHOOK_BIN` も除く。
   844	- テストの成否にかかわらず一時ディレクトリを削除する → `onTestFinished` で登録（8.8）。
   845	- 偽キーは実行時にだけ存在し、リポジトリのファイルにも gitleaks の出力にも残らない（8.4、8.6）。
   846	- 子プロセスにはタイムアウトを付け、ハングをテスト失敗として扱う。`runCommand` のタイムアウト（既定 30 秒）は
   847	  テストファイルの timeout（初期値 60 秒）より短くし、CI の 2 vCPU でも既定の 5 秒で緑と赤が入れ替わらない
   848	  ようにする（3.7。値は R-11 の実測で見直す）。
   849	- 一時リポジトリを cwd にすると mise の shim が `No version is set for shim` で失敗する → ツールは
   850	  `resolveTool()` でリポジトリのルートから絶対パスを解決して呼ぶ。`pnpm exec vitest run <file>` を単体で
   851	  実行した場合も同じ結果になる。
   852	- `GIT_CONFIG_GLOBAL=/dev/null` で identity が消え、Linux では `git commit` 自体が失敗する → `isolatedEnv()` が
   853	  固定の偽の identity を設定し、拒否のケースは「commit が作られていない」ことと gitleaks の検出を出力で
   854	  確かめる（拒否の原因を gitleaks に限定する）。
   855	
   856	**モデル ID 検査の誤検出と漏れ**
   857	
   858	- 開発者の `.env.local` に実際の `AI_MODEL` がある → gitignore 済みなので走査しない（ADR-6）。
   859	- テスト fixture にモデル ID が要る → `tests/fixtures/**` に置く（6.6）。unit テスト本体は allowlist を import
   860	  する。
   861	- 検出パターンのソース自体が一致する → パターンを「接頭辞の直後に正規表現の記号が来る」書き方にし、
   862	  自己検出しないことをリポジトリ全体の `check:model-ids` で常時確かめる（6.4）。
   863	- 日本語の文中の ID → JavaScript の `\b` は ASCII 基準で、日本語の文字は境界として扱われる。テストに日本語の
   864	  文脈を含める。
   865	
   866	**依存と install**
   867	
   868	- install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0
   869	  （1.5、1.8、I-8）。`allowBuilds` に理由つきで追加し、自動追記されたプレースホルダーを残さない。
   870	- 24h を満たす版がない（exact pin が新しすぎる）→ `minimumReleaseAgeStrict` により解決が失敗する
   871	  （1.3、1.4）。24h を満たす版を選び直す。
   872	- `packageManager` と mise の pnpm がずれる → pnpm が別版へ切り替えようとしてネットワークを使う →
   873	  `repo-policy.test.ts` が検出する（1.6）。
   874	- `pnpm add` が `^` を付ける → `savePrefix: ""` で exact にし、`repo-policy.test.ts` が検出する（1.2）。
   875	- Dependabot の security updates は cooldown の対象外 → 公開から 24h 未満の修正版の PR が来ても、
   876	  CI の install と憲章 原則 8 に従い 24h 経過後にマージする（10.12 の範囲は version updates）。
   877	
   878	**決定論**
   879	
   880	- `next dev` が `tsconfig.json` に値を書き足す → 取り込み時に受け入れて固定し、CI の「作業ツリー不変」で
   881	  再発を検出する（3.7、I-11）。
   882	- `tsc` の結果が直前の `next dev` の有無で変わる → `typecheck` は必ず `next typegen` を先に実行する（I-11）。
   883	- 開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで、別アプリを
   884	  検査せずに失敗として表面化する（3.7）。
   885	- 同一コミットで 3 回連続の verify → 同じ合否（R-3 に記録）。
   886	
   887	**Node 27 レーン**
   888	
   889	- `MISE_ENV=node27 mise install` が alpha を解決できない → 出力と必要だった設定、または未解決である旨を
   890	  R-8 に記録する（11.3）。
   891	- Node 27 で verify が失敗 → CI は `continue-on-error` でブロックしない（10.4）。失敗した検査と出力の要点を
   892	  `docs/node27/` の「未解決事項」に書く（11.6）。
   893	
   894	**TypeScript 7.1**
   895	
   896	- 実装時に 7.1 の RC / stable が公開から 24h 以上 → 切り替えて R-7 に記録する（12.5）。未公開または 24h 未満
   897	  → 確認日と公開状況を記録し beta を据え置く（12.6）。2026-11-22 時点は未公開（I-2）。
   898	
   899	## Constitution Compliance
   900	
   901	対象: `.sdd/memory/constitution.md` 1.0.0。
   902	
   903	| Principle | Status | Notes |
   904	|-----------|--------|-------|
   905	| 1. 入門ラボの範囲を守る | ✅ | 扱わない領域を含まない。兄弟リポジトリの本文・コードを複製しない（検証記録の見出しは plan §3.3 の形式名だけを使う） |
   906	| 2. spec・解説・実装・合格テストで完成 | ✅ | 4 点を File Structure Plan に持つ。解説の参照パスの実在は `docs-structure.test.ts` が検査する |
   907	| 3. ゲートは 1 つ・決定論・空振りしない | ⚠️ | 設計は Clarifications 2 問目に従い、ネットワークが必要な検査を `security` に分ける。現行の原則 3 は「verify がセキュリティ検査を含み、フックと CI は同じ verify を実行する」と読めるため、**同じ PR で MINOR 改訂（1.1.0）が要る**（13.7、C16）。それ以外の要求（オフライン、未モック通信の遮断、0 件で失敗、リトライなし、非空虚の記録 R-10）は満たす |
   908	| 4. テストを先に書く | ⚠️ | テストランナー自体（`package.json`・lockfile・`vitest.config.ts`・`mise.toml` の `test`）は最初の RED より前に要る。File Structure Plan の「実装順の制約」で最小限に限り、以後のゲート設定は検査テストを先に書く。tasks.md でこの順序を明示すること |
   909	| 5. モデルは注入し、ID は allowlist だけ | ✅ | `model-allowlist.ts` が唯一の定義、`check:model-ids` を verify と pre-commit で実行。段 1 は LLM を呼ばない |
   910	| 6. エージェントは止まり、承認を待つ | N/A | 段 005 の範囲 |
   911	| 7. 型と境界を固定する | ✅ | `strict`、Biome の 3 ルールを `error`、`any` なし。外部ツールの JSON は `unknown` + 型ガード。ページは RSC。`server-only` が必要なモジュールは段 1 にない |
   912	| 8. 秘密情報とサプライチェーン | ✅ | gitleaks は pre-commit（staged、`--redact`）と CI（verify 内の全履歴、`fetch-depth: 0`）。`gitleaks dir` は使わない。24h ゲート（除外なし）、exact pin、`allowBuilds` の理由つき列挙（`sharp: false`）、`--frozen-lockfile`、osv-scanner と `pnpm audit --audit-level=high`、SHA 固定、最小権限、`persist-credentials: false`、`.env.example` は名前だけ。ガードのメッセージはクエリやヘッダーを含めない |
   913	| 9. 事実は実測、版は現時点の採用版 | ✅ | 根拠は research.md（I-1〜I-14）。版番号は参考値で、テストは版番号を期待値にしない（`repo-policy.test.ts` は exact であることと 2 つの設定の一致だけを見る） |
   914	| 10. 依存は plan に宣言してから | ✅ | 依存は ADR-4 の一覧に限る（plan §2 の部分集合）。CI ジョブ（verify、verify-node27、security-daily）と Dependabot は plan §3.2・§8.5 で宣言済み。CI の「作業ツリー不変」ステップは本 plan で宣言する。新しい外部サービスはない |
   915	| 11. 段階ゲートを飛ばさない | ✅ | 段 001 が最初の段。今回の `-y` は要件の承認にだけ作用し、spec.json の要件はすでに承認済みだった。設計とタスクは人間が承認する。実装フェーズごとに別モデルファミリー（Codex）の敵対的レビューを `.sdd/reviews/` に 1 ラウンド 1 ファイルで残す |
   916	| Additional Constraints: ツールチェーン | ✅ | mise で固定し、フックは PATH 上の mise 管理ツールを呼ぶ。README に明記（13.4） |
   917	| Additional Constraints: Node のレーン | ⚠️ | 憲章は「`mise.node27.toml` と `exp/node27` で分離検証」と書くが、Clarifications 4 問目で `exp/node27` は必要時に作ると決めた。矛盾ではないが誤読されうる → **原則 3 の MINOR と同じ改訂で「`exp/node27` は Node 27 専用の修正が必要になった時点で作る」と明確化することを推奨**（13.7 の範囲の拡張になるため、設計承認時に判断してほしい） |
   918	| Additional Constraints: フックの回避 | ✅ | `--no-verify` / `LEFTHOOK=0` は CI が補う。回避は環境要因の証明と PR 本文への記録 |
   919	| Additional Constraints: lint / format | ✅ | Biome 単一、3 ルール `error` |
   920	| Additional Constraints: テストのモック | ✅ | E2E は `page.route`（段 003 から SSE モック）。pre-push の `@smoke` は 2 本（プレースホルダー、通信ガードの自己検査）で D5 の 1〜2 本に収まる |
   921	| Additional Constraints: 品質目標・言語 | ✅ | カバレッジのしきい値は TODO(BRANCH_COVERAGE) のまま。散文は日本語、コード・識別子・`AGENTS.md` は英語 |
   922	
   923	CRITICAL な違反はない。⚠️ の 3 件は、本 spec のタスク（13.7 の改訂、実装順の明示）で解消する。
   924	
   925	## Requirements Traceability
   926	
   927	検証欄の `R-n` は research.md の実装時の記録、「レビュー」は `/sdd-validate-impl` と敵対的レビューでの確認を表す。
   928	
   929	| Requirement ID | Component(s) | 検証 |
   930	|----------------|--------------|------|
   931	| 1.1 | C1, C14 | `tests/unit/repo-policy.test.ts` |
   932	| 1.2 | C1 | `tests/unit/repo-policy.test.ts` |
   933	| 1.3 | C1, C15 | R-1 |
   934	| 1.4 | C1 | `tests/unit/repo-policy.test.ts` |
   935	| 1.5 | C1 | `tests/unit/repo-policy.test.ts`（`sharp`）、R-2（各項目の理由） |
   936	| 1.6 | C1 | `tests/unit/repo-policy.test.ts` |
   937	| 1.7 | C1 | レビュー、R-1 |
   938	| 1.8 | C1, C5, C13 | CI の `pnpm install --frozen-lockfile`、R-2 |
   939	| 1.9 | C15 | R-2 |
   940	| 2.1 | C2 | `tests/unit/repo-policy.test.ts` |

**Checking requirements and research**

I see that I’m dealing with a truncated file that possibly contains a continuation plan for requirements trace. I need to check the requirements coverage. The user is asking me to read the research after the plan, but I realize I must complete the plan first. There's still some work to do, with plans covering 861+ and maybe needing details from 756-905. I should focus on wrapping up the plan before diving into research.
exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '755,925p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 96ms:
   755	| `tests/fixtures/gate/unmocked-network.fixture.ts` | Create | ガードに捕まるべき通信を行う入れ子実行の入力 | C12 |
   756	| `tests/fixtures/gate/no-network.fixture.ts` | Create | 通信しない対照の入れ子実行の入力 | C12 |
   757	| `tests/fixtures/gate/all-todo.fixture.ts` | Create | `it.todo` だけを持つ、実行 0 件の入れ子実行の入力 | C12 |
   758	| `tests/fixtures/gate/e2e/playwright.fixture.config.ts` | Create | 本物の reporter を使う入れ子の Playwright 実行用の設定（webServer なし） | C12 |
   759	| `tests/fixtures/gate/e2e/all-skip.fixture.ts` | Create | `@smoke` が `test.info().skip()` で全部 skip する入れ子実行の入力 | C12 |
   760	| `tests/fixtures/gate/e2e/one-pass.fixture.ts` | Create | `@smoke` が 1 件通る対照の入力 | C12 |
   761	| `tests/fixtures/gate/e2e/external-request.fixture.ts` | Create | 外部オリジンへ要求を出し、teardown の失敗を引き出す入力 | C12 |
   762	| `tests/fixtures/gate/e2e/no-external-request.fixture.ts` | Create | 外部要求のない対照の入力 | C12 |
   763	| `tests/unit/sandbox.test.ts` | Create | `sandbox.ts` の契約（隔離した環境で node / git / gitleaks / lefthook / pnpm が起動する、`expectGateFailure` が 127 を拒否する）を確かめる | C6 |
   764	| `tests/e2e/fixtures.ts` | Create | 外部オリジンを遮断する auto fixture つきの `test` / `expect` を提供する | C7 |
   765	| `tests/e2e/reporters/require-executed-tests.ts` | Create | 実行 0 件（全部 skip）の E2E 実行を失敗させる Playwright reporter | C7 |
   766	| `tests/e2e/placeholder.smoke.spec.ts` | Create | プレースホルダーの見出しを確かめる `@smoke` テスト | C11 |
   767	| `tests/e2e/network-guard.smoke.spec.ts` | Create | 外部オリジンへの通信が遮断・記録されることを確かめる `@smoke` テスト | C12 |
   768	| `docs/stages/1-dev-environment-and-gates.md` | Create | 段 1 の解説（読む → 動かす → 改造する → テストで合格を確かめる） | C16 |
   769	| `docs/node27/<YYYY-MM-DD>-initial-lane.md` | Create | Node 27 alpha の初回検証記録（日付は実行日） | C14 |
   770	| `README.md` | Modify | セットアップ、mise の注意、コマンド、Node 27 の worktree 手順を記す | C16, C14 |
   771	| `.sdd/memory/constitution.md` | Modify + Commit | 原則 3 を MINOR 改訂（1.1.0）し、Sync Impact Report と改訂履歴を更新する | C16 |
   772	| `.sdd/steering/tech.md` | Modify + Commit | Gate command と gitleaks の置き場を実際の構成に合わせる | C16 |
   773	| `.sdd/steering/structure.md` | Modify + Commit | 状態注記とテスト補助ディレクトリの役割を実際の構成に合わせる | C16 |
   774	| `.sdd/steering/product.md` | Modify + Commit | 状態注記を段 1 完了後に合わせる | C16 |
   775	| `AGENTS.md` | Modify + Commit | コマンド表と "Current state" を実在するタスクに合わせる | C16 |
   776	| `specs/000-development-plan/plan.md` | Modify | §4・§7 M1・§8.5・Constitution Compliance に改訂注記を入れる | C16 |
   777	| `specs/001-dev-environment-and-gates/research.md` | Modify | 実装時の記録 R-1〜R-11 を追記する | C15 |
   778	| `specs/001-dev-environment-and-gates/spec.json` | Modify | SDD のフェーズと承認状態を更新する（SDD コマンドが行う） | — |
   779	
   780	生成物でコミットしないもの: `next-env.d.ts`、`.next/`、`test-results/`、`playwright-report/`、`.vitest/`、
   781	`*.tsbuildinfo`。ZIP のアプリコードとテストは作らない（12.7）。
   782	
   783	リポジトリ設定（ファイル外、C13）: ruleset `protect-main` の有効化と必須チェック `verify` の追加。
   784	適用前にユーザーの確認を得る。
   785	
   786	実装順の制約（tasks.md への入力）:
   787	
   788	1. 最初の失敗するテストを動かすには `package.json`・`pnpm-workspace.yaml`・`pnpm-lock.yaml`・
   789	   `vitest.config.ts`・`mise.toml` の `[tools]` と `test` タスクが要る。これらはテストランナーの起動に
   790	   必要な最小限だけを先に作り、以後のゲート設定はそれを検査するテストを先に書く（憲章 原則 4）。
   791	2. `tests/unit/helpers/sandbox.ts` と `tests/unit/setup/network-guard.ts` は、子プロセスや一時リポジトリを
   792	   使う他のテストより先に用意する。
   793	3. `lefthook install` は、`lefthook.yml` と `hooks-config.test.ts` が緑になってから行う（未完成の
   794	   フックで commit が止まらないようにする）。
   795	4. ruleset の変更は、CI の `verify` ジョブが一度緑になってから行う。
   796	
   797	## Error Handling & Edge Cases
   798	
   799	**ゲートの失敗を成功に変えない**
   800	
   801	- verify / security の構成要素のどれかが非 0 → 後続を実行せず非 0（3.2、4.1、I-3）。
   802	- unit テストファイルが 0 件 → Vitest が非 0（3.8、`passWithNoTests: false`）。ファイルはあるが実行 0 件（全部
   803	  `todo` / `skip`）→ reporter `require-executed-tests.ts` が非 0 にする。`.skip` は Biome の `noSkippedTests` でも
   804	  止める。`.only` の混入 → `allowOnly: false`
   805	  で失敗（3.7 の決定論）。
   806	- `@smoke` が 0 件 → Playwright が非 0（3.9、`--pass-with-no-tests` を使わない）。一致はするが全部 skip →
   807	  reporter `require-executed-tests.ts` が `onEnd` で failed にする（reporter がなければ exit 0 になる。実測、
   808	  I-15）。この 2 つは `gate-self-check.test.ts` が実行して確かめる。
   809	- 子プロセスが ENOENT / 126 / 127 で落ちた → 「ゲートの拒否」として数えない。`expectGateFailure` が
   810	  `spawnError`、126 / 127 を拒否し、出力で失敗の理由を確かめる（`sandbox.ts`、`sandbox.test.ts`）。
   811	- `test` / `e2e` タスクに結果を緩めるフラグが足される → `hooks-config.test.ts` が検出し、0 件の自己検査も
   812	  タスクの argv を通して落ちる。
   813	- unit の未モック通信 → その場で `UnmockedNetworkError`。呼び出し側が例外を握りつぶしても `afterEach` で
   814	  失敗する（3.10）。
   815	- E2E の外部オリジンへの未モック通信 → `abort` し、teardown で失敗する（3.11）。
   816	- gitleaks の全履歴スキャンで検出 → 非 0、値は `REDACTED`（3.12、I-6）。走査は `--log-opts=HEAD` で HEAD から
   817	  到達できるコミットに限り、ローカルの別ブランチや stash で合否が変わらないようにする（3.7）。
   818	- `pnpm audit` / osv-scanner が advisory の取得先に到達できない → 非 0 のまま。
   819	  `--ignore-registry-errors` や `|| true` で包まない（4.4）。実際の終了コードは R-4 で実測する。
   820	- 修正版に上げられない脆弱性 → C4 の形式で除外を記録する。osv-scanner の `ignoreUntil` を過ぎると自動で
   821	  再び失敗する（4.5、憲章 原則 9）。
   822	- `pnpm outdated` の `exit 1` は「候補あり」を意味する。タスクは終了コードを隠さず、意味を文書化する（5.3）。
   823	- `check:model-ids` で root が git リポジトリでない、git が失敗した、allowlist を読めない → exit 2（0 にしない）。
   824	
   825	**フックとツールの不在**
   826	
   827	- lefthook 本体が見つからない → `assert_lefthook_installed: true` で exit 1（7.7、I-4）。mise で lefthook を上げて
   828	  旧版が消え、フックに埋め込まれたパスが無効になった場合がこれにあたる（`hooks-config.test.ts` のケース 2）。
   829	- lefthook は見つかるがジョブのツール（`mise`、`gitleaks`、`pnpm`、`node`）が PATH にない → ジョブが 127 で
   830	  失敗し、フックが非 0（7.3、7.7）。README に「mise を有効にしていない Git クライアントではフックが失敗する」と
   831	  書く（13.4）。
   832	- pre-push の途中で失敗 → `piped: true` で後続を実行せず push を拒否（7.6）。
   833	- `--no-verify` / `LEFTHOOK=0` による回避 → CI の `verify` が同じ検査を行う。回避は憲章の規律（環境要因の
   834	  証明、PR 本文への記録）に従う。
   835	- unit テストが gitleaks / lefthook / git を見つけられない → スキップせず、原因を示すメッセージで失敗する
   836	  （憲章 原則 3）。
   837	
   838	**テストの安全性と後始末**
   839	
   840	- フック実行中の git は `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスに渡す。pre-push で動く unit テストが
   841	  それを引き継いで一時リポジトリの git を実行すると、実リポジトリの index を操作しうる → `isolatedEnv()` で
   842	  `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` を設定する（I-6）。`GITLEAKS_CONFIG`
   843	  など設定を差し替える変数と `LEFTHOOK` / `LEFTHOOK_BIN` も除く。
   844	- テストの成否にかかわらず一時ディレクトリを削除する → `onTestFinished` で登録（8.8）。
   845	- 偽キーは実行時にだけ存在し、リポジトリのファイルにも gitleaks の出力にも残らない（8.4、8.6）。
   846	- 子プロセスにはタイムアウトを付け、ハングをテスト失敗として扱う。`runCommand` のタイムアウト（既定 30 秒）は
   847	  テストファイルの timeout（初期値 60 秒）より短くし、CI の 2 vCPU でも既定の 5 秒で緑と赤が入れ替わらない
   848	  ようにする（3.7。値は R-11 の実測で見直す）。
   849	- 一時リポジトリを cwd にすると mise の shim が `No version is set for shim` で失敗する → ツールは
   850	  `resolveTool()` でリポジトリのルートから絶対パスを解決して呼ぶ。`pnpm exec vitest run <file>` を単体で
   851	  実行した場合も同じ結果になる。
   852	- `GIT_CONFIG_GLOBAL=/dev/null` で identity が消え、Linux では `git commit` 自体が失敗する → `isolatedEnv()` が
   853	  固定の偽の identity を設定し、拒否のケースは「commit が作られていない」ことと gitleaks の検出を出力で
   854	  確かめる（拒否の原因を gitleaks に限定する）。
   855	
   856	**モデル ID 検査の誤検出と漏れ**
   857	
   858	- 開発者の `.env.local` に実際の `AI_MODEL` がある → gitignore 済みなので走査しない（ADR-6）。
   859	- テスト fixture にモデル ID が要る → `tests/fixtures/**` に置く（6.6）。unit テスト本体は allowlist を import
   860	  する。
   861	- 検出パターンのソース自体が一致する → パターンを「接頭辞の直後に正規表現の記号が来る」書き方にし、
   862	  自己検出しないことをリポジトリ全体の `check:model-ids` で常時確かめる（6.4）。
   863	- 日本語の文中の ID → JavaScript の `\b` は ASCII 基準で、日本語の文字は境界として扱われる。テストに日本語の
   864	  文脈を含める。
   865	
   866	**依存と install**
   867	
   868	- install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0
   869	  （1.5、1.8、I-8）。`allowBuilds` に理由つきで追加し、自動追記されたプレースホルダーを残さない。
   870	- 24h を満たす版がない（exact pin が新しすぎる）→ `minimumReleaseAgeStrict` により解決が失敗する
   871	  （1.3、1.4）。24h を満たす版を選び直す。
   872	- `packageManager` と mise の pnpm がずれる → pnpm が別版へ切り替えようとしてネットワークを使う →
   873	  `repo-policy.test.ts` が検出する（1.6）。
   874	- `pnpm add` が `^` を付ける → `savePrefix: ""` で exact にし、`repo-policy.test.ts` が検出する（1.2）。
   875	- Dependabot の security updates は cooldown の対象外 → 公開から 24h 未満の修正版の PR が来ても、
   876	  CI の install と憲章 原則 8 に従い 24h 経過後にマージする（10.12 の範囲は version updates）。
   877	
   878	**決定論**
   879	
   880	- `next dev` が `tsconfig.json` に値を書き足す → 取り込み時に受け入れて固定し、CI の「作業ツリー不変」で
   881	  再発を検出する（3.7、I-11）。
   882	- `tsc` の結果が直前の `next dev` の有無で変わる → `typecheck` は必ず `next typegen` を先に実行する（I-11）。
   883	- 開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで、別アプリを
   884	  検査せずに失敗として表面化する（3.7）。
   885	- 同一コミットで 3 回連続の verify → 同じ合否（R-3 に記録）。
   886	
   887	**Node 27 レーン**
   888	
   889	- `MISE_ENV=node27 mise install` が alpha を解決できない → 出力と必要だった設定、または未解決である旨を
   890	  R-8 に記録する（11.3）。
   891	- Node 27 で verify が失敗 → CI は `continue-on-error` でブロックしない（10.4）。失敗した検査と出力の要点を
   892	  `docs/node27/` の「未解決事項」に書く（11.6）。
   893	
   894	**TypeScript 7.1**
   895	
   896	- 実装時に 7.1 の RC / stable が公開から 24h 以上 → 切り替えて R-7 に記録する（12.5）。未公開または 24h 未満
   897	  → 確認日と公開状況を記録し beta を据え置く（12.6）。2026-11-22 時点は未公開（I-2）。
   898	
   899	## Constitution Compliance
   900	
   901	対象: `.sdd/memory/constitution.md` 1.0.0。
   902	
   903	| Principle | Status | Notes |
   904	|-----------|--------|-------|
   905	| 1. 入門ラボの範囲を守る | ✅ | 扱わない領域を含まない。兄弟リポジトリの本文・コードを複製しない（検証記録の見出しは plan §3.3 の形式名だけを使う） |
   906	| 2. spec・解説・実装・合格テストで完成 | ✅ | 4 点を File Structure Plan に持つ。解説の参照パスの実在は `docs-structure.test.ts` が検査する |
   907	| 3. ゲートは 1 つ・決定論・空振りしない | ⚠️ | 設計は Clarifications 2 問目に従い、ネットワークが必要な検査を `security` に分ける。現行の原則 3 は「verify がセキュリティ検査を含み、フックと CI は同じ verify を実行する」と読めるため、**同じ PR で MINOR 改訂（1.1.0）が要る**（13.7、C16）。それ以外の要求（オフライン、未モック通信の遮断、0 件で失敗、リトライなし、非空虚の記録 R-10）は満たす |
   908	| 4. テストを先に書く | ⚠️ | テストランナー自体（`package.json`・lockfile・`vitest.config.ts`・`mise.toml` の `test`）は最初の RED より前に要る。File Structure Plan の「実装順の制約」で最小限に限り、以後のゲート設定は検査テストを先に書く。tasks.md でこの順序を明示すること |
   909	| 5. モデルは注入し、ID は allowlist だけ | ✅ | `model-allowlist.ts` が唯一の定義、`check:model-ids` を verify と pre-commit で実行。段 1 は LLM を呼ばない |
   910	| 6. エージェントは止まり、承認を待つ | N/A | 段 005 の範囲 |
   911	| 7. 型と境界を固定する | ✅ | `strict`、Biome の 3 ルールを `error`、`any` なし。外部ツールの JSON は `unknown` + 型ガード。ページは RSC。`server-only` が必要なモジュールは段 1 にない |
   912	| 8. 秘密情報とサプライチェーン | ✅ | gitleaks は pre-commit（staged、`--redact`）と CI（verify 内の全履歴、`fetch-depth: 0`）。`gitleaks dir` は使わない。24h ゲート（除外なし）、exact pin、`allowBuilds` の理由つき列挙（`sharp: false`）、`--frozen-lockfile`、osv-scanner と `pnpm audit --audit-level=high`、SHA 固定、最小権限、`persist-credentials: false`、`.env.example` は名前だけ。ガードのメッセージはクエリやヘッダーを含めない |
   913	| 9. 事実は実測、版は現時点の採用版 | ✅ | 根拠は research.md（I-1〜I-14）。版番号は参考値で、テストは版番号を期待値にしない（`repo-policy.test.ts` は exact であることと 2 つの設定の一致だけを見る） |
   914	| 10. 依存は plan に宣言してから | ✅ | 依存は ADR-4 の一覧に限る（plan §2 の部分集合）。CI ジョブ（verify、verify-node27、security-daily）と Dependabot は plan §3.2・§8.5 で宣言済み。CI の「作業ツリー不変」ステップは本 plan で宣言する。新しい外部サービスはない |
   915	| 11. 段階ゲートを飛ばさない | ✅ | 段 001 が最初の段。今回の `-y` は要件の承認にだけ作用し、spec.json の要件はすでに承認済みだった。設計とタスクは人間が承認する。実装フェーズごとに別モデルファミリー（Codex）の敵対的レビューを `.sdd/reviews/` に 1 ラウンド 1 ファイルで残す |
   916	| Additional Constraints: ツールチェーン | ✅ | mise で固定し、フックは PATH 上の mise 管理ツールを呼ぶ。README に明記（13.4） |
   917	| Additional Constraints: Node のレーン | ⚠️ | 憲章は「`mise.node27.toml` と `exp/node27` で分離検証」と書くが、Clarifications 4 問目で `exp/node27` は必要時に作ると決めた。矛盾ではないが誤読されうる → **原則 3 の MINOR と同じ改訂で「`exp/node27` は Node 27 専用の修正が必要になった時点で作る」と明確化することを推奨**（13.7 の範囲の拡張になるため、設計承認時に判断してほしい） |
   918	| Additional Constraints: フックの回避 | ✅ | `--no-verify` / `LEFTHOOK=0` は CI が補う。回避は環境要因の証明と PR 本文への記録 |
   919	| Additional Constraints: lint / format | ✅ | Biome 単一、3 ルール `error` |
   920	| Additional Constraints: テストのモック | ✅ | E2E は `page.route`（段 003 から SSE モック）。pre-push の `@smoke` は 2 本（プレースホルダー、通信ガードの自己検査）で D5 の 1〜2 本に収まる |
   921	| Additional Constraints: 品質目標・言語 | ✅ | カバレッジのしきい値は TODO(BRANCH_COVERAGE) のまま。散文は日本語、コード・識別子・`AGENTS.md` は英語 |
   922	
   923	CRITICAL な違反はない。⚠️ の 3 件は、本 spec のタスク（13.7 の改訂、実装順の明示）で解消する。
   924	
   925	## Requirements Traceability

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '797,904p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 74ms:
   797	## Error Handling & Edge Cases
   798	
   799	**ゲートの失敗を成功に変えない**
   800	
   801	- verify / security の構成要素のどれかが非 0 → 後続を実行せず非 0（3.2、4.1、I-3）。
   802	- unit テストファイルが 0 件 → Vitest が非 0（3.8、`passWithNoTests: false`）。ファイルはあるが実行 0 件（全部
   803	  `todo` / `skip`）→ reporter `require-executed-tests.ts` が非 0 にする。`.skip` は Biome の `noSkippedTests` でも
   804	  止める。`.only` の混入 → `allowOnly: false`
   805	  で失敗（3.7 の決定論）。
   806	- `@smoke` が 0 件 → Playwright が非 0（3.9、`--pass-with-no-tests` を使わない）。一致はするが全部 skip →
   807	  reporter `require-executed-tests.ts` が `onEnd` で failed にする（reporter がなければ exit 0 になる。実測、
   808	  I-15）。この 2 つは `gate-self-check.test.ts` が実行して確かめる。
   809	- 子プロセスが ENOENT / 126 / 127 で落ちた → 「ゲートの拒否」として数えない。`expectGateFailure` が
   810	  `spawnError`、126 / 127 を拒否し、出力で失敗の理由を確かめる（`sandbox.ts`、`sandbox.test.ts`）。
   811	- `test` / `e2e` タスクに結果を緩めるフラグが足される → `hooks-config.test.ts` が検出し、0 件の自己検査も
   812	  タスクの argv を通して落ちる。
   813	- unit の未モック通信 → その場で `UnmockedNetworkError`。呼び出し側が例外を握りつぶしても `afterEach` で
   814	  失敗する（3.10）。
   815	- E2E の外部オリジンへの未モック通信 → `abort` し、teardown で失敗する（3.11）。
   816	- gitleaks の全履歴スキャンで検出 → 非 0、値は `REDACTED`（3.12、I-6）。走査は `--log-opts=HEAD` で HEAD から
   817	  到達できるコミットに限り、ローカルの別ブランチや stash で合否が変わらないようにする（3.7）。
   818	- `pnpm audit` / osv-scanner が advisory の取得先に到達できない → 非 0 のまま。
   819	  `--ignore-registry-errors` や `|| true` で包まない（4.4）。実際の終了コードは R-4 で実測する。
   820	- 修正版に上げられない脆弱性 → C4 の形式で除外を記録する。osv-scanner の `ignoreUntil` を過ぎると自動で
   821	  再び失敗する（4.5、憲章 原則 9）。
   822	- `pnpm outdated` の `exit 1` は「候補あり」を意味する。タスクは終了コードを隠さず、意味を文書化する（5.3）。
   823	- `check:model-ids` で root が git リポジトリでない、git が失敗した、allowlist を読めない → exit 2（0 にしない）。
   824	
   825	**フックとツールの不在**
   826	
   827	- lefthook 本体が見つからない → `assert_lefthook_installed: true` で exit 1（7.7、I-4）。mise で lefthook を上げて
   828	  旧版が消え、フックに埋め込まれたパスが無効になった場合がこれにあたる（`hooks-config.test.ts` のケース 2）。
   829	- lefthook は見つかるがジョブのツール（`mise`、`gitleaks`、`pnpm`、`node`）が PATH にない → ジョブが 127 で
   830	  失敗し、フックが非 0（7.3、7.7）。README に「mise を有効にしていない Git クライアントではフックが失敗する」と
   831	  書く（13.4）。
   832	- pre-push の途中で失敗 → `piped: true` で後続を実行せず push を拒否（7.6）。
   833	- `--no-verify` / `LEFTHOOK=0` による回避 → CI の `verify` が同じ検査を行う。回避は憲章の規律（環境要因の
   834	  証明、PR 本文への記録）に従う。
   835	- unit テストが gitleaks / lefthook / git を見つけられない → スキップせず、原因を示すメッセージで失敗する
   836	  （憲章 原則 3）。
   837	
   838	**テストの安全性と後始末**
   839	
   840	- フック実行中の git は `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスに渡す。pre-push で動く unit テストが
   841	  それを引き継いで一時リポジトリの git を実行すると、実リポジトリの index を操作しうる → `isolatedEnv()` で
   842	  `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`・`GIT_CONFIG_NOSYSTEM=1` を設定する（I-6）。`GITLEAKS_CONFIG`
   843	  など設定を差し替える変数と `LEFTHOOK` / `LEFTHOOK_BIN` も除く。
   844	- テストの成否にかかわらず一時ディレクトリを削除する → `onTestFinished` で登録（8.8）。
   845	- 偽キーは実行時にだけ存在し、リポジトリのファイルにも gitleaks の出力にも残らない（8.4、8.6）。
   846	- 子プロセスにはタイムアウトを付け、ハングをテスト失敗として扱う。`runCommand` のタイムアウト（既定 30 秒）は
   847	  テストファイルの timeout（初期値 60 秒）より短くし、CI の 2 vCPU でも既定の 5 秒で緑と赤が入れ替わらない
   848	  ようにする（3.7。値は R-11 の実測で見直す）。
   849	- 一時リポジトリを cwd にすると mise の shim が `No version is set for shim` で失敗する → ツールは
   850	  `resolveTool()` でリポジトリのルートから絶対パスを解決して呼ぶ。`pnpm exec vitest run <file>` を単体で
   851	  実行した場合も同じ結果になる。
   852	- `GIT_CONFIG_GLOBAL=/dev/null` で identity が消え、Linux では `git commit` 自体が失敗する → `isolatedEnv()` が
   853	  固定の偽の identity を設定し、拒否のケースは「commit が作られていない」ことと gitleaks の検出を出力で
   854	  確かめる（拒否の原因を gitleaks に限定する）。
   855	
   856	**モデル ID 検査の誤検出と漏れ**
   857	
   858	- 開発者の `.env.local` に実際の `AI_MODEL` がある → gitignore 済みなので走査しない（ADR-6）。
   859	- テスト fixture にモデル ID が要る → `tests/fixtures/**` に置く（6.6）。unit テスト本体は allowlist を import
   860	  する。
   861	- 検出パターンのソース自体が一致する → パターンを「接頭辞の直後に正規表現の記号が来る」書き方にし、
   862	  自己検出しないことをリポジトリ全体の `check:model-ids` で常時確かめる（6.4）。
   863	- 日本語の文中の ID → JavaScript の `\b` は ASCII 基準で、日本語の文字は境界として扱われる。テストに日本語の
   864	  文脈を含める。
   865	
   866	**依存と install**
   867	
   868	- install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0
   869	  （1.5、1.8、I-8）。`allowBuilds` に理由つきで追加し、自動追記されたプレースホルダーを残さない。
   870	- 24h を満たす版がない（exact pin が新しすぎる）→ `minimumReleaseAgeStrict` により解決が失敗する
   871	  （1.3、1.4）。24h を満たす版を選び直す。
   872	- `packageManager` と mise の pnpm がずれる → pnpm が別版へ切り替えようとしてネットワークを使う →
   873	  `repo-policy.test.ts` が検出する（1.6）。
   874	- `pnpm add` が `^` を付ける → `savePrefix: ""` で exact にし、`repo-policy.test.ts` が検出する（1.2）。
   875	- Dependabot の security updates は cooldown の対象外 → 公開から 24h 未満の修正版の PR が来ても、
   876	  CI の install と憲章 原則 8 に従い 24h 経過後にマージする（10.12 の範囲は version updates）。
   877	
   878	**決定論**
   879	
   880	- `next dev` が `tsconfig.json` に値を書き足す → 取り込み時に受け入れて固定し、CI の「作業ツリー不変」で
   881	  再発を検出する（3.7、I-11）。
   882	- `tsc` の結果が直前の `next dev` の有無で変わる → `typecheck` は必ず `next typegen` を先に実行する（I-11）。
   883	- 開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで、別アプリを
   884	  検査せずに失敗として表面化する（3.7）。
   885	- 同一コミットで 3 回連続の verify → 同じ合否（R-3 に記録）。
   886	
   887	**Node 27 レーン**
   888	
   889	- `MISE_ENV=node27 mise install` が alpha を解決できない → 出力と必要だった設定、または未解決である旨を
   890	  R-8 に記録する（11.3）。
   891	- Node 27 で verify が失敗 → CI は `continue-on-error` でブロックしない（10.4）。失敗した検査と出力の要点を
   892	  `docs/node27/` の「未解決事項」に書く（11.6）。
   893	
   894	**TypeScript 7.1**
   895	
   896	- 実装時に 7.1 の RC / stable が公開から 24h 以上 → 切り替えて R-7 に記録する（12.5）。未公開または 24h 未満
   897	  → 確認日と公開状況を記録し beta を据え置く（12.6）。2026-11-22 時点は未公開（I-2）。
   898	
   899	## Constitution Compliance
   900	
   901	対象: `.sdd/memory/constitution.md` 1.0.0。
   902	
   903	| Principle | Status | Notes |
   904	|-----------|--------|-------|

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/plan.md | sed -n '925,1035p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 95ms:
   925	## Requirements Traceability
   926	
   927	検証欄の `R-n` は research.md の実装時の記録、「レビュー」は `/sdd-validate-impl` と敵対的レビューでの確認を表す。
   928	
   929	| Requirement ID | Component(s) | 検証 |
   930	|----------------|--------------|------|
   931	| 1.1 | C1, C14 | `tests/unit/repo-policy.test.ts` |
   932	| 1.2 | C1 | `tests/unit/repo-policy.test.ts` |
   933	| 1.3 | C1, C15 | R-1 |
   934	| 1.4 | C1 | `tests/unit/repo-policy.test.ts` |
   935	| 1.5 | C1 | `tests/unit/repo-policy.test.ts`（`sharp`）、R-2（各項目の理由） |
   936	| 1.6 | C1 | `tests/unit/repo-policy.test.ts` |
   937	| 1.7 | C1 | レビュー、R-1 |
   938	| 1.8 | C1, C5, C13 | CI の `pnpm install --frozen-lockfile`、R-2 |
   939	| 1.9 | C15 | R-2 |
   940	| 2.1 | C2 | `tests/unit/repo-policy.test.ts` |
   941	| 2.2 | C2 | `tests/unit/repo-policy.test.ts` |
   942	| 2.3 | C2 | `tests/unit/repo-policy.test.ts` |
   943	| 2.4 | C2, C3, C12 | `tests/unit/static-analysis.test.ts`、R-10 |
   944	| 2.5 | C2, C3, C12 | `tests/unit/static-analysis.test.ts`、R-10 |
   945	| 3.1 | C3, C12 | `tests/unit/hooks-config.test.ts`（構成要素と順序）、CI `verify` ジョブ、R-3 |
   946	| 3.2 | C3 | R-9（構成要素ごとの失敗で非 0）、I-3 |
   947	| 3.3 | C3 | `tests/unit/hooks-config.test.ts` |
   948	| 3.4 | C3 | `tests/unit/hooks-config.test.ts` |
   949	| 3.5 | C3, C6, C7 | R-3（ネットワーク切断・API キー未設定での実行） |
   950	| 3.6 | C3 | `tests/unit/hooks-config.test.ts` |
   951	| 3.7 | C3, C7 | R-3（3 回連続）、CI の作業ツリー不変 |
   952	| 3.8 | C2, C6, C12 | `tests/unit/gate-self-check.test.ts`（ファイル 0 件・実行 0 件）、`tests/unit/static-analysis.test.ts`（`noSkippedTests`） |
   953	| 3.9 | C2, C7, C12 | `tests/unit/gate-self-check.test.ts`（全部 skip、`--list` の一致 0 件）、`tests/unit/static-analysis.test.ts`（`noSkippedTests`） |
   954	| 3.10 | C6, C12 | `tests/unit/network-guard.test.ts` |
   955	| 3.11 | C7, C12 | `tests/e2e/network-guard.smoke.spec.ts`（遮断と記録）、`tests/unit/gate-self-check.test.ts`（既定の `failOnBlockedRequest: true` で teardown が失敗する経路） |
   956	| 3.12 | C3 | `tests/unit/hooks-config.test.ts`（`--redact`）、R-10 |
   957	| 4.1 | C4, C12 | `tests/unit/hooks-config.test.ts`（構成要素と順序）、CI `verify` ジョブ |
   958	| 4.2 | C4 | R-4 |
   959	| 4.3 | C4 | R-4 |
   960	| 4.4 | C4 | R-4（registry 到達不能） |
   961	| 4.5 | C4 | レビュー（除外が生じたとき） |
   962	| 5.1 | C5 | CI の `mise run runtime` のログ |
   963	| 5.2 | C5 | レビュー |
   964	| 5.3 | C5 | R-1（実行出力） |
   965	| 5.4 | C5 | R-1（実行前後の `git status`） |
   966	| 6.1 | C8 | verify の `check:model-ids`、`tests/unit/check-model-ids.test.ts` |
   967	| 6.2 | C8, C15 | R-5 |
   968	| 6.3 | C8 | `tests/unit/check-model-ids.test.ts` |
   969	| 6.4 | C8 | `tests/unit/check-model-ids.test.ts` |
   970	| 6.5 | C8 | `tests/unit/check-model-ids.test.ts` |
   971	| 6.6 | C8 | `tests/unit/check-model-ids.test.ts` |
   972	| 6.7 | C8 | `tests/unit/check-model-ids.test.ts` |
   973	| 7.1 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   974	| 7.2 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   975	| 7.3 | C9, C10 | `tests/unit/gitleaks-pre-commit.test.ts`（フック経由） |
   976	| 7.4 | C9, C12 | `tests/unit/check-commit-msg.test.ts`、`tests/unit/hooks-config.test.ts` |
   977	| 7.5 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   978	| 7.6 | C9, C12 | `tests/unit/hooks-config.test.ts`（`piped`） |
   979	| 7.7 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   980	| 7.8 | C9, C12 | `tests/unit/hooks-config.test.ts` |
   981	| 8.1 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   982	| 8.2 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   983	| 8.3 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   984	| 8.4 | C10 | `tests/unit/gitleaks-pre-commit.test.ts`、verify の `check:secrets` |
   985	| 8.5 | C9, C10 | `tests/unit/gitleaks-pre-commit.test.ts`（設定ファイルの不在）、`tests/unit/hooks-config.test.ts`（`--ignore-gitleaks-allow`） |
   986	| 8.6 | C10 | `tests/unit/gitleaks-pre-commit.test.ts` |
   987	| 8.7 | C10, C6 | verify の `test` に含まれる（`tests/unit/**`）、通信ガード下で緑 |
   988	| 8.8 | C10, C6 | `tests/unit/helpers/sandbox.ts` の `onTestFinished`、R-10 |
   989	| 9.1 | C11 | レビュー、`tests/e2e/placeholder.smoke.spec.ts`（外部通信なしで緑） |
   990	| 9.2 | C11 | レビュー |
   991	| 9.3 | C11 | `tests/e2e/placeholder.smoke.spec.ts` |
   992	| 9.4 | C12 | `tests/unit/check-model-ids.test.ts` |
   993	| 9.5 | C12 | `tests/unit/network-guard.test.ts` |
   994	| 9.6 | C12 | `tests/unit/gate-self-check.test.ts`、`tests/e2e/network-guard.smoke.spec.ts`、R-9（構成要素ごとの終了コードの実行記録） |
   995	| 9.7 | C12 | R-10 |
   996	| 9.8 | C6, C7, C12 | `tests/unit/repo-policy.test.ts` |
   997	| 9.9 | C12 | レビュー |
   998	| 10.1 | C13, C12 | `tests/unit/hooks-config.test.ts`（`ci.yml` の文字列）、CI の実行結果 |
   999	| 10.2 | C13 | ruleset の設定（I-13）、レビュー |
  1000	| 10.3 | C13, C12 | `tests/unit/hooks-config.test.ts`（`ci.yml` の文字列）、CI の実行結果 |
  1001	| 10.4 | C13 | レビュー（`continue-on-error`） |
  1002	| 10.5 | C13 | security-daily の手動実行の結果 |
  1003	| 10.6 | C13 | レビュー（`fetch-depth: 0`） |
  1004	| 10.7 | C13 | レビュー |
  1005	| 10.8 | C13 | `tests/unit/repo-policy.test.ts` |
  1006	| 10.9 | C13 | レビュー |
  1007	| 10.10 | C13 | `tests/unit/repo-policy.test.ts` |
  1008	| 10.11 | C13 | レビュー |
  1009	| 10.12 | C13 | レビュー（`cooldown.default-days: 1`） |
  1010	| 11.1 | C14, C1 | `tests/unit/repo-policy.test.ts` |
  1011	| 11.2 | C14 | R-8 |
  1012	| 11.3 | C14, C15 | R-8 |
  1013	| 11.4 | C14, C3 | CI `verify-node27` の実行結果 |
  1014	| 11.5 | C14, C12 | `tests/unit/docs-structure.test.ts` |
  1015	| 11.6 | C14 | `docs/node27/` の記録 |
  1016	| 11.7 | C14, C16 | レビュー |
  1017	| 12.1 | C15 | R-6、R-7、R-8 |
  1018	| 12.2 | C15 | R-6 |
  1019	| 12.3 | C15 | R-6 |
  1020	| 12.4 | C15 | R-6 |
  1021	| 12.5 | C15 | R-7 |
  1022	| 12.6 | C15 | R-7 |
  1023	| 12.7 | C15 | レビュー |
  1024	| 13.1 | C16, C12 | `tests/unit/docs-structure.test.ts` |
  1025	| 13.2 | C16, C12 | `tests/unit/docs-structure.test.ts` |
  1026	| 13.3 | C16, C5 | レビュー |
  1027	| 13.4 | C16 | レビュー |
  1028	| 13.5 | C16, C12 | `tests/unit/repo-policy.test.ts` |
  1029	| 13.6 | C16, C12 | `tests/unit/repo-policy.test.ts` |
  1030	| 13.7 | C16 | レビュー |
  1031	| 13.8 | C16 | レビュー |
  1032	| 13.9 | C16 | レビュー |
  1033	| 13.10 | C16 | レビュー |
  1034	| 13.11 | C16 | レビュー（PR の差分） |
  1035	| 13.12 | C16 | レビュー |

exec
/bin/zsh -lc 'nl -ba specs/001-dev-environment-and-gates/research.md' in /Users/Shared/codes/genai-lab-ts
 succeeded in 74ms:
     1	# 001-dev-environment-and-gates — Discovery & Research Log
     2	
     3	`/sdd-plan` で作成した調査記録。設計判断の根拠（実測と公式ドキュメント）と、実装時に追記する
     4	検証記録の置き場を兼ねる。版番号はすべて**確認日つきの参考値**で、正本は `mise.toml`、
     5	`package.json`、`pnpm-lock.yaml`（plan §2.1、憲章 原則 9）。
     6	
     7	- 確認日: 2026-11-22（JST）。時刻つきの値は UTC。
     8	- 実行環境: macOS（arm64）、mise 2026.11.12、ユーザー全体設定の Node 26.13.1 / pnpm 12.22.0。
     9	- ZIP: `~/Downloads/genai-lab.zip`（SHA-256 `21ec78c32564cc2e8d9b388882e123a715475c9f41f4d6a59ca67810aa4e892b`）。
    10	  scratchpad の専用ディレクトリに展開して読んだ。リポジトリには展開していない。
    11	
    12	## Discovery type
    13	
    14	New feature（full）。リポジトリにアプリコードがなく、ZIP 足場の取り込みとゲート一式を新設するため。
    15	
    16	## Investigations
    17	
    18	### I-1 ZIP 足場の構成と、spec 001 で取り込む範囲
    19	
    20	- **Question**: ZIP に何が入っていて、Clarifications 1 問目（B: 基盤のみ）でどれを取り込むか。
    21	- **Findings**: ZIP は 23 ファイル。基盤（`mise.toml`、`mise.node27.toml`、`package.json`、
    22	  `pnpm-workspace.yaml`、`lefthook.yml`、`biome.json`、`tsconfig.json`、`next.config.ts`、
    23	  `vitest.config.ts`、`playwright.config.ts`、`.env.example`、`.gitignore`、`.github/workflows/ci.yml`、
    24	  `README.md`）と、段 3〜6 のアプリコード（`src/app/{layout,page}.tsx`、`src/app/api/chat/route.ts`、
    25	  `src/lib/ai/{agent,extract-task,model}.ts`）とテスト（`tests/unit/{agent-approval,extract-task}.test.ts`、
    26	  `tests/e2e/chat.smoke.spec.ts`）。`security-daily.yml`、`dependabot.yml`、`model-allowlist.ts`、
    27	  `check-model-ids` は ZIP に**ない**（plan §2.2・§3.2 で追加したもの）。
    28	- **ZIP の基盤ファイルで plan §2.2 以外に直す必要があるもの**:
    29	  - `mise.toml` の `verify` が `depends = ["check", "security"]`（mise は depends を並列実行する）で、
    30	    security（ネットワーク必要）を含む → Clarifications 2 問目と 3.6 に反する。
    31	  - `lefthook.yml` に commit-msg と `check:model-ids` がない（7.1・7.2）。`assert_lefthook_installed` が
    32	    ない（I-4、7.7）。
    33	  - `playwright.config.ts` が CI で `retries: 1`、`reuseExistingServer: !CI`、ポート 3000 → 憲章 原則 3
    34	    （リトライで隠さない、決定論）に反する。
    35	  - `ci.yml` が matrix 1 ジョブ（必須チェック名が `verify ()` / `verify (node27)` になる）、タグ指定の
    36	    `uses:`、security を verify に含める前提。
    37	  - `package.json` に AI SDK 一式と `@vitejs/plugin-react`（段 1 のコードは使わない）。
    38	- **Evidence**: 展開先の全ファイルを読んだ（scratchpad `zip-extract/genai-lab/`）。
    39	
    40	### I-2 採用候補の版と公開日時（24h ゲート）
    41	
    42	- **Question**: 設計時点で、24h ゲート（`minimumReleaseAge: 1440`）を満たす候補版はどれか。
    43	- **Findings**: 下表「External dependencies」のとおり。注意点:
    44	  - **Next.js**: canary の最新 `16.5.0-canary.60`（2026-11-21T23:57Z）は確認時点で 24h 未満。
    45	    24h を満たす最新は `16.5.0-canary.59`（2026-11-20T23:53Z）。canary はほぼ毎日出るため、実装時に
    46	    改めて「24h を満たす最新」を選び、その公開日時を記録する（1.3）。
    47	  - **TypeScript**: dist-tag は `beta = 7.1.0-beta`（2026-10-20）、`latest = 7.0.2`（stable）、
    48	    `rc = 7.0.1-rc`（7.0 系の古い RC）。**7.1 の RC / stable は未公開** → 12.6 に該当し beta を据え置く
    49	    （実装時に再確認、12.5 / 12.6）。`typescript@7.1.0-beta` は `bin.tsc` を持つ。
    50	  - **jdx/mise-action**: 最新 `v5.3.0`（2026-11-21T17:01Z）は 24h 未満。`v5.2.10`（2026-11-18）が候補。
    51	    Actions にも同じ 24h 規律を適用する（Dependabot の `cooldown` と揃える）。
    52	  - **Node 27**: `27.0.0-alpha.0.1.1`（2026-11-17）が最新 alpha。ZIP の `27.0.0-alpha.0.1.0` より新しい。
    53	- **Evidence**: `pnpm view <pkg> dist-tags --json`、`pnpm view <pkg> time --json`、
    54	  `gh api repos/<owner>/<repo>/releases`（2026-11-22 実行）。
    55	
    56	### I-3 mise: タスク、別名、環境ファイル、prerelease
    57	
    58	- **Question**: verify の直列化、`gate` 別名、`:` を含むタスク名、`MISE_ENV=node27` の合成、Node 27 alpha
    59	  の解決に追加設定が要るか。
    60	- **Findings**:
    61	  - `[tasks.verify] alias = "gate"` で `mise run gate` が verify を実行する。
    62	  - `[tasks."check:model-ids"]` のような `:` 入りの名前で `mise run check:model-ids` が動く。
    63	  - `run = [...]` の配列は先頭から直列に実行し、**最初の失敗で止まって非 0** を返す（後続を実行しない）。
    64	  - `MISE_ENV=node27` で `mise.node27.toml` が `mise.toml` の上に合成され、node だけが上書きされる
    65	    （`mise config ls` で両ファイルが読まれ、`mise ls --current node` が `27.0.0-alpha.0.1.1`）。
    66	  - `mise ls-remote node` は `--prerelease` なしでも `27.0.0-alpha.*` を列挙する。`prereleases` は実在する
    67	    mise 設定（既定 `false`）。exact 版を指定すれば `prereleases = false` のままで解決できた。
    68	    **install（11.2）は未実行**で、実装時に確かめる。
    69	- **Evidence**: scratchpad の probe（`probe-node-mise.sh`）出力:
    70	  `mise run gate` → `[verify] $ node -v` / `v26.13.1`、失敗配列 → `exit=1`・後続の出力 0 件、
    71	  `MISE_ENV=node27 mise ls --current node` → `27.0.0-alpha.0.1.1 (missing)`、
    72	  `mise settings get prereleases` → `false`、`mise settings get no_such_setting_xyz` → `Unknown setting`。
    73	
    74	### I-4 lefthook: ツール不在時のフックの終了コード（7.7）
    75	
    76	- **Question**: mise を有効にしていない Git クライアントでフックが「省略して成功」にならないか。
    77	- **Findings**:
    78	  - lefthook 2.2.2 の生成フック（`internal/templates/hook.tmpl`）は、lefthook 本体が見つからないとき
    79	    `echo "Can't find lefthook in PATH"` で終わり、**終了コード 0（検査なしで成功）** になる。
    80	    `assert_lefthook_installed: true` のときだけ `exit 1` する。→ **7.7 には `assert_lefthook_installed: true`
    81	    が必須**。
    82	  - `lefthook install` は install 時の lefthook の絶対パス（`os.Executable()`、mise の install 先）をフックに
    83	    埋め込む。PATH に lefthook がなくても本体は起動し、ジョブ側のツール（gitleaks 等）が見つからず
    84	    失敗する。mise で lefthook を上げて旧版が消えると埋め込みパスが無効になり、PATH 探索に落ちる。
    85	  - 実測（`assert_lefthook_installed: true`、`PATH=/usr/bin:/bin`）: 埋め込みパスあり → `exit=1`
    86	    （gitleaks 不在でジョブ失敗）。埋め込みパスを無効化 → `Can't find lefthook in PATH` +
    87	    `ERROR: Operation is aborted due to lefthook settings.` → `exit=1`。
    88	  - 副作用: 探索の途中で `swift package --build-path .build/lefthook` が試され、作業ツリーに `.build/` が
    89	    できることがある（実測）。`.gitignore` に追加する。
    90	  - `LEFTHOOK=0` はフック全体を明示的に無効にする（回避手段。憲章 Additional Constraints の回避規律の対象）。
    91	  - 追加の実測（2026-11-22、plan レビュー）: 一時リポジトリで生成したフック内の lefthook の絶対パスを
    92	    存在しないパスに書き換え、`PATH=/usr/bin:/bin` で実行 → `assert_lefthook_installed: true` は exit 1
    93	    （`Can't find lefthook in PATH` + `Operation is aborted`）、`false` は exit 0。`LEFTHOOK_BIN=/nonexistent` は
    94	    フック先頭の分岐で直接実行されて 127 になり、assert の有無で差が出ない。stage されたファイルがないと
    95	    ジョブは skip され exit 0（レビュアーの実測）。lefthook 2.2.2 は `lefthook.json` を設定として読む。
    96	    → 7.7 の自動テストは「ファイルを stage」「埋め込みパスを書き換え」「assert=false の対照」で組む。
    97	- **Evidence**: `gh api repos/evilmartians/lefthook/contents/internal/templates/hook.tmpl?ref=v2.2.2`、
    98	  `docs/configuration/assert_lefthook_installed.md`（"When set to true, fail (with exit status 1) if lefthook
    99	  executable can't be found"）、scratchpad の probe 出力。
   100	
   101	### I-5 lefthook: 設定の機械可読な取得（8.3）
   102	
   103	- **Question**: テストが `lefthook.yml` の secrets ジョブの引数を、YAML パーサーを依存に足さずに取得できるか。
   104	- **Findings**: `lefthook dump --format=json`（2.2.2）は、`lefthook-local.yml` などを合成した**実際に使われる
   105	  設定**を JSON で出力する。`pre-commit.jobs[].{name,run}`、`pre-push.piped`、`pre-commit.parallel`、
   106	  `assert_lefthook_installed` を読める。→ YAML ライブラリを追加しない（憲章 原則 10）。
   107	- **Evidence**: `lefthook dump --help`（`--format string 'yaml', 'toml', or 'json'`）と、probe 設定の
   108	  `lefthook dump --format=json` 出力。
   109	
   110	### I-6 gitleaks: staged 検査・全履歴・redact（3.12、8.x）
   111	
   112	- **Question**: 一時リポジトリ（HEAD なし）で `gitleaks git --pre-commit --staged --redact` が期待どおりの
   113	  終了コードを返し、出力に値を含めないか。現在の履歴に検出はあるか。
   114	- **Findings**（gitleaks 8.30.1）:
   115	  - HEAD のない新規リポジトリで、秘密値なしのファイルだけを stage → `exit=0`。
   116	  - 実行時に組み立てた偽の GitHub PAT（`"gh" + "p_"` + 36 文字の乱数英数字）を stage → `exit=1`、
   117	    `RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件。
   118	  - 現リポジトリの全履歴 `gitleaks git --redact` → `6 commits scanned`、`no leaks found`。
   119	  - `gitleaks git` の既定は `git log -p -U0 --full-history --all --diff-filter=tuxdb`（`--log-level debug` の
   120	    `executing:` 行）で、**すべてのローカル ref（別ブランチ・stash）**を走査する。`--log-opts=HEAD` を付けると
   121	    `git log -p -U0 HEAD` になり、HEAD から到達できるコミットだけを走査する（同じく 6 commits、検出なし、
   122	    exit 0。2026-11-22 確認）。→ 3.7 の決定論のため verify の `check:secrets` は `--log-opts=HEAD` を使う
   123	    （spec Clarifications「plan レビュー後の決定」）。
   124	  - `--ignore-gitleaks-allow`（`gitleaks:allow` コメントを無視する）は 8.30.1 の `gitleaks git --help` にある。
   125	    設定の探索順は `--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`。
   126	  - mise のシムは、プロジェクトの `mise.toml` かグローバルで版が決まっていないと
   127	    `No version is set for shim: gitleaks` で失敗する。テストは verify（`mise run test`）経由で
   128	    mise 管理の PATH から gitleaks を呼ぶ前提にする。
   129	  - git はフック実行中に `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスへ渡す。pre-push の Vitest が
   130	    一時リポジトリで git を呼ぶとき、これを引き継ぐと**実リポジトリの index を操作する**おそれがある。
   131	    → テストの子プロセス環境から `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`
   132	    を設定する（plan の Error Handling に記載）。
   133	- **Evidence**: scratchpad `probe-gitleaks.sh` の出力、`gitleaks git --redact --no-banner` の出力。
   134	
   135	### I-7 Node 26: `.mjs` から `.ts` の import（`check:model-ids`）
   136	
   137	- **Question**: `scripts/check-model-ids.mjs` が、ビルドなしで `src/lib/ai/model-allowlist.ts` を import
   138	  できるか。
   139	- **Findings**: Node 26.13.1 は型ストリップが既定で有効で、`as const` / `satisfies` / 型 export だけの
   140	  `.ts` を `.mjs` から import でき、警告も出ない。`node:fs` の `globSync` も存在する。
   141	  → allowlist の値を文字列解析せず、モジュールとして読む。allowlist は消去可能な構文だけで書く
   142	  （`enum` などを使わない）。
   143	- **Evidence**: probe 出力 `{"openai":["x-model-a"],"anthropic":["x-model-b"]}` / `function` / `exit=0`。
   144	
   145	### I-8 pnpm 12: install スクリプト、release-age、audit、outdated
   146	
   147	- **Question**: 1.4・1.5・1.8・4.2〜4.5・5.3 を満たす設定と終了コード。
   148	- **Findings**（pnpm.io の docs、2026-11-22 の main）:
   149	  - `strictDepBuilds` の既定は **`true`**: `allowBuilds` に載っていない install スクリプトがあると install が
   150	    **非 0** で終わる。未記載のものは install 時に `pnpm-workspace.yaml` へプレースホルダーとして自動追記
   151	    される。→ スクリプトを持つ依存を**すべて** `allowBuilds` に `true` / `false` で列挙し、理由をコメントで
   152	    書く（1.5、1.8）。`onlyBuiltDependencies` などは v11 で削除済み。
   153	  - `minimumReleaseAge` を明示すると `minimumReleaseAgeStrict` が既定 `true` になり、24h を満たす版が
   154	    ないと解決自体が失敗する（黙って新しい版へ落ちない）。
   155	  - `pnpm audit`: advisory が audit level 以上なら `exit 1`。`--ignore-registry-errors` を付けると registry
   156	    の非 200 を成功扱いにする → **付けない**（4.4）。除外は `audit.ignore`（GHSA ID の一覧、
   157	    `pnpm-workspace.yaml`）。旧 `auditConfig.ignoreGhsas` は非推奨。
   158	  - `pnpm outdated`: **更新候補が 1 つでもあると `exit 1`**。→ outdated タスクの終了コードの意味を文書化する
   159	    （5.3 は一覧の出力だけを求める）。
   160	- **Evidence**: `pnpm/pnpm.io` の `docs/settings/build.md`（strictDepBuilds、allowBuilds）、
   161	  `docs/settings/dependency-resolution.md`（minimumReleaseAge、minimumReleaseAgeStrict）、
   162	  `docs/cli/audit.md`（exit code、`--ignore-registry-errors`、`audit.ignore`）、`docs/cli/outdated.md`。
   163	  **registry 到達不能時の実際の終了コード（4.4）と、osv-scanner の同条件は実装時に実測する**。
   164	
   165	### I-9 Biome 2.6.8: ルール名と preset
   166	
   167	- **Question**: 2.2 の 3 ルールの所属グループと、ZIP の `linter.rules.preset` が有効な書き方か。
   168	- **Findings**: `linter.rules.preset`（`recommended | all | none`、既定 `recommended`）が正式で、
   169	  `linter.rules.recommended` は非推奨。`noUnusedVariables` / `noUnusedImports` は `correctness`、
   170	  `noExplicitAny` は `suspicious` にある。→ 3 ルールを明示的に `"error"` にする（既定の重大度に依存しない）。
   171	- **Evidence**: `biomejs/biome` タグ `@biomejs/biome@2.6.8` の
   172	  `packages/@biomejs/biome/configuration_schema.json`。
   173	
   174	### I-10 Vitest 5.1.1 / Playwright 1.65.1: 0 件時の挙動とリトライ
   175	
   176	- **Question**: 3.8・3.9 を既定の挙動で満たせるか。
   177	- **Findings**:
   178	  - Vitest `passWithNoTests` の既定は `false`（テストファイルが見つからなければ失敗）。
   179	  - Playwright は `--pass-with-no-tests` を付けたときだけ 0 件で成功する（既定は失敗）。
   180	    `--fail-on-flaky-tests`、`forbidOnly`、`retries` が設定にある。
   181	  - → 既定に頼りつつ、`vitest.config.ts` に `passWithNoTests: false` を明記し、実設定を使う自己検査テストで
   182	    回帰を検出する。
   183	- **Evidence**: `vitest-dev/vitest@v5.1.1` の `docs/config/passwithnotests.md`、
   184	  `microsoft/playwright@v1.65.1` の `docs/src/test-cli-js.md`（`--pass-with-no-tests`）と
   185	  `docs/src/test-api/class-testconfig.md`。
   186	
   187	### I-11 Next.js 16.5 canary: 型生成と tsconfig
   188	
   189	- **Question**: `tsc --noEmit` を `next dev` の実行有無に左右されず決定論的にできるか。
   190	- **Findings**: `next typegen` は `.next/types` と `next-env.d.ts` を生成し、dev サーバーが動いていなければ
   191	  `.next/dev/types` を削除する。公式手順は `next typegen && tsc --noEmit`。`next-env.d.ts` は
   192	  `.gitignore` に入れる。`next dev` / `next build` は `tsconfig.json` に推奨値を書き足すことがある →
   193	  取り込み時に一度 `next dev` を起動して書き足しを受け入れ、verify 後に作業ツリーが変わらないことを
   194	  確かめる（CI でも検査する）。
   195	- **Evidence**: `vercel/next.js@v16.5.0-canary.59` の `docs/01-app/03-api-reference/06-cli/next.mdx`
   196	  （`next typegen` の節）と `docs/01-app/03-api-reference/05-config/02-typescript.mdx`（`next-env.d.ts`）。
   197	  `next@16.5.0-canary.59` の peerDependencies は `react` / `react-dom` が `^18.2.0 || ^19.0.0` で
   198	  `typescript` を含まない。
   199	
   200	### I-12 Dependabot: cooldown と pnpm 12
   201	
   202	- **Question**: 10.11・10.12 を満たす設定があるか。pnpm 12 の lockfile を扱えるか。
   203	- **Findings**: `cooldown.default-days` で公開からの待機日数を指定できる（npm と GitHub Actions で対応）。
   204	  指定しない場合も既定で 3 日の cooldown がかかるが、本リポジトリは 24h 規律を明示するため
   205	  `default-days: 1` を書く。cooldown は version updates にだけ効き、security updates には効かない。
   206	  supported ecosystems の表で pnpm は v12 まで対応（feature flag 付きの記述）。mise.toml のツールは
   207	  Dependabot の対象外 → `mise run outdated` で週次に確認する。
   208	- **Evidence**: `github/docs` の
   209	  `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`（`cooldown` 節）と
   210	  `supported-ecosystems-and-repositories.md`（pnpm 行）。
   211	
   212	### I-13 GitHub リポジトリ設定（10.2）
   213	
   214	- **Question**: verify 失敗時のマージブロックに、リポジトリ側の設定が要るか。
   215	- **Findings**: ruleset `protect-main`（id 27838452、対象 `~DEFAULT_BRANCH`）があるが `enforcement: disabled`
   216	  で、`required_status_checks` を持たない。→ 10.2 には ruleset の有効化と必須チェック `verify` の追加が
   217	  要る。リポジトリ外の設定変更なので、実装時に内容を示してユーザーの確認を得てから行う。
   218	- **Evidence**: `gh api repos/Fukuchan77/genai-lab-ts/rulesets/27838452`。
   219	
   220	### I-14 モデル ID の命名形式（6.4）
   221	
   222	- **Question**: allowlist 未登録の ID を検出するための、プロバイダごとの命名形式。
   223	- **Findings**: Web 検索のスニペットでは、OpenAI は `gpt-<数字>…`（`-sol` / `-luna` などの接尾辞を含む）と
   224	  `o<数字>…`、Google は `gemini-<数字>…`、Anthropic は `claude-<ファミリー>-<数字>…` の形式が使われている。
   225	  検索結果は版の記述が食い違っており、**具体的な ID は採用根拠にしない**。allowlist に登録する ID は、
   226	  実装時に各プロバイダの公式ドキュメント（OpenAI models、Anthropic models overview、Gemini API models、
   227	  Ollama library）で存在を確認して記録する（6.2）。
   228	- **Evidence**: WebSearch（developers.openai.com/api/docs/models、ai.google.dev/gemini-api/docs/models の
   229	  検索結果）。公式ページの本文確認は実装時。
   230	
   231	### I-15 実行 0 件の検出: Biome / Vitest / Playwright の実測（3.8、3.9、plan 検証 round 2）
   232	
   233	- **Question**: Biome 2.6.8 に `suspicious.noSkippedTests` があるか、何を検出するか。Vitest 5.1.1 と Playwright
   234	  1.65.1 で、「全部 skip / todo」の実行は何で止まるか。
   235	- **Findings**（使い捨てディレクトリで `pnpm add --save-exact`、2026-11-23 実測）:
   236	  - Biome 2.6.8: `configuration_schema.json` に `noSkippedTests` がある。`it.skip(…)`、`describe.skip(…)`、
   237	    テスト本体内の `test.skip(true, …)` を `lint/suspicious/noSkippedTests`（FIXABLE、error）で検出する。
   238	    **`it.todo(…)` と `test.info().skip(…)` は検出しない**。
   239	  - Vitest 5.1.1: `include` を絞った設定で `it.todo` だけ → **exit 0**（"1 todo"）。reporter なしでは実行 0 件を
   240	    止められない。`.ts` の custom reporter（`vitest/node` の `Reporter`、`onTestRunEnd` で `allTests()` の
   241	    `result().state` を数え、0 件なら `process.exitCode = 1`）は、`it.todo` のみ → 1、`it.skip` のみ → 1、
   242	    1 件通る → 0 だった。
   243	  - Playwright 1.65.1: `@smoke` のテストが全部 skip → reporter なしで **exit 0**。`.mjs` の custom reporter
   244	    （`onTestEnd` で `status !== "skipped"` を数え、`onEnd` で `{ status: "failed" }` を返す）で exit 1、1 件通る
   245	    → exit 0。`--grep` が一致 0 件 → `Error: No tests found`、exit 1。`--list` も同じ（一致 0 件で exit 1、
   246	    一致ありで exit 0）。**設定の reporter は `--list` でも `onTestEnd` を呼ばれず実行 0 件として exit 1 に
   247	    なる**ため、`--list` を使う検査は `--reporter=list` で上書きする（上書きすると exit 0 / 1 が一致の有無に
   248	    従う）。`--list` は `webServer` を起動しない（起動コマンドが書くファイルができなかった）。
   249	  - `.ts` の Playwright reporter の読み込みは**未実測**（`.mjs` で確認）。
   250	- **Evidence**: 使い捨てディレクトリ（コミットしない）での実行出力。Biome のルールは
   251	  `@biomejs/biome@2.6.8` の `configuration_schema.json`。公式ドキュメントでの確認は実装時（R-9）。
   252	
   253	### I-16 子プロセスのツール解決と mise タスクの形（plan 検証 round 2）
   254	
   255	- **Question**: `isolatedEnv()` の PATH とツール解決で、テストの子プロセスが起動できるか。`mise tasks ls --json` の
   256	  `run` はどんな形か。
   257	- **Findings**（2026-11-23 実測、mise 2026.11.12 / pnpm 12.22.0 / macOS）:
   258	  - `env -i PATH=/usr/bin:/bin node -v` → `No such file or directory`、exit 127。`node_modules/.bin/vitest` は
   259	    shebang のシェルスクリプトで、`pnpm` のディレクトリ + `/usr/bin:/bin` の PATH では `exec: node: not found`。
   260	    node のディレクトリを PATH に足すと起動する。`pnpm` 本体は単体のバイナリ（Mach-O）で node に依存しない。
   261	  - `git` は mise で管理しない（`[tools]` の 5 ツールに入れない）。この開発機の `git` は PATH 上の
   262	    `/opt/homebrew/bin/git`（`/usr/bin/git` もある）。mise のプロジェクト設定がない状態で `mise which git` は
   263	    exit 1。→ `resolveTool("git")` は `mise which` に頼れず、PATH から探す。
   264	  - `mise tasks ls --json`: `run = [{ task = "a" }, { task = "b" }]` → `[{"task":"a"},{"task":"b"}]`、
   265	    `run = ["mise run a", "mise run b"]` → 文字列の配列、`run = "pnpm exec vitest run"` → `["pnpm exec vitest run"]`
   266	    （単一の文字列も配列）。
   267	- **Evidence**: 使い捨てディレクトリでの実行出力。
   268	- **Implication**: plan C6 の `isolatedEnv()` は `dirname(process.execPath)` を PATH の先頭に置き、
   269	  `resolveTool` は mise 管理のツールと OS 付属の `git` を別の経路で解決する。「非 0」だけの assert は ENOENT /
   270	  127 でも通るので、`expectGateFailure` で理由を確かめる。
   271	
   272	## Existing patterns to reuse
   273	
   274	| Pattern | Location | Why reuse |
   275	|---------|----------|-----------|
   276	| ZIP の基盤ファイル | `genai-lab.zip` の `mise.toml` ほか | spec の Scope が「取り込みと §2.2 の修正」と定める |
   277	| `mise.<env>.toml` の差分構成 | ZIP の `mise.node27.toml` | I-3 で合成を確認済み。node だけを上書きできる |
   278	| Playwright `page.route` による SSE モック | ZIP の `tests/e2e/chat.smoke.spec.ts` | 段 3 で使う。段 1 は ZIP 検証（12.4）の対象として実行だけする |
   279	| 検証記録の見出し（結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順） | plan §3.3（next-agentic-stack の形式） | 11.5 が同じ見出しを求める。本文は複製しない |
   280	| Conventional Commits の type 一覧 | sdd-tdd-kit の committing-changes（plan §4） | commit-msg 検査の語彙を揃える。実装はリポジトリ内の小さなスクリプト |
   281	
   282	## External dependencies
   283	
   284	設計時点（2026-11-22）の候補。実装時に「24h を満たす版」を改めて確認し、採用版と公開日時を
   285	「実装時の記録 R-1」に書く（1.3）。
   286	
   287	| Dependency | Version（候補） | Published（UTC） | Purpose | Verified |
   288	|------------|-----------------|------------------|---------|----------|
   289	| Node.js | 26.13.1 | 2026-11-11T16:44Z | 既定レーン | mise ls-remote / GitHub release |
   290	| Node.js（alpha） | 27.0.0-alpha.0.1.1 | 2026-11-17T03:48Z | Node 27 レーン | mise ls-remote（install は実装時） |
   291	| pnpm | 12.22.0 | 2026-11-17T20:20Z | パッケージ管理 | GitHub release |
   292	| lefthook | 2.2.2 | 2026-10-13T09:20Z | Git フック | probe で install・dump・hook 実行 |
   293	| gitleaks | 8.30.1 | 2026-03-21T02:17Z | シークレットスキャン | probe で staged / 全履歴を実行 |
   294	| osv-scanner | 2.7.1 | 2026-11-09T04:15Z | OSV 脆弱性検査 | GitHub release（実行は実装時） |
   295	| next | 16.5.0-canary.59 | 2026-11-20T23:53Z | プレースホルダーページ・E2E の webServer | npm time（canary.60 は 24h 未満） |
   296	| react / react-dom | 19.3.1 | 2026-10-14 | 同上 | npm time |
   297	| typescript | 7.1.0-beta | 2026-10-20T16:45Z | 型検査（`tsc`） | npm time・`bin.tsc` |
   298	| @types/node | 26.6.6 | 2026-10-28 | Node 型 | npm time |
   299	| @types/react / @types/react-dom | 19.3.0 | 2026-09-09 | React 型 | npm time |
   300	| @biomejs/biome | 2.6.8 | 2026-11-15T14:34Z | lint / format | npm time・schema |
   301	| vitest | 5.1.1 | 2026-11-18T07:35Z | unit テスト | npm time・docs |
   302	| @playwright/test | 1.65.1 | 2026-11-13T21:12Z | E2E テスト | npm time・docs |
   303	| actions/checkout | v7.0.1 | 2026-07-20 | CI | GitHub release（SHA は実装時に解決） |
   304	| jdx/mise-action | v5.2.10 | 2026-11-18 | CI でツールを install | GitHub release（v5.3.0 は 24h 未満） |
   305	
   306	段 1 では使わないため**入れない**依存（ADR-4）: `ai`、`@ai-sdk/*`、`zod`、`@vitejs/plugin-react`、
   307	`server-only`。ZIP 検証（12.2〜12.4）の使い捨て環境でだけ入れる。
   308	
   309	## Architecture decisions
   310	
   311	### ADR-1: verify はタスクの直列チェーンにする
   312	
   313	- **Context**: ZIP の verify は `depends` による並列実行で、ネットワークが必要な security を含む。
   314	  `next typegen`（typecheck）と `next dev`（E2E）が `.next/` を同時に書く競合もある。3.6・3.7 と
   315	  Clarifications 2 問目がある。
   316	- **Decision**: `verify` は `run` 配列で `check` → `typecheck` → `check:model-ids` → `check:secrets` →
   317	  `test` → `e2e` を直列に呼ぶ。最初の失敗で止まり非 0（I-3）。`gate` は `alias`。security は別タスク。
   318	- **Alternatives**: `depends` で並列（速いが、出力が混ざり、`.next/` の競合で決定論を損なう）。
   319	  ZIP どおり security を含める（オフラインで失敗し 3.5・3.6 に反する）。
   320	- **Consequences**: 実行時間は並列より長い。所要時間は NFR として実測して記録する。
   321	
   322	### ADR-2: フックは mise タスクを呼び、staged 専用の 2 ジョブだけ素のコマンドにする
   323	
   324	- **Context**: 7.8 はフックと verify / security が同じ検査対象・判定基準を使うことを求める。8.3 はテストが
   325	  secrets ジョブの引数を `lefthook.yml` から取ることを求める。
   326	- **Decision**: `typecheck`、`check:model-ids`、`security:osv`、`security:audit`、`test`、`e2e` のジョブは
   327	  `mise run <task>` を呼ぶ。staged 専用の `gitleaks git --pre-commit --staged --redact --verbose` と
   328	  `pnpm exec biome check --staged …` だけを素のコマンドにする（gitleaks には plan レビュー後に
   329	  `--ignore-gitleaks-allow` を加えた）。設定テストが、各ジョブの参照するタスクが
   330	  `mise.toml` に実在することを確かめる。
   331	- **Alternatives**: 全ジョブに素のコマンドを書く（ZIP。verify との二重定義になり、ずれても気づけない）。
   332	- **Consequences**: フックの実行に mise が必須になる（7.7 の前提と一致。README に明記、13.4）。
   333	
   334	### ADR-3: `assert_lefthook_installed: true` を設定する
   335	
   336	- **Context**: I-4 のとおり、既定ではフックが lefthook を見つけられないと終了コード 0 で通過する。
   337	- **Decision**: `lefthook.yml` の先頭に `assert_lefthook_installed: true`。設定テストでこの値を検査し、
   338	  最小の PATH でフックが非 0 になることを自動テストで確かめる。
   339	- **Alternatives**: `.githooks/` の自前スクリプト（D4 に反する）。README の注意だけ（7.7 を満たさない）。
   340	- **Consequences**: lefthook を消した環境では commit / push ができない。回避は `--no-verify` / `LEFTHOOK=0`
   341	  で、憲章の回避規律（環境要因の証明と PR 本文への記録）に従う。
   342	
   343	### ADR-4: package.json には段 1 のコードが使う依存だけを入れる
   344	
   345	- **Context**: Clarifications 1 問目で、ZIP のアプリコードは取り込まない。ZIP の package.json は AI SDK、
   346	  プロバイダ 4 種、Zod、`@vitejs/plugin-react` を含む。
   347	- **Decision**: dependencies は `next`、`react`、`react-dom`。devDependencies は `@biomejs/biome`、
   348	  `@playwright/test`、`@types/node`、`@types/react`、`@types/react-dom`、`typescript`、`vitest`。
   349	  AI SDK・プロバイダ・Zod・`server-only` は、最初に import する段（002 以降）の plan で宣言して入れる。
   350	  ZIP の全依存は使い捨て環境（ADR-9）でだけ入れ、その版と結果を各段へ引き継ぐ。
   351	- **Alternatives**: ZIP の依存をすべて今入れる（使わない依存が audit の対象と攻撃面を増やし、実際に使う段の
   352	  時点では pin が古くなる。plan §2.1 の「現時点の採用版」の考え方に合わない）。
   353	- **Consequences**: plan §2 の技術スタック表の AI 行は段 002 以降で満たされる。plan §8.5 の改訂注記
   354	  （13.10）にこの扱いを書く。**設計承認時に確認してほしい判断**。
   355	
   356	### ADR-5: 未モック通信の遮断は依存を足さずに実装する
   357	
   358	- **Context**: 3.10・3.11・9.5。MSW などは新しい依存になる（原則 10）。HTTP クライアントだけを差し替えると、
   359	  `node:net` を直接使う経路が漏れる。
   360	- **Decision**:
   361	  - unit: Vitest の `setupFiles`（`tests/unit/setup/network-guard.ts`）で `net.Socket.prototype.connect` と
   362	    `globalThis.fetch` を置き換え、呼ばれたら `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で
   363	    違反があればそのテストを失敗させる（呼び出し側が例外を握りつぶしても失敗する）。
   364	  - E2E: `tests/e2e/fixtures.ts` の auto fixture が `context.route("**/*")` で全リクエストを受け、
   365	    テスト対象のオリジン以外を `abort` して記録し、teardown で違反があれば失敗させる。テスト個別の
   366	    `page.route` のモックは context の route より優先されるので、モック済みの通信は fixture に届かない。
   367	    E2E は `@playwright/test` ではなく `fixtures.ts` から `test` を import する（Biome の
   368	    `noRestrictedImports` で強制）。
   369	- **Alternatives**: MSW の `onUnhandledRequest: "error"`（依存追加、`net` 直叩きを捕まえない）。
   370	  Playwright の `--offline` 相当の context 設定（同一オリジンの dev サーバーまで止まる）。
   371	- **Consequences**: unit テストはローカルホストを含む全ソケット接続を禁止する。将来ソケットが必要な段は、
   372	  その段の plan で例外の仕組みを宣言する。
   373	
   374	### ADR-6: `check:model-ids` は git の追跡対象＋未追跡（ignore 以外）を走査する
   375	
   376	- **Context**: 6.3〜6.7。開発者は `.env.local` に実際のモデル ID を書く（gitignore 済み）。単純なファイル
   377	  走査だと、それを検出してローカルで失敗し、`node_modules` も辿る。
   378	- **Decision**: `git -C <root> ls-files --cached --others --exclude-standard` で候補を列挙し、走査対象の
   379	  規則（6.5）と除外（allowlist ファイル、`tests/fixtures/**`）で絞る。検出は「allowlist の全 ID」＋
   380	  「プロバイダ命名形式の正規表現」。allowlist は Node の型ストリップで import する（I-7）。
   381	- **Alternatives**: `fs.globSync` での走査（ignore 済みの秘密ファイルまで読む）。allowlist を正規表現で
   382	  文字列解析（書式の変更で壊れる）。
   383	- **Consequences**: git が必要（全環境にある）。テストは一時ディレクトリを `git init` して入力を置く。
   384	
   385	### ADR-7: CI は verify と verify-node27 を別ジョブにする
   386	
   387	- **Context**: 10.1〜10.4。ZIP の matrix だと必須チェック名が `verify ()` になり、ruleset で指定しにくい。
   388	  週次 schedule は Node 27 レーンだけに要る。
   389	- **Decision**: `verify`（既定レーン、verify + security、必須）と `verify-node27`（`MISE_ENV=node27`、
   390	  verify のみ、`continue-on-error: true`）を別ジョブにする。`verify` は `schedule` では動かさない。
   391	  日次の security は別ワークフロー `security-daily.yml`。
   392	- **Alternatives**: matrix（チェック名が不安定、`continue-on-error` の式が読みにくい）。
   393	- **Consequences**: ステップが 2 ジョブで重複する。重複は 6 ステップ程度で、composite action は作らない。
   394	
   395	### ADR-8: commit-msg はリポジトリ内のスクリプトで検査する
   396	
   397	- **Context**: 7.4。commitlint は依存が多い（原則 10）。
   398	- **Decision**: `scripts/check-commit-msg.mjs <msg-file>` が 1 行目を Conventional Commits の正規表現で
   399	  検査する。git が生成する `Merge …` / `Revert "…"` と `fixup!` / `squash!` / `amend!` は通す。
   400	- **Alternatives**: `@commitlint/cli` + `@commitlint/config-conventional`。
   401	- **Consequences**: 規則の範囲は 1 行目の形式に限る（本文・フッターの書式は検査しない）。
   402	
   403	### ADR-9: ZIP のアプリコードは使い捨て環境で検証する
   404	
   405	- **Context**: Requirement 12。ZIP のアプリコードは `src/` / `tests/` に入れない（12.7）。
   406	- **Decision**: リポジトリ外の一時ディレクトリに ZIP を展開し、`package.json` の dist-tag と範囲を
   407	  24h を満たす exact 版に置き換えて install し、`tsc --noEmit`、型定義の API 名の照合、unit テスト、
   408	  E2E smoke を実行する。結果は「実装時の記録 R-6」に、ファイルごと・API ごとに書く。使い捨て環境の
   409	  成果物はコミットしない。
   410	- **Alternatives**: リポジトリ内の一時ブランチ（ZIP のコードが履歴に残り、12.7 の趣旨に反する）。
   411	- **Consequences**: 手順は再現手順として記録し、段 003〜006 の spec が参照する。
   412	
   413	## Risks & open questions
   414	
   415	- ⚠️ Next.js canary はほぼ毎日出る。canary の変更で `next typegen` や `next dev` の挙動が変わりうる —
   416	  mitigation: exact pin、週次の `mise run outdated`、CI の「verify 後に作業ツリーが変わらない」検査。
   417	- ⚠️ TypeScript 7.1 beta（Go ネイティブ）は Next.js の tsconfig 書き足しや language service plugin
   418	  （`plugins: [{ "name": "next" }]`）を解釈しない可能性がある — mitigation: `tsc --noEmit` が通ることを
   419	  実装時に確認し、効かない設定は理由を記録して外す。
   420	- ⚠️ `net.Socket.prototype.connect` の置き換えが Vitest のワーカー通信を妨げる可能性 — mitigation:
   421	  実装時に `pool` の既定で確認する。妨げる場合は置き換えをテスト本体の実行時だけに限る。
   422	- ✅ （plan レビューで解消）E2E ガードの自己検査は `test.fail()` を使わず、`failOnBlockedRequest: false` と
   423	  `blockedRequests` の assert で行う（`test.fail()` は失敗の原因を区別しないため）。teardown で失敗する経路は
   424	  R-10 に記録する。
   425	- ✅ （round 2 で解消）`playwright test --list` は 0 件で exit 1、webServer を起動しない（I-15）。ただし
   426	  設定の reporter が `--list` でも実行 0 件として失敗するので、`--reporter=list` で上書きして使う。
   427	- ⚠️ Node 27 alpha の install（11.2）と、Node 27 で Next canary / TS 7.1 beta が動くか — mitigation:
   428	  失敗でも記録すれば完了条件を満たす（11.3、11.6）。
   429	- ⚠️ ruleset の変更（10.2）はリポジトリ外の設定 — mitigation: 実装時に差分を示して確認を取る。
   430	- ✅ （round 2 で解消）Vitest 5.1.1 の custom reporter は `onTestRunEnd` で `process.exitCode = 1` にして実行全体を
   431	  非 0 にできる。Playwright の reporter `onEnd` は `{ status: "failed" }` を返すと exit 1 になる（I-15。
   432	  Playwright の `.ts` reporter の読み込みだけ未実測で、実装時に R-9 で確かめる）。
   433	- ❓ 入れ子の Playwright 実行（`webServer` なし）で、`page.setContent` から出る外部要求を `context.route` が
   434	  捕まえるか — to resolve in: 実装（R-9。成り立たない場合の代替は plan C12 に記載）。
   435	- ❓ allowlist に登録する具体的なモデル ID — to resolve in: 実装（6.2、公式ドキュメントで確認）。
   436	- ❓ `pnpm audit` / osv-scanner の registry 到達不能時の終了コード（4.4） — to resolve in: 実装
   437	  （プロキシを到達不能なポートに向けて実測）。
   438	- ❓ install スクリプトを持つ依存の一覧（`allowBuilds` の中身） — to resolve in: 実装（`pnpm install` の
   439	  `Ignored build scripts` 出力）。
   440	
   441	## 実装時の記録（/sdd-impl で追記）
   442	
   443	各記録は、実行したコマンド、結果、根拠（公式ドキュメントの参照先と実行出力）、確認日を持つ。
   444	
   445	- **R-1 採用版と公開日時**（1.1〜1.3、1.6、1.7）: 採用した全依存・ツール・Actions の版、公開日時、確認日。
   446	- **R-2 install と peer 警告**（1.8、1.9、plan §8 の 3 項目目）: `pnpm install --frozen-lockfile` の終了コード、
   447	  peer 警告の全文と扱い、`allowBuilds` の各項目と理由。
   448	- **R-3 オフラインと決定論**（3.5、3.7）: ネットワーク切断・API キー未設定での `mise run verify` の結果、
   449	  3 回連続実行の合否、verify 後の `git status --porcelain`。
   450	- **R-4 security の失敗系**（4.2〜4.4）: registry 到達不能時の `pnpm audit` / osv-scanner の終了コード。
   451	- **R-5 モデル ID の根拠**（6.2）: 登録した ID ごとの公式ドキュメントの URL と確認日。
   452	- **R-6 ZIP 検証**（12.1〜12.4、plan §8 の 5 項目）: 使い捨て環境の再現手順、ファイルごとの型エラー、
   453	  AI SDK 7 の API 名の有無、SSE モックの解釈結果、引き継ぎ先の段。
   454	- **R-7 TypeScript 7.1 の公開状況**（12.5、12.6）: 確認日、RC / stable の有無と公開日時、採用した版。
   455	- **R-8 Node 27 レーン**（11.2、11.3）: `MISE_ENV=node27 mise install` の出力と必要だった設定。
   456	- **R-9 ゲートの違反時の動作**（9.6）: 3.8・3.9・3.11 の違反状態と、verify の該当構成要素の終了コード。
   457	- **R-10 非空虚の確認**（9.7）: 受け入れテストごとに、壊した対象、壊し方、失敗したことの出力。
   458	- **R-11 実行時間**（NFR）: pre-commit 全体、pre-push 全体、E2E `@smoke`、verify 全体（開発機と CI）。

**Researching sections**

I need to focus on the necessary sections for the mid-matter. It looks like I should reference I-16, which mentions the items previously noted. To organize everything clearly, I think I could use grep to pull out the heading lines. This should help in ensuring I have a structured approach to the information I'm gathering. I want to make sure that everything is well organized and easily accessible for reference.
exec
/bin/zsh -lc "grep -n '"'^### '"\\|"'^## '"' specs/001-dev-environment-and-gates/research.md" in /Users/Shared/codes/genai-lab-ts
 succeeded in 71ms:
12:## Discovery type
16:## Investigations
18:### I-1 ZIP 足場の構成と、spec 001 で取り込む範囲
40:### I-2 採用候補の版と公開日時（24h ゲート）
56:### I-3 mise: タスク、別名、環境ファイル、prerelease
74:### I-4 lefthook: ツール不在時のフックの終了コード（7.7）
101:### I-5 lefthook: 設定の機械可読な取得（8.3）
110:### I-6 gitleaks: staged 検査・全履歴・redact（3.12、8.x）
135:### I-7 Node 26: `.mjs` から `.ts` の import（`check:model-ids`）
145:### I-8 pnpm 12: install スクリプト、release-age、audit、outdated
165:### I-9 Biome 2.6.8: ルール名と preset
174:### I-10 Vitest 5.1.1 / Playwright 1.65.1: 0 件時の挙動とリトライ
187:### I-11 Next.js 16.5 canary: 型生成と tsconfig
200:### I-12 Dependabot: cooldown と pnpm 12
212:### I-13 GitHub リポジトリ設定（10.2）
220:### I-14 モデル ID の命名形式（6.4）
231:### I-15 実行 0 件の検出: Biome / Vitest / Playwright の実測（3.8、3.9、plan 検証 round 2）
253:### I-16 子プロセスのツール解決と mise タスクの形（plan 検証 round 2）
272:## Existing patterns to reuse
282:## External dependencies
309:## Architecture decisions
311:### ADR-1: verify はタスクの直列チェーンにする
322:### ADR-2: フックは mise タスクを呼び、staged 専用の 2 ジョブだけ素のコマンドにする
334:### ADR-3: `assert_lefthook_installed: true` を設定する
343:### ADR-4: package.json には段 1 のコードが使う依存だけを入れる
356:### ADR-5: 未モック通信の遮断は依存を足さずに実装する
374:### ADR-6: `check:model-ids` は git の追跡対象＋未追跡（ignore 以外）を走査する
385:### ADR-7: CI は verify と verify-node27 を別ジョブにする
395:### ADR-8: commit-msg はリポジトリ内のスクリプトで検査する
403:### ADR-9: ZIP のアプリコードは使い捨て環境で検証する
413:## Risks & open questions
441:## 実装時の記録（/sdd-impl で追記）

exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/research.md | sed -n '56,271p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
    56	### I-3 mise: タスク、別名、環境ファイル、prerelease
    57	
    58	- **Question**: verify の直列化、`gate` 別名、`:` を含むタスク名、`MISE_ENV=node27` の合成、Node 27 alpha
    59	  の解決に追加設定が要るか。
    60	- **Findings**:
    61	  - `[tasks.verify] alias = "gate"` で `mise run gate` が verify を実行する。
    62	  - `[tasks."check:model-ids"]` のような `:` 入りの名前で `mise run check:model-ids` が動く。
    63	  - `run = [...]` の配列は先頭から直列に実行し、**最初の失敗で止まって非 0** を返す（後続を実行しない）。
    64	  - `MISE_ENV=node27` で `mise.node27.toml` が `mise.toml` の上に合成され、node だけが上書きされる
    65	    （`mise config ls` で両ファイルが読まれ、`mise ls --current node` が `27.0.0-alpha.0.1.1`）。
    66	  - `mise ls-remote node` は `--prerelease` なしでも `27.0.0-alpha.*` を列挙する。`prereleases` は実在する
    67	    mise 設定（既定 `false`）。exact 版を指定すれば `prereleases = false` のままで解決できた。
    68	    **install（11.2）は未実行**で、実装時に確かめる。
    69	- **Evidence**: scratchpad の probe（`probe-node-mise.sh`）出力:
    70	  `mise run gate` → `[verify] $ node -v` / `v26.13.1`、失敗配列 → `exit=1`・後続の出力 0 件、
    71	  `MISE_ENV=node27 mise ls --current node` → `27.0.0-alpha.0.1.1 (missing)`、
    72	  `mise settings get prereleases` → `false`、`mise settings get no_such_setting_xyz` → `Unknown setting`。
    73	
    74	### I-4 lefthook: ツール不在時のフックの終了コード（7.7）
    75	
    76	- **Question**: mise を有効にしていない Git クライアントでフックが「省略して成功」にならないか。
    77	- **Findings**:
    78	  - lefthook 2.2.2 の生成フック（`internal/templates/hook.tmpl`）は、lefthook 本体が見つからないとき
    79	    `echo "Can't find lefthook in PATH"` で終わり、**終了コード 0（検査なしで成功）** になる。
    80	    `assert_lefthook_installed: true` のときだけ `exit 1` する。→ **7.7 には `assert_lefthook_installed: true`
    81	    が必須**。
    82	  - `lefthook install` は install 時の lefthook の絶対パス（`os.Executable()`、mise の install 先）をフックに
    83	    埋め込む。PATH に lefthook がなくても本体は起動し、ジョブ側のツール（gitleaks 等）が見つからず
    84	    失敗する。mise で lefthook を上げて旧版が消えると埋め込みパスが無効になり、PATH 探索に落ちる。
    85	  - 実測（`assert_lefthook_installed: true`、`PATH=/usr/bin:/bin`）: 埋め込みパスあり → `exit=1`
    86	    （gitleaks 不在でジョブ失敗）。埋め込みパスを無効化 → `Can't find lefthook in PATH` +
    87	    `ERROR: Operation is aborted due to lefthook settings.` → `exit=1`。
    88	  - 副作用: 探索の途中で `swift package --build-path .build/lefthook` が試され、作業ツリーに `.build/` が
    89	    できることがある（実測）。`.gitignore` に追加する。
    90	  - `LEFTHOOK=0` はフック全体を明示的に無効にする（回避手段。憲章 Additional Constraints の回避規律の対象）。
    91	  - 追加の実測（2026-11-22、plan レビュー）: 一時リポジトリで生成したフック内の lefthook の絶対パスを
    92	    存在しないパスに書き換え、`PATH=/usr/bin:/bin` で実行 → `assert_lefthook_installed: true` は exit 1
    93	    （`Can't find lefthook in PATH` + `Operation is aborted`）、`false` は exit 0。`LEFTHOOK_BIN=/nonexistent` は
    94	    フック先頭の分岐で直接実行されて 127 になり、assert の有無で差が出ない。stage されたファイルがないと
    95	    ジョブは skip され exit 0（レビュアーの実測）。lefthook 2.2.2 は `lefthook.json` を設定として読む。
    96	    → 7.7 の自動テストは「ファイルを stage」「埋め込みパスを書き換え」「assert=false の対照」で組む。
    97	- **Evidence**: `gh api repos/evilmartians/lefthook/contents/internal/templates/hook.tmpl?ref=v2.2.2`、
    98	  `docs/configuration/assert_lefthook_installed.md`（"When set to true, fail (with exit status 1) if lefthook
    99	  executable can't be found"）、scratchpad の probe 出力。
   100	
   101	### I-5 lefthook: 設定の機械可読な取得（8.3）
   102	
   103	- **Question**: テストが `lefthook.yml` の secrets ジョブの引数を、YAML パーサーを依存に足さずに取得できるか。
   104	- **Findings**: `lefthook dump --format=json`（2.2.2）は、`lefthook-local.yml` などを合成した**実際に使われる
   105	  設定**を JSON で出力する。`pre-commit.jobs[].{name,run}`、`pre-push.piped`、`pre-commit.parallel`、
   106	  `assert_lefthook_installed` を読める。→ YAML ライブラリを追加しない（憲章 原則 10）。
   107	- **Evidence**: `lefthook dump --help`（`--format string 'yaml', 'toml', or 'json'`）と、probe 設定の
   108	  `lefthook dump --format=json` 出力。
   109	
   110	### I-6 gitleaks: staged 検査・全履歴・redact（3.12、8.x）
   111	
   112	- **Question**: 一時リポジトリ（HEAD なし）で `gitleaks git --pre-commit --staged --redact` が期待どおりの
   113	  終了コードを返し、出力に値を含めないか。現在の履歴に検出はあるか。
   114	- **Findings**（gitleaks 8.30.1）:
   115	  - HEAD のない新規リポジトリで、秘密値なしのファイルだけを stage → `exit=0`。
   116	  - 実行時に組み立てた偽の GitHub PAT（`"gh" + "p_"` + 36 文字の乱数英数字）を stage → `exit=1`、
   117	    `RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件。
   118	  - 現リポジトリの全履歴 `gitleaks git --redact` → `6 commits scanned`、`no leaks found`。
   119	  - `gitleaks git` の既定は `git log -p -U0 --full-history --all --diff-filter=tuxdb`（`--log-level debug` の
   120	    `executing:` 行）で、**すべてのローカル ref（別ブランチ・stash）**を走査する。`--log-opts=HEAD` を付けると
   121	    `git log -p -U0 HEAD` になり、HEAD から到達できるコミットだけを走査する（同じく 6 commits、検出なし、
   122	    exit 0。2026-11-22 確認）。→ 3.7 の決定論のため verify の `check:secrets` は `--log-opts=HEAD` を使う
   123	    （spec Clarifications「plan レビュー後の決定」）。
   124	  - `--ignore-gitleaks-allow`（`gitleaks:allow` コメントを無視する）は 8.30.1 の `gitleaks git --help` にある。
   125	    設定の探索順は `--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`。
   126	  - mise のシムは、プロジェクトの `mise.toml` かグローバルで版が決まっていないと
   127	    `No version is set for shim: gitleaks` で失敗する。テストは verify（`mise run test`）経由で
   128	    mise 管理の PATH から gitleaks を呼ぶ前提にする。
   129	  - git はフック実行中に `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスへ渡す。pre-push の Vitest が
   130	    一時リポジトリで git を呼ぶとき、これを引き継ぐと**実リポジトリの index を操作する**おそれがある。
   131	    → テストの子プロセス環境から `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`
   132	    を設定する（plan の Error Handling に記載）。
   133	- **Evidence**: scratchpad `probe-gitleaks.sh` の出力、`gitleaks git --redact --no-banner` の出力。
   134	
   135	### I-7 Node 26: `.mjs` から `.ts` の import（`check:model-ids`）
   136	
   137	- **Question**: `scripts/check-model-ids.mjs` が、ビルドなしで `src/lib/ai/model-allowlist.ts` を import
   138	  できるか。
   139	- **Findings**: Node 26.13.1 は型ストリップが既定で有効で、`as const` / `satisfies` / 型 export だけの
   140	  `.ts` を `.mjs` から import でき、警告も出ない。`node:fs` の `globSync` も存在する。
   141	  → allowlist の値を文字列解析せず、モジュールとして読む。allowlist は消去可能な構文だけで書く
   142	  （`enum` などを使わない）。
   143	- **Evidence**: probe 出力 `{"openai":["x-model-a"],"anthropic":["x-model-b"]}` / `function` / `exit=0`。
   144	
   145	### I-8 pnpm 12: install スクリプト、release-age、audit、outdated
   146	
   147	- **Question**: 1.4・1.5・1.8・4.2〜4.5・5.3 を満たす設定と終了コード。
   148	- **Findings**（pnpm.io の docs、2026-11-22 の main）:
   149	  - `strictDepBuilds` の既定は **`true`**: `allowBuilds` に載っていない install スクリプトがあると install が
   150	    **非 0** で終わる。未記載のものは install 時に `pnpm-workspace.yaml` へプレースホルダーとして自動追記
   151	    される。→ スクリプトを持つ依存を**すべて** `allowBuilds` に `true` / `false` で列挙し、理由をコメントで
   152	    書く（1.5、1.8）。`onlyBuiltDependencies` などは v11 で削除済み。
   153	  - `minimumReleaseAge` を明示すると `minimumReleaseAgeStrict` が既定 `true` になり、24h を満たす版が
   154	    ないと解決自体が失敗する（黙って新しい版へ落ちない）。
   155	  - `pnpm audit`: advisory が audit level 以上なら `exit 1`。`--ignore-registry-errors` を付けると registry
   156	    の非 200 を成功扱いにする → **付けない**（4.4）。除外は `audit.ignore`（GHSA ID の一覧、
   157	    `pnpm-workspace.yaml`）。旧 `auditConfig.ignoreGhsas` は非推奨。
   158	  - `pnpm outdated`: **更新候補が 1 つでもあると `exit 1`**。→ outdated タスクの終了コードの意味を文書化する
   159	    （5.3 は一覧の出力だけを求める）。
   160	- **Evidence**: `pnpm/pnpm.io` の `docs/settings/build.md`（strictDepBuilds、allowBuilds）、
   161	  `docs/settings/dependency-resolution.md`（minimumReleaseAge、minimumReleaseAgeStrict）、
   162	  `docs/cli/audit.md`（exit code、`--ignore-registry-errors`、`audit.ignore`）、`docs/cli/outdated.md`。
   163	  **registry 到達不能時の実際の終了コード（4.4）と、osv-scanner の同条件は実装時に実測する**。
   164	
   165	### I-9 Biome 2.6.8: ルール名と preset
   166	
   167	- **Question**: 2.2 の 3 ルールの所属グループと、ZIP の `linter.rules.preset` が有効な書き方か。
   168	- **Findings**: `linter.rules.preset`（`recommended | all | none`、既定 `recommended`）が正式で、
   169	  `linter.rules.recommended` は非推奨。`noUnusedVariables` / `noUnusedImports` は `correctness`、
   170	  `noExplicitAny` は `suspicious` にある。→ 3 ルールを明示的に `"error"` にする（既定の重大度に依存しない）。
   171	- **Evidence**: `biomejs/biome` タグ `@biomejs/biome@2.6.8` の
   172	  `packages/@biomejs/biome/configuration_schema.json`。
   173	
   174	### I-10 Vitest 5.1.1 / Playwright 1.65.1: 0 件時の挙動とリトライ
   175	
   176	- **Question**: 3.8・3.9 を既定の挙動で満たせるか。
   177	- **Findings**:
   178	  - Vitest `passWithNoTests` の既定は `false`（テストファイルが見つからなければ失敗）。
   179	  - Playwright は `--pass-with-no-tests` を付けたときだけ 0 件で成功する（既定は失敗）。
   180	    `--fail-on-flaky-tests`、`forbidOnly`、`retries` が設定にある。
   181	  - → 既定に頼りつつ、`vitest.config.ts` に `passWithNoTests: false` を明記し、実設定を使う自己検査テストで
   182	    回帰を検出する。
   183	- **Evidence**: `vitest-dev/vitest@v5.1.1` の `docs/config/passwithnotests.md`、
   184	  `microsoft/playwright@v1.65.1` の `docs/src/test-cli-js.md`（`--pass-with-no-tests`）と
   185	  `docs/src/test-api/class-testconfig.md`。
   186	
   187	### I-11 Next.js 16.5 canary: 型生成と tsconfig
   188	
   189	- **Question**: `tsc --noEmit` を `next dev` の実行有無に左右されず決定論的にできるか。
   190	- **Findings**: `next typegen` は `.next/types` と `next-env.d.ts` を生成し、dev サーバーが動いていなければ
   191	  `.next/dev/types` を削除する。公式手順は `next typegen && tsc --noEmit`。`next-env.d.ts` は
   192	  `.gitignore` に入れる。`next dev` / `next build` は `tsconfig.json` に推奨値を書き足すことがある →
   193	  取り込み時に一度 `next dev` を起動して書き足しを受け入れ、verify 後に作業ツリーが変わらないことを
   194	  確かめる（CI でも検査する）。
   195	- **Evidence**: `vercel/next.js@v16.5.0-canary.59` の `docs/01-app/03-api-reference/06-cli/next.mdx`
   196	  （`next typegen` の節）と `docs/01-app/03-api-reference/05-config/02-typescript.mdx`（`next-env.d.ts`）。
   197	  `next@16.5.0-canary.59` の peerDependencies は `react` / `react-dom` が `^18.2.0 || ^19.0.0` で
   198	  `typescript` を含まない。
   199	
   200	### I-12 Dependabot: cooldown と pnpm 12
   201	
   202	- **Question**: 10.11・10.12 を満たす設定があるか。pnpm 12 の lockfile を扱えるか。
   203	- **Findings**: `cooldown.default-days` で公開からの待機日数を指定できる（npm と GitHub Actions で対応）。
   204	  指定しない場合も既定で 3 日の cooldown がかかるが、本リポジトリは 24h 規律を明示するため
   205	  `default-days: 1` を書く。cooldown は version updates にだけ効き、security updates には効かない。
   206	  supported ecosystems の表で pnpm は v12 まで対応（feature flag 付きの記述）。mise.toml のツールは
   207	  Dependabot の対象外 → `mise run outdated` で週次に確認する。
   208	- **Evidence**: `github/docs` の
   209	  `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`（`cooldown` 節）と
   210	  `supported-ecosystems-and-repositories.md`（pnpm 行）。
   211	
   212	### I-13 GitHub リポジトリ設定（10.2）
   213	
   214	- **Question**: verify 失敗時のマージブロックに、リポジトリ側の設定が要るか。
   215	- **Findings**: ruleset `protect-main`（id 27838452、対象 `~DEFAULT_BRANCH`）があるが `enforcement: disabled`
   216	  で、`required_status_checks` を持たない。→ 10.2 には ruleset の有効化と必須チェック `verify` の追加が
   217	  要る。リポジトリ外の設定変更なので、実装時に内容を示してユーザーの確認を得てから行う。
   218	- **Evidence**: `gh api repos/Fukuchan77/genai-lab-ts/rulesets/27838452`。
   219	
   220	### I-14 モデル ID の命名形式（6.4）
   221	
   222	- **Question**: allowlist 未登録の ID を検出するための、プロバイダごとの命名形式。
   223	- **Findings**: Web 検索のスニペットでは、OpenAI は `gpt-<数字>…`（`-sol` / `-luna` などの接尾辞を含む）と
   224	  `o<数字>…`、Google は `gemini-<数字>…`、Anthropic は `claude-<ファミリー>-<数字>…` の形式が使われている。
   225	  検索結果は版の記述が食い違っており、**具体的な ID は採用根拠にしない**。allowlist に登録する ID は、
   226	  実装時に各プロバイダの公式ドキュメント（OpenAI models、Anthropic models overview、Gemini API models、
   227	  Ollama library）で存在を確認して記録する（6.2）。
   228	- **Evidence**: WebSearch（developers.openai.com/api/docs/models、ai.google.dev/gemini-api/docs/models の
   229	  検索結果）。公式ページの本文確認は実装時。
   230	
   231	### I-15 実行 0 件の検出: Biome / Vitest / Playwright の実測（3.8、3.9、plan 検証 round 2）
   232	
   233	- **Question**: Biome 2.6.8 に `suspicious.noSkippedTests` があるか、何を検出するか。Vitest 5.1.1 と Playwright
   234	  1.65.1 で、「全部 skip / todo」の実行は何で止まるか。
   235	- **Findings**（使い捨てディレクトリで `pnpm add --save-exact`、2026-11-23 実測）:
   236	  - Biome 2.6.8: `configuration_schema.json` に `noSkippedTests` がある。`it.skip(…)`、`describe.skip(…)`、
   237	    テスト本体内の `test.skip(true, …)` を `lint/suspicious/noSkippedTests`（FIXABLE、error）で検出する。
   238	    **`it.todo(…)` と `test.info().skip(…)` は検出しない**。
   239	  - Vitest 5.1.1: `include` を絞った設定で `it.todo` だけ → **exit 0**（"1 todo"）。reporter なしでは実行 0 件を
   240	    止められない。`.ts` の custom reporter（`vitest/node` の `Reporter`、`onTestRunEnd` で `allTests()` の
   241	    `result().state` を数え、0 件なら `process.exitCode = 1`）は、`it.todo` のみ → 1、`it.skip` のみ → 1、
   242	    1 件通る → 0 だった。
   243	  - Playwright 1.65.1: `@smoke` のテストが全部 skip → reporter なしで **exit 0**。`.mjs` の custom reporter
   244	    （`onTestEnd` で `status !== "skipped"` を数え、`onEnd` で `{ status: "failed" }` を返す）で exit 1、1 件通る
   245	    → exit 0。`--grep` が一致 0 件 → `Error: No tests found`、exit 1。`--list` も同じ（一致 0 件で exit 1、
   246	    一致ありで exit 0）。**設定の reporter は `--list` でも `onTestEnd` を呼ばれず実行 0 件として exit 1 に
   247	    なる**ため、`--list` を使う検査は `--reporter=list` で上書きする（上書きすると exit 0 / 1 が一致の有無に
   248	    従う）。`--list` は `webServer` を起動しない（起動コマンドが書くファイルができなかった）。
   249	  - `.ts` の Playwright reporter の読み込みは**未実測**（`.mjs` で確認）。
   250	- **Evidence**: 使い捨てディレクトリ（コミットしない）での実行出力。Biome のルールは
   251	  `@biomejs/biome@2.6.8` の `configuration_schema.json`。公式ドキュメントでの確認は実装時（R-9）。
   252	
   253	### I-16 子プロセスのツール解決と mise タスクの形（plan 検証 round 2）
   254	
   255	- **Question**: `isolatedEnv()` の PATH とツール解決で、テストの子プロセスが起動できるか。`mise tasks ls --json` の
   256	  `run` はどんな形か。
   257	- **Findings**（2026-11-23 実測、mise 2026.11.12 / pnpm 12.22.0 / macOS）:
   258	  - `env -i PATH=/usr/bin:/bin node -v` → `No such file or directory`、exit 127。`node_modules/.bin/vitest` は
   259	    shebang のシェルスクリプトで、`pnpm` のディレクトリ + `/usr/bin:/bin` の PATH では `exec: node: not found`。
   260	    node のディレクトリを PATH に足すと起動する。`pnpm` 本体は単体のバイナリ（Mach-O）で node に依存しない。
   261	  - `git` は mise で管理しない（`[tools]` の 5 ツールに入れない）。この開発機の `git` は PATH 上の
   262	    `/opt/homebrew/bin/git`（`/usr/bin/git` もある）。mise のプロジェクト設定がない状態で `mise which git` は
   263	    exit 1。→ `resolveTool("git")` は `mise which` に頼れず、PATH から探す。
   264	  - `mise tasks ls --json`: `run = [{ task = "a" }, { task = "b" }]` → `[{"task":"a"},{"task":"b"}]`、
   265	    `run = ["mise run a", "mise run b"]` → 文字列の配列、`run = "pnpm exec vitest run"` → `["pnpm exec vitest run"]`
   266	    （単一の文字列も配列）。
   267	- **Evidence**: 使い捨てディレクトリでの実行出力。
   268	- **Implication**: plan C6 の `isolatedEnv()` は `dirname(process.execPath)` を PATH の先頭に置き、
   269	  `resolveTool` は mise 管理のツールと OS 付属の `git` を別の経路で解決する。「非 0」だけの assert は ENOENT /
   270	  127 でも通るので、`expectGateFailure` で理由を確かめる。
   271	

**Organizing compliance docs**

I see that I need the I5-I14 documents, perhaps they're crucial but it seems like I can manage without them for now. My priority is to gather the compliance documentation starting with the constitution, followed by the technical structure and then the reviews. I should probably read the constitution in full since it’s about 300 pages. That doesn't sound tedious at all, right? I'll tackle this one step at a time!
exec
/bin/zsh -lc 'nl -ba .sdd/memory/constitution.md' in /Users/Shared/codes/genai-lab-ts
 succeeded in 60ms:
     1	<!--
     2	SYNC IMPACT REPORT
     3	Version Change: N/A → 1.0.0（初版制定）
     4	Modified Principles:
     5	  - none（初版）
     6	Added Sections:
     7	  - Core Principles（原則 1〜11）
     8	  - Additional Constraints
     9	  - Governance
    10	  - 改訂履歴 / 未決事項
    11	Removed Sections:
    12	  - none
    13	Templates Status:
    14	  ✅ ~/.claude/sdd/templates/specs/plan.md - Constitution Compliance 節があり、変更不要
    15	  ✅ ~/.claude/sdd/templates/specs/spec.md, tasks.md - 確認のみ、変更不要
    16	  ✅ README.md - 本憲章へのリンクを追加
    17	  ⚠️ AGENTS.md - 未作成。spec 001 の /sdd-steering で作成し、原則の要約と `mise run verify` を載せる
    18	  ⚠️ specs/000-development-plan/plan.md - §8.5 の mise.toml タスク一覧に `gate`（`verify` の別名）が
    19	     ない。「Constitution Compliance」節は「憲章がまだない」と書かれたまま。spec 001 の plan で反映する
    20	Deferred Items:
    21	  - TODO(BRANCH_COVERAGE): 分岐カバレッジのしきい値（spec 001〜002 の実測ベースラインで決定）
    22	  - TODO(E2E_BUDGET): pre-push の E2E smoke の時間上限（plan §4 の目安 60 秒を、spec 003 の実測で確定）
    23	-->
    24	
    25	# genai-lab-ts Constitution
    26	
    27	本憲章は、`specs/000-development-plan/plan.md`（全体計画、決定事項 D1〜D6）のうち、**段（spec 001〜008）
    28	をまたいで譲れない判断基準**を統治規範として昇格したものである。各原則には**検証方法**を併記する。
    29	検証方法を持たない原則は適合を判定できないため、本憲章には置かない。
    30	
    31	本リポジトリは、生成 AI アプリ開発を 1 段ずつ積み上げる入門ハンズオン・ラボである。したがって
    32	「動くこと」に加えて、「学習者が API キーなしで同じ手順・同じ結果を再現できること」と「原則を破ると
    33	テストかゲートが落ちること」を品質の定義に含める。運用ルールは卒業先の `from-genai-to-agentic-ai` の
    34	憲章に揃え、本文は複製せず相互リンクで済ませる。
    35	
    36	## Core Principles
    37	
    38	### 1. 入門ラボの範囲を守る
    39	
    40	本リポジトリは、単一の Next.js アプリで Level 1（生成 AI）〜 Level 2 入口（ツール呼び出し）までを扱う
    41	入門ラボであり続けることが MUST である（D1）。
    42	
    43	- RAG、ワークフローパターン、マルチエージェント、MCP、長時間実行ハーネス、本格的な Agent Evals を
    44	  実装してはならない（MUST NOT）。これらは `from-genai-to-agentic-ai` の該当モジュールへリンクする。
    45	- 兄弟リポジトリ（`from-genai-to-agentic-ai`、`next-agentic-stack`、`sdd-tdd-kit`）の本文やコードを
    46	  複製してはならない（MUST NOT）。参照はリンクで行う。
    47	- 段の追加・削除・範囲変更は、全体計画（spec 000）の改訂を先に行う。
    48	
    49	**根拠**: 範囲が膨らむと卒業先の 19 モジュールと重複し、入門ラボとしての「小さく読める」価値を失う。
    50	
    51	**検証**: `/sdd-plan` と `/sdd-analyze` で、各段の要件が上記の扱わない領域に入っていないことを確認する。
    52	
    53	### 2. 1 段は spec・解説・実装・合格テストで完成する
    54	
    55	各段は、`specs/<NNN>-<slug>/`、解説 `docs/stages/<n>-<slug>.md`、対応するソース、合格判定テストの
    56	4 点を揃えて完成とすることが MUST である。
    57	
    58	- 段の番号と spec 番号は一致する（段 1 = spec 001）。計画外の作業は 009 以降を順に使う。
    59	- 解説は「読む → 動かす → 改造する → テストで合格を確かめる」の順で書き、合格条件ごとに対応する
    60	  テストのパスを示す。
    61	- 1 段 = 1 PR とする。大きい段は spec PR と実装 PR に分けてよい。
    62	
    63	**根拠**: テストに結びつかない解説は、実装と乖離しても誰も気づかない。合格条件をテストで判定できる
    64	ことが、学習者にとっての到達基準になる。
    65	
    66	**検証**: `/sdd-validate-impl` と `/sdd-ship` で 4 点の実在と、解説が参照するテストパスの実在を確認する。
    67	
    68	### 3. 品質ゲートは 1 つで、決定論的で、空振りしない
    69	
    70	`mise run verify` は lint、format チェック、typecheck、セキュリティ検査、テストを 1 コマンドで実行する
    71	唯一の検証入口であることが MUST である。`mise run gate` は `verify` の別名として定義し、同じ処理を
    72	実行する。
    73	
    74	- lefthook のフックと CI は同じ `mise run verify`（またはその構成要素）を実行する。フックは
    75	  `--no-verify` で回避できるため、CI の verify ジョブを省略してはならない（MUST NOT）。
    76	- verify は API キーとネットワークを必要としない。未モックのネットワークアクセス（Vitest の
    77	  `fetch`、Playwright の未定義ルート）はテストを失敗させる。
    78	- 同一コミットでは常に同じ合否を返す。不安定なテストはリトライやスキップで隠さず、原因を直す。
    79	- 実行したテストが 0 件の場合は失敗させる（Vitest の `passWithNoTests` を有効にしない。Playwright の
    80	  `--grep @smoke` が 0 件なら失敗とする）。
    81	- テストは**非空虚**でなければならない。対象ロジックを壊した変更で落ちることを確認していないテストは、
    82	  合格条件の根拠として数えない。
    83	
    84	**根拠**: 「API キーなしで全テストが決定論的に通る」ことは本ラボの前提である。空振りの緑は、壊れた
    85	教材を合格させる。
    86	
    87	**検証**: CI の verify ジョブ（必須）、`vitest.config.ts` / `playwright.config.ts` の未モック通信の遮断、
    88	`/sdd-impl` の RED 確認記録。
    89	
    90	### 4. テストを先に書く
    91	
    92	実装コードは、それを要求する失敗するテストより先に書いてはならない（MUST NOT）。
    93	RED（失敗を確認）→ GREEN（最小実装）→ REFACTOR の順序を守る。既に動くコードに合わせて後から
    94	テストを書くことを禁ずる。不具合修正では、修正前に失敗する再現テストを先に追加する。
    95	
    96	テストが予期せず落ちたときは、スキップ・リトライ・期待値の緩和ではなく、**停止して根本原因を特定
    97	する**ことが MUST である。
    98	
    99	**検証**: `tdd-enforcement` skill の適用、コミット履歴でテストが実装に先行しているかのレビュー。
   100	
   101	### 5. モデルは注入し、モデル ID は allowlist だけに書く
   102	
   103	- LLM を呼ぶ関数は、モデルを引数で受け取ることが MUST である。テストでは `ai/test` のモック
   104	  モデル（`MockLanguageModelV4` 等）に差し替え、実 LLM を呼んではならない（MUST NOT）。
   105	- モデル ID は `src/lib/ai/model-allowlist.ts` を唯一の定義とし、他のコード・設定・文書に直書きして
   106	  はならない（MUST NOT、テスト fixture を除く）。環境変数（`AI_MODEL`、`AI_PROVIDER`）は allowlist 内
   107	  の値だけを受け付け、不正値は起動時に Zod で拒否する。
   108	- 構造化出力は `Output.object({ schema })` を使う。`generateObject` / `streamObject` を使っては
   109	  ならない（MUST NOT）。
   110	
   111	**根拠**: モデルの注入はテストの決定論性を、allowlist は ID の散在と存在しないモデルの指定を防ぐ。
   112	非推奨 API を使うと、卒業先と異なる書き方を教えることになる。
   113	
   114	**検証**: pre-commit と verify の `check:model-ids`、`generateObject` / `streamObject` のリポジトリ走査
   115	テスト（段 4 の合格条件）。
   116	
   117	### 6. エージェントは必ず止まり、危険な操作は承認を待つ
   118	
   119	- エージェントの生成は `createGuardedAgent`（`src/lib/ai/agent.ts`）に集約し、それ以外の
   120	  `new ToolLoopAgent` を置いてはならない（MUST NOT）。
   121	- すべてのエージェントは、最大ステップ数、累積トークン使用量、実行時間の **3 種の停止条件**を持つ
   122	  ことが MUST である。停止理由は閉じた語彙（`completed`、`step-limit`、`token-budget`、`timeout`、
   123	  `aborted`、`error`）の 1 つとして結果に含める。語彙の変更は本憲章の改正を要する。
   124	- 書き込み・破壊的なツールは `toolApproval` で承認待ちにする。承認要否はサーバー側のコードで決め、
   125	  クライアントが送る値で決めてはならない（MUST NOT）。
   126	- ツール結果と外部入力はデータとして扱い、指示として解釈・実行しない。`eval` / `new Function` を
   127	  使ってはならない（MUST NOT）。
   128	
   129	**根拠**: 止まらないエージェントと読まれずに通る承認は、入門段階で最初に身につけるべき安全策の
   130	欠如である。語彙を卒業先と揃えることで、学習者はそのまま次へ進める。
   131	
   132	**検証**: 停止理由ごとのユニットテストと破壊的ツールの承認待ちテスト（段 5 の合格条件）、
   133	`new ToolLoopAgent` と `eval` / `new Function` のリポジトリ走査テスト。
   134	
   135	### 7. 型と境界を固定する
   136	
   137	- TypeScript は `strict` で型検査を通す。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを
   138	  導入してはならない（MUST NOT）。
   139	- システム境界（HTTP リクエスト、環境変数、ツール入力、LLM の構造化出力）を越えるデータは Zod で
   140	  検証する。リクエストスキーマは未知のフィールドを拒否する厳格なスキーマとする。内部コードは検証済み
   141	  の型を信頼し、防御的な再検証を重ねない。
   142	- React Server Components を既定とし、`"use client"` はブラウザ状態や対話性が必要な末端に限る。
   143	  サーバー専用モジュール（API キー参照、Zod スキーマを含む AI 呼び出し）は `server-only` とし、
   144	  クライアントバンドルに含めてはならない（MUST NOT）。
   145	- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
   146	  件数・文字数・バイト数・レート・エージェント反復回数に明示的な上限を持つことが MUST である。
   147	
   148	**根拠**: 境界での一度の検証と型の一貫性は、プレリリース版の破壊的変更を早期に検出し、秘密情報の
   149	漏えい経路を塞ぐ。
   150	
   151	**検証**: verify の typecheck と Biome、Zod 拒否のユニットテスト、上限超過が 400 / 413 / 429 になる
   152	テスト（段 8 の合格条件）。
   153	
   154	### 8. 秘密情報とサプライチェーンを守る
   155	
   156	- API キーは環境変数からのみ読み込み、サーバー側でのみ参照する。`.env` / `.env*.local` をコミット
   157	  せず、変数名だけの `.env.example` を提供する。
   158	- 生のプロンプト、ツール引数の値、秘密情報をログに出力しない。シークレットスキャンは `--redact` で
   159	  検出値を出力しない。
   160	- gitleaks を pre-commit（ステージ済み変更）と CI（全履歴、`fetch-depth: 0`）で実行する。
   161	  `gitleaks dir` をシークレットスキャンに使ってはならない（MUST NOT）。
   162	- 依存は公開から 24 時間未満の版を採用しない（`minimumReleaseAge: 1440`）。プレリリースを含め
   163	  `minimumReleaseAgeExclude` で除外してはならない（MUST NOT、D3）。
   164	- 依存とツールは exact pin とし、`latest` / `canary` / `beta` などのタグや範囲指定を使ってはならない
   165	  （MUST NOT）。install スクリプトは既定で遮断し、`allowBuilds` で許可するパッケージには許可理由を記す。
   166	- CI は `--frozen-lockfile` で実行し、`osv-scanner` と `pnpm audit --audit-level=high` を通す。
   167	  GitHub Actions の `uses:` はコミット SHA で固定し、各ジョブの `permissions:` を最小にする。
   168	
   169	**根拠**: プレリリース版を積極的に使うラボほど、公開直後の不正版や秘密情報の混入に対する防御を
   170	強く保つ必要がある。
   171	
   172	**検証**: lefthook の pre-commit / pre-push、CI の verify と `security-daily`、`pnpm-workspace.yaml` と
   173	ワークフロー定義のレビュー（`/sdd-analyze`）。
   174	
   175	### 9. 事実は実測で確定し、版は現時点の採用版として扱う
   176	
   177	- ライブラリの API、版、モデル ID、ツールの振る舞いに関する主張は、公式ドキュメント（Context7、
   178	  インストール済みの `node_modules/next/dist/docs/` 等）の確認と、実インストール・実行による実測を
   179	  根拠に記録することが MUST である。ZIP ガイドの記述や記憶を根拠にしてはならない（MUST NOT）。
   180	- exact pin した版は「確認日つきの現時点の採用版」であり、据え置く対象ではない（plan §2.1）。
   181	  版の正本は `mise.toml`、`package.json`、`pnpm-lock.yaml` とし、文書の版番号は参考値として扱う。
   182	- 合格条件は「その時点の pin で verify と CI が緑」とする。テストや文書で特定の版番号をハードコード
   183	  して検査してはならない（MUST NOT）。Node は `engines` の範囲と LTS 系列で判定する。
   184	- 脆弱性検出時は 24h 経過済みの修正版へ上げる。上げられない場合は `overrides` で推移的依存だけを
   185	  上げるか、退役条件付きの除外を記録する。版を上げる commit は `build(deps):` / `fix(security):` とし、
   186	  理由（advisory ID、release note）を本文に書く。
   187	- 誤りが判明した記述は、実測結果で置き換える。
   188	
   189	**根拠**: AI SDK 7、TypeScript 7.1 beta、Next.js canary は記述と実物がずれやすい。版番号を合否に
   190	使うと、正しいセキュリティ更新がテストを壊す。
   191	
   192	**検証**: 各段の `research.md` の Evidence 欄、`/sdd-analyze`、版番号を検査するテストがないことの
   193	レビュー。
   194	
   195	### 10. 依存は plan に宣言してから追加する
   196	
   197	`plan.md`（全体計画または各段の plan）に宣言されていない第三者依存の追加を禁ずる（MUST NOT）。
   198	追加が必要なときは、標準ライブラリや既存依存で代替できない理由を添えて、先に plan を改正する。
   199	CI ジョブ、外部サービス、インフラの追加も同じ規律に従う。API キーを要する機能は、キーがない場合の
   200	モック経路またはスキップを必ず持つ。
   201	
   202	**検証**: `/sdd-analyze` で `package.json` の依存と plan の宣言を突き合わせる。
   203	
   204	### 11. 段階ゲートを飛ばさない
   205	
   206	- 段は番号順（001 → 008）に実装する。後続段の spec を先に起草してよいが、実装は先行段の `/sdd-ship`
   207	  完了後に始める。受け入れ基準の事後緩和を禁ずる。
   208	- 各 spec の要件・設計・タスクの各フェーズは**人間が承認**する。一括の自動承認を禁ずる。
   209	- 各実装フェーズの完了後に、作成者と異なるモデルファミリーで敵対的レビューを 1 回行う。レビューは
   210	  報告のみとし、指摘の採否は証拠（テスト、コマンド、引用）で決める。
   211	- レビュー記録は 1 ラウンド 1 ファイルとし、過去のラウンドを上書きしない。
   212	
   213	**根拠**: 各段は前の段の成果の上に積み上がる。誤読された要件は下流のすべてが継承する。
   214	
   215	**検証**: 各 `spec.json` の `approvals`、`.sdd/reviews/` の記録、PR の順序。
   216	
   217	## Additional Constraints
   218	
   219	**ツールチェーン**: ランタイム、パッケージマネージャ、フック・セキュリティツールは `mise.toml` で
   220	固定する。コマンドは `mise run <task>` → `pnpm exec <cmd>` の順で実行し、素のツールを直接実行しない。
   221	フックは mise 管理のツールを PATH から呼ぶため、mise を有効にした環境を前提とする（README に明記）。
   222	
   223	**Node のレーン**: 既定は Node 26 LTS（`mise.toml`）で、必須 CI とする。Node 27 alpha は
   224	`mise.node27.toml`（`MISE_ENV=node27`）と `exp/node27` で分離検証し、CI では `continue-on-error` とする。
   225	Node 27 でだけ必要な修正は Node 26 で壊れないことを確認してから main に入れる。検証結果は失敗を含めて
   226	`docs/node27/YYYY-MM-DD-<topic>.md` に 1 検証 1 ファイルで残す。
   227	
   228	**フックの回避**: フックが環境要因で失敗した場合は、ベースブランチで同じ失敗が再現するなど環境要因で
   229	あることを先に示す。そのうえで回避（`--no-verify` 等）を 1 回だけ提案し、CI が担う検査と回避の事実を
   230	PR 本文に記録する。
   231	
   232	**lint / format**: Biome を単一の規約とし、`noUnusedVariables` / `noUnusedImports` / `noExplicitAny` は
   233	`error` とする。
   234	
   235	**UI**: shadcn/ui と Tailwind CSS v4 を標準とする（spec 002 以降で導入）。
   236	
   237	**テストのモック**: ユニットテストは `ai/test` のモックモデル、E2E は Playwright `page.route` による
   238	UI message stream（SSE）のモックを使う。pre-push の E2E は `@smoke` の 1〜2 本に限り、残りは CI で
   239	実行する（D5）。時間上限は TODO(E2E_BUDGET)。
   240	
   241	**品質目標**: 分岐カバレッジのしきい値は TODO(BRANCH_COVERAGE)。根拠のない数値を先に固定すると
   242	原則 9 に反するため、実測ベースラインを取得してから決める。
   243	
   244	**言語**: spec、解説、憲章、steering の散文は日本語。コード、識別子、コメント、パス、コミット
   245	メッセージ、PR タイトル・本文は英語（D6）。ルートの `AGENTS.md` は英語で維持する。
   246	
   247	## Governance
   248	
   249	- **Authority**: 本憲章はアドホックな判断に優先する。ただし本憲章は spec を置き換えない。個別の要件と
   250	  数値は spec が正本を持ち、本憲章は「どの判断基準が譲れないか」を定める。spec と本憲章が矛盾する
   251	  場合は、spec を改訂するか本憲章を改正するかを明示的に決め、両者を同じ変更で更新する。
   252	- **Amendment procedure**: 変更提案（理由、影響する原則と成果物、提案するバージョン増分）→ レビュー →
   253	  バージョン昇格 → Sync Impact Report と改訂履歴への記録。原則の追加・削除・再定義は、影響する
   254	  `plan.md` / `tasks.md` / `AGENTS.md` の同期確認を伴う。
   255	- **Versioning policy**（セマンティック）:
   256	  - MAJOR: 後方非互換な変更（原則の削除・再定義）。
   257	  - MINOR: 原則・節の追加、または実質的な拡張。
   258	  - PATCH: 明確化・表現修正。
   259	- **Compliance review**: 設計とタスクを MUST 原則に対して検査する（`/sdd-plan` の Constitution
   260	  Compliance 表、`/sdd-tasks`、`/sdd-analyze`）。違反は重大問題として扱う。加えて原則 11 に従い、
   261	  各実装フェーズの完了後に敵対的レビューを行う。
   262	- **Review cadence**: プレリリース版の stable 移行（TypeScript 7.1、Next.js 16.5 等）、Node の LTS
   263	  節目、卒業先リポジトリの憲章改正時に本憲章を再確認する。
   264	- **本憲章の正本**: `.sdd/memory/constitution.md`（git 追跡対象）。
   265	
   266	## 改訂履歴
   267	
   268	| 版 | 日付 | 種別 | 主な変更内容 |
   269	| :--- | :--- | :--- | :--- |
   270	| 1.0.0 | 2026-11-22 | 初版 | spec 000 の全体計画（§2.1 版方針、§4 ゲート、§5 共通ルール、D1〜D6）から原則 1〜11 を制定。Additional Constraints / Governance を新設 |
   271	
   272	### 未決事項（Deferred）
   273	
   274	- **TODO(BRANCH_COVERAGE)**: 分岐カバレッジのしきい値。spec 002 のユニットテスト実装後に実測
   275	  ベースラインを取り、決定して本憲章へ反映する（MINOR）。
   276	- **TODO(E2E_BUDGET)**: pre-push の E2E smoke の時間上限。plan §4 の目安 60 秒を spec 003 の実測で
   277	  確定する（PATCH）。
   278	
   279	---
   280	
   281	**Version**: 1.0.0 |
   282	**Ratified**: 2026-11-22 |
   283	**Last amended**: 2026-11-22

exec
/bin/zsh -lc "nl -ba .sdd/memory/constitution.md | sed -n '68,217p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 95ms:
    68	### 3. 品質ゲートは 1 つで、決定論的で、空振りしない
    69	
    70	`mise run verify` は lint、format チェック、typecheck、セキュリティ検査、テストを 1 コマンドで実行する
    71	唯一の検証入口であることが MUST である。`mise run gate` は `verify` の別名として定義し、同じ処理を
    72	実行する。
    73	
    74	- lefthook のフックと CI は同じ `mise run verify`（またはその構成要素）を実行する。フックは
    75	  `--no-verify` で回避できるため、CI の verify ジョブを省略してはならない（MUST NOT）。
    76	- verify は API キーとネットワークを必要としない。未モックのネットワークアクセス（Vitest の
    77	  `fetch`、Playwright の未定義ルート）はテストを失敗させる。
    78	- 同一コミットでは常に同じ合否を返す。不安定なテストはリトライやスキップで隠さず、原因を直す。
    79	- 実行したテストが 0 件の場合は失敗させる（Vitest の `passWithNoTests` を有効にしない。Playwright の
    80	  `--grep @smoke` が 0 件なら失敗とする）。
    81	- テストは**非空虚**でなければならない。対象ロジックを壊した変更で落ちることを確認していないテストは、
    82	  合格条件の根拠として数えない。
    83	
    84	**根拠**: 「API キーなしで全テストが決定論的に通る」ことは本ラボの前提である。空振りの緑は、壊れた
    85	教材を合格させる。
    86	
    87	**検証**: CI の verify ジョブ（必須）、`vitest.config.ts` / `playwright.config.ts` の未モック通信の遮断、
    88	`/sdd-impl` の RED 確認記録。
    89	
    90	### 4. テストを先に書く
    91	
    92	実装コードは、それを要求する失敗するテストより先に書いてはならない（MUST NOT）。
    93	RED（失敗を確認）→ GREEN（最小実装）→ REFACTOR の順序を守る。既に動くコードに合わせて後から
    94	テストを書くことを禁ずる。不具合修正では、修正前に失敗する再現テストを先に追加する。
    95	
    96	テストが予期せず落ちたときは、スキップ・リトライ・期待値の緩和ではなく、**停止して根本原因を特定
    97	する**ことが MUST である。
    98	
    99	**検証**: `tdd-enforcement` skill の適用、コミット履歴でテストが実装に先行しているかのレビュー。
   100	
   101	### 5. モデルは注入し、モデル ID は allowlist だけに書く
   102	
   103	- LLM を呼ぶ関数は、モデルを引数で受け取ることが MUST である。テストでは `ai/test` のモック
   104	  モデル（`MockLanguageModelV4` 等）に差し替え、実 LLM を呼んではならない（MUST NOT）。
   105	- モデル ID は `src/lib/ai/model-allowlist.ts` を唯一の定義とし、他のコード・設定・文書に直書きして
   106	  はならない（MUST NOT、テスト fixture を除く）。環境変数（`AI_MODEL`、`AI_PROVIDER`）は allowlist 内
   107	  の値だけを受け付け、不正値は起動時に Zod で拒否する。
   108	- 構造化出力は `Output.object({ schema })` を使う。`generateObject` / `streamObject` を使っては
   109	  ならない（MUST NOT）。
   110	
   111	**根拠**: モデルの注入はテストの決定論性を、allowlist は ID の散在と存在しないモデルの指定を防ぐ。
   112	非推奨 API を使うと、卒業先と異なる書き方を教えることになる。
   113	
   114	**検証**: pre-commit と verify の `check:model-ids`、`generateObject` / `streamObject` のリポジトリ走査
   115	テスト（段 4 の合格条件）。
   116	
   117	### 6. エージェントは必ず止まり、危険な操作は承認を待つ
   118	
   119	- エージェントの生成は `createGuardedAgent`（`src/lib/ai/agent.ts`）に集約し、それ以外の
   120	  `new ToolLoopAgent` を置いてはならない（MUST NOT）。
   121	- すべてのエージェントは、最大ステップ数、累積トークン使用量、実行時間の **3 種の停止条件**を持つ
   122	  ことが MUST である。停止理由は閉じた語彙（`completed`、`step-limit`、`token-budget`、`timeout`、
   123	  `aborted`、`error`）の 1 つとして結果に含める。語彙の変更は本憲章の改正を要する。
   124	- 書き込み・破壊的なツールは `toolApproval` で承認待ちにする。承認要否はサーバー側のコードで決め、
   125	  クライアントが送る値で決めてはならない（MUST NOT）。
   126	- ツール結果と外部入力はデータとして扱い、指示として解釈・実行しない。`eval` / `new Function` を
   127	  使ってはならない（MUST NOT）。
   128	
   129	**根拠**: 止まらないエージェントと読まれずに通る承認は、入門段階で最初に身につけるべき安全策の
   130	欠如である。語彙を卒業先と揃えることで、学習者はそのまま次へ進める。
   131	
   132	**検証**: 停止理由ごとのユニットテストと破壊的ツールの承認待ちテスト（段 5 の合格条件）、
   133	`new ToolLoopAgent` と `eval` / `new Function` のリポジトリ走査テスト。
   134	
   135	### 7. 型と境界を固定する
   136	
   137	- TypeScript は `strict` で型検査を通す。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを
   138	  導入してはならない（MUST NOT）。
   139	- システム境界（HTTP リクエスト、環境変数、ツール入力、LLM の構造化出力）を越えるデータは Zod で
   140	  検証する。リクエストスキーマは未知のフィールドを拒否する厳格なスキーマとする。内部コードは検証済み
   141	  の型を信頼し、防御的な再検証を重ねない。
   142	- React Server Components を既定とし、`"use client"` はブラウザ状態や対話性が必要な末端に限る。
   143	  サーバー専用モジュール（API キー参照、Zod スキーマを含む AI 呼び出し）は `server-only` とし、
   144	  クライアントバンドルに含めてはならない（MUST NOT）。
   145	- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
   146	  件数・文字数・バイト数・レート・エージェント反復回数に明示的な上限を持つことが MUST である。
   147	
   148	**根拠**: 境界での一度の検証と型の一貫性は、プレリリース版の破壊的変更を早期に検出し、秘密情報の
   149	漏えい経路を塞ぐ。
   150	
   151	**検証**: verify の typecheck と Biome、Zod 拒否のユニットテスト、上限超過が 400 / 413 / 429 になる
   152	テスト（段 8 の合格条件）。
   153	
   154	### 8. 秘密情報とサプライチェーンを守る
   155	
   156	- API キーは環境変数からのみ読み込み、サーバー側でのみ参照する。`.env` / `.env*.local` をコミット
   157	  せず、変数名だけの `.env.example` を提供する。
   158	- 生のプロンプト、ツール引数の値、秘密情報をログに出力しない。シークレットスキャンは `--redact` で
   159	  検出値を出力しない。
   160	- gitleaks を pre-commit（ステージ済み変更）と CI（全履歴、`fetch-depth: 0`）で実行する。
   161	  `gitleaks dir` をシークレットスキャンに使ってはならない（MUST NOT）。
   162	- 依存は公開から 24 時間未満の版を採用しない（`minimumReleaseAge: 1440`）。プレリリースを含め
   163	  `minimumReleaseAgeExclude` で除外してはならない（MUST NOT、D3）。
   164	- 依存とツールは exact pin とし、`latest` / `canary` / `beta` などのタグや範囲指定を使ってはならない
   165	  （MUST NOT）。install スクリプトは既定で遮断し、`allowBuilds` で許可するパッケージには許可理由を記す。
   166	- CI は `--frozen-lockfile` で実行し、`osv-scanner` と `pnpm audit --audit-level=high` を通す。
   167	  GitHub Actions の `uses:` はコミット SHA で固定し、各ジョブの `permissions:` を最小にする。
   168	
   169	**根拠**: プレリリース版を積極的に使うラボほど、公開直後の不正版や秘密情報の混入に対する防御を
   170	強く保つ必要がある。
   171	
   172	**検証**: lefthook の pre-commit / pre-push、CI の verify と `security-daily`、`pnpm-workspace.yaml` と
   173	ワークフロー定義のレビュー（`/sdd-analyze`）。
   174	
   175	### 9. 事実は実測で確定し、版は現時点の採用版として扱う
   176	
   177	- ライブラリの API、版、モデル ID、ツールの振る舞いに関する主張は、公式ドキュメント（Context7、
   178	  インストール済みの `node_modules/next/dist/docs/` 等）の確認と、実インストール・実行による実測を
   179	  根拠に記録することが MUST である。ZIP ガイドの記述や記憶を根拠にしてはならない（MUST NOT）。
   180	- exact pin した版は「確認日つきの現時点の採用版」であり、据え置く対象ではない（plan §2.1）。
   181	  版の正本は `mise.toml`、`package.json`、`pnpm-lock.yaml` とし、文書の版番号は参考値として扱う。
   182	- 合格条件は「その時点の pin で verify と CI が緑」とする。テストや文書で特定の版番号をハードコード
   183	  して検査してはならない（MUST NOT）。Node は `engines` の範囲と LTS 系列で判定する。
   184	- 脆弱性検出時は 24h 経過済みの修正版へ上げる。上げられない場合は `overrides` で推移的依存だけを
   185	  上げるか、退役条件付きの除外を記録する。版を上げる commit は `build(deps):` / `fix(security):` とし、
   186	  理由（advisory ID、release note）を本文に書く。
   187	- 誤りが判明した記述は、実測結果で置き換える。
   188	
   189	**根拠**: AI SDK 7、TypeScript 7.1 beta、Next.js canary は記述と実物がずれやすい。版番号を合否に
   190	使うと、正しいセキュリティ更新がテストを壊す。
   191	
   192	**検証**: 各段の `research.md` の Evidence 欄、`/sdd-analyze`、版番号を検査するテストがないことの
   193	レビュー。
   194	
   195	### 10. 依存は plan に宣言してから追加する
   196	
   197	`plan.md`（全体計画または各段の plan）に宣言されていない第三者依存の追加を禁ずる（MUST NOT）。
   198	追加が必要なときは、標準ライブラリや既存依存で代替できない理由を添えて、先に plan を改正する。
   199	CI ジョブ、外部サービス、インフラの追加も同じ規律に従う。API キーを要する機能は、キーがない場合の
   200	モック経路またはスキップを必ず持つ。
   201	
   202	**検証**: `/sdd-analyze` で `package.json` の依存と plan の宣言を突き合わせる。
   203	
   204	### 11. 段階ゲートを飛ばさない
   205	
   206	- 段は番号順（001 → 008）に実装する。後続段の spec を先に起草してよいが、実装は先行段の `/sdd-ship`
   207	  完了後に始める。受け入れ基準の事後緩和を禁ずる。
   208	- 各 spec の要件・設計・タスクの各フェーズは**人間が承認**する。一括の自動承認を禁ずる。
   209	- 各実装フェーズの完了後に、作成者と異なるモデルファミリーで敵対的レビューを 1 回行う。レビューは
   210	  報告のみとし、指摘の採否は証拠（テスト、コマンド、引用）で決める。
   211	- レビュー記録は 1 ラウンド 1 ファイルとし、過去のラウンドを上書きしない。
   212	
   213	**根拠**: 各段は前の段の成果の上に積み上がる。誤読された要件は下流のすべてが継承する。
   214	
   215	**検証**: 各 `spec.json` の `approvals`、`.sdd/reviews/` の記録、PR の順序。
   216	
   217	## Additional Constraints

exec
/bin/zsh -lc "nl -ba .sdd/memory/constitution.md | sed -n '128,174p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 95ms:
   128	
   129	**根拠**: 止まらないエージェントと読まれずに通る承認は、入門段階で最初に身につけるべき安全策の
   130	欠如である。語彙を卒業先と揃えることで、学習者はそのまま次へ進める。
   131	
   132	**検証**: 停止理由ごとのユニットテストと破壊的ツールの承認待ちテスト（段 5 の合格条件）、
   133	`new ToolLoopAgent` と `eval` / `new Function` のリポジトリ走査テスト。
   134	
   135	### 7. 型と境界を固定する
   136	
   137	- TypeScript は `strict` で型検査を通す。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを
   138	  導入してはならない（MUST NOT）。
   139	- システム境界（HTTP リクエスト、環境変数、ツール入力、LLM の構造化出力）を越えるデータは Zod で
   140	  検証する。リクエストスキーマは未知のフィールドを拒否する厳格なスキーマとする。内部コードは検証済み
   141	  の型を信頼し、防御的な再検証を重ねない。
   142	- React Server Components を既定とし、`"use client"` はブラウザ状態や対話性が必要な末端に限る。
   143	  サーバー専用モジュール（API キー参照、Zod スキーマを含む AI 呼び出し）は `server-only` とし、
   144	  クライアントバンドルに含めてはならない（MUST NOT）。
   145	- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
   146	  件数・文字数・バイト数・レート・エージェント反復回数に明示的な上限を持つことが MUST である。
   147	
   148	**根拠**: 境界での一度の検証と型の一貫性は、プレリリース版の破壊的変更を早期に検出し、秘密情報の
   149	漏えい経路を塞ぐ。
   150	
   151	**検証**: verify の typecheck と Biome、Zod 拒否のユニットテスト、上限超過が 400 / 413 / 429 になる
   152	テスト（段 8 の合格条件）。
   153	
   154	### 8. 秘密情報とサプライチェーンを守る
   155	
   156	- API キーは環境変数からのみ読み込み、サーバー側でのみ参照する。`.env` / `.env*.local` をコミット
   157	  せず、変数名だけの `.env.example` を提供する。
   158	- 生のプロンプト、ツール引数の値、秘密情報をログに出力しない。シークレットスキャンは `--redact` で
   159	  検出値を出力しない。
   160	- gitleaks を pre-commit（ステージ済み変更）と CI（全履歴、`fetch-depth: 0`）で実行する。
   161	  `gitleaks dir` をシークレットスキャンに使ってはならない（MUST NOT）。
   162	- 依存は公開から 24 時間未満の版を採用しない（`minimumReleaseAge: 1440`）。プレリリースを含め
   163	  `minimumReleaseAgeExclude` で除外してはならない（MUST NOT、D3）。
   164	- 依存とツールは exact pin とし、`latest` / `canary` / `beta` などのタグや範囲指定を使ってはならない
   165	  （MUST NOT）。install スクリプトは既定で遮断し、`allowBuilds` で許可するパッケージには許可理由を記す。
   166	- CI は `--frozen-lockfile` で実行し、`osv-scanner` と `pnpm audit --audit-level=high` を通す。
   167	  GitHub Actions の `uses:` はコミット SHA で固定し、各ジョブの `permissions:` を最小にする。
   168	
   169	**根拠**: プレリリース版を積極的に使うラボほど、公開直後の不正版や秘密情報の混入に対する防御を
   170	強く保つ必要がある。
   171	
   172	**検証**: lefthook の pre-commit / pre-push、CI の verify と `security-daily`、`pnpm-workspace.yaml` と
   173	ワークフロー定義のレビュー（`/sdd-analyze`）。
   174	

exec
/bin/zsh -lc "printf '%s\\n' '--- tech ---'; nl -ba .sdd/steering/tech.md; printf '%s\\n' '--- structure ---'; nl -ba .sdd/steering/structure.md" in /Users/Shared/codes/genai-lab-ts
 succeeded in 97ms:
--- tech ---
     1	# Technology
     2	
     3	技術上の決定と規約。依存の一覧ではなく、将来の判断を導くものを残す。
     4	MUST / MUST NOT の正本は [.sdd/memory/constitution.md](../memory/constitution.md)。ここでは
     5	その原則を「どう書くか」の形で示す。
     6	
     7	> 状態（2026-11-22）: 計画確定・コード未作成。下表の版は設計時点の参考値で、正本は
     8	> `mise.toml`、`package.json`、`pnpm-lock.yaml`（段 1 で作成）。版番号を合否に使わない。
     9	
    10	## Stack
    11	
    12	| Layer | Choice | Notes |
    13	|-------|--------|-------|
    14	| Runtime | Node.js 26 LTS（既定）/ Node 27 alpha（検証レーン） | `mise.toml` / `mise.node27.toml`（`MISE_ENV=node27`） |
    15	| Package manager | pnpm 12.22 以上 | `mise.toml` と `package.json#packageManager` を一致させる |
    16	| Language | TypeScript 7.1 beta（Go ネイティブ） | `strict`。stable / RC が出たら切り替える |
    17	| Framework | Next.js 16.5 canary（App Router / Turbopack）+ React 19.3 | RSC 既定 |
    18	| AI | Vercel AI SDK 7（`ai`, `@ai-sdk/react`, 各プロバイダ） | テストは `ai/test` のモックモデル |
    19	| Validation | Zod 4.6 | システム境界で一度だけ検証 |
    20	| UI | shadcn/ui + Tailwind CSS v4 | spec 002 以降で導入 |
    21	| Lint / Format | Biome | 単一の規約 |
    22	| Testing | Vitest（unit）/ Playwright（E2E） | 未モック通信は失敗 |
    23	| Hooks / Security | lefthook / gitleaks / osv-scanner / `pnpm audit` | `mise.toml` で exact pin |
    24	| Data store | なし | 永続化は扱わない（RAG は範囲外） |
    25	
    26	## Key Decisions
    27	
    28	- **exact pin は「現時点の採用版」** — 据え置くためではなく採用時点を明示するため。脆弱性検出・
    29	  週次の更新確認・stable 公開を契機に上げる（plan §2.1、憲章 原則 9）。
    30	- **24h ゲートを外さない** — `minimumReleaseAge: 1440`、`minimumReleaseAgeExclude` は使わない。
    31	  プレリリースも 24h 経過済みの特定版へ pin する（D3）。
    32	- **フックは lefthook** — pre-commit は並列の速いゲート、pre-push は安い順に直列（D4）。
    33	- **E2E は pre-push に smoke 1〜2 本、残りは CI** — `@smoke` タグで選ぶ（D5）。
    34	- **モデル ID は allowlist だけ** — `src/lib/ai/model-allowlist.ts` を唯一の定義とし、
    35	  `check:model-ids` で直書きを検出する。
    36	- **Node 27 は分離検証** — main は Node 26 LTS が必須 CI。Node 27 は `continue-on-error` で、
    37	  専用の修正は `exp/node27` に置く。
    38	
    39	## Conventions
    40	
    41	- **Commands**: `mise run <task>` → `pnpm exec <cmd>` の順。素のツールを直接実行しない。
    42	- **Gate command**: `mise run verify`（lint・format チェック・typecheck・セキュリティ・テスト）。
    43	  `mise run gate` は `verify` の別名として定義する。フックと CI は同じものを実行する。
    44	- **Preflight command**: なし（段 1 で必要性を判断）。フックは mise を有効にした環境が前提。
    45	- **Typing**: TS `strict`。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを入れない。
    46	  Biome の `noUnusedVariables` / `noUnusedImports` / `noExplicitAny` は `error`。
    47	- **Boundaries**: HTTP リクエスト・環境変数・ツール入力・LLM 構造化出力は Zod で検証する。
    48	  リクエストスキーマは厳格（未知フィールドを拒否）。内部では検証済みの型を信頼する。
    49	- **Model injection**: LLM を呼ぶ関数はモデルを引数で受け取る。
    50	
    51	  ```ts
    52	  // Pattern: the caller decides the model; tests pass a mock.
    53	  export async function summarize(model: LanguageModel, input: string) { /* ... */ }
    54	  ```
    55	
    56	- **Structured output**: `Output.object({ schema })` を使う。`generateObject` / `streamObject` は使わない。
    57	- **Agents**: `createGuardedAgent`（`src/lib/ai/agent.ts`）経由でのみ作る。停止条件はステップ数・
    58	  累積トークン・実行時間の 3 種。停止理由は閉じた語彙
    59	  `completed | step-limit | token-budget | timeout | aborted | error`。
    60	- **Tool approval**: 書き込み・破壊的なツールは `toolApproval` で承認待ち。要否はサーバー側で決める。
    61	- **Untrusted data**: ツール結果と外部入力はデータとして扱う。`eval` / `new Function` を使わない。
    62	- **Server / client**: RSC 既定。`"use client"` は対話が必要な末端だけ。API キー参照や AI 呼び出しの
    63	  モジュールは `server-only`。
    64	- **Errors**: テストが予期せず落ちたら、スキップ・リトライ・期待値の緩和ではなく原因を直す。
    65	- **Testing**: TDD（RED → GREEN → REFACTOR）。unit は `ai/test` のモックモデル、E2E は Playwright
    66	  `page.route` で UI message stream（SSE）をモックする。`passWithNoTests` を有効にしない。
    67	  テストは対象ロジックを壊すと落ちること（非空虚）を確認する。版番号をテストで検査しない。
    68	- **Logging**: 生のプロンプト、ツール引数の値、秘密情報をログに出さない。
    69	- **Commits**: Conventional Commits（英語）。版上げは `build(deps):` / `fix(security):` で、
    70	  advisory ID や release note を本文に書く。
    71	
    72	## Supply Chain
    73	
    74	- 依存とツールは exact pin。`latest` / `canary` / `beta` タグや範囲指定を使わない。
    75	- install スクリプトは既定で遮断し、`allowBuilds` で許可するものには理由を記す。
    76	- CI は `--frozen-lockfile`、`osv-scanner`、`pnpm audit --audit-level=high` を通す。
    77	- GitHub Actions の `uses:` はコミット SHA で固定し、ジョブごとに `permissions:` を最小にする。
    78	- gitleaks は pre-commit（ステージ済み、`--redact`）と CI（全履歴、`fetch-depth: 0`）で実行する。
    79	  `gitleaks dir` は使わない。
    80	- 新しい第三者依存・CI ジョブ・外部サービスは、plan に宣言してから追加する（憲章 原則 10）。
    81	
    82	## Constraints
    83	
    84	- `mise run verify` は API キーとネットワークを必要としない。同一コミットで常に同じ合否を返す。
    85	- API キーは環境変数からのみ、サーバー側でのみ参照する。`.env.example` は変数名だけを置く。
    86	- `AI_PROVIDER` / `AI_MODEL` は allowlist 内の値だけを受け付け、不正値は起動時に Zod で拒否する。
    87	- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
    88	  件数・文字数・バイト数・レート・反復回数に明示的な上限を持つ（400 / 413 / 429）。
    89	- ライブラリの API・版・モデル ID に関する主張は、公式ドキュメントと実インストール・実行で確かめて
    90	  `research.md` の Evidence に残す。記憶や ZIP ガイドの記述を根拠にしない。
    91	- 未決: 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)）、pre-push E2E の時間上限
    92	  （TODO(E2E_BUDGET)、目安 60 秒）。
--- structure ---
     1	# Structure
     2	
     3	コードの置き方のパターン。ファイルツリーを列挙せず、パターンと例を残す。
     4	
     5	> 状態（2026-11-22）: コード未作成。以下は spec 000 の計画（§5、§8.5）に基づく予定の構成で、
     6	> 段 1 で足場を取り込んだあとに実物と照合して更新する。
     7	
     8	## Organization Pattern
     9	
    10	**段（stage）単位の積み上げ。** 1 つの段は、互いに参照し合う 4 点で完成する（憲章 原則 2）。
    11	
    12	```
    13	specs/005-tools-approval/          # 要件・設計・タスク（spec 番号 = 段番号）
    14	docs/stages/5-tools-approval.md    # 解説: 読む → 動かす → 改造する → テストで合格を確かめる
    15	src/lib/ai/agent.ts                # 実装（段が持つ責務の単一の置き場）
    16	tests/unit/agent-approval.test.ts  # 合格判定テスト（解説から参照される）
    17	```
    18	
    19	アプリ自体は単一の Next.js App Router アプリ。AI 関連のロジックは `src/lib/ai/` に、UI と
    20	ルートハンドラは `src/app/` に分ける。
    21	
    22	## Directory Map (high level)
    23	
    24	| Path | Holds |
    25	|------|-------|
    26	| `src/app/` | App Router のページとルートハンドラ（例: `api/chat/route.ts`） |
    27	| `src/lib/ai/` | LLM 呼び出し・構造化出力・エージェント・プロバイダ・上限などのサーバー側ロジック |
    28	| `tests/unit/` | Vitest。モックモデルでロジックを検証 |
    29	| `tests/e2e/` | Playwright。`/api/chat` を SSE モックして UI フローを検証 |
    30	| `scripts/` | 実行用の小さなスクリプトとリポジトリ検査（例: `check-model-ids.mjs`、`hello.ts`） |
    31	| `docs/stages/` | 段ごとの解説 |
    32	| `docs/node27/` | Node 27 alpha の検証記録（1 検証 1 ファイル） |
    33	| `specs/` | `000-development-plan/`（全体計画）と各段の spec |
    34	| `.github/workflows/` | `ci.yml`（verify / verify-node27）、`security-daily.yml` |
    35	
    36	ルート直下の設定ファイル（`mise.toml`、`package.json`、`pnpm-workspace.yaml`、`lefthook.yml`、
    37	`biome.json`、`tsconfig.json`、各テストランナー設定）は版とゲートの正本。
    38	
    39	## Single Points of Definition
    40	
    41	規約を 1 か所に集約し、検査で守らせるもの。新しいコードはここを経由する。
    42	
    43	| 概念 | 唯一の置き場 | 守らせる検査 |
    44	|------|--------------|--------------|
    45	| モデル ID | `src/lib/ai/model-allowlist.ts` | `check:model-ids`（テスト fixture は除く） |
    46	| エージェント生成 | `src/lib/ai/agent.ts` の `createGuardedAgent` | `new ToolLoopAgent` のリポジトリ走査テスト |
    47	| プロバイダ選択 | `src/lib/ai/model.ts` | 環境変数の Zod 検証テスト |
    48	| 入力上限・レート | `src/lib/ai/limits.ts`（段 8） | 400 / 413 / 429 のテスト |
    49	
    50	## Naming Conventions
    51	
    52	- **spec**: `specs/<NNN>-<slug>/`。NNN は段番号（001〜008）、計画外の作業は 009 以降を順に使う。
    53	- **解説**: `docs/stages/<n>-<slug>.md`。`n` は先頭ゼロなしの段番号、`slug` は spec と揃える。
    54	- **Node 27 記録**: `docs/node27/YYYY-MM-DD-<topic>.md`。見出しは「結論 / 検証した版 / 通したゲート /
    55	  未解決事項 / 再現手順」。
    56	- **ソース・テスト**: kebab-case のファイル名（`extract-task.ts`、`agent-approval.test.ts`）。
    57	  テストは `<subject>.test.ts`。
    58	- **シンボル**: 関数・変数は camelCase（`createGuardedAgent`）、型は PascalCase。
    59	- **E2E タグ**: pre-push で走らせる 1〜2 本に `@smoke` を付ける。
    60	- **言語**: spec・解説・steering の散文は日本語。コード・識別子・コメント・パス・コミットは英語。
    61	  ルートの `AGENTS.md` は英語。
    62	
    63	## Import / Dependency Rules
    64	
    65	- `src/app/` は `src/lib/ai/` を呼んでよい。逆方向（`lib` → `app`）は持たない。
    66	- `src/lib/ai/` のうち API キー参照や AI 呼び出しを含むモジュールは `server-only` を import し、
    67	  クライアントコンポーネントから import しない。
    68	- `"use client"` のコンポーネントは対話が必要な末端に置き、サーバー専用モジュールに依存しない。
    69	- LLM を呼ぶ関数はモデルを引数で受け取る。モジュール内でプロバイダを直接生成しない
    70	  （生成は `model.ts` に集約）。
    71	- テストは実 LLM・実ネットワークに依存しない。
    72	
    73	## Where Things Go
    74	
    75	- 新しい段 → `specs/<NNN>-<slug>/` + `docs/stages/<n>-<slug>.md` + `src/` の実装 + `tests/` の合格テスト
    76	- 新しい AI ロジック → `src/lib/ai/<concept>.ts`（責務ごとに 1 ファイル）
    77	- 新しいルート / ページ → `src/app/`（ルートハンドラは境界で Zod 検証する）
    78	- リポジトリ全体の規約検査（禁止 API・モデル ID の走査など）→ `scripts/` か `tests/unit/` の走査テスト
    79	- テスト → `tests/unit/`（Vitest）または `tests/e2e/`（Playwright）。ソースの隣には置かない
    80	- 段の範囲外になった内容 → 実装せず、卒業先の該当モジュールへのリンクを解説に書く

**Figuring out user requirements**

I see that the user wants a merge of tech and struct, but the output appears truncated. I’ve combined tech and struct but there seems to be a discrepancy in the numbers. The user mentioned lines should be separate, but the output combines them into 174, while it initially suggested 3345, which is confusing. I need to ensure that line headings are clearly separated to meet the user's needs accurately. Let's clarify this!
exec
/bin/zsh -lc "nl -ba .sdd/steering/tech.md | sed -n '39,160p'; printf '%s\\n' '--- structure complete ---'; nl -ba .sdd/steering/structure.md" in /Users/Shared/codes/genai-lab-ts
 succeeded in 110ms:
    39	## Conventions
    40	
    41	- **Commands**: `mise run <task>` → `pnpm exec <cmd>` の順。素のツールを直接実行しない。
    42	- **Gate command**: `mise run verify`（lint・format チェック・typecheck・セキュリティ・テスト）。
    43	  `mise run gate` は `verify` の別名として定義する。フックと CI は同じものを実行する。
    44	- **Preflight command**: なし（段 1 で必要性を判断）。フックは mise を有効にした環境が前提。
    45	- **Typing**: TS `strict`。`any`（Biome `noExplicitAny`）と根拠のない型アサーションを入れない。
    46	  Biome の `noUnusedVariables` / `noUnusedImports` / `noExplicitAny` は `error`。
    47	- **Boundaries**: HTTP リクエスト・環境変数・ツール入力・LLM 構造化出力は Zod で検証する。
    48	  リクエストスキーマは厳格（未知フィールドを拒否）。内部では検証済みの型を信頼する。
    49	- **Model injection**: LLM を呼ぶ関数はモデルを引数で受け取る。
    50	
    51	  ```ts
    52	  // Pattern: the caller decides the model; tests pass a mock.
    53	  export async function summarize(model: LanguageModel, input: string) { /* ... */ }
    54	  ```
    55	
    56	- **Structured output**: `Output.object({ schema })` を使う。`generateObject` / `streamObject` は使わない。
    57	- **Agents**: `createGuardedAgent`（`src/lib/ai/agent.ts`）経由でのみ作る。停止条件はステップ数・
    58	  累積トークン・実行時間の 3 種。停止理由は閉じた語彙
    59	  `completed | step-limit | token-budget | timeout | aborted | error`。
    60	- **Tool approval**: 書き込み・破壊的なツールは `toolApproval` で承認待ち。要否はサーバー側で決める。
    61	- **Untrusted data**: ツール結果と外部入力はデータとして扱う。`eval` / `new Function` を使わない。
    62	- **Server / client**: RSC 既定。`"use client"` は対話が必要な末端だけ。API キー参照や AI 呼び出しの
    63	  モジュールは `server-only`。
    64	- **Errors**: テストが予期せず落ちたら、スキップ・リトライ・期待値の緩和ではなく原因を直す。
    65	- **Testing**: TDD（RED → GREEN → REFACTOR）。unit は `ai/test` のモックモデル、E2E は Playwright
    66	  `page.route` で UI message stream（SSE）をモックする。`passWithNoTests` を有効にしない。
    67	  テストは対象ロジックを壊すと落ちること（非空虚）を確認する。版番号をテストで検査しない。
    68	- **Logging**: 生のプロンプト、ツール引数の値、秘密情報をログに出さない。
    69	- **Commits**: Conventional Commits（英語）。版上げは `build(deps):` / `fix(security):` で、
    70	  advisory ID や release note を本文に書く。
    71	
    72	## Supply Chain
    73	
    74	- 依存とツールは exact pin。`latest` / `canary` / `beta` タグや範囲指定を使わない。
    75	- install スクリプトは既定で遮断し、`allowBuilds` で許可するものには理由を記す。
    76	- CI は `--frozen-lockfile`、`osv-scanner`、`pnpm audit --audit-level=high` を通す。
    77	- GitHub Actions の `uses:` はコミット SHA で固定し、ジョブごとに `permissions:` を最小にする。
    78	- gitleaks は pre-commit（ステージ済み、`--redact`）と CI（全履歴、`fetch-depth: 0`）で実行する。
    79	  `gitleaks dir` は使わない。
    80	- 新しい第三者依存・CI ジョブ・外部サービスは、plan に宣言してから追加する（憲章 原則 10）。
    81	
    82	## Constraints
    83	
    84	- `mise run verify` は API キーとネットワークを必要としない。同一コミットで常に同じ合否を返す。
    85	- API キーは環境変数からのみ、サーバー側でのみ参照する。`.env.example` は変数名だけを置く。
    86	- `AI_PROVIDER` / `AI_MODEL` は allowlist 内の値だけを受け付け、不正値は起動時に Zod で拒否する。
    87	- 段 8 以降、`/api/chat` は rate limit → body size → strict schema の順でモデル呼び出し前に拒否し、
    88	  件数・文字数・バイト数・レート・反復回数に明示的な上限を持つ（400 / 413 / 429）。
    89	- ライブラリの API・版・モデル ID に関する主張は、公式ドキュメントと実インストール・実行で確かめて
    90	  `research.md` の Evidence に残す。記憶や ZIP ガイドの記述を根拠にしない。
    91	- 未決: 分岐カバレッジのしきい値（TODO(BRANCH_COVERAGE)）、pre-push E2E の時間上限
    92	  （TODO(E2E_BUDGET)、目安 60 秒）。
--- structure complete ---
     1	# Structure
     2	
     3	コードの置き方のパターン。ファイルツリーを列挙せず、パターンと例を残す。
     4	
     5	> 状態（2026-11-22）: コード未作成。以下は spec 000 の計画（§5、§8.5）に基づく予定の構成で、
     6	> 段 1 で足場を取り込んだあとに実物と照合して更新する。
     7	
     8	## Organization Pattern
     9	
    10	**段（stage）単位の積み上げ。** 1 つの段は、互いに参照し合う 4 点で完成する（憲章 原則 2）。
    11	
    12	```
    13	specs/005-tools-approval/          # 要件・設計・タスク（spec 番号 = 段番号）
    14	docs/stages/5-tools-approval.md    # 解説: 読む → 動かす → 改造する → テストで合格を確かめる
    15	src/lib/ai/agent.ts                # 実装（段が持つ責務の単一の置き場）
    16	tests/unit/agent-approval.test.ts  # 合格判定テスト（解説から参照される）
    17	```
    18	
    19	アプリ自体は単一の Next.js App Router アプリ。AI 関連のロジックは `src/lib/ai/` に、UI と
    20	ルートハンドラは `src/app/` に分ける。
    21	
    22	## Directory Map (high level)
    23	
    24	| Path | Holds |
    25	|------|-------|
    26	| `src/app/` | App Router のページとルートハンドラ（例: `api/chat/route.ts`） |
    27	| `src/lib/ai/` | LLM 呼び出し・構造化出力・エージェント・プロバイダ・上限などのサーバー側ロジック |
    28	| `tests/unit/` | Vitest。モックモデルでロジックを検証 |
    29	| `tests/e2e/` | Playwright。`/api/chat` を SSE モックして UI フローを検証 |
    30	| `scripts/` | 実行用の小さなスクリプトとリポジトリ検査（例: `check-model-ids.mjs`、`hello.ts`） |
    31	| `docs/stages/` | 段ごとの解説 |
    32	| `docs/node27/` | Node 27 alpha の検証記録（1 検証 1 ファイル） |
    33	| `specs/` | `000-development-plan/`（全体計画）と各段の spec |
    34	| `.github/workflows/` | `ci.yml`（verify / verify-node27）、`security-daily.yml` |
    35	
    36	ルート直下の設定ファイル（`mise.toml`、`package.json`、`pnpm-workspace.yaml`、`lefthook.yml`、
    37	`biome.json`、`tsconfig.json`、各テストランナー設定）は版とゲートの正本。
    38	
    39	## Single Points of Definition
    40	
    41	規約を 1 か所に集約し、検査で守らせるもの。新しいコードはここを経由する。
    42	
    43	| 概念 | 唯一の置き場 | 守らせる検査 |
    44	|------|--------------|--------------|
    45	| モデル ID | `src/lib/ai/model-allowlist.ts` | `check:model-ids`（テスト fixture は除く） |
    46	| エージェント生成 | `src/lib/ai/agent.ts` の `createGuardedAgent` | `new ToolLoopAgent` のリポジトリ走査テスト |
    47	| プロバイダ選択 | `src/lib/ai/model.ts` | 環境変数の Zod 検証テスト |
    48	| 入力上限・レート | `src/lib/ai/limits.ts`（段 8） | 400 / 413 / 429 のテスト |
    49	
    50	## Naming Conventions
    51	
    52	- **spec**: `specs/<NNN>-<slug>/`。NNN は段番号（001〜008）、計画外の作業は 009 以降を順に使う。
    53	- **解説**: `docs/stages/<n>-<slug>.md`。`n` は先頭ゼロなしの段番号、`slug` は spec と揃える。
    54	- **Node 27 記録**: `docs/node27/YYYY-MM-DD-<topic>.md`。見出しは「結論 / 検証した版 / 通したゲート /
    55	  未解決事項 / 再現手順」。
    56	- **ソース・テスト**: kebab-case のファイル名（`extract-task.ts`、`agent-approval.test.ts`）。
    57	  テストは `<subject>.test.ts`。
    58	- **シンボル**: 関数・変数は camelCase（`createGuardedAgent`）、型は PascalCase。
    59	- **E2E タグ**: pre-push で走らせる 1〜2 本に `@smoke` を付ける。
    60	- **言語**: spec・解説・steering の散文は日本語。コード・識別子・コメント・パス・コミットは英語。
    61	  ルートの `AGENTS.md` は英語。
    62	
    63	## Import / Dependency Rules
    64	
    65	- `src/app/` は `src/lib/ai/` を呼んでよい。逆方向（`lib` → `app`）は持たない。
    66	- `src/lib/ai/` のうち API キー参照や AI 呼び出しを含むモジュールは `server-only` を import し、
    67	  クライアントコンポーネントから import しない。
    68	- `"use client"` のコンポーネントは対話が必要な末端に置き、サーバー専用モジュールに依存しない。
    69	- LLM を呼ぶ関数はモデルを引数で受け取る。モジュール内でプロバイダを直接生成しない
    70	  （生成は `model.ts` に集約）。
    71	- テストは実 LLM・実ネットワークに依存しない。
    72	
    73	## Where Things Go
    74	
    75	- 新しい段 → `specs/<NNN>-<slug>/` + `docs/stages/<n>-<slug>.md` + `src/` の実装 + `tests/` の合格テスト
    76	- 新しい AI ロジック → `src/lib/ai/<concept>.ts`（責務ごとに 1 ファイル）
    77	- 新しいルート / ページ → `src/app/`（ルートハンドラは境界で Zod 検証する）
    78	- リポジトリ全体の規約検査（禁止 API・モデル ID の走査など）→ `scripts/` か `tests/unit/` の走査テスト
    79	- テスト → `tests/unit/`（Vitest）または `tests/e2e/`（Playwright）。ソースの隣には置かない
    80	- 段の範囲外になった内容 → 実装せず、卒業先の該当モジュールへのリンクを解説に書く

exec
/bin/zsh -lc "printf '%s\\n' '--- round 1 ---'; nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review.md; printf '%s\\n' '--- round 2 ---'; nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
--- round 1 ---
     1	HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
     2	reviewer: sdd-reviewer (codex unavailable: not logged in)
     3	
     4	# 001-dev-environment-and-gates — Plan Review（/sdd-validate-plan Step 3.5、round 1）
     5	
     6	- 対象: `specs/001-dev-environment-and-gates/plan.md`（未コミット、840 行）、`research.md`、`spec.md`
     7	- 参照: `.sdd/memory/constitution.md` 1.0.0、`.sdd/steering/*.md`、`AGENTS.md`、`specs/000-development-plan/plan.md`
     8	- prior reviews: なし（`.sdd/reviews/` は本ファイルが最初）
     9	- Risk trigger: なし（タスク生成前の plan 相互レビュー）。**注記**: Codex が使えないため Claude が代行した。
    10	  plan の作成者も Claude 系なら、これは憲章 原則 11 / AGENTS.md の「別モデルファミリーによるレビュー」を
    11	  満たさない（finding 29）。
    12	
    13	## 実測（probe）の要約
    14	
    15	scratchpad で実行（リポジトリは変更していない）。
    16	
    17	| Probe | 結果 |
    18	|-------|------|
    19	| `vite.mergeConfig({test:{include:[A]}},{test:{include:[B]}})`（vite 8.3.8） | `include: [A, B]`。配列は**連結**され、置き換えにならない |
    20	| lefthook 2.2.2: `assert_lefthook_installed: true`、ステージ済みファイルなし、`PATH=/usr/bin:/bin` で `.git/hooks/pre-commit` | `(skip) no matching staged files` → **exit 0** |
    21	| 同上、ファイルをステージ | gitleaks が 127 → exit 1。`assert_lefthook_installed` を消しても同じ（フックに埋め込まれた絶対パスで lefthook が起動するため） |
    22	| `lefthook dump --format=json` | `assert_lefthook_installed`、`pre-commit.parallel`、`pre-push.piped`、`jobs[].{name,run}` が取れる。`{1}` はそのまま。dump を `lefthook.json` として読み戻せる |
    23	| gitleaks 8.30.1 `gitleaks git --redact`（HEAD は clean。秘密値はローカルの別ブランチ、または stash にだけある） | どちらも **exit 1**。ブランチを消すと exit 0。HEAD ではなく `--all` のローカル ref を走査している |
    24	| `mise ls --current --json`（mise 2026.11.12、一時プロジェクト） | ユーザー全体設定のツール（`deno latest`、`pnpm latest`、`node 26` など）が `source.path=~/.config/mise/config.toml` 付きで混ざる |
    25	| `mise tasks ls --json` | `aliases`、`run` が取れる。`run = [{task="check"}, …]` の要素は**オブジェクト**になる。どちらの書き方でも最初の失敗で止まり、同じ終了コードを返す |
    26	| `pnpm config get <key> --json`（pnpm 12.22.0） | `pnpm-workspace.yaml` の `minimumReleaseAge`、`savePrefix`、`allowBuilds` を読める。`strictDepBuilds` は `null`（未設定のときは報告されない） |
    27	| `git commit`（`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_*` を除いた状態、macOS） | ホスト名から作った identity で成功した。Linux ランナーでは「unable to auto-detect email address」になる見込み（未実測） |
    28	
    29	Playwright の `--list` / `test.fail()` の probe は、権限の都合で実行できなかった（該当する finding は確信度で区別した）。
    30	
    31	## Critique
    32	
    33	### [HIGH] CI が依存の install 前に `mise run runtime` を実行し、`pnpm exec tsc -v` / `pnpm exec next --version` で失敗する
    34	**Location**: specs/001-dev-environment-and-gates/plan.md:332
    35	**Issue**: `runtime` タスクは `node_modules` に入る bin（tsc、next）を呼ぶ。CI はこれを `pnpm install --frozen-lockfile` の前に実行するので、必須ジョブ `verify` が最初のステップで赤くなる。
    36	**Evidence**: 「mise-action（SHA 固定、mise 本体の版も exact 指定）→ `mise run runtime` → `pnpm install --frozen-lockfile` →」と、C5 の「`runtime`: … `pnpm exec tsc -v`、`pnpm exec next --version` …」。Interfaces の CI 表でも「runtime → install（frozen）→ browsers → verify」。
    37	**Confidence**: high
    38	**Proof**: クリーンな checkout で `mise install && mise run runtime` を実行する → `pnpm exec tsc` が "Command not found" で非 0（`run` 配列は最初の失敗で止まる。probe で確認済み）。
    39	**Fix**: CI の順序を `mise-action → pnpm install --frozen-lockfile → mise run runtime → playwright install → verify → security` に変える。verify-node27 も同じにする。security-daily で runtime を使う場合も install の後に置く。
    40	
    41	### [HIGH] E2E 通信ガードの自己検査が `test.fail()` に頼っており、どんな失敗でも合格になる（空振り）
    42	**Location**: specs/001-dev-environment-and-gates/plan.md:313
    43	**Issue**: `test.fail()` は失敗の原因を区別しない。ガードが壊れても、`.invalid` への `fetch` は DNS エラーで reject する（オフラインでも同じ）。そのためテスト本体が throw するか、遷移やセレクタのタイムアウトで落ちれば「期待どおりの失敗」として緑になる。3.11 / 9.6 の根拠として非空虚ではない。
    44	**Evidence**: 「`test.fail()`。`/` を開いてページ内から外部オリジン（`.invalid` ドメイン）へ `fetch` する。ガードが働けば teardown で失敗し、期待どおりの失敗として合格する。ガードが壊れると『予期せず成功』で失敗する」。research の Risks にも「`test.fail()` が auto fixture の teardown 失敗を『期待どおりの失敗』として扱うか未確認」とある。
    45	**Confidence**: high（`test.fail()` が原因を問わないことは Playwright の仕様。teardown の扱いは未確認）
    46	**Proof**: fixture の `route.abort` と記録を消す（ガードを壊す）→ ページ内の `fetch('https://x.invalid')` が `TypeError: Failed to fetch` で reject → `page.evaluate` が throw → `test.fail()` の下で合格。
    47	**Fix**: `test.fail()` をやめる。fixture に「違反の一覧を公開し、teardown で失敗させるかどうかを切り替えるオプション」（例: `networkGuardMode: "record"`）を足し、自己検査ではページ内の fetch の reject を握りつぶしたうえで `expect(violations).toEqual([{ method: "GET", url: … }])` と直接確かめる。別案として、unit 側（`network-guard.test.ts`）と同じように入れ子の `playwright test` で fixture spec を実行し、非 0 と、ガードに固有のエラーメッセージが出力に含まれることを確かめる。
    48	
    49	### [HIGH] 入れ子実行の fixture 設定を `mergeConfig` で作ると `include` が連結され、unit スイート全体（自分自身を含む）が再帰的に実行されうる
    50	**Location**: specs/001-dev-environment-and-gates/plan.md:273
    51	**Issue**: Vite / Vitest の `mergeConfig` は配列を連結する。そのため fixture 設定の `include` は `["tests/unit/**/*.test.ts", "tests/fixtures/gate/…"]` になる。CLI のファイル指定を忘れたり、`network` のように本体のテストファイルにも一致する指定をしたりすると、`network-guard.test.ts` が自分を入れ子で起動し、プロセスが増え続ける。
    52	**Evidence**: 「実設定を `mergeConfig` した `tests/fixtures/gate/vitest.fixture.config.ts` で、入れ子の `vitest run` を 2 回起動する」「ファイル名は本体の `include`（`*.test.ts`）に一致させない」。後者は include が置き換わる前提で書かれているが、実際には置き換わらない。
    53	**Confidence**: high（連結は実測）/ medium（再帰が実際に起きるかは実装しだい）
    54	**Proof**: `node -e` で `mergeConfig({test:{include:['tests/unit/**/*.test.ts']}},{test:{include:['tests/fixtures/gate/*.fixture.ts']}}).test.include` を出力 → 2 要素（scratchpad の probe 出力）。
    55	**Fix**: fixture 設定では `mergeConfig` の後で `test.include` を**代入で上書き**し、fixture のファイルだけにする（`setupFiles` は実設定から引き継ぐ）。あわせて再帰を防ぐ: 入れ子の子に `GATE_NESTED=1` を渡し、入れ子を起動するテストはこの変数があれば即座に失敗する。`gate-self-check.test.ts` の (a) にも同じ防止を入れる。
    56	
    57	### [MEDIUM] 7.7 の実行時の検査（最小 PATH でフックを実行 → 非 0）が書いたとおりには成り立たず、`assert_lefthook_installed` の分岐も通らない
    58	**Location**: specs/001-dev-environment-and-gates/plan.md:294
    59	**Issue**: ステージ済みファイルがないと lefthook は全ジョブを skip して exit 0 になる。ステージしても、lefthook は埋め込まれた絶対パスで起動し、ジョブ側のツール不在（127）で落ちる。このため `assert_lefthook_installed` を消しても結果が変わらず、「lefthook が見つからない」分岐（mise の自動 prune で旧版が消えたときの典型例）を検査していない。
    60	**Evidence**: 「一時リポジトリに `lefthook.yml` を置いて `lefthook install` → … そのフックを `PATH=/usr/bin:/bin` で実行 → 非 0（7.7、I-4）」。research I-4 にも「埋め込みパスあり → exit=1（gitleaks 不在でジョブ失敗）」とある。
    61	**Confidence**: high（実測: ステージなし exit 0、ステージあり exit 1、assert の有無で差がない）
    62	**Proof**: 本レビューの probe。`assert_lefthook_installed` を外した `lefthook.yml` でも、ステージありの実行は exit 1 のまま。
    63	**Fix**: 2 つのケースに分ける。(1) ファイルをステージしてから最小 PATH で実行 → 非 0。(2) `LEFTHOOK_BIN=/nonexistent` を渡すか、フックの埋め込みパスを一時リポジトリ内で無効化して実行 → 非 0 で、出力に "Can't find lefthook" が含まれる。(2) は `assert_lefthook_installed: false` の対照で exit 0 になることも確かめる（非空虚）。
    64	
    65	### [MEDIUM] フック経由の秘密値テスト（C10 の 5）が、git の identity なしで commit する。Linux CI では両方のケースが非 0 になり、拒否の原因も確かめない
    66	**Location**: specs/001-dev-environment-and-gates/plan.md:244
    67	**Issue**: `isolatedEnv()` は `GIT_*` を除き、グローバル設定を `/dev/null` にするので `user.name` / `user.email` がない。macOS ではホスト名から作った identity で commit が通るが（実測）、Linux ランナーでは「unable to auto-detect email address」で失敗しうる。そうなると「偽キーの commit が非 0」は gitleaks と無関係に成立し、対照の「秘密値なしの commit が 0」だけが落ちる（プラットフォームで結果が変わる）。
    68	**Evidence**: 「偽キーを含む `git commit` が非 0、秘密値なしの `git commit` が 0 で終わることを確かめる」と、C6 の「`isolatedEnv()`（`GIT_*`、`GITLEAKS_*`、`LEFTHOOK*` を除き、`GIT_CONFIG_GLOBAL=/dev/null` …）」。
    69	**Confidence**: medium（macOS は実測、Linux は git の既知の挙動からの推定）
    70	**Proof**: ubuntu-24.04 で `env -u GIT_AUTHOR_EMAIL … GIT_CONFIG_GLOBAL=/dev/null git commit -m "feat: x"` を実行する（hostname にドメインがなければ fatal）。
    71	**Fix**: `isolatedEnv()` で `GIT_*` を除いた**後に**、`GIT_AUTHOR_NAME/EMAIL`、`GIT_COMMITTER_NAME/EMAIL` に固定の偽の値を入れる（または `git -c user.name=… -c user.email=… commit`）。拒否のケースでは、終了コードに加えて (a) `git rev-parse --verify HEAD` が失敗する、または HEAD が変わっていないこと（commit が作られていない）、(b) 出力に gitleaks の検出（RuleID など）があり、偽キーの値は含まれないことを確かめる。
    72	
    73	### [MEDIUM] 秘密値テストの gitleaks は一時リポジトリの既定設定で動き、リポジトリの実効設定とずれうる
    74	**Location**: specs/001-dev-environment-and-gates/plan.md:237
    75	**Issue**: gitleaks は設定を「`--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`」の順で探す。テストの target は一時リポジトリなので、本物のリポジトリに `.gitleaks.toml`（例: `disabledRules`、`useDefault = false`）があっても使われない。フックでは検出されない値が、テストでは検出されて緑になる。
    76	**Evidence**: 手順 6「リポジトリに `.gitleaksignore` がなく、gitleaks の設定ファイルに allowlist がないことを確かめる」（設定ファイルが存在しうる前提）。`gitleaks git --help` の "order of precedence … 4. (target path)/.gitleaks.toml"。
    77	**Confidence**: high
    78	**Proof**: リポジトリのルートに `[extend]\nuseDefault = true\ndisabledRules = ["github-pat"]` の `.gitleaks.toml` を置く → 実際の pre-commit は `ghp_…` を通すが、C10 のテストは緑のまま。
    79	**Fix**: 方針を 1 つ決めて plan に書く。案 A: リポジトリに gitleaks の設定ファイルを置かないこととし、テストでその不在を確かめる。案 B: リポジトリの `.gitleaks.toml` があれば一時リポジトリへコピーしてから実行する。あわせて、8.5 の「インライン除外コメントを使わない」を機械的に守らせるため、secrets ジョブと `check:secrets` に `--ignore-gitleaks-allow` を付ける（hooks-config の検査対象にも加える）。
    80	
    81	### [MEDIUM] `check:secrets`（`gitleaks git`）は HEAD ではなく、すべてのローカル ref（別ブランチ、stash）を走査する。verify の合否が「同一コミット」で決まらない
    82	**Location**: specs/001-dev-environment-and-gates/plan.md:460
    83	**Issue**: `--log-opts` を指定しない `gitleaks git` は `--all` 相当で走査する。そのため、開発者の手元のブランチや stash にある値で、どのブランチの verify も赤くなる。CI では checkout が取得した ref だけが対象になるので、手元と CI の結果も一致しない。
    84	**Evidence**: spec 3.7「同一コミット・同一環境で … 3 回とも同じ合否」と NFR「同一コミットで同じ合否を返す」。plan の表「`check:secrets` | `gitleaks git --redact --verbose`（全履歴）」。
    85	**Confidence**: high（実測: HEAD は clean で、秘密値がローカルブランチや stash にだけあっても exit 1）
    86	**Proof**: 本レビューの probe（`gl-refs.sh`）。
    87	**Fix**: 「全履歴」の範囲を決めて plan と research に書く（例: `--log-opts="--full-history HEAD"` で HEAD から到達できる履歴だけを走査し、他のブランチは各ブランチの CI で検査する）。現状の `--all` を保つなら、ローカル ref に依存することを 3.7 の例外として明記し、spec 側で判断する（ユーザー判断）。
    88	
    89	### [MEDIUM] `mise ls --current --json` にユーザー全体設定のツールが混ざり、1.1 の検査が開発機で落ちるか、漏れる
    90	**Location**: specs/001-dev-environment-and-gates/plan.md:298
    91	**Issue**: `mise ls --current` はグローバル設定のツール（`latest`、`26` など）も返す。そのまま「exact で `latest` を含まない」と検査すると、この開発機では必ず落ち、CI では通る。逆にツールを source で絞らないと、プロジェクトの `mise.toml` に書き忘れたツールをグローバル設定が黙って補い、検出できない。CI の verify-node27 ジョブは `MISE_ENV=node27` を継承するので、「既定レーン」の照会も node27 になり、11.1 の比較が自明に真になる。
    92	**Evidence**: 「`mise ls --current --json` の要求版が exact で `latest` を含まない（既定レーンと `MISE_ENV=node27` の両方）（1.1）。2 つのレーンで node 以外のツールの版が等しい（11.1）」。
    93	**Confidence**: high（実測: `deno latest`、`pnpm latest`、`node 26` が `~/.config/mise/config.toml` 由来で出力された）
    94	**Proof**: 本レビューの probe（`mise1.sh`）。
    95	**Fix**: `source.path` がリポジトリの `mise.toml` / `mise.node27.toml` のものだけを対象にする。必須の 5 ツール（node、pnpm、lefthook、gitleaks、osv-scanner）がすべてプロジェクトのファイル由来であることを確かめる。子プロセスの環境では、既定レーンは `MISE_ENV` を削除し、Node 27 レーンは `MISE_ENV=node27` を明示する。グローバル設定を無効にしたい場合は `MISE_GLOBAL_CONFIG_FILE=/dev/null` も検討する。
    96	
    97	### [MEDIUM] 3.8 / 3.9 は「ファイル 0 件 / 一致 0 件」だけを扱い、「実行 0 件（全部 skip）」が緑のまま通る
    98	**Location**: specs/001-dev-environment-and-gates/plan.md:624
    99	**Issue**: Vitest は、テストがすべて `skip` / `todo` なら exit 0 で終わる。Playwright も、`@smoke` のテストがすべて `test.skip` なら exit 0 になる。spec は「実行件数が 0 件」を失敗と定めているが、plan の仕組み（`passWithNoTests: false`、`--pass-with-no-tests` を付けない）と自己検査は、ファイルや grep の一致が 0 件の場合しか扱わない。
   100	**Evidence**: spec 3.8「unit テストの**実行件数**が 0 件だった場合 … 非 0」、3.9「`@smoke` に一致する E2E テストが 0 件」。plan「unit テストファイルが 0 件 → Vitest が非 0」。
   101	**Confidence**: medium（Vitest / Playwright が skip のみで exit 0 になるのは既知の挙動。この環境では未実測）
   102	**Proof**: すべての `it` を `it.skip` にして `pnpm exec vitest run` → exit 0。
   103	**Fix**: 実行件数を数えて判定する。例: Vitest は JSON reporter（または custom reporter）で `numPassedTests + numFailedTests > 0` を確かめ、0 なら失敗させる。Playwright は `--reporter=json` の `stats.expected + unexpected > 0`、または `globalTeardown` で数える。さらに `skip` / `todo` を禁止する Biome ルール（`noSkippedTests` など）を検討する。自己検査に「全 skip → 非 0」のケースを加える。
   104	
   105	### [MEDIUM] 0 件の自己検査が `test` / `e2e` タスクの定義を通らず、タスクに足したフラグで穴が開いても検出できない
   106	**Location**: specs/001-dev-environment-and-gates/plan.md:277
   107	**Issue**: (a) は「実際の `vitest.config.ts` のまま」の `vitest run`、(b) は `playwright test --list` を直接起動する。`mise.toml` の `test` に `--passWithNoTests`、`e2e` に `--pass-with-no-tests` を足しても、自己検査は緑のままになる。また `--list` は本番の実行経路と違う。
   108	**Evidence**: 「(a) 実際の `vitest.config.ts` のまま、対象が 0 件になる選択で入れ子の `vitest run` → 非 0（3.8）。(b) `playwright test --list --grep <一致しないタグ>` → 非 0」。
   109	**Confidence**: high
   110	**Proof**: `mise.toml` の `[tasks.test] run` を `pnpm exec vitest run --passWithNoTests` に変える → `gate-self-check.test.ts` は緑のまま、verify も緑。
   111	**Fix**: `mise tasks ls --json` から `test` / `e2e` の `run` を取り出す。`hooks-config.test.ts` で、`--passWithNoTests`、`--pass-with-no-tests`、`--retries`、`--last-failed`、`--only-changed` などが含まれないことを確かめる。0 件の実行も、そのコマンドの argv に一致しないフィルタを足して行う。Playwright で `--list` を使うなら、`--list` が本番経路と同じ「No tests found」判定を通ることを R-9 で実測する。
   112	
   113	### [MEDIUM] verify が 6 つの構成要素をすべて含むことを検査していない（例: e2e を外しても緑）
   114	**Location**: specs/001-dev-environment-and-gates/plan.md:291
   115	**Issue**: hooks-config は「`gate` 別名」と「security 系を参照しない」だけを確かめる。verify の `run` から `e2e` や `check:secrets` を消しても、自動テストも CI も緑のまま。3.1 の根拠は「CI `verify` ジョブ、R-3」だけで、CI が緑であることは e2e が実行されたことを示さない。
   116	**Evidence**: 「`verify` の別名に `gate` があり（3.3）、`verify` の構成要素が `security` 系を参照せず（3.6）」とトレーサビリティ「3.1 | C3 | CI `verify` ジョブ、R-3」。
   117	**Confidence**: high
   118	**Proof**: `[tasks.verify] run` から `{task="e2e"}` を削除 → `mise run verify` は緑のまま、テストも落ちない。
   119	**Fix**: hooks-config で、`verify` の `run` が `check`、`typecheck`、`check:model-ids`、`check:secrets`、`test`、`e2e` をこの順で**ちょうど**参照すること（`{task=…}` の形も `mise run …` の形も受ける）、`security` が `security:osv` と `security:audit` を参照することを確かめる。ci.yml が `mise run verify` と `mise run security` を含むことも regex で確かめる（10.1）。
   120	
   121	### [MEDIUM] 2.4 / 2.5（`any`・未使用・型エラーで verify が非 0）は一度きりの記録 R-10 だけで、設定の後退を検出できない
   122	**Location**: specs/001-dev-environment-and-gates/plan.md:747
   123	**Issue**: `biome.json` の `files.includes` から `src/` や `tests/` が外れたり、`tsconfig.json` の `include` が縮んだりしても、verify は緑のまま。repo-policy はルールの重大度（2.2）と `strict`（2.3）しか見ないので、実際にその規則が適用されていることは確かめていない。
   124	**Evidence**: 「2.4 | C2, C3 | R-10（`any`・未使用変数・未使用 import を入れて verify が非 0）」「2.5 | … | R-10」。
   125	**Confidence**: high
   126	**Proof**: `biome.json` の `files.includes` を `["*.json"]` にする → `src/` の `any` が素通りし、どのテストも落ちない。
   127	**Fix**: 安い自動テストを足す。一時ディレクトリに実際の `biome.json` / `tsconfig.json` と、`src/x.ts` / `tests/unit/x.test.ts` 相当の違反ファイルを置き、`pnpm exec biome check` と `tsc --noEmit -p` が非 0 になることを確かめる（対照として違反なしでは 0）。または `biome check --stdin-file-path=src/probe.ts` で `noExplicitAny` などのルール名が出ることを確かめる。
   128	
   129	### [MEDIUM] 子プロセスの多い unit テストに Vitest 既定の `testTimeout`（5 秒）が適用され、決定論（3.7）を損なう
   130	**Location**: specs/001-dev-environment-and-gates/plan.md:170
   131	**Issue**: 入れ子の `vitest run`（3 回）、`playwright test --list`、`lefthook install` と commit、gitleaks、`mise tasks ls`、`pnpm config get` を、並列のワーカーから同時に実行する。既定の 5 秒では、CI や負荷の高い開発機でタイムアウトし、緑と赤が入れ替わりうる。
   132	**Evidence**: `vitest.config.ts` の契約に `testTimeout` がない（`include`、`environment`、`setupFiles`、`passWithNoTests`、`allowOnly`、`resolve.alias` だけ）。`runCommand()` は「タイムアウト付き」だが、テスト自体の上限は既定のまま。
   133	**Confidence**: medium
   134	**Proof**: CI（ubuntu-24.04、2 vCPU）で `mise run test` を 3 回実行し、`network-guard.test.ts` / `gate-self-check.test.ts` の所要時間を見る（R-11 で測る）。
   135	**Fix**: 子プロセスを使うテストファイルに明示的な `testTimeout` を付け（実測にもとづく値）、`runCommand` のタイムアウトはそれより短くする。入れ子のワーカー数は `--pool=forks --maxWorkers=1` などで抑える。R-3 の 3 回連続実行は CI でも行う。
   136	
   137	### [MEDIUM] 憲章の改訂を PATCH としているが、原則 3 の「唯一の検証入口」の再定義にあたる
   138	**Location**: specs/001-dev-environment-and-gates/plan.md:403
   139	**Issue**: 原則 3 は「verify は … セキュリティ検査 … を 1 コマンドで実行する唯一の検証入口」と定めている。security を別の入口に分けるのは、表現の明確化ではなく原則の再定義である。Governance の Versioning policy では MAJOR（再定義）か、少なくとも MINOR（実質的な変更）にあたる。
   140	**Evidence**: 憲章「MAJOR: 後方非互換な変更（原則の削除・再定義）… PATCH: 明確化・表現修正」と spec 13.7「原則 3 を … PATCH 改訂し」。plan「原則 3 の PATCH 改訂（1.0.0 → 1.0.1）」。
   141	**Confidence**: medium（分類の解釈）
   142	**Proof**: 改訂前後の原則 3 の文言を比べる。「verify が唯一の入口でセキュリティを含む」が「verify と security の 2 入口」に変わる。
   143	**Fix**: spec の判断が要る（spec 側の変更。ユーザー判断）。13.7 を MINOR（1.1.0）に変えるか、PATCH とする理由（例: 「pre-push と CI 必須ジョブが両方を実行するので、保証は減らない」）を Sync Impact Report に書く。plan の Constitution Compliance の行もそれに合わせる。
   144	
   145	### [MEDIUM] `CLAUDE.md` がリポジトリに存在しないため、13.11 と File Structure の「CLAUDE.md を変更せずにコミット」が実行できない
   146	**Location**: specs/001-dev-environment-and-gates/plan.md:597
   147	**Issue**: リポジトリには `CLAUDE.md` がどこにもない（`git status` の未追跡は `.sdd/`、`AGENTS.md`、`specs/001-…` だけ）。spec の前提「`AGENTS.md` / `CLAUDE.md` は … 作成済み（未コミット）」が事実と食い違う。
   148	**Evidence**: plan「`CLAUDE.md` | Commit | 変更せずに本 spec の PR に含める」と spec 13.11「未コミットの憲章、steering、`AGENTS.md`、`CLAUDE.md` を含める」。
   149	**Confidence**: high
   150	**Proof**: `ls /Users/Shared/codes/genai-lab-ts/CLAUDE.md` → No such file。`find . -name CLAUDE.md` → 0 件。
   151	**Fix**: spec の判断が要る（ユーザー判断）。(a) `CLAUDE.md`（例: `@AGENTS.md` を取り込むだけの 1 行）を作り、File Structure を「Create」に直す。(b) 13.11 から `CLAUDE.md` を外す。どちらかを決めて spec と plan を揃える。
   152	
   153	### [LOW] ファイル一覧をループで検査するテストが、対象 0 件で空振りする（zero-case）
   154	**Location**: specs/001-dev-environment-and-gates/plan.md:310
   155	**Issue**: `docs/stages/*.md` や `docs/node27/*.md` が 0 件なら、見出しの検査は何もせずに通る（11.5 は 1 件以上を求める）。`uses:` の SHA 検査も、regex が 1 行も拾わなければ通る。13.2 の「本文中の `tests/…` のパスがすべて実在」も、パスが 0 件なら通る。
   156	**Evidence**: 「`docs/stages/*.md` が … 順の見出しを持ち（13.1）、本文中の `tests/…` のパスがすべて実在する（13.2）。`docs/node27/*.md` が 5 つの見出しを持つ（11.5）」「ワークフローのすべての `uses:` が 40 桁の SHA で固定」。
   157	**Confidence**: high
   158	**Proof**: `docs/node27/` を空にする → `docs-structure.test.ts` は緑。
   159	**Fix**: 件数の下限を確かめる。`docs/stages/1-dev-environment-and-gates.md` が存在する、`docs/node27/*.md` が 1 件以上、`uses:` が 1 件以上、13.2 の 2 つの合格条件それぞれに参照パスが 1 件以上ある。
   160	
   161	### [LOW] `runCommand()` の既定が `isolatedEnv()` ではなく、隔離が C10 にしか明記されていない
   162	**Location**: specs/001-dev-environment-and-gates/plan.md:248
   163	**Issue**: `check-model-ids.test.ts`（一時リポジトリで `git ls-files`）や `hooks-config.test.ts`（一時リポジトリで `lefthook install`）が pre-push の中で実行されると、`GIT_DIR` / `GIT_INDEX_FILE` を引き継ぐおそれがある。最悪の場合、`lefthook install` が本物のリポジトリのフックを書き換える。
   164	**Evidence**: C10「子プロセスは `isolatedEnv()` で実行する（I-6）」。C12 の各テストには隔離の記述がない。
   165	**Confidence**: medium
   166	**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、一時ディレクトリで `lefthook install` を実行する → 対象の git dir を確かめる。
   167	**Fix**: `runCommand()` の既定の環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。
   168	
   169	### [LOW] unit 通信ガードの検査が `afterEach` だけで、取りこぼす経路がある
   170	**Location**: specs/001-dev-environment-and-gates/plan.md:516
   171	**Issue**: `afterAll` や最後のテストの後に起きた違反（握りつぶされたもの）は検査されない。`dgram` と DNS 解決（`dns.lookup`）は遮断の対象外。入れ子の fixture の通信先も決まっていないので、ガードが壊れていると実際に外へ出る。
   172	**Evidence**: 「`afterEach` で違反が 1 件以上あれば、その内容でテストを失敗させ、記録を空にする」。
   173	**Confidence**: medium
   174	**Proof**: `afterAll(() => { try { fetch('http://127.0.0.1:9') } catch {} })` を持つテストファイル → 緑。
   175	**Fix**: setupFile の `afterAll` でも違反を検査する。`dgram.createSocket` と `dns.lookup` / `dns.promises` も置き換えるか、対象外であることを ADR-5 に書く。fixture の通信先は `.invalid` か `127.0.0.1:9` に固定する。
   176	
   177	### [LOW] E2E ガードはブラウザの HTTP だけを見ており、Next サーバー側からの外部通信と WebSocket を扱わない
   178	**Location**: specs/001-dev-environment-and-gates/plan.md:518
   179	**Issue**: `context.route` は、dev サーバーのプロセス（RSC やルートハンドラ）が出す外部通信を捕まえない。外部 WebSocket も `context.route` の対象外（`routeWebSocket` が必要）。段 1 では問題にならないが、段 003 以降で 3.5 / 3.11 の穴になる。
   180	**Evidence**: 「`networkGuard` は `context.route("**/*")` で受けたリクエストのうち、`baseURL` と異なるオリジンを `abort` して記録」。
   181	**Confidence**: medium
   182	**Proof**: RSC で `await fetch('https://example.com')` を行うページを E2E で開く → ガードは反応しない。
   183	**Fix**: この限界を ADR-5 に書く。外部 WebSocket の遮断（`context.routeWebSocket`）を足す。サーバー側については、webServer の env で外部通信が失敗する設定（例: Node の env proxy を閉じたポートへ向ける）を段 003 の plan で宣言する。
   184	
   185	### [LOW] security の検査に「本当に検査した」ことを示す正の対照がない（osv-scanner と pnpm 12 の lockfile）
   186	**Location**: specs/001-dev-environment-and-gates/plan.md:464
   187	**Issue**: R-4 は到達不能時の終了コードしか測らない。osv-scanner が pnpm 12 の lockfile を 0 パッケージとして読んでも exit 0 になりうるが、それを検出する手段がない。
   188	**Evidence**: 「R-4 security の失敗系（4.2〜4.4）: registry 到達不能時の `pnpm audit` / osv-scanner の終了コード」と、トレーサビリティ「4.2 | C4 | R-4」「4.3 | C4 | R-4」。
   189	**Confidence**: low（pnpm 12 の lockfile 形式への osv-scanner の対応は未確認）
   190	**Proof**: `osv-scanner scan source --lockfile=pnpm-lock.yaml --format=json` の出力に含まれるパッケージ数を、`pnpm ls --depth Infinity` の件数と比べる。
   191	**Fix**: R-4 に正の対照を加える。既知の脆弱な版を含む使い捨ての lockfile で両ツールが非 0 になること、実際の lockfile で走査したパッケージ数が 0 より大きいことを記録する。
   192	
   193	### [LOW] 安く自動化できる要件を「レビュー」に残している
   194	**Location**: specs/001-dev-environment-and-gates/plan.md:793
   195	**Issue**: 9.2（`page.tsx` に `"use client"` がない）、10.4（`continue-on-error`）、10.6（`fetch-depth: 0`）、10.7（`--frozen-lockfile`）、10.9（`permissions: {}` と各ジョブの `contents: read`）、10.11 / 10.12（`interval: weekly`、`cooldown.default-days`）は、repo-policy の regex で数行で検査できる。
   196	**Evidence**: トレーサビリティ「9.2 | C11 | レビュー」「10.6 | C13 | レビュー（`fetch-depth: 0`）」「10.9 | C13 | レビュー」「10.12 | C13 | レビュー（`cooldown.default-days: 1`）」。
   197	**Confidence**: high
   198	**Proof**: ci.yml から `fetch-depth: 0` を消す → どの自動テストも落ちず、CI の gitleaks は浅い履歴だけを走査して緑になる。
   199	**Fix**: `repo-policy.test.ts` にこれらの regex 検査を足す。特に 10.6 は、`check:secrets` の中で `git rev-parse --is-shallow-repository` が `false` であることも確かめる（浅い clone で全履歴の検査が空振りしない）。
   200	
   201	### [LOW] Data Model の `MiseTaskInfo.run: readonly string[]` が、タスク参照の形と合わない
   202	**Location**: specs/001-dev-environment-and-gates/plan.md:445
   203	**Issue**: `run = [{ task = "check" }, …]` を使うと、`mise tasks ls --json` の `run` の要素は `{ "task": "check" }` というオブジェクトになる。
   204	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」。
   205	**Confidence**: high（実測）
   206	**Proof**: probe の出力 `verify ['gate'] [{'task': 'check'}, {'task': 'fail'}, 'echo AFTER']`。
   207	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。verify の書き方（`{task=…}` か `mise run …` か）を ADR-1 で決める。
   208	
   209	### [LOW] Node 27 の worktree 手順に `mise trust` がない
   210	**Location**: specs/001-dev-environment-and-gates/plan.md:357
   211	**Issue**: 新しい worktree はパスが変わるので、mise の信頼の対象外になる。`mise install` は設定が信頼されていないとして失敗する。
   212	**Evidence**: 「`git worktree add --detach ../genai-lab-ts-node27 HEAD` で別 worktree を作り、`MISE_ENV=node27` で `mise install` → …」。
   213	**Confidence**: medium
   214	**Proof**: 新しい worktree で `MISE_ENV=node27 mise install` を実行する → 「not trusted」のエラー。
   215	**Fix**: README の手順に `mise trust`（worktree 側の `mise.toml` と `mise.node27.toml`）を加える。
   216	
   217	### [LOW] `strictDepBuilds` を既定値に頼っている
   218	**Location**: specs/001-dev-environment-and-gates/plan.md:672
   219	**Issue**: 1.5 の「既定で実行しない」は pnpm の既定値に依存する。`pnpm config get strictDepBuilds` は `null` を返すので、既定の変更や設定の上書きを検出できない。`passWithNoTests` には「既定と同じ値を明記」した方針があるが、ここには適用していない。
   220	**Evidence**: 「install スクリプトを持つ依存が `allowBuilds` にない → `strictDepBuilds` により install が非 0」。probe の `strictDepBuilds => null`。
   221	**Confidence**: medium
   222	**Proof**: `pnpm config get strictDepBuilds --json` → `null`。
   223	**Fix**: `pnpm-workspace.yaml` に `strictDepBuilds: true` を明記し、repo-policy で確かめる。`minimumReleaseAgeStrict: true` も同じように扱う。
   224	
   225	### [LOW] 8.6 のアサーションの書き方しだいで、失敗時のメッセージに偽キーが出る
   226	**Location**: specs/001-dev-environment-and-gates/plan.md:242
   227	**Issue**: `expect(output).not.toContain(key)` が失敗すると、Vitest は期待値として偽キーをそのまま表示する。CI のログに、本物らしい形の `ghp_…` が残る。
   228	**Evidence**: 「出力（stdout + stderr）に偽キーの値が含まれないことを確かめる（8.6）」。
   229	**Confidence**: medium
   230	**Proof**: 偽キーを含む文字列に対して `expect(s).not.toContain(key)` を失敗させる → 差分に key が表示される。
   231	**Fix**: `expect(output.includes(key)).toBe(false)` のように真偽値で比べ、メッセージにはキーの長さと prefix だけを出す。
   232	
   233	### [LOW] `lefthook-local.yml` が gitignore されておらず、`lefthook dump` はこれを合成する
   234	**Location**: specs/001-dev-environment-and-gates/plan.md:401
   235	**Issue**: `lefthook-local.yml` は手元でジョブを上書き・skip できる。dump はこれを合成するので、開発機の状態が hooks-config と C10 の結果を変える。誤ってコミットされるおそれもある。
   236	**Evidence**: research I-5「`lefthook-local.yml` などを合成した実際に使われる設定」。plan の `.gitignore` の追加項目に含まれていない。
   237	**Confidence**: medium
   238	**Proof**: `lefthook-local.yml` に `pre-commit: { jobs: [{ name: secrets, skip: true }] }` を置く → dump が変わり、実際のフックで secrets が skip される。
   239	**Fix**: `.gitignore` に `lefthook-local.yml` を加える。hooks-config で、合成後の secrets ジョブに `skip` がないことも確かめる。
   240	
   241	### [LOW] lefthook のフォールバック経路が、版を固定していない lefthook をネットワークから取得しうる
   242	**Location**: research.md:83
   243	**Issue**: 埋め込みパスが無効になると（この開発機では mise の自動 prune が有効）、フックは `mint run csjones/lefthook-plugin` や `uv run lefthook` などへ順に落ちる。そこで版を固定していない lefthook を取得・実行しうる。
   244	**Evidence**: probe で見た生成フックの `call_lefthook()`（`mint run …`、`uv run lefthook`、`swift package …`、`mise exec -- lefthook`）。research I-4「mise で lefthook を上げて旧版が消えると埋め込みパスが無効になり、PATH 探索に落ちる」。
   245	**Confidence**: medium
   246	**Proof**: lefthook を上げて旧版を prune する → `mint` がある環境でフックを実行する。
   247	**Fix**: README に「lefthook を上げたら `lefthook install` を再実行する」と書き、`mise run setup` に含める。この経路を research I-4 の副作用に記録する。
   248	
   249	### [LOW] 開発者の `next dev` が同じディレクトリで動いているときの pre-push E2E の挙動が未確認
   250	**Location**: specs/001-dev-environment-and-gates/plan.md:687
   251	**Issue**: plan は同じポートの場合だけを扱う。よくあるのは「別のポートで、同じプロジェクトの `next dev` が動いている」状態で、Next 16 の `.next/dev` のロックなどで 2 つ目が起動できないと、push の可否が手元の状態で変わる。
   252	**Evidence**: 「開発者の `next dev` が同じポートで動いている → `reuseExistingServer: false` と専用ポートで … 失敗として表面化する」。
   253	**Confidence**: low
   254	**Proof**: `pnpm exec next dev --port 3000` を起動したまま `mise run e2e` を実行する。
   255	**Fix**: R-3 か R-9 で実測する。衝突する場合は、webServer の `distDir` を分ける（例: 環境変数で `.next-e2e`）などの対処を plan に書く。
   256	
   257	### [LOW] TypeScript 7.1 beta（ネイティブ）が `tsc --showConfig` に対応しているか未確認
   258	**Location**: specs/001-dev-environment-and-gates/plan.md:304
   259	**Issue**: 2.3 の検査が、未検証の CLI フラグに依存している。
   260	**Evidence**: 「`tsc --showConfig` の `strict` が真（2.3）」。research に `--showConfig` の確認がない。
   261	**Confidence**: low
   262	**Proof**: `pnpm exec tsc --showConfig`（typescript@7.1.0-beta）の終了コードと出力。
   263	**Fix**: 実装時に確かめて research に記録する。対応していなければ `tsconfig.json` を JSONC として読む（コメントを除いて `JSON.parse`）。
   264	
   265	### [LOW] どの要件も求めていない `setup` タスク（Unrequested behavior）
   266	**Location**: specs/001-dev-environment-and-gates/plan.md:469
   267	**Issue**: `setup` タスクは 3.4 / 5.x / 13.3 のどれも要求しておらず、spec 000 §8.5 のタスク一覧にもない。README の手順をまとめるだけなので害は小さいが、plan での宣言だけで追加されている。
   268	**Evidence**: 「`setup` | `pnpm install --frozen-lockfile` → `pnpm exec playwright install chromium` → `lefthook install` | 必要 | README | 13.3」。
   269	**Confidence**: medium
   270	**Proof**: spec の要件を `setup` で検索 → 0 件。
   271	**Fix**: 残すなら、追加の理由を ADR に一行書く（13.3 の手順をコマンド 1 つにまとめるため）。spec 000 §8.5 の改訂注記（13.10）にも含める。
   272	
   273	### [LOW] 本レビューは別モデルファミリーによるレビューの要件を満たさない（プロセス）
   274	**Location**: .sdd/memory/constitution.md:209
   275	**Issue**: Codex が使えないので Claude が代行した。plan の作成者も Claude 系なら、AGENTS.md の Cross-Agent Review の前提（死角が同じ系統で重なる）を満たさない。
   276	**Evidence**: 憲章「作成者と異なるモデルファミリーで敵対的レビューを 1 回行う」と AGENTS.md「Codex reviews what Claude wrote」。
   277	**Confidence**: high
   278	**Proof**: `codex login status` → Not logged in（タスクの前提）。
   279	**Fix**: Codex が使えるようになったら、plan（または最初の実装フェーズ）を Codex で再レビューする。今回の代行は spec.json の承認記録か PR 本文に明記する。
   280	
   281	## 強み（判断材料）
   282	
   283	- 検査の定義を `mise.toml` に集約し、フックと CI はタスク名で呼ぶ設計（ADR-2）。`lefthook dump --format=json` と
   284	  `mise tasks ls --json` で機械的に突き合わせられることは実測で確認できた。
   285	- `assert_lefthook_installed` の必要性（I-4）と、フック実行中の `GIT_*` 環境の危険（I-6）を実測で押さえている。
   286	- unit の通信ガードの自己検査は、入れ子実行に対照（no-network）と出力メッセージの照合を持っており、非空虚の設計として妥当。
   287	  include の連結だけ直せばよい。
   288	- 偽キーを実行時に組み立て、allowlist を使わない方針は、要件 8 の意図に合っている。
   289	
   290	## GO / NO-GO
   291	
   292	**GO（条件付き）**。CRITICAL はない。HIGH の 3 件（CI の手順順序、`test.fail()` の空振り、`mergeConfig` の include 連結）は、
   293	tasks.md を作る前に plan へ反映すること。MEDIUM のうち CLAUDE.md の不在と憲章の版の分類は spec の判断（ユーザー）、
   294	gitleaks の走査範囲（`--all`）は設計判断が要る。
   295	
   296	## Verdict
   297	REQUEST_CHANGES
   298	
   299	## Hallucination Signal
   300	forced: false
   301	
   302	## Adjudication
   303	
   304	Orchestrator: Claude (/sdd-validate-plan). Codex unavailable (`codex login status`: Not logged in); this round is same-family and does not satisfy constitution principle 11's cross-family requirement.
   305	
   306	| Finding | Decision | Evidence |
   307	|---------|----------|----------|
   308	| [HIGH] CI runs `mise run runtime` before `pnpm install` | stands | plan.md:332 order `runtime → pnpm install`; runtime calls `pnpm exec tsc -v` / `next --version` |
   309	| [HIGH] E2E guard self-check relies on `test.fail()` | stands (raised independently by orchestrator) | plan.md:313; `test.fail()` accepts any failure cause |
   310	| [HIGH] `mergeConfig` concatenates `include` → recursive nested run | stands | reviewer probe: vite 8.3.8 `mergeConfig` yields 2-element include |
   311	| [MEDIUM] `check:secrets` scans all local refs | stands (raised independently by orchestrator) | orchestrator probe: gitleaks 8.30.1 debug `git log -p -U0 --full-history --all` |
   312	| [MEDIUM] Constitution amendment classed PATCH | escalated | Governance: "MAJOR: 原則の削除・再定義"; spec 13.7 fixes PATCH → user decision |
   313	| [MEDIUM] `CLAUDE.md` does not exist | escalated | `ls CLAUDE.md` → No such file; spec 13.11 requires committing it |
   314	| [MEDIUM] 7.7 minimal-PATH hook test is vacuous | stands | reviewer probe (lefthook 2.2.2) |
   315	| [MEDIUM] Hook-driven commit lacks git identity | stands | `GIT_CONFIG_GLOBAL=/dev/null` removes user.name/email |
   316	| [MEDIUM] gitleaks in temp repo ignores repo config | stands | reviewer probe |
   317	| [MEDIUM] `mise ls --current --json` mixes global tools | stands | reviewer probe (mise 2026.11.12) |
   318	| [MEDIUM] 0-executed (all skipped) not covered by 3.8/3.9 | stands | plan.md:624 checks file count only |
   319	| [MEDIUM] Zero-test self-check bypasses task definitions | stands | plan.md:277 invokes runner directly |
   320	| [MEDIUM] verify composition not fully checked | stands | plan.md:291 checks alias and absence of security only |
   321	| [MEDIUM] 2.4/2.5 evidenced only by one-off R-10 | stands | plan.md:747 |
   322	| [MEDIUM] Vitest default 5s testTimeout for subprocess tests | stands | plan.md:170 sets no timeout |
   323	| (orchestrator) [MEDIUM] mise shims fail with cwd outside project | stands | orchestrator probe: `lefthook version` in mktemp repo → `No version is set for shim` |
   324	| LOW items (16) | stands as notes | see Critique; none blocks task generation |
   325	
   326	Verdict after adjudication: REQUEST_CHANGES (3 HIGH stand). Plan-review decision: GO conditional on the HIGH fixes.
   327	
   328	## Resolution (2026-11-22, orchestrator)
   329	
   330	User decisions on escalated items: constitution amendment is MINOR (1.0.0 → 1.1.0) and spec 13.7 updated; `CLAUDE.md` removed from 13.11 and the File Structure Plan; `check:secrets` scans HEAD-reachable history only (`--log-opts=HEAD`, probed: `git log -p -U0 HEAD`, 6 commits, exit 0).
   331	
   332	HIGH findings applied to plan.md: CI step order is now install → runtime (both jobs); nested Vitest fixture config replaces `test.include` after `mergeConfig` and asserts only the fixture ran; the E2E guard self-check drops `test.fail()` in favour of `failOnBlockedRequest: false` + asserting `blockedRequests`.
   333	
   334	MEDIUM findings applied to plan.md (user decision: fix before tasks.md):
   335	- 7.7 hook test: stage a file first; case 1 minimal PATH → non-0; case 2 rewrite the embedded lefthook path → exit 1 with `Can't find lefthook in PATH`, control `assert_lefthook_installed: false` → 0 (orchestrator probe, lefthook 2.2.2; `LEFTHOOK_BIN` returns 127 either way, so not used).
   336	- C10: `isolatedEnv()` sets a fixed fake git identity; the reject case asserts no commit was created and gitleaks `RuleID` appears without the key value.
   337	- gitleaks config: no `.gitleaks.toml` / `.gitleaksignore` in the repo (asserted); `--ignore-gitleaks-allow` on the secrets job and `check:secrets`.
   338	- mise ls: filter by `source.path` to project files, require the 5 tools from them; strip `MISE_ENV` for the default lane, set it explicitly for node27.
   339	- Zero executed tests: Biome `suspicious.noSkippedTests: "error"`; Vitest and Playwright `require-executed-tests` reporters; self-check with an `it.todo`-only fixture.
   340	- Zero-test self-checks run the `test` / `e2e` task argv from `mise tasks ls --json`; hooks-config rejects loosening flags.
   341	- hooks-config asserts the exact ordered composition of `verify` and `security`, and that `ci.yml` calls them.
   342	- New `tests/unit/static-analysis.test.ts` for 2.4 / 2.5 in a temp repo with the real configs (`--stdin-file-path` bypasses `files.includes`, so not used).
   343	- Explicit per-file timeouts (initial 60 s), `runCommand` 30 s, nested Vitest `--maxWorkers=1`.
   344	- Orchestrator finding: `resolveTool()` resolves absolute tool paths from the repo root (`mise which`), and `isolatedEnv()` builds PATH from them.
   345	
   346	LOW findings are not applied (except `vcs.enabled` / `clientKind`, now explicit in C2).
--- round 2 ---
     1	HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
     2	reviewer: sdd-reviewer (codex unavailable: not logged in)
     3	
     4	# 001-dev-environment-and-gates — Plan Review（/sdd-validate-plan Step 3.5、round 2）
     5	
     6	- 対象: `specs/001-dev-environment-and-gates/plan.md`（945 行、全文を読んだ）、`research.md`、`spec.md`
     7	- 参照: 前回レビュー `.sdd/reviews/001-dev-environment-and-gates-plan-review.md`（Critique、Adjudication、Resolution）、`.sdd/memory/constitution.md`、`AGENTS.md`
     8	- Risk trigger: なし（タスク生成前の plan 相互レビュー）。codex が使えないため Claude が代行した。
     9	  作成者も Claude 系なので、憲章 原則 11 / AGENTS.md の別モデルファミリー要件は満たさない（round 1 の finding 29 と同じ注記）。
    10	- 前回の HIGH 3 件（CI の install 順、`test.fail()`、`mergeConfig` の include 連結）は plan に反映済みで、確認した。
    11	  再掲はしない。`GATE_NESTED` の二重防止は採用されていないが、include の代入で再帰は防げるため、再掲しない。
    12	
    13	## 実測（probe）と推論の区別
    14	
    15	scratchpad（`/tmp/r2probe/`）で実行した。リポジトリは変更していない。
    16	
    17	| 対象 | 種別 | 結果 |
    18	|------|------|------|
    19	| `mise which git`（git を `[tools]` に含まない一時プロジェクト、mise 2026.11.12） | 実測 | exit 1、`git is not a mise bin`。このマシンの git は `/opt/homebrew/bin/git` で mise 管理外 |
    20	| `mise which gitleaks` / `lefthook` / `node` | 実測 | いずれも exit 0、`~/.local/share/mise/installs/...` の絶対パス |
    21	| `env -i PATH=/usr/bin:/bin` で `node -v`、`pnpm -v`（shell 経由） | 実測 | `node` は ENOENT（127）、`pnpm` は command not found（127） |
    22	| `spawnSync("node", …, { env: { PATH: "/usr/bin:/bin" } })` | 実測 | `error.code = ENOENT`。`spawnSync("git", …)` は成功。`process.execPath` は成功 |
    23	| `#!/usr/bin/env node` のスクリプトを `PATH=/usr/bin:/bin` で直接実行 | 実測 | 127。node_modules の JS bin（vitest、tsc など）も同じ経路で失敗する（pnpm の .bin shim も `node` を PATH から呼ぶ。こちらは一般論で未実測） |
    24	| `mise tasks ls --json` の `verify` の `run` | 実測 | `[{"task":"check"},{"task":"test"}]`（オブジェクト要素） |
    25	| gitleaks 8.30.1 の `--staged --redact --verbose` / `--log-opts=HEAD` の出力 | **未実測**（権限の拒否で実行できず） | 下記 finding で「未確認」として扱う |
    26	| Vitest reporter / Playwright `onEnd` の終了コード上書き、`playwright test --list` の挙動 | 未実測（plan 自身が R-9 に回している） | 推論のみ |
    27	| Biome 2.6.8 の `suspicious/noSkippedTests` の存在 | 未実測 | 推論のみ（research I-9 には 3 ルールしか記録がない） |
    28	| Linux（ubuntu-24.04）での挙動 | 未実測 | 推論のみ |
    29	
    30	## Critique
    31	
    32	### [CRITICAL] isolatedEnv の PATH に node と pnpm が入らず、テストが起動する Node 系ツールがすべて ENOENT（127）になる
    33	**Location**: specs/001-dev-environment-and-gates/plan.md:189-199（`resolveTool` / `isolatedEnv`）、同 316-318（gate-self-check の (a)）、同 322-323（(c)）、同 350（7.7 case 1）
    34	**Issue**: `PATH` を「resolveTool() で解決したツールのディレクトリ + `/usr/bin:/bin`」に限定しているため、`node`、`pnpm`、`mise` を解決する経路がなく、子プロセスの Node 系コマンドは起動できない。
    35	**Evidence**: 「`PATH` は `resolveTool()` で解決したツールのディレクトリ + `/usr/bin:/bin` にする（フック経由で起動する gitleaks が一時リポジトリでも見つかるように）」（plan.md:198-199）。`resolveTool` の対象は「`gitleaks`、`lefthook`、`git` など」（同 190）で、`node`、`pnpm`、`mise` は明記されていない。一方、gate-self-check は「`mise tasks ls --json` から取得」した argv を実行する（同 316-317）。`test` の `run` は `pnpm exec vitest run` であり、network-guard の入れ子実行は `vitest run` を起動する（同 311-314）。
    36	**Confidence**: high（ENOENT と 127 は probe で確認。どの子プロセスがどの名前で呼ばれるかは plan の記述からの推論）
    37	**Proof**: `env -i PATH=/usr/bin:/bin /usr/bin/env node -v` → `No such file or directory`（exit 127）。`spawnSync("node", ["-v"], { env: { PATH: "/usr/bin:/bin" } })` → `error.code === "ENOENT"`。実装どおりに `pnpm exec vitest run` を isolatedEnv で起動すると、network-guard の (a)・(b) も gate-self-check も動かない。
    38	**Fix**: 次のどちらかを plan に書く。(1) `isolatedEnv()` が PATH に `resolveTool("node")`、`resolveTool("pnpm")`、`resolveTool("mise")` のディレクトリを含める。入れ子の vitest は `process.execPath` と `node_modules/vitest` の実体ファイルで起動し、bin の shebang に頼らない。(2) 入れ子実行の子プロセス環境を「既定 PATH に node を含める」ものとして定義し、その根拠を R-9 で実測する。あわせて、`runCommand` が使う環境を明示し、`pnpm` や `mise` を素の名前で呼ぶ箇所をすべて `resolveTool` の絶対パスに置き換える。
    39	
    40	### [CRITICAL] `resolveTool("git")` が `mise which git` で解決できず、一時 git リポジトリを使う 4 つのテストファイルが両方のプラットフォームで動かない
    41	**Location**: specs/001-dev-environment-and-gates/plan.md:189-190（`resolveTool`）、同 186-187（`useTempGitRepo`）、同 264-268（C10 の手順 2）、同 96（`[tools]` に git がない）
    42	**Issue**: `resolveTool(name)` は `mise which <name>` を使うが、git は `mise.toml` の `[tools]` に含まれないため mise は解決できない。
    43	**Evidence**: 「`resolveTool(name)`: リポジトリのルートを cwd にして `mise which <name>` を 1 回だけ実行し、絶対パスを返す（`gitleaks`、`lefthook`、`git` など）」（plan.md:189-190）。`[tools]` は「`node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定」（同 96）。`useTempGitRepo()` は「一時ディレクトリ + `git init`」（同 186-187）。
    44	**Confidence**: high（`mise which git` の失敗は probe で確認。CI の `mise-action` も git を mise 管理にしないのは plan の `[tools]` から推論。Linux での `/usr/bin/git` の存在は未実測）
    45	**Proof**: git を含まない `mise.toml` のプロジェクトで `mise which git` → `mise ERROR git is not a mise bin`、exit 1。この状態で `useTempGitRepo()` を呼ぶ 4 ファイル（`gitleaks-pre-commit`、`hooks-config`、`check-model-ids`、`static-analysis`）と C10 手順 5 はすべて最初の `resolveTool("git")` で失敗する。`verify` は macOS と Linux の両方で赤になる。
    46	**Fix**: git の解決方法を 1 つ決めて plan に書く。例: `git` は `resolveTool` の対象から外し、`isolatedEnv` の PATH に `/usr/bin:/bin` を入れて、`git` を素の名前で呼ぶ（Apple の `/usr/bin/git` と Linux の `/usr/bin/git` で動くことを R-9 で実測する）。または `mise.toml` の `[tools]` に git を入れ、その版を `repo-policy` の検査に加える。どちらにしても、`resolveTool` の失敗メッセージが「git が見つからない」原因を示すことを、テストで確かめる。
    47	
    48	### [HIGH] 「非 0 で終わる」だけを確かめるテストは、ツール不在（127）でも緑になる（fake pass）
    49	**Location**: specs/001-dev-environment-and-gates/plan.md:316-318（gate-self-check の (a)）、同 322-325（(c)）、同 350（hooks-config の 7.7 case 1）
    50	**Issue**: 0 件の自己検査と 7.7 case 1 は、終了コードが非 0 であることだけを assert する。コマンドが見つからない（上記 CRITICAL の 2 件）ことでも非 0 になるため、検査対象の動作を確かめないまま緑になる。
    51	**Evidence**: 「(a) `test` の argv + どのファイルにも一致しないフィルタ → 非 0（ファイル 0 件。3.8）」（plan.md:318）。「(c) `e2e` の argv + `--list` + `--grep <一致しないタグ>` → 非 0（3.9）」（同 322-323）。「1. ジョブのツールが見つからない: `PATH=/usr/bin:/bin` で pre-commit フックを実行 → 非 0」（同 350-351）。対照は (b) と case 2 にしかない。
    52	**Confidence**: high（ENOENT が 127 を返すことは probe で確認。assert が終了コードだけであることは plan の文面から確認）
    53	**Proof**: gate-self-check (a) の argv の `pnpm` を解決できない PATH で実行すると、exit 127 のまま `expect(status).not.toBe(0)` が通る。同じ状態で `UnmockedNetworkError` の出力を見る network-guard の (a) は落ちるので、差は assert の書き方にある。
    54	**Fix**: (a) と (c) に、reporter やランナーの固有の出力（「No test files found」、Playwright の該当メッセージ）を assert する。対照として、同じ argv で一致する 1 件を含むテストを実行すると 0 になることを確かめる。7.7 case 1 は、stage 後の出力に gitleaks ではなく「ツール不在」の原因が出ることを assert する。`status === 127` を明示的に区別し、ツール不在と検査失敗を分ける。
    55	
    56	### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
    57	**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
    58	**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
    59	**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
    60	**Confidence**: high
    61	**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
    62	**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。
    63	
    64	### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
    65	**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
    66	**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
    67	**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
    68	**Confidence**: high
    69	**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
    70	**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。
    71	
    72	### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
    73	**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
    74	**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
    75	**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
    76	**Confidence**: high
    77	**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
    78	**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。
    79	
    80	### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
    81	**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
    82	**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
    83	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
    84	**Confidence**: high
    85	**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
    86	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。
    87	
    88	### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
    89	**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
    90	**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
    91	**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
    92	**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
    93	**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
    94	**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。
    95	
    96	### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
    97	**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
    98	**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
    99	**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
   100	**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
   101	**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
   102	**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。
   103	
   104	### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
   105	**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
   106	**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
   107	**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
   108	**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
   109	**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
   110	**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。
   111	
   112	### [LOW] `runCommand` と `useTempGitRepo` の既定の環境が `isolatedEnv()` に結びついていない（prior: round-1 LOW は未適用）
   113	**Location**: specs/001-dev-environment-and-gates/plan.md:187-188（C6 の `runCommand`）、同 280-281（C10 だけに isolatedEnv を明記）、同 750-752（Error Handling）
   114	**Issue**: Error Handling は「pre-push で動く unit テストが GIT_* を引き継ぐ危険」への対策として isolatedEnv を挙げるが、C6 の契約は `runCommand` と `useTempGitRepo` の既定環境を定めていない。対策は C10 にしか結びついていない。
   115	**Evidence**: 「`runCommand()`（シェルを介さない `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）」（plan.md:187-188）。「子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）」は C10 の記述（同 280-281）。
   116	**Confidence**: medium（pre-push 中の GIT_DIR 継承は research I-6 の記述に依る。本レビューでは未実測）
   117	**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、`check-model-ids` の CLI を一時リポジトリの `--root` で実行し、対象の git dir を確かめる。
   118	**Fix**: `runCommand` の既定環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。
   119	
   120	### [LOW] 状態遷移図（Architecture）の pre-push から verify への矢印が、pre-push の定義と食い違う
   121	**Location**: specs/001-dev-environment-and-gates/plan.md:57（mermaid の `PP -->|mise run| VER`）
   122	**Issue**: 図の pre-push は `security:osv → security:audit → test → e2e` を直列に呼ぶと書かれているのに、`VER`（verify）への矢印がある。verify は pre-push から呼ばれない。
   123	**Evidence**: 「`PP -->|mise run| SEC`」「`PP -->|mise run| VER`」（plan.md:56-57）。lefthook の表（同 566-569）は pre-push の 4 ジョブがそれぞれ `security:osv`、`security:audit`、`test`、`e2e` を呼ぶと定める。
   124	**Confidence**: high
   125	**Proof**: 図と表を突き合わせると、`VER` への矢印だけが表と一致しない。
   126	**Fix**: 図から `PP -->|mise run| VER` を消す。
   127	
   128	### [LOW] 「他の lint / format ツールの設定ファイルを含まない」の検査対象が「など」で曖昧
   129	**Location**: specs/001-dev-environment-and-gates/plan.md:367（repo-policy の規約検査）
   130	**Issue**: 2.1 の検査は「ルートに ESLint / Prettier などの設定ファイルがない」とだけ書かれ、対象の一覧がない。`package.json` の `eslintConfig` や `prettier` キーも対象かどうか決まっていない。
   131	**Evidence**: 「ルートに ESLint / Prettier などの設定ファイルがない（2.1）」（plan.md:367）。spec 2.1「lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定ファイルを含まない」（spec.md:157-158）。
   132	**Confidence**: medium
   133	**Proof**: `.eslintrc.json`、`eslint.config.mjs`、`.prettierrc`、`prettier.config.js`、`dprint.json`、`.stylelintrc`、`package.json` の `eslintConfig` / `prettier` キーのそれぞれを置いたとき、repo-policy が落ちるかを確かめる。
   134	**Fix**: 対象の一覧をテストに書き、`package.json` のキーも検査する。
   135	
   136	### [LOW] 5.4（outdated はファイルを変えない）が R-1 の一度きりの記録だけで、自動化されていない
   137	**Location**: specs/001-dev-environment-and-gates/plan.md:875（5.4 のトレーサビリティ）
   138	**Issue**: `outdated` が `package.json`、`pnpm-lock.yaml`、`mise.toml` を変えないことは、タスク実行の前後で `git status` を比べれば自動化できるが、計画は R-1 の記録に頼る。
   139	**Evidence**: 「5.4 | C5 | R-1（実行前後の `git status`）」（plan.md:875）。spec 5.4「`package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない」（spec.md:246-247）。
   140	**Confidence**: high
   141	**Proof**: `outdated` の run に `package.json` の書き換えを足した状態で、現在の計画のテストがすべて緑のままになることを確かめる。
   142	**Fix**: hooks-config か専用テストで、`outdated` を実行する前後の三つのファイルのハッシュを比べる（ネットワークを使うため、CI の security-daily に置くか、R-1 の記録を残す判断を plan に書く）。
   143	
   144	### [LOW] 3.12（`check:secrets` が検出値を出力しない）の自動テストがなく、hooks-config はフラグの有無だけを確かめる
   145	**Location**: specs/001-dev-environment-and-gates/plan.md:342（hooks-config の `check:secrets` 検査）、同 866（3.12 のトレーサビリティ）
   146	**Issue**: hooks-config は `--redact` の存在を確かめるだけで、`check:secrets` が検出時に値を出さないことは確かめない。pre-commit 側（C10）とは別に、verify 側の出力は自動検査されていない。
   147	**Evidence**: 「`check:secrets` が `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）」（plan.md:341-342）。3.12 のトレーサビリティは「`tests/unit/hooks-config.test.ts`（`--redact`）、R-10」（同 866）。
   148	**Confidence**: medium
   149	**Proof**: 偽キーを HEAD のコミットに入れた一時リポジトリで `check:secrets` の argv を実行し、stdout と stderr に生の値がないことを確かめる。
   150	**Fix**: C10 と同じ要領で、一時リポジトリの履歴に偽キーを入れて `check:secrets` の argv を実行するテストを追加する。
   151	
   152	## 前回の指摘の扱い（再掲しなかったもの）
   153	
   154	- round 1 の HIGH 3 件は plan に反映済み。CI の順序（plan.md:416-417）、`test.fail()` の撤去（同 388-394）、include の代入（同 307-311）を確認した。
   155	- round 1 の MEDIUM のうち、7.7 の 2 ケース、C10 の identity、gitleaks の設定ファイル不在、`mise ls` の source 絞り込み、`verify` の構成検査、zero-case の argv 検査、static-analysis、Vitest の timeout、CLAUDE.md の削除、憲章 1.1.0 は反映済み。
   156	- round 1 の LOW のうち、以下は未適用のまま。新しい証拠がなく、revision で悪化していないため再掲しない（prior: LOW, not applied）: `lefthook-local.yml` の gitignore 漏れ、repo-policy の件数下限（zero-case の LOW）、`strictDepBuilds` の明記、`setup` タスクの要件外、Node 27 worktree の `mise trust`、osv-scanner の正の対照、E2E のポート衝突、TypeScript 7.1 の `--showConfig`、`expect(output).not.toContain` の表示、`.invalid` 以外の経路、`dgram` / `dns`、WebSocket、CI の一部の「レビュー」扱い、別モデル要件、`lefthook` の mint フォールバック。
   157	
   158	## 強み（判断材料）
   159	
   160	- `mise.toml` を検査の唯一の定義とし、フックと CI がタスク名で呼ぶ構成は、round 1 からの一貫性を保っている。
   161	- `lefthook dump --format=json` を、C10 とフック検査の共通の入力にしたことは、実測（`run` の抽出と `lefthook.json` の読み戻し）で裏づけられた。
   162	- E2E の自己検査は、`test.fail()` をやめ、記録された `blockedRequests` を直接 assert する形になった。round 1 の空振りの原因は取り除かれている。
   163	
   164	## GO / NO-GO（plan-review.md の基準）
   165	
   166	**NO-GO**。CRITICAL が 2 件あり、いずれも plan の記述どおりに実装すると、テストの基盤（子プロセスの起動と一時 git リポジトリ）が macOS と Linux の両方で動かない。plan-review.md の NO-GO 基準「unfeasible approach」に当たる。どちらも、plan の記述を直せば解消する（PATH の構成と git の解決方法）。tasks.md を作る前に直すこと。HIGH と MEDIUM のうち、spec の判断が要るのは次の 2 点（ユーザー判断）: 13.2 の合格判定の対象（テストか実行記録か）、E2E の既定の遮断経路を自動化するか R-10 の記録とするか。
   167	
   168	## Verdict
   169	REQUEST_CHANGES
   170	
   171	## Hallucination Signal
   172	forced: false
   173	
   174	## 件数（重大度別）
   175	- CRITICAL: 2
   176	- HIGH: 1
   177	- MEDIUM: 7
   178	- LOW: 5
   179	- 合計: 15
   180	
   181	## 検証の残り（未実測の範囲）
   182	- gitleaks 8.30.1 の `--verbose` 付き argv の出力（権限の拒否で未実行）。finding の MEDIUM（低確信）の根拠。
   183	- Vitest / Playwright の reporter による終了コードの上書き、`playwright test --list` の 0 件時の挙動（plan が R-9 に回しているため、本レビューでは扱わない）。
   184	- Biome 2.6.8 の `noSkippedTests`（スキーマ未確認）。
   185	- Linux ランナーでの `/usr/bin/git` と identity の挙動（推論のみ）。
   186	- 試験に使った一時ファイルは `/tmp/r2probe/` にあり、リポジトリには置いていない。
   187	
   188	## Adjudication
   189	
   190	Orchestrator: Claude (/sdd-validate-plan). Codex unavailable (`codex login status`: Not logged in); this round is same-family, so it still does not satisfy constitution principle 11.
   191	
   192	| Finding | Decision | Evidence |
   193	|---------|----------|----------|
   194	| [CRITICAL] `isolatedEnv()` PATH lacks node / pnpm | stands | orchestrator re-run: `env -i PATH=/usr/bin:/bin node -v` → "No such file or directory", exit 127 |
   195	| [CRITICAL] `resolveTool("git")` via `mise which git` | stands | `git` is not in the plan's `[tools]` (plan.md:96); `mise which git` exit 1; git is `/opt/homebrew/bin/git` here. (No `mise.toml` exists yet, so the exit code alone proves little; the plan's tool list does.) |
   196	| [HIGH] "non-zero" asserts pass on ENOENT (127) | stands | follows from the two CRITICALs; plan.md:316-323, 350 |
   197	| [MEDIUM] 13.2 judgement test, E2E default-block path automation | escalated | spec decision (user) |
   198	| other MEDIUM / LOW | stands as notes | see report |

exec
/bin/zsh -lc 'nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md' in /Users/Shared/codes/genai-lab-ts
 succeeded in 81ms:
     1	HEAD: 2eed04512583b969e0a6ea1b5849ac14e25c75f1
     2	reviewer: sdd-reviewer (codex unavailable: not logged in)
     3	
     4	# 001-dev-environment-and-gates — Plan Review（/sdd-validate-plan Step 3.5、round 2）
     5	
     6	- 対象: `specs/001-dev-environment-and-gates/plan.md`（945 行、全文を読んだ）、`research.md`、`spec.md`
     7	- 参照: 前回レビュー `.sdd/reviews/001-dev-environment-and-gates-plan-review.md`（Critique、Adjudication、Resolution）、`.sdd/memory/constitution.md`、`AGENTS.md`
     8	- Risk trigger: なし（タスク生成前の plan 相互レビュー）。codex が使えないため Claude が代行した。
     9	  作成者も Claude 系なので、憲章 原則 11 / AGENTS.md の別モデルファミリー要件は満たさない（round 1 の finding 29 と同じ注記）。
    10	- 前回の HIGH 3 件（CI の install 順、`test.fail()`、`mergeConfig` の include 連結）は plan に反映済みで、確認した。
    11	  再掲はしない。`GATE_NESTED` の二重防止は採用されていないが、include の代入で再帰は防げるため、再掲しない。
    12	
    13	## 実測（probe）と推論の区別
    14	
    15	scratchpad（`/tmp/r2probe/`）で実行した。リポジトリは変更していない。
    16	
    17	| 対象 | 種別 | 結果 |
    18	|------|------|------|
    19	| `mise which git`（git を `[tools]` に含まない一時プロジェクト、mise 2026.11.12） | 実測 | exit 1、`git is not a mise bin`。このマシンの git は `/opt/homebrew/bin/git` で mise 管理外 |
    20	| `mise which gitleaks` / `lefthook` / `node` | 実測 | いずれも exit 0、`~/.local/share/mise/installs/...` の絶対パス |
    21	| `env -i PATH=/usr/bin:/bin` で `node -v`、`pnpm -v`（shell 経由） | 実測 | `node` は ENOENT（127）、`pnpm` は command not found（127） |
    22	| `spawnSync("node", …, { env: { PATH: "/usr/bin:/bin" } })` | 実測 | `error.code = ENOENT`。`spawnSync("git", …)` は成功。`process.execPath` は成功 |
    23	| `#!/usr/bin/env node` のスクリプトを `PATH=/usr/bin:/bin` で直接実行 | 実測 | 127。node_modules の JS bin（vitest、tsc など）も同じ経路で失敗する（pnpm の .bin shim も `node` を PATH から呼ぶ。こちらは一般論で未実測） |
    24	| `mise tasks ls --json` の `verify` の `run` | 実測 | `[{"task":"check"},{"task":"test"}]`（オブジェクト要素） |
    25	| gitleaks 8.30.1 の `--staged --redact --verbose` / `--log-opts=HEAD` の出力 | **未実測**（権限の拒否で実行できず） | 下記 finding で「未確認」として扱う |
    26	| Vitest reporter / Playwright `onEnd` の終了コード上書き、`playwright test --list` の挙動 | 未実測（plan 自身が R-9 に回している） | 推論のみ |
    27	| Biome 2.6.8 の `suspicious/noSkippedTests` の存在 | 未実測 | 推論のみ（research I-9 には 3 ルールしか記録がない） |
    28	| Linux（ubuntu-24.04）での挙動 | 未実測 | 推論のみ |
    29	
    30	## Critique
    31	
    32	### [CRITICAL] isolatedEnv の PATH に node と pnpm が入らず、テストが起動する Node 系ツールがすべて ENOENT（127）になる
    33	**Location**: specs/001-dev-environment-and-gates/plan.md:189-199（`resolveTool` / `isolatedEnv`）、同 316-318（gate-self-check の (a)）、同 322-323（(c)）、同 350（7.7 case 1）
    34	**Issue**: `PATH` を「resolveTool() で解決したツールのディレクトリ + `/usr/bin:/bin`」に限定しているため、`node`、`pnpm`、`mise` を解決する経路がなく、子プロセスの Node 系コマンドは起動できない。
    35	**Evidence**: 「`PATH` は `resolveTool()` で解決したツールのディレクトリ + `/usr/bin:/bin` にする（フック経由で起動する gitleaks が一時リポジトリでも見つかるように）」（plan.md:198-199）。`resolveTool` の対象は「`gitleaks`、`lefthook`、`git` など」（同 190）で、`node`、`pnpm`、`mise` は明記されていない。一方、gate-self-check は「`mise tasks ls --json` から取得」した argv を実行する（同 316-317）。`test` の `run` は `pnpm exec vitest run` であり、network-guard の入れ子実行は `vitest run` を起動する（同 311-314）。
    36	**Confidence**: high（ENOENT と 127 は probe で確認。どの子プロセスがどの名前で呼ばれるかは plan の記述からの推論）
    37	**Proof**: `env -i PATH=/usr/bin:/bin /usr/bin/env node -v` → `No such file or directory`（exit 127）。`spawnSync("node", ["-v"], { env: { PATH: "/usr/bin:/bin" } })` → `error.code === "ENOENT"`。実装どおりに `pnpm exec vitest run` を isolatedEnv で起動すると、network-guard の (a)・(b) も gate-self-check も動かない。
    38	**Fix**: 次のどちらかを plan に書く。(1) `isolatedEnv()` が PATH に `resolveTool("node")`、`resolveTool("pnpm")`、`resolveTool("mise")` のディレクトリを含める。入れ子の vitest は `process.execPath` と `node_modules/vitest` の実体ファイルで起動し、bin の shebang に頼らない。(2) 入れ子実行の子プロセス環境を「既定 PATH に node を含める」ものとして定義し、その根拠を R-9 で実測する。あわせて、`runCommand` が使う環境を明示し、`pnpm` や `mise` を素の名前で呼ぶ箇所をすべて `resolveTool` の絶対パスに置き換える。
    39	
    40	### [CRITICAL] `resolveTool("git")` が `mise which git` で解決できず、一時 git リポジトリを使う 4 つのテストファイルが両方のプラットフォームで動かない
    41	**Location**: specs/001-dev-environment-and-gates/plan.md:189-190（`resolveTool`）、同 186-187（`useTempGitRepo`）、同 264-268（C10 の手順 2）、同 96（`[tools]` に git がない）
    42	**Issue**: `resolveTool(name)` は `mise which <name>` を使うが、git は `mise.toml` の `[tools]` に含まれないため mise は解決できない。
    43	**Evidence**: 「`resolveTool(name)`: リポジトリのルートを cwd にして `mise which <name>` を 1 回だけ実行し、絶対パスを返す（`gitleaks`、`lefthook`、`git` など）」（plan.md:189-190）。`[tools]` は「`node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定」（同 96）。`useTempGitRepo()` は「一時ディレクトリ + `git init`」（同 186-187）。
    44	**Confidence**: high（`mise which git` の失敗は probe で確認。CI の `mise-action` も git を mise 管理にしないのは plan の `[tools]` から推論。Linux での `/usr/bin/git` の存在は未実測）
    45	**Proof**: git を含まない `mise.toml` のプロジェクトで `mise which git` → `mise ERROR git is not a mise bin`、exit 1。この状態で `useTempGitRepo()` を呼ぶ 4 ファイル（`gitleaks-pre-commit`、`hooks-config`、`check-model-ids`、`static-analysis`）と C10 手順 5 はすべて最初の `resolveTool("git")` で失敗する。`verify` は macOS と Linux の両方で赤になる。
    46	**Fix**: git の解決方法を 1 つ決めて plan に書く。例: `git` は `resolveTool` の対象から外し、`isolatedEnv` の PATH に `/usr/bin:/bin` を入れて、`git` を素の名前で呼ぶ（Apple の `/usr/bin/git` と Linux の `/usr/bin/git` で動くことを R-9 で実測する）。または `mise.toml` の `[tools]` に git を入れ、その版を `repo-policy` の検査に加える。どちらにしても、`resolveTool` の失敗メッセージが「git が見つからない」原因を示すことを、テストで確かめる。
    47	
    48	### [HIGH] 「非 0 で終わる」だけを確かめるテストは、ツール不在（127）でも緑になる（fake pass）
    49	**Location**: specs/001-dev-environment-and-gates/plan.md:316-318（gate-self-check の (a)）、同 322-325（(c)）、同 350（hooks-config の 7.7 case 1）
    50	**Issue**: 0 件の自己検査と 7.7 case 1 は、終了コードが非 0 であることだけを assert する。コマンドが見つからない（上記 CRITICAL の 2 件）ことでも非 0 になるため、検査対象の動作を確かめないまま緑になる。
    51	**Evidence**: 「(a) `test` の argv + どのファイルにも一致しないフィルタ → 非 0（ファイル 0 件。3.8）」（plan.md:318）。「(c) `e2e` の argv + `--list` + `--grep <一致しないタグ>` → 非 0（3.9）」（同 322-323）。「1. ジョブのツールが見つからない: `PATH=/usr/bin:/bin` で pre-commit フックを実行 → 非 0」（同 350-351）。対照は (b) と case 2 にしかない。
    52	**Confidence**: high（ENOENT が 127 を返すことは probe で確認。assert が終了コードだけであることは plan の文面から確認）
    53	**Proof**: gate-self-check (a) の argv の `pnpm` を解決できない PATH で実行すると、exit 127 のまま `expect(status).not.toBe(0)` が通る。同じ状態で `UnmockedNetworkError` の出力を見る network-guard の (a) は落ちるので、差は assert の書き方にある。
    54	**Fix**: (a) と (c) に、reporter やランナーの固有の出力（「No test files found」、Playwright の該当メッセージ）を assert する。対照として、同じ argv で一致する 1 件を含むテストを実行すると 0 になることを確かめる。7.7 case 1 は、stage 後の出力に gitleaks ではなく「ツール不在」の原因が出ることを assert する。`status === 127` を明示的に区別し、ツール不在と検査失敗を分ける。
    55	
    56	### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
    57	**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
    58	**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
    59	**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
    60	**Confidence**: high
    61	**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
    62	**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。
    63	
    64	### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
    65	**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
    66	**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
    67	**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
    68	**Confidence**: high
    69	**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
    70	**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。
    71	
    72	### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
    73	**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
    74	**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
    75	**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
    76	**Confidence**: high
    77	**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
    78	**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。
    79	
    80	### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
    81	**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
    82	**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
    83	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
    84	**Confidence**: high
    85	**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
    86	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。
    87	
    88	### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
    89	**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
    90	**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
    91	**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
    92	**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
    93	**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
    94	**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。
    95	
    96	### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
    97	**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
    98	**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
    99	**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
   100	**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
   101	**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
   102	**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。
   103	
   104	### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
   105	**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
   106	**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
   107	**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
   108	**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
   109	**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
   110	**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。
   111	
   112	### [LOW] `runCommand` と `useTempGitRepo` の既定の環境が `isolatedEnv()` に結びついていない（prior: round-1 LOW は未適用）
   113	**Location**: specs/001-dev-environment-and-gates/plan.md:187-188（C6 の `runCommand`）、同 280-281（C10 だけに isolatedEnv を明記）、同 750-752（Error Handling）
   114	**Issue**: Error Handling は「pre-push で動く unit テストが GIT_* を引き継ぐ危険」への対策として isolatedEnv を挙げるが、C6 の契約は `runCommand` と `useTempGitRepo` の既定環境を定めていない。対策は C10 にしか結びついていない。
   115	**Evidence**: 「`runCommand()`（シェルを介さない `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）」（plan.md:187-188）。「子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）」は C10 の記述（同 280-281）。
   116	**Confidence**: medium（pre-push 中の GIT_DIR 継承は research I-6 の記述に依る。本レビューでは未実測）
   117	**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、`check-model-ids` の CLI を一時リポジトリの `--root` で実行し、対象の git dir を確かめる。
   118	**Fix**: `runCommand` の既定環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。
   119	
   120	### [LOW] 状態遷移図（Architecture）の pre-push から verify への矢印が、pre-push の定義と食い違う
   121	**Location**: specs/001-dev-environment-and-gates/plan.md:57（mermaid の `PP -->|mise run| VER`）
   122	**Issue**: 図の pre-push は `security:osv → security:audit → test → e2e` を直列に呼ぶと書かれているのに、`VER`（verify）への矢印がある。verify は pre-push から呼ばれない。
   123	**Evidence**: 「`PP -->|mise run| SEC`」「`PP -->|mise run| VER`」（plan.md:56-57）。lefthook の表（同 566-569）は pre-push の 4 ジョブがそれぞれ `security:osv`、`security:audit`、`test`、`e2e` を呼ぶと定める。
   124	**Confidence**: high
   125	**Proof**: 図と表を突き合わせると、`VER` への矢印だけが表と一致しない。
   126	**Fix**: 図から `PP -->|mise run| VER` を消す。
   127	
   128	### [LOW] 「他の lint / format ツールの設定ファイルを含まない」の検査対象が「など」で曖昧
   129	**Location**: specs/001-dev-environment-and-gates/plan.md:367（repo-policy の規約検査）
   130	**Issue**: 2.1 の検査は「ルートに ESLint / Prettier などの設定ファイルがない」とだけ書かれ、対象の一覧がない。`package.json` の `eslintConfig` や `prettier` キーも対象かどうか決まっていない。
   131	**Evidence**: 「ルートに ESLint / Prettier などの設定ファイルがない（2.1）」（plan.md:367）。spec 2.1「lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定ファイルを含まない」（spec.md:157-158）。
   132	**Confidence**: medium
   133	**Proof**: `.eslintrc.json`、`eslint.config.mjs`、`.prettierrc`、`prettier.config.js`、`dprint.json`、`.stylelintrc`、`package.json` の `eslintConfig` / `prettier` キーのそれぞれを置いたとき、repo-policy が落ちるかを確かめる。
   134	**Fix**: 対象の一覧をテストに書き、`package.json` のキーも検査する。
   135	
   136	### [LOW] 5.4（outdated はファイルを変えない）が R-1 の一度きりの記録だけで、自動化されていない
   137	**Location**: specs/001-dev-environment-and-gates/plan.md:875（5.4 のトレーサビリティ）
   138	**Issue**: `outdated` が `package.json`、`pnpm-lock.yaml`、`mise.toml` を変えないことは、タスク実行の前後で `git status` を比べれば自動化できるが、計画は R-1 の記録に頼る。
   139	**Evidence**: 「5.4 | C5 | R-1（実行前後の `git status`）」（plan.md:875）。spec 5.4「`package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない」（spec.md:246-247）。
   140	**Confidence**: high
   141	**Proof**: `outdated` の run に `package.json` の書き換えを足した状態で、現在の計画のテストがすべて緑のままになることを確かめる。
   142	**Fix**: hooks-config か専用テストで、`outdated` を実行する前後の三つのファイルのハッシュを比べる（ネットワークを使うため、CI の security-daily に置くか、R-1 の記録を残す判断を plan に書く）。
   143	
   144	### [LOW] 3.12（`check:secrets` が検出値を出力しない）の自動テストがなく、hooks-config はフラグの有無だけを確かめる
   145	**Location**: specs/001-dev-environment-and-gates/plan.md:342（hooks-config の `check:secrets` 検査）、同 866（3.12 のトレーサビリティ）
   146	**Issue**: hooks-config は `--redact` の存在を確かめるだけで、`check:secrets` が検出時に値を出さないことは確かめない。pre-commit 側（C10）とは別に、verify 側の出力は自動検査されていない。
   147	**Evidence**: 「`check:secrets` が `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）」（plan.md:341-342）。3.12 のトレーサビリティは「`tests/unit/hooks-config.test.ts`（`--redact`）、R-10」（同 866）。
   148	**Confidence**: medium
   149	**Proof**: 偽キーを HEAD のコミットに入れた一時リポジトリで `check:secrets` の argv を実行し、stdout と stderr に生の値がないことを確かめる。
   150	**Fix**: C10 と同じ要領で、一時リポジトリの履歴に偽キーを入れて `check:secrets` の argv を実行するテストを追加する。
   151	
   152	## 前回の指摘の扱い（再掲しなかったもの）
   153	
   154	- round 1 の HIGH 3 件は plan に反映済み。CI の順序（plan.md:416-417）、`test.fail()` の撤去（同 388-394）、include の代入（同 307-311）を確認した。
   155	- round 1 の MEDIUM のうち、7.7 の 2 ケース、C10 の identity、gitleaks の設定ファイル不在、`mise ls` の source 絞り込み、`verify` の構成検査、zero-case の argv 検査、static-analysis、Vitest の timeout、CLAUDE.md の削除、憲章 1.1.0 は反映済み。
   156	- round 1 の LOW のうち、以下は未適用のまま。新しい証拠がなく、revision で悪化していないため再掲しない（prior: LOW, not applied）: `lefthook-local.yml` の gitignore 漏れ、repo-policy の件数下限（zero-case の LOW）、`strictDepBuilds` の明記、`setup` タスクの要件外、Node 27 worktree の `mise trust`、osv-scanner の正の対照、E2E のポート衝突、TypeScript 7.1 の `--showConfig`、`expect(output).not.toContain` の表示、`.invalid` 以外の経路、`dgram` / `dns`、WebSocket、CI の一部の「レビュー」扱い、別モデル要件、`lefthook` の mint フォールバック。
   157	
   158	## 強み（判断材料）
   159	
   160	- `mise.toml` を検査の唯一の定義とし、フックと CI がタスク名で呼ぶ構成は、round 1 からの一貫性を保っている。
   161	- `lefthook dump --format=json` を、C10 とフック検査の共通の入力にしたことは、実測（`run` の抽出と `lefthook.json` の読み戻し）で裏づけられた。
   162	- E2E の自己検査は、`test.fail()` をやめ、記録された `blockedRequests` を直接 assert する形になった。round 1 の空振りの原因は取り除かれている。
   163	
   164	## GO / NO-GO（plan-review.md の基準）
   165	
   166	**NO-GO**。CRITICAL が 2 件あり、いずれも plan の記述どおりに実装すると、テストの基盤（子プロセスの起動と一時 git リポジトリ）が macOS と Linux の両方で動かない。plan-review.md の NO-GO 基準「unfeasible approach」に当たる。どちらも、plan の記述を直せば解消する（PATH の構成と git の解決方法）。tasks.md を作る前に直すこと。HIGH と MEDIUM のうち、spec の判断が要るのは次の 2 点（ユーザー判断）: 13.2 の合格判定の対象（テストか実行記録か）、E2E の既定の遮断経路を自動化するか R-10 の記録とするか。
   167	
   168	## Verdict
   169	REQUEST_CHANGES
   170	
   171	## Hallucination Signal
   172	forced: false
   173	
   174	## 件数（重大度別）
   175	- CRITICAL: 2
   176	- HIGH: 1
   177	- MEDIUM: 7
   178	- LOW: 5
   179	- 合計: 15
   180	
   181	## 検証の残り（未実測の範囲）
   182	- gitleaks 8.30.1 の `--verbose` 付き argv の出力（権限の拒否で未実行）。finding の MEDIUM（低確信）の根拠。
   183	- Vitest / Playwright の reporter による終了コードの上書き、`playwright test --list` の 0 件時の挙動（plan が R-9 に回しているため、本レビューでは扱わない）。
   184	- Biome 2.6.8 の `noSkippedTests`（スキーマ未確認）。
   185	- Linux ランナーでの `/usr/bin/git` と identity の挙動（推論のみ）。
   186	- 試験に使った一時ファイルは `/tmp/r2probe/` にあり、リポジトリには置いていない。
   187	
   188	## Adjudication
   189	
   190	Orchestrator: Claude (/sdd-validate-plan). Codex unavailable (`codex login status`: Not logged in); this round is same-family, so it still does not satisfy constitution principle 11.
   191	
   192	| Finding | Decision | Evidence |
   193	|---------|----------|----------|
   194	| [CRITICAL] `isolatedEnv()` PATH lacks node / pnpm | stands | orchestrator re-run: `env -i PATH=/usr/bin:/bin node -v` → "No such file or directory", exit 127 |
   195	| [CRITICAL] `resolveTool("git")` via `mise which git` | stands | `git` is not in the plan's `[tools]` (plan.md:96); `mise which git` exit 1; git is `/opt/homebrew/bin/git` here. (No `mise.toml` exists yet, so the exit code alone proves little; the plan's tool list does.) |
   196	| [HIGH] "non-zero" asserts pass on ENOENT (127) | stands | follows from the two CRITICALs; plan.md:316-323, 350 |
   197	| [MEDIUM] 13.2 judgement test, E2E default-block path automation | escalated | spec decision (user) |
   198	| other MEDIUM / LOW | stands as notes | see report |

exec
/bin/zsh -lc "nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md | sed -n '30,151p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 93ms:
    30	## Critique
    31	
    32	### [CRITICAL] isolatedEnv の PATH に node と pnpm が入らず、テストが起動する Node 系ツールがすべて ENOENT（127）になる
    33	**Location**: specs/001-dev-environment-and-gates/plan.md:189-199（`resolveTool` / `isolatedEnv`）、同 316-318（gate-self-check の (a)）、同 322-323（(c)）、同 350（7.7 case 1）
    34	**Issue**: `PATH` を「resolveTool() で解決したツールのディレクトリ + `/usr/bin:/bin`」に限定しているため、`node`、`pnpm`、`mise` を解決する経路がなく、子プロセスの Node 系コマンドは起動できない。
    35	**Evidence**: 「`PATH` は `resolveTool()` で解決したツールのディレクトリ + `/usr/bin:/bin` にする（フック経由で起動する gitleaks が一時リポジトリでも見つかるように）」（plan.md:198-199）。`resolveTool` の対象は「`gitleaks`、`lefthook`、`git` など」（同 190）で、`node`、`pnpm`、`mise` は明記されていない。一方、gate-self-check は「`mise tasks ls --json` から取得」した argv を実行する（同 316-317）。`test` の `run` は `pnpm exec vitest run` であり、network-guard の入れ子実行は `vitest run` を起動する（同 311-314）。
    36	**Confidence**: high（ENOENT と 127 は probe で確認。どの子プロセスがどの名前で呼ばれるかは plan の記述からの推論）
    37	**Proof**: `env -i PATH=/usr/bin:/bin /usr/bin/env node -v` → `No such file or directory`（exit 127）。`spawnSync("node", ["-v"], { env: { PATH: "/usr/bin:/bin" } })` → `error.code === "ENOENT"`。実装どおりに `pnpm exec vitest run` を isolatedEnv で起動すると、network-guard の (a)・(b) も gate-self-check も動かない。
    38	**Fix**: 次のどちらかを plan に書く。(1) `isolatedEnv()` が PATH に `resolveTool("node")`、`resolveTool("pnpm")`、`resolveTool("mise")` のディレクトリを含める。入れ子の vitest は `process.execPath` と `node_modules/vitest` の実体ファイルで起動し、bin の shebang に頼らない。(2) 入れ子実行の子プロセス環境を「既定 PATH に node を含める」ものとして定義し、その根拠を R-9 で実測する。あわせて、`runCommand` が使う環境を明示し、`pnpm` や `mise` を素の名前で呼ぶ箇所をすべて `resolveTool` の絶対パスに置き換える。
    39	
    40	### [CRITICAL] `resolveTool("git")` が `mise which git` で解決できず、一時 git リポジトリを使う 4 つのテストファイルが両方のプラットフォームで動かない
    41	**Location**: specs/001-dev-environment-and-gates/plan.md:189-190（`resolveTool`）、同 186-187（`useTempGitRepo`）、同 264-268（C10 の手順 2）、同 96（`[tools]` に git がない）
    42	**Issue**: `resolveTool(name)` は `mise which <name>` を使うが、git は `mise.toml` の `[tools]` に含まれないため mise は解決できない。
    43	**Evidence**: 「`resolveTool(name)`: リポジトリのルートを cwd にして `mise which <name>` を 1 回だけ実行し、絶対パスを返す（`gitleaks`、`lefthook`、`git` など）」（plan.md:189-190）。`[tools]` は「`node`、`pnpm`、`lefthook`、`gitleaks`、`osv-scanner` を exact 版で指定」（同 96）。`useTempGitRepo()` は「一時ディレクトリ + `git init`」（同 186-187）。
    44	**Confidence**: high（`mise which git` の失敗は probe で確認。CI の `mise-action` も git を mise 管理にしないのは plan の `[tools]` から推論。Linux での `/usr/bin/git` の存在は未実測）
    45	**Proof**: git を含まない `mise.toml` のプロジェクトで `mise which git` → `mise ERROR git is not a mise bin`、exit 1。この状態で `useTempGitRepo()` を呼ぶ 4 ファイル（`gitleaks-pre-commit`、`hooks-config`、`check-model-ids`、`static-analysis`）と C10 手順 5 はすべて最初の `resolveTool("git")` で失敗する。`verify` は macOS と Linux の両方で赤になる。
    46	**Fix**: git の解決方法を 1 つ決めて plan に書く。例: `git` は `resolveTool` の対象から外し、`isolatedEnv` の PATH に `/usr/bin:/bin` を入れて、`git` を素の名前で呼ぶ（Apple の `/usr/bin/git` と Linux の `/usr/bin/git` で動くことを R-9 で実測する）。または `mise.toml` の `[tools]` に git を入れ、その版を `repo-policy` の検査に加える。どちらにしても、`resolveTool` の失敗メッセージが「git が見つからない」原因を示すことを、テストで確かめる。
    47	
    48	### [HIGH] 「非 0 で終わる」だけを確かめるテストは、ツール不在（127）でも緑になる（fake pass）
    49	**Location**: specs/001-dev-environment-and-gates/plan.md:316-318（gate-self-check の (a)）、同 322-325（(c)）、同 350（hooks-config の 7.7 case 1）
    50	**Issue**: 0 件の自己検査と 7.7 case 1 は、終了コードが非 0 であることだけを assert する。コマンドが見つからない（上記 CRITICAL の 2 件）ことでも非 0 になるため、検査対象の動作を確かめないまま緑になる。
    51	**Evidence**: 「(a) `test` の argv + どのファイルにも一致しないフィルタ → 非 0（ファイル 0 件。3.8）」（plan.md:318）。「(c) `e2e` の argv + `--list` + `--grep <一致しないタグ>` → 非 0（3.9）」（同 322-323）。「1. ジョブのツールが見つからない: `PATH=/usr/bin:/bin` で pre-commit フックを実行 → 非 0」（同 350-351）。対照は (b) と case 2 にしかない。
    52	**Confidence**: high（ENOENT が 127 を返すことは probe で確認。assert が終了コードだけであることは plan の文面から確認）
    53	**Proof**: gate-self-check (a) の argv の `pnpm` を解決できない PATH で実行すると、exit 127 のまま `expect(status).not.toBe(0)` が通る。同じ状態で `UnmockedNetworkError` の出力を見る network-guard の (a) は落ちるので、差は assert の書き方にある。
    54	**Fix**: (a) と (c) に、reporter やランナーの固有の出力（「No test files found」、Playwright の該当メッセージ）を assert する。対照として、同じ argv で一致する 1 件を含むテストを実行すると 0 になることを確かめる。7.7 case 1 は、stage 後の出力に gitleaks ではなく「ツール不在」の原因が出ることを assert する。`status === 127` を明示的に区別し、ツール不在と検査失敗を分ける。
    55	
    56	### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
    57	**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
    58	**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
    59	**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
    60	**Confidence**: high
    61	**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
    62	**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。
    63	
    64	### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
    65	**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
    66	**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
    67	**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
    68	**Confidence**: high
    69	**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
    70	**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。
    71	
    72	### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
    73	**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
    74	**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
    75	**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
    76	**Confidence**: high
    77	**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
    78	**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。
    79	
    80	### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
    81	**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
    82	**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
    83	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
    84	**Confidence**: high
    85	**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
    86	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。
    87	
    88	### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
    89	**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
    90	**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
    91	**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
    92	**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
    93	**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
    94	**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。
    95	
    96	### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
    97	**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
    98	**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
    99	**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
   100	**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
   101	**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
   102	**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。
   103	
   104	### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
   105	**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
   106	**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
   107	**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
   108	**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
   109	**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
   110	**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。
   111	
   112	### [LOW] `runCommand` と `useTempGitRepo` の既定の環境が `isolatedEnv()` に結びついていない（prior: round-1 LOW は未適用）
   113	**Location**: specs/001-dev-environment-and-gates/plan.md:187-188（C6 の `runCommand`）、同 280-281（C10 だけに isolatedEnv を明記）、同 750-752（Error Handling）
   114	**Issue**: Error Handling は「pre-push で動く unit テストが GIT_* を引き継ぐ危険」への対策として isolatedEnv を挙げるが、C6 の契約は `runCommand` と `useTempGitRepo` の既定環境を定めていない。対策は C10 にしか結びついていない。
   115	**Evidence**: 「`runCommand()`（シェルを介さない `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）」（plan.md:187-188）。「子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）」は C10 の記述（同 280-281）。
   116	**Confidence**: medium（pre-push 中の GIT_DIR 継承は research I-6 の記述に依る。本レビューでは未実測）
   117	**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、`check-model-ids` の CLI を一時リポジトリの `--root` で実行し、対象の git dir を確かめる。
   118	**Fix**: `runCommand` の既定環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。
   119	
   120	### [LOW] 状態遷移図（Architecture）の pre-push から verify への矢印が、pre-push の定義と食い違う
   121	**Location**: specs/001-dev-environment-and-gates/plan.md:57（mermaid の `PP -->|mise run| VER`）
   122	**Issue**: 図の pre-push は `security:osv → security:audit → test → e2e` を直列に呼ぶと書かれているのに、`VER`（verify）への矢印がある。verify は pre-push から呼ばれない。
   123	**Evidence**: 「`PP -->|mise run| SEC`」「`PP -->|mise run| VER`」（plan.md:56-57）。lefthook の表（同 566-569）は pre-push の 4 ジョブがそれぞれ `security:osv`、`security:audit`、`test`、`e2e` を呼ぶと定める。
   124	**Confidence**: high
   125	**Proof**: 図と表を突き合わせると、`VER` への矢印だけが表と一致しない。
   126	**Fix**: 図から `PP -->|mise run| VER` を消す。
   127	
   128	### [LOW] 「他の lint / format ツールの設定ファイルを含まない」の検査対象が「など」で曖昧
   129	**Location**: specs/001-dev-environment-and-gates/plan.md:367（repo-policy の規約検査）
   130	**Issue**: 2.1 の検査は「ルートに ESLint / Prettier などの設定ファイルがない」とだけ書かれ、対象の一覧がない。`package.json` の `eslintConfig` や `prettier` キーも対象かどうか決まっていない。
   131	**Evidence**: 「ルートに ESLint / Prettier などの設定ファイルがない（2.1）」（plan.md:367）。spec 2.1「lint と format の設定を `biome.json` だけに持ち、他の lint / format ツールの設定ファイルを含まない」（spec.md:157-158）。
   132	**Confidence**: medium
   133	**Proof**: `.eslintrc.json`、`eslint.config.mjs`、`.prettierrc`、`prettier.config.js`、`dprint.json`、`.stylelintrc`、`package.json` の `eslintConfig` / `prettier` キーのそれぞれを置いたとき、repo-policy が落ちるかを確かめる。
   134	**Fix**: 対象の一覧をテストに書き、`package.json` のキーも検査する。
   135	
   136	### [LOW] 5.4（outdated はファイルを変えない）が R-1 の一度きりの記録だけで、自動化されていない
   137	**Location**: specs/001-dev-environment-and-gates/plan.md:875（5.4 のトレーサビリティ）
   138	**Issue**: `outdated` が `package.json`、`pnpm-lock.yaml`、`mise.toml` を変えないことは、タスク実行の前後で `git status` を比べれば自動化できるが、計画は R-1 の記録に頼る。
   139	**Evidence**: 「5.4 | C5 | R-1（実行前後の `git status`）」（plan.md:875）。spec 5.4「`package.json`、`pnpm-lock.yaml`、`mise.toml` を変更しない」（spec.md:246-247）。
   140	**Confidence**: high
   141	**Proof**: `outdated` の run に `package.json` の書き換えを足した状態で、現在の計画のテストがすべて緑のままになることを確かめる。
   142	**Fix**: hooks-config か専用テストで、`outdated` を実行する前後の三つのファイルのハッシュを比べる（ネットワークを使うため、CI の security-daily に置くか、R-1 の記録を残す判断を plan に書く）。
   143	
   144	### [LOW] 3.12（`check:secrets` が検出値を出力しない）の自動テストがなく、hooks-config はフラグの有無だけを確かめる
   145	**Location**: specs/001-dev-environment-and-gates/plan.md:342（hooks-config の `check:secrets` 検査）、同 866（3.12 のトレーサビリティ）
   146	**Issue**: hooks-config は `--redact` の存在を確かめるだけで、`check:secrets` が検出時に値を出さないことは確かめない。pre-commit 側（C10）とは別に、verify 側の出力は自動検査されていない。
   147	**Evidence**: 「`check:secrets` が `--redact`、`--ignore-gitleaks-allow`、`--log-opts=HEAD` を含む（3.12、3.7、8.5）」（plan.md:341-342）。3.12 のトレーサビリティは「`tests/unit/hooks-config.test.ts`（`--redact`）、R-10」（同 866）。
   148	**Confidence**: medium
   149	**Proof**: 偽キーを HEAD のコミットに入れた一時リポジトリで `check:secrets` の argv を実行し、stdout と stderr に生の値がないことを確かめる。
   150	**Fix**: C10 と同じ要領で、一時リポジトリの履歴に偽キーを入れて `check:secrets` の argv を実行するテストを追加する。
   151	

exec
/bin/zsh -lc "nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md | sed -n '48,119p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 75ms:
    48	### [HIGH] 「非 0 で終わる」だけを確かめるテストは、ツール不在（127）でも緑になる（fake pass）
    49	**Location**: specs/001-dev-environment-and-gates/plan.md:316-318（gate-self-check の (a)）、同 322-325（(c)）、同 350（hooks-config の 7.7 case 1）
    50	**Issue**: 0 件の自己検査と 7.7 case 1 は、終了コードが非 0 であることだけを assert する。コマンドが見つからない（上記 CRITICAL の 2 件）ことでも非 0 になるため、検査対象の動作を確かめないまま緑になる。
    51	**Evidence**: 「(a) `test` の argv + どのファイルにも一致しないフィルタ → 非 0（ファイル 0 件。3.8）」（plan.md:318）。「(c) `e2e` の argv + `--list` + `--grep <一致しないタグ>` → 非 0（3.9）」（同 322-323）。「1. ジョブのツールが見つからない: `PATH=/usr/bin:/bin` で pre-commit フックを実行 → 非 0」（同 350-351）。対照は (b) と case 2 にしかない。
    52	**Confidence**: high（ENOENT が 127 を返すことは probe で確認。assert が終了コードだけであることは plan の文面から確認）
    53	**Proof**: gate-self-check (a) の argv の `pnpm` を解決できない PATH で実行すると、exit 127 のまま `expect(status).not.toBe(0)` が通る。同じ状態で `UnmockedNetworkError` の出力を見る network-guard の (a) は落ちるので、差は assert の書き方にある。
    54	**Fix**: (a) と (c) に、reporter やランナーの固有の出力（「No test files found」、Playwright の該当メッセージ）を assert する。対照として、同じ argv で一致する 1 件を含むテストを実行すると 0 になることを確かめる。7.7 case 1 は、stage 後の出力に gitleaks ではなく「ツール不在」の原因が出ることを assert する。`status === 127` を明示的に区別し、ツール不在と検査失敗を分ける。
    55	
    56	### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
    57	**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
    58	**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
    59	**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
    60	**Confidence**: high
    61	**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
    62	**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。
    63	
    64	### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
    65	**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
    66	**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
    67	**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
    68	**Confidence**: high
    69	**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
    70	**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。
    71	
    72	### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
    73	**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
    74	**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
    75	**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
    76	**Confidence**: high
    77	**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
    78	**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。
    79	
    80	### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
    81	**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
    82	**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
    83	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
    84	**Confidence**: high
    85	**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
    86	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。
    87	
    88	### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
    89	**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
    90	**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
    91	**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
    92	**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
    93	**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
    94	**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。
    95	
    96	### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
    97	**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
    98	**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
    99	**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
   100	**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
   101	**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
   102	**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。
   103	
   104	### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
   105	**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
   106	**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
   107	**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
   108	**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
   109	**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
   110	**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。
   111	
   112	### [LOW] `runCommand` と `useTempGitRepo` の既定の環境が `isolatedEnv()` に結びついていない（prior: round-1 LOW は未適用）
   113	**Location**: specs/001-dev-environment-and-gates/plan.md:187-188（C6 の `runCommand`）、同 280-281（C10 だけに isolatedEnv を明記）、同 750-752（Error Handling）
   114	**Issue**: Error Handling は「pre-push で動く unit テストが GIT_* を引き継ぐ危険」への対策として isolatedEnv を挙げるが、C6 の契約は `runCommand` と `useTempGitRepo` の既定環境を定めていない。対策は C10 にしか結びついていない。
   115	**Evidence**: 「`runCommand()`（シェルを介さない `spawnSync`、タイムアウト付き（既定 30 秒、テストの timeout より短く）、`CommandResult` を返す）」（plan.md:187-188）。「子プロセスは `isolatedEnv()` で実行し、ツールは `resolveTool()` の絶対パスで呼ぶ（I-6）」は C10 の記述（同 280-281）。
   116	**Confidence**: medium（pre-push 中の GIT_DIR 継承は research I-6 の記述に依る。本レビューでは未実測）
   117	**Proof**: `GIT_DIR=$PWD/.git` を設定したまま、`check-model-ids` の CLI を一時リポジトリの `--root` で実行し、対象の git dir を確かめる。
   118	**Fix**: `runCommand` の既定環境を `isolatedEnv()` にし、隔離しない実行は明示的な引数でだけ許す。`useTempGitRepo()` は作成直後に `git rev-parse --absolute-git-dir` が一時パスであることを確かめる。
   119	

exec
/bin/zsh -lc "nl -ba .sdd/reviews/001-dev-environment-and-gates-plan-review-r2.md | sed -n '56,111p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 91ms:
    56	### [MEDIUM] E2E の auto fixture の既定動作（teardown での失敗）は自動テストで確かめられていない（prior: round-1 HIGH 2 は部分適用）
    57	**Location**: specs/001-dev-environment-and-gates/plan.md:388-394（`network-guard.smoke.spec.ts`）、同 221-222（C7）、同 610-611（Interfaces）
    58	**Issue**: 自己検査は `failOnBlockedRequest: false` で teardown の失敗を止めるため、既定の遮断経路（3.11 を実際に守る経路）は自動テストに含まれない。その確認は R-10 の実行記録だけになる。
    59	**Evidence**: 「`test.use({ failOnBlockedRequest: false })` で teardown の失敗を止め」（plan.md:389-390）。「teardown で失敗する経路（既定の `failOnBlockedRequest: true`）は R-10 に、壊し方と失敗の出力を記録する」（同 393-394）。spec 3.11「そのテストを失敗させる」（spec.md:204-205）。spec 9.6 は「自動テストまたは実行記録」を認めている（spec.md:359-360）。
    60	**Confidence**: high
    61	**Proof**: 既定値（`failOnBlockedRequest: true`）のまま、遮断されるリクエストを発するテストを入れ子の `playwright test` で実行し、非 0 と guard の出力を確かめる。現在の計画にはこのテストがない。
    62	**Fix**: 入れ子の Playwright 実行で、既定値の fixture が teardown で失敗することを確かめる自動テストを追加する（round 1 の代替案 2）。あるいは、R-10 の記録を「既定経路の検査」として 9.6 の根拠に明記し、この範囲の判断を spec 側で確定する。
    63	
    64	### [MEDIUM] E2E の「全部 skip」の検出は自動テストになく、R-9 の実行記録だけになった（prior: round-1 MEDIUM「0 件実行」は部分適用）
    65	**Location**: specs/001-dev-environment-and-gates/plan.md:322-325（gate-self-check の (c) と注記）、同 214-216（E2E reporter）、同 719-720（Error Handling）
    66	**Issue**: Vitest 側は `it.todo` だけのフィクスチャで自動検査しているが、E2E 側は `@smoke` が全部 skip の場合を R-9 の記録に回している。round 1 の Fix は両方に自動の 0 件検査を求めていた。
    67	**Evidence**: 「`@smoke` が全部 skip の場合（E2E reporter の判定）は R-9 に実行記録を残す」（plan.md:323-325）。spec 3.9「`@smoke` に一致する E2E テストが 0 件だった場合」（spec.md:199）。round-1 Adjudication は「self-check with an `it.todo`-only fixture」を適用とした（前回 Resolution）。
    68	**Confidence**: high
    69	**Proof**: `@smoke` のテストをすべて `test.skip` にした状態で `pnpm exec playwright test --grep @smoke` を実行し、E2E reporter が非 0 を返すことを、自己検査として自動化する（現在の計画では R-9 の記録のみ）。
    70	**Fix**: `tests/e2e/fixtures/` 相当の場所（`tests/fixtures/gate/` は Vitest の `include` 外にある）に、全部 `test.skip` の E2E フィクスチャを置き、入れ子の `playwright test` で非 0 と reporter の出力を確かめる。最低でも、R-9 の記録を自動化へ格上げするかどうかを plan に明記する。
    71	
    72	### [MEDIUM] 3.5 / 13.2 の「verify がネットワーク不要で通る」の合格判定テストがない
    73	**Location**: specs/001-dev-environment-and-gates/plan.md:470-481（C16 の合格条件と判定テスト）、同 859（3.5 のトレーサビリティ）、同 935（13.2）
    74	**Issue**: 13.2 は「合格条件ごとに、合格を判定するテストのパス」を示すよう求めるが、オフライン verify の合否を判定するテストは計画にない。挙げられたテストは通信ガードの自己検査であり、verify が通ることは判定しない。
    75	**Evidence**: 「段 1 の合格条件 … オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」（plan.md:478-481）。3.5 のトレーサビリティは「R-3（ネットワーク切断・API キー未設定での実行）」（同 859）。spec 13.2「合格を判定するテストのパスを示し、そのパスはリポジトリに実在する」（spec.md:472-473）。
    76	**Confidence**: high
    77	**Proof**: 判定テストが実在するかは、`docs-structure.test.ts` が「合格条件の判定テストのパス」を読んで確かめる形にすると機械的に分かる。現在の計画では、そのテストが存在しない。
    78	**Fix**: 合格条件 1 の判定を、R-3 の手順を自動化した「verify の構成要素の一覧が 3.1 どおりで、外部通信を含まない」テストで代替するか、R-3 を 13.2 の判定根拠として明記し、判定の対象（テストのパスではなく実行記録）を spec 側で確定する。
    79	
    80	### [MEDIUM] `MiseTaskInfo.run` の型が `readonly string[]` のまま。hooks-config は `{ task = … }` のオブジェクトを読む必要がある（prior: round-1 LOW は未適用。再掲を MEDIUM に上げる）
    81	**Location**: specs/001-dev-environment-and-gates/plan.md:530（Data Model）、同 339-340（hooks-config の `verify` 構成検査）
    82	**Issue**: round 1 が指摘した型の誤りは未修正のまま。今回の revision で hooks-config が `verify` / `security` の `run` を「`{ task = … }` と `mise run …` の両方」で読む要件が増えたため、誤った型の影響が大きくなった。
    83	**Evidence**: 「`MiseTaskInfo`（部分） | `name` / `run` | `string` / `readonly string[]` | `mise tasks ls --json`。正確な形は実装時に確認」（plan.md:530）。「`{ task = … }` と `mise run …` のどちらの書き方も受ける」（同 339-340）。probe の出力 `[{"task":"check"},{"task":"test"}]`。
    84	**Confidence**: high
    85	**Proof**: `mise tasks ls --json` の `verify` の `run` を型どおりに `readonly string[]` として読むと、要素がオブジェクトになり、文字列比較が全件外れる。
    86	**Fix**: 型を `ReadonlyArray<string | { task: string }>` にし、型ガードで絞る。Data Model の行を probe の出力に合わせて直す。
    87	
    88	### [MEDIUM] 2.4 / 2.5 の検査はツールを直接呼ぶため、`check` / `typecheck` タスクの対象範囲は検査されない（prior: round-1 MEDIUM は適用済みだが残存）
    89	**Location**: specs/001-dev-environment-and-gates/plan.md:374-384（static-analysis）、同 367（repo-policy）、同 542-543（`check` / `typecheck` の定義）
    90	**Issue**: static-analysis は `biome` と `tsc` を直接実行する。`mise.toml` の `check` が `biome check src` のように狭められても、この検査は緑のままになる。hooks-config は `verify` の構成要素の参照しか見ない。
    91	**Evidence**: 「Biome（`resolveTool` で解決した bin）」「`tsc --noEmit -p`」（plan.md:378、381）。`check` の定義は「`pnpm exec biome check .`」（同 542）、`typecheck` は「`pnpm exec next typegen` → `pnpm exec tsc --noEmit`」（同 543）。spec 2.4 は「verify タスク SHALL 非 0 で終了する」（spec.md:164-165）。
    92	**Confidence**: medium（狭めた場合に緑のままになることは、テストの構成からの推論。未実測）
    93	**Proof**: `mise.toml` の `[tasks.check]` を `biome check src` に変えて、`tests/unit/` に `any` を置いた状態で `mise run verify` が緑のままになることを確かめる。
    94	**Fix**: hooks-config で `check` の run が `biome check .` と完全一致すること、`typecheck` の run が `next typegen` と `tsc --noEmit` を含むことを確かめる。あわせて、static-analysis で `mise run check` / `mise run typecheck` を一時リポジトリに対して実行する形を検討する。
    95	
    96	### [MEDIUM] Biome の `suspicious.noSkippedTests` が実在するか未確認のまま、3.8 / 3.9 の静的な防止策に使われている
    97	**Location**: specs/001-dev-environment-and-gates/plan.md:115-116（C2）、同 379（static-analysis）、同 397-398（`all-todo.fixture.ts`）
    98	**Issue**: Biome の rule 名 `suspicious.noSkippedTests` は research に裏付けがない。名前が違うと `biome.json` が無効になり、`check` が全体で失敗する。
    99	**Evidence**: 「`suspicious.noSkippedTests` も `"error"`（`.skip` / `.fixme` / `xit` による「実行 0 件」を静的に止める。3.8、3.9）」（plan.md:115-116）。research I-9 が記録しているのは `linter.rules.preset`、`noUnusedVariables`、`noUnusedImports`、`noExplicitAny` の 4 項目だけ（research.md:165-172）。
   100	**Confidence**: medium（rule 名の存在は未確認。Biome の公式スキーマを見て確かめる必要がある）
   101	**Proof**: `@biomejs/biome@2.6.8` の `configuration_schema.json` に `noSkippedTests` が `suspicious` グループの下にあるかを確かめる。ない場合は `biome check` が設定エラーで非 0 になる。
   102	**Fix**: research I-9 に、`noSkippedTests` の所属グループとスキーマ上の確認結果を追記する。存在しない場合は、Vitest / Playwright の reporter による検査だけに寄せ、plan の文言を直す。
   103	
   104	### [MEDIUM] `check:secrets` と pre-commit の argv に `--verbose` が付くが、「出力に生の値が出ない」根拠（I-6）は `--verbose` を含むかどうか記録されていない
   105	**Location**: specs/001-dev-environment-and-gates/plan.md:545（`check:secrets`）、同 561（pre-commit の secrets）、同 268-269（C10 手順 3）、同 232（8.6 相当）。根拠は research.md:115-118
   106	**Issue**: 3.12 と 8.6 は、gitleaks の出力に検出値が出ないことを求める。research I-6 の実測（`Secret: REDACTED`、生の値の出現 0 件）には `--verbose` の記録がなく、計画の argv は `--verbose` を付ける。`--verbose` が `Line` などの欄に生の行を出すかどうかは、本レビューでは確かめられなかった。
   107	**Evidence**: 「`gitleaks git --pre-commit --staged --redact --ignore-gitleaks-allow --verbose`」（plan.md:561）。research I-6 は「`RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件」と記録している（research.md:116-117）。spec 8.6「gitleaks の出力に偽キーの値が含まれないことを確かめる」（spec.md:331-332）。
   108	**Confidence**: low（gitleaks の probe を権限の拒否で実行できなかった。未確認の懸念として扱う）
   109	**Proof**: 計画どおりの argv（`--verbose` 付き）で偽キーを stage し、stdout と stderr に生の値が含まれないことを確かめる。失敗すれば 8.6 と 3.12 を満たさない。
   110	**Fix**: I-6 の再実測を、計画どおりの argv で行い、結果を research に記録する。生の値が出る場合は、`--verbose` の扱いを plan で決め直す。
   111	

**Reviewing the plan**

The user is asking for a plan review, which may not require a web search, especially if my information is based on existing documentation. I think I should examine the ADR4 dependency declaration and the external dependency list to look for any undeclared dependencies. Maybe I need to focus on understanding ADR4 more thoroughly to provide accurate insights for the user. I'll make sure to look into that!
exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/research.md | sed -n '272,412p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 86ms:
   272	## Existing patterns to reuse
   273	
   274	| Pattern | Location | Why reuse |
   275	|---------|----------|-----------|
   276	| ZIP の基盤ファイル | `genai-lab.zip` の `mise.toml` ほか | spec の Scope が「取り込みと §2.2 の修正」と定める |
   277	| `mise.<env>.toml` の差分構成 | ZIP の `mise.node27.toml` | I-3 で合成を確認済み。node だけを上書きできる |
   278	| Playwright `page.route` による SSE モック | ZIP の `tests/e2e/chat.smoke.spec.ts` | 段 3 で使う。段 1 は ZIP 検証（12.4）の対象として実行だけする |
   279	| 検証記録の見出し（結論 / 検証した版 / 通したゲート / 未解決事項 / 再現手順） | plan §3.3（next-agentic-stack の形式） | 11.5 が同じ見出しを求める。本文は複製しない |
   280	| Conventional Commits の type 一覧 | sdd-tdd-kit の committing-changes（plan §4） | commit-msg 検査の語彙を揃える。実装はリポジトリ内の小さなスクリプト |
   281	
   282	## External dependencies
   283	
   284	設計時点（2026-11-22）の候補。実装時に「24h を満たす版」を改めて確認し、採用版と公開日時を
   285	「実装時の記録 R-1」に書く（1.3）。
   286	
   287	| Dependency | Version（候補） | Published（UTC） | Purpose | Verified |
   288	|------------|-----------------|------------------|---------|----------|
   289	| Node.js | 26.13.1 | 2026-11-11T16:44Z | 既定レーン | mise ls-remote / GitHub release |
   290	| Node.js（alpha） | 27.0.0-alpha.0.1.1 | 2026-11-17T03:48Z | Node 27 レーン | mise ls-remote（install は実装時） |
   291	| pnpm | 12.22.0 | 2026-11-17T20:20Z | パッケージ管理 | GitHub release |
   292	| lefthook | 2.2.2 | 2026-10-13T09:20Z | Git フック | probe で install・dump・hook 実行 |
   293	| gitleaks | 8.30.1 | 2026-03-21T02:17Z | シークレットスキャン | probe で staged / 全履歴を実行 |
   294	| osv-scanner | 2.7.1 | 2026-11-09T04:15Z | OSV 脆弱性検査 | GitHub release（実行は実装時） |
   295	| next | 16.5.0-canary.59 | 2026-11-20T23:53Z | プレースホルダーページ・E2E の webServer | npm time（canary.60 は 24h 未満） |
   296	| react / react-dom | 19.3.1 | 2026-10-14 | 同上 | npm time |
   297	| typescript | 7.1.0-beta | 2026-10-20T16:45Z | 型検査（`tsc`） | npm time・`bin.tsc` |
   298	| @types/node | 26.6.6 | 2026-10-28 | Node 型 | npm time |
   299	| @types/react / @types/react-dom | 19.3.0 | 2026-09-09 | React 型 | npm time |
   300	| @biomejs/biome | 2.6.8 | 2026-11-15T14:34Z | lint / format | npm time・schema |
   301	| vitest | 5.1.1 | 2026-11-18T07:35Z | unit テスト | npm time・docs |
   302	| @playwright/test | 1.65.1 | 2026-11-13T21:12Z | E2E テスト | npm time・docs |
   303	| actions/checkout | v7.0.1 | 2026-07-20 | CI | GitHub release（SHA は実装時に解決） |
   304	| jdx/mise-action | v5.2.10 | 2026-11-18 | CI でツールを install | GitHub release（v5.3.0 は 24h 未満） |
   305	
   306	段 1 では使わないため**入れない**依存（ADR-4）: `ai`、`@ai-sdk/*`、`zod`、`@vitejs/plugin-react`、
   307	`server-only`。ZIP 検証（12.2〜12.4）の使い捨て環境でだけ入れる。
   308	
   309	## Architecture decisions
   310	
   311	### ADR-1: verify はタスクの直列チェーンにする
   312	
   313	- **Context**: ZIP の verify は `depends` による並列実行で、ネットワークが必要な security を含む。
   314	  `next typegen`（typecheck）と `next dev`（E2E）が `.next/` を同時に書く競合もある。3.6・3.7 と
   315	  Clarifications 2 問目がある。
   316	- **Decision**: `verify` は `run` 配列で `check` → `typecheck` → `check:model-ids` → `check:secrets` →
   317	  `test` → `e2e` を直列に呼ぶ。最初の失敗で止まり非 0（I-3）。`gate` は `alias`。security は別タスク。
   318	- **Alternatives**: `depends` で並列（速いが、出力が混ざり、`.next/` の競合で決定論を損なう）。
   319	  ZIP どおり security を含める（オフラインで失敗し 3.5・3.6 に反する）。
   320	- **Consequences**: 実行時間は並列より長い。所要時間は NFR として実測して記録する。
   321	
   322	### ADR-2: フックは mise タスクを呼び、staged 専用の 2 ジョブだけ素のコマンドにする
   323	
   324	- **Context**: 7.8 はフックと verify / security が同じ検査対象・判定基準を使うことを求める。8.3 はテストが
   325	  secrets ジョブの引数を `lefthook.yml` から取ることを求める。
   326	- **Decision**: `typecheck`、`check:model-ids`、`security:osv`、`security:audit`、`test`、`e2e` のジョブは
   327	  `mise run <task>` を呼ぶ。staged 専用の `gitleaks git --pre-commit --staged --redact --verbose` と
   328	  `pnpm exec biome check --staged …` だけを素のコマンドにする（gitleaks には plan レビュー後に
   329	  `--ignore-gitleaks-allow` を加えた）。設定テストが、各ジョブの参照するタスクが
   330	  `mise.toml` に実在することを確かめる。
   331	- **Alternatives**: 全ジョブに素のコマンドを書く（ZIP。verify との二重定義になり、ずれても気づけない）。
   332	- **Consequences**: フックの実行に mise が必須になる（7.7 の前提と一致。README に明記、13.4）。
   333	
   334	### ADR-3: `assert_lefthook_installed: true` を設定する
   335	
   336	- **Context**: I-4 のとおり、既定ではフックが lefthook を見つけられないと終了コード 0 で通過する。
   337	- **Decision**: `lefthook.yml` の先頭に `assert_lefthook_installed: true`。設定テストでこの値を検査し、
   338	  最小の PATH でフックが非 0 になることを自動テストで確かめる。
   339	- **Alternatives**: `.githooks/` の自前スクリプト（D4 に反する）。README の注意だけ（7.7 を満たさない）。
   340	- **Consequences**: lefthook を消した環境では commit / push ができない。回避は `--no-verify` / `LEFTHOOK=0`
   341	  で、憲章の回避規律（環境要因の証明と PR 本文への記録）に従う。
   342	
   343	### ADR-4: package.json には段 1 のコードが使う依存だけを入れる
   344	
   345	- **Context**: Clarifications 1 問目で、ZIP のアプリコードは取り込まない。ZIP の package.json は AI SDK、
   346	  プロバイダ 4 種、Zod、`@vitejs/plugin-react` を含む。
   347	- **Decision**: dependencies は `next`、`react`、`react-dom`。devDependencies は `@biomejs/biome`、
   348	  `@playwright/test`、`@types/node`、`@types/react`、`@types/react-dom`、`typescript`、`vitest`。
   349	  AI SDK・プロバイダ・Zod・`server-only` は、最初に import する段（002 以降）の plan で宣言して入れる。
   350	  ZIP の全依存は使い捨て環境（ADR-9）でだけ入れ、その版と結果を各段へ引き継ぐ。
   351	- **Alternatives**: ZIP の依存をすべて今入れる（使わない依存が audit の対象と攻撃面を増やし、実際に使う段の
   352	  時点では pin が古くなる。plan §2.1 の「現時点の採用版」の考え方に合わない）。
   353	- **Consequences**: plan §2 の技術スタック表の AI 行は段 002 以降で満たされる。plan §8.5 の改訂注記
   354	  （13.10）にこの扱いを書く。**設計承認時に確認してほしい判断**。
   355	
   356	### ADR-5: 未モック通信の遮断は依存を足さずに実装する
   357	
   358	- **Context**: 3.10・3.11・9.5。MSW などは新しい依存になる（原則 10）。HTTP クライアントだけを差し替えると、
   359	  `node:net` を直接使う経路が漏れる。
   360	- **Decision**:
   361	  - unit: Vitest の `setupFiles`（`tests/unit/setup/network-guard.ts`）で `net.Socket.prototype.connect` と
   362	    `globalThis.fetch` を置き換え、呼ばれたら `UnmockedNetworkError` を投げて違反を記録する。`afterEach` で
   363	    違反があればそのテストを失敗させる（呼び出し側が例外を握りつぶしても失敗する）。
   364	  - E2E: `tests/e2e/fixtures.ts` の auto fixture が `context.route("**/*")` で全リクエストを受け、
   365	    テスト対象のオリジン以外を `abort` して記録し、teardown で違反があれば失敗させる。テスト個別の
   366	    `page.route` のモックは context の route より優先されるので、モック済みの通信は fixture に届かない。
   367	    E2E は `@playwright/test` ではなく `fixtures.ts` から `test` を import する（Biome の
   368	    `noRestrictedImports` で強制）。
   369	- **Alternatives**: MSW の `onUnhandledRequest: "error"`（依存追加、`net` 直叩きを捕まえない）。
   370	  Playwright の `--offline` 相当の context 設定（同一オリジンの dev サーバーまで止まる）。
   371	- **Consequences**: unit テストはローカルホストを含む全ソケット接続を禁止する。将来ソケットが必要な段は、
   372	  その段の plan で例外の仕組みを宣言する。
   373	
   374	### ADR-6: `check:model-ids` は git の追跡対象＋未追跡（ignore 以外）を走査する
   375	
   376	- **Context**: 6.3〜6.7。開発者は `.env.local` に実際のモデル ID を書く（gitignore 済み）。単純なファイル
   377	  走査だと、それを検出してローカルで失敗し、`node_modules` も辿る。
   378	- **Decision**: `git -C <root> ls-files --cached --others --exclude-standard` で候補を列挙し、走査対象の
   379	  規則（6.5）と除外（allowlist ファイル、`tests/fixtures/**`）で絞る。検出は「allowlist の全 ID」＋
   380	  「プロバイダ命名形式の正規表現」。allowlist は Node の型ストリップで import する（I-7）。
   381	- **Alternatives**: `fs.globSync` での走査（ignore 済みの秘密ファイルまで読む）。allowlist を正規表現で
   382	  文字列解析（書式の変更で壊れる）。
   383	- **Consequences**: git が必要（全環境にある）。テストは一時ディレクトリを `git init` して入力を置く。
   384	
   385	### ADR-7: CI は verify と verify-node27 を別ジョブにする
   386	
   387	- **Context**: 10.1〜10.4。ZIP の matrix だと必須チェック名が `verify ()` になり、ruleset で指定しにくい。
   388	  週次 schedule は Node 27 レーンだけに要る。
   389	- **Decision**: `verify`（既定レーン、verify + security、必須）と `verify-node27`（`MISE_ENV=node27`、
   390	  verify のみ、`continue-on-error: true`）を別ジョブにする。`verify` は `schedule` では動かさない。
   391	  日次の security は別ワークフロー `security-daily.yml`。
   392	- **Alternatives**: matrix（チェック名が不安定、`continue-on-error` の式が読みにくい）。
   393	- **Consequences**: ステップが 2 ジョブで重複する。重複は 6 ステップ程度で、composite action は作らない。
   394	
   395	### ADR-8: commit-msg はリポジトリ内のスクリプトで検査する
   396	
   397	- **Context**: 7.4。commitlint は依存が多い（原則 10）。
   398	- **Decision**: `scripts/check-commit-msg.mjs <msg-file>` が 1 行目を Conventional Commits の正規表現で
   399	  検査する。git が生成する `Merge …` / `Revert "…"` と `fixup!` / `squash!` / `amend!` は通す。
   400	- **Alternatives**: `@commitlint/cli` + `@commitlint/config-conventional`。
   401	- **Consequences**: 規則の範囲は 1 行目の形式に限る（本文・フッターの書式は検査しない）。
   402	
   403	### ADR-9: ZIP のアプリコードは使い捨て環境で検証する
   404	
   405	- **Context**: Requirement 12。ZIP のアプリコードは `src/` / `tests/` に入れない（12.7）。
   406	- **Decision**: リポジトリ外の一時ディレクトリに ZIP を展開し、`package.json` の dist-tag と範囲を
   407	  24h を満たす exact 版に置き換えて install し、`tsc --noEmit`、型定義の API 名の照合、unit テスト、
   408	  E2E smoke を実行する。結果は「実装時の記録 R-6」に、ファイルごと・API ごとに書く。使い捨て環境の
   409	  成果物はコミットしない。
   410	- **Alternatives**: リポジトリ内の一時ブランチ（ZIP のコードが履歴に残り、12.7 の趣旨に反する）。
   411	- **Consequences**: 手順は再現手順として記録し、段 003〜006 の spec が参照する。
   412	

**Deciding on findings**

I need to decide on my findings regarding the current plan, which seems promising. I should consider the specifications, ensuring that all acceptance criteria are mapped to design elements and tested or recorded properly. However, the user wants thorough requirement coverage, particularly for sections like permissions and weekly reviews. There’s some confusion about the "test or recorded check" since it appears more like a review than an actual recorded check. The traceability suggests that while a review is essential, it may not fulfill the recorded aspect entirely.
**Exploring traceability issues**

I’m considering the broad issue that traceability only leaves 11 acceptance criteria for review with no deterministic check or record. It's not that all criteria strictly need tests; some can be validated through governance or CI properties. However, a recorded check might be a review report in .sdd reviews, which would be documented. The user desires comprehensive details, so I might flag this issue. There are some specific facts about the setup and execution scripts that could impact testing, especially involving paths and dependencies.
**Assessing resolution issues**

I’m unsure if `gitleaks` is resolved by lefthook differently. I believe the tests are passing, which is a good sign. The Git resolution's parent path appears to work well on both Mac and Linux, with paths like `/opt/homebrew/bin/git` for Mac and `/usr/bin` for Linux. That's reassuring. The fake password helper seems effective too, as it excludes the spawn errors and reports status codes 126 and 127 correctly, which is another positive outcome.
exec
/bin/zsh -lc "nl -ba specs/001-dev-environment-and-gates/research.md | sed -n '101,230p'" in /Users/Shared/codes/genai-lab-ts
 succeeded in 95ms:
   101	### I-5 lefthook: 設定の機械可読な取得（8.3）
   102	
   103	- **Question**: テストが `lefthook.yml` の secrets ジョブの引数を、YAML パーサーを依存に足さずに取得できるか。
   104	- **Findings**: `lefthook dump --format=json`（2.2.2）は、`lefthook-local.yml` などを合成した**実際に使われる
   105	  設定**を JSON で出力する。`pre-commit.jobs[].{name,run}`、`pre-push.piped`、`pre-commit.parallel`、
   106	  `assert_lefthook_installed` を読める。→ YAML ライブラリを追加しない（憲章 原則 10）。
   107	- **Evidence**: `lefthook dump --help`（`--format string 'yaml', 'toml', or 'json'`）と、probe 設定の
   108	  `lefthook dump --format=json` 出力。
   109	
   110	### I-6 gitleaks: staged 検査・全履歴・redact（3.12、8.x）
   111	
   112	- **Question**: 一時リポジトリ（HEAD なし）で `gitleaks git --pre-commit --staged --redact` が期待どおりの
   113	  終了コードを返し、出力に値を含めないか。現在の履歴に検出はあるか。
   114	- **Findings**（gitleaks 8.30.1）:
   115	  - HEAD のない新規リポジトリで、秘密値なしのファイルだけを stage → `exit=0`。
   116	  - 実行時に組み立てた偽の GitHub PAT（`"gh" + "p_"` + 36 文字の乱数英数字）を stage → `exit=1`、
   117	    `RuleID: github-pat`、`Secret: REDACTED`、出力中の生の値の出現 0 件。
   118	  - 現リポジトリの全履歴 `gitleaks git --redact` → `6 commits scanned`、`no leaks found`。
   119	  - `gitleaks git` の既定は `git log -p -U0 --full-history --all --diff-filter=tuxdb`（`--log-level debug` の
   120	    `executing:` 行）で、**すべてのローカル ref（別ブランチ・stash）**を走査する。`--log-opts=HEAD` を付けると
   121	    `git log -p -U0 HEAD` になり、HEAD から到達できるコミットだけを走査する（同じく 6 commits、検出なし、
   122	    exit 0。2026-11-22 確認）。→ 3.7 の決定論のため verify の `check:secrets` は `--log-opts=HEAD` を使う
   123	    （spec Clarifications「plan レビュー後の決定」）。
   124	  - `--ignore-gitleaks-allow`（`gitleaks:allow` コメントを無視する）は 8.30.1 の `gitleaks git --help` にある。
   125	    設定の探索順は `--config` → `GITLEAKS_CONFIG` → `GITLEAKS_CONFIG_TOML` → `<target>/.gitleaks.toml`。
   126	  - mise のシムは、プロジェクトの `mise.toml` かグローバルで版が決まっていないと
   127	    `No version is set for shim: gitleaks` で失敗する。テストは verify（`mise run test`）経由で
   128	    mise 管理の PATH から gitleaks を呼ぶ前提にする。
   129	  - git はフック実行中に `GIT_DIR` / `GIT_INDEX_FILE` などを子プロセスへ渡す。pre-push の Vitest が
   130	    一時リポジトリで git を呼ぶとき、これを引き継ぐと**実リポジトリの index を操作する**おそれがある。
   131	    → テストの子プロセス環境から `GIT_*` を除き、`GIT_CONFIG_GLOBAL=/dev/null`、`GIT_CONFIG_NOSYSTEM=1`
   132	    を設定する（plan の Error Handling に記載）。
   133	- **Evidence**: scratchpad `probe-gitleaks.sh` の出力、`gitleaks git --redact --no-banner` の出力。
   134	
   135	### I-7 Node 26: `.mjs` から `.ts` の import（`check:model-ids`）
   136	
   137	- **Question**: `scripts/check-model-ids.mjs` が、ビルドなしで `src/lib/ai/model-allowlist.ts` を import
   138	  できるか。
   139	- **Findings**: Node 26.13.1 は型ストリップが既定で有効で、`as const` / `satisfies` / 型 export だけの
   140	  `.ts` を `.mjs` から import でき、警告も出ない。`node:fs` の `globSync` も存在する。
   141	  → allowlist の値を文字列解析せず、モジュールとして読む。allowlist は消去可能な構文だけで書く
   142	  （`enum` などを使わない）。
   143	- **Evidence**: probe 出力 `{"openai":["x-model-a"],"anthropic":["x-model-b"]}` / `function` / `exit=0`。
   144	
   145	### I-8 pnpm 12: install スクリプト、release-age、audit、outdated
   146	
   147	- **Question**: 1.4・1.5・1.8・4.2〜4.5・5.3 を満たす設定と終了コード。
   148	- **Findings**（pnpm.io の docs、2026-11-22 の main）:
   149	  - `strictDepBuilds` の既定は **`true`**: `allowBuilds` に載っていない install スクリプトがあると install が
   150	    **非 0** で終わる。未記載のものは install 時に `pnpm-workspace.yaml` へプレースホルダーとして自動追記
   151	    される。→ スクリプトを持つ依存を**すべて** `allowBuilds` に `true` / `false` で列挙し、理由をコメントで
   152	    書く（1.5、1.8）。`onlyBuiltDependencies` などは v11 で削除済み。
   153	  - `minimumReleaseAge` を明示すると `minimumReleaseAgeStrict` が既定 `true` になり、24h を満たす版が
   154	    ないと解決自体が失敗する（黙って新しい版へ落ちない）。
   155	  - `pnpm audit`: advisory が audit level 以上なら `exit 1`。`--ignore-registry-errors` を付けると registry
   156	    の非 200 を成功扱いにする → **付けない**（4.4）。除外は `audit.ignore`（GHSA ID の一覧、
   157	    `pnpm-workspace.yaml`）。旧 `auditConfig.ignoreGhsas` は非推奨。
   158	  - `pnpm outdated`: **更新候補が 1 つでもあると `exit 1`**。→ outdated タスクの終了コードの意味を文書化する
   159	    （5.3 は一覧の出力だけを求める）。
   160	- **Evidence**: `pnpm/pnpm.io` の `docs/settings/build.md`（strictDepBuilds、allowBuilds）、
   161	  `docs/settings/dependency-resolution.md`（minimumReleaseAge、minimumReleaseAgeStrict）、
   162	  `docs/cli/audit.md`（exit code、`--ignore-registry-errors`、`audit.ignore`）、`docs/cli/outdated.md`。
   163	  **registry 到達不能時の実際の終了コード（4.4）と、osv-scanner の同条件は実装時に実測する**。
   164	
   165	### I-9 Biome 2.6.8: ルール名と preset
   166	
   167	- **Question**: 2.2 の 3 ルールの所属グループと、ZIP の `linter.rules.preset` が有効な書き方か。
   168	- **Findings**: `linter.rules.preset`（`recommended | all | none`、既定 `recommended`）が正式で、
   169	  `linter.rules.recommended` は非推奨。`noUnusedVariables` / `noUnusedImports` は `correctness`、
   170	  `noExplicitAny` は `suspicious` にある。→ 3 ルールを明示的に `"error"` にする（既定の重大度に依存しない）。
   171	- **Evidence**: `biomejs/biome` タグ `@biomejs/biome@2.6.8` の
   172	  `packages/@biomejs/biome/configuration_schema.json`。
   173	
   174	### I-10 Vitest 5.1.1 / Playwright 1.65.1: 0 件時の挙動とリトライ
   175	
   176	- **Question**: 3.8・3.9 を既定の挙動で満たせるか。
   177	- **Findings**:
   178	  - Vitest `passWithNoTests` の既定は `false`（テストファイルが見つからなければ失敗）。
   179	  - Playwright は `--pass-with-no-tests` を付けたときだけ 0 件で成功する（既定は失敗）。
   180	    `--fail-on-flaky-tests`、`forbidOnly`、`retries` が設定にある。
   181	  - → 既定に頼りつつ、`vitest.config.ts` に `passWithNoTests: false` を明記し、実設定を使う自己検査テストで
   182	    回帰を検出する。
   183	- **Evidence**: `vitest-dev/vitest@v5.1.1` の `docs/config/passwithnotests.md`、
   184	  `microsoft/playwright@v1.65.1` の `docs/src/test-cli-js.md`（`--pass-with-no-tests`）と
   185	  `docs/src/test-api/class-testconfig.md`。
   186	
   187	### I-11 Next.js 16.5 canary: 型生成と tsconfig
   188	
   189	- **Question**: `tsc --noEmit` を `next dev` の実行有無に左右されず決定論的にできるか。
   190	- **Findings**: `next typegen` は `.next/types` と `next-env.d.ts` を生成し、dev サーバーが動いていなければ
   191	  `.next/dev/types` を削除する。公式手順は `next typegen && tsc --noEmit`。`next-env.d.ts` は
   192	  `.gitignore` に入れる。`next dev` / `next build` は `tsconfig.json` に推奨値を書き足すことがある →
   193	  取り込み時に一度 `next dev` を起動して書き足しを受け入れ、verify 後に作業ツリーが変わらないことを
   194	  確かめる（CI でも検査する）。
   195	- **Evidence**: `vercel/next.js@v16.5.0-canary.59` の `docs/01-app/03-api-reference/06-cli/next.mdx`
   196	  （`next typegen` の節）と `docs/01-app/03-api-reference/05-config/02-typescript.mdx`（`next-env.d.ts`）。
   197	  `next@16.5.0-canary.59` の peerDependencies は `react` / `react-dom` が `^18.2.0 || ^19.0.0` で
   198	  `typescript` を含まない。
   199	
   200	### I-12 Dependabot: cooldown と pnpm 12
   201	
   202	- **Question**: 10.11・10.12 を満たす設定があるか。pnpm 12 の lockfile を扱えるか。
   203	- **Findings**: `cooldown.default-days` で公開からの待機日数を指定できる（npm と GitHub Actions で対応）。
   204	  指定しない場合も既定で 3 日の cooldown がかかるが、本リポジトリは 24h 規律を明示するため
   205	  `default-days: 1` を書く。cooldown は version updates にだけ効き、security updates には効かない。
   206	  supported ecosystems の表で pnpm は v12 まで対応（feature flag 付きの記述）。mise.toml のツールは
   207	  Dependabot の対象外 → `mise run outdated` で週次に確認する。
   208	- **Evidence**: `github/docs` の
   209	  `content/code-security/reference/supply-chain-security/dependabot-options-reference.md`（`cooldown` 節）と
   210	  `supported-ecosystems-and-repositories.md`（pnpm 行）。
   211	
   212	### I-13 GitHub リポジトリ設定（10.2）
   213	
   214	- **Question**: verify 失敗時のマージブロックに、リポジトリ側の設定が要るか。
   215	- **Findings**: ruleset `protect-main`（id 27838452、対象 `~DEFAULT_BRANCH`）があるが `enforcement: disabled`
   216	  で、`required_status_checks` を持たない。→ 10.2 には ruleset の有効化と必須チェック `verify` の追加が
   217	  要る。リポジトリ外の設定変更なので、実装時に内容を示してユーザーの確認を得てから行う。
   218	- **Evidence**: `gh api repos/Fukuchan77/genai-lab-ts/rulesets/27838452`。
   219	
   220	### I-14 モデル ID の命名形式（6.4）
   221	
   222	- **Question**: allowlist 未登録の ID を検出するための、プロバイダごとの命名形式。
   223	- **Findings**: Web 検索のスニペットでは、OpenAI は `gpt-<数字>…`（`-sol` / `-luna` などの接尾辞を含む）と
   224	  `o<数字>…`、Google は `gemini-<数字>…`、Anthropic は `claude-<ファミリー>-<数字>…` の形式が使われている。
   225	  検索結果は版の記述が食い違っており、**具体的な ID は採用根拠にしない**。allowlist に登録する ID は、
   226	  実装時に各プロバイダの公式ドキュメント（OpenAI models、Anthropic models overview、Gemini API models、
   227	  Ollama library）で存在を確認して記録する（6.2）。
   228	- **Evidence**: WebSearch（developers.openai.com/api/docs/models、ai.google.dev/gemini-api/docs/models の
   229	  検索結果）。公式ページの本文確認は実装時。
   230	

**Evaluating project specifications**

I’m looking at the project files, particularly the steering documentation and the specs from acceptance 13.9, which seem to mandate specific technical and structural requirements. I’m wondering if extra modifications, like state annotations, might be in scope. However, the scope mentions focusing on steering, `tech.md`, and `structure.md`, but not on the product. So I need to clarify if those modifications are allowed and necessary.
**Considering test implementation**

I’m thinking about adding a test in `tests/unit/verify-offline-contract.test.ts` to ensure that the `verify` task graph excludes security features and `process.env`. But I'm not entirely sure if just invoking it like that would prove no net effect. The test might be more of a static proof than a dynamic one. Also, I should fix the documentation paths to point to the contract test and explicitly clarify the proof for requirement 3.5 and record R3.
**Evaluating test commands**

I’m considering how to structure a future negative test focused on removing the check for secrets. I'm not sure if this test will be effective, though. It seems like a better approach might be to modify the `mise.toml` file to include a network-dependent task, ensuring that all named tests still pass. This shift could clarify whether the tests maintain their validity under the new conditions. Let's explore this further!
**Considering command validation**

I think that merely comparing documentation could suffice, but I need to use a specific command or test. Running `lefthook dump --format=json` and then using `grep` makes sense for checking the current configuration. I should focus on the task table rather than running any unnecessary commands. I see that comparing specific lines is a good approach, but proving that a command or test is needed is also essential. Just executing `mise task ls` won't effectively demonstrate the pre-push proof.
codex
## Critique
### [MEDIUM] オフライン verify の合格判定テストが要件 13.2 の意味で定義されていない (prior: escalated to spec decision)
**Location**: specs/001-dev-environment-and-gates/plan.md:559-561, 949, 1025  
**Issue**: `docs/stages/` に示す予定の 3 テストはいずれも `mise run verify` がネットワークなし・API キーなしで完走することを判定せず、Requirement 13.2 が求める当該合格条件の判定テストのパスになっていない。  
**Evidence**: C16 は「オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」とするが、各テストの設計は未モック通信、0 件実行、外部オリジン遮断の自己検査である（同:348-377, 448-466）。一方で 3.5 の実証は R-3 の実行記録だけに置かれている（同:949）。spec.md:472-473 は各合格条件について「合格を判定するテストのパス」を示すことを求める。これは現行計画と research.md の比較による推論であり、追加の probe は実行していない。なお、round 2 の CRITICAL 2 件と HIGH 1 件は解消済みである。現行 C6 は `dirname(process.execPath)` を PATH に含め、`git` を親 PATH から絶対パス解決し、`expectGateFailure` が `ENOENT`・126・127 を拒否する。  
**Confidence**: high  
**Proof**: `check` タスクの先頭にネットワーク必須のコマンドを追加しても、計画上の 3 テストはそのコマンドをネットワーク遮断環境で実行していないため、それ自体では 3.5 違反を検出できない。実際の `mise run verify` をネットワーク不能・API キー未設定で実行した R-3 だけが失敗する。  
**Fix**: `tests/unit/verify-offline-contract.test.ts` などを追加し、verify の完全なタスクグラフがネットワークタスクを含まないこと、各構成要素が API キー不要であることを検査する。さらに `docs/stages/` ではこのテストを 13.2 の判定テストとして示し、実ネットワーク遮断下での完走は R-3 の実測記録で補完する、と明記する。これで不十分と判断する場合は、13.2 が実行記録も許すよう spec を明示的に改訂する。

### [LOW] Architecture Overview の pre-push 経路が実際のフック定義と矛盾している (prior: LOW, not applied)
**Location**: specs/001-dev-environment-and-gates/plan.md:57  
**Issue**: Mermaid 図は pre-push が `mise run verify` を呼ぶように描くが、フック設計は `security:osv`、`security:audit`、`test`、`e2e` を個別に直列実行する。  
**Evidence**: 図には `PP -->|mise run| VER` がある一方、lefthook 表は pre-push の各ジョブを `mise run security:osv`、`mise run security:audit`、`mise run test`、`mise run e2e` と定義している（plan.md:647-650）。これは文書内比較による確認であり、外部 probe は不要である。  
**Confidence**: high  
**Proof**: 実装後に `lefthook dump --format=json` の `pre-push.jobs[].run` を取得すると、`mise run verify` は含まれず、4 個の個別タスクだけが含まれることを確認できる。  
**Fix**: `PP -->|mise run| VER` の矢印を削除し、必要なら `test` と `e2e` を表すノードまたは矢印を追加してフック表と一致させる。

### [LOW] `product.md` の更新が spec の明示した steering 更新範囲を超えている
**Location**: specs/001-dev-environment-and-gates/plan.md:570-571, 774  
**Issue**: 計画は `.sdd/steering/product.md` の状態注記更新を成果物に含めるが、Requirement 13.9 が指定する更新対象は `tech.md` と `structure.md` のみである。  
**Evidence**: plan は「`.sdd/steering/tech.md`、`structure.md`、`product.md`」を更新対象に列挙し、File Structure Plan にも `product.md | Modify + Commit` を含める。対して spec.md:492-493 は「`tech.md` の Gate command、`structure.md` の状態注記」と明記する。これは spec と plan の直接比較による確認であり、外部 probe は不要である。  
**Confidence**: high  
**Proof**: 実装 PR の `git diff --name-only` に `.sdd/steering/product.md` が含まれても、13.9 の受け入れ基準だけからはその変更を必要と判断できない。  
**Fix**: `product.md` を本 spec の変更対象から外す。更新が必要なら、理由と受け入れ基準を spec に追加してから plan の File Structure Plan に残す。

## Verdict
REQUEST_CHANGES
tokens used
178,404
## Critique
### [MEDIUM] オフライン verify の合格判定テストが要件 13.2 の意味で定義されていない (prior: escalated to spec decision)
**Location**: specs/001-dev-environment-and-gates/plan.md:559-561, 949, 1025  
**Issue**: `docs/stages/` に示す予定の 3 テストはいずれも `mise run verify` がネットワークなし・API キーなしで完走することを判定せず、Requirement 13.2 が求める当該合格条件の判定テストのパスになっていない。  
**Evidence**: C16 は「オフライン verify → `tests/unit/network-guard.test.ts`・`tests/unit/gate-self-check.test.ts`・`tests/e2e/network-guard.smoke.spec.ts`」とするが、各テストの設計は未モック通信、0 件実行、外部オリジン遮断の自己検査である（同:348-377, 448-466）。一方で 3.5 の実証は R-3 の実行記録だけに置かれている（同:949）。spec.md:472-473 は各合格条件について「合格を判定するテストのパス」を示すことを求める。これは現行計画と research.md の比較による推論であり、追加の probe は実行していない。なお、round 2 の CRITICAL 2 件と HIGH 1 件は解消済みである。現行 C6 は `dirname(process.execPath)` を PATH に含め、`git` を親 PATH から絶対パス解決し、`expectGateFailure` が `ENOENT`・126・127 を拒否する。  
**Confidence**: high  
**Proof**: `check` タスクの先頭にネットワーク必須のコマンドを追加しても、計画上の 3 テストはそのコマンドをネットワーク遮断環境で実行していないため、それ自体では 3.5 違反を検出できない。実際の `mise run verify` をネットワーク不能・API キー未設定で実行した R-3 だけが失敗する。  
**Fix**: `tests/unit/verify-offline-contract.test.ts` などを追加し、verify の完全なタスクグラフがネットワークタスクを含まないこと、各構成要素が API キー不要であることを検査する。さらに `docs/stages/` ではこのテストを 13.2 の判定テストとして示し、実ネットワーク遮断下での完走は R-3 の実測記録で補完する、と明記する。これで不十分と判断する場合は、13.2 が実行記録も許すよう spec を明示的に改訂する。

### [LOW] Architecture Overview の pre-push 経路が実際のフック定義と矛盾している (prior: LOW, not applied)
**Location**: specs/001-dev-environment-and-gates/plan.md:57  
**Issue**: Mermaid 図は pre-push が `mise run verify` を呼ぶように描くが、フック設計は `security:osv`、`security:audit`、`test`、`e2e` を個別に直列実行する。  
**Evidence**: 図には `PP -->|mise run| VER` がある一方、lefthook 表は pre-push の各ジョブを `mise run security:osv`、`mise run security:audit`、`mise run test`、`mise run e2e` と定義している（plan.md:647-650）。これは文書内比較による確認であり、外部 probe は不要である。  
**Confidence**: high  
**Proof**: 実装後に `lefthook dump --format=json` の `pre-push.jobs[].run` を取得すると、`mise run verify` は含まれず、4 個の個別タスクだけが含まれることを確認できる。  
**Fix**: `PP -->|mise run| VER` の矢印を削除し、必要なら `test` と `e2e` を表すノードまたは矢印を追加してフック表と一致させる。

### [LOW] `product.md` の更新が spec の明示した steering 更新範囲を超えている
**Location**: specs/001-dev-environment-and-gates/plan.md:570-571, 774  
**Issue**: 計画は `.sdd/steering/product.md` の状態注記更新を成果物に含めるが、Requirement 13.9 が指定する更新対象は `tech.md` と `structure.md` のみである。  
**Evidence**: plan は「`.sdd/steering/tech.md`、`structure.md`、`product.md`」を更新対象に列挙し、File Structure Plan にも `product.md | Modify + Commit` を含める。対して spec.md:492-493 は「`tech.md` の Gate command、`structure.md` の状態注記」と明記する。これは spec と plan の直接比較による確認であり、外部 probe は不要である。  
**Confidence**: high  
**Proof**: 実装 PR の `git diff --name-only` に `.sdd/steering/product.md` が含まれても、13.9 の受け入れ基準だけからはその変更を必要と判断できない。  
**Fix**: `product.md` を本 spec の変更対象から外す。更新が必要なら、理由と受け入れ基準を spec に追加してから plan の File Structure Plan に残す。

## Verdict
REQUEST_CHANGES

## Orchestrator findings (Claude, /sdd-validate-plan Step 3, round 3)

### [HIGH] hooks-config.test.ts case 1 control cannot pass as designed
**Location**: specs/001-dev-environment-and-gates/plan.md:399-406, 213-216, 643-645
**Issue**: The control ("same staged file, default `isolatedEnv()` -> 0") runs the full real `lefthook.yml` in a temp repo, but its `typecheck` / `model-ids` jobs call `mise run ...` (mise is not on the `isolatedEnv()` PATH, and the temp repo has no `mise.toml`) and `biome` calls `pnpm exec biome` (no `node_modules` in the temp repo).
**Evidence**: PATH = `dirname(process.execPath)`, pnpm / gitleaks / lefthook / git dirs, `/usr/bin`, `/bin` (plan.md:213-216); pre-commit jobs table (plan.md:642-645).
**Fix**: Use the same secrets-only `lefthook.json` extracted from `lefthook dump` that C10 step 5 uses for both the tool-absent case and its control (or define the control precisely), and state it in C12.

### [MEDIUM] How `mise` itself is resolved is undefined
**Location**: plan.md:199-207, 356-358, 384, 416-421
**Issue**: Tests call `mise tasks ls --json`, `mise ls --current --json`, and `mise which`, but `mise` is not in the `resolveTool` table and not on the `isolatedEnv()` PATH; it is not a mise-managed tool (`/opt/homebrew/bin/mise` here).
**Fix**: Add `mise` to the "OS-provided / parent PATH" row of `resolveTool` (like `git`), call it by absolute path with cwd = repo root.

## Adjudication

Orchestrator: Claude (/sdd-validate-plan). Codex ran (codex-cli 0.171.0), so this round is cross-family (constitution principle 11 satisfied for this round).
Codex confirmed the round-2 CRITICAL x2 and HIGH x1 are resolved (plan.md:213-216, 199-207, 222-227); orchestrator re-read the same lines and agrees.

| Finding | Decision | Evidence |
|---------|----------|----------|
| (Codex) [MEDIUM] 13.2 offline-verify judgement test | escalated | Same item escalated in round 2. plan.md:559-561 lists self-check tests; 3.5 is verified only by R-3 (plan.md:949). Choosing "add a contract test" vs "amend 13.2 to accept a run record" is a spec decision. |
| (Codex) [LOW] diagram `PP --> VER` contradicts pre-push jobs | stands | plan.md:57 vs plan.md:647-650 |
| (Codex) [LOW] `product.md` update outside 13.9 | stands (LOW) | spec.md:492-493 names tech.md and structure.md only; plan.md:571, 774 add product.md. Either drop it or note the reason in the plan. |
| (Claude) [HIGH] hooks-config case 1 control infeasible | stands | plan.md:213-216, 399-406, 643-645 |
| (Claude) [MEDIUM] `mise` resolution undefined | stands | plan.md:199-207 table lacks mise; plan.md:216 PATH lacks it |

Caller verdict: REQUEST_CHANGES at plan level (one HIGH), but no CRITICAL -> /sdd-validate-plan decision: GO after the HIGH and MEDIUM plan edits.

## Resolution (round 3, applied to plan.md)

User decision: option A for 13.2 (add a verify-contract test; the actual offline run stays in R-3).

| Finding | Resolution | Where in plan.md |
|---------|------------|------------------|
| (Codex) [MEDIUM] 13.2 offline judgement | fixed: `tests/unit/verify-offline-contract.test.ts` added to C12, File Structure, Traceability (3.5, 13.2) | C12 (new bullet), File Structure Plan, Traceability |
| (Codex) [LOW] diagram `PP --> VER` | fixed: Mermaid now has `CHK` and `TE` nodes; pre-push links to `SEC` and `TE` | Architecture Overview |
| (Codex) [LOW] product.md outside 13.9 | fixed: removed from File Structure Plan and C16; note added that it is out of scope for spec 001 | C16, File Structure Plan |
| (Claude) [HIGH] hooks-config case 1 control | fixed: case 1 and its control use a secrets-only `lefthook.json` (same method as C10 step 5) | C12 hooks-config case 1 |
| (Claude) [MEDIUM] `mise` resolution | fixed: `mise` added to the parent-PATH row of `resolveTool`, run with cwd = repo root; added to `isolatedEnv` PATH | C6 `resolveTool`, `isolatedEnv` |

Remaining: none at CRITICAL/HIGH. Verdict for the plan: GO. The design approval in spec.json (`design.approved`) is still for the user to give.
