# Wrenfield Orders

Prices orders and refunds for the Wrenfield online shop: the cart total, discount codes, shipping and tax, and what a customer gets back when they return something.

## Run it

Needs Node 24 (see `.node-version`).

```sh
npm ci
npm test            # unit and HTTP tests
npm run typecheck
npm start           # http://localhost:3000
```

## How pricing works

All money is whole cents.

1. **Subtotal:** each item's catalog price times its quantity. Prices come from the catalog (`src/catalog.ts`), never from the request.
2. **Discount codes,** one per order, in any letter case:
   - `WELCOME10`: 10% off the subtotal.
   - `SAVE5`: $5 off a subtotal of $25 or more.
3. **Shipping:** $4.99, and free when the subtotal after discounts is $50 or more.
4. **Tax:** 8% of the subtotal after discounts, rounded to the nearest cent. Shipping is not taxed.
5. **Total:** the subtotal after discounts, plus tax, plus shipping.

The discount and the tax are split across the order's lines in proportion to what each line costs, so every line knows what was actually paid for it.

## Refunds

A refund gives back what the customer paid for the returned items: each item's price after its share of the discount, plus its tax. Shipping is refunded only when everything in the order comes back. A refund never exceeds what the customer paid.

## API

- `GET /health`
- `POST /quote` with `{"items": [{"sku": "MUG-01", "quantity": 2}], "code": "WELCOME10"}`
- `POST /refund` with the order (`items`, and `code` if one was used) plus `"returned": [{"sku": "MUG-01", "quantity": 1}]`

Errors come back as `{"error": {"code": "...", "message": "..."}}`: 400 for a body that can't be read, 422 for an order that can't be priced.
