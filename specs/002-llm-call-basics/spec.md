# 002-llm-call-basics

## Project Description

spec 002（LLM 呼び出しの基礎）

段 2「LLM 呼び出しの基礎」。`generateText`、system / user の役割、温度・最大トークン、usage、
エラーと再試行を、モックモデルで決定論的に確かめられる形で学ぶ。

- 全体計画: [specs/000-development-plan/plan.md](../000-development-plan/plan.md) の §5 段 2、§7 M2
- 原則: [.sdd/memory/constitution.md](../../.sdd/memory/constitution.md)（特に原則 4・5・10）
- 段 2 の合格条件（plan §5）: モックモデルで出力・usage・再試行回数を検証する
- 計画上の想定ファイル（plan §5）: `src/lib/ai/basics.ts`、`scripts/hello.ts`
- 依存: AI SDK と、使うプロバイダのパッケージは、この段の plan で宣言してから追加する（原則 10、
  plan §8.5 の改訂注記 ADR-4）

## Clarifications

### Session 2026-11-27

- Q: 段 2 の `scripts/hello.ts` で実際に呼び出すプロバイダはどれにするか？
  → A: **Ollama**（`src/lib/ai/model-allowlist.ts` の `ollama` のエントリ）。ローカルで動くため API キーと
  課金が要らず、「API キーなしで同じ手順を再現できる」（憲章の趣旨）に合う。Anthropic / OpenAI / Google
  へ変える方法は、`docs/stages/2-llm-call-basics.md` に手順として書く（実行できる状態にはしない）。
  手順の中身は、(1) 対応するプロバイダパッケージを入れる（原則 10 に従い plan を先に改正）、
  (2) `scripts/hello.ts` のモデル生成の 1 行を差し替える、(3) 必要な API キーの環境変数名（`.env.example`
  に変数名だけ置く）、(4) 使うモデル ID は allowlist のものに限る、の 4 点。`AI_PROVIDER` による環境変数
  切り替えは段 6 で扱うため、段 2 では手動の差し替えに留める。モデル ID は本 spec にも直書きしない
  （原則 5）。
- Q: 「エラーと再試行」の再試行は、AI SDK の組み込み（`generateText` の `maxRetries`）に任せるか、ラボで自作するか？
  → A: **推奨案 A**。AI SDK の `maxRetries` を使う。ラボは再試行回数を引数で受け取り、モックで「失敗 N 回のあと
  成功」「回数超過で失敗」を検証する。自作の再試行ラッパーは卒業先で扱う（SDK の再試行と二重にしない）。
- Q: 呼び出し関数に渡す設定項目は、どこまで含めるか（温度・最大トークン・system 文・タイムアウトなど）？
  → A: **推奨案 A**。`system` / `prompt` / `temperature` / `maxOutputTokens` / `maxRetries` の 5 項目だけを受け取る。
  タイムアウト（`abortSignal`）は段 5 の実行時間の停止条件と一緒に扱うため、段 2 では含めない。
  `topP` や `stopSequences` などのサンプリング設定は含めない。
- Q: usage（トークン使用量）は、AI SDK の `usage` をそのまま返すか、独自の型に変換するか？
  → A: **推奨案 B**。`inputTokens` / `outputTokens` の 2 項目を持つ独自の型に変換して返す。SDK の型は
  呼び出し関数の内側に閉じ込める（憲章原則 7 の境界の考え方）。
- Q: `scripts/hello.ts` は Ollama が動いていない環境でどう振る舞うか？
  → A: **推奨案 A**。接続できなければ、Ollama の起動方法と `ollama pull` のコマンドを案内して終了コード 1 で止まる。
  テストは `scripts/` を対象にせず、モックモデルで `src/lib/ai/basics.ts` だけを検証する（憲章原則 10 の
  「キーがない場合のモック経路」に当たる）。

### 前提（2026-11-27 に推奨案で確認済み。plan で覆す場合は Clarifications に記録する）

