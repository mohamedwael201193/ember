import type { Execution, Workflow } from "./types.js";
import type { KeeperHubRestClient } from "./rest.js";

export interface ExecutionWaitResult {
  executionId: string;
  status: string;
  completed: boolean;
  transactionHashes?: Array<{ hash: string; nodeId?: string; nodeName?: string }>;
  output?: unknown;
  error?: string | null;
}

export class WorkflowsClient {
  constructor(private readonly client: KeeperHubRestClient) {}

  list(): Promise<Workflow[]> {
    return this.client.request<Workflow[]>("/api/workflows");
  }

  get(workflowId: string): Promise<Workflow> {
    return this.client.request<Workflow>(`/api/workflows/${encodeURIComponent(workflowId)}`);
  }

  create(definition: Omit<Workflow, "id">): Promise<Workflow> {
    return this.client.request<Workflow>("/api/workflows/create", {
      method: "POST",
      body: JSON.stringify(definition)
    });
  }

  execute(
    workflowId: string,
    input: Record<string, unknown> = {},
    options: { idempotencyKey?: string } = {}
  ): Promise<{ executionId: string; status: string }> {
    return this.client.request(`/api/workflows/${encodeURIComponent(workflowId)}/execute`, {
      method: "POST",
      ...(options.idempotencyKey ? { headers: { "idempotency-key": options.idempotencyKey } } : {}),
      body: JSON.stringify({ input })
    });
  }

  listExecutions(workflowId: string): Promise<Execution[]> {
    return this.client.request<Execution[]>(
      `/api/workflows/${encodeURIComponent(workflowId)}/executions`
    );
  }

  getExecutionStatus(
    executionId: string
  ): Promise<{ status: string; transactionHashes?: Execution["transactionHashes"] }> {
    return this.client.request(
      `/api/workflows/executions/${encodeURIComponent(executionId)}/status`
    );
  }

  waitForExecution(executionId: string, timeoutMs = 30_000): Promise<ExecutionWaitResult> {
    const bounded = Math.min(Math.max(timeoutMs, 1_000), 60_000);
    return this.client.request(
      `/api/workflows/executions/${encodeURIComponent(executionId)}/wait?timeoutMs=${bounded}`
    );
  }

  /**
   * Live REST (2026-07-22): there is no working `GET /api/executions/{id}`.
   * Use status/wait endpoints, or list by workflow and filter.
   */
  async getExecution(executionId: string, workflowId?: string): Promise<Execution> {
    if (workflowId) {
      const listed = await this.listExecutions(workflowId);
      const match = listed.find((item) => item.id === executionId);
      if (match) return match;
      throw new Error(`Execution ${executionId} not found in workflow ${workflowId} list`);
    }
    const status = await this.getExecutionStatus(executionId);
    const execution: Execution = {
      id: executionId,
      workflowId: "",
      status: status.status as Execution["status"]
    };
    if (status.transactionHashes) execution.transactionHashes = status.transactionHashes;
    return execution;
  }
}
