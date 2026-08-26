import { motion, useReducedMotion } from "motion/react";
import { Container } from "../ui/section-header";
import { LinkButton } from "../ui/link-button";
import { IconArrowDown, IconGitHub } from "../ui/icons";
import { scrollToSection } from "../../lib/smooth-scroll";
import { formatCount } from "../../lib/utils";
import type { LabStats } from "../../lib/stats";
import type { DataStatus } from "../../hooks/useRepositories";
import { profile } from "../../data/profile";
import { TerminalCard } from "./TerminalCard";

const ease = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero({
  stats,
  status,
}: {
  stats: LabStats;
  status: DataStatus;
}) {
  const reduce = useReducedMotion();
  const enter = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, ...(reduce ? {} : { y: 0 }) },
    transition: { duration: 0.6, delay, ease },
  });

  return (
    <section
      id="hero"
      className="relative overflow-hidden"
      aria-label="Introduction"
    >
      <div className="bg-grid mask-fade-b absolute inset-0" aria-hidden />
      <div
        aria-hidden
        className="absolute top-[-20%] right-[-10%] size-[480px] rounded-full bg-accent/[0.04] blur-[120px]"
      />

      <Container className="relative flex min-h-svh flex-col justify-center pt-28 pb-24">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <motion.p
              {...enter(0)}
              className="flex items-center gap-3 font-mono text-[11px] tracking-mega text-text-muted uppercase"
            >
              <i
                aria-hidden
                className={`size-1.5 rounded-full ${
                  status === "fallback" ? "bg-warn" : "bg-ok animate-pulse"
                }`}
              />
              secondary workspace
            </motion.p>

            <motion.h1
              {...enter(0.08)}
              className="mt-6 text-[clamp(2.9rem,8.5vw,6.5rem)] leading-[0.95] font-semibold tracking-tight"
            >
              deyman12
              <span className="text-accent"> / </span>
              <span className="text-transparent [-webkit-text-stroke:1px_var(--border-strong)]">
                lab
              </span>
            </motion.h1>

            <motion.p
              {...enter(0.16)}
              className="mt-6 font-mono text-sm tracking-wide text-text-secondary"
            >
              {profile.tagline.join(" · ")}
            </motion.p>

            <motion.div {...enter(0.24)} className="mt-10 flex flex-wrap gap-3">
              <LinkButton
                variant="primary"
                href="#repositories"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection("repositories");
                }}
              >
                Explore repositories
                <IconArrowDown size={12} />
              </LinkButton>
              <LinkButton variant="ghost" href={profile.githubUrl} external>
                GitHub
                <IconGitHub size={13} className="opacity-70" />
              </LinkButton>
            </motion.div>

            <motion.div
              {...enter(0.32)}
              className="mt-14 flex items-center gap-4 border-t border-border pt-4 font-mono text-[11px] tracking-wider text-text-muted"
            >
              {(["repositories", "stars", "forks", "backups"] as const).map(
                (key, i) => (
                  <span key={key} className="flex items-center gap-1.5">
                    {i > 0 && <span className="mr-1 text-line-strong">/</span>}
                    <span className="text-text-muted">{key}</span>
                    <span className="tabular text-text">
                      {status === "loading" ? "···" : formatCount(stats[key])}
                    </span>
                  </span>
                ),
              )}
            </motion.div>
          </div>

          <motion.div {...enter(0.35)} className="lg:justify-self-end">
            <TerminalCard
              stats={stats}
              status={status}
              username={profile.username}
            />
          </motion.div>
        </div>
      </Container>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
        className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <span className="font-mono text-[10px] tracking-mega text-text-muted uppercase">
          scroll
        </span>
      </motion.div>
    </section>
  );
}
