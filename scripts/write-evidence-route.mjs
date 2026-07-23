import { mkdirSync, writeFileSync, readFileSync, unlinkSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const payday = JSON.parse(
  readFileSync(resolve(root, "docs/evidence/mainnet-payday-slots-2026-07-23.json"), "utf8")
);
const rescue = JSON.parse(
  readFileSync(resolve(root, "docs/evidence/mainnet-rescue-2026-07-23.json"), "utf8")
);
const journal = rescue.journal || null;
const data = {
  continuity: payday.continuity || "0x068bB96e849F0DE3D49944Ec0F4aEd3D6B165770",
  missionId: String(payday.missionId || journal?.missionId || "1"),
  chainId: payday.chainId || 8453,
  network: payday.network || "mainnet",
  paydaySlots: payday.slots || [],
  balances: payday.balances,
  rescue: journal,
  proofCid: journal?.proofCid,
  anchorTx: journal?.anchorTxHash,
  rescueId: journal?.rescueId,
};

const dir = resolve(root, "frontend/api/evidence");
mkdirSync(dir, { recursive: true });
const out = `import type { VercelRequest, VercelResponse } from "@vercel/node";

const data = ${JSON.stringify(data, null, 2)} as const;

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.status(200).json(data);
}
`;
writeFileSync(resolve(dir, "mainnet.ts"), out);

const bad = resolve(root, "frontend/api/evidence.ts");
if (existsSync(bad)) unlinkSync(bad);

const vercelPath = resolve(root, "frontend/vercel.json");
const vercel = JSON.parse(readFileSync(vercelPath, "utf8"));
vercel.rewrites = [
  {
    source: "/((?!api/).*)",
    destination: "/index.html",
  },
];
writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`);
console.log("wrote api/evidence/mainnet.ts", out.length);
