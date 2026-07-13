/**
 * ローカルでLINE Webhookイベントをシミュレートして送信するスクリプト。
 * 実際のLINE公式アカウント連携なしに、Webhookエンドポイントの動作確認ができる。
 *
 * 使い方:
 *   npm run mock:line -- "何分コースがありますか？"
 */
import crypto from "crypto";
import fs from "fs";
import path from "path";

function loadEnvLocal(): Record<string, string> {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return {};

  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    env[key] = value;
  }
  return env;
}

async function main() {
  const env = loadEnvLocal();
  const channelSecret = env.LINE_CHANNEL_SECRET ?? process.env.LINE_CHANNEL_SECRET;
  const endpoint = env.WEBHOOK_URL ?? process.env.WEBHOOK_URL ?? "http://localhost:3000/api/line/webhook";

  if (!channelSecret) {
    console.error(
      "LINE_CHANNEL_SECRET が .env.local に設定されていません。開発用のダミー値を設定してください（例: LINE_CHANNEL_SECRET=dev-secret）。",
    );
    process.exit(1);
  }

  const userText = process.argv[2] ?? "何分コースがありますか？";

  const body: unknown = {
    destination: "dev-destination",
    events: [
      {
        type: "message",
        replyToken: "dev-reply-token",
        message: {
          type: "text",
          id: String(Date.now()),
          text: userText,
        },
        source: { type: "user", userId: "dev-user" },
        timestamp: Date.now(),
      },
    ],
  };

  const rawBody = JSON.stringify(body);
  const signature = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");

  console.log(`POST ${endpoint}`);
  console.log(`Message: ${userText}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Line-Signature": signature,
    },
    body: rawBody,
  });

  console.log(`Status: ${response.status}`);
  console.log(await response.text());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
