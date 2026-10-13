import { FAKE_CURRENT_USER, FAKE_USERS } from "@/services/handlers/users";
import { FAKE_ASSIGNMENTS } from "@/features/assignments/seed";
import type { AssignmentDraft } from "@/features/assignments/wizard/types";
import { EMPTY_DRAFT } from "@/features/assignments/wizard/types";
import type { RubricDraft } from "@/features/rubrics/wizard/types";
import type { Rubric, RubricBatchResult, RubricDetail, RubricMatrix, RubricCounts, RubricStatus, RubricType } from "@/types/rubric";
import type { User } from "@/types/session";
import type { PaginatedResponse } from "@/types/table";
import { backendFetch, buildQuery, ApiError } from "@/services/api-helpers";
import { ENDPOINTS } from "@/services/endpoints";
import type { InitialData, InitialDataResponse } from "@/services/handlers/sidebar";

const SIMULATED_LATENCY_MS = 250;
const rubricInFlight = new Map<string, Promise<RubricDetail | null>>();

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export { ApiError };

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: User["role"];
}

export interface ListRubricsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string[];
  type?: string[];
  sortBy?: string;
  sortDir?: "asc" | "desc";
  needCount?: boolean;
}

export interface CreateRubricPayload {
  name: string;
  outcome: string;
  type: RubricType;
  status: RubricStatus;
  matrix?: RubricMatrix;
}

export interface UpdateRubricPayload {
  name: string;
  outcome: string;
  type: RubricType;
  status: RubricStatus;
  matrix?: RubricMatrix;
}

function emptyMatrix(type: RubricType): RubricMatrix {
  return {
    criteria: [],
    levels: [],
    descriptions: {},
    gradingMethod: type === "scored" ? "weighted_average" : "grade_profile",
    profileRules: [],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: null,
  };
}

