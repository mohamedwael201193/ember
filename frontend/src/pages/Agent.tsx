import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Copy, ExternalLink } from "lucide-react";

type SectionId =
  | "connect"
  | "verify"
  | "inspect"
  | "validate"
  | "safe"
  | "use"
  | "troubleshoot";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "connect", label: "Connect" },
  { id: "verify", label: "Verify" },
  { id: "inspect", label: "Inspect" },
  { id: "validate", label: "Validate" },
  { id: "safe", label: "Safe test" },
  { id: "use", label: "Use EMBER" },
  { id: "troubleshoot", label: "Troubleshoot" },
];

const CURSOR_CONFIG = `{
  "mcpServers": {
    "keeperhub-org-a": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://app.keeperhub.com/mcp",
        "--header",
        "Authorization: Bearer \${KH_API_KEY_PRIMARY_OBSERVER}",
        "--transport",
        "http-only"
      ]
    },
    "keeperhub-org-b": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote@latest",
        "https://app.keeperhub.com/mcp",
        "--header",
        "Authorization: Bearer \${KH_API_KEY_STANDBY}",
        "--transport",
        "http-only"
      ]
    }
  }
}`;

const CLAUDE_OAUTH = `claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp`;

const CLAUDE_BEARER = `claude mcp add --transport http --scope user keeperhub https://app.keeperhub.com/mcp \\
  --header "Authorization: Bearer kh_YOUR_ORG_KEY"`;

const PROMPTS = {
  inspect: `Inspect the EMBER primary payroll workflow in KeeperHub. Do not execute anything. Explain the workflow, organization, network, wallet, trigger, action, and latest execution.

Workflow ID: 5goaid2zjgzyb32661se3 (payday-stream-mainnet)`,
  validate: `Validate the EMBER primary workflow 5goaid2zjgzyb32661se3 with KeeperHub MCP. Do not enable schedules or create writes. Explain every warning or error.`,
  safe: `Run the documented EMBER smoke workflow only: vewqfp44zmpa9dtctlrdr. Do not execute any payroll workflow. Wait for completion via get_execution and return executionId, status, logs, and confirmation that no USDC transfer occurred.`,
  read: `Get execution <EXECUTION_ID> via get_execution and explain the status, steps, errors, transaction hashes, and whether it was a read or write path. Do not re-execute.`,
  orgs: `Inspect both Ember KeeperHub organizations (keeperhub-org-a and keeperhub-org-b) and explain which is primary and which is standby. Do not execute anything.`,
  recovery: `Using read-only tools, inspect primary workflow 5goaid2zjgzyb32661se3 and replay workflow pvhwggqr8318wac68jb62. Explain how EMBER would recover a missed obligation. Do not execute anything.`,
  troubleshoot: `I cannot see EMBER workflows. Diagnose MCP authentication, organization scoping, key type (kh_ vs wfb_), and whether a second MCP connection is required. Do not execute anything.`,
  production: `Verify EMBER production health without KeeperHub writes: GET https://ember-web-seven.vercel.app/ and https://ember-api-8qzg.onrender.com/healthz and /readyz. Summarize status.`,
  warnPrimary: `WARNING: This can move real USDC on Base mainnet.
Only if I already typed I CONFIRM MAINNET WRITE: execute primary workflow 5goaid2zjgzyb32661se3 once with a unique idempotency_key, poll get_execution, and return executionId + transactionHashes. Otherwise refuse.`,
};

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* ignore */
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 rounded-[4px] border border-white/15 px-3 py-1.5 text-xs text-[#d4d4d8] hover:border-white/30 hover:text-white"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label ?? "Copy"}
    </button>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="overflow-x-auto rounded-[4px] border border-white/10 bg-[#0c0c0e] p-4 text-[11px] leading-relaxed text-[#e4e4e7]">
      <code>{code}</code>
    </pre>
  );
}

