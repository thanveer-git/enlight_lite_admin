"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { apiClient } from "@/services/api-client";
import { WizardPage, type WizardStep } from "@/templates/wizard-page";
import {
  type AssignmentDraft,
  type AssignmentStatus,
} from "@/features/assignments/wizard/types";
import { StepDetails } from "@/features/assignments/wizard/steps/step-details";
import { StepGrade } from "@/features/assignments/wizard/steps/step-grade";
import { StepOutcomes } from "@/features/assignments/wizard/steps/step-outcomes";
import { StepAccess } from "@/features/assignments/wizard/steps/step-access";
import { StepReview } from "@/features/assignments/wizard/steps/step-review";
import {
  isAssignmentPublishable,
  type ValidationStep,
} from "@/features/assignments/wizard/validation";
import type { RubricDetail } from "@/types/rubric";

const STEPS: WizardStep[] = [
  { id: "details", title: "Details", description: "Title & content" },
  { id: "grade", title: "Grade & Rubric", description: "Type, scale, rubric" },
  { id: "outcomes", title: "Outcomes", description: "Learning outcome" },
  { id: "access", title: "Access & deadline", description: "Who, when" },
  { id: "review", title: "Review", description: "Save or publish" },
];

type StepId = (typeof STEPS)[number]["id"];

export default function AssignmentFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const assignmentId = params?.id ?? "0";
  const isEdit = assignmentId !== "0";

  const [stepId, setStepId] = useState<StepId>("details");
  const [draft, setDraft] = useState<AssignmentDraft | null>(null);
  const [rubric, setRubric] = useState<RubricDetail | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiClient.getAssignmentDraft(assignmentId).then((d) => {
      if (!cancelled) setDraft(d);
    });
    return () => {
      cancelled = true;
    };
  }, [assignmentId]);

  // Fetch the full rubric detail (with matrix) when one is selected so the
  // validation can read things like `matrix.suggestedScaleId`.
  const rubricId = draft?.rubricId ?? null;
  useEffect(() => {
    let cancelled = false;
    if (!rubricId) {
      setRubric(null);
      return;
    }
    apiClient.getRubric(rubricId).then((r) => {
      if (!cancelled) setRubric(r);
    });
    return () => {
      cancelled = true;
    };
  }, [rubricId]);

  const currentIdx = STEPS.findIndex((s) => s.id === stepId);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === STEPS.length - 1;

  const goNext = () => {
    if (currentIdx < STEPS.length - 1) setStepId(STEPS[currentIdx + 1]!.id as StepId);
  };
  const goBack = () => {
    if (currentIdx > 0) setStepId(STEPS[currentIdx - 1]!.id as StepId);
  };
  const jumpToStep = (id: ValidationStep | StepId) => setStepId(id as StepId);

  const handlePatch = (patch: Partial<AssignmentDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  // Publish requires validation; Save Draft always allowed and skips
  // validation entirely per spec §"Save draft".
  const publishable = useMemo(() => {
    if (!draft) return false;
    return isAssignmentPublishable(draft, rubric);
  }, [draft, rubric]);

  const handleSave = async (status: AssignmentStatus) => {
    if (!draft) return;
    setSubmitting(true);
    try {
      const payload: AssignmentDraft = { ...draft, status };
      if (isEdit && draft.id) {
        await apiClient.updateAssignment(draft.id, payload);
      } else {
        await apiClient.createAssignment(payload);
      }
      toast.success(
        status === "published" ? "Assignment published" : "Assignment saved as draft",
        { description: draft.title || "(untitled)" },
      );
      router.push(ROUTES.admin.assignments.all);
    } catch {
      toast.error("Could not save the assignment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (() => {
    if (!draft) {
      return (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading assignment…
        </div>
      );
    }
    switch (stepId) {
      case "details":
        return <StepDetails draft={draft} onPatch={handlePatch} />;
      case "grade":
        return <StepGrade draft={draft} onPatch={handlePatch} />;
      case "outcomes":
        return <StepOutcomes draft={draft} onPatch={handlePatch} />;
      case "access":
        return <StepAccess draft={draft} onPatch={handlePatch} />;
      case "review":
        return <StepReview draft={draft} onJumpToStep={jumpToStep} />;
      default:
        return null;
    }
  })();

  return (
    <WizardPage
      title={isEdit ? "Edit Assignment" : "New Assignment"}
      description={
        isEdit
          ? "Update this assignment. Changes apply to learners once republished."
          : "Define an assignment: content, grade rules, learning outcome, and access window."
      }
      steps={STEPS}
      currentStep={stepId}
      onStepClick={(id) => setStepId(id as StepId)}
      content={content}
      actions={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(ROUTES.admin.assignments.all)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button variant="outline" onClick={goBack} disabled={submitting}>
                <ArrowLeft className="mr-1.5 size-4" />
                Back
              </Button>
            )}
            {!isLast && (
              <>
                <Button
                  variant="outline"
                  onClick={() => draft && handleSave("draft")}
                  disabled={submitting || !draft}
                >
                  <Save className="mr-1.5 size-4" />
                  Save Draft
                </Button>
                <Button onClick={goNext} disabled={!draft}>
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </>
            )}
            {isLast && (
              <>
                <Button
                  variant="outline"
                  onClick={() => draft && handleSave("draft")}
                  disabled={submitting || !draft}
                >
                  <Save className="mr-1.5 size-4" />
                  Save Draft
                </Button>
                <Button onClick={() => draft && handleSave("published")} disabled={submitting || !draft || !publishable}>
                  Publish
                </Button>
              </>
            )}
          </div>
        </div>
      }
    />
  );
}
