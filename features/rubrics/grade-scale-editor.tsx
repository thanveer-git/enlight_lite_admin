"use client";

import { useState } from "react";

import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type {
  GradeBandDraft,
  GradeScaleDraft,
} from "@/features/rubrics/grade-scale-default";
import type {
  ValidationIssue,
  ValidationWarning,
} from "@/features/rubrics/grade-scale-validation";
import type { GradeScaleStatus } from "@/features/rubrics/constants";
import { cn } from "@/lib/utils";

export type { GradeBandDraft, GradeScaleDraft } from "@/features/rubrics/grade-scale-default";
export type GradeScaleEditorDraft = GradeScaleDraft;

export interface GradeScaleEditorProps {
  draft: GradeScaleEditorDraft;
  issues: ValidationIssue[];
  warnings?: ValidationWarning[];
  onPatch: (patch: Partial<GradeScaleEditorDraft>) => void;
  onBandChange: (idx: number, patch: Partial<GradeBandDraft>) => void;
  onAddBand: () => void;
  onRemoveBand: (idx: number) => void;
}

function issueFor(issues: ValidationIssue[], field: string): string | undefined {
  return issues.find((i) => i.field === field)?.message;
}

/**
 * Write the raw text from a Min/Max cell into both `minRaw`/`maxRaw`
 * (preserved for blank/decimal detection) and `minMarks`/`maxMarks`
 * (parsed for display elsewhere). Empty input parses to 0 so the
 * persisted shape stays numeric.
 */
function parseRange(raw: string): { raw: string; value: number } {
  const trimmed = raw.trim();
  if (trimmed === "") return { raw, value: 0 };
  const num = Number(trimmed);
  return { raw, value: Number.isFinite(num) ? num : 0 };
}

const STATUS_DISPLAY: Record<
  GradeScaleStatus,
  { label: string; variant: "secondary" | "success" | "warning" | "default" }
> = {
  draft: { label: "Draft", variant: "secondary" },
  published: { label: "Published", variant: "success" },
  in_use: { label: "In Use", variant: "warning" },
  archived: { label: "Archived", variant: "secondary" },
};

function LifecycleStatusBadge({ status }: { status: GradeScaleStatus }) {
  const entry = STATUS_DISPLAY[status] ?? STATUS_DISPLAY.draft;
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
}

