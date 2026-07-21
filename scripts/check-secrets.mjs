import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

function walk(directory = ".") {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "out" ||
      entry.name === "cache" ||
      entry.name === ".git" ||
      entry.name === ".cursor" ||
      entry.name === ".env"
    ) {
      continue;
    }
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

let files;
try {
  files = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"]
  })
    .split("\0")
    .filter(Boolean);
} catch {
  files = walk();
}
const patterns = [
  { name: "KeeperHub API key", value: /\bkh_(?!x{20,}\b)[A-Za-z0-9_-]{20,}\b/g },
  { name: "JWT", value: /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/g },
  {
    name: "assigned EVM private key",
    value: /(?:PRIVATE_KEY|privateKey)\s*[:=]\s*["']?0x[a-fA-F0-9]{64}\b/g
  }
];
const findings = [];

for (const file of files) {
  if (
    file.endsWith(".lock") ||
    file.startsWith("contracts/lib/") ||
    file.includes("KEEPERHUB_MASTER_REFERENCE") ||
    file.includes("KEEPERHUB_HACKATHON_INTELLIGENCE")
  ) {
    continue;
  }
  let content;
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  for (const pattern of patterns) {
    pattern.value.lastIndex = 0;
    if (pattern.value.test(content)) findings.push(`${file}: ${pattern.name}`);
  }
}

if (findings.length > 0) {
  console.error(`Secret scan failed:\n${findings.join("\n")}`);
  process.exit(1);
}
console.log(`Secret scan passed (${files.length} tracked files).`);
