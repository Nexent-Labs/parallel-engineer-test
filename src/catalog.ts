import type { Cents } from "./money.ts";

export interface Product {
  sku: string;
  name: string;
  price: Cents;
}

const PRODUCTS: readonly Product[] = [
  { sku: "MUG-01", name: "Stoneware mug", price: 1800 },
  { sku: "TEA-02", name: "Loose-leaf tea, 100 g", price: 1250 },
  { sku: "KET-03", name: "Pour-over kettle", price: 3200 },
  { sku: "CUP-04", name: "Tasting cups, set of 4", price: 1799 },
];

export function product(sku: string): Product | undefined {
  return PRODUCTS.find((p) => p.sku === sku);
}
