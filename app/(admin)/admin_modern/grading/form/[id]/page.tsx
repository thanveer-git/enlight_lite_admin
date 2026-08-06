"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ROUTES } from "@/constants/routes";
import {
  emptyGradeScaleDraft,
  scaleToDraft,
  draftToScaleInput,
  type GradeBandDraft,
  type GradeScaleDraft,
} from "@/features/rubrics/grade-scale-default";
import {
  GradeScaleEditor,
} from "@/features/rubrics/grade-scale-editor";
import {
  getGradeScaleWarnings,
  hasBlockingIssues,
  validateGradeScaleDraft,
} from "@/features/rubrics/grade-scale-validation";
import {
  createGradeScale,
  fetchGradeScale,
  updateGradeScale,
} from "@/features/rubrics/grade-scales";
import { FormPage } from "@/templates/form-page";
import type { GradeScaleStatus } from "@/features/rubrics/constants";

export default function GradeScaleFormPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "0";
  const isEdit = id !== "0";

  const [draft, setDraft] = useState<GradeScaleDraft | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [usedCount, setUsedCount] = useState<number | undefined>(undefined);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Initial load: pull the existing scale (or seed an empty draft for create).
  useEffect(() => {
    let cancelled = false;
    if (isEdit) {
      fetchGradeScale(id).then((scale) => {
        if (cancelled) return;
        if (!scale) {
          setNotFound(true);
          return;
        }
        setDraft(scaleToDraft(scale));
        setUsedCount(scale.used);
        setLoadedId(id);
      });
    } else {
      setDraft(emptyGradeScaleDraft());
      setLoadedId(id);
    }
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const issues = useMemo(
    () => (draft ? validateGradeScaleDraft(draft) : []),
    [draft],
  );
  const warnings = useMemo(
    () => (draft ? getGradeScaleWarnings({ status: draft.status, used: usedCount }) : []),
    [draft, usedCount],
  );
  const blocked = hasBlockingIssues(issues);

  const handlePatch = (patch: Partial<GradeScaleDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const handleBandChange = (idx: number, patch: Partial<GradeBandDraft>) => {
    setDraft((current) => {
      if (!current) return current;
      const bands = current.bands.map((b, i) =>
        i === idx ? { ...b, ...patch } : b,
      );
      return { ...current, bands };
    });
  };

  const handleAddBand = () => {
    setDraft((current) => {
      if (!current) return current;
      const bands = [
        ...current.bands,
        { grade: "", minMarks: 0, maxMarks: 0, minRaw: "", maxRaw: "", isPass: null as boolean | null },
      ];
      return { ...current, bands };
    });
  };

  const handleRemoveBand = (idx: number) => {
    setDraft((current) => {
      if (!current) return current;
      if (current.bands.length <= 1) return current;
      const bands = current.bands.filter((_, i) => i !== idx);
      return { ...current, bands };
    });
  };

  const handleSave = (status: GradeScaleStatus) => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = draftToScaleInput(draft);
      if (isEdit) {
        const updated = updateGradeScale(id, { ...payload, status });
        if (!updated) {
          toast.error("Could not find the grade scale to update.");
          return;
        }
        toast.success(
          status === "published" ? "Grade scale updated & published" : "Grade scale saved",
          { description: updated.name },
        );
      } else {
        const created = createGradeScale({ ...payload, status });
        toast.success(
          status === "published" ? "Grade scale published" : "Grade scale saved as draft",
          { description: created.name },
        );
      }
      router.push(ROUTES.admin.grading.all);
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return (
      <FormPage
        breadcrumbs={[
          { label: "Grading", href: ROUTES.admin.grading.all },
          { label: "Not found" },
        ]}
        title="Grade scale not found"
        description="The grade scale you tried to edit doesn't exist or has been removed."
      >
        <Button variant="outline" onClick={() => router.push(ROUTES.admin.grading.all)}>
          Back to grade scales
        </Button>
      </FormPage>
    );
  }

  if (!draft || loadedId !== id) {
    return (
      <FormPage
        breadcrumbs={[
          { label: "Grading", href: ROUTES.admin.grading.all },
          { label: isEdit ? "Edit" : "New" },
        ]}
        title={isEdit ? "Edit grade scale" : "New grade scale"}
      >
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          Loading…
        </div>
      </FormPage>
    );
  }

  return (
    <FormPage
      breadcrumbs={[
        { label: "Grading", href: ROUTES.admin.grading.all },
        { label: isEdit ? `Edit · ${draft.name || id}` : "New grade scale" },
      ]}
      title={isEdit ? "Edit grade scale" : "New grade scale"}
      description={
        isEdit
          ? "Update the band definitions, status, and metadata. Changes apply wherever this scale is already attached."
          : "Define a new letter-grade scale. Add bands, mark which counts as pass, and save when ready."
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => router.push(ROUTES.admin.grading.all)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={() => setSaveDialogOpen(true)} disabled={saving}>
            <Save className="mr-1.5 size-4" />
            Save
          </Button>
        </div>
      }
    >
      <GradeScaleEditor
        draft={draft}
        issues={issues}
        warnings={warnings}
        onPatch={handlePatch}
        onBandChange={handleBandChange}
        onAddBand={handleAddBand}
        onRemoveBand={handleRemoveBand}
      />

      <Dialog
        open={saveDialogOpen}
        onOpenChange={(open) => {
          if (!saving) setSaveDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {blocked ? "Validations to be fixed" : "Validations sorted"}
            </DialogTitle>
            <DialogDescription>
              {blocked
                ? "Some required fields are missing or invalid. You can save this scale as a draft and finish it later, or cancel and address the issues now."
                : "All required fields are valid. You can publish this scale now, or cancel to keep editing."}
            </DialogDescription>
          </DialogHeader>
          {blocked && issues.length > 0 && (
            <ul className="max-h-48 overflow-auto rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {issues.map((issue, i) => (
                <li key={i} className="py-0.5">
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSaveDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            {blocked ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSaveDialogOpen(false);
                  handleSave("draft");
                }}
                disabled={saving}
              >
                Save as draft
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSaveDialogOpen(false);
                  handleSave("published");
                }}
                disabled={saving}
              >
                Publish
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FormPage>
  );
}