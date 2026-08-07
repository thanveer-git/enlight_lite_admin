"use client";

import * as React from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
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

  const handleResetDates = () => {
    onChange({
      fromAt: null,
      dueAt: null,
      untilAt: null,
      updatedAt: Date.now(),
    });
  };

  const hasAnyDate = !!(rule.fromAt || rule.dueAt || rule.untilAt);

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
            <Label htmlFor={`student-${rule.id}`}>Student</Label>
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

        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Schedule</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDates}
            disabled={!hasAnyDate}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="mr-1 size-3.5" />
            Reset dates
          </Button>
        </div>

        <div className="grid gap-2">
          <Label>Available From</Label>
          <DateTimeField
            value={rule.fromAt}
            onChange={(v) => onChange({ fromAt: v, updatedAt: Date.now() })}
            placeholder="When opens"
          />
        </div>
        <div className="grid gap-2">
          <Label>Due Date</Label>
          <DateTimeField
            value={rule.dueAt}
            onChange={(v) => onChange({ dueAt: v, updatedAt: Date.now() })}
            placeholder="When due"
          />
        </div>
        <div className="grid gap-2">
          <Label>Available Until</Label>
          <DateTimeField
            value={rule.untilAt}
            onChange={(v) => onChange({ untilAt: v, updatedAt: Date.now() })}
            placeholder="When closes"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <Switch
          id={`notify-${rule.id}`}
          checked={rule.notify}
          onCheckedChange={(v) => onChange({ notify: v })}
        />
        <Label className="cursor-pointer text-sm" htmlFor={`notify-${rule.id}`}>
          Notify learners affected by this rule
        </Label>
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
