# EDUBEX — Rubric Grading Engine: Step-by-Step Flows

This document walks through **exactly how a final grade is calculated**, one decision at a
time, for every combination the prototype supports. It's based on the real engine
(`simCompute()` and friends in the code) — the same logic that runs in the Rubric Simulator
and (conceptually) in the Evaluation Console.

Every flow uses the same starting setup unless stated otherwise:

> **Setup**: a Scored rubric has **Criteria** (each with a **weight**) and **Performance
> Levels** authored **best → worst** (Level 0 = best). Each level is either:
> - `single` — one fixed point value, or
> - `range` — a min–max point band (grader picks an exact value inside it)
>
> A grader picks one Level per criterion (and, for a `range` level, an exact point value
> inside it).

There are **two independent switches** that combine to give 4 possible flows:
1. **Grading Method**: `Weighted Average` or `Grade Profile`
2. **Minimum Pass Rule**: `Off` or `On`

---

## FLOW 1 — Weighted Average, Minimum Pass **OFF**

This is the simplest, most "spreadsheet-like" path.

```
STEP 1  For every criterion, find its own maximum possible points:
        maxForCrit = the highest point value among ALL levels
                     (for a range level that's its `max`; for a single level, its value)

STEP 2  Multiply by weight and sum, to get the rubric's total possible points:
        maxPts = Σ ( maxForCrit(criterion_i) × weight_i )

STEP 3  For every criterion, take the grader's actual selection:
        pts_i = the exact point value awarded
                (fixed value for a single level; the chosen value inside min–max for a range level)

STEP 4  Multiply by weight and sum, to get the rubric's total earned points:
        totalPts = Σ ( pts_i × weight_i )

STEP 5  Convert to a percentage:
        pct = ( totalPts ÷ maxPts ) × 100

STEP 6  Look up which BAND of the assignment's Grade Scale this percentage falls into:
        band = the scale band where band.from ≤ pct ≤ band.to

STEP 7  Final grade = that band's label.  DONE.
```

### Worked example — *Essay Writing Rubric*
Criteria & weights: Thesis (w=3), Evidence (w=2), Grammar (w=1)
Levels (all range type): Excellent 9–10, Proficient 7–8, Developing 4–6, Needs Improvement 0–3

- `maxForCrit` for every criterion = 10 (the top of the Excellent range)
- `maxPts = 10×3 + 10×2 + 10×1 = 60`
- Grader picks: Thesis → Proficient, 8 pts · Evidence → Excellent, 9 pts · Grammar → Developing, 5 pts
- `totalPts = (8×3) + (9×2) + (5×1) = 24 + 18 + 5 = 47`
- `pct = 47 ÷ 60 × 100 = 78.3%`
- Scale = *Letter Grade (Pass/Fail)*: bands A+ 90–100, A 75–89, B 60–74, C 50–59, F 0–49
- 78.3 falls in **A (75–89)** → **Final grade: A**

---

## FLOW 2 — Weighted Average, Minimum Pass **ON**

Same as Flow 1, but with one extra gate **before** the band lookup becomes final. The
Minimum Pass Rule is a rubric-level setting ("every criterion must reach at least Level X")
that is completely independent of *how* the score is calculated — it's a floor bolted onto
the result.

```
STEP 1–5   Identical to Flow 1: compute maxPts, totalPts, pct.

STEP 6     Check the Minimum Pass Rule:
           guaranteeLevel = the index of the rubric's chosen "minimum pass level"
           Check EVERY criterion's selected level index ≤ guaranteeLevel
           (remember: index 0 = best, so "≤" means "at or above" that level)

           ┌─ IF every criterion met the floor → Rule MET
           │     → proceed to STEP 7 normally, using the pct from Flow 1.
           │
           └─ IF at least one criterion fell below the floor → Rule NOT MET
                 → the calculated band/grade is THROWN AWAY.
                 → Final grade is FORCE-OVERRIDDEN to the LOWEST Fail band
                   of the assignment's grade scale (see note below for exactly
                   how that band is found).
                 → A resubmission is opened automatically.
                 → (This only fails to produce a band — requiring Manual
                    Override instead — for a Pass/Fail-mode scale where no
                    band was ever marked Fail. A "Simple"-mode scale always
                    has a derivable fail band, so this edge case can't occur
                    there.)

STEP 7     Band lookup exactly like Flow 1 Step 6 (only reached if the rule was MET).
```

