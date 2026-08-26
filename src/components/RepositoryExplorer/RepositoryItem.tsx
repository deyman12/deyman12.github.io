import { memo } from "react";
import type { Repository } from "../../types/repository";
import { LANGUAGE_COLORS } from "../../lib/repository";
import { cn, formatCount, formatUpdated } from "../../lib/utils";
import { Badge, CategoryBadge } from "../ui/badge";
import { IconArrowUpRight, IconGitFork, IconStar } from "../ui/icons";

/**
 * One index row. The repository title is the primary link; it stretches
 * across the row via ::after so the whole surface feels clickable without
 * nesting anchors (invalid HTML). Secondary links sit above that layer.
 */
export const RepositoryItem = memo(function RepositoryItem({
  repo,
}: {
  repo: Repository;
}) {
  const langColor = repo.language ? LANGUAGE_COLORS[repo.language] : undefined;

  return (
    <div className="group relative border-b border-border px-3 py-5 transition-colors duration-200 last:border-b-0 hover:bg-white/[0.02] group-focus-within:bg-white/[0.02]">
      <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        {/* title row */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <span
            aria-hidden
            className="text-accent opacity-0 transition-opacity duration-200 select-none group-hover:opacity-100"
          >
            ▸
          </span>
          <h3 className="min-w-0 text-[15px] font-medium tracking-tight">
            <a
              href={repo.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text transition-colors after:absolute after:inset-0 after:rounded-sm after:content-[''] hover:text-accent"
            >
              {repo.name}
              <span className="sr-only"> — open on GitHub</span>
            </a>
          </h3>
          {repo.isMotebayaBackup && <CategoryBadge category="backup" />}
          {repo.modifiedFork && <CategoryBadge category="modified" />}
          {!repo.isMotebayaBackup &&
            !repo.modifiedFork &&
            repo.categories[0] !== "experiment" &&
            repo.categories[0] && (
              <CategoryBadge category={repo.categories[0]} />
            )}
          {repo.isArchived && <Badge tone="warn">archived</Badge>}
        </div>

        {/* metrics */}
        <div className="flex shrink-0 items-center gap-4 pl-6 font-mono text-xs text-text-muted tabular md:pl-2">
          {repo.language && (
            <span className="flex items-center gap-1.5">
              <i
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: langColor ?? "#6b7280" }}
              />
              {repo.language}
            </span>
          )}
          {(repo.stars > 0 || repo.forks > 0) && (
            <>
              <span className="flex items-center gap-1">
                <IconStar size={12} />
                {formatCount(repo.stars)}
              </span>
              <span className="flex items-center gap-1">
                <IconGitFork size={12} />
                {formatCount(repo.forks)}
              </span>
            </>
          )}
          <IconArrowUpRight
            size={13}
            className="opacity-0 transition-all duration-200 select-none group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
          />
        </div>

        {/* description */}
        <p className="max-w-2xl text-sm leading-relaxed text-text-secondary md:col-span-2 md:pl-6">
          {repo.description ?? (
            <span className="text-text-muted italic">
              no description — the mystery stays preserved.
            </span>
          )}
        </p>

        {/* metadata row */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-[11px] text-text-muted md:col-span-2 md:pl-6">
          {repo.topics.slice(0, 4).map((topic) => (
            <span key={topic}>#{topic}</span>
          ))}
          {repo.topics.length > 4 && <span>+{repo.topics.length - 4}</span>}

          <span>updated {formatUpdated(repo.updatedAt)}</span>

          {repo.isMotebayaBackup && repo.parent && (
            <BackupLine
              modified={repo.modifiedFork}
              parentName={repo.parent.fullName}
              parentUrl={repo.parent.htmlUrl}
            />
          )}

          {!repo.isMotebayaBackup &&
            repo.isFork &&
            (repo.parent ? (
              <ForkLine
                modified={repo.modifiedFork}
                fullName={repo.parent.fullName}
                url={repo.parent.htmlUrl}
              />
            ) : (
              <span>fork — upstream unverified</span>
            ))}

          {repo.homepage && (
            <a
              href={repo.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 transition-colors hover:text-accent"
            >
              homepage ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
});

function BackupLine({
  modified,
  parentName,
  parentUrl,
}: {
  modified: boolean;
  parentName: string;
  url?: string;
  parentUrl: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-text-muted">forked from</span>
      <a
        href={parentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative z-10 text-accent-muted transition-colors hover:text-accent"
      >
        @{parentName.split("/")[0]}
      </a>
      {modified && <span className="text-accent-muted">· modified</span>}
    </span>
  );
}

function ForkLine({
  modified,
  fullName,
  url,
}: {
  modified: boolean;
  fullName: string;
  url: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "relative z-10 transition-colors",
        modified ? "hover:text-accent" : "hover:text-text-secondary",
      )}
      title={modified ? "pushed after upstream — diverged" : "unmodified fork"}
    >
      {modified ? "mod of" : "fork of"} {fullName} ↗
    </a>
  );
}
