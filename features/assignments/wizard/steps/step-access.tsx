"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/composite/form-section";

import { AccessRuleCard } from "@/features/assignments/wizard/components/access-rule-card";
import { ResolvedPreview } from "@/features/assignments/wizard/components/resolved-preview";
import {
  emptyAccessRule,
  type AccessRule,
  type AssignmentDraft,
} from "@/features/assignments/wizard/types";
import { STUDENTS } from "@/features/assignments/seed";

export interface StepAccessProps {
  draft: AssignmentDraft;
  onPatch: (patch: Partial<AssignmentDraft>) => void;
}

export function StepAccess({ draft, onPatch }: StepAccessProps) {
  const updateRule = (id: string, patch: Partial<AccessRule>) => {
    onPatch({
      accessRules: draft.accessRules.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    });
  };

  const removeRule = (id: string) => {
    if (draft.accessRules.length <= 1) return;
    onPatch({ accessRules: draft.accessRules.filter((r) => r.id !== id) });
  };

  const addRule = () => {
    onPatch({ accessRules: [...draft.accessRules, emptyAccessRule()] });
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Access rules"
        description="Define who can see and submit this assignment, and when. Each rule is evaluated by priority — Single Student overrides Multiple, which overrides Everyone — with field-level inheritance."
        actions={<ResolvedPreview rules={draft.accessRules} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {draft.accessRules.map((rule, idx) => (
            <AccessRuleCard
              key={rule.id}
              rule={rule}
              index={idx}
              canRemove={draft.accessRules.length > 1}
              students={STUDENTS}
              onChange={(patch) => updateRule(rule.id, patch)}
              onRemove={() => removeRule(rule.id)}
            />
          ))}
          <div className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={addRule} className="self-start">
              <Plus className="mr-1 size-4" />
              Add rule
            </Button>
          </div>
        </div>
      </FormSection>
    </div>
  );
}
