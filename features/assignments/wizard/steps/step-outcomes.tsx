"use client";

import { useEffect, useRef, useState } from "react";

import { RichTextEditor } from "@/components/composite/rich-text-editor";
import { FormSection } from "@/components/composite/form-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { AssignmentDraft } from "@/features/assignments/wizard/types";
import { apiClient } from "@/services/api-client";
import type { Rubric } from "@/types/rubric";

export interface StepOutcomesProps {
  draft: AssignmentDraft;
  onPatch: (patch: Partial<AssignmentDraft>) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function StepOutcomes({ draft, onPatch }: StepOutcomesProps) {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const lastAutoRubricId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!draft.rubricId) {
      setRubric(null);
      return;
    }
    apiClient.getRubric(draft.rubricId).then((res) => {
      if (!cancelled) setRubric(res);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.rubricId]);

  // Auto-fill the outcome from the rubric — but only when the rubric changes,
  // never when the user is actively editing within the same rubric.
  useEffect(() => {
    if (!draft.rubricId) return;
    if (lastAutoRubricId.current === draft.rubricId) return;
    lastAutoRubricId.current = draft.rubricId;
    if (rubric && !draft.outcomeOverrideEnabled) {
      onPatch({ outcome: rubric.outcome ?? "" });
    }
  }, [draft.rubricId, rubric, draft.outcomeOverrideEnabled, onPatch]);

  const toggleOverride = () => {
    const next = !draft.outcomeOverrideEnabled;
    const patch: Partial<AssignmentDraft> = { outcomeOverrideEnabled: next };
    // Turning override off resets to the rubric's outcome.
    if (!next && rubric) {
      patch.outcome = rubric.outcome ?? "";
    }
    onPatch(patch);
  };

  const hasRubricOutcome = !!rubric && stripHtml(rubric.outcome ?? "").length > 0;

  return (
    <div className="space-y-6">
      <FormSection
        title="Learning outcome"
        description="What learners should demonstrate by the end of this assignment. Pulled from the rubric by default; customize per-assignment without touching the rubric itself."
      >
        <div className="flex flex-wrap items-center gap-2">
          {draft.outcomeOverrideEnabled && (
            <Badge variant="warning" className="bg-warning/10 text-warning border-warning/30">
              Customized for this assignment
            </Badge>
          )}
          {rubric && (
            <span className="text-xs text-muted-foreground">
              Source rubric: <span className="font-medium text-foreground">{rubric.name}</span>
            </span>
          )}
          {!rubric && (
            <span className="text-xs text-muted-foreground">
              No rubric attached — write a standalone outcome or leave blank.
            </span>
          )}
        </div>

        {hasRubricOutcome && (
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Rubric default
            </div>
            <div
              className="prose prose-sm max-w-none text-foreground"
              dangerouslySetInnerHTML={{ __html: rubric!.outcome ?? "" }}
            />
          </div>
        )}

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Outcome for this assignment</div>
            {rubric && (
              <div className="flex items-center gap-2 text-xs">
                <Button
                  type="button"
                  variant={draft.outcomeOverrideEnabled ? "outline" : "secondary"}
                  size="sm"
                  onClick={toggleOverride}
                >
                  {draft.outcomeOverrideEnabled ? "Reset to rubric outcome" : "Customize for this assignment"}
                </Button>
              </div>
            )}
          </div>
          <RichTextEditor
            value={draft.outcome}
            onChange={(html) => {
              const patch: Partial<AssignmentDraft> = { outcome: html };
              if (rubric && !draft.outcomeOverrideEnabled) {
                patch.outcomeOverrideEnabled = true;
              }
              onPatch(patch);
            }}
            placeholder="What should a learner demonstrate?"
            minHeight={160}
            className={cn(!draft.outcomeOverrideEnabled && rubric ? "opacity-90" : "")}
          />
          <p className="text-xs text-muted-foreground">
            Type into this editor to set an assignment-specific outcome; the rubric itself
            is left untouched.
          </p>
        </div>
      </FormSection>
    </div>
  );
}
