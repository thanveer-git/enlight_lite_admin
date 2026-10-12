"use client";

import { useEffect, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArchiveX, Copy, Plus, Search, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/composite/data-table/data-table";
import { ConfirmDialog } from "@/components/composite/confirm-dialog";
import { FilterPopover } from "@/components/composite/filter-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { apiClient, ApiError } from "@/services/api-client";
import { ROUTES } from "@/constants/routes";
import { ListingPage } from "@/templates/listing-page";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "@/features/rubrics/constants";
import { getRubricColumns, statusChipClass } from "@/features/rubrics/columns";
import { RubricKpiSummary } from "@/features/rubrics/rubric-kpi-summary";
import type { Rubric, RubricCounts, RubricStatus, RubricType } from "@/types/rubric";

const EMPTY_COUNTS: RubricCounts = {
  total: 0,
  draft: 0,
  published: 0,
  in_use: 0,
  archived: 0,
};

export default function RubricsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RubricStatus[]>([]);
  const [type, setType] = useState<RubricType[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Rubric | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingArchive, setPendingArchive] = useState<{ rubric: Rubric; nextStatus: RubricStatus } | null>(null);
  const [archiving, setArchiving] = useState(false);
  const [pendingPublish, setPendingPublish] = useState<{ rubric: Rubric; nextStatus: RubricStatus } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [pendingDuplicate, setPendingDuplicate] = useState<Rubric | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [statusChangingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [counts, setCounts] = useState<RubricCounts>(EMPTY_COUNTS);

  const debounced = useDebounce(search, 250);

  const sortBy = sorting[0]?.id ?? "";
  const sortDir = sorting.length > 0
    ? (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc"
    : undefined;

  // Reset to page 1 whenever the filters or sort change so the user
  // doesn't land on an empty page.
  useEffect(() => {
    setPage(1);
  }, [debounced, status, type, sortBy, sortDir]);

  // Request consolidated KPI counts only on page 1 or when the local
  // counts state is still empty — avoids redundant GROUP BY queries while
  // paging.
  const needCount = page === 1 || counts.total === 0;

  const q = useQuery({
    queryKey: queryKeys.rubrics.list({
      search: debounced,
      status,
      type,
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    queryFn: () =>
      apiClient.listRubrics({
        search: debounced,
        status,
        type,
        page,
        pageSize,
        sortBy,
        sortDir,
        needCount,
      }),
  });

  // Cache the consolidated counts so they persist across page navigation.
  useEffect(() => {
    if (q.data?.counts) {
      setCounts(q.data.counts);
    }
  }, [q.data?.counts]);

  const allRubrics = q.data?.data ?? [];

  const handleDuplicate = async () => {
    if (!pendingDuplicate) return;
    setDuplicatingId(pendingDuplicate.id);
    try {
      const copy = await apiClient.duplicateRubric(pendingDuplicate.id);
      toast.success("Rubric copied", { description: copy.name });
      setPendingDuplicate(null);
      q.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to duplicate rubric");
      }
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleSortingChange = (next: SortingState) => {
    setSorting(next);
  };

  const handleStatusChange = (rubric: Rubric, nextStatus: RubricStatus) => {
    setPendingPublish({ rubric, nextStatus });
  };

  const handlePublishConfirm = async () => {
    if (!pendingPublish) return;
    setPublishing(true);
    try {
      await apiClient.changeRubricStatus(pendingPublish.rubric.id, pendingPublish.nextStatus);
      toast.success(
        pendingPublish.nextStatus === "published" ? "Rubric published" : "Rubric moved to draft",

        { description: pendingPublish.rubric.name },
      );
      setPendingPublish(null);
      q.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to update rubric status");
      }
    } finally {
      setPublishing(false);
    }
  };

  const handleArchiveChange = (rubric: Rubric, nextStatus: RubricStatus) => {
    setPendingArchive({ rubric, nextStatus });
  };

  const handleArchiveConfirm = async () => {
    if (!pendingArchive) return;
    setArchiving(true);
    try {
      await apiClient.changeRubricStatus(pendingArchive.rubric.id, pendingArchive.nextStatus);
      toast.success(
        pendingArchive.nextStatus === "archived" ? "Rubric archived" : "Rubric restored",
        { description: pendingArchive.rubric.name },
      );
      setPendingArchive(null);
      q.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to update rubric status");
      }
    } finally {
      setArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await apiClient.deleteRubric(pendingDelete.id.toString());
      toast.success("Rubric deleted", { description: pendingDelete.name });
      setPendingDelete(null);
      q.refetch();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to delete rubric");
      }
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo(
    () =>
      getRubricColumns({
        onDelete: (r) => setPendingDelete(r),
        onDuplicate: (r) => setPendingDuplicate(r),
        onStatusChange: handleStatusChange,
        onArchiveChange: handleArchiveChange,
        duplicatingId,
        statusChangingId,
      }),
    [duplicatingId, statusChangingId],
  );

  const statusCounts = useMemo(
    () => ({
      draft: counts.draft,
      published: counts.published,
      in_use: counts.in_use,
      archived: counts.archived,
    }),
    [counts],
  );

  const typeCounts = useMemo(() => {
    const tc: Record<string, number> = {};
    for (const r of allRubrics) {
      tc[r.type] = (tc[r.type] ?? 0) + 1;
    }
    return tc;
  }, [allRubrics]);

  const kpiNode = useMemo(
    () => <RubricKpiSummary total={counts.total} counts={statusCounts} />,
    [counts.total, statusCounts],
  );

  const toolbarNode = useMemo(
    () => (
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search rubrics…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm transition-colors duration-150 focus-visible:ring-1"
        />
      </div>
    ),
    [search],
  );

  const toolbarFilters = useMemo(
    () => (
      <>
        <FilterPopover
          label="Status"
          options={STATUS_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            count: statusCounts[o.value] ?? 0,
            tone: statusChipClass[o.value],
          }))}
          selected={status}
          onChange={(next) => setStatus(next as RubricStatus[])}
        />
        <FilterPopover
          label="Type"
          options={TYPE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            count: typeCounts[o.value] ?? 0,
          }))}
          selected={type}
          onChange={(next) => setType(next as RubricType[])}
        />
      </>
    ),
    [status, type, statusCounts, typeCounts],
  );

  return (
    <ListingPage
      breadcrumbs={[]}
      title="All Rubrics"
      description="Browse and manage every rubric in your workspace."
      actions={
        <Button asChild size="sm">
          <Link href={ROUTES.admin.rubrics.form(0)}>
            <Plus className="mr-1.5 size-4" />
            New Rubric
          </Link>
        </Button>
      }
      kpis={kpiNode}
      toolbar={toolbarNode}
      toolbarFilters={toolbarFilters}
    >
      <DataTable
        columns={columns}
        data={q.data?.data ?? []}
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={() => q.refetch()}
        emptyTitle="No rubrics match"
        emptyDescription="Try adjusting your search or filters."
        enableSelection
        showView={false}
        page={page}
        pageSize={pageSize}
        totalRows={q.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sorting={sorting}
        onSortingChange={handleSortingChange}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete rubric?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently removed. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        icon={Trash2}
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={pendingDuplicate !== null}
        onOpenChange={(open) => !open && setPendingDuplicate(null)}
        title="Duplicate rubric?"
        description={
          pendingDuplicate
            ? `A copy of "${pendingDuplicate.name}" will be created as a draft.`
            : undefined
        }
        confirmLabel="Duplicate"
        icon={Copy}
        loading={duplicatingId !== null}
        onConfirm={handleDuplicate}
      />

      <ConfirmDialog
        open={pendingArchive !== null}
        onOpenChange={(open) => !open && setPendingArchive(null)}
        title={
          pendingArchive?.nextStatus === "archived"
            ? "Archive rubric?"
            : "Unarchive rubric?"
        }
        description={
          pendingArchive
            ? pendingArchive.nextStatus === "archived"
              ? `"${pendingArchive.rubric.name}" will be archived and hidden from active use. You can restore it later.`
              : `"${pendingArchive.rubric.name}" will be restored to draft status.`
            : undefined
        }
        confirmLabel={pendingArchive?.nextStatus === "archived" ? "Archive" : "Unarchive"}
        variant="destructive"
        icon={ArchiveX}
        loading={archiving}
        onConfirm={handleArchiveConfirm}
      />

      <ConfirmDialog
        open={pendingPublish !== null}
        onOpenChange={(open) => !open && setPendingPublish(null)}
        title={
          pendingPublish?.nextStatus === "published"
            ? "Publish rubric?"
            : "Move to draft?"
        }
        description={
          pendingPublish
            ? pendingPublish.nextStatus === "published"
              ? `"${pendingPublish.rubric.name}" will be published and available to attach to assignments.`
              : `"${pendingPublish.rubric.name}" will be moved back to draft and will no longer be available for new assignments.`
            : undefined
        }
        confirmLabel={pendingPublish?.nextStatus === "published" ? "Publish" : "Move to Draft"}
        icon={pendingPublish?.nextStatus === "published" ? Send : Undo2}
        loading={publishing}
        onConfirm={handlePublishConfirm}
      />
    </ListingPage>
  );
}
