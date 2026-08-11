import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawn } from "node:child_process";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

export const REQUIRED_DIRS = [
  "runtime",
  "runtime/rescues",
  "runtime/payday",
  "runtime/watcher",
  "fixtures/dev",
  "tmp"
];

export const DEFAULT_PORTS = {
  vite: 5173,
  bff: 8780,
  runtime: 10000,
  sentinel: 8787,
  observer: 8788,
  payday: 8789
};

export function loadEnvFile(path = resolve(ROOT, ".env")) {
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 1) continue;
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[line.slice(0, i).trim()] = value;
  }
  return out;
}

export function applyEnv(map) {
  for (const [k, v] of Object.entries(map)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }
}

export function isDevMode(env = process.env) {
  return env.DEVELOPMENT_MODE === "1" || env.EMBER_DEV_MODE === "1";
}

export function ensureDirs(dirs = REQUIRED_DIRS) {
  const created = [];
  for (const rel of dirs) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) {
      mkdirSync(abs, { recursive: true });
      created.push(rel);
    }
  }
  return created;
}

export function nodeMajor() {
  return Number(process.versions.node.split(".")[0]);
}

export function checkNode(min = 20) {
  const major = nodeMajor();
  return {
    ok: major >= min,
    major,
    version: process.versions.node,
    message:
      major >= min
        ? `Node.js ${process.versions.node}`
        : `Node.js ${process.versions.node} is too old (need >= ${min})`
  };
}

export function checkPnpm() {
  try {
    const version = execSync("pnpm --version", {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
    return { ok: true, version, message: `pnpm ${version}` };
  } catch {
    return {
      ok: false,
      version: null,
      message: "pnpm not found — run: corepack enable && corepack prepare pnpm@10.34.5 --activate"
    };
  }
}

export function portFree(port) {
  return new Promise((resolvePromise) => {
    const server = createServer();
    server.once("error", () => resolvePromise(false));
    server.once("listening", () => {
      server.close(() => resolvePromise(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function checkPorts(ports) {
  const results = [];
  for (const [name, port] of Object.entries(ports)) {
    const free = await portFree(port);
    results.push({
      name,
      port,
      ok: free,
      message: free ? `${name} :${port} available` : `${name} :${port} is already in use`
    });
  }
  return results;
}

export function writeIfMissing(path, contents) {
  if (existsSync(path)) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  return true;
}

export function copyIfMissing(from, to) {
  if (existsSync(to)) return false;
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  return true;
}

export function run(command, args, opts = {}) {
  return spawn(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...opts
  });
}

export function logOk(msg) {
  console.log(`  ✓ ${msg}`);
}

export function logWarn(msg) {
  console.log(`  ! ${msg}`);
}

export function logFail(msg) {
  console.log(`  ✗ ${msg}`);
}

export function logSection(title) {
  console.log(`\n▸ ${title}`);
}
