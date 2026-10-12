"use client";

import { useEffect, useState } from "react";

import {
  CheckCircle2,
  CircleDashed,
  FileCheck2,
  GraduationCap,
  Hash,
  Lock,
  Pencil,
  Type,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  GradeScaleStatusChip,
  GradeScaleTypeChip,
} from "@/features/rubrics/grade-scale-chip";
import type { GradeScale } from "@/features/rubrics/constants";
import { fetchGradeScaleWithBands } from "@/features/rubrics/grade-scales";
import { Separator } from "@/components/ui/separator";

export interface GradeScalePreviewDialogProps {
  scale: GradeScale | null;
  onOpenChange: (open: boolean) => void;
  onEdit?: (scale: GradeScale) => void;
}

function StatusMetaRow({ scale }: { scale: GradeScale }) {
  const meta = scale.meta;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <GradeScaleTypeChip type={meta?.gradeType ?? "percentage"} />
      {meta?.status && <GradeScaleStatusChip status={meta.status} />}
      {meta?.isEditable ? (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">
          <Pencil className="size-3" />
          Editable
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border">
          <Lock className="size-3" />
          Built-in
        </span>
      )}
    </div>
  );
}

function MetaTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <span
        className={`inline-flex size-8 shrink-0 items-center justify-center rounded-md ${tone}`}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function ConfigurationBlock({ scale }: { scale: GradeScale }) {
  const cfg = scale.configuration;
  if (!cfg) return null;
  const isLetter = scale.meta?.gradeType === "letter_grading";
  const tiles: { icon: typeof Hash; label: string; value: string; tone: string }[] = [];

  if (cfg.min !== undefined) {
    tiles.push({
      icon: Hash,
      label: "Min",
      value: String(cfg.min),
      tone: "bg-indigo-50 text-indigo-600",
    });
  }
  if (cfg.max !== undefined && cfg.max !== null) {
    tiles.push({
      icon: Hash,
      label: "Max",
      value: String(cfg.max),
      tone: "bg-indigo-50 text-indigo-600",
    });
  }
  if (cfg.passMark !== undefined) {
    tiles.push({
      icon: CheckCircle2,
      label: "Pass Mark",
      value: String(cfg.passMark),
      tone: "bg-emerald-50 text-emerald-600",
    });
  }
  if (cfg.passMarkRatio !== undefined) {
    tiles.push({
      icon: CheckCircle2,
      label: "Pass Ratio",
      value: `${Math.round(cfg.passMarkRatio * 100)}%`,
      tone: "bg-emerald-50 text-emerald-600",
    });
  }
  if (cfg.step !== undefined) {
    tiles.push({
      icon: Hash,
      label: "Step",
      value: String(cfg.step),
      tone: "bg-violet-50 text-violet-600",
    });
  }
  if (cfg.completeMin !== undefined) {
    tiles.push({
      icon: CheckCircle2,
      label: `${cfg.completeLabel ?? "Complete"} Min`,
      value: String(cfg.completeMin),
      tone: "bg-emerald-50 text-emerald-600",
    });
  }
  if (cfg.incompleteMax !== undefined) {
    tiles.push({
      icon: CircleDashed,
      label: `${cfg.incompleteLabel ?? "Incomplete"} Max`,
      value: String(cfg.incompleteMax),
      tone: "bg-amber-50 text-amber-600",
    });
  }

  if (tiles.length === 0) return null;

  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {isLetter ? "Thresholds" : "Configuration"}
      </h4>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tiles.map((t) => (
          <MetaTile key={t.label} {...t} />
        ))}
      </div>
    </section>
  );
}

function BandsBlock({ scale }: { scale: GradeScale }) {
  const isLetter = scale.meta?.gradeType === "letter_grading";
  if (!isLetter || !scale.bands.length) return null;
  const passBands = new Set(scale.passBands ?? []);
  const rangeBy = new Map(
    (scale.ranges ?? []).map((r) => [r.grade, r] as const),
  );

  return (
    <section>
      <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Bands
      </h4>
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">Grade</th>
              <th className="px-3 py-2 text-right font-medium">Min %</th>
              <th className="px-3 py-2 text-right font-medium">Max %</th>
              <th className="px-3 py-2 text-center font-medium">Pass</th>
            </tr>
          </thead>
          <tbody>
            {scale.bands.map((grade, idx) => {
              const range = rangeBy.get(grade);
              const isPass = passBands.has(grade);
              return (
                <tr
                  key={`${grade}-${idx}`}
                  className="border-b border-border/40 last:border-b-0"
                >
                  <td className="px-3 py-2 font-medium text-foreground">
                    {grade}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {range?.minMarks ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {range?.maxMarks ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {isPass ? (
                      <CheckCircle2
                        className="mx-auto size-4 text-emerald-600"
                        aria-label="Counts as pass"
                      />
                    ) : (
                      <CircleDashed
                        className="mx-auto size-4 text-muted-foreground/60"
                        aria-label="Does not count as pass"
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function GradeScalePreviewDialog({
  scale,
  onOpenChange,
  onEdit,
}: GradeScalePreviewDialogProps) {
  const open = scale !== null;
  const editable = scale?.meta?.isEditable ?? false;
  const [detail, setDetail] = useState<GradeScale | null>(null);
  const [loadingBands, setLoadingBands] = useState(false);

  // The listing endpoint omits bands, so resolve the full record (with bands)
  // from the detail endpoint whenever the dialog opens.
  useEffect(() => {
    if (!open || !scale) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoadingBands(true);
    fetchGradeScaleWithBands(scale.id)
      .then((full) => {
        if (!cancelled) setDetail(full);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingBands(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, scale]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {scale && (() => {
          const view = detail ?? scale;
          return (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                    <GraduationCap className="size-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <DialogTitle className="text-base">{scale.name}</DialogTitle>
                    <DialogDescription className="mt-1">
                      {scale.meta?.description ?? "Built-in grade scale."}
                    </DialogDescription>
                  </div>
                </div>
                <div className="pt-2">
                  <StatusMetaRow scale={scale} />
                </div>
              </DialogHeader>

              <div className="flex flex-col gap-5">
                <ConfigurationBlock scale={view} />
                {loadingBands && !detail ? (
                  <p
                    id="grade_scale_preview_bands_loading"
                    className="text-sm text-muted-foreground"
                  >
                    Loading bands…
                  </p>
                ) : (
                  <BandsBlock scale={view} />
                )}

                <section className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <Type className="size-4 text-muted-foreground" aria-hidden />
                    <span className="text-xs text-muted-foreground">ID</span>
                    <span className="ml-auto truncate text-xs font-mono text-foreground">
                      {scale.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                    <FileCheck2 className="size-4 text-muted-foreground" aria-hidden />
                    <span className="text-xs text-muted-foreground">Bands</span>
                    <span className="ml-auto text-xs font-medium text-foreground">
                      {view.bands.length || "—"}
                    </span>
                  </div>
                </section>
              </div>

              <Separator />

              <DialogFooter className="gap-2 sm:gap-2">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                {editable && onEdit && (
                  <Button onClick={() => onEdit(scale)}>
                    <Pencil className="mr-1.5 size-4" />
                    Edit Scale
                  </Button>
                )}
              </DialogFooter>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
