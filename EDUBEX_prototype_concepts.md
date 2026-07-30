# EDUBEX Prototype — Concept Reference

This document explains every concept, feature, and piece of business logic implemented in
`EDUBEX_prototype_UPDATED_new.html`. It is a **single-file HTML/CSS/vanilla-JS prototype**
(no framework, no build step, no backend) that simulates an education platform focused on
**rubric-based grading, grade scales, assignments, and evaluation**, with both an **Admin**
console and a **Student** ("Learner") workspace sharing one in-memory mock dataset.

---

## 1. High-level architecture

- **Single-page app pattern**: one `<div id="content-area">` is repeatedly re-rendered by
  JS functions (`showView(v)` → `render<View>(el)`) based on a `currentView` string. There is
  no routing library — view switching is done by string-keyed dispatch.
- **State is global mutable JS variables** (e.g. `let rubricName`, `let criteria`, `let bands`),
  not a framework store. Every state mutation is followed by an explicit re-render call
  (`showView(...)`, `renderX(el)`, `refreshGradingConsole()`, etc.).
- **Mock data** stands in for a database: `sampleRubrics`, `sampleScales`, `sampleAssignments`,
  `sampleStudents`, `sampleSubmissions`, `gradeTypeDefs`, etc. Nothing persists between page
  reloads.
- **Two roles**, switched client-side only: `currentRole = 'admin' | 'student'`. Switching
  roles changes which sidebar items/views are reachable but **does not** scope or duplicate
  data — both roles read the same shared mock dataset (a noted limitation vs. a real backend,
  where a student should only see their own submissions).
- **Modals**: three overlay layers exist simultaneously —
  - `app-modal-overlay` — generic confirm/alert modal (`showModal()`/`closeModal()`)
  - `sim-overlay` — the Rubric Simulator popup
  - `rubric-modal-overlay` / `scale-modal-overlay` — rubric/scale builders opened *inline*
    from within the Assignment wizard (so a teacher can build a rubric or scale without
    leaving assignment creation).

---

## 2. Rubrics

A **Rubric** is the core grading instrument: a grid of **Criteria × Performance Levels**,
each cell holding a description, with logic to turn per-criterion level selections into a
single grade.

### 2.1 Rubric fields
- `name`, `outcome` (rich-text learning outcome), `type`: `'Scored'` or `'Unscored'`,
  `status`: `'draft' | 'published' | 'inuse'`, `suggestedScale` (a soft-linked default grade
  scale name).
- `criteria[]`: `{ name, weight }` — weight only matters for **Scored** rubrics using the
  **weighted** grading method.
- `levels[]`: ordered **best → worst**, each `{ name, pointType: 'single'|'range', single, min, max }`.
  - `single` levels award one fixed point value.
  - `range` levels award any point value within `[min, max]` (used by the grader/simulator
    via a slider).
- `descriptions{}`: keyed `"${criterionIndex}-${levelIndex}"` → free-text description of what
  that level looks like for that criterion. Auto-backfilled by `mkDesc()` if a rubric ships
  without hand-written descriptions.
- `minPassOn` / `minPassLevel`: an optional **minimum-pass floor** (see §2.3).
- `gradingMethod`: `'weighted'` or `'profile'` (see §2.2).
- `profileRules[]`: used only when `gradingMethod === 'profile'` (or as an unscored rubric's
  only grading path).
- `fallbackOn`: whether a **Scored + profile** rubric that matches no profile rule should fall
  back to the weighted-average calculation instead of forcing a Manual Override.

### 2.2 Grading methods
1. **Weighted average** — `Σ(points_earned × criterion.weight) / Σ(max_points × criterion.weight) × 100`
   → a percentage, which is then mapped onto a grade-scale **band** (see §3).
2. **Grade profile** — a rule-based method: a list of named rules (e.g. "Award A"), each rule
   containing one or more OR'd **paths**, each path containing AND'd **tiers**
   (`{count, level}` = "at least *count* criteria must reach at least *level*") plus an
   optional **`below`** floor ("no criterion may fall below this level"). The first matching
   rule (in order) wins. This is the *only* method available to **Unscored** rubrics (which
   have no points at all), and is optionally available to Scored rubrics.
   - If no rule matches and it's a Scored rubric with `fallbackOn`, the engine silently falls
     back to weighted average.
   - If no rule matches and there's no fallback, the grade requires a **Manual Override**.

