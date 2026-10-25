/** An order or refund that can't be priced as asked. The code is stable; the message is for people. */
export class OrderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
  }
}
