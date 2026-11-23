# AGENTS.md

Working rules for coding agents (Claude Code, Codex, ...) in this repository.

genai-lab-ts is a beginner hands-on lab: a single Next.js app that builds generative AI
skills one stage at a time, from LLM calls up to tool calling with approval. It is the
on-ramp to `from-genai-to-agentic-ai`. Every test must pass deterministically without API
keys or network access.

## Current state (2026-11-22)

Planning is done; no application code exists yet. Stage 1 (spec 001) imports the
scaffold and creates `mise.toml`, `package.json`, `lefthook.yml`, the CI workflows, and
`src/` / `tests/`. Until then, the commands below are the planned interface from
[specs/000-development-plan/plan.md](specs/000-development-plan/plan.md). Once spec 001
lands, check them against the real `mise.toml` and update this file.

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
| Full gate: lint, format check, typecheck, security, tests | `mise run verify` (`mise run gate` is an alias) |
| Lint / format only | `mise run check` |
| Security scans (gitleaks full history, osv-scanner, pnpm audit) | `mise run security` |
| Unit tests | `mise run test` |
| E2E tests | `mise run e2e` |
| Hard-coded model ID check | `mise run check:model-ids` |
| Dependency update candidates | `mise run outdated` |
| Print runtime versions (for records, not pass/fail) | `mise run runtime` |
| Single unit test file / test name | `pnpm exec vitest run tests/unit/<subject>.test.ts` / `pnpm exec vitest run -t "<name>"` |
| E2E smoke tests (what pre-push runs) | `pnpm exec playwright test --grep @smoke` |
| Node 27 alpha lane | `MISE_ENV=node27 mise install`, then `MISE_ENV=node27 mise run verify` |

`mise run verify` must stay offline, deterministic, and non-empty. Zero executed tests is
a failure: never enable `passWithNoTests`. Unmocked network access fails the test.

### Git hooks (lefthook)

- pre-commit (parallel): `gitleaks git --pre-commit --staged --redact`, Biome on staged
  files, `tsc --noEmit`, `check:model-ids`.
- commit-msg: Conventional Commits.
- pre-push (serial, cheapest first): osv-scanner, `pnpm audit --audit-level=high`,
  Vitest, Playwright `@smoke`.

CI runs the same `mise run verify`, so a hook skip never removes a check. Skip a hook
only after showing the failure is environmental (it reproduces on the base branch), and
record the skip in the PR body.

## Architecture (planned)

One Next.js App Router app. UI and route handlers live in `src/app/`. Server-side AI
logic lives in `src/lib/ai/`, one concept per file. `app` may import `lib`; `lib` never
imports `app`.

Several concepts have exactly one place where they are defined, and a check enforces it:

| Concept | Defined only in | Enforced by |
| --- | --- | --- |
| Model IDs | `src/lib/ai/model-allowlist.ts` | `check:model-ids` (test fixtures excepted) |
| Provider/model selection (`AI_PROVIDER`, `AI_MODEL`) | `src/lib/ai/model.ts` | Zod validation at startup |
| Agent construction | `createGuardedAgent` in `src/lib/ai/agent.ts` | repo scan rejecting other `new ToolLoopAgent` |
| Input limits and rate limiting (stage 8) | `src/lib/ai/limits.ts` | 400 / 413 / 429 tests |

Tests live in `tests/unit/` (Vitest with `ai/test` mock models) and `tests/e2e/`
(Playwright that mocks `/api/chat` as a UI message stream via `page.route`). Never put
tests next to the sources.

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
