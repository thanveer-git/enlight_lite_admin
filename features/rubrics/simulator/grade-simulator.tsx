"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Beaker,
  BookOpen,
  Calculator,
  CheckCircle2,
  ListChecks,
  RotateCcw,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { GRADE_SCALES, findGradeScale, type GradeScale, type GradeScaleType } from "@/features/rubrics/constants";
import { evaluateRubric, type CriterionRating, type EvaluationResult } from "@/features/rubrics/evaluation";
import type { RubricMatrix, RubricType } from "@/types/rubric";

const NONE_LEVEL = "__none__";
const NONE_SCALE = "__none__";

export interface RubricOption {
  id: string;
  name: string;
  matrix: RubricMatrix;
  rubricType: RubricType;
}

export interface GradeSimulatorProps {
  /** When set, the rubric is locked to this id and the rubric selector is disabled. */
  embeddedRubricId?: string;
  /** Marks this as the current-rubric context when no stable id is available yet. */
  embedded?: boolean;
  /** Required when not embedded: full list of rubrics the user can pick from. */
  rubricOptions?: RubricOption[];
  /** Existing matrix/type/name for the embedded mode. Ignored when `rubricOptions` is provided. */
  matrix?: RubricMatrix;
  rubricType?: RubricType | null;
  rubricName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

interface RatingState {
  [criterionId: string]: CriterionRating;
}

function buildInitialRatings(matrix: RubricMatrix): RatingState {
  const ratings: RatingState = {};
  for (const c of matrix.criteria) {
    ratings[c.id] = { levelId: "" };
  }
  return ratings;
}

function getLevelRange(levelId: string, matrix: RubricMatrix): { min: number; max: number } | null {
  const level = matrix.levels.find((l) => l.id === levelId);
  if (!level?.points || level.points.type !== "range") return null;
  if (level.points.min == null || level.points.max == null) return null;
  return { min: level.points.min, max: level.points.max };
}

function getLevelPointsSingle(levelId: string, matrix: RubricMatrix): number | null {
  const level = matrix.levels.find((l) => l.id === levelId);
  if (!level?.points || level.points.type !== "single") return null;
  return level.points.value;
}

function getLevelForPoints(value: number, matrix: RubricMatrix): string {
  // Prefer range levels that contain the value.
  const ranges = matrix.levels
    .map((l) => ({ level: l, range: getLevelRange(l.id, matrix) }))
    .filter((x): x is { level: typeof x.level; range: { min: number; max: number } } => x.range != null);
  for (const { level, range } of ranges) {
    if (value >= range.min && value <= range.max) return level.id;
  }
  // Fallback to single-point levels.
  const singles = matrix.levels.filter(
    (l) => l.points?.type === "single" && l.points.value === value,
  );
  if (singles.length > 0) return singles[0]!.id;
  // Fallback to closest range.
  if (ranges.length > 0) {
    const closest = ranges.reduce((best, cur) => {
      const bestMid = (best.range.min + best.range.max) / 2;
      const curMid = (cur.range.min + cur.range.max) / 2;
      return Math.abs(value - curMid) < Math.abs(value - bestMid) ? cur : best;
    });
    return closest.level.id;
  }
  return matrix.levels[0]?.id ?? "";
}

function metricForScale(
  scale: GradeScale | null,
  percentage: number | null,
): { label: string; value: string } | null {
  if (percentage == null) return null;
  const gradeType: GradeScaleType | undefined = scale?.meta?.gradeType;
  if (gradeType === "cgpa") {
    return { label: "CGPA", value: (percentage / 10).toFixed(2) };
  }
  if (gradeType === "marks") {
    return { label: "Marks", value: `${percentage.toFixed(1)}%` };
  }
  if (gradeType === "comp_incomp") {
    const cfg = scale?.configuration;
    const completeMin = cfg?.completeMin ?? 51;
    const completeMax = cfg?.completeMax ?? 100;
    const completeLabel = cfg?.completeLabel ?? "Complete";
    const incompleteLabel = cfg?.incompleteLabel ?? "Incomplete";
    const label = percentage >= completeMin && percentage <= completeMax
      ? completeLabel
      : incompleteLabel;
    return { label: "Status", value: label };
  }
  if (gradeType === "letter_grading") {
    const ranges = scale?.ranges ?? [];
    const sorted = [...ranges].sort((a, b) => b.minMarks - a.minMarks);
    const band = sorted.find((b) => percentage >= b.minMarks && percentage <= b.maxMarks);
    return band ? { label: "Grade", value: band.grade } : { label: "Grade", value: "—" };
  }
  return { label: "Percentage", value: `${percentage.toFixed(1)}%` };
}

function getScoreBounds(matrix: RubricMatrix): { min: number; max: number } | null {
  const values = matrix.levels.flatMap((level) => {
    if (level.points?.type === "range" && level.points.min != null && level.points.max != null) {
      return [level.points.min, level.points.max];
    }
    if (level.points?.type === "single" && level.points.value != null) return [level.points.value];
    return [];
  });
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

const SLIDER_TRACK_COLOR = "#334155";

function buildSliderSegments(
  matrix: RubricMatrix,
  bounds: { min: number; max: number } | null,
  _selectedLevelId: string,
) {
  if (!bounds || bounds.max <= bounds.min) return [];

  return matrix.levels
    .map((level) => {
      const range = getLevelRange(level.id, matrix);
      const single = getLevelPointsSingle(level.id, matrix);
      const from = range?.min ?? single;
      const to = range?.max ?? single;
      if (from == null || to == null || to <= from) return null;
      const clampedFrom = Math.max(bounds.min, from);
      const clampedTo = Math.min(bounds.max, to);
      if (clampedTo <= clampedFrom) return null;
      return {
        from: clampedFrom,
        to: clampedTo,
        label: level.name,
      };
    })
    .filter((s): s is { from: number; to: number; label: string } => s != null)
    .map((seg) => ({
      ...seg,
      color: SLIDER_TRACK_COLOR,
    }));
}

function getWeightedContribution(
  weightedPoints: number | null | undefined,
  weightedMax: number | null | undefined,
  weight: number | null | undefined,
): { earned: number; possible: number } | null {
  if (weightedPoints == null || weightedMax == null || weight == null || weight <= 0) {
    return null;
  }

  const rubricMaximumPoints = weightedMax / weight;
  if (rubricMaximumPoints <= 0) return null;

  return {
    earned: weightedPoints / rubricMaximumPoints,
    possible: weight,
  };
}

function getWeightedTotal(result: EvaluationResult): { earned: number; possible: number } | null {
  let earned = 0;
  let possible = 0;
  let hasContribution = false;

  for (const criterion of result.criteria) {
    const contribution = getWeightedContribution(
      criterion.weightedPoints,
      criterion.weightedMax,
      criterion.weight,
    );
    if (!contribution) continue;
    earned += contribution.earned;
    possible += contribution.possible;
    hasContribution = true;
  }

  return hasContribution ? { earned, possible } : null;
}

export function GradeSimulator({
  embeddedRubricId,
  embedded = false,
  rubricOptions,
  matrix: embeddedMatrix,
  rubricType: embeddedRubricType,
  rubricName: embeddedRubricName,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: GradeSimulatorProps) {
  const isEmbedded = embedded || Boolean(embeddedRubricId);

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [selectedRubricId, setSelectedRubricId] = useState<string>(
    embeddedRubricId ?? (embedded ? "__current_rubric__" : rubricOptions?.[0]?.id ?? ""),
  );

  // Keep selected rubric in sync with embeddedRubricId.
  useEffect(() => {
    if (embeddedRubricId) setSelectedRubricId(embeddedRubricId);
  }, [embeddedRubricId]);

  const activeRubric: RubricOption | null = useMemo(() => {
    if (isEmbedded) {
      return embeddedMatrix
        ? {
            id: embeddedRubricId!,
            name: embeddedRubricName ?? "",
            matrix: embeddedMatrix,
            rubricType: (embeddedRubricType ?? "scored") as RubricType,
          }
        : null;
    }
    return rubricOptions?.find((r) => r.id === selectedRubricId) ?? null;
  }, [isEmbedded, embeddedRubricId, embeddedMatrix, embeddedRubricName, embeddedRubricType, rubricOptions, selectedRubricId]);

  const matrix: RubricMatrix = activeRubric?.matrix ?? {
    criteria: [],
    levels: [],
    descriptions: {},
    gradingMethod: "weighted_average",
    profileRules: [],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: null,
  };
  const rubricName = activeRubric?.name ?? embeddedRubricName ?? "";
  const rubricType = activeRubric?.rubricType ?? embeddedRubricType ?? null;

  const [ratings, setRatings] = useState<RatingState>(() => buildInitialRatings(matrix));

  const suggestedScaleId = matrix.suggestedScaleId ?? "";
  const [selectedScaleId, setSelectedScaleId] = useState<string>(suggestedScaleId);

  // When the active rubric changes, reset ratings and align the scale to its suggested scale.
  useEffect(() => {
    setRatings(buildInitialRatings(matrix));
    setSelectedScaleId(matrix.suggestedScaleId ?? "");
  }, [matrix]);

  const resolvedScaleId = selectedScaleId || suggestedScaleId || "";
  const selectedScale: GradeScale | null = findGradeScale(resolvedScaleId);
  const scored = rubricType === "scored";

  const result: EvaluationResult = useMemo(() => {
    return evaluateRubric({
      rubric: matrix,
      rubricType: rubricType ?? "scored",
      ratings,
      gradeScale: selectedScale,
    });
  }, [matrix, rubricType, ratings, selectedScale]);

  const allRated = matrix.criteria.every((c) => ratings[c.id]?.levelId);

  const setLevel = (criterionId: string, levelId: string) => {
    setRatings((prev) => {
      const nextLevel = levelId === NONE_LEVEL ? "" : levelId;
      const range = getLevelRange(nextLevel, matrix);
      const single = !range ? getLevelPointsSingle(nextLevel, matrix) : null;
      return {
        ...prev,
        [criterionId]: {
          levelId: nextLevel,
          points: range ? range.max : single ?? prev[criterionId]?.points ?? null,
        },
      };
    });
  };

  const setPoints = (criterionId: string, value: number) => {
    setRatings((prev) => {
      const current = prev[criterionId];
      if (!current) return prev;
      if (!Number.isFinite(value)) return prev;
      const bounds = getScoreBounds(matrix);
      const clamped = bounds ? Math.min(bounds.max, Math.max(bounds.min, value)) : value;
      const nextLevelId = getLevelForPoints(clamped, matrix);
      const nextRange = getLevelRange(nextLevelId, matrix);
      const nextSingle = !nextRange ? getLevelPointsSingle(nextLevelId, matrix) : null;
      let nextPoints: number | null = clamped;
      if (nextRange) {
        nextPoints = Math.min(nextRange.max, Math.max(nextRange.min, clamped));
      } else if (nextSingle != null) {
        nextPoints = nextSingle;
      }
      return {
        ...prev,
        [criterionId]: { levelId: nextLevelId, points: nextPoints },
      };
    });
  };

  const lastOpenRef = useRef(open);
  useEffect(() => {
    const wasOpen = lastOpenRef.current;
    lastOpenRef.current = open;
    if (open && !wasOpen) {
      setRatings(buildInitialRatings(matrix));
      setSelectedScaleId(matrix.suggestedScaleId ?? "");
      setPhase("configure");
    }
  }, [open, matrix]);

  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next);
    controlledOnOpenChange?.(next);
  };

  const resetRatings = () => {
    setRatings(buildInitialRatings(matrix));
    setSelectedScaleId(matrix.suggestedScaleId ?? "");
    setPhase("configure");
  };

  const noCriteria = matrix.criteria.length === 0;
  const noLevels = matrix.levels.length === 0;
  const canSeeResult = allRated && !noCriteria && !noLevels && Boolean(resolvedScaleId);

  const [phase, setPhase] = useState<"configure" | "results">("configure");

  const handleSeeResult = () => {
    if (!canSeeResult) return;
    setPhase("results");
  };

  const handleBackToConfigure = () => {
    setPhase("configure");
  };

  const suggestedScale = findGradeScale(suggestedScaleId);

  const dialogContent = (
    <DialogContent className="max-w-3xl w-[min(94vw,720px)] max-h-[90vh] gap-0 overflow-hidden p-0 sm:rounded-xl">
      <DialogHeader className="flex-row items-center gap-3 border-b bg-gradient-to-br from-muted/40 to-muted/10 px-4 py-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-soft">
          <Beaker className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-0.5">
          <DialogTitle className="text-sm font-semibold tracking-tight">
            Grade Simulator
          </DialogTitle>
          <DialogDescription className="text-[11px] text-muted-foreground">
            Configure ratings and run a live calculation against the selected scale.
          </DialogDescription>
        </div>
      </DialogHeader>

      <div className="grid max-h-[calc(85vh-8.5rem)] grid-cols-1 overflow-y-auto">
        <section className="flex min-h-0 flex-col">
          <div className="space-y-3 px-4 py-3">
            {phase === "configure" ? (
              <>
                <ConfigBlock
                  matrix={matrix}
                  embeddedMatrix={isEmbedded ? matrix : undefined}
                  rubricOptions={rubricOptions}
                  isEmbedded={isEmbedded}
                  selectedRubricId={selectedRubricId}
                  onSelectRubric={setSelectedRubricId}
                  currentRubricId={selectedRubricId}
                  currentRubricName={rubricName}
                  selectedScaleId={selectedScaleId}
                  onSelectScale={setSelectedScaleId}
                />

                <Separator />

                <header className="flex items-baseline justify-between gap-3">
                  <div className="space-y-0.5">
                    <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
                      <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
                        2
                      </span>
                      Criteria Ratings
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {matrix.criteria.length} {matrix.criteria.length === 1 ? "criterion" : "criteria"} ·
                      {" "}
                      {matrix.levels.length} {matrix.levels.length === 1 ? "level" : "levels"}
                    </p>
                  </div>
                  <span
                    className={
                      canSeeResult
                        ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    }
                  >
                    <span
                      className={
                        canSeeResult
                          ? "size-1.5 rounded-full bg-emerald-500"
                          : "size-1.5 rounded-full bg-muted-foreground/60"
                      }
                    />
                    {canSeeResult ? "All rated" : `${Object.values(ratings).filter((r) => r.levelId).length}/${matrix.criteria.length} rated`}
                  </span>
                </header>

                {noCriteria && (
                  <EmptyHint
                    title="No criteria yet"
                    description="Add at least one criterion to run the simulator."
                  />
                )}

                {!noCriteria && noLevels && (
                  <EmptyHint
                    title="No performance levels"
                    description="Add at least one performance level to run the simulator."
                  />
                )}

                {!noCriteria && !noLevels && (
                  <ol className="space-y-2">
                    {matrix.criteria.map((criterion, idx) => {
                      const current = ratings[criterion.id];
                      const selectedLevelId = current?.levelId ?? "";
                      const range = getLevelRange(selectedLevelId, matrix);
                      const showPointsInput =
                        scored && (range != null || getLevelPointsSingle(selectedLevelId, matrix) != null);
                      const scoreBounds = getScoreBounds(matrix);
                      const sliderMin = scoreBounds?.min ?? 0;
                      const sliderMax = scoreBounds?.max ?? 0;
                      const sliderValue = current?.points ?? sliderMin;
                      const step = 0.1;
                      const sliderSegments = buildSliderSegments(matrix, scoreBounds, selectedLevelId);
                      return (
                        <li
                          key={criterion.id}
                          className="group relative overflow-hidden rounded-lg border bg-card p-3 shadow-soft transition-all hover:border-primary/40"
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold text-primary">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-3">
                                <h4 className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-foreground">
                                  {criterion.name}
                                </h4>
                                <Select
                                  value={selectedLevelId || NONE_LEVEL}
                                  onValueChange={(v) => setLevel(criterion.id, v)}
                                >
                                  <SelectTrigger
                                    aria-label={`${criterion.name} rating`}
                                    className="h-9 min-w-[160px] flex-1 text-[13px] sm:max-w-[240px]"
                                  >
                                    <SelectValue placeholder="Select rating" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {matrix.levels.map((level) => (
                                      <SelectItem key={level.id} value={level.id}>
                                        {level.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {scored && criterion.weight != null && (
                                  <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground tabular-nums">
                                    weight {criterion.weight}
                                  </span>
                                )}
                              </div>

                              {showPointsInput && (
                                <div className="animate-accordion-down overflow-hidden">
                                  <div className="flex items-center gap-3 rounded-md bg-muted/30 px-2.5 py-2">
                                    <Slider
                                      id={`sim-points-${criterion.id}`}
                                      min={sliderMin}
                                      max={sliderMax}
                                      step={step}
                                      value={[sliderValue]}
                                      onValueChange={(values) =>
                                        setPoints(criterion.id, values[0] ?? sliderMin)
                                      }
                                      aria-label={`${criterion.name} points`}
                                      className="flex-1 [&_.bg-muted]:!bg-slate-300 dark:[&_.bg-muted]:!bg-slate-600 [&_.bg-transparent]:!bg-black"
                                    />
                                    <span className="w-12 shrink-0 text-right text-[12px] font-semibold tabular-nums text-foreground">
                                      {(sliderValue ?? 0).toFixed(range ? 1 : 0)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </>
            ) : (
              <ResultsView
                result={result}
                matrix={matrix}
                ratings={ratings}
                scale={selectedScale}
                scored={scored}
                rubricType={rubricType ?? "scored"}
                rubricName={rubricName}
              />
            )}
          </div>

          </section>
      </div>

      <DialogFooter className="flex-row items-center gap-3 border-t bg-muted/30 px-4 py-2.5">
        {phase === "configure" ? (
          <div className="flex w-full items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetRatings}
              className="h-9 w-1/2 gap-2 border-dashed"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canSeeResult}
              onClick={handleSeeResult}
              className="group relative h-9 w-1/2 overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-md hover:shadow-violet-500/30 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                See Result
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Button>
          </div>
        ) : (
          <div className="flex w-full items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetRatings}
              className="group h-10 w-1/2 gap-2 border-dashed"
            >
              <RotateCcw className="size-3.5" />
              Reset
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBackToConfigure}
              className="group relative h-9 w-1/2 overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-indigo-500 hover:shadow-md hover:shadow-violet-500/30 active:scale-[0.98]"
            >
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                Back to Step 1
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              </span>
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            </Button>
          </div>
        )}
      </DialogFooter>
    </DialogContent>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
      }}
    >
      {showTrigger ? (
        <DialogTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Beaker className="mr-1.5 size-4" />
            Run simulator
          </Button>
        </DialogTrigger>
      ) : null}
      {dialogContent}
    </Dialog>
  );
}

function ConfigBlock({
  matrix,
  embeddedMatrix,
  rubricOptions,
  isEmbedded,
  selectedRubricId,
  onSelectRubric,
  currentRubricId,
  currentRubricName,
  selectedScaleId,
  onSelectScale,
}: {
  matrix: RubricMatrix;
  embeddedMatrix?: RubricMatrix | undefined;
  rubricOptions?: RubricOption[];
  isEmbedded: boolean;
  selectedRubricId: string;
  onSelectRubric: (id: string) => void;
  currentRubricId: string;
  currentRubricName: string;
  selectedScaleId: string;
  onSelectScale: (id: string) => void;
}) {
  const embeddedOption: RubricOption | null =
    isEmbedded && embeddedMatrix
      ? {
          id: currentRubricId,
          name: currentRubricName || "Current rubric",
          matrix: embeddedMatrix,
          rubricType: "scored",
        }
      : null;
  const effectiveOptions: RubricOption[] = embeddedOption
    ? [embeddedOption, ...(rubricOptions ?? [])]
    : (rubricOptions ?? []);
  const rubricValue = isEmbedded
    ? embeddedOption?.id ?? currentRubricId
    : selectedRubricId;

  return (
    <div className="space-y-3">
      <header className="space-y-0.5">
        <h3 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight">
          <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-[11px] font-semibold text-primary">
            1
          </span>
          Rubric &amp; Grade Scale
        </h3>
        <p className="text-[11px] text-muted-foreground">
          Pick the rubric and the grade scale used for evaluation.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="sim-rubric" className="text-[11px] font-medium text-muted-foreground">
            Rubric
          </Label>
          <Select
            value={rubricValue}
            onValueChange={(v) => onSelectRubric(v)}
            disabled={isEmbedded}
          >
            <SelectTrigger id="sim-rubric" className="h-9 w-full text-[13px]">
              <SelectValue placeholder="Current rubric" />
            </SelectTrigger>
            <SelectContent>
              {effectiveOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label className="text-[11px] font-medium text-muted-foreground">
            Grade Scale
          </Label>
          <Select
            value={selectedScaleId || NONE_SCALE}
            onValueChange={(v) => onSelectScale(v === NONE_SCALE ? "" : v)}
          >
            <SelectTrigger
              aria-label="Grade scale"
              className="h-9 w-full text-[13px]"
            >
              <SelectValue placeholder="Select grade scale" />
            </SelectTrigger>
            <SelectContent>
              {GRADE_SCALES.map((scale) => (
                <SelectItem key={scale.id} value={scale.id}>
                  {scale.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/20 p-5 text-center">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function HeroHeaderCard({
  icon: Icon,
  iconClass,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  iconClass: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-muted/20 px-2.5 py-1.5"
      title={value}
    >
      <div className={`flex size-7 shrink-0 items-center justify-center rounded-md ${iconClass}`}>
        <Icon className="size-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-[12px] font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function ResultHero({
  result,
  rubricType,
  rubricName,
  gradingMethod,
  scale,
}: {
  result: EvaluationResult;
  rubricType: RubricType;
  rubricName: string;
  gradingMethod: "weighted_average" | "grade_profile";
  scale: GradeScale | null;
}) {
  const gradeDisplay = result.finalGrade ?? "—";
  const isPass = result.passFail === "pass";
  const isFail = result.passFail === "fail";
  const weightedTotal = getWeightedTotal(result);
  const metric = metricForScale(scale, result.percentage);
  const scaleName = scale?.name ?? "";
  const primaryDisplay =
    metric && metric.label !== "Grade" ? metric.value : gradeDisplay;
  const secondaryDisplay =
    metric && metric.label !== "Grade"
      ? `Percentage: ${result.percentage?.toFixed(1)}%`
      : metric?.label === "Grade" && metric.value !== "—"
        ? `Percentage: ${result.percentage?.toFixed(1)}%`
        : null;

  const methodLabel = gradingMethod === "weighted_average" ? "Weighted avg" : "Grade profile";
  const typeLabel = rubricType === "scored" ? "Scored" : "Unscored";
  const resultLabel = isPass ? "Pass" : isFail ? "Fail" : "—";

  const gradeColorClass =
    gradeDisplay === "—"
      ? "text-muted-foreground"
      : isPass
        ? "text-emerald-600 dark:text-emerald-400"
        : isFail
          ? "text-rose-600 dark:text-rose-400"
          : "text-foreground";

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card shadow-soft">
      <div className="relative grid gap-3 p-3 lg:grid-cols-[7fr_3fr]">
        {/* Part 1: 70% - three rows of info */}
        <div className="flex min-w-0 flex-col gap-1.5">
          {/* Row 1: Rubric name (full width) */}
          <HeroHeaderCard
            icon={BookOpen}
            iconClass="bg-primary/10 text-primary"
            label="Rubric name"
            value={rubricName || "Untitled rubric"}
          />

          {/* Row 2: Rubric type + Grading method + Result */}
          <div className="flex gap-2">
            <HeroHeaderCard
              icon={Award}
              iconClass="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              label="Rubric type"
              value={typeLabel}
            />
            <HeroHeaderCard
              icon={BarChart3}
              iconClass="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
              label="Grading method"
              value={methodLabel}
            />
            <HeroHeaderCard
              icon={isPass ? CheckCircle2 : isFail ? XCircle : Calculator}
              iconClass={
                isPass
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : isFail
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
                    : "bg-muted text-muted-foreground"
              }
              label="Status"
              value={resultLabel}
            />
          </div>

          {/* Row 3 removed - chips moved elsewhere */}
        </div>

        {/* Part 2: 30% - Overall Grade */}
        <div className="relative flex min-w-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-lg border bg-muted/10 p-2.5">
          <WaterFill
            percentage={result.percentage}
            tone={isPass ? "pass" : isFail ? "fail" : "neutral"}
          />
          <div className="relative z-10 flex flex-col items-center gap-1">
            <div className={`text-center text-3xl font-semibold leading-none tracking-tight tabular-nums ${gradeColorClass}`}>
              {primaryDisplay}
            </div>
            {metric && metric.label !== "Status" && (
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {metric.label}
              </div>
            )}
          </div>
        </div>

        {result.minPassOverride && (
          <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px]">
            <span className="font-semibold text-foreground">Min-pass override:</span>{" "}
            grade forced to{" "}
            <span className="font-semibold">{result.minPassOverride.band.grade}</span> and
            resubmission is open.
          </div>
        )}

        {result.requiresManualOverride && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
            Manual override required. The engine could not produce a final grade from the current
            inputs.
          </div>
        )}
      </div>
    </div>
  );
}

function WaterFill({
  percentage,
  tone,
}: {
  percentage: number | null;
  tone: "pass" | "fail" | "neutral";
}) {
  const clamped = percentage == null ? 0 : Math.min(100, Math.max(0, percentage));
  if (percentage == null) return null;

  const waterClass =
    tone === "pass"
      ? "fill-emerald-500/15"
      : tone === "fail"
        ? "fill-rose-500/15"
        : "fill-muted-foreground/10";
  const fullWaterClass =
    tone === "pass"
      ? "bg-emerald-500/15"
      : tone === "fail"
        ? "bg-rose-500/15"
        : "bg-muted-foreground/10";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 overflow-visible"
      style={{ height: `${clamped}%` }}
    >
      {clamped === 100 ? (
        <div className={`absolute inset-0 ${fullWaterClass}`} />
      ) : (
        <svg
          className="absolute -top-3 left-0 h-[calc(100%+0.75rem)] w-full"
          viewBox="0 0 240 100"
          preserveAspectRatio="none"
        >
          <path
            className={waterClass}
            d="M0 12 C20 2 40 2 60 12 S100 22 120 12 S160 2 180 12 S220 22 240 12 V100 H0 Z"
          />
        </svg>
      )}
    </div>
  );
}

function CalculationSteps({ result }: { result: EvaluationResult }) {
  if (result.explanation.length === 0) return null;
  return (
    <div className="rounded-lg border bg-card p-3 shadow-soft">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        How this was calculated
      </h4>
      <ol className="mt-2 space-y-1.5 text-[12px] leading-snug text-foreground">
        {result.explanation.map((step, idx) => (
          <li key={idx} className="flex gap-2">
            <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
              {idx + 1}
            </span>
            <span className="flex-1">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function MatrixTable({
  matrix,
  ratings,
  result,
  scored,
}: {
  matrix: RubricMatrix;
  ratings: RatingState;
  result: EvaluationResult;
  scored: boolean;
}) {
  const weightedTotal = getWeightedTotal(result);
  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-soft">
      <div className="border-b bg-muted/30 px-3 py-2">
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Rubric Matrix
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b bg-muted/10 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 align-bottom">Criterion</th>
              <th className="px-2 py-2 align-bottom">Level</th>
              <th className="px-2 py-2 align-bottom text-right">Points</th>
              {scored && <th className="px-2 py-2 align-bottom text-right">Total</th>}
            </tr>
          </thead>
          <tbody>
            {matrix.criteria.map((criterion, idx) => {
              const r = ratings[criterion.id];
              const level = matrix.levels.find((l) => l.id === r?.levelId) ?? null;
              const evalRow = result.criteria.find((c) => c.criterionId === criterion.id);
              const weightedPoints = evalRow?.weightedPoints;
              const weightedMax = evalRow?.weightedMax;
              const weightedContribution = getWeightedContribution(
                weightedPoints,
                weightedMax,
                criterion.weight,
              );
              return (
                <tr
                  key={criterion.id}
                  className={
                    idx % 2 === 0
                      ? "border-b last:border-b-0"
                      : "border-b bg-muted/5 last:border-b-0"
                  }
                >
                  <td className="max-w-[220px] px-3 py-2 align-top">
                    <div className="font-medium text-foreground">{criterion.name}</div>
                    {scored && criterion.weight != null && (
                      <div className="mt-0.5 text-[10px] text-muted-foreground tabular-nums">
                        weight {criterion.weight}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2 align-top">
                    <span className="inline-flex rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      {level?.name ?? "—"}
                    </span>
                  </td>
                  <td className="px-2 py-2 align-top text-right tabular-nums">
                    {evalRow?.points != null ? evalRow.points.toFixed(1) : "—"}
                  </td>
                  {scored && (
                    <td className="px-2 py-2 align-top text-right tabular-nums">
                      {weightedContribution
                        ? `${weightedContribution.earned.toFixed(1)} / ${weightedContribution.possible.toFixed(1)}`
                        : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary/20 bg-primary/5">
              <td
                colSpan={scored ? 3 : 3}
                className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-foreground"
              >
                Total
              </td>
              {scored && (
                <td className="px-2 py-2 text-right text-[12px] font-semibold tabular-nums text-foreground">
                  {weightedTotal
                    ? `${weightedTotal.earned.toFixed(1)} / ${weightedTotal.possible.toFixed(1)}`
                    : "—"}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ResultsView({
  result,
  matrix,
  ratings,
  scale,
  scored,
  rubricType,
  rubricName,
}: {
  result: EvaluationResult;
  matrix: RubricMatrix;
  ratings: RatingState;
  scale: GradeScale | null;
  scored: boolean;
  rubricType: RubricType;
  rubricName: string;
}) {
  return (
    <div className="space-y-3">
      <ResultHero
        result={result}
        rubricType={rubricType}
        rubricName={rubricName}
        gradingMethod={matrix.gradingMethod}
        scale={scale}
      />

      <CalculationSteps result={result} />

      <MatrixTable matrix={matrix} ratings={ratings} result={result} scored={scored} />
    </div>
  );
}
