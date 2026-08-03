import type { GradeScale } from "@/features/rubrics/constants";
import type {
  GradeProfileRule,
  MatrixCriterion,
  MatrixLevel,
  ProfilePath,
  RubricMatrix,
} from "@/types/rubric";

import {
  getEffectivePoints,
  isPassingBand,
  levelIndexInOrder,
} from "./helpers";
import type {
  CriterionEvaluation,
  CriterionRating,
  EvaluateRubricInput,
  EvaluationResult,
  MatchedProfileRule,
  ScaleBand,
} from "./types";

function isGradeScaleUsable(
  gradeScale: GradeScale | null,
): gradeScale is GradeScale {
  return !!gradeScale && Array.isArray(gradeScale.ranges) && gradeScale.ranges.length > 0;
}

function getRubricMaximumPoints(levels: MatrixLevel[]): number | null {
  const maximums = levels.flatMap((level) => {
    if (level.points?.type === "single" && level.points.value != null) {
      return [level.points.value];
    }
    if (level.points?.type === "range" && level.points.max != null) {
      return [level.points.max];
    }
    return [];
  });

  return maximums.length > 0 ? Math.max(...maximums) : null;
}

function buildPartialCriteria(
  criteria: MatrixCriterion[],
  ratings: Record<string, CriterionRating>,
  levels: MatrixLevel[],
): CriterionEvaluation[] {
  const rubricMaximumPoints = getRubricMaximumPoints(levels);

  return criteria.map((c) => {
    const rating = ratings[c.id];
    if (!rating) {
      return { criterionId: c.id, levelId: "", points: null, weight: c.weight, weightedPoints: null, weightedMax: null };
    }
    const level = levels.find((l) => l.id === rating.levelId);
    const points = level ? getEffectivePoints(level, rating.points) : null;
    const weight = c.weight ?? 0;
    return {
      criterionId: c.id,
      levelId: rating.levelId,
      points,
      weight: c.weight,
      weightedPoints: points != null ? points * weight : null,
      weightedMax: rubricMaximumPoints != null ? rubricMaximumPoints * weight : null,
    };
  });
}

