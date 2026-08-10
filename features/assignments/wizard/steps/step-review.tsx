"use client";

import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, Edit3, FileText, TriangleAlert, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ResolvedPreview } from "@/features/assignments/wizard/components/resolved-preview";
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
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
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
    <div className="space-y-4">
      <ValidationSummary
        blockers={validation.blockers}
        warnings={validation.warnings}
        onJumpToStep={onJumpToStep}
      />

      <Section title="Identity" step="details" onJumpToStep={onJumpToStep}>
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
      </Section>

      <Section title="Grade rules" step="grade" onJumpToStep={onJumpToStep}>
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
      </Section>

      <Section title="Learning outcome" step="outcomes" onJumpToStep={onJumpToStep}>
        {draft.outcomeOverrideEnabled && (
          <Badge variant="warning" className="bg-warning/10 text-warning border-warning/30">
            Customized for this assignment
          </Badge>
        )}
        {stripHtml(draft.outcome).length > 0 ? (
          <div
            className="prose prose-sm max-w-none rounded-md border bg-card p-3 shadow-soft"
            dangerouslySetInnerHTML={{ __html: draft.outcome }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">No outcome set.</p>
        )}
      </Section>

      <Section
        title="Access rules"
        step="access"
        onJumpToStep={onJumpToStep}
        actions={<ResolvedPreview rules={draft.accessRules} />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {draft.accessRules.map((r, idx) => (
            <div key={r.id} className="rounded-md border bg-card p-3 shadow-soft">
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
      </Section>
    </div>
  );
}

interface SectionProps {
  title: string;
  step: ValidationStep;
  onJumpToStep: (step: ValidationStep) => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, step, onJumpToStep, actions, children }: SectionProps) {
  return (
    <section className="space-y-3 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        <div className="flex items-center gap-3">
          {actions}
          <button
            type="button"
            onClick={() => onJumpToStep(step)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            <Edit3 className="size-3" />
            Edit {STEP_LABEL[step]}
          </button>
        </div>
      </div>
      {children}
    </section>
  );
}

interface ValidationSummaryProps {
  blockers: ReturnType<typeof validateAssignment>["blockers"];
  warnings: ReturnType<typeof validateAssignment>["warnings"];
  onJumpToStep: (step: ValidationStep) => void;
}

function ValidationSummary({ blockers, warnings, onJumpToStep }: ValidationSummaryProps) {
  if (blockers.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-success/40 bg-success/5 p-3 text-sm">
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

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className={cn("grid gap-0.5 rounded-md border bg-card px-3 py-2 shadow-soft")}>
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-sm">{value}</span>
    </div>
  );
}
