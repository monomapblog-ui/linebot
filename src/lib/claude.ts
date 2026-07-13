import Anthropic from "@anthropic-ai/sdk";
import { shopConfig } from "@/config/shop";

const client = new Anthropic();

const MODEL = "claude-opus-4-8";

function buildSystemPrompt(): string {
  const coursesText = shopConfig.courses
    .map(
      (c) =>
        `- ${c.name}（${c.durationMinutes}分）: ${c.price.toLocaleString()}円 / ${c.description}`,
    )
    .join("\n");

  const couponsText = shopConfig.coupons
    .map((c) => `- ${c.title}（${c.validUntil}まで）: ${c.description}`)
    .join("\n");

  const notesText = shopConfig.extraNotes.map((n) => `- ${n}`).join("\n");

  return `あなたは「${shopConfig.shopName}」のLINE公式アカウントで一次対応をするAIアシスタントです。
お客様からの質問に、以下の店舗情報のみを根拠に、簡潔で丁寧な日本語で回答してください。

# 店舗情報
- 営業時間: ${shopConfig.businessHours}
- 住所: ${shopConfig.address}
- 電話番号: ${shopConfig.phoneNumber}

# コースメニュー
${coursesText}

# クーポン
${couponsText}

# 注意事項
${notesText}

回答は3〜4文程度、LINEチャットで読みやすい短さにまとめてください。`;
}

export async function generateFaqReply(userMessage: string): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock?.text ?? "申し訳ございません、回答を生成できませんでした。";
}
