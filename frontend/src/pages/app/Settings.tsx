import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function SettingsPage() {
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Public runtime configuration exposed by the BFF. Secrets stay server-side.
        </p>
      </div>

      {cfg.isLoading && <div className="h-40 animate-pulse rounded bg-white/5" />}
      {cfg.data && (
        <pre className="overflow-auto rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-5 font-mono text-xs">
          {JSON.stringify(cfg.data, null, 2)}
        </pre>
      )}

      <div className="rounded-[4px] border border-[var(--border)] p-5 text-sm text-[var(--fg-muted)]">
        <p className="font-display text-base font-bold text-[var(--fg)]">Security</p>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Browser never sees SENTINEL_SHARED_SECRET</li>
          <li>HMAC signing happens only in the BFF</li>
          <li>KeeperHub bearer keys never leave the backend</li>
        </ul>
      </div>
    </div>
  );
}
