# Backend API Build & Integration Plan — Rubrics + Grades (admin_modern)

> Agent context file. Read this whole file before writing any code.
> Goal: build real backend APIs for the **rubrics** and **grades** modules
> (`rubrics`, `grade_group`, `grades` tables) and switch `admin_modern`
> from mock data to live API calls. Do NOT redesign the schema, do NOT
> create SQL files, do NOT change grading-engine logic.

## 0. How to use this document

1. The human will paste three SQL files into `html/admin_modern/` BEFORE you run:
   - `rubrics.sql`
   - `grade_group.sql`
   - `grades.sql`
2. You must verify those files exist and apply them to your local DB.
   You must NOT create, rename, or restructure tables or columns.
3. Table/column names are frozen (old names kept): `grade_group` (= grade scales),
   `grades` (= scale bands), `rubrics`. Every non-PK column uses its table prefix
   (`rb_`, `gg_`, `gr_`) except legacy `action, action_by, created, updated` in `grades`.

## 1. Standards — mandatory reading (read FIRST)

API development standards live in the CI3 folder. Read these before any design decision,
then adapt the PHP/CI3 convention to Next.js Route Handlers + TypeScript:

- `html/edubex/ai/PROJECT_CONTEXT.md` — stack, entry points, repo layout
- `html/edubex/ai/ARCHITECTURE.md` — request lifecycle, caching, tenant model
- `html/edubex/ai/CODING_STANDARDS.md` — controller/model/helper split, validation,
  response envelope, soft-delete, naming
- `html/edubex/ai/BUSINESS_RULES.md` — domain rules that override any assumption
- `html/edubex/ai/DATABASE.md` — DB conventions, prefixes, audit columns
- `html/edubex/ai/MODULES.md` — module boundaries

Concrete adaptations from those standards:

- **Thin handlers, fat repos:** route handler = HTTP + validation + response only.
  All SQL lives in repository modules (CI3 model equivalent).
- **Response envelope:** follow `send_response` / `output_json` convention
  (`{ metadata, data }` with `Content-Type: application/json`). Keep the envelope
  consistent across all new endpoints — frontend parses it in one place.
- **Validation:** CI3 `form_validation` equivalent = zod schemas, `run()`-gate before
  any DB write. Never trust client input.
- **Soft delete everywhere:** every list/detail query excludes
  `rb_deleted_at IS NOT NULL`, `gg_deleted = '1'`, `gr_deleted = '1'`.
- **Multi-tenant scoping:** `grades.gr_account = config_item('id')` equivalent must
  be preserved — every band query filters by account/tenant id. Do not drop it.
- **No memcache on this surface:** the admin panel must read directly from the
  database — no cache reads, writes, or invalidation in these endpoints. Admins
  must see live data; the 2h learner-side TTL discipline does not apply here.
- **Audit columns:** `gg_created_by / gg_updated_by`, `action_by`, `rb_created_by /
  rb_updated_by` resolve to the existing users table. Read its name + PK type from
  the live DB; do not invent a users table.
- **Naming:** snake_case DB, camelCase TS. Match neighbours; 4-space indent;
  `console.error / console.log` acceptable, never swallow errors silently.

Project conventions in `html/admin_modern/CODER.md` are binding:
match existing language/style, read full files before editing, discover real
commands from `package.json` (`pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`),
verify in dev mode, production build before release.

## 2. Scope — YES, this covers rubrics AND grades

| Module | Tables | Frontend surface |
|---|---|---|
| Rubrics | `rubrics` (header + matrix/profile JSON, counters, lifecycle) | List, wizard (info → criteria → rules → review), detail, simulator |
| Grade scales | `grade_group` (`gg_grade_type`, `gg_meta_configs` JSON, `gg_is_default`, `gg_used_count`) | Grade setting module (enhanced version), scale list/editor |
| Scale bands | `grades` (linked via `gr_grade_group_slug` → `gg_slug`, `DECIMAL` ranges, `gr_sort_order`, `gr_is_pass`) | Band table inside scale editor, engine band lookup |

Out of scope: assignment attach/detach writes that move counters (expose values +
internal helpers only), evaluation-engine logic changes
(`features/rubrics/evaluation/*` is read-only), auth redesign, UI redesign.

## 3. Inputs to confirm before coding

- [x] `html/admin_modern/rubrics.sql`, `grade_group.sql`, `grades.sql` present
      (verified 2026-10-08 — files exist but are NOT yet applied to live `testdb1`; see §8)
- [ ] Applied to local MySQL 8.0 (docker-compose `mysql` service; resolve
      `testdb` vs `testdb1` from env, never guess); connection via `DATABASE_*`
      env + `.env.local` (never commit)
