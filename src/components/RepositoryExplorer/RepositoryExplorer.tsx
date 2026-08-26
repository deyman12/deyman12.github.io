import { useCallback, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { RepoCategory } from "../../types/repository";
import type { Repository } from "../../types/repository";
import type { DataStatus } from "../../hooks/useRepositories";
import { filters } from "../../data/profile";
import { cn, formatCount } from "../../lib/utils";
import { Container, SectionHeader } from "../ui/section-header";
import { Reveal } from "../ui/reveal";
import { IconRefresh, IconSearch } from "../ui/icons";
import { RepositoryItem } from "./RepositoryItem";

type SortKey = "updated" | "stars" | "name";

const SORTS: ReadonlyArray<{ id: SortKey; label: string }> = [
  { id: "updated", label: "updated" },
  { id: "stars", label: "stars" },
  { id: "name", label: "a–z" },
];

const PAGE_SIZE = 8;

function matchesFilter(
  repo: Repository,
  filter: RepoCategory | "all",
): boolean {
  if (filter === "all") return true;
  return repo.categories.includes(filter);
}

function matchesQuery(repo: Repository, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    repo.name.toLowerCase().includes(q) ||
    (repo.description ?? "").toLowerCase().includes(q) ||
    repo.topics.some((t) => t.includes(q))
  );
}

