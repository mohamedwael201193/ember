import { createHash } from "node:crypto";

export type CanonicalValue =
  null | boolean | number | string | CanonicalValue[] | { [key: string]: CanonicalValue };

export function deterministicJson(value: CanonicalValue): string {
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new TypeError("canonical JSON cannot encode non-finite numbers");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(deterministicJson).join(",")}]`;

  const properties = Object.keys(value).sort();
  return `{${properties.map((key) => `${JSON.stringify(key)}:${deterministicJson(value[key]!)}`).join(",")}}`;
}

export function sha256Hex(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

export function canonicalSha256(value: CanonicalValue): string {
  return sha256Hex(deterministicJson(value));
}
