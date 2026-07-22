import { describe, expect, it } from "vitest";
import { McpHttpClient, parseMcpToolResult } from "./mcp.js";

describe("parseMcpToolResult", () => {
  it("reads standard text tool output", () => {
    expect(
      parseMcpToolResult<{ executionId: string }>({
        content: [{ type: "text", text: '{"executionId":"exec-1"}' }]
      })
    ).toEqual({ executionId: "exec-1" });
  });

  it("reads structured tool output", () => {
    expect(parseMcpToolResult({ structuredContent: { status: "completed" } })).toEqual({
      status: "completed"
    });
  });

  it("rejects tool errors", () => {
    expect(() =>
      parseMcpToolResult({ isError: true, content: [{ type: "text", text: "denied" }] })
    ).toThrow("MCP tool failed");
  });
});

describe("MCP retry policy", () => {
  it("retries the read-only tools/list request after rate limiting", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async (_input, init) => {
      calls += 1;
      if (calls === 1) {
        return new Response("", { status: 429, headers: { "retry-after": "0" } });
      }
      const id = JSON.parse(String(init?.body)).id as string;
      return new Response(JSON.stringify({ jsonrpc: "2.0", id, result: { tools: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    };

    await expect(
      new McpHttpClient("https://mcp.example", "test", fetcher).listTools()
    ).resolves.toEqual([]);
    expect(calls).toBe(2);
  });

  it("does not retry tools/call because tools may mutate state", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async () => {
      calls += 1;
      return new Response("", { status: 503 });
    };

    await expect(
      new McpHttpClient("https://mcp.example", "test", fetcher).callTool("execute_workflow", {})
    ).rejects.toThrow("HTTP 503");
    expect(calls).toBe(1);
  });
});
