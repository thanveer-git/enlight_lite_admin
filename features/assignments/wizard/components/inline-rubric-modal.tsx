"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface InlineRubricModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InlineRubricModal({ open, onOpenChange }: InlineRubricModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New rubric</DialogTitle>
          <DialogDescription>
            The full rubric builder is opened here without leaving the assignment wizard.
            For this prototype the embedded builder is not yet wired up — open the
            Rubrics app to create one, then come back to select it.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
          Embeddable rubric wizard (4 steps) lands in a follow-up PR.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