export function evaluateRubric(input: EvaluateRubricInput): EvaluationResult {
  const { rubric, rubricType, ratings, gradeScale, totalMarks } = input;
  const explanation: string[] = [];

  const criteria = rubric.criteria;
  const levels = rubric.levels;

  if (criteria.length === 0) {
    return {
      status: "incomplete",
      rubricType,
      method: null,
      criteria: [],
      weightedScore: null,
      weightedMax: null,
      percentage: null,
      matchedRule: null,
      scaleBand: null,
      minPassStatus: rubric.minPassLevelId ? "incomplete" : "off",
      minPassOverride: null,
      requiresManualOverride: true,
      finalGrade: null,
      passFail: null,
      explanation: ["No criteria defined."],
    };
  }

  if (rubricType === "unscored" && rubric.gradingMethod === "weighted_average") {
    return {
      status: "incomplete",
      rubricType,
      method: null,
      criteria: [],
      weightedScore: null,
      weightedMax: null,
      percentage: null,
      matchedRule: null,
      scaleBand: null,
      minPassStatus: rubric.minPassLevelId ? "incomplete" : "off",
      minPassOverride: null,
      requiresManualOverride: true,
      finalGrade: null,
      passFail: null,
      explanation: [
        "Unscored rubric cannot use weighted_average grading method.",
      ],
    };
  }

  const allRated = criteria.every((c) => ratings[c.id]);
  if (!allRated) {
    explanation.push("Not all criteria have ratings.");
    const partialCriteria = buildPartialCriteria(criteria, ratings, levels);
    const minPassStatus = rubric.minPassLevelId ? "incomplete" : "off";
    return {
      status: "incomplete",
      rubricType,
      method: rubric.gradingMethod,
      criteria: partialCriteria,
      weightedScore: null,
      weightedMax: null,
      percentage: null,
      matchedRule: null,
      scaleBand: null,
      minPassStatus,
      minPassOverride: null,
      requiresManualOverride: false,
      finalGrade: null,
      passFail: null,
      explanation,
    };
  }

  const requestedMethod = rubric.gradingMethod;
  // Grade Profile only runs when a usable Grade Scale is selected.
  // Without a scale we ignore Grade Profile and return the normal
  // calculated result so the operator sees a real grade instead of
  // a forced manual override.
  const scaleUsable = isGradeScaleUsable(gradeScale);
  const method: typeof requestedMethod =
    requestedMethod === "grade_profile" && !scaleUsable
      ? "weighted_average"
      : requestedMethod;
  if (requestedMethod === "grade_profile" && !scaleUsable) {
    explanation.push(
      "Grade Profile requires a Grade Scale; ignoring rules and using the normal calculated result.",
    );
  }

  let criteriaEvals: CriterionEvaluation[] = [];
  let weightedScore: number | null = null;
  let weightedMax: number | null = null;
  let percentage: number | null = null;
  let matchedRule: MatchedProfileRule | null = null;
  let scaleBand: ScaleBand | null = null;

  if (method === "weighted_average") {
    const ws = computeWeightedScore(criteria, ratings, levels, explanation);
    criteriaEvals = ws.criteria;
    weightedScore = ws.weightedScore;
    weightedMax = ws.weightedMax;
    percentage = ws.percentage;
    if (percentage != null) {
      scaleBand = findScaleBand(percentage, gradeScale, explanation);
    }
  } else {
    matchedRule = matchProfileRule(rubric, levels, ratings, explanation);
    if (matchedRule && rubricType === "scored") {
      const ws = computeWeightedScore(criteria, ratings, levels, explanation);
      criteriaEvals = ws.criteria;
      weightedScore = ws.weightedScore;
      weightedMax = ws.weightedMax;
      percentage = ws.percentage;
      if (percentage != null) {
        scaleBand = findScaleBand(percentage, gradeScale, explanation);
      }
    } else if (!matchedRule) {
      if (rubric.profileFallback) {
        if (rubricType === "scored") {
          explanation.push(
            "No profile rule matched; falling back to Grade Scale mapping via the calculated score.",
          );
          const ws = computeWeightedScore(criteria, ratings, levels, explanation);
          criteriaEvals = ws.criteria;
          weightedScore = ws.weightedScore;
          weightedMax = ws.weightedMax;
          percentage = ws.percentage;
          if (percentage != null) {
            scaleBand = findScaleBand(percentage, gradeScale, explanation);
          }
        } else {
          explanation.push(
            "No profile rule matched; fallback is unavailable for unscored rubrics, so manual grading is required.",
          );
        }
      } else {
        explanation.push("No profile rule matched; manual grading required.");
      }
    }
  }

  const minPass = evaluateMinPass(rubric, levels, ratings, explanation);

  // The rubric's Minimum Pass Level only fires for letter-grading
  // scales that have pass bands configured. For other grade types
  // (Percentage, CGPA, Marks, Comp/Incomp) the per-criterion rule
  // doesn't apply — the verdict comes from the final score against
  // the scale's own threshold (passMark, completeMin, etc.).
  const isLetterGrading =
    gradeScale?.meta?.gradeType === "letter_grading";
  const hasPassBandsEnabled =
    (gradeScale?.passBands?.length ?? 0) > 0;
  const minPassApplies = isLetterGrading && hasPassBandsEnabled;

  // For Comp/Incomp the verdict is purely a function of the final
  // percentage vs. the scale's `completeMin` threshold. The per-
  // criterion min-pass override doesn't apply — a 51.5% score should
  // be "Complete" even if one criterion fell below the rubric's
  // declared min-pass level.
  const isCompIncomp =
    gradeScale?.configuration?.completeMin != null;

  let minPassOverride: EvaluationResult["minPassOverride"] = null;
  if (minPass.status === "failed" && minPassApplies) {
    const lowestFailing = findLowestFailingBand(gradeScale);
    if (lowestFailing) {
      minPassOverride = { band: lowestFailing, reason: "resubmit" };
      explanation.push(
        `Minimum-pass failed; overriding grade with lowest failing band "${lowestFailing.grade}".`,
      );
    } else {
      explanation.push(
        "Minimum-pass failed and no failing band exists in the selected scale; result is marked Fail while the calculated score is preserved.",
      );
    }
  }

  let finalGrade: string | null = null;
  let passFail: "pass" | "fail" | null = null;
  let requiresManualOverride = false;

  // For Comp/Incomp, derive the verdict from the percentage vs.
  // `completeMin`. The min-pass override is skipped above, so we
  // reach this branch with the original `finalGrade` from the
  // matched rule / scale band / raw percentage path. Re-label it
  // using the scale's complete/incomplete labels.
  if (isCompIncomp && percentage != null) {
    const completeMin = gradeScale!.configuration!.completeMin!;
    const completeLabel = gradeScale!.configuration!.completeLabel ?? "Complete";
    const incompleteLabel = gradeScale!.configuration!.incompleteLabel ?? "Incomplete";
    finalGrade = percentage >= completeMin ? completeLabel : incompleteLabel;
    passFail = percentage >= completeMin ? "pass" : "fail";
    explanation.push(
      `Result is ${finalGrade} — percentage ${percentage.toFixed(1)}% ${percentage >= completeMin ? "≥" : "<"} completeMin (${completeMin}).`,
    );
  } else if (minPassOverride) {
    finalGrade = minPassOverride.band.grade;
    passFail = "fail";
    // Reflect the fail band in the gauge: percentage, letter grade,
    // and pass/fail all come from the override band so the display
    // is consistent with the override verdict.
    percentage = minPassOverride.band.minMarks;
    scaleBand = minPassOverride.band;
  } else if (minPass.status === "failed") {
    // Min-pass failed but no failing band exists in the scale.
    // Mark as Fail while preserving the calculated score for display.
    finalGrade = "Fail";
    passFail = "fail";
  } else if (matchedRule) {
    finalGrade = matchedRule.gradeLabel;
    // Grade Profile resolution: the matched label is a band name from
    // the grade scale. Evaluate pass/fail against that band the same
    // way direct grades do — without this, profile-matched grades
    // (e.g. "B" matched via a rule on gs_letter) leave passFail null.
    const profileBand =
      gradeScale?.ranges?.find((b) => b.grade === matchedRule!.gradeLabel) ??
      null;
    if (profileBand) {
      passFail = isPassingBand(profileBand, gradeScale, totalMarks) ? "pass" : "fail";
    } else if (scaleBand) {
      passFail = isPassingBand(scaleBand, gradeScale, totalMarks) ? "pass" : "fail";
    }
  } else if (scaleBand) {
    finalGrade = scaleBand.grade;
    passFail = isPassingBand(scaleBand, gradeScale, totalMarks) ? "pass" : "fail";
  } else if (percentage != null) {
    finalGrade = `${percentage.toFixed(1)}%`;
    passFail = isPassingBand(percentage, gradeScale, totalMarks) ? "pass" : "fail";
  } else {
    requiresManualOverride = true;
  }

  return {
    status: "complete",
    rubricType,
    method,
    criteria: criteriaEvals,
    weightedScore,
    weightedMax,
    percentage,
    matchedRule,
    scaleBand,
    minPassStatus: minPass.status,
    minPassOverride,
    requiresManualOverride,
    finalGrade,
    passFail,
    explanation,
  };
}

