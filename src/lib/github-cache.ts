/**
 * ── Client-side GitHub data cache ─────────────────────────────────────
 *
 * Uses localStorage with stale-while-revalidate semantics.
 * The build-time snapshot (public/data/github.json) is the primary source;
 * the browser cache is a secondary layer for background refresh.
 */

import type { Repository } from "../types/repository";
import type { GitHubUser } from "../types/github";
import { deriveCategories } from "./repository";

const CACHE_KEY = "github-data-cache";
/**
 * Bump when the persisted Repository shape changes so stale entries are
 * discarded instead of handed to components in an incomplete form.
 * v2: categories became mandatory (derived on read).
 */
const CACHE_VERSION = 2;
const REPO_TTL = 6 * 60 * 60 * 1000; // 6 hours
const PROFILE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedData {
  version: number;
  fetchedAt: number;
  user: GitHubUser | null;
  repos: Repository[];
}

interface CacheEntry {
  version: number;
  fetchedAt: number;
  expiresAt: number;
  data: CachedData;
}

// ── Read ──────────────────────────────────────────────────────────────

/**
 * Rehydrate a persisted repo record into the full Repository model.
 *
 * Persisted data is never trusted to be complete: the build-time snapshot
 * predates derived fields (it carries no `categories`), and old cache
 * entries may predate any field added since. Components rely on the
 * invariant that `categories` is always populated, so it is derived here —
 * at the boundary — via the single source of truth, `deriveCategories`.
 */
function normalizeRepo(raw: Partial<Repository> | null | undefined): Repository {
  const repo: Repository = {
    id: raw?.id ?? 0,
    name: raw?.name ?? "unknown",
    fullName: raw?.fullName ?? raw?.name ?? "unknown",
    htmlUrl:
      raw?.htmlUrl ??
      `https://github.com/${raw?.fullName ?? raw?.name ?? ""}`,
    homepage: raw?.homepage ?? null,
    description: raw?.description ?? null,
    language: raw?.language ?? null,
    topics: raw?.topics ?? [],
    stars: raw?.stars ?? 0,
    forks: raw?.forks ?? 0,
    createdAt: raw?.createdAt ?? "",
    updatedAt: raw?.updatedAt ?? "",
    isFork: raw?.isFork ?? false,
    isArchived: raw?.isArchived ?? false,
    parent: raw?.parent ?? null,
    modifiedFork: raw?.modifiedFork ?? false,
    isMotebayaBackup: raw?.isMotebayaBackup ?? false,
    categories: raw?.categories ?? [],
  };
  if (repo.categories.length === 0) {
    repo.categories = deriveCategories(repo);
  }
  return repo;
}

export function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (entry.version !== CACHE_VERSION || !entry.data?.repos) return null;
    return { ...entry.data, repos: entry.data.repos.map(normalizeRepo) };
  } catch {
    return null;
  }
}

/** Is the cached data still within its freshness window? */
export function isCacheFresh(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.version === CACHE_VERSION && Date.now() < entry.expiresAt;
  } catch {
    return false;
  }
}

// ── Write ─────────────────────────────────────────────────────────────

export function writeCache(data: CachedData): void {
  try {
    const entry: CacheEntry = {
      version: CACHE_VERSION,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + REPO_TTL,
      data,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full or unavailable — degrade silently.
  }
}

// ── Static snapshot loader ────────────────────────────────────────────

/**
 * Load the build-time generated snapshot. Returns null if unavailable
 * (e.g. local dev without running the generator).
 */
export async function loadStaticSnapshot(): Promise<CachedData | null> {
  try {
    const res = await fetch("/data/github.json", { cache: "no-store" });
    if (!res.ok) return null;
    const raw = await res.json();
    const fetchedAt = new Date(raw.fetchedAt).getTime();
    return {
      version: raw.version ?? 1,
      fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
      user: raw.profile
        ? {
            login: raw.profile.login,
            name: raw.profile.name,
            bio: raw.profile.bio,
            html_url: raw.profile.htmlUrl,
            avatar_url: "",
            public_repos: raw.profile.publicRepos,
            followers: 0,
            created_at: "",
          }
        : null,
      repos: (Array.isArray(raw.repos) ? raw.repos : []).map(normalizeRepo),
    };
  } catch {
    return null;
  }
}

// ── TTL helpers ───────────────────────────────────────────────────────

export function repoTTL(): number {
  return REPO_TTL;
}

export function profileTTL(): number {
  return PROFILE_TTL;
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Storage unavailable or SSR
  }
}
