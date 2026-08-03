"use client";

/**
 * Assessment tab — the grading console.
 *
 * Composes `OverrideControls` at the top, then the per-criterion
 * controls (or direct-grade row), and finally `ActionBar` as direct
 * children of the tab. `CalculationExplanation` is rendered as a
 * sibling card in the right column by the page client.
 */
import { EmptyState } from "@/components/composite/empty-state";
import { Separator } from "@/components/ui/separator";
import type { GradeScale } from "@/features/rubrics/constants";

import type { DerivedEvaluation } from "../derive";
import type { EvaluationDraft, Submission } from "../types";
import type { ResolvedRubric } from "../selectors";

import { ActionBar } from "./action-bar";
import { CriterionRow } from "./criterion-row";
import { DirectGradeRow } from "./direct-grade-row";
import { OverrideControls } from "./override-controls";

interface AssessmentTabProps {
  submission: Submission;
  draft: EvaluationDraft;
  derived: DerivedEvaluation;
  rubric: ResolvedRubric | null;
  gradeScale: GradeScale | null;
  onRatingChange: (criterionId: string, levelId: string, points: number | null) => void;
  onDirectGradeChange: (value: string) => void;
  onOverridePatch: (patch: Partial<EvaluationDraft["override"]>) => void;
  onMarkCompleteChange: (next: boolean) => void;
  onNotifyChange: (next: boolean) => void;
  onSave: () => void;
}

export function AssessmentTab({
  submission,
  draft,
  derived,
  rubric,
  gradeScale,
  onRatingChange,
  onDirectGradeChange,
  onOverridePatch,
  onMarkCompleteChange,
  onNotifyChange,
  onSave,
}: AssessmentTabProps) {
  return (
    <div className="space-y-4">
      {/* Manual override only applies to rubric-driven grading
          (edubex §4.11). For direct-grade submissions the engine
          result IS the final grade — there's nothing to override. */}
      {rubric && (
        <OverrideControls
          format={submission.gradeType}
          totalMarks={submission.totalMarks}
          gradeScale={gradeScale}
          override={draft.override}
          onPatch={onOverridePatch}
        />
      )}

      {rubric ? (
        rubric.matrix.criteria.length === 0 ? (
          <EmptyState
            title="No criteria on this rubric"
            description="Add criteria to the rubric before grading."
          />
        ) : (
          <ol className="space-y-2.5">
            {rubric.matrix.criteria.map((criterion, idx) => {
              const rating = draft.ratings[criterion.id];
              return (
                <CriterionRow
                  key={criterion.id}
                  index={idx}
                  criterion={criterion}
                  matrix={rubric.matrix}
                  scored={rubric.type === "scored"}
                  levelId={rating?.levelId ?? ""}
                  points={rating?.points ?? null}
                  description={rubric.matrix.descriptions[criterion.id]?.[rating?.levelId ?? ""]}
                  minPassLevelId={rubric.matrix.minPassLevelId}
                  isLetterGrading={
                    gradeScale?.meta?.gradeType === "letter_grading" &&
                    (gradeScale.passBands?.length ?? 0) > 0
                  }
                  locked={derived.rubricLocked}
                  onRatingChange={(levelId, points) =>
                    onRatingChange(criterion.id, levelId, points)
                  }
                />
              );
            })}
          </ol>
        )
      ) : submission.gradeType ? (
        <DirectGradeRow
          format={submission.gradeType}
          totalMarks={submission.totalMarks}
          gradeScale={gradeScale}
          value={draft.directGrade}
          locked={derived.rubricLocked}
          onChange={onDirectGradeChange}
        />
      ) : (
        <EmptyState
          title="Nothing to grade"
          description="This submission has no rubric and no direct grade format configured."
        />
      )}

      <Separator />

      <ActionBar
        derived={derived}
        markComplete={draft.markComplete}
        notifyLearner={draft.notifyLearner}
        onMarkCompleteChange={onMarkCompleteChange}
        onNotifyChange={onNotifyChange}
        onSave={onSave}
      />
    </div>
  );
}
