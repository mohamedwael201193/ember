import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        primary: "bg-[var(--accent)] text-white hover:brightness-110",
        ink: "bg-[var(--fg)] text-[var(--bg)] hover:opacity-90",
        ghost:
          "bg-transparent border border-[var(--border)] text-[var(--fg)] hover:bg-white/5",
        outline:
          "border border-[var(--fg)] text-[var(--fg)] hover:bg-[var(--fg)] hover:text-[var(--bg)]",
      },
      size: {
        sm: "h-9 px-3 rounded-[4px]",
        md: "h-11 px-5 rounded-[4px]",
        lg: "h-12 px-6 rounded-[4px] text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";
