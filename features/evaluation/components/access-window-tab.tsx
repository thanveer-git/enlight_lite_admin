"use client";

/**
 * Access Window editor — document §4.15.
 *
 * Inline, per-learner editor that lives on the evaluation page. It
 * resolves the current attempt's submission window
 * (Available From / Due / Until) and lets the evaluator extend the
 * Until time when resubmission needs more time.
 *
 * The "Save evaluation" gate (§4.14) blocks saving an evaluation as
 * `resubmit` while the resolved window is closed; this editor is the
 * place the evaluator is sent when that gate fires.
 *
 * State is held locally and propagated up via `onChange` for the page
 * client to relay to `useEvaluationStore`, matching the prototype
 * "draft/global state" persistence model from §4.15.
 */
import { useMemo, useState } from "react";
import { differenceInMinutes, format } from "date-fns";
import { Clock, Lock, Unlock } from "lucide-react";

import { ECard } from "@/components/composite/e-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DateTimeField } from "@/components/ui/date-time-field";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

import type { AttemptRecord } from "../types";

export type AccessWindowStatus =
  | "notYetOpen"
  | "open"
  | "late"
  | "closed";

export interface AccessWindowModel {
  /** ISO timestamp. Optional — undefined means "always open". */
  availableAt: string | null;
  /** ISO timestamp. Always present (anchored to `dueAt` if missing). */
  dueAt: string;
  /** ISO timestamp. Optional — undefined means "no hard close". */
  untilAt: string | null;
}

export interface AccessWindowEditorProps {
  attempt: Pick<AttemptRecord, "attemptNumber" | "submittedAt" | "dueAt" | "availableAt" | "untilAt">;
  /** Patches the resolved window. Caller wires it into the eval store. */
  onChange: (next: AccessWindowModel) => void;
}

/**
 * Compute the resolved access window for an attempt. Falls back to
 * sensible defaults when optional fields are missing so the editor
 * always has a complete window to render.
 */
export function resolveAccessWindow(
  attempt: Pick<AttemptRecord, "submittedAt" | "dueAt" | "availableAt" | "untilAt">,
  now: Date = new Date(),
): AccessWindowModel {
  // Available From — prefer the explicit opener; otherwise infer
  // "submitted 24h before due" so the editor still has a value to
  // display. Stored as null = "always open" semantically.
  const availableAt = attempt.availableAt ?? null;
  const dueAt = attempt.dueAt;
  // Until — prefer the explicit close; otherwise default to 24h after
  // the due time. Stored as null = "no hard close" semantically.
  const untilAt = attempt.untilAt ?? null;
  return { availableAt, dueAt, untilAt };
}

export function describeAccessWindow(model: AccessWindowModel, now: Date = new Date()): {
  status: AccessWindowStatus;
  label: string;
  detail: string;
} {
  const nowMs = now.getTime();
  const open = model.availableAt ? new Date(model.availableAt).getTime() : null;
  const due = new Date(model.dueAt).getTime();
  const close = model.untilAt ? new Date(model.untilAt).getTime() : null;

  if (close != null && nowMs > close) {
    return {
      status: "closed",
      label: "Closed",
      detail: `Resubmission is blocked since ${format(new Date(close), "MMM d, yyyy 'at' h:mm a")}.`,
    };
  }
  if (open != null && nowMs < open) {
    return {
      status: "notYetOpen",
      label: "Not yet open",
      detail: `Opens ${format(new Date(open), "MMM d, yyyy 'at' h:mm a")}.`,
    };
  }
  if (nowMs > due) {
    const mins = differenceInMinutes(nowMs, due);
    return {
      status: "late",
      label: "Late window",
      detail: `Past due ${format(new Date(due), "MMM d, yyyy 'at' h:mm a")}${mins > 0 ? ` (${formatLead(mins)} ago)` : ""}.`,
    };
  }
  return {
    status: "open",
    label: "Open",
    detail: `Submissions allowed through ${format(new Date(due), "MMM d, yyyy 'at' h:mm a")}.`,
  };
}

