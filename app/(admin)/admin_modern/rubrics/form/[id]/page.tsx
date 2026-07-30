"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, ArrowRight, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { StepCriteria } from "@/features/rubrics/wizard/steps/step-criteria";
import { type RubricDraft, StepInfo } from "@/features/rubrics/wizard/steps/step-info";
import { StepReview } from "@/features/rubrics/wizard/steps/step-review";
import { StepRules } from "@/features/rubrics/wizard/steps/step-rules";
import {
  getCriteriaValidation,
  getRulesValidation,
  isRubricPublishable,
  isStep1Valid,
} from "@/features/rubrics/wizard/validation";
import { apiClient } from "@/services/api-client";
import { WizardPage, type WizardStep } from "@/templates/wizard-page";
import type { RubricMatrix, RubricStatus } from "@/types/rubric";

const STEPS: WizardStep[] = [
  { id: "info", title: "Rubric Info", description: "Name, type, outcome" },
  { id: "criteria", title: "Criteria & Levels", description: "Build the matrix" },
  { id: "rules", title: "Grade Rules", description: "Scoring method" },
  { id: "review", title: "Review", description: "Save or publish" },
];

type StepId = (typeof STEPS)[number]["id"];

export default function RubricFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const rubricId = params?.id ?? "0";
  const isEdit = rubricId !== "0";

  const [stepId, setStepId] = useState<string>("info");
  const [draft, setDraft] = useState<RubricDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Initial-load: pull the wizard draft from the mock API. For "0" this
  // returns a blank draft; for any existing id it returns the stored
  // matrix/criteria so the editor opens pre-populated.
  useEffect(() => {
    let cancelled = false;
    apiClient.getRubricDraft(rubricId).then((d) => {
      if (!cancelled) setDraft(d);
    });
    return () => {
      cancelled = true;
    };
  }, [rubricId]);

  const currentIdx = STEPS.findIndex((s) => s.id === stepId);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === STEPS.length - 1;

  const goNext = () => {
    if (currentIdx < STEPS.length - 1) setStepId(STEPS[currentIdx + 1]!.id);
  };
  const goBack = () => {
    if (currentIdx > 0) setStepId(STEPS[currentIdx - 1]!.id);
  };
  const jumpToStep = (id: StepId) => setStepId(id);

  const rulesIssues = useMemo(
    () => (draft ? getRulesValidation(draft.matrix, draft.type) : []),
    [draft],
  );
  const rulesValid = rulesIssues.length === 0;

  const criteriaIssues = useMemo(
    () => (draft ? getCriteriaValidation(draft.matrix, draft.type) : []),
    [draft],
  );
  const stepIsValid = (idx: number): boolean => {
    if (!draft) return false;
    switch (STEPS[idx]!.id) {
      case "info":
        return isStep1Valid(draft);
      case "criteria":
        return criteriaIssues.length === 0;
      case "rules":
        return rulesValid;
      case "review":
        return true;
      default:
        return false;
    }
  };
  const isStepLocked = (id: string): boolean => {
    const targetIdx = STEPS.findIndex((s) => s.id === id);
    const curIdx = STEPS.findIndex((s) => s.id === stepId);
    if (targetIdx <= curIdx) return false;
    return !STEPS.slice(0, targetIdx).every((_, i) => stepIsValid(i));
  };

  const handlePatch = (patch: Partial<RubricDraft>) => {
    setDraft((current) => {
      if (!current) return current;
      if (!patch.type || patch.type === current.type) {
        return { ...current, ...patch };
      }
      const scored = patch.type === "scored";
      return {
        ...current,
        ...patch,
        matrix: {
          ...current.matrix,
          criteria: current.matrix.criteria.map((criterion) => ({
            ...criterion,
            weight: scored
              ? criterion.weight && criterion.weight > 0
                ? criterion.weight
                : 10
              : null,
          })),
          levels: current.matrix.levels.map((level, index) => ({
            ...level,
            points: scored
              ? (level.points ?? {
                  type: "single" as const,
                  value: Math.max(0, 100 - index * 25),
                  min: null,
                  max: null,
                })
              : null,
          })),
          gradingMethod: scored ? current.matrix.gradingMethod : "grade_profile",
          profileFallback: scored ? current.matrix.profileFallback : false,
        },
      };
    });
  };

  const handleMatrixChange = (matrix: RubricMatrix) => {
    setDraft((current) => (current ? { ...current, matrix } : current));
  };

  const handleSave = async (status: RubricStatus) => {
    if (!draft || !isStep1Valid(draft) || !draft.type) {
      toast.error("Name, outcome, and type are required.");
      return;
    }
    if (status === "published" && !isRubricPublishable(draft)) {
      toast.error("Validation blockers remain. Fix them in the Review step before publishing.");
      return;
    }
    setSubmitting(true);
    try {
      if (isEdit) {
        await apiClient.updateRubric(rubricId, {
          name: draft.name.trim(),
          outcome: draft.outcome,
          type: draft.type,
          status,
          matrix: draft.matrix,
        });
        toast.success(status === "published" ? "Rubric updated & published" : "Rubric saved as draft", {
          description: draft.name,
        });
      } else {
        const created = await apiClient.createRubric({
          name: draft.name.trim(),
          outcome: draft.outcome,
          type: draft.type,
          status,
          matrix: draft.matrix,
        });
        toast.success(status === "published" ? "Rubric published" : "Rubric saved as draft", {
          description: created.name,
        });
      }
      router.push(ROUTES.admin.rubrics.all);
    } catch {
      toast.error("Could not save the rubric. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Render the content for the active step.
  const content = (() => {
    if (!draft) {
      return (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading rubric…
        </div>
      );
    }
    switch (stepId) {
      case "info":
        return <StepInfo draft={draft} onPatch={handlePatch} />;
      case "criteria":
        return (
          <StepCriteria
            matrix={draft.matrix}
            type={draft.type}
            onMatrixChange={handleMatrixChange}
          />
        );
      case "rules":
        return (
          <StepRules matrix={draft.matrix} type={draft.type} onMatrixChange={handleMatrixChange} />
        );
      case "review":
        return <StepReview draft={draft} onJumpToStep={jumpToStep} />;
      default:
        return null;
    }
  })();

  const continueDisabled =
    !draft ||
    (isFirst && !isStep1Valid(draft)) ||
    (stepId === "rules" && !rulesValid);

  return (
    <WizardPage
      title={isEdit ? "Edit Rubric" : "New Rubric"}
      description={
        isEdit
          ? "Update the rubric definition. Changes apply wherever this rubric is already attached."
          : "Define a reusable assessment structure. Grade Rules and Review will be added in upcoming PRs."
      }
      steps={STEPS}
      currentStep={stepId}
      onStepClick={(id) => jumpToStep(id as StepId)}
      isStepLocked={isStepLocked}
      content={content}
      actions={
        <div className="flex w-full items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(ROUTES.admin.rubrics.all)}
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
                  onClick={() => draft && draft.type && handleSave("draft")}
                  disabled={submitting || !draft || !draft.type}
                >
                  <Save className="mr-1.5 size-4" />
                  Save Draft
                </Button>
                <Button onClick={goNext} disabled={continueDisabled}>
                  Continue
                  <ArrowRight className="ml-1.5 size-4" />
                </Button>
              </>
            )}
            {isLast && (
              <>
                <Button
                  variant="outline"
                  onClick={() => draft && draft.type && handleSave("draft")}
                  disabled={submitting || !draft || !draft.type}
                >
                  <Save className="mr-1.5 size-4" />
                  Save Draft
                </Button>
                <Button
                  onClick={() => draft && handleSave("published")}
                  disabled={submitting || !draft || !isRubricPublishable(draft)}
                >
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