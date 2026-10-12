# Listing Page Wiring Guide

Checklist for every listing page in admin_modern. These are recurring gaps discovered during the rubrics module build — follow all seven points to avoid the same rework.

---

## 1. Server-side sorting

Wire sorting to the API — never sort client-side only. The DataTable must send `sort_by`/`sort_dir` to the backend, and the database must `ORDER BY` across the full dataset, not just the current page.

**How to apply:** Pass `sorting`/`onSortingChange` props to `DataTable` and forward `sortBy`/`sortDir` in the API call. In the model, whitelist allowed sort columns and fall back to a sensible default (e.g. `created_at DESC`).

## 2. Invalidate query cache after mutations

After creating, editing, duplicating, or changing status of a record and redirecting back to the listing, the page will show stale cached data unless the query cache is invalidated. The `QueryClient`'s `staleTime` (currently 30s) means React Query serves pre-mutation data.

**How to apply:** Call `queryClient.invalidateQueries({ queryKey: queryKeys.<module>.all })` in `onSubmitted` / after any mutation that redirects back to the listing.

## 3. KPI card counts from the database

KPI summary cards (Total, Published, Draft, etc.) must show counts from the entire dataset, not just the current page of results. Use an optimised `GROUP BY` query.

**How to apply:** Add a `need_count` parameter to the listing API. The backend runs a single `GROUP BY` query and returns the counts alongside the paginated rows. The frontend requests counts only on page 1 or when its cached counts are empty — not on every page change.

## 4. Server-side pagination

Pagination must be server-side. The DataTable sends `page`/`pageSize` to the API, the backend returns the correct slice plus `total`, and the DataTable uses `total` for page controls.

**How to apply:** Pass `page`, `pageSize`, `totalRows`, `onPageChange`, `onPageSizeChange` to `DataTable`. The API call includes `page`/`pageSize`; the response includes `total`.

## 5. Default sort direction must not be overridden by the frontend

When no column header is clicked (`sorting` is `[]`), the frontend must NOT send a sort direction — otherwise it overrides the backend's intended default. Sending `sort_dir=asc` when the backend defaults to `DESC` causes last-created records to appear last instead of first.

**How to apply:** Derive `sortDir` as `undefined` (not `"asc"`) when `sorting` is empty, so `buildQuery` omits the key and the backend applies its own default.

```ts
const sortDir = sorting.length > 0
  ? (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc"
  : undefined;
```

## 6. Confirmation dialogs for destructive or state-changing actions

Every action that mutates a record from the listing page (delete, duplicate, publish/unpublish, archive/unarchive) must go through a confirmation dialog — never fire the API directly from the dropdown menu click.

**How to apply:** Use the `ConfirmDialog` component (`@/components/composite/confirm-dialog`). The menu item sets a pending state; the dialog's `onConfirm` handler calls the API.

## 7. Reuse the shared ConfirmDialog component

Do not copy-paste `Dialog`/`DialogContent`/`DialogHeader`/`DialogFooter` markup for each confirmation popup. Use `ConfirmDialog` from `@/components/composite/confirm-dialog` which accepts `title`, `description`, `confirmLabel`, `variant`, `icon`, `loading`, and `onConfirm`.

**How to apply:** Import and render `<ConfirmDialog>` for every confirmation need. If new props are required, extend the shared component rather than inlining a one-off dialog.

---

## Reference implementation

See the rubrics listing page for a working example of all seven points:

- **Page:** `app/(admin)/admin_modern/rubrics/page.tsx`
- **Columns:** `features/rubrics/columns.tsx`
- **API client:** `services/api-client.ts` (`listRubrics`, `changeRubricStatus`)
- **Backend controller:** `edubex/application/controllers/admin/Rubrics_api.php`
- **Backend model:** `edubex/application/models/Rubric_model.php`
