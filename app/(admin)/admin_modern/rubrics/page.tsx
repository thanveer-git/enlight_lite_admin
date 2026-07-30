"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { DataTable } from "@/components/composite/data-table/data-table";
import { FilterPopover } from "@/components/composite/filter-popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/services/api-client";
import { FAKE_RUBRICS } from "@/services/handlers/rubrics";
import { ROUTES } from "@/constants/routes";
import { ListingPage } from "@/templates/listing-page";
import { STATUS_OPTIONS, TYPE_OPTIONS } from "@/features/rubrics/constants";
import { getRubricColumns, statusChipClass } from "@/features/rubrics/columns";
import { RubricKpiSummary } from "@/features/rubrics/rubric-kpi-summary";
import type { Rubric, RubricStatus, RubricType } from "@/types/rubric";

export default function RubricsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RubricStatus[]>([]);
  const [type, setType] = useState<RubricType[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Rubric | null>(null);

  const debounced = useDebounce(search, 250);

  const q = useQuery({
    queryKey: queryKeys.rubrics.list({ search: debounced, status, type }),
    queryFn: () => apiClient.listRubrics({ search: debounced, status, type, pageSize: 50 }),
  });

  const columns = useMemo(
    () => getRubricColumns({ onDelete: (r) => setPendingDelete(r) }),
    [],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<RubricStatus, number> = {
      draft: 0,
      published: 0,
      in_use: 0,
      archived: 0,
    };
    for (const r of FAKE_RUBRICS) counts[r.status] += 1;
    return counts;
  }, []);

  const kpiNode = useMemo(
    () => (
      <RubricKpiSummary total={FAKE_RUBRICS.length} counts={statusCounts} />
    ),
    [statusCounts],
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

  const toolbarFilters = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    FAKE_RUBRICS.forEach((r) => {
      typeCounts[r.type] = (typeCounts[r.type] ?? 0) + 1;
    });
    return (
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
    );
  }, [status, type, statusCounts]);

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
      />

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete rubric?</DialogTitle>
            <DialogDescription>
              {pendingDelete
                ? `"${pendingDelete.name}" will be permanently removed. This action cannot be undone.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (pendingDelete) {
                  toast.success("Rubric deleted", { description: pendingDelete.name });
                  setPendingDelete(null);
                }
              }}
            >
              <Trash2 className="mr-1.5 size-4" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ListingPage>
  );
}
