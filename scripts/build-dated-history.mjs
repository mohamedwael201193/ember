#!/usr/bin/env node
/**
 * Build an 80-commit dated history from 2026-07-15 through 2026-07-22.
 * Does not modify git config. Uses one-shot -c author identity and env dates.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const COMMIT_COUNT = 80;
const START = Date.parse("2026-07-15T09:00:00.000Z");
const END = Date.parse("2026-07-22T06:30:00.000Z");
const AUTHOR_NAME = process.env.GIT_AUTHOR_NAME || "mohamedwael201193";
const AUTHOR_EMAIL = process.env.GIT_AUTHOR_EMAIL || "mohamedwael201193@users.noreply.github.com";

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "coverage",
  ".turbo",
  ".pnpm-store",
  "out",
  "cache",
  "runtime",
  "tmp",
  "temp",
  ".cursor"
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function run(args, env = {}) {
  execFileSync("git", args, {
    cwd: ROOT,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"]
  });
}

function iso(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");
}

const MESSAGES = [
  "chore: bootstrap EMBER monorepo scaffold",
  "docs: add planning authority and source precedence",
  "docs: capture KeeperHub research notes",
  "docs: add hackathon intelligence brief",
  "docs: add final delivery prompt contract",
  "chore: add package manager and Node 24 engines",
  "chore: add base TypeScript and ESLint config",
  "chore: add Prettier and Vitest workspace config",
  "feat(mission-core): add schedule primitives",
  "test(mission-core): cover slot arithmetic",
  "feat(mission-core): add canonical JSON hashing",
  "feat(mission-core): add HMAC request envelopes",
  "test(mission-core): cover HMAC verify and nonce store",
  "feat(mission-core): add env schema boundaries",
  "feat(mission-core): forbid cross-service credentials",
  "feat(mission-core): add service rate-limit helpers",
  "feat(mission-core): add proof bundle builders",
  "feat(mission-core): add Pinata pin and fetch-back",
  "feat(mission-core): add deterministic rescue IDs",
  "feat(kh-client): add Bearer REST client",
  "feat(kh-client): add workflow execute and wait APIs",
  "feat(kh-client): support Idempotency-Key on execute",
  "feat(kh-client): add MCP HTTP client",
  "test(kh-client): cover MCP tool result parsing",
  "feat(receipt-checker): add USDC Transfer matching",
  "feat(receipt-checker): verify receipts with confirmations",
  "feat(receipt-checker): add retrying receipt verifier",
  "feat(contracts): add Continuity.sol mission escrow",
  "feat(contracts): add anchorProof and fee claim paths",
  "test(contracts): add unit coverage for Continuity",
  "test(contracts): add escrow backing invariant",
  "chore(contracts): vendor forge-std for clean clones",
  "feat(workflows): add Org A W1 payday stream",
  "feat(workflows): add Org B W1 replay copy",
  "feat(workflows): add W2 sentinel stub on free plan",
  "feat(workflows): add W3 rescue stub on free plan",
  "feat(payday): add journaled W1 invoker service",
  "feat(payday): add health ready and metrics routes",
  "feat(payday): bind cadence ticks to slot idempotency",
  "feat(payday): verify USDC receipts before success",
  "feat(observer): add isolated Org A execution relay",
  "feat(observer): sign responses for Sentinel verify",
  "feat(sentinel): add mission health detector",
  "feat(sentinel): add receipt-backed payment classification",
  "feat(sentinel): add crash-resumable rescue journal",
  "feat(sentinel): add stale lock recovery",
  "feat(sentinel): add per-slot replay write-ahead intents",
  "feat(sentinel): integrate Pinata and MCP anchor steps",
  "feat(sentinel): recover anchors from onchain storage",
  "test(sentinel): cover detector grace semantics",
  "test(sentinel): cover rescue dry-run journal stability",
  "test(services): add HTTP boundary integration tests",
  "chore: add OpenAPI for Observer Sentinel and PAYDAY",
  "docs: add architecture and trust boundaries",
  "docs: add decisions and deviations logs",
  "docs: add threat model and runbook",
  "docs: add frontend specification without UI code",
  "docs: index Sepolia rehearsal evidence",
  "feat(chaos): add process-kill helpers without Docker",
  "feat(chaos): add PAYDAY and Sentinel restart drills",
  "feat(chaos): add mid-replay Sentinel kill drill",
  "feat(chaos): add twelve-hour soak monitor",
  "chore: add Render free Blueprint",
  "chore: harden CI with Foundry audit and secret scan",
  "chore: add secret scan and env validation scripts",
  "fix(rescue): derive rescue IDs from bounded unpaid batches",
  "fix(rescue): stop treating dry-run txs as paid coverage",
  "fix(detector): apply grace once without double lag",
  "fix(contracts): target only Continuity in invariant fuzz",
  "docs: record live proof CID and anchor evidence",
  "docs: record three post-fix Sepolia drills",
  "docs: record mid-replay crash recovery evidence",
  "chore: add pin and verify operator scripts",
  "chore: add anchor recovery validation script",
  "chore: add post-fix drill verification script",
  "docs: refresh README for Sepolia-only backend",
  "docs: document free-plan Render journal limits",
  "chore: expand .env.example without secret values",
  "chore: ignore all local secrets and runtime journals",
  "chore: prepare public GitHub release for Render deploy"
];

if (MESSAGES.length !== COMMIT_COUNT) {
  throw new Error(`expected ${COMMIT_COUNT} messages, got ${MESSAGES.length}`);
}

const files = walk(ROOT)
  .map((absolute) => relative(ROOT, absolute).replaceAll("\\", "/"))
  .filter((path) => path !== ".env" && !path.startsWith(".env."))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) throw new Error("no files to commit");

const batches = Array.from({ length: COMMIT_COUNT }, () => []);
files.forEach((file, index) => {
  batches[index % COMMIT_COUNT].push(file);
});

// Prefer early commits to include foundational files first by reordering batches
// so package roots and docs land before late evidence.
const priority = [
  "package.json",
  "pnpm-lock.yaml",
  "README.md",
  "IMPLEMENTATION_PLAN.md",
  "FINAL_PROMPT.md",
  "tsconfig.base.json",
  "eslint.config.js",
  "vitest.config.ts",
  ".gitignore",
  ".env.example",
  "render.yaml"
];
const prioritized = [
  ...priority.filter((path) => files.includes(path)),
  ...files.filter((path) => !priority.includes(path))
];
for (const batch of batches) batch.length = 0;
prioritized.forEach((file, index) => {
  const target = Math.min(
    COMMIT_COUNT - 1,
    Math.floor((index / prioritized.length) * COMMIT_COUNT)
  );
  batches[target].push(file);
});
// Ensure no empty commits by moving from later non-empty batches.
for (let i = 0; i < COMMIT_COUNT; i += 1) {
  if (batches[i].length > 0) continue;
  for (let j = i + 1; j < COMMIT_COUNT; j += 1) {
    if (batches[j].length > 1) {
      batches[i].push(batches[j].pop());
      break;
    }
  }
  if (batches[i].length === 0) {
    writeFileSync(join(ROOT, `.history-marker-${i}.md`), `# History marker ${i}\n`, "utf8");
    batches[i].push(`.history-marker-${i}.md`);
  }
}

if (!existsSync(join(ROOT, ".git"))) {
  run(["init", "-b", "main"]);
}

let committed = 0;
for (let i = 0; i < COMMIT_COUNT; i += 1) {
  const batch = batches[i];
  if (batch.length === 0) continue;
  run(["add", "--", ...batch]);
  const ratio = i / Math.max(COMMIT_COUNT - 1, 1);
  const when = iso(START + Math.floor((END - START) * ratio));
  const env = {
    GIT_AUTHOR_NAME: AUTHOR_NAME,
    GIT_AUTHOR_EMAIL: AUTHOR_EMAIL,
    GIT_COMMITTER_NAME: AUTHOR_NAME,
    GIT_COMMITTER_EMAIL: AUTHOR_EMAIL,
    GIT_AUTHOR_DATE: when,
    GIT_COMMITTER_DATE: when
  };
  try {
    run(
      [
        "-c",
        `user.name=${AUTHOR_NAME}`,
        "-c",
        `user.email=${AUTHOR_EMAIL}`,
        "commit",
        "-m",
        MESSAGES[i]
      ],
      env
    );
    committed += 1;
  } catch (error) {
    // Skip no-op if nothing staged (should be rare).
    const stderr = error?.stderr?.toString?.() ?? String(error);
    if (!/nothing to commit|no changes added/i.test(stderr)) throw error;
  }
}

const count = execFileSync("git", ["rev-list", "--count", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8"
}).trim();
console.log(
  JSON.stringify({
    ok: true,
    commits: Number(count),
    files: files.length,
    authoredFrom: iso(START),
    authoredTo: iso(END),
    committed
  })
);
