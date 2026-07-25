import { useCallback, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { readDemoModePreference, writeDemoModePreference } from "@/lib/product";

/**
 * Demo Mode shows the verified snapshot story (instant, deterministic).
 * Live Mode follows the connected runtime.
 *
 * Preference:
 * - localStorage ember.demoMode = "1" | "0" when the user toggles
 * - otherwise: follow BFF developmentMode (dev stack → demo)
 */
export function useDemoMode() {
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });
  const [forced, setForced] = useState<boolean | null>(() => readDemoModePreference());

  useEffect(() => {
    const onStorage = () => setForced(readDemoModePreference());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const backendDev = Boolean(cfg.data?.developmentMode);
  const isDemo = forced !== null ? forced : backendDev;

  const setDemo = useCallback((on: boolean) => {
    writeDemoModePreference(on);
    setForced(on);
  }, []);

  return {
    isDemo,
    backendDev,
    setDemo,
    ready: !cfg.isLoading,
  };
}
