"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, ArrowUp, ArrowDown, Eye, Trash2, X } from "lucide-react";
import type { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";

export interface DataTableBulkActionsProps<TData> {
  table: Table<TData>;
}

export function DataTableBulkActions<TData>({ table }: DataTableBulkActionsProps<TData>) {
  const selected = table.getFilteredSelectedRowModel().rows;
  const count = selected.length;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (count === 0 || !mounted) return null;

  return createPortal(
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-card px-1.5 py-1 shadow-md">
      <span className="flex items-center gap-1.5 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white">
        <span className="inline-flex size-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
          {count}
        </span>
        <span>selected</span>
      </span>

      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="View selected"
      >
        <Eye className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Sort descending"
      >
        <ArrowDown className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Sort ascending"
      >
        <ArrowUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        aria-label="Export selected"
      >
        <ArrowDownToLine className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full bg-red-500 text-white hover:bg-red-600 hover:text-white"
        aria-label="Delete selected"
      >
        <Trash2 className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7 rounded-full"
        onClick={() => table.resetRowSelection()}
        aria-label="Clear selection"
      >
        <X className="size-3.5" />
      </Button>
    </div>,
    document.body,
  );
}
