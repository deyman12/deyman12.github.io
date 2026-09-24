<p align="center">
  <img src="public/favicon.svg" alt="lab" width="48" />
</p>

<h1 align="center">deyman12 / lab</h1>

<p align="center">
  Secondary GitHub workspace — experiments, forks, research, archives, backups,<br/>
  and things worth keeping.
</p>

<p align="center">
  <a href="https://deyman12.github.io">
    <img src="https://img.shields.io/badge/live-deyman12.github.io-black?style=flat-square" alt="Live Site" />
  </a>
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" alt="Vite 8" />
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" alt="TypeScript 6" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss" alt="Tailwind v4" />
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-gray?style=flat-square" alt="MIT License" />
  </a>
</p>

---

## What is this

A static single-page portfolio site for the secondary GitHub account
[deyman12](https://github.com/deyman12), affiliated with the main account
[@motebaya](https://github.com/motebaya). It indexes public repositories with
live GitHub API data, classifies them into categories (experiments, forks,
backups, archives), and presents them with a terminal-inspired UI.

Deployed to **GitHub Pages** via GitHub Actions.

## Tech stack

| Layer     | Tool                                            |
| --------- | ----------------------------------------------- |
| Build     | [Vite 8](https://vite.dev/)                     |
| UI        | [React 19](https://react.dev/)                  |
| Language  | [TypeScript 6](https://www.typescriptlang.org/) |
| Styling   | [Tailwind CSS v4](https://tailwindcss.com/)     |
| Animation | [Motion](https://motion.dev/)                   |
| Scroll    | [Lenis](https://lenis.darkroom.engineering/)    |
| Data      | GitHub REST API (public, no auth required)      |

## Features

- **Live GitHub data** — repositories fetched from the public API with
  background refresh
- **Light / dark theme** — toggle in nav, system preference detection, flash
  prevention via inline script
- **Fork hydration** — parent info resolved to detect backups from @motebaya
  and modified forks
- **Category filters** — experiment, fork, modified, backup, archive, collection
- **Search + sort** — filter by name, description, or topics
- **Paginated list** — 8 repos per page with "Show More" button
- **Command palette** — `Ctrl+K` for quick navigation
- **Responsive** — mobile-first, no horizontal scroll
- **Graceful fallback** — hardcoded snapshot when API is unreachable

## Project structure

```
deyman12-porto/
├── public/
│   └── favicon.svg               # (public/data/github.json is generated at build time, git-ignored)
├── scripts/
│   └── fetch-github-data.ts      # build-time GitHub data generator
├── src/
│   ├── assets/                   # images
│   ├── components/
│   │   ├── ActivityTimeline/     # recent commit activity
│   │   ├── CommandPalette/       # Ctrl+K quick nav
│   │   ├── Ecosystem/            # main identity + workspace map
│   │   ├── Footer/
│   │   ├── Hero/                 # hero section + terminal card
│   │   ├── Manifest/             # philosophy + constraints
│   │   ├── Nav/                  # fixed nav bar
│   │   ├── RepositoryExplorer/   # filterable repo list with pagination
│   │   ├── ThemeToggle/          # sun/moon toggle
│   │   └── ui/                   # shared primitives (badge, icons, etc.)
│   ├── data/
│   │   └── profile.ts            # identity, config, fallback repos
│   ├── hooks/
│   │   ├── useActiveSection.ts   # intersection observer
│   │   ├── useCountUp.ts         # animated counters
│   │   ├── useRepositories.ts    # data fetching + cache orchestration
│   │   └── useTheme.ts           # theme state + persistence
│   ├── lib/
│   │   ├── github.ts             # GitHub API client
│   │   ├── github-cache.ts       # localStorage cache layer
│   │   ├── repository.ts         # classification + category logic
│   │   ├── smooth-scroll.ts      # Lenis singleton
│   │   ├── stats.ts              # aggregate counts
│   │   ├── theme.ts              # theme persistence helpers
│   │   └── utils.ts              # cn(), formatCount(), etc.
│   ├── types/
│   │   ├── github.ts             # raw GitHub API types
│   │   └── repository.ts         # normalized app types
│   ├── App.tsx
│   ├── index.css                 # theme variables + Tailwind
│   └── main.tsx
├── .github/workflows/deploy.yml  # CI: build → deploy to Pages
├── docs/                         # architecture, development, data pipeline
├── index.html                    # flash prevention script
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting started

```sh
# install dependencies
npm install

# start dev server
npm run dev
```

The site works immediately with a hardcoded fallback dataset. No API token
required for local development.

## GitHub data (optional)

The build-time script fetches live repository data and writes
`public/data/github.json`. This is **optional** — the site works without it
using the fallback snapshot in `src/data/profile.ts`.

### Without a token (public API)

```sh
npm run fetch-data        # uses unauthenticated API (60 req/hour limit)
npm run build
```

### With a token (recommended for CI)

```sh
GITHUB_TOKEN=ghp_xxx npm run fetch-data   # authenticated (5,000 req/hour)
npm run build
```

### How it works

| Priority | Source               | When                                   |
| -------- | -------------------- | -------------------------------------- |
| 1        | localStorage cache   | Fresh data within 6 hours              |
| 2        | `/data/github.json`  | Static snapshot from last build        |
| 3        | GitHub API (browser) | Background refresh when cache is stale |
| 4        | Hardcoded fallback   | API unreachable or rate limited        |

The `GITHUB_TOKEN` is **never sent to the browser**. It is only used in the
Node.js build script (`scripts/fetch-github-data.ts`) and the GitHub Actions
workflow.

## Deployment

GitHub Actions workflow (`.github/workflows/deploy.yml`) builds and deploys to
GitHub Pages on every push to `main`.

**Setup:**

1. Go to repo **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. The workflow runs automatically on push

No manual token configuration needed — `secrets.GITHUB_TOKEN` is provided by
GitHub Actions automatically.

## Documentation

| Doc                                          | Contents                                              |
| -------------------------------------------- | ----------------------------------------------------- |
| [docs/architecture.md](docs/architecture.md) | Layers, sections, data flow, theming                   |
| [docs/development.md](docs/development.md)   | Setup, scripts, verification, deployment, troubleshooting |
| [docs/github-data.md](docs/github-data.md)   | Data pipeline, snapshot/cache schemas, category rules  |

## Configuration

| File                           | Purpose                                                              |
| ------------------------------ | -------------------------------------------------------------------- |
| `src/data/profile.ts`          | Identity, bio, main account link, fallback repos, filter definitions |
| `scripts/fetch-github-data.ts` | `SECONDARY_USERNAME` and `MAIN_USERNAME` constants                   |
| `src/lib/github.ts`            | API base URL, pagination limits, hydration caps                      |

## License

[MIT](LICENSE)
