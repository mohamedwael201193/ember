import { readFileSync, writeFileSync } from "node:fs";
import { canonicalSha256, type CanonicalValue } from "../packages/mission-core/src/canonicalize.js";

const path = process.argv[2] ?? "workflows/w1-payday-stream.json";
const raw = JSON.parse(readFileSync(path, "utf8")) as {
  name: string;
  description?: string;
  nodes: unknown[];
  edges: unknown[];
};

const canonical: CanonicalValue = {
  name: raw.name,
  description: raw.description ?? "",
  nodes: raw.nodes as CanonicalValue,
  edges: raw.edges as CanonicalValue
};

const hash = canonicalSha256(canonical);
const hex = `0x${hash}`;
console.log(hex);
writeFileSync("workflows/w1-payday-stream.canonical-hash.txt", `${hex}\n`);
