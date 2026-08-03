import type { RubricStatus, RubricType } from "@/types/rubric";

export const STATUS_OPTIONS: { value: RubricStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "in_use", label: "In Use" },
  { value: "archived", label: "Archived" },
];

export const TYPE_OPTIONS: { value: RubricType; label: string }[] = [
  { value: "scored", label: "Scored" },
  { value: "unscored", label: "Unscored" },
];

export type GradeScaleStatus = "draft" | "published" | "in_use" | "archived";

export interface GradeScaleBand {
  grade: string;
  minMarks: number;
  maxMarks: number;
}

/**
 * Format-aware configuration carried by every grade scale.
 *
 * For the four fixed formats, only the relevant subset of fields
 * applies. For example, a `CGPA` scale uses `max`, `passMark`, and
 * `step`; a `Comp/Incomp` scale uses `incompleteMax`, `completeMin`,
 * `completeLabel`, and `incompleteLabel`. The fields kept here cover
 * every conversion path and stay human-readable so admin UIs can
 * surface them in edit forms later.
 */
export interface GradeScaleConfiguration {
  // Common across all formats.
  /** Inclusive lower bound of valid input values. */
  min?: number;
  /** Inclusive upper bound. `null` for Marks (per-assignment). */
  max?: number | null;
  /** Numeric threshold at or above which the result counts as passing. */
  passMark?: number;
  /** Marks-only: ratio of `totalMarks` that counts as passing (default 0.5). */
  passMarkRatio?: number;
  /** Granularity of the input (e.g. 0.01 for percentage/CGPA). */
  step?: number;

  // Comp/Incomp only.
  /** Highest percentage still considered incomplete (e.g. 50). */
  incompleteMax?: number;
  /** Lowest percentage that counts as complete (e.g. 51). */
  completeMin?: number;
  /** Upper bound for completeness; usually 100. */
  completeMax?: number;
  /** Display label for the pass state. */
  completeLabel?: string;
  /** Display label for the fail state. */
  incompleteLabel?: string;
}

/** Grading category this scale belongs to. */
export type GradeScaleType =
  | "percentage"
  | "cgpa"
  | "marks"
  | "comp_incomp"
  | "letter_grading";

/** Per-scale runtime hints that don't fit the format-agnostic config. */
export interface GradeScaleMeta {
  /** Whether admins are allowed to create/edit/delete this entry. */
  isEditable: boolean;
  /** Lifecycle status. Fixed formats are always `published`. */
  status: GradeScaleStatus;
  /** Grading category. Built-in types cannot be edited/created;
   *  `letter_grading` scales are admin-managed and extensible. */
  gradeType: GradeScaleType;
  /** Free-form description for the picker UI. */
  description?: string;
}

export interface GradeScale {
  id: string;
  name: string;
  /** Display labels in order. For fixed formats this stays `[]`. */
  bands: string[];
  /** Optional numeric ranges used by band lookup. */
  ranges?: GradeScaleBand[];
  /**
   * Letter-grading only: the subset of band names that count as pass.
   * Undefined for fixed formats — pass/fail there comes from
   * `configuration.passMark` (Percentage/CGPA/Marks) or the
   * Comp/Incomp thresholds. Letter scales set this so admins can mark
   * non-contiguous bands pass if they need to (e.g. A, B, C only).
   */
  passBands?: string[];
  /** Format-aware configuration (thresholds, ceilings, labels). */
  configuration?: GradeScaleConfiguration;
  /** Runtime hints (editability, lifecycle). */
  meta?: GradeScaleMeta;
}

/**
 * Catalog of every grade-scale choice the system offers an assignment.
 *
 * Combines two sources:
 *   1. The four built-in defaults — admins cannot create, edit, or
 *      delete these (edubex §3.8, §4.10). Their `configuration` values
 *      are the single source of truth for thresholds and ceilings.
 *   2. The two admin-managed (named) scales. These have full bands
 *      and lifecycle status; admins can add new entries in
 *      `seeds/grade-scales.json` once CRUD UIs exist.
 */
