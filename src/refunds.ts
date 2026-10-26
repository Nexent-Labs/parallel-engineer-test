import { OrderError } from "./errors.ts";
import type { Cents } from "./money.ts";
import type { OrderItem, Quote } from "./pricing.ts";

export interface Refund {
  goods: Cents;
  tax: Cents;
  shipping: Cents;
  total: Cents;
}

/** What the customer gets back for returning these items from an order that was priced as `paid`. */
export function refund(paid: Quote, returned: readonly OrderItem[]): Refund {
  if (returned.length === 0) throw new OrderError("empty_refund", "Say which items are being returned.");

  const quantities = new Map<string, number>();
  for (const item of returned) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new OrderError("bad_quantity", `The quantity of ${item.sku} must be a whole number of at least 1.`);
    }
    quantities.set(item.sku, (quantities.get(item.sku) ?? 0) + item.quantity);
  }

  let goods = 0;
  let tax = 0;
  for (const [sku, quantity] of quantities) {
    const line = paid.lines.find((l) => l.sku === sku);
    if (!line) throw new OrderError("not_in_order", `${sku} isn't in this order.`);
    if (quantity > line.quantity) throw new OrderError("bad_quantity", `Only ${line.quantity} of ${sku} were bought.`);
    goods += Math.round(((line.subtotal - line.discount) * quantity) / line.quantity);
    tax += Math.round((line.tax * quantity) / line.quantity);
  }

  const everything = paid.lines.every((l) => quantities.get(l.sku) === l.quantity);
  const shipping = everything ? paid.shipping : 0;
  return { goods, tax, shipping, total: Math.min(goods + tax + shipping, paid.total) };
}
