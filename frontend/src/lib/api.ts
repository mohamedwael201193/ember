import type { DashboardSnapshot, MainnetEvidence, PublicConfig, RescueJournal } from "./types";

async function parse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

export const api = {
  config: () => fetch("/api/config").then((r) => parse<PublicConfig>(r)),
  snapshot: () => fetch("/api/snapshot").then((r) => parse<DashboardSnapshot>(r)),
  health: () => fetch("/api/health").then((r) => parse<unknown>(r)),
  ready: () => fetch("/api/ready").then((r) => parse<unknown>(r)),
  check: (body: Record<string, unknown> = {}) =>
    fetch("/api/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => parse<unknown>(r)),
  rescue: (body: Record<string, unknown> = {}) =>
    fetch("/api/rescue", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => parse<RescueJournal>(r)),
  executions: (qs = "") =>
    fetch(`/api/executions${qs}`).then((r) => parse<unknown>(r)),
  evidence: () =>
    fetch("/api/evidence/mainnet").then((r) => parse<MainnetEvidence>(r)),
};
