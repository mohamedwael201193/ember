/**
 * Capture redacted MCP → KeeperHub → Base continuity evidence.
 *
 * Default mode is READ-ONLY: get_workflow + get_execution against certified IDs.
 * Set EMBER_MCP_EXECUTE=1 only after explicit spend approval (creates a new run).
 *
 * Usage:
 *   node --env-file=.env --import tsx scripts/capture-mcp-continuity-evidence.ts
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { McpHttpClient, parseMcpToolResult } from "@ember/kh-client";

const workflowId =
  process.env.KH_ORG_A_W1_MAINNET_WORKFLOW_ID ||
  process.env.KH_ORG_A_W1_WORKFLOW_ID ||
  "5goaid2zjgzyb32661se3";
const executionId = process.env.EMBER_MCP_EVIDENCE_EXECUTION_ID || "667ekg3qk5f45127eqjyy";
const expectedTx =
  process.env.EMBER_MCP_EVIDENCE_TX ||
  "0xd26e61743539711fe103fc2b63ccb814725cf99c24fa417c966505a338341ea2";
const mcpUrl = process.env.KH_MCP_URL || "https://app.keeperhub.com/mcp";
const apiKey = process.env.KH_API_KEY_PRIMARY_OBSERVER || process.env.KH_API_KEY_STANDBY || "";
const allowExecute = process.env.EMBER_MCP_EXECUTE === "1";

type ExecutionPayload = {
  status?: { status?: string; transactionHashes?: Array<{ hash?: string }> };
  logs?: {
    execution?: {
      id?: string;
      workflowId?: string;
      status?: string;
      startedAt?: string;
      completedAt?: string;
      duration?: string;
      input?: unknown;
      output?: { transactionHash?: string; transactionLink?: string };
      transactionHashes?: Array<{ hash?: string; nodeId?: string; nodeName?: string }>;
    };
    logs?: Array<{
      nodeId?: string;
      nodeName?: string;
      status?: string;
      output?: { amount?: string; symbol?: string; recipient?: string };
    }>;
  };
};

async function main() {
  if (!apiKey || apiKey.startsWith("kh_xxx")) {
    throw new Error(
      "Set a real KH_API_KEY_PRIMARY_OBSERVER (or STANDBY) in .env — never commit it."
    );
  }
  if (allowExecute) {
    throw new Error(
      "EMBER_MCP_EXECUTE=1 refused by default safety gate. Re-run without it unless spend is explicitly approved."
    );
  }

  const mcp = new McpHttpClient(mcpUrl, apiKey);
  await mcp.initialize();

  const workflowRaw = await mcp.callTool("get_workflow", { workflowId });
  const workflow = parseMcpToolResult<Record<string, unknown>>(workflowRaw);

  const execRaw = await mcp.callTool("get_execution", { execution_id: executionId });
  // Some MCP servers use executionId; try both shapes if needed
  let exec: ExecutionPayload;
  try {
    exec = parseMcpToolResult<ExecutionPayload>(execRaw);
  } catch {
    const retry = await mcp.callTool("get_execution", { executionId });
    exec = parseMcpToolResult<ExecutionPayload>(retry);
  }

  const txHash =
    exec.logs?.execution?.output?.transactionHash ||
    exec.logs?.execution?.transactionHashes?.[0]?.hash ||
    exec.status?.transactionHashes?.[0]?.hash ||
    "";

  const artifact = {
    title: "MCP continuity evidence — capture script",
    capturedAt: new Date().toISOString(),
    provenance: {
      source: "certified_mainnet_snapshot",
      label: "CERTIFIED MAINNET SNAPSHOT",
      note: "Read-only get_workflow + get_execution. No new spend."
    },
    tools: [
      { name: "get_workflow", args: { workflowId } },
      { name: "get_execution", args: { executionId } }
    ],
    workflow: {
      id: String(workflow.id ?? workflowId),
      name: String(workflow.name ?? ""),
      enabled: workflow.enabled,
      chainId: 8453
    },
    execution: {
      id: exec.logs?.execution?.id ?? executionId,
      status: exec.logs?.execution?.status ?? exec.status?.status,
      startedAt: exec.logs?.execution?.startedAt,
      completedAt: exec.logs?.execution?.completedAt,
      durationMs: exec.logs?.execution?.duration ? Number(exec.logs.execution.duration) : undefined,
      input: exec.logs?.execution?.input,
      steps: (exec.logs?.logs ?? []).map((l) => ({
        nodeId: l.nodeId,
        nodeName: l.nodeName,
        status: l.status,
        amount: l.output?.amount,
        symbol: l.output?.symbol,
        recipient: l.output?.recipient
      }))
    },
    transaction: {
      hash: txHash,
      explorer: txHash ? `https://basescan.org/tx/${txHash}` : null,
      chainId: 8453
    },
    verification: {
      mcpStatusOk: (exec.logs?.execution?.status ?? exec.status?.status) === "success",
      txHashMatchesExpected: txHash.toLowerCase() === expectedTx.toLowerCase(),
      workflowIdMatches: String(exec.logs?.execution?.workflowId ?? workflowId) === workflowId,
      executionIdMatches: String(exec.logs?.execution?.id ?? executionId) === executionId
    },
    keeperHubDeepLinks: {
      workflow: `https://app.keeperhub.com/workflows/${workflowId}`,
      execution: `https://app.keeperhub.com/workflows/${workflowId}/executions/${executionId}`
    },
    redactions: ["No API keys", "No Authorization headers", "No private keys"]
  };

  const outDir = resolve("docs/evidence");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const outPath = resolve(outDir, `mcp-continuity-demo-${stamp}.json`);
  writeFileSync(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ wrote: outPath, verification: artifact.verification }, null, 2));
  if (!artifact.verification.mcpStatusOk || !artifact.verification.txHashMatchesExpected) {
    process.exitCode = 2;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
