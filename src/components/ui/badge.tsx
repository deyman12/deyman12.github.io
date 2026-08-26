import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type BadgeTone = "neutral" | "accent" | "warn" | "faint";

const tones: Record<BadgeTone, string> = {
  neutral: "border-border-strong text-text-secondary",
  accent: "border-accent-border/60 bg-accent/5 text-accent",
  warn: "border-warn/30 text-warn",
  faint: "border-border text-text-muted",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-sm border px-1.5 py-px font-mono text-[10px] tracking-wider uppercase",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const categoryLabels = {
  experiment: "experiment",
  fork: "fork",
  modified: "modified fork",
  backup: "backup",
  archive: "archive",
  collection: "collection",
} as const;

export function CategoryBadge({
  category,
}: {
  category: keyof typeof categoryLabels;
}) {
  return (
    <Badge
      tone={
        category === "modified"
          ? "accent"
          : category === "archive"
            ? "faint"
            : "neutral"
      }
    >
      {categoryLabels[category]}
    </Badge>
  );
}
