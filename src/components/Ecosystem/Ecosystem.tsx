import { Container, SectionHeader } from "../ui/section-header";
import { Reveal } from "../ui/reveal";
import { IconGitHub } from "../ui/icons";
import { scrollToSection } from "../../lib/smooth-scroll";
import { profile } from "../../data/profile";

const mainTraits = ["production", "canonical", "polished"] as const;
const labTraits = [
  "experiments",
  "research",
  "forks",
  "archive",
  "backup",
] as const;

export function Ecosystem() {
  return (
    <section
      id="ecosystem"
      aria-labelledby="ecosystem-title"
      className="scroll-mt-20"
    >
      <Container className="py-24 sm:py-32">
        <SectionHeader
          index="04"
          title="Workspace topology"
          id="ecosystem-title"
        />

        <Reveal>
          <p className="mb-14 max-w-prose text-lg leading-relaxed text-text-secondary">
            One engineer, two operating modes. The canonical account carries the
            finished work; this workspace carries everything that never promised
            to be finished.
          </p>
        </Reveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          {/* main */}
          <Reveal delay={0.05} className="h-full">
            <div className="flex h-full flex-col rounded-md border border-border p-7 transition-colors hover:border-border-strong sm:p-8">
              <p className="font-mono text-[10px] tracking-mega text-text-muted uppercase">
                main identity
              </p>
              <a
                href={profile.mainAccount.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center gap-2.5 text-xl font-semibold tracking-tight text-text transition-colors hover:text-accent"
              >
                <IconGitHub size={18} className="text-text-muted" />@
                {profile.mainAccount.username}
                <span aria-hidden className="text-sm text-text-muted">
                  ↗
                </span>
              </a>
              <p className="mt-3 max-w-xs text-xs leading-relaxed text-text-muted">
                {profile.mainAccount.bio}
              </p>
              <ul className="mt-6 space-y-2 border-t border-border pt-5 font-mono text-xs text-text-secondary">
                {mainTraits.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className="text-accent-muted">
                      ·
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 text-xs leading-relaxed text-text-muted">
                Where the shipped things live.
              </p>
            </div>
          </Reveal>

          {/* connector */}
          <Reveal delay={0.1}>
            <div
              aria-hidden
              className="flex h-full min-h-16 flex-row items-center justify-center gap-3 lg:min-h-0 lg:flex-col lg:px-3"
            >
              <i className="h-px w-full bg-border lg:h-auto lg:w-px lg:flex-1" />
              <span className="shrink-0 rounded-sm border border-border-strong px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-accent uppercase">
                affiliated
              </span>
              <i className="h-px w-full bg-border lg:h-auto lg:w-px lg:flex-1" />
            </div>
          </Reveal>

          {/* lab */}
          <Reveal delay={0.15} className="h-full">
            <div className="flex h-full flex-col rounded-md border border-accent-border/50 bg-accent/[0.03] p-7 sm:p-8">
              <p className="font-mono text-[10px] tracking-mega text-accent uppercase">
                this workspace
              </p>
              <button
                type="button"
                onClick={() => scrollToSection("repositories")}
                className="mt-4 self-start text-left text-xl font-semibold tracking-tight text-text transition-colors hover:text-accent"
              >
                {profile.username}
                <span className="text-accent">/</span>lab
              </button>
              <ul className="mt-6 space-y-2 border-t border-border pt-5 font-mono text-xs text-text-secondary">
                {labTraits.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <span aria-hidden className="text-accent-muted">
                      ·
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 text-xs leading-relaxed text-text-muted">
                Same person. Lower stakes, higher curiosity.
              </p>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
