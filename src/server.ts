import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { OrderError } from "./errors.ts";
import { quote, type OrderItem } from "./pricing.ts";
import { refund } from "./refunds.ts";

const MAX_BODY_BYTES = 64 * 1024;

/** A request we can't read: answered with 400. */
class BadRequest extends Error {}

export function createApp(): Server {
  return createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
      if (err instanceof BadRequest) return send(res, 400, { error: { code: "bad_request", message: err.message } });
      if (err instanceof OrderError) return send(res, 422, { error: { code: err.code, message: err.message } });
      console.error(err);
      send(res, 500, { error: { code: "internal", message: "Something went wrong on our side." } });
    });
  });
}

async function handle(req: IncomingMessage, res: ServerResponse) {
  const path = new URL(req.url ?? "/", "http://localhost").pathname;
  if (req.method === "GET" && path === "/health") return send(res, 200, { ok: true });
  if (req.method === "POST" && path === "/quote") {
    const body = await readJson(req);
    return send(res, 200, quote(items(body, "items"), code(body)));
  }
  if (req.method === "POST" && path === "/refund") {
    const body = await readJson(req);
    const paid = quote(items(body, "items"), code(body));
    return send(res, 200, refund(paid, items(body, "returned")));
  }
  send(res, 404, { error: { code: "not_found", message: `No route for ${req.method} ${path}.` } });
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer>) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new BadRequest("The request body is too large.");
    chunks.push(chunk);
  }
  let body: unknown;
  try {
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BadRequest("The request body must be JSON.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new BadRequest("The request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

function items(body: Record<string, unknown>, field: string): OrderItem[] {
  const list = body[field];
  if (!Array.isArray(list)) throw new BadRequest(`"${field}" must be a list of {"sku", "quantity"}.`);
  return list.map((entry: unknown) => {
    const item = entry as { sku?: unknown; quantity?: unknown } | null;
    if (typeof item?.sku !== "string" || typeof item.quantity !== "number") {
      throw new BadRequest(`Each entry in "${field}" needs a "sku" string and a "quantity" number.`);
    }
    return { sku: item.sku, quantity: item.quantity };
  });
}

function code(body: Record<string, unknown>): string | undefined {
  if (body.code === undefined || body.code === null) return undefined;
  if (typeof body.code !== "string") throw new BadRequest('"code" must be a string.');
  return body.code;
}

function send(res: ServerResponse, status: number, body: unknown) {
  const text = JSON.stringify(body);
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "content-length": Buffer.byteLength(text) });
  res.end(text);
}
