"use client";

import { useEffect, useMemo, useState } from "react";

import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getCriteriaValidation } from "@/features/rubrics/wizard/validation";
import { cn } from "@/lib/utils";
import type {
  LevelPoints,
  MatrixCriterion,
  MatrixLevel,
  PointType,
  RubricMatrix,
  RubricType,
} from "@/types/rubric";

export interface StepCriteriaProps {
  matrix: RubricMatrix;
  type: RubricType | null;
  onMatrixChange: (matrix: RubricMatrix) => void;
}

type DragKind = "criterion" | "level";
type DragState = { kind: DragKind; id: string } | null;

type PendingDelete =
  | { kind: "criterion"; id: string; name: string }
  | { kind: "level"; id: string; name: string }
  | null;

function createId(prefix: string): string {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}

function singlePoints(value: number | null): LevelPoints {
  return { type: "single", value, min: null, max: null };
}

function rangePoints(min: number | null, max: number | null): LevelPoints {
  return { type: "range", value: null, min, max };
}

function defaultPoints(index: number): LevelPoints {
  return singlePoints(Math.max(0, 100 - index * 25));
}

export function createMockMatrix(): RubricMatrix {
  const criteria: MatrixCriterion[] = [
    { id: "criterion-content", name: "Depth and accuracy of ideas, evidence, and supporting reasoning", weight: 40 },
    { id: "criterion-structure", name: "Logical organization of paragraphs and clarity of transitions", weight: 30 },
    { id: "criterion-style", name: "Word choice, sentence variety, and grammar suited to the audience", weight: 30 },
  ];
  const levels: MatrixLevel[] = [
    { id: "level-excellent", name: "Excellent", points: singlePoints(100) },
    { id: "level-proficient", name: "Proficient", points: rangePoints(80, 89) },
    { id: "level-developing", name: "Developing", points: rangePoints(60, 79) },
    { id: "level-beginning", name: "Beginning", points: rangePoints(0, 50) },
  ];

  return {
    criteria,
    levels,
    descriptions: {
      "criterion-content": {
        "level-excellent": "Ideas are accurate, focused, and developed with convincing evidence.",
        "level-proficient": "Ideas are clear and supported with relevant evidence.",
        "level-developing": "Ideas are present but need more detail or supporting evidence.",
        "level-beginning": "Ideas are limited, unclear, or missing supporting evidence.",
      },
      "criterion-structure": {
        "level-excellent": "The work has a logical progression and strong transitions.",
        "level-proficient": "The work is organized and transitions are generally effective.",
        "level-developing": "The organization is inconsistent and some transitions are unclear.",
        "level-beginning": "The work lacks a clear structure or progression.",
      },
      "criterion-style": {
        "level-excellent":
          "Language is precise, engaging, and consistently appropriate for the audience.",
        "level-proficient": "Language is appropriate with minor issues in precision or tone.",
        "level-developing": "Language is understandable but tone or word choice is inconsistent.",
        "level-beginning": "Language frequently distracts from the meaning or audience.",
      },
    },
    gradingMethod: "weighted_average",
    profileRules: [],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: null,
  };
}

function parseNumber(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return null;
  return parsed;
}

function getPointBounds(points: LevelPoints | null): [number, number] | null {
  if (!points) return null;
  if (points.type === "single") {
    return points.value === null ? null : [points.value, points.value];
  }
  if (points.min === null || points.max === null) return null;
  return [points.min, points.max];
}

function getCriterionError(criterion: MatrixCriterion, scored: boolean): string | null {
  if (!criterion.name.trim()) return "Name is required";
  if (
    scored &&
    (criterion.weight === null || !Number.isFinite(criterion.weight) || criterion.weight <= 0)
  ) {
    return "Weight must be greater than 0";
  }
  return null;
}

function getLevelError(
  level: MatrixLevel,
  levels: MatrixLevel[],
  index: number,
  scored: boolean,
): string | null {
  if (!level.name.trim()) return "Name is required";
  if (!scored || !level.points) return null;

  if (
    level.points.type === "single" &&
    (level.points.value === null || !Number.isFinite(level.points.value))
  ) {
    return "Point value is required";
  }
  if (
    level.points.type === "range" &&
    (level.points.min === null ||
      level.points.max === null ||
      !Number.isFinite(level.points.min) ||
      !Number.isFinite(level.points.max) ||
      level.points.min > level.points.max)
  ) {
    return "Range must have valid min and max values";
  }

  const currentBounds = getPointBounds(level.points);
  const previousBounds = index > 0 ? getPointBounds(levels[index - 1]?.points ?? null) : null;
  if (currentBounds && previousBounds && currentBounds[1] >= previousBounds[0]) {
    return "Points must decrease down the level list";
  }
  return null;
}

