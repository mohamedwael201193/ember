import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  SvgArchitecture,
  SvgFail,
  SvgProofChain,
  SvgRescueFlow,
  SvgWalletNet,
} from "@/components/svg/SvgScene";

const STEPS = [
  {
    title: "A Mission is a living payroll",
    body: "It schedules payments, watches health, and keeps evidence. Open Console to see live topology.",
    href: "/app",
    Visual: SvgArchitecture,
  },
  {
    title: "PAYDAY is the primary stream",
    body: "Org A pays on cadence. Each slot leaves a receipt you can open on Basescan.",
    href: "/app/executions",
    Visual: SvgWalletNet,
  },
  {
    title: "When agents fail, streams freeze",
    body: "Without EMBER, missed slots stay unpaid. The interface shows that freeze before rescue.",
    href: "/app/operations",
    Visual: SvgFail,
  },
  {
    title: "Rescue replays what was missed",
    body: "Observer notices. Sentinel opens. Org B replays. Then proof and anchor close the loop.",
    href: "/app/rescues",
    Visual: SvgRescueFlow,
  },
  {
    title: "Proofs make recovery auditable",
    body: "Hash, CID, pin, and Base anchor must agree. You see the chain, not a JSON blob.",
    href: "/app/proofs",
    Visual: SvgProofChain,
  },
  {
    title: "Build your own Mission",
    body: "The guided wizard starts with wallet and people, not technical knobs.",
    href: "/app/mission/new",
    Visual: SvgArchitecture,
  },
] as const;

const KEY = "ember.onboarding.v2";

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const nav = useNavigate();

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!open) return null;

  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const Visual = current.Visual;

  const finish = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 md:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboard-title"
    >
      <motion.div
        layout
        className="w-full max-w-lg overflow-hidden rounded-[4px] border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
      >
        <div className="border-b border-[var(--border)] bg-black/40 p-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Visual className="max-h-40" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full ${
                  i <= step ? "bg-[var(--accent)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 id="onboard-title" className="mt-5 font-display text-2xl font-bold">
                {current.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
                {current.body}
              </p>
              <Link
                to={current.href}
                onClick={() => {
                  if (last) finish();
                }}
                className="mt-3 inline-block text-sm text-[var(--accent)] hover:underline"
              >
                Open this surface
              </Link>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="ghost" size="sm" onClick={finish}>
              Skip
            </Button>
            <Button
              size="sm"
              variant="ink"
              onClick={() => {
                if (last) {
                  finish();
                  nav("/app");
                } else setStep((s) => s + 1);
              }}
            >
              {last ? "Enter console" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
