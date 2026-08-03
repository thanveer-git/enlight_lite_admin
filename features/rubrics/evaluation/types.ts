import type { RubricMatrix, RubricType } from "@/types/rubric";
import type { GradeScale } from "@/features/rubrics/constants";

export interface CriterionRating {
  levelId: string;
  points?: number | null;
}

export interface EvaluateRubricInput {
  rubric: RubricMatrix;
  rubricType: RubricType;
  ratings: Record<string, CriterionRating>;
  gradeScale: GradeScale | null;
  /**
   * Per-assignment mark ceiling, used by `Marks` scales whose pass
   * threshold is `passMarkRatio * totalMarks`. Optional — when absent,
   * the engine falls back to the legacy 50% rule.
   */
  totalMarks?: number | null;
}

export interface CriterionEvaluation {
  criterionId: string;
  levelId: string;
  points: number | null;
  weight: number | null;
  weightedPoints: number | null;
  weightedMax: number | null;
}

export type MinPassStatus = "off" | "incomplete" | "passed" | "failed";
export type PassFail = "pass" | "fail";
export type EvaluationMethod = "weighted_average" | "grade_profile";
export type EvaluationStatus = "complete" | "incomplete";

export interface MatchedProfileRule {
  ruleId: string;
  gradeLabel: string;
  pathIndex: number;
}

export interface ScaleBand {
  grade: string;
  minMarks: number;
  maxMarks: number;
}

export interface MinPassOverride {
  band: ScaleBand;
  reason: "resubmit";
}

export interface EvaluationResult {
  status: EvaluationStatus;
  rubricType: RubricType;
  method: EvaluationMethod | null;
  criteria: CriterionEvaluation[];
  weightedScore: number | null;
  weightedMax: number | null;
  percentage: number | null;
  matchedRule: MatchedProfileRule | null;
  scaleBand: ScaleBand | null;
  minPassStatus: MinPassStatus;
  minPassOverride: MinPassOverride | null;
  requiresManualOverride: boolean;
  finalGrade: string | null;
  passFail: PassFail | null;
  explanation: string[];
}