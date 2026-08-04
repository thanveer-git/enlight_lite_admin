"use client";

/**
 * Calculation explanation — document §4.12.
 *
 * Two-step, structured view modeled on the prototype:
 *
 *   1. "Points earned per criterion" — one row per rated criterion,
 *      showing the criterion name, the chosen level, and the math
 *      `points × weight = weighted`. TOTAL row sums to
 *      `earned / possible = percentage`.
 *   2. "Convert to native format" — explains the conversion from the
 *      engine's 0–100 percentage to the assignment's native grade
 *      format (Percentage, CGPA, Marks, Comp/Incomp), with the result
 *      highlighted in a stat micro-cell.
 *
 * Only renders when a rubric is attached; direct-grade submissions
 * (no rubric) don't have a per-criterion breakdown to show and the
 * engine never runs, so nothing meaningful would be on screen.
 */
import { AlertTriangle, ArrowRight, Calculator, Sigma } from "lucide-react";

import { ECard } from "@/components/composite/e-card";
import { cn } from "@/lib/utils";
import type { DerivedEvaluation } from "@/features/evaluation/derive";
import type { DirectGradeFormat } from "@/features/evaluation/types";
import type { ResolvedRubric } from "@/features/evaluation/selectors";
import type { MatrixLevel } from "@/types/rubric";
import { findScaleBand } from "@/features/rubrics/evaluation/engine";
import { findGradeScale } from "@/features/rubrics/constants";

interface CalculationExplanationProps {
  derived: DerivedEvaluation;
  rubric: ResolvedRubric;
  gradeFormat?: DirectGradeFormat | null;
  totalMarks?: number | null;
  directGradeValue?: string;
}