export function GradeScaleEditor({
  draft,
  issues,
  warnings = [],
  onPatch,
  onBandChange,
  onAddBand,
  onRemoveBand,
}: GradeScaleEditorProps) {
  const nameIssue = issueFor(issues, "name");
  const bandsIssue = issueFor(issues, "bands");
  const allPassIssue = issueFor(issues, "pf.allPass");
  const allFailIssue = issueFor(issues, "pf.allFail");
  const canRemove = draft.bands.length > 1;
  const [pendingRemoveIdx, setPendingRemoveIdx] = useState<number | null>(null);
  const pendingRemoveBand =
    pendingRemoveIdx !== null ? draft.bands[pendingRemoveIdx] : null;

  return (
    <div className="flex flex-col gap-6">
      {warnings.length > 0 && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <div className="flex flex-col gap-1">
            {warnings.map((w, i) => (
              <p key={i} className="text-amber-900">
                {w.message}
              </p>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            Name and describe the scale. The lifecycle status is set
            automatically when you save.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade-scale-name">Name</Label>
            <Input
              id="grade-scale-name"
              value={draft.name}
              maxLength={80}
              placeholder="e.g. Letter Grade Scale"
              onChange={(e) => onPatch({ name: e.target.value })}
              className={cn(nameIssue && "border-destructive focus-visible:ring-destructive")}
            />
            {nameIssue && (
              <p className="text-xs text-destructive">{nameIssue}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="grade-scale-description">Description</Label>
            <Textarea
              id="grade-scale-description"
              value={draft.description}
              placeholder="What does this grade scale mean and when should it be used?"
              rows={3}
              onChange={(e) => onPatch({ description: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Grading Mode</span>
            <div>
              <Badge variant="secondary">
                {draft.pfMode ? "Pass/Fail" : "Simple"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Lifecycle status</span>
            <div>
              <LifecycleStatusBadge status={draft.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Bands</CardTitle>
            <CardDescription>
              Define each band and its numeric range. Min/Max are whole
              percentages (0–100).
            </CardDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2 pt-1 whitespace-nowrap">
            <Label htmlFor="grade-scale-pfmode" className="text-sm whitespace-nowrap">
              Pass/Fail mode
            </Label>
            <Switch
              id="grade-scale-pfmode"
              checked={draft.pfMode}
              onCheckedChange={(v) => onPatch({ pfMode: v })}
              aria-label="Pass/Fail mode"
            />
          </div>
        </CardHeader>
        <div className="px-6 pb-4 text-xs text-muted-foreground">
          {draft.pfMode
            ? "On — every band needs an explicit Pass/Fail flag."
            : "Off — the lowest-scoring band is treated as the only Fail band."}
        </div>
        <CardContent className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-lg border border-border/70">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2 text-left font-medium">Grade</th>
                  <th className="px-3 py-2 text-left font-medium">Min %</th>
                  <th className="px-3 py-2 text-left font-medium">Max %</th>
                  {draft.pfMode && (
                    <th className="px-3 py-2 text-center font-medium">Pass</th>
                  )}
                  <th className="w-10 px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {draft.bands.map((band, idx) => {
                  const rowIssue = issueFor(issues, `bands.row.${idx}`);
                  const rangeIssue = issueFor(issues, `bands.range.${idx}`);
                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/40 last:border-b-0"
                    >
                      <td className="px-2 py-2 align-middle">
                        <Input
                          value={band.grade}
                          placeholder="A"
                          maxLength={24}
                          onChange={(e) =>
                            onBandChange(idx, { grade: e.target.value })
                          }
                          className={cn(
                            "h-8",
                            rowIssue && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={band.minRaw ?? ""}
                          placeholder="0"
                          onChange={(e) => {
                            const { raw, value } = parseRange(e.target.value);
                            onBandChange(idx, { minRaw: raw, minMarks: value });
                          }}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="px-2 py-2 align-middle">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={band.maxRaw ?? ""}
                          placeholder="100"
                          onChange={(e) => {
                            const { raw, value } = parseRange(e.target.value);
                            onBandChange(idx, { maxRaw: raw, maxMarks: value });
                          }}
                          className={cn(
                            "h-8 w-20",
                            rangeIssue && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                      </td>
                      {draft.pfMode && (
                        <td className="px-2 py-2 align-middle">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={band.isPass === true}
                              onCheckedChange={(v) =>
                                onBandChange(idx, { isPass: Boolean(v) })
                              }
                              aria-label={`${band.grade || "Band"} counts as pass`}
                            />
                          </div>
                        </td>
                      )}
                      <td className="px-2 py-2 align-middle">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={!canRemove}
                          onClick={() => setPendingRemoveIdx(idx)}
                          aria-label={`Remove band ${band.grade || idx + 1}`}
                          className="size-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(bandsIssue ||
            allPassIssue ||
            allFailIssue ||
            draft.bands.some((_, i) => issueFor(issues, `bands.range.${i}`) || issueFor(issues, `bands.row.${i}`))) && (
            <div className="flex flex-col gap-1">
              {bandsIssue && (
                <p className="text-xs text-destructive">{bandsIssue}</p>
              )}
              {allPassIssue && (
                <p className="text-xs text-destructive">{allPassIssue}</p>
              )}
              {allFailIssue && (
                <p className="text-xs text-destructive">{allFailIssue}</p>
              )}
              {draft.bands.map((_, i) => {
                const rangeIssue = issueFor(issues, `bands.range.${i}`);
                const rowIssue = issueFor(issues, `bands.row.${i}`);
                if (!rangeIssue && !rowIssue) return null;
                return (
                  <p key={i} className="text-xs text-destructive">
                    Row {i + 1}: {rowIssue ?? rangeIssue}
                  </p>
                );
              })}
            </div>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAddBand}
              className="rounded-xl"
            >
              <Plus className="mr-1.5 size-4" />
              Add Band
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>

      <Dialog
        open={pendingRemoveIdx !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveIdx(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this band?</DialogTitle>
            <DialogDescription>
              {pendingRemoveBand?.grade.trim()
                ? `Band "${pendingRemoveBand.grade.trim()}" will be removed from this scale.`
                : "This unnamed band will be removed from this scale."}
              {" "}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRemoveIdx(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (pendingRemoveIdx !== null) {
                  onRemoveBand(pendingRemoveIdx);
                }
                setPendingRemoveIdx(null);
              }}
            >
              Delete band
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
