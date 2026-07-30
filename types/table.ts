import type { ColumnDef, SortingState, RowSelectionState } from "@tanstack/react-table";

export type { ColumnDef, SortingState, RowSelectionState };

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DataTableQueryState {
  page: number;
  pageSize: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}
