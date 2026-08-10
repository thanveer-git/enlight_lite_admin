"use client";

import * as React from "react";
import { RotateCcw, Trash2, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDatetimpicker } from "@/components/ui/edatetimpicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  AUDIENCE_LABELS,
  PRIORITY_OF,
  type AccessRule,
  type AudienceType,
} from "@/features/assignments/wizard/types";
import type { StudentLite } from "@/features/assignments/seed";

export interface AccessRuleCardProps {
  rule: AccessRule;
  index: number;
  canRemove: boolean;
  students: StudentLite[];
  onChange: (patch: Partial<AccessRule>) => void;
  onRemove: () => void;
}

const PRIORITY_TONE: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-warning/10 text-warning border-warning/30",
  low: "bg-muted text-muted-foreground border-border",
};

// AccessRule stores timestamps as ISO strings; EDatetimpicker works with
// Date values, so adapt across the boundary.
const isoToDate = (v: string | null): Date | undefined =>
  v ? new Date(v) : undefined;
const dateToIso = (d: Date | undefined): string | null =>
  d ? d.toISOString() : null;

export function AccessRuleCard({
  rule,
  index,
  canRemove,
  students,
  onChange,
  onRemove,
}: AccessRuleCardProps) {
  const priority = PRIORITY_OF[rule.audience];
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const onAudienceChange = (next: AudienceType) => {
    // Switching audience clears student selections per spec.
    onChange({ audience: next, studentIds: [], updatedAt: Date.now() });
  };

  const handleConfirmRemove = () => {
    setConfirmOpen(false);
    onRemove();
  };

  const handleResetField = (field: "fromAt" | "dueAt" | "untilAt") => {
    onChange({ [field]: null, updatedAt: Date.now() });
  };

  return (
    <div className="rounded-lg border bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Rule {index + 1}</span>
          <Badge variant="outline" className={cn("capitalize", PRIORITY_TONE[priority])}>
            {priority} priority
          </Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setConfirmOpen(true)}
          disabled={!canRemove}
          aria-label={`Remove rule ${index + 1}`}
          className="size-7"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label>Assign to</Label>
          <RadioGroup
            value={rule.audience}
            onValueChange={(v) => onAudienceChange(v as AudienceType)}
            className="flex gap-2"
          >
            {(Object.keys(AUDIENCE_LABELS) as AudienceType[]).map((key) => (
              <Label
                key={key}
                htmlFor={`audience-${rule.id}-${key}`}
                className={cn(
                  "flex flex-1 cursor-pointer items-center gap-2 rounded-md border bg-background p-2.5 text-sm transition-colors",
                  rule.audience === key
                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                    : "hover:border-foreground/20",
                )}
              >
                <RadioGroupItem value={key} id={`audience-${rule.id}-${key}`} />
                <span>{AUDIENCE_LABELS[key]}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {rule.audience === "single" && (
          <div className="grid gap-2">
            <Label htmlFor={`student-${rule.id}`}>Learners</Label>
            <SearchableSelect
              triggerId={`student-${rule.id}`}
              value={rule.studentIds[0] ?? ""}
              onChange={(v) =>
                onChange({
                  studentIds: v ? [v] : [],
                  updatedAt: Date.now(),
                })
              }
              options={students.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select a student…"
              searchPlaceholder="Search students…"
              emptyMessage="No students found."
            />
          </div>
        )}

        {rule.audience === "multiple" && (
          <div className="grid gap-2">
            <Label>Students</Label>
            <SearchableSelect
              multiple
              value={rule.studentIds}
              onChange={(ids) =>
                onChange({ studentIds: ids, updatedAt: Date.now() })
              }
              options={students.map((s) => ({ value: s.id, label: s.name }))}
              placeholder="Select students…"
              searchPlaceholder="Search students…"
              emptyMessage="No students found."
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label>Available From</Label>
          <div className="flex items-center gap-2">
            <EDatetimpicker
              value={isoToDate(rule.fromAt)}
              onChange={(v) => onChange({ fromAt: dateToIso(v), updatedAt: Date.now() })}
              placeholder="When opens"
              className="min-w-0 flex-[3]"
              hourFormat={12}
              timeInterval={15}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleResetField("fromAt")}
              disabled={!rule.fromAt}
              className="h-9 flex-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Reset Available From"
            >
              <RotateCcw className="mr-1 size-3.5" />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Due Date</Label>
          <div className="flex items-center gap-2">
            <EDatetimpicker
              value={isoToDate(rule.dueAt)}
              onChange={(v) => onChange({ dueAt: dateToIso(v), updatedAt: Date.now() })}
              placeholder="When due"
              className="min-w-0 flex-[3]"
              hourFormat={12}
              timeInterval={15}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleResetField("dueAt")}
              disabled={!rule.dueAt}
              className="h-9 flex-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Reset Due Date"
            >
              <RotateCcw className="mr-1 size-3.5" />
              Reset
            </Button>
          </div>
        </div>
        <div className="grid gap-2">
          <Label>Available Until</Label>
          <div className="flex items-center gap-2">
            <EDatetimpicker
              value={isoToDate(rule.untilAt)}
              onChange={(v) => onChange({ untilAt: dateToIso(v), updatedAt: Date.now() })}
              placeholder="When closes"
              className="min-w-0 flex-[3]"
              hourFormat={12}
              timeInterval={15}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleResetField("untilAt")}
              disabled={!rule.untilAt}
              className="h-9 flex-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Reset Available Until"
            >
              <RotateCcw className="mr-1 size-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-3">
        <TriangleAlert className="size-4 shrink-0 text-warning" />
        <Label className="flex-1 cursor-pointer text-sm" htmlFor={`notify-${rule.id}`}>
          Notify learners affected by this rule
        </Label>
        <Switch
          id={`notify-${rule.id}`}
          checked={rule.notify}
          onCheckedChange={(v) => onChange({ notify: v })}
        />
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete rule {index + 1}?</DialogTitle>
            <DialogDescription>
              This will remove the rule and any student selections it contains. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmRemove}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
