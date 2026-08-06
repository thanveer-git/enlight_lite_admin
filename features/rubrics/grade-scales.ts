import { GRADE_SCALES } from "@/features/rubrics/constants";
import type { GradeScale, GradeScaleStatus } from "@/features/rubrics/constants";

/**
 * In-memory cache for grade-scale lookups.
 *
 * Today this is unused — `getGradeScale` reads straight from the
 * `GRADE_SCALES` mock constant. When the API lands, `fetchGradeScale`
 * will hydrate this map on first access and `getGradeScale` will
 * read from it synchronously, so existing call sites stay sync.
 */
const cache = new Map<string, GradeScale>();

/**
 * Admin-created or admin-edited scales. Appended to the listing
 * view returned by `fetchGradeScales` so the listing page picks
 * them up without changing the `GRADE_SCALES` constant. When the
 * real API lands, this in-memory list is replaced by the backend.
 */
const customScales: GradeScale[] = [];

function allScales(): GradeScale[] {
  return [...GRADE_SCALES, ...customScales];
}

/**
 * Resolve a single grade-scale definition by id.
 *
 * Synchronous today (reads from `GRADE_SCALES` mock data); will
 * continue to be sync after the API migration by hydrating the
 * in-memory cache first. New scales added by admins won't be
 * visible to this function until the page reloads — acceptable
 * for v1 since the engine doesn't pick up new scales mid-session.
 */
export function getGradeScale(id: string | null): GradeScale | null {
  if (!id) return null;
  const cached = cache.get(id);
  if (cached) return cached;
  const found = allScales().find((scale) => scale.id === id) ?? null;
  if (found) cache.set(id, found);
  return found;
}

/**
 * Fetch a single grade-scale definition from the network.
 *
 * Cache-first: returns the cached entry if present, otherwise hits
 * the API and hydrates the cache. Reserved for components that can
 * await — the listing page and detail views. Engine code should
 * keep using `getGradeScale` to stay sync.
 */
export async function fetchGradeScale(
  id: string,
): Promise<GradeScale | null> {
  const cached = cache.get(id);
  if (cached) return cached;
  // API wiring lands here. Until then, fall through to the mock.
  return getGradeScale(id);
}

/**
 * Fetch every grade-scale definition.
 *
 * Cache-first per-id. Used by the grading module's listing page.
 * Returns the merged list of built-in + custom scales.
 */
export async function fetchGradeScales(): Promise<GradeScale[]> {
  const merged = allScales();
  for (const scale of merged) {
    if (!cache.has(scale.id)) cache.set(scale.id, scale);
  }
  return merged;
}

/**
 * Shape that admin-created / admin-edited scales can carry.
 * Used by the editor form to write back through the resolver.
 */
export interface GradeScaleDraftInput {
  name: string;
  description?: string;
  status: GradeScaleStatus;
  bands: string[];
  ranges?: { grade: string; minMarks: number; maxMarks: number }[];
  passBands?: string[];
}

/**
 * Create a new grade scale. Returns the persisted record with a
 * generated id (`gs_<random>`). For mock persistence only.
 */
export function createGradeScale(input: GradeScaleDraftInput): GradeScale {
  const id = `gs_${Math.random().toString(36).slice(2, 10)}`;
  const next: GradeScale = {
    id,
    name: input.name.trim(),
    bands: [...input.bands],
    ranges: input.ranges ? [...input.ranges] : undefined,
    passBands: input.passBands ? [...input.passBands] : undefined,
    meta: {
      isEditable: true,
      status: input.status,
      gradeType: "letter_grading",
      description: input.description?.trim() || undefined,
    },
  };
  customScales.push(next);
  cache.set(id, next);
  return next;
}

/**
 * Update an existing editable (letter-grade) scale. Built-in
 * scales are not patchable — callers should not invoke this on
 * `meta.isEditable === false` records.
 */
export function updateGradeScale(
  id: string,
  patch: GradeScaleDraftInput,
): GradeScale | null {
  const existing = customScales.find((s) => s.id === id);
  if (existing && existing.meta) {
    existing.name = patch.name.trim();
    existing.bands = [...patch.bands];
    existing.ranges = patch.ranges ? [...patch.ranges] : undefined;
    existing.passBands = patch.passBands ? [...patch.passBands] : undefined;
    existing.meta = {
      isEditable: existing.meta.isEditable,
      gradeType: existing.meta.gradeType,
      status: patch.status,
      description: patch.description?.trim() || undefined,
    };
    cache.set(id, existing);
    return existing;
  }

  // Edit a built-in / seeded letter scale by promoting it into the
  // custom list (so the next listing read sees the updated fields).
  const seeded = GRADE_SCALES.find((s) => s.id === id);
  if (seeded && seeded.meta) {
    const next: GradeScale = {
      ...seeded,
      name: patch.name.trim(),
      bands: [...patch.bands],
      ranges: patch.ranges ? [...patch.ranges] : undefined,
      passBands: patch.passBands ? [...patch.passBands] : undefined,
      meta: {
        isEditable: seeded.meta.isEditable,
        gradeType: seeded.meta.gradeType,
        status: patch.status,
        description: patch.description?.trim() || undefined,
      },
    };
    customScales.push(next);
    cache.set(id, next);
    return next;
  }
  return null;
}
