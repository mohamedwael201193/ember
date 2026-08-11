const KH_APP = "https://app.keeperhub.com";

/** KeeperHub workflow canvas deep link. */
export function keeperHubWorkflowUrl(workflowId?: string | null): string | null {
  if (!workflowId) return null;
  return `${KH_APP}/workflows/${encodeURIComponent(workflowId)}`;
}

/**
 * KeeperHub execution/run deep link.
 * Current app routes executions under the parent workflow when known.
 */
export function keeperHubExecutionUrl(
  workflowId?: string | null,
  executionId?: string | null
): string | null {
  if (!executionId) return null;
  if (workflowId) {
    return `${KH_APP}/workflows/${encodeURIComponent(workflowId)}/executions/${encodeURIComponent(executionId)}`;
  }
  return `${KH_APP}/executions/${encodeURIComponent(executionId)}`;
}

export function basescanTxUrl(explorerBase: string, txHash?: string | null): string | null {
  if (!txHash) return null;
  return `${explorerBase.replace(/\/$/, "")}/tx/${txHash}`;
}

export function ipfsGatewayUrl(gateway: string, cid?: string | null): string | null {
  if (!cid) return null;
  const base = gateway.replace(/\/$/, "");
  // Require a path segment `/ipfs` (not the hostname `ipfs.io`).
  if (/\/ipfs(\/|$)/.test(base)) return `${base}/${cid}`;
  return `${base}/ipfs/${cid}`;
}
