import type { GradeBandDraft, GradeScaleDraft } from "@/features/rubrics/grade-scale-default";
import type { GradeScaleStatus } from "@/features/rubrics/constants";

/**
 * Per-field validation result. The editor renders these inline.
 */
export interface ValidationIssue {
  /** Field key — `name`, `bands.row.<index>`, `bands.range.<index>`,
   *  `pf.allPass`, `pf.allFail`. */
  field: string;
  message: string;
}

/**
 * Non-blocking editor warning. Surfaced alongside the form but never
 * gates Save/Publish.
 */
export interface ValidationWarning {
  field: string;
  message: string;
}

/**
 * A grade value is "whole" when its raw text contains no decimal point.
 * The numeric value is allowed to be a float (we just reject the
 * textual representation per EDUBEX §5).
 */
function isWholeNumeric(raw: string | undefined): boolean {
  if (raw === undefined) return true;
  return !raw.includes(".");
}

/**
 * Validate an editor draft. Returns an empty list when valid.
 * Each issue is meant to surface under the relevant input.
 *
 * Implements EDUBEX §5 blockers:
 *   - name blank / > 80 chars
 *   - at least one band
 *   - duplicate grade labels
 *   - per-band: label blank, min blank, max blank, decimal value
 *   - per-band: min > max
 *   - range overlap (inclusive at the boundary)
 *   - range gap > 1
 *   - row-order: a band listed above another with a lower range floor
 *   - pfMode on: per-band pass/fail value missing
 *   - pfMode on: every band marked Pass
 *   - pfMode on: every band marked Fail
 */
export function validateGradeScaleDraft(
  draft: Pick<GradeScaleDraft, "name" | "pfMode" | "bands">,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!draft.name.trim()) {
    issues.push({ field: "name", message: "Name is required." });
  } else if (draft.name.trim().length > 80) {
    issues.push({
      field: "name",
      message: "Name must be 80 characters or fewer.",
    });
  }

  const filled = draft.bands
    .map((b, idx) => ({ ...b, idx }))
    .filter((b) => b.grade.trim().length > 0);

  if (filled.length === 0) {
    issues.push({
      field: "bands",
      message: "Add at least one band.",
    });
    return issues;
  }

  // Duplicate grade labels.
  const seen = new Set<string>();
  for (const b of filled) {
    const key = b.grade.trim().toLowerCase();
    if (seen.has(key)) {
      issues.push({
        field: `bands.row.${b.idx}`,
        message: `Duplicate band label "${b.grade.trim()}".`,
      });
    }
    seen.add(key);
  }

  // Per-band checks: blank label (only fired when other rows have content),
  // blank/non-numeric min/max, decimals, min > max.
  for (const b of filled) {
    // Decimals on min/max.
    if (!isWholeNumeric(b.minRaw)) {
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Decimal values are not allowed for "${b.grade.trim()}".`,
      });
    } else if (!isWholeNumeric(b.maxRaw)) {
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Decimal values are not allowed for "${b.grade.trim()}".`,
      });
    }

    // Blank min/max — only fires when the raw string is empty (not when
    // it parses to 0, which is a valid value).
    if (b.minRaw !== undefined && b.minRaw.trim() === "") {
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Score From is missing for "${b.grade.trim()}".`,
      });
    }
    if (b.maxRaw !== undefined && b.maxRaw.trim() === "") {
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Score To is missing for "${b.grade.trim()}".`,
      });
    }

    // Min > max.
    if (b.minMarks > b.maxMarks) {
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Min (${b.minMarks}) cannot exceed Max (${b.maxMarks}).`,
      });
    }
  }

  // Detect overlap and gaps among filled bands (sorted by minMarks).
  // Adjacent sorted bands are checked pairwise.
  const sorted = [...filled].sort((a, b) => a.minMarks - b.minMarks);
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    // Inclusive on both ends — touching at the boundary (e.g. 50–100
    // and 100–100) counts as overlap per EDUBEX §5.
    if (a.maxMarks >= b.minMarks) {
      issues.push({
        field: `bands.range.${a.idx}`,
        message: `Score ranges overlap between "${a.grade.trim()}" and "${b.grade.trim()}".`,
      });
    } else if (b.minMarks - a.maxMarks > 1) {
      // Gap > 1 (e.g. 0–49 then 55–100). A gap of exactly 1 is fine.
      issues.push({
        field: `bands.range.${b.idx}`,
        message: `Score range has a gap between "${a.grade.trim()}" and "${b.grade.trim()}".`,
      });
    }
  }

  // Row-order check: walking top-to-bottom, each band's floor should be
  // less than or equal to the previous row's floor. If a later row has a
  // *higher* floor than an earlier row, the row order is out of sequence
  // (caught here because the overlap/gap checks sort by min and would
  // miss a non-overlapping but re-ordered layout).
  for (let i = 1; i < filled.length; i++) {
    const prev = filled[i - 1];
    const curr = filled[i];
    if (curr.minMarks > prev.minMarks) {
      issues.push({
        field: `bands.range.${curr.idx}`,
        message: `"${curr.grade.trim()}" is out of order — its range starts at ${curr.minMarks} but is listed below "${prev.grade.trim()}" (min ${prev.minMarks}).`,
      });
    }
  }

  // pfMode structural checks.
  if (draft.pfMode) {
    // Per-band pass/fail must be explicit.
    for (const b of filled) {
      if (b.isPass === null) {
        issues.push({
          field: `bands.row.${b.idx}`,
          message: `Pass/Fail value is missing for "${b.grade.trim()}".`,
        });
      }
    }
    // All Pass / all Fail (only when every band has a flag set).
    const allHaveFlag = filled.every((b) => b.isPass !== null);
    if (allHaveFlag && filled.length > 0) {
      const allPass = filled.every((b) => b.isPass === true);
      const allFail = filled.every((b) => b.isPass === false);
      if (allPass) {
        issues.push({
          field: "pf.allPass",
          message: "Pass/Fail mode is ON and all grades are marked Pass.",
        });
      } else if (allFail) {
        issues.push({
          field: "pf.allFail",
          message: "Pass/Fail mode is ON and all grades are marked Fail.",
        });
      }
    }
  }

  return issues;
}

/**
 * Non-blocking warnings surfaced alongside the editor.
 *
 * Per EDUBEX §6: when a scale is already in use (`published` and has
 * `used > 0`), edits only apply to new assignments — existing
 * assignments keep their original bands.
 */
export function getGradeScaleWarnings(input: {
  status: GradeScaleStatus;
  used?: number;
}): ValidationWarning[] {
  if (input.used === undefined || input.used <= 0) return [];
  if (input.status !== "published") return [];
  return [
    {
      field: "used",
      message: `This grade scale is already used in ${input.used} assignment(s). Existing assignments will not change — edits apply only to new assignments.`,
    },
  ];
}

export function hasBlockingIssues(issues: ValidationIssue[]): boolean {
  return issues.length > 0;
}

/**
 * Re-export the band-draft type so consumers don't need to import from
 * `grade-scale-default` separately when they only need the band shape.
 */
export type { GradeBandDraft };
