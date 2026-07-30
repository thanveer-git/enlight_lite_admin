"use client";

/**
 * Column pinning store.
 *
 * Holds per-table pin state (left/right). Persists to localStorage so
 * a user's pin choices survive refresh. Keyed by an opaque `tableId`
 * so different DataTable pages (submissions, rubrics, …) keep their
 * own pinning.
 *
 * Operations:
 *   - pin(tableId, columnId, side)         — adds a column to a side
 *   - unpin(tableId, columnId)              — removes from both sides
 *   - clearPinning(tableId)                 — empties both sides
 *   - setPinning(tableId, {left, right})    — bulk replace
 *   - getPinning(tableId)                   — read current {left,right}
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type PinSide = "left" | "right";

export interface ColumnPinning {
  left: string[];
  right: string[];
}

interface ColumnPinningState {
  tables: Record<string, ColumnPinning>;
  pin: (tableId: string, columnId: string, side: PinSide) => void;
  unpin: (tableId: string, columnId: string) => void;
  clearPinning: (tableId: string) => void;
  setPinning: (tableId: string, next: ColumnPinning) => void;
  getPinning: (tableId: string) => ColumnPinning;
}

const EMPTY: ColumnPinning = { left: [], right: [] };

export const useColumnPinningStore = create<ColumnPinningState>()(
  persist(
    (set, get) => ({
      tables: {},

      pin: (tableId, columnId, side) => {
        const current = get().tables[tableId] ?? EMPTY;
        // Remove from the opposite side first, then add to the target.
        const cleanedLeft = side === "left"
          ? Array.from(new Set([...current.left, columnId]))
          : current.left.filter((id) => id !== columnId);
        const cleanedRight = side === "right"
          ? Array.from(new Set([...current.right, columnId]))
          : current.right.filter((id) => id !== columnId);
        set({
          tables: {
            ...get().tables,
            [tableId]: { left: cleanedLeft, right: cleanedRight },
          },
        });
      },

      unpin: (tableId, columnId) => {
        const current = get().tables[tableId] ?? EMPTY;
        const next = {
          left: current.left.filter((id) => id !== columnId),
          right: current.right.filter((id) => id !== columnId),
        };
        set({
          tables: { ...get().tables, [tableId]: next },
        });
      },

      clearPinning: (tableId) => {
        set({ tables: { ...get().tables, [tableId]: { ...EMPTY } } });
      },

      setPinning: (tableId, next) => {
        set({ tables: { ...get().tables, [tableId]: next } });
      },

      getPinning: (tableId) => get().tables[tableId] ?? EMPTY,
    }),
    {
      name: "admin_modern_column_pinning",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ tables: state.tables }),
    },
  ),
);

/** Convenience selector hook bound to a specific table id. */
export function useTableColumnPinning(tableId: string): {
  pinning: ColumnPinning;
  pin: (columnId: string, side: PinSide) => void;
  unpin: (columnId: string) => void;
  clearPinning: () => void;
} {
  const pinning = useColumnPinningStore(
    (s) => s.tables[tableId] ?? EMPTY,
  );
  const pin = useColumnPinningStore((s) => s.pin);
  const unpin = useColumnPinningStore((s) => s.unpin);
  const clearPinning = useColumnPinningStore((s) => s.clearPinning);
  return {
    pinning,
    pin: (columnId, side) => pin(tableId, columnId, side),
    unpin: (columnId) => unpin(tableId, columnId),
    clearPinning: () => clearPinning(tableId),
  };
}
