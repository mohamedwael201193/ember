import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { formatUtc, shortHash } from "@/lib/utils";
import { SvgArchitecture, SvgHealthRadar } from "@/components/svg/SvgScene";
import { ExternalLink, ArrowRight } from "lucide-react";

function StateGlow({ state }: { state?: string }) {
  const color =
    state === "OK" || state === "RECOVERED"
      ? "shadow-[0_0_40px_rgba(34,197,94,0.25)] border-emerald-500/40 text-emerald-400"
      : state === "MISSION_DOWN" || state === "DEGRADED"
        ? "shadow-[0_0_40px_rgba(239,68,68,0.2)] border-red-500/40 text-red-400"
        : state === "RESCUING"
          ? "shadow-[0_0_40px_rgba(234,179,8,0.2)] border-yellow-500/40 text-yellow-400"
          : "border-white/15 text-[var(--fg-muted)]";
  return (
    <span
      className={`inline-flex rounded-[4px] border bg-black/40 px-3 py-1 font-mono text-xs uppercase tracking-wider ${color}`}
    >
      {state ?? "UNKNOWN"}
    </span>
  );
}

export function OverviewPage() {
  const snap = useQuery({
    queryKey: ["snapshot"],
    queryFn: api.snapshot,
    refetchInterval: 12_000,
  });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });

  if (snap.isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-12 w-72 animate-pulse rounded bg-white/5" />
        <div className="h-64 animate-pulse rounded bg-white/5" />
      </div>
    );
  }

  if (snap.isError) {
    return (
      <div className="rounded-[4px] border border-red-500/40 p-6">
        <h1 className="font-display text-2xl font-bold">Backend unreachable</h1>
        <p className="mt-2 text-[var(--fg-muted)]">{(snap.error as Error).message}</p>
        <button
          type="button"
          className="mt-4 rounded-[4px] bg-white px-4 py-2 text-sm text-black"
          onClick={() => snap.refetch()}
        >
          Retry
        </button>
      </div>
    );
  }

  const check = snap.data!.check;
  const cfg = snap.data!.config;
  const explorer = cfg.explorerBase;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
              Living console
            </h1>
            <StateGlow state={check?.state} />
          </div>
          <p className="mt-2 max-w-xl text-[var(--fg-muted)]">
            Receipt-backed health. Topology updates every few seconds from the real runtime.
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

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4 md:p-6">
          <SvgArchitecture />
        </div>
        <div className="flex flex-col gap-4">
          <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
            <SvgHealthRadar className="mx-auto max-w-[240px]" />
            <p className="mt-2 text-center font-mono text-xs text-[var(--fg-muted)]">
              Mission {cfg.missionId} · {cfg.network}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Verified", String(check?.receiptVerifiedPayments ?? "-")],
              ["Missed", String(check?.missedSlots?.length ?? 0)],
              ["Chain", String(cfg.chainId)],
              [
                "Runtime",
                snap.data!.serviceReadiness.every((s) => s.ok) ? "ready" : "degraded",
              ],
            ].map(([k, v]) => (
              <div
                key={k}
                className="rounded-[4px] border border-[var(--border)] p-4"
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                  {k}
                </div>
                <div className="mt-1 font-display text-xl font-bold">{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Journey river */}
      <section>
        <h2 className="font-display text-lg font-bold">Mission river</h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {(evidence.data?.paydaySlots ?? []).map((s) => (
            <a
              key={s.slot}
              href={s.explorer ?? `${explorer}/tx/${s.transactionHash}`}
              target="_blank"
              rel="noreferrer"
              className="min-w-[160px] rounded-[4px] border border-emerald-500/30 bg-emerald-500/5 p-4 transition-transform hover:scale-[1.02]"
            >
              <div className="text-[10px] uppercase tracking-wider text-emerald-400">
                Paid
              </div>
              <div className="mt-2 font-mono text-xs">slot {s.slot}</div>
              <div className="mt-1 font-mono text-[11px] text-[var(--fg-muted)]">
                {shortHash(s.transactionHash)}
              </div>
            </a>
          ))}
          {(check?.missedSlots ?? []).slice(0, 4).map((slot) => (
            <div
              key={slot}
              className="min-w-[140px] rounded-[4px] border border-red-500/30 bg-red-500/5 p-4"
            >
              <div className="text-[10px] uppercase tracking-wider text-red-400">
                Missed
              </div>
              <div className="mt-2 font-mono text-xs">slot {slot}</div>
            </div>
          ))}
          {evidence.data?.rescue?.status === "COMPLETED" && (
            <Link
              to="/app/rescues"
              className="min-w-[160px] rounded-[4px] border border-[var(--accent)]/40 bg-[var(--accent)]/10 p-4"
            >
              <div className="text-[10px] uppercase tracking-wider text-[var(--accent)]">
                Rescued
              </div>
              <div className="mt-2 text-sm font-medium">Proof sealed</div>
              <div className="mt-1 font-mono text-[11px] text-[var(--fg-muted)]">
                {shortHash(evidence.data.proofCid, 8)}
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {snap.data!.serviceReadiness.map((s) => (
          <div
            key={s.name}
            className="rounded-[4px] border border-[var(--border)] p-5"
          >
            <div className="flex items-center justify-between">
              <span className="capitalize">{s.name.replace("-", " ")}</span>
              <span
                className={
                  s.ok
                    ? "h-2 w-2 rounded-full bg-emerald-400"
                    : "h-2 w-2 rounded-full bg-red-400"
                }
                aria-label={s.ok ? "ready" : "down"}
              />
            </div>
            <p className="mt-2 font-mono text-xs text-[var(--fg-muted)]">
              {s.ok ? "signal live" : "signal lost"}
            </p>
          </div>
        ))}
      </section>

      {evidence.data && (
        <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--fg-muted)]">
          <span>Continuity</span>
          <a
            className="font-mono text-[var(--accent)] hover:underline"
            href={`${explorer}/address/${evidence.data.continuity}`}
            target="_blank"
            rel="noreferrer"
          >
            {shortHash(evidence.data.continuity)}
            <ExternalLink className="ml-1 inline h-3 w-3" />
          </a>
          <span className="text-white/20">|</span>
          <span>Synced {formatUtc(snap.data!.checkedAt)}</span>
        </div>
      )}
    </div>
  );
}
