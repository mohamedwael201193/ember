import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { SvgProofChain } from "@/components/svg/SvgScene";
import { ExternalLink } from "lucide-react";

const STAGES = [
  { id: "hash", title: "Hash", desc: "Local SHA-256 of the rescue journal" },
  { id: "cid", title: "CID", desc: "Content identifier for the proof blob" },
  { id: "pin", title: "Pinata", desc: "Pinned so the CID stays reachable" },
  { id: "anchor", title: "Anchor", desc: "Transaction sealed on Base" },
  { id: "verify", title: "Verify", desc: "Hash, CID, and chain must agree" },
] as const;

export function ProofsPage() {
  const evidence = useQuery({ queryKey: ["evidence"], queryFn: api.evidence });
  const cfg = useQuery({ queryKey: ["config"], queryFn: api.config });
  const r = evidence.data?.rescue;
  const gateway = cfg.data?.ipfsGateway ?? "https://ipfs.io/ipfs/";
  const explorer = cfg.data?.explorerBase ?? "https://basescan.org";
  const cid = r?.proofCid ?? evidence.data?.proofCid;
  const anchor = r?.anchorTxHash ?? evidence.data?.anchorTx;
  const hash = r?.proofHash ?? r?.proofSha256;

  const values: Record<string, { label: string; href?: string }> = {
    hash: { label: hash ? shortHash(hash, 12) : "pending" },
    cid: {
      label: cid ? shortHash(cid, 12) : "pending",
      href: cid ? `${gateway}${cid}` : undefined,
    },
    pin: {
      label: cid ? "Pinned" : "pending",
      href: cid ? `${gateway}${cid}` : undefined,
    },
    anchor: {
      label: anchor ? shortHash(anchor, 10) : "pending",
      href: anchor ? `${explorer}/tx/${anchor}` : undefined,
    },
    verify: {
      label: cid && anchor && hash ? "Matched" : "Incomplete",
    },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Proof chain
        </h1>
        <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
          See creation, pin, and anchor. No JSON required to understand the loop.
        </p>
      </div>

      <SvgProofChain />

      <ol className="relative space-y-0">
        <div className="absolute bottom-4 left-[15px] top-4 w-px bg-gradient-to-b from-[var(--accent)] via-[#60a5fa]/50 to-transparent md:left-1/2" />
        {STAGES.map((stage, i) => {
          const v = values[stage.id];
          const left = i % 2 === 0;
          return (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`relative grid items-center gap-4 py-6 md:grid-cols-2 ${
                left ? "" : "md:[&>*:first-child]:order-2"
              }`}
            >
              <div className={`${left ? "md:pr-12 md:text-right" : "md:pl-12"}`}>
                <h2 className="font-display text-xl font-bold">{stage.title}</h2>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{stage.desc}</p>
              </div>
              <div
                className={`relative rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-5 ${
                  left ? "md:ml-8" : "md:mr-8"
                }`}
              >
                <span className="absolute left-[-23px] top-1/2 hidden h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)] md:left-auto md:right-full md:block md:translate-x-1/2" />
                {v.href ? (
                  <a
                    href={v.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 break-all font-mono text-sm text-[var(--accent)] hover:underline"
                  >
                    {v.label}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="font-mono text-sm">{v.label}</div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      {evidence.isLoading && (
        <div className="h-24 animate-pulse rounded bg-white/5" />
      )}

      {r?.rescueId && (
        <p className="font-mono text-[11px] text-[var(--fg-muted)]">
          Rescue {shortHash(r.rescueId, 14)}
        </p>
      )}
    </div>
  );
}
