import type {
  GradeScale,
  GradeScaleConfiguration,
  GradeScaleMeta,
  GradeScaleStatus,
  GradeScaleType,
} from "@/features/rubrics/constants";
import { backendFetch, buildQuery, ApiError } from "@/services/api-helpers";
import { ENDPOINTS } from "@/services/endpoints";

export { ApiError };

/* ── Sync cache for standalone consumers ───────────────────────────────
 * The grading listing page uses fetchGradeScales (paginated) which feeds
 * this cache. Wizards, simulators, and evaluation selectors read from it
 * synchronously via getGradeScale()/getAllCachedScales().
 */

const cache = new Map<string, GradeScale>();

function cacheScales(scales: GradeScale[]): void {
  const previous = new Map(cache);
  cache.clear();
  for (const scale of scales) {
    const prior = previous.get(scale.id);
    const merged = prior?.bands.length
      ? { ...scale, bands: prior.bands, ranges: prior.ranges, passBands: prior.passBands }
      : scale;
    cache.set(merged.id, merged);
  }
}

export function getGradeScale(id: string | null): GradeScale | null {
  if (!id) return null;
  return cache.get(id) ?? null;
}

export function getAllCachedScales(): GradeScale[] {
  return Array.from(cache.values());
}

interface ApiGradeGroup {
  id: number;
  name: string;
  slug: string;
  gradeType: GradeScaleType;
  metaConfigs: GradeScaleConfiguration | null;
  description: string;
  isDefault: boolean;
  isPassed: boolean;
  status: GradeScaleStatus;
  usedCount: number;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: string;
  bands?: ApiBand[];
}

interface ApiBand {
  id: number;
  gradeGroupSlug: string;
  name: string;
  rangeFrom: number;
  rangeTo: number;
  sortOrder: number;
  isPass: boolean | null;
  status: string;
}

function apiGroupToGradeScale(group: ApiGradeGroup): GradeScale {
  const bands = group.bands ?? [];
  const bandLabels = bands.map((b) => b.name);
  const ranges = bands.map((b) => ({
    grade: b.name,
    minMarks: b.rangeFrom,
    maxMarks: b.rangeTo,
  }));
  const passBands = bands
    .filter((b) => b.isPass === true)
    .map((b) => b.name);

  const meta: GradeScaleMeta = {
    isEditable: !group.isDefault,
    isDefault: group.isDefault === true,
    isPassed: group.isPassed === true,
    status: group.status,
    gradeType: group.gradeType,
    description: group.description || undefined,
  };

  const scale: GradeScale = {
    id: group.slug,
    apiId: group.id,
    name: group.name,
    bands: group.gradeType === "letter_grading" ? bandLabels : [],
    meta,
    used: group.usedCount,
  };

  if (group.gradeType === "letter_grading" && ranges.length > 0) {
    scale.ranges = ranges;
  }
  if (group.gradeType === "letter_grading" && passBands.length > 0) {
    scale.passBands = passBands;
  }
  if (group.metaConfigs) {
    scale.configuration = group.metaConfigs;
  }

  return scale;
}

/* ── Listing ─────────────────────────────────────────────────────────── */

export interface GradeScaleCounts {
  total: number;
  status: Record<GradeScaleStatus, number>;
  gradeType: Record<GradeScaleType, number>;
  passFail: Record<"enabled" | "disabled", number>;
}