- **usage の未報告**: モデルがトークン数を報告しない項目は「不明」を表す値（`undefined`、型は
  `number | undefined`）で返し、0 で埋めない（2.3）。hello スクリプトは「不明」と表示する。
  - 根拠: AI SDK のリファレンスは `inputTokens` / `outputTokens` を `number | undefined` と定める（Context7
    `/vercel/ai`、main ブランチの文書、2026-11-27 確認）。0 は「使っていない」と誤読され、段 5 の累積トークンの
    停止条件で消費を少なく見積もる原因になる。`null` を使う理由はない。
- **`maxRetries` の既定**: 省略時の上限は 2 回（試行は最大 3 回）とする（4.5）。
  - 根拠: AI SDK の文書も既定値を 2 とする（同上）。SDK と揃えると、解説は「省略すると SDK と同じく 2 回」で
    済む。確認は main ブランチの文書だけなので、install する版での実測を research.md に記録する（8.5）。SDK の
    既定値が異なっていても、本ラボの呼び出し関数の既定は 2 とする。
  - 採らない案: 既定値を持たず必須にする（入門の最初のコードが長くなる）。
- **hello スクリプトの接続先**: Ollama プロバイダの既定のローカルアドレスとし、`OLLAMA_BASE_URL` などの環境
  変数を読まない。別ホストの Ollama を使う場合は段 6 で扱うと解説に書く。
  - 根拠: 環境変数はシステム境界であり、読むなら憲章 原則 7 により Zod で検証する。段 2 で Zod と環境変数の
    検証を入れると段 6 の内容を先取りする。検証せずに読む案は原則 7 に反するため採らない。
- **hello スクリプトの prompt**: `prompt` と `system` は固定の文で、コマンドライン引数を受け取らない。学習者は
  解説の「改造する」節でファイルを書き換える（7.4）。
  - 根拠: 引数も外部入力で、受け取るなら検証が要り範囲が広がる。「ファイルを書き換えて違いを見る」改造課題と
    相性がよい。
- **`server-only` との両立**: 呼び出し関数のモジュールは憲章 原則 7 に従い `server-only` を import する（1.9）。
  実行の経路ごとに、パッケージの読み込み条件で例外を避ける。
  - hello スクリプト: mise タスクで `node --conditions=react-server scripts/hello.ts` として実行する。
  - Vitest: `vitest.config.ts` で `server-only` だけを空のモジュールに置き換える（alias）。`react-server`
    条件を Vitest 全体に有効にする案は、段 3 以降で React の解決先まで変わるおそれがあるため採らない。
  - Next.js: 何もしない。クライアントコンポーネントからの import はビルドで失敗し、印の役目を果たす。
  - 根拠: `server-only` の `exports` は `{ ".": { "react-server": "./empty.js", "default": "./index.js" } }`
    で、既定の `index.js` は import 時に例外を投げ、`react-server` 条件でだけ空のモジュールになる
    （`pnpm view server-only exports`、2026-11-27 確認）。Node 26 の型の除去（type stripping）と
    `--conditions` の併用は plan で実測して research.md に記録する。

### plan 時の追記（2026-11-27、[plan.md](plan.md) の「spec への追記」）

- **Ollama の接続先**: Ollama 用のプロバイダパッケージは Vercel 公式の `@ai-sdk/openai-compatible` とし、Ollama の
  OpenAI 互換 API を呼ぶ（research.md ADR-1。公式の Ollama 専用パッケージは存在しない）。このパッケージは既定の接続先を
  持たないため、前提の「Ollama プロバイダの既定のローカルアドレス」は、Ollama の公式文書が示すローカルの OpenAI 互換 API の
  base URL を hello スクリプトの定数として書くことで満たす。環境変数を読まない点は変えない。
- **「不明」の表示**: hello スクリプトの出力の文面はコードの言語の規則（英語）に合わせ、報告されなかったトークン数は
  `unknown` と表示する。0 で埋めず未報告であることを示す、という意味は変えない（2.3、前提の usage の未報告）。
- **1.7 の「含めない」**: 省略した `temperature` / `maxOutputTokens` は、モデルが受け取る生成要求の値が `undefined` で
  あることをもって「含めない」を満たす。生成要求は SDK が組み立てるため、キー自体の有無はラボ側では保証できず、
  テストもキーの有無を見ない（plan 検証時、2026-11-27、別モデルファミリーのレビューの指摘への判断）。
- **NFR「1 件あたり 1 秒以内」の範囲**: モックだけを使う `llm-call-basics.test.ts` の各テストに適用する。子プロセスを
  起動する契約テストと `mise` を呼ぶテストは、既存の慣例（120 秒のタイムアウト）に従い対象にしない。

### 分析後の修正（2026-11-27、`/sdd-analyze` の H-1・M-1・M-2 への判断。ユーザー承認済み）

- **4.3 の範囲と 4.8 の追加（H-1）**: 4.3 の「試行 1 回」は最初の試行が再試行しないエラーの場合に限る。再試行可能な
  エラーのあとに再試行しないエラーが出た場合の規則を 4.8 として足し、4.4・4.6・4.7 の参照を合わせた。挙動は plan
  （ADR-5）と tasks 3.4 が元から採っていたもので、実装・テストの内容は変わらない。`retries-exhausted` は最後の失敗の
  種類によらず「許された試行を使い切った」意味で、`cause` は再試行しないエラーのこともある。受け入れ基準は 61 件から 62 件になる。
- **本文と plan 時の追記の同期（M-1）**: 1.7、5.1、NFR「テストの実行時間」の本文に、上の「plan 時の追記」の解釈を
  書き入れた（意味の変更ではなく、承認済みの本文を記録に合わせる編集）。
- **NFR の 1 秒の適用（M-2）**: モックだけを使う `llm-call-basics.test.ts` の全 `describe` に 1000 ms のタイムアウトを
  付ける（tasks 3.1〜3.4）。

## Scope

- In scope（Clarifications 2026-11-27 で確定）:
  - `generateText` を包む呼び出し関数（モデルを引数で受け取る）、system / user の役割、温度・最大トークン、
    usage、エラーと再試行
  - `scripts/hello.ts`: Ollama で動かす最小の実行例
  - `docs/stages/2-llm-call-basics.md` の「プロバイダを変える方法」節（Anthropic / OpenAI / Google の
    差し替え手順。文書のみで、コードは Ollama だけ）
  - Ollama 用のプロバイダパッケージと AI SDK の plan への宣言（原則 10）
- Out of scope（Clarifications 2026-11-27 で確定）: ストリーミング（段 3）、`Output.object`（段 4）、ツールと承認（段 5）、
  `AI_PROVIDER` による切り替え（段 6）、チャット UI（段 3）、Anthropic / OpenAI / Google 用の
  プロバイダパッケージの導入とその動作確認

## Glossary

| Term | Definition |
|------|------------|
| 呼び出し関数 | `src/lib/ai/basics.ts` が公開する、AI SDK の `generateText` を包む関数。名前と引数の形は plan で決める |
| 呼び出し設定 | 呼び出し関数が受け取る 5 項目: `system`、`prompt`、`temperature`、`maxOutputTokens`、`maxRetries` |
| system 役割 / user 役割 | モデルへ渡すメッセージの役割。`system` の本文は system 役割、`prompt` の本文は user 役割になる |
| モックモデル | `ai/test` が提供するモックの言語モデル。応答・usage・失敗を決められ、生成要求の回数と内容を記録できる |
| 試行 | モデルへの 1 回の生成要求。試行回数 = 1 + 実際に行った再試行の回数 |
| 再試行可能なエラー | AI SDK が再試行の対象と判定する失敗（接続の失敗、レート制限、サーバー側の一時的なエラーなど）。判定の正本は research.md に記録する |
| 再試行しないエラー | AI SDK が再試行の対象にしない失敗（認証の失敗、不正な要求など） |
| usage | 1 回の呼び出しで消費したトークン数。本ラボでは `inputTokens` と `outputTokens` の 2 項目の独自の型で返す |
| hello スクリプト | `scripts/hello.ts`。呼び出し関数で Ollama のモデルを 1 回呼ぶ最小の実行例 |
| allowlist | `src/lib/ai/model-allowlist.ts`。モデル ID の唯一の定義 |
| 解説 | `docs/stages/2-llm-call-basics.md` |
| research.md | `specs/002-llm-call-basics/research.md`。公式ドキュメントと実測による根拠の記録 |
| 非空虚 | 対象のロジックを壊すと、そのテストが失敗することを確認済みであること |

## Requirements

<!--
Generated by /sdd-spec in EARS format. Each requirement heading carries a
leading NUMERIC id only (e.g. "Requirement 1"). Acceptance criteria are
numbered hierarchically (1.1, 1.2). Keywords WHEN / WHILE / IF / THEN /
WHERE / THE / SHALL are kept in English; the rest is Japanese.
-->

### Requirement 1: モデルを注入する呼び出し関数

学習者として、`generateText` の最小の使い方と system / user の役割を、モデルを差し替えられる 1 つの関数で
学びたい（plan §5 段 2、憲章 原則 5・7）。

**Acceptance Criteria**

1.1 THE 呼び出し関数 SHALL 言語モデルを引数で受け取り、関数の内部でプロバイダやモデルを生成しない。

1.2 THE 呼び出し関数 SHALL 呼び出し設定として `system`、`prompt`、`temperature`、`maxOutputTokens`、
`maxRetries` の 5 項目だけを受け取り、`prompt` を必須、残りの 4 項目を省略可能とする。

1.3 IF 呼び出し側が呼び出し設定に 5 項目以外のキーを書いた場合、THEN THE 型検査（`mise run typecheck`）SHALL
失敗する。

1.4 WHEN `system` を指定して呼び出したとき、THE 呼び出し関数 SHALL `system` の本文を system 役割の
メッセージ、`prompt` の本文を user 役割のメッセージとして、この順でモデルへ渡す。

1.5 WHEN `system` を省略して呼び出したとき、THE 呼び出し関数 SHALL system 役割のメッセージを含めず、
user 役割のメッセージ 1 件だけをモデルへ渡す。

1.6 WHEN `temperature` または `maxOutputTokens` を指定して呼び出したとき、THE 呼び出し関数 SHALL その値を
変えずにモデルへの生成要求に含める。

1.7 WHEN `temperature` または `maxOutputTokens` を省略して呼び出したとき、THE 呼び出し関数 SHALL 省略した
項目の値を、モデルが受け取る生成要求で `undefined` にし、モデル側の既定値に任せる（生成要求は SDK が組み立てる
ため、キー自体の有無は規定しない。plan 時の追記）。

1.8 THE 呼び出し関数 SHALL モデルへの生成要求にツールを含めず、ストリーミングでない 1 回の生成として
要求する。

1.9 THE 呼び出し関数を含むモジュール SHALL サーバー専用の印（`server-only`）を持つ。

### Requirement 2: 応答テキストと usage

学習者として、モデルの出力と消費したトークン数を、AI SDK の型に縛られない小さな結果として受け取りたい
（Clarifications 2026-11-27 の usage の決定、憲章 原則 7）。

**Acceptance Criteria**

2.1 WHEN モデルが応答を返したとき、THE 呼び出し関数 SHALL モデルが生成したテキストを、前後の空白を含めて
変えずに結果の `text` として返す。

2.2 WHEN モデルが入力と出力のトークン数を報告したとき、THE 呼び出し関数 SHALL それぞれを結果の `usage` の
`inputTokens` と `outputTokens` として同じ数値で返す。

2.3 IF モデルが入力・出力のトークン数の一方または両方を報告しない場合、THEN THE 呼び出し関数 SHALL
報告されなかった項目を「不明」を表す値として返し、0 で埋めない。

