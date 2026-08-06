"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  Lock,
  MoreHorizontal,
  Pencil,
  ScrollText,
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
import {
  GradeScaleEditabilityChip,
  GradeScalePassFailChip,
  GradeScaleStatusChip,
  GradeScaleTypeChip,
} from "@/features/rubrics/grade-scale-chip";
import type {
  GradeScale,
  GradeScaleStatus,
  GradeScaleType,
} from "@/features/rubrics/constants";

const gradeTypeOrder: Record<GradeScaleType, number> = {
  percentage: 0,
  cgpa: 1,
  marks: 2,
  comp_incomp: 3,
  letter_grading: 4,
};

const statusOrder: Record<GradeScaleStatus, number> = {
  draft: 0,
  published: 1,
  in_use: 2,
  archived: 3,
};

export interface GradeScaleRowActions {
  onViewDetails: (scale: GradeScale) => void;
  onWhereUsed: (scale: GradeScale) => void;
}

export function getGradeScaleColumns(
  actions: GradeScaleRowActions,
): ColumnDef<GradeScale>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      meta: { label: "Name" },
      enableHiding: false,
      size: 320,
      cell: ({ row }) => {
        const scale = row.original;
        return (
          <div className="max-w-[320px] overflow-hidden" title={scale.name}>
            <span className="block truncate text-sm font-medium text-foreground">
              {scale.name}
            </span>
            {scale.meta?.description && (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {scale.meta.description}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "meta.gradeType",
      id: "gradeType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      meta: { label: "Type" },
      enableHiding: false,
      accessorFn: (row) => gradeTypeOrder[row.meta?.gradeType ?? "percentage"],
      sortingFn: "basic",
      cell: ({ row }) => {
        const t = row.original.meta?.gradeType;
        if (!t) return <span className="text-sm text-muted-foreground">—</span>;
        return <GradeScaleTypeChip type={t} />;
      },
    },
    {
      accessorKey: "meta.status",
      id: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      meta: { label: "Status" },
      enableHiding: false,
      accessorFn: (row) => statusOrder[row.meta?.status ?? "published"],
      sortingFn: "basic",
      cell: ({ row }) => {
        const s = row.original.meta?.status;
        if (!s) return <span className="text-sm text-muted-foreground">—</span>;
        return <GradeScaleStatusChip status={s} />;
      },
    },
    {
      id: "editability",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Editability" />
      ),
      meta: { label: "Editability" },
      cell: ({ row }) => <GradeScaleEditabilityChip scale={row.original} />,
    },
    {
      id: "passFail",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Pass/Fail" />
      ),
      meta: { label: "Pass/Fail" },
      accessorFn: (row) =>
        row.meta?.gradeType === "letter_grading" ? 1 : 0,
      sortingFn: "basic",
      filterFn: (row, _columnId, filterValue) => {
        const enabled =
          row.original.meta?.gradeType === "letter_grading";
        if (filterValue === "enabled") return enabled;
        if (filterValue === "disabled") return !enabled;
        return true;
      },
      cell: ({ row }) => <GradeScalePassFailChip scale={row.original} />,
    },
    {
      id: "__actions__",
      header: "",
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const scale = row.original;
        const editable = scale.meta?.isEditable ?? false;
        return (
          <div className="flex items-center justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9 rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
                  aria-label={`Actions for ${scale.name}`}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] rounded-xl p-1">
                <DropdownMenuItem
                  onSelect={() => actions.onViewDetails(scale)}
                  className="rounded-md"
                >
                  <Eye className="size-4 text-muted-foreground" />
                  View Details
                </DropdownMenuItem>
                {editable ? (
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href={ROUTES.admin.grading.form(scale.id)}>
                      <Pencil className="size-4 text-muted-foreground" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled
                    className="rounded-md text-muted-foreground"
                  >
                    <Lock className="size-4" />
                    Edit (built-in)
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => actions.onWhereUsed(scale)}
                  className="rounded-md"
                >
                  <ScrollText className="size-4 text-muted-foreground" />
                  Where Used
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}