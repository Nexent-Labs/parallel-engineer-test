import { OrderError } from "../src/errors.ts";

/** For assert.throws: the error is an OrderError with this code. */
export const orderError = (code: string) => (err: unknown) => err instanceof OrderError && err.code === code;
