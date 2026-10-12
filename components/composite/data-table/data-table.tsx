"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Cell,
  type Column,
  type ColumnDef,
  type ColumnPinningState,
  type Header,
  type SortingState,
  type Table as RTTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/composite/empty-state";
import { HorizontalScrollContainer } from "@/components/composite/horizontal-scroll-container";
import { Pagination } from "@/components/composite/pagination";
import { PAGE_SIZE_OPTIONS } from "@/constants/table";
import { DataTableBulkActions } from "@/components/composite/data-table/data-table-toolbar";
import { DataTableView } from "@/components/composite/data-table/data-table-view";
import { DataTablePagination } from "@/components/composite/data-table/data-table-pagination";
import { useColumnPinningStore, useTableColumnPinning } from "@/stores/column-pinning-store";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const EMPTY_PINNING: ColumnPinningState = { left: [], right: [] };

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  enableSelection?: boolean;
  canSelectRow?: (row: TData) => boolean;
  bulkActions?: (table: RTTable<TData>) => React.ReactNode;
  bulkActionsOnly?: boolean;
  toolbarExtras?: (table: RTTable<TData>) => React.ReactNode;
  showView?: boolean;
  /**
   * Initial sorting state — applied on first render only.
   */
  initialSorting?: SortingState;
  /**
   * Optional page size override. Defaults to 10.
   */
  pageSize?: number;
  /**
   * When provided (along with `onPageChange` and `totalRows`), the table
   * switches to server-side pagination: TanStack's client-side pagination
   * row model is disabled and the parent owns the current page / page
   * size / total count.
   */
  page?: number;
  totalRows?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  /**
   * Server-side sorting. When provided (with `onSortingChange`), TanStack's
   * client-side sort row model is disabled and the parent owns the sort
   * state — mirroring the server-pagination props above.
   */
  sorting?: SortingState;
  onSortingChange?: (sorting: SortingState) => void;
  /**
   * Stable identifier used to persist column-pinning choices in
   * localStorage. When provided, columns gain a Pin submenu in the
   * header dropdown and pinned columns render sticky on the
   * horizontally-scrollable table.
   */
  tableId?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  isError = false,
  onRetry,
  emptyTitle = "No results",
  emptyDescription = "Try adjusting your filters or search.",
  enableSelection = true,
  canSelectRow,
  bulkActions,
  bulkActionsOnly = false,
  toolbarExtras,
  showView = true,
  initialSorting = [],
  pageSize = 10,
  page,
  totalRows,
  onPageChange,
  onPageSizeChange,
  sorting: sortingProp,
  onSortingChange,
  tableId,
}: DataTableProps<TData, TValue>) {
  const serverPaginated =
    page != null && totalRows != null && onPageChange != null;
  const serverSorted = sortingProp != null && onSortingChange != null;
  const [localSorting, setLocalSorting] = React.useState<SortingState>(initialSorting);
  const sorting = serverSorted ? sortingProp : localSorting;
  // TanStack's onSortingChange may pass an updater function rather than a
  // value, so resolve both forms before forwarding to the parent.
  const handleSortingChange = (updaterOrValue: SortingState | ((old: SortingState) => SortingState)) => {
    const next =
      typeof updaterOrValue === "function" ? updaterOrValue(localSorting) : updaterOrValue;
    if (serverSorted) onSortingChange(next);
    else setLocalSorting(next);
  };
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  // Hydrate initial pin state from the persisted store so the first
  // render already reflects saved pinning choices.
  const persistedPinning = useColumnPinningStore((s) =>
    tableId ? s.tables[tableId] ?? EMPTY_PINNING : EMPTY_PINNING,
  );
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>(
    () => persistedPinning,
  );

  // Keep local state in sync if the store changes from elsewhere
  // (clear-all, another tab, etc.).
  React.useEffect(() => {
    setColumnPinning(persistedPinning);
  }, [persistedPinning]);

  const pinningControls = useTableColumnPinning(tableId ?? "");

  const pinEnabled = !!tableId;

  const handlePinningChange = React.useCallback(
    (updater: ColumnPinningState | ((prev: ColumnPinningState) => ColumnPinningState)) => {
      setColumnPinning((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        const prevLeft = prev.left ?? [];
        const prevRight = prev.right ?? [];
        const nextLeft = next.left ?? [];
        const nextRight = next.right ?? [];

        // Additions
        for (const id of nextLeft) {
          if (!prevLeft.includes(id)) pinningControls.pin(id, "left");
        }
        for (const id of nextRight) {
          if (!prevRight.includes(id)) pinningControls.pin(id, "right");
        }
        // Removals — unpin handles both sides at once.
        for (const id of prevLeft) {
          if (!nextLeft.includes(id) && !nextRight.includes(id)) {
            pinningControls.unpin(id);
          }
        }
        for (const id of prevRight) {
          if (!nextRight.includes(id) && !nextLeft.includes(id)) {
            pinningControls.unpin(id);
          }
        }
        return next;
      });
    },
    [pinningControls],
  );

  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableSelection) return columns;
    const selectionColumn: ColumnDef<TData, TValue> = {
      id: "__select__",
      enableSorting: false,
      enableHiding: false,
      header: ({ table }) => {
        const selectableRows = table.getRowModel().rows.filter((row) =>
          canSelectRow ? canSelectRow(row.original) : true,
        );
        const selectedCount = selectableRows.filter((row) => row.getIsSelected()).length;
        return (
          <Checkbox
            aria-label="Select all"
            checked={selectableRows.length > 0 && selectedCount === selectableRows.length}
            onCheckedChange={(checked) => {
              for (const row of selectableRows) row.toggleSelected(Boolean(checked));
            }}
          />
        );
      },
      cell: ({ row }) => {
        const selectable = canSelectRow ? canSelectRow(row.original) : true;
        return selectable ? (
          <Checkbox
            aria-label="Select row"
            checked={row.getIsSelected()}
            onCheckedChange={(v) => row.toggleSelected(Boolean(v))}
          />
        ) : null;
      },
      size: 32,
    };
    return [selectionColumn, ...columns];
  }, [columns, enableSelection, canSelectRow]);

  const table = useReactTable<TData>({
    data,
    columns: tableColumns,
    enableRowSelection: (row) => canSelectRow ? canSelectRow(row.original) : true,
    state: pinEnabled
      ? { sorting, columnVisibility, columnPinning }
      : { sorting, columnVisibility },
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnPinningChange: pinEnabled ? handlePinningChange : undefined,
    enableColumnPinning: pinEnabled,
    getCoreRowModel: getCoreRowModel<TData>(),
    ...(serverSorted ? {} : { getSortedRowModel: getSortedRowModel<TData>() }),
    getFilteredRowModel: getFilteredRowModel<TData>(),
    ...(serverPaginated
      ? {}
      : { getPaginationRowModel: getPaginationRowModel<TData>() }),
    initialState: { pagination: { pageSize } },
  });

  if (isLoading) {
    return (
      <div className="overflow-clip rounded-2xl border bg-card shadow-soft">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {tableColumns.map((c, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-3 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, r) => (
              <TableRow key={r} className="hover:bg-transparent">
                {tableColumns.map((__, c) => (
                  <TableCell key={c}>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        variant="destructive"
        icon={Inbox}
        title="Failed to load data"
        description="Something went wrong while fetching records."
        action={onRetry ? { label: "Retry", onClick: onRetry } : undefined}
      />
    );
  }

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <EmptyState icon={Inbox} title={emptyTitle} description={emptyDescription} />
    );
  }

  return (
    <>
      <div className="overflow-clip rounded-2xl border bg-card shadow-soft transition-shadow duration-200 hover:shadow-soft-lg">
        {(showView || toolbarExtras) && (
          <div className="flex items-center justify-end gap-2 border-b border-border/60 px-4 py-2.5">
            {toolbarExtras?.(table)}
            {showView && <DataTableView table={table} />}
          </div>
        )}
        <HorizontalScrollContainer>
          <table className="w-full min-w-max caption-bottom text-sm">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr
                  key={hg.id}
                  className="border-b border-border/60 hover:bg-transparent"
                >
                  {hg.headers.map((header) => renderHeaderCell(header))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  style={{ animationDelay: `${index * 40}ms` }}
                  className={cn(
                    "border-b border-border/60 transition-colors duration-150 hover:bg-muted/40 data-[state=selected]:bg-muted/60",
                    "dt-row-animate",
                  )}
                >
                  {row.getVisibleCells().map((cell) => renderBodyCell(cell))}
                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScrollContainer>

        <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
          {serverPaginated ? (
            <Pagination
              page={page!}
              pageSize={pageSize}
              total={totalRows!}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              onPageChange={onPageChange!}
              onPageSizeChange={onPageSizeChange}
            />
          ) : (
            <DataTablePagination table={table} />
          )}
        </div>
      </div>

      <DataTableBulkActions table={table} actions={bulkActions} showClearSelection={!bulkActionsOnly} />
    </>
  );
}

function renderHeaderCell<TData, TValue>(
  header: Header<TData, TValue>,
): React.ReactNode {
  const column = header.column as unknown as Column<TData, unknown>;
  const commonClass =
    "h-11 px-5 text-xs font-semibold uppercase tracking-wide text-foreground/80";
  if (header.isPlaceholder) {
    if (column.getIsPinned()) {
      return (
        <TableHead
          key={header.id}
          data-pinned={column.getIsPinned()}
          style={{ width: column.getSize(), ...pinnedStyle(column) }}
          className={cn(commonClass, "bg-card")}
        />
      );
    }
    return <TableHead key={header.id} className={commonClass} />;
  }

  if (column.getIsPinned()) {
    return (
      <TableHead
        key={header.id}
        data-pinned={column.getIsPinned()}
        style={{ width: column.getSize(), ...pinnedStyle(column) }}
        className={cn(commonClass, pinnedCellClass(column))}
      >
        {flexRender(column.columnDef.header, header.getContext())}
      </TableHead>
    );
  }

  return (
    <TableHead key={header.id} style={{ width: column.getSize() }} className={commonClass}>
      {flexRender(column.columnDef.header, header.getContext())}
    </TableHead>
  );
}

function renderBodyCell<TData, TValue>(
  cell: Cell<TData, TValue>,
): React.ReactNode {
  const column = cell.column as unknown as Column<TData, unknown>;
  if (column.getIsPinned()) {
    return (
      <TableCell
        key={cell.id}
        data-pinned={column.getIsPinned()}
        style={pinnedStyle(column)}
        className={cn("h-[72px] px-5 py-3 align-middle", pinnedCellClass(column))}
      >
        {flexRender(column.columnDef.cell, cell.getContext())}
      </TableCell>
    );
  }
  return (
    <TableCell key={cell.id} className="h-[72px] px-5 py-3 align-middle first:pl-6 last:pr-6">
      {flexRender(column.columnDef.cell, cell.getContext())}
    </TableCell>
  );
}

/**
 * Returns `{ position, left|right, zIndex }` for a pinned column.
 * TanStack exposes cumulative offsets from the scroll-edge through
 * `getStart('left')` and `getAfter('right')`.
 */
function pinnedStyle<TData>(column: Column<TData, unknown>): React.CSSProperties {
  if (column.getIsPinned() === "left") {
    return {
      position: "sticky",
      left: column.getStart("left") ?? 0,
      zIndex: 20,
    };
  }
  if (column.getIsPinned() === "right") {
    return {
      position: "sticky",
      right: column.getAfter("right") ?? 0,
      zIndex: 20,
    };
  }
  return {};
}

/**
 * Visual class for pinned cells.
 *
 * Adds a translucent, blurred backdrop so that when content scrolls
 * underneath the pinned column it shows through with the macOS / iOS
 * "frosted glass" effect. Pairs with a soft inset separator on the
 * inward-facing edge so the frozen zone reads as visually distinct
 * from the scrollable data — and removes the row-level bottom border
 * on pinned cells so the pinned strip reads as a single continuous
 * frosted panel rather than a stack of separated strips.
 *
 * The right-pinned strip gets a slightly heavier inset shadow and a
 * touch more opacity than the left, because — unlike a left-pinned
 * column where data columns visibly slide behind it as the user
 * scrolls — a right-pinned column sits at the trailing edge of the
 * scrollable content, so very little actually scrolls *under* it.
 * Without that extra weight, the right strip looks like a flat
 * translucent panel and reads as a weaker "frosted" treatment than
 * the left, even though the same blur is applied.
 *
 * Tokens:
 *   - `bg-card/85` (left) / `bg-card/90` (right) — translucent card
 *     surface. The right strip uses slightly more opacity to make
 *     up for the absence of content sliding behind it.
 *   - `backdrop-blur-sm` — mild backdrop blur; subtle, not glassy.
 *   - `saturate-[1.1]` — gentle saturation boost for a more polished feel.
 *   - Inset shadow via `--border` token — works in light + dark themes.
 *     The right side uses a wider shadow so the frozen strip's left
 *     edge reads as a clear panel boundary even when the table isn't
 *     scrolled.
 *   - `border-b-transparent` — neutralises the row separator on the
 *     pinned cell so the frosted panel stays continuous.
 */
function pinnedCellClass<TData>(column: Column<TData, unknown>): string {
  const side = column.getIsPinned();
  if (side === "left") {
    return "bg-card/85 backdrop-blur-sm backdrop-saturate-[1.1] border-b-transparent shadow-[inset_-1px_0_0_hsl(var(--border))]";
  }
  if (side === "right") {
    return "bg-card/90 backdrop-blur-sm backdrop-saturate-[1.1] border-b-transparent shadow-[-8px_0_12px_-6px_hsl(var(--foreground)/0.06),inset_1px_0_0_hsl(var(--border))]";
  }
  return "";
}
