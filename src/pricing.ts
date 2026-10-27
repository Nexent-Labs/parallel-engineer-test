import { product } from "./catalog.ts";
import { applyCode } from "./discounts.ts";
import { OrderError } from "./errors.ts";
import { allocate, type Cents } from "./money.ts";

export const SHIPPING: Cents = 499;
export const FREE_SHIPPING_MINIMUM: Cents = 5000;
export const TAX_PERCENT = 8;
export const MAX_QUANTITY = 99;
// Buying in bulk: 5% off a line of BULK_MINIMUM or more of one product.
export const BULK_MINIMUM = 10;
export const BULK_PERCENT = 5;

export interface OrderItem {
  sku: string;
  quantity: number;
}

export interface QuoteLine {
  sku: string;
  name: string;
  unitPrice: Cents;
  quantity: number;
  /** unitPrice × quantity */
  subtotal: Cents;
  /** This line's share of the order's discount. */
  discount: Cents;
  /** The bulk discount on this line. */
  bulk: Cents;
  /** This line's share of the order's tax. */
  tax: Cents;
}

export interface Quote {
  lines: QuoteLine[];
  code: string | null;
  subtotal: Cents;
  discount: Cents;
  bulk: Cents;
  shipping: Cents;
  tax: Cents;
  total: Cents;
}

export function quote(items: readonly OrderItem[], code?: string): Quote {
  if (items.length === 0) throw new OrderError("empty_order", "An order needs at least one item.");

  // The same product twice is one line.
  const quantities = new Map<string, number>();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new OrderError("bad_quantity", `The quantity of ${item.sku} must be a whole number of at least 1.`);
    }
    quantities.set(item.sku, (quantities.get(item.sku) ?? 0) + item.quantity);
  }
  const lines: QuoteLine[] = [...quantities].map(([sku, quantity]) => {
    const p = product(sku);
    if (!p) throw new OrderError("unknown_product", `There is no product ${sku}.`);
    if (quantity > MAX_QUANTITY) {
      throw new OrderError("bad_quantity", `At most ${MAX_QUANTITY} of ${sku} fit in one order.`);
    }
    const subtotal = p.price * quantity;
    const bulk = quantity > BULK_MINIMUM ? (subtotal * BULK_PERCENT) / 100 : 0;
    return { sku, name: p.name, unitPrice: p.price, quantity, subtotal, discount: 0, bulk, tax: 0 };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const applied = code === undefined || code.trim() === "" ? null : applyCode(code, subtotal);
  const discount = applied?.discount ?? 0;
  const discounted = subtotal - discount;
  const shipping = discounted >= FREE_SHIPPING_MINIMUM ? 0 : SHIPPING;
  const bulk = lines.reduce((sum, l) => sum + l.bulk, 0);
  const tax = Math.round(((discounted - bulk) * TAX_PERCENT) / 100);

  const discounts = allocate(discount, lines.map((l) => l.subtotal));
  lines.forEach((l, i) => {
    l.discount = discounts[i];
  });
  const taxes = allocate(tax, lines.map((l) => l.subtotal - l.discount));
  lines.forEach((l, i) => {
    l.tax = taxes[i];
  });

  return { lines, code: applied?.code ?? null, subtotal, discount, shipping, tax, bulk, total: discounted - bulk + tax + shipping };
}
