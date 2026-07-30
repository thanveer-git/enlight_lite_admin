/**
 * Helpers for assignments graded directly (no rubric).
 *
 * Mirrors the document Section 4.10 ranges:
 *   CGPA        0–10
 *   Percentage  0–100
 *   Marks       0–totalMarks
 *   Comp/Incomp "Complete" | "Incomplete"
 *   NamedBand   derived from `GradeScale.bands`
 */
import type { GradeScale } from "@/features/rubrics/constants";
import type { DirectGradeFormat } from "./types";

export interface DirectGradeRange {
  min: number;
  max: number;
}

export function rangeFor(
  format: DirectGradeFormat,
  totalMarks: number | null,
): DirectGradeRange | null {
  switch (format) {
    case "CGPA":
      return { min: 0, max: 10 };
    case "Percentage":
      return { min: 0, max: 100 };
    case "Marks":
      if (totalMarks == null || totalMarks <= 0) return null;
      return { min: 0, max: totalMarks };
    default:
      return null;
  }
}

export function clampDirectGrade(
  value: number,
  format: DirectGradeFormat,
  totalMarks: number | null,
): number {
  const range = rangeFor(format, totalMarks);
  if (!range) return value;
  if (!Number.isFinite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

export function isCompIncomp(value: string): boolean {
  return value === "Complete" || value === "Incomplete";
}

export function parseNumericDirectGrade(
  raw: string,
  format: DirectGradeFormat,
  totalMarks: number | null,
): { ok: true; value: number } | { ok: false } {
  if (format === "Comp/Incomp") return { ok: false };
  if (format === "NamedBand") return { ok: false };
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: false };
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return { ok: false };
  return { ok: true, value: clampDirectGrade(n, format, totalMarks) };
}

export function bandsForNamedScale(scale: GradeScale | null): string[] {
  if (!scale) return [];
  return scale.bands;
}
