"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RubricWizard } from "@/features/rubrics/wizard/rubric-wizard";
import type { Rubric } from "@/types/rubric";

export interface InlineRubricModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the freshly created rubric so the host can refresh
   * its list and optionally auto-select the new rubric. */
  onCreated?: (rubric: Rubric) => void;
}

export function InlineRubricModal({ open, onOpenChange, onCreated }: InlineRubricModalProps) {
  // Re-key the wizard on each open so a previous draft doesn't persist.
  const [wizardKey, setWizardKey] = useState(0);
  useEffect(() => {
    if (open) setWizardKey((k) => k + 1);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-7xl gap-3 p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New rubric</DialogTitle>
          <DialogDescription>
            Build a reusable rubric. It will be available to attach to this assignment
            (and others) as soon as you save.
          </DialogDescription>
        </DialogHeader>
        <RubricWizard
          key={wizardKey}
          mode="create"
          compact
          onCancel={() => onOpenChange(false)}
          onSubmitted={(rubric) => {
            onCreated?.(rubric);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
