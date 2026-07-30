"use client";

/**
 * Direct-grade input for assignments graded without a rubric
 * (document §4.10).
 *
 * Format-aware: numeric input (clamped) for CGPA/Percentage/Marks;
 * select for Comp/Incomplete; select for NamedBand where the active
 * scale supplies the list.
 */
import { useId } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-[11px] font-medium text-muted-foreground">
          Result
        </Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)} disabled={locked}>
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

  if (format === "NamedBand") {
    const bands = bandsForNamedScale(gradeScale);
    return (
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-[11px] font-medium text-muted-foreground">
          Grade band
        </Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)} disabled={locked}>
          <SelectTrigger id={inputId} className="h-9 w-full text-sm">
            <SelectValue placeholder="Select grade band" />
          </SelectTrigger>
          <SelectContent>
            {bands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {bands.length === 0 && (
          <p className="text-[11px] text-muted-foreground">
            No bands configured for the active grade scale.
          </p>
        )}
      </div>
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
