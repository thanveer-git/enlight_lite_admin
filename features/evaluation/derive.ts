/**
 * Glue that turns the rubric engine's `EvaluationResult` plus the
 * current draft into a page-shaped object.
 *
 * The page consumes this single value; everything else (override
 * precedence, completion state, student-visible grade) lives here.
 */
import type { GradeScale } from "@/features/rubrics/constants";
import { evaluateRubric } from "@/features/rubrics/evaluation";
import { isPassingBand } from "@/features/rubrics/evaluation/helpers";
import type {
  EvaluationResult,
  PassFail,
  ScaleBand,
} from "@/features/rubrics/evaluation/types";

import { clampDirectGrade, parseNumericDirectGrade } from "./direct-grade";
import { resolveOverride } from "./override";
import type {
  DirectGradeFormat,
  EvaluationDraft,
  Submission,
} from "./types";

export interface DerivedEvaluation {
  engine: EvaluationResult | null;
  effectiveGrade: string | null;
  /** Normalized 0–100 score for the hero progress ring.
   *  Populated from the rubric engine when present, otherwise derived
   *  from the direct-grade input (edubex §4.10). Null when nothing
   *  resolvable (Comp/Incomp, blank input, named-scale band). */
  percentage: number | null;
  passFail: PassFail | null;
  overrideApplied: { value: string; reason: string } | null;
  minPassOverride: { band: ScaleBand; reason: "resubmit" } | null;
  requiresManualOverride: boolean;
  isIncomplete: boolean;
  completionDecision: "complete" | "open";
  studentVisibleGrade: string | null;
  explanation: string[];
  /** True when the rubric controls should be locked (manual override on). */
  rubricLocked: boolean;
  /** True when Save should be blocked because the override is on with no reason. */
  saveBlocked: boolean;
  saveBlockReason: string | null;
}

interface DeriveInput {
  submission: Submission;
  draft: EvaluationDraft;
  gradeScale: GradeScale | null;
  rubric: { matrix: import("@/types/rubric").RubricMatrix; type: import("@/types/rubric").RubricType } | null;
}

function computeEngine(
  submission: Submission,
  draft: EvaluationDraft,
  gradeScale: GradeScale | null,
  rubric: DeriveInput["rubric"],
): EvaluationResult | null {
  if (!rubric) return null;
  return evaluateRubric({
    rubric: rubric.matrix,
    rubricType: rubric.type,
    ratings: draft.ratings,
    gradeScale,
    totalMarks: submission.totalMarks,
    roundPercentageBeforeBandLookup: true,
  });
}

function effectiveFromEngine(engine: EvaluationResult | null): {
  grade: string | null;
  passFail: PassFail | null;
  minPassOverride: DerivedEvaluation["minPassOverride"];
  isIncomplete: boolean;
} {
  if (!engine) {
    return { grade: null, passFail: null, minPassOverride: null, isIncomplete: true };
  }
  if (engine.status === "incomplete") {
    return {
      grade: null,
      passFail: null,
      minPassOverride: null,
      isIncomplete: true,
    };
  }
  return {
    grade: engine.finalGrade,
    passFail: engine.passFail,
    minPassOverride: engine.minPassOverride,
    isIncomplete: false,
  };
}

