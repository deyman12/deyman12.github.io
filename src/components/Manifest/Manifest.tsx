import { Container, SectionHeader } from "../ui/section-header";
import { Reveal } from "../ui/reveal";
import { manifestEntries } from "../../data/profile";

export function Manifest() {
  return (
    <section
      id="manifest"
      aria-labelledby="manifest-title"
      className="scroll-mt-20"
    >
      <Container className="py-24 sm:py-32">
        <SectionHeader
          index="01"
          title="What is this place"
          id="manifest-title"
        />

        <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal delay={0.05}>
            <p className="max-w-md text-lg leading-relaxed text-text-secondary">
              A secondary engineering workspace. Not everything here is
              production-ready — some things are experiments, some are forks,
              some are archives. Some are simply worth keeping.
            </p>
            <p className="mt-6 max-w-md font-mono text-xs leading-relaxed text-text-muted">
              // the main account stays curated.
              <br />
              // this one stays honest.
            </p>
          </Reveal>

          <div className="border-y border-border">
            {manifestEntries.map((entry, i) => (
              <Reveal key={entry.key} delay={0.04 * i} y={10}>
                <div className="group grid gap-1 border-b border-border py-5 transition-colors last:border-b-0 hover:bg-white/[0.015] sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
                  <div className="flex items-baseline gap-2 sm:pl-2">
                    <span
                      aria-hidden
                      className="font-mono text-[11px] text-accent-muted tabular transition-colors group-hover:text-accent"
                    >
                      {entry.key}
                    </span>
                    <h3 className="font-mono text-xs tracking-[0.18em] text-text uppercase">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-text-secondary sm:pl-2">
                    {entry.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
