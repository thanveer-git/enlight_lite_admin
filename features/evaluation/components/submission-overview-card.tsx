"use client";

/**
 * Submission overview card — hero on the evaluation detail page.
 *
 * Visual structure (top → bottom):
 *
 *   - "EVALUATION OVERVIEW" small-caps eyebrow + status pill on the right.
 *   - Identity row: large learner name (who submitted) + large evaluator
 *     name (who graded, when evaluated) — each with a small icon and a
 *     subtext.
 *   - Stats grid: Word-count block (current / limit) and a File-type
 *     block, side by side, with redundant pills removed.
 *   - Meta row: Due, Submitted, On-time / Late.
 *   - On md+ screens, a circular score gauge on the right showing the
 *     engine's percentage when available, "—" when not.
 */
import { format } from "date-fns";
import type { LucideIcon } from "lucide-react";
import {
  CalendarClock,
  CheckCircle2,
  FileText,
  GraduationCap,
  ListChecks,
  Paperclip,
  ShieldCheck,
  User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ECard } from "@/components/composite/e-card";
import { cn } from "@/lib/utils";

import type { Submission } from "../types";

interface SubmissionOverviewCardProps {
  submission: Submission;
  rubricName: string | null;
  totalMarks: number | null;
  gradeFormat: string | null;
  /** Engine percentage (0–100). Falls back to null when unavailable. */
  scorePercent: number | null;
  /** Pass/fail result of the engine. Used to colour the gauge. */
  passFail: "pass" | "fail" | null;
  /** Effective grade label from the engine. */
  effectiveGrade: string | null;
}

const STATUS_LABEL: Record<Submission["currentStatus"], string> = {
  pending: "Pending",
  graded: "Graded",
  resubmit: "Resubmission",
};

const STATUS_VARIANT: Record<
  Submission["currentStatus"],
  "warning" | "success" | "destructive"
> = {
  pending: "warning",
  graded: "success",
  resubmit: "destructive",
};

const TIMING = (submittedAt: string, dueAt: string) => {
  const sub = new Date(submittedAt).getTime();
  const due = new Date(dueAt).getTime();
  if (sub <= due) return { label: "On time", tone: "success" as const };
  return { label: "Late", tone: "destructive" as const };
};

function pillClass(tone: "success" | "destructive" | "warning" | "muted"): string {
  if (tone === "success") return "bg-success/10 text-success ring-1 ring-inset ring-success/20";
  if (tone === "destructive") return "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20";
  if (tone === "warning") return "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20";
  return "bg-muted text-muted-foreground ring-1 ring-inset ring-border";
}

