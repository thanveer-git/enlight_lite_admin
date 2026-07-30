import { findGradeScale } from "@/features/rubrics/constants";
import type { RubricDraft } from "@/features/rubrics/wizard/types";
import type { LevelPoints, RubricMatrix, RubricType } from "@/types/rubric";

export type ValidationStep = "info" | "criteria" | "rules";

export interface ValidationIssue {
  id: string;
  step: ValidationStep;
  message: string;
}

export interface RubricValidation {
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

function getPointBounds(points: LevelPoints | null): [number, number] | null {
  if (!points) return null;
  if (points.type === "single") {
    return points.value === null ? null : [points.value, points.value];
  }
  if (points.min === null || points.max === null) return null;
  return [points.min, points.max];
}

function checkInfo(draft: RubricDraft, out: ValidationIssue[]): void {
  if (!draft.name.trim()) {
    out.push({ id: "info-name", step: "info", message: "Rubric name is required" });
  }
  if (!stripHtml(draft.outcome).length) {
    out.push({ id: "info-outcome", step: "info", message: "Learning outcome is required" });
  }
  if (draft.type === null) {
    out.push({ id: "info-type", step: "info", message: "Rubric type is required" });
  }
}

export function getCriteriaValidation(
  matrix: RubricMatrix,
  type: RubricType | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkCriteria(matrix, type, issues);
  return issues;
}

export function getRulesValidation(
  matrix: RubricMatrix,
  type: RubricType | null,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  checkRules(matrix, type, issues);
  return issues;
}

function checkCriteria(
  matrix: RubricMatrix,
  type: RubricType | null,
  out: ValidationIssue[],
): void {
  const scored = type === "scored";

  if (matrix.criteria.length === 0) {
    out.push({
      id: "criteria-empty",
      step: "criteria",
      message: "At least one criterion is required",
    });
  }
  if (matrix.levels.length < 2) {
    out.push({
      id: "criteria-levels-min",
      step: "criteria",
      message: "At least two performance levels are required",
    });
  }

  matrix.criteria.forEach((criterion) => {
    const name = criterion.name.trim() || "(unnamed)";
    const criterionLabel = `Criterion "${name}"`;
    if (!criterion.name.trim()) {
      out.push({
        id: `criterion-name-${criterion.id}`,
        step: "criteria",
        message: `${criterionLabel} → Name is required`,
      });
    }
    if (
      scored &&
      (criterion.weight === null || !Number.isFinite(criterion.weight) || criterion.weight <= 0)
    ) {
      out.push({
        id: `criterion-weight-${criterion.id}`,
        step: "criteria",
        message: `${criterionLabel} → Weight must be greater than 0`,
      });
    }
    matrix.levels.forEach((level) => {
      const desc = matrix.descriptions[criterion.id]?.[level.id]?.trim();
      if (!desc) {
        out.push({
          id: `desc-${criterion.id}-${level.id}`,
          step: "criteria",
          message: `${criterionLabel} → ${level.name.trim() || "(unnamed level)"} → Description is required`,
        });
      }
    });
  });

  matrix.levels.forEach((level, index) => {
    const name = level.name.trim() || "(unnamed)";
    const levelLabel = `Level "${name}"`;
    if (!level.name.trim()) {
      out.push({
        id: `level-name-${level.id}`,
        step: "criteria",
        message: `${levelLabel} → Name is required`,
      });
    }
    if (!scored || !level.points) return;

    if (level.points.type === "single") {
      if (level.points.value === null || !Number.isFinite(level.points.value)) {
        out.push({
          id: `level-points-${level.id}`,
          step: "criteria",
          message: `${levelLabel} → Point value is required`,
        });
      }
    } else if (
      level.points.min === null ||
      level.points.max === null ||
      !Number.isFinite(level.points.min) ||
      !Number.isFinite(level.points.max) ||
      level.points.min > level.points.max
    ) {
      out.push({
        id: `level-points-${level.id}`,
        step: "criteria",
        message: `${levelLabel} → Range must have valid min and max values`,
      });
    }

    const currentBounds = getPointBounds(level.points);
    const previousBounds =
      index > 0 ? getPointBounds(matrix.levels[index - 1]?.points ?? null) : null;
    if (currentBounds && previousBounds && currentBounds[1] >= previousBounds[0]) {
      out.push({
        id: `level-order-${level.id}`,
        step: "criteria",
        message: `${levelLabel} → Points must decrease down the level list`,
      });
    }
  });
}

function checkRules(matrix: RubricMatrix, type: RubricType | null, out: ValidationIssue[]): void {
  const levelIds = new Set(matrix.levels.map((level) => level.id));

  if (matrix.gradingMethod === "grade_profile") {
    if (!matrix.suggestedScaleId) {
      out.push({
        id: "rules-scale",
        step: "rules",
        message: "Select a suggested grade scale",
      });
    }
    const scale = findGradeScale(matrix.suggestedScaleId);

    // Rule-level validation that compares across all rules (must be done
    // in a pre-pass so every rule gets its own issue, not just the
    // first duplicate / first out-of-order entry).
    const validLabels = scale
      ? matrix.profileRules
          .map((rule) => rule.gradeLabel.trim())
          .filter((label) => label && scale.bands.includes(label))
      : [];

    // Duplicate grade labels — block publish.
    const labelCounts = new Map<string, number>();
    validLabels.forEach((label) => {
      labelCounts.set(label, (labelCounts.get(label) ?? 0) + 1);
    });
    matrix.profileRules.forEach((rule, idx) => {
      const trimmed = rule.gradeLabel.trim();
      if (trimmed && (labelCounts.get(trimmed) ?? 0) > 1) {
        out.push({
          id: `rule-label-duplicate-${rule.id}`,
          step: "rules",
          message: `Rule ${idx + 1} → Grade "${trimmed}" is already used by another rule. Each rule must award a unique grade.`,
        });
      }
    });

    // Out-of-order grades — block publish. Position is derived from the
    // scale's bands[] (best → worst). Rules with no label or an invalid
    // label are skipped so they don't mask ordering issues on labeled ones.
    // Correct order is best-to-worst (low index to high index). A path is
    // out of order when a worse grade (higher index) sits above a better
    // one (lower index).
    let outOfOrderCount = 0;
    if (scale && matrix.profileRules.length > 1) {
      const ranked = matrix.profileRules
        .map((rule, idx) => ({ idx, rule, pos: scale.bands.indexOf(rule.gradeLabel.trim()) }))
        .filter(({ pos }) => pos !== -1);
      for (let i = 1; i < ranked.length; i++) {
        const prev = ranked[i - 1]!;
        const curr = ranked[i]!;
        if (curr.pos < prev.pos) {
          outOfOrderCount++;
          out.push({
            id: `rule-label-order-${curr.rule.id}`,
            step: "rules",
            message: `Rule ${curr.idx + 1} awards "${curr.rule.gradeLabel.trim()}" but should come before Rule ${prev.idx + 1} which awards "${prev.rule.gradeLabel.trim()}". Grades must run from highest (top) to lowest (bottom) on the scale.`,
          });
        }
      }
    }
    if (outOfOrderCount >= 1) {
      out.push({
        id: "rules-order-summary",
        step: "rules",
        message: `${outOfOrderCount} ${outOfOrderCount === 1 ? "rule is" : "rules are"} out of order. Use the auto-arrange action below to fix the order from highest to lowest grade on the scale.`,
      });
    }

    if (matrix.profileRules.length === 0 && type !== "unscored") {
      out.push({
        id: "rules-no-rules",
        step: "rules",
        message: "Add at least one Grade Profile rule",
      });
    }
    matrix.profileRules.forEach((rule, idx) => {
      const ruleLabel = `Rule ${idx + 1}`;
      if (!rule.gradeLabel.trim()) {
        out.push({
          id: `rule-label-${rule.id}`,
          step: "rules",
          message: `${ruleLabel} → Grade label is required`,
        });
      } else if (scale && !scale.bands.includes(rule.gradeLabel.trim())) {
        out.push({
          id: `rule-label-band-${rule.id}`,
          step: "rules",
          message: `${ruleLabel} → Grade label must be a band of ${scale.name} (${scale.bands.join(", ")})`,
        });
      }
      if (rule.paths.length === 0) {
        out.push({
          id: `rule-paths-${rule.id}`,
          step: "rules",
          message: `${ruleLabel} → At least one condition is required`,
        });
      }
      rule.paths.forEach((path, pathIdx) => {
        const conditionLabel = `Rule ${idx + 1} → Condition ${pathIdx + 1}`;
        if (path.tiers.length === 0) {
          out.push({
            id: `path-tiers-${rule.id}-${pathIdx}`,
            step: "rules",
            message: `${conditionLabel} → At least one tier is required`,
          });
        }
        path.tiers.forEach((tier, tierIdx) => {
          if (!tier.levelId || !levelIds.has(tier.levelId)) {
            out.push({
              id: `tier-level-${rule.id}-${pathIdx}-${tierIdx}`,
              step: "rules",
              message: `${conditionLabel} → Tier ${tierIdx + 1} → Grade is required`,
            });
          }
        });
        const levelCounts = path.tiers.reduce<Map<string, number>>((counts, tier) => {
          if (tier.levelId && levelIds.has(tier.levelId)) {
            counts.set(tier.levelId, (counts.get(tier.levelId) ?? 0) + 1);
          }
          return counts;
        }, new Map());
        path.tiers.forEach((tier, tierIdx) => {
          if (!tier.levelId || (levelCounts.get(tier.levelId) ?? 0) < 2) return;
          out.push({
            id: `path-duplicate-tier-${rule.id}-${pathIdx}-${tierIdx}`,
            step: "rules",
            message: `${conditionLabel} → Multiple tiers target the same grade. Combine them into one tier or pick different grades.`,
          });
        });
        const tierCountSum = path.tiers.reduce(
          (sum, tier) => sum + (Number.isFinite(tier.count) ? Math.max(0, tier.count) : 0),
          0,
        );
        if (matrix.criteria.length > 0 && tierCountSum > matrix.criteria.length) {
          out.push({
            id: `path-tiers-sum-${rule.id}-${pathIdx}`,
            step: "rules",
            message: `${conditionLabel} → Tier counts sum to ${tierCountSum} but rubric has only ${matrix.criteria.length} criterion${matrix.criteria.length === 1 ? "" : "a"}`,
          });
        }
        if (path.floorLevelId && !levelIds.has(path.floorLevelId)) {
          out.push({
            id: `path-floor-${rule.id}-${pathIdx}`,
            step: "rules",
            message: `${conditionLabel} → Floor grade is invalid`,
          });
        }
        if (path.floorLevelId && levelIds.has(path.floorLevelId)) {
          const floorIdx = matrix.levels.findIndex((l) => l.id === path.floorLevelId);
          path.tiers.forEach((tier, tierIdx) => {
            if (!tier.levelId || !levelIds.has(tier.levelId)) return;
            const tierPos = matrix.levels.findIndex((l) => l.id === tier.levelId);
            if (tierPos > floorIdx) {
              const tierName = matrix.levels[tierPos]?.name.trim() || `Tier ${tierIdx + 1}`;
              const floorName = matrix.levels[floorIdx]?.name.trim() || `Floor`;
              out.push({
                id: `path-tier-floor-conflict-${rule.id}-${pathIdx}-${tierIdx}`,
                step: "rules",
                message: `${conditionLabel} → "${tierName}" is below the floor "${floorName}". Raise the tier or lower the floor.`,
              });
            }
          });
        }
      });
    });
  }

  if (matrix.minPassLevelId) {
    const stillExists = matrix.levels.some(
      (level) => level.id === matrix.minPassLevelId,
    );
    if (!stillExists) {
      out.push({
        id: "rules-minpass-stale",
        step: "rules",
        message:
          "Minimum-pass rating references a rubric level that was removed. Pick another rating or clear the rule.",
      });
    }
  }
}

function checkWarnings(draft: RubricDraft, out: ValidationIssue[]): void {
  if (draft.type === "scored" && draft.matrix.minPassLevelId === null) {
    out.push({
      id: "warn-minpass-off",
      step: "rules",
      message: "Scored rubric has the minimum-pass rule disabled.",
    });
  }
}

export function getRubricValidation(draft: RubricDraft): RubricValidation {
  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  checkInfo(draft, blockers);
  checkCriteria(draft.matrix, draft.type, blockers);
  checkRules(draft.matrix, draft.type, blockers);
  checkWarnings(draft, warnings);
  return { blockers, warnings };
}

export function isRubricPublishable(draft: RubricDraft): boolean {
  return getRubricValidation(draft).blockers.length === 0;
}

export function isStep1Valid(draft: RubricDraft): boolean {
  return draft.name.trim().length > 0 && stripHtml(draft.outcome).length > 0 && draft.type !== null;
}

export function isRulesValid(draft: RubricDraft): boolean {
  return getRubricValidation(draft).blockers.every((issue) => issue.step !== "rules");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}
