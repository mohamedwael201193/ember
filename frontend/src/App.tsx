import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";

const Landing = lazy(() =>
  import("@/pages/Landing").then((m) => ({ default: m.Landing }))
);
const OverviewPage = lazy(() =>
  import("@/pages/app/Overview").then((m) => ({ default: m.OverviewPage }))
);
const MissionPage = lazy(() =>
  import("@/pages/app/Mission").then((m) => ({ default: m.MissionPage }))
);
const MissionBuilderPage = lazy(() =>
  import("@/pages/app/MissionBuilder").then((m) => ({
    default: m.MissionBuilderPage,
  }))
);
const ExecutionsPage = lazy(() =>
  import("@/pages/app/Executions").then((m) => ({ default: m.ExecutionsPage }))
);
const RescuesPage = lazy(() =>
  import("@/pages/app/Rescues").then((m) => ({ default: m.RescuesPage }))
);
const ProofsPage = lazy(() =>
  import("@/pages/app/Proofs").then((m) => ({ default: m.ProofsPage }))
);
const OperationsPage = lazy(() =>
  import("@/pages/app/Operations").then((m) => ({ default: m.OperationsPage }))
);
const WalletsPage = lazy(() =>
  import("@/pages/app/Wallets").then((m) => ({ default: m.WalletsPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/app/Settings").then((m) => ({ default: m.SettingsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 8_000,
      refetchOnWindowFocus: true,
    },
  },
});

function Fall() {
  return (
    <div className="flex min-h-[40dvh] items-center justify-center text-sm text-[var(--fg-muted)]">
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<Fall />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/app" element={<AppShell />}>
              <Route index element={<OverviewPage />} />
              <Route path="mission" element={<MissionPage />} />
              <Route path="mission/new" element={<MissionBuilderPage />} />
              <Route path="executions" element={<ExecutionsPage />} />
              <Route path="rescues" element={<RescuesPage />} />
              <Route path="proofs" element={<ProofsPage />} />
              <Route path="operations" element={<OperationsPage />} />
              <Route path="wallets" element={<WalletsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
