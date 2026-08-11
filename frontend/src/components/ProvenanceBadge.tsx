import type { ProvenanceMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProvenanceBadge({
  provenance,
  className,
}: {
  provenance?: ProvenanceMeta | null;
  className?: string;
}) {
  if (!provenance) return null;
  const tone =
    provenance.source === "live_runtime"
      ? "border-emerald-500/40 text-emerald-300"
      : provenance.source === "certified_mainnet_snapshot"
        ? "border-[var(--accent)]/40 text-[var(--accent)]"
        : "border-amber-500/40 text-amber-300";

  return (
    <div
      className={cn(
        "inline-flex flex-col gap-0.5 rounded-[4px] border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em]",
        tone,
        className
      )}
      title={provenance.note ?? provenance.label}
    >
      <span>{provenance.label}</span>
      {provenance.evidenceId ? (
        <span className="normal-case tracking-normal text-[var(--fg-muted)]">
          {provenance.evidenceId}
        </span>
      ) : null}
    </div>
  );
}
