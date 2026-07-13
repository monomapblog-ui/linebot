# linebot

メンズエステ店舗向けのAI自動応答LINEボット（MVPプロトタイプ）。
「何分コースがありますか？」「クーポンありますか？」といった頻出質問に、Claude APIが店舗のFAQ情報をもとに自動応答する。

## 技術構成

- Next.js（App Router）
- LINE Messaging API（Webhook受信・署名検証・返信）
- Claude API（`@anthropic-ai/sdk`）で回答を生成
- 店舗情報は `src/config/shop.ts` にハードコード（1店舗分のダミーデータ）

## セットアップ

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` に以下を設定する。

| 変数 | 説明 |
| --- | --- |
| `ANTHROPIC_API_KEY` | Claude APIキー |
| `LINE_CHANNEL_SECRET` | LINE Developersコンソールで発行されるチャネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | 同コンソールで発行されるチャネルアクセストークン |
| `LINE_MOCK_MODE` | `true`にすると、LINEへの実返信をせずコンソール出力のみ行う（ローカル動作確認用） |
| `WEBHOOK_URL` | `scripts/mock-line-event.ts`の送信先（省略時 `http://localhost:3000/api/line/webhook`） |

ローカル動作確認だけであれば `LINE_CHANNEL_SECRET` は任意のダミー値（例: `dev-secret`）でよい。実際のLINE公式アカウントと接続する場合は、LINE Developersでチャネルを作成し、正しいシークレット・トークンを設定する。

## 開発サーバー起動

```bash
npm run dev
```

## Webhookをローカルでモックテストする

実際のLINEアカウント連携なしに、Webhookの署名検証〜Claudeによる回答生成までを確認できる。

```bash
# .env.local で LINE_MOCK_MODE=true にしておくと、返信内容がターミナルに出力される
npm run mock:line -- "何分コースがありますか？"
npm run mock:line -- "クーポンありますか？"
```

## テスト

署名検証・システムプロンプト生成ロジックの単体テスト（Node組み込みテストランナー）。

```bash
npm run test
```

## 店舗情報の編集

`src/config/shop.ts` の `shopConfig` を編集することで、コースメニューやクーポン内容を変更できる。この内容がそのままClaudeのシステムプロンプトに埋め込まれ、回答の根拠になる。

## 本番のLINE公式アカウント接続

1. LINE Developersコンソールでチャネル（Messaging API）を作成
2. チャネルシークレット・チャネルアクセストークンを取得し、デプロイ先の環境変数に設定
3. Webhook URLを `https://<デプロイ先ドメイン>/api/line/webhook` に設定し、Webhookの利用をオンにする
4. `LINE_MOCK_MODE` は本番では `false`（または未設定）にする

## 今後のスコープ外

「○○さん空いてますか？」のようなキャストのリアルタイム空き状況への対応は、シフト管理システムとの連携が必要なため、このMVPには含まない。
