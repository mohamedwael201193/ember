/**
 * Local BFF HTTP server. Production on Vercel uses `api/[...path].ts`.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { bootstrapEnv, handleApi, runtimeUrl } from "./bff-core";

bootstrapEnv();

const PORT = Number(process.env.BFF_PORT || 8780);

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(res: ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(body);
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "content-type,authorization",
      "access-control-allow-methods": "GET,POST,OPTIONS",
    });
    res.end();
    return;
  }

  try {
    const body =
      req.method === "POST" || req.method === "PUT" || req.method === "PATCH"
        ? await readBody(req)
        : "";
    const result = await handleApi({
      method: req.method || "GET",
      pathname: url.pathname,
      search: url.search,
      body,
    });
    sendJson(res, result.status, result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    sendJson(res, 502, { error: "bff_upstream_failed", message });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[ember-bff] http://127.0.0.1:${PORT} → ${runtimeUrl()}`);
});
