import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SvgWalletNet } from "@/components/svg/SvgScene";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

const ROLES = [
  {
    name: "Payer",
    role: "Pays",
    detail:
      "The primary organization wallet. While healthy, it funds every scheduled payment.",
    bal: "orgA",
  },
  {
    name: "Backup",
    role: "Rescues",
    detail:
      "The standby organization. When the primary agent dies, it pays only what was missed.",
    bal: "orgB",
  },
  {
    name: "Employee",
    role: "Receives",
    detail:
      "The person who must keep getting paid — from the primary path or the rescue path.",
    bal: "employee",
  },
  {
    name: "Escrow",
    role: "Protects",
    detail:
      "Holds mission funds and records the final rescue seal. No blockchain jargon required.",
    bal: "continuity",
  },
];

export function WalletsPage() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const balances = evidence.data?.balances as Record<string, string> | undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Wallets</h1>
          <p className="mt-2 text-[var(--fg-muted)]">
            Four roles. One mission. Who pays, who rescues, who receives, what protects.
            Balances shown here come from certified evidence — not a live wallet connect.
          </p>
        </div>
        <ProvenanceBadge provenance={evidence.data?.provenance} />
      </div>

      <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
        <SvgWalletNet />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ROLES.map((w) => (
          <article
            key={w.name}
            className="rounded-[4px] border border-[var(--border)] p-6"
          >
            <h2 className="font-display text-xl font-bold">{w.name}</h2>
            <p className="mt-1 text-sm font-medium text-[var(--accent)]">{w.role}</p>
            <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
              {w.detail}
            </p>
            {balances && (
              <p className="mt-4 text-sm">
                Balance{" "}
                <span className="font-medium text-[var(--fg)]">
                  {balances[w.bal] ?? "—"} USDC
                </span>
              </p>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