export function AccessWindowEditor({ attempt, onChange }: AccessWindowEditorProps) {
  const resolved = useMemo(() => resolveAccessWindow(attempt), [attempt]);
  const [draft, setDraft] = useState<AccessWindowModel>(resolved);

  // Keep local draft in sync if the upstream attempt changes (e.g.
  // user switches to a different attempt via the dropdown).
  const attemptKey = `${attempt.attemptNumber}|${attempt.dueAt}|${attempt.availableAt ?? ""}|${attempt.untilAt ?? ""}`;
  const [lastKey, setLastKey] = useState(attemptKey);
  if (lastKey !== attemptKey) {
    setLastKey(attemptKey);
    setDraft(resolved);
  }

  const status = describeAccessWindow(draft);
  const isClosed = status.status === "closed";
  const isNotYetOpen = status.status === "notYetOpen";

  const updateField = (patch: Partial<AccessWindowModel>) => {
    setDraft((prev) => {
      const next = { ...prev, ...patch };
      onChange(next);
      return next;
    });
  };

  /** Extend the Until time by N hours from the current value. */
  const extendUntil = (hours: number) => {
    const base = draft.untilAt ? new Date(draft.untilAt) : new Date();
    const next = new Date(base.getTime() + hours * 60 * 60 * 1000);
    updateField({ untilAt: next.toISOString() });
  };

  /** Set Until to 24h after the due time (a sensible default extension). */
  const extendToDuePlusOneDay = () => {
    const due = new Date(draft.dueAt);
    const next = new Date(due.getTime() + 24 * 60 * 60 * 1000);
    updateField({ untilAt: next.toISOString() });
  };

  return (
    <ECard className="space-y-4 rounded-xl border-border/60 p-0 shadow-soft">
      <ECard.Header className="border-b border-border/60 px-4 py-3">
        <div className="flex flex-nowrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Clock className="size-3.5" aria-hidden />
            Access Window
          </h3>
          <Badge variant="outline" className="shrink-0 rounded-full text-[10px]">
            {status.label}
          </Badge>
        </div>
      </ECard.Header>

      <ECard.Body className="space-y-4 p-4">
        {/* Status banner */}
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
            status.status === "open" && "border-success/30 bg-success/5 text-success",
            status.status === "late" && "border-warning/40 bg-warning/10 text-warning",
            status.status === "closed" && "border-destructive/40 bg-destructive/10 text-destructive",
            status.status === "notYetOpen" && "border-border/60 bg-muted/30 text-muted-foreground",
          )}
        >
          <StatusIcon status={status.status} className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{status.label}</span>
              <Badge variant="outline" className="rounded-full text-[10px]">
                {status.status === "closed"
                  ? "Save blocked until window is open"
                  : status.status === "notYetOpen"
                    ? "Resubmission not yet open"
                    : "Learner can resubmit"}
              </Badge>
            </div>
            <p className="text-[11px] leading-snug text-foreground/80">{status.detail}</p>
          </div>
        </div>

        {/* Quick actions when the window has closed or hasn't opened yet */}
        {(isClosed || isNotYetOpen) && (
          <div className="rounded-lg border border-dashed bg-muted/20 p-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Quick extend
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Extend the Until time so the learner can resubmit, then save the evaluation as
              <span className="font-semibold"> resubmit</span>.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => extendUntil(24)} className="rounded-xl">
                +24h
              </Button>
              <Button size="sm" variant="outline" onClick={() => extendUntil(72)} className="rounded-xl">
                +3 days
              </Button>
              <Button size="sm" variant="outline" onClick={() => extendUntil(168)} className="rounded-xl">
                +1 week
              </Button>
              <Button size="sm" onClick={extendToDuePlusOneDay} className="rounded-xl">
                Until due + 1 day
              </Button>
            </div>
          </div>
        )}

        {/* Date editor — same container as the banner above. */}
        <div className="space-y-3 border-t border-border/60 pt-3">
          <FieldGroup
            label="Available From"
            helper="Learner cannot submit before this time."
          >
            <DateTimeField
              value={draft.availableAt}
              onChange={(v) => updateField({ availableAt: v })}
            />
          </FieldGroup>
          <FieldGroup
            label="Due"
            helper="Submission after this time is late."
            required
          >
            <DateTimeField
              value={draft.dueAt}
              onChange={(v) => updateField({ dueAt: v ?? attempt.dueAt })}
              emphasis={false}
            />
          </FieldGroup>
          <FieldGroup
            label="Until"
            helper="Hard close — submission is blocked after this time."
          >
            <DateTimeField
              value={draft.untilAt}
              onChange={(v) => updateField({ untilAt: v })}
              emphasis={isClosed}
            />
          </FieldGroup>
        </div>
      </ECard.Body>
    </ECard>
  );
}

function StatusIcon({ status, className }: { status: AccessWindowStatus; className?: string }) {
  const Icon = status === "closed" ? Lock : Unlock;
  return <Icon className={className} aria-hidden />;
}

function FieldGroup({
  label,
  helper,
  required,
  children,
}: {
  label: string;
  helper: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      {children}
      <p className="text-[10px] text-muted-foreground">{helper}</p>
    </div>
  );
}

function formatLead(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  const days = Math.floor(minutes / (60 * 24));
  const remHr = Math.floor((minutes - days * 60 * 24) / 60);
  return remHr === 0 ? `${days}d` : `${days}d ${remHr}h`;
}
