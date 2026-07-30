"use client";

import { useState } from "react";
import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { differenceInDays, format } from "date-fns";
import {
  ArchiveX,
  Copy,
  MoreHorizontal,
  Pencil,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { DataTableColumnHeader } from "@/components/composite/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROUTES } from "@/constants/routes";
import { RubricSimulatorDialog } from "@/features/rubrics/simulator/rubric-simulator-dialog";
import { cn } from "@/lib/utils";
import type { Rubric, RubricStatus, RubricType } from "@/types/rubric";

// Per-status colour tokens (soft tinted background + saturated text).
// Used by both the row badge and the filter-popover preview swatch.
export const statusChipClass: Record<RubricStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200",
  published: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  in_use: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  archived: "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-200",
};

const statusLabel: Record<RubricStatus, string> = {
  draft: "Draft",
  published: "Published",
  in_use: "In Use",
  archived: "Archived",
};

const statusOrder: Record<RubricStatus, number> = {
  draft: 0,
  published: 1,
  in_use: 2,
  archived: 3,
};

const typeOrder: Record<RubricType, number> = {
  scored: 0,
  unscored: 1,
};

const typeLabel: Record<RubricType, string> = {
  scored: "Scored",
  unscored: "Unscored",
};

function UpdatedCell({ value }: { value: string }) {
  const date = new Date(value);
  const diffDays = differenceInDays(new Date(), date);
  const relative =
    diffDays <= 0
      ? "today"
      : diffDays === 1
        ? "1 day ago"
        : `${diffDays} days ago`;

  return (
    <div className="flex flex-col leading-tight">
      <span className="text-sm text-foreground">{format(date, "MMM d, yyyy")}</span>
      <span className="text-xs text-muted-foreground">{relative}</span>
    </div>
  );
}

export interface RubricRowActions {
  onDelete: (rubric: Rubric) => void;
}

export function getRubricColumns(
  actions: RubricRowActions,
): ColumnDef<Rubric>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      meta: { label: "Name" },
      enableHiding: false,
      size: 360,
      cell: ({ row }) => {
        const rubric = row.original;
        return (
          <div
            className="max-w-[360px] overflow-hidden"
            title={rubric.name}
          >
            <span
              className="block break-words text-sm font-medium text-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [line-clamp:2] overflow-hidden"
            >
              {rubric.name}
            </span>
            <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{rubric.criteriaCount} Criteria</span>
              <span aria-hidden className="size-1 rounded-full bg-muted-foreground/40" />
              <span>{rubric.levelsCount} Levels</span>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      meta: { label: "Status" },
      enableHiding: false,
      accessorFn: (row) => statusOrder[row.status],
      sortingFn: "basic",
      cell: ({ row }) => {
        const s = row.original.status;
        return (
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
              statusChipClass[s],
            )}
          >
            {statusLabel[s]}
          </span>
        );
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
      enableHiding: false,
      accessorFn: (row) => typeOrder[row.type],
      sortingFn: "basic",
      cell: ({ row }) => {
        const t = row.original.type;
        return (
          <span className="text-sm text-muted-foreground">
            {typeLabel[t]}
          </span>
        );
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Updated" />,
      cell: ({ row }) => <UpdatedCell value={row.original.updatedAt} />,
    },
    {
      id: "__actions__",
      header: "",
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const rubric = row.original;
        const isInUse = rubric.status === "in_use";
        const [simOpen, setSimOpen] = useState(false);
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                  aria-label={`Actions for ${rubric.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] rounded-xl p-1">
                <DropdownMenuItem
                  onSelect={() => setSimOpen(true)}
                  className="rounded-md"
                >
                  <PlayCircle className="size-4 text-muted-foreground" />
                  Simulate Grading
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-md">
                  <Link href={ROUTES.admin.rubrics.form(rubric.id)}>
                    <Pencil className="size-4 text-muted-foreground" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => {
                    toast.success("Rubric copied", { description: rubric.name });
                  }}
                  className="rounded-md"
                >
                  <Copy className="size-4 text-muted-foreground" />
                  Duplicate Rubric
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isInUse}
                  onSelect={() => {
                    if (!isInUse) actions.onDelete(rubric);
                  }}
                  className="rounded-md text-destructive focus:text-destructive"
                >
                  {isInUse ? (
                    <ArchiveX className="size-4" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {isInUse ? "Delete (in use)" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <RubricSimulatorDialog
              rubricId={rubric.id}
              rubricName={rubric.name}
              rubricType={rubric.type}
              open={simOpen}
              onOpenChange={setSimOpen}
            />
          </div>
        );
      },
    },
  ];
}
