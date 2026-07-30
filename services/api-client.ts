import { FAKE_RUBRICS } from "@/services/handlers/rubrics";
import { FAKE_RUBRIC_DETAILS } from "@/services/handlers/rubric-details";
import { FAKE_CURRENT_USER, FAKE_USERS } from "@/services/handlers/users";
import type { RubricDraft } from "@/features/rubrics/wizard/types";
import type { Rubric, RubricDetail, RubricMatrix, RubricStatus, RubricType } from "@/types/rubric";
import type { User } from "@/types/session";
import type { PaginatedResponse } from "@/types/table";

const SIMULATED_LATENCY_MS = 250;

function delay<T>(value: T, ms = SIMULATED_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function fallbackMatrix(row: Rubric): RubricMatrix {
  const safeCriteria = Math.max(0, row.criteriaCount);
  const safeLevels = Math.max(0, row.levelsCount);
  const criteria = Array.from({ length: safeCriteria }, (_, idx) => ({
    id: `c-${row.id}-${idx}`,
    name: `Criterion ${idx + 1}`,
    weight: row.type === "scored" ? 1 : null,
  }));
  const levels = Array.from({ length: safeLevels }, (_, idx) => ({
    id: `l-${row.id}-${idx}`,
    name: `Level ${idx + 1}`,
    points:
      row.type === "scored"
        ? {
            type: "single" as const,
            value: Math.max(0, 100 - idx * 25),
            min: null,
            max: null,
          }
        : null,
  }));
  return {
    criteria,
    levels,
    descriptions: {},
    gradingMethod: row.type === "scored" ? "weighted_average" : "grade_profile",
    profileRules: [],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: null,
  };
}

function withMatrix(row: Rubric): RubricDetail {
  const explicit = FAKE_RUBRIC_DETAILS[row.id];
  if (explicit) return { ...explicit, matrix: explicit.matrix };
  return { ...row, matrix: fallbackMatrix(row) };
}

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

/** Empty matrix used when creating a brand-new rubric. */
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

    return delay({
      data,
      total: filtered.length,
      page,
      pageSize,
    });
  },

  async getUser(id: string): Promise<User | null> {
    const user = FAKE_USERS.find((u) => u.id === id) ?? null;
    return delay(user);
  },

  async getRubric(id: string): Promise<RubricDetail | null> {
    const row = FAKE_RUBRICS.find((r) => r.id === id);
    if (!row) return delay(null);
    return delay(withMatrix(row));
  },

  async getRubricsByIds(ids: string[]): Promise<RubricDetail[]> {
    const out: RubricDetail[] = [];
    for (const id of ids) {
      const row = FAKE_RUBRICS.find((r) => r.id === id);
      if (row) out.push(withMatrix(row));
    }
    return delay(out);
  },

  async listRubrics(params: ListRubricsParams = {}): Promise<PaginatedResponse<Rubric>> {
    const { page = 1, pageSize = 10, search, status, type } = params;
    const needle = search?.trim().toLowerCase();
    const filtered = FAKE_RUBRICS.filter((r) => {
      if (
        needle &&
        !r.name.toLowerCase().includes(needle) &&
        !r.description.toLowerCase().includes(needle)
      ) {
        return false;
      }
      if (status && status.length > 0 && !status.includes(r.status)) return false;
      if (type && type.length > 0 && !type.includes(r.type)) return false;
      return true;
    });

    const start = (page - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return delay({
      data,
      total: filtered.length,
      page,
      pageSize,
    });
  },

  async createRubric(payload: CreateRubricPayload): Promise<Rubric> {
    const plainOutcome = stripHtml(payload.outcome);
    const newRubric: Rubric = {
      id: `rb_${Date.now()}`,
      name: payload.name,
      description: plainOutcome.slice(0, 140),
      outcome: payload.outcome,
      status: payload.status,
      type: payload.type,
      criteriaCount: payload.matrix?.criteria.length ?? 0,
      levelsCount: payload.matrix?.levels.length ?? 0,
      usedBy: 0,
      updatedAt: new Date().toISOString(),
      createdBy: FAKE_CURRENT_USER.name,
    };
    FAKE_RUBRICS.unshift(newRubric);
    return delay(newRubric);
  },

  async updateRubric(
    id: string,
    payload: UpdateRubricPayload,
  ): Promise<Rubric | null> {
    const idx = FAKE_RUBRICS.findIndex((r) => r.id === id);
    if (idx === -1) return delay(null);
    const plainOutcome = stripHtml(payload.outcome);
    const updated: Rubric = {
      ...FAKE_RUBRICS[idx]!,
      name: payload.name,
      description: plainOutcome.slice(0, 140),
      outcome: payload.outcome,
      status: payload.status,
      type: payload.type,
      criteriaCount: payload.matrix?.criteria.length ?? 0,
      levelsCount: payload.matrix?.levels.length ?? 0,
      updatedAt: new Date().toISOString(),
    };
    // Also refresh the detail cache so subsequent reads see the new
    // matrix.
    FAKE_RUBRIC_DETAILS[id] = {
      ...updated,
      matrix: payload.matrix ?? fallbackMatrix(updated),
    };
    FAKE_RUBRICS[idx] = updated;
    return delay(updated);
  },

  /**
   * Returns a wizard-ready `RubricDraft` for the given id. Passing `0`
   * or an unknown id yields a blank draft with an empty matrix, which is
   * the starting state for the create flow.
   */
  async getRubricDraft(id: string | number): Promise<RubricDraft> {
    if (id === 0 || id === "0") {
      return delay({
        name: "",
        outcome: "",
        type: null,
        matrix: emptyMatrix("scored"),
      });
    }
    const row = FAKE_RUBRICS.find((r) => r.id === String(id));
    if (!row) {
      return delay({
        name: "",
        outcome: "",
        type: null,
        matrix: emptyMatrix("scored"),
      });
    }
    const detail = withMatrix(row);
    return delay({
      name: detail.name,
      outcome: detail.outcome,
      type: detail.type,
      matrix: detail.matrix,
    });
  },
};

export type ApiClient = typeof apiClient;
