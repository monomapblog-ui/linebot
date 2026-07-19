const { Resend } = require("resend");

let resend = null;
function getResend() {
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "support@yoin.jp";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9\-+()（） ]{9,15}$/;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { "shop-name": shopName, "contact-name": contactName, email, phone, stores, message, agree } = req.body || {};

  if (!shopName || !contactName || !email) {
    res.status(400).json({ error: "必須項目が入力されていません" });
    return;
  }
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: "メールアドレスの形式が正しくありません" });
    return;
  }
  if (phone && !PHONE_RE.test(phone)) {
    res.status(400).json({ error: "電話番号の形式が正しくありません" });
    return;
  }
  if (!agree) {
    res.status(400).json({ error: "プライバシーポリシーへの同意が必要です" });
    return;
  }
  if (typeof message === "string" && message.length > 1000) {
    res.status(400).json({ error: "ご相談内容が長すぎます" });
    return;
  }

  try {
    const { error } = await getResend().emails.send({
      from: `YOIN DESK お問い合わせ <${NOTIFY_EMAIL}>`,
      to: NOTIFY_EMAIL,
      replyTo: email,
      subject: `【YOIN DESK】無料相談: ${shopName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h2 style="color:#c9a24b;margin-bottom:16px">無料相談のお問い合わせ</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#6b7280;width:120px">店舗名</td><td style="padding:8px 0">${escapeHtml(shopName)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">お名前</td><td style="padding:8px 0">${escapeHtml(contactName)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">メール</td><td style="padding:8px 0">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">電話番号</td><td style="padding:8px 0">${escapeHtml(phone || "未入力")}</td></tr>
            <tr><td style="padding:8px 0;color:#6b7280">店舗数</td><td style="padding:8px 0">${escapeHtml(stores || "未選択")}</td></tr>
          </table>
          <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb" />
          <p style="white-space:pre-wrap;color:#374151;line-height:1.7">${escapeHtml(message || "（相談内容の記入なし）")}</p>
        </div>
      `,
    });
    if (error) throw new Error(error.message);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact email send failed:", err);
    res.status(500).json({ error: "送信に失敗しました。しばらく後でお試しください。" });
  }
};
