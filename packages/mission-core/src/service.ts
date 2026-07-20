import { timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export class RequestBodyTooLargeError extends Error {
  constructor(readonly limitBytes: number) {
    super(`request body exceeds ${limitBytes} bytes`);
    this.name = "RequestBodyTooLargeError";
  }
}

export async function readRequestBody(
  request: AsyncIterable<Uint8Array | string>,
  limitBytes = 65_536
): Promise<string> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > limitBytes) throw new RequestBodyTooLargeError(limitBytes);
    chunks.push(bytes);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export class FixedWindowRateLimiter {
  readonly #entries = new Map<string, { count: number; resetsAt: number }>();

  constructor(
    readonly limit: number,
    readonly windowMs: number
  ) {
    if (!Number.isSafeInteger(limit) || limit < 1)
      throw new RangeError("limit must be a positive integer");
    if (!Number.isSafeInteger(windowMs) || windowMs < 1) {
      throw new RangeError("windowMs must be a positive integer");
    }
  }

  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterSeconds: number } {
    const current = this.#entries.get(key);
    if (!current || current.resetsAt <= now) {
      this.#entries.set(key, { count: 1, resetsAt: now + this.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((current.resetsAt - now) / 1_000))
      };
    }
    current.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }
}

export function requestClientKey(request: Pick<IncomingMessage, "socket" | "headers">): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",", 1)[0]!.trim();
  return request.socket.remoteAddress ?? "unknown";
}

export function bearerTokenMatches(
  expected: string | undefined,
  authorization: string | undefined
): boolean {
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return (
    expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes)
  );
}