> **How the "lowest Fail band" is found** — this depends on how the scale was authored,
> and only ONE of these two cases can ever end in "no Fail band, Manual Override required":
> - **Scale is in Pass/Fail mode** (every band explicitly marked Pass or Fail): the fail
>   band(s) are whichever ones were explicitly marked Fail. **If none were marked Fail**
>   (e.g. an author marked every band as Pass), there genuinely is no fail band to fall
>   back to — this is the case where **Manual Override becomes mandatory**.
> - **Scale is "Simple" mode** (no band was ever marked Pass/Fail at all): a fail band is
>   **always automatically derivable** — the single band with the lowest score-range floor
>   is treated as the fail band. A Simple-mode scale therefore never hits the "Manual
>   Override required" case; it always has a band to override into.

### Worked example — *Lab Report Assessment* (minPassLevel = "Developing")
Levels: Excellent(0), Proficient(1), Developing(2), Needs Improvement(3) — floor index = 2

- Grader picks: Hypothesis → Proficient(1) ✅, Method → Developing(2) ✅,
  Data Analysis → **Needs Improvement(3)** ❌, Conclusion → Excellent(0) ✅
- Data Analysis's index (3) is *not* ≤ 2 → **Rule NOT MET**
- Whatever the weighted % worked out to (say 61%, which would normally be a "B") is
  **discarded**
- Scale = *Percentage (Simple)*: A 75–100, B 50–74, C 0–49 (no explicit Pass/Fail marks →
  lowest band = C)
- **Final grade: C**, and the submission is automatically reopened for resubmission.

---

## FLOW 3 — Grade Profile, Minimum Pass **OFF**

Grade Profile replaces the arithmetic with **rules**. This is the *only* method available to
Unscored rubrics (which have no points), and is optionally available to Scored ones.

A rubric's `profileRules` list is an ordered set of named rules (e.g. "Award A"). Each rule
is a list of **paths** joined by OR; each path is a list of **tiers** joined by AND, plus an
optional **floor ("below")**.

```
STEP 1  Rank levels: Level 0 = best. levelRank[name] = its index.

STEP 2  Walk the profile rules TOP TO BOTTOM (first match wins):
        For the current rule, check if ANY of its paths matches (OR):
          A path matches only if ALL of these are true (AND):
            (a) For every {count, level} tier in the path:
                  at least `count` criteria have a selected level
                  at index ≤ levelRank[level]   (i.e. "reached at least this level")
            (b) If the path has a "below" floor set:
                  NO criterion's selected level may have index >
                  levelRank[below]  (i.e. "nothing may fall below this level")

STEP 3  ┌─ IF a rule matched → Final grade = that rule's grade label. DONE.
        │
        └─ IF no rule matched at all:
              ┌─ IF this is a Scored rubric AND its "fallback" toggle is ON:
              │     → silently re-run FLOW 1 (Weighted Average) and use that result instead.
              │
              └─ ELSE (Unscored, or fallback OFF):
                    → No automatic grade can be produced.
                    → Manual Override by the examiner is required.
```

### Worked example — *Oral Presentation* (Unscored, 3 equal criteria)
Levels: Excellent(0), Proficient(1), Developing(2)
Rules (in order):
1. **Award A** — path: `{count:3 @ Excellent}` (all 3 criteria must reach Excellent)
2. **Award B** — paths (OR):
   - `{count:2 @ Proficient}` AND `below: Developing` (nothing worse than Developing)
   - `{count:3 @ Developing}` (everyone reaches at least Developing)

