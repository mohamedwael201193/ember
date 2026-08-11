#!/usr/bin/env node
/** Continuity-guardian setup — no secrets required. */
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, ".env.example");
const envPath = join(root, ".env");

if (!existsSync(envPath) && existsSync(example)) {
  copyFileSync(example, envPath);
  console.log("Created .env from .env.example (optional overrides only).");
} else if (existsSync(envPath)) {
  console.log(".env already present — left unchanged.");
} else {
  console.log("No .env.example found — nothing to copy.");
}

console.log("Setup complete. Run: pnpm doctor && pnpm inspect");
console.log("WRITE_MODE stays off by default. No mainnet writes from this example.");
