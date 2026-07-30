/**
 * Pure selectors over the seeded submissions. The store holds drafts;
 * these helpers resolve submission, attempts, and the engine's view of
 * the current draft.
 */
import { FAKE_RUBRIC_DETAILS } from "@/services/handlers/rubric-details";
import { findGradeScale, type GradeScale } from "@/features/rubrics/constants";
import type { RubricMatrix, RubricType } from "@/types/rubric";

import { SEED_SUBMISSIONS } from "./seed";
import type { AttemptRecord, Submission } from "./types";

export function listSubmissions(): Submission[] {
  return SEED_SUBMISSIONS;
}

export function getSubmissionById(id: string): Submission | null {
  return SEED_SUBMISSIONS.find((s) => s.id === id) ?? null;
}

export function getCurrentAttempt(submission: Submission): AttemptRecord {
  const idx = Math.max(0, Math.min(submission.viewingAttempt - 1, submission.attempts.length - 1));
  return submission.attempts[idx]!;
}

export interface ResolvedRubric {
  matrix: RubricMatrix;
  type: RubricType;
  name: string;
}

export function getRubricForSubmission(submission: Submission): ResolvedRubric | null {
  if (!submission.rubricId) return null;
  const detail = FAKE_RUBRIC_DETAILS[submission.rubricId];
  if (!detail) return null;
  return { matrix: detail.matrix, type: detail.type, name: detail.name };
}

export function getGradeScaleForSubmission(submission: Submission): GradeScale | null {
  if (!submission.gradeScaleId) return null;
  return findGradeScale(submission.gradeScaleId);
}

/** Sibling submissions within the same assignment — used by prev/next. */
export function siblingsForSubmission(submission: Submission): Submission[] {
  return SEED_SUBMISSIONS.filter(
    (s) => s.assignmentId === submission.assignmentId,
  );
}

export function prevNextForSubmission(
  submission: Submission,
): { prev: Submission | null; next: Submission | null } {
  const siblings = siblingsForSubmission(submission);
  const idx = siblings.findIndex((s) => s.id === submission.id);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? siblings[idx - 1]! : null,
    next: idx < siblings.length - 1 ? siblings[idx + 1]! : null,
  };
}
