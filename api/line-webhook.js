const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");
const salonConfig = require("../lib/salon-config");

// LINEの署名検証には生のリクエストボディ（バイト列）が必要。
// Vercelのデフォルトのbodyパーサーを無効化し、自前でストリームを読む。
module.exports.config = {
  api: {
    bodyParser: false,
  },
};

let anthropic = null;
function getAnthropic() {
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function verifySignature(rawBody, signature, channelSecret) {
  if (!signature || !channelSecret) return false;
  const expected = crypto.createHmac("sha256", channelSecret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function buildSystemPrompt() {
  const c = salonConfig;
  const courseLines = c.courses.map((x) => `- ${x.name}: ${x.price}（${x.note}）`).join("\n");
  const couponLines = c.coupons.map((x) => `- ${x.name}: ${x.detail}`).join("\n");
  const noteLines = c.notes.map((x) => `- ${x}`).join("\n");

  return `あなたは「${c.shopName}」の受付AIです。お客様からのLINEメッセージに、丁寧・簡潔に日本語で回答してください。

# 営業時間
${c.businessHours}

# コースメニュー
${courseLines}

# クーポン情報
${couponLines}

# 注意事項
${noteLines}

# 回答方針
- 上記の情報の範囲内で、簡潔に（2〜4文程度で）回答してください。
- 在籍状況・予約確定など、この場で答えられない質問には、正直に「担当スタッフより追ってご連絡します」と案内してください。
- 上記に情報がない質問（住所・アクセス方法など）にも、無理に答えず同様に案内してください。
- 過度に馴れ馴れしい言葉遣いは避け、丁寧な接客敬語を使ってください。
- 絵文字は使わないでください。`;
}

async function replyToLine(replyToken, text) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const res = await fetch("https://api.line.me/v2/bot/message/reply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("LINE reply API error:", res.status, body);
  }
}

async function handleTextMessage(event) {
  const fallback = "申し訳ございません、只今混み合っております。担当スタッフより改めてご連絡いたします。";
  try {
    const completion = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: event.message.text }],
    });
    const replyText =
      completion.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n") || fallback;
    await replyToLine(event.replyToken, replyText);
  } catch (err) {
    console.error("LINE bot AI reply failed:", err);
    await replyToLine(event.replyToken, fallback).catch(() => {});
  }
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed");
    return;
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["x-line-signature"];
  const channelSecret = process.env.LINE_CHANNEL_SECRET;

  if (!verifySignature(rawBody, signature, channelSecret)) {
    res.status(401).send("Invalid signature");
    return;
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString("utf8") || "{}");
  } catch {
    res.status(400).send("Invalid JSON");
    return;
  }

  const events = payload.events || [];

  // LINE Developersコンソールの「検証」ボタンは空のevents配列を送ってくる。200を返せばOK。
  await Promise.all(
    events.map((event) => {
      if (event.type === "message" && event.message && event.message.type === "text") {
        return handleTextMessage(event);
      }
      return Promise.resolve();
    })
  );

  res.status(200).json({ ok: true });
};
