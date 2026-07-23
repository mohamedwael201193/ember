import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import {
  SvgArchitecture,
  SvgEscrow,
  SvgPayrollStream,
} from "@/components/svg/SvgScene";

export function MissionPage() {
  const snap = useQuery({
    queryKey: ["snapshot"],
    queryFn: api.snapshot,
    refetchInterval: 15_000,
  });
  const cfg = snap.data?.config;
  const check = snap.data?.check;

  type MissionDraft = { employeeName?: string; amountUsdc?: string };
  let draft: MissionDraft | null = null;
  try {
    const raw = localStorage.getItem("ember.mission.draft");
    if (raw) draft = JSON.parse(raw) as MissionDraft;
  } catch {
    /* ignore */
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Mission
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            Continuity contract, payroll rhythm, and guardian recovery in one view.
          </p>
        </div>
        <Link
          to="/app/mission/new"
          className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[var(--accent)] px-4 text-sm font-medium text-white"
        >
          Build mission
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {snap.isLoading && <div className="h-48 animate-pulse rounded bg-white/5" />}
      {snap.isError && (
        <p className="text-[var(--color-down)]">{(snap.error as Error).message}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <SvgArchitecture />
        </div>
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <SvgPayrollStream />
        </div>
      </div>

      {cfg && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["State", check?.state ?? "-"],
            ["Mission", cfg.missionId],
            ["Network", `${cfg.network}`],
            ["Verified", String(check?.receiptVerifiedPayments ?? "-")],
            ["Missed", (check?.missedSlots ?? []).length ? (check?.missedSlots ?? []).join(", ") : "none"],
            ["Chain", String(cfg.chainId)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-[4px] border border-[var(--border)] p-5">
              <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                {k}
              </div>
              <div className="mt-2 break-all font-display text-lg font-bold">{v}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <SvgEscrow className="max-h-48" />
        </div>
        {cfg && (
          <dl className="space-y-3 rounded-[4px] border border-[var(--border)] p-5 text-sm">
            {[
              ["Continuity", shortHash(cfg.continuity, 12)],
              ["Workflow", shortHash(cfg.workflowHash, 12)],
              ["Org A W1", cfg.orgAWorkflowId ?? "-"],
              ["Org B replay", cfg.orgBReplayWorkflowId ?? "-"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex flex-wrap justify-between gap-2 border-b border-[var(--border)] pb-3"
              >
                <dt className="text-[var(--fg-muted)]">{k}</dt>
                <dd className="font-mono text-right">{v}</dd>
              </div>
            ))}
            {cfg.continuity && cfg.explorerBase && (
              <a
                className="inline-block text-[var(--accent)] hover:underline"
                href={`${cfg.explorerBase}/address/${cfg.continuity}`}
                target="_blank"
                rel="noreferrer"
              >
                Open Continuity on explorer
              </a>
            )}
          </dl>
        )}
      </div>

      {draft?.employeeName && (
        <div className="rounded-[4px] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 text-sm">
          Local draft for {draft.employeeName}
          {draft.amountUsdc ? ` · ${draft.amountUsdc} USDC` : ""}
          <Link to="/app/mission/new" className="ml-3 text-[var(--accent)] hover:underline">
            Continue builder
          </Link>
        </div>
      )}
    </div>
  );
}
