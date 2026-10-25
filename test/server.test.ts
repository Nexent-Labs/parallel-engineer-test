import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { createApp } from "../src/server.ts";

const server = createApp();
let base = "";

before(async () => {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
after(() => new Promise<void>((resolve) => server.close(() => resolve())));

const post = (path: string, body: string) =>
  fetch(base + path, { method: "POST", headers: { "content-type": "application/json" }, body });

test("GET /health", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
});

test("POST /quote prices an order", async () => {
  const res = await post("/quote", JSON.stringify({ items: [{ sku: "TEA-02", quantity: 2 }], code: "SAVE5" }));
  assert.equal(res.status, 200);
  const q = (await res.json()) as { total: number };
  assert.equal(q.total, 2000 + 160 + 499);
});

test("POST /refund prices a return", async () => {
  const res = await post("/refund", JSON.stringify({
    items: [{ sku: "MUG-01", quantity: 1 }, { sku: "TEA-02", quantity: 2 }],
    returned: [{ sku: "TEA-02", quantity: 1 }],
  }));
  assert.equal(res.status, 200);
  assert.equal(((await res.json()) as { total: number }).total, 1350);
});

test("errors say what went wrong", async () => {
  let res = await post("/quote", "{not json");
  assert.equal(res.status, 400);
  res = await post("/quote", JSON.stringify({ items: [{ sku: "TEA-02", quantity: 1 }], code: "FREESTUFF" }));
  assert.equal(res.status, 422);
  assert.equal(((await res.json()) as { error: { code: string } }).error.code, "unknown_code");
  res = await fetch(`${base}/nowhere`);
  assert.equal(res.status, 404);
});
