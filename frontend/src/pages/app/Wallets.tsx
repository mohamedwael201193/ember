import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

const ROLES = [
  {
    name: "Org A",
    role: "Primary PAYDAY stream",
    detail: "Funds employee slots on schedule via KeeperHub W1.",
  },
  {
    name: "Org B",
    role: "Rescue / replay",
    detail: "Replays missed slots when Sentinel declares MISSION_DOWN.",
  },
  {
    name: "Employee",
    role: "Recipient",
    detail: "Receives USDC from either primary or rescue path.",
  },
  {
    name: "Continuity escrow",
    role: "Mission vault",
    detail: "Holds mission escrow and records anchored proofs.",
  },
];

export function WalletsPage() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const balances = evidence.data?.balances as
    | Record<string, string>
    | undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Wallets</h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Agentic roles in the continuity loop. Balances from certified mainnet evidence when present.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((w) => (
          <article
            key={w.name}
            className="rounded-[4px] border border-[var(--border)] p-6"
          >
            <h2 className="font-display text-xl font-bold">{w.name}</h2>
            <p className="mt-1 text-sm text-[var(--accent)]">{w.role}</p>
            <p className="mt-3 text-sm text-[var(--fg-muted)]">{w.detail}</p>
            {balances && (
              <p className="mt-4 font-mono text-sm">
                {w.name === "Org A" && `USDC ${balances.orgA ?? "-"}`}
                {w.name === "Org B" && `USDC ${balances.orgB ?? "-"}`}
                {w.name === "Employee" && `USDC ${balances.employee ?? "-"}`}
                {w.name === "Continuity escrow" &&
                  `USDC ${balances.continuity ?? "-"}`}
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
