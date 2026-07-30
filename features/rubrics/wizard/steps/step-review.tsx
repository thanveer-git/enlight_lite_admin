"use client";

import { useMemo, useState } from "react";

import { CheckCircle2, ChevronDown, ChevronUp, Edit3, FileText, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { findGradeScale } from "@/features/rubrics/constants";
import { GradeSimulator } from "@/features/rubrics/simulator/grade-simulator";
import { cn } from "@/lib/utils";
import type { RubricDraft } from "@/features/rubrics/wizard/types";
import { type ValidationStep, getRubricValidation } from "@/features/rubrics/wizard/validation";
import type { GradeProfileRule, LevelPoints, ProfilePath, RubricMatrix } from "@/types/rubric";

export interface StepReviewProps {
  draft: RubricDraft;
  onJumpToStep: (step: ValidationStep) => void;
}

const STEP_LABEL: Record<ValidationStep, string> = {
  info: "Step 1",
  criteria: "Step 2",
  rules: "Step 3",
};

function formatPoints(points: LevelPoints | null): string {
  if (!points) return "—";
  if (points.type === "single") {
    return points.value === null ? "—" : String(points.value);
  }
  if (points.min === null || points.max === null) return "—";
  return `${points.min}–${points.max}`;
}

interface DescribedRule {
  mismatch: boolean;
  labelHtml: string;
  pathsHtml: string[];
}

function describeRule(
  rule: GradeProfileRule,
  levelName: (id: string) => string,
  scaleBands: string[] | null,
): DescribedRule {
  const label = rule.gradeLabel.trim();
  const mismatch = !!label && !!scaleBands && !scaleBands.includes(label);
  const labelText = label || "(no label)";
  const pathsHtml = rule.paths.map((path) => describePath(path, levelName));
  return {
    mismatch,
    labelHtml: `<b>${escapeHtml(labelText)}</b>`,
    pathsHtml,
  };
}

function describePath(path: ProfilePath, levelName: (id: string) => string): string {
  const tierTexts = path.tiers.map((tier) => {
    const name = escapeHtml(levelName(tier.levelId) || "(level)");
    const count = Math.max(1, Number(tier.count) || 1);
    const numberWord = numberToWord(count);
    const noun = count === 1 ? "criterion" : "criteria";
    const verb = count === 1 ? "reaches" : "reach";
    return `at least <b>${numberWord}</b> ${noun} ${verb} <b>${name}</b>`;
  });
  const tierClause = tierTexts.length === 0 ? "no tiers configured" : tierTexts.join(" and ");
  const floor = path.floorLevelId
    ? ` and no criterion falls below <b>${escapeHtml(
        levelName(path.floorLevelId) || "(level)",
      )}</b>`
    : "";
  return `${tierClause}${floor}`;
}

const NUMBER_WORDS: Record<number, string> = {
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
};

function numberToWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

// Tailwind class string that makes any user-supplied string wrap
// cleanly — covers both normal hyphenated words and unbroken sequences
// of characters (e.g. paths/identifiers) via `overflow-wrap: anywhere`.
const WRAP_USER_TEXT = "block max-w-full break-words [overflow-wrap:anywhere]";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function describeMatrix(matrix: RubricMatrix) {
  const totalCells = matrix.criteria.length * matrix.levels.length;
  const filled = matrix.criteria.reduce(
    (sum, criterion) =>
      sum +
      matrix.levels.filter((level) => matrix.descriptions[criterion.id]?.[level.id]?.trim()).length,
    0,
  );
  return { totalCells, filled };
}

export function StepReview({ draft, onJumpToStep }: StepReviewProps) {
  const { blockers, warnings } = useMemo(() => getRubricValidation(draft), [draft]);
  const matrix = draft.matrix;
  const suggestedScale = findGradeScale(matrix.suggestedScaleId);
  const levelName = (id: string) => matrix.levels.find((level) => level.id === id)?.name ?? "";
  const cellStats = describeMatrix(matrix);
  const [outcomeExpanded, setOutcomeExpanded] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <ValidationSummary blockers={blockers} warnings={warnings} onJumpToStep={onJumpToStep} />
        </div>
        <GradeSimulator embedded matrix={matrix} rubricType={draft.type} rubricName={draft.name} />
      </div>

      <Section title="Identity" step="info" onEdit={() => onJumpToStep("info")}>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(180px,0.35fr)]">
            <div className="border-b p-4 sm:border-r">
              <Field label="Name">
                <span className="block max-w-full break-words text-base font-semibold text-foreground [overflow-wrap:anywhere]">
                  {draft.name.trim() || <Empty />}
                </span>
              </Field>
            </div>
            <div className="border-b p-4">
              <Field label="Type">
                {draft.type === null ? (
                  <Empty />
                ) : (
                  <Badge variant={draft.type === "scored" ? "default" : "secondary"}>
                    {draft.type === "scored" ? "Scored" : "Unscored"}
                  </Badge>
                )}
              </Field>
            </div>
          </div>
          <div className="p-4">
            <Field label="Learning outcome">
              {draft.outcome.trim() ? (
                <div className="mt-1">
                  <div
                    className={cn(
                      "rt-content relative max-w-none break-words text-sm text-foreground [overflow-wrap:anywhere]",
                      !outcomeExpanded && "max-h-32 overflow-hidden",
                    )}
                  >
                    <div className="break-words [overflow-wrap:anywhere]" dangerouslySetInnerHTML={{ __html: draft.outcome }} />
                    {!outcomeExpanded && (
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setOutcomeExpanded((v) => !v)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    {outcomeExpanded ? (
                      <>
                        <ChevronUp className="size-3" /> Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3" /> Show more
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <Empty />
              )}
            </Field>
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Matrix" step="criteria" onEdit={() => onJumpToStep("criteria")}>
        <div className="grid gap-3 md:grid-cols-3">
          <Stat label="Criteria" value={String(matrix.criteria.length)} />
          <Stat label="Levels" value={String(matrix.levels.length)} />
          <Stat
            label="Descriptions"
            value={`${cellStats.filled} / ${cellStats.totalCells}`}
            tone={cellStats.filled < cellStats.totalCells ? "warning" : "default"}
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Performance levels
          </p>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/30">
                <tr>
                  <th className="min-w-[180px] border-r p-3 text-left align-top font-medium text-muted-foreground">
                    Criteria
                  </th>
                  {matrix.levels.map((level) => (
                    <th
                      key={level.id}
                      className="min-w-[200px] border-r p-3 text-left align-top last:border-r-0"
                    >
                      <span className={cn("font-semibold text-foreground", WRAP_USER_TEXT)}>
                        {level.name.trim() || "Unnamed level"}
                      </span>
                      {draft.type === "scored" && (
                        <span className="mt-0.5 block break-words text-xs font-normal text-muted-foreground [overflow-wrap:anywhere]">
                          {level.points?.type === "range" ? "Range" : "Points"}: {formatPoints(level.points)}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.criteria.map((criterion) => (
                  <tr key={criterion.id} className="border-t align-top">
                    <th className="border-r bg-muted/10 p-3 text-left font-medium">
                      <span className={cn("text-foreground", WRAP_USER_TEXT)}>
                        {criterion.name.trim() || "Unnamed criterion"}
                      </span>
                      {draft.type === "scored" && (
                        <span className="mt-0.5 block break-words text-xs font-normal text-muted-foreground [overflow-wrap:anywhere]">
                          Weight: {criterion.weight ?? "—"}
                        </span>
                      )}
                    </th>
                    {matrix.levels.map((level) => {
                      const description = matrix.descriptions[criterion.id]?.[level.id]?.trim();
                      return (
                        <td
                          key={level.id}
                          className="min-w-[200px] break-words border-r p-3 align-top text-sm leading-5 text-foreground [overflow-wrap:anywhere] last:border-r-0"
                        >
                          {description || <Empty message="No description" />}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {matrix.criteria.length === 0 && (
                  <tr className="border-t">
                    <td
                      colSpan={Math.max(1, matrix.levels.length + 1)}
                      className="p-4 text-center"
                    >
                      <Empty message="No criteria" />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Separator />

      <Section title="Grade Rules" step="rules" onEdit={() => onJumpToStep("rules")}>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <Field label="Grading method">
                <span className="font-medium text-foreground">
                  {draft.type === "unscored"
                    ? matrix.gradingMethod === "grade_profile"
                      ? "Grade Profile"
                      : "Manual override (no rules)"
                    : matrix.gradingMethod === "weighted_average"
                      ? "Weighted average"
                      : "Grade Profile"}
                </span>
              </Field>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Field label="Profile fallback">
                {matrix.gradingMethod !== "grade_profile"
                  ? "Not applicable"
                  : matrix.profileFallback
                    ? "Enabled"
                    : "Disabled"}
              </Field>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Field label="Grade scale">
                <span className={cn("text-foreground", WRAP_USER_TEXT)}>
                  {suggestedScale ? suggestedScale.name : <Empty />}
                </span>
                {suggestedScale && (
                  <p className="mt-1 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
                    Bands: {suggestedScale.bands.join(", ")}
                  </p>
                )}
              </Field>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <Field label="Minimum-pass rule">
                {matrix.minPassLevelId === null ? (
                  "Disabled"
                ) : (
                  <span className={cn("text-foreground", WRAP_USER_TEXT)}>
                    At least{" "}
                    <span className="font-medium text-foreground">
                      {matrix.minPassLevelId}
                    </span>
                  </span>
                )}
              </Field>
            </div>
          </div>

        {matrix.gradingMethod === "grade_profile" && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Profile rules ({matrix.profileRules.length})
            </p>
            {matrix.profileRules.length === 0 ? (
              <Empty message="No rules" />
            ) : (
              <ol className="space-y-2">
                {matrix.profileRules.map((rule, idx) => {
                  const { mismatch, labelHtml, pathsHtml } = describeRule(
                    rule,
                    levelName,
                    suggestedScale?.bands ?? null,
                  );
                  const hasMultiplePaths = pathsHtml.length > 1;
                  return (
                    <li
                      key={rule.id}
                      className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-base font-semibold leading-6 text-foreground [&_b]:font-semibold", WRAP_USER_TEXT)}>
                          <span
                            dangerouslySetInnerHTML={{
                              __html: `Award grade ${labelHtml} when`,
                            }}
                          />
                        </p>
                        <div className="mt-1 break-words text-sm italic leading-6 text-muted-foreground [overflow-wrap:anywhere] [&_b]:font-semibold [&_b]:not-italic [&_b]:text-foreground">
                          {hasMultiplePaths ? (
                            <div>
                              {pathsHtml.map((pathHtml, pathIdx) => (
                                <div key={pathIdx}>
                                  <span
                                    className="italic"
                                    dangerouslySetInnerHTML={{ __html: pathHtml }}
                                  />
                                  {pathIdx < pathsHtml.length - 1 && (
                                    <span className="my-1 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary">
                                      <span className="h-px flex-1 bg-primary/30" />
                                      OR
                                      <span className="h-px flex-1 bg-primary/30" />
                                    </span>
                                  )}
                                </div>
                              ))}
                              <span>.</span>
                            </div>
                          ) : (
                            <span>
                              <span
                                className="italic"
                                dangerouslySetInnerHTML={{
                                  __html: pathsHtml[0] ?? "",
                                }}
                              />
                              <span>.</span>
                            </span>
                          )}
                        </div>
                        {mismatch && (
                          <p className={cn("mt-1 text-xs text-destructive", WRAP_USER_TEXT)}>
                            Grade label is not a band of {suggestedScale?.name}.
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        )}
        </div>
      </Section>
    </div>
  );
}

interface ValidationSummaryProps {
  blockers: ReturnType<typeof getRubricValidation>["blockers"];
  warnings: ReturnType<typeof getRubricValidation>["warnings"];
  onJumpToStep: (step: ValidationStep) => void;
}

function ValidationSummary({ blockers, warnings, onJumpToStep }: ValidationSummaryProps) {
  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-success/40 bg-success/5 p-3 text-sm text-success-foreground">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
        <div>
          <p className="font-medium text-foreground">Ready to publish</p>
          <p className="text-xs text-muted-foreground">
            All required fields are valid. Save as a draft or publish when you&apos;re ready.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blockers.length > 0 && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <div className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="font-medium text-destructive">
                {blockers.length} {blockers.length === 1 ? "blocker" : "blockers"} must be fixed
                before publishing
              </p>
              <ul className="mt-2 space-y-1.5">
                {blockers.map((issue) => (
                  <li
                    key={issue.id}
                    className="flex items-start justify-between gap-2 text-foreground"
                  >
                    <span>{issue.message}</span>
                    <button
                      type="button"
                      onClick={() => onJumpToStep(issue.step)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      <Edit3 className="size-3" />
                      {STEP_LABEL[issue.step]}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-sm">
          <p className="font-medium text-foreground">
            {warnings.length} {warnings.length === 1 ? "warning" : "warnings"}
          </p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted-foreground">
            {warnings.map((issue) => (
              <li key={issue.id}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface SectionProps {
  title: string;
  step: ValidationStep;
  onEdit: () => void;
  children: React.ReactNode;
}

function Section({ title, step, onEdit, children }: SectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Edit3 className="size-3" />
          Edit {STEP_LABEL[step]}
        </button>
      </div>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  tone?: "default" | "warning";
}

function Stat({ label, value, tone = "default" }: StatProps) {
  return (
    <div className="rounded-md border bg-card p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={
          tone === "warning"
            ? "mt-1 text-lg font-semibold text-warning"
            : "mt-1 text-lg font-semibold"
        }
      >
        {value}
      </p>
    </div>
  );
}

function Empty({ message = "Not set" }: { message?: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs italic text-muted-foreground">
      <FileText className="size-3" /> {message}
    </span>
  );
}
