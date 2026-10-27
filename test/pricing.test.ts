import assert from "node:assert/strict";
import { test } from "node:test";
import { quote, SHIPPING } from "../src/pricing.ts";
import { orderError } from "./helpers.ts";

test("prices a small order with shipping and tax", () => {
  const q = quote([{ sku: "TEA-02", quantity: 2 }]);
  assert.equal(q.subtotal, 2500);
  assert.equal(q.discount, 0);
  assert.equal(q.shipping, SHIPPING);
  assert.equal(q.tax, 200);
  assert.equal(q.total, 2500 + 200 + SHIPPING);
});

test("ships free well over the minimum", () => {
  const q = quote([{ sku: "KET-03", quantity: 2 }]);
  assert.equal(q.shipping, 0);
  assert.equal(q.total, 6400 + 512);
});

test("ships free at exactly the minimum", () => {
  const q = quote([{ sku: "TEA-02", quantity: 4 }]);
  assert.equal(q.subtotal, 5000);
  assert.equal(q.shipping, 0);
  assert.equal(q.total, 5000 + 400);
});

test("charges shipping just under the minimum", () => {
  const q = quote([{ sku: "CUP-04", quantity: 1 }, { sku: "KET-03", quantity: 1 }]);
  assert.equal(q.subtotal, 4999);
  assert.equal(q.shipping, SHIPPING);
});

test("applies WELCOME10 before tax, in any letter case", () => {
  const q = quote([{ sku: "KET-03", quantity: 2 }], " welcome10 ");
  assert.equal(q.code, "WELCOME10");
  assert.equal(q.discount, 640);
  assert.equal(q.tax, 461);
  assert.equal(q.shipping, 0);
  assert.equal(q.total, 5760 + 461);
});

test("SAVE5 needs a $25 subtotal", () => {
  assert.equal(quote([{ sku: "TEA-02", quantity: 2 }], "SAVE5").discount, 500);
  assert.throws(() => quote([{ sku: "TEA-02", quantity: 1 }], "SAVE5"), orderError("code_minimum"));
});

test("rejects unknown codes and products", () => {
  assert.throws(() => quote([{ sku: "TEA-02", quantity: 1 }], "FREESTUFF"), orderError("unknown_code"));
  assert.throws(() => quote([{ sku: "NOPE", quantity: 1 }]), orderError("unknown_product"));
});

test("rejects empty orders and bad quantities", () => {
  assert.throws(() => quote([]), orderError("empty_order"));
  assert.throws(() => quote([{ sku: "TEA-02", quantity: 0 }]), orderError("bad_quantity"));
  assert.throws(() => quote([{ sku: "TEA-02", quantity: 1.5 }]), orderError("bad_quantity"));
  assert.throws(() => quote([{ sku: "TEA-02", quantity: 60 }, { sku: "TEA-02", quantity: 40 }]), orderError("bad_quantity"));
});

test("merges repeated products and splits the discount and tax across lines", () => {
  const q = quote([{ sku: "MUG-01", quantity: 1 }, { sku: "TEA-02", quantity: 1 }, { sku: "MUG-01", quantity: 1 }], "WELCOME10");
  assert.equal(q.lines.length, 2);
  assert.equal(q.lines[0].quantity, 2);
  assert.equal(q.lines.reduce((sum, l) => sum + l.discount, 0), q.discount);
  assert.equal(q.lines.reduce((sum, l) => sum + l.tax, 0), q.tax);
});

test("takes 5% off a line of a dozen", () => {
  const q = quote([{ sku: "MUG-01", quantity: 12 }]);
  assert.equal(q.subtotal, 21600);
  assert.equal(q.bulk, 1080);
  assert.equal(q.shipping, 0);
  assert.equal(q.tax, 1642);
  assert.equal(q.total, 21600 - 1080 + 1642);
});
