"use client";

/**
 * Direct-grade input for assignments graded without a rubric
 * (document §4.10).
 *
 * Format-aware: numeric input (clamped) for CGPA/Percentage/Marks;
 * select for Comp/Incomplete; select + slider for NamedBand where the
 * active scale supplies the list and band ranges.
 */
import { useEffect, useId, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GradeScale } from "@/features/rubrics/constants";
import { clampDirectGrade, parseNumericDirectGrade, rangeFor, bandsForNamedScale } from "@/features/evaluation/direct-grade";

import type { DirectGradeFormat } from "../types";

interface DirectGradeRowProps {
  format: DirectGradeFormat;
  totalMarks: number | null;
  gradeScale: GradeScale | null;
  value: string;
  locked: boolean;
  onChange: (value: string) => void;
}

interface NamedBandRowProps {
  gradeScale: GradeScale | null;
  value: string;
  locked: boolean;
  onChange: (value: string) => void;
}

/**
 * Dropdown + slider + input combo for letter/perf-style grading.
 *
 * The three controls stay bound together: the slider and input move
 * in lockstep, and any change snaps to a band so the dropdown label
 * is always consistent with the percentage.
 */
function NamedBandRow({ gradeScale, value, locked, onChange }: NamedBandRowProps) {
  const inputId = useId();
  const bands = useMemo(() => bandsForNamedScale(gradeScale), [gradeScale]);
  const ranges = gradeScale?.ranges ?? [];

  const activeBand = bands.includes(value) ? value : null;
  const activeRange = activeBand
    ? ranges.find((r) => r.grade === activeBand) ?? null
    : null;
  // When no band is selected, default the slider to the lowest band's
  // midpoint rather than 0 — 0 isn't a meaningful position for any
  // band and the thumb visually anchors somewhere sensible.
  const defaultRange = ranges.length > 0 ? ranges[ranges.length - 1]! : null;
  const bandCenter = activeRange
    ? (activeRange.minMarks + activeRange.maxMarks) / 2
    : defaultRange
      ? (defaultRange.minMarks + defaultRange.maxMarks) / 2
      : 0;

  // Local slider position so the thumb tracks the cursor smoothly while
  // dragging. The band label is only updated on release
  // (`onValueCommit`), which keeps the dropdown label and the input
  // number in sync without snapping the thumb mid-drag.
  const [sliderPos, setSliderPos] = useState<number>(bandCenter);
  // Re-sync when the active band changes externally (e.g. dropdown pick).
  useEffect(() => {
    setSliderPos(bandCenter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBand]);

  const bandForPercent = (pct: number): string | null => {
    const r = ranges.find((b) => pct >= b.minMarks && pct <= b.maxMarks);
    return r?.grade ?? null;
  };

  const handleSliderChange = (values: number[]) => {
    setSliderPos(values[0] ?? 0);
  };

  const handleSliderCommit = (values: number[]) => {
    const pct = values[0] ?? 0;
    const next = bandForPercent(pct);
    if (next && next !== activeBand) onChange(next);
  };

  const handlePercentInput = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "") {
      onChange("");
      return;
    }
    if (!/^\d*\.?\d*$/.test(trimmed)) return;
    const n = Number(trimmed);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(100, Math.max(0, n));
    setSliderPos(clamped);
    const next = bandForPercent(clamped);
    if (next) onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId} className="text-[11px] font-medium text-muted-foreground">
        Grade band
      </Label>
      <Select
        value={activeBand ?? undefined}
        onValueChange={onChange}
        disabled={locked}
      >
        <SelectTrigger id={inputId} className="h-9 w-full text-sm">
          <SelectValue placeholder="Choose Grade" />
        </SelectTrigger>
        <SelectContent>
          {bands.map((b) => (
            <SelectItem key={b} value={b}>
              {b}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {bands.length === 0 ? (
        <p className="text-[11px] text-muted-foreground">
          No bands configured for the active grade scale.
        </p>
      ) : (
        <div className="flex items-center gap-3 pt-1">
          <Slider
            min={0}
            max={100}
            step={0.1}
            value={[sliderPos]}
            onValueChange={handleSliderChange}
            onValueCommit={handleSliderCommit}
            disabled={locked}
            aria-label="Grade band percentage"
            className="flex-1 [&_.bg-transparent]:!bg-primary"
          />
          <Input
            type="text"
            inputMode="decimal"
            value={activeRange ? sliderPos.toFixed(1).replace(/\.0$/, "") : ""}
            onChange={(e) => handlePercentInput(e.target.value)}
            disabled={locked}
            aria-label="Grade percentage"
            className="h-8 w-16 shrink-0 border-border/60 bg-transparent text-center text-sm tabular-nums"
            placeholder="0"
          />
          <span className="shrink-0 text-xs text-muted-foreground">%</span>
        </div>
      )}
    </div>
  );
}

export function DirectGradeRow({
  format,
  totalMarks,
  gradeScale,
  value,
  locked,
  onChange,
}: DirectGradeRowProps) {
  const inputId = useId();

  if (format === "Comp/Incomp") {
    const valid = value === "Complete" || value === "Incomplete" ? value : undefined;
    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-[11px] font-medium text-muted-foreground">
          Result
        </Label>
        <Select value={valid} onValueChange={onChange} disabled={locked}>
          <SelectTrigger id={inputId} className="h-9 w-full text-sm">
            <SelectValue placeholder="Select result" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Complete">Complete</SelectItem>
            <SelectItem value="Incomplete">Incomplete</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (format === "NamedBand" || format.startsWith("gs_")) {
    return (
      <NamedBandRow
        gradeScale={gradeScale}
        value={value}
        locked={locked}
        onChange={onChange}
      />
    );
  }

  const range = rangeFor(format, totalMarks);
  const parsed = parseNumericDirectGrade(value, format, totalMarks);
  const display = value.endsWith(".") ? value : String(parsed.ok ? parsed.value : Number(value) || 0);

  // Format-specific label and unit suffix.
  const formatLabel: Record<Exclude<DirectGradeFormat, "Comp/Incomp" | "NamedBand">, string> = {
    Percentage: "Percentage",
    CGPA: "CGPA",
    Marks: "Marks",
  };
  const unitSuffix =
    format === "Percentage"
      ? "%"
      : format === "CGPA"
        ? "/ 10"
        : `/ ${totalMarks ?? "?"}`;

  return (
    // Inline single-row layout: <label> <input> <unit> all on one line,
    // all rendered at the same `text-base` size so "Percentage" reads
    // as the primary label rather than a sub-text caption.
    <div className="flex max-w-[16rem] items-baseline gap-2 pb-1">
      <Label
        htmlFor={inputId}
        className="shrink-0 text-base font-medium text-foreground"
      >
        {formatLabel[format]}
        {range ? ` (${range.min}–${range.max})` : null}
      </Label>
      <Input
        id={inputId}
        type="text"
        inputMode="decimal"
        value={display}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "" || raw === "0") {
            onChange("0");
            return;
          }
          if (!/^\d*\.?\d*$/.test(raw)) return;
          const cleaned = raw.startsWith("0") && raw[1] !== "." ? raw.replace(/^0+/, "") || "0" : raw;
          if (cleaned.endsWith(".")) {
            onChange(cleaned);
            return;
          }
          const next = Number(cleaned);
          if (!Number.isFinite(next)) return;
          onChange(String(clampDirectGrade(next, format, totalMarks)));
        }}
        disabled={locked}
        className="h-auto flex-1 min-w-0 border-0 border-b-2 border-dashed border-border bg-transparent px-0 py-0 text-base tabular-nums text-center shadow-none focus-visible:border-solid focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      <span className="shrink-0 text-base text-muted-foreground">{unitSuffix}</span>
    </div>
  );
}
