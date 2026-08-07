import { findGradeScale } from "@/features/rubrics/constants";
import type { RubricDetail } from "@/types/rubric";

import type { AssignmentDraft } from "@/features/assignments/wizard/types";
import { PRIORITY_OF } from "@/features/assignments/wizard/types";

export type ValidationStep = "details" | "grade" | "outcomes" | "access" | "review";

export interface ValidationIssue {
  id: string;
  step: ValidationStep;
  message: string;
}

export interface AssignmentValidation {
  blockers: ValidationIssue[];
  warnings: ValidationIssue[];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function isRubricUsable(rubric: RubricDetail | null | undefined): rubric is RubricDetail {
  return !!rubric && (rubric.status === "published" || rubric.status === "in_use");
}

function checkDetails(draft: AssignmentDraft, out: ValidationIssue[]): void {
  if (!draft.title.trim()) {
    out.push({ id: "details-title", step: "details", message: "Title is required" });
  }
  if (!draft.lectureSlug.trim()) {
    out.push({
      id: "details-slug",
      step: "details",
      message: "Assignment lecture slug is required",
    });
  }
  if (!draft.sectionId) {
    out.push({ id: "details-section", step: "details", message: "Section is required" });
  }
}

function checkGrade(
  draft: AssignmentDraft,
  rubric: RubricDetail | null,
  out: ValidationIssue[],
): void {
  const rubricUsable = !!rubric && (rubric.status === "published" || rubric.status === "in_use");

  if (draft.useRubric && !rubricUsable) {
    out.push({
      id: "grade-rubric",
      step: "grade",
      message: rubric
        ? `Selected rubric is "${rubric.status}" — must be Published or In Use`
        : "Select a rubric",
    });
  }

  if (rubricUsable && rubric!.type === "unscored") {
    const suggestedScaleId = rubric.matrix.suggestedScaleId;
    // Unscored rubrics hide every grade type and accept only their own
    // suggested scale — and even that is optional.
    if (draft.gradeType) {
      out.push({
        id: "grade-type-unscored",
        step: "grade",
        message:
          "An unscored rubric uses per-criterion ratings — no raw grade type is permitted",
      });
    }
    if (draft.gradeScaleId && draft.gradeScaleId !== suggestedScaleId) {
      const suggested = findGradeScale(suggestedScaleId);
      out.push({
        id: "grade-scale-unscored-mismatch",
        step: "grade",
        message: suggested
          ? `Unscored rubric requires its suggested scale "${suggested.name}" (or none)`
          : "Unscored rubric requires its suggested scale (or none)",
      });
    }
  } else {
    // Scored or no rubric — one of {gradeType, gradeScale} is required.
    if (!draft.gradeType && !draft.gradeScaleId) {
      out.push({
        id: "grade-missing",
        step: "grade",
        message: "Choose a grade type or a grade scale",
      });
    }
    if (draft.gradeType === "mark") {
      if (!draft.totalMarks || draft.totalMarks <= 0) {
        out.push({
          id: "grade-totalmarks",
          step: "grade",
          message: "Mark grade type requires Total Marks > 0",
        });
      }
    }
    // Scored rubric + scale: scale must not be draft.
    if (rubricUsable && rubric!.type === "scored" && draft.gradeScaleId) {
      const scale = findGradeScale(draft.gradeScaleId);
      if (scale?.meta?.status === "draft") {
        out.push({
          id: "grade-scale-draft",
          step: "grade",
          message: `Selected scale "${scale.name}" is still a draft — publish it first`,
        });
      }
    }
  }
}

function checkAccess(draft: AssignmentDraft, out: ValidationIssue[]): void {
  if (draft.accessRules.length === 0) {
    out.push({
      id: "access-empty",
      step: "access",
      message: "At least one access rule is required",
    });
  }
  draft.accessRules.forEach((rule, idx) => {
    const label = `Rule ${idx + 1} (${PRIORITY_OF[rule.audience]})`;
    if (!rule.fromAt && !rule.dueAt && !rule.untilAt) {
      out.push({
        id: `access-dates-${rule.id}`,
        step: "access",
        message: `${label} → Set at least one date field`,
      });
    }
    if (rule.audience === "single" && rule.studentIds.length !== 1) {
      out.push({
        id: `access-single-${rule.id}`,
        step: "access",
        message: `${label} → Select exactly one student`,
      });
    }
    if (rule.audience === "multiple" && rule.studentIds.length === 0) {
      out.push({
        id: `access-multi-${rule.id}`,
        step: "access",
        message: `${label} → Select at least one student`,
      });
    }
  });
}

function checkOutcomes(draft: AssignmentDraft, out: ValidationIssue[]): void {
  // Outcomes are optional — no blockers. Reserved for future warnings.
  if (!stripHtml(draft.outcome).length) {
    return;
  }
}

export function validateAssignment(
  draft: AssignmentDraft,
  rubric: RubricDetail | null,
): AssignmentValidation {
  const blockers: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  checkDetails(draft, blockers);
  checkGrade(draft, rubric, blockers);
  checkAccess(draft, blockers);
  checkOutcomes(draft, warnings);
  return { blockers, warnings };
}

export function isAssignmentPublishable(
  draft: AssignmentDraft,
  rubric: RubricDetail | null,
): boolean {
  return validateAssignment(draft, rubric).blockers.length === 0;
}

export function isStepDetailsValid(draft: AssignmentDraft): boolean {
  return (
    !!draft.title.trim() && !!draft.lectureSlug.trim() && !!draft.sectionId
  );
}

export function isStepAccessValid(draft: AssignmentDraft): boolean {
  if (draft.accessRules.length === 0) return false;
  return draft.accessRules.every(
    (r) =>
      !!(r.fromAt || r.dueAt || r.untilAt) &&
      (r.audience !== "single" || r.studentIds.length === 1) &&
      (r.audience !== "multiple" || r.studentIds.length > 0),
  );
}
