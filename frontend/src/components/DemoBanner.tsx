import { useDemoMode } from "@/hooks/useDemoMode";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function DemoBanner() {
  const { isDemo, setDemo } = useDemoMode();
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  if (!isDemo) return null;

  const label = evidence.data?.provenance?.label ?? "DEMO FIXTURE";
  const isLocalFixture =
    label.toUpperCase().includes("DEMO") || label.toUpperCase().includes("FIXTURE");

  return (
    <div className="border-b border-[var(--accent)]/30 bg-[var(--accent)]/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
        <p className="text-sm text-[var(--fg)]">
          <span className="font-display font-bold text-[var(--accent)]">
            {isLocalFixture ? "DEMO FIXTURE — NO REAL TRANSACTIONS" : label}
          </span>
          <span className="text-[var(--fg-muted)]">
            {" "}
            {isLocalFixture
              ? "— local sample data only. Not mainnet."
              : "— historical verified evidence for the story. Not a live spend path."}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setDemo(false)}
          className="rounded-[4px] border border-white/15 px-3 py-1 text-xs text-[var(--fg-muted)] hover:border-white/30 hover:text-[var(--fg)]"
        >
          Switch to LIVE OBSERVER
        </button>
      </div>
    </div>
  );
}