function effectiveFromDirect(
  format: DirectGradeFormat,
  raw: string,
  totalMarks: number | null,
  gradeScale: GradeScale | null,
): { grade: string | null; passFail: PassFail | null; percentage: number | null } {
  if (format === "Comp/Incomp") {
    // Trust the configured `completeLabel`/`incompleteLabel` so renaming
    // them in the scale doesn't desync the verdict.
    const complete = gradeScale?.configuration?.completeLabel ?? "Complete";
    const incomplete = gradeScale?.configuration?.incompleteLabel ?? "Incomplete";
    if (raw === complete || raw === incomplete) {
      return { grade: raw, passFail: raw === complete ? "pass" : "fail", percentage: null };
    }
    return { grade: null, passFail: null, percentage: null };
  }
  // Named-band / `gs_*` formats: the value is a scale band label, not
  // a number. Look up its `minMarks` to derive a percentage for the
  // WaterFill, and use the canonical pass rule so the chip reflects
  // whether the band is passing on the active scale.
  if (format === "NamedBand" || format.startsWith("gs_")) {
    const range = gradeScale?.ranges?.find((b) => b.grade === raw) ?? null;
    if (!range) return { grade: raw || null, passFail: null, percentage: null };
    const passFail: PassFail = isPassingBand(range, gradeScale, totalMarks) ? "pass" : "fail";
    return { grade: range.grade, passFail, percentage: range.minMarks };
  }
  const parsed = parseNumericDirectGrade(raw, format, totalMarks);
  if (!parsed.ok) return { grade: null, passFail: null, percentage: null };
  const clamped = clampDirectGrade(parsed.value, format, totalMarks);

  // Normalize every numeric direct-grade format onto a 0–100 scale so
  // the hero progress ring has a value to show even when no rubric
  // engine is involved (edubex §4.10).
  let percentage: number | null = null;
  if (format === "Percentage") {
    percentage = clamped;
  } else if (format === "CGPA") {
    // CGPA is 0–10.
    percentage = (clamped / 10) * 100;
  } else if (format === "Marks") {
    if (totalMarks != null && totalMarks > 0) {
      percentage = (clamped / totalMarks) * 100;
    }
  }

  // Pass/fail verdict on the *raw* value (CGPA 0–10, Marks out of
  // totalMarks), not the normalized percentage. The percentage is for
  // display only; the pass threshold lives on the raw input scale.
  const passFail: PassFail = isPassingBand(clamped, gradeScale, totalMarks)
    ? "pass"
    : "fail";

  return { grade: String(clamped), passFail, percentage };
}

/**
 * Convert the engine's 0–100 percentage into a label in the assignment's
 * native grade format. Used for rubric-graded submissions where the
 * engine produced a percentage but the user wants to see the result in
 * CGPA / Marks / Percentage / Complete-Incomplete form.
 *
 * - `Percentage` → keep one decimal place and append `%` (matches the
 *   engine's own formatting so the displayed value is stable).
 * - `CGPA` → divide by 10 (engine is 0–100, CGPA is 0–10).
 * - `Marks` → multiply by totalMarks / 100.
 * - `Comp/Incomp` → map to "Complete" / "Incomplete" using the scale's
 *   `completeMin` threshold (default 51, so anything ≥ 51 is Complete).
 * - Anything else (NamedBand, gs_*) → return null; those formats are
 *   scale-driven and shouldn't be reverse-engineered from a raw
 *   percentage.
 */
function enginePercentageToNative(
  enginePct: number | null,
  format: DirectGradeFormat,
  totalMarks: number | null,
  gradeScale: GradeScale | null,
): string | null {
  if (enginePct == null) return null;
  if (format === "Percentage") {
    return `${enginePct.toFixed(1)}%`;
  }
  if (format === "CGPA") {
    return (enginePct / 10).toFixed(1);
  }
  if (format === "Marks" && totalMarks != null && totalMarks > 0) {
    return ((enginePct / 100) * totalMarks).toFixed(1);
  }
  if (format === "Comp/Incomp") {
    const completeMin = gradeScale?.configuration?.completeMin ?? 51;
    const completeLabel = gradeScale?.configuration?.completeLabel ?? "Complete";
    const incompleteLabel = gradeScale?.configuration?.incompleteLabel ?? "Incomplete";
    return enginePct >= completeMin ? completeLabel : incompleteLabel;
  }
  return null;
}

