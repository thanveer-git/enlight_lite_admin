# 04 — State and Data Fetching

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 02-frontend-architecture,
> 03-component-and-page-patterns, 05-domain-model,
> 06-data-and-persistence-design, 07-coding-standards.

## The three state kinds

| Kind | Tool | Where | Persistence |
|---|---|---|---|
| Server cache | TanStack Query (`@tanstack/react-query` v5) | `providers/query-provider.tsx`, keys in `lib/query-keys.ts` | Memory cache, 30s staleTime |
| Ephemeral client state | Zustand (v5, no middleware) | `stores/evaluation-store.ts` | None — refresh resets |
| Persisted UI prefs | Zustand `persist` + localStorage | `stores/sidebar-store.ts`, `stores/column-pinning-store.ts` | Survives refresh |

## Server cache (React Query)

`providers/query-provider.tsx` creates one `QueryClient`:

```ts
staleTime: 30_000,
refetchOnWindowFocus: false,
retry: 1,
```

Query keys are centralized in `lib/query-keys.ts` (`queryKeys`): `session`,
`users` (`all`/`list`/`detail`), `courses`, `rubrics`, `gradeScales` — each
with `all` root plus parameterized `list(params)` / `detail(id)` factories.
When the real API lands, fetchers swap in behind the same keys; invalidation
stays keyed the same way.

## Client state (Zustand)

- `stores/evaluation-store.ts` (`useEvaluationStore`) — the evaluation
  console draft store. Per-submission drafts keyed by submission id
  (`drafts`), plus `completionTouched` (guards auto-complete-on-pass),
  `savedDrafts` (change detection), `savedStatuses`, `openSubmissionId`.
  Actions: `ensureDraft`, `setRating`, `setDirectGrade`, `setOverride`,
  `setAccessWindow`, `setMarkComplete`, `setNotify`,
  `markCompletionTouched`, `save` (returns `{ ok: true; status }` or
  `{ ok: false; reason: "no_override_reason" }`), `reset`, `getStatus`,
  `getDraft`. Deliberately **not persisted** — matches the prototype
  limitation documented in the store header.
- `stores/sidebar-store.ts` (`useSidebarStore`) — `collapsed`, `mobileOpen`,
  `toggle`/`setCollapsed`/`setMobileOpen`; persists only `collapsed` under
  key `admin_modern_sidebar`.
- `stores/column-pinning-store.ts` — per-table `{ left, right }` pin state
  keyed by opaque `tableId`; persisted so pin choices survive refresh.

## Session

`providers/session-provider.tsx` exposes `{ session, user }` via
`SessionContext`; `hooks/use-session.ts` (`useSession`) throws outside the
provider. Today the value is `FAKE_CURRENT_USER`
(`services/handlers/users.ts`, 8h `expiresAt`). `apiClient.getCurrentUser()`
returns the same fake. Swapping to real auth means changing the provider
(and that one method); no consumer changes.

## The mock API layer

`services/api-client.ts` exports `apiClient` (and the `ApiClient` type).
Every method awaits `delay(value)` (`SIMULATED_LATENCY_MS = 250`) so loading
states behave like a network. Method surface:

- Session/users: `getCurrentUser`, `listUsers({page, pageSize, search, role})`,
  `getUser(id)` → `PaginatedResponse<User>` / `User | null`.
- Rubrics: `listRubrics({page, pageSize, search, status[], type[]})`,
  `getRubric(id)`, `getRubricsByIds(ids[])` (detail + `fallbackMatrix` when no
  explicit detail seed), `createRubric` / `updateRubric` (mutate the
  in-memory `FAKE_RUBRICS`; update also refreshes `FAKE_RUBRIC_DETAILS`),
  `getRubricDraft(id)` (`0`/unknown → blank `RubricDraft` with
  `emptyMatrix("scored")` = create mode).
- Assignments: `getAssignmentDraft(id)` (`0`/unknown → `EMPTY_DRAFT()`,
  deep-cloned so wizard mutations never leak into `FAKE_ASSIGNMENTS`),
  `createAssignment` / `updateAssignment`.

Payload/result types live next to the client (`ListUsersParams`,
`ListRubricsParams`, `CreateRubricPayload`, `UpdateRubricPayload`).
`services/endpoints.ts` (`ENDPOINTS`) declares the future REST shape
(`/session/me`, `/users`, `/users/:id`, `/courses`, `/rubrics`) — the paths
the real backend must serve.

Seed sources: `services/handlers/users.ts` (`FAKE_USERS`,
`FAKE_CURRENT_USER`), `services/handlers/rubrics.ts` (`FAKE_RUBRICS`),
`services/handlers/rubric-details.ts` (`FAKE_RUBRIC_DETAILS`),
`services/handlers/sidebar.ts` (`FAKE_SIDEBAR_RESPONSE`) +
`sidebar-transform.ts` (`buildNavigationFromSidebar`, icon maps
`ICON_BY_CODE`/`ICON_BY_LABEL`/`RUBRIC_SUBITEM_ICONS`),
`features/assignments/seed.ts` (`FAKE_ASSIGNMENTS`, `SECTIONS`, `STUDENTS`),
`features/evaluation/seed.ts`, `features/rubrics/constants.ts`
(`GRADE_SCALES`).

## API migration notes (already prepared in code)

- `features/rubrics/grade-scales.ts`: `getGradeScale` is sync-over-mock
  today with an in-memory `cache` map + `customScales` list; `fetchGradeScale`
  is the async cache-first entry point where API wiring lands. Engine code
  must keep using sync `getGradeScale`.
- `createRubric` generates `rb_${Date.now()}` ids and derives `description`
  from the first 140 chars of stripped outcome HTML (`stripHtml` helper) —
  backend will own both behaviors.
- `updateRubric` keeps list row and detail cache in sync manually; a real
  backend + query invalidation replaces this.
