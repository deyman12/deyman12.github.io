import { useMemo, useState } from "react";
import type { Repository } from "../../types/repository";
import { Container, SectionHeader } from "../ui/section-header";
import { Reveal } from "../ui/reveal";
import { Badge } from "../ui/badge";
import { IconChevronDown } from "../ui/icons";
import { cn } from "../../lib/utils";

const MONTHS = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

type EventKind = "created" | "forked" | "modified" | "archived";

const eventTone: Record<EventKind, "neutral" | "accent" | "warn" | "faint"> = {
  created: "neutral",
  forked: "faint",
  modified: "accent",
  archived: "warn",
};

function eventOf(repo: Repository): EventKind {
  if (repo.isArchived || repo.categories.includes("archive")) return "archived";
  if (repo.modifiedFork) return "modified";
  if (repo.isFork) return "forked";
  return "created";
}

interface Entry {
  repo: Repository;
  event: EventKind;
}

const INITIAL_GROUPS = 8;

export function ActivityTimeline({ repos }: { repos: readonly Repository[] }) {
  const [expanded, setExpanded] = useState(false);

  const years = useMemo(() => {
    const byYear = new Map<number, Map<number, Entry[]>>();
    for (const repo of repos) {
      const d = new Date(repo.createdAt);
      if (Number.isNaN(d.getTime())) continue;
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth();
      if (!byYear.has(y)) byYear.set(y, new Map());
      const months = byYear.get(y)!;
      if (!months.has(m)) months.set(m, []);
      months.get(m)!.push({ repo, event: eventOf(repo) });
    }
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, months]) => ({
        year,
        months: [...months.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([month, entries]) => ({ month, entries })),
      }));
  }, [repos]);

  const totalGroups = years.reduce((n, y) => n + y.months.length, 0);

  /** When collapsed, only the newest N month-groups survive. */
  const visibleKeys = useMemo(() => {
    if (expanded) return null;
    const keep = new Set<string>();
    let n = 0;
    for (const { year, months } of years) {
      for (const { month } of months) {
        if (n >= INITIAL_GROUPS) return keep;
        keep.add(`${year}:${month}`);
        n += 1;
      }
    }
    return keep;
  }, [years, expanded]);

  return (
    <section
      id="activity"
      aria-labelledby="activity-title"
      className="scroll-mt-20"
    >
      <Container className="py-24 sm:py-32">
        <SectionHeader
          index="03"
          title="Activity log"
          id="activity-title"
          aside={
            <span className="font-mono text-xs text-text-muted tabular">
              {repos.length} entries · by creation
            </span>
          }
        />

        {years.length === 0 ? (
          <p className="border-y border-border py-20 text-center font-mono text-sm text-text-muted">
            the log is empty. suspiciously quiet.
          </p>
        ) : (
          <div className="space-y-12">
            {years.map(({ year, months }) => (
              <Reveal key={year} y={10}>
                <div className="grid gap-6 md:grid-cols-[4rem_minmax(0,1fr)]">
                  <h3 className="font-mono text-lg font-medium text-text-muted tabular md:text-right">
                    {year}
                  </h3>

                  <ul className="space-y-7 border-l border-border pl-5 sm:pl-8">
                    {months.map(({ month, entries }) => {
                      const key = `${year}:${month}`;
                      if (visibleKeys && !visibleKeys.has(key)) return null;
                      return (
                        <li key={month}>
                          <p className="mb-2 font-mono text-[11px] tracking-[0.22em] text-accent-muted">
                            {MONTHS[month]}
                          </p>
                          <ul>
                            {entries.map(({ repo, event }) => (
                              <li
                                key={repo.id}
                                className="group flex items-center gap-3 py-1"
                              >
                                <span
                                  aria-hidden
                                  className={cn(
                                    "h-px w-3 shrink-0 bg-border-strong transition-colors",
                                    "group-hover:bg-accent",
                                  )}
                                />
                                <a
                                  href={repo.htmlUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="truncate text-sm text-text-secondary transition-colors hover:text-accent"
                                >
                                  {repo.name}
                                </a>
                                <Badge tone={eventTone[event]}>{event}</Badge>
                              </li>
                            ))}
                          </ul>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </Reveal>
            ))}

            {totalGroups > INITIAL_GROUPS && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                aria-expanded={expanded}
                className="mx-auto flex items-center gap-2 font-mono text-[11px] tracking-[0.18em] text-text-muted uppercase transition-colors hover:text-accent"
              >
                {expanded ? "collapse log" : `show full log (${totalGroups})`}
                <IconChevronDown
                  size={12}
                  className={cn(
                    "transition-transform",
                    expanded && "rotate-180",
                  )}
                />
              </button>
            )}
          </div>
        )}
      </Container>
    </section>
  );
}