function PromptCard({
  title,
  body,
  warning,
}: {
  title: string;
  body: string;
  warning?: boolean;
}) {
  return (
    <div
      className={`rounded-[4px] border p-4 ${
        warning ? "border-amber-500/40 bg-amber-500/5" : "border-white/10 bg-[#111113]"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-sm font-bold tracking-tight">{title}</h3>
        <CopyButton text={body} label="Copy prompt" />
      </div>
      {warning ? (
        <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-amber-300">
          Warning — can move real funds. Human confirmation required.
        </p>
      ) : null}
      <p className="whitespace-pre-wrap text-xs leading-relaxed text-[#a1a1aa]">{body}</p>
    </div>
  );
}

export function AgentPage() {
  const [active, setActive] = useState<SectionId>("connect");

  return (
    <div className="min-h-dvh bg-[#09090b] text-[#fafafa]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#09090b]/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5 md:px-8">
          <Link to="/" className="font-display text-lg font-bold tracking-tight">
            EMBER
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <Link to="/" className="text-[#a1a1aa] hover:text-white">
              Home
            </Link>
            <Link to="/app" className="text-[#a1a1aa] hover:text-white">
              Console
            </Link>
            <a
              href="https://docs.keeperhub.com/agent/mcp-server"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[#a1a1aa] hover:text-white"
            >
              KeeperHub docs
              <ExternalLink className="h-3 w-3" />
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#ff5c1a]">
          Agent / MCP
        </p>
        <h1 className="mt-3 font-display max-w-3xl text-4xl font-extrabold tracking-tight md:text-5xl">
          Connect your AI agent to KeeperHub.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#a1a1aa]">
          Connect Cursor or Claude Code to KeeperHub MCP so the agent can inspect, validate,
          and safely test Ember-compatible workflows. KeeperHub executes onchain. EMBER keeps
          the mission alive.
        </p>
        <p className="mt-3 max-w-2xl text-sm text-[#71717a]">
          EMBER does not expose a separate MCP server for the normal architecture. Your agent
          talks to{" "}
          <span className="font-mono text-[#d4d4d8]">https://app.keeperhub.com/mcp</span>.
        </p>

        <div className="mt-10 grid gap-3 rounded-[4px] border border-white/10 bg-[#111113] p-5 md:grid-cols-6 md:gap-2">
          {["AGENT", "KEEPERHUB MCP", "WORKFLOW", "ONCHAIN", "EMBER", "PROOF"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex-1 rounded-[4px] border border-white/10 px-2 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-[#d4d4d8]">
                {s}
              </div>
              {i < 5 ? (
                <ArrowRight className="hidden h-3.5 w-3.5 shrink-0 text-[#52525b] md:block" />
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setActive(s.id);
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={`rounded-[4px] border px-3 py-1.5 text-xs ${
                active === s.id
                  ? "border-[#ff5c1a] text-[#ff5c1a]"
                  : "border-white/10 text-[#a1a1aa] hover:border-white/25"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[4px] border border-white/10 p-6">
            <h2 className="font-display text-xl font-bold">What EMBER does</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
              Detects missed payment obligations, classifies unpaid slots, replays them through
              an isolated standby organization, journals recovery exactly once, pins proof to
              IPFS, and anchors Continuity.sol on Base.
            </p>
          </div>
          <div className="rounded-[4px] border border-white/10 p-6">
            <h2 className="font-display text-xl font-bold">What KeeperHub does</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#a1a1aa]">
              Runs the workflow, signs with the managed wallet, pays gas, simulates, retries
              requested runs, and records Runs / audit history. That is the onchain execution
              layer.
            </p>
          </div>
        </section>

        <section id="connect" className="mt-16 scroll-mt-24 space-y-6">
          <h2 className="font-display text-3xl font-bold tracking-tight">Connect</h2>
          <p className="max-w-2xl text-sm text-[#a1a1aa]">
            Remote MCP is the official recommended path. Auth: browser OAuth or organisation
            Bearer <span className="font-mono">kh_…</span> keys (not <span className="font-mono">wfb_</span>).
            One MCP connection = one organization.
          </p>

          <div className="rounded-[4px] border border-white/10 bg-[#111113] p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold">Cursor (Org A + Org B)</h3>
              <CopyButton text={CURSOR_CONFIG} />
            </div>
            <p className="mb-3 text-xs text-[#71717a]">
              Put this in local <span className="font-mono">.cursor/mcp.json</span> (gitignored).
              Set env vars — never paste real keys into chat.
            </p>
            <CodeBlock code={CURSOR_CONFIG} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[4px] border border-white/10 bg-[#111113] p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-display font-bold">Claude Code · OAuth</h3>
                <CopyButton text={CLAUDE_OAUTH} />
              </div>
              <CodeBlock code={CLAUDE_OAUTH} />
              <p className="mt-3 text-xs text-[#71717a]">Then run /mcp inside Claude Code and approve.</p>
            </div>
            <div className="rounded-[4px] border border-white/10 bg-[#111113] p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="font-display font-bold">Claude Code · Bearer</h3>
                <CopyButton text={CLAUDE_BEARER} />
              </div>
              <CodeBlock code={CLAUDE_BEARER} />
            </div>
          </div>

          <div className="rounded-[4px] border border-white/10 p-5">
            <h3 className="font-display font-bold">Org A vs Org B</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#a1a1aa]">
              <li>
                <span className="text-white">Org A</span> — primary payday executor
                (workflow <span className="font-mono text-xs">5goaid2zjgzyb32661se3</span>)
              </li>
              <li>
                <span className="text-white">Org B</span> — standby / replay executor
                (workflow <span className="font-mono text-xs">pvhwggqr8318wac68jb62</span>)
              </li>
              <li>
                One MCP connection cannot see both private orgs. Add two server entries for full
                recovery inspection.
              </li>
            </ul>
          </div>
        </section>

        <section id="verify" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Verify</h2>
          <p className="text-sm text-[#a1a1aa]">
            Expected result: tools appear, workflows list includes{" "}
            <span className="font-mono text-xs">payday-stream-mainnet</span> and{" "}
            <span className="font-mono text-xs">EMBER MCP Smoke Test</span>.
          </p>
          <PromptCard
            title="Verify connection"
            body={`Call tools_documentation. Summarize the safe inspect → validate → execute → get_execution loop. Do not execute anything.`}
          />
        </section>

        <section id="inspect" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Inspect</h2>
          <PromptCard title="Inspect primary workflow" body={PROMPTS.inspect} />
          <PromptCard title="Inspect Org A / Org B" body={PROMPTS.orgs} />
          <PromptCard title="Recovery inspection (read-only)" body={PROMPTS.recovery} />
        </section>

        <section id="validate" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Validate</h2>
          <PromptCard title="Validate primary workflow" body={PROMPTS.validate} />
        </section>

        <section id="safe" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Safe test</h2>
          <p className="text-sm text-[#a1a1aa]">
            Smoke workflow <span className="font-mono text-xs">vewqfp44zmpa9dtctlrdr</span> is a
            Base Sepolia ETH balance check — no USDC transfer. This website never executes
            KeeperHub writes for you.
          </p>
          <PromptCard title="Safe smoke test" body={PROMPTS.safe} />
          <PromptCard title="Read execution" body={PROMPTS.read} />
        </section>

        <section id="use" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Use EMBER</h2>
          <p className="text-sm text-[#a1a1aa]">
            After a KeeperHub Run lands, open the console to see mission health, rescue story,
            and proof. EMBER orchestrates continuity; KeeperHub remains the execution engine.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex h-10 items-center gap-2 rounded-[4px] bg-[#ff5c1a] px-4 text-sm font-medium text-white"
            >
              Open console
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/rescues"
              className="inline-flex h-10 items-center rounded-[4px] border border-white/15 px-4 text-sm"
            >
              Rescue
            </Link>
            <Link
              to="/app/proofs"
              className="inline-flex h-10 items-center rounded-[4px] border border-white/15 px-4 text-sm"
            >
              Proofs
            </Link>
            <a
              href="https://app.keeperhub.com/workflows/5goaid2zjgzyb32661se3"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center gap-1.5 rounded-[4px] border border-white/15 px-4 text-sm"
            >
              KeeperHub primary
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <PromptCard title="Production check (read-only)" body={PROMPTS.production} />
        </section>

        <section id="troubleshoot" className="mt-16 scroll-mt-24 space-y-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Troubleshoot</h2>
          <PromptCard title="Diagnose MCP" body={PROMPTS.troubleshoot} />
          <ul className="space-y-2 text-sm text-[#a1a1aa]">
            <li>401 → wrong key type or missing Bearer</li>
            <li>Empty list → wrong org on this MCP connection</li>
            <li>Org B invisible → add a second MCP server entry</li>
            <li>
              Per-workflow MCP (<span className="font-mono text-xs">/mcp/w/&lt;slug&gt;</span>) only
              applies to <span className="text-white">listed</span> marketplace workflows. EMBER
              payroll workflows stay private — use the aggregate MCP server.
            </li>
          </ul>
        </section>

        <section className="mt-16 space-y-4 rounded-[4px] border border-amber-500/30 bg-amber-500/5 p-6">
          <h2 className="font-display text-2xl font-bold text-amber-100">Spend warnings</h2>
          <p className="text-sm text-amber-100/80">
            The website never triggers payroll executions. If you ask an agent to run a USDC
            workflow, require an explicit typed confirmation.
          </p>
          <PromptCard title="Primary payroll (dangerous)" body={PROMPTS.warnPrimary} warning />
        </section>

        <footer className="mt-20 border-t border-white/10 pt-8 text-sm text-[#71717a]">
          <p>
            KeeperHub executes. EMBER keeps the mission alive. ·{" "}
            <a
              className="text-[#a1a1aa] hover:text-white"
              href="https://docs.keeperhub.com/agent/mcp-server"
              target="_blank"
              rel="noreferrer"
            >
              Official MCP docs
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
