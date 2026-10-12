# 05 — Domain Model (LMS)

> Series: `learningdata/` — onboarding guides for the `admin_modern` frontend.
> See also: 01-project-overview, 02-frontend-architecture,
> 03-component-and-page-patterns, 04-state-and-data-fetching,
> 06-data-and-persistence-design, 07-coding-standards.

Product spec companion: `EDUBEX_Assignments_AdminSide.md` (admin_modern root)
specs the Assignments list, 5-step wizard, access/deadline rules, and the
evaluation console. This guide maps that spec to the code.

## Users and roles

`types/session.ts`: `Role = "admin" | "instructor" | "student"`; `User`
(`id`, `name`, `email`, `role`, `avatarUrl?`); `Session` (`user`,
`expiresAt`). Seeds in `services/handlers/users.ts`. User-facing learner
wording is centralized (`LEARNER_LABEL` in `lib/labels.ts`).

## Rubrics (the core model)

`types/rubric.ts` — a rubric is a reusable assessment structure:

- `Rubric`: `id`, `name`, `description`, `outcome` (learning outcome, rich
  text), `status` (`draft` | `published` | `in_use` | `archived`),
  `type` (`scored` | `unscored`), `criteriaCount`, `levelsCount`, `usedBy`,
  `updatedAt`, `createdBy`.
- `RubricMatrix`: `criteria[]` (`id`, `name`, `weight: number | null`),
  `levels[]` (`id`, `name`, `points: LevelPoints | null`), `descriptions`
  (criterion × level cell text), `gradingMethod` (`weighted_average` |
  `grade_profile`), `profileRules[]`, `profileFallback`, `minPassLevelId`,
  `suggestedScaleId`.
- `LevelPoints`: `type` (`single` | `range`) with `value` or `min`/`max`.
  Scored rubrics carry points; unscored rubrics rate per-criterion without a
  calculated score.
- `GradeProfileRule`: `gradeLabel` + `paths[]` (`tiers[]` of
  `{ count, levelId }` + `floorLevelId`) — "N criteria at level X" style
  mappings used by `grade_profile` grading.
- Status/type option lists: `STATUS_OPTIONS`, `TYPE_OPTIONS`
  (`features/rubrics/constants.ts`); `GRADE_TYPE_OPTIONS`
  (`types/rubric.ts`: letter, performance, percentage, CGPA,
  complete/incomplete).

Rubric wizard: `features/rubrics/wizard/rubric-wizard.tsx` + `steps/`
(`step-info`, `step-criteria`, `step-rules`, `step-review`,
`placeholder-step`) over `RubricDraft` (`wizard/types.ts`: name, outcome,
type, matrix) with `wizard/validation.ts`. List columns in
`features/rubrics/columns.tsx`, KPI summary in `rubric-kpi-summary.tsx`,
grade simulation in `simulator/` (`grade-simulator`,
`rubric-simulator-dialog`).

## Grade scales

`features/rubrics/constants.ts`: `GradeScale` with `bands[]`
(`{ grade, minMarks, maxMarks }`), `status`, plus a format-aware
`GradeScaleConfiguration` (min/max, `passMark`, `passMarkRatio` for Marks,
`step`, Comp/Incomp labels and thresholds). Fixed formats: CGPA,
Percentage, Mark (needs per-assignment `totalMarks`), Complete/Incomplete.
Named scales use `gs_*` ids. Admin CRUD UI: `grade-scale-editor.tsx`,
`grade-scale-columns.tsx`, `grade-scale-validation.ts`, preview
(`grade-scale-preview-dialog`), KPI summary, defaults
(`grade-scale-default.ts`), lookup layer (`grade-scales.ts` — see
04-state-and-data-fetching for the API migration plan).

Rubric × grade combination rules (from the EDUBEX spec, enforced in the
assignment wizard `step-grade.tsx`): no rubric → any grade type/scale; scored
rubric → any; unscored rubric → only its own suggested scale or nothing.
`Mark` grade type requires `Total Marks > 0`.

## Assignments

`features/assignments/wizard/types.ts` — `AssignmentDraft`:

- Basics: `title`, `wordLimit` (`0` = none, `null` = untouched),
  `lectureSlug`, `sectionId`, `content` (rich text), `files[]`.
- Grading: `useRubric`, `rubricId`, `showEvalDetail`, `gradeKind`
  (`type` | `scale` | `none`), `gradeType` (`cgpa` | `percentage` | `mark` |
  `complete_incomplete`), `totalMarks`, `gradeScaleId`.
- Outcomes: `outcomeOverrideEnabled`, `outcome` (pulled from rubric, editable
  per-assignment with reset).
- Access: `accessRules[]` (`AccessRule`: `audience` =
  `everyone` | `single` | `multiple` with `PRIORITY_OF` high/medium/low,
  `studentIds[]`, `fromAt`/`dueAt`/`untilAt` — at least one date required,
  one-shot `notify`, `updatedAt` edit clock for same-priority tie-breaks).
- `status` (`draft` | `published` | `in_use`); `EMPTY_DRAFT()` factory.

Wizard: 5 steps (`step-details`, `step-grade`, `step-outcomes`,
`step-access`, `step-review`) + components (`access-rule-card`, `file-list`,
`inline-rubric-modal` for creating a rubric without leaving the wizard,
`resolved-preview` for access simulation); `access.ts` holds per-field,
per-student priority resolution with field-level inheritance; `validation.ts`
the rules. Late submissions are accepted but flagged, not blocked.

## Submissions and evaluation console

`features/evaluation/types.ts`:

- `Submission`: assignment refs (`assignmentId`, `assignmentCode` like
  `ASG-003`, `assignmentTitle`, `courseId/Name`, brief/question HTML),
  `learner`, `rubricId` **or** `gradeType` (`DirectGradeFormat`: CGPA,
  Percentage, Comp/Incomp, Marks, NamedBand, `gs_*`), `gradeScaleId`,
  `totalMarks`, `currentStatus` (`pending` | `graded` | `resubmit`),
  optional persisted `finalGrade`/`finalPercentage`, `attempts[]`
  (`AttemptRecord`: attempt number, submitted/due/available/until times,
  word count/limit, body HTML, files, feedback thread), `viewingAttempt`
  (1-based; phase 1 = single current attempt), `evaluatedAt`/`evaluatedBy`.
- `EvaluationDraft` (per-submission, in the Zustand store): `ratings`
  (criterion id → `{ levelId, points }`), `directGrade` string, `override`
  (`ManualOverride`: on/value/reason), `markComplete`, `notifyLearner`,
  optional resolved `accessWindow`.

Evaluation pipeline:

1. Engine: `features/rubrics/evaluation/engine.ts` (`evaluateRubric`) —
   pure function over (`matrix`, `rubricType`, `ratings`, `gradeScale`,
   `totalMarks`) returning `EvaluationResult` (`evaluation/types.ts`):
   per-criterion evaluation, weighted score/max, percentage, matched profile
   rule, scale band, min-pass status/override, manual-override flag, final
   grade, pass/fail, human-readable `explanation[]`. Helpers in
   `evaluation/helpers.ts` (`getEffectivePoints`, `isPassingBand`,
   `levelIndexInOrder`). Verified by `scripts/verify-rubric-engine.ts`.
2. Glue: `features/evaluation/derive.ts` turns engine result + draft into
   `DerivedEvaluation` — effective grade, hero percentage, pass/fail,
   override applied, min-pass override, completion decision, student-visible
   grade, rubric-locked/save-blocked flags.
3. Pieces: `direct-grade.ts` (parse/clamp direct input per format),
   `override.ts` (`resolveOverride` precedence), `selectors.ts`,
   `components/hooks/use-evaluation.ts`.
4. UI: `components/` tabs and rows (`assessment-tab`, `criterion-row`,
   `direct-grade-row`, `result-hero`, `submission-*`, `access-window-tab`,
   `feedback-tab`, `internal-feedback-tab`, `override-controls`,
   `action-bar`, `calculation-explanation`, `submission-timing`;
   `*-placeholder.tsx` for empty states); shell is
   `templates/evaluation-detail-page.tsx`, client entry
   `app/(admin)/admin_modern/submissions/[submissionId]/evaluation-detail-client.tsx`.