export function computeWeightedScore(
  criteria: MatrixCriterion[],
  ratings: Record<string, CriterionRating>,
  levels: MatrixLevel[],
  explanation: string[],
): {
  criteria: CriterionEvaluation[];
  weightedScore: number;
  weightedMax: number;
  percentage: number | null;
} {
  let weightedScore = 0;
  let weightedMax = 0;
  const out: CriterionEvaluation[] = [];
  const rubricMaximumPoints = getRubricMaximumPoints(levels);

  for (const c of criteria) {
    const rating = ratings[c.id];
    const level = levels.find((l) => l.id === rating.levelId);
    if (!level) {
      out.push({
        criterionId: c.id,
        levelId: rating.levelId,
        points: null,
        weight: c.weight,
        weightedPoints: null,
        weightedMax: null,
      });
      continue;
    }
    const points = getEffectivePoints(level, rating.points);
    const weight = c.weight ?? 0;
    const wp = points != null ? points * weight : 0;
    const wmax = rubricMaximumPoints != null ? rubricMaximumPoints * weight : 0;
    if (points != null) weightedScore += wp;
    weightedMax += wmax;
    out.push({
      criterionId: c.id,
      levelId: rating.levelId,
      points,
      weight: c.weight,
      weightedPoints: wp,
      weightedMax: wmax,
    });
  }

  const percentage = weightedMax > 0 ? (weightedScore / weightedMax) * 100 : null;
  if (percentage != null && rubricMaximumPoints != null) {
    const normalizedScore = weightedScore / rubricMaximumPoints;
    const normalizedMax = weightedMax / rubricMaximumPoints;
    explanation.push(
      `Weighted score: ${normalizedScore.toFixed(2)} out of ${normalizedMax.toFixed(2)} (${percentage.toFixed(2)}%).`,
    );
  }
  return { criteria: out, weightedScore, weightedMax, percentage };
}

export function matchProfileRule(
  rubric: RubricMatrix,
  levels: MatrixLevel[],
  ratings: Record<string, CriterionRating>,
  explanation: string[],
): MatchedProfileRule | null {
  const validIds = new Set(levels.map((l) => l.id));

  for (let ruleIndex = 0; ruleIndex < rubric.profileRules.length; ruleIndex++) {
    const rule = rubric.profileRules[ruleIndex];
    if (ruleAllPathsMatch(rule, levels, ratings, validIds)) {
      explanation.push(`Matched Grade Profile rule "${rule.gradeLabel}".`);
      return { ruleId: rule.id, gradeLabel: rule.gradeLabel, pathIndex: 0 };
    }
  }
  explanation.push("No Grade Profile rule matched.");
  return null;
}

