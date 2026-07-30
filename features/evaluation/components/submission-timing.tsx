"use client";

/**
 * Submission timing chip.
 *
 * Renders the submission date as the primary line and a status-style
 * chip below it. The chip's palette mirrors the `Status` column:
 *   - early + on time → success-tinted background, success-tinted text
 *     (green)
 *   - late → destructive-tinted background, destructive-tinted text (red)
 *
 * Used by the list table's Submission Date column. The dense mode
 * keeps the cell compact while preserving the chip shape.
 */
import { differenceInMinutes, format } from "date-fns";

import { cn } from "@/lib/utils";

export type SubmissionTiming = "early" | "onTime" | "late";

interface SubmissionTimingProps {
  submittedAt: string;
  dueAt: string;
  /** Optional compact mode for the list table. */
  dense?: boolean;
}

export interface SubmissionTimingResult {
  state: SubmissionTiming;
  /** Human-readable duration phrase, e.g. "2h" or "1d 3h". */
  label: string;
}

export function computeSubmissionTiming(
  submittedAt: string,
  dueAt: string,
): SubmissionTimingResult {
  const submitted = new Date(submittedAt);
  const due = new Date(dueAt);
  const diffMin = differenceInMinutes(submitted, due);

  if (diffMin <= 0) {
    if (diffMin <= -60) {
      return { state: "early", label: formatLead(-diffMin) };
    }
    return { state: "onTime", label: "" };
  }

  return { state: "late", label: formatLead(diffMin) };
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const days = Math.floor(minutes / (60 * 24));
  const remHr = Math.floor((minutes - days * 60 * 24) / 60);
  return remHr === 0 ? `${days}d` : `${days}d ${remHr}h`;
}

export function SubmissionTimingChip({
  submittedAt,
  dueAt,
  dense = false,
}: SubmissionTimingProps) {
  const result = computeSubmissionTiming(submittedAt, dueAt);
  const isLate = result.state === "late";
  const tone = isLate
    ? "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20"
    : "bg-success/10 text-success ring-1 ring-inset ring-success/20";

  const labelText = (() => {
    if (result.state === "onTime") return "On time";
    if (result.state === "early") return result.label ? `${result.label} early` : "Early";
    return result.label ? `${result.label} late` : "Late";
  })();

  return (
    <div className={cn("flex flex-col leading-tight", !dense ? "gap-1.5" : "gap-1")}>
      <span className="text-sm tabular-nums text-foreground">
        {format(new Date(submittedAt), "MMM d, yyyy")}
      </span>
      <span
        className={cn(
          "inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
          tone,
        )}
      >
        {labelText}
      </span>
    </div>
  );
}
