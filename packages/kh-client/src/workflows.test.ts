import { describe, expect, it } from "vitest";
import { KeeperHubRestClient } from "./rest.js";
import { WorkflowsClient } from "./workflows.js";

describe("KeeperHub workflow REST paths", () => {
  it("uses the documented workflow and execution paths", async () => {
    const requests: Array<{ url: string; method: string; idempotencyKey?: string }> = [];
    const fetcher: typeof fetch = async (input, init) => {
      const headers = new Headers(init?.headers);
      requests.push({
        url: String(input),
        method: init?.method ?? "GET",
        ...(headers.get("idempotency-key")
          ? { idempotencyKey: headers.get("idempotency-key")! }
          : {})
      });
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    };
    const client = new WorkflowsClient(
      new KeeperHubRestClient({ baseUrl: "https://keeperhub.example/", apiKey: "test", fetcher })
    );

    await client.list();
    await client.get("workflow/one");
    await client.execute("workflow/one", {}, { idempotencyKey: "slot-1" });
    await client.getExecution("execution/one");

    expect(requests).toEqual([
      { url: "https://keeperhub.example/api/workflows", method: "GET" },
      { url: "https://keeperhub.example/api/workflows/workflow%2Fone", method: "GET" },
      {
        url: "https://keeperhub.example/api/workflows/workflow%2Fone/execute",
        method: "POST",
        idempotencyKey: "slot-1"
      },
      {
        url: "https://keeperhub.example/api/workflows/executions/execution%2Fone/status",
        method: "GET"
      }
    ]);
  });
});