export const apiClient = {
  // ── Users (still mock) ──────────────────────────────────────────────

  async getCurrentUser(): Promise<User> {
    return delay(FAKE_CURRENT_USER);
  },

  async listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    const { page = 1, pageSize = 10, search, role } = params;
    const needle = search?.toLowerCase();
    const filtered = FAKE_USERS.filter((u) => {
      if (role && u.role !== role) return false;
      if (
        needle &&
        !u.name.toLowerCase().includes(needle) &&
        !u.email.toLowerCase().includes(needle)
      ) {
        return false;
      }
      return true;
    });
    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);
    return delay({ data, total: filtered.length, page, pageSize });
  },

  async getUser(id: string): Promise<User | null> {
    const user = FAKE_USERS.find((u) => u.id === id) ?? null;
    return delay(user);
  },

  // ── Rubrics (live API) ──────────────────────────────────────────────

  async getInitialData(): Promise<InitialData> {
    const response = await fetch(ENDPOINTS.reactConfigs.initialData, {
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      throw new ApiError(response.status, "Unable to load admin navigation");
    }
    const result = (await response.json()) as InitialDataResponse;
    if (!result.status) {
      throw new ApiError(result.status_code || response.status, result.message || "Unable to load admin navigation");
    }
    return result.data;
  },

  async getModulePermissions(moduleName: string): Promise<number[]> {
    const qs = buildQuery({ module_name: moduleName });
    return backendFetch<number[]>(ENDPOINTS.configuration.access + qs);
  },

  async listRubrics(
    params: ListRubricsParams = {},
  ): Promise<PaginatedResponse<Rubric> & { counts?: RubricCounts }> {
    const qs = buildQuery({
      search: params.search,
      status: params.status,
      type: params.type,
      page: params.page,
      pageSize: params.pageSize,
      sort_by: params.sortBy,
      sort_dir: params.sortDir,
      need_count: params.needCount ? "1" : undefined,
    });
    return backendFetch<PaginatedResponse<Rubric> & { counts?: RubricCounts }>(
      ENDPOINTS.rubrics.list + qs,
    );
  },

  async getRubric(id: string): Promise<RubricDetail | null> {
    const existing = rubricInFlight.get(id);
    if (existing) return existing;
    const promise = backendFetch<RubricDetail>(ENDPOINTS.rubrics.detail(id))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      })
      .finally(() => rubricInFlight.delete(id));
    rubricInFlight.set(id, promise);
    return promise;
  },

  async getRubricsByIds(ids: string[]): Promise<RubricDetail[]> {
    const results = await Promise.all(
      ids.map((id) => apiClient.getRubric(id)),
    );
    return results.filter((r): r is RubricDetail => r !== null);
  },

  async createRubric(payload: CreateRubricPayload): Promise<Rubric> {
    return backendFetch<Rubric>(ENDPOINTS.rubrics.list, {
      method: "POST",
      body: payload,
    });
  },

  async updateRubric(
    id: string,
    payload: UpdateRubricPayload,
  ): Promise<Rubric | null> {
    try {
      return await backendFetch<Rubric>(ENDPOINTS.rubrics.detail(id), {
        method: "PATCH",
        body: payload,
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },

  async deleteRubric(id: string): Promise<void> {
    await backendFetch(ENDPOINTS.rubrics.delete(id), { method: "DELETE" });
  },

  async deleteRubrics(ids: string[]): Promise<RubricBatchResult> {
    return backendFetch<RubricBatchResult>(ENDPOINTS.rubrics.bulkDelete, {
      method: "POST",
      body: { ids },
    });
  },

  async duplicateRubric(id: string): Promise<Rubric> {
    return backendFetch<Rubric>(ENDPOINTS.rubrics.duplicate(id), {
      method: "POST",
    });
  },

  async changeRubricStatus(id: string, status: RubricStatus): Promise<Rubric> {
    return backendFetch<Rubric>(ENDPOINTS.rubrics.changeStatus(id), {
      method: "PATCH",
      body: { status },
    });
  },

  async changeRubricsStatus(ids: string[], status: RubricStatus): Promise<RubricBatchResult> {
    return backendFetch<RubricBatchResult>(ENDPOINTS.rubrics.bulkStatus, {
      method: "POST",
      body: { ids, status },
    });
  },

  async getRubricDraft(id: string | number): Promise<RubricDraft> {
    if (id === 0 || id === "0") {
      return {
        name: "",
        outcome: "",
        type: null,
        matrix: emptyMatrix("scored"),
      };
    }
    const detail = await apiClient.getRubric(String(id));
    if (!detail) {
      return {
        name: "",
        outcome: "",
        type: null,
        matrix: emptyMatrix("scored"),
      };
    }
    return {
      name: detail.name,
      outcome: detail.outcome,
      type: detail.type,
      matrix: detail.matrix,
    };
  },

  // ── Assignments (still mock) ────────────────────────────────────────

  async getAssignmentDraft(id: string | number): Promise<AssignmentDraft> {
    if (id === 0 || id === "0") return delay(EMPTY_DRAFT());
    const row = FAKE_ASSIGNMENTS.find((a) => a.id === String(id));
    if (!row) return delay(EMPTY_DRAFT());
    return delay(JSON.parse(JSON.stringify(row)) as AssignmentDraft);
  },

  async createAssignment(draft: AssignmentDraft): Promise<AssignmentDraft> {
    const created: AssignmentDraft = {
      ...draft,
      id: `asg_${Date.now()}`,
    };
    FAKE_ASSIGNMENTS.unshift(created);
    return delay(created);
  },

  async updateAssignment(
    id: string,
    draft: AssignmentDraft,
  ): Promise<AssignmentDraft | null> {
    const idx = FAKE_ASSIGNMENTS.findIndex((a) => a.id === id);
    if (idx === -1) return delay(null);
    const updated: AssignmentDraft = { ...draft, id };
    FAKE_ASSIGNMENTS[idx] = updated;
    return delay(updated);
  },
};

export type ApiClient = typeof apiClient;
