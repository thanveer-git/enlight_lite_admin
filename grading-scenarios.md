# Grading Scenarios — Assignment Wizard

Every valid Rubric × Grade type/scale pairing, written as a scenario with the resulting grading behavior.

## No rubric — grading happens directly, no criteria involved

**Scenario 1: Percentage + No rubric →** Manual grading, entered directly into an input box (0–100).

**Scenario 2: CGPA + No rubric →** Manual grading, entered directly into an input box (0–10).

**Scenario 3: Mark + No rubric →** Manual grading, entered directly into an input box, out of the assignment's configured Total Marks (e.g. 42 / 50).

**Scenario 4: Comp/Incomp + No rubric →** Manual grading, evaluator directly picks a status — Complete or Incomplete.

**Scenario 5: Grade Scale + No rubric →** Manual grading, evaluator directly picks a band/label from the scale (e.g. A+, A, B, C, F).

## Scored rubric — a calculated score, mapped onto the grade type/scale

**Scenario 6: Percentage + Scored rubric →** Rubric is scored (weighted average or Grade Profile); the final result is expressed as a percentage.

**Scenario 7: CGPA + Scored rubric →** Rubric is scored; the final result is expressed as a CGPA value (0–10).

**Scenario 8: Mark + Scored rubric →** Rubric is scored; the final result is expressed as marks out of the assignment's Total Marks.

**Scenario 9: Comp/Incomp + Scored rubric →** Rubric is scored; the final result resolves to a Complete/Incomplete status (e.g. via the minimum-pass rule or a Grade Profile rule, rather than a granular grade).

**Scenario 10: Grade Scale + Scored rubric →** Rubric is scored (weighted average, or Grade Profile matching against ranked levels); the final result is mapped onto one of the scale's labelled bands.

## Unscored rubric — not quantitative, graded by ratings only

**Scenario 11: Suggested Grade Scale + Unscored rubric →** Evaluator gives a rating per criterion (no calculation happens). The scale is only labelling context — it auto-resolves a band automatically if the rubric happens to have Grade Profile rules configured; otherwise it just sits alongside the ratings with no computed grade.

**Scenario 12: No Grade Scale + Unscored rubric (Ratings only) →** Evaluator gives a rating per criterion. Pure feedback — no scale, no grade of any kind.

## Blocked combinations (not selectable / fail publish validation)

**Scenario 13: No rubric + no grade type/scale →** Blocked — "Grade type is missing." One of the two is required.

**Scenario 14: Scored rubric + no grade type/scale →** Blocked — "Required grade scale is missing." One of the two is required.

**Scenario 15: Unscored rubric + any Grade type (CGPA/Percentage/Mark/Comp-Incomp) →** Blocked — it's not a quantitative rubric, so there's no calculated value to express in a raw grade type.

**Scenario 16: Unscored rubric + a grade scale other than its suggested one →** Blocked — only the rubric's own suggested scale is a valid pairing; any other scale in the library isn't.