function reorder<T>(items: T[], fromId: string, toId: string, getId: (item: T) => string): T[] {
  const fromIndex = items.findIndex((item) => getId(item) === fromId);
  const toIndex = items.findIndex((item) => getId(item) === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return items;
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (moved) next.splice(toIndex, 0, moved);
  return next;
}

export function StepCriteria({ matrix, type, onMatrixChange }: StepCriteriaProps) {
  const [dragState, setDragState] = useState<DragState>(null);
  const [dropTarget, setDropTarget] = useState<DragState>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const scored = type === "scored";
  const errors = useMemo(() => getCriteriaValidation(matrix, type), [matrix, type]);

  const updateMatrix = (update: (current: RubricMatrix) => RubricMatrix) => {
    onMatrixChange(update(matrix));
  };

  const addCriterion = () => {
    const id = createId("criterion");
    updateMatrix((current) => ({
      ...current,
      criteria: [...current.criteria, { id, name: "New criterion", weight: scored ? 10 : null }],
      descriptions: {
        ...current.descriptions,
        [id]: Object.fromEntries(current.levels.map((level) => [level.id, ""])),
      },
    }));
  };

  const removeCriterion = (id: string) => {
    if (matrix.criteria.length <= 1) return;
    setPendingDelete({
      kind: "criterion",
      id,
      name: matrix.criteria.find((c) => c.id === id)?.name.trim() || "this criterion",
    });
  };

  const confirmRemoveCriterion = (id: string) => {
    updateMatrix((current) => {
      const { [id]: removedDescriptions, ...descriptions } = current.descriptions;
      void removedDescriptions;
      return {
        ...current,
        criteria: current.criteria.filter((criterion) => criterion.id !== id),
        descriptions,
      };
    });
  };

  const updateCriterion = (id: string, patch: Partial<MatrixCriterion>) => {
    updateMatrix((current) => ({
      ...current,
      criteria: current.criteria.map((criterion) =>
        criterion.id === id ? { ...criterion, ...patch } : criterion,
      ),
    }));
  };

  const addLevel = () => {
    const id = createId("level");
    updateMatrix((current) => ({
      ...current,
      levels: [
        ...current.levels,
        { id, name: "New level", points: scored ? defaultPoints(current.levels.length) : null },
      ],
      descriptions: Object.fromEntries(
        current.criteria.map((criterion) => [
          criterion.id,
          { ...current.descriptions[criterion.id], [id]: "" },
        ]),
      ),
    }));
  };

  const removeLevel = (id: string) => {
    if (matrix.levels.length <= 2) return;
    setPendingDelete({
      kind: "level",
      id,
      name: matrix.levels.find((l) => l.id === id)?.name.trim() || "this level",
    });
  };

  const confirmRemoveLevel = (id: string) => {
    updateMatrix((current) => ({
      ...current,
      levels: current.levels.filter((level) => level.id !== id),
      descriptions: Object.fromEntries(
        current.criteria.map((criterion) => {
          const { [id]: removedDescription, ...descriptions } =
            current.descriptions[criterion.id] ?? {};
          void removedDescription;
          return [criterion.id, descriptions];
        }),
      ),
    }));
  };

  const updateLevel = (id: string, patch: Partial<MatrixLevel>) => {
    updateMatrix((current) => ({
      ...current,
      levels: current.levels.map((level) => (level.id === id ? { ...level, ...patch } : level)),
    }));
  };

  const updateDescription = (criterionId: string, levelId: string, value: string) => {
    updateMatrix((current) => ({
      ...current,
      descriptions: {
        ...current.descriptions,
        [criterionId]: {
          ...current.descriptions[criterionId],
          [levelId]: value,
        },
      },
    }));
  };

  const startDrag = (event: React.DragEvent, kind: DragKind, id: string) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", `${kind}:${id}`);
    setDragState({ kind, id });
  };

  const finishDrag = () => {
    setDragState(null);
    setDropTarget(null);
  };

  const confirmDelete = () => {
    const target = pendingDelete;
    if (!target) return;
    if (target.kind === "criterion") confirmRemoveCriterion(target.id);
    else confirmRemoveLevel(target.id);
    setPendingDelete(null);
  };

  const dropOn = (event: React.DragEvent, kind: DragKind, targetId: string) => {
    event.preventDefault();
    const [draggedKind, draggedId] = event.dataTransfer.getData("text/plain").split(":");
    if (draggedKind !== kind || !draggedId || draggedId === targetId) {
      finishDrag();
      return;
    }

    updateMatrix((current) => ({
      ...current,
      criteria:
        kind === "criterion"
          ? reorder(current.criteria, draggedId, targetId, (criterion) => criterion.id)
          : current.criteria,
      levels:
        kind === "level"
          ? reorder(current.levels, draggedId, targetId, (level) => level.id)
          : current.levels,
    }));
    finishDrag();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Criteria &amp; Levels</h3>
          <p className="text-sm text-muted-foreground">
            Define what is assessed and describe performance at each level. Drag rows or level
            headers to reorder them.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
            <Plus />
            Add criterion
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addLevel}>
            <Plus />
            Add level
          </Button>
        </div>
      </div>

      <div className="overflow-auto rounded-md border">
        <table className="w-full min-w-[1120px] table-fixed text-sm">
          <thead>
            <tr className="border-b bg-muted/30 align-top">
              <th className="sticky left-0 z-20 w-[240px] min-w-[240px] bg-muted/30 p-3 text-left font-medium text-muted-foreground">
                Criteria
              </th>
              {matrix.levels.map((level, index) => {
                const levelError = getLevelError(level, matrix.levels, index, scored);
                const isDropTarget = dropTarget?.kind === "level" && dropTarget.id === level.id;
                return (
                  <th
                    key={level.id}
                    className={cn(
                      "w-[220px] min-w-[220px] p-3 text-left align-top font-medium text-muted-foreground transition-colors",
                      isDropTarget && "bg-primary/10",
                    )}
                    onDragOver={(event) => {
                      if (dragState?.kind === "level") {
                        event.preventDefault();
                        setDropTarget({ kind: "level", id: level.id });
                      }
                    }}
                    onDrop={(event) => dropOn(event, "level", level.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          draggable
                          aria-label={`Drag ${level.name || "level"}`}
                          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
                          onDragStart={(event) => startDrag(event, "level", level.id)}
                          onDragEnd={finishDrag}
                        >
                          <GripVertical className="size-4" />
                        </button>
                        <Input
                          value={level.name}
                          aria-label={`Level ${index + 1} name`}
                          aria-invalid={!level.name.trim()}
                          className={cn(
                            "h-8 bg-background text-sm",
                            !level.name.trim() && "border-destructive",
                          )}
                          onChange={(event) => updateLevel(level.id, { name: event.target.value })}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${level.name || "level"}`}
                          disabled={matrix.levels.length <= 2}
                          onClick={() => removeLevel(level.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      {scored && (
                        <LevelPointsEditor
                          points={level.points ?? defaultPoints(index)}
                          hasError={Boolean(levelError)}
                          onChange={(points) => updateLevel(level.id, { points })}
                        />
                      )}
                      {levelError && (
                        <p className="text-xs font-normal text-destructive">{levelError}</p>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.criteria.map((criterion) => {
              const criterionError = getCriterionError(criterion, scored);
              const isDropTarget =
                dropTarget?.kind === "criterion" && dropTarget.id === criterion.id;
              return (
                <tr
                  key={criterion.id}
                  className={cn(
                    "border-b align-top last:border-0",
                    isDropTarget && "bg-primary/10",
                  )}
                  onDragOver={(event) => {
                    if (dragState?.kind === "criterion") {
                      event.preventDefault();
                      setDropTarget({ kind: "criterion", id: criterion.id });
                    }
                  }}
                  onDrop={(event) => dropOn(event, "criterion", criterion.id)}
                >
                  <td className="sticky left-0 z-10 bg-card p-3 align-top">
                    <div className="flex items-start gap-1">
                      <button
                        type="button"
                        draggable
                        aria-label={`Drag ${criterion.name || "criterion"}`}
                        className="mt-1 cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
                        onDragStart={(event) => startDrag(event, "criterion", criterion.id)}
                        onDragEnd={finishDrag}
                      >
                        <GripVertical className="size-4" />
                      </button>
                      <div className="min-w-0 flex-1 space-y-2">
                        <Input
                          value={criterion.name}
                          aria-label="Criterion name"
                          aria-invalid={Boolean(criterionError)}
                          className={cn(
                            "h-8 bg-background text-sm",
                            criterionError && "border-destructive",
                          )}
                          onChange={(event) =>
                            updateCriterion(criterion.id, { name: event.target.value })
                          }
                        />
                        {scored && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Weight</span>
                            <Input
                              type="number"
                              min="0"
                              step="any"
                              value={criterion.weight ?? ""}
                              aria-label={`${criterion.name || "Criterion"} weight`}
                              aria-invalid={Boolean(criterionError && criterion.name.trim())}
                              className={cn(
                                "h-8 bg-background text-sm",
                                criterionError && criterion.name.trim() && "border-destructive",
                              )}
                              onChange={(event) =>
                                updateCriterion(criterion.id, {
                                  weight: parseNumber(event.target.value),
                                })
                              }
                            />
                          </div>
                        )}
                        {criterionError && (
                          <p className="text-xs text-destructive">{criterionError}</p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${criterion.name || "criterion"}`}
                        disabled={matrix.criteria.length <= 1}
                        onClick={() => removeCriterion(criterion.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </td>
                  {matrix.levels.map((level) => {
                    const description = matrix.descriptions[criterion.id]?.[level.id] ?? "";
                    return (
                      <td key={level.id} className="p-3 align-top">
                        <Textarea
                          rows={4}
                          value={description}
                          placeholder="Describe this performance level..."
                          aria-label={`${criterion.name || "Criterion"} at ${level.name || "level"}`}
                          aria-invalid={!description.trim()}
                          className={cn(
                            "min-h-24 resize-y bg-background text-sm",
                            !description.trim() && "border-destructive",
                          )}
                          onChange={(event) =>
                            updateDescription(criterion.id, level.id, event.target.value)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div
        className={cn(
          "rounded-md border px-3 py-2 text-sm",
          errors.length > 0
            ? "border-warning/50 bg-warning/10 text-warning-foreground"
            : "border-success/50 bg-success/10 text-success",
        )}
      >
        {errors.length > 0 ? (
          <p>
            {errors.length} validation {errors.length === 1 ? "issue" : "issues"} will need
            attention before publishing.
          </p>
        ) : (
          <p>All criteria, levels, points, and descriptions are ready for review.</p>
        )}
      </div>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.kind === "criterion"
                ? "Delete criterion?"
                : "Delete level?"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.kind === "criterion"
                ? `“${pendingDelete.name}” and all of its descriptions across levels will be permanently removed. This action cannot be undone.`
                : pendingDelete?.kind === "level"
                  ? `“${pendingDelete.name}” and its description in every criterion will be permanently removed. This action cannot be undone.`
                  : ""}
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

interface LevelPointsEditorProps {
  points: LevelPoints;
  hasError: boolean;
  onChange: (points: LevelPoints) => void;
}

function LevelPointsEditor({ points, hasError, onChange }: LevelPointsEditorProps) {
  const [rangeOpen, setRangeOpen] = useState(points.type === "range");

  useEffect(() => {
    if (points.type === "range") setRangeOpen(true);
  }, [points.type]);

  const changeType = (type: PointType) => {
    if (type === points.type) return;
    if (type === "single") {
      setRangeOpen(false);
      onChange(singlePoints(points.value ?? points.max ?? points.min));
    } else {
      const value = points.value ?? null;
      setRangeOpen(true);
      onChange(rangePoints(points.min ?? value, points.max ?? value));
    }
  };

  return (
    <div className="space-y-2">
      <Select value={points.type} onValueChange={(value) => changeType(value as PointType)}>
        <SelectTrigger className="h-8 bg-background text-xs" aria-label="Point type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="single">Single point</SelectItem>
          <SelectItem value="range">Point range</SelectItem>
        </SelectContent>
      </Select>
      {points.type === "single" ? (
        <Input
          type="number"
          step="1"
          inputMode="numeric"
          pattern="[0-9]*"
          value={points.value ?? ""}
          aria-label="Point value"
          aria-invalid={hasError}
          className={cn("h-8 bg-background text-sm", hasError && "border-destructive")}
          onChange={(event) => onChange(singlePoints(parseInteger(event.target.value)))}
        />
      ) : (
        <AnimatedRangeInputs
          hasError={hasError}
          min={points.min}
          max={points.max}
          open={rangeOpen}
          onMinChange={(value) => onChange(rangePoints(value, points.max))}
          onMaxChange={(value) => onChange(rangePoints(points.min, value))}
        />
      )}
    </div>
  );
}

interface AnimatedRangeInputsProps {
  hasError: boolean;
  min: number | null;
  max: number | null;
  open: boolean;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

function AnimatedRangeInputs({
  hasError,
  min,
  max,
  open,
  onMinChange,
  onMaxChange,
}: AnimatedRangeInputsProps) {
  if (!open) return null;

  return (
    <div
      data-state="open"
      className="grid grid-cols-2 gap-2 overflow-hidden animate-accordion-down"
    >
      <Input
        type="number"
        step="1"
        inputMode="numeric"
        pattern="[0-9]*"
        value={min ?? ""}
        placeholder="Min"
        aria-label="Minimum points"
        aria-invalid={hasError}
        className={cn("h-8 bg-background text-sm", hasError && "border-destructive")}
        onChange={(event) => onMinChange(parseInteger(event.target.value))}
      />
      <Input
        type="number"
        step="1"
        inputMode="numeric"
        pattern="[0-9]*"
        value={max ?? ""}
        placeholder="Max"
        aria-label="Maximum points"
        aria-invalid={hasError}
        className={cn("h-8 bg-background text-sm", hasError && "border-destructive")}
        onChange={(event) => onMaxChange(parseInteger(event.target.value))}
      />
    </div>
  );
}