2.4 THE 呼び出し関数の結果 SHALL `text` と `usage`（`inputTokens` と `outputTokens` の 2 項目）だけを持ち、
AI SDK の結果オブジェクトや AI SDK が定義する型の値を含まない。

2.5 WHEN 再試行のあとに成功したとき、THE 呼び出し関数 SHALL 成功した試行が報告したトークン数を `usage` として
返す。

### Requirement 3: 設定値の検証

学習者として、不正な設定値がモデルを呼ぶ前に分かりやすく拒否されることを確かめたい（無駄な試行と課金を
起こさない）。

**Acceptance Criteria**

3.1 IF `prompt` が空文字列、または空白文字だけの場合、THEN THE 呼び出し関数 SHALL モデルへの生成要求を
1 回も行わずにエラーで reject する。

3.2 IF `temperature` が有限の数でない場合、THEN THE 呼び出し関数 SHALL モデルへの生成要求を 1 回も行わずに
エラーで reject する。

3.3 IF `maxOutputTokens` が 1 以上の整数でない場合、THEN THE 呼び出し関数 SHALL モデルへの生成要求を
1 回も行わずにエラーで reject する。

3.4 IF `maxRetries` が 0 以上の整数でない場合、THEN THE 呼び出し関数 SHALL モデルへの生成要求を 1 回も
行わずにエラーで reject する。

3.5 THE 3.1〜3.4 のエラー SHALL 不正だった設定項目の名前を呼び出し側が判別できる情報として持ち、`prompt` と
`system` の本文を含まない。

### Requirement 4: エラーと再試行

学習者として、一時的な失敗は決めた回数だけ再試行され、回数を超えるか再試行しても無駄な失敗なら止まることを、
モックで試行回数を数えて確かめたい（段 2 の合格条件、Clarifications 2026-11-27 の再試行の決定）。再試行は
AI SDK の仕組みに任せ、ラボで自作の再試行を重ねない。

**Acceptance Criteria**

4.1 WHEN 試行が再試行可能なエラーで k 回（1 ≤ k ≤ `maxRetries`）続けて失敗し、その次の試行が成功したとき、
THE 呼び出し関数 SHALL 成功した試行の結果を返し、モデルへの試行は k + 1 回になる。

4.2 IF 試行が再試行可能なエラーで `maxRetries` + 1 回続けて失敗した場合、THEN THE 呼び出し関数 SHALL
ちょうど `maxRetries` + 1 回試行したあとにエラーで reject し、それ以上試行しない。

4.3 IF 最初の試行が再試行しないエラーで失敗した場合、THEN THE 呼び出し関数 SHALL 再試行せず、試行 1 回で
エラーで reject する。

4.4 WHERE `maxRetries` が 0 の場合、THE 呼び出し関数 SHALL 再試行可能なエラーで失敗しても試行を 1 回だけ
行い、エラーで reject する。そのエラーの判別情報は「再試行を使い切った」とする（許された試行を使い切ったため）。

4.5 WHEN `maxRetries` を省略して呼び出したとき、THE 呼び出し関数 SHALL 再試行の上限を 2 回とする（試行は
最大 3 回）。

4.6 IF 呼び出し関数が 4.2、4.3、4.4、4.8 のいずれかでエラーを返す場合、THEN THE エラー SHALL 「再試行を使い切った」のか
「再試行しないエラーだった」のかを呼び出し側が判別できる情報と、最後の試行の失敗原因を持つ。

4.7 THE 4.2、4.3、4.4、4.8 のエラーのメッセージ SHALL `prompt` と `system` の本文を含まない。

4.8 IF 再試行可能なエラーでの失敗のあとに、再試行しないエラーで失敗した場合、THEN THE 呼び出し関数 SHALL その
試行で止めてエラーで reject し、それ以上試行しない。そのエラーの判別情報は、その試行が許された最後の試行
（`maxRetries` + 1 回目）なら「再試行を使い切った」、それより前なら「再試行しないエラーだった」とし、最後の試行の
失敗原因は再試行しないエラーとする（SDK の判定に合わせる。研究記録 I-5、ADR-5）。

