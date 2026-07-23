import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SvgWalletNet, SvgRescueFlow } from "@/components/svg/SvgScene";
import { cn } from "@/lib/utils";

const STEPS = [
  "Wallet",
  "Employee",
  "Beneficiary",
  "Payroll",
  "Recovery",
  "Review",
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
  walletLabel: "Org A primary",
  employeeName: "",
  beneficiary: "",
  amountUsdc: "0.01",
  cadenceMin: "5",
  recoveryOrg: "Org B guardian",
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
        Mission builder
      </h1>
      <p className="mt-2 text-[var(--fg-muted)]">
        Six visual steps. Deploy when the story looks right.
      </p>

      {/* progress */}
      <ol className="mt-10 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={cn(
              "rounded-[4px] border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider",
              i === step
                ? "border-[var(--accent)] text-[var(--accent)]"
                : i < step
                  ? "border-white/20 text-[var(--fg)]"
                  : "border-[var(--border)] text-[var(--fg-muted)]"
            )}
          >
            {i < step ? <Check className="mr-1 inline h-3 w-3" /> : null}
            {label}
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
                title="Connect the paying wallet"
                body="This is Org A. It funds the scheduled stream."
              >
                <SvgWalletNet className="max-h-56" />
                <Field
                  label="Wallet label"
                  value={draft.walletLabel}
                  onChange={(v) => setDraft({ ...draft, walletLabel: v })}
                />
              </StepFrame>
            )}
            {step === 1 && (
              <StepFrame
                title="Who receives the payroll?"
                body="Name the employee. Address comes next."
              >
                <Field
                  label="Employee name"
                  value={draft.employeeName}
                  onChange={(v) => setDraft({ ...draft, employeeName: v })}
                  placeholder="Alex Rivera"
                />
              </StepFrame>
            )}
            {step === 2 && (
              <StepFrame
                title="Beneficiary destination"
                body="Wallet that must stay paid even if the primary agent fails."
              >
                <Field
                  label="Beneficiary address or ENS"
                  value={draft.beneficiary}
                  onChange={(v) => setDraft({ ...draft, beneficiary: v })}
                  placeholder="0x… or name.eth"
                />
              </StepFrame>
            )}
            {step === 3 && (
              <StepFrame
                title="Payroll rhythm"
                body="How much, how often. Keep it simple."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Amount (USDC)"
                    value={draft.amountUsdc}
                    onChange={(v) => setDraft({ ...draft, amountUsdc: v })}
                  />
                  <Field
                    label="Cadence (minutes)"
                    value={draft.cadenceMin}
                    onChange={(v) => setDraft({ ...draft, cadenceMin: v })}
                  />
                </div>
              </StepFrame>
            )}
            {step === 4 && (
              <StepFrame
                title="Who recovers the stream?"
                body="Org B replays missed slots when Sentinel fires."
              >
                <SvgRescueFlow className="max-h-48" />
                <Field
                  label="Recovery org"
                  value={draft.recoveryOrg}
                  onChange={(v) => setDraft({ ...draft, recoveryOrg: v })}
                />
              </StepFrame>
            )}
            {step === 5 && (
              <StepFrame
                title="Review before deploy"
                body="This draft stays local until you connect a signed deploy path."
              >
                <dl className="space-y-3 text-sm">
                  {(
                    [
                      ["Wallet", draft.walletLabel],
                      ["Employee", draft.employeeName || "-"],
                      ["Beneficiary", draft.beneficiary || "-"],
                      ["Amount", `${draft.amountUsdc} USDC`],
                      ["Cadence", `${draft.cadenceMin} min`],
                      ["Recovery", draft.recoveryOrg],
                    ] as const
                  ).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between gap-4 border-b border-[var(--border)] pb-2"
                    >
                      <dt className="text-[var(--fg-muted)]">{k}</dt>
                      <dd className="font-mono text-right">{v}</dd>
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
            Save draft and open mission
          </Button>
        )}
      </div>
    </div>
  );
}

function StepFrame({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-[var(--fg-muted)]">{body}</p>
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
