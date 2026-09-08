const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");
const { Resend } = require("resend");
const salonConfig = require("../lib/salon-config");
const conversationStore = require("../lib/conversation-store");

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

let resend = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
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

// お客様の予約希望が十分に固まった時点で、AIがこのツールを呼び出す。
// ここでの「呼び出し」は予約確定ではなく、あくまで人間への引き継ぎトリガーであることに注意。
const RESERVATION_TOOL = {
  name: "submit_reservation_request",
  description:
    "お客様の予約希望（コース・希望日時）が十分に確認できたら呼び出してください。" +
    "この呼び出しは予約の確定ではなく、スタッフへ内容を引き継ぐためのものです。" +
    "コースまたは希望日時のどちらかがまだ分からない場合は呼び出さず、先にお客様へ質問してください。",
  input_schema: {
    type: "object",
    properties: {
      course: { type: "string", description: "お客様が希望しているコース名" },
      preferred_datetime: {
        type: "string",
        description: "お客様が話した希望日時を自然文のまま（例: 本日19時、明日の午後、など正規化しなくてよい）",
      },
      customer_note: {
        type: "string",
        description: "その他お客様が伝えた要望・特記事項があれば記載。なければ空文字。",
      },
    },
    required: ["course", "preferred_datetime"],
  },
};

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
- 在籍状況など、この場で答えられない質問には、正直に「担当スタッフより追ってご連絡します」と案内してください。
- 上記に情報がない質問（住所・アクセス方法など）にも、無理に答えず同様に案内してください。
- 過度に馴れ馴れしい言葉遣いは避け、丁寧な接客敬語を使ってください。
- 絵文字は使わないでください。

# 予約希望への対応（重要）
- お客様が予約を希望している様子であれば、コース（未定なら候補も可）と希望日時を会話の中で確認してください。一度に全部聞き出そうとせず、自然な会話で構いません。
- コースと希望日時の両方が分かったら、必ず ${RESERVATION_TOOL.name} を呼び出してスタッフへ引き継いでください。
- **重要な制約**: この場で予約が確定するわけではありません。「予約が確定しました」「ご予約承りました」のような、確定を意味する表現は絶対に使わないでください。必ず「担当より確認のうえ、追ってご連絡いたします」という趣旨で伝えてください。
- ${RESERVATION_TOOL.name} を呼び出す際も、あわせてお客様への返信文（お聞きした内容の確認＋上記の「追ってご連絡します」という案内）を必ず生成してください。`;
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendHandoffEmail({ lineUserId, course, preferredDatetime, customerNote }) {
  const notifyEmail = salonConfig.reservationHandoff.notifyEmail;
  try {
    const { error } = await getResend().emails.send({
      from: `YOIN DESK LINE予約引き継ぎ <${notifyEmail}>`,
      to: notifyEmail,
      subject: `【LINE予約希望】${salonConfig.shopName} - ${course}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h2 style="color:#c9a24b;margin-bottom:16px">LINEでの予約希望（要確定作業）</h2>
          <p style="color:#991b1b;font-weight:bold">この内容はAIが会話から整形したものです。予約システムへの最終確定は担当者が行ってください。</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:140px">希望コース</td><td style="padding:8px 0">${escapeHtml(course)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">希望日時</td><td style="padding:8px 0">${escapeHtml(preferredDatetime)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">特記事項</td><td style="padding:8px 0">${escapeHtml(customerNote || "なし")}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">LINEユーザーID</td><td style="padding:8px 0">${escapeHtml(lineUserId)}</td></tr>
          </table>
        </div>
      `,
    });
    if (error) throw new Error(error.message);
  } catch (err) {
    console.error("Reservation handoff email failed:", err);
  }
}

async function handleTextMessage(event) {
  const fallback = "申し訳ございません、只今混み合っております。担当スタッフより改めてご連絡いたします。";
  const userId = event.source && event.source.userId;
  const userText = event.message.text;

  const history = await conversationStore.getHistory(null, userId);

  try {
    const completion = await getAnthropic().messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: buildSystemPrompt(),
      tools: [RESERVATION_TOOL],
      messages: [...history, { role: "user", content: userText }],
    });

    const textBlock = completion.content.find((b) => b.type === "text");
    const toolUse = completion.content.find((b) => b.type === "tool_use" && b.name === RESERVATION_TOOL.name);

    let replyText = (textBlock && textBlock.text) || fallback;

    if (toolUse) {
      const { course, preferred_datetime: preferredDatetime, customer_note: customerNote } = toolUse.input || {};
      await sendHandoffEmail({ lineUserId: userId, course, preferredDatetime, customerNote });
      if (!textBlock) {
        replyText = `かしこまりました。${course || "ご希望のコース"}、${preferredDatetime || "ご希望の日時"}でのご希望ですね。担当より内容を確認のうえ、追ってご連絡いたします。`;
      }
      // 引き継ぎが完了したら、その予約希望の会話はここで一区切りとして履歴をリセットする
      await conversationStore.clearHistory(null, userId);
    } else {
      await conversationStore.appendTurn(null, userId, history, userText, replyText);
    }

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