### Requirement 5: Ollama で動かす実行例（`scripts/hello.ts`）

学習者として、API キーも課金もなしに、手元の Ollama で本物のモデルを 1 回呼んで出力と usage を見たい。
Ollama がなくても、何をすればよいかが分かる案内で止まってほしい（Clarifications 2026-11-27 のプロバイダと
未起動時の決定）。

**Acceptance Criteria**

5.1 WHEN 開発者が Ollama を起動し allowlist の `ollama` のモデルを取得済みの環境で hello スクリプトを
実行したとき、THE hello スクリプト SHALL 呼び出し関数を通じてそのモデルを呼び、応答テキストと usage
（`inputTokens` と `outputTokens`。報告されなかった項目は 0 で埋めず `unknown` と表示する）を標準出力に表示して
終了コード 0 で終わる。接続先は、Ollama の公式文書が示すローカルの OpenAI 互換 API の base URL を hello
スクリプトの定数として持つ（plan 時の追記。環境変数は読まない）。

5.2 THE hello スクリプト SHALL 使うモデル ID を allowlist の `ollama` のエントリから取り、モデル ID の
文字列を自身に書かない。

5.3 THE hello スクリプト SHALL 呼び出し設定の 5 項目すべてに値を明示した呼び出しを 1 か所に持つ。

5.4 IF hello スクリプトが Ollama に接続できない場合、THEN THE hello スクリプト SHALL 標準エラーに Ollama の
起動方法と、allowlist の `ollama` のモデルを取得する `ollama pull` コマンドを表示し、終了コード 1 で終わる。

5.5 IF Ollama に接続できたが、allowlist の `ollama` のモデルが取得されていない場合、THEN THE hello スクリプト
SHALL 標準エラーにそのモデルを取得する `ollama pull` コマンドを表示し、終了コード 1 で終わる。

5.6 IF 5.4・5.5 以外の理由で呼び出しが失敗した場合、THEN THE hello スクリプト SHALL 失敗の種類と概要を
標準エラーに表示し、終了コード 1 で終わる。

5.7 THE hello スクリプト SHALL `prompt` と `system` の本文を出力せず、API キーを表す環境変数を読まない。

5.8 THE `mise.toml` SHALL hello スクリプトを 1 つのコマンドで実行するタスクを持つ。

5.9 THE verify タスク、security タスク、lefthook のフック、CI SHALL hello スクリプトを実行しない。

### Requirement 6: 合格判定テスト

学習者とラボの保守者として、段 2 の到達をネットワークも API キーもない環境で、同じ結果になるテストで判定
したい（plan §5 段 2 の合格条件「モックモデルで出力・usage・再試行回数を検証」、憲章 原則 3・4・5）。

**Acceptance Criteria**

6.1 THE 合格判定テスト SHALL `tests/unit/` に置き、モックモデルだけを使って呼び出し関数を検証し、実 LLM、
Ollama、ネットワークに接続しない。

6.2 THE 合格判定テスト SHALL 出力（2.1）、usage（2.2・2.3・2.5）、再試行の回数（4.1〜4.5、4.8）を、モックモデル
への試行回数と生成要求の内容を数えて検証する。

6.3 THE 合格判定テスト SHALL 役割の渡し方（1.4・1.5）、設定の受け渡し（1.6・1.7）、設定値の拒否（3.1〜3.5）、
エラーの判別情報（4.6・4.7・4.8）を検証する。

6.4 THE 合格判定テスト SHALL 1.3（5 項目以外のキーで型検査が失敗する）と 1.9（サーバー専用の印）を、
`mise run verify` の中で検査する。

6.5 WHEN 開発者が `mise run verify` を実行したとき、THE verify タスク SHALL 段 2 の合格判定テストを実行し、
API キーを表す環境変数が 1 つもなくネットワークに接続できない状態でも、接続できる状態と同じ合否を返す。

