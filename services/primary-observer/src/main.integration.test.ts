import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import {
  HMAC_BODY_SHA256_HEADER,
  HMAC_NONCE_HEADER,
  HMAC_SIGNATURE_HEADER,
  HMAC_TIMESTAMP_HEADER,
  InMemoryNonceStore,
  bodySha256Hex,
  signHmac,
  verifyHmac
} from "@ember/mission-core";
import { afterEach, describe, expect, it } from "vitest";

const secret = "o".repeat(64);
const children: ChildProcess[] = [];
const servers: Server[] = [];

async function listen(server: Server): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("server did not bind");
  servers.push(server);
  return address.port;
}

async function freePort(): Promise<number> {
  const server = createServer();
  const port = await listen(server);
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve()))
  );
  servers.splice(servers.indexOf(server), 1);
  return port;
}

async function waitForHealth(url: string, child: ChildProcess): Promise<void> {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`observer exited with ${child.exitCode}`);
    try {
      if ((await fetch(url)).ok) return;
    } catch {
      // Process has not bound the port yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("observer health timeout");
}

afterEach(async () => {
  for (const child of children.splice(0)) child.kill();
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve) => {
          server.close(() => resolve());
        })
    )
  );
});

describe("primary-observer HTTP boundary", () => {
  it("rejects unsigned requests and signs authenticated execution responses", async () => {
    const keeperHub = createServer((request, response) => {
      expect(request.headers.authorization).toBe("Bearer kh_observer_test");
      expect(request.url).toBe("/api/workflows/wf-test/executions");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify([
          {
            id: "execution-1",
            workflowId: "wf-test",
            status: "success",
            transactionHashes: [{ hash: `0x${"1".repeat(64)}` }]
          }
        ])
      );
    });
    const keeperHubPort = await listen(keeperHub);
    const observerPort = await freePort();
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "services/primary-observer/src/main.ts"],
      {
        cwd: process.cwd(),
        env: {
          ...process.env,
          KH_API_BASE: `http://127.0.0.1:${keeperHubPort}`,
          KH_API_KEY_PRIMARY_OBSERVER: "kh_observer_test",
          KH_ORG_A_W1_WORKFLOW_ID: "wf-test",
          PRIMARY_OBSERVER_SHARED_SECRET: secret,
          PRIMARY_OBSERVER_PORT: String(observerPort),
          PORT: String(observerPort)
        },
        stdio: "pipe"
      }
    );
    children.push(child);
    const baseUrl = `http://127.0.0.1:${observerPort}`;
    await waitForHealth(`${baseUrl}/healthz`, child);

    expect((await fetch(`${baseUrl}/v1/executions`)).status).toBe(401);

    const timestamp = Date.now();
    const nonce = "integration-request";
    const response = await fetch(`${baseUrl}/v1/executions`, {
      headers: {
        [HMAC_TIMESTAMP_HEADER]: String(timestamp),
        [HMAC_NONCE_HEADER]: nonce,
        [HMAC_BODY_SHA256_HEADER]: bodySha256Hex(""),
        [HMAC_SIGNATURE_HEADER]: signHmac(secret, timestamp, nonce, "")
      }
    });
    expect(response.status).toBe(200);
    const body = await response.text();
    expect(JSON.parse(body)).toMatchObject({
      workflowId: "wf-test",
      executions: [{ id: "execution-1", status: "success" }]
    });
    expect(
      verifyHmac(
        secret,
        {
          timestamp: Number(response.headers.get(HMAC_TIMESTAMP_HEADER)),
          nonce: response.headers.get(HMAC_NONCE_HEADER) ?? "",
          bodyHash: response.headers.get(HMAC_BODY_SHA256_HEADER) ?? "",
          signature: response.headers.get(HMAC_SIGNATURE_HEADER) ?? ""
        },
        body,
        new InMemoryNonceStore()
      )
    ).toBe(true);
  }, 15_000);
});
