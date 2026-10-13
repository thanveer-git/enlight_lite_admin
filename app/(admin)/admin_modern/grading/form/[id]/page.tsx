"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/composite/confirm-dialog";
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
  fetchGradeScaleWithBands,
  updateGradeScale,
} from "@/features/rubrics/grade-scales";
import { FormPage } from "@/templates/form-page";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/services/api-client";
import type { GradeScaleStatus } from "@/features/rubrics/constants";

export default function GradeScaleFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "0";
  const isEdit = id !== "0";
  const access = useQuery({
    queryKey: ["module-permissions", "grading"],
    queryFn: () => apiClient.getModulePermissions("grading"),
    retry: false,
    staleTime: 0,
  });
  const permissions = access.data ?? [];
  const hasViewPermission = permissions.includes(1);
  const hasRequiredPermission = permissions.includes(isEdit ? 3 : 2);
  const hasAccess = hasViewPermission && hasRequiredPermission;

  useEffect(() => {
    if (access.isError || (access.isSuccess && !hasAccess)) {
      router.replace("/admin/dashboard");
    }
  }, [access.isError, access.isSuccess, hasAccess, router]);

  const [draft, setDraft] = useState<GradeScaleDraft | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [usedCount, setUsedCount] = useState<number | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<"cancel" | "draft" | "publish" | null>(null);

  useEffect(() => {
    if (!hasAccess) return;
    let cancelled = false;
    if (isEdit) {
      fetchGradeScaleWithBands(id).then((scale) => {
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
  }, [hasAccess, id, isEdit]);

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

  const handleSave = async (status: GradeScaleStatus) => {
    if (!draft) return;
    setSaving(true);
    try {
      const payload = draftToScaleInput(draft);
      if (isEdit) {
        const updated = await updateGradeScale(id, { ...payload, status });
        if (!updated) {
          toast.error("Could not find the grade scale to update.");
          return;
        }
        toast.success(
          status === "published" ? "Grade scale updated & published" : "Grade scale saved",
          { description: updated.name },
        );
      } else {
        const created = await createGradeScale({ ...payload, status });
        toast.success(
          status === "published" ? "Grade scale published" : "Grade scale saved as draft",
          { description: created.name },
        );
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.gradeScales.all });
      router.push(ROUTES.admin.grading.all);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save grade scale");
    } finally {
      setSaving(false);
    }
  };

  if (access.isPending) {
    return <div className="p-6 text-sm text-muted-foreground">Checking grade access…</div>;
  }

  if (access.isError || !hasAccess) {
    return null;
  }

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
            onClick={() => setConfirmAction("cancel")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmAction("draft")}
            disabled={saving}
          >
            <FileText className="mr-1.5 size-4" />
            Save Draft
          </Button>
          <Button
            onClick={() => setConfirmAction("publish")}
            disabled={saving || blocked}
          >
            <Send className="mr-1.5 size-4" />
            Publish
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

      <ConfirmDialog
        open={confirmAction === "cancel"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Discard changes?"
        description="Any unsaved changes will be lost. Are you sure you want to leave?"
        confirmLabel="Discard"
        variant="destructive"
        onConfirm={() => {
          setConfirmAction(null);
          router.push(ROUTES.admin.grading.all);
        }}
      />

      <ConfirmDialog
        open={confirmAction === "draft"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Save as draft?"
        description={`"${draft.name || "Untitled"}" will be saved as a draft. You can publish it later.`}
        confirmLabel="Save Draft"
        icon={FileText}
        loading={saving}
        onConfirm={() => {
          setConfirmAction(null);
          handleSave("draft");
        }}
      />

      <ConfirmDialog
        open={confirmAction === "publish"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        title="Publish grade scale?"
        description={`"${draft.name || "Untitled"}" will be published and available to attach to assignments.`}
        confirmLabel="Publish"
        icon={Send}
        loading={saving}
        onConfirm={() => {
          setConfirmAction(null);
          handleSave("published");
        }}
      />
    </FormPage>
  );
}
