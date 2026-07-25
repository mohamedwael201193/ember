import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Expandable({
  summary,
  children,
  className,
}: {
  summary: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("rounded-[4px] border border-[var(--border)]", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
      >
        <span>{summary}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && (
        <div className="border-t border-[var(--border)] px-4 py-3 font-mono text-xs text-[var(--fg-muted)] break-all">
          {children}
        </div>
      )}
    </div>
  );
}