export function RepositoryExplorer({
  repos,
  status,
  notice,
  fetchedAt,
  filter,
  onFilterChange,
  onRetry,
}: {
  repos: readonly Repository[];
  status: DataStatus;
  notice: string | null;
  fetchedAt: string | null;
  filter: RepoCategory | "all";
  onFilterChange: (f: RepoCategory | "all") => void;
  onRetry: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const resetPage = useCallback(() => setVisibleCount(PAGE_SIZE), []);

  const counts = useMemo(() => {
    const map = new Map<RepoCategory | "all", number>([["all", repos.length]]);
    for (const f of filters) {
      if (f.id === "all") continue;
      map.set(f.id, repos.filter((r) => matchesFilter(r, f.id)).length);
    }
    return map;
  }, [repos]);

  const visible = useMemo(() => {
    const list = repos.filter(
      (r) => matchesFilter(r, filter) && matchesQuery(r, query),
    );
    return [...list].sort((a, b) => {
      switch (sort) {
        case "stars":
          return b.stars - a.stars;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });
  }, [repos, filter, query, sort]);

  return (
    <section
      id="repositories"
      aria-labelledby="repositories-title"
      className="scroll-mt-20"
    >
      <Container className="py-24 sm:py-32">
        <SectionHeader
          index="02"
          title="Repository index"
          id="repositories-title"
          aside={
            <span className="font-mono text-xs text-text-muted tabular">
              {status === "loading"
                ? "indexing…"
                : fetchedAt
                  ? `updated ${new Date(fetchedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                  : `${formatCount(repos.length)} entries`}
            </span>
          }
        />

        {status === "fallback" && (
          <Reveal>
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-warn/25 bg-warn/[0.04] px-4 py-3 font-mono text-xs text-warn/90">
              <p>
                live github api unavailable ({notice}) — showing a cached
                snapshot.
              </p>
              <button
                type="button"
                onClick={onRetry}
                className="flex items-center gap-1.5 tracking-wider uppercase transition-colors hover:text-warn"
              >
                <IconRefresh size={12} />
                retry live data
              </button>
            </div>
          </Reveal>
        )}

        {/* toolbar */}
        <Reveal delay={0.05}>
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="group"
              aria-label="Filter repositories by category"
              className="no-scrollbar -mx-5 flex gap-1.5 overflow-x-auto px-5 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
            >
              {filters.map((f) => {
                const count = counts.get(f.id) ?? 0;
                const isActive = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      onFilterChange(f.id);
                      resetPage();
                    }}
                    disabled={count === 0 && f.id !== "all" && !query}
                    className={cn(
                      "shrink-0 rounded-sm border px-2.5 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                      isActive
                        ? "border-accent-border bg-accent/[0.06] text-accent"
                        : count === 0
                          ? "cursor-not-allowed border-border text-text-muted/50"
                          : "border-border text-text-muted hover:border-border-strong hover:text-text-secondary",
                    )}
                  >
                    {f.label}
                    <sup className="ml-1 text-[9px] tabular">{count}</sup>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <label className="relative block w-full sm:w-56">
                <IconSearch
                  size={13}
                  className="pointer-events-none absolute top-1/2 left-2 -translate-y-1/2 text-text-muted"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    resetPage();
                  }}
                  placeholder="search index…"
                  aria-label="Search repositories"
                  className="w-full border-b border-border bg-transparent py-2 pr-2 pl-7 font-mono text-xs text-text transition-colors outline-none placeholder:text-text-muted focus:border-accent-border"
                />
              </label>

              <div
                role="group"
                aria-label="Sort repositories"
                className="flex items-center gap-3"
              >
                <span className="font-mono text-[10px] tracking-widest text-text-muted uppercase">
                  sort
                </span>
                {SORTS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={sort === s.id}
                    onClick={() => {
                      setSort(s.id);
                      resetPage();
                    }}
                    className={cn(
                      "border-b pb-0.5 font-mono text-[11px] tracking-wider uppercase transition-colors",
                      sort === s.id
                        ? "border-accent text-accent"
                        : "border-transparent text-text-muted hover:text-text-secondary",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* list / states */}
        {status === "loading" ? (
          <SkeletonRows />
        ) : visible.length === 0 ? (
          <EmptyState
            message={
              query
                ? `nothing in the index matches “${query}”.`
                : `nothing filed under “${filter}” yet.`
            }
            onReset={() => {
              setQuery("");
              onFilterChange("all");
              resetPage();
            }}
          />
        ) : (
          <>
            <motion.ul
              initial={false}
              className="-mx-3 border-t border-border"
              aria-live="polite"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {visible.slice(0, visibleCount).map((repo, i) => (
                  <motion.li
                    key={repo.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      duration: 0.24,
                      delay: Math.min(i * 0.02, 0.2),
                      ease: "easeOut",
                    }}
                  >
                    <RepositoryItem repo={repo} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>

            {visibleCount < visible.length && (
              <div className="pt-6 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="rounded-sm border border-border px-5 py-2.5 font-mono text-xs tracking-wider text-text-secondary uppercase transition-colors hover:border-border-strong hover:text-text"
                >
                  show more
                  <span className="ml-1.5 text-text-muted">
                    ({Math.min(PAGE_SIZE, visible.length - visibleCount)} of{" "}
                    {visible.length - visibleCount} remaining)
                  </span>
                </button>
              </div>
            )}

            <p className="pt-6 text-center font-mono text-[11px] text-text-muted">
              — end of index · {Math.min(visibleCount, visible.length)} of{" "}
              {visible.length} shown —
            </p>
          </>
        )}
      </Container>
    </section>
  );
}

function SkeletonRows() {
  return (
    <ul className="-mx-3 border-t border-border" aria-hidden>
      {Array.from({ length: 6 }, (_, i) => (
        <li key={i} className="border-b border-border px-3 py-5">
          <div className="animate-pulse space-y-3">
            <div className="h-4 w-48 rounded-sm bg-white/[0.06]" />
            <div className="h-3 w-full max-w-xl rounded-sm bg-white/[0.04]" />
            <div className="h-2.5 w-64 rounded-sm bg-white/[0.03]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({
  message,
  onReset,
}: {
  message: string;
  onReset: () => void;
}) {
  return (
    <div className="border-y border-border py-20 text-center">
      <p className="font-mono text-sm text-text-secondary">{message}</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 font-mono text-xs tracking-wider text-accent uppercase transition-colors hover:text-text"
      >
        reset view
      </button>
    </div>
  );
}
