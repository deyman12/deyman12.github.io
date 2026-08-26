/**
 * ── Build-time GitHub data generator ─────────────────────────────────
 *
 * Fetches public repository and profile data from the GitHub API,
 * normalizes it, and writes a static JSON file for the SPA to consume.
 *
 * Usage:
 *   npx tsx scripts/fetch-github-data.ts          (public API)
 *   GITHUB_TOKEN=xxx npx tsx scripts/fetch-github-data.ts  (authenticated)
 *
 * The generated file lands at public/data/github.json.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const API_BASE = "https://api.github.com";
const PER_PAGE = 100;
const MAX_PAGES = 3;
const TIMEOUT_MS = 15_000;

// ── Configuration ─────────────────────────────────────────────────────

const SECONDARY_USERNAME = "deyman12";
const MAIN_USERNAME = "motebaya";

// ── Types (subset of what the app uses) ───────────────────────────────

interface RawRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  default_branch: string;
  owner?: { login: string };
  parent?: RawRepo;
}

interface NormalizedRepo {
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
  updatedAt: string;
  isFork: boolean;
  isArchived: boolean;
  parent: {
    fullName: string;
    htmlUrl: string;
    pushedAt: string | null;
    ownerLogin: string | null;
  } | null;
  modifiedFork: boolean;
  isMotebayaBackup: boolean;
}

interface NormalizedUser {
  login: string;
  name: string | null;
  bio: string | null;
  htmlUrl: string;
  publicRepos: number;
}

interface GithubData {
  version: 1;
  fetchedAt: string;
  profile: NormalizedUser;
  repos: NormalizedRepo[];
}

// ── API helpers ───────────────────────────────────────────────────────

const token = process.env.GITHUB_TOKEN;

function headers(): Record<string, string> {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} for ${path}`);
  }
  return (await res.json()) as T;
}

// ── Normalization ─────────────────────────────────────────────────────

function normalizeRepo(raw: RawRepo, parentDetail?: RawRepo): NormalizedRepo {
  const parentRaw = parentDetail?.parent ?? raw.parent;
  const parent = parentRaw
    ? {
        fullName: parentRaw.full_name,
        htmlUrl: parentRaw.html_url,
        pushedAt: parentRaw.pushed_at ?? null,
        ownerLogin: parentRaw.owner?.login ?? null,
      }
    : null;

  const isMotebayaBackup = raw.fork && parent?.ownerLogin === MAIN_USERNAME;

  let modifiedFork = false;
  if (raw.fork && parent?.pushedAt) {
    const mine = new Date(raw.pushed_at || raw.updated_at).getTime();
    const upstream = new Date(parent.pushedAt).getTime();
    modifiedFork = mine > upstream + 60_000;
  }

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
    modifiedFork,
    isMotebayaBackup,
  };
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`Fetching data for @${SECONDARY_USERNAME}...`);

  // Profile
  const user = await getJson<{
    login: string;
    name: string | null;
    bio: string | null;
    html_url: string;
    public_repos: number;
  }>(`/users/${SECONDARY_USERNAME}`);

  const profile: NormalizedUser = {
    login: user.login,
    name: user.name,
    bio: user.bio,
    htmlUrl: user.html_url,
    publicRepos: user.public_repos,
  };

  // Repos
  const pages: RawRepo[][] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const batch = await getJson<RawRepo[]>(
      `/users/${SECONDARY_USERNAME}/repos?per_page=${PER_PAGE}&page=${page}&type=owner&sort=updated`,
    );
    pages.push(batch);
    if (batch.length < PER_PAGE) break;
  }

  const rawRepos = pages.flat();
  console.log(`  ${rawRepos.length} repositories found.`);

  // Hydrate fork parents (prioritize main account forks)
  const FORK_LIMIT = 25;
  const allForks = rawRepos.filter((r) => r.fork);
  const mainForks = allForks.filter((r) =>
    r.full_name.startsWith(`${MAIN_USERNAME}/`),
  );
  const otherForks = allForks.filter(
    (r) => !r.full_name.startsWith(`${MAIN_USERNAME}/`),
  );
  const forks = [...mainForks, ...otherForks].slice(0, FORK_LIMIT);
  console.log(
    `  Hydrating ${forks.length} fork parents (${mainForks.length} from @${MAIN_USERNAME})...`,
  );

  const parentCache = new Map<string, RawRepo>();
  await Promise.allSettled(
    forks.map(async (fork) => {
      try {
        const detail = await getJson<RawRepo>(`/repos/${fork.full_name}`);
        if (detail.parent) parentCache.set(fork.full_name, detail);
      } catch {
        // Graceful degradation — fork stays "unverified upstream"
      }
    }),
  );

  const repos = rawRepos.map((raw) =>
    normalizeRepo(raw, parentCache.get(raw.full_name)),
  );

  const data: GithubData = {
    version: 1,
    fetchedAt: new Date().toISOString(),
    profile,
    repos,
  };

  // Write output
  const outDir = join(process.cwd(), "public", "data");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "github.json");
  writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Written to ${outPath}`);
}

main().catch((err) => {
  console.error("Failed to fetch GitHub data:", err);
  process.exit(1);
});
