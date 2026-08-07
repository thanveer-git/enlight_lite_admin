"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/composite/form-section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  GRADE_TYPE_DESCRIPTIONS,
  GRADE_TYPE_LABELS,
  type AssignmentDraft,
  type GradeType,
} from "@/features/assignments/wizard/types";
import {
  GRADE_SCALES,
  builtInGradeScales,
  findGradeScale,
  letterGradeScales,
} from "@/features/rubrics/constants";
import { InlineRubricModal } from "@/features/assignments/wizard/components/inline-rubric-modal";
import { apiClient } from "@/services/api-client";
import type { Rubric, RubricDetail } from "@/types/rubric";
import type { RubricStatus } from "@/types/rubric";

export interface StepGradeProps {
  draft: AssignmentDraft;
  onPatch: (patch: Partial<AssignmentDraft>) => void;
}

const GRADE_TYPE_ORDER: GradeType[] = ["cgpa", "percentage", "mark", "complete_incomplete"];

const STATUS_VARIANT: Record<RubricStatus, "default" | "success" | "warning" | "secondary" | "destructive"> = {
  published: "success",
  in_use: "default",
  draft: "warning",
  archived: "secondary",
};

export function StepGrade({ draft, onPatch }: StepGradeProps) {
  const [rubricList, setRubricList] = useState<Rubric[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<RubricDetail | null>(null);
  const [newRubricOpen, setNewRubricOpen] = useState(false);

  const refreshRubricList = () => {
    apiClient.listRubrics({ pageSize: 100 }).then((res) => setRubricList(res.data));
  };

  useEffect(() => {
    let cancelled = false;
    apiClient.listRubrics({ pageSize: 100 }).then((res) => {
      if (!cancelled) setRubricList(res.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNewRubricCreated = (rubric: Rubric) => {
    toast.success("Rubric created", { description: rubric.name });
    refreshRubricList();
    if (draft.useRubric) {
      onPatch({ rubricId: rubric.id });
    }
  };

  // Fetch the full detail (with matrix) for the currently selected rubric
  // so we can read `matrix.suggestedScaleId` for the Unscored-rubric rules.
  useEffect(() => {
    let cancelled = false;
    if (!draft.rubricId) {
      setSelectedDetail(null);
      return;
    }
    apiClient.getRubric(draft.rubricId).then((res) => {
      if (!cancelled) setSelectedDetail(res);
    });
    return () => {
      cancelled = true;
    };
  }, [draft.rubricId]);

  // When an unscored rubric's detail arrives, auto-pick its suggested scale
  // — but only if the user hasn't explicitly chosen a different one.
  const lastAutoScaleRubricId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedDetail) return;
    if (lastAutoScaleRubricId.current === selectedDetail.id) return;
    lastAutoScaleRubricId.current = selectedDetail.id;
    if (selectedDetail.type !== "unscored") return;
    const suggested = selectedDetail.matrix.suggestedScaleId;
    if (!suggested) return;
    onPatch({ gradeScaleId: suggested, gradeKind: "scale", gradeType: null });
  }, [selectedDetail, onPatch]);

  const selectedRubric = selectedDetail ?? rubricList.find((r) => r.id === draft.rubricId) ?? null;
  const selectedScale = useMemo(
    () => findGradeScale(draft.gradeScaleId),
    [draft.gradeScaleId],
  );

  const suggestedScaleId = selectedDetail?.matrix.suggestedScaleId ?? null;
  const isUnscored = selectedRubric?.type === "unscored";
  const isScored = selectedRubric?.type === "scored";

  // Compute the allowed grade type / scale lists per the rubric × grade
  // combination rules (spec §1 Step 1).
  const allowedTypes: GradeType[] = useMemo(() => {
    if (!draft.useRubric) return GRADE_TYPE_ORDER;
    if (isUnscored) return []; // unscored rubric: no raw grade type at all
    return GRADE_TYPE_ORDER;
  }, [draft.useRubric, isUnscored]);

  const allowedScales = useMemo(() => {
    if (!draft.useRubric) return GRADE_SCALES;
    if (isUnscored) {
      const suggested = findGradeScale(suggestedScaleId);
      return suggested ? [suggested] : [];
    }
    return GRADE_SCALES;
  }, [draft.useRubric, isUnscored, suggestedScaleId]);

  const onToggleRubric = (next: boolean) => {
    if (!next) {
      onPatch({ useRubric: false, rubricId: null });
      return;
    }
    onPatch({ useRubric: true });
  };

  const onSelectRubric = (rubric: Rubric) => {
    const patch: Partial<AssignmentDraft> = { rubricId: rubric.id };
    if (rubric.type === "unscored") {
      patch.gradeType = null;
      // For unscored rubrics the suggested-scale pick happens once the
      // rubric detail (with matrix) loads — the useEffect below handles
      // it. Keep the existing scale choice for now.
    } else if (draft.gradeType === "mark" && draft.totalMarks == null) {
      patch.totalMarks = 100;
    }
    onPatch(patch);
  };

  const onSelectGradeType = (gt: GradeType) => {
    onPatch({ gradeType: gt, gradeScaleId: null, gradeKind: "type" });
  };
  const onSelectScale = (id: string) => {
    onPatch({ gradeScaleId: id, gradeType: null, gradeKind: "scale" });
  };

  return (
    <div className="space-y-6">
      <FormSection
        title="Rubric"
        description="Attach a rubric to evaluate this assignment. Rubrics constrain which grade types and scales are allowed below."
      >
        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <div className="grid gap-0.5">
            <Label htmlFor="use-rubric" className="cursor-pointer text-sm">
              Use rubric
            </Label>
            <p className="text-xs text-muted-foreground">
              When off, grading happens directly via the grade type or scale chosen below.
            </p>
          </div>
          <Switch
            id="use-rubric"
            checked={draft.useRubric}
            onCheckedChange={onToggleRubric}
          />
        </div>

        {draft.useRubric && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Available rubrics</Label>
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={() => setNewRubricOpen(true)}
              >
                <Plus className="mr-1 size-3.5" />
                New rubric
              </Button>
            </div>

            <div className="grid max-h-72 gap-1 overflow-y-auto rounded-md border bg-background p-2">
              {rubricList.length === 0 && (
                <p className="p-3 text-sm text-muted-foreground">Loading rubrics…</p>
              )}
              {rubricList.map((r) => {
                const active = r.id === draft.rubricId;
                // Suggested scale chips require the full detail (matrix);
                // show a generic label when we don't have it yet for this row.
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRubric(r)}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-transparent hover:bg-accent/40",
                    )}
                  >
                    <div className="grid gap-0.5">
                      <span className="text-sm font-medium">{r.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.type === "scored" ? "Scored" : "Unscored"} ·{" "}
                        {r.criteriaCount} criteria · {r.levelsCount} levels
                      </span>
                    </div>
                    <Badge variant={STATUS_VARIANT[r.status]} className="capitalize">
                      {r.status.replace("_", " ")}
                    </Badge>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-md border bg-background px-3 py-2">
              <div className="grid gap-0.5">
                <Label htmlFor="show-detail" className="cursor-pointer text-sm">
                  Show detailed evaluation breakdown to students
                </Label>
                <p className="text-xs text-muted-foreground">
                  When off, learners see only their overall score or grade.
                </p>
              </div>
              <Switch
                id="show-detail"
                checked={draft.showEvalDetail}
                onCheckedChange={(v) => onPatch({ showEvalDetail: v })}
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormSection
        title="Grade type or scale"
        description="Pick one of a raw grade type or a named grade scale. Only valid combinations for the chosen rubric are listed."
      >
        {allowedTypes.length > 0 && (
          <div className="grid gap-2">
            <Label>Grade type</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {allowedTypes.map((gt) => {
                const active = draft.gradeKind === "type" && draft.gradeType === gt;
                return (
                  <button
                    key={gt}
                    type="button"
                    onClick={() => onSelectGradeType(gt)}
                    className={cn(
                      "flex flex-col gap-1 rounded-md border bg-card p-3 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "hover:border-foreground/20",
                    )}
                  >
                    <span className="font-medium text-foreground">{GRADE_TYPE_LABELS[gt]}</span>
                    <span className="text-xs text-muted-foreground">
                      {GRADE_TYPE_DESCRIPTIONS[gt]}
                    </span>
                  </button>
                );
              })}
            </div>

            {draft.gradeType === "mark" && draft.gradeKind === "type" && (
              <div className="grid gap-2">
                <Label htmlFor="asg-total-marks">Total Marks *</Label>
                <Input
                  id="asg-total-marks"
                  type="number"
                  min={1}
                  value={draft.totalMarks ?? ""}
                  onChange={(e) =>
                    onPatch({
                      totalMarks: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </div>
            )}
          </div>
        )}

        {allowedScales.length > 0 && (
          <div className="grid gap-2">
            <Label>Grade scale</Label>
            <div className="grid gap-1 rounded-md border bg-background p-2">
              {allowedScales.map((s) => {
                const active = draft.gradeKind === "scale" && draft.gradeScaleId === s.id;
                const isSuggested = draft.useRubric && suggestedScaleId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onSelectScale(s.id)}
                    className={cn(
                      "flex items-start justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                        : "border-transparent hover:bg-accent/40",
                    )}
                  >
                    <div className="grid gap-0.5">
                      <span className="text-sm font-medium">{s.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.bands.length > 0 ? s.bands.join(" · ") : "Built-in format scale"}
                        {s.meta?.description ? ` — ${s.meta.description}` : ""}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {isSuggested && (
                        <Badge variant="default" className="text-[10px]">
                          Suggested
                        </Badge>
                      )}
                      {s.meta && (
                        <Badge
                          variant={STATUS_VARIANT[s.meta.status as RubricStatus] ?? "outline"}
                          className="capitalize"
                        >
                          {s.meta.status.replace("_", " ")}
                        </Badge>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {draft.useRubric && isUnscored && (
          <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Unscored rubric — only per-criterion ratings are used. Grade type is hidden,
            and the grade scale list is limited to the rubric&apos;s suggested scale
            (or none).
          </p>
        )}

        {draft.useRubric && isScored && (
          <p className="rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
            Scored rubric — its weighted or Grade-Profile result is mapped onto whichever
            grade type or scale you choose below.
          </p>
        )}

        <p className="text-xs text-muted-foreground">
          Built-in formats available: {builtInGradeScales().length} ·
          Letter scales: {letterGradeScales().length}.
        </p>
      </FormSection>

      <InlineRubricModal
        open={newRubricOpen}
        onOpenChange={setNewRubricOpen}
        onCreated={handleNewRubricCreated}
      />
    </div>
  );
}
