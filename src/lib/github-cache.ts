/**
 * ── Client-side GitHub data cache ─────────────────────────────────────
 *
 * Uses localStorage with stale-while-revalidate semantics.
 * The build-time snapshot (public/data/github.json) is the primary source;
 * the browser cache is a secondary layer for background refresh.
 */

import type { Repository } from "../types/repository";
import type { GitHubUser } from "../types/github";

const CACHE_KEY = "github-data-cache";
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

export function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    return entry.data;
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
    return Date.now() < entry.expiresAt;
  } catch {
    return false;
  }
}

// ── Write ─────────────────────────────────────────────────────────────

export function writeCache(data: CachedData): void {
  try {
    const entry: CacheEntry = {
      version: 1,
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
    return {
      version: raw.version ?? 1,
      fetchedAt: new Date(raw.fetchedAt).getTime(),
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
      repos: raw.repos ?? [],
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
