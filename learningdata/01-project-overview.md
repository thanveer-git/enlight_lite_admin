# 01 — Project Overview (admin_modern)

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 02-frontend-architecture, 03-component-and-page-patterns,
> 04-state-and-data-fetching, 05-domain-model, 06-data-and-persistence-design,
> 07-coding-standards.

## What this is

`admin_modern` is the modern admin panel for the Enfin LMS, built with
Next.js 14 (App Router), React 18, Tailwind CSS, and shadcn-style primitives.
It covers LMS administration: users, courses, rubrics, assignments, grading
scales, assessments, evaluations (grading console), and submissions.

Key fact for everything that follows: the app currently runs on **mocked
data**. There is no live backend. `services/api-client.ts` serves `FAKE_*`
seed data with simulated latency (`SIMULATED_LATENCY_MS = 250`), and
`providers/session-provider.tsx` injects `FAKE_CURRENT_USER` instead of a
real session. Every guide notes where the real API will plug in.

## Top-level layout

```
html/admin_modern/
  app/                 # Next.js routes, layouts, providers, globals.css
  components/
    ui/                # 22 primitives (button, dialog, table, …) — shadcn-owned
    composite/         # App-level compositions (app-layout, data-table, toolbar, …)
  features/            # Domain modules: assignments, evaluation, rubrics
  templates/           # Page shells: listing, form, wizard, dashboard, settings, evaluation-detail
  stores/              # Zustand client stores (sidebar, evaluation, column-pinning)
  providers/           # Theme, Query (React Query), Session context providers
  hooks/               # use-session, use-navigation, use-debounce, use-media-query
  services/            # api-client (mock), endpoints, handlers/* (FAKE_* seeds)
  lib/                 # cn(), format helpers, query-keys, labels
  constants/           # ROUTES, NAV_ITEMS, table defaults
  types/               # session, rubric, table, navigation
  seeds/               # seeds/assignments.json (static seed data)
  scripts/             # headless-verify.mts, verify-rubric-engine.ts
  EDUBEX_Assignments_AdminSide.md   # Product spec for the Assignments area
  STYLE_GUIDE.md       # Visual contract (tokens, templates, z-index, motion)
```

Immutability note: `STYLE_GUIDE.md` declares the folder structure above
immutable — new code goes into one of these folders, following the nearest
existing pattern.

## How to run it

Package manager is **pnpm** (see `pnpm-lock.yaml`). Scripts from
`package.json`:

| Command | What it does |
|---|---|
| `pnpm dev` (`dev:fresh` → `next dev`) | Start dev server |
| `pnpm dev:clean` | Kill stray Next processes, then start fresh |
| `pnpm build` | Production build (`next build`) |
| `pnpm start` | Serve production build (`next start`) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | `next lint` + `lint:extra` (ESLint over features, hooks, stores, providers, composite, templates, types, constants, services with `--max-warnings=0`) |

Entry behavior: `app/page.tsx` redirects `/` → `/admin_modern`, which is the
dashboard. Dev-only verification routes live under `app/dev/` (`providers`,
`composites`) and style-guide demos under `app/(admin)/admin_modern/`
(`listings`, `forms`, `wizards`, `settings`).

A rewrite in `next.config.mjs` maps the public LMS alias
`/admin/rubrics/*` → `/admin_modern/rubrics/*` (rewrite, not redirect, so
the address bar keeps the LMS URL). Internals always use `ROUTES`
(`constants/routes.ts`), which emit `/admin_modern/*` paths.

## Prereqs

- Node.js (Next 14 needs Node 18+) and `pnpm`.
- No database, no env vars, no external services — the mock layer means
  `pnpm dev` works with zero setup.

## Where to go next

- Architecture and data flow: 02-frontend-architecture
- Building a page: 03-component-and-page-patterns
- Product spec for assignments: `EDUBEX_Assignments_AdminSide.md` (repo root
  of `admin_modern`); domain detail in 05-domain-model
