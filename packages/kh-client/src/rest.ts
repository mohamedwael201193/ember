import { randomUUID } from "node:crypto";
import { KeeperHubError, KeeperHubTimeoutError } from "./types.js";

export interface KeeperHubClientOptions {
  baseUrl: string;
  apiKey: string;
  timeoutMs?: number;
  fetcher?: typeof fetch;
}

export class KeeperHubRestClient {
  readonly #baseUrl: string;
  readonly #apiKey: string;
  readonly #timeoutMs: number;
  readonly #fetcher: typeof fetch;

  constructor(options: KeeperHubClientOptions) {
    this.#baseUrl = options.baseUrl.replace(/\/$/, "");
    this.#apiKey = options.apiKey;
    this.#timeoutMs = options.timeoutMs ?? 15_000;
    this.#fetcher = options.fetcher ?? fetch;
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const requestId = randomUUID();
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
      if (!response.ok)
        throw new KeeperHubError(
          `KeeperHub returned HTTP ${response.status}`,
          response.status,
          response.headers.get("x-request-id") ?? requestId,
          body
        );
      return body as T;
    } catch (error) {
      if (controller.signal.aborted) throw new KeeperHubTimeoutError(requestId);
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
