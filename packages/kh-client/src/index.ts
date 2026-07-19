export * from "./mcp.js";
export * from "./rest.js";
export * from "./types.js";
export * from "./workflows.js";

import { KeeperHubRestClient, type KeeperHubClientOptions } from "./rest.js";
import { WorkflowsClient } from "./workflows.js";

export function createKeeperHubClient(options: KeeperHubClientOptions) {
  const rest = new KeeperHubRestClient(options);
  return {
    rest,
    workflows: new WorkflowsClient(rest)
  };
}
