"use client";

import { useEffect, useMemo, useState } from "react";

import { Play } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  resolveAccessForStudent,
  type ResolvedField,
} from "@/features/assignments/wizard/access";
import { STUDENTS, type StudentLite } from "@/features/assignments/seed";
import type { AccessRule } from "@/features/assignments/wizard/types";

export interface ResolvedPreviewProps {
  rules: AccessRule[];
  className?: string;
}

const FIELD_LABELS: Record<string, string> = {
  fromAt: "Available From",
  dueAt: "Due Date",
  untilAt: "Available Until",
};

function FieldRow({ fieldKey, field }: { fieldKey: string; field: ResolvedField }) {
  const display = field.value ? formatDate(field.value) : "Not set";
  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {FIELD_LABELS[fieldKey]}
        </span>
        {field.by ? (
          <Badge variant="outline" className="capitalize">
            {field.by}
          </Badge>
        ) : (
          <span className="text-[11px] text-muted-foreground">no rule</span>
        )}
      </div>
      <p className="mt-1 text-sm font-medium">{display}</p>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function ResolvedPreview({ rules, className }: ResolvedPreviewProps) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string>(STUDENTS[0]?.id ?? "");

  const firstCovered = useMemo(() => {
    for (const student of STUDENTS) {
      if (rules.some((r) => r.audience === "everyone" || r.studentIds.includes(student.id))) {
        return student.id;
      }
    }
    return STUDENTS[0]?.id ?? "";
  }, [rules]);

  useEffect(() => {
    if (!studentId || !STUDENTS.some((s) => s.id === studentId)) {
      setStudentId(firstCovered);
    }
  }, [firstCovered, studentId]);

  const resolved = useMemo(
    () => (studentId ? resolveAccessForStudent(rules, studentId) : null),
    [rules, studentId],
  );

  const noDates = !resolved || (!resolved.fromAt.value && !resolved.dueAt.value && !resolved.untilAt.value);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={className}
      >
        <Play className="mr-2 size-4" />
        Simulate access
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simulate access</DialogTitle>
            <DialogDescription>
              Pick a student to see the resolved dates from the rules above.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-3">
            <Label htmlFor="preview-student" className="shrink-0 text-sm">
              Student
            </Label>
            <select
              id="preview-student"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {STUDENTS.map((s: StudentLite) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <Separator />

          {noDates ? (
            <p className="text-sm text-muted-foreground">
              No rule currently sets any date for this student. Add at least one date to
              one of the rules to see the resolved value.
            </p>
          ) : resolved ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <FieldRow fieldKey="fromAt" field={resolved.fromAt} />
              <FieldRow fieldKey="dueAt" field={resolved.dueAt} />
              <FieldRow fieldKey="untilAt" field={resolved.untilAt} />
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Higher-priority rules (Single &gt; Multiple &gt; Everyone) override per-field;
            lower-priority values fill in any field the higher-priority rule leaves unset.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
