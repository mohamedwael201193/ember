import { useDemoMode } from "@/hooks/useDemoMode";

export function DemoBanner() {
  const { isDemo, setDemo } = useDemoMode();
  if (!isDemo) return null;

  return (
    <div className="border-b border-[var(--accent)]/30 bg-[var(--accent)]/10">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 md:px-6">
        <p className="text-sm text-[var(--fg)]">
          <span className="font-display font-bold text-[var(--accent)]">Demo Mode</span>
          <span className="text-[var(--fg-muted)]">
            {" "}
            — verified snapshot, instant story, no waiting on live calls.
          </span>
        </p>
        <button
          type="button"
          onClick={() => setDemo(false)}
          className="rounded-[4px] border border-white/15 px-3 py-1 text-xs text-[var(--fg-muted)] hover:border-white/30 hover:text-[var(--fg)]"
        >
          Switch to live
        </button>
      </div>
    </div>
  );
}
