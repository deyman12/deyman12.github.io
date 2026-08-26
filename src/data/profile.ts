import { deriveCategories, markBackup } from "../lib/repository";
import type { RepoCategory } from "../types/repository";
import type { Repository } from "../types/repository";

/**
 * ── Single source of truth for identity. ─────────────────────────────
 * Change these values and the whole site follows.
 */
export const profile = {
  /** The GitHub account this lab belongs to. */
  username: "deyman12",
  displayName: "deyman12",
  labName: "lab",
  tagline: ["experiments", "research", "forks", "archive", "backup"],
  githubUrl: "https://github.com/deyman12",
  /**
   * The canonical account this workspace is affiliated with.
   * Backup repos are forks whose upstream belongs to this account.
   */
  mainAccount: {
    username: "motebaya",
    url: "https://github.com/motebaya",
    bio: "WFH - © 2019 to 2025 | Busy Rate IRL 85% | Hobbies",
  },
} as const;

export const sectionIds = [
  "manifest",
  "repositories",
  "activity",
  "ecosystem",
] as const;
export type SectionId = (typeof sectionIds)[number];

export interface FilterDef {
  id: RepoCategory | "all";
  label: string;
}

export const filters: readonly FilterDef[] = [
  { id: "all", label: "All" },
  { id: "experiment", label: "Experiments" },
  { id: "fork", label: "Forks" },
  { id: "modified", label: "Modified" },
  { id: "backup", label: "Backup" },
  { id: "archive", label: "Archive" },
  { id: "collection", label: "Collection" },
] as const;

export interface ManifestEntry {
  key: string;
  title: string;
  description: string;
}

export const manifestEntries: readonly ManifestEntry[] = [
  {
    key: "01",
    title: "Learning",
    description:
      "Unfamiliar technologies and techniques, deliberately broken until understood.",
  },
  {
    key: "02",
    title: "Experiments",
    description:
      "Prototypes, tests, weird ideas. Most stay unfinished — that is the point of a lab.",
  },
  {
    key: "03",
    title: "Forks",
    description: "Upstream projects kept as references or starting points.",
  },
  {
    key: "04",
    title: "Modified forks",
    description:
      "Upstream projects I actually changed — fixes, patches, customizations.",
  },
  {
    key: "05",
    title: "Backup",
    description:
      "Secondary copies of work from @motebaya, kept so it stays existing.",
  },
  {
    key: "06",
    title: "Archive",
    description:
      "No longer maintained. Preserved because deleting history is worse than admitting age.",
  },
  {
    key: "07",
    title: "Collection",
    description:
      "Repositories and resources worth keeping around. A shelf, not shelf-ware.",
  },
] as const;

/**
 * ── Fallback snapshot ────────────────────────────────────────────────
 * Static data used when the live GitHub API is unreachable or
 * rate-limited. The site must never render an empty shell. Values are
 * illustrative; a small banner tells visitors they're reading a snapshot.
 */

type RepoSeed = Partial<Repository> &
  Pick<Repository, "name" | "createdAt" | "updatedAt"> & {
    parent?: Repository["parent"];
    modifiedFork?: boolean;
  };

function makeRepo(seed: RepoSeed): Repository {
  const repo: Repository = {
    id: hashName(seed.name),
    name: seed.name,
    fullName: seed.fullName ?? `${profile.username}/${seed.name}`,
    htmlUrl:
      seed.htmlUrl ?? `https://github.com/${profile.username}/${seed.name}`,
    homepage: seed.homepage ?? null,
    description: seed.description ?? null,
    language: seed.language ?? null,
    topics: seed.topics ?? [],
    stars: seed.stars ?? 0,
    forks: seed.forks ?? 0,
    createdAt: seed.createdAt,
    updatedAt: seed.updatedAt,
    isFork: seed.isFork ?? false,
    isArchived: seed.isArchived ?? false,
    parent: seed.parent ?? null,
    modifiedFork: seed.modifiedFork ?? false,
    isMotebayaBackup: false,
    categories: [],
  };
  repo.isMotebayaBackup = markBackup(repo);
  return { ...repo, categories: deriveCategories(repo) };
}