6.6 THE 段 2 の各合格判定テスト SHALL 実装より先に追加して失敗を確認し、その記録を残す。

6.7 THE 段 2 の各合格判定テスト SHALL 非空虚であることを実装時に確認し、壊した箇所と失敗のメッセージを
research.md に記録する。

6.8 THE 合格判定テスト SHALL hello スクリプトを実行の対象にしない。

### Requirement 7: 解説（`docs/stages/2-llm-call-basics.md`）

学習者として、段 2 を「読む → 動かす → 改造する → テストで合格を確かめる」で進め、Ollama 以外のプロバイダへ
変える方法も知りたい（憲章 原則 2、Clarifications 2026-11-27 のプロバイダの決定）。

**Acceptance Criteria**

7.1 THE 解説 SHALL 「読む」「動かす」「改造する」「テストで合格を確かめる」の 4 節をこの順で持つ。

7.2 THE 解説の「読む」節 SHALL `generateText`、system / user の役割、`temperature`、`maxOutputTokens`、usage、
エラーと再試行の 6 つを説明し、それぞれが呼び出し関数のどこに当たるかを示す。

7.3 THE 解説の「動かす」節 SHALL Ollama の導入と起動、allowlist の `ollama` のモデルの取得、hello スクリプトを
実行する mise タスク、成功時に表示される内容（応答テキストと usage）の順に手順を示す。

7.4 THE 解説の「改造する」節 SHALL `system`、`temperature`、`maxOutputTokens`、`maxRetries` のうち少なくとも
1 つを書き換えて、hello スクリプトの出力やテストの結果の違いを確かめる課題を 1 つ以上持つ。

7.5 THE 解説の「テストで合格を確かめる」節 SHALL 段 2 の合格条件（出力、usage、再試行の回数）ごとに、合格を
判定するテストのパスを示し、そのパスはリポジトリに実在する。

7.6 THE 解説 SHALL 「プロバイダを変える方法」節を持ち、Anthropic、OpenAI、Google のそれぞれについて、
(1) 入れるプロバイダパッケージと、先に plan を改正すること（憲章 原則 10）、(2) hello スクリプトで差し替える
モデル生成の 1 行、(3) 必要な API キーの環境変数名（`.env.example` にある名前）、(4) 使えるモデル ID は
allowlist のものに限ること、の 4 点を示す。

7.7 THE 解説の「プロバイダを変える方法」節 SHALL その手順が段 2 の時点では実行できる状態にないこと
（パッケージが入っていない）と、環境変数による切り替えを段 6 で扱うことを明記する。

7.8 THE 解説 SHALL モデル ID の文字列を書かず、allowlist を参照する形でモデルを示す。

7.9 THE 解説 SHALL 段 2 で扱わない話題（ストリーミング、構造化出力、タイムアウト、自作の再試行）について、
扱う段（段 3・段 4・段 5）または `from-genai-to-agentic-ai` へのリンクを示し、兄弟リポジトリの本文を写さない。

### Requirement 8: 依存の宣言と統治文書の同期

ラボの保守者として、段 2 で初めて入る AI 関連の依存を規律どおりに追加し、文書と実物を一致させたい
（憲章 原則 8・9・10、plan §8.5 の改訂注記 ADR-4）。

**Acceptance Criteria**

8.1 THE 段 2 の plan SHALL 追加する第三者依存（AI SDK のコアパッケージ、Ollama 用のプロバイダパッケージ、
サーバー専用の印のパッケージ、ほかに必要になるもの）を、既存の依存で代替できない理由とともに宣言する。

8.2 THE `package.json` SHALL 8.1 で宣言していない第三者依存を含まない。

8.3 THE `package.json` SHALL 段 2 で追加する依存を exact な版番号で指定し、範囲指定と dist-tag を含まず、
採用時点で公開から 24 時間以上たった版に限る。

8.4 THE `package.json` SHALL Anthropic、OpenAI、Google 用のプロバイダパッケージを含まない。

