/**
 * Glue that turns the rubric engine's `EvaluationResult` plus the
 * current draft into a page-shaped object.
 *
 * The page consumes this single value; everything else (override
 * precedence, completion state, student-visible grade) lives here.
 */
import type { GradeScale } from "@/features/rubrics/constants";
import { evaluateRubric } from "@/features/rubrics/evaluation";
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
): { grade: string | null; passFail: PassFail | null; percentage: number | null } {
  if (format === "Comp/Incomp") {
    if (raw === "Complete" || raw === "Incomplete") {
      return { grade: raw, passFail: raw === "Complete" ? "pass" : "fail", percentage: null };
    }
    return { grade: null, passFail: null, percentage: null };
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

  return { grade: String(clamped), passFail: null, percentage };
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
      );
      percentage = direct.percentage;
    }
  } else if (submission.gradeType) {
    const direct = effectiveFromDirect(
      submission.gradeType,
      draft.directGrade,
      submission.totalMarks,
    );
    effectiveGrade = direct.grade;
    passFail = direct.passFail;
    percentage = direct.percentage;
  } else {
    effectiveGrade = engineResult.grade;
    passFail = engineResult.passFail;
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
