import { OrderError } from "./errors.ts";
import { formatCents, type Cents } from "./money.ts";

type Rule =
  | { kind: "percent"; percent: number }
  | { kind: "fixed"; amount: Cents; minimum: Cents };

const CODES: Record<string, Rule> = {
  WELCOME10: { kind: "percent", percent: 10 },
  SAVE5: { kind: "fixed", amount: 500, minimum: 2500 },
};

/** The code as stored, and what it takes off this subtotal. */
export function applyCode(code: string, subtotal: Cents): { code: string; discount: Cents } {
  const key = code.trim().toUpperCase();
  const rule = Object.hasOwn(CODES, key) ? CODES[key] : undefined;
  if (!rule) throw new OrderError("unknown_code", `There is no discount code "${code.trim()}".`);
  if (rule.kind === "percent") {
    return { code: key, discount: Math.round((subtotal * rule.percent) / 100) };
  }
  if (subtotal < rule.minimum) {
    throw new OrderError("code_minimum", `${key} needs a subtotal of at least ${formatCents(rule.minimum)}.`);
  }
  return { code: key, discount: Math.min(rule.amount, subtotal) };
}
