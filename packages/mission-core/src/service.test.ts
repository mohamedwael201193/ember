import { describe, expect, it } from "vitest";
import {
  FixedWindowRateLimiter,
  RequestBodyTooLargeError,
  bearerTokenMatches,
  readRequestBody
} from "./service.js";

async function* chunks(...values: string[]): AsyncGenerator<string> {
  for (const value of values) yield value;
}

describe("service security primitives", () => {
  it("enforces request body size across chunks", async () => {
    await expect(readRequestBody(chunks("123", "456"), 5)).rejects.toBeInstanceOf(
      RequestBodyTooLargeError
    );
    await expect(readRequestBody(chunks("123", "45"), 5)).resolves.toBe("12345");
  });

  it("rate limits within a fixed window and recovers after reset", () => {
    const limiter = new FixedWindowRateLimiter(2, 1_000);
    expect(limiter.consume("client", 1_000).allowed).toBe(true);
    expect(limiter.consume("client", 1_001).allowed).toBe(true);
    expect(limiter.consume("client", 1_002)).toEqual({
      allowed: false,
      retryAfterSeconds: 1
    });
    expect(limiter.consume("client", 2_000).allowed).toBe(true);
  });

  it("accepts only an exact bearer control token", () => {
    expect(bearerTokenMatches("secret", "Bearer secret")).toBe(true);
    expect(bearerTokenMatches("secret", "Bearer secrets")).toBe(false);
    expect(bearerTokenMatches("secret", "Basic secret")).toBe(false);
    expect(bearerTokenMatches(undefined, "Bearer secret")).toBe(false);
  });
});
