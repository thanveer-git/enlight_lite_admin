/**
 * Domain model for Assignment Evaluation (Phase 1).
 *
 * Mirrors the document Section 4 data model. Stable ids, no name-based
 * joins — see the rubric engine's `CriterionRating` for the rating
 * shape reused here.
 */
import type { User } from "@/types/session";

export type SubmissionStatus = "pending" | "graded" | "resubmit";

/**
 * The full set of grade-format values an assignment can declare.
 *
 * The four built-in defaults are always valid choices. Named grade
 * scales (`gs_*`) are admin-managed and their ids are accepted here so
 * the assignment's choice — fixed or named — is mirrored verbatim on
 * the submission record. The legacy `"NamedBand"` sentinel is kept
 * for backward compatibility with records that predate the migration
 * and use `gradeScaleId` to carry the actual scale.
 */
export type DirectGradeFormat =
  | "CGPA"
  | "Percentage"
  | "Comp/Incomp"
  | "Marks"
  | "NamedBand"
  | `gs_${string}`;

export interface SubmissionFile {
  name: string;
  size: number;
  mime: string;
}

/** Learner-facing message on the public feedback thread. Empty in phase 1. */
export interface SubmissionMessage {
  id: string;
  author: User;
  text: string;
  sentAt: string;
  attachments?: SubmissionFile[];
  pinned?: boolean;
}

export interface AttemptRecord {
  attemptNumber: number;
  submittedAt: string;
  dueAt: string;
  /**
   * The window opener for the learner on this attempt — when the
   * assignment becomes accessible. Optional so older seed records
   * without explicit openers default to "always open" at evaluation
   * time.
   */
  availableAt?: string;
  /** Hard close — submission is blocked after this time. Optional. */
  untilAt?: string;
  wordCount: number;
  wordLimit: number | null;
  bodyHtml: string;
  files: SubmissionFile[];
  feedback: SubmissionMessage[];
}

export interface Submission {
  id: string;
  assignmentId: string;
  /**
   * Short human-friendly code shown next to the title (e.g. ASG-003).
   * Falls back to `assignmentId` when not provided.
   */
  assignmentCode?: string;
  assignmentTitle: string;
  courseId: string;
  courseName: string;
  assignmentBriefHtml: string;
  /**
   * Rich-text assignment question shown in the first tab. Falls back to
   * `assignmentBriefHtml` when not provided.
   */
  assignmentQuestion?: string;
  learner: User;
  /** Null when the assignment is graded directly. */
  rubricId: string | null;
  /** Null when the assignment uses a rubric. */
  gradeType: DirectGradeFormat | null;
  /** Required when the assignment uses a rubric. */
  gradeScaleId: string | null;
  /** Total marks when `gradeType === "Marks"`. */
  totalMarks: number | null;
  currentStatus: SubmissionStatus;
  /**
   * Optional final grade label, populated when the submission has been
   * graded. Used by the submissions list's `Grade` column and the
   * detail page's hero block.
   */
  finalGrade?: string | null;
  /**
   * Optional final percentage (0–100). Persisted on graded
   * submissions so the hero block can show real numbers without
   * requiring the rubric engine to recompute on every load.
   */
  finalPercentage?: number | null;
  attempts: AttemptRecord[];
  /** 1-based index into `attempts`. Phase 1 supports viewing a single current attempt. */
  viewingAttempt: number;
  /**
   * Optional ISO timestamp for the most recent save. `null` when the
   * submission has not been graded yet.
   */
  evaluatedAt: string | null;
  /** Optional evaluator identity — only set when `evaluatedAt` is set. */
  evaluatedBy: User | null;
}

export interface ManualOverride {
  on: boolean;
  value: string;
  reason: string;
}

export interface EvaluationDraft {
  /** Keyed by criterion id. Phase 1 keeps a single current attempt's ratings. */
  ratings: Record<string, { levelId: string; points: number | null }>;
  directGrade: string;
  override: ManualOverride;
  markComplete: boolean;
  notifyLearner: boolean;
  /**
   * Resolved Access Window for the current attempt. Set by the Access
   * Window editor (§4.15) and read by the save-time access-window
   * gate (§4.14). Optional — older seeds without an explicit window
   * fall through to "no gate".
   */
  accessWindow?: {
    availableAt: string | null;
    dueAt: string;
    untilAt: string | null;
  };
}

export const EMPTY_MANUAL_OVERRIDE: ManualOverride = {
  on: false,
  value: "",
  reason: "",
};

export function emptyEvaluationDraft(): EvaluationDraft {
  return {
    ratings: {},
    directGrade: "",
    override: { ...EMPTY_MANUAL_OVERRIDE },
    markComplete: false,
    notifyLearner: false,
  };
}