export const fallbackRepos: readonly Repository[] = [
  makeRepo({
    name: "yakpro-reversing",
    description:
      "Notes and tooling from unwinding obfuscated PHP produced by Yak Pro.",
    language: "PHP",
    topics: ["reverse-engineering", "php", "research"],
    stars: 3,
    createdAt: "2026-04-11T09:20:00Z",
    updatedAt: "2026-07-02T18:41:00Z",
  }),
  makeRepo({
    name: "alom-decoder",
    description:
      "Decoder for a niche checksum algorithm. Built to answer one question.",
    language: "PHP",
    topics: ["research", "experiment"],
    stars: 1,
    createdAt: "2026-05-30T14:00:00Z",
    updatedAt: "2026-06-21T10:12:00Z",
  }),
  makeRepo({
    name: "threads-scrapper",
    description:
      "Chrome extension scraping Threads timelines. Exists because APIs did not.",
    language: "TypeScript",
    topics: ["chrome-extension", "scraper", "experiment"],
    stars: 7,
    forks: 1,
    createdAt: "2026-06-08T08:00:00Z",
    updatedAt: "2026-08-09T22:30:00Z",
  }),
  makeRepo({
    name: "some-project",
    description:
      "Fork of a project from @motebaya. Kept as an off-site backup.",
    language: "Go",
    isFork: true,
    parent: {
      fullName: "motebaya/some-project",
      htmlUrl: "https://github.com/motebaya/some-project",
      pushedAt: "2025-12-01T00:00:00Z",
      ownerLogin: "motebaya",
    },
    createdAt: "2026-01-10T11:00:00Z",
    updatedAt: "2026-01-10T11:00:00Z",
  }),
  makeRepo({
    name: "another-project",
    description: "Fork from @motebaya with local patches applied.",
    language: "TypeScript",
    topics: ["patch"],
    isFork: true,
    modifiedFork: true,
    parent: {
      fullName: "motebaya/another-project",
      htmlUrl: "https://github.com/motebaya/another-project",
      pushedAt: "2025-10-01T00:00:00Z",
      ownerLogin: "motebaya",
    },
    createdAt: "2026-02-17T11:00:00Z",
    updatedAt: "2026-07-28T09:45:00Z",
  }),
  makeRepo({
    name: "upstream-http-cache",
    description:
      "Patched fork: stale-revalidation fix and configurable TTLs on top of upstream.",
    language: "Go",
    topics: ["patch"],
    isFork: true,
    modifiedFork: true,
    parent: {
      fullName: "someone/http-cache",
      htmlUrl: "https://github.com/someone/http-cache",
      pushedAt: "2025-12-01T00:00:00Z",
      ownerLogin: "someone",
    },
    createdAt: "2026-02-17T11:00:00Z",
    updatedAt: "2026-07-28T09:45:00Z",
  }),
  makeRepo({
    name: "tailwind-uikit",
    description: "Reference fork of a component kit, kept close for study.",
    language: "TypeScript",
    isFork: true,
    parent: {
      fullName: "owner/tailwind-uikit",
      htmlUrl: "https://github.com/owner/tailwind-uikit",
      pushedAt: "2025-11-01T00:00:00Z",
      ownerLogin: "owner",
    },
    createdAt: "2025-11-02T10:00:00Z",
    updatedAt: "2025-11-02T10:00:00Z",
  }),
  makeRepo({
    name: "ctf-writeups-2019",
    description: "Challenge write-ups from an older, more chaotic era.",
    language: "Python",
    topics: ["writeups", "ctf"],
    stars: 2,
    isArchived: true,
    createdAt: "2019-09-14T18:00:00Z",
    updatedAt: "2024-03-03T13:37:00Z",
  }),
  makeRepo({
    name: "awesome-obfuscation",
    description:
      "Curated list of code-obfuscation research, papers and tooling.",
    topics: ["awesome-list", "collection", "resources"],
    stars: 12,
    forks: 2,
    createdAt: "2025-06-20T09:00:00Z",
    updatedAt: "2026-05-19T11:11:00Z",
  }),
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h * 31 + name.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}
