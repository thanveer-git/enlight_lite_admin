"use client";

import type { Table } from "@tanstack/react-table";

import { Pagination } from "@/components/composite/pagination";
import { PAGE_SIZE_OPTIONS } from "@/constants/table";

export interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({ table }: DataTablePaginationProps<TData>) {
  const page = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const total = table.getFilteredRowModel().rows.length;

  return (
    <Pagination
      page={page}
      pageSize={pageSize}
      total={total}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      onPageChange={(p) => table.setPageIndex(p - 1)}
      onPageSizeChange={(n) => table.setPageSize(n)}
    />
  );
}
