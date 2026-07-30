"use client";

import { useEffect, useRef } from "react";

import { RichTextEditor } from "@/components/composite/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import type { RubricDraft } from "@/features/rubrics/wizard/types";
import { cn } from "@/lib/utils";
import type { RubricType } from "@/types/rubric";

export type { RubricDraft };

export interface StepInfoProps {
  draft: RubricDraft;
  onPatch: (patch: Partial<RubricDraft>) => void;
}

export function StepInfo({ draft, onPatch }: StepInfoProps) {
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-base">Basic Information</h3>
        <p className="text-sm text-muted-foreground">Name and learning outcome for this rubric.</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rubric-name">Rubric name</Label>
        <Input
          id="rubric-name"
          ref={nameRef}
          placeholder="e.g. Essay Writing – Argument Quality"
          value={draft.name}
          onChange={(e) => onPatch({ name: e.target.value })}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="rubric-outcome">Learning outcome</Label>
        <RichTextEditor
          value={draft.outcome}
          onChange={(html) => onPatch({ outcome: html })}
          placeholder="What should a learner demonstrate by the time they finish this assessment?"
          minHeight={140}
        />
        <p className="text-xs text-muted-foreground">
          Use formatting to make the expected outcome easy to scan.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="font-semibold text-base">Type</h3>
        <p className="text-sm text-muted-foreground">
          Whether this rubric uses numerical points or descriptive ratings only.
        </p>
      </div>

      <RadioGroup
        value={draft.type ?? undefined}
        onValueChange={(value) => onPatch({ type: value as RubricType })}
        className="grid gap-3 sm:grid-cols-2"
      >
        <Label
          htmlFor="type-scored"
          className={cn(
            "flex cursor-pointer flex-col gap-2 rounded-md border bg-card p-3 transition-colors",
            draft.type === "scored"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "hover:border-foreground/20",
          )}
        >
          <span className="flex items-center gap-2">
            <RadioGroupItem value="scored" id="type-scored" className="shrink-0" />
            <span className="font-medium text-foreground">Scored</span>
          </span>
          <span className="pl-6 text-xs text-muted-foreground">
            Uses numerical points per level. Final grade via weighted average or Grade Profile.
          </span>
        </Label>
        <Label
          htmlFor="type-unscored"
          className={cn(
            "flex cursor-pointer flex-col gap-2 rounded-md border bg-card p-3 transition-colors",
            draft.type === "unscored"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "hover:border-foreground/20",
          )}
        >
          <span className="flex items-center gap-2">
            <RadioGroupItem value="unscored" id="type-unscored" className="shrink-0" />
            <span className="font-medium text-foreground">Unscored</span>
          </span>
          <span className="pl-6 text-xs text-muted-foreground">
            Descriptive ratings only. Grade Profile rules map combinations to grade labels.
          </span>
        </Label>
      </RadioGroup>
    </div>
  );
}
