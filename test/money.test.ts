import assert from "node:assert/strict";
import { test } from "node:test";
import { allocate, formatCents } from "../src/money.ts";

test("formats cents as dollars", () => {
  assert.equal(formatCents(0), "$0.00");
  assert.equal(formatCents(5), "$0.05");
  assert.equal(formatCents(123456), "$1234.56");
  assert.equal(formatCents(-499), "-$4.99");
});

test("allocate splits in proportion and always adds up", () => {
  assert.deepEqual(allocate(100, [1, 1, 1]), [34, 33, 33]);
  assert.deepEqual(allocate(500, [1800, 3200]), [180, 320]);
  const cases: [number, number[]][] = [[1, [1, 1]], [999, [3, 7, 11]], [344, [1800, 2500]]];
  for (const [amount, weights] of cases) {
    assert.equal(allocate(amount, weights).reduce((a, b) => a + b, 0), amount);
  }
});

test("allocate gives nothing when there is nothing to weigh", () => {
  assert.deepEqual(allocate(100, [0, 0]), [0, 0]);
});
