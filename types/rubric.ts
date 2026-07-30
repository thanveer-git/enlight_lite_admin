export type RubricStatus = "draft" | "published" | "in_use" | "archived";
export type RubricType = "scored" | "unscored";
export type PointType = "single" | "range";
export type GradingMethod = "weighted_average" | "grade_profile";

export interface LevelPoints {
  type: PointType;
  value: number | null;
  min: number | null;
  max: number | null;
}

export interface MatrixLevel {
  id: string;
  name: string;
  points: LevelPoints | null;
}

export interface MatrixCriterion {
  id: string;
  name: string;
  weight: number | null;
}

export type MatrixDescriptions = Record<string, Record<string, string>>;

export interface ProfileTier {
  count: number;
  levelId: string;
}

export interface ProfilePath {
  tiers: ProfileTier[];
  floorLevelId: string | null;
}

export interface GradeProfileRule {
  id: string;
  gradeLabel: string;
  paths: ProfilePath[];
}

export interface RubricMatrix {
  criteria: MatrixCriterion[];
  levels: MatrixLevel[];
  descriptions: MatrixDescriptions;
  gradingMethod: GradingMethod;
  profileRules: GradeProfileRule[];
  profileFallback: boolean;
  minPassLevelId: string | null;
  suggestedScaleId: string | null;
}

export interface Rubric {
  id: string;
  name: string;
  description: string;
  outcome: string;
  status: RubricStatus;
  type: RubricType;
  criteriaCount: number;
  levelsCount: number;
  usedBy: number;
  updatedAt: string;
  createdBy: string;
}

export interface RubricDetail extends Rubric {
  matrix: RubricMatrix;
}

export const GRADE_TYPE_OPTIONS = [
  { value: "letter", label: "Letter Grade (A–F)" },
  { value: "performance", label: "Performance (Excellent–Poor)" },
  { value: "percentage", label: "Percentage (0–100)" },
  { value: "cgpa", label: "CGPA (0–10)" },
  { value: "complete_incomplete", label: "Complete / Incomplete" },
] as const;

export type GradeTypeValue = (typeof GRADE_TYPE_OPTIONS)[number]["value"];
