# 07 — Coding Standards

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 02-frontend-architecture,
> 03-component-and-page-patterns, 04-state-and-data-fetching,
> 05-domain-model, 06-data-and-persistence-design.

Sources: `CODER.md` (repo root — binding for every task), `.eslintrc`,
`.prettierrc`, `tsconfig.json`, `components.json`, `STYLE_GUIDE.md`.

## Toolchain

- **pnpm** only (`pnpm-lock.yaml` committed). Scripts: `dev`, `dev:fresh`,
  `dev:clean`, `build`, `start`, `typecheck` (`tsc --noEmit`), `lint`
  (`next lint` + `lint:extra` with `--max-warnings=0` over features, hooks,
  stores, providers, composite, templates, types, constants, services).
- **TypeScript strict** (`tsconfig.json`: `strict`, `noEmit`, `jsx: preserve`,
  path alias `@/* → ./*`, `isolatedModules`). Type-only imports must use
  `import type` (ESLint `consistent-type-imports`).
- **Prettier**: double quotes, semicolons, trailing commas, tab width 2,
  print width 100; plugins `prettier-plugin-tailwindcss` (class sorting) and
  `@trivago/prettier-plugin-sort-imports` with order react → next →
  third-party → `@/` → relative, blank lines between groups, sorted
  specifiers. Match this exactly in new files.
- **shadcn**: `components.json` (style `new-york`, RSC, CSS variables, slate
  base, lucide icons). `components/ui/` is shadcn-owned — compose, don't
  restyle in place.

## Architecture rules (lint-enforced)

- **No cross-feature imports** (`features/*` importing `@/features/*` or
  relative into another feature fails lint). Move shared code to
  `components/composite`, `lib`, or `types`. `scripts/` is exempt.
- **No raw hex colors** anywhere except `app/globals.css` and
  `tailwind.config.ts` (AST-level `no-restricted-syntax` catches hex in
  literals and template elements). Use design tokens (`bg-primary`,
  `text-muted-foreground`, …).
- **No token-bypassing Tailwind** either (per `STYLE_GUIDE.md`): no
  `bg-blue-500`, `text-[14px]`, `p-[7px]` — use `bg-primary`, `text-sm`,
  `p-2`. Dark mode is baseline; both themes must work.
- **z-index scale only** (`STYLE_GUIDE.md`): dropdown 50, sticky 60, header
  70, sidebar 80, overlay 90, modal 100, popover 110, tooltip 120, toast 130 —
  never arbitrary `z-10`/`z-20`.
- **Motion**: default 200ms (150/300 available), honor
  `prefers-reduced-motion` (`motion-safe`/`motion-reduce`); keyframes
  `accordion-down/up`, `fade-in/out`, `slide-in-{top,bottom,left,right}`.

## File and code conventions

- **Match the nearby file** (`CODER.md` working rule for language, styling,
  API style, directory placement). Explore before adding; ask before
  introducing a new pattern.
- **Modules over loose files**: group related code (wizard `steps/` +
  `components/` + `types.ts` + `validation.ts` per feature); shared utilities
  allowed in `lib/`.
- **Max 1500 lines per file** — split before exceeding.
- **Naming**: kebab-case files (`step-access.tsx`, `grade-scale-editor.tsx`),
  PascalCase components, `use-*` hooks, `*-store.ts` Zustand stores,
  `FAKE_*` mock constants, `EMPTY_*` factories (`EMPTY_DRAFT`,
  `emptyEvaluationDraft`, `emptyMatrix`).
- **Styling helper**: `cn()` from `lib/utils.ts` (`clsx` + `tailwind-merge`)
  for every conditional class list.
- **Comment density**: sparse but purposeful — short `/** */` doc blocks on
  stores (state shape, ops), derivation glue (`derive.ts`), and tricky logic
  (access resolution, engine edge cases). No filler comments.
- **Logging**: `console.error`/`console.log` acceptable; never swallow errors
  silently.
- **Async**: `setTimeout` fine for debounce/one-shots (`useDebounce`);
  no `setInterval` polling — prefer events.
- **Re-renders**: optimize hot paths only; don't over-memo cold code.
- **DOM ids**: add to interactive elements for testing (not every element).
- **Icons**: no format restriction; lucide via `lucide-react` is the norm.
- **Terminology**: user-facing words via `lib/labels.ts`, not inline strings.

## Verification and workflow

- Dev-mode verification acceptable during work; **production build before
  release** (`pnpm build`).
- `scripts/verify-rubric-engine.ts` + `headless-verify.mts` exist for engine
  checks — extend them when touching evaluation logic.
- Commits: no enforced convention; write descriptive messages explaining the
  why. Never commit `.env`, keys, or credentials.
- Ambiguous task → ask a clarifying question first; don't silently guess.
