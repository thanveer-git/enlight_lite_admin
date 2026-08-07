# EDUBEX — Assignment Module (Admin / Tutor Side)

Source: `EDUBEX_prototype_UPDATED_new_11_1.html`
Scope: every admin-facing screen and flow inside the **Assignments** area — the list, the create/edit wizard, access & notification rules, publish/draft logic, and the Evaluation (grading) console. Student-side screens are intentionally excluded.

---

## 1. Assignments List (`renderAssignments` → list mode)

The landing screen for the admin's Assignments area.

- **Header**: "Assignments" title + live count (`N assignment(s)`).
- **Row per assignment**, click anywhere on the row to edit it. Each row shows:
  - Icon + title
  - Meta line: `Due <date> · <word limit or "No word limit"> · <grade type>` (and `(/Total Marks)` when the grade type is **Mark**), plus the grade scale name if one is set.
  - An **"IE Feedback" badge** if any submission under that assignment has Internal Examiner feedback.
  - A **status badge**: `draft`, `published`, or `In use`.
  - Row actions: **Edit** (pencil icon) and **Delete** (trash icon, with a confirmation modal — *"This will be permanently removed"*).
- **Empty state**: "No assignments yet" with a "Create your first assignment" link.
- **New assignment** button (top toolbar) → opens the wizard in create mode.

### Delete flow
`deleteAssignment(i)` → confirmation modal → on confirm, the assignment is spliced out of `sampleAssignments` and the list re-renders.

---

## 2. Create / Edit Assignment Wizard (`renderAssignmentWizard`)

Opened via **New assignment** (`newAssignment()`, resets all wizard state) or by clicking a row (`editAssignment(i)`, which hydrates the wizard state from the stored assignment).

A 5-step tab strip runs across the top. Tabs are directly clickable (`asgGoStep`) so the admin can jump between steps freely — they aren't gated.

| Step | Label | Purpose |
|---|---|---|
| 0 | **Details** | Title & content |
| 1 | **Grade scale & Rubric** | Grade banding & criteria |
| 2 | **Outcomes** | Learning outcome, pulled from rubric, editable |
| 3 | **Access & deadline** | Who can access it, and when |
| 4 | **Review** | Final check + Publish |

Footer controls, present on every step:
- **Back** (hidden on step 0)
- **Save draft** (`saveAssignmentDraft()`) — always available, any step
- **Continue** (steps 0–3) or **Publish assignment** (step 4)
- **Cancel** — closes any open rubric/scale modal and returns to the list without saving

### Step 0 — Details (`renderAsgStep0`)
- **Title\*** (text)
- **Word limit** (number; `0` = no limit) — learners are blocked from submitting over this count
- **Assignment lecture slug\*** (text) — URL-friendly slug tied to the source lecture
- **Section\*** (dropdown from a mock section pool) — or **Add new section** button (UI placeholder only, not wired up)
- **Content / instructions** — a full rich-text editor (headings, lists, tables) for the brief learners will read
- **Attached files** — "Add file" button appends a file from a mock pool; each attached file can be removed individually. Empty state shows a drag-and-drop-style zone.

### Step 1 — Grade scale & Rubric (`renderAsgStep1`)
Rubric selection is shown **before** grade type/scale, because the rubric constrains what's selectable below.

- **Use rubric** toggle. Off → grading happens directly via grade type/scale, no rubric.
- If on: a scrollable list of all rubrics in the library, each row showing name, criteria list, criteria/level counts, rubric type, its suggested grade scale (if any), and status badge (`draft` / `published` / `In use`). Clicking selects it.
- **New rubric** button → opens an **inline rubric-creation modal** (`openRubricModalFromAssignment`) that reuses the full rubric builder (Step 0 basics → Step 1 criteria & levels → Step 2 grade rules → Step 3 review) without leaving the assignment wizard. Publishing from this modal adds the rubric to the library **and** selects it for the current assignment.
- **Show detailed evaluation breakdown to students** toggle — controls whether students see the full criteria breakdown/calculation or only their overall score/grade once graded.
- **Grade type / Grade scale panel**: a combined selectable list of:
  - The four fixed grade types — **CGPA**, **Percentage**, **Mark**, **Complete/Incomplete** (each with an explanatory line)
  - Every grade scale in the library (each row shows its bands, type, and status)
  - A **New grade scale** button → inline grade-scale creation modal (`openScaleModalFromAssignment`)
  - Only one of {grade type, grade scale} can be active at a time; picking one clears the other.
- **Rubric × Grade combination rules** (enforced live):
  - **No rubric** → any grade type or any grade scale (one is required).
  - **Scored rubric** → same — its weighted/profile result gets mapped onto whatever type/scale is chosen.
  - **Unscored rubric** → *only* its own suggested grade scale, or no scale at all. Every grade type and every other scale is hidden (not just disabled), because an unscored rubric is graded with per-criterion ratings, not a calculated score.
- If **grade type = Mark**, a **Total Marks\*** field appears (the denominator awarded marks are shown out of, e.g. "42 / 50"). Required and validated > 0.

### Step 2 — Outcomes (`renderAsgStep2`)
- If a rubric is attached: the outcome text is pulled automatically from the rubric's own "learning outcome" field, shown as the default.
- The admin can **customize it for this assignment only** by typing into the rich-text field — this does not change the rubric itself. A "Customized for this assignment" tag appears, with a **Reset to rubric outcome** link to revert.
- If no rubric is attached, there's nothing to pull from — the admin can still type a standalone outcome or leave it blank.

