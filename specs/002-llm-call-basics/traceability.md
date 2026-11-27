# 002-llm-call-basics — Traceability

`/sdd-tasks` が骨格を生成し、`/sdd-ship` がテストとコミットの列を埋める。1 つの要件に 1 行。
Task 列が空の行は網羅の欠落である。

ID の規約（`~/.claude/sdd/rules/analysis.md`）: `REQ-###` は spec.md の Requirement 番号、`T-#.#` は
tasks.md のサブタスク番号。`DES-#.#` は plan.md の見出しに ID として書いてある。

- `DES-2.n` — plan.md「Components」の C`n`（DES-2.1 = C1 DependencyDeclaration、DES-2.2 = C2 CallModel、
  DES-2.3 = C3 HelloScript、DES-2.4 = C4 TypeAndTestRuntimeConfig、DES-2.5 = C5 AcceptanceTests、
  DES-2.6 = C6 StageGuide、DES-2.7 = C7 GovernanceSync）

**Design 列の正本は tasks.md の `_Traces:_`**（spec 001 と同じ決定）: その要件を持つサブタスクが触れる設計の
和集合を本表が再掲する。plan.md の各 C 節の `Requirements:` は「設計上の所有者」という別の観点で、本表とは
一致しない。DES ID で影響範囲を引くときは、tasks.md の `_Traces:_` を使う。

要件の下の受け入れ基準（1.1 など）ごとの対応は tasks.md の `_Requirements:_`、検証方法は plan.md の
「Requirements Traceability」にある。

| Requirement | Design | Task | Test | Commit |
|-------------|--------|------|------|--------|
| REQ-001 | DES-2.2, DES-2.4, DES-2.5 | T-2.1, T-2.2, T-3.1, T-3.5, T-4.1, T-4.3 |  |  |
| REQ-002 | DES-2.2, DES-2.5 | T-3.2, T-3.4, T-4.1 |  |  |
| REQ-003 | DES-2.2, DES-2.5 | T-3.3, T-4.1 |  |  |
| REQ-004 | DES-2.2, DES-2.5 | T-3.4, T-4.1, T-4.2 |  |  |
| REQ-005 | DES-2.3, DES-2.5 | T-3.6, T-5.1, T-5.2, T-5.3 |  |  |
| REQ-006 | DES-2.2, DES-2.4, DES-2.5 | T-2.2, T-3.1, T-3.2, T-3.3, T-3.4, T-3.5, T-3.6, T-3.7, T-4.3, T-4.4, T-8.1, T-8.2, T-8.3 |  |  |
| REQ-007 | DES-2.6 | T-6.1, T-6.2 |  |  |
| REQ-008 | DES-2.1, DES-2.3, DES-2.5, DES-2.6, DES-2.7 | T-1.1, T-1.2, T-1.3, T-1.4, T-5.2, T-5.3, T-6.2, T-7.1, T-7.2, T-8.3, T-8.4 |  |  |

## Gaps

- 受け入れ基準 62 件（1.1〜8.9。分析後の修正で 4.8 を追加）はすべて、少なくとも 1 つのサブタスクの
  `_Requirements:_` に載っている。対応する要件のないタスクはない。
- 受け入れ基準 8.5 の research.md の記録は、R-1〜R-7 を各タスク（R-1: 1.2・1.3・1.4、R-2: 3.7・4.3、R-3: 8.1・8.2、R-4: 8.3、R-5: 5.3、R-6: 8.4、
  R-7: 1.2）が分担して書く。8.8 は `AGENTS.md`、8.9 は steering の 2 ファイルで、タスク 7.1・7.2 が担う。
- `spec.md` の Clarifications への plan 時の追記（plan C7）は、`/sdd-plan` の時点で書かれていることを確認済みの
  ため、タスクを置かない。
