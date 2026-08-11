import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { SvgHealthRadar, SvgOrbitSignal } from "@/components/svg/SvgScene";
import { formatUtc } from "@/lib/utils";
import { humanNetwork, humanState } from "@/lib/product";
import { useDemoMode } from "@/hooks/useDemoMode";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";

function pulseTone(ok: boolean) {
  return ok
    ? "border-emerald-500/40 bg-emerald-500/5"
    : "border-red-500/40 bg-red-500/5";
}

function sloValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  return String(value);
}

export function OperationsPage() {
  const { isDemo } = useDemoMode();
  const snap = useQuery({
    queryKey: ["snapshot"],
    queryFn: api.snapshot,
    refetchInterval: isDemo ? 60_000 : 10_000,
  });
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });

  const check = snap.data?.check;
  const services = snap.data?.serviceReadiness ?? [];
  const slots = evidence.data?.paydaySlots ?? [];
  const rescue = evidence.data?.rescue;
  const expectedSlots = slots.length + (rescue?.unpaidSlots?.length ?? 0);
  const confirmedSlots = slots.length;
  const missedSlots = rescue?.unpaidSlots?.length ?? check?.missedSlots?.length ?? 0;
  const replayCount = rescue?.replays?.length ?? 0;
  const covered = new Set((rescue?.replays ?? []).map((r) => r.slot));
  const unpaid = rescue?.unpaidSlots ?? [];
  const duplicatePrevented =
    unpaid.length > 0 ? unpaid.every((s) => !covered.has(s) || Boolean(rescue?.replays?.find((r) => r.slot === s))) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Mission control
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            Live health for runtime, guardian checks, chain, and Continuity SLO — obvious at a glance.
          </p>
        </div>
        <ProvenanceBadge provenance={snap.data?.provenance ?? evidence.data?.provenance} />
      </div>

      {snap.isLoading && <div className="h-48 animate-pulse rounded bg-white/5" />}
      {snap.isError && (
        <p className="text-[var(--color-down)]">{(snap.error as Error).message}</p>
      )}

      {snap.data && (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <SvgOrbitSignal className="mx-auto max-h-80" />
            </div>
            <div className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4">
              <SvgHealthRadar className="mx-auto max-h-80" />
            </div>
          </div>

          <section>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">Continuity SLO</h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                CERTIFIED DRILL — NO LIVE SPEND when using snapshot evidence
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Expected slots", value: sloValue(expectedSlots || null) },
                { label: "Confirmed slots", value: sloValue(confirmedSlots || null) },
                { label: "Missed slots", value: sloValue(missedSlots) },
                { label: "Replay count", value: sloValue(replayCount || null) },
                {
                  label: "Detection latency",
                  value: "Unavailable",
                },
                {
                  label: "Recovery time",
                  value:
                    rescue?.createdAt && rescue?.updatedAt
                      ? `${Math.max(
                          0,
                          Math.round(
                            (Date.parse(String(rescue.updatedAt)) -
                              Date.parse(String(rescue.createdAt))) /
                              1000
                          )
                        )}s`
                      : "Unavailable",
                },
                {
                  label: "Duplicate prevention",
                  value:
                    duplicatePrevented == null
                      ? "Unavailable"
                      : duplicatePrevented
                        ? "Held"
                        : "Risk",
                },
                {
                  label: "Proof / anchor",
                  value:
                    evidence.data?.proofCid && (rescue?.anchorTxHash || evidence.data.anchorTx)
                      ? "Sealed"
                      : evidence.data?.proofCid
                        ? "Pinned"
                        : "Unavailable",
                },
              ].map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, ease: [0.16, 1, 0.3, 1] }}
                  className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-4"
                >
                  <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                    {m.label}
                  </div>
                  <div className="mt-2 font-display text-lg font-bold">{m.value}</div>
                </motion.div>
              ))}
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Mission health",
                value: humanState(check?.state),
                ok: check?.state === "OK" || check?.state === "RECOVERED",
              },
              {
                label: "Verified payments",
                value: String(check?.receiptVerifiedPayments ?? "—"),
                ok: (check?.receiptVerifiedPayments ?? 0) > 0,
              },
              {
                label: "Gaps",
                value: String(check?.missedSlots?.length ?? 0),
                ok: (check?.missedSlots?.length ?? 0) === 0,
              },
              {
                label: "Network",
                value: humanNetwork(snap.data.config.network),
                ok: true,
              },
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className={`rounded-[4px] border p-5 ${pulseTone(m.ok)}`}
              >
                <div className="text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                  {m.label}
                </div>
                <div className="mt-2 font-display text-xl font-bold">{m.value}</div>
              </motion.div>
            ))}
          </section>

          <section>
            <h2 className="font-display text-lg font-bold">Services</h2>
            <ul className="mt-4 grid gap-3 md:grid-cols-3">
              {services.map((s) => {
                const label =
                  s.name === "runtime"
                    ? "Runtime"
                    : s.name === "ready"
                      ? "Readiness"
                      : s.name === "sentinel-check"
                        ? "Guardian"
                        : s.name.replace(/-/g, " ");
                return (
                  <li
                    key={s.name}
                    className={`rounded-[4px] border p-5 ${pulseTone(s.ok)}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{label}</span>
                      <span className="relative flex h-2.5 w-2.5" aria-label={s.ok ? "ready" : "down"}>
                        <span
                          className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-40 ${
                            s.ok ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                        <span
                          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                            s.ok ? "bg-emerald-400" : "bg-red-400"
                          }`}
                        />
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[var(--fg-muted)]">
                      {s.ok ? "Online" : "Unreachable"}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>

          <p className="text-xs text-[var(--fg-muted)]">
            Updated {formatUtc(snap.data.checkedAt)}
            {isDemo ? " · CERTIFIED SNAPSHOT" : " · LIVE OBSERVER"}
          </p>
        </>
      )}
    </div>
  );
}
