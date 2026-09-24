# Architecture

A static single-page portfolio (React 19 + Vite 8 + TypeScript) deployed to
GitHub Pages as a user site at `https://deyman12.github.io/`. There is no
backend: everything is either build-time generated or fetched client-side
from the public GitHub API.

## Layers

```
┌─────────────────────────── Browser ────────────────────────────┐
│                                                                │
│  App.tsx ── sections (Hero, Manifest, RepositoryExplorer,      │
│              ActivityTimeline, Ecosystem, Footer)              │
│     │                                                          │
│  useRepositories  ←── the only data orchestrator               │
│     │                                                          │
│  ┌──┴───────────────────┬──────────────────────────┐           │
│  github-cache.ts       github.ts                  │           │
│  (localStorage +       (REST client + fork        │           │
│   static snapshot)      hydration)                │           │
│  └── /data/github.json ─┴──────────────────────────┘           │
└────────────▲───────────────────────────────────────────────────┘
             │ copied from public/ at build time
   scripts/fetch-github-data.ts   (CI only, has GITHUB_TOKEN)
```

- **`scripts/fetch-github-data.ts`** — runs in CI (and optionally locally)
  before `vite build`. Fetches profile + repos from the GitHub REST API and
  writes `public/data/github.json`. This file is **generated, never
  committed** (see `.gitignore`).
- **`src/lib/github-cache.ts`** — persistence boundary. Serves the static
  snapshot and the localStorage cache, and normalizes both into the strict
  `Repository` model (see [github-data.md](github-data.md#normalization-contract)).
- **`src/lib/github.ts`** — runtime REST client. Paginates `/users/:u/repos`,
  hydrates fork parents one request per fork, classifies each repo.
- **`src/hooks/useRepositories.ts`** — the source-selection state machine.
  Components never fetch; they read `status`, `repos`, `notice`, `fetchedAt`.

## Data source priority

```
1. localStorage cache (fresh, version-matched)      → instant
2. /data/github.json (build-time snapshot)          → one static fetch
3. GitHub REST API (background refresh when stale)  → live data
4. Hardcoded fallback (src/data/profile.ts)         → API unreachable
```

The snapshot is served at `status: "ready"` immediately; if it is older than
the 6-hour TTL, step 3 runs in the background and swaps in fresh data when it
arrives. See [github-data.md](github-data.md) for the full pipeline.

## Repository model & classification

`src/types/repository.ts` defines the normalized `Repository`. Every repo is
filed into one or more `RepoCategory` values by `deriveCategories()`
(`src/lib/repository.ts`), in priority order:

1. **backup** — fork whose upstream owner is the main account (`@motebaya`)
2. **modified** — fork whose push timestamp is newer than its parent's
   (1-minute skew tolerated), or that carries a "patch"-style topic
3. **fork** — any other fork
4. **archive** — GitHub-archived or carrying an archive-style topic
5. **collection** / **experiment** — topic-driven signals
6. default: `experiment` (a lab's resting state), `fork` for forks

Classification has a single implementation (`deriveCategories`) and is applied
at every data boundary — API responses, snapshot loads, cache reads, and the
hardcoded fallback are all guaranteed to carry populated categories.

## Sections

| Section (file)                    | Role                                                            |
| --------------------------------- | --------------------------------------------------------------- |
| `Hero/` (+ `TerminalCard`)        | Identity, animated stat counters                                |
| `Manifest/`                       | Philosophy copy, filter legend                                  |
| `RepositoryExplorer/` (+ `Item`)  | Filterable/searchable/sortable repo index, 8-per-page pagination |
| `ActivityTimeline/`               | Most-recently-pushed repos as a "commit log"                    |
| `Ecosystem/`                      | Main-account (@motebaya) affiliation and workspace map          |
| `Footer/`, `Nav/`                 | Chrome; `CommandPalette` (Ctrl+K) overlays navigation            |

Shared primitives live in `src/components/ui/` (badges, icons, reveal-on-scroll
wrapper, section headers). Identity constants — usernames, filter definitions,
fallback repos — live in `src/data/profile.ts` and are the single place to
edit to rebrand the site.

## Theming & motion

- Tailwind CSS v4 (CSS-first config via `@tailwindcss/vite`); theme variables
  in `src/index.css` with `light`/`dark` scopes.
- `useTheme` + `src/lib/theme.ts` persist the choice; an inline script in
  `index.html` applies it before first paint to prevent flash.
- Animations via Motion (`motion/react`); smooth scrolling via Lenis
  (`src/lib/smooth-scroll.ts` singleton).
- React Compiler (`babel-plugin-react-compiler` via `@rolldown/plugin-babel`)
  auto-memoizes components.

## Build & deploy

`npm run build` = `tsc -b` (type check) then `vite build` (bundle to `dist/`).
`.github/workflows/deploy.yml` runs on push to `main`: `npm ci` → fetch data →
build → upload `dist/` to GitHub Pages. Vite `base` is `/` because this is a
user site served from the account root.

Further reading: [development.md](development.md) ·
[github-data.md](github-data.md)
