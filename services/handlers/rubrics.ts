import type { Rubric } from "@/types/rubric";

// Mutable so the mock API client can append created rubrics in this session.
export const FAKE_RUBRICS: Rubric[] = [
  // ── New combination records (rb_0054–rb_0060) ─────────────────────────
  // One record per valid (GradingMethod, MinPass, Fallback) combination from
  // the EDUBEX grading-flows document. Used by the Rubric Simulator and
  // Wizard to exercise every code path.

  {
    id: "rb_0054",
    name: "Combo 1 – Scored · Weighted Average · Min Pass Off",
    description:
      "Canonical example of a Scored rubric using Weighted Average grading with the Minimum Pass rule disabled. Final grade comes from the weighted percentage falling in a band of the linked grade scale.",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:00:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate competency across thesis, evidence, and structure; the final letter is determined by weighted percentage mapped to the Letter Grade Scale.</p>",
  },
  {
    id: "rb_0055",
    name: "Combo 2 – Scored · Weighted Average · Min Pass On",
    description:
      "Scored rubric using Weighted Average grading with the Minimum Pass rule enabled. If any criterion falls below the guaranteed level the calculated band is discarded and the lowest Fail band is forced.",
    status: "published",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:05:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate competency across hypothesis, method, data, and discussion; every criterion must reach at least the Developing level for the calculated band to stand.</p>",
  },
  {
    id: "rb_0056",
    name: "Combo 3 – Scored · Grade Profile · Min Pass Off · Fallback Off",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule disabled and weighted-average fallback disabled. If no profile rule matches, Manual Override is required.",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:10:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the final letter is the first Grade Profile rule whose OR'd paths match.</p>",
  },
  {
    id: "rb_0057",
    name: "Combo 4 – Scored · Grade Profile · Min Pass Off · Fallback On",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule disabled but weighted-average fallback enabled. If no profile rule matches, the engine silently re-runs Weighted Average and uses that band.",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:15:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the engine first tries Grade Profile rules and falls back to a weighted band if none match.</p>",
  },
  {
    id: "rb_0058",
    name: "Combo 5 – Scored · Grade Profile · Min Pass On · Fallback Off",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule enabled. A matched profile rule is discarded if any criterion falls below the guaranteed level; otherwise Manual Override is required when no rule matches.",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:20:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; every criterion must reach at least the guaranteed level or the matched grade is force-overridden to the lowest Fail band.</p>",
  },
  {
    id: "rb_0059",
    name: "Combo 6 – Scored · Grade Profile · Min Pass On · Fallback On",
    description:
      "Scored rubric using Grade Profile grading with both the Minimum Pass rule and weighted-average fallback enabled. Combines Profile rule matching, Min Pass override, and Weighted Average fallback in one flow.",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:25:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the engine first tries Grade Profile rules, then enforces the Min Pass floor, and finally falls back to a weighted band.</p>",
  },
  {
    id: "rb_0060",
    name: "Combo 7 – Unscored · Grade Profile",
    description:
      "Unscored rubric using Grade Profile grading only. There are no points, no Minimum Pass rule, and no weighted-average fallback. Either a profile rule matches and supplies a grade, or Manual Override is required.",
    status: "published",
    type: "unscored",
    criteriaCount: 3,
    levelsCount: 3,
    usedBy: 0,
    updatedAt: "2026-08-01T08:30:00Z",
    createdBy: "Thanveer Ahmed",
    outcome:
      "<p>Students demonstrate content mastery, delivery, and audience engagement; the final Performance level is the first Grade Profile rule whose OR'd paths match.</p>",
  },
];