export function SubmissionOverviewCard({
  submission,
  rubricName,
  totalMarks: _totalMarks,
  gradeFormat,
  scorePercent,
  passFail,
  effectiveGrade,
}: SubmissionOverviewCardProps) {
  const attempt = submission.attempts[submission.viewingAttempt - 1]!;

  // Display values fall back to the submission's persisted grade/percent
  // when the rubric engine hasn't run (e.g. first render of a graded
  // submission where the evaluator hasn't yet rated criteria in this
  // session). This keeps the hero block populated using the seed data.
  const displayedScore = scorePercent ?? submission.finalPercentage ?? null;
  const displayedGrade =
    effectiveGrade ?? submission.finalGrade ?? null;
  const displayedPass = passFail ?? null;
  const timing = TIMING(attempt.submittedAt, attempt.dueAt);

  const overLimit =
    attempt.wordLimit != null && attempt.wordCount > attempt.wordLimit;
  const fileExt = attempt.files[0]?.name.split(".").pop()?.toUpperCase();
  const gaugeColor =
    displayedPass === "pass"
      ? "text-success"
      : displayedPass === "fail"
        ? "text-destructive"
        : "text-muted-foreground";

  const evaluatedAt = submission.evaluatedAt
    ? format(new Date(submission.evaluatedAt), "MMM d, h:mm a")
    : null;

  // Footer chips — only computed when there's something to show, so
  // the footer can be omitted entirely when both are unknown.
  //
  // For rubric-driven submissions, the `gradeType` field on the seed
  // record is `null` and the grading context lives on `gradeScaleId`
  // instead — that's the named scale the assignment grades against.
  // Fall back to it so the chip always reflects the actual grading
  // format configured on the assignment, not just the explicit
  // `gradeType` value.
  const gradeTypeChip = gradeTypeLabel(gradeFormat) ?? gradeTypeLabel(submission.gradeScaleId);
  const rubricChip = rubricName?.trim() || null;

  return (
    <ECard className="rounded-2xl border-border/60 shadow-soft">
      <ECard.Header className="border-b border-border/60 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="size-3" aria-hidden /> Evaluation overview
          </span>
          <Badge
            variant={STATUS_VARIANT[submission.currentStatus]}
            className="rounded-full px-2 py-0 text-[10px]"
          >
            {STATUS_LABEL[submission.currentStatus]}
          </Badge>
        </div>
      </ECard.Header>

      <ECard.Body className="flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:justify-between">
        {/* Left: title + 4-column meta */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Title + ID pill */}
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              {submission.assignmentTitle}
            </h2>
            {submission.assignmentCode && (
              <Badge
                variant="outline"
                className="rounded-full text-[11px] font-medium text-muted-foreground"
                title="Assignment code"
              >
                ID: {submission.assignmentCode}
              </Badge>
            )}
          </div>

          {/* 4 icon-columns: Submitted on · Due date · Time remaining · Attachments */}
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs sm:grid-cols-4">
            <MetaColumn
              icon={CheckCircle2}
              label="Submitted on"
              value={format(new Date(attempt.submittedAt), "dd MMM yyyy")}
              sublabel={format(new Date(attempt.submittedAt), "h:mm a")}
            />
            <MetaColumn
              icon={CalendarClock}
              label="Due date"
              value={format(new Date(attempt.dueAt), "dd MMM yyyy")}
              sublabel={format(new Date(attempt.dueAt), "h:mm a")}
            />
            <MetaColumn
              icon={ListChecks}
              label="Time remaining"
              value=""
              sublabel=""
              chip={
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                    pillClass(timing.tone),
                  )}
                >
                  {timing.label}
                </span>
              }
            />
            <MetaColumn
              icon={Paperclip}
              label="Attachments"
              value={`${attempt.files.length} ${attempt.files.length === 1 ? "file" : "files"}`}
              sublabel={
                fileExt
                  ? fileExt
                  : attempt.files.length > 0
                    ? "View all"
                    : "None"
              }
            />
          </dl>

          {/* Inline identity + word-count strip — kept compact below the 4-col grid */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 text-xs text-muted-foreground">
            <InlineIdentity
              icon={User}
              label="Submitted by"
              name={submission.learner.name}
              tone="success"
            />
            <InlineIdentity
              icon={submission.evaluatedBy ? ShieldCheck : GraduationCap}
              label={submission.evaluatedBy ? "Evaluated by" : "Awaiting evaluation"}
              name={submission.evaluatedBy?.name ?? "Not yet graded"}
              tone={submission.evaluatedBy ? "primary" : "muted"}
              subtext={evaluatedAt ? `Saved ${evaluatedAt}` : "Not saved"}
            />
            <span className="inline-flex items-center gap-1.5">
              <FileText className="size-3.5 text-muted-foreground/80" aria-hidden />
              Word count:{" "}
              <span
                className={cn(
                  "font-medium tabular-nums",
                  overLimit
                    ? "text-destructive"
                    : attempt.wordLimit != null
                      ? "text-success"
                      : "text-foreground",
                )}
              >
                {attempt.wordCount.toLocaleString()}
                {attempt.wordLimit != null && (
                  <span className="text-muted-foreground/80">
                    /{attempt.wordLimit.toLocaleString()}
                  </span>
                )}
              </span>
              {attempt.wordLimit != null && !overLimit && (
                <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-medium text-success">
                  Within range
                </span>
              )}
              {overLimit && (
                <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-medium text-destructive">
                  Over limit
                </span>
              )}
            </span>
          </div>
        </div>

        {/* Right: grade summary — single vertically-centered unit */}
        <div className="flex w-full flex-col items-center justify-center gap-2.5 py-3 md:max-w-[14rem] md:border-l md:border-border/60 md:pl-6">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Result
          </p>
          <ScoreRing percent={displayedScore} className={ringStrokeClass(gaugeColor)} />
          {gradeFormat !== "Percentage" && (
            <p
              className={cn(
                "text-2xl font-semibold leading-none tabular-nums",
                gaugeColor,
              )}
            >
              {displayedGrade ?? "—"}
            </p>
          )}
        </div>
      </ECard.Body>

      {(gradeTypeChip || rubricChip) && (
        <ECard.Footer className="flex flex-wrap items-center gap-1.5 px-4 py-3">
          {/* Rubric + Grade-type sit together as a paired cluster. */}
          {gradeTypeChip && (
            <Badge
              variant="outline"
              className="rounded-full text-[11px] font-medium text-muted-foreground"
              title="Grade format configured for this assignment"
            >
              Grade type: {gradeTypeChip}
            </Badge>
          )}
          {rubricChip && (
            <Badge
              variant="outline"
              className="rounded-full text-[11px] font-medium text-muted-foreground"
              title="Rubric used by this submission"
            >
              Rubric: {rubricChip}
            </Badge>
          )}
        </ECard.Footer>
      )}
    </ECard>
  );
}

