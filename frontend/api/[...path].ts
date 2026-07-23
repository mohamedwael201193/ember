/**
 * Vercel serverless BFF — same routes as local `server/bff.ts`.
 * Secrets: set in Vercel Project Settings → Environment Variables.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { bootstrapEnv, handleApi } from "../server/bff-core";

bootstrapEnv();

function readBody(req: VercelRequest): string {
  if (req.body == null) return "";
  if (typeof req.body === "string") return req.body || "{}";
  return JSON.stringify(req.body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  const segments = req.query.path;
  const joined = Array.isArray(segments)
    ? segments.join("/")
    : typeof segments === "string"
      ? segments
      : "";
  const pathname = `/api/${joined}`.replace(/\/+$/, "") || "/api";

  try {
    const result = await handleApi({
      method: req.method || "GET",
      pathname,
      search: req.url?.includes("?") ? `?${req.url.split("?")[1]}` : "",
      body: readBody(req),
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(502).json({ error: "bff_upstream_failed", message });
  }
}
