/** Money is always a whole number of cents. */
export type Cents = number;

export function formatCents(amount: Cents): string {
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/**
 * Splits a non-negative amount into parts proportional to the weights. The parts
 * always add up to the amount: leftover cents go to the largest remainders,
 * earlier parts first on ties.
 */
export function allocate(amount: Cents, weights: readonly number[]): Cents[] {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return weights.map(() => 0);
  const exact = weights.map((w) => (amount * w) / sum);
  const parts = exact.map((x) => Math.floor(x));
  let left = amount - parts.reduce((a, b) => a + b, 0);
  const byRemainder = exact
    .map((x, i) => ({ i, rest: x - Math.floor(x) }))
    .sort((a, b) => b.rest - a.rest || a.i - b.i);
  for (const { i } of byRemainder) {
    if (left <= 0) break;
    parts[i] += 1;
    left -= 1;
  }
  return parts;
}
