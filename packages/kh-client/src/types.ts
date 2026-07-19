export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
  enabled?: boolean;
}

export interface Execution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "success" | "error" | "cancelled" | string;
  startedAt?: string | null;
  completedAt?: string | null;
  transactionHashes?: Array<{ hash: string; nodeId?: string; nodeName?: string; chainId?: number }>;
  output?: unknown;
}

export class KeeperHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly requestId: string | undefined,
    readonly body: unknown
  ) {
    super(message);
    this.name = "KeeperHubError";
  }
}

export class KeeperHubTimeoutError extends Error {
  constructor(readonly requestId: string) {
    super(`KeeperHub request timed out: ${requestId}`);
    this.name = "KeeperHubTimeoutError";
  }
}