function ruleAllPathsMatch(
  rule: GradeProfileRule,
  levels: MatrixLevel[],
  ratings: Record<string, CriterionRating>,
  validIds: Set<string>,
): boolean {
  // A rule passes only when every one of its conditions (paths) passes.
  // An empty path list is treated as a non-match — every rule must carry
  // at least one condition for it to be meaningful.
  if (rule.paths.length === 0) return false;
  return rule.paths.every((path) => pathMatches(path, levels, ratings, validIds));
}

function pathMatches(
  path: ProfilePath,
  levels: MatrixLevel[],
  ratings: Record<string, CriterionRating>,
  validIds: Set<string>,
): boolean {
  for (const tier of path.tiers) {
    if (!validIds.has(tier.levelId)) return false;
    const tierIdx = levelIndexInOrder(levels, tier.levelId);
    let count = 0;
    for (const rating of Object.values(ratings)) {
      const ratedIdx = levelIndexInOrder(levels, rating.levelId);
      if (ratedIdx >= 0 && ratedIdx <= tierIdx) count++;
    }
    if (count < tier.count) return false;
  }

  if (path.floorLevelId) {
    if (!validIds.has(path.floorLevelId)) return false;
    const floorIdx = levelIndexInOrder(levels, path.floorLevelId);
    for (const rating of Object.values(ratings)) {
      const ratedIdx = levelIndexInOrder(levels, rating.levelId);
      if (ratedIdx < 0 || ratedIdx > floorIdx) return false;
    }
  }

  return true;
}

export function evaluateMinPass(
  rubric: RubricMatrix,
  levels: MatrixLevel[],
  ratings: Record<string, CriterionRating>,
  explanation: string[],
): { status: "off" | "incomplete" | "passed" | "failed"; failedCriteriaIds: string[] } {
  if (!rubric.minPassLevelId) {
    return { status: "off", failedCriteriaIds: [] };
  }
  const validIds = new Set(levels.map((l) => l.id));
  if (!validIds.has(rubric.minPassLevelId)) {
    explanation.push("Minimum-pass level reference is invalid.");
    return { status: "off", failedCriteriaIds: [] };
  }
  const minIdx = levelIndexInOrder(levels, rubric.minPassLevelId);
  const failed: string[] = [];
  let allRated = true;
  for (const criterion of rubric.criteria) {
    const rating = ratings[criterion.id];
    if (!rating) {
      allRated = false;
      continue;
    }
    const ratedIdx = levelIndexInOrder(levels, rating.levelId);
    if (ratedIdx < 0 || ratedIdx > minIdx) {
      failed.push(criterion.id);
    }
  }
  if (!allRated) {
    explanation.push("Minimum-pass incomplete: not all criteria rated.");
    return { status: "incomplete", failedCriteriaIds: failed };
  }
  if (failed.length > 0) {
    explanation.push(`Minimum-pass failed for ${failed.length} criterion/criteria.`);
    return { status: "failed", failedCriteriaIds: failed };
  }
  explanation.push("Minimum-pass passed.");
  return { status: "passed", failedCriteriaIds: [] };
}

export function findScaleBand(
  percentage: number,
  scale: GradeScale | null,
  explanation: string[],
): ScaleBand | null {
  if (!scale || !scale.ranges || scale.ranges.length === 0) {
    explanation.push("No grade scale ranges available for mapping.");
    return null;
  }
  const sorted = [...scale.ranges].sort((a, b) => b.minMarks - a.minMarks);
  for (const band of sorted) {
    if (percentage >= band.minMarks && percentage <= band.maxMarks) {
      explanation.push(`Mapped ${percentage.toFixed(2)}% to band "${band.grade}" (${band.minMarks}-${band.maxMarks}).`);
      return band;
    }
  }
  if (percentage > sorted[0].maxMarks) {
    return sorted[0];
  }
  return sorted[sorted.length - 1];
}

export function findLowestFailingBand(scale: GradeScale | null): ScaleBand | null {
  if (!scale || !scale.ranges || scale.ranges.length === 0) return null;
  const failing = scale.ranges.filter((b) => !isPassingBand(b, scale));
  if (failing.length === 0) return null;
  // "Lowest" Fail Band = lowest-scoring band (smallest minMarks).
  // Tiebreak by smaller maxMarks first so a band occupying [0, 0] ranks
  // below a band occupying [0, 49] when both share minMarks.
  failing.sort((a, b) => {
    if (a.minMarks !== b.minMarks) return a.minMarks - b.minMarks;
    return a.maxMarks - b.maxMarks;
  });
  return failing[0];
}