import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { SvgPayrollStream } from "@/components/svg/SvgScene";
import { Expandable } from "@/components/Expandable";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { paymentLabel } from "@/lib/product";
import { useDemoMode } from "@/hooks/useDemoMode";
import { keeperHubExecutionUrl, keeperHubWorkflowUrl } from "@/lib/keeperhub";

export function ExecutionsPage() {
  const { isDemo } = useDemoMode();
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const live = useQuery({
    queryKey: ["executions"],
    queryFn: () => api.executions(""),
    retry: 1,
    enabled: !isDemo,
  });
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });

  const explorer = cfg.data?.explorerBase ?? "https://basescan.org";
  const slots = evidence.data?.paydaySlots ?? [];
  const workflowId =
    evidence.data?.primaryWorkflowId ?? cfg.data?.orgAWorkflowId ?? undefined;
  const workflowHref = keeperHubWorkflowUrl(workflowId);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            PAYDAY
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            Watch money move from the payer through KeeperHub to the employee — each
            pulse verified by an onchain receipt.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProvenanceBadge provenance={evidence.data?.provenance} />
          {workflowHref ? (
            <a
              href={workflowHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] hover:underline"
            >
              Open in KeeperHub
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-6">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm font-medium">
          <span className="rounded-[4px] border border-white/15 px-3 py-1">Payer</span>
          <span aria-hidden className="font-mono text-xs text-[var(--accent)]">
            ——▸
          </span>
          <span className="inline-flex items-center gap-2 rounded-[4px] border border-[var(--accent)]/40 bg-[var(--accent)]/10 px-3 py-1 text-[var(--accent)]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--accent)]" />
            KeeperHub
          </span>
          <span aria-hidden className="font-mono text-xs text-[var(--accent)]">
            ——▸
          </span>
          <span className="rounded-[4px] border border-emerald-500/40 px-3 py-1 text-emerald-400">
            Employee
          </span>
        </div>
        <SvgPayrollStream />
        <p className="mt-4 text-center text-xs text-[var(--fg-muted)]">
          Successful transfers glow green. Receipts prove the money actually moved.
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg font-bold">Verified payments</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {evidence.isLoading &&
            [0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded bg-white/5" />
            ))}
          {slots.map((s, i) => {
            const khHref = keeperHubExecutionUrl(workflowId, s.executionId);
            return (
              <motion.div
                key={s.slot}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-[4px] border border-emerald-500/30 bg-emerald-500/5 p-5"
              >
                <div className="text-[10px] uppercase tracking-wider text-emerald-400">
                  Receipt verified
                </div>
                <div className="mt-2 font-display text-2xl font-bold">
                  {paymentLabel(i)}
                </div>
                <div className="mt-3 flex flex-col gap-1 text-xs text-[var(--fg-muted)]">
                  <a
                    href={s.explorer ?? `${explorer}/tx/${s.transactionHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-[var(--accent)] hover:underline"
                  >
                    BaseScan · {shortHash(s.transactionHash)}
                  </a>
                  {khHref ? (
                    <a
                      href={khHref}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-[var(--accent)] hover:underline"
                    >
                      KeeperHub run · {s.executionId}
                    </a>
                  ) : null}
                </div>
              </motion.div>
            );
          })}
        </div>
        {!evidence.isLoading && slots.length === 0 && (
          <p className="mt-4 text-sm text-[var(--fg-muted)]">No verified payments yet.</p>
        )}
      </section>

      <Expandable summary="Technical payment ids">
        {slots.map((s, i) => (
          <div key={s.slot} className="mb-2">
            {paymentLabel(i)} · slot {s.slot} · exec {s.executionId}
          </div>
        ))}
      </Expandable>

      {!isDemo && (
        <section>
          <h2 className="font-display text-lg font-bold">Live observer</h2>
          {live.isLoading && (
            <p className="mt-2 text-sm text-[var(--fg-muted)]">Listening…</p>
          )}
          {live.isError && (
            <p className="mt-2 text-sm text-yellow-500/90">
              Live list unavailable — certified payments above still tell the story.
            </p>
          )}
          {live.data != null && (
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Live executions received. Prefer the receipt-backed cards for demos.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
