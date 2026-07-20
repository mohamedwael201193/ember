import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const HMAC_TIMESTAMP_HEADER = "x-ember-timestamp";
export const HMAC_NONCE_HEADER = "x-ember-nonce";
export const HMAC_BODY_SHA256_HEADER = "x-ember-body-sha256";
export const HMAC_SIGNATURE_HEADER = "x-ember-signature";

export interface SignedRequest {
  timestamp: number;
  nonce: string;
  bodyHash?: string;
  signature: string;
}

export interface NonceStore {
  consume(nonce: string, expiresAt: number): boolean;
}

export class InMemoryNonceStore implements NonceStore {
  readonly #entries = new Map<string, number>();

  consume(nonce: string, expiresAt: number): boolean {
    const now = Date.now();
    for (const [candidate, expiry] of this.#entries) {
      if (expiry <= now) this.#entries.delete(candidate);
    }
    if (this.#entries.has(nonce)) return false;
    this.#entries.set(nonce, expiresAt);
    return true;
  }
}

export function bodySha256Hex(body: string): string {
  return createHash("sha256").update(body).digest("hex");
}

function signedPayload(timestamp: number, nonce: string, bodyHash: string): string {
  return `${timestamp}.${nonce}.${bodyHash}`;
}

export function signHmac(secret: string, timestamp: number, nonce: string, body: string): string {
  return createHmac("sha256", secret)
    .update(signedPayload(timestamp, nonce, bodySha256Hex(body)))
    .digest("hex");
}

export function verifyHmac(
  secret: string,
  request: SignedRequest,
  body: string,
  nonceStore: NonceStore,
  now = Date.now(),
  maxAgeMs = 60_000
): boolean {
  if (!Number.isSafeInteger(request.timestamp) || !request.nonce || maxAgeMs < 0) return false;
  if (Math.abs(now - request.timestamp) > maxAgeMs) return false;
  const bodyHash = bodySha256Hex(body);
  if (request.bodyHash !== undefined && request.bodyHash !== bodyHash) return false;

  const expected = Buffer.from(signHmac(secret, request.timestamp, request.nonce, body), "hex");
  const provided = Buffer.from(request.signature, "hex");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;

  return nonceStore.consume(request.nonce, request.timestamp + maxAgeMs);
}
