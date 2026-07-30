"use client";

/**
 * Manual override controls — document §4.11.
 *
 * Document §5.8: a valid override replaces the calculated result and
 * must include a reason. The page renders this panel inside the
 * Assessment tab.
 */
import { useId } from "react";
import { AlertTriangle } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { GradeScale } from "@/features/rubrics/constants";
import { bandsForNamedScale, rangeFor } from "@/features/evaluation/direct-grade";

import type { DirectGradeFormat, ManualOverride } from "../types";

interface OverrideControlsProps {
  format: DirectGradeFormat | null;
  totalMarks: number | null;
  gradeScale: GradeScale | null;
  override: ManualOverride;
  onPatch: (patch: Partial<ManualOverride>) => void;
}

export function OverrideControls({
  format,
  totalMarks,
  gradeScale,
  override,
  onPatch,
}: OverrideControlsProps) {
  const switchId = useId();
  const reasonId = useId();

  return (
    <section className="space-y-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
      <header className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <AlertTriangle className="size-4 text-warning" aria-hidden />
            Manual override
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={switchId}
            checked={override.on}
            onCheckedChange={(next) => onPatch({ on: next })}
          />
        </div>
      </header>

      {override.on && (
        <div className="space-y-3">
          <OverrideValueField
            format={format}
            totalMarks={totalMarks}
            gradeScale={gradeScale}
            value={override.value}
            onChange={(next) => onPatch({ value: next })}
          />

          <div className="space-y-1.5">
            <Label htmlFor={reasonId} className="text-[11px] font-medium text-muted-foreground">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id={reasonId}
              value={override.reason}
              onChange={(e) => onPatch({ reason: e.target.value })}
              placeholder="e.g. Adjusted up one band to reflect independent reading on the topic."
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-[10px] text-muted-foreground">
              Shown to the learner when the result is released.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function OverrideValueField({
  format,
  totalMarks,
  gradeScale,
  value,
  onChange,
}: {
  format: DirectGradeFormat | null;
  totalMarks: number | null;
  gradeScale: GradeScale | null;
  value: string;
  onChange: (next: string) => void;
}) {
  const id = useId();
  const label = "Override value";

  // Rubric path → pick a band from the active scale.
  if (!format) {
    const bands = bandsForNamedScale(gradeScale);
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
          {label}
        </Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger id={id} className="h-9 w-full text-sm">
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
      </div>
    );
  }

  if (format === "Comp/Incomp") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
          {label}
        </Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger id={id} className="h-9 w-full text-sm">
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
      <div className="space-y-1.5">
        <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
          {label}
        </Label>
        <Select value={value || "__none__"} onValueChange={(v) => onChange(v === "__none__" ? "" : v)}>
          <SelectTrigger id={id} className="h-9 w-full text-sm">
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
      </div>
    );
  }

  const range = rangeFor(format, totalMarks);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[11px] font-medium text-muted-foreground">
        {label} {range ? `(${range.min}–${range.max})` : null}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-40 tabular-nums text-right"
      />
    </div>
  );
}
