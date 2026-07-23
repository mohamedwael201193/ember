import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { SvgPayrollStream } from "@/components/svg/SvgScene";

export function ExecutionsPage() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const live = useQuery({
    queryKey: ["executions"],
    queryFn: () => api.executions(""),
    retry: 1,
  });
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });

  const explorer = cfg.data?.explorerBase ?? "https://basescan.org";
  const slots = evidence.data?.paydaySlots ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          PAYDAY
        </h1>
        <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
          The primary stream. Each pulse is a receipt-verified slot on Base.
        </p>
      </div>

      <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <SvgPayrollStream />
      </div>

      <section>
        <h2 className="font-display text-lg font-bold">Payroll calendar</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.isLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded bg-white/5" />
            ))}
          {slots.map((s, i) => (
            <motion.a
              key={s.slot}
              href={s.explorer ?? `${explorer}/tx/${s.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="group relative overflow-hidden rounded-[4px] border border-emerald-500/30 bg-emerald-500/5 p-5 transition-transform hover:scale-[1.02]"
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400">
                Paid
              </div>
              <div className="mt-2 font-display text-2xl font-bold">
                Slot {s.slot}
              </div>
              <div className="mt-3 font-mono text-[11px] text-[var(--fg-muted)]">
                {shortHash(s.executionId, 10)}
              </div>
              <div className="mt-1 font-mono text-[11px] text-[var(--accent)] group-hover:underline">
                {shortHash(s.transactionHash)}
              </div>
            </motion.a>
          ))}
        </div>
        {!evidence.isLoading && slots.length === 0 && (
          <p className="mt-4 text-sm text-[var(--fg-muted)]">No certified slots yet.</p>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg font-bold">Live Observer</h2>
        {live.isLoading && (
          <p className="mt-2 text-sm text-[var(--fg-muted)]">Listening...</p>
        )}
        {live.isError && (
          <p className="mt-2 text-sm text-yellow-500/90">
            Observer list unavailable: {(live.error as Error).message}
          </p>
        )}
        {live.data != null && (
          <div className="mt-4 rounded-[4px] border border-[var(--border)] p-5 text-sm text-[var(--fg-muted)]">
            Live execution payload received. Use certified slots above for the
            receipt-backed story.
          </div>
        )}
      </section>
    </div>
  );
}
