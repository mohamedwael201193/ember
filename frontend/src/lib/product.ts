import type { MissionHealthState } from "./types";

const DEMO_KEY = "ember.demoMode";

export function readDemoModePreference(): boolean | null {
  try {
    const v = localStorage.getItem(DEMO_KEY);
    if (v === "1") return true;
    if (v === "0") return false;
    return null;
  } catch {
    return null;
  }
}

export function writeDemoModePreference(on: boolean) {
  try {
    localStorage.setItem(DEMO_KEY, on ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Human mission health — never show raw enums to judges. */
export function humanState(state?: string | null): string {
  switch (state as MissionHealthState | string | undefined) {
    case "OK":
      return "Healthy";
    case "RECOVERED":
      return "Restored";
    case "MISSION_DOWN":
      return "Needs rescue";
    case "DEGRADED":
      return "At risk";
    case "RESCUING":
      return "Rescuing now";
    case "WARMING_UP":
      return "Starting up";
    default:
      return state ? String(state) : "Checking…";
  }
}

export function humanNetwork(network?: string | null): string {
  if (!network) return "Unknown network";
  if (network === "development" || network === "demo") return "Demo";
  if (network === "mainnet") return "Base mainnet";
  if (network.includes("sepolia")) return "Base Sepolia";
  return network;
}

export function paymentLabel(index: number, slot?: number | string): string {
  return `Payment ${index + 1}`;
}

export function formatUsdc(amount?: string | number | null): string {
  if (amount === undefined || amount === null || amount === "") return "—";
  return `${amount} USDC`;
}

export function cadenceLabel(minutes?: string | number | null): string {
  if (minutes === undefined || minutes === null || minutes === "") return "—";
  const n = Number(minutes);
  if (Number.isNaN(n)) return String(minutes);
  if (n === 1) return "Every minute";
  if (n < 60) return `Every ${n} minutes`;
  const h = n / 60;
  if (h === 1) return "Every hour";
  return `Every ${h} hours`;
}
