# 段 2: LLM 呼び出しの基礎

この段では、LLM を 1 回呼ぶ関数 `callModel` を読み、手元の Ollama で動かし、設定を変えて挙動を確かめる。
学ぶのは `generateText`、system / user の役割、温度と最大トークン、usage、エラーと再試行。仕様は
[specs/002-llm-call-basics/spec.md](../../specs/002-llm-call-basics/spec.md)。

段 2 の合格条件は、モックモデルで次の 3 つを検証できること。ネットワークも API キーも要らない。

1. 出力: 渡した設定どおりにモデルが呼ばれ、生成されたテキストがそのまま返る。
2. usage: 入力・出力のトークン数が返る。モデルが報告しなかった項目は `undefined` になる。
3. 再試行の回数: 失敗したときの試行回数が `maxRetries` + 1 回に収まる。

## 読む

読むのは `src/lib/ai/basics.ts` の 1 ファイルと、それを呼ぶ `scripts/hello.ts`。モデルは `callModel` の第 1 引数で
受け取る。関数の中でモデルを作らないので、テストでは `ai/test` のモックモデルに差し替えられる
（本物のモデルを呼ぶのは `scripts/hello.ts` だけ）。この関数の振る舞いを確かめるテストは
[tests/unit/llm-call-basics.test.ts](../../tests/unit/llm-call-basics.test.ts) にある。

| 学ぶこと | どこを読むか | 要点 |
| --- | --- | --- |
| `generateText` | `callModel` の `generateText({ ... })` | 1 回だけ呼ぶ。ストリーミングもツールも使わない |
| system / user の役割 | `CallConfig` の `system` と `prompt` | `prompt` は user のメッセージ、`system` は system のメッセージになる。AI SDK ではこの設定の名前が `instructions` で、`callModel` が `system` を `instructions` に渡している |
| `temperature` | `CallConfig.temperature` | 応答のばらつきを決める数。有限の数ならよい。範囲の判断はモデルに任せる |
| `maxOutputTokens` | `CallConfig.maxOutputTokens` | 生成するトークン数の上限。1 以上の整数。小さいと応答が途中で切れる |
| usage | `CallUsage`、`CallResult.usage` | `inputTokens` と `outputTokens` の 2 つ。モデルが報告しなければ `undefined` で、`0` で埋めない |
| エラーと再試行 | `CallFailedError`、`DEFAULT_MAX_RETRIES`、`CallConfigError` | 次の段落 |

`maxRetries` は、失敗した呼び出しを何回やり直すか。省略すると `DEFAULT_MAX_RETRIES`（2）で、最大 3 回試す。
やり直しは AI SDK が行う。`callModel` は自分で再試行しない。再試行の判定、待ち時間（指数バックオフ）、回数の数え方は
SDK の仕事で、`callModel` は SDK が投げた例外を `CallFailedError` に包み直すだけ。

`CallFailedError.reason` は 2 つの値を持つ。

- `retries-exhausted`: 許された試行を使い切った。最後の失敗の種類によらない。再試行できる失敗が続いたあと、最後の
  1 回が再試行できない失敗だった場合も、それが許された最後の試行なら、この値になる。そのため `cause`（最後の試行の
  例外）が再試行できない例外のこともある。
- `not-retryable`: 再試行しても直らない失敗（認証の失敗など）だったので、SDK が途中で止めた。

`attempts` は実際の試行回数、`cause` は最後の試行の例外。ただし `cause` は送った本文を含みうるので、画面やログに
丸ごと出さない。`CallFailedError` のメッセージは `reason` と `attempts` だけから作ってあり、prompt も system も含まない。

設定が不正なときは、モデルを呼ぶ前に `CallConfigError` で止まる。`field` が不正な項目の名前で、メッセージにも
値は入らない。空白だけの `prompt`、有限でない `temperature`、0 以下の `maxOutputTokens`、負の `maxRetries` などが対象。

