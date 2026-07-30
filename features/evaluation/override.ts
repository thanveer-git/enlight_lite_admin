/**
 * Manual-override logic for the evaluation console.
 *
 * Document §4.11 + §5.8: a valid override replaces the calculated
 * result, requires a reason, and locks the rubric controls. The
 * reason is shown to the learner when the result is released.
 */
import type { GradeScale } from "@/features/rubrics/constants";
import { isPassingBand } from "@/features/rubrics/evaluation/helpers";
import type {
  EvaluationResult,
  PassFail,
  ScaleBand,
} from "@/features/rubrics/evaluation/types";

import {
  bandsForNamedScale,
  clampDirectGrade,
  parseNumericDirectGrade,
} from "./direct-grade";
import type { DirectGradeFormat, ManualOverride } from "./types";

export interface OverrideSource {
  engine: EvaluationResult;
  override: ManualOverride;
  directGrade: string;
  gradeFormat: DirectGradeFormat | null;
  gradeScale: GradeScale | null;
  totalMarks: number | null;
}

export interface ResolvedOverride {
  /** True only when the override is on AND a reason is provided. */
  applied: boolean;
  /** True when override is on (rubric controls should lock). */
  lockedRubric: boolean;
  reason: string | null;
  effectiveGrade: string;
  passFail: PassFail | "unknown";
  /**
   * When `applied` is false but the override is on with a missing
   * reason, the page should surface this as the save-blocker copy.
   */
  blocker: "no_reason" | null;
}

function passForBand(band: ScaleBand, scale: GradeScale | null): PassFail {
  return isPassingBand(band, scale) ? "pass" : "fail";
}

function passForPercent(value: number): PassFail {
  return isPassingBand(value) ? "pass" : "fail";
}

function resolveOverrideValue(input: OverrideSource): string {
  const { gradeFormat, gradeScale, totalMarks, directGrade, override } = input;
  if (!gradeFormat) {
    // Rubric path: override value is a free-form string, validated later
    // against the active grade scale in the page.
    return override.value.trim();
  }
  if (gradeFormat === "Comp/Incomp") {
    return override.value === "Complete" ? "Complete" : "Incomplete";
  }
  if (gradeFormat === "NamedBand") {
    const bands = bandsForNamedScale(gradeScale);
    return bands.includes(override.value) ? override.value : "";
  }
  const parsed = parseNumericDirectGrade(override.value, gradeFormat, totalMarks);
  if (parsed.ok) {
    return String(clampDirectGrade(parsed.value, gradeFormat, totalMarks));
  }
  return directGrade;
}

export function resolveOverride(input: OverrideSource): ResolvedOverride {
  const lockedRubric = input.override.on;
  if (!input.override.on) {
    return {
      applied: false,
      lockedRubric,
      reason: null,
      effectiveGrade: "",
      passFail: "unknown",
      blocker: null,
    };
  }

  const reason = input.override.reason.trim();
  if (!reason) {
    return {
      applied: false,
      lockedRubric,
      reason: null,
      effectiveGrade: "",
      passFail: "unknown",
      blocker: "no_reason",
    };
  }

  const effectiveGrade = resolveOverrideValue(input);
  let passFail: PassFail | "unknown" = "unknown";

  if (!input.gradeFormat) {
    // Rubric path: try to match the override value to a band in the active scale.
    const scale = input.gradeScale;
    if (scale?.ranges) {
      const match = scale.ranges.find((b) => b.grade === effectiveGrade);
      if (match) passFail = passForBand(match, scale);
    }
  } else if (input.gradeFormat === "Comp/Incomp") {
    passFail = effectiveGrade === "Complete" ? "pass" : "fail";
  } else if (input.gradeFormat === "NamedBand") {
    const scale = input.gradeScale;
    const match = scale?.ranges?.find((b) => b.grade === effectiveGrade);
    passFail = match ? passForBand(match, scale) : "unknown";
  } else {
    const parsed = parseNumericDirectGrade(
      effectiveGrade,
      input.gradeFormat,
      input.totalMarks,
    );
    if (parsed.ok) passFail = passForPercent(parsed.value);
  }

  return {
    applied: true,
    lockedRubric,
    reason,
    effectiveGrade: effectiveGrade || "",
    passFail,
    blocker: null,
  };
}