### 2.3 Minimum-pass rule
Independent of grading method — a rubric-level on/off setting (`minPassOn` + `minPassLevel`)
that says: *every* criterion must reach at least this level, or the calculated grade is
overridden regardless of what weighted/profile grading produced.
- If met → grade proceeds normally.
- If not met → grade is force-overridden to the **lowest Fail band** of the selected grade
  scale (see `scaleFailBands()` in §3), or if the scale has no Fail band, a Manual Override
  becomes mandatory.
- Minimum pass takes precedence over a matched profile rule, not just over weighted grading.

### 2.4 Validation & publishing (`validateRubric()`)
Hard **publish blockers** (must all be fixed before a rubric can go from Draft → Published):
- Missing name / outcome / type
- Zero criteria
- (Scored only) any criterion with blank/zero/negative weight
- Fewer than 2 performance levels
- Any level missing a name
- (Scored) any level missing points (single or range)
- Any criterion × level cell missing a description
- (Scored) point-range errors: min > max within a level; a level's max ≥ the level above it's
  min (levels must not overlap and must strictly decrease top-to-bottom); a lower level's
  single point ≥ the level above's point
- A minimum-pass level or a profile-rule level that no longer exists (was deleted after being
  referenced)

Non-blocking **warnings** (`rubricWarnings()`):
- Editing a rubric that's already `published`/`inuse` warns that existing
  assignments/submissions are unaffected — only future assignments pick up the edit.
- Minimum pass being off is flagged as a reminder that it's independent of grading method.

### 2.5 Rubric builder (wizard)
4 steps, navigable via a step-tab strip, shared between the standalone "New rubric" flow and
an inline modal version launched from inside the Assignment wizard:
1. **Rubric info** — name, type, outcome, suggested scale
2. **Criteria & levels** — add/remove/reorder (drag-and-drop) criteria and levels, per-cell
   descriptions, point type/values
3. **Grade rules** — grading method, minimum pass, profile rules editor
4. **Review** — summary + Publish / Save draft

Drag-and-drop reordering of criteria and levels reindexes the `descriptions{}` map
(`reindexDescriptionsForCriteriaOrder`/`...LevelOrder`) so cell content follows its
row/column rather than staying at a fixed index.