8.5 THE research.md SHALL 段 2 が依拠する API の主張（`generateText` の設定項目の名前、usage の項目と未報告時の
値、`maxRetries` の既定値と再試行の対象になるエラー、モックモデルの名前と使い方、Ollama プロバイダの既定の
接続先と、未起動時・モデル未取得時に返るエラー）を、公式ドキュメントの確認と実インストール・実行の結果で
記録する。

8.6 THE 段 2 で追加・変更するファイル SHALL allowlist 以外にモデル ID を含まず、`mise run check:model-ids` が
成功する。

8.7 THE `.env.example` SHALL 変数名だけを持ち、値を持たない。

8.8 THE `AGENTS.md` SHALL "Current state"、コマンド表（hello スクリプトのタスク）、Architecture の `src/` の
記述を段 2 完了後の状態に更新する。

8.9 THE steering（`tech.md` と `structure.md` の状態注記）SHALL 段 2 で導入した依存とファイルに合わせて
更新される。

## Non-Functional Requirements

- **オフライン・決定論**: 段 2 の合格判定テストは API キーとネットワークを必要とせず、同一コミットで同じ合否を
  返す（6.1、6.5）。Ollama への接続は hello スクリプトの手動実行に限る（5.9）。
- **テストの実行時間**: 再試行のテストは実時間の待ち（再試行の間隔）に依存せず、モックだけを使う
  `llm-call-basics.test.ts` の各テストは 1 件あたり 1 秒以内に終わる（既定レーンの開発機）。子プロセスを起動する
  契約テストと `mise` を呼ぶテストは、既存の慣例（120 秒のタイムアウト）に従い対象にしない（plan 時の追記）。
- **hello スクリプトの応答性**: Ollama が起動していない環境で、hello スクリプトは実行開始から 15 秒以内に
  5.4 の案内を表示して終わる。初回実装時に実測して research.md に記録する。
- **分岐カバレッジ（記録）**: 段 2 の実装後に呼び出し関数のモジュールの分岐カバレッジを測り、research.md に
  記録して憲章の TODO(BRANCH_COVERAGE) を決める入力にする。しきい値は本 spec の合否に使わない。測定に新しい
  依存が要る場合は 8.1 に従い plan で宣言する。
- **セキュリティ**: 呼び出し関数と hello スクリプトは、生の `prompt` / `system`、API キーをログやエラーの
  メッセージに出さない（3.5、4.7、5.7）。呼び出し関数のモジュールはクライアントバンドルに入らない（1.9）。
- **版の扱い**: テストと文書は版番号を合否の条件にしない。文書に書く版番号は確認日つきの参考値とする
  （憲章 原則 9）。
- **言語**: spec、解説、steering の散文は日本語。コード、識別子、コメント、パス、コミットメッセージ、
  `AGENTS.md` は英語。

## Out of Scope / Future Work

- ストリーミング（`streamText`）とチャット UI（段 3）。複数ターンの会話履歴（メッセージ配列）も段 3 で扱う。
- 構造化出力 `Output.object`（段 4）。
- タイムアウトと中断（`abortSignal`）。段 5 の実行時間の停止条件と一緒に扱う。
- ツールとツール承認（段 5）。
- `AI_PROVIDER` / `AI_MODEL` と `OLLAMA_BASE_URL` などの環境変数による切り替えと、その Zod 検証（段 6）。
- Anthropic、OpenAI、Google 用のプロバイダパッケージの導入と動作確認（解説の手順のみ。7.6・7.7）。
- `topP`、`stopSequences` などのサンプリング設定と、`finishReason` などの結果の追加項目。
- ラボ独自の再試行ラッパー（再試行の間隔や対象の自作）。`from-genai-to-agentic-ai` の該当モジュールへ案内する。
- shadcn/ui と Tailwind CSS v4 の導入（UI を持つ段 3 で扱う）。

---

_Initialized: 2026-11-27T06:36:32Z_ | _Requirements generated: 2026-11-27_
