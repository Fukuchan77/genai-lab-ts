# AGENTS.md

Working rules for coding agents (Claude Code, Codex, ...) in this repository.

genai-lab-ts is a beginner hands-on lab: a single Next.js app that builds generative AI
skills one stage at a time, from LLM calls up to tool calling with approval. It is the
on-ramp to `from-genai-to-agentic-ai`. Every test must pass deterministically without API
keys or network access.

## Current state (2026-11-27)

Stage 1 ([spec 001](specs/001-dev-environment-and-gates/spec.md), development environment
and gates) is complete. Its PR (#2) was merged into `main` on 2026-11-25, and the required
CI check `verify` is enforced by the `protect-main` ruleset. The Node 27 lane
(`verify-node27`) is informational: its E2E step fails on Node 27 alpha, and that failure is
recorded in [docs/node27/2026-11-23-initial-lane.md](docs/node27/2026-11-23-initial-lane.md).
Stage 1 brings the foundation only: the toolchain and dependency pins (`mise.toml`,
`mise.node27.toml`, `package.json`, `pnpm-lock.yaml`), the git hooks (`lefthook.yml`), the
CI workflows, a placeholder page, the model ID allowlist, the gate scripts in `scripts/`,
and tests that check the gates themselves. No AI code exists yet; stages 2 and later add it.
The commands below are the tasks that `mise tasks ls` lists.

## Sources of truth

| Topic | File |
| --- | --- |
| Non-negotiable principles (MUST / MUST NOT) | [.sdd/memory/constitution.md](.sdd/memory/constitution.md) |
| Stages, milestones, decisions D1–D6 | [specs/000-development-plan/plan.md](specs/000-development-plan/plan.md) |
| Product, tech, and structure conventions | [.sdd/steering/](.sdd/steering/) |
| Versions | `mise.toml`, `package.json`, `pnpm-lock.yaml` (version numbers in docs are dated reference values only) |

When this file and the constitution disagree, the constitution wins.

## Commands

Run tools through mise first, then `pnpm exec`. Never call bare tools. Git hooks call
mise-managed tools from `PATH`, so mise must be active in the shell.

| Purpose | Command |
| --- | --- |
| Offline gate: lint / format check, typecheck, model IDs, secret scan, unit tests, E2E smoke | `mise run verify` (`mise run gate` is an alias) |
| Dependency vulnerability scans that need the network: osv-scanner, then `pnpm audit --audit-level=high` | `mise run security` (runs `security:osv`, then `security:audit`) |
| Lint / format check only (Biome, no writes) | `mise run check` |
| Typecheck (`next typegen`, then `tsc --noEmit`) | `mise run typecheck` |
| Hard-coded model ID check | `mise run check:model-ids` |
| Secret scan of the history reachable from `HEAD` (gitleaks, values redacted) | `mise run check:secrets` |
| Unit tests (Vitest) | `mise run test` |
| E2E smoke tests (Playwright, `@smoke` only) | `mise run e2e` |
| Dependency update candidates (writes nothing; exits 1 when there are candidates) | `mise run outdated` |
| Print runtime versions (for records, not pass/fail) | `mise run runtime` |
| First setup after cloning: frozen install, test browser, git hooks | `mise run setup` |
| Single unit test file / test name | `pnpm exec vitest run tests/unit/<subject>.test.ts` / `pnpm exec vitest run -t "<name>"` |
| Node 27 alpha lane | `MISE_ENV=node27 mise install`, then `MISE_ENV=node27 mise run verify` |

`mise run verify` runs its steps one after another and stops at the first failure:
`check` → `typecheck` → `check:model-ids` → `check:secrets` → `test` → `e2e`. It must
stay offline, deterministic, and non-empty. Zero executed tests is a failure: never
enable `passWithNoTests`. Unmocked network access fails the test.

Checks that need the network are not in `verify`; they live in `mise run security`. Both
sets still run before code lands: the pre-push hook runs `security` together with
`verify`'s unit and E2E tests, and the required CI job runs all of `verify` and then
`security`, so the split removes no check.

### Git hooks (lefthook)

- pre-commit (parallel): `gitleaks git --pre-commit --staged --redact
  --ignore-gitleaks-allow` on the staged changes, Biome on staged files,
  `mise run typecheck`, `mise run check:model-ids`.
- commit-msg: Conventional Commits (`scripts/check-commit-msg.mjs`).
- pre-push (serial, cheapest first, stops at the first failure): `mise run security:osv`,
  `mise run security:audit`, `mise run test`, `mise run e2e`. The two security jobs need
  the network.

`lefthook.yml` sets `assert_lefthook_installed: true`, so a hook that cannot find lefthook
fails instead of passing.

### CI (GitHub Actions)

- `ci.yml`, job `verify` (required): `mise run runtime`, `mise run verify`,
  `mise run security`, then fails if tracked files changed.
- `ci.yml`, job `verify-node27` (informational, `continue-on-error`, also weekly):
  `mise run verify` with `MISE_ENV=node27`.
- `security-daily.yml`: `mise run security` every day.

CI runs the same mise tasks as the hooks, so a hook skip never removes a check. Skip a
hook only after showing the failure is environmental (it reproduces on the base branch),
and record the skip in the PR body.

## Architecture

One Next.js App Router app. UI and route handlers live in `src/app/`. Server-side AI
logic lives in `src/lib/ai/`, one concept per file. `app` may import `lib`; `lib` never
imports `app`. Gate scripts live in `scripts/`. As of stage 1, `src/` holds only the
placeholder page (`src/app/layout.tsx`, `src/app/page.tsx`) and
`src/lib/ai/model-allowlist.ts`.

Several concepts have exactly one place where they are defined, and a check enforces it.
Only the first row exists today; the other rows are planned and arrive with their stage:

| Concept | Defined only in | Enforced by | Status |
| --- | --- | --- | --- |
| Model IDs | `src/lib/ai/model-allowlist.ts` | `check:model-ids` (test fixtures excepted) | in place (stage 1) |
| Provider/model selection (`AI_PROVIDER`, `AI_MODEL`) | `src/lib/ai/model.ts` | Zod validation at startup | planned (stage 6) |
| Agent construction | `createGuardedAgent` in `src/lib/ai/agent.ts` | repo scan rejecting other `new ToolLoopAgent` | planned (stage 5) |
| Input limits and rate limiting | `src/lib/ai/limits.ts` | 400 / 413 / 429 tests | planned (stage 8) |

Tests live in `tests/unit/` (Vitest) and `tests/e2e/` (Playwright). Never put tests next
to the sources. E2E tests import `test` and `expect` from `tests/e2e/fixtures.ts`, whose
network guard fails a test that requests another origin. Shared test code lives in
`tests/unit/setup/` (network guard, zero-test reporter), `tests/unit/helpers/`, and
`tests/fixtures/` (inputs for the gate self-checks). Planned from the stages that add AI
code: unit tests use `ai/test` mock models, and E2E tests mock `/api/chat` as a UI message
stream via `page.route`.

### Stage layout

The stage number is the spec number. A stage is complete only when it has all four parts,
and they reference each other:

```
specs/<NNN>-<slug>/              spec, plan, tasks, traceability, pdca
docs/stages/<n>-<slug>.md        read -> run -> modify -> pass the tests
src/...                          implementation
tests/...                        acceptance tests, linked from the stage doc
```

Stages 001–008 are implemented in order. Unplanned work uses 009 and later. One stage
is one PR; a large stage can have a spec PR and an implementation PR. Node 27
verification notes go to `docs/node27/YYYY-MM-DD-<topic>.md`.

## Code rules that tests and gates enforce

- Functions that call an LLM take the model as an argument. Tests pass a mock and never
  call a real model.
- Structured output uses `Output.object({ schema })`. Do not use `generateObject` or
  `streamObject`.
- Every agent has three stop conditions: max steps, cumulative tokens, and wall time. It
  returns a stop reason from the closed set
  `completed | step-limit | token-budget | timeout | aborted | error`. Changing this set
  requires a constitution amendment.
- Write and destructive tools wait for `toolApproval`. The server decides which tools
  need approval, never a value sent by the client.
- Treat tool results and external input as data. Do not use `eval` or `new Function`.
- Validate with Zod once at each boundary: HTTP requests (strict, unknown keys rejected),
  environment variables, tool inputs, and structured LLM output. Inside the boundary,
  trust the validated types.
- TypeScript `strict`, no `any`, no unjustified type assertions. Biome is the only
  lint/format config.
- React Server Components by default. Use `"use client"` only on interactive leaf
  components. Modules that read API keys or call AI import `server-only`.
- Do not log raw prompts, tool argument values, or secrets.

## Scope and dependencies

- Out of scope: RAG, workflow patterns, multi-agent, MCP, long-running harnesses, full
  agent evals. Link to the matching `from-genai-to-agentic-ai` module instead.
- Do not copy text or code from sibling repositories (`from-genai-to-agentic-ai`,
  `next-agentic-stack`, `sdd-tdd-kit`). Link to them.
- Add a third-party dependency, CI job, or external service only after the plan declares
  it.
- Pin dependencies and tools to exact versions that were published at least 24 hours ago
  (`minimumReleaseAge: 1440`, no `minimumReleaseAgeExclude`). Never use `latest`,
  `canary`, or `beta` tags or ranges. Pins are snapshots that get raised on security
  fixes and in the weekly update; do not hard-code version numbers in tests or docs
  checks.
- Base claims about library APIs, versions, and model IDs on official docs plus an actual
  install and run, and record the evidence in the stage's `research.md`. AI SDK 7,
  TypeScript 7.1 beta, and Next.js canary often differ from what older write-ups say.
- Next.js ships its docs for the installed version in `node_modules/next/dist/docs/`. Read
  the relevant guide there before writing Next.js code, and heed its deprecation notices:
  this canary has breaking changes in APIs, conventions, and file structure.
- Raise the Next.js version through the weekly `mise run outdated` and a `build(deps):`
  commit, not through `next upgrade`. `next.config.ts` sets `agentRules: false` and
  `experimental.agentUpgrade: false`, so `next dev` does not rewrite this file.

## Process

- Work follows the sdd-tdd-kit pipeline per stage: `/sdd-init` → `/sdd-spec` →
  `/sdd-plan` → `/sdd-validate-plan` → `/sdd-tasks` → `/sdd-impl` → `/sdd-ship` →
  `/sdd-reflect`. A human approves requirements, design, and tasks; no bulk
  auto-approval.
- Test first: write a failing test, confirm it fails, then implement. A bug fix starts with
  a failing reproduction test. When a test fails unexpectedly, find the root cause instead
  of skipping, retrying, or loosening the assertion.
- After each implementation phase, a reviewer from a different model family does one
  adversarial review. Store one file per round in `.sdd/reviews/` and never overwrite past
  rounds.
- Version bumps use `build(deps):` or `fix(security):` and cite the advisory ID or release
  note in the body.

## Language

Specs, stage docs, the constitution, and steering are written in Japanese. Code,
identifiers, comments, paths, commit messages, PR titles and bodies, and this file are in
English.