### 2.6 Rubric Simulator (`sim*` functions)
A standalone "what would this rubric produce?" tool: pick a rubric (a saved one, or the
in-progress draft) and a grade scale, manually choose a performance level (and, for range
levels, an exact point value via slider/number input) per criterion, and see:
- step-by-step reasoning (`steps[]`, each an icon/title/body) showing exactly how the engine
  got to its answer — weighted score math, which profile rule matched (or didn't), whether
  minimum pass was met, and any fallback that kicked in
- the final band/grade
- `simPathMatches()`/`simRuleMatches()` implement the "OR of AND'd tiers, plus a below-floor"
  profile logic described in §2.2 against the tester's chosen levels
- `simBandForPct()` maps a percentage onto a grade-scale band (`pct >= b.f && pct <= b.t`)

---

## 3. Grade Scales

A **Grade Scale** is a separate object from a rubric: an ordered list of **bands**
(e.g. A+, A, B, C, F), each `{ label, meaning, from, to, pass? }` covering a 0–100 percentage
range, optionally in **Pass/Fail mode** (`pfMode`) where every band explicitly carries a
boolean pass flag.

- **Fail-band derivation** (`scaleFailBands`, `bandPasses`): if a scale was authored in
  Pass/Fail mode, fail bands are whatever was explicitly marked `p:false`. If it's a "Simple"
  (non-Pass/Fail) scale where every band's `p` is `null`, the **single lowest-scoring band**
  is *derived* as the fail band — this distinction matters because naively treating `null` as
  "fail" would be a bug.
- **Validation blockers** (`validateScale()`): missing name, zero bands, missing
  label/from/to per band, from > to, non-integer bounds ("decimal values not allowed"),
  overlapping or gapped ranges between adjacent bands, bands listed out of high-to-low order,
  and (Pass/Fail mode) every band being all-Pass or all-Fail.
- **Scale editor** has its own 2-tab page (`scalesTab`: `'library' | 'editor'`), plus an
  inline modal version launched from inside the Assignment or Rubric wizards, mirroring the
  rubric builder's modal pattern.
- Scales carry a **usage count**; a published/in-use scale shows a non-blocking warning that
  edits won't retroactively affect existing assignments.

---

## 4. Grade Types

A **Grade Type** is the transcript-facing "shape" of a final result — separate from (and
layered on top of) whichever grade scale a rubric uses internally. Four ship built-in and
can be edited but not deleted or reformatted; unlimited custom types can be fully
added/edited/deleted.

| Grade Type | Format | Behavior |
|---|---|---|
| **CGPA** | numeric, 0–10, 1 decimal | rubric's weighted % is proportionally mapped |
| **Percentage** | numeric, 0–100, 0 decimals | rubric's weighted % used directly |
| **Comp/Incomp** (Complete/Incomplete) | status | still runs the *normal* weighted calculation internally; the resulting % is then mapped to `Complete` (≥50%) or `Incomplete` (<50%) — it is a presentation layer, not a different grading algorithm |
| **Mark** | "marks" (no fixed range) | the only type with no built-in numeric range — its maximum ("Total Marks") is set **per assignment**, and `pctToMarks()` computes `Final Marks = (Obtained % ÷ 100) × Total Marks`, rounded to 1 decimal |

Custom grade types choose a **format** at creation: `numeric` (min/max/decimals/suffix) or
`status` (a comma-separated list of status labels). Built-in types can have their
range/decimals/labels edited in place (even renamed... except renaming is disallowed for
built-ins) but cannot switch format. Deleting a type is blocked if it's built-in or currently
referenced by any assignment.

---

## 5. Assignments

An **Assignment** bundles: a title, a **Grade Type**, an optional linked **Rubric**, an
optional linked **Grade Scale**, content/instructions/questions, a word limit, file
attachments, and a list of **Access Rules**.

### 5.1 Assignment wizard steps
`asgStep` 0–4, rendered by `renderAsgStep0..4`:
0. Basic info (title, content, files)
1. Grading setup (grade type, rubric, scale, total marks for Mark type)
2. (further configuration — questions, submission format, word limit, "show evaluation
   detail" toggle)
3. Access rules (see §5.2)
4. Review/publish, including a **resolved-access preview** per student
   (`renderResolvedAccessPreview`)

### 5.2 Access Rules — three-tier priority + field-level inheritance
Each Access Rule (`mkAccessRule()`) targets **Everyone**, **Multiple Students**, or a
**Single Student**, and independently sets any of three date/time fields: **Available From**,
**Due Date**, **Until**. This is the most elaborate piece of business logic in the prototype
(`resolveAccessFor`):

1. **Priority order**: `Everyone` < `Multiple Students` < `Single Student`. A higher-priority
   rule only overrides the *specific fields* it explicitly sets — unset fields still fall
   through from a lower-priority rule (**field-level inheritance**, not whole-rule
   override).
2. **Tie-break within the same priority level**: if two rules at the same level both set the
   same field for the same student (e.g. two overlapping "Multiple Students" rules), the
   **most recently updated** rule wins (`updatedAt`, a monotonically increasing clock
   incremented on every edit via `touchRule()`), while *non-conflicting* fields from the
   other rule at that same level still merge in.
3. **Conflict warning**: `checkRuleConflicts()` runs after every edit and pops a modal
   listing exactly which fields conflict between overlapping same-priority rules and which
   value will win.
4. **"Everyone" exclusivity**: a rule targeting Everyone cannot also carry an individual
   student list (enforced by clearing `students[]` whenever `assignTo` changes).
5. **Notify-learners engine** (`computeNotifyResults`/`sendAccessNotifications`): because a
   student can be covered by more than one rule with "Notify" checked, the engine resolves
   each candidate student's **final effective access** exactly once and only sends a
   notification if that resolved state differs from an `accessSignature()` recorded the last
   time they were notified (`asgNotifiedSignatures`) — this avoids double-notifying and avoids
   re-notifying about unchanged access. "Notify" is a one-time send-on-save action, not a
   persistent setting — checkboxes reset after sending.
6. **Window classification** (`getAssignmentWindow`, used on the student side): given a
   resolved access + "now", derives `notYetOpen`, `closed` (past `until`), and `isLate` (past
   `due`), falling back to the assignment's own top-level `from`/`due` when no access rule set
   one explicitly.

### 5.3 Assignment validation & publishing (`validateAssignment`)
Blockers include: missing title; missing grade type (unless a scale covers it); missing Total
Marks for a Mark-typed assignment; a linked rubric that isn't Published/In Use; a linked
scale that's still Draft; profile-rule grade labels that don't exist in the selected scale;
and, per access rule — at least one date field must be set, "Single Student" rules must have
exactly one student, "Multiple Students" rules must have at least one.

### 5.4 Late submission detection
`isLateSubmission(sub)` / `getLateDuration(sub)`: parse `submittedAt`/`dueAt` display strings
back into `Date`s and compare; `getLateDuration` renders a human string like `"2d 4h"` or
`"45m"`, dropping minutes once the delay is a day or more since they're noise at that point.

---

## 6. Submissions & Evaluation Console (Admin grading view)

Each **Submission** (`sampleSubmissions[]`) records student, assignment link
(`assignmentIdx`), status (`pending | graded | resubmit`), timestamps, word count, format,
submitted body (rich HTML incl. embedded SVG figures/tables), and attached files. Submissions
also track an **attempt number** (`submission`), enabling resubmission history.

Key evaluation-console concepts:
- **Two tabs on one card**: "Assignment Evaluation" (rubric scoring, `evalActiveTab ===
  'assessment'`) and "Internal Examiner Feedback" (`'internal'`) — private notes between
  examiners, separate from the public feedback thread.
- **Left-column tab strip** (`evalLeftTab`): Description / Submission / Feedback / Files —
  same "page-level tabs on one card" UI pattern reused from the student side.
- **Attempt switcher** (`evalViewingAttempt`): lets an examiner look back at an earlier
  submission attempt (e.g. pre-resubmission) without losing their place on the current one;
  `isViewingLatestAttempt()` gates whether editing (grading) controls are shown live vs.
  read-only history.
- **Per-criterion grading state** (`evalGrades[subIdx][criterionIdx] = {levelIdx, pts}`).
- **Manual Override** (`evalOverrides`): lets an examiner set the final score/grade
  regardless of what the rubric computed; toggling it on requires a mandatory reason.
- **Manual grade entry** (`evalManualGrades`): for assignments with *no* rubric at all — this
  *is* the grade (kept conceptually separate from Override, which overrides a computed
  result). `commitEvalManualGrade()` clamps entered values to the grade type's numeric range
  (CGPA 0–10, Percentage 0–100) on blur.
- **Mark as Complete auto-tick** (`evalAutoCompleteApplied`): once a submission crosses into
  "passed" (min-pass rule or grade-scale result), the checkbox is auto-ticked *once* as a
  default, but a teacher can untick it — a per-submission flag prevents every re-render from
  forcing it back on.
- **Criteria list scroll cap** (`sizeCriteriaScroll`/`updateCritScrollFade`): rubrics with
  more than 3 criteria scroll internally within a capped-height container (measured from real
  rendered row heights, not a guessed pixel value) so the action buttons below don't get
  pushed off-screen; a fade + "more criteria below" hint shows until scrolled to the bottom.
- **Inline Access Window editor**: lets an examiner fix a student's access rule directly from
  the grading screen if it's currently blocking them, without leaving the console; only
  editable while actually blocking, otherwise greyed out.
- **Comments/feedback thread** (`evalCommentStore`): one flat, chronological, per-submission
  list (not a nested tree) — a reply just becomes the newest message, carrying an optional
  `quoted` back-reference, so replies always land at the bottom of the thread instead of
  nesting under the message they answer. Threads are strictly one-to-one between examiner and
  that specific student.
- **Emoji picker** (`EMOJI_SET`) for comments.
- **File/document viewer with annotation** (`viewer*` state): open a submitted file, page
  through it (`viewerPageIdx`), zoom/rotate, and draw annotations (`viewerAnnoStore`,
  `viewerTool`, `viewerColor`) on top — read-only mode available (`viewerReadOnly`) for
  viewing a past attempt's file without editing it. Remembers which view to return to
  (`viewerReturnView`) and which attempt a given open file belongs to (`viewerAttemptNum`) so
  the "how you were evaluated" panel shows the right historical grade snapshot.

---

## 7. Student ("Learner") Workspace

Switchable via the profile-menu role toggle (`switchRole('student')`), reading the same mock
data as the admin console.

- **Curriculum navigation** (`renderStudentCurriculumNav`): a sidebar list mixing read-only
  course content modules (Overview → AI/ML Fundamentals → Case Studies → Certificate,
  `curriculumFlow`) with assignment entries, all under one expandable "module" tree
  (`curr-module`). A student can step forward/back through the linear curriculum flow with
  Prev/Next controls (`currStep(delta)`), independent of the sidebar tree.
- **Course content items** (`courseContent{}`): each is either a `document` (rich body text +
  a "Topics Covered" list) or a `video` (poster image, duration, video URL, same body/topics
  layout below the player) — `playCurrVideo()` swaps a poster thumbnail for a live
  `<video>` element on click rather than autoplaying.
- **Certificate module**: describes eligibility (all assignments passing, final assessment
  ≥50%) purely as content — issuance is not actually modeled/simulated in this prototype.
- **Assignment detail + submission form** (not yet submitted):
  `studentSubTab`: `'assignment' | 'rubric' | 'submit'` tabs — brief/instructions/questions,
  a read-only view of the rubric they'll be graded against, and a submission composer
  (text entry and/or file upload, mock file pool `studentMockFilePool`).
- **Submitted assignment view** (`stuSubTab`): `'assignment' | 'feedback' | 'evaluated' |
  'submission' | 'files'` — drives both columns of the page, including a sticky right-side
  preview. Defaults to `'feedback'` on open since that's where the comment composer lives.
- **Access-window awareness**: the student's assignment list/detail pages use
  `getAssignmentWindow()` to show not-yet-open / late / closed states and gate whether
  submission is currently allowed.
- **Late badge**: mirrors the admin console's `isLateSubmission`/`getLateDuration` badges
  ("Late by 2d 4h" vs. "On-time").

---

## 8. Rich Text Editor (RTE)

A lightweight, dependency-free `contenteditable`-based rich text editor
(`renderRTEToolbar`/`renderRTEEditor`) used anywhere formatted text is needed — rubric/
assignment "outcome" fields, comments, notes:
- Toolbar commands: bold/italic/underline, block format (paragraph/heading), font family
  (with a curated `RTE_FONT_OPTIONS` list plus Google Fonts loaded in `<head>`, degrading
  gracefully offline via each stack's generic fallback), font size, and table insertion
  (configurable rows/columns via `rteInsertTable`).
- Selection is preserved across toolbar clicks via `rteSaveSelection`/`rteSavedRange` (since
  clicking a toolbar button would otherwise lose the text selection focus).
- `rteSyncToolbarState()` keeps toolbar buttons showing the active state (e.g. Bold pressed)
  matching the current cursor position.
- `rteIsEmpty()` treats a `contenteditable` containing only whitespace/`<br>` as empty, for
  validation purposes (e.g. rubric outcome being "missing").
- `renderAssignmentMarkdown(md)` is a small hand-rolled Markdown→HTML renderer (headings,
  lists, inline emphasis) used to render authored assignment content that isn't going through
  the RTE.
- `countWordsInHtml()` strips tags to count words for word-limit enforcement.

---

## 9. Validation Philosophy (recurring pattern)

Across rubrics, scales, and assignments, the app consistently distinguishes:
- **Blockers** (`validateRubric`, `validateScale`, `validateAssignment`) — hard errors that
  prevent Publish, surfaced as a bulleted list in a modal (`showModal`) when Publish is
  clicked.
- **Warnings** (`rubricWarnings`, `scaleWarnings`) — non-blocking notices shown inline (e.g.
  "this is already in use elsewhere, edits won't retroactively apply").

This lets an author freely **Save as Draft** at any time (no validation), while Publish is
gated.

---

## 10. Notable UI/UX conventions used throughout

- **Step-tab wizards** (rubric builder, assignment wizard) with a persistent Back / Save
  draft / Continue-or-Publish footer.
- **Modal-hosted mini-wizards**: the rubric and scale builders can run either as a full page
  or as a modal launched from within a different flow (assignment creation), sharing the same
  render functions with an `...FromModal` wrapper.
  variant.
- **Search + status/type filters** on the Rubrics and Grade Scales library list pages
  (`rubricSearch`/`rubricFilterStatus`/`rubricFilterType`, and the scale equivalents).
- **Drag-and-drop reordering** for criteria and levels within the rubric builder, with visual
  drag-over/leave states (`onCriterionDragStart/Over/Leave/Drop`, `onLevelDrag...`).
- **Monotonic update clocks** (`asgRuleClock`) used purely to break same-priority ties by
  recency, rather than wall-clock timestamps — a deliberate simplification appropriate for a
  prototype.
- **Status lifecycle** shared by rubrics, scales, and assignments: `draft → published →
  (inuse)`; editing something already in use never mutates existing linked
  assignments/submissions, only future ones.

---

## 11. Not implemented (explicitly placeholder)

Sidebar entries that are stubbed with a "Coming soon" placeholder and a `navPlaceholder()`
click handler (no real view): **Question Pool**, **Marketing**, **Reports**, **Website**,
**Settings**. These exist to convey the full intended product surface without being built out
in this prototype.