## 動かす

Ollama を使うので、API キーも課金も要らない。ローカルのモデルを 1 回呼んで、応答と usage を表示する。

1. [Ollama](https://ollama.com/) を導入して起動する。アプリを開くか、`ollama serve` を実行する。
2. モデルを取得する。`ollama pull` に渡すモデル ID は [src/lib/ai/model-allowlist.ts](../../src/lib/ai/model-allowlist.ts) の
   `ollama` の項目を見る。未取得のまま次の手順を実行すると、正確な `ollama pull` のコマンドが表示される。
3. `mise run hello` を実行する。

成功すると、次の 4 行が表示されて終了コード 0 で終わる。

```text
model: <使ったモデル ID>
reply: <応答のテキスト>
inputTokens: <入力のトークン数>
outputTokens: <出力のトークン数>
```

モデルがトークン数を報告しなかった項目は、数ではなく `unknown` と表示される（`0` ではない）。

Ollama が起動していないときは、起動方法と `ollama pull` のコマンドを標準エラーに表示して、終了コード 1 で止まる。
再試行を 2 回してから案内するので、数秒かかる。モデルが未取得のときは `ollama pull` のコマンドだけを表示する。

`node scripts/hello.ts` と直接実行してはいけない。`basics.ts` が `server-only` を読み込み、Node の既定の条件では
「サーバー専用のモジュールをクライアントから読んだ」という例外になるため。`mise run hello` は
`--conditions=react-server` を付けて実行する。

## 改造する

`scripts/hello.ts` の `callModel` の呼び出しにある値を書き換えて、`mise run hello` の出力の違いを見る。書き換えたら
元に戻す（`git diff` が空になればよい）。

1. **`temperature` を変える**: 0.2 を 0 と 1.5 に変えて、それぞれ数回実行する。0 は毎回ほぼ同じ応答になり、大きい値は
   実行のたびに変わりやすい。範囲の上限はモデルによるので、極端な値は避ける。
2. **`maxOutputTokens` を小さくする**: 256 を 5 にして実行する。`outputTokens` が 5 前後になり、応答が途中で切れる。
3. **`maxRetries` を 0 にする**: 2 を 0 にして、Ollama を止めた状態で実行する。再試行しないので、案内が出るまでの時間が
   縮む（既定の 2 では約 6 秒かかる）。`maxRetries` を大きくすると、待ち時間が 2 秒、4 秒、8 秒と倍々に増える。
4. **不正な値で `CallConfigError` を見る**: `maxOutputTokens` を 0 にして実行する。モデルを呼ぶ前に
   `A setting is invalid: maxOutputTokens` と表示されて止まる。
5. **テストの側を変える**: `src/lib/ai/basics.ts` の `DEFAULT_MAX_RETRIES` を 2 から 3 に変えて、
   `mise run test` を実行する。[tests/unit/llm-call-basics.test.ts](../../tests/unit/llm-call-basics.test.ts) の
   `maxRetries` を省略したときの試行回数（3 回）を調べるテストが、期待値と実際の回数の違いで失敗する。テストが挙動を守っていることを確かめたら、2 に戻す。

## テストで合格を確かめる

合格条件ごとに、判定するテストを示す。どれもモックモデルを使うので、ネットワークも API キーも要らない。

| 合格条件 | 判定するテスト | 見ているもの |
| --- | --- | --- |
| 出力 | [tests/unit/llm-call-basics.test.ts](../../tests/unit/llm-call-basics.test.ts) | 渡した設定どおりに system / user のメッセージが作られ、生成されたテキストがそのまま返る。不正な設定はモデルを呼ばずに `CallConfigError` になる |
| usage | [tests/unit/llm-call-basics.test.ts](../../tests/unit/llm-call-basics.test.ts) | 入力・出力のトークン数が返る。報告されなかった項目は `0` でなく `undefined` |
| 再試行の回数 | [tests/unit/llm-call-basics.test.ts](../../tests/unit/llm-call-basics.test.ts) | 失敗のあとの試行回数が `maxRetries` + 1 回に収まり、`reason` と `attempts` が正しい |
| 型と読み込みの条件 | [tests/unit/llm-call-basics-contract.test.ts](../../tests/unit/llm-call-basics-contract.test.ts) | 余分な設定項目や文字列のモデル ID が型エラーになる。`basics.ts` が `server-only` を読む |
| `hello` タスクの形 | [tests/unit/hello-task.test.ts](../../tests/unit/hello-task.test.ts) | `hello` が `verify` や Git フック、CI から呼ばれない。スクリプトが環境変数を読まず、prompt を出力しない |

実行は次のとおり。

```bash
mise run test      # 単体テストだけ
mise run verify    # lint、型、モデル ID、秘密値、単体テスト、E2E smoke を順に実行
```

`hello` スクリプト自体は Ollama が要るため、自動テストを持たない。動作は上の「動かす」で自分で確かめる。

## プロバイダを変える方法

`scripts/hello.ts` の「モデル生成の 1 行」と、その import を差し替えれば、Ollama 以外のモデルを呼べる。
`callModel` は変えない（モデルを引数で受け取るため）。

| プロバイダ | 入れるパッケージ | import とモデル生成の 1 行 | API キーの環境変数 |
| --- | --- | --- | --- |
| Anthropic | `@ai-sdk/anthropic` | `import { anthropic } from "@ai-sdk/anthropic";` と `const model = anthropic(MODEL_ID);` | `ANTHROPIC_API_KEY` |
| OpenAI | `@ai-sdk/openai` | `import { openai } from "@ai-sdk/openai";` と `const model = openai(MODEL_ID);` | `OPENAI_API_KEY` |
| Google | `@ai-sdk/google` | `import { google } from "@ai-sdk/google";` と `const model = google(MODEL_ID);` | `GOOGLE_GENERATIVE_AI_API_KEY` |

手順は次のとおり。

1. **先に plan を改正する**: パッケージを入れる前に、`specs/002-llm-call-basics/plan.md` か新しい spec に依存を宣言する
   （憲章 原則 10）。そのうえで exact 版を入れる（公開から 24 時間以上たった版）。
2. **差し替える**: 上の表の import と 1 行に置き換える。`MODEL_ID` は
   `MODEL_ALLOWLIST.<provider>[0]` のように、allowlist から取る。`.env.example` には変数名しか置かない。API キーは
   自分の環境で設定し、リポジトリにも会話にも書かない。
3. **モデル ID は allowlist のものに限る**: [src/lib/ai/model-allowlist.ts](../../src/lib/ai/model-allowlist.ts) の
   該当プロバイダの項目だけを使う。ファイルに直接書くと `mise run check:model-ids` が失敗する。

段 2 の時点では、この 3 つのパッケージは入っていない。この手順は、そのままでは実行できない。上の手順 1 で
パッケージを入れてから初めて動く。環境変数による切り替え（`AI_PROVIDER`、`OLLAMA_BASE_URL` を含む）は段 6 で扱う。
段 2 では、スクリプトを手で書き換える。

## この段で扱わないこと

次の話題は、この段では扱わない。

- ストリーミング（`streamText`、画面へのトークン単位の表示）: 段 3。
  [全体計画の学習ロードマップ](../../specs/000-development-plan/plan.md)の §5 の表を見る。
- 構造化出力（`Output.object`）: 段 4。同じ表を見る。
- タイムアウトと中断（`abortSignal`、実行時間の停止条件）: 段 5。同じ表を見る。
- 自作の再試行（間隔や対象を自分で決める再試行）: 卒業先の
  [from-genai-to-agentic-ai](https://github.com/Fukuchan77/from-genai-to-agentic-ai) の該当モジュールを見る。この段の
  再試行は、AI SDK の `maxRetries` に任せている。