- [ ] `mysql2` (promise API) installed; `zod` already present — use it for all schemas
- [x] Users-table name + PK type confirmed from live DB: `testdb1.users`, INT `id`
      PK (`us_name` display). Note: `rb_created_by` is `varchar(32)` vs INT user PK
      and seed values (`u_001`-style) have no live row — resolve display name via
      LEFT JOIN with raw-id fallback, add no FK (zero-FK convention).
- [ ] Mock surface studied file-by-file (signatures must stay identical):
      `services/api-client.ts` (`listRubrics`, `getRubric`, `getRubricsByIds`,
      `getRubricDraft`, `createRubric`, `updateRubric`), `services/endpoints.ts`,
      `lib/query-keys.ts`, `services/handlers/rubrics.ts`, `services/handlers/rubric-details.ts`,
      `features/rubrics/grade-scales.ts`, `features/rubrics/constants.ts`,
      `types/rubric.ts`, `features/rubrics/wizard/validation.ts`,
      `features/rubrics/grade-scale-validation.ts`

## 4. DB notes (reference only — no migrations)

- `rubrics`: one row per rubric; `rb_criteria / rb_levels / rb_descriptions /
  rb_profile_rules` are JSON (array order = display/grading order); `rb_criteria_count /
  rb_levels_count` generated; `rb_used_count` stored counter (moves only inside
  assignment transactions); `rb_min_pass_level_id` validated against own `rb_levels`
  JSON in app code; `rb_suggested_gs_id` → `grade_group.id` (INT).
- `grade_group`: `gg_slug` UNIQUE; `gg_grade_type` explicit
  (`percentage | cgpa | marks | comp_incomp | letter_grading`); `gg_meta_configs`
  JSON holds only that type's keys (letter_grading = NULL); `gg_is_default='1'` =
  system/built-in, blocks edit/delete; `gg_used_count` stored counter.
- `grades`: rows exist ONLY for `letter_grading` groups; fixed formats grade
  numerically via `gg_meta_configs`. Link is slug-based (`gr_grade_group_slug`).
  Ranges are `DECIMAL`; whole-number boundaries for letter groups.
- Key data facts: `-` band (`0`–`0.00`) = ungraded placeholder → engine maps to
  null grade; legacy `90.01`-style decimals migrate to whole numbers; `marks` has
  no bands (ceiling from assignment `totalMarks`); `gr_account` = tenant filter;
  `action / action_by` = legacy audit (keep).

## 5. Build phases

**Phase A — DB + skeleton:** verify SQL files, connect pool (`services/server/db.ts`),
zod schemas (`services/server/schemas.ts`), repos
(`services/server/rubrics-repo.ts`, `grade-groups-repo.ts`, `grades-repo.ts`),
row→frontend mappers (`services/server/mappers.ts`: snake→camel, DECIMAL-string→number,
JSON parse/stringify, outcome-text derivation, read-time description excerpt).

**Phase B — Rubrics API:** `GET/POST /api/rubrics` (search on name+outcome_text,
`status`/`type` multi-filter, `page`/`pageSize`, order `rb_updated_at` DESC);
`GET/PATCH/DELETE /api/rubrics/[id]` (detail incl. 4 JSON columns; soft delete,
rejected if `rb_used_count > 0`; status transitions set `rb_published_at` /
`rb_archived_at`). Full wizard-validation parity server-side.

**Phase C — Grade groups + bands API:** `GET/POST /api/grade-groups`,
`GET/PATCH/DELETE /api/grade-groups/[slug]` (system groups read-only, slug
unique case-insensitive, per-type `gg_meta_configs` validation, delete blocked
if used); nested `GET/POST /api/grade-groups/[slug]/grades` (ordered by
`gr_sort_order`) + `GET/PATCH/DELETE /api/grades/[id]` + reorder; band rules:
whole-number ranges, `from <= to`, no overlaps, `gr_is_pass` per
grade-scale-validation. Proposal (pending human confirm, see §8): bands under
system groups fully read-only — any write returns 409.

**Phase D — Frontend swap:** rewire `services/api-client.ts` to `fetch()` keeping
every signature + `PaginatedResponse` shape; fetch-then-cache in grade-scale
resolver keyed by `lib/query-keys.ts`; `getRubricDraft` maps fetched detail → wizard
draft client-side (no draft endpoint); drop `FAKE_*` / `GRADE_SCALES` imports;
no page/wizard/column/simulator changes except data source.

## 6. API contract summary

