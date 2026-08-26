import { motion, useReducedMotion } from "motion/react";
import { cn } from "../../lib/utils";
import type { LabStats } from "../../lib/stats";
import type { DataStatus } from "../../hooks/useRepositories";
import { useCountUp } from "../../hooks/useCountUp";

const ROWS = [
  "repositories",
  "experiments",
  "forks",
  "backups",
  "archives",
] as const;

function StatValue({ n, ready }: { n: number; ready: boolean }) {
  const animated = useCountUp(n, ready);
  if (!ready) {
    return <span className="text-text-muted">···</span>;
  }
  return (
    <span className={cn("tabular", n > 0 ? "text-text" : "text-text-muted")}>
      {String(animated).padStart(2, "0")}
    </span>
  );
}

export function TerminalCard({
  stats,
  status,
  username,
}: {
  stats: LabStats;
  status: DataStatus;
  username: string;
}) {
  const reduce = useReducedMotion();
  const live = status === "ready";
  const fallback = status === "fallback";

  const line = (i: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, x: -6 },
    animate: { opacity: 1, ...(reduce ? {} : { x: 0 }) },
    transition: { duration: 0.35, delay: 0.15 + i * 0.14 },
  });

  return (
    <div className="w-full max-w-md rounded-md border border-border bg-surface/80 shadow-[0_24px_70px_-32px_rgb(0_0_0/0.9)] backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <span className="flex gap-1.5" aria-hidden>
          <i className="size-2 rounded-full bg-white/10" />
          <i className="size-2 rounded-full bg-white/10" />
          <i className="size-2 rounded-full bg-white/10" />
        </span>
        <span className="font-mono text-[10px] tracking-wider text-text-muted">
          ~/lab — sh
        </span>
      </div>

      <div
        className="space-y-1 p-5 font-mono text-[13px] leading-relaxed"
        role="status"
        aria-label={`account stats: ${stats.repositories} repositories`}
      >
        <motion.p {...line(0)}>
          <span className="text-accent">$</span>{" "}
          <span className="text-text-secondary">./inspect-account</span>{" "}
          <span className="text-text-muted">--user {username}</span>
        </motion.p>

        <div className="h-2" aria-hidden />

        {ROWS.map((label, i) => (
          <motion.p
            key={label}
            {...line(i + 1)}
            className="flex items-baseline"
          >
            <span className="shrink-0 text-text-secondary">{label}</span>
            <span
              aria-hidden
              className="mx-2 flex-1 -translate-y-1 border-b border-dotted border-white/15"
            />
            <StatValue n={stats[label]} ready={status !== "loading"} />
          </motion.p>
        ))}

        <div className="h-2" aria-hidden />

        <motion.p {...line(6)} className="flex items-center gap-2">
          <span className="text-text-secondary">status:</span>
          <i
            aria-hidden
            className={cn(
              "size-1.5 rounded-full",
              fallback
                ? "bg-warn"
                : status === "ready"
                  ? "bg-ok"
                  : "bg-text-muted",
              !fallback && "animate-pulse",
            )}
          />
          <span className={fallback ? "text-warn" : "text-text"}>
            {status === "loading"
              ? "resolving…"
              : fallback
                ? "cached snapshot"
                : "operational"}
          </span>
        </motion.p>

        {fallback ? (
          <motion.p {...line(7)} className="text-text-muted italic">
            # live api unavailable — reading local snapshot
          </motion.p>
        ) : (
          live && (
            <motion.p {...line(7)} className="text-text-muted italic">
              probably.
            </motion.p>
          )
        )}
      </div>
    </div>
  );
}
