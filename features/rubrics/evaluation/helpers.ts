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
): boolean {
  // Letter-grading scales declare pass membership explicitly via `passBands`.
  // Use that as the source of truth when available so admins can mark
  // non-contiguous bands pass (e.g. A, B, C only).
  if (
    scale &&
    scale.passBands &&
    scale.passBands.length > 0 &&
    typeof bandOrValue === "object" &&
    "grade" in bandOrValue &&
    typeof bandOrValue.grade === "string"
  ) {
    return scale.passBands.includes(bandOrValue.grade);
  }
  const minMarks =
    typeof bandOrValue === "number" ? bandOrValue : bandOrValue.minMarks;
  return minMarks >= 50;
}