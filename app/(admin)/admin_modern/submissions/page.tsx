"use client";

/**
 * Submissions index page.
 *
 * Layout:
 *   - Status KPI cards (Total, Pending, Graded, Resubmission open)
 *   - Searchable + status-filtered table.
 *
 * Column order: Name, Assignment, Attempt, Status, Grade,
 * Submission date, Evaluation date, Evaluation by, Action. The Open
 * (Action) column is pinned to the right by default.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { ArrowUpRight, Clock, Search } from "lucide-react";

import { DataTable } from "@/components/composite/data-table/data-table";
import { DataTableColumnHeader } from "@/components/composite/data-table/data-table-column-header";
import { FilterPopover } from "@/components/composite/filter-popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTES } from "@/constants/routes";
import { SubmissionKpiSummary } from "@/features/evaluation/components/submission-kpi-summary";
import { SubmissionTimingChip } from "@/features/evaluation/components/submission-timing";
import { SEED_SUBMISSIONS } from "@/features/evaluation/seed";
import type { Submission, SubmissionStatus } from "@/features/evaluation/types";
import { useDebounce } from "@/hooks/use-debounce";
import { ListingPage } from "@/templates/listing-page";
import { useTableColumnPinning } from "@/stores/column-pinning-store";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS: { value: SubmissionStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "graded", label: "Graded" },
  { value: "resubmit", label: "Resubmission" },
];

const STATUS_TONE: Record<SubmissionStatus, string> = {
  pending: "bg-warning/10 text-warning ring-1 ring-inset ring-warning/20",
  graded: "bg-success/10 text-success ring-1 ring-inset ring-success/20",
  resubmit: "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20",
};

const ATTEMPT_ORDINAL: Record<number, string> = {
  1: "First attempt",
  2: "Second attempt",
  3: "Third attempt",
  4: "Fourth attempt",
  5: "Fifth attempt",
};

function attemptTenureLabel(n: number): string {
  return ATTEMPT_ORDINAL[n] ?? `Attempt ${n}`;
}

const TABLE_ID = "submissions";
const ACTIONS_COLUMN_ID = "__actions__";

export default function SubmissionsPage() {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<SubmissionStatus[]>([]);
  const debouncedSearch = useDebounce(search, 250);

  // Pin the Open (Action) column to the right by default. Only acts
  // on first mount and only if the column isn't already on the right,
  // so a user can later unpin (or pin elsewhere) without us forcing
  // it back.
  const pinning = useTableColumnPinning(TABLE_ID);
  useEffect(() => {
    if (!pinning.pinning.right.includes(ACTIONS_COLUMN_ID)) {
      pinning.pin(ACTIONS_COLUMN_ID, "right");
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const data = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return SEED_SUBMISSIONS.filter((s) => {
      if (statuses.length > 0 && !statuses.includes(s.currentStatus)) return false;
      if (needle) {
        const hay = `${s.learner.name} ${s.learner.email} ${s.assignmentTitle}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [debouncedSearch, statuses]);

  const statusCounts = useMemo(() => {
    const counts: Record<SubmissionStatus, number> = {
      pending: 0,
      graded: 0,
      resubmit: 0,
    };
    for (const s of SEED_SUBMISSIONS) counts[s.currentStatus] += 1;
    return counts;
  }, []);

  const columns = useMemo<ColumnDef<Submission>[]>(
    () => [
      {
        id: "name",
        accessorKey: "learner.name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {row.original.learner.name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {row.original.learner.email}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "assignmentTitle",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Assignment" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p
              className="max-w-[260px] truncate text-sm font-medium text-foreground"
              title={row.original.assignmentTitle}
            >
              {row.original.assignmentTitle}
            </p>
            <p
              className="max-w-[260px] truncate text-[11px] text-muted-foreground"
              title={row.original.courseName}
            >
              {row.original.courseName}
            </p>
          </div>
        ),
      },
      {
        id: "attempt",
        accessorFn: (row) => row.viewingAttempt,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Attempt" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">
              {attemptTenureLabel(row.original.viewingAttempt)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              #{row.original.viewingAttempt}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "currentStatus",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Status" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium",
              STATUS_TONE[row.original.currentStatus],
            )}
          >
            {STATUS_OPTIONS.find((o) => o.value === row.original.currentStatus)?.label ??
              row.original.currentStatus}
          </span>
        ),
      },
      {
        id: "grade",
        accessorFn: (row) => row.finalGrade ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Grade" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => {
          const grade = row.original.finalGrade;
          if (!grade) {
            return (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden />—
              </span>
            );
          }
          const pass = row.original.currentStatus === "graded";
          const tone = pass
            ? "bg-success/10 text-success ring-1 ring-inset ring-success/20"
            : "bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/20";
          return (
            <Badge variant="outline" className={cn("rounded-full text-[11px]", tone)}>
              {grade}
            </Badge>
          );
        },
      },
      {
        id: "submission_date",
        accessorFn: (row) =>
          row.attempts[row.viewingAttempt - 1]?.submittedAt ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Submission date" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => {
          const attempt = row.original.attempts[row.original.viewingAttempt - 1];
          if (!attempt) return <span className="text-xs text-muted-foreground">—</span>;
          return (
            <SubmissionTimingChip
              submittedAt={attempt.submittedAt}
              dueAt={attempt.dueAt}
              dense
            />
          );
        },
      },
      {
        id: "evaluation_date",
        accessorFn: (row) => row.evaluatedAt ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Evaluation date" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => {
          const evaluatedAt = row.original.evaluatedAt;
          if (!evaluatedAt) {
            return (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="size-3" aria-hidden />—
              </span>
            );
          }
          return (
            <span className="text-sm tabular-nums text-foreground">
              {format(new Date(evaluatedAt), "MMM d, yyyy")}
            </span>
          );
        },
      },
      {
        id: "evaluation_by",
        accessorFn: (row) => row.evaluatedBy?.name ?? "",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Evaluation by" tableId={TABLE_ID} />
        ),
        cell: ({ row }) => {
          const by = row.original.evaluatedBy;
          if (!by) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">{by.name}</p>
              <p className="text-[11px] text-muted-foreground">{by.email}</p>
            </div>
          );
        },
      },
      {
        id: ACTIONS_COLUMN_ID,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Action" tableId={TABLE_ID} />
        ),
        size: 96,
        enableSorting: false,
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" asChild className="rounded-lg">
            <Link href={ROUTES.admin.submissions.detail(row.original.id)}>
              Open
              <ArrowUpRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <ListingPage
      title="Submissions"
      description="Browse learner submissions across assignments and open the evaluation console."
      kpis={
        <SubmissionKpiSummary
          total={SEED_SUBMISSIONS.length}
          counts={statusCounts}
        />
      }
      toolbar={
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search learner or assignment…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-xl border-border/70 bg-background pl-9 shadow-sm focus-visible:ring-1"
          />
        </div>
      }
      toolbarFilters={
        <FilterPopover
          label="Status"
          options={STATUS_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
            count: statusCounts[o.value] ?? 0,
            tone: STATUS_TONE[o.value],
          }))}
          selected={statuses}
          onChange={(next) => setStatuses(next as SubmissionStatus[])}
        />
      }
    >
      <DataTable
        columns={columns}
        data={data}
        emptyTitle="No submissions match"
        emptyDescription="Try adjusting your filters or search."
        enableSelection={false}
        showView={false}
        initialSorting={[{ id: "submission_date", desc: true }]}
        tableId={TABLE_ID}
      />
    </ListingPage>
  );
}
