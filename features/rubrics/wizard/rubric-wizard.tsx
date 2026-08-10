"use client";

/**
 * Self-contained Rubric creation/edit wizard.
 *
 * Owns the draft state, validation, and submit logic for the 4-step
 * rubric builder (`info` → `criteria` → `rules` → `review`). Designed
 * to be mounted in two places:
 *   - The full `/rubrics/form/[id]` route page (with `WizardPage`
 *     chrome wrapping it).
 *   - Inline inside a `Dialog` from the assignment wizard's "New
 *     rubric" button (with `compact` enabled).
 *
 * Embeds the same `StepInfo` / `StepCriteria` / `StepRules` /
 * `StepReview` components used by the route page so behaviour stays
 * identical between the two entry points.
 */
import { useEffect, useMemo, useRef, useState } from "react";

import { ArrowLeft, ArrowRight, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { apiClient } from "@/services/api-client";
import type { Rubric, RubricMatrix, RubricStatus } from "@/types/rubric";

import { StepCriteria } from "@/features/rubrics/wizard/steps/step-criteria";
import { StepInfo, type RubricDraft } from "@/features/rubrics/wizard/steps/step-info";
import { StepReview } from "@/features/rubrics/wizard/steps/step-review";
import { StepRules } from "@/features/rubrics/wizard/steps/step-rules";
import {
  getCriteriaValidation,
  getRulesValidation,
  isRubricPublishable,
  isStep1Valid,
} from "@/features/rubrics/wizard/validation";

const STEPS = [
  { id: "info", title: "Rubric Info", description: "Name, type, outcome" },
  { id: "criteria", title: "Criteria & Levels", description: "Build the matrix" },
  { id: "rules", title: "Grade Rules", description: "Scoring method" },
  { id: "review", title: "Review", description: "Save or publish" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

export interface RubricWizardProps {
  mode: "create" | "edit";
  /** "0" for create, real id for edit. Defaults to "0". */
  initialRubricId?: string;
  /** Called after a successful save with the saved rubric. */
  onSubmitted?: (rubric: Rubric) => void;
  /** Called when the user clicks Cancel. */
  onCancel?: () => void;
  /** Strip page-level chrome and tighten padding for modal use. */
  compact?: boolean;
  className?: string;
}

export function RubricWizard({
  mode,
  initialRubricId = "0",
  onSubmitted,
  onCancel,
  compact = false,
  className,
}: RubricWizardProps) {
  const [stepId, setStepId] = useState<StepId>("info");
  const [draft, setDraft] = useState<RubricDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [maxReachedIdx, setMaxReachedIdx] = useState(0);

  const stepperSentinelRef = useRef<HTMLDivElement | null>(null);
  const stepperRef = useRef<HTMLOListElement | null>(null);
  useEffect(() => {
    const sentinel = stepperSentinelRef.current;
    const stepper = stepperRef.current;
    if (!sentinel || !stepper || compact) return;
    const observer = new IntersectionObserver(
      ([entry]) =>
        stepper.setAttribute("data-stuck", entry.isIntersecting ? "false" : "true"),
      { threshold: [1] },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [compact]);

  useEffect(() => {
    let cancelled = false;
    apiClient.getRubricDraft(initialRubricId).then((d) => {
      if (!cancelled) setDraft(d);
    });
    return () => {
      cancelled = true;
    };
  }, [initialRubricId]);

  const currentIdx = STEPS.findIndex((s) => s.id === stepId);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === STEPS.length - 1;

  const goNext = () => {
    if (currentIdx < STEPS.length - 1) {
      const nextIdx = currentIdx + 1;
      setMaxReachedIdx((m) => Math.max(m, nextIdx));
      setStepId(STEPS[nextIdx]!.id);
    }
  };
  const goBack = () => {
    if (currentIdx > 0) setStepId(STEPS[currentIdx - 1]!.id);
  };
  const jumpToStep = (id: StepId) => {
    const targetIdx = STEPS.findIndex((s) => s.id === id);
    if (targetIdx > maxReachedIdx) return;
    setStepId(id);
  };

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

  const isStepLocked = (id: StepId): boolean => {
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

  const handleSave = async (status: RubricStatus): Promise<void> => {
    if (!draft || !isStep1Valid(draft) || !draft.type) return;
    if (status === "published" && !isRubricPublishable(draft)) return;
    setSubmitting(true);
    try {
      const payload = {
        name: draft.name.trim(),
        outcome: draft.outcome,
        type: draft.type,
        status,
        matrix: draft.matrix,
      };
      const saved =
        mode === "edit"
          ? await apiClient.updateRubric(initialRubricId, payload)
          : await apiClient.createRubric(payload);
      if (saved) onSubmitted?.(saved);
    } finally {
      setSubmitting(false);
    }
  };

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
        return <StepReview draft={draft} onJumpToStep={jumpToStep} compact={compact} />;
      default:
        return null;
    }
  })();

  const continueDisabled =
    !draft ||
    (isFirst && !isStep1Valid(draft)) ||
    (stepId === "rules" && !rulesValid);

  return (
    <div className={cn("flex w-full flex-col gap-4", className)}>
      {!compact && <div ref={stepperSentinelRef} aria-hidden className="h-0 w-full" />}
      <ol
        ref={stepperRef}
        aria-label="Wizard steps"
        className={cn(
          "flex w-full items-center gap-2 overflow-x-auto rounded-lg border bg-card p-3 shadow-soft data-[stuck=true]:rounded-t-none",
          !compact && "sticky top-0 z-sticky",
          compact && "p-2",
        )}
      >
        {STEPS.map((step, idx) => {
          const active = stepId === step.id;
          const completed = !active && idx < maxReachedIdx && stepIsValid(idx);
          const status = completed ? "done" : active ? "current" : "upcoming";
          const isLast = idx === STEPS.length - 1;
          const locked = isStepLocked(step.id);
          const chip = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  status === "done" && "bg-success text-success-foreground",
                  status === "current" && "bg-primary text-primary-foreground",
                  status === "upcoming" && "border bg-background text-muted-foreground",
                )}
                aria-hidden
              >
                {status === "done" ? "✓" : idx + 1}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  status === "current" && "font-semibold text-foreground",
                  status === "done" && "font-medium text-foreground",
                  status === "upcoming" && "font-normal text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              aria-current={status === "current" ? "step" : undefined}
              className={cn("flex flex-1 items-center gap-3", !isLast && "pr-2")}
            >
              <div className="flex flex-1 items-center gap-3">
                <button
                  type="button"
                  onClick={() => !locked && jumpToStep(step.id)}
                  disabled={locked}
                  aria-label={`${step.title}${locked ? " (locked)" : ""}`}
                  title={locked ? "Complete earlier steps to unlock" : undefined}
                  className={cn(
                    "flex flex-1 items-center gap-3 rounded-md text-left transition-colors",
                    !locked && "hover:bg-accent/40",
                    locked && "cursor-not-allowed opacity-60",
                  )}
                >
                  {chip}
                </button>
              </div>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px min-w-[24px] flex-1 border-t",
                    status === "done" ? "border-primary" : "border-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className={cn("rounded-lg border bg-card p-4 shadow-soft", compact && "p-3")}>
        {content}
      </div>

      <div className="flex w-full items-center justify-between gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
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
                onClick={() => handleSave("draft")}
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
                onClick={() => handleSave("draft")}
                disabled={submitting || !draft || !draft.type}
              >
                <Save className="mr-1.5 size-4" />
                Save Draft
              </Button>
              <Button
                onClick={() => handleSave("published")}
                disabled={submitting || !draft || !isRubricPublishable(draft)}
              >
                Publish
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
