"use client";

import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, Edit3, FileText, TriangleAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { FormSection } from "@/components/composite/form-section";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { findGradeScale } from "@/features/rubrics/constants";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/api-client";
import type { RubricDetail } from "@/types/rubric";

import {
  AUDIENCE_LABELS,
  GRADE_TYPE_LABELS,
  PRIORITY_OF,
  SECTIONS,
  type AssignmentDraft,
} from "@/features/assignments/wizard/types";
import {
  type ValidationStep,
  validateAssignment,
} from "@/features/assignments/wizard/validation";

export interface StepReviewProps {
  draft: AssignmentDraft;
  onJumpToStep: (step: ValidationStep) => void;
}

const STEP_LABEL: Record<ValidationStep, string> = {
  details: "Step 1",
  grade: "Step 2",
  outcomes: "Step 3",
  access: "Step 4",
  review: "Step 5",
};

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function StepReview({ draft, onJumpToStep }: StepReviewProps) {
  const [rubric, setRubric] = useState<RubricDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!draft.rubricId) {
      setRubric(null);
      return;
    }
    apiClient.getRubric(draft.rubricId).then((r) => {
      if (!cancelled) setRubric(r);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.rubricId]);

  const validation = useMemo(() => validateAssignment(draft, rubric), [draft, rubric]);

  const section = SECTIONS.find((s) => s.id === draft.sectionId);
  const scale = findGradeScale(draft.gradeScaleId);

  return (
    <div className="space-y-6">
      {/* Validation summary */}
      {validation.blockers.length > 0 ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 shadow-soft">
          <div className="mb-2 flex items-center gap-2 text-destructive">
            <TriangleAlert className="size-4" aria-hidden />
            <span className="text-sm font-semibold">
              {validation.blockers.length} blocking issue
              {validation.blockers.length === 1 ? "" : "s"} to fix before publishing
            </span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {validation.blockers.map((issue) => (
              <li key={issue.id} className="flex items-start gap-2">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-destructive underline"
                  onClick={() => onJumpToStep(issue.step)}
                >
                  {STEP_LABEL[issue.step]}
                </Button>
                <span className="text-foreground">{issue.message}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-success/40 bg-success/5 p-4 shadow-soft">
          <CheckCircle2 className="mt-0.5 size-4 text-success" aria-hidden />
          <div className="grid gap-0.5">
            <span className="text-sm font-semibold">All required fields are complete.</span>
            <span className="text-sm text-muted-foreground">
              This assignment is ready to publish.
            </span>
          </div>
        </div>
      )}

      {/* Identity */}
      <FormSection
        title="Identity"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step 1 · Details</div>
            <Button type="button" variant="outline" size="sm" onClick={() => onJumpToStep("details")}>
              <Edit3 className="mr-1 size-3.5" />
              Edit
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryRow label="Title" value={draft.title.trim() || "—"} />
          <SummaryRow label="Lecture slug" value={draft.lectureSlug.trim() || "—"} />
          <SummaryRow label="Section" value={section?.name ?? "—"} />
          <SummaryRow
            label="Word limit"
            value={
              draft.wordLimit == null
                ? "—"
                : draft.wordLimit === 0
                  ? "No word limit"
                  : `${draft.wordLimit} words`
            }
          />
        </div>
      </FormSection>

      {/* Grade rules */}
      <FormSection
        title="Grade rules"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step 2 · Grade scale & Rubric</div>
            <Button type="button" variant="outline" size="sm" onClick={() => onJumpToStep("grade")}>
              <Edit3 className="mr-1 size-3.5" />
              Edit
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryRow
            label="Rubric"
            value={
              draft.useRubric
                ? rubric
                  ? `${rubric.name} (${rubric.type === "scored" ? "Scored" : "Unscored"})`
                  : "Not found"
                : "None"
            }
          />
          <SummaryRow
            label="Grade type / scale"
            value={
              draft.gradeKind === "type" && draft.gradeType
                ? draft.gradeType === "mark" && draft.totalMarks
                  ? `${GRADE_TYPE_LABELS[draft.gradeType]} / ${draft.totalMarks}`
                  : GRADE_TYPE_LABELS[draft.gradeType]
                : draft.gradeKind === "scale" && scale
                  ? scale.name
                  : "Not set"
            }
          />
          <SummaryRow
            label="What students see"
            value={draft.showEvalDetail ? "Detailed evaluation breakdown" : "Overall score only"}
          />
          <SummaryRow
            label="Grading mode"
            value={
              rubric
                ? rubric.type === "unscored"
                  ? "Unscored — per-criterion ratings"
                  : "Scored — weighted average / Grade Profile"
                : "Direct grade"
            }
          />
        </div>
      </FormSection>

      {/* Outcome */}
      <FormSection
        title="Learning outcome"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step 3 · Outcomes</div>
            <Button type="button" variant="outline" size="sm" onClick={() => onJumpToStep("outcomes")}>
              <Edit3 className="mr-1 size-3.5" />
              Edit
            </Button>
          </div>
        }
      >
        {draft.outcomeOverrideEnabled && (
          <Badge variant="warning" className="bg-warning/10 text-warning border-warning/30">
            Customized for this assignment
          </Badge>
        )}
        {stripHtml(draft.outcome).length > 0 ? (
          <div
            className="prose prose-sm max-w-none rounded-md border bg-muted/30 p-3"
            dangerouslySetInnerHTML={{ __html: draft.outcome }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No outcome set.</p>
        )}
      </FormSection>

      {/* Access rules */}
      <FormSection
        title="Access rules"
        footer={
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Step 4 · Access & deadline</div>
            <Button type="button" variant="outline" size="sm" onClick={() => onJumpToStep("access")}>
              <Edit3 className="mr-1 size-3.5" />
              Edit
            </Button>
          </div>
        }
      >
        <div className="grid gap-3">
          {draft.accessRules.map((r, idx) => (
            <div key={r.id} className="rounded-md border bg-background p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Rule {idx + 1}</span>
                <Badge variant="outline" className="capitalize">
                  {PRIORITY_OF[r.audience]} priority
                </Badge>
              </div>
              <div className="grid gap-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="size-3.5 opacity-60" aria-hidden />
                  <span>
                    {AUDIENCE_LABELS[r.audience]}
                    {r.audience === "single" && r.studentIds[0]
                      ? ` (${r.studentIds[0]})`
                      : r.audience === "multiple"
                        ? ` (${r.studentIds.length} student${r.studentIds.length === 1 ? "" : "s"})`
                        : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 opacity-60" aria-hidden />
                  <span>Available From: {formatDate(r.fromAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 opacity-60" aria-hidden />
                  <span>Due: {formatDate(r.dueAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 opacity-60" aria-hidden />
                  <span>Available Until: {formatDate(r.untilAt)}</span>
                </div>
                {r.notify && (
                  <Badge variant="outline" className="w-fit">
                    Notify on save
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <Separator />
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn("grid gap-0.5 rounded-md border bg-background px-3 py-2")}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
