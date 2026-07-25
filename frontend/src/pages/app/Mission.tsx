import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import {
  SvgArchitecture,
  SvgEscrow,
  SvgPayrollStream,
} from "@/components/svg/SvgScene";
import { Expandable } from "@/components/Expandable";
import { useDemoMode } from "@/hooks/useDemoMode";
import { humanNetwork, humanState, paymentLabel } from "@/lib/product";

export function MissionPage() {
  const { isDemo } = useDemoMode();
  const snap = useQuery({
    queryKey: ["snapshot"],
    queryFn: api.snapshot,
    refetchInterval: isDemo ? 60_000 : 15_000,
  });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const cfg = snap.data?.config;
  const check = snap.data?.check;
  const rescue = evidence.data?.rescue;
  const slots = evidence.data?.paydaySlots ?? [];
  const latest = slots[slots.length - 1];

  type MissionDraft = {
    employeeName?: string;
    amountUsdc?: string;
    cadenceMin?: string;
    recoveryOrg?: string;
    beneficiary?: string;
    walletLabel?: string;
  };
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
            Mission overview
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            What is running, who gets paid, who protects it — in one glance.
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

      {isDemo && (
        <div className="rounded-[4px] border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-3 text-sm text-[var(--fg-muted)]">
          Showing a <span className="text-[var(--accent)]">verified demo snapshot</span> —
          perfect for walkthroughs.
        </div>
      )}

      {snap.isLoading && <div className="h-48 animate-pulse rounded bg-white/5" />}
      {snap.isError && (
        <p className="text-[var(--color-down)]">{(snap.error as Error).message}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            k: "Current state",
            v: humanState(check?.state),
            hint: "Is payroll healthy right now?",
          },
          {
            k: "Who gets paid",
            v: draft?.employeeName || "Employee wallet",
            hint: "The person this mission protects",
          },
          {
            k: "How often",
            v: draft?.cadenceMin
              ? `Every ${draft.cadenceMin} min`
              : "Scheduled cadence",
            hint: "Payment rhythm",
          },
          {
            k: "Network",
            v: humanNetwork(cfg?.network),
            hint: "Where receipts settle",
          },
        ].map((card) => (
          <div key={card.k} className="rounded-[4px] border border-[var(--border)] p-5">
            <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
              {card.k}
            </div>
            <div className="mt-2 font-display text-xl font-bold">{card.v}</div>
            <p className="mt-2 text-xs text-[var(--fg-muted)]">{card.hint}</p>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <p className="mb-4 text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            Money flow
          </p>
          <SvgPayrollStream />
        </div>
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <p className="mb-4 text-xs uppercase tracking-wider text-[var(--fg-muted)]">
            Who protects it
          </p>
          <SvgArchitecture />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StoryCard
          title="Latest payment"
          body={
            latest
              ? `${paymentLabel(slots.length - 1)} verified onchain`
              : "No verified payments yet"
          }
          link={latest?.explorer}
          linkLabel="Open receipt"
        />
        <StoryCard
          title="Latest rescue"
          body={
            rescue?.status === "COMPLETED"
              ? "Standby restored missed payments"
              : "No rescue needed yet"
          }
          to="/app/rescues"
          linkLabel="Open rescue story"
        />
        <StoryCard
          title="Current proof"
          body={
            evidence.data?.proofCid
              ? "Hash pinned and anchored"
              : "Proof appears after a rescue"
          }
          to="/app/proofs"
          linkLabel="Open proof chain"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
          <SvgEscrow className="mx-auto max-w-[300px]" />
          <p className="mt-3 text-sm text-[var(--fg-muted)]">
            Escrow protects mission funds and records the final rescue seal.
          </p>
        </div>
        <div className="space-y-3">
          <Expandable summary="Technical details (contract, workflows)">
            <div className="space-y-2">
              <div>Continuity {cfg?.continuity ?? "—"}</div>
              <div>Workflow hash {cfg?.workflowHash ?? "—"}</div>
              <div>Primary workflow {cfg?.orgAWorkflowId ?? "—"}</div>
              <div>Backup workflow {cfg?.orgBReplayWorkflowId ?? "—"}</div>
              <div>Chain id {cfg?.chainId ?? "—"}</div>
            </div>
          </Expandable>
          {cfg?.continuity && cfg.explorerBase && (
            <a
              className="inline-block text-sm text-[var(--accent)] hover:underline"
              href={`${cfg.explorerBase}/address/${cfg.continuity}`}
              target="_blank"
              rel="noreferrer"
            >
              View continuity contract
            </a>
          )}
          {(check?.missedSlots?.length ?? 0) > 0 && (
            <Expandable summary={`${check?.missedSlots?.length} missed payments (ids)`}>
              {(check?.missedSlots ?? []).join(", ")}
            </Expandable>
          )}
        </div>
      </div>

      {draft?.employeeName && (
        <div className="rounded-[4px] border border-[var(--accent)]/30 bg-[var(--accent)]/5 p-5 text-sm">
          Draft ready for {draft.employeeName}
          {draft.amountUsdc ? ` · ${draft.amountUsdc} USDC` : ""}
          <Link to="/app/mission/new" className="ml-3 text-[var(--accent)] hover:underline">
            Continue builder
          </Link>
        </div>
      )}
    </div>
  );
}

function StoryCard({
  title,
  body,
  to,
  link,
  linkLabel,
}: {
  title: string;
  body: string;
  to?: string;
  link?: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-[4px] border border-[var(--border)] p-5">
      <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
        {title}
      </div>
      <p className="mt-2 font-display text-lg font-bold leading-snug">{body}</p>
      {to ? (
        <Link to={to} className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline">
          {linkLabel}
        </Link>
      ) : link ? (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
        >
          {linkLabel}
        </a>
      ) : null}
    </div>
  );
}
