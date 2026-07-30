# Admin Modern — Style Guide

The visual contract for the admin panel. Every screen follows this guide. No exceptions.

## Live demo routes

Start the dev server (`pnpm dev`) and walk these:

### Page templates (`templates/`)

| Template | Demo route | What to verify |
|---|---|---|
| `ListingPage` | [/admin_modern/listings](http://localhost:3000/admin_modern/listings) | Breadcrumb, title, search toolbar, DataTable with sort/paginate/select |
| `FormPage` | [/admin_modern/forms](http://localhost:3000/admin_modern/forms) | Multiple FormSections, action footer, Toast on save |
| `WizardPage` | [/admin_modern/wizards](http://localhost:3000/admin_modern/wizards) | Step indicator, Back/Next, content swap, Confirm toast |
| `DashboardPage` | [/admin_modern](http://localhost:3000/admin_modern) | Stat cards with deltas, recent activity, quick-start panel |
| `SettingsPage` | [/admin_modern/settings](http://localhost:3000/admin_modern/settings) | Side-nav, in-place section swap |

### Verification routes (`app/dev/`)

| Route | Purpose |
|---|---|
| [/dev/providers](http://localhost:3000/dev/providers) | ThemeProvider, QueryProvider, SessionProvider wired |
| [/dev/composites](http://localhost:3000/dev/composites) | Every composite rendered in one page |

## Primitives

`components/ui/` — see [`components/ui/README.md`](./components/ui/README.md) for the full state matrix.

22 primitives: avatar, badge, button, card, checkbox, dialog, dropdown-menu, input, label, popover, radio-group, scroll-area, select, separator, sheet, skeleton, sonner, switch, table, tabs, textarea, tooltip.

## Composites

`components/composite/` — composed only from primitives. No raw colors.

- **Layout**: `app-layout/` (app-layout, app-header, app-sidebar, app-sidebar-mobile, sidebar-nav, nav-user, theme-toggle)
- **Chrome**: breadcrumb, page-header, toolbar, empty-state, form-section, pagination
- **Data**: data-table/ (data-table, data-table-column-header, data-table-pagination, data-table-toolbar, data-table-skeleton)

## Design tokens

All tokens live in [`app/globals.css`](./app/globals.css). Tailwind maps them in [`tailwind.config.ts`](./tailwind.config.ts).

### Color groups

`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `border`, `input`, `ring`, `sidebar`, `chart`.

### Semantic rules

- **Never** use raw hex outside `globals.css` and `tailwind.config.ts`. Enforced by ESLint.
- **Never** use raw Tailwind values that bypass tokens (e.g., `bg-blue-500`, `text-[14px]`, `p-[7px]`). Use `bg-primary`, `text-sm`, `p-2`.
- **Dark mode** is the design baseline; light mode is a fully-themed alternative. The ThemeToggle in the header swaps both, no FOUC.

## Motion

- Default duration: 200ms (also `150ms`, `300ms` available).
- All transitions honor `prefers-reduced-motion` (Tailwind `motion-safe` / `motion-reduce`).
- Available keyframes: `accordion-down/up`, `fade-in/out`, `slide-in-{top,bottom,left,right}`.

## Z-index scale

`dropdown 50`, `sticky 60`, `header 70`, `sidebar 80`, `overlay 90`, `modal 100`, `popover 110`, `tooltip 120`, `toast 130`. Use these utilities — never `z-10`, `z-20`, etc.

## Folder structure (immutable)

```
app/             # Next.js App Router routes, layouts, providers, globals.css
components/
  ui/            # Primitives (shadcn-owned) — never bypass with raw colors
  composite/     # Composed of primitives only — never bypass with raw colors
features/        # Feature modules — use templates and composites only
hooks/           # Generic client hooks
providers/       # React Context providers (Theme, Query, Session)
stores/          # Zustand stores (sidebar state)
lib/             # Framework-agnostic utilities
templates/       # Page templates — every feature screen picks one
types/           # Shared TypeScript types
constants/       # NAV_ITEMS, routes, table defaults
services/        # ApiClient + endpoint handlers (typed stubs in foundation)
```

## AI agent rules

These are non-negotiable. The AI assistant should **check before writing code**:

1. Does the component already exist in `components/ui/` or `components/composite/`? Reuse it.
2. Does the page fit one of the 5 templates? Compose it.
3. Are you reaching for a raw color or arbitrary value? **Stop.** Use a token.
4. Is the new pattern necessary? Three similar lines is better than a premature abstraction.
5. Are you importing from another `features/` module? **Stop.** Move shared code to a composite.
6. Does a Page Header, Breadcrumb, and actions slot exist? Use the template.
7. Is motion respected under `prefers-reduced-motion`? Default `motion-safe`.

## Manual keyboard checklist

For every new page, verify in browser:

- [ ] Tab order: Skip-link → Sidebar → Header → Breadcrumb → Toolbar → Content → Pagination
- [ ] Tab into a `DropdownMenu` — Escape closes, focus returns to trigger
- [ ] Tab into a `Dialog` — Escape closes, focus returns to trigger
- [ ] Tab into a `Sheet` — Escape closes, focus returns to trigger
- [ ] In DevTools → Rendering → "prefers-reduced-motion: reduce" → no Tailwind transitions run
- [ ] Theme toggle: Light → Dark → System — no FOUC, no hydration warning in console
- [ ] Below `md` breakpoint: sidebar collapses, mobile menu icon opens `Sheet`
