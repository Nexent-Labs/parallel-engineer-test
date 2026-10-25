import assert from "node:assert/strict";
import { test } from "node:test";
import { quote } from "../src/pricing.ts";
import { refund } from "../src/refunds.ts";
import { orderError } from "./helpers.ts";

const order = () => quote([{ sku: "MUG-01", quantity: 1 }, { sku: "TEA-02", quantity: 2 }]);

test("refunds a returned item with its tax", () => {
  const r = refund(order(), [{ sku: "TEA-02", quantity: 1 }]);
  assert.equal(r.goods, 1250);
  assert.equal(r.tax, 100);
  assert.equal(r.shipping, 0);
  assert.equal(r.total, 1350);
});

test("refunds shipping only when everything comes back", () => {
  const paid = order();
  const r = refund(paid, [{ sku: "MUG-01", quantity: 1 }, { sku: "TEA-02", quantity: 2 }]);
  assert.equal(r.shipping, paid.shipping);
  assert.equal(r.total, paid.total);
});

test("refuses to refund what wasn't bought", () => {
  const paid = quote([{ sku: "MUG-01", quantity: 1 }]);
  assert.throws(() => refund(paid, [{ sku: "MUG-01", quantity: 2 }]), orderError("bad_quantity"));
  assert.throws(() => refund(paid, [{ sku: "KET-03", quantity: 1 }]), orderError("not_in_order"));
  assert.throws(() => refund(paid, []), orderError("empty_refund"));
});
