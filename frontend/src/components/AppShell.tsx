import { NavLink, Outlet, Link } from "react-router-dom";
import { ArrowLeft, Menu, Plus, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Onboarding } from "@/components/Onboarding";

const NAV = [
  { to: "/app", end: true, label: "Console" },
  { to: "/app/mission", label: "Mission" },
  { to: "/app/executions", label: "PAYDAY" },
  { to: "/app/rescues", label: "Rescue" },
  { to: "/app/proofs", label: "Proofs" },
  { to: "/app/operations", label: "Ops" },
  { to: "/app/wallets", label: "Wallets" },
  { to: "/app/settings", label: "Settings" },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const snap = useQuery({
    queryKey: ["snapshot"],
    queryFn: api.snapshot,
    refetchInterval: 15_000,
  });

  const state = snap.data?.check?.state ?? "...";
  const network = snap.data?.config.network ?? "...";
  const stateTone =
    state === "OK" || state === "RECOVERED"
      ? "text-emerald-400"
      : state === "MISSION_DOWN" || state === "DEGRADED"
        ? "text-red-400"
        : "text-[var(--fg-muted)]";

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)]">
      <div className="grain" aria-hidden />

      {/* Top product chrome - not an admin sidebar */}
      <header className="sticky top-0 z-[var(--z-raised,10)] border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 md:px-6">
          <button
            type="button"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            EMBER
          </Link>

          <nav className="ml-4 hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "rounded-[4px] px-3 py-1.5 text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--fg)]",
                    isActive && "bg-white/5 text-[var(--fg)]"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                {network}
              </div>
              <div className={cn("font-mono text-xs font-medium", stateTone)}>
                {String(state)}
              </div>
            </div>
            <Link
              to="/app/mission/new"
              className="inline-flex h-9 items-center gap-1.5 rounded-[4px] bg-[var(--accent)] px-3 text-sm font-medium text-white transition-transform hover:brightness-110 active:scale-[0.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              Mission
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 border-r border-[var(--border)] bg-[var(--surface)] p-5 transition-transform lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="font-display text-lg font-bold">EMBER</span>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "rounded-[4px] px-3 py-2.5 text-sm text-[var(--fg-muted)]",
                  isActive && "bg-white/5 text-[var(--fg)]"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          aria-label="Close overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="mx-auto max-w-7xl px-4 py-3 md:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-3 w-3" />
          Story
        </Link>
        <span className="ml-3 font-mono text-[10px] text-[var(--fg-muted)]">
          {snap.data?.checkedAt
            ? `Synced ${new Date(snap.data.checkedAt).toLocaleTimeString()}`
            : snap.isLoading
              ? "Connecting..."
              : "Offline"}
        </span>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <Outlet />
      </main>
      <Onboarding />
    </div>
  );
}
