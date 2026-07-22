import { randomUUID } from "node:crypto";
import { KeeperHubError, KeeperHubTimeoutError } from "./types.js";

export interface KeeperHubClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
  maxReadRetries?: number;
  retryBaseMs?: number;
}

const RETRYABLE_READ_STATUSES = new Set([429, 502, 503, 504]);

function retryDelayMs(response: Response, attempt: number, baseMs: number): number {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return Math.min(seconds * 1_000, 30_000);
    const dateMs = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateMs) && dateMs > 0) return Math.min(dateMs, 30_000);
  }
  return Math.min(baseMs * 2 ** attempt, 5_000);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class KeeperHubRestClient {
  readonly #baseUrl: string;
  readonly #apiKey: string;
  readonly #timeoutMs: number;
  readonly #fetcher: typeof fetch;
  readonly #maxReadRetries: number;
  readonly #retryBaseMs: number;

  constructor(options: KeeperHubClientOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/$/, "");
    this.#apiKey = options.apiKey;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
    this.#fetcher = options.fetcher ?? fetch;
    this.#maxReadRetries = options.maxReadRetries ?? 2;
    this.#retryBaseMs = options.retryBaseMs ?? 250;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const requestId = randomUUID();
    const method = (init.method ?? "GET").toUpperCase();
    const safeRead = method === "GET" || method === "HEAD";
    const maxAttempts = safeRead ? this.#maxReadRetries + 1 : 1;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.#timeoutMs);
      try {
        const response = await this.#fetcher(`${this.#baseUrl}${path}`, {
          ...init,
          signal: controller.signal,
          headers: {
            accept: "application/json",
            authorization: `Bearer ${this.#apiKey}`,
            "content-type": "application/json",
            "x-request-id": requestId,
            ...init.headers
          }
        });
        const body: unknown = await response.json().catch(() => undefined);
        if (response.ok) return body as T;
        if (safeRead && attempt + 1 < maxAttempts && RETRYABLE_READ_STATUSES.has(response.status)) {
          await sleep(retryDelayMs(response, attempt, this.#retryBaseMs));
          continue;
        }
        throw new KeeperHubError(
          `KeeperHub returned HTTP ${response.status}`,
          response.status,
          response.headers.get("x-request-id") ?? requestId,
          body
        );
      } catch (error) {
        if (error instanceof KeeperHubError) throw error;
        if (!safeRead || attempt + 1 >= maxAttempts) {
          if (controller.signal.aborted) throw new KeeperHubTimeoutError(requestId);
          throw error;
        }
        await sleep(Math.min(this.#retryBaseMs * 2 ** attempt, 5_000));
      } finally {
        clearTimeout(timeout);
      }
    }
    throw new KeeperHubTimeoutError(requestId);
  }
}
