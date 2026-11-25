# Node 27 レーンの初回検証記録（2026-11-23）

spec 001（要件 11.4〜11.6）の初回記録。緑は求めない。失敗した検査は「未解決事項」に書く。

2026-11-25 追記: CI（GitHub Actions の `verify-node27` ジョブ、Linux）の結果を各節の末尾に足した。

## 結論

- Node 27 alpha 上で `mise run verify` は **終了コード 1** だった。失敗は 2 件で、原因は別々。
- **E2E（`mise run e2e`）は Node 27 で動かない**。Next.js の開発サーバーが `rawHeaders.hasOwnProperty is not a function`
  で要求を処理できず、Playwright が `webServer` の起動を 60 秒待って打ち切り、テストは 0 件だった。同じ worktree を
  既定レーン（Node 26）で動かすと `@smoke` は 2/2 で通る。Node 27 側の非互換と見ている。
- **単体テスト（`mise run test`）は Node 27 で 224/224 が通る**。verify の中で落ちた 1 件は Node 27 と無関係で、
  worktree の元にした commit に `AGENTS.md` の変更が入っていなかったため（下記）。
- `check`、`typecheck`、`check:model-ids`、`check:secrets`、`security` は Node 27 で通った。
- **CI（Linux、2026-11-25 追記）でも E2E だけが失敗した**。症状は macOS と同じで、OS に依存しない。単体テストは
  234/234 で通り、上の `AGENTS.md` による 1 件の失敗は出なかった。ジョブは失敗したが、`continue-on-error` により
  ワークフロー全体は成功になった。

## 検証した版

`mise run runtime` の実出力（参考値。2026-11-23、macOS、`MISE_ENV=node27`）。

| 対象 | 版 |
| --- | --- |
| node | v27.0.0-alpha.0.1.1 |
| pnpm | 12.22.0 |
| TypeScript | 7.1.0-beta |
| Next.js | v16.5.0-canary.60 |
| lefthook | 2.2.2 |
| gitleaks | 8.30.1 |
| osv-scanner | 2.7.1 |

検証した commit は `4073d84`（`git worktree add --detach ../genai-lab-ts-node27 HEAD`）。

CI（2026-11-25 追記）: PR #2 の `ci.yml` の run 45614530248、commit `fe8e9a6`、GitHub-hosted の ubuntu ランナー。
`mise run runtime` の出力は上の表と同じ版だった（node v27.0.0-alpha.0.1.1、pnpm 12.22.0、TypeScript 7.1.0-beta、
Next.js v16.5.0-canary.60、lefthook 2.2.2、gitleaks 8.30.1、osv-scanner 2.7.1）。後続の commit `22bc18d`・`15ec69c` の
run も同じ結果だった。

## 通したゲート

| 検査 | Node 27 の結果 |
| --- | --- |
| `check`（Biome） | 通過（38 ファイル） |
| `typecheck`（`next typegen` と `tsc --noEmit`） | 通過 |
| `check:model-ids` | 通過（36 ファイル、検出 0） |
| `check:secrets`（gitleaks、履歴 17 commit） | 通過（検出 0） |
| `test`（Vitest） | 223/224。残り 1 件は下記の `AGENTS.md`。対照実験では 224/224 |
| `e2e`（Playwright `@smoke`） | **失敗**（テスト 0 件、`webServer` が 60 秒で時間切れ） |
| `security`（osv-scanner、`pnpm audit`） | 通過（173 パッケージ、既知の脆弱性なし） |

`mise run verify` は最初に失敗した `test` で止まるため、`e2e` は単独で `mise run e2e` を実行して確かめた。

CI（Linux、2026-11-25 追記）。ジョブの手順は `mise run runtime` → `mise run verify` で、`security` は実行しない。

| 検査 | Node 27 の結果（CI） |
| --- | --- |
| `check`（Biome） | 通過（39 ファイル） |
| `typecheck` | 通過 |
| `check:model-ids` | 通過（39 ファイル、検出 0） |
| `check:secrets` | 通過（検出 0） |
| `test`（Vitest） | **234/234 で通過** |
| `e2e`（Playwright `@smoke`） | **失敗**（テスト 0 件、`webServer` が 60 秒で時間切れ） |

CI では `test` が通るため、verify は `e2e` まで進み、そこで止まった（`mise run verify` に 71 秒、ジョブ全体で 106 秒）。

## 未解決事項

1. **E2E: Next.js 開発サーバーが Node 27 alpha で落ちる**。`mise run e2e` の出力に
   `TypeError: rawHeaders.hasOwnProperty is not a function` と `TypeError: headers.hasOwnProperty is not a function` が
   繰り返し出る。`rawHeaders.hasOwnProperty` は `node_modules/next/dist/compiled/next-server/` の
   `app-route.runtime.dev.js` などの開発用ランタイムにある。要求のヘッダーオブジェクトが `Object.prototype` を
   継承していないと `hasOwnProperty` が呼べないため、Node 27 で要求のヘッダーの扱いが変わったと推測しているが、
   **原因は Node の変更点まで特定していない**。対照: 同じ worktree、同じ commit、同じ依存で Node 26.13.1 は 2/2 通る。
   次にやること: Node 27 の次の alpha と Next.js の次の canary で再実行する。上流の issue の有無は未確認。
   **2026-11-25 追記**: CI（Linux）でも同じく再現した。`[WebServer] TypeError: rawHeaders.hasOwnProperty is not a function`
   と `headers.hasOwnProperty` が繰り返され、`Error: Timed out waiting 60000ms from config.webServer.`、
   `no tests were executed` で終わる。macOS 固有の問題ではない。原因の特定は未完了のまま。
2. **単体テスト 1 件: worktree の `AGENTS.md` に Next.js の同梱ドキュメントへの案内がない**。失敗したのは
   `repo-policy.test.ts` の「keeps the guidance of the removed block in AGENTS.md」。`AGENTS.md` の変更はタスク 11.5
   までコミットしない方針で、commit から作った worktree には含まれない。作業ツリーの `AGENTS.md` を worktree に
   コピーすると Node 27 でも 224/224 が通る（対照）。Node 27 の問題ではないが、タスク 11.5 で `AGENTS.md` を
   コミットした後は、この失敗は出ない見込み。
   **2026-11-25 追記（解消）**: `AGENTS.md` をコミットした後の commit `fe8e9a6` では、CI の Node 27 で 234/234 が通った。
3. ~~Linux（CI の `verify-node27`）での結果は未確認。~~ **2026-11-25 追記（解消）**: タスク 12.5 の CI で確かめた。
   結果は「結論」と「通したゲート」の追記のとおりで、未解決事項 1 だけが残る。

## 再現手順

```bash
# 事前: 作業ツリーの変更を commit しておく（worktree は commit から作る）
git worktree add --detach ../genai-lab-ts-node27 HEAD
cd ../genai-lab-ts-node27

export MISE_ENV=node27
mise trust
mise install
pnpm install --frozen-lockfile        # node_modules は既定レーンと共有しない
pnpm exec playwright install chromium

mise run runtime                       # 検証した版の実出力
mise run verify                        # 最初に失敗した検査で止まる
mise run e2e                           # verify が途中で止まった場合に単独で確認する

cd - && git worktree remove ../genai-lab-ts-node27
```

フック（`lefthook`）は worktree 間で共有されるため、worktree では再 install しない。
