# 001-dev-environment-and-gates — Traceability

`/sdd-tasks` が骨格を生成し、`/sdd-ship` がテストとコミットの列を埋める。1 つの要件に 1 行。
Task 列が空の行は網羅の欠落である。

ID の規約（`~/.claude/sdd/rules/analysis.md`）: `REQ-###` は spec.md の Requirement 番号、`T-#.#` は
tasks.md のサブタスク番号。`DES-#.#` は plan.md の見出しに ID として書いてある。

- `DES-1.n` — plan.md「Components」の C`n`（例: DES-1.6 は C6 UnitTestHarness）
- `DES-2.1` — 「Interfaces / Contracts」
- `DES-3.1` — 「Error Handling & Edge Cases」

**Design 列の正本は tasks.md の `_Traces:_`**（2026-11-23 の /sdd-remediate での決定）: その要件を持つ
サブタスクが触れる設計の和集合を、本表が再掲する。plan.md の各 C 節の `Requirements:` は「設計上の所有者」
という別の観点で、本表とは一致しない。DES ID で影響範囲を引くときは、tasks.md の `_Traces:_` を使う。

要件の下の受け入れ基準（1.1 など）ごとの対応は tasks.md の `_Requirements:_`、検証方法は plan.md の
「Requirements Traceability」にある。

| Requirement | Design | Task | Test | Commit |
|-------------|--------|------|------|--------|
| REQ-001 | DES-1.1, DES-1.12, DES-1.13, DES-1.15, DES-1.16, DES-2.1 | T-1.1, T-1.2, T-3.3, T-8.1, T-10.1, T-11.4, T-12.5 |  |  |
| REQ-002 | DES-1.2, DES-1.3, DES-1.7, DES-1.11, DES-1.12, DES-1.16 | T-3.1, T-3.2, T-3.3, T-4.1, T-12.3 |  |  |
| REQ-003 | DES-1.2, DES-1.3, DES-1.6, DES-1.7, DES-1.10, DES-1.11, DES-1.12, DES-1.13, DES-2.1, DES-3.1 | T-1.3, T-2.1, T-2.2, T-2.3, T-3.2, T-4.1, T-4.2, T-4.3, T-4.4, T-7.1, T-12.1, T-12.2, T-12.5 |  |  |
| REQ-004 | DES-1.4, DES-1.12, DES-3.1 | T-7.2, T-12.4 |  |  |
| REQ-005 | DES-1.5, DES-1.12 | T-7.3 |  |  |
| REQ-006 | DES-1.8, DES-2.1, DES-3.1 | T-5.1, T-5.2 |  |  |
| REQ-007 | DES-1.9, DES-1.10, DES-1.12, DES-1.13, DES-2.1, DES-3.1 | T-6.1, T-6.2, T-7.4, T-7.5, T-9.2, T-12.5 |  |  |
| REQ-008 | DES-1.3, DES-1.6, DES-1.9, DES-1.10, DES-1.12, DES-2.1, DES-3.1 | T-2.1, T-6.1, T-7.1, T-12.3 |  |  |
| REQ-009 | DES-1.6, DES-1.7, DES-1.8, DES-1.11, DES-1.12, DES-1.16, DES-2.1, DES-3.1 | T-2.2, T-2.3, T-3.3, T-4.1, T-4.2, T-4.3, T-4.4, T-5.2, T-12.2, T-12.3 |  |  |
| REQ-010 | DES-1.13, DES-2.1 | T-8.1, T-8.2, T-8.3, T-12.5, T-12.6, T-12.7 |  |  |
| REQ-011 | DES-1.12, DES-1.13, DES-1.14, DES-1.16 | T-9.1, T-9.3, T-11.1, T-12.5 |  |  |
| REQ-012 | DES-1.1, DES-1.15 | T-1.2, T-10.1, T-10.2, T-10.3, T-10.4, T-11.4 |  |  |
| REQ-013 | DES-1.3, DES-1.5, DES-1.12, DES-1.13, DES-1.16, DES-3.1 | T-3.3, T-7.3, T-11.1, T-11.2, T-11.3, T-11.5, T-12.1, T-12.5 |  |  |

## Gaps

<!-- 要件に task がない、task に要件がない、テストに要件がない、のいずれか。空は全件網羅を表す。 -->

- None
