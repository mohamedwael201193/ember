import type { VercelRequest, VercelResponse } from "@vercel/node";

/** Minimal smoke endpoint — no local module imports. */
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({ ok: true, service: "ember-bff" });
}
