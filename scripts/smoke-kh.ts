import { KeeperHubRestClient } from "../packages/kh-client/src/rest.js";
import { WorkflowsClient } from "../packages/kh-client/src/workflows.js";

process.loadEnvFile(".env");

const baseUrl = process.env.KH_API_BASE;
const primaryKey = process.env.KH_API_KEY_PRIMARY_EXECUTOR;
const standbyKey = process.env.KH_API_KEY_STANDBY;
if (!baseUrl || !primaryKey || !standbyKey) {
  throw new Error("KH_API_BASE, KH_API_KEY_PRIMARY_EXECUTOR, and KH_API_KEY_STANDBY are required");
}

async function list(org: string, apiKey: string): Promise<void> {
  const client = new WorkflowsClient(new KeeperHubRestClient({ baseUrl, apiKey }));
  const workflows = await client.list();
  console.log(`${org}: ${workflows.length} workflows`);
}

await Promise.all([list("org-a", primaryKey), list("org-b", standbyKey)]);