export interface ListGradeScalesParams {
  search?: string;
  gradeType?: GradeScaleType[];
  status?: GradeScaleStatus[];
  passFail?: ("enabled" | "disabled")[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  needCount?: boolean;
}

export interface GradeScaleListResult {
  data: GradeScale[];
  total: number;
  page: number;
  pageSize: number;
  counts?: GradeScaleCounts;
}

const inFlightDetail = new Map<string, Promise<GradeScale | null>>();

export async function fetchGradeScaleWithBands(
  id: string,
): Promise<GradeScale | null> {
  const cached = cache.get(id);
  if (cached?.bands.length) return cached;
  const existing = inFlightDetail.get(id);
  if (existing) return existing;
  const promise = (async () => {
    try {
      const group = await backendFetch<ApiGradeGroup>(
        ENDPOINTS.gradeGroups.detail(id),
      );
      const scale = apiGroupToGradeScale(group);
      cache.set(scale.id, scale);
      return scale;
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    } finally {
      inFlightDetail.delete(id);
    }
  })();
  inFlightDetail.set(id, promise);
  return promise;
}

export async function fetchGradeScales(
  params: ListGradeScalesParams = {},
): Promise<GradeScaleListResult> {
  const qs = buildQuery({
    search: params.search || undefined,
    grade_type: params.gradeType,
    status: params.status,
    pass_fail: params.passFail,
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
    sort_by: params.sortBy || undefined,
    sort_dir: params.sortDir,
    need_count: params.needCount ? "1" : undefined,
  });

  const result = await backendFetch<{
    data: ApiGradeGroup[];
    total: number;
    page: number;
    pageSize: number;
    counts?: {
      total: number;
      status: Record<string, number>;
      gradeType: Record<string, number>;
      passFail: Record<string, number>;
    };
  }>(ENDPOINTS.gradeGroups.list + qs);

  const data = result.data.map(apiGroupToGradeScale);
  cacheScales(data);

  let counts: GradeScaleCounts | undefined;
  if (result.counts) {
    counts = {
      total: result.counts.total,
      status: {
        draft: result.counts.status.draft ?? 0,
        published: result.counts.status.published ?? 0,
        archived: result.counts.status.archived ?? 0,
      },
      gradeType: {
        percentage: result.counts.gradeType.percentage ?? 0,
        cgpa: result.counts.gradeType.cgpa ?? 0,
        marks: result.counts.gradeType.marks ?? 0,
        comp_incomp: result.counts.gradeType.comp_incomp ?? 0,
        letter_grading: result.counts.gradeType.letter_grading ?? 0,
      },
      passFail: {
        enabled: result.counts.passFail?.enabled ?? 0,
        disabled: result.counts.passFail?.disabled ?? 0,
      },
    };
  }

  return {
    data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    counts,
  };
}

/* ── Mutations ───────────────────────────────────────────────────────── */

export interface GradeScaleDraftInput {
  name: string;
  description?: string;
  status: GradeScaleStatus;
  isPassed: boolean;
  bands: string[];
  ranges?: { grade: string; minMarks: number; maxMarks: number }[];
  passBands?: string[];
}

export async function createGradeScale(
  input: GradeScaleDraftInput,
): Promise<GradeScale> {
  const body: Record<string, unknown> = {
    name: input.name.trim(),
    grade_type: "letter_grading",
    status: input.status,
    description: input.description?.trim() || "",
    is_passed: input.isPassed,
  };

  const group = await backendFetch<ApiGradeGroup>(ENDPOINTS.gradeGroups.list, {
    method: "POST",
    body,
  });

  if (input.bands.length > 0 && input.ranges) {
    for (let i = 0; i < input.bands.length; i++) {
      const label = input.bands[i];
      const range = input.ranges.find((r) => r.grade === label);
      if (!label || label.trim() === "") continue;
      await backendFetch(ENDPOINTS.gradeGroups.bands(group.slug), {
        method: "POST",
        body: {
          name: label,
          range_from: range?.minMarks ?? 0,
          range_to: range?.maxMarks ?? 0,
          is_pass: input.passBands?.includes(label) ?? false,
        },
      });
    }
  }

  const full = await backendFetch<ApiGradeGroup>(
    ENDPOINTS.gradeGroups.detail(group.slug),
  );
  const scale = apiGroupToGradeScale(full);
  cache.set(scale.id, scale);
  return scale;
}

export async function updateGradeScale(
  id: string,
  patch: GradeScaleDraftInput,
): Promise<GradeScale | null> {
  let full: ApiGradeGroup;
  try {
    full = await backendFetch<ApiGradeGroup>(ENDPOINTS.gradeGroups.detail(id), {
      method: "PATCH",
      body: {
        name: patch.name.trim(),
        description: patch.description?.trim() || "",
        status: patch.status,
        is_passed: patch.isPassed,
        bands: patch.bands.map((label, index) => {
          const range = patch.ranges?.find((item) => item.grade === label);
          return {
            name: label,
            range_from: range?.minMarks ?? 0,
            range_to: range?.maxMarks ?? 0,
            is_pass: patch.passBands?.includes(label) ?? false,
            sort_order: index,
          };
        }),
      },
    });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }

  const scale = apiGroupToGradeScale(full);
  cache.set(scale.id, scale);
  return scale;
}

export interface GradeScaleBatchItemResult {
  id: number;
  success: boolean;
  reason?: "not_found" | "default_grade" | "in_use" | "update_failed" | "delete_failed";
  usedCount?: number;
}

export interface GradeScaleBatchResult {
  succeeded: number;
  failed: number;
  results: GradeScaleBatchItemResult[];
}

export async function deleteGradeScales(ids: number[]): Promise<GradeScaleBatchResult> {
  return backendFetch<GradeScaleBatchResult>(ENDPOINTS.gradeGroups.delete, {
    method: "POST",
    body: { ids },
  });
}

export async function changeGradeScalesStatus(
  ids: number[],
  status: "draft" | "published",
): Promise<GradeScaleBatchResult> {
  return backendFetch<GradeScaleBatchResult>(ENDPOINTS.gradeGroups.changeStatus, {
    method: "POST",
    body: { ids, status },
  });
}

