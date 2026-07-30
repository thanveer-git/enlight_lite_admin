"use client";

/**
 * Column header with sort + pin submenu.
 *
 * Sort:
 *   - Asc / Desc (always visible for sortable columns).
 *
 * Pin (only when `tableId` is provided):
 *   - Pin to left
 *   - Pin to right
 *   - Unpin
 *
 * Selection depends on the current `getIsPinned()` for the column.
 * The dispatched action goes through the column-pinning store so the
 * user's choice persists across refreshes.
 */
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Pin,
  PinOff,
  PinIcon,
  PinOffIcon,
} from "lucide-react";
import type { Column } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTableColumnPinning } from "@/stores/column-pinning-store";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
  /** Required to expose the Pin submenu. */
  tableId?: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
  tableId,
}: DataTableColumnHeaderProps<TData, TValue>) {
  const canSort = column.getCanSort();
  const canPin = !!tableId;
  const pinningControls = useTableColumnPinning(tableId ?? "");

  if (!canSort && !canPin) {
    return (
      <div
        className={cn(
          "text-xs font-semibold uppercase tracking-wide text-foreground/80",
          className,
        )}
      >
        {title}
      </div>
    );
  }

  const sorted = column.getIsSorted();
  const isPinned = column.getIsPinned();
  const columnId = column.id;

  return (
    <div className={cn("flex items-center", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-xs font-semibold uppercase tracking-wide text-foreground/80 hover:bg-muted/60 hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground"
          >
            {isPinned === "left" && (
              <span
                aria-hidden
                className="mr-1.5 inline-flex size-3.5 items-center justify-center text-primary"
                title="Pinned to left"
              >
                <Pin className="size-3.5" />
              </span>
            )}
            {isPinned === "right" && (
              <span
                aria-hidden
                className="ml-1.5 inline-flex size-3.5 items-center justify-center text-primary"
                title="Pinned to right"
              >
                <Pin className="size-3.5" />
              </span>
            )}
            <span>{title}</span>
            {canSort && sorted === "desc" ? (
              <ArrowDown className="ml-1.5 size-3.5" />
            ) : canSort && sorted === "asc" ? (
              <ArrowUp className="ml-1.5 size-3.5" />
            ) : canSort ? (
              <ChevronsUpDown className="ml-1.5 size-3.5" />
            ) : null}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[180px]">
          {canSort && (
            <>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className="mr-2 size-3.5 text-foreground/70" />
                Sort ascending
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className="mr-2 size-3.5 text-foreground/70" />
                Sort descending
              </DropdownMenuItem>
            </>
          )}

          {canPin && (
            <>
              {canSort && <DropdownMenuSeparator />}
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Pin column
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => pinningControls.pin(columnId, "left")}
                disabled={isPinned === "left"}
              >
                <Pin className="mr-2 size-3.5 rotate-90 text-foreground/70" aria-hidden />
                Pin to left
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => pinningControls.pin(columnId, "right")}
                disabled={isPinned === "right"}
              >
                <PinIcon className="mr-2 size-3.5 -rotate-90 text-foreground/70" aria-hidden />
                Pin to right
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => pinningControls.unpin(columnId)}
                disabled={!isPinned}
              >
                <PinOff className="mr-2 size-3.5 text-foreground/70" aria-hidden />
                Unpin
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => pinningControls.clearPinning()}
                disabled={!isPinned}
                className="text-muted-foreground"
              >
                <PinOffIcon className="mr-2 size-3.5" aria-hidden />
                Clear all pins
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