| Method + path | Purpose | Key params / body |
|---|---|---|
| `GET /api/rubrics` | Paginated list | `search, status[], type[], page, pageSize` |
| `POST /api/rubrics` | Create (draft or publish) | name, outcome_html, type, grading_method, fallback, criteria/levels/descriptions/profile_rules JSON, min_pass_level_id, suggested_gs_id, status |
| `GET /api/rubrics/[id]` | Detail + matrix JSON | — |
| `PATCH /api/rubrics/[id]` | Update + transitions | same as create + status |
| `DELETE /api/rubrics/[id]` | Soft delete | blocked if used |
| `GET /api/grade-groups` | Paginated scales | `search, grade_type, status, page, pageSize` |
| `POST /api/grade-groups` | Create scale | name, slug, grade_type, meta_configs, description, status |
| `GET/PATCH/DELETE /api/grade-groups/[slug]` | Scale CRUD | blocked edit/delete if `gg_is_default='1'`; delete blocked if used |
| `GET/POST /api/grade-groups/[slug]/grades` | Band list / add | ordered by `gr_sort_order` |
| `GET/PATCH/DELETE /api/grades/[id]` | Band CRUD | range + overlap + pass-flag validation |
| `POST /api/grades/reorder` (or PATCH batch) | Band reorder | `[{id, sort_order}]` in transaction |

List responses wrap the page inside `data` so `api-client` unwraps to the existing
`PaginatedResponse<T>` with no signature changes:
`{ metadata: { error: false, message: "" }, data: { data: [], total, page, pageSize } }`.
Detail responses put the object directly in `data`.

Errors: validation 400 with per-field issues, unknown id 404, blocked delete 409,
all inside the standard envelope. In-use deletes keep the 409 status but carry a
human-readable message the UI surfaces directly: rubrics →
"Rubric is already in use and hence can't be deleted"; grade groups → same pattern
when `gg_used_count > 0`.

## 7. Verification / definition of done

- `pnpm typecheck` + `pnpm lint` green after each phase; `pnpm dev` verified
  against real DB; `pnpm build` once at the end.
- Rubric list (search/filter/pagination), wizard create, edit round-trip with
  matrix intact, publish/archive transitions, scale + band CRUD incl. system-group
  blocks, simulator + `scripts/verify-rubric-engine.ts` + `scripts/headless-verify.mts`
  passing unchanged.
- Done = no imports from `FAKE_*` / `GRADE_SCALES` remain, all writes validated
  server-side, counters move only via server helpers in assignment transactions,
  soft-delete + tenant filters on every query.
  no use of any mock data

## 8. Exploration findings (2026-10-08, read-only) & pending decisions

No code written yet — API shape confirmation comes before any file writes
beyond this plan.

**Live `testdb1` vs SQL files (verified via `docker exec mysql8.0`):**

- `rubrics` table does not exist live; the three SQL files are present but unapplied.
- Live `grade_group` lacks `gg_grade_type`, `gg_meta_configs`, `gg_used_count`,
  `gg_deleted`; live `grades` lacks `gr_sort_order`, `gr_is_pass`, and its ranges
  are `varchar`, not `DECIMAL`.
- Pending decision: CREATE `rubrics` + ALTER the two grade tables to match the SQL
  files (backup first), then backfill seeds. Alternative: leave live tables
  untouched and derive missing fields in code (diverges from the SQL files).

**Access / env:**

- Compose `testuser` is granted only on the empty `testdb`, not on `testdb1`
  (which holds all data: 12 `grade_group` rows, 22 `grades` rows). The
  `admin_modern` service has no `DATABASE_*` env vars yet.
- Pending decision: GRANT testuser on `testdb1` + add `DATABASE_*` env to the
  compose service (`.env.local` never committed). Alternatives: new dedicated API
  user, or root in app env (not recommended).

**Mapping decisions (in the proposed contract, pending confirm):**

- Scale `id` = `gg_slug` (bands join on slug; frontend already keys on slug-like
  ids). Live slugs (`default`, `cgpa`, `percentage`, …) differ from mock ids
  (`gs_letter`, …) — seeds/backfill must reconcile; seed rubrics pointing at
  `gs_letter` have no live target row today.
- `rb_suggested_gs_id` is `varchar(32)` but §4 annotates it as FK to
  `grade_group.id` (INT); seeds carry slug strings (`gs_letter`). API treats it
  as an opaque scale id (= slug), no FK constraint.
- `gg_status '1'` → `published`, `'0'` → `archived`; `in_use` derived
  display-side when `used > 0`. Draft creation sets `'0'`.
- `createdBy` via LEFT JOIN `users` display name, fallback to raw id.
- Bands tenant filter: `WHERE gr_account IN (0, <tenant>)` until auth supplies
  the tenant id (all live rows carry `0`; exact match would hide every row).
- No batch endpoint for `getRubricsByIds` (parallel `GET` fan-out in
  `api-client`); no draft endpoint for `getRubricDraft` (client-side mapping).
- System groups proposed fully read-only (group + bands reject writes with 409,
  including reorder). Alternative: group locked, bands editable.

**Confirmed admin-panel rules:**

- No memcache on these endpoints — direct DB reads (§1).
- In-use deletes return 409 with a human-readable message surfaced by the UI:
  rubrics → "Rubric is already in use and hence can't be deleted"; grade groups
  → same pattern when `gg_used_count > 0`.
