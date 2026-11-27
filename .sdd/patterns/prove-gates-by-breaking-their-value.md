---
name: prove-gates-by-breaking-their-value
description: ゲートやテストが本当に効くことを、対象の値を変えて失敗を確かめる（PROVE）手順。空虚なテストを見つける方法。
metadata:
  type: project
---

# 値を変えて PROVE する（非空虚の確認）

- **Problem**: テストが通っても、そのテストがゲートの違反を捕まえているとは限らない。`getByRole(..., { name })` の部分一致、遮断しなくても失敗する外部通信、走査対象の外に置いたファイル、formatter に変えられた Edit の `old_string` など、「壊しても緑のまま」のテストが実装中に 3 件見つかった。
- **Solution**: 受け入れテストごとに、対象の検査またはロジックを**値を変えて壊し**、そのテストが失敗することを確かめてから戻す。壊す前にコピーを取り、戻したあと `diff` で一致を確かめる。
- **Implementation**:
  1. 壊す対象を 1 つ決める（例: `strict: true` → `false`、`exact: true` を外す、`--redact` を外す）。
  2. 壊す前に `cp <file> <file>.pre-prove`（リポジトリ外に置くのが望ましい）。
  3. 値そのものを変える（`true` → `false`、ルール `"error"` → `"off"`）。整形で空白が変わる行の文字列置換は避ける。
  4. テストを実行し、**該当するテストだけが失敗**し、失敗の出力がその理由であることを読む。
  5. 戻す。Edit で戻し、`diff` で戻した内容が壊す前のコピーと一致することを確かめる。
  6. 「壊したのに緑」なら、そのテストは空虚。テストを直し、直したテストをもう一度 PROVE する。

  ```bash
  # 例: 型検査の対照を壊す（値を変える）
  cp tsconfig.json /tmp/tsconfig.pre-prove.json
  # Edit で "strict": true -> "strict": false
  pnpm exec vitest run tests/unit/static-analysis.test.ts   # 該当ケースだけ失敗を確認
  # Edit で戻す
  diff tsconfig.json /tmp/tsconfig.pre-prove.json && echo same
  ```

- **Benefits**: 空虚なテストを、マージの前に見つけられる。ゲートを「実際に効く」と言える根拠になる（憲章 原則 4、spec 9.7）。
- **Evidence**: 001-dev-environment-and-gates の R-10 と各 do.md タスク。例: 4.1 で `exact: true` を足すまで、見出しを変えても通った。4.3 では `route.abort` → `route.fallback` で、`.invalid` の DNS 失敗が同じ結果になり、ローカルサーバーの `hits === 0` 検査に直した。5.2 では ignore 済みファイルを走査対象外のディレクトリに置いていたため、別の理由で通っていた。
- **Caveats**: 壊す編集が**効いていない**のに「失敗しなかった」と読むのが、最も起きやすい誤り。3.1 と 4.3 では、formatter が `old_string` を変えて Edit が失敗し、壊れていない状態の緑を証拠と読みかけた。Edit が成功したと報告されたか、`diff` で差分が出たかを必ず確かめる。
- Related: [[001-dev-environment-and-gates-2026-11-27]]
