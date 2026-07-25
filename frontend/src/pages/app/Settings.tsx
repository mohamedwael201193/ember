import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useDemoMode } from "@/hooks/useDemoMode";
import { humanNetwork } from "@/lib/product";
import { Expandable } from "@/components/Expandable";

export function SettingsPage() {
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });
  const { isDemo, setDemo } = useDemoMode();

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Only the controls that matter for a demo or a live walkthrough.
        </p>
      </div>

      <section className="rounded-[4px] border border-[var(--border)] p-5">
        <h2 className="font-display text-lg font-bold">Presentation mode</h2>
        <p className="mt-2 text-sm text-[var(--fg-muted)]">
          Demo Mode loads the verified snapshot instantly — ideal for recording. Live Mode
          follows the connected runtime.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDemo(true)}
            className={`rounded-[4px] px-4 py-2 text-sm ${
              isDemo
                ? "bg-[var(--accent)] text-white"
                : "border border-[var(--border)] text-[var(--fg-muted)]"
            }`}
          >
            Demo Mode
          </button>
          <button
            type="button"
            onClick={() => setDemo(false)}
            className={`rounded-[4px] px-4 py-2 text-sm ${
              !isDemo
                ? "bg-white text-black"
                : "border border-[var(--border)] text-[var(--fg-muted)]"
            }`}
          >
            Live Mode
          </button>
        </div>
      </section>

      {cfg.isLoading && <div className="h-24 animate-pulse rounded bg-white/5" />}
      {cfg.data && (
        <section className="space-y-3 rounded-[4px] border border-[var(--border)] p-5 text-sm">
          <Row label="Network" value={humanNetwork(cfg.data.network)} />
          <Row label="Mission" value={cfg.data.missionId} />
          <Row label="Runtime" value={cfg.data.runtimeUrl} />
          <Expandable summary="Advanced public config">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  chainId: cfg.data.chainId,
                  continuity: cfg.data.continuity,
                  workflowHash: cfg.data.workflowHash,
                  developmentMode: cfg.data.developmentMode,
                },
                null,
                2
              )}
            </pre>
          </Expandable>
        </section>
      )}

      <div className="rounded-[4px] border border-[var(--border)] p-5 text-sm text-[var(--fg-muted)]">
        <p className="font-display text-base font-bold text-[var(--fg)]">Safety</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Your browser never sees API keys or signing secrets</li>
          <li>Signing happens only on the server</li>
          <li>Demo Mode never spends real funds</li>
        </ul>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--border)] pb-2">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className="max-w-[65%] break-all text-right">{value ?? "—"}</span>
    </div>
  );
}
