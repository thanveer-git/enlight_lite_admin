"use client";

import { useEffect, useRef } from "react";

import { RichTextEditor } from "@/components/composite/rich-text-editor";
import { FormSection } from "@/components/composite/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FileList } from "@/features/assignments/wizard/components/file-list";
import type { AssignmentDraft } from "@/features/assignments/wizard/types";
import { SECTIONS } from "@/features/assignments/seed";

export interface StepDetailsProps {
  draft: AssignmentDraft;
  onPatch: (patch: Partial<AssignmentDraft>) => void;
}

export function StepDetails({ draft, onPatch }: StepDetailsProps) {
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  return (
    <div className="space-y-6">
      <FormSection
        title="Title & identity"
        description="The name students will see in their assignment list."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="asg-title">Title *</Label>
            <Input
              id="asg-title"
              ref={titleRef}
              placeholder="e.g. Essay: Argument Quality"
              value={draft.title}
              onChange={(e) => onPatch({ title: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asg-lecture-slug">Assignment lecture slug *</Label>
            <Input
              id="asg-lecture-slug"
              placeholder="e.g. essay-argument-quality"
              value={draft.lectureSlug}
              onChange={(e) => onPatch({ lectureSlug: e.target.value })}
            />
          </div>
        </div>

        <div className="grid items-start gap-2 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="asg-section">Section *</Label>
            <SearchableSelect
              triggerId="asg-section"
              value={draft.sectionId ?? ""}
              onChange={(v) => onPatch({ sectionId: v || null })}
              options={SECTIONS.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select a section…"
              searchPlaceholder="Search sections…"
              emptyMessage="No sections found."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="asg-word-limit">Word limit</Label>
            <Input
              id="asg-word-limit"
              type="number"
              min={0}
              placeholder="0 = no limit"
              value={draft.wordLimit ?? ""}
              onChange={(e) =>
                onPatch({
                  wordLimit: e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
            <p className="text-xs text-muted-foreground">
              Use 0 for no limit. Learners can still submit over the word count, but they&apos;ll see a warning before submitting.
            </p>
          </div>
        </div>
      </FormSection>

      <div className="grid gap-6 lg:grid-cols-4">
        <FormSection
          className="lg:col-span-3"
          title="Content & instructions"
          description="The brief learners will read before submitting."
        >
          <div className="grid gap-2">
            <Label>Instructions</Label>
            <RichTextEditor
              value={draft.content}
              onChange={(html) => onPatch({ content: html })}
              placeholder="Describe what learners should do, rubric expectations, and submission requirements."
              minHeight={160}
            />
          </div>
        </FormSection>

        <FormSection
          className="lg:col-span-1"
          title="Attached files"
          description="Optional resources students can download alongside the assignment."
        >
          <FileList files={draft.files} onChange={(files) => onPatch({ files })} />
        </FormSection>
      </div>
    </div>
  );
}
