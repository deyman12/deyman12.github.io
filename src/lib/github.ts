import type { GitHubRepo, GitHubUser } from "../types/github";
import { toRepository } from "../types/repository";
import type { Repository } from "../types/repository";
import { profile } from "../data/profile";
import { deriveCategories, markBackup, markModifiedFork } from "./repository";

const API_BASE = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 3;
/** Fork parents are resolved one request per fork — cap it to stay kind to rate limits. */
const FORK_HYDRATION_LIMIT = 25;
const TIMEOUT_MS = 10_000;

export class GitHubError extends Error {
  readonly status?: number;
  readonly rateLimited: boolean;

  constructor(message: string, status?: number, rateLimited = false) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.rateLimited = rateLimited;
  }
}

async function getJson<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: { Accept: "application/vnd.github+json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new GitHubError(`network error fetching ${path}`);
  }

  if (!res.ok) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    throw new GitHubError(
      `github api responded ${res.status} for ${path}`,
      res.status,
      res.status === 403 || remaining === "0",
    );
  }
  return (await res.json()) as T;
}

export function fetchUser(login: string): Promise<GitHubUser> {
  return getJson<GitHubUser>(`/users/${encodeURIComponent(login)}`);
}

/**
 * Fetch all owned public repositories, normalized into the app model.
 * Fork parents are hydrated opportunistically; failures there degrade
 * gracefully (fork stays "unverified upstream") rather than failing the call.
 */
export async function fetchRepositories(login: string): Promise<Repository[]> {
  const pages: GitHubRepo[][] = [];

  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await getJson<GitHubRepo[]>(
      `/users/${encodeURIComponent(login)}/repos?per_page=${PER_PAGE}&page=${page}&type=owner&sort=updated`,
    );
    pages.push(batch);
    if (batch.length < PER_PAGE) break;
  }

  const models = pages.flat().map(toRepository);

  // Hydrate parent info for forks (the list endpoint omits it).
  // Prioritize forks from the main account so backup detection works
  // even when the total fork count exceeds the hydration limit.
  const allForks = models.filter((r) => r.isFork);
  const mainForks = allForks.filter((r) =>
    r.fullName.startsWith(`${profile.mainAccount.username}/`),
  );
  const otherForks = allForks.filter(
    (r) => !r.fullName.startsWith(`${profile.mainAccount.username}/`),
  );
  const forks = [...mainForks, ...otherForks].slice(0, FORK_HYDRATION_LIMIT);
  await Promise.allSettled(
    forks.map(async (repo) => {
      const detail = await getJson<GitHubRepo>(`/repos/${repo.fullName}`);
      if (detail.parent) repo.parent = toRepository(detail).parent;
      repo.modifiedFork = markModifiedFork(repo);
      repo.isMotebayaBackup = markBackup(repo);
    }),
  );

  for (const repo of models) {
    repo.categories = deriveCategories(repo);
  }

  return models;
}
