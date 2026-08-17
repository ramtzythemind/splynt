import { cn } from "@/lib/utils";
import type { ComponentProps, ReactNode } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-ink-700 bg-ink-850/80 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentProps<"button"> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-signal",
        "disabled:cursor-not-allowed disabled:opacity-45",
        size === "sm" && "px-3 py-1.5 text-xs",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-6 py-3 text-base",
        variant === "primary" &&
          "bg-amber-board text-ink-950 hover:bg-amber-board/85 active:bg-amber-board/75",
        variant === "outline" &&
          "border border-ink-600 text-slate-soft hover:border-ink-500 hover:text-white",
        variant === "ghost" && "text-slate-muted hover:bg-ink-800 hover:text-white",
        variant === "danger" &&
          "border border-coral/40 text-coral hover:bg-coral/10",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-white",
        "placeholder:text-slate-muted/60",
        "focus:border-sky-signal focus:outline-none focus:ring-1 focus:ring-sky-signal/40",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-slate-muted",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "amber" | "sky" | "jade" | "coral" | "violet";
  className?: string;
}) {
  const tones = {
    neutral: "border-ink-600 bg-ink-800 text-slate-soft",
    amber: "border-amber-board/35 bg-amber-board/10 text-amber-board",
    sky: "border-sky-signal/35 bg-sky-signal/10 text-sky-signal",
    jade: "border-jade/35 bg-jade/10 text-jade",
    coral: "border-coral/35 bg-coral/10 text-coral",
    violet: "border-violet-glow/35 bg-violet-glow/10 text-violet-glow",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-ink-700 bg-ink-900/60 p-4", className)}>
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-muted">
        {label}
      </div>
      <div className="mt-1.5 font-mono text-2xl tabular-nums text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-muted">{sub}</div>}
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-ink-700 px-6 py-14 text-center">
      <p className="text-sm font-medium text-slate-soft">{title}</p>
      {hint && <p className="max-w-sm text-xs leading-relaxed text-slate-muted">{hint}</p>}
      {action}
    </div>
  );
}

/** Thin progress bar used for rank progression. */
export function Meter({
  value,
  className,
  accent = "var(--color-amber-board)",
}: {
  value: number;
  className?: string;
  accent?: string;
}) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink-700", className)}>
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.max(2, Math.min(100, value * 100))}%`,
          background: accent,
        }}
      />
    </div>
  );
}
