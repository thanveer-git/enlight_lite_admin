# 02 — Frontend Architecture

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 03-component-and-page-patterns,
> 04-state-and-data-fetching, 05-domain-model, 06-data-and-persistence-design,
> 07-coding-standards.

## Rendering model

Next.js 14 App Router. Server Components by default; `"use client"` marks
interactive boundaries (providers, stores, wizard steps, evaluation tabs).
Root shell: `app/layout.tsx` (fonts via `next/font/local`, Geist VF/Mono)
renders `<Providers>` from `app/providers.tsx`, which nests:

```
ThemeProvider → QueryProvider → SessionProvider (+ <Toaster/>)
```

- `providers/theme-provider.tsx` — `next-themes`; dark mode is the design
  baseline, light mode a fully-themed alternative (`STYLE_GUIDE.md`), no FOUC.
- `providers/query-provider.tsx` — TanStack Query client (`staleTime: 30_000`,
  `refetchOnWindowFocus: false`, `retry: 1`; devtools off in production).
- `providers/session-provider.tsx` — React Context holding `{ session, user }`;
  today the value is `FAKE_CURRENT_USER` (`services/handlers/users.ts`) with
  an 8-hour `expiresAt`. Real auth replaces this one file; consumers use
  `hooks/use-session.ts` and never touch the provider directly.

Admin chrome: `app/(admin)/layout.tsx` wraps everything in `<AppLayout>`
(`components/composite/app-layout/app-layout.tsx`) — header, sidebar
(desktop + mobile), nav user, theme toggle.

## Layer responsibilities

| Layer | Lives in | Owns | May import from |
|---|---|---|---|
| Routes | `app/(admin)/admin_modern/*` | Thin route entries: breadcrumbs, template choice, feature component wiring | templates, features, constants |
| Page shells | `templates/` | Page-level layout: breadcrumb + header + toolbar/stepper + slots | composite, lib |
| Domain modules | `features/*` | One folder per domain (`assignments`, `evaluation`, `rubrics`): wizard steps, columns, engine, seeds, validation | templates, composite, lib, types, constants, services |
| Composites | `components/composite/` | App-level components composed **only of primitives** (app-layout, data-table, toolbar, pagination, e-card, breadcrumb, page-header, form-section, filter-popover, empty-state, rich-text-editor, horizontal-scroll-container) | ui, lib |
| Primitives | `components/ui/` | 22 shadcn-owned primitives (avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, radio-group, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip) — see `components/ui/README.md` for the state matrix | lib |
| Client state | `stores/` | Zustand stores (sidebar persisted; evaluation ephemeral; column-pinning persisted per table) | types, features types |
| Server cache | React Query + `services/` | Fetching, caching, key factory (`lib/query-keys.ts`) | — |
| Session | `providers/` + `hooks/use-session.ts` | Current user context | services (mock today) |
| Foundation | `lib/`, `types/`, `constants/`, `hooks/` | `cn()`, formatters, query keys, shared types, `ROUTES`/`NAV_ITEMS`/table defaults, generic hooks | — |

Hard rule (enforced by `.eslintrc` `no-restricted-imports` override on
`features/**`): **no cross-feature imports**. Shared code moves down to
`components/composite`, `lib`, or `types`. `scripts/` is exempt.

## Data flow of a typical page

List page (e.g. rubrics, `app/(admin)/admin_modern/rubrics/page.tsx`):

1. Route renders a `templates/listing-page.tsx` (`ListingPage`) with title,
   toolbar slots, and children.
2. Data comes from `services/api-client.ts` (`apiClient.listRubrics`) via
   React Query keys from `lib/query-keys.ts` (`queryKeys.rubrics.list`).
3. Table rendering uses `components/composite/data-table/` on TanStack Table
   column defs owned by the feature (`features/rubrics/columns.tsx`).
4. Pagination constants from `constants/table.ts` (`DEFAULT_PAGE_SIZE = 10`,
   `PAGE_SIZE_OPTIONS`, `DEFAULT_SORT_DIR`).

Detail/wizard page (e.g. rubric form, assignment form):

1. Route `.../form/[id]/page.tsx` loads a draft via `apiClient.getRubricDraft`
   / `getAssignmentDraft` (`"0"` or unknown id → blank draft = create mode).
2. Wizard state lives in feature-local components
   (`features/rubrics/wizard/rubric-wizard.tsx`,
   `features/assignments/wizard/steps/*`) inside a `templates/wizard-page.tsx`
   shell with a sticky step rail.
3. Save goes back through `apiClient.create*/update*` (mock: mutates the
   in-memory `FAKE_*` arrays; see 04-state-and-data-fetching).

Evaluation console (e.g. `submissions/[submissionId]/`):

1. `evaluation-detail-client.tsx` seeds the Zustand evaluation store
   (`stores/evaluation-store.ts`) per submission id.
2. `features/evaluation/components/hooks/use-evaluation.ts` selects draft +
   derived result; `features/evaluation/derive.ts` glues the rubric engine
   output (`evaluateRubric`) to page shape (effective grade, override
   precedence, completion decision). Detail in 05-domain-model.

## Navigation and routing

- `constants/routes.ts` (`ROUTES`) is the single source of route paths;
  dynamic helpers take ids (`rubrics.form(id)`, `grading.form(id)`,
  `assignments.form(id)`, `submissions.detail(id)`; `0` = create).
- `constants/navigation.ts` (`NAV_ITEMS`) defines sidebar sections/items from
  `ROUTES` with lucide icons; `hooks/use-navigation.ts` currently builds nav
  from `FAKE_SIDEBAR_RESPONSE` via
  `services/handlers/sidebar-transform.ts` (`buildNavigationFromSidebar`) —
  so the real sidebar API only needs to match that response shape.
- Types for nav live in `types/navigation.ts` (`NavItem`, `NavSubItem`,
  `NavSection`, `Navigation`).

## Dev and demo routes

- `app/dev/providers/page.tsx` — proves Theme/Query/Session providers wired.
- `app/dev/composites/page.tsx` — every composite rendered on one page.
- `app/(admin)/admin_modern/{listings,forms,wizards,settings}/page.tsx` —
  live demos of each template per `STYLE_GUIDE.md`.
