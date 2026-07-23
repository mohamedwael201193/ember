/**
 * Vercel serverless BFF — same routes as local `server/bff.ts`.
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  try {
    // Dynamic import so cold-start failures surface as JSON, not opaque 500s.
    const { bootstrapEnv, handleApi } = await import("../server/bff-core");
    bootstrapEnv();

    const segments = req.query.path;
    const joined = Array.isArray(segments)
      ? segments.join("/")
      : typeof segments === "string"
        ? segments
        : "";
    const pathname = (`/api/${joined}`).replace(/\/+$/, "") || "/api";

    let body = "";
    if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
      if (typeof req.body === "string") body = req.body || "{}";
      else if (req.body != null) body = JSON.stringify(req.body);
      else body = "{}";
    }

    const search = typeof req.url === "string" && req.url.includes("?")
      ? `?${req.url.split("?")[1]}`
      : "";

    const result = await handleApi({
      method: req.method || "GET",
      pathname,
      search,
      body,
    });
    res.status(result.status).json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("[ember-bff]", message, stack);
    res.status(500).json({ error: "bff_function_failed", message });
  }
}
