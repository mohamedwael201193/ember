import { describe, expect, it } from "vitest";
import { bodySha256Hex, InMemoryNonceStore, signHmac, verifyHmac } from "./hmac.js";

describe("HMAC request authentication", () => {
  it("accepts one current, correctly signed request", () => {
    const now = 1_700_000_000_000;
    const request = {
      timestamp: now,
      nonce: "unique",
      signature: signHmac("secret", now, "unique", "{}")
    };
    expect(verifyHmac("secret", request, "{}", new InMemoryNonceStore(), now)).toBe(true);
  });

  it("rejects stale timestamps", () => {
    const now = 1_700_000_000_000;
    const request = {
      timestamp: now - 60_001,
      nonce: "stale",
      signature: signHmac("secret", now - 60_001, "stale", "{}")
    };
    expect(verifyHmac("secret", request, "{}", new InMemoryNonceStore(), now)).toBe(false);
  });

  it("rejects replayed nonces", () => {
    const now = Date.now();
    const store = new InMemoryNonceStore();
    const request = {
      timestamp: now,
      nonce: "unique",
      signature: signHmac("secret", now, "unique", "{}")
    };
    expect(verifyHmac("secret", request, "{}", store, now)).toBe(true);
    expect(verifyHmac("secret", request, "{}", store, now)).toBe(false);
  });

  it("rejects a tampered body or declared body hash", () => {
    const now = 1_700_000_000_000;
    const request = {
      timestamp: now,
      nonce: "tampered",
      bodyHash: bodySha256Hex("{}"),
      signature: signHmac("secret", now, "tampered", "{}")
    };
    expect(verifyHmac("secret", request, '{"changed":true}', new InMemoryNonceStore(), now)).toBe(
      false
    );
    expect(
      verifyHmac("secret", { ...request, bodyHash: "00" }, "{}", new InMemoryNonceStore(), now)
    ).toBe(false);
  });
});
