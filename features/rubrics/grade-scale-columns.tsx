"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Eye,
  MoreHorizontal,
  Pencil,
  ScrollText,
  Send,
  Trash2,
  Undo2,
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
  GradeScaleDefaultChip,
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
  archived: 2,
};

export interface GradeScaleRowActions {
  onViewDetails: (scale: GradeScale) => void;
  onWhereUsed: (scale: GradeScale) => void;
  onDelete: (scale: GradeScale) => void;
  onStatusChange: (scale: GradeScale, nextStatus: GradeScaleStatus) => void;
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
            <div className="flex items-center gap-2">
              {scale.meta?.isDefault && <GradeScaleDefaultChip />}
              <span className="truncate text-sm font-medium text-foreground">
                {scale.name}
              </span>
            </div>
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
      id: "usedBy",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Used By"
          className="justify-center"
        />
      ),
      meta: { label: "Used By" },
      accessorFn: (row) => row.used ?? 0,
      sortingFn: "basic",
      cell: ({ row }) => {
        const used = row.original.used ?? 0;
        if (used === 0) {
          return (
            <div className="flex items-center justify-center">
              <span className="text-sm text-muted-foreground">None</span>
            </div>
          );
        }
        return (
          <div className="flex items-center justify-center">
            <span className="text-sm text-foreground">
              {used} {used === 1 ? "Rubric" : "Rubrics"}
            </span>
          </div>
        );
      },
    },
    {
      id: "passFail",
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="Pass/Fail"
          className="justify-center"
        />
      ),
      meta: { label: "Pass/Fail" },
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <GradeScalePassFailChip scale={row.original} />
        </div>
      ),
    },
    {
      id: "__actions__",
      header: "",
      size: 64,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const scale = row.original;
        const isDefault = scale.meta?.isDefault ?? false;
        const isLetter = scale.meta?.gradeType === "letter_grading";
        const status = scale.meta?.status;
        const used = scale.used ?? 0;
        const isUsed = used > 0;
        const canChangeStatus = !isDefault && !isUsed;
        const canDelete = !isDefault && !isUsed;
        const isPublished = status === "published";
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
                {isLetter && (
                  <DropdownMenuItem
                    onSelect={() => actions.onViewDetails(scale)}
                    className="rounded-md"
                  >
                    <Eye className="size-4 text-muted-foreground" />
                    View Details
                  </DropdownMenuItem>
                )}
                {!isDefault && (
                  <DropdownMenuItem asChild className="rounded-md">
                    <Link href={ROUTES.admin.grading.form(scale.id)}>
                      <Pencil className="size-4 text-muted-foreground" />
                      Edit
                    </Link>
                  </DropdownMenuItem>
                )}
                {canChangeStatus && (
                  <DropdownMenuItem
                    onSelect={() =>
                      actions.onStatusChange(
                        scale,
                        isPublished ? "draft" : "published",
                      )
                    }
                    className="rounded-md"
                  >
                    {isPublished ? (
                      <Undo2 className="size-4 text-muted-foreground" />
                    ) : (
                      <Send className="size-4 text-muted-foreground" />
                    )}
                    {isPublished ? "Unpublish" : "Publish"}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onSelect={() => actions.onWhereUsed(scale)}
                  className="rounded-md"
                >
                  <ScrollText className="size-4 text-muted-foreground" />
                  Where Used
                </DropdownMenuItem>
                {!isDefault && (
                  <DropdownMenuItem
                    disabled={!canDelete}
                    onSelect={() => {
                      if (canDelete) actions.onDelete(scale);
                    }}
                    className="rounded-md text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    {isUsed ? "Delete (in use)" : "Delete"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}