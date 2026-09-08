// LINEの1メッセージ＝1リクエストのサーバレス関数は、リクエスト間で何も記憶しない。
// 複数回のやり取りをまたいで「コース・日時・お客様情報」を積み上げて予約内容を
// 整形するには、ユーザーごとの会話履歴をどこかに保持する必要がある。
// Upstash Redis（Vercel Marketplaceの「Redis」インテグレーション経由で追加するのが今の推奨導線。
// 旧`@vercel/kv`パッケージは2025年に非推奨化されているため使わない）をその保管先として使う。
//
// 環境変数（`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`、または統合方法によっては
// `KV_REST_API_URL`/`KV_REST_API_TOKEN`という名前で払い出される場合もあるため両対応）が
// 未設定の環境（まだRedisストアを作成していない場合）では、履歴を保存・参照せず常に
// 「履歴なし」として動作する（＝現状と同じ、単発メッセージへの単発応答にフォールバックする）。

const HISTORY_TTL_SECONDS = 30 * 60; // 30分やり取りがなければ会話は忘れる
const MAX_TURNS = 12; // 直近何メッセージ分まで保持するか（system promptの肥大化を防ぐ）

let redisClient = null;
let redisUnavailableWarned = false;

function getRedis() {
  if (redisClient) return redisClient;

  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    if (!redisUnavailableWarned) {
      console.warn(
        "conversation-store: UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN が未設定のため、会話履歴なしのステートレス応答にフォールバックします。"
      );
      redisUnavailableWarned = true;
    }
    return null;
  }
  try {
    // 遅延require: 未設定環境でも依存パッケージの読み込み自体では落ちないようにする
    const { Redis } = require("@upstash/redis");
    redisClient = new Redis({ url, token });
    return redisClient;
  } catch (err) {
    console.error("conversation-store: @upstash/redis の読み込みに失敗しました", err);
    return null;
  }
}

function keyFor(channelId, userId) {
  return `line-conv:${channelId || "default"}:${userId}`;
}

async function getHistory(channelId, userId) {
  const kv = getRedis();
  if (!kv) return [];
  try {
    const history = await kv.get(keyFor(channelId, userId));
    return Array.isArray(history) ? history : [];
  } catch (err) {
    console.error("conversation-store: 履歴の取得に失敗しました", err);
    return [];
  }
}

async function appendTurn(channelId, userId, history, userText, assistantText) {
  const kv = getRedis();
  if (!kv) return;
  const next = [...history, { role: "user", content: userText }, { role: "assistant", content: assistantText }].slice(
    -MAX_TURNS
  );
  try {
    await kv.set(keyFor(channelId, userId), next, { ex: HISTORY_TTL_SECONDS });
  } catch (err) {
    console.error("conversation-store: 履歴の保存に失敗しました", err);
  }
}

async function clearHistory(channelId, userId) {
  const kv = getRedis();
  if (!kv) return;
  try {
    await kv.del(keyFor(channelId, userId));
  } catch (err) {
    console.error("conversation-store: 履歴の削除に失敗しました", err);
  }
}

module.exports = { getHistory, appendTurn, clearHistory };