/** Circular progress ring. Two concentric circles — track + fill —
 * with the percentage number centred. */
function ScoreRing({
  percent,
  className,
}: {
  percent: number | null;
  className: string;
}) {
  const clamped = percent == null ? 0 : Math.min(100, Math.max(0, percent));
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle
          cx="40"
          cy="40"
          r={radius}
          className="stroke-muted/50 fill-none"
          strokeWidth="6"
        />
        <circle
          cx="40"
          cy="40"
          r={radius}
          className={cn(
            "fill-none transition-[stroke-dashoffset] duration-500 ease-out",
            percent == null ? "stroke-muted-foreground/40" : className,
          )}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label="Score percentage"
      >
        <span
          className={cn(
            "text-base font-semibold leading-none tabular-nums",
            percent == null ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {percent == null ? "—" : `${Math.round(clamped)}%`}
        </span>
      </div>
    </div>
  );
}

/** Compact inline identity: small icon + label + name on one line. */
function InlineIdentity({
  icon: Icon,
  label,
  name,
  subtext,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  name: string;
  subtext?: string;
  tone: "success" | "primary" | "muted";
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md",
          tone === "success" && "bg-success/10 text-success",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "muted" && "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-3" aria-hidden />
      </span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium text-foreground" title={name}>
        {name}
      </span>
      {subtext && (
        <span className="text-[10px] text-muted-foreground/80">
          · {subtext}
        </span>
      )}
    </span>
  );
}

/** Compact 4-column meta cell: small icon + label + value + sublabel. */
function MetaColumn({
  icon: Icon,
  label,
  value,
  sublabel,
  chip,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  chip?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3" aria-hidden />
        {label}
      </span>
      {chip ? (
        <div>{chip}</div>
      ) : (
        <div>
          <p className="text-sm font-semibold tabular-nums text-foreground">{value}</p>
          {sublabel && (
            <p className="text-[11px] tabular-nums text-muted-foreground">{sublabel}</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Stroke colour for the score ring fill. */
function ringStrokeClass(gaugeColor: string): string {
  if (gaugeColor === "text-success") return "stroke-success";
  if (gaugeColor === "text-destructive") return "stroke-destructive";
  return "stroke-muted-foreground";
}

/**
 * The hero card displays the *raw* grade-type value (e.g. `Percentage`,
 * `gs_letter`) — not the resolved scale's display name. The chip in the
 * footer is a stable identifier, so renaming a grade scale in the
 * admin catalog doesn't change what the chip says for an already-
 * graded submission. Returns `null` when there's nothing to show.
 */
function gradeTypeLabel(gradeFormat: string | null): string | null {
  if (!gradeFormat) return null;
  return gradeFormat;
}
