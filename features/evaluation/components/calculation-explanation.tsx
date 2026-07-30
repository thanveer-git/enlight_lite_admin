"use client";

/**
 * Calculation explanation — document §4.12.
 *
 * Renders the rubric engine's `explanation[]` as an ordered list and
 * appends override + min-pass notes when applicable.
 *
 * No-rubric path (edubex §4.10): when the assignment grades directly
 * via the assignment's grade format, the engine never runs and there
 * is no per-criterion breakdown to show. The card switches to a short
 * explanatory note so the reviewer isn't confused by the absence.
 */
import { Calculator } from "lucide-react";

import { ECard } from "@/components/composite/e-card";
import type { DerivedEvaluation } from "@/features/evaluation/derive";
import type { DirectGradeFormat } from "@/features/evaluation/types";

interface CalculationExplanationProps {
  derived: DerivedEvaluation;
  rubricLocked: boolean;
  gradeFormat?: DirectGradeFormat | null;
  totalMarks?: number | null;
  directGradeValue?: string;
}

export function CalculationExplanation({
  derived,
  rubricLocked,
  gradeFormat,
  totalMarks,
  directGradeValue,
}: CalculationExplanationProps) {
  const baseSteps = derived.engine?.explanation ?? [];
  const notes: { tone: "warning" | "destructive" | "primary"; text: string }[] = [];

  if (derived.minPassOverride) {
    notes.push({
      tone: "warning",
      text: `Minimum-pass rule failed: final grade forced to "${derived.minPassOverride.band.grade}". Resubmission is open.`,
    });
  }

  if (derived.overrideApplied) {
    notes.push({
      tone: "primary",
      text: `Evaluator override applied (${derived.overrideApplied.value}). ${
        rubricLocked ? "Rubric controls are locked while the override is on." : ""
      }`,
    });
  }

  if (derived.requiresManualOverride) {
    notes.push({
      tone: "destructive",
      text: "Engine could not produce a final grade from the current ratings. Enable the manual override and supply a reason.",
    });
  }

  // True when the assignment is graded directly (no rubric engine ran).
  const noRubric = derived.engine === null;

  const cardTitle = noRubric ? "Grading summary" : "How this was calculated";

  return (
    <ECard className="rounded-2xl border-border/60 shadow-soft">
      <ECard.Header className="border-b border-border/60 px-4 py-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Calculator className="size-3.5" aria-hidden />
          {cardTitle}
        </h3>
      </ECard.Header>
      <ECard.Body className="space-y-3 p-4">
        {noRubric ? (
          <DirectGradeExplanation
            gradeFormat={gradeFormat ?? null}
            totalMarks={totalMarks ?? null}
            directGradeValue={directGradeValue ?? ""}
            effectiveGrade={derived.effectiveGrade}
            passFail={derived.passFail}
            overrideApplied={derived.overrideApplied}
          />
        ) : (
          <>
            {baseSteps.length === 0 && notes.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Add ratings above to see the calculation breakdown.
              </p>
            )}

            {baseSteps.length > 0 && (
              <ol className="space-y-2 text-[12px] leading-snug text-foreground">
                {baseSteps.map((step, idx) => (
                  <li key={`${idx}-${step.slice(0, 12)}`} className="flex gap-2.5">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {notes.length > 0 && (
              <ul className="space-y-2 text-[12px]">
                {notes.map((note, idx) => (
                  <li
                    key={`note-${idx}`}
                    className={
                      note.tone === "destructive"
                        ? "rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-destructive"
                        : note.tone === "warning"
                          ? "rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-foreground"
                          : "rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-primary"
                    }
                  >
                    {note.text}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </ECard.Body>
    </ECard>
  );
}

const FORMAT_LABELS: Record<string, string> = {
  Percentage: "Percentage",
  CGPA: "CGPA",
  Marks: "Marks",
  "Comp/Incomp": "Complete / Incomplete",
  NamedBand: "Grade band",
};

function DirectGradeExplanation({
  gradeFormat,
  totalMarks,
  directGradeValue,
  effectiveGrade,
  passFail,
  overrideApplied,
}: {
  gradeFormat: DirectGradeFormat | null;
  totalMarks: number | null;
  directGradeValue: string;
  effectiveGrade: string | null;
  passFail: "pass" | "fail" | null;
  overrideApplied: { value: string; reason: string } | null;
}) {
  const formatLabel = gradeFormat ? (FORMAT_LABELS[gradeFormat] ?? gradeFormat) : "Unknown";
  const hasValue = directGradeValue !== "" && directGradeValue !== "0";

  if (!hasValue && !overrideApplied) {
    return (
      <p className="text-xs text-muted-foreground">
        No rubric is attached. Enter a {formatLabel.toLowerCase()} value above to grade this submission.
      </p>
    );
  }

  const steps: string[] = [];

  steps.push(`Grading method: Direct — ${formatLabel} (no rubric).`);

  if (gradeFormat === "Percentage") {
    steps.push(`Entered value: ${directGradeValue}%.`);
  } else if (gradeFormat === "CGPA") {
    steps.push(`Entered value: ${directGradeValue} out of 10.`);
    const num = Number(directGradeValue);
    if (Number.isFinite(num)) {
      steps.push(`Converted to percentage: ${((num / 10) * 100).toFixed(1)}%.`);
    }
  } else if (gradeFormat === "Marks") {
    steps.push(`Entered value: ${directGradeValue} out of ${totalMarks ?? "?"}.`);
    const num = Number(directGradeValue);
    if (Number.isFinite(num) && totalMarks != null && totalMarks > 0) {
      steps.push(`Converted to percentage: ${((num / totalMarks) * 100).toFixed(1)}%.`);
    }
  } else if (gradeFormat === "Comp/Incomp") {
    steps.push(`Selected result: ${directGradeValue}.`);
  } else {
    steps.push(`Selected grade band: ${directGradeValue}.`);
  }

  if (overrideApplied) {
    steps.push(`Manual override applied: ${overrideApplied.value}.`);
  }

  if (effectiveGrade != null) {
    const resultLabel = passFail === "pass" ? "Pass" : passFail === "fail" ? "Fail" : null;
    steps.push(
      `Final result: ${effectiveGrade}${resultLabel ? ` (${resultLabel})` : ""}.`,
    );
  }

  return (
    <ol className="space-y-2 text-[12px] leading-snug text-foreground">
      {steps.map((step, idx) => (
        <li key={idx} className="flex gap-2.5">
          <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
            {idx + 1}
          </span>
          <span className="flex-1">{step}</span>
        </li>
      ))}
    </ol>
  );
}
