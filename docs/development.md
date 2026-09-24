# Development

## Prerequisites

- Node.js 22+ (CI uses 22)
- npm

## Setup

```sh
npm install
npm run dev        # http://localhost:5173
```

No GitHub token is needed for local development. Without a snapshot file the
site falls back to the GitHub API (unauthenticated, 60 req/hour per IP) and
then to the hardcoded dataset in `src/data/profile.ts` — so the page always
renders something.

## Scripts

| Script                 | What it does                                                      |
| ---------------------- | ----------------------------------------------------------------- |
| `npm run dev`          | Vite dev server with HMR                                          |
| `npm run build`        | `tsc -b` type check + production bundle to `dist/`                |
| `npm run lint`         | ESLint (includes React Hooks rules)                               |
| `npm run preview`      | Serve the production `dist/` build locally                        |
| `npm run fetch-data`   | Regenerate `public/data/github.json` from the GitHub API          |

## Working with local GitHub data

By default `public/data/` does not exist locally (it is generated in CI and
git-ignored). To develop against the same snapshot the deployed site uses:

```sh
npm run fetch-data                 # unauthenticated (60 req/hour)
# or
GITHUB_TOKEN=ghp_xxx npm run fetch-data   # 5,000 req/hour
```

Then `npm run dev` as usual — the snapshot is picked up as data source #2.

> The snapshot makes the data layer behave exactly like production. Many
> data-layer bugs (see [troubleshooting](#troubleshooting)) only reproduce
> with the snapshot present, because locally the API path masks them.

## Verification workflow

```sh
npm run lint       # must be clean
npm run build      # must pass tsc + bundle
npm run preview    # then check the rendered page, not just the exit code
```

When touching the data layer, always verify against a snapshot in `preview`
(see previous section) — not just `dev`, which silently takes a different
code path when the snapshot is absent.

## Deployment

Push to `main` → `.github/workflows/deploy.yml`:

1. `npm ci`
2. `npx tsx scripts/fetch-github-data.ts` (with `secrets.GITHUB_TOKEN`)
3. `npm run build` — Vite copies `public/` (including the fresh
   `data/github.json`) into `dist/`
4. Upload `dist/` to GitHub Pages

One-off runs are possible via **Actions → Deploy to GitHub Pages → Run
workflow**. Pages must be set to **Source: GitHub Actions** in repo settings.

## Troubleshooting

### Blank page on the deployed site, works locally

This happened once (2026-08/09, fixed in `src/lib/github-cache.ts`): the
build-time snapshot was loaded and passed to components **unmapped**, so the
derived `categories` field was `undefined` and `repo.categories.includes(...)`
threw inside `Array.filter` during the first render — `Uncaught TypeError:
Cannot read properties of undefined (reading 'includes')`.

It could never reproduce in local `dev` because without
`public/data/github.json` the app takes the API path, which *does* derive
categories. Lessons, now enforced in code:

- Persisted data (snapshot JSON, localStorage cache) is never trusted as
  complete — it is normalized at the boundary in `github-cache.ts`
  (`normalizeRepo`), which guarantees `categories` is populated.
- The localStorage cache carries a `CACHE_VERSION`; entries written by older
  bundles are discarded rather than partially reconciled.
- Verify data-layer changes with a snapshot present (`npm run fetch-data` →
  `npm run preview`), not only through `dev`.

### Stale data on the live site

The Pages build regenerates `data/github.json` on every push. If content
looks stale, check the `fetchedAt` field in
`https://deyman12.github.io/data/github.json` and the last workflow run.
Visitors also hold a 6-hour localStorage cache; a hard refresh pulls the
snapshot, background refresh pulls live API data.

### GitHub API rate limiting (status shows "rate limit reached")

Unauthenticated browser requests share 60 req/hour per IP. The fallback
dataset renders with a visible notice and a "retry live data" button. CI is
unaffected (authenticated, 5,000 req/hour).

## Further reading

- [architecture.md](architecture.md) — layers, sections, theming
- [github-data.md](github-data.md) — data pipeline, cache schema, categories