export const GRADE_SCALES: GradeScale[] = [
  // ── 1. Built-in defaults (fixed, always published, not editable) ─────
  {
    id: "Percentage",
    name: "Percentage",
    bands: [],
    configuration: {
      min: 0,
      max: 100,
      passMark: 14,
      step: 0.01,
    },
    meta: {
      isEditable: false,
      status: "published",
      gradeType: "percentage",
      description: "Default percentage grading. Output is a 0–100 number.",
    },
  },
  {
    id: "CGPA",
    name: "CGPA",
    bands: [],
    configuration: {
      min: 0,
      max: 10,
      passMark: 4,
      step: 0.01,
    },
    meta: {
      isEditable: false,
      status: "published",
      gradeType: "cgpa",
      description:
        "Default cumulative grade-point-average grading. Always on a 0–10 scale.",
    },
  },
  {
    id: "Marks",
    name: "Marks",
    bands: [],
    configuration: {
      min: 0,
      max: null,
      passMarkRatio: 0.5,
      step: 0.01,
    },
    meta: {
      isEditable: false,
      status: "published",
      gradeType: "marks",
      description:
        "Default marks grading. Range is determined per-assignment via totalMarks.",
    },
  },
  {
    id: "Comp/Incomp",
    name: "Complete / Incomplete",
    bands: [],
    configuration: {
      incompleteMax: 50,
      completeMin: 51,
      completeMax: 100,
      completeLabel: "Complete",
      incompleteLabel: "Incomplete",
    },
    meta: {
      isEditable: false,
      status: "published",
      gradeType: "comp_incomp",
      description:
        "Default binary completion grading. Percentages 0–50 are Incomplete, 51–100 are Complete.",
    },
  },

  // ── 2. Admin-managed (named) scales ─────────────────────────────────
  {
    id: "gs_letter",
    name: "Letter Grade Scale",
    bands: ["A", "B", "C", "D", "E", "F"],
    ranges: [
      { grade: "A", minMarks: 91, maxMarks: 100 },
      { grade: "B", minMarks: 81, maxMarks: 90 },
      { grade: "C", minMarks: 71, maxMarks: 80 },
      { grade: "D", minMarks: 61, maxMarks: 70 },
      { grade: "E", minMarks: 50, maxMarks: 60 },
      { grade: "F", minMarks: 0, maxMarks: 49 },
    ],
    passBands: ["A", "C", "D"],
    meta: {
      isEditable: true,
      status: "in_use",
      gradeType: "letter_grading",
      description:
        "Six-band A–F scale, the most common academic letter grading system.",
    },
  },
  {
    id: "gs_performance",
    name: "Performance Grade Scale",
    bands: ["Excellent", "Very Good", "Good", "Average", "Needs Improvement", "Poor"],
    ranges: [
      { grade: "Excellent", minMarks: 91, maxMarks: 100 },
      { grade: "Very Good", minMarks: 81, maxMarks: 90 },
      { grade: "Good", minMarks: 71, maxMarks: 80 },
      { grade: "Average", minMarks: 61, maxMarks: 70 },
      { grade: "Needs Improvement", minMarks: 50, maxMarks: 60 },
      { grade: "Poor", minMarks: 0, maxMarks: 49 },
    ],
    passBands: ["Excellent", "Very Good", "Good"],
    meta: {
      isEditable: true,
      status: "in_use",
      gradeType: "letter_grading",
      description:
        "Six-band descriptive performance scale commonly used for oral / presentation rubrics.",
    },
  },
];

/** All known grade-scale ids — derived from `GRADE_SCALES`. */
export type GradeFormat = (typeof GRADE_SCALES)[number]["id"];

export function findGradeScale(id: string | null): GradeScale | null {
  if (!id) return null;
  return GRADE_SCALES.find((scale) => scale.id === id) ?? null;
}

/** Built-in scales: percentage, cgpa, marks, comp_incomp. Not editable. */
export function builtInGradeScales(): GradeScale[] {
  return GRADE_SCALES.filter(
    (s) => s.meta?.gradeType !== "letter_grading",
  );
}

/** Letter grading scales: admin-managed and extensible. */
export function letterGradeScales(): GradeScale[] {
  return GRADE_SCALES.filter((s) => s.meta?.gradeType === "letter_grading");
}

/** Filter scales by grading category. */
export function gradeScalesOfType(type: GradeScaleType): GradeScale[] {
  return GRADE_SCALES.filter((s) => s.meta?.gradeType === type);
}

/**
 * Resolve any `GradeFormat` to its concrete scale spec.
 * Returns `null` when the id does not match any known entry.
 */
export function resolveGradeFormat(
  id: string | null,
): GradeScale | null {
  return findGradeScale(id);
}
