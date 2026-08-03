import type { MatrixCriterion, MatrixLevel, RubricMatrix } from "@/types/rubric";
import type { GradeScale, GradeScaleBand } from "@/features/rubrics/constants";

export function levelIndexInOrder(levels: MatrixLevel[], levelId: string): number {
  return levels.findIndex((l) => l.id === levelId);
}

export function getEffectivePoints(
  level: MatrixLevel,
  points?: number | null,
): number | null {
  if (!level.points) return null;
  if (level.points.type === "single") {
    return level.points.value;
  }
  const { min, max } = level.points;
  if (min == null || max == null) return null;
  const requested = points ?? max;
  return Math.min(max, Math.max(min, requested));
}

export function criterionLookup(
  rubric: RubricMatrix,
): Map<string, MatrixCriterion> {
  return new Map(rubric.criteria.map((c) => [c.id, c]));
}

export function validateLevelReferences(rubric: RubricMatrix): string[] {
  const validIds = new Set(rubric.levels.map((l) => l.id));
  const issues: string[] = [];
  for (const rule of rubric.profileRules) {
    for (const path of rule.paths) {
      for (const tier of path.tiers) {
        if (!validIds.has(tier.levelId)) {
          issues.push(
            `Profile rule "${rule.gradeLabel}" references unknown level "${tier.levelId}"`,
          );
        }
      }
      if (path.floorLevelId && !validIds.has(path.floorLevelId)) {
        issues.push(
          `Profile rule "${rule.gradeLabel}" floor references unknown level "${path.floorLevelId}"`,
        );
      }
    }
  }
  return issues;
}

export function isPassingBand(
  bandOrValue: GradeScaleBand | { minMarks: number; grade?: string } | number,
  scale?: GradeScale | null,
  totalMarks?: number | null,
): boolean {
  // Letter-grading scales declare pass membership explicitly via `passBands`.
  // Use that as the source of truth when:
  //   (a) the caller passed a band object with a grade label, or
  //   (b) the raw value falls inside a band whose grade is in `passBands`.
  // Both let admins mark non-contiguous bands pass (e.g. A, C, D only).
  if (scale && scale.passBands && scale.passBands.length > 0) {
    if (typeof bandOrValue === "object" && "grade" in bandOrValue && typeof bandOrValue.grade === "string") {
      return scale.passBands.includes(bandOrValue.grade);
    }
    const value = numericValue(bandOrValue);
    if (value != null) {
      const matchingBand = scale.ranges?.find(
        (b) => value >= b.minMarks && value <= b.maxMarks,
      );
      if (matchingBand) return scale.passBands.includes(matchingBand.grade);
    }
  }

  // Numeric formats express pass via `configuration.passMark` (absolute
  // threshold) or `configuration.passMarkRatio` (multiplied by totalMarks).
  // Comp/Incomp expresses pass via `configuration.completeMin`. Honor
  // every configured value; fall back to the legacy 50% rule only when
  // the scale doesn't declare anything.
  const cfg = scale?.configuration;
  if (cfg) {
    if (cfg.completeMin != null) {
      const value = numericValue(bandOrValue);
      if (value != null) return value >= cfg.completeMin;
    }
    if (cfg.passMark != null) {
      const value = numericValue(bandOrValue);
      if (value != null) return value >= cfg.passMark;
    }
    if (cfg.passMarkRatio != null && totalMarks != null && totalMarks > 0) {
      const value = numericValue(bandOrValue);
      if (value != null) return value >= cfg.passMarkRatio * totalMarks;
    }
  }

  const minMarks =
    typeof bandOrValue === "number" ? bandOrValue : bandOrValue.minMarks;
  return minMarks >= 50;
}

function numericValue(
  bandOrValue: GradeScaleBand | { minMarks: number; grade?: string } | number,
): number | null {
  return typeof bandOrValue === "number" ? bandOrValue : bandOrValue.minMarks;
}