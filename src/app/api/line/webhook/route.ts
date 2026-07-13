import { NextResponse } from "next/server";
import { verifyLineSignature, replyToLine } from "@/lib/line";
import { generateFaqReply } from "@/lib/claude";
import type { LineWebhookBody, LineMessageEvent } from "@/types/line";

function isTextMessageEvent(
  event: LineWebhookBody["events"][number],
): event is LineMessageEvent & { message: { type: "text"; text: string; id: string } } {
  return event.type === "message" && event.message.type === "text";
}

export async function POST(request: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelSecret || !channelAccessToken) {
    console.error("LINE_CHANNEL_SECRET / LINE_CHANNEL_ACCESS_TOKEN is not configured");
    return NextResponse.json({ error: "server not configured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature, channelSecret)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const body = JSON.parse(rawBody) as LineWebhookBody;

  const mockMode = process.env.LINE_MOCK_MODE === "true";

  await Promise.all(
    body.events.filter(isTextMessageEvent).map(async (event) => {
      try {
        const replyText = await generateFaqReply(event.message.text);
        if (mockMode) {
          console.log(`[LINE_MOCK_MODE] reply to ${event.replyToken}:\n${replyText}`);
        } else {
          await replyToLine(event.replyToken, replyText, channelAccessToken);
        }
      } catch (error) {
        console.error("Failed to handle LINE message event", error);
      }
    }),
  );

  return NextResponse.json({ status: "ok" });
}
