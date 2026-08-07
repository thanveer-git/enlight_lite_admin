import type { AccessRule } from "@/features/assignments/wizard/types";
import { PRIORITY_OF } from "@/features/assignments/wizard/types";

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

export type DateField = "fromAt" | "dueAt" | "untilAt";

export interface ResolvedField {
  value: string | null;
  /** Which audience-level provided this value. `null` if no rule sets it. */
  by: AccessRule["audience"] | null;
  /** The id of the rule that contributed this value. */
  ruleId: string | null;
}

export interface ResolvedAccess {
  fromAt: ResolvedField;
  dueAt: ResolvedField;
  untilAt: ResolvedField;
}

/**
 * Resolve effective access for a single student across a list of rules.
 *
 * Algorithm (matches spec §3.4 "Resolution logic"):
 *  1. Filter rules that apply to this student.
 *  2. Sort by priority (Single > Multiple > Everyone), then by `updatedAt`
 *     descending so the most recently edited rule wins ties.
 *  3. For each of the three date fields, take the value from the highest-
 *     priority rule that explicitly sets it. Lower-priority rules fill in
 *     only the fields the higher-priority rule left null.
 */
export function resolveAccessForStudent(
  rules: AccessRule[],
  studentId: string,
): ResolvedAccess {
  const applicable = rules.filter((r) => ruleAppliesToStudent(r, studentId));
  const sorted = [...applicable].sort((a, b) => {
    const pa = PRIORITY_RANK[PRIORITY_OF[a.audience]]!;
    const pb = PRIORITY_RANK[PRIORITY_OF[b.audience]]!;
    if (pa !== pb) return pa - pb;
    return b.updatedAt - a.updatedAt;
  });

  const resolve = (field: DateField): ResolvedField => {
    for (const rule of sorted) {
      const v = rule[field];
      if (v) return { value: v, by: rule.audience, ruleId: rule.id };
    }
    return { value: null, by: null, ruleId: null };
  };

  return {
    fromAt: resolve("fromAt"),
    dueAt: resolve("dueAt"),
    untilAt: resolve("untilAt"),
  };
}

export function ruleAppliesToStudent(rule: AccessRule, studentId: string): boolean {
  if (rule.audience === "everyone") return true;
  return rule.studentIds.includes(studentId);
}

/** Stable signature string used by the notify engine to dedupe sends. */
export function resolvedSignature(r: ResolvedAccess): string {
  return [r.fromAt.value ?? "_", r.dueAt.value ?? "_", r.untilAt.value ?? "_"].join("|");
}

/** Union of every student covered by any rule with notify=true. */
export function studentsToNotify(rules: AccessRule[], allStudentIds: string[]): string[] {
  const notifyRules = rules.filter((r) => r.notify);
  const covered = new Set<string>();
  for (const r of notifyRules) {
    if (r.audience === "everyone") {
      for (const id of allStudentIds) covered.add(id);
    } else {
      for (const id of r.studentIds) covered.add(id);
    }
  }
  return Array.from(covered);
}
