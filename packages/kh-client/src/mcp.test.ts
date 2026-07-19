import { describe, expect, it } from "vitest";
import { parseMcpToolResult } from "./mcp.js";

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
