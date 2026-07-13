import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifyLineSignature } from "./line";

const CHANNEL_SECRET = "test-channel-secret";

function sign(body: string, secret = CHANNEL_SECRET): string {
  return crypto.createHmac("sha256", secret).update(body).digest("base64");
}

test("verifyLineSignature accepts a correctly signed body", () => {
  const body = JSON.stringify({ events: [] });
  const signature = sign(body);
  assert.equal(verifyLineSignature(body, signature, CHANNEL_SECRET), true);
});

test("verifyLineSignature rejects a tampered body", () => {
  const body = JSON.stringify({ events: [] });
  const signature = sign(body);
  const tamperedBody = JSON.stringify({ events: [{ type: "message" }] });
  assert.equal(verifyLineSignature(tamperedBody, signature, CHANNEL_SECRET), false);
});

test("verifyLineSignature rejects a signature made with the wrong secret", () => {
  const body = JSON.stringify({ events: [] });
  const signature = sign(body, "wrong-secret");
  assert.equal(verifyLineSignature(body, signature, CHANNEL_SECRET), false);
});

test("verifyLineSignature rejects a missing signature", () => {
  const body = JSON.stringify({ events: [] });
  assert.equal(verifyLineSignature(body, null, CHANNEL_SECRET), false);
});
