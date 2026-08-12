import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import gsap from "gsap";
import { useReducedMotion } from "motion/react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SvgRescueFlow } from "@/components/svg/SvgScene";
import { Expandable } from "@/components/Expandable";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { Link } from "react-router-dom";
import { useDemoMode } from "@/hooks/useDemoMode";
import { paymentLabel } from "@/lib/product";
import { keeperHubExecutionUrl } from "@/lib/keeperhub";
import { ExternalLink } from "lucide-react";

const PIPELINE = [
  { key: "observe", label: "Watch", hint: "See unpaid payments after the grace window." },
  { key: "sentinel", label: "Decide", hint: "Open the rescue window safely." },
  { key: "replay", label: "Replay", hint: "Standby org pays only what was missed." },
  { key: "proof", label: "Prove", hint: "Hash the rescue journal." },
  { key: "ipfs", label: "Publish", hint: "Pin the proof so anyone can fetch it." },
  { key: "anchor", label: "Seal", hint: "Anchor the proof onchain." },
  { key: "restored", label: "Restored", hint: "Payroll continuity is back." },
] as const;

export function RescuesPage() {
  const qc = useQueryClient();
  const { isDemo } = useDemoMode();
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });
  const reduce = useReducedMotion();
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [confirmPractice, setConfirmPractice] = useState(false);

  const rescue = useMutation({
    mutationFn: () => api.rescue({ dryRun: true }),
    onSuccess: () => {
      setConfirmPractice(false);
      qc.invalidateQueries({ queryKey: ["snapshot"] });
    },
  });

  const journal = evidence.data?.rescue;
  const explorer = cfg.data?.explorerBase ?? "https://basescan.org";
  const completed = journal?.status === "COMPLETED";

  useEffect(() => {
    if (!completed) return;
    let i = 0;
    setActive(0);
    if (reduce) {
      setActive(PIPELINE.length - 1);
      return;
    }
    const id = window.setInterval(() => {
      i += 1;
      setActive(Math.min(i, PIPELINE.length - 1));
      if (i >= PIPELINE.length - 1) window.clearInterval(id);
    }, 450);
    return () => window.clearInterval(id);
  }, [completed, reduce, journal?.rescueId]);

  useEffect(() => {
    if (reduce || !railRef.current) return;
    const dots = railRef.current.querySelectorAll("[data-glow]");
    const ctx = gsap.context(() => {
      gsap.fromTo(
        dots,
        { boxShadow: "0 0 0 rgba(255,92,26,0)" },
        {
          boxShadow: "0 0 22px rgba(255,92,26,0.55)",
          stagger: 0.1,
          duration: 0.55,
          ease: "power2.out",
          yoyo: true,
          repeat: 1,
        }
      );
    }, railRef);
    return () => ctx.revert();
  }, [reduce, active, journal?.rescueId]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Rescue
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            The moment EMBER earns its name — agent fails, standby restores payroll,
            proof is sealed forever.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProvenanceBadge provenance={evidence.data?.provenance} />
          {!isDemo && (
            <div className="flex flex-col items-end gap-2">
              {!confirmPractice ? (
                <Button variant="outline" onClick={() => setConfirmPractice(true)}>
                  Practice rescue (dry-run)
                </Button>
              ) : (
                <div className="max-w-xs rounded-[4px] border border-amber-500/40 bg-amber-500/10 p-3 text-left text-xs text-amber-100">
                  <p className="font-medium">Server dry-run confirmation</p>
                  <p className="mt-1 text-amber-100/80">
                    Calls the EMBER runtime rescue endpoint with dryRun=true. Does not execute
                    KeeperHub payroll or move USDC. Network: Base evidence only. Org: standby
                    path is simulated.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => rescue.mutate()}
                      disabled={rescue.isPending}
                    >
                      {rescue.isPending ? "Running…" : "Confirm dry-run"}
                    </Button>
                    <Button variant="ghost" onClick={() => setConfirmPractice(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="rounded-[4px] border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-200">
        CERTIFIED DRILL — NO LIVE SPEND when viewing snapshot evidence. Pair this story with
        real KeeperHub run IDs and BaseScan hashes below.
      </p>

      <SvgRescueFlow />

      <div ref={railRef}>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-bold">Seven beats, in order</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            step {active + 1} of {PIPELINE.length}
          </span>
        </div>

        <div className="relative mt-5 h-px bg-white/10">
          <div
            className="absolute inset-y-0 left-0 bg-[var(--accent)] transition-[width] duration-700 ease-out"
            style={{
              width: `${((active + 1) / PIPELINE.length) * 100}%`,
              boxShadow: "0 0 18px rgba(255,92,26,0.6)",
            }}
          />
        </div>

        <ol className="mt-4 flex flex-wrap gap-2">
          {PIPELINE.map((step, i) => {
            const lit = i <= active;
            const glowing = i === active;
            return (
              <li key={step.key}>
                <button
                  type="button"
                  data-glow={glowing ? "1" : undefined}
                  onClick={() => setActive(i)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm transition-colors ${
                    glowing
                      ? "border-[var(--accent)] bg-[var(--accent)]/15 text-[var(--fg)]"
                      : lit
                        ? "border-white/20 bg-white/[0.03] text-[var(--fg)]"
                        : "border-[var(--border)] text-[var(--fg-muted)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      lit ? "bg-[var(--accent)]" : "bg-white/20"
                    } ${glowing ? "animate-pulse" : ""}`}
                  />
                  <span className="font-mono text-[10px] text-[var(--fg-muted)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {step.label}
                </button>
              </li>
            );
          })}
        </ol>

        <p className="mt-5 max-w-xl text-base text-[var(--fg)]">{PIPELINE[active].hint}</p>
      </div>

      {completed && (
        <div className="rounded-[4px] border border-emerald-500/40 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
          Mission restored — missed payments replayed, proof published, anchor sealed.
        </div>
      )}

      {rescue.isError && (
        <p className="text-sm text-[var(--color-down)]">
          {(rescue.error as Error).message}
        </p>
      )}

      {journal && (
        <article className="rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-bold">Certified rescue</h2>
            <span className="rounded-[4px] border border-emerald-500/40 px-2 py-0.5 text-xs text-emerald-400">
              {journal.status === "COMPLETED" ? "Complete" : journal.status}
            </span>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-sm text-[var(--fg-muted)]">Replayed payments</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {(journal.replays ?? []).map((r, i) => {
                const khHref = keeperHubExecutionUrl(
                  cfg.data?.orgBReplayWorkflowId,
                  r.executionId
                );
                return (
                  <div
                    key={r.slot}
                    className="min-w-[160px] rounded-[4px] border border-emerald-500/30 bg-emerald-500/5 p-4"
                  >
                    <div className="text-xs text-emerald-400">{paymentLabel(i)} restored</div>
                    <a
                      href={`${explorer}/tx/${r.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block font-mono text-[11px] text-[var(--fg-muted)] hover:text-[var(--accent)]"
                    >
                      BaseScan · {shortHash(r.txHash)}
                    </a>
                    {khHref ? (
                      <a
                        href={khHref}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                      >
                        KeeperHub run
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            <Link to="/app/proofs" className="text-[var(--accent)] hover:underline">
              See the proof chain
            </Link>
            {journal.anchorTxHash && (
              <a
                className="text-[var(--fg-muted)] hover:text-[var(--fg)]"
                href={`${explorer}/tx/${journal.anchorTxHash}`}
                target="_blank"
                rel="noreferrer"
              >
                Open seal on explorer
              </a>
            )}
          </div>

          <div className="mt-6">
            <Expandable summary="Technical rescue id">
              {journal.rescueId}
            </Expandable>
          </div>
        </article>
      )}
    </div>
  );
}
