# GitHub data pipeline

How repository data gets from the GitHub REST API to the screen, and the
contracts that keep the four sources interchangeable.

## Sources, in priority order

`useRepositories` (`src/hooks/useRepositories.ts`) picks a source:

| # | Source                    | Module                 | When                                   |
| - | ------------------------- | ---------------------- | -------------------------------------- |
| 1 | localStorage cache        | `src/lib/github-cache.ts` | Fresh (≤ 6h) and version-matched   |
| 2 | `/data/github.json`       | `loadStaticSnapshot()` | Always, when present                   |
| 3 | GitHub REST API           | `src/lib/github.ts`    | Snapshot stale → background refresh; or no snapshot at all |
| 4 | Hardcoded fallback        | `src/data/profile.ts`  | API failed (rate limit / unreachable)  |

Snapshot data renders at `status: "ready"` immediately; when it is older than
the TTL the API refresh runs in the background and swaps in live data. Only
when the API *fails* does `status` become `"fallback"`, which surfaces the
yellow notice banner and the retry button in the repository section.

## Build-time generator (`scripts/fetch-github-data.ts`)

Runs in CI before `vite build` (and optionally via `npm run fetch-data`).

1. `GET /users/:username` — profile.
2. `GET /users/:username/repos?per_page=100&type=owner&sort=updated` — up to
   3 pages.
3. `GET /repos/:full_name` for up to 25 forks — to read `parent` (the list
   endpoint omits it), prioritizing forks of the main account so backup
   detection works even beyond the cap. Failures degrade gracefully: the fork
   just stays "unverified upstream".
4. Writes `public/data/github.json` (generated, git-ignored — never commit it).

Output shape (camelCase, deliberately close to the app's `Repository` model —
but **without `categories`**, which is derived client-side):

```jsonc
{
  "version": 1,
  "fetchedAt": "2026-08-26T20:17:36.421Z",
  "profile": { "login": "…", "name": "…", "bio": "…", "htmlUrl": "…", "publicRepos": 186 },
  "repos": [
    {
      "id": 1, "name": "repo", "fullName": "deyman12/repo", "htmlUrl": "…",
      "homepage": null, "description": "…", "language": "PHP",
      "topics": ["research"], "stars": 3, "forks": 0,
      "createdAt": "…", "updatedAt": "…",
      "isFork": false, "isArchived": false,
      "parent": { "fullName": "…", "htmlUrl": "…", "pushedAt": "…", "ownerLogin": "…" },
      "modifiedFork": true, "isMotebayaBackup": false
    }
  ]
}
```

## Runtime client (`src/lib/github.ts`)

Same endpoints as the generator, from the browser (unauthenticated). Wraps
failures in `GitHubError` carrying `status` and `rateLimited` (403 or
`x-ratelimit-remaining: 0`) — the hook maps these to the human-readable
`notice`. After normalizing, it hydrates fork parents (≤ 25, main-account
forks first) and derives categories for every repo.

## Normalization contract

**Every repo that reaches a component is a complete `Repository`, with
`categories` populated.** This is enforced at the data boundaries in
`src/lib/github-cache.ts` (`normalizeRepo()`):

- `loadStaticSnapshot()` maps every JSON repo through `normalizeRepo`
  (the generator intentionally does not emit categories).
- `readCache()` maps every cached repo through `normalizeRepo`.
- `fetchRepositories()` derives categories after hydration.
- `fallbackRepos` are built by `makeRepo()` in `src/data/profile.ts`.

`normalizeRepo` fills defaults for any field missing from an older shape and
derives `categories` via `deriveCategories()` when absent/empty. Never add a
new `Repository` field without teaching `normalizeRepo` a default for it.

## Cache schema & versioning

localStorage key `github-data-cache`:

```jsonc
{
  "version": 2,                        // CACHE_VERSION in github-cache.ts
  "fetchedAt": 1724700000000,
  "expiresAt": 1724721600000,          // fetchedAt + 6h
  "data": { "version": 1, "fetchedAt": 0, "user": { … }, "repos": [ … ] }
}
```

- Reads reject entries whose `version` ≠ `CACHE_VERSION` — an entry written
  by an older bundle is discarded wholesale, never partially reconciled.
  **Bump `CACHE_VERSION` whenever the persisted `Repository` shape changes.**
- TTL is 6 hours for repos (`REPO_TTL`); 24 hours is exported for profile use.
- All storage access is wrapped in try/catch — private mode / quota errors
  degrade to "no cache", never to a crash.

## Category derivation (`deriveCategories`, `src/lib/repository.ts`)

Priority order — first structural rule wins, topics only add:

1. **backup** — fork whose `parent.ownerLogin` equals the main account
   (`@motebaya`). Structural, never topic-based.
2. **modified** — fork pushed after its parent (`modifiedFork`, 1-minute
   skew tolerated) or carrying a patch-style topic (`patch*`, `modified`,
   `customized`, `fixed`, `port*`).
3. **fork** — any remaining fork.
4. Topic signals: **archive** (`archive`, `deprecated`, `abandoned`, …),
   **collection** (`collection`, `awesome`, `resources`, …), **experiment**
   (`experiment`, `playground`, `ctf`, `writeups`, …), **modified** (above).
5. Default when nothing matched: `experiment` (or `fork` for forks).

Display order is fixed (`backup → modified → fork → archive → collection →
experiment`); the first entry is a repo's primary label. To change taxonomy,
edit `TOPIC_SIGNALS` / the structural rules in one place, and the filter
definitions in `src/data/profile.ts`.

## Incident notes: 2026-08 "includes of undefined"

The first deployed build shipped `loadStaticSnapshot()` returning
`raw.repos` unmapped. Snapshot repos therefore had `categories === undefined`,
and the first `Array.filter` that touched `repo.categories.includes(...)`
crashed the whole tree — blank page for every visitor whose browser had no
fresh cache, i.e. effectively everyone.

Root cause chain:

1. CI generates `github.json` without `categories` (by design — derivation
   lives client-side in a single place).
2. The snapshot loader passed records straight through, violating the
   normalization contract.
3. Local `dev` masked it: without the snapshot file the app used the API
   path, which derives categories — so the bug only existed in production.

Fix: boundary normalization (`normalizeRepo`) + cache `CACHE_VERSION` bump to
drop entries written by the broken bundle. See
[development.md § troubleshooting](development.md#troubleshooting).
