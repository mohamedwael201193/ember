import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { api } from "@/lib/api";
import { shortHash } from "@/lib/utils";
import { SvgProofChain } from "@/components/svg/SvgScene";
import { Expandable } from "@/components/Expandable";
import { ProvenanceBadge } from "@/components/ProvenanceBadge";
import { ExternalLink } from "lucide-react";
import { keeperHubExecutionUrl, ipfsGatewayUrl } from "@/lib/keeperhub";

const STAGES = [
  {
    id: "hash",
    title: "Hash",
    desc: "Take the rescue journal and fingerprint it so it can’t be quietly edited.",
  },
  {
    id: "cid",
    title: "Content id",
    desc: "Give that fingerprint a permanent name the internet can fetch.",
  },
  {
    id: "pin",
    title: "Publish",
    desc: "Pin the file so the content id stays online for anyone to verify.",
  },
  {
    id: "anchor",
    title: "Seal onchain",
    desc: "Write the proof into the continuity contract on Base.",
  },
  {
    id: "verify",
    title: "Agree",
    desc: "Hash, content id, and chain record must all match — or the proof fails.",
  },
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
  const anchorExec = typeof r?.anchorExecutionId === "string" ? r.anchorExecutionId : undefined;
  const khAnchor = keeperHubExecutionUrl(undefined, anchorExec);
  const ipfsHref = ipfsGatewayUrl(gateway, cid);

  const values: Record<string, { label: string; href?: string }> = {
    hash: { label: hash ? "Fingerprint ready" : "Waiting" },
    cid: {
      label: cid ? "Published" : "Waiting",
      href: cid ? `${gateway}${cid}` : undefined,
    },
    pin: {
      label: cid ? "Pinned & reachable" : "Waiting",
      href: cid ? `${gateway}${cid}` : undefined,
    },
    anchor: {
      label: anchor ? "Sealed on Base" : "Waiting",
      href: anchor ? `${explorer}/tx/${anchor}` : undefined,
    },
    verify: {
      label: cid && anchor && hash ? "All layers agree" : "Incomplete",
    },
  };

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Proof chain
          </h1>
          <p className="mt-2 max-w-lg text-[var(--fg-muted)]">
            Learn how a rescue becomes undeniable: fingerprint → publish → seal → agree.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ProvenanceBadge provenance={evidence.data?.provenance} />
          {ipfsHref ? (
            <a
              href={ipfsHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              Open IPFS
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
          {khAnchor ? (
            <a
              href={khAnchor}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline"
            >
              Open KeeperHub anchor execution
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>

      <SvgProofChain />

      <ol className="relative ml-3 border-l border-[var(--border)] pl-8">
        <div className="absolute -left-px bottom-6 top-6 w-px bg-gradient-to-b from-[var(--accent)] via-[#60a5fa]/60 to-emerald-500/40" />
        {STAGES.map((stage, i) => {
          const v = values[stage.id];
          return (
            <motion.li
              key={stage.id}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] py-6 last:border-b-0"
            >
              <span className="absolute -left-[41px] flex h-5 w-5 items-center justify-center rounded-full border border-[var(--accent)]/60 bg-[var(--bg)] font-mono text-[9px] text-[var(--accent)]">
                {i + 1}
              </span>
              <div className="max-w-md">
                <h2 className="font-display text-xl font-bold">{stage.title}</h2>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">{stage.desc}</p>
              </div>
              <div className="shrink-0 rounded-[4px] border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                {v.href ? (
                  <a
                    href={v.href}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
                  >
                    {v.label}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : (
                  <div className="text-sm font-medium">{v.label}</div>
                )}
              </div>
            </motion.li>
          );
        })}
      </ol>

      <Expandable summary="Technical hash / content id / anchor">
        <div className="space-y-2">
          <div>Hash {hash ? shortHash(hash, 16) : "—"}</div>
          <div>CID {cid ?? "—"}</div>
          <div>Anchor {anchor ?? "—"}</div>
          <div>Rescue {r?.rescueId ?? "—"}</div>
        </div>
      </Expandable>
    </div>
  );
}
