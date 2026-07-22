import { randomUUID } from "node:crypto";

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id: string;
  result?: T;
  error?: { code: number; message: string; data?: unknown };
}

interface McpToolResult {
  content?: Array<{ type?: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
}

const RETRYABLE_MCP_READ_STATUSES = new Set([429, 502, 503, 504]);

async function waitForRetry(response: Response, attempt: number): Promise<void> {
  const retryAfter = response.headers.get("retry-after");
  const seconds = retryAfter === null ? Number.NaN : Number(retryAfter);
  const milliseconds =
    Number.isFinite(seconds) && seconds >= 0
      ? Math.min(seconds * 1_000, 30_000)
      : Math.min(250 * 2 ** attempt, 5_000);
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export function parseMcpToolResult<T>(value: unknown): T {
  if (!value || typeof value !== "object") throw new Error("MCP tool result is invalid");
  const result = value as McpToolResult;
  if (result.structuredContent !== undefined) {
    if (result.isError)
      throw new Error(`MCP tool failed: ${JSON.stringify(result.structuredContent)}`);
    return result.structuredContent as T;
  }
  const text = result.content?.find((entry) => entry.type === "text" && entry.text)?.text;
  if (!text) throw new Error("MCP tool result does not contain JSON content");
  if (result.isError) throw new Error(`MCP tool failed: ${text}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("MCP tool text is not valid JSON");
  }
}

export class McpHttpClient {
  #sessionId: string | undefined;

  constructor(
    readonly endpoint: string,
    readonly apiKey: string,
    readonly fetcher: typeof fetch = fetch,
    readonly timeoutMs = 120_000
  ) {}

  async initialize(): Promise<void> {
    await this.call("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "ember-kh-client", version: "0.1.0" }
    });
    await this.notify("notifications/initialized", {});
  }

  async listTools(): Promise<unknown[]> {
    const result = await this.call<{ tools: unknown[] }>("tools/list", {}, true);
    return result.tools;
  }

  async callTool(name: string, arguments_: Record<string, unknown>): Promise<unknown> {
    return this.call("tools/call", { name, arguments: arguments_ });
  }

  async call<T>(
    method: string,
    params: Record<string, unknown>,
    retryableRead = false
  ): Promise<T> {
    const id = randomUUID();
    const maxAttempts = retryableRead ? 3 : 1;
    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const response = await this.fetcher(this.endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(this.timeoutMs),
        headers: {
          accept: "application/json, text/event-stream",
          authorization: `Bearer ${this.apiKey}`,
          "content-type": "application/json",
          ...(this.#sessionId ? { "mcp-session-id": this.#sessionId } : {})
        },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params })
      });
      if (!response.ok) {
        if (attempt + 1 < maxAttempts && RETRYABLE_MCP_READ_STATUSES.has(response.status)) {
          await waitForRetry(response, attempt);
          continue;
        }
        throw new Error(`MCP request failed with HTTP ${response.status}`);
      }
      this.#sessionId = response.headers.get("mcp-session-id") ?? this.#sessionId;
      const payload = await this.readResponse<T>(response);
      if (payload.error)
        throw new Error(`MCP error ${payload.error.code}: ${payload.error.message}`);
      if (payload.id !== id || payload.result === undefined)
        throw new Error("MCP response is invalid");
      return payload.result;
    }
    throw new Error("MCP read retries exhausted");
  }

  async notify(method: string, params: Record<string, unknown>): Promise<void> {
    const response = await this.fetcher(this.endpoint, {
      method: "POST",
      signal: AbortSignal.timeout(this.timeoutMs),
      headers: {
        accept: "application/json, text/event-stream",
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        ...(this.#sessionId ? { "mcp-session-id": this.#sessionId } : {})
      },
      body: JSON.stringify({ jsonrpc: "2.0", method, params })
    });
    if (!response.ok) throw new Error(`MCP notification failed with HTTP ${response.status}`);
    this.#sessionId = response.headers.get("mcp-session-id") ?? this.#sessionId;
  }

  private async readResponse<T>(response: Response): Promise<JsonRpcResponse<T>> {
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      return (await response.json()) as JsonRpcResponse<T>;
    }
    const event = (await response.text()).split(/\r?\n/).find((line) => line.startsWith("data:"));
    if (!event) throw new Error("MCP stream did not contain a response event");
    return JSON.parse(event.slice("data:".length).trim()) as JsonRpcResponse<T>;
  }
}
