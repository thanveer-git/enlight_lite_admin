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

export type GradeScaleStatus = "draft" | "published" | "archived";

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
  /** Built-in system scale (`gg_is_default`) — surfaced as a "Default" chip. */
  isDefault: boolean;
  /** Whether pass/fail evaluation is enabled for this scale (`gg_is_passed`). */
  isPassed: boolean;
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
  apiId: number;
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
   * Bands not listed in `passBands` are implicitly Fail.
   */
  passBands?: string[];
  /** Format-aware configuration (thresholds, ceilings, labels). */
  configuration?: GradeScaleConfiguration;
  /** Number of assignments currently using this scale. Surfaced as
   *  a non-blocking warning in the editor (EDUBEX §6). */
  used?: number;
  /** Runtime hints (editability, lifecycle). */
  meta?: GradeScaleMeta;
}

export { getGradeScale, getAllCachedScales } from "@/features/rubrics/grade-scales";
import { getGradeScale, getAllCachedScales } from "@/features/rubrics/grade-scales";

export type GradeFormat = string;

export function findGradeScale(id: string | null): GradeScale | null {
  return getGradeScale(id);
}

export function builtInGradeScales(): GradeScale[] {
  return getAllCachedScales().filter(
    (s) => s.meta?.gradeType !== "letter_grading",
  );
}

export function letterGradeScales(): GradeScale[] {
  return getAllCachedScales().filter((s) => s.meta?.gradeType === "letter_grading");
}

export function gradeScalesOfType(type: GradeScaleType): GradeScale[] {
  return getAllCachedScales().filter((s) => s.meta?.gradeType === type);
}

export function resolveGradeFormat(
  id: string | null,
): GradeScale | null {
  return findGradeScale(id);
}
