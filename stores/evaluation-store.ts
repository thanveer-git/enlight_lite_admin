"use client";

/**
 * Evaluation console store.
 *
 * Holds per-submission drafts (ratings, direct grade, override, mark-
 * complete, notify). No persistence — refresh resets, matching the
 * document's prototype limitation (Section 6).
 *
 * State shape:
 *   drafts            keyed by submission id
 *   completionTouched user-driven toggles guard the auto-complete-on-pass
 *   savedDrafts       last saved snapshot for change detection
 *   savedStatuses     status flips persisted in-session
 *   openSubmissionId  currently focused submission
 */
import { create } from "zustand";

import type {
  EvaluationDraft,
  ManualOverride,
  SubmissionStatus,
} from "@/features/evaluation/types";

export type SaveResult =
  | { ok: true; status: SubmissionStatus }
  | { ok: false; reason: "no_override_reason" };

interface EvaluationStoreState {
  openSubmissionId: string | null;
  drafts: Record<string, EvaluationDraft>;
  completionTouched: Record<string, boolean>;
  savedDrafts: Record<string, EvaluationDraft>;
  savedStatuses: Record<string, SubmissionStatus>;

  setOpen: (id: string | null) => void;
  ensureDraft: (submissionId: string, seed: EvaluationDraft) => void;
  setRating: (
    submissionId: string,
    criterionId: string,
    levelId: string,
    points: number | null,
  ) => void;
  setDirectGrade: (submissionId: string, value: string) => void;
  setOverride: (submissionId: string, patch: Partial<ManualOverride>) => void;
  setAccessWindow: (
    submissionId: string,
    window: NonNullable<EvaluationDraft["accessWindow"]>,
  ) => void;
  setMarkComplete: (submissionId: string, next: boolean) => void;
  setNotify: (submissionId: string, next: boolean) => void;
  markCompletionTouched: (submissionId: string, touched: boolean) => void;
  save: (
    submissionId: string,
    ctx: { completionDecision: "complete" | "open"; saveBlocked: boolean },
  ) => SaveResult;
  reset: (submissionId: string) => void;
  getStatus: (submissionId: string, defaultStatus: SubmissionStatus) => SubmissionStatus;
  getDraft: (submissionId: string, fallback: EvaluationDraft) => EvaluationDraft;
  isCompletionTouched: (submissionId: string) => boolean;
}

export const useEvaluationStore = create<EvaluationStoreState>()((set, get) => ({
  openSubmissionId: null,
  drafts: {},
  completionTouched: {},
  savedDrafts: {},
  savedStatuses: {},

  setOpen: (id) => set({ openSubmissionId: id }),

  ensureDraft: (submissionId, seed) => {
    const { drafts } = get();
    if (!drafts[submissionId]) {
      set({
        drafts: { ...drafts, [submissionId]: cloneDraft(seed) },
        savedDrafts: { ...get().savedDrafts, [submissionId]: cloneDraft(seed) },
      });
    }
  },

  setRating: (submissionId, criterionId, levelId, points) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: {
        ...get().drafts,
        [submissionId]: {
          ...current,
          ratings: { ...current.ratings, [criterionId]: { levelId, points } },
        },
      },
    });
  },

  setDirectGrade: (submissionId, value) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: { ...get().drafts, [submissionId]: { ...current, directGrade: value } },
    });
  },

  setOverride: (submissionId, patch) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: {
        ...get().drafts,
        [submissionId]: {
          ...current,
          override: { ...current.override, ...patch },
        },
      },
    });
  },

  setAccessWindow: (submissionId, window) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: {
        ...get().drafts,
        [submissionId]: { ...current, accessWindow: window },
      },
    });
  },

  setMarkComplete: (submissionId, next) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: { ...get().drafts, [submissionId]: { ...current, markComplete: next } },
      completionTouched: { ...get().completionTouched, [submissionId]: true },
    });
  },

  setNotify: (submissionId, next) => {
    const current = get().drafts[submissionId];
    if (!current) return;
    set({
      drafts: { ...get().drafts, [submissionId]: { ...current, notifyLearner: next } },
    });
  },

  markCompletionTouched: (submissionId, touched) => {
    set({ completionTouched: { ...get().completionTouched, [submissionId]: touched } });
  },

  save: (submissionId, ctx) => {
    const draft = get().drafts[submissionId];
    if (!draft) return { ok: false, reason: "no_override_reason" };
    if (ctx.saveBlocked) return { ok: false, reason: "no_override_reason" };

    const status: SubmissionStatus =
      ctx.completionDecision === "complete" ? "graded" : "resubmit";

    set({
      savedDrafts: { ...get().savedDrafts, [submissionId]: cloneDraft(draft) },
      savedStatuses: { ...get().savedStatuses, [submissionId]: status },
    });

    return { ok: true, status };
  },

  reset: (submissionId) => {
    const { drafts, savedDrafts } = get();
    const saved = savedDrafts[submissionId];
    if (!saved) {
      const next = { ...drafts };
      delete next[submissionId];
      set({ drafts: next });
      return;
    }
    set({ drafts: { ...drafts, [submissionId]: cloneDraft(saved) } });
  },

  getStatus: (submissionId, defaultStatus) =>
    get().savedStatuses[submissionId] ?? defaultStatus,

  getDraft: (submissionId, fallback) =>
    get().drafts[submissionId] ?? cloneDraft(fallback),

  isCompletionTouched: (submissionId) =>
    Boolean(get().completionTouched[submissionId]),
}));

function cloneDraft(draft: EvaluationDraft): EvaluationDraft {
  return {
    ratings: { ...draft.ratings },
    directGrade: draft.directGrade,
    override: { ...draft.override },
    markComplete: draft.markComplete,
    notifyLearner: draft.notifyLearner,
    accessWindow: draft.accessWindow
      ? {
          availableAt: draft.accessWindow.availableAt,
          dueAt: draft.accessWindow.dueAt,
          untilAt: draft.accessWindow.untilAt,
        }
      : undefined,
  };
}
