import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Dedicated health route (no catch-all) so SPA can verify BFF + runtime.
 */
export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  const runtime = (
    process.env.EMBER_RUNTIME_URL ||
    process.env.SENTINEL_PUBLIC_URL ||
    "https://ember-api-8qzg.onrender.com"
  ).replace(/\/$/, "");

  try {
    const upstream = await fetch(`${runtime}/healthz`);
    const text = await upstream.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    res.status(200).json({
      bff: "ok",
      runtime,
      upstreamStatus: upstream.status,
      upstream: json,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(200).json({ bff: "ok", runtime, upstreamStatus: 0, error: message });
  }
}
