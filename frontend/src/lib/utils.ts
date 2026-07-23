import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortHash(value?: string | null, size = 6): string {
  if (!value) return "-";
  if (value.length <= size * 2 + 2) return value;
  return `${value.slice(0, size + 2)}...${value.slice(-size)}`;
}

export function formatUtc(iso?: string | number | null): string {
  if (iso === undefined || iso === null) return "-";
  const d = typeof iso === "number" ? new Date(iso * 1000) : new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toISOString().replace(".000Z", "Z");
}
