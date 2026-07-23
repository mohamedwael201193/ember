import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SvgRescueFlow } from "@/components/svg/SvgScene";
import { Link } from "react-router-dom";

const PIPELINE = [
  { key: "observe", label: "Observer", hint: "Detects unpaid slots past grace" },
  { key: "sentinel", label: "Sentinel", hint: "Opens the rescue window" },
  { key: "replay", label: "Replay", hint: "Org B pays missed payroll" },
  { key: "proof", label: "Proof", hint: "Hash + IPFS pin" },
  { key: "anchor", label: "Anchor", hint: "Sealed on Base mainnet" },
  { key: "restored", label: "Restored", hint: "Mission continues" },
] as const;

export function RescuesPage() {
  const qc = useQueryClient();
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const rescue = useMutation({
    mutationFn: () => api.rescue({ dryRun: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["snapshot"] }),
  });

  const journal = evidence.data?.rescue;
  const explorer = "https://basescan.org";
  const completed = journal?.status === "COMPLETED";

  useEffect(() => {
    if (!completed) return;
    setActive(PIPELINE.length - 1);
  }, [completed]);

  useEffect(() => {
    if (reduce || !railRef.current) return;
    const dots = railRef.current.querySelectorAll("[data-step]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        dots,
        { scale: 0.85, opacity: 0.4 },
        {
          scale: 1,
          opacity: 1,
          stagger: 0.12,
          duration: 0.5,
          ease: "power2.out",
        }
      );
    }, railRef);
    return () => ctx.revert();
  }, [reduce, journal?.rescueId]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Rescue
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            When the agent dies, this pipeline restores the stream. Watch every step.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => rescue.mutate()}
          disabled={rescue.isPending}
        >
          {rescue.isPending ? "Running..." : "Dry-run rescue"}
        </Button>
      </div>

      <SvgRescueFlow />

      {/* Interactive pipeline */}
      <div ref={railRef} className="relative">
        <div className="absolute left-0 right-0 top-5 hidden h-px bg-white/10 md:block" />
        <ol className="grid gap-3 sm:grid-cols-3 md:grid-cols-6">
          {PIPELINE.map((step, i) => {
            const lit = completed ? i <= PIPELINE.length - 1 : i <= active;
            return (
              <li key={step.key}>
                <button
                  type="button"
                  data-step
                  onClick={() => setActive(i)}
                  className={`w-full rounded-[4px] border p-4 text-left transition-colors ${
                    i === active
                      ? "border-[var(--accent)] bg-[var(--accent)]/10"
                      : lit
                        ? "border-white/20 bg-white/[0.03]"
                        : "border-[var(--border)] opacity-50"
                  }`}
                >
                  <div
                    className={`mb-3 h-2.5 w-2.5 rounded-full ${
                      lit ? "bg-[var(--accent)]" : "bg-white/20"
                    }`}
                  />
                  <div className="font-display text-sm font-bold">{step.label}</div>
                  <p className="mt-1 text-xs text-[var(--fg-muted)]">{step.hint}</p>
                </button>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 text-sm text-[var(--fg-muted)]">
          {PIPELINE[active].hint}
        </p>
      </div>

      {rescue.isError && (
        <p className="text-sm text-[var(--color-down)]">
          {(rescue.error as Error).message}
        </p>
      )}

      {rescue.data && !("rescueId" in (rescue.data as object) && (rescue.data as { rescueId?: string }).rescueId) && (
        <div className="rounded-[4px] border border-[var(--border)] p-4 text-sm text-[var(--fg-muted)]">
          Dry-run returned. Open Operations if you need raw runtime detail.
        </div>
      )}

      {journal && (
        <article className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold">Certified rescue</h2>
            <span className="rounded-[4px] border border-emerald-500/40 px-2 py-0.5 font-mono text-xs text-emerald-400">
              {journal.status}
            </span>
          </div>
          <p className="mt-2 break-all font-mono text-[11px] text-[var(--fg-muted)]">
            {journal.rescueId}
          </p>

          <div className="mt-8 space-y-4">
            <h3 className="text-sm text-[var(--fg-muted)]">Replay river</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(journal.replays ?? []).map((r) => (
                <a
                  key={r.slot}
                  href={`${explorer}/tx/${r.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-[140px] rounded-[4px] border border-emerald-500/30 bg-emerald-500/5 p-4 transition-transform hover:scale-[1.02]"
                >
                  <div className="font-mono text-xs text-emerald-400">slot {r.slot}</div>
                  <div className="mt-2 font-mono text-[11px] text-[var(--fg-muted)]">
                    {shortHash(r.txHash)}
                  </div>
                </a>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/app/proofs" className="text-[var(--accent)] hover:underline">
              View proof chain
            </Link>
            {journal.anchorTxHash && (
              <a
                className="font-mono text-[var(--fg-muted)] hover:text-[var(--fg)]"
                href={`${explorer}/tx/${journal.anchorTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Anchor {shortHash(journal.anchorTxHash)}
              </a>
            )}
          </div>
        </article>
      )}
    </div>
  );
}
