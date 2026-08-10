import type { Rubric } from "@/types/rubric";

import { FAKE_ASSIGNMENTS, SECTIONS, STUDENTS } from "@/features/assignments/seed";
import { LEARNER_LABEL } from "@/lib/labels";

export type AudienceType = "everyone" | "single" | "multiple";
export type Priority = "high" | "medium" | "low";
export type GradeType = "cgpa" | "percentage" | "mark" | "complete_incomplete";
export type AssignmentStatus = "draft" | "published" | "in_use";

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  everyone: "Everyone",
  single: `Single ${LEARNER_LABEL.singular}`,
  multiple: `Multiple ${LEARNER_LABEL.plural}`,
};

export const PRIORITY_OF: Record<AudienceType, Priority> = {
  single: "high",
  multiple: "medium",
  everyone: "low",
};

export const GRADE_TYPE_LABELS: Record<GradeType, string> = {
  cgpa: "CGPA",
  percentage: "Percentage",
  mark: "Mark",
  complete_incomplete: "Complete / Incomplete",
};

export const GRADE_TYPE_DESCRIPTIONS: Record<GradeType, string> = {
  cgpa: "Grade on a 0–10 scale (pass mark depends on the chosen scale).",
  percentage: "Grade as a percentage 0–100. Maps to a chosen scale's bands.",
  mark: "Marks out of a fixed total — set Total Marks in the next field.",
  complete_incomplete: "Pass/fail only — no numeric grade.",
};

export interface AssignedFile {
  id: string;
  name: string;
  sizeKb: number;
}

export interface AccessRule {
  id: string;
  audience: AudienceType;
  studentIds: string[];
  fromAt: string | null;
  dueAt: string | null;
  untilAt: string | null;
  notify: boolean;
  /** Local edit clock; bumped on every patch. Used as a tie-break for
   *  same-priority rules per spec §3.4. */
  updatedAt: number;
}

export type GradeKind = "type" | "scale" | "none";

export interface AssignmentDraft {
  id: string | null;
  title: string;
  /** `0` means no word limit per spec. `null` while untouched. */
  wordLimit: number | null;
  lectureSlug: string;
  sectionId: string | null;
  content: string;
  files: AssignedFile[];
  useRubric: boolean;
  rubricId: string | null;
  showEvalDetail: boolean;
  gradeKind: GradeKind;
  gradeType: GradeType | null;
  totalMarks: number | null;
  gradeScaleId: string | null;
  outcomeOverrideEnabled: boolean;
  outcome: string;
  accessRules: AccessRule[];
  status: AssignmentStatus;
}

export const EMPTY_DRAFT: () => AssignmentDraft = () => ({
  id: null,
  title: "",
  wordLimit: null,
  lectureSlug: "",
  sectionId: null,
  content: "",
  files: [],
  useRubric: false,
  rubricId: null,
  showEvalDetail: true,
  gradeKind: "none",
  gradeType: null,
  totalMarks: null,
  gradeScaleId: null,
  outcomeOverrideEnabled: false,
  outcome: "",
  accessRules: [emptyAccessRule()],
  status: "draft",
});

export function emptyAccessRule(): AccessRule {
  return {
    id: `rule_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
    audience: "everyone",
    studentIds: [],
    fromAt: null,
    dueAt: null,
    untilAt: null,
    notify: false,
    updatedAt: Date.now(),
  };
}

/** Resolved selectors (re-exported for convenience). */
export { SECTIONS, STUDENTS };

/** Persisted mock store. Re-exported so api-client can hydrate from it. */
export { FAKE_ASSIGNMENTS };

/** Helper used by Step 1 to keep a strongly-typed reference. */
export type { Rubric };
