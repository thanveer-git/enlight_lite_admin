"use client";

import { cn } from "@/lib/utils";
import type {
  GradeScale,
  GradeScaleStatus,
  GradeScaleType,
} from "@/features/rubrics/constants";

const gradeTypeChipClass: Record<GradeScaleType, string> = {
  percentage: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  cgpa: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200",
  marks: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  comp_incomp: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200",
  letter_grading: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
};

const gradeTypeLabel: Record<GradeScaleType, string> = {
  percentage: "Percentage",
  cgpa: "CGPA",
  marks: "Marks",
  comp_incomp: "Comp/Incomp",
  letter_grading: "Letter",
};

export function GradeScaleTypeChip({ type }: { type: GradeScaleType }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        gradeTypeChipClass[type],
      )}
    >
      {gradeTypeLabel[type]}
    </span>
  );
}

const statusChipClass: Record<GradeScaleStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  published: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  in_use: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  archived: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const statusLabel: Record<GradeScaleStatus, string> = {
  draft: "Draft",
  published: "Published",
  in_use: "In Use",
  archived: "Archived",
};

export function GradeScaleStatusChip({ status }: { status: GradeScaleStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusChipClass[status],
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

export function GradeScaleEditabilityChip({
  scale,
}: {
  scale: GradeScale;
}) {
  const editable = scale.meta?.isEditable ?? false;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        editable
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : "bg-zinc-100 text-zinc-600 ring-zinc-200",
      )}
    >
      {editable ? "Editable" : "Built-in"}
    </span>
  );
}

/**
 * Letter-grading scales carry user-defined `passBands` (per-band pass/fail
 * configuration). Built-in formats (Percentage / CGPA / Marks / Comp/Incomp)
 * derive their own pass criteria from the format definition, so they don't
 * count as "Pass/Fail enabled" in this listing's sense.
 */
export function GradeScalePassFailChip({
  scale,
}: {
  scale: GradeScale;
}) {
  const enabled =
    scale.meta?.gradeType === "letter_grading" &&
    Array.isArray(scale.passBands);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        enabled
          ? "bg-sky-50 text-sky-700 ring-sky-200"
          : "bg-zinc-100 text-zinc-600 ring-zinc-200",
      )}
    >
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}