### Step 3 — Access & deadline (`renderAsgStep3`)
The most complex step: manages **who can see/submit the assignment and when**, via one or more **access rules**.

**Add rule** button appends a new rule; each rule can be individually removed (as long as at least one remains).

Each rule card contains:
- **Assign to**: `Everyone` / `Single Student` / `Multiple Students`
  - Single Student → a student dropdown
  - Multiple Students → a multi-select checkbox picker of all students
  - Switching the audience type clears any previously selected students
- **Available From** (date + time)
- **Due Date** (date + time)
- **Available Until** (date + time)
  - All three date fields are optional individually, but **at least one must be set** per rule — flagged with a warning box if none are set.
- **Priority badge**: automatically computed — `Single Student` (High) > `Multiple Students` (Medium) > `Everyone` (Low).
- **Notify learners affected by this rule** checkbox — a one-time "send on save" action (not a persistent setting; unchecked again automatically after a successful publish/save that sends).

**Resolution logic** (`resolveAccessFor` / `resolveAccessForStudent`):
1. Rules are resolved **per date field**, per student, by priority: Single Student overrides Multiple Students, which overrides Everyone.
2. Only fields a higher-priority rule *explicitly sets* are overridden — everything else is inherited from a lower-priority rule (field-level inheritance, not whole-rule replacement).
3. Within the same priority level, the **most recently updated** rule wins for a conflicting field (tie-break via an internal update clock), while non-conflicting fields still merge in from other rules at that level.
4. Submissions after the Due Date are still accepted — they're simply flagged **late**, not blocked.

**Resolved access preview** — a live "test as a student" panel: pick any student from a dropdown and see their fully-resolved effective Available From / Due / Until, plus a note for each field on whether it was **inherited from** or **overridden by** a specific rule level. This exists purely to let the admin verify the priority/inheritance logic before publishing.

### Step 4 — Review & Publish (`renderAsgStep4`)
- Runs the full validator (`validateAssignment()`) and shows either:
  - A **red warning block** listing every blocking issue that must be fixed, or
  - A **green success box**: "All required fields are complete. This assignment is ready to publish."
- A read-only summary of everything configured: Title, Lecture slug, Section, Grade type (+ Total Marks if Mark), Word limit, Grade scale, Rubric, Grading rules (derived from the rubric — Unscored/Weighted average/Grade profile + minimum-pass note), and "What students see" (Detailed vs Score-only, with an Edit shortcut back to Step 1).
- Every access rule listed with its priority badge, audience, and From/Due/Until.
- The effective learning outcome, with an Edit shortcut back to Step 2.

### Validation blockers (`validateAssignment`)
Checked in full before publish is allowed (draft save skips these):
- Title is required.
- A grade type or grade scale is required (except for an unscored rubric, which may have none — "ratings only").
- **Mark** grade type requires Total Marks > 0.
- Selected rubric must be `published` or `In use` (not `draft`).
- If a scored rubric + scale are both selected: the scale must not be `draft`; and if the rubric uses **Grade Profile** rules, every grade label referenced in those rules must exist in the selected scale's bands.
- Unscored rubric: no raw grade type is permitted at all; if a scale is picked it must be a `non-draft` scale and must equal the rubric's own suggested scale (no substitutions).
- Every access rule must have at least one date field set.
- A `Single Student` rule must have exactly one student selected; a `Multiple Students` rule must have at least one.

### Publish (`publishAssignment`)
1. Re-runs `validateAssignment()` — blocked with a modal listing all issues if any exist.
2. Computes the first due date across rules, sends any pending access notifications (`sendAccessNotifications()`), and writes the assignment (title, status = `published`, due, word limit, grade type/total marks, rubric name, scale name, content, files, access rules, notified-signatures log, outcome override, show-eval-detail flag) into `sampleAssignments` — creating a new entry or overwriting the one being edited.
3. Refreshes the student curriculum sidebar if currently previewing as a student.
4. Confirmation modal: *"Assignment published! It is now available to learners"* — plus how many learners were notified / how many already had current access and were skipped.

### Save draft (`saveAssignmentDraft`)
Same payload as publish, but `status = 'draft'` and **no validation is enforced** — a draft can be saved incomplete. Confirmation modal warns that drafts aren't visible to learners, so any "Notify learners" checkboxes won't actually send until the assignment is published.

### Notify-learners engine (`computeNotifyResults` / `sendAccessNotifications`)
Solves the problem of a student being covered by multiple notify-checked rules (e.g. an Everyone rule *and* a later Single-Student override):
1. Build the union of every student covered by any rule with **Notify** checked.
2. For each candidate, compute their fully-resolved access (from/due/until) and its signature.
3. Only send if that signature differs from the last signature they were notified with (tracked in `asgNotifiedSignatures`) — students whose resolved schedule hasn't actually changed are skipped ("already current"), even if a rule covering them has Notify checked.
4. After sending, every rule's Notify checkbox is reset to unchecked (it's a one-shot send-on-save action, not a persistent setting).

---

## 3. Supporting Admin Sub-flows Reused Inside the Assignment Wizard

- **Inline rubric modal** (`openRubricModalFromAssignment`, `openRubricModalForEdit`) — the full rubric builder (Details → Criteria & Levels → Grade rules → Review) rendered as a modal on top of the wizard, so a new/edited rubric can be created without losing wizard progress. Publishing auto-selects it for the assignment being built.
- **Inline grade-scale modal** (`openScaleModalFromAssignment`) — same pattern for grade scales; publishing auto-selects the new scale.
