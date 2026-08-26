import type { GitHubRepo } from "./github";

/**
 * Buckets a repository can be filed under. A repo may carry more than one
 * (e.g. an archived backup), but the first entry is its primary label.
 */
export type RepoCategory =
  | "experiment"
  | "fork"
  | "modified"
  | "backup"
  | "archive"
  | "collection";

export interface ParentRef {
  fullName: string;
  htmlUrl: string;
  pushedAt: string | null;
  /** Login of the upstream owner — critical for backup detection. */
  ownerLogin: string | null;
}

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  htmlUrl: string;
  homepage: string | null;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  createdAt: string;
  /** Best proxy for "last meaningful change" — prefers pushed_at. */
  updatedAt: string;
  isFork: boolean;
  isArchived: boolean;
  parent: ParentRef | null;
  /**
   * True only when we have evidence the fork diverged from its parent
   * (pushed after the parent's last push). Never guessed.
   */
  modifiedFork: boolean;
  /** Fork whose upstream owner is the main account — semantically a backup. */
  isMotebayaBackup: boolean;
  categories: RepoCategory[];
}

export function toRepository(raw: GitHubRepo): Repository {
  const parent = raw.parent
    ? {
        fullName: raw.parent.full_name,
        htmlUrl: raw.parent.html_url,
        pushedAt: raw.parent.pushed_at ?? null,
        ownerLogin: raw.parent.owner?.login ?? null,
      }
    : null;

  return {
    id: raw.id,
    name: raw.name,
    fullName: raw.full_name,
    htmlUrl: raw.html_url,
    homepage: raw.homepage || null,
    description: raw.description,
    language: raw.language,
    topics: raw.topics ?? [],
    stars: raw.stargazers_count,
    forks: raw.forks_count,
    createdAt: raw.created_at,
    updatedAt: raw.pushed_at || raw.updated_at,
    isFork: raw.fork,
    isArchived: raw.archived,
    parent,
    modifiedFork: false,
    isMotebayaBackup: false,
    categories: [],
  };
}
