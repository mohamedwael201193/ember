import type { z } from "zod";
import { observerEnvSchema, paydayEnvSchema, sentinelEnvSchema } from "./schemas.js";

export function loadEnv<T extends z.ZodType>(
  schema: T,
  source: Record<string, string | undefined> = process.env
): z.output<T> {
  return schema.parse(source);
}

export function loadPaydayEnv(source: Record<string, string | undefined> = process.env) {
  return loadEnv(paydayEnvSchema, source);
}

export function loadObserverEnv(source: Record<string, string | undefined> = process.env) {
  return loadEnv(observerEnvSchema, source);
}

export function loadSentinelEnv(source: Record<string, string | undefined> = process.env) {
  return loadEnv(sentinelEnvSchema, source);
}

export function redactSecret(value: string, visibleCharacters = 4): string {
  if (visibleCharacters < 0) {
    throw new RangeError("visibleCharacters must not be negative");
  }
  return value.length <= visibleCharacters ? "***" : `${value.slice(0, visibleCharacters)}***`;
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
