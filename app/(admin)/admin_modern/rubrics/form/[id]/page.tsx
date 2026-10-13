"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { toast } from "sonner";
import { apiClient } from "@/services/api-client";

import { RubricWizard } from "@/features/rubrics/wizard/rubric-wizard";
import { WizardPage } from "@/templates/wizard-page";
import { queryKeys } from "@/lib/query-keys";

export default function RubricFormPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ id: string }>();
  const rubricId = params?.id ?? "0";
  const isEdit = rubricId !== "0";
  const permissionsQuery = useQuery({
    queryKey: ["module-permissions", "rubrics"],
    queryFn: () => apiClient.getModulePermissions("rubrics"),
    retry: false,
    staleTime: 0,
  });
  const permissions = permissionsQuery.data ?? [];
  const hasViewPermission = permissions.includes(1);
  const hasRequiredPermission = permissions.includes(isEdit ? 3 : 2);
  const hasAccess = hasViewPermission && hasRequiredPermission;

  useEffect(() => {
    if (permissionsQuery.isError || (permissionsQuery.isSuccess && !hasAccess)) {
      router.replace("/admin/dashboard");
    }
  }, [permissionsQuery.isError, permissionsQuery.isSuccess, hasAccess, router]);

  if (permissionsQuery.isPending) {
    return <div className="p-6 text-sm text-muted-foreground">Checking rubric permissions…</div>;
  }

  if (permissionsQuery.isError || !hasAccess) {
    return null;
  }

  return (
    <WizardPage
      title={isEdit ? "Edit Rubric" : "New Rubric"}
      description={
        isEdit
          ? "Update the rubric definition. Changes apply wherever this rubric is already attached."
          : "Define a reusable assessment structure. Grade Rules and Review will be added in upcoming PRs."
      }
    >
      <RubricWizard
        mode={isEdit ? "edit" : "create"}
        initialRubricId={rubricId}
        onCancel={() => router.push("/admin/rubrics")}
        onSubmitted={(rubric) => {
          toast.success(
            rubric.status === "published" ? "Rubric published" : "Rubric saved as draft",
            { description: rubric.name },
          );
          // Invalidate the list so the listing page always shows fresh
          // data on return — otherwise the 30s staleTime serves the
          // pre-edit cache and the old status/name lingers.
          queryClient.invalidateQueries({ queryKey: queryKeys.rubrics.all });
          router.push("/admin/rubrics");
        }}
      />
    </WizardPage>
  );
}
