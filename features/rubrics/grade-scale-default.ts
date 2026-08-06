import type { GradeScale } from "@/features/rubrics/constants";

/**
 * Editor-side draft row. Mirrors what the bands table renders
 * before it gets flattened into a `GradeScale`.
 *
 * `minRaw` / `maxRaw` are the unparsed text from the row inputs; we
 * preserve them so the editor can show blank or decimal entries
 * (per EDUBEX §5 whole-number + blank-min/max blockers) without
 * coercing to `0` on every keystroke. `minMarks`/`maxMarks` stay
 * for the rest of the editor (preview, columns) and for persistence.
 *
 * `isPass` is a tri-state: `true` (Pass), `false` (Fail), `null`
 * (unflagged — only valid when pfMode is off). The engine derives
 * pass/fail from `passBands.includes(grade)` so the unflagged state
 * is intentional.
 */
export interface GradeBandDraft {
  grade: string;
  minMarks: number;
  maxMarks: number;
  minRaw?: string;
  maxRaw?: string;
  isPass: boolean | null;
}

const EMPTY_BAND: GradeBandDraft = {
  grade: "",
  minMarks: 0,
  maxMarks: 0,
  isPass: null,
};

export interface GradeScaleDraft {
  name: string;
  description: string;
  status: NonNullable<GradeScale["meta"]>["status"];
  pfMode: boolean;
  bands: GradeBandDraft[];
}

function numericToRaw(n: number): string {
  return Number.isFinite(n) ? String(n) : "";
}

/**
 * Six empty rows — matches the seeded `gs_letter` shape so the
 * editor opens with a familiar layout.
 */
export function emptyGradeScaleDraft(): GradeScaleDraft {
  return {
    name: "",
    description: "",
    status: "draft",
    pfMode: true,
    bands: Array.from({ length: 6 }, () => ({ ...EMPTY_BAND })),
  };
}

/**
 * Convert a persisted `GradeScale` into an editor draft. Used by
 * the form page to pre-populate the editor when opening an
 * existing letter-grade scale.
 *
 * `bands - passBands` is treated as implicitly Fail (set `isPass: false`).
 * Bands whose `grade` isn't in `bands` get `isPass: null` — that won't
 * happen for valid letter scales, but is a safe default if a record
 * drifts.
 */
export function scaleToDraft(scale: GradeScale): GradeScaleDraft {
  const meta = scale.meta;
  const passSet = new Set(scale.passBands ?? []);
  const anyFlagged = (scale.passBands?.length ?? 0) > 0;
  const bandSet = new Set(scale.bands);

  const bands: GradeBandDraft[] = scale.bands.map((label) => {
    const range = scale.ranges?.find((r) => r.grade === label);
    const isPass: boolean | null = bandSet.has(label)
      ? passSet.has(label)
      : null;
    return {
      grade: label,
      minMarks: range?.minMarks ?? 0,
      maxMarks: range?.maxMarks ?? 0,
      minRaw: numericToRaw(range?.minMarks ?? 0),
      maxRaw: numericToRaw(range?.maxMarks ?? 0),
      isPass,
    };
  });

  // If `bands` was empty (e.g. built-in format), seed six blanks so
  // the editor renders. The page only routes letter-grade scales
  // here, so this branch is rare.
  const filledBands = bands.length > 0
    ? bands
    : Array.from({ length: 6 }, () => ({ ...EMPTY_BAND }));

  return {
    name: scale.name,
    description: meta?.description ?? "",
    status: meta?.status ?? "draft",
    pfMode: anyFlagged,
    bands: filledBands,
  };
}

/**
 * Convert an editor draft back into the persisted shape. Drops
 * rows whose `grade` is blank (treats them as unfilled) but keeps
 * them when min/max are set so partial edits survive.
 *
 * Fail bands are *not* persisted — `bands - passBands` is implicit
 * Fail on read (see `scaleToDraft` and `isPassingBand`).
 */
export function draftToScaleInput(draft: GradeScaleDraft): {
  name: string;
  description: string;
  status: NonNullable<GradeScale["meta"]>["status"];
  bands: string[];
  ranges: { grade: string; minMarks: number; maxMarks: number }[];
  passBands: string[];
} {
  const labels = draft.bands.map((b) => b.grade.trim()).filter((g) => g.length > 0);

  const ranges = draft.bands
    .filter((b) => b.grade.trim().length > 0)
    .map((b) => ({
      grade: b.grade.trim(),
      minMarks: b.minMarks,
      maxMarks: b.maxMarks,
    }));

  const passBands = draft.bands
    .filter((b) => b.isPass === true && b.grade.trim().length > 0)
    .map((b) => b.grade.trim());

  return {
    name: draft.name,
    description: draft.description,
    status: draft.status,
    bands: labels,
    ranges,
    passBands,
  };
}
