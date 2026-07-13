export type LineTextMessage = {
  type: "text";
  id: string;
  text: string;
};

export type LineMessageEvent = {
  type: "message";
  replyToken: string;
  message: LineTextMessage | { type: string; [key: string]: unknown };
  source: {
    type: "user" | "group" | "room";
    userId?: string;
  };
  timestamp: number;
};

export type LineFollowEvent = {
  type: "follow" | "unfollow" | "join" | "leave" | "postback";
  replyToken?: string;
  source: {
    type: "user" | "group" | "room";
    userId?: string;
  };
  timestamp: number;
};

export type LineWebhookEvent = LineMessageEvent | LineFollowEvent;

export type LineWebhookBody = {
  destination: string;
  events: LineWebhookEvent[];
};
