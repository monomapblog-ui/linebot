import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "./claude";
import { shopConfig } from "@/config/shop";

test("buildSystemPrompt includes the shop name", () => {
  const prompt = buildSystemPrompt();
  assert.ok(prompt.includes(shopConfig.shopName));
});

test("buildSystemPrompt includes every course name and price", () => {
  const prompt = buildSystemPrompt();
  for (const course of shopConfig.courses) {
    assert.ok(prompt.includes(course.name));
    assert.ok(prompt.includes(course.price.toLocaleString()));
  }
});

test("buildSystemPrompt includes every coupon title", () => {
  const prompt = buildSystemPrompt();
  for (const coupon of shopConfig.coupons) {
    assert.ok(prompt.includes(coupon.title));
  }
});
