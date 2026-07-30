"use client";

/**
 * Action bar with Save + Mark Complete + Notify.
 *
 * Document §4.13: the save modal copy changes based on completion,
 * pass/fail, and min-pass state. Document §4.14: when completion is
 * off and the access window is closed, save is blocked.
 */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, MailPlus, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { DerivedEvaluation } from "@/features/evaluation/derive";

interface ActionBarProps {
  derived: DerivedEvaluation;
  markComplete: boolean;
  notifyLearner: boolean;
  onMarkCompleteChange: (next: boolean) => void;
  onNotifyChange: (next: boolean) => void;
  onSave: () => void;
}

export function ActionBar({
  derived,
  markComplete,
  notifyLearner,
  onMarkCompleteChange,
  onNotifyChange,
  onSave,
}: ActionBarProps) {
  const [confirming, setConfirming] = useState(false);
  const minPassFailed = derived.minPassOverride != null;
  const passed = derived.passFail === "pass";
  const gated = derived.saveBlocked;

  const handleConfirm = () => {
    setConfirming(false);
    onSave();
  };

  return (
    <section className="space-y-4">
      <div className="space-y-3">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-success" aria-hidden />
            <span className="text-sm font-medium">Mark as complete</span>
            {markComplete && passed && (
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                Auto
              </span>
            )}
          </span>
          <Switch
            checked={markComplete}
            onCheckedChange={onMarkCompleteChange}
            aria-label="Mark as complete"
          />
        </label>

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2">
          <span className="flex items-center gap-2">
            <MailPlus className="size-4 text-primary" aria-hidden />
            <span className="text-sm font-medium">Notify learner on save</span>
          </span>
          <Switch
            checked={notifyLearner}
            onCheckedChange={onNotifyChange}
            aria-label="Notify learner on save"
          />
        </label>
      </div>

      <Separator />

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          {gated
            ? derived.saveBlockReason
            : markComplete
              ? "Saving will set this submission to graded."
              : "Saving will leave this submission open for resubmission."}
        </p>
        <Button
          onClick={() => {
            if (gated) {
              toast.error(derived.saveBlockReason ?? "Cannot save yet.");
              return;
            }
            setConfirming(true);
          }}
          disabled={gated && !markComplete}
        >
          <Save className="mr-1.5 size-4" />
          Save evaluation
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {minPassFailed && (
                <AlertTriangle className="size-4 text-warning" aria-hidden />
              )}
              {confirmTitle(markComplete, passed, minPassFailed)}
            </DialogTitle>
            <DialogDescription>
              {confirmBody(markComplete, passed, minPassFailed)}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={handleConfirm} className="rounded-xl">
              Confirm save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function confirmTitle(markComplete: boolean, passed: boolean, minPassFailed: boolean): string {
  if (minPassFailed && markComplete) {
    return "Complete despite failed minimum?";
  }
  if (markComplete && passed) {
    return "Complete and grade?";
  }
  if (markComplete) {
    return "Complete grading?";
  }
  return "Leave open for resubmission?";
}

function confirmBody(markComplete: boolean, passed: boolean, minPassFailed: boolean): string {
  if (minPassFailed && markComplete) {
    return "The minimum-pass rule failed. The result will be saved as graded; learner will see the failed minimum on release.";
  }
  if (markComplete && passed) {
    return "Saving will mark this submission as graded and notify the learner (if enabled).";
  }
  if (markComplete) {
    return "Saving will mark this submission as graded and release the result.";
  }
  return "Saving will keep this submission open for resubmission. Confirm only when the learner's access window allows another attempt.";
}
