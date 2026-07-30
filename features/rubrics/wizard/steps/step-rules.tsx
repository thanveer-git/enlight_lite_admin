"use client";

import { useMemo, useState } from "react";

import { AlertTriangle, ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { findGradeScale, letterGradeScales } from "@/features/rubrics/constants";
import { GradeSimulator } from "@/features/rubrics/simulator/grade-simulator";
import { getRulesValidation } from "@/features/rubrics/wizard/validation";
import { cn } from "@/lib/utils";


import type {
  GradeProfileRule,
  GradingMethod,
  ProfilePath,
  ProfileTier,
  RubricMatrix,
  RubricType,
} from "@/types/rubric";

export interface StepRulesProps {
  matrix: RubricMatrix;
  type: RubricType | null;
  onMatrixChange: (matrix: RubricMatrix) => void;
}

const NONE_FLOOR = "__none__";

type DeleteTarget =
  | { kind: "rule"; ruleId: string }
  | { kind: "path"; ruleId: string; pathIdx: number }
  | { kind: "tier"; ruleId: string; pathIdx: number; tierIdx: number };

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function createRule(): GradeProfileRule {
  return { id: createId("rule"), gradeLabel: "", paths: [createPath()] };
}

function createPath(): ProfilePath {
  return { tiers: [createTier()], floorLevelId: null };
}

function createTier(): ProfileTier {
  return { count: 1, levelId: "" };
}

function patch(matrix: RubricMatrix, partial: Partial<RubricMatrix>): RubricMatrix {
  return { ...matrix, ...partial };
}

function patchRule(
  rules: GradeProfileRule[],
  ruleId: string,
  partial: Partial<GradeProfileRule>,
): GradeProfileRule[] {
  return rules.map((rule) => (rule.id === ruleId ? { ...rule, ...partial } : rule));
}

function patchPath(
  rules: GradeProfileRule[],
  ruleId: string,
  pathIdx: number,
  partial: Partial<ProfilePath>,
): GradeProfileRule[] {
  return patchRule(rules, ruleId, {
    paths: rules
      .find((r) => r.id === ruleId)!
      .paths.map((path, i) => (i === pathIdx ? { ...path, ...partial } : path)),
  });
}

function patchTier(
  rules: GradeProfileRule[],
  ruleId: string,
  pathIdx: number,
  tierIdx: number,
  partial: Partial<ProfileTier>,
): GradeProfileRule[] {
  return patchPath(rules, ruleId, pathIdx, {
    tiers: rules
      .find((r) => r.id === ruleId)!
      .paths[pathIdx]!.tiers.map((tier, i) => (i === tierIdx ? { ...tier, ...partial } : tier)),
  });
}

function Block({
  number,
  title,
  description,
  action,
  children,
}: {
  number: number;
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <header className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
          {number}
        </span>
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function StepRules({ matrix, type, onMatrixChange }: StepRulesProps) {
  const levels = matrix.levels;
  const scored = type === "scored";
  const errors = useMemo(() => getRulesValidation(matrix, type), [matrix, type]);
  const displayedErrors = useMemo(
    () =>
      // Per-path order entries are summarized by `rules-order-summary`
      // and resolved via the top-of-step Fix it button — hide the
      // per-path noise from the bullet list so the user sees only the
      // summary line they're meant to act on.
      Array.from(
        new Map(
          errors
            .filter((error) => !error.id.startsWith("rule-label-order-"))
            .map((error) => [error.message, error]),
        ).values(),
      ),
    [errors],
  );
  const erroredInputIds = useMemo(() => {
    const set = new Set<string>();
    errors.forEach((err) => {
      if (err.id.startsWith("rule-label-")) set.add(err.id);
      else if (err.id.startsWith("rule-label-band-")) set.add(err.id);
      else if (err.id.startsWith("rule-label-duplicate-")) set.add(err.id);
      else if (err.id.startsWith("rule-label-order-")) set.add(err.id);
      else if (err.id.startsWith("rule-paths-")) set.add(err.id);
      else if (err.id.startsWith("tier-level-")) set.add(err.id);
      else if (err.id.startsWith("path-tiers-sum-")) set.add(err.id);
      else if (err.id.startsWith("path-floor-")) set.add(err.id);
      else if (err.id.startsWith("path-tier-floor-conflict-")) set.add(err.id);
      else if (err.id.startsWith("path-duplicate-tier-")) set.add(err.id);
    });
    return set;
  }, [errors]);
  const suggestedScale = findGradeScale(matrix.suggestedScaleId);
  const [draggingRuleId, setDraggingRuleId] = useState<string | null>(null);
  const [dropTargetRuleId, setDropTargetRuleId] = useState<string | null>(null);
  const [collapsedRules, setCollapsedRules] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null);

  const toggleCollapse = (ruleId: string) => {
    setCollapsedRules((prev) => {
      const next = new Set(prev);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  };

  const moveRule = (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return;
    const rules = [...matrix.profileRules];
    const fromIdx = rules.findIndex((r) => r.id === sourceId);
    const toIdx = rules.findIndex((r) => r.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = rules.splice(fromIdx, 1);
    if (!moved) return;
    rules.splice(toIdx, 0, moved);
    onMatrixChange(patch(matrix, { profileRules: rules }));
  };

  const fixOrder = () => {
    if (!suggestedScale) return;
    // Sort by the rule's grade position on the scale (best → worst).
    // Rules with no/invalid label keep their relative order via a stable
    // sort: assign them a position beyond the last valid band so they
    // sink to the bottom, but preserve their original index among
    // themselves via the secondary tiebreaker.
    const ordered = [...matrix.profileRules].sort((a, b) => {
      const aPos = suggestedScale.bands.indexOf(a.gradeLabel.trim());
      const bPos = suggestedScale.bands.indexOf(b.gradeLabel.trim());
      const aRank = aPos === -1 ? Number.MAX_SAFE_INTEGER : aPos;
      const bRank = bPos === -1 ? Number.MAX_SAFE_INTEGER : bPos;
      if (aRank !== bRank) return aRank - bRank;
      return matrix.profileRules.indexOf(a) - matrix.profileRules.indexOf(b);
    });
    onMatrixChange(patch(matrix, { profileRules: ordered }));
  };

  const setMethod = (method: GradingMethod) => {
    const next: Partial<RubricMatrix> = { gradingMethod: method };
    if (method === "grade_profile" && matrix.profileRules.length === 0) {
      next.profileRules = [createRule()];
    }
    if (method === "weighted_average") next.profileFallback = false;
    onMatrixChange(patch(matrix, next));
  };

  const setProfileEnabled = (enabled: boolean) => {
    if (enabled) {
      const next: Partial<RubricMatrix> = { gradingMethod: "grade_profile" };
      if (matrix.profileRules.length === 0) next.profileRules = [createRule()];
      onMatrixChange(patch(matrix, next));
    } else {
      onMatrixChange(
        patch(matrix, { gradingMethod: "weighted_average", profileFallback: false }),
      );
    }
  };

  const setSuggestedScale = (id: string) => {
    onMatrixChange(patch(matrix, { suggestedScaleId: id || null }));
  };

  const setProfileFallback = (enabled: boolean) => {
    onMatrixChange(patch(matrix, { profileFallback: enabled }));
  };

  const setMinPassLevelId = (id: string) => {
    onMatrixChange(patch(matrix, { minPassLevelId: id || null }));
  };

  const addRule = () => {
    onMatrixChange(patch(matrix, { profileRules: [...matrix.profileRules, createRule()] }));
  };

  const removeRule = (ruleId: string) => {
    setPendingDelete({ kind: "rule", ruleId });
  };

  const setRuleLabel = (ruleId: string, value: string) => {
    onMatrixChange(
      patch(matrix, {
        profileRules: patchRule(matrix.profileRules, ruleId, { gradeLabel: value }),
      }),
    );
  };

  const addPath = (ruleId: string) => {
    const rule = matrix.profileRules.find((r) => r.id === ruleId);
    if (!rule) return;
    onMatrixChange(
      patch(matrix, {
        profileRules: patchRule(matrix.profileRules, ruleId, {
          paths: [...rule.paths, createPath()],
        }),
      }),
    );
  };

  const removePath = (ruleId: string, pathIdx: number) => {
    setPendingDelete({ kind: "path", ruleId, pathIdx });
  };

  const setFloor = (ruleId: string, pathIdx: number, value: string) => {
    onMatrixChange(
      patch(matrix, {
        profileRules: patchPath(matrix.profileRules, ruleId, pathIdx, {
          floorLevelId: value && value !== NONE_FLOOR ? value : null,
        }),
      }),
    );
  };

  const addTier = (ruleId: string, pathIdx: number) => {
    const path = matrix.profileRules.find((r) => r.id === ruleId)?.paths[pathIdx];
    if (!path) return;
    onMatrixChange(
      patch(matrix, {
        profileRules: patchPath(matrix.profileRules, ruleId, pathIdx, {
          tiers: [...path.tiers, createTier()],
        }),
      }),
    );
  };

  const removeTier = (ruleId: string, pathIdx: number, tierIdx: number) => {
    setPendingDelete({ kind: "tier", ruleId, pathIdx, tierIdx });
  };

  const confirmDelete = () => {
    const target = pendingDelete;
    if (!target) return;
    if (target.kind === "rule") {
      onMatrixChange(
        patch(matrix, {
          profileRules: matrix.profileRules.filter((r) => r.id !== target.ruleId),
        }),
      );
    } else if (target.kind === "path") {
      const rule = matrix.profileRules.find((r) => r.id === target.ruleId);
      if (rule) {
        onMatrixChange(
          patch(matrix, {
            profileRules: patchRule(matrix.profileRules, target.ruleId, {
              paths: rule.paths.filter((_, i) => i !== target.pathIdx),
            }),
          }),
        );
      }
    } else {
      const path = matrix.profileRules.find((r) => r.id === target.ruleId)?.paths[target.pathIdx];
      if (path) {
        onMatrixChange(
          patch(matrix, {
            profileRules: patchPath(matrix.profileRules, target.ruleId, target.pathIdx, {
              tiers: path.tiers.filter((_, i) => i !== target.tierIdx),
            }),
          }),
        );
      }
    }
    setPendingDelete(null);
  };

  const setTierCount = (ruleId: string, pathIdx: number, tierIdx: number, value: string) => {
    const parsed = Number(value);
    const count = Number.isFinite(parsed) ? Math.max(1, Math.floor(parsed)) : 1;
    onMatrixChange(
      patch(matrix, {
        profileRules: patchTier(matrix.profileRules, ruleId, pathIdx, tierIdx, { count }),
      }),
    );
  };

  const setTierLevel = (ruleId: string, pathIdx: number, tierIdx: number, levelId: string) => {
    onMatrixChange(
      patch(matrix, {
        profileRules: patchTier(matrix.profileRules, ruleId, pathIdx, tierIdx, { levelId }),
      }),
    );
  };

  const minPassEnabled = matrix.minPassLevelId !== null;

  return (
    <div className="space-y-4">
      {displayedErrors.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="font-medium">Fix the following to publish:</p>
          <ul className="ml-4 mt-1 list-disc space-y-0.5">
            {displayedErrors.map((err) => (
              <li key={err.id}>{err.message}</li>
            ))}
          </ul>
          {displayedErrors.some((err) => err.id === "rules-order-summary") && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={fixOrder}
                className="rounded-md bg-destructive px-3 py-1 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
              >
                Auto Arrange
              </button>
            </div>
          )}
        </div>
      )}

      {scored && (
        <Block
          number={1}
          title="Grading method"
          description="How criterion ratings become the final grade."
        >
          <RadioGroup
            value={matrix.gradingMethod}
            onValueChange={(value) => setMethod(value as GradingMethod)}
            className="grid gap-2 sm:grid-cols-2"
          >
            <label
              htmlFor="method-weighted"
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border bg-background p-3 transition-colors",
                matrix.gradingMethod === "weighted_average"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-foreground/20",
              )}
            >
              <RadioGroupItem
                value="weighted_average"
                id="method-weighted"
                className="mt-0.5"
              />
              <span className="grid gap-0.5 text-sm">
                <span className="font-medium text-foreground">Weighted average</span>
                <span className="text-xs text-muted-foreground">
                  Σ(weighted points) / Σ(weighted max) × 100, mapped to a band.
                </span>
              </span>
            </label>
            <label
              htmlFor="method-profile"
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-md border bg-background p-3 transition-colors",
                matrix.gradingMethod === "grade_profile"
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "hover:border-foreground/20",
              )}
            >
              <RadioGroupItem value="grade_profile" id="method-profile" className="mt-0.5" />
              <span className="grid gap-0.5 text-sm">
                <span className="font-medium text-foreground">Grade Profile</span>
                <span className="text-xs text-muted-foreground">
                  Map rating combinations to grade labels. First matching rule wins.
                </span>
              </span>
            </label>
          </RadioGroup>
        </Block>
      )}

      <Block
        number={2}
        title="Grade scale & minimum-pass rule"
        description="Pick the suggested scale and configure the global minimum-pass threshold."
        action={<GradeSimulator embedded showTrigger={false} matrix={matrix} rubricType={type} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="min-pass-level">Minimum-pass rating</Label>
            <Select
              value={matrix.minPassLevelId ?? NONE_FLOOR}
              onValueChange={(v) => setMinPassLevelId(v === NONE_FLOOR ? "" : v)}
              disabled={!matrix.levels.length}
            >
              <SelectTrigger id="min-pass-level">
                <SelectValue placeholder="No minimum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_FLOOR}>No minimum</SelectItem>
                {matrix.levels.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.name.trim() || "Unnamed level"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="min-h-[16px] text-[11px] leading-[16px] text-muted-foreground">
              {!matrix.levels.length
                ? "Add at least one performance level on Step 2 first."
                : minPassEnabled
                  ? "Every criterion must reach this rating or higher."
                  : "Failing criteria will not force resubmission."}
            </p>
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="suggested-scale"
              className={cn(
                matrix.gradingMethod !== "grade_profile" && "text-muted-foreground/60",
              )}
            >
              Suggested grade scale
            </Label>
            <Select
              value={matrix.suggestedScaleId ?? ""}
              onValueChange={setSuggestedScale}
              disabled={matrix.gradingMethod !== "grade_profile"}
            >
              <SelectTrigger id="suggested-scale">
                <SelectValue placeholder="Select a scale" />
              </SelectTrigger>
              <SelectContent>
                {/* Only admin-managed (named) scales are valid
                    suggestions — the four fixed formats (Percentage /
                    CGPA / Marks / Comp/Incomp) are direct grade formats
                    and don't carry bands for the rubric engine to map
                    against. See GRADE_SCALES meta.gradeType. */}
                {letterGradeScales().map((scale) => (
                  <SelectItem key={scale.id} value={scale.id}>
                    {scale.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="min-h-[16px] text-[11px] leading-[16px] text-muted-foreground">
              {matrix.gradingMethod !== "grade_profile"
                ? "Switch the grading method to Grade Profile to pick a scale."
                : suggestedScale
                  ? `Bands: ${suggestedScale.bands.join(", ")}`
                  : "Pick a scale to map percentage scores to grade bands."}
            </p>
          </div>
        </div>
      </Block>

      {(!scored || matrix.gradingMethod === "grade_profile") && (
        <Block
          number={scored ? 3 : 2}
          title="Grade Profile rules"
          description={
            scored
              ? "Conditions within a path are AND. A rule passes only when every one of its conditions passes. First matching rule wins."
              : matrix.gradingMethod === "grade_profile"
                ? "Conditions within a path are AND. A rule passes only when every one of its conditions passes. First matching rule wins."
                : "Turn on to configure rules. Turn off to require manual override."
          }
          action={
            !scored ? (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor="grade-profile-toggle"
                  className="text-xs font-medium text-muted-foreground"
                >
                  Use rules
                </Label>
                <Switch
                  id="grade-profile-toggle"
                  checked={matrix.gradingMethod === "grade_profile"}
                  onCheckedChange={setProfileEnabled}
                />
              </div>
            ) : null
          }
        >
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
              matrix.gradingMethod === "grade_profile"
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0",
            )}
          >
            <div className="overflow-hidden space-y-3">
          {matrix.gradingMethod === "grade_profile" && scored && (
            <div className="flex items-center justify-between gap-3 rounded-md border border-warning/40 bg-warning/5 p-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <div className="space-y-0.5">
                  <Label
                    htmlFor="profile-fallback"
                    className="text-sm font-medium text-foreground"
                  >
                    Fallback to weighted average
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    If no Grade Profile rule matches, fall back to the weighted calculation
                    instead of requiring a manual override.
                  </p>
                </div>
              </div>
              <Switch
                id="profile-fallback"
                checked={matrix.profileFallback}
                onCheckedChange={setProfileFallback}
              />
            </div>
          )}

          {matrix.gradingMethod === "grade_profile" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {matrix.profileRules.length} Path
                  {matrix.profileRules.length === 1 ? "" : "s"}
                </span>
                <Button type="button" variant="outline" size="sm" onClick={addRule}>
                  <Plus className="mr-1.5 size-4" /> Add Path
                </Button>
              </div>

              {matrix.profileRules.length === 0 && (
                <div className="rounded-md border border-dashed bg-background p-4 text-sm text-muted-foreground">
                  No paths yet. Add a path to map rating combinations to a grade label.
                </div>
              )}

              <div className="space-y-3">
                {matrix.profileRules.map((rule, ruleIdx) => {
              const labelMatch = suggestedScale
                ? suggestedScale.bands.includes(rule.gradeLabel.trim())
                : true;
              const isDragging = draggingRuleId === rule.id;
              const isDropTarget = dropTargetRuleId === rule.id && draggingRuleId !== rule.id;
              const isCollapsed = collapsedRules.has(rule.id);
              return (
                <RuleCard
                  key={rule.id}
                  index={ruleIdx}
                  rule={rule}
                  levels={levels}
                  gradeBands={suggestedScale?.bands ?? []}
                  suggestedScaleName={suggestedScale?.name ?? null}
                  labelMismatch={!!suggestedScale && !labelMatch && !!rule.gradeLabel.trim()}
                  labelError={erroredInputIds.has(`rule-label-${rule.id}`) || erroredInputIds.has(`rule-label-band-${rule.id}`)}
                  labelDuplicateError={erroredInputIds.has(`rule-label-duplicate-${rule.id}`)}
                  orderError={erroredInputIds.has(`rule-label-order-${rule.id}`)}
                  pathsError={erroredInputIds.has(`rule-paths-${rule.id}`)}
                  hasFloorError={(pathIdx) => erroredInputIds.has(`path-floor-${rule.id}-${pathIdx}`)}
                  hasTierSumError={(pathIdx) =>
                    erroredInputIds.has(`path-tiers-sum-${rule.id}-${pathIdx}`)
                  }
                  hasTierLevelError={(pathIdx, tierIdx) =>
                    erroredInputIds.has(`tier-level-${rule.id}-${pathIdx}-${tierIdx}`)
                  }
                  hasTierFloorConflict={(pathIdx, tierIdx) =>
                    erroredInputIds.has(`path-tier-floor-conflict-${rule.id}-${pathIdx}-${tierIdx}`)
                  }
                  hasTierDuplicate={(pathIdx, tierIdx) =>
                    erroredInputIds.has(`path-duplicate-tier-${rule.id}-${pathIdx}-${tierIdx}`)
                  }
                  criteriaCount={matrix.criteria.length}
                  canRemoveRule={matrix.profileRules.length > 1}
                  canMoveUp={ruleIdx > 0}
                  canMoveDown={ruleIdx < matrix.profileRules.length - 1}
                  isCollapsed={isCollapsed}
                  isDragging={isDragging}
                  isDropTarget={isDropTarget}
                  onToggleCollapse={() => toggleCollapse(rule.id)}
                  onMoveUp={() => {
                    const prev = matrix.profileRules[ruleIdx - 1];
                    if (prev) moveRule(rule.id, prev.id);
                  }}
                  onMoveDown={() => {
                    const next = matrix.profileRules[ruleIdx + 1];
                    if (next) moveRule(rule.id, next.id);
                  }}
                  onDragStart={() => setDraggingRuleId(rule.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dropTargetRuleId !== rule.id) setDropTargetRuleId(rule.id);
                  }}
                  onDragLeave={() => {
                    if (dropTargetRuleId === rule.id) setDropTargetRuleId(null);
                  }}
                  onDrop={() => {
                    if (draggingRuleId) moveRule(draggingRuleId, rule.id);
                    setDraggingRuleId(null);
                    setDropTargetRuleId(null);
                  }}
                  onDragEnd={() => {
                    setDraggingRuleId(null);
                    setDropTargetRuleId(null);
                  }}
                  onLabelChange={(value) => setRuleLabel(rule.id, value)}
                  onRemoveRule={() => removeRule(rule.id)}
                  onAddPath={() => addPath(rule.id)}
                  onRemovePath={(pathIdx) => removePath(rule.id, pathIdx)}
                  onAddTier={(pathIdx) => addTier(rule.id, pathIdx)}
                  onRemoveTier={(pathIdx, tierIdx) => removeTier(rule.id, pathIdx, tierIdx)}
                  onSetFloor={(pathIdx, value) => setFloor(rule.id, pathIdx, value)}
                  onSetTierCount={(pathIdx, tierIdx, value) =>
                    setTierCount(rule.id, pathIdx, tierIdx, value)
                  }
                  onSetTierLevel={(pathIdx, tierIdx, levelId) =>
                    setTierLevel(rule.id, pathIdx, tierIdx, levelId)
                  }
                />
              );
              })}
            </div>
            </>
          )}
            </div>
          </div>
        </Block>
      )}
      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.kind === "rule"
                ? "Delete rule?"
                : pendingDelete?.kind === "path"
                  ? "Delete condition?"
                  : pendingDelete?.kind === "tier"
                    ? "Delete tier?"
                    : "Delete item?"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.kind === "rule"
                ? "This will permanently remove this rule and all of its conditions. This action cannot be undone."
                : pendingDelete?.kind === "path"
                  ? "This will permanently remove this condition and its tiers and floor. This action cannot be undone."
                  : pendingDelete?.kind === "tier"
                    ? "This will permanently remove this tier from the condition. This action cannot be undone."
                    : "This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RuleCardProps {
  index: number;
  rule: GradeProfileRule;
  levels: RubricMatrix["levels"];
  gradeBands: string[];
  suggestedScaleName: string | null;
  labelMismatch: boolean;
  labelError: boolean;
  labelDuplicateError: boolean;
  orderError: boolean;
  pathsError: boolean;
  hasFloorError: (pathIdx: number) => boolean;
  hasTierSumError: (pathIdx: number) => boolean;
  hasTierLevelError: (pathIdx: number, tierIdx: number) => boolean;
  hasTierFloorConflict: (pathIdx: number, tierIdx: number) => boolean;
  hasTierDuplicate: (pathIdx: number, tierIdx: number) => boolean;
  criteriaCount: number;
  canRemoveRule: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  isCollapsed: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  onToggleCollapse: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onLabelChange: (value: string) => void;
  onRemoveRule: () => void;
  onAddPath: () => void;
  onRemovePath: (pathIdx: number) => void;
  onAddTier: (pathIdx: number) => void;
  onRemoveTier: (pathIdx: number, tierIdx: number) => void;
  onSetFloor: (pathIdx: number, value: string) => void;
  onSetTierCount: (pathIdx: number, tierIdx: number, value: string) => void;
  onSetTierLevel: (pathIdx: number, tierIdx: number, levelId: string) => void;
}

function RuleCard({
  index,
  rule,
  levels,
  gradeBands,
  suggestedScaleName,
  labelMismatch,
  labelError,
  labelDuplicateError,
  orderError,
  pathsError,
  hasFloorError,
  hasTierSumError,
  hasTierLevelError,
  hasTierFloorConflict,
  hasTierDuplicate,
  criteriaCount,
  canRemoveRule,
  canMoveUp,
  canMoveDown,
  isCollapsed,
  isDragging,
  isDropTarget,
  onToggleCollapse,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onLabelChange,
  onRemoveRule,
  onAddPath,
  onRemovePath,
  onAddTier,
  onRemoveTier,
  onSetFloor,
  onSetTierCount,
  onSetTierLevel,
}: RuleCardProps) {
  const CollapseIcon = isCollapsed ? ChevronDown : ChevronUp;
  const cardError = pathsError || labelDuplicateError || orderError;

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "rounded-lg border bg-background transition-shadow",
        isDragging && "opacity-50",
        isDropTarget && "ring-2 ring-primary/40",
        cardError && "border-destructive",
      )}
    >
      {/* ── Path header ── */}
      <div className={cn(
        "flex items-center gap-3 bg-muted/30 px-4 py-3",
        !isCollapsed && "border-b",
      )}>
        <button
          type="button"
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder path"
        >
          <GripVertical className="size-4" />
        </button>

        <div className="flex flex-col gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground"
            aria-label="Move path up"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5 text-muted-foreground hover:text-foreground"
            aria-label="Move path down"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="size-3.5" />
          </Button>
        </div>

        <span className="text-sm font-medium text-foreground">Award grade</span>

        <Select
          value={rule.gradeLabel || undefined}
          onValueChange={onLabelChange}
          disabled={gradeBands.length === 0}
        >
          <SelectTrigger
            aria-invalid={labelError || labelDuplicateError || undefined}
            className={cn(
              "h-8 w-[160px]",
              (labelError || labelMismatch || labelDuplicateError) &&
                "border-destructive text-destructive focus:ring-destructive/30",
            )}
          >
            <SelectValue
              placeholder={gradeBands.length > 0 ? "Select grade" : "Select a grade scale"}
            />
          </SelectTrigger>
          <SelectContent>
            {gradeBands.map((band) => (
              <SelectItem key={band} value={band}>
                {band}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground">
          if all of the following conditions are fully met.
        </span>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isCollapsed ? "Expand Path" : "Collapse Path"}
            onClick={onToggleCollapse}
            className="size-8 text-muted-foreground hover:text-foreground"
          >
            <CollapseIcon className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove Path"
            onClick={onRemoveRule}
            disabled={!canRemoveRule}
            className="size-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      {!isCollapsed && (labelMismatch || labelDuplicateError || orderError) && (
        <div className="border-b border-destructive/40 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {labelMismatch && suggestedScaleName && (
            <p>
              &quot;{rule.gradeLabel}&quot; is not a band on {suggestedScaleName}.
            </p>
          )}
          {labelDuplicateError && (
            <p>
              &quot;{rule.gradeLabel.trim()}&quot; is already used by another path. Each path
              must award a unique grade — pick a different band.
            </p>
          )}
          {orderError && (
            <p>
              This path&apos;s grade is out of order — a lower grade appears above a higher
              one. Use Fix it at the top of this step to auto-arrange all paths.
            </p>
          )}
        </div>
      )}

      {/* ── Conditions ── */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-out",
          isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rule.paths.map((path, pathIdx) => (
                <ConditionSentence
                  key={pathIdx}
                  path={path}
                  pathIdx={pathIdx}
                  levels={levels}
                  ruleId={rule.id}
                  canRemove={rule.paths.length > 1 || path.tiers.length > 1 || !!path.floorLevelId}
                  floorError={
                    hasFloorError(pathIdx) ||
                    path.tiers.some((_, tierIdx) => hasTierFloorConflict(pathIdx, tierIdx))
                  }
                  tierSumError={hasTierSumError(pathIdx)}
                  criteriaCount={criteriaCount}
                  tierLevelError={(tierIdx) => hasTierLevelError(pathIdx, tierIdx)}
                  tierFloorConflict={(tierIdx) => hasTierFloorConflict(pathIdx, tierIdx)}
                  tierDuplicate={(tierIdx) => hasTierDuplicate(pathIdx, tierIdx)}
                  onSetTierCount={(tierIdx, value) => onSetTierCount(pathIdx, tierIdx, value)}
                  onSetTierLevel={(tierIdx, levelId) => onSetTierLevel(pathIdx, tierIdx, levelId)}
                  onRemoveTier={(tierIdx) => onRemoveTier(pathIdx, tierIdx)}
                  onAddTier={() => onAddTier(pathIdx)}
                  canRemoveTier={(tierIdx) => path.tiers.length > 1}
                  onSetFloor={(value) => onSetFloor(pathIdx, value)}
                  onRemoveCondition={() => onRemovePath(pathIdx)}
                />
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full border-dashed text-muted-foreground hover:text-foreground"
              onClick={onAddPath}
            >
              <Plus className="mr-1.5 size-4" /> Add Condition
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConditionSentenceProps {
  path: ProfilePath;
  pathIdx: number;
  levels: RubricMatrix["levels"];
  ruleId: string;
  canRemove: boolean;
  floorError: boolean;
  tierSumError: boolean;
  criteriaCount: number;
  tierLevelError: (tierIdx: number) => boolean;
  tierFloorConflict: (tierIdx: number) => boolean;
  tierDuplicate: (tierIdx: number) => boolean;
  onSetTierCount: (tierIdx: number, value: string) => void;
  onSetTierLevel: (tierIdx: number, levelId: string) => void;
  onRemoveTier: (tierIdx: number) => void;
  onAddTier: () => void;
  canRemoveTier: (tierIdx: number) => boolean;
  onSetFloor: (value: string) => void;
  onRemoveCondition: () => void;
}

function ConditionSentence({
  path,
  pathIdx,
  levels,
  canRemove,
  floorError,
  tierSumError,
  criteriaCount,
  tierLevelError,
  tierFloorConflict,
  tierDuplicate,
  onSetTierCount,
  onSetTierLevel,
  onRemoveTier,
  onAddTier,
  canRemoveTier,
  onSetFloor,
  onRemoveCondition,
}: ConditionSentenceProps) {
  const missingTiers = path.tiers.length === 0;
  return (
    <div
      className={cn(
        "rounded-md border bg-card",
        (missingTiers || tierSumError) && "border-destructive",
      )}
    >
      <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Condition {pathIdx + 1}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="ml-auto size-8 text-muted-foreground hover:text-destructive"
          aria-label={`Remove condition ${pathIdx + 1}`}
          onClick={onRemoveCondition}
          disabled={!canRemove}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="space-y-2 px-3 py-3 text-sm leading-7 text-foreground">
        {path.tiers.map((tier, tierIdx) => {
          const selectedLevel = levels.find((l) => l.id === tier.levelId);
          const showConnector = path.tiers.length > 1 && tierIdx < path.tiers.length - 1;
          return (
            <div
              key={tierIdx}
              className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-2 py-1"
            >
              <span>At least</span>
              <Input
                type="number"
                min={1}
                value={tier.count}
                onChange={(e) => onSetTierCount(tierIdx, e.target.value)}
                className={cn(
                  "inline-flex h-7 w-14 rounded-none border-0 border-b border-dashed border-border bg-transparent px-1 text-center text-sm focus-visible:border-primary focus-visible:ring-0",
                )}
              />
              <span>criterion{Number(tier.count) === 1 ? "" : "a"}</span>
              <span>reach</span>
              <Select
                value={tier.levelId}
                onValueChange={(v) => onSetTierLevel(tierIdx, v)}
              >
                <SelectTrigger
                  aria-invalid={
                    tierLevelError(tierIdx) ||
                    tierFloorConflict(tierIdx) ||
                    tierDuplicate(tierIdx) ||
                    undefined
                  }
                  className={cn(
                    "inline-flex h-7 w-auto gap-1 rounded-none border-0 border-b border-dashed border-border bg-transparent px-1 text-sm font-semibold shadow-none focus:ring-0",
                    !selectedLevel && "text-muted-foreground",
                    (tierLevelError(tierIdx) ||
                      tierFloorConflict(tierIdx) ||
                      tierDuplicate(tierIdx)) &&
                      "border-destructive text-destructive focus-visible:border-destructive",
                  )}
                >
                  <SelectValue placeholder="Rating name" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showConnector && <span className="text-muted-foreground">and</span>}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto size-6 text-muted-foreground hover:text-destructive"
                aria-label={`Remove tier ${tierIdx + 1}`}
                onClick={() => onRemoveTier(tierIdx)}
                disabled={!canRemoveTier(tierIdx)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full border-dashed text-xs text-muted-foreground hover:text-foreground"
          onClick={onAddTier}
        >
          <Plus className="mr-1 size-3.5" /> Add Tier
        </Button>

        <div className="flex items-center gap-2 rounded-md border border-dashed border-border/60 px-2 py-1 text-muted-foreground">
          <span>and no criterion below</span>
          <Select value={path.floorLevelId ?? NONE_FLOOR} onValueChange={onSetFloor}>
            <SelectTrigger
              aria-invalid={floorError || undefined}
              className={cn(
                "inline-flex h-7 w-auto gap-1 rounded-none border-0 border-b border-dashed border-border bg-transparent px-1 text-sm font-semibold text-foreground shadow-none focus:ring-0",
                !path.floorLevelId && "text-muted-foreground font-normal",
                floorError && "border-destructive text-destructive focus-visible:border-destructive",
              )}
            >
              <SelectValue placeholder="No floor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_FLOOR}>No floor</SelectItem>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {tierSumError && (
        <div className="flex items-start gap-2 border-t border-destructive/40 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            This condition can never be satisfied. It asks for more criteria than the rubric has ({criteriaCount}). Each tier counts different criteria, so the totals can&apos;t add up beyond the rubric&apos;s criteria count.
          </span>
        </div>
      )}
    </div>
  );
}