# 03 — Component and Page Patterns

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 02-frontend-architecture,
> 04-state-and-data-fetching, 05-domain-model, 06-data-and-persistence-design,
> 07-coding-standards.

## Page-building recipe

Every feature screen picks one shell from `templates/`. The route file stays
thin: breadcrumbs + template props + the feature component.

### The six shells

| Shell | File | Props pattern | Used for |
|---|---|---|---|
| `ListingPage` | `templates/listing-page.tsx` | `title`, `description`, `actions`, `kpis?`, `toolbar`/`toolbarFilters`/`toolbarExtras`, `children` | Rubrics, assignments, submissions, grading lists |
| `FormPage` | `templates/form-page.tsx` | `breadcrumbs`, `title`, `description?`, `actions?`, `children` | Single-form editors |
| `WizardPage` | `templates/wizard-page.tsx` | `steps[]`, `currentStep`, `onStepClick?`, `isStepLocked?`, `content` or `children` (custom rail) | Rubric wizard, assignment wizard |
| `DashboardPage` | `templates/dashboard-page.tsx` | stat cards with deltas, recent activity, quick-start | `/admin_modern` root |
| `SettingsPage` | `templates/settings-page.tsx` | side-nav + in-place section swap | Settings |
| `EvaluationDetailPage` | `templates/evaluation-detail-page.tsx` | left tabs + detail slots | Submission evaluation console |

`ListingPage` renders `Breadcrumb` → `PageHeader` → optional `kpis` →
`Toolbar` (only when a toolbar slot is provided) → `children`.
`WizardPage` renders a sticky step rail (`sticky top-0 z-sticky`, with an
IntersectionObserver `data-stuck` state for styling) over `content`, unless
`children` is passed for a fully custom stepper (e.g. the assignment wizard
controls its own steps).

### Breadcrumb / header / toolbar

- `components/composite/breadcrumb.tsx` (`Breadcrumb`, `BreadcrumbItem`).
- `components/composite/page-header.tsx` (`PageHeader`: `title`,
  `description?`, `actions?`).
- `components/composite/toolbar.tsx` (`Toolbar`: `search`, `filters`,
  `actions` slots) + `filter-popover.tsx` (`FilterPopover`,
  `MAX_INLINE` inline options) for faceted filters.
- `components/composite/form-section.tsx` (`FormSection`) groups form fields
  with title/description; `empty-state.tsx` (`EmptyState`) for zero-data.
- `components/composite/pagination.tsx` and
  `components/composite/data-table/data-table-pagination.tsx` for paging;
  defaults from `constants/table.ts`.

## Data tables

`components/composite/data-table/` (`data-table`,
`data-table-column-header`, `data-table-toolbar`, `data-table-pagination`,
`data-table-skeleton`) wraps TanStack Table (`@tanstack/react-table`).
Pattern per list page:

1. Feature owns column defs (e.g. `features/rubrics/columns.tsx`,
   `grade-scale-columns.tsx`) with sortable header cells.
2. Data arrives as `PaginatedResponse<T>` (`types/table.ts`: `data`, `total`,
   `page`, `pageSize`) from `apiClient.list*`.
3. Column pinning persists per table via `stores/column-pinning-store.ts`
   (`pin`/`unpin`/`clearPinning`/`setPinning`/`getPinning`, keyed by an
   opaque `tableId`, localStorage-backed).

## Forms

`react-hook-form` + `@hookform/resolvers` + `zod` for schema validation.
Feature-local `validation.ts` files hold the schemas
(`features/assignments/wizard/validation.ts`,
`features/rubrics/grade-scale-validation.ts`,
`features/rubrics/wizard/validation.ts`). Rich text via
`components/composite/rich-text-editor/` (TipTap: starter-kit, link,
underline, table extensions). Date/time via `components/ui/date-time-field.tsx`.
`hooks/use-debounce.ts` (`useDebounce`, default 300ms) backs search inputs;
`hooks/use-media-query.ts` backs responsive behavior.

## Cards and layout helpers

- `components/composite/e-card.tsx` (`ECard` + `ECardRoot/Header/Body/Footer`,
  `ECardVariant`) — KPI and summary cards.
- `components/composite/horizontal-scroll-container/` — overflow rows.
- App chrome in `components/composite/app-layout/` (`app-layout`,
  `app-header`, `app-sidebar`, `app-sidebar-mobile`, `sidebar-nav`,
  `nav-user`, `theme-toggle`); sidebar collapsed/mobile state in
  `stores/sidebar-store.ts` (persisted `collapsed` only, key
  `admin_modern_sidebar`).

## Primitives vs composites

- `components/ui/*` are shadcn-owned (style `new-york`, CSS variables on,
  `components.json`). Do not restyle them in place or add raw colors; compose
  them instead. Full state matrix: `components/ui/README.md`.
- `components/composite/*` may only compose primitives — never raw HTML
  elements with ad-hoc styling that bypasses tokens (see 07-coding-standards
  for the hex/token lint rules).

## Routing helpers

Always link via `ROUTES` (`constants/routes.ts`), never string literals:
`ROUTES.admin.rubrics.form(0)` for create, `.form(id)` for edit; same shape
for `grading` and `assignments`; `ROUTES.admin.submissions.detail(id)` for
the evaluation console. Sidebar entries come from `NAV_ITEMS`
(`constants/navigation.ts`), consumed through `hooks/use-navigation.ts`.

## Terminology centralization

User-facing terms live in `lib/labels.ts` (`LEARNER_LABEL`: Learner/Learners)
so rebranding touches one file. Consumers: access-rule cards ("Assign to"),
resolved-preview dialogs, search placeholders.