export function CalculationExplanation({
  derived,
  rubric,
  gradeFormat,
  totalMarks,
}: CalculationExplanationProps) {
  const engine = derived.engine;
  const matrix = rubric.matrix;
  const evaluations = engine?.criteria ?? [];
  const weightedScore = engine?.weightedScore ?? 0;
  const weightedMax = engine?.weightedMax ?? 0;
  // Use the rubric-computed percentage (not engine.percentage, which the
  // engine may overwrite with the fail band when min-pass fires).
  const percentage =
    weightedMax > 0 ? (weightedScore / weightedMax) * 100 : engine?.percentage ?? null;
  const rubricMaximumPoints = computeRubricMaximumPoints(matrix.levels);

  // Rated criteria in matrix order — drives the per-row table.
  const ratedRows = evaluations.filter((e) => e.points != null && e.weight != null);
  const scored = rubric.type === "scored";

  const notes = collectNotes(derived);

  return (
    <ECard className="rounded-2xl border-border/60 shadow-soft">
      <ECard.Header className="border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Calculator className="size-3.5" aria-hidden />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                How this grade is calculated
              </h3>
              {/* <p className="text-[11px] text-muted-foreground/80">
                Trace the math from each rated criterion to the final native label.
              </p> */}
            </div>
          </div>
          {/* {percentage != null && (
            <span
              className="inline-flex items-baseline gap-1 rounded-full bg-muted/40 px-2.5 py-1 text-[11px] font-medium tabular-nums text-muted-foreground"
              title="Engine percentage"
            >
              <span>Score</span>
              <span className="font-semibold text-foreground">
                {percentage.toFixed(1)}%
              </span>
            </span>
          )} */}
        </div>
      </ECard.Header>

      <ECard.Body className="space-y-5 p-4">
        {ratedRows.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-6 text-center text-xs text-muted-foreground">
            Rate the criteria above to see the calculation breakdown.
          </p>
        ) : (
          <>
            {/* Step 1 — per-criterion points table */}
            <section className="space-y-2.5">
              <SectionHeading step={1} title="Points earned per criterion" />
              <div className="ml-7 overflow-hidden rounded-lg border border-border/60 bg-card">
                <table className="w-full text-xs">
                  <tbody>
                    {ratedRows.map((row) => {
                      const criterion = matrix.criteria.find((c) => c.id === row.criterionId);
                      const level = matrix.levels.find((l) => l.id === row.levelId);
                      return (
                        <tr
                          key={row.criterionId}
                          className="border-t border-border/40 transition-colors first:border-t-0 hover:bg-muted/20"
                        >
                          <td className="py-2.5 pl-3 pr-2 align-middle">
                            <span className="text-foreground/90">
                              {criterion?.name ?? row.criterionId}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3 text-right align-top">
                            {level && (
                              <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                                <span
                                  className="inline-flex size-1.5 shrink-0 rounded-full bg-primary/60"
                                  aria-hidden
                                />
                                {level.name}
                              </div>
                            )}
                            {scored && row.points != null && row.weight != null ? (
                              <CriterionMath
                                points={row.points}
                                weight={row.weight}
                                weighted={row.weightedPoints ?? 0}
                                weightedMax={row.weightedMax}
                              />
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {/* TOTAL row */}
                    {scored && (
                      <tr className="border-t border-border/60 bg-gradient-to-b from-muted/30 to-muted/10">
                        <td className="py-2.5 pl-3 pr-2 align-middle">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            <Sigma className="size-3" aria-hidden /> Total
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-right align-middle">
                          <span className="tabular-nums text-muted-foreground">
                            <span className="text-base font-semibold text-foreground">
                              {formatNumber(weightedScore)}
                            </span>{" "}
                            <sub className="text-xs">
                              /{formatNumber(weightedMax)}
                            </sub>
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Step 2 — convert weighted score to percentage */}
            {percentage != null && (
              <section className="space-y-2.5">
                <SectionHeading
                  step={2}
                  title="Convert to percentage"
                />
                <div className="ml-7 grid grid-cols-[1fr_auto_1.4fr_auto_1fr] items-center gap-2">
                  <ConvertStep
                    label="Weighted"
                    value={`${formatNumber(weightedScore)} ÷ ${formatNumber(weightedMax)}`}
                    tone="muted"
                  />
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                  <ConvertStep
                    label="Formula"
                    value={percentageFormula(weightedScore, weightedMax)}
                    tone="muted"
                  />
                  <ArrowRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                  <ConvertStep
                    label="Percentage"
                    value={`${percentage.toFixed(1)}%`}
                    tone="primary"
                  />
                </div>
              </section>
            )}

            {/* Step 3 — convert to grade band (shows the band percentage maps to,
                NOT the override band when min-pass fires). */}
            {percentage != null && gradeFormat && gradeFormat !== "Percentage" && (() => {
              const formula = nativeFormula(
                percentage,
                gradeFormat,
                totalMarks ?? null,
                rubricMaximumPoints,
              );
              const hasFormula = formula.trim().length > 0;
              const gridCols = hasFormula
                ? "grid-cols-[1fr_auto_1.4fr_auto_1fr]"
                : "grid-cols-[1fr_auto_1fr]";
              // For letter grading, compute the actual band from the rubric
              // percentage (engine.scaleBand has been overwritten with the
              // override band by this point, so we can't reuse it).
              const letterScale = findGradeScale(gradeFormat);
              const isLetter = letterScale?.meta?.gradeType === "letter_grading";
              const actualBand = isLetter && letterScale
                ? findScaleBand(percentage, letterScale, [])
                : null;
              const resultValue = isLetter
                ? (actualBand?.grade ?? "—")
                : nativeLabel(
                    percentage,
                    gradeFormat,
                    totalMarks ?? null,
                    rubricMaximumPoints,
                    weightedScore,
                    weightedMax,
                    engine?.finalGrade ?? null,
                  );
              return (
                <section className="space-y-2.5">
                  <SectionHeading
                    step={3}
                    title={`Convert to ${formatLabel(gradeFormat)}`}
                  />
                  <div className={`ml-7 grid ${gridCols} items-center gap-2`}>
                    <ConvertStep
                      label="Percentage"
                      value={`${percentage.toFixed(1)}%`}
                      tone="muted"
                    />
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                    {hasFormula && (
                      <>
                        <ConvertStep
                          label="Formula"
                          value={formula}
                          tone="muted"
                        />
                        <ArrowRight
                          className="size-3.5 shrink-0 text-muted-foreground/60"
                          aria-hidden
                        />
                      </>
                    )}
                    <ConvertStep
                      label="Result"
                      value={resultValue}
                      tone="primary"
                    />
                  </div>
                </section>
              );
            })()}

            {/* Step 4 — minimum-pass rule forced a different final grade */}
            {derived.minPassOverride && (
              <section className="space-y-2.5">
                <SectionHeading
                  step={4}
                  title="Minimum-pass rule"
                />
                <div className="ml-7 flex items-center gap-2.5 rounded-lg border border-warning/40 bg-warning/10 p-3">
                  <AlertTriangle
                    className="size-4 shrink-0 text-warning"
                    aria-hidden
                  />
                  <p className="text-xs leading-relaxed text-foreground">
                    Calculated percentage fell below the minimum pass threshold.
                    Final grade forced to{" "}
                    <span className="font-semibold">
                      “{derived.minPassOverride.band.grade}”
                    </span>
                    . Resubmission is open.
                  </p>
                </div>
              </section>
            )}

            {/* Step 5 — Forced Grade summary (letter grading only).
                Three blocks: Percentage / Actual (mapped band) / Final (override, highlighted). */}
            {derived.minPassOverride && percentage != null && (() => {
              const letterScale = findGradeScale(gradeFormat ?? null);
              const isLetter = letterScale?.meta?.gradeType === "letter_grading";
              if (!isLetter) return null;
              const actualBand = letterScale
                ? findScaleBand(percentage, letterScale, [])
                : null;
              return (
                <section className="space-y-2.5">
                  <SectionHeading
                    step={5}
                    title="Forced Grade"
                  />
                  <div className="ml-7 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2">
                    <ConvertStep
                      label="Percentage"
                      value={`${percentage.toFixed(1)}%`}
                      tone="muted"
                    />
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                    <ConvertStep
                      label="Actual"
                      value={actualBand?.grade ?? "—"}
                      tone="muted"
                    />
                    <ArrowRight
                      className="size-3.5 shrink-0 text-muted-foreground/60"
                      aria-hidden
                    />
                    <ConvertStep
                      label="Final"
                      value={derived.minPassOverride.band.grade}
                      tone="primary"
                      size="lg"
                    />
                  </div>
                </section>
              );
            })()}
          </>
        )}
      </ECard.Body>

      {notes.length > 0 && (
        <ECard.Footer className="flex flex-col gap-2 border-t border-border/60 bg-muted/10 px-4 py-3">
          {notes.map((note, idx) => (
            <p
              key={idx}
              className={cn(
                "rounded-md border px-3 py-2 text-[12px] leading-relaxed",
                note.tone === "destructive"
                  ? "border-destructive/40 bg-destructive/5 text-destructive"
                  : note.tone === "warning"
                    ? "border-warning/40 bg-warning/10 text-foreground"
                    : "border-primary/40 bg-primary/10 text-primary",
              )}
            >
              {note.text}
            </p>
          ))}
        </ECard.Footer>
      )}
    </ECard>
  );
}

function SectionHeading({ step, title }: { step: number; children?: never; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular-nums">
        {step}
      </span>
      <span className="text-xs font-semibold text-foreground">{title}</span>
    </div>
  );
}

function CriterionMath({
  points,
  weight,
  weighted,
  weightedMax,
}: {
  points: number;
  weight: number;
  weighted: number;
  weightedMax?: number | null;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5 tabular-nums">
      <span className="text-muted-foreground">{formatNumber(points)}</span>
      <span aria-hidden className="text-muted-foreground/50">×</span>
      <span className="text-muted-foreground">{formatNumber(weight)}</span>
      <span aria-hidden className="text-muted-foreground/50">=</span>
      <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 font-semibold text-amber-700 ring-1 ring-inset ring-amber-500/20 dark:text-amber-400">
        {formatNumber(weighted)}
      </span>
      {weightedMax != null && (
        <>
          <span aria-hidden className="text-muted-foreground/50">/</span>
          <span
            className="text-muted-foreground/70"
            title="This criterion's maximum weighted contribution"
          >
            {formatNumber(weightedMax)}
          </span>
        </>
      )}
    </div>
  );
}

function ConvertStep({
  label,
  value,
  formula,
  tone,
  size = "default",
}: {
  label: string;
  value: string;
  formula?: string;
  tone: "muted" | "primary";
  size?: "default" | "lg";
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-md border px-2.5 py-1.5",
        tone === "primary"
          ? "border-primary/30 bg-primary/10"
          : "border-border/60 bg-card",
      )}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "truncate text-xs font-semibold tabular-nums",
          tone === "primary" ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {formula && (
        <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
          {formula}
        </p>
      )}
    </div>
  );
}

function collectNotes(derived: DerivedEvaluation): {
  tone: "warning" | "destructive" | "primary";
  text: string;
}[] {
  const notes: { tone: "warning" | "destructive" | "primary"; text: string }[] = [];
  // minPassOverride is rendered inline as Step 4 (with a Step 5 summary for letter grades) — skip the footer note.
  if (derived.overrideApplied) {
    notes.push({
      tone: "primary",
      text: `Evaluator override applied (${derived.overrideApplied.value}). ${
        derived.rubricLocked ? "Rubric controls are locked while the override is on." : ""
      }`,
    });
  }
  if (derived.requiresManualOverride) {
    notes.push({
      tone: "destructive",
      text: "Engine could not produce a final grade from the current ratings. Enable the manual override and supply a reason.",
    });
  }
  return notes;
}

function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatLabel(format: DirectGradeFormat): string {
  switch (format) {
    case "Percentage":
      return "percentage";
    case "Marks":
      return "marks";
    case "CGPA":
      return "CGPA";
    case "Comp/Incomp":
      return "Complete / Incomplete";
    default:
      return "grade band";
  }
}

function computeRubricMaximumPoints(levels: MatrixLevel[]): number | null {
  const all = levels.flatMap((level) => {
    if (level.points?.type === "single" && level.points.value != null) {
      return [level.points.value];
    }
    if (level.points?.type === "range" && level.points.max != null) {
      return [level.points.max];
    }
    return [];
  });
  return all.length > 0 ? Math.max(...all) : null;
}

function nativeLabel(
  percentage: number,
  gradeFormat: DirectGradeFormat,
  totalMarks: number | null,
  rubricMaximumPoints: number | null,
  weightedScore: number,
  weightedMax: number,
  letterGrade?: string | null,
): string {
  if (gradeFormat === "Percentage") return `${percentage.toFixed(1)}%`;
  if (gradeFormat === "CGPA") return `${(percentage / 10).toFixed(1)}`;
  if (gradeFormat === "Marks" && totalMarks != null && totalMarks > 0) {
    return `${((percentage / 100) * totalMarks).toFixed(1)}`;
  }
  if (gradeFormat === "Comp/Incomp") return percentage >= 50 ? "Complete" : "Incomplete";
  // Scale-driven formats (NamedBand, gs_*): the engine resolves the
  // band label (e.g. "F", "A") — use it directly instead of fabricating
  // a numeric value from the weighted ratio.
  if (letterGrade) return letterGrade;
  return `${formatNumber(weightedScore)} ÷ ${formatNumber(weightedMax)}`;
}

function nativeFormula(
  percentage: number,
  gradeFormat: DirectGradeFormat,
  totalMarks: number | null,
  rubricMaximumPoints: number | null,
): string {
  if (gradeFormat === "Percentage") return "kept as-is";
  if (gradeFormat === "CGPA") return `${percentage.toFixed(0)}% ÷ 10`;
  if (gradeFormat === "Marks" && totalMarks != null && totalMarks > 0) {
    return `${percentage.toFixed(0)}% × ${totalMarks} ÷ 100`;
  }
  if (gradeFormat === "Comp/Incomp") return "≥ 50% = Complete";
  return "";
}

function percentageFormula(weightedScore: number, weightedMax: number): string {
  if (!Number.isFinite(weightedScore) || !Number.isFinite(weightedMax) || weightedMax === 0) {
    return "× 100";
  }
  const ratio = weightedScore / weightedMax;
  return `${ratio.toFixed(2)} × 100`;
}
