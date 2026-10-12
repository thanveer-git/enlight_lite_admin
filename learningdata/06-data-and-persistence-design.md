# 06 — Data and Persistence Design

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 02-frontend-architecture,
> 03-component-and-page-patterns, 04-state-and-data-fetching,
> 05-domain-model, 07-coding-standards.

## Framing: no real database in scope

`admin_modern` has **no database, no migrations, no ORM, no backend**.
Persistence today is three things: in-memory `FAKE_*` arrays, localStorage
UI prefs, and a static JSON seed. This guide documents the frontend data
contracts the future backend (and its schema) must satisfy. Anything below
marked *(provisional)* anticipates that backend — it is derived from what
the UI needs, not from an existing schema.

## Entity shapes the UI expects

These TypeScript types are the de-facto schema. A backend must be able to
store and return them (field-for-field, modulo id/timestamp conventions):

| Entity | Type location | Key fields |
|---|---|---|
| User | `types/session.ts` | id, name, email, role (admin/instructor/student), avatarUrl? |
| Rubric | `types/rubric.ts` | id, name, description, outcome (HTML), status, type (scored/unscored), counts, usedBy, updatedAt, createdBy |
| RubricMatrix | `types/rubric.ts` | criteria[] (id, name, weight?), levels[] (id, name, points single/range?), descriptions[criterion][level], gradingMethod, profileRules[] (gradeLabel + paths of tiers + floor), profileFallback, minPassLevelId, suggestedScaleId |
| GradeScale | `features/rubrics/constants.ts` | id, bands[] (grade, minMarks, maxMarks), status, format configuration (min/max, passMark, passMarkRatio, step, Comp/Incomp thresholds + labels) |
| AssignmentDraft | `features/assignments/wizard/types.ts` | id?, title, wordLimit, lectureSlug, sectionId, content (HTML), files[], useRubric, rubricId?, gradeKind/Type/ScaleId, totalMarks?, outcome (+override flag), accessRules[] (audience, studentIds[], from/due/until, notify, updatedAt clock), status |
| Submission | `features/evaluation/types.ts` | id, assignmentId (+code/title), courseId/Name, learner, rubricId? vs gradeType?, gradeScaleId?, totalMarks?, status (pending/graded/resubmit), finalGrade?, finalPercentage?, attempts[] (times, wordCount/Limit, bodyHtml, files, feedback[]), viewingAttempt, evaluatedAt/By? |
| EvaluationDraft | `features/evaluation/types.ts` | ratings{} (criterion → levelId + points), directGrade, override (on/value/reason), markComplete, notifyLearner, accessWindow? |

List endpoints paginate via `PaginatedResponse<T>` (`types/table.ts`:
`data`, `total`, `page`, `pageSize`); table defaults in
`constants/table.ts` (page size 10, options 10/20/50/100).

## Mock persistence (today)

- `services/handlers/*.ts` — `FAKE_USERS`, `FAKE_RUBRICS`,
  `FAKE_RUBRIC_DETAILS`, `FAKE_SIDEBAR_RESPONSE`; `features/assignments/seed.ts`
  (`FAKE_ASSIGNMENTS`, `SECTIONS`, `STUDENTS`); `features/evaluation/seed.ts`;
  `features/rubrics/constants.ts` (`GRADE_SCALES`); `seeds/assignments.json`
  (static sample assignments referencing rubric ids like `rb_006`).
- Writes mutate module-level arrays (`unshift` on create, index replace on
  update) — visible across the session, **lost on reload**. Ids for new
  records are `rb_${Date.now()}` / `asg_${Date.now()}` (backend will own id
  generation).
- Zustand evaluation drafts are memory-only by design (store header cites
  the prototype limitation); only sidebar collapse and table pinning persist
  (localStorage keys `admin_modern_sidebar` and the column-pinning store).

## The API contract to implement *(provisional)*

`services/endpoints.ts` (`ENDPOINTS`) plus the `apiClient` method surface
(04-state-and-data-fetching) define the REST surface the backend must serve:
`GET /session/me`, `GET /users` (page, pageSize, search, role) +
`GET /users/:id`, `GET /courses`, `GET /rubrics` (page, pageSize, search,
status[], type[]) plus rubric detail (row + matrix), create/update rubric,
draft-shaped reads for the wizards (`getRubricDraft`/`getAssignmentDraft`
semantics: `0`/unknown → blank draft), assignment create/update,
grade-scale CRUD, submission read + evaluation save (ratings, direct grade,
override with mandatory reason, completion decision, notify flag), and a
sidebar payload matching `FAKE_SIDEBAR_RESPONSE`'s shape
(`services/handlers/sidebar.ts`) so `buildNavigationFromSidebar` keeps working.

## What the backend schema must support *(provisional)*

Derived from UI needs in 05-domain-model: users with roles; rubrics with a
full criteria × levels matrix incl. per-cell descriptions, weights,
single/range points, both grading methods, profile rules with tiered paths,
min-pass level, suggested scale; grade scales with bands + format config;
assignments with rich-text content, file refs, rubric-or-direct grading
choice, per-assignment outcome override, and ordered access rules with
audience scoping, three optional timestamps, and edit-clock tie-breaks;
submissions with attempt history, per-attempt files/feedback, and persisted
final grade + percentage; evaluation records capturing ratings, direct
grade, override value + reason, completion state, and evaluator identity.
Stable ids everywhere — the engine and evaluation code join on ids, never
names.
