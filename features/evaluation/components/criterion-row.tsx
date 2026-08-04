"use client";

/**
 * Rubric criterion evaluation row — document §4.8.
 *
 * Scored criteria: point slider + numeric input + level dropdown. The
 * slider derives the matching level; typed points are clamped and
 * snapped into the level's valid range. Unscored criteria: just a level
 * dropdown. Manual override disables interaction.
 *
 * Layout: full-width single block per criterion — title on the left,
 * level pill (coloured dot + name + point range) on the right; the
 * slider and numeric input share a row below, with the description
 * underneath. Mirrors the screenshot in §4.8 of the prototype doc.
 */
import { useId, useMemo, useRef, useState } from "react";
import { Award, CheckCircle2, Quote, XCircle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  getEffectivePoints,
  levelIndexInOrder,
} from "@/features/rubrics/evaluation/helpers";
import type { MatrixCriterion, MatrixLevel, RubricMatrix } from "@/types/rubric";

import { cn } from "@/lib/utils";

const NONE = "__none__";

interface CriterionRowProps {
  index: number;
  criterion: MatrixCriterion;
  matrix: RubricMatrix;
  scored: boolean;
  levelId: string;
  points: number | null;
  description?: string;
  minPassLevelId: string | null;
  isLetterGrading: boolean;
  locked: boolean;
  /**
   * Atomic rating setter. Both `levelId` and `points` are applied in a
   * single store update so a partial read of the store can't clobber
   * one with the other's stale value.
   */
  onRatingChange: (levelId: string, points: number | null) => void;
}