export function deriveEvaluation(input: DeriveInput): DerivedEvaluation {
  const { submission, draft, gradeScale, rubric } = input;
  const engine = computeEngine(submission, draft, gradeScale, rubric);
  const engineResult = effectiveFromEngine(engine);

  const overrideResolved = resolveOverride({
    engine: engine ?? emptyEngineResult(),
    override: draft.override,
    directGrade: draft.directGrade,
    gradeFormat: submission.gradeType,
    gradeScale,
    totalMarks: submission.totalMarks,
  });

  // Manual override wins above everything else (document §5.8).
  let effectiveGrade: string | null;
  let passFail: PassFail | null;
  let percentage: number | null = engine?.percentage ?? null;
  let overrideApplied: DerivedEvaluation["overrideApplied"] = null;
  if (overrideResolved.applied) {
    effectiveGrade = overrideResolved.effectiveGrade || null;
    passFail =
      overrideResolved.passFail === "unknown" ? null : overrideResolved.passFail;
    overrideApplied = {
      value: overrideResolved.effectiveGrade,
      reason: overrideResolved.reason ?? "",
    };
    // Override still needs a percentage for the hero ring — fall back
    // to the direct-grade normalization if the override was set from
    // direct grading, otherwise keep the engine percentage.
    if (submission.gradeType && engine === null) {
      const direct = effectiveFromDirect(
        submission.gradeType,
        draft.directGrade,
        submission.totalMarks,
        gradeScale,
      );
      percentage = direct.percentage;
    }
  } else if (submission.gradeType) {
    const direct = effectiveFromDirect(
      submission.gradeType,
      draft.directGrade,
      submission.totalMarks,
      gradeScale,
    );
    // Direct grade wins when the evaluator entered one — either a
    // numeric value (percentage != null) or a non-numeric verdict
    // like Comp/Incomp ("Complete" / "Incomplete") which has grade
    // set but no percentage. Empty input falls through to the engine
    // path so rubric-graded submissions keep their computed value.
    if (direct.grade != null) {
      effectiveGrade = direct.grade;
      passFail = direct.passFail;
      if (direct.percentage != null) percentage = direct.percentage;
    } else {
      // Engine ran (rubric-graded submission) but the user wants the
      // result in the assignment's native format. For numeric formats
      // (Percentage / CGPA / Marks) and Comp/Incomp, convert the
      // engine's 0–100 percentage into the native label. For
      // scale-driven formats (gs_letter, gs_performance) the engine
      // already resolved the band label — use it directly.
      if (
        submission.gradeType === "Percentage" ||
        submission.gradeType === "CGPA" ||
        submission.gradeType === "Marks" ||
        submission.gradeType === "Comp/Incomp"
      ) {
        effectiveGrade = enginePercentageToNative(
          engine?.percentage ?? null,
          submission.gradeType,
          submission.totalMarks,
          gradeScale,
        );
      } else {
        effectiveGrade = engineResult.grade;
      }
      passFail = engineResult.passFail;
    }
  } else {
    effectiveGrade = engineResult.grade;
    passFail = engineResult.passFail;
  }

  // For scale-driven Grade Profile matches (e.g. unscored rubric +
  // gs_performance → "Excellent") the engine produces a band label but
  // no percentage, since unscored rubrics carry no points. The hero
  // gauge still needs a number to fill WaterFill — look up the band
  // on the active grade scale and use its `minMarks` as a proxy.
  if (percentage == null && effectiveGrade != null && gradeScale?.ranges?.length) {
    const band = gradeScale.ranges.find((b) => b.grade === effectiveGrade);
    if (band) percentage = band.minMarks;
  }

  // Completion: with min-pass failure, the override forces "open" unless
  // the evaluator marks complete explicitly. With pass, the engine
  // result drives the decision.
  const minPassFailed = engine?.minPassOverride != null;
  const completionDecision: "complete" | "open" =
    draft.markComplete && !minPassFailed ? "complete" : "open";

  const studentVisibleGrade = completionDecision === "complete" ? effectiveGrade : null;

  const requiresManualOverride = engine?.requiresManualOverride ?? false;

  const saveBlocked = overrideResolved.blocker === "no_reason";
  const saveBlockReason = saveBlocked
    ? "Add a reason for the override before saving."
    : null;

  return {
    engine,
    effectiveGrade,
    percentage,
    passFail,
    overrideApplied,
    minPassOverride: engineResult.minPassOverride,
    requiresManualOverride,
    isIncomplete: engineResult.isIncomplete && !overrideResolved.applied,
    completionDecision,
    studentVisibleGrade,
    explanation: engine?.explanation ?? [],
    rubricLocked: overrideResolved.lockedRubric,
    saveBlocked,
    saveBlockReason,
  };
}

function emptyEngineResult(): EvaluationResult {
  return {
    status: "incomplete",
    rubricType: "scored",
    method: null,
    criteria: [],
    weightedScore: null,
    weightedMax: null,
    percentage: null,
    matchedRule: null,
    scaleBand: null,
    minPassStatus: "off",
    minPassOverride: null,
    requiresManualOverride: false,
    finalGrade: null,
    passFail: null,
    explanation: [],
  };
}
