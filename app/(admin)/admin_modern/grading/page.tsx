"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { SortingState, Table as ReactTable } from "@tanstack/react-table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Send, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/composite/data-table/data-table";
import { ConfirmDialog } from "@/components/composite/confirm-dialog";
import { FilterPopover } from "@/components/composite/filter-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchGradeScales,
  checkGradeScaleAccess,
  deleteGradeScales,
  changeGradeScalesStatus,
  ApiError,
} from "@/features/rubrics/grade-scales";
import { getGradeScaleColumns } from "@/features/rubrics/grade-scale-columns";
import { GradeScaleKpiSummary } from "@/features/rubrics/grade-scale-kpi-summary";
import { GradeScalePreviewDialog } from "@/features/rubrics/grade-scale-preview-dialog";
import type { GradeScaleCounts } from "@/features/rubrics/grade-scales";
import type {
  GradeScale,
  GradeScaleStatus,
  GradeScaleType,
} from "@/features/rubrics/constants";
import { ROUTES } from "@/constants/routes";
import { ListingPage } from "@/templates/listing-page";

const GRADE_TYPE_FILTERS: { value: GradeScaleType; label: string; tone: string }[] = [
  { value: "percentage", label: "Percentage", tone: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200" },
  { value: "cgpa", label: "CGPA", tone: "bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-200" },
  { value: "marks", label: "Marks", tone: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200" },
  { value: "comp_incomp", label: "Comp/Incomp", tone: "bg-teal-50 text-teal-700 ring-1 ring-inset ring-teal-200" },
  { value: "letter_grading", label: "Letter", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
];

const GRADE_STATUS_FILTERS: { value: GradeScaleStatus; label: string; tone: string }[] = [
  { value: "draft", label: "Draft", tone: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200" },
  { value: "published", label: "Published", tone: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200" },
];

type PassFailFilter = "enabled" | "disabled";

const PASS_FAIL_FILTERS: { value: PassFailFilter; label: string; tone: string }[] = [
  { value: "enabled", label: "Enabled", tone: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200" },
  { value: "disabled", label: "Disabled", tone: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200" },
];

const EMPTY_COUNTS: GradeScaleCounts = {
  total: 0,
  status: { draft: 0, published: 0, archived: 0 },
  gradeType: { percentage: 0, cgpa: 0, marks: 0, comp_incomp: 0, letter_grading: 0 },
  passFail: { enabled: 0, disabled: 0 },
};

export default function GradingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [types, setTypes] = useState<GradeScaleType[]>([]);
  const [statuses, setStatuses] = useState<GradeScaleStatus[]>([]);
  const [passFail, setPassFail] = useState<PassFailFilter[]>([]);
  const [previewing, setPreviewing] = useState<GradeScale | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [counts, setCounts] = useState<GradeScaleCounts>(EMPTY_COUNTS);
  const access = useQuery({
    queryKey: ["grade-scales", "access"],
    queryFn: checkGradeScaleAccess,
    retry: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (access.isError) router.replace("/admin/dashboard");
  }, [access.isError, router]);

  const [pendingDelete, setPendingDelete] = useState<GradeScale | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<{ scale: GradeScale; nextStatus: GradeScaleStatus } | null>(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [pendingBulk, setPendingBulk] = useState<"publish" | "draft" | "delete" | null>(null);
  const [bulkRunning, setBulkRunning] = useState(false);
  const bulkTable = useRef<ReactTable<GradeScale> | null>(null);

  const debounced = useDebounce(search, 250);

  const sortBy = sorting[0]?.id ?? "";
  const sortDir = sorting.length > 0
    ? (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc"
    : undefined;

  useEffect(() => {
    setPage(1);
  }, [debounced, types, statuses, passFail, sortBy, sortDir]);

  const needCount = page === 1 || counts.total === 0;

  const q = useQuery({
    enabled: access.isSuccess,
    queryKey: queryKeys.gradeScales.list({
      search: debounced,
      gradeType: types,
      status: statuses,
      passFail,
      page,
      pageSize,
      sortBy,
      sortDir,
    }),
    queryFn: () =>
      fetchGradeScales({
        search: debounced,
        gradeType: types,
        status: statuses,
        passFail,
        page,
        pageSize,
        sortBy,
        sortDir,
        needCount,
      }),
  });

  useEffect(() => {
    if (q.data?.counts) {
      setCounts(q.data.counts);
    }
  }, [q.data?.counts]);

  const scales = useMemo(() => q.data?.data ?? [], [q.data]);

  const letterGradeCount = counts.gradeType.letter_grading;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.gradeScales.all });
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const result = await deleteGradeScales([pendingDelete.apiId]);
      if (result.failed) {
        const outcome = result.results[0];
        toast.error(outcome?.reason === "in_use"
          ? `Grade scale is in use (${outcome.usedCount ?? 0}) and cannot be deleted`
          : "Grade scale could not be deleted");
      } else {
        toast.success("Grade scale deleted", { description: pendingDelete.name });
      }
      setPendingDelete(null);
      invalidate();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to delete grade scale");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleStatusConfirm = async () => {
    if (!pendingStatus) return;
    setChangingStatus(true);
    try {
      const result = await changeGradeScalesStatus(
        [pendingStatus.scale.apiId],
        pendingStatus.nextStatus === "published" ? "published" : "draft",
      );
      if (result.failed) {
        const outcome = result.results[0];
        toast.error(outcome?.reason === "in_use"
          ? `Grade scale is in use (${outcome.usedCount ?? 0}) and cannot change status`
          : "Grade scale status could not be changed");
      } else {
        toast.success(
          pendingStatus.nextStatus === "published" ? "Grade scale published" : "Moved to draft",
          { description: pendingStatus.scale.name },
        );
      }
      setPendingStatus(null);
      invalidate();
    } catch (e) {
      if (e instanceof ApiError) {
        toast.error(e.message);
      } else {
        toast.error("Failed to update grade scale status");
      }
    } finally {
      setChangingStatus(false);
    }
  };

  const handleBulkConfirm = async (table: ReactTable<GradeScale>) => {
    if (!pendingBulk) return;
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selected = selectedRows.map((row) => row.original);
    const action = pendingBulk;
    setBulkRunning(true);
    try {
      const result = action === "delete"
        ? await deleteGradeScales(selected.map((scale) => scale.apiId))
        : await changeGradeScalesStatus(
            selected.map((scale) => scale.apiId),
            action === "publish" ? "published" : "draft",
          );
      const succeededIds = new Set(result.results.filter((item) => item.success).map((item) => item.id));
      for (const row of selectedRows) {
        if (succeededIds.has(row.original.apiId)) row.toggleSelected(false);
      }
      setPendingBulk(null);
      invalidate();
      const failures = result.results.filter((item) => !item.success);
      const names = failures.map((item) => {
        const scale = selected.find((entry) => entry.apiId === item.id);
        const reason = item.reason === "in_use"
          ? `in use (${item.usedCount ?? 0})`
          : item.reason === "default_grade"
            ? "default grade"
            : item.reason === "not_found"
              ? "not found"
              : "operation failed";
        return `${scale?.name ?? item.id}: ${reason}`;
      });
      const verb = action === "delete" ? "deleted" : action === "publish" ? "published" : "moved to draft";
      if (result.failed === 0) {
        toast.success(`${result.succeeded} grade scale${result.succeeded === 1 ? "" : "s"} ${verb}`);
      } else {
        toast.warning(`${result.succeeded} ${verb}; ${result.failed} skipped`, {
          description: names.join("; "),
          duration: 10000,
        });
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Bulk action failed");
    } finally {
      setBulkRunning(false);
    }
  };

  const renderBulkActions = (table: ReactTable<GradeScale>) => {
    if (bulkTable.current !== table) bulkTable.current = table;
    return (
      <>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3" aria-label="Publish selected grades" onClick={() => { bulkTable.current = table; setPendingBulk("publish"); }}>
          <Send className="size-3.5" />
          <span>Publish</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full px-3" aria-label="Move selected grades to draft" onClick={() => { bulkTable.current = table; setPendingBulk("draft"); }}>
          <Undo2 className="size-3.5" />
          <span>Move to Draft</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-full bg-red-500 px-3 text-white hover:bg-red-600 hover:text-white" aria-label="Delete selected grades" onClick={() => { bulkTable.current = table; setPendingBulk("delete"); }}>
          <Trash2 className="size-3.5" />
          <span>Delete</span>
        </Button>
      </>
    );
  };

  const columns = useMemo(
    () =>
      getGradeScaleColumns({
        onViewDetails: (s) => setPreviewing(s),
        onWhereUsed: (s) =>
          toast.info("Where used lookup", { description: s.name }),
        onDelete: (s) => setPendingDelete(s),
        onStatusChange: (s, next) => setPendingStatus({ scale: s, nextStatus: next }),
      }),
    [],
  );

  const kpiNode = useMemo(
    () => (
      <GradeScaleKpiSummary
        total={counts.total}
        letterGradeCount={letterGradeCount}
        statusCounts={counts.status}
      />
    ),
    [counts.total, letterGradeCount, counts.status],
  );

  const toolbarNode = useMemo(
    () => (
      <div className="relative w-full sm:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search grade scales…"
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
          label="Type"
          options={GRADE_TYPE_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            tone: o.tone,
          }))}
          selected={types}
          onChange={(next) => setTypes(next as GradeScaleType[])}
        />
        <FilterPopover
          label="Status"
          options={GRADE_STATUS_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            tone: o.tone,
          }))}
          selected={statuses}
          onChange={(next) => setStatuses(next as GradeScaleStatus[])}
        />
        <FilterPopover
          label="Pass/Fail"
          options={PASS_FAIL_FILTERS.map((o) => ({
            value: o.value,
            label: o.label,
            tone: o.tone,
          }))}
          selected={passFail}
          onChange={(next) => setPassFail(next as PassFailFilter[])}
        />
      </>
    ),
    [types, statuses, passFail],
  );

  if (access.isPending) {
    return <div className="p-6 text-sm text-muted-foreground">Checking grade access…</div>;
  }

  if (access.isError) {
    return null;
  }

  return (
    <ListingPage
      breadcrumbs={[]}
      title="All Grade Scales"
      description="Built-in grading formats and admin-managed letter scales."
      actions={
        <Button asChild size="sm">
          <Link href={ROUTES.admin.grading.form(0)}>
            <Plus className="mr-1.5 size-4" />
            New Grade Scale
          </Link>
        </Button>
      }
      kpis={kpiNode}
      toolbar={toolbarNode}
      toolbarFilters={toolbarFilters}
    >
      <DataTable
        columns={columns}
        data={scales}
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={() => q.refetch()}
        emptyTitle="No grade scales match"
        emptyDescription="Try adjusting your search or filters."
        enableSelection
        canSelectRow={(scale) => !scale.meta?.isDefault}
        bulkActions={renderBulkActions}
        bulkActionsOnly
        showView={false}
        tableId="grade-scales"
        page={page}
        pageSize={pageSize}
        totalRows={q.data?.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        sorting={sorting}
        onSortingChange={setSorting}
      />

      <GradeScalePreviewDialog
        scale={previewing}
        onOpenChange={(open) => {
          if (!open) setPreviewing(null);
        }}
        onEdit={(s) => {
          setPreviewing(null);
          router.push(ROUTES.admin.grading.form(s.id));
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete grade scale?"
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
        open={pendingBulk !== null}
        onOpenChange={(open) => !open && setPendingBulk(null)}
        title={pendingBulk === "publish" ? "Publish selected grade scales?" : pendingBulk === "draft" ? "Move selected grade scales to draft?" : "Delete selected grade scales?"}
        description={pendingBulk === "delete"
          ? `${bulkTable.current?.getFilteredSelectedRowModel().rows.length ?? 0} grade scales selected. Unused scales will be deleted; scales that are in use will be skipped.`
          : `${bulkTable.current?.getFilteredSelectedRowModel().rows.length ?? 0} grade scales selected. Only unused scales can change status; scales currently in use will be skipped.`}
        confirmLabel={pendingBulk === "publish" ? "Publish" : pendingBulk === "draft" ? "Move to Draft" : "Delete"}
        variant={pendingBulk === "delete" ? "destructive" : "default"}
        icon={pendingBulk === "publish" ? Send : pendingBulk === "draft" ? Undo2 : Trash2}
        loading={bulkRunning}
        onConfirm={() => {
          if (bulkTable.current) void handleBulkConfirm(bulkTable.current);
        }}
      />

      <ConfirmDialog
        open={pendingStatus !== null}
        onOpenChange={(open) => !open && setPendingStatus(null)}
        title={
          pendingStatus?.nextStatus === "published"
            ? "Publish grade scale?"
            : "Move to draft?"
        }
        description={
          pendingStatus
            ? pendingStatus.nextStatus === "published"
              ? `"${pendingStatus.scale.name}" will be published and available to attach to assignments.`
              : `"${pendingStatus.scale.name}" will be moved back to draft and will no longer be available for new assignments.`
            : undefined
        }
        confirmLabel={pendingStatus?.nextStatus === "published" ? "Publish" : "Move to Draft"}
        icon={pendingStatus?.nextStatus === "published" ? Send : Undo2}
        loading={changingStatus}
        onConfirm={handleStatusConfirm}
      />
    </ListingPage>
  );
}