function getLevelRange(
  levelId: string,
  matrix: RubricMatrix,
): { min: number; max: number } | null {
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
  const ranges = matrix.levels
    .map((l) => ({ level: l, range: getLevelRange(l.id, matrix) }))
    .filter(
      (x): x is { level: MatrixLevel; range: { min: number; max: number } } =>
        x.range != null,
    );
  for (const { level, range } of ranges) {
    if (value >= range.min && value <= range.max) return level.id;
  }
  const singles = matrix.levels.filter(
    (l) => l.points?.type === "single" && l.points.value === value,
  );
  if (singles.length > 0) return singles[0]!.id;
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

function getScoreBounds(matrix: RubricMatrix): { min: number; max: number } | null {
  const values = matrix.levels.flatMap((level) => {
    if (level.points?.type === "range" && level.points.min != null && level.points.max != null) {
      return [level.points.min, level.points.max];
    }
    if (level.points?.type === "single" && level.points.value != null) {
      return [level.points.value];
    }
    return [];
  });
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}

// Rounds to one decimal place and strips a trailing ".0" so whole
// numbers display as "7" instead of "7.0". Mirroring this back into the
// input mid-edit would otherwise move the caret to the end.
function fmtPoints(n: number): string {
  if (!Number.isFinite(n)) return "";
  const r = Math.round(n * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/**
 * Tailwind classes for the coloured dot rendered next to each level
 * name. Levels are ordered best→worst in the matrix, so a top-down
 * palette (emerald → blue → amber → red) maps roughly to "passing well
 * → passing → borderline → needs work".
 */
const LEVEL_DOT_CLASSES = [
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
] as const;

function levelDotClass(levelIndex: number): string {
  return LEVEL_DOT_CLASSES[levelIndex] ?? "bg-slate-400";
}

/**
 * Render the point range/single value of a level as the muted
 * secondary text inside the level pill (e.g. "9–10 pts" / "4 pts").
 */
function formatLevelPoints(level: MatrixLevel): string | null {
  if (!level.points) return null;
  if (level.points.type === "single") {
    return `${level.points.value} pts`;
  }
  if (level.points.type === "range") {
    const { min, max } = level.points;
    if (min == null || max == null) return null;
    if (min === max) return `${min} pts`;
    return `${min}–${max} pts`;
  }
  return null;
}

export function CriterionRow({
  index,
  criterion,
  matrix,
  scored,
  levelId,
  points,
  description,
  minPassLevelId,
  isLetterGrading,
  locked,
  onRatingChange,
}: CriterionRowProps) {
  const levelSelectId = useId();
  const pointsLabelId = useId();
  // Toggle: first line only (with ellipsis if truncated) ↔ full text.
  const [expanded, setExpanded] = useState(false);
  const selectedLevel = useMemo(
    () => matrix.levels.find((l) => l.id === levelId) ?? null,
    [matrix.levels, levelId],
  );

  // Min-pass is only enforced for letter-grading submissions with pass
  // bands. For other formats (Percentage, CGPA, Marks, Comp/Incomp)
  // the verdict comes from the final score, not the per-criterion
  // min-pass level — so gracefully hide the UI here.
  const minPassApplies = isLetterGrading && Boolean(minPassLevelId);

  const passingState = useMemo(() => {
    if (!minPassApplies || !selectedLevel || !minPassLevelId) return null;
    const selected = levelIndexInOrder(matrix.levels, selectedLevel.id);
    const floor = levelIndexInOrder(matrix.levels, minPassLevelId);
    if (selected < 0 || floor < 0) return null;
    if (selected <= floor) return "pass" as const;
    return "fail" as const;
  }, [minPassLevelId, matrix.levels, selectedLevel]);

  const handleLevelChange = (next: string) => {
    const id = next === NONE ? "" : next;
    const range = getLevelRange(id, matrix);
    const single = !range ? getLevelPointsSingle(id, matrix) : null;
    const currentDefault = selectedLevel ? getEffectivePoints(selectedLevel, points) : null;
    const nextPoints = range ? range.max : single ?? currentDefault ?? null;
    onRatingChange(id, nextPoints);
  };

  const slider = !scored
    ? null
    : (() => {
        const bounds = getScoreBounds(matrix);
        if (!bounds) return null;
        return (
          <PointsSliderInput
            criterionId={criterion.id}
            matrix={matrix}
            levelId={levelId}
            points={points}
            bounds={bounds}
            locked={locked}
            ariaLabelledBy={pointsLabelId}
            onRatingChange={onRatingChange}
          />
        );
      })();

  return (
    <li
      className={cn(
        "space-y-3 py-3 transition-colors first:pt-0 last:pb-0",
        locked && "opacity-60",
      )}
    >
      {/* Title (70%) + rating selector (30%) — same row, two columns */}
      <div className="flex items-baseline gap-x-3 text-sm">
        <h4 className="basis-[70%] font-semibold tracking-tight text-foreground">
          {criterion.name}
        </h4>
        <Label htmlFor={levelSelectId} className="sr-only">
          {criterion.name} rating
        </Label>
        <div className="basis-[30%]">
          <Select
            value={levelId || NONE}
            onValueChange={handleLevelChange}
            disabled={locked}
          >
          <SelectTrigger
            id={levelSelectId}
            className="inline-flex h-auto shrink-0 items-center gap-1 whitespace-nowrap rounded-none border-0 bg-transparent px-0 py-0 text-sm shadow-none ring-offset-0 data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-0 focus-visible:underline focus-visible:underline-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {(() => {
              const idx = matrix.levels.findIndex((l) => l.id === levelId);
              const level = idx >= 0 ? matrix.levels[idx] : null;
              if (!level) {
                return (
                  <span className="flex-1 text-muted-foreground underline-offset-4 hover:underline">
                    Select rating
                  </span>
                );
              }
              return (
                <span className="inline-flex flex-1 items-baseline">
                  <span className="font-bold text-primary">
                    {level.name}
                  </span>
                </span>
              );
            })()}
          </SelectTrigger>
          <SelectContent>
            {matrix.levels.map((level, idx) => {
              const range = formatLevelPoints(level);
              return (
                <SelectItem key={level.id} value={level.id}>
                  <span className="flex items-center gap-2 pr-4">
                    <span className="font-medium">{level.name}</span>
                    {range && (
                      <span className="ml-auto pl-6 text-xs text-muted-foreground">
                        {range}
                      </span>
                    )}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
          </Select>
        </div>
      </div>

      {/* Slider, description, and numeric input share a single container so the rationale reads as part of the same region as the controls. */}
      <div className="space-y-2 rounded-md border border-dashed bg-muted/20 p-2">
        {slider}
        {description && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="group flex w-full items-start gap-2 px-1 text-left text-xs leading-relaxed text-muted-foreground hover:text-foreground"
          >
            <Quote className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span
              className={cn(
                "min-w-0 flex-1 overflow-hidden transition-[max-height] duration-200 ease-out",
                expanded ? "max-h-40" : "max-h-4",
                !expanded && "line-clamp-1",
              )}
            >
              {description}
            </span>
          </button>
        )}
      </div>

      {passingState && (
        <div className="flex items-center gap-2 text-[11px]">
          {passingState === "pass" ? (
            <CheckCircle2 className="size-3.5 text-success" aria-hidden />
          ) : (
            <XCircle className="size-3.5 text-destructive" aria-hidden />
          )}
          <span
            className={cn(
              "font-medium",
              passingState === "pass" ? "text-success" : "text-destructive",
            )}
          >
            {passingState === "pass"
              ? "Meets minimum-pass threshold"
              : "Below minimum-pass — resubmission expected"}
          </span>
        </div>
      )}

      <div id={pointsLabelId} className="sr-only">
        Points for {criterion.name}
      </div>

      {!scored && (
        <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Award className="size-3" aria-hidden />
          Unscored rubric — grade profile rules determine the final grade.
        </p>
      )}
    </li>
  );
}

interface PointsSliderInputProps {
  criterionId: string;
  matrix: RubricMatrix;
  levelId: string;
  points: number | null;
  bounds: { min: number; max: number };
  locked: boolean;
  ariaLabelledBy: string;
  onRatingChange: (levelId: string, points: number | null) => void;
}

/**
 * Paired slider + numeric input for a criterion's points. Implements
 * the spec's two-layer model (`range-slider-logic.md`):
 *   • Live drag and live typing mirror across the two controls
 *     through local state, so neither one is ever stomped by a
 *     store-driven re-render mid-interaction.
 *   • The store is only written on commit: slider pointerup/keyup,
 *     input blur, or Enter on the input.
 *   • The displayed value uses `fmtPoints` so whole numbers render
 *     as "7" instead of "7.0" — trailing zeros would otherwise jump
 *     the caret to the end on every store update.
 */
function PointsSliderInput({
  criterionId,
  matrix,
  levelId,
  points,
  bounds,
  locked,
  ariaLabelledBy,
  onRatingChange,
}: PointsSliderInputProps) {
  const validZones = matrix.levels.flatMap((l) => {
    if (!l.points) return [];
    if (l.points.type === "range" && l.points.min != null && l.points.max != null) {
      return [{ min: l.points.min, max: l.points.max }];
    }
    if (l.points.type === "single" && l.points.value != null) {
      return [{ min: l.points.value, max: l.points.value }];
    }
    return [];
  });
  const [dragPos, setDragPos] = useState<number | null>(null);
  const [typedText, setTypedText] = useState<string | null>(null);
  // Tracks whether the input currently has focus, so a slider drag
  // doesn't overwrite a decimal point the user is mid-keystroke on.
  const inputFocusedRef = useRef(false);
  const sliderValue = dragPos ?? points ?? bounds.min;
  const inputValue =
    typedText ?? (Number.isFinite(points) ? fmtPoints(points ?? 0) : "");
  const commitFromInput = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      // Bad input: fall back to the committed value.
      setTypedText(null);
      setDragPos(null);
      return;
    }
    const clamped = Math.min(bounds.max, Math.max(bounds.min, parsed));
    const nextLevel = getLevelForPoints(clamped, matrix);
    const nextRange = getLevelRange(nextLevel, matrix);
    const nextSingle = !nextRange ? getLevelPointsSingle(nextLevel, matrix) : null;
    let nextPoints = clamped;
    if (nextRange) {
      nextPoints = Math.min(nextRange.max, Math.max(nextRange.min, clamped));
    } else if (nextSingle != null) {
      nextPoints = nextSingle;
    }
    setTypedText(null);
    setDragPos(null);
    onRatingChange(nextLevel, nextPoints);
  };
  return (
    <div className="flex items-center gap-3 rounded-md bg-muted/30 px-2.5 py-2">
      <Slider
        id={`criterion-${criterionId}-slider`}
        min={bounds.min}
        max={bounds.max}
        step={1}
        value={[sliderValue]}
        onValueChange={(values) => {
          const v = values[0] ?? bounds.min;
          const clamped = Math.min(bounds.max, Math.max(bounds.min, v));
          setDragPos(clamped);
          // Mirror the drag position into the input only when the input
          // doesn't own the caret.
          if (!inputFocusedRef.current) {
            setTypedText(fmtPoints(clamped));
          }
        }}
        onValueCommit={(values) => {
          const v = values[0] ?? bounds.min;
          const derived = getLevelForPoints(v, matrix);
          const nextRange = getLevelRange(derived, matrix);
          const nextSingle = !nextRange ? getLevelPointsSingle(derived, matrix) : null;
          let nextPoints = v;
          if (nextRange) {
            nextPoints = Math.min(nextRange.max, Math.max(nextRange.min, v));
          } else if (nextSingle != null) {
            nextPoints = nextSingle;
          }
          setDragPos(null);
          setTypedText(null);
          onRatingChange(derived, nextPoints);
        }}
        aria-labelledby={ariaLabelledBy}
        className="flex-1"
        disabled={locked}
        validZones={validZones}
      />
      <Input
        id={`criterion-${criterionId}-points`}
        type="text"
        inputMode="decimal"
        value={inputValue}
        onFocus={() => {
          inputFocusedRef.current = true;
        }}
        onChange={(e) => {
          const raw = e.target.value;
          // Typing path: mirror live into the slider, but never touch
          // the input's own text — so "7." isn't stomped back to "7".
          setTypedText(raw);
          const parsed = Number(raw);
          if (Number.isFinite(parsed)) {
            const clamped = Math.min(bounds.max, Math.max(bounds.min, parsed));
            setDragPos(clamped);
          }
        }}
        onBlur={(e) => {
          inputFocusedRef.current = false;
          commitFromInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            inputFocusedRef.current = false;
            commitFromInput(e.currentTarget.value);
            e.currentTarget.blur();
          }
        }}
        aria-labelledby={ariaLabelledBy}
        disabled={locked}
        className="h-9 w-14 text-center tabular-nums"
      />
    </div>
  );
}
