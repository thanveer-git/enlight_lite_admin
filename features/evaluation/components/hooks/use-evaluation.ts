"use client";

/**
 * Convenience hook that pairs a submission with its draft, rubric, and
 * derived result. The Assessment tab consumes this single value.
 *
 * Auto-toggles mark-complete when the engine reports a "pass" the user
 * hasn't touched yet (document §4.13).
 */
import { useEffect, useMemo } from "react";
import type { GradeScale } from "@/features/rubrics/constants";

import { deriveEvaluation } from "@/features/evaluation/derive";
import { getRubricForSubmission, getGradeScaleForSubmission } from "@/features/evaluation/selectors";
import type { EvaluationDraft, Submission } from "@/features/evaluation/types";
import { useEvaluationStore } from "@/stores/evaluation-store";

interface UseEvaluationArgs {
  submission: Submission;
  fallbackDraft: EvaluationDraft;
}

interface UseEvaluationResult {
  draft: EvaluationDraft;
  derived: ReturnType<typeof deriveEvaluation>;
  rubric: ReturnType<typeof getRubricForSubmission>;
  gradeScale: GradeScale | null;
  setRating: (criterionId: string, levelId: string, points: number | null) => void;
  setDirectGrade: (value: string) => void;
  setOverride: (patch: Partial<EvaluationDraft["override"]>) => void;
  setAccessWindow: (window: NonNullable<EvaluationDraft["accessWindow"]>) => void;
  setMarkComplete: (next: boolean) => void;
  setNotify: (next: boolean) => void;
  onSave: () => void;
}

export function useEvaluation({
  submission,
  fallbackDraft,
}: UseEvaluationArgs): UseEvaluationResult {
  const {
    drafts,
    ensureDraft,
    setRating,
    setDirectGrade,
    setOverride,
    setAccessWindow,
    setMarkComplete,
    setNotify,
    save,
    isCompletionTouched,
  } = useEvaluationStore();

  useEffect(() => {
    ensureDraft(submission.id, fallbackDraft);
  }, [submission.id, fallbackDraft, ensureDraft]);

  const draft = drafts[submission.id] ?? fallbackDraft;
  const rubric = getRubricForSubmission(submission);
  const gradeScale = getGradeScaleForSubmission(submission);

  const derived = useMemo(
    () =>
      deriveEvaluation({
        submission,
        draft,
        gradeScale,
        rubric,
      }),
    [submission, draft, gradeScale, rubric],
  );

  // Auto mark-complete when pass & not user-touched (document §4.13).
  useEffect(() => {
    if (!derived.engine) return;
    if (derived.engine.status !== "complete") return;
    if (isCompletionTouched(submission.id)) return;
    if (derived.passFail === "pass" && !draft.markComplete) {
      setMarkComplete(submission.id, true);
    }
  }, [
    derived.engine,
    derived.passFail,
    draft.markComplete,
    isCompletionTouched,
    setMarkComplete,
    submission.id,
  ]);

  return {
    draft,
    derived,
    rubric,
    gradeScale,
    setRating: (criterionId, levelId, points) =>
      setRating(submission.id, criterionId, levelId, points),
    setDirectGrade: (value) => setDirectGrade(submission.id, value),
    setOverride: (patch) => setOverride(submission.id, patch),
    setAccessWindow: (window) => setAccessWindow(submission.id, window),
    setMarkComplete: (next) => setMarkComplete(submission.id, next),
    setNotify: (next) => setNotify(submission.id, next),
    onSave: () => {
      const result = save(submission.id, {
        completionDecision: derived.completionDecision,
        saveBlocked: derived.saveBlocked,
      });
      if (!result.ok) {
        // toast handled in the page; the store returns the reason.
        return;
      }
      // toast handled in the page; notify caller through a console marker.
      // (Components subscribe via `useEvaluationStore.getState().savedStatuses`).
      console.info("Evaluation saved", { id: submission.id, status: result.status });
    },
  };
}
