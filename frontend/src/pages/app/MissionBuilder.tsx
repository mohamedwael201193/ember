import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SvgWalletNet, SvgRescueFlow } from "@/components/svg/SvgScene";
import { cn } from "@/lib/utils";
import { cadenceLabel, formatUsdc } from "@/lib/product";

const STEPS = [
  { key: "wallet", label: "Payer" },
  { key: "employee", label: "Person" },
  { key: "payto", label: "Pay to" },
  { key: "rhythm", label: "Rhythm" },
  { key: "backup", label: "Backup" },
  { key: "review", label: "Review" },
] as const;

type Draft = {
  walletLabel: string;
  employeeName: string;
  beneficiary: string;
  amountUsdc: string;
  cadenceMin: string;
  recoveryOrg: string;
};

const initial: Draft = {
  walletLabel: "Primary payroll wallet",
  employeeName: "",
  beneficiary: "",
  amountUsdc: "0.01",
  cadenceMin: "5",
  recoveryOrg: "Standby rescue org",
};

export function MissionBuilderPage() {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(initial);
  const nav = useNavigate();

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const canNext =
    step === 0 ||
    (step === 1 && draft.employeeName.trim().length > 1) ||
    (step === 2 && draft.beneficiary.trim().length > 1) ||
    step === 3 ||
    step === 4 ||
    step === 5;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/app"
        className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Console
      </Link>

      <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Create a mission
      </h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Six calm steps. Each one answers why EMBER keeps payroll alive.
      </p>

      <ol className="mt-10 flex flex-wrap gap-2">
        {STEPS.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              "rounded-[4px] border px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider",
              i === step
                ? "border-[var(--accent)] text-[var(--accent)]"
                : i < step
                  ? "border-white/20 text-[var(--fg)]"
                  : "border-[var(--border)] text-[var(--fg-muted)]"
            )}
          >
            {i < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
            {s.label}
          </li>
        ))}
      </ol>

      <div className="mt-10 min-h-[320px] rounded-[4px] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <StepFrame
                title="Who pays?"
                why="This is the primary wallet. It funds the scheduled payroll while everything is healthy."
              >
                <SvgWalletNet />
                <Field
                  label="Payer nickname"
                  value={draft.walletLabel}
                  onChange={(v) => setDraft({ ...draft, walletLabel: v })}
                />
              </StepFrame>
            )}
            {step === 1 && (
              <StepFrame
                title="Who is getting paid?"
                why="Give the person a name you recognize. Addresses stay optional until you deploy."
              >
                <Field
                  label="Person"
                  value={draft.employeeName}
                  onChange={(v) => setDraft({ ...draft, employeeName: v })}
                  placeholder="Alex Rivera"
                />
              </StepFrame>
            )}
            {step === 2 && (
              <StepFrame
                title="Where should money arrive?"
                why="The wallet that still receives payroll even if the primary workflow fails."
              >
                <Field
                  label="Destination address"
                  value={draft.beneficiary}
                  onChange={(v) => setDraft({ ...draft, beneficiary: v })}
                  placeholder="0x… or name.eth"
                />
              </StepFrame>
            )}
            {step === 3 && (
              <StepFrame
                title="How often should they be paid?"
                why="Keep the rhythm simple. EMBER verifies each payment with an onchain receipt."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Amount each time"
                    value={draft.amountUsdc}
                    onChange={(v) => setDraft({ ...draft, amountUsdc: v })}
                  />
                  <Field
                    label="Minutes between payments"
                    value={draft.cadenceMin}
                    onChange={(v) => setDraft({ ...draft, cadenceMin: v })}
                  />
                </div>
                <p className="text-sm text-[var(--fg-muted)]">
                  Preview: {formatUsdc(draft.amountUsdc)} · {cadenceLabel(draft.cadenceMin)}
                </p>
              </StepFrame>
            )}
            {step === 4 && (
              <StepFrame
                title="Who restores payroll if the primary agent dies?"
                why="The standby organization that automatically restores unpaid payments — then seals proof."
              >
                <SvgRescueFlow />
                <Field
                  label="Backup organization"
                  value={draft.recoveryOrg}
                  onChange={(v) => setDraft({ ...draft, recoveryOrg: v })}
                />
              </StepFrame>
            )}
            {step === 5 && (
              <StepFrame
                title="Looks right?"
                why="This draft stays on your device until you connect a signed deploy path. Review the story first."
              >
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ["Payer", draft.walletLabel],
                      ["Person", draft.employeeName || "—"],
                      ["Destination", draft.beneficiary || "—"],
                      ["Amount", formatUsdc(draft.amountUsdc)],
                      ["Rhythm", cadenceLabel(draft.cadenceMin)],
                      ["Backup", draft.recoveryOrg],
                    ] as const
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-[var(--border)] pb-2"
                    >
                      <dt className="text-[var(--fg-muted)]">{k}</dt>
                      <dd className="max-w-[60%] break-all text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </StepFrame>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-between">
        <Button variant="ghost" onClick={back} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button variant="ink" onClick={next} disabled={!canNext}>
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              try {
                localStorage.setItem("ember.mission.draft", JSON.stringify(draft));
              } catch {
                /* ignore */
              }
              nav("/app/mission");
            }}
          >
            Save draft · open overview
          </Button>
        )}
      </div>
    </div>
  );
}

function StepFrame({
  title,
  why,
  children,
}: {
  title: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{why}</p>
      <div className="mt-8 space-y-6">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-[var(--fg-muted)]">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[4px] border border-[var(--border)] bg-[var(--bg)] px-3 text-sm text-[var(--fg)] outline-none focus-visible:border-[var(--accent)]"
      />
    </label>
  );
}