Grader picks: Content → Excellent(0), Delivery → Proficient(1), Engagement → Developing(2)

- **Check Rule A**: needs 3 criteria at index ≤ 0. Only Content qualifies (1 of 3) → **fails**.
- **Check Rule B, path 1**: needs 2 criteria at index ≤ 1 (Proficient or better).
  Content(0)✅ and Delivery(1)✅ qualify → count = 2, meets the "≥2" requirement.
  Floor check: is any criterion worse than Developing(index 2)? No (max index used is 2) →
  **path matches**.
- **Rule B matches** → **Final grade: B**. (Rule A was checked first but didn't match, so we
  never even got to ask whether Rule B's second path also matched — first match wins.)

---

## FLOW 4 — Grade Profile, Minimum Pass **ON**

Only relevant for **Scored** rubrics using the profile method (Unscored rubrics have no
"minimum pass level" concept, since that concept is expressed in points/levels tied to a
scored grading path). The Minimum Pass Rule still takes priority over whatever the profile
rules produce — same idea as Flow 2, just layered onto Flow 3 instead of Flow 1.

```
STEP 1–2   Identical to Flow 3: find the first matching profile rule (if any).

STEP 3     Separately, check the Minimum Pass Rule exactly as in Flow 2 Step 6
           (every criterion's level index ≤ guaranteeLevel?).

STEP 4     ┌─ IF a rule matched in Flow 3 AND Minimum Pass is MET
           │     → Final grade = the matched rule's grade label. DONE.
           │
           ├─ IF a rule matched in Flow 3 BUT Minimum Pass is NOT MET
           │     → the matched rule's grade is DISCARDED.
           │     → Final grade is FORCE-OVERRIDDEN to the lowest Fail band
           │       of the grade scale, exactly as in Flow 2.
           │
           └─ IF NO rule matched in Flow 3 at all
                 → Minimum Pass is irrelevant here (there's no grade to override yet);
                   proceed exactly as in Flow 3 Step 3's fallback logic
                   (weighted-average fallback if enabled, else Manual Override required).
```

### Worked example (hypothetical Scored + Profile + Min Pass rubric)
- minPassLevel = "Proficient" (index 1) → guaranteeLevel = 1
- Profile Rule "Award A" matches based on the selected levels
- But one criterion was scored at "Needs Improvement" (index 3), which is *not* ≤ 1
  → Minimum Pass **NOT MET**
- Even though "Award A" matched, its grade is thrown away
- **Final grade = lowest Fail band of the linked scale** (e.g. "F"), and resubmission opens
  automatically — exactly like Flow 2, just arrived at via the profile path instead of the
  weighted-average path.

---

## Quick-reference decision tree (all 4 flows combined)

```
                        ┌───────────────────────────┐
                        │   Which grading method?    │
                        └─────────────┬─────────────┘
                    Weighted Average  │  Grade Profile
              ┌──────────────────────┘  └──────────────────────┐
              ▼                                                 ▼
   Compute totalPts, maxPts,                     Walk rules top→bottom;
   pct = totalPts/maxPts×100                      first path-match wins
              │                                                 │
              │                            ┌────────────────────┴───────────────────┐
              │                            │ rule matched?                          │ no rule matched
              │                            ▼                                        ▼
              │                    (continue below)                 Scored + fallback ON?
              │                                                        │YES        │NO
              │                                                        ▼            ▼
              │                                             re-run Weighted    Manual Override
              │                                             Average (left       required
              │                                             branch) →│
              │                                                      │
              └───────────────────┬──────────────────────────────────┘
                                   ▼
                     ┌───────────────────────────┐
                     │  Is Minimum Pass Rule ON?  │
                     └─────────────┬─────────────┘
                        NO         │        YES
                ┌──────────────────┘        └───────────────────┐
                ▼                                                ▼
     Use pct→band lookup /                          Did EVERY criterion reach
     matched rule's grade                            the guaranteed level?
        directly as the                          YES │              │ NO
        final grade. DONE.                            ▼              ▼
                                          Use pct→band lookup /   Force-override to
                                          matched rule's grade    LOWEST FAIL BAND of
                                          as final grade. DONE.   the grade scale +
                                                                  auto-reopen for
                                                                  resubmission. DONE.
```

---

## Two engines running the same logic: Simulator vs. Live Evaluation Console

Everything above describes the core decision logic, which is shared by **two separate
implementations** in the app: the stand-alone **Rubric Simulator** (what-if testing tool,
`simCompute()`) and the **live Evaluation Console** (real grading of a real submission,
`computeRubricScoreFor()`). They're built to mirror each other, but there are three real
differences worth knowing about:

1. **When the Minimum Pass Rule is allowed to fire.**
   - **Live Console**: the floor is only ever checked once **every criterion has been
     graded**. While a submission is mid-grading (some criteria still unscored), min pass
     is simply not evaluated yet — no premature "failed" state is possible.
   - **Simulator**: has no such gate. If any criterion in the tester's mock scoring
     session is still unset, that missing criterion automatically fails the "every
     criterion must reach the floor" check — so an incomplete test run in the Simulator
     can show "Minimum pass rule not met" purely because you haven't finished testing
     yet, not because a real failing level was chosen.

2. **Rounding.** The Live Console rounds the weighted percentage to a **whole number**
   before doing the band lookup. The Simulator keeps full decimal precision internally and
   only rounds for display (one decimal place) in its step-by-step narrative. In practice
   this can occasionally place a percentage in a different band right at a boundary (e.g. an
   unrounded 74.6% vs. a rounded 75%, straddling a 75-cutoff band edge).

3. **What "pct" means once a Grade Profile rule matches.** In both engines, once a profile
   rule matches (or the min-pass override kicks in), `pct` is not a meaningful weighted
   percentage anymore — only the `gradeLabel`/band matters. `pct` is only populated when an
   actual weighted calculation ran (Weighted Average method, or a Profile-method fallback).

Everything else — which rule matches, how minimum pass is applied, how fallback works — is
identical between the two.

---

## Edge cases and boundary conditions (all remaining possibilities)

### A. No scale attached at all
If the assignment/rubric has no grade scale selected, there is no set of bands to look
anything up in:
- **Weighted method**: `band` stays `null` regardless of the percentage — nothing to
  display as a band, though the raw percentage itself is still computed and can still be
  shown (e.g. under a Percentage/CGPA/Mark grade type, which don't need a scale at all).
- **Grade Profile method**: a matched rule tries to look up a scale band with the same
  label as its `grade` field; with no scale, that lookup fails, so the engine falls back to
  showing a synthetic label like `"Grade A"` instead of a real scale band.
- **Minimum Pass Rule**: if a criterion violates the floor but there's no scale to pull a
  Fail band from, **no override happens at all** — the rule's violation is silently unable
  to change anything, and whatever the normal calculation produced stands. This is subtly
  different from the "Pass/Fail-mode scale with no band marked Fail" case below: there, a
  scale *does* exist (so the intent to override is clearly signaled) — here, there's no
  scale to even attempt an override against.

### B. Scale attached, but no Fail band available to override into
(Covered above, repeated for completeness alongside case A.) Only possible when the scale
is in **Pass/Fail mode** and no band was ever marked Fail. A "Simple"-mode scale always has
a derivable fail band, so this can only happen in Pass/Fail mode. In the Simulator, this
still surfaces an explicit "Manual Override required" step message — but note that the
engine does **not** blank out whatever grade the normal calculation already produced; the
warning is advisory rather than a hard block on the returned result. Treat this state as
"the system is telling you to double check this one," not as a guaranteed blank final grade.

### C. Zero total weighted points possible
If every scored criterion ends up with `weight × maxPoints = 0` (e.g. all weights are 0 —
blocked at publish time, but reachable while still drafting/testing), the weighted
percentage defaults to **0%** rather than dividing by zero or erroring.

### D. A profile rule with no paths, or a path that never matches
A Grade Profile rule with an empty paths list can never match (there's nothing to OR
together) — it's effectively dead and grading skips straight to the next rule down the
list. Likewise a path whose tier references a level name that's since been deleted from the
rubric fails safely (returns "no match" for that tier) rather than crashing — this is also
what `validateRubric()` flags as a publish blocker ("deleted performance level still used in
a Grade Profile rule").

### E. Percentage doesn't land in any band (gap or rounding overshoot)
If a percentage doesn't fall inside any band's `[from, to]` range (e.g. a gap between bands,
or a rounding artifact pushing slightly past 100), the engine doesn't return "no band" — it
defaults to the **last band in the list**, which by the app's top-to-bottom-authoring
convention is normally the lowest/worst band. (Gaps between bands are themselves a
non-blocking... actually a **blocking** validation error at scale-publish time —
`validateScale()` rejects gapped ranges — so this fallback mainly matters for scales that
were never properly validated, e.g. mid-edit in the Simulator.)

### F. Unscored rubrics — the fully constrained case
An Unscored rubric is the one combination with no user-facing choice at all:
- **Grading method** is always Grade Profile — there is no weighted-average option, since
  there are no points to weight.
- **Fallback** never applies — falling back to weighted average requires points that
  simply don't exist on an Unscored rubric, regardless of what `fallbackOn` is set to.
- **Minimum Pass Rule** never applies — it's gated to `scored` rubrics only in both engines.
  An Unscored rubric's `minPassOn` field is not consulted at all.
- Net effect: for an Unscored rubric, the *only* two outcomes possible are "a profile rule
  matched → that grade" or "no rule matched → Manual Override required." There is no
  weighted-average path and no minimum-pass override path to reach.

### G. Partial grading (some, but not all, criteria scored)
- **Live Console**: shows a "not graded yet" / provisional state; the min-pass floor and
  "Mark as Complete" auto-tick are both deliberately withheld until `allCriteriaGraded` is
  true, so a half-graded submission never gets prematurely marked as failing or passing.
- **Simulator**: has no concept of "in progress" — every render recomputes from whatever's
  currently set, so an incomplete test session can show a misleadingly strict "minimum pass
  not met" result (see difference #1 above) purely due to unfinished testing, not an actual
  graded failure.

### H. Manual Override always has the final word
Regardless of which of the flows/edge cases above applies — weighted, profile, matched,
unmatched, min-pass-forced, or "no scale to fall back to" — an examiner's **Manual
Override**, once turned on with a reason given, replaces the result entirely in the live
Evaluation Console. It is the one mechanism with no further conditions or edge cases of its
own: turn it on, provide a reason, and the typed/selected value becomes the final grade,
full stop.

---

## Summary table

| Grading Method | Min Pass | What determines the final grade |
|---|---|---|
| Weighted Average | Off | `pct = Σ(pts×weight)/Σ(max×weight)×100` → grade-scale band containing `pct` |
| Weighted Average | On | Same as above, **unless** any criterion falls below the guaranteed level → forced to the scale's lowest Fail band + auto-resubmission |
| Grade Profile | Off | First profile rule (top→bottom) whose OR'd paths / AND'd tiers+floor match → its grade label. If none match: weighted-average fallback (if enabled) or Manual Override |
| Grade Profile | On | Same rule-matching as above, **unless** any criterion falls below the guaranteed level → forced to the scale's lowest Fail band + auto-resubmission (only checked once a rule has actually matched) |

In every "forced override" case, the Minimum Pass Rule always wins — it's checked
**after** the normal calculation and can throw away either a weighted % result or an
already-matched profile rule's grade.
