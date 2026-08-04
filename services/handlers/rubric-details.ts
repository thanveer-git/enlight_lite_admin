import type { RubricDetail, RubricMatrix } from "@/types/rubric";

const letterScaleId = "gs_letter";
const performanceScaleId = "gs_performance";

type FlatDescriptionMap = Record<string, string>;

function nest(flat: FlatDescriptionMap): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [key, value] of Object.entries(flat)) {
    const [criterionId, levelId] = key.split("|");
    if (!criterionId || !levelId) continue;
    if (!out[criterionId]) out[criterionId] = {};
    out[criterionId][levelId] = value;
  }
  return out;
}

function weighted(
  criteria: { id: string; name: string; weight: number; description?: string }[],
  levels: { id: string; name: string; type: "single" | "range"; value?: number; min?: number; max?: number }[],
  descriptions: Record<string, Record<string, string>> = {},
  overrides: Partial<RubricMatrix> = {},
): RubricMatrix {
  return {
    criteria: criteria.map((c) => ({
      id: c.id,
      name: c.name,
      weight: c.weight,
    })),
    levels: levels.map((l) => ({
      id: l.id,
      name: l.name,
      points:
        l.type === "single"
          ? { type: "single", value: l.value ?? 0, min: null, max: null }
          : { type: "range", value: null, min: l.min ?? 0, max: l.max ?? 0 },
    })),
    descriptions,
    gradingMethod: "weighted_average",
    profileRules: [],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: letterScaleId,
    ...overrides,
  };
}

const essayWritingMatrix: RubricMatrix = weighted(
  [
    {
      id: "c-thesis",
      name: "Thesis Clarity & Argument Quality",
      weight: 2,
      description:
        "The central argument is articulated with precision, originality, and a clear line of reasoning that holds the entire essay together.",
    },
    {
      id: "c-evidence",
      name: "Evidence Integration & Source Engagement",
      weight: 2,
      description:
        "Sources are selected, cited, and synthesized to actively advance the argument rather than merely decorate it.",
    },
    {
      id: "c-organization",
      name: "Structural Organization & Flow",
      weight: 1,
      description:
        "Paragraphs and sections follow a logical progression; transitions between ideas feel intentional rather than mechanical.",
    },
    {
      id: "c-style",
      name: "Prose Style, Grammar, and Mechanics",
      weight: 1,
      description:
        "Sentences vary in length and structure, vocabulary is precise, and the writing is largely free of grammar or punctuation errors.",
    },
  ],
  [
    { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
    { id: "l-proficient", name: "Proficient", type: "range", min: 3, max: 3.9 },
    { id: "l-developing", name: "Developing", type: "range", min: 2, max: 2.9 },
    { id: "l-emerging", name: "Emerging", type: "range", min: 1, max: 1.9 },
  ],
  nest({
    "c-thesis|l-excellent": "Thesis is original, precise, and convincingly argued.",
    "c-thesis|l-proficient": "Thesis is clear and supported with relevant reasoning.",
    "c-thesis|l-developing": "Thesis is identifiable but inconsistently defended.",
    "c-thesis|l-emerging": "Thesis is vague, missing, or contradicted by the body.",
    "c-evidence|l-excellent": "Sources are synthesized to advance the argument.",
    "c-evidence|l-proficient": "Sources support claims with minor relevance gaps.",
    "c-evidence|l-developing": "Sources are listed rather than integrated.",
    "c-evidence|l-emerging": "Sources are missing, misattributed, or unrelated.",
    "c-organization|l-excellent": "Structure reinforces the argument.",
    "c-organization|l-proficient": "Structure is logical with minor lapses.",
    "c-organization|l-developing": "Structure is uneven; transitions feel mechanical.",
    "c-organization|l-emerging": "Structure is hard to follow.",
    "c-style|l-excellent": "Prose is precise, varied, and engaging.",
    "c-style|l-proficient": "Prose is clear with minor grammar issues.",
    "c-style|l-developing": "Prose is understandable but repetitive.",
    "c-style|l-emerging": "Frequent errors impede comprehension.",
  }),
);

const labReportMatrix: RubricMatrix = weighted(
  [
    { id: "c-hypothesis", name: "Hypothesis Articulation", weight: 1 },
    { id: "c-method", name: "Methodology & Procedure", weight: 2 },
    { id: "c-data", name: "Data Presentation & Analysis", weight: 2 },
    { id: "c-discussion", name: "Discussion & Error Analysis", weight: 2 },
  ],
  [
    { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
    { id: "l-proficient", name: "Proficient", type: "single", value: 3 },
    { id: "l-developing", name: "Developing", type: "range", min: 1.5, max: 2.5 },
    { id: "l-emerging", name: "Emerging", type: "range", min: 0.5, max: 1.4 },
  ],
  nest({
    "c-hypothesis|l-excellent": "Hypothesis is specific, testable, and grounded.",
    "c-hypothesis|l-proficient": "Hypothesis is clear with minor specificity issues.",
    "c-hypothesis|l-developing": "Hypothesis is vague or partially testable.",
    "c-hypothesis|l-emerging": "Hypothesis is missing or untestable.",
    "c-method|l-excellent": "Procedure is reproducible and well-justified.",
    "c-method|l-proficient": "Procedure is mostly clear.",
    "c-method|l-developing": "Procedure has notable gaps.",
    "c-method|l-emerging": "Procedure is missing or unreproducible.",
    "c-data|l-excellent": "Data is well-organized and rigorously analyzed.",
    "c-data|l-proficient": "Data is presented clearly with minor analytical gaps.",
    "c-data|l-developing": "Data presentation is uneven.",
    "c-data|l-emerging": "Data is missing or incorrectly interpreted.",
    "c-discussion|l-excellent": "Discussion connects results to theory and quantifies error.",
    "c-discussion|l-proficient": "Discussion addresses sources of error.",
    "c-discussion|l-developing": "Discussion is shallow.",
    "c-discussion|l-emerging": "Discussion is missing.",
  }),
  { minPassLevelId: "l-developing", suggestedScaleId: letterScaleId },
);

const oralPresentationMatrix: RubricMatrix = {
  criteria: [
    {
      id: "c-content",
      name: "Content Mastery & Message Clarity",
      weight: null,
    },
    { id: "c-delivery", name: "Verbal & Non-Verbal Delivery", weight: null },
    { id: "c-audience", name: "Audience Engagement & Q&A Handling", weight: null },
  ],
  levels: [
    { id: "l-effective", name: "Effective", points: null },
    { id: "l-adequate", name: "Adequate", points: null },
    { id: "l-emerging", name: "Emerging", points: null },
  ],
  descriptions: nest({
    "c-content|l-effective": "Demonstrates deep mastery of content and a clear message.",
    "c-content|l-adequate": "Covers required content with minor gaps.",
    "c-content|l-emerging": "Significant content gaps or unclear message.",
    "c-delivery|l-effective": "Polished delivery with confident body language.",
    "c-delivery|l-adequate": "Generally confident delivery.",
    "c-delivery|l-emerging": "Hesitant or distracting delivery.",
    "c-audience|l-effective": "Engages audience and answers questions with depth.",
    "c-audience|l-adequate": "Engages audience with adequate responses.",
    "c-audience|l-emerging": "Struggles to engage or answer clearly.",
  }),
  gradingMethod: "grade_profile",
  profileRules: [
    {
      id: "pr-effective",
      gradeLabel: "Effective",
      paths: [
        {
          tiers: [{ count: 3, levelId: "l-effective" }],
          floorLevelId: "l-effective",
        },
        {
          tiers: [
            { count: 2, levelId: "l-effective" },
            { count: 1, levelId: "l-adequate" },
          ],
          floorLevelId: "l-adequate",
        },
      ],
    },
    {
      id: "pr-adequate",
      gradeLabel: "Adequate",
      paths: [
        {
          tiers: [{ count: 2, levelId: "l-adequate" }],
          floorLevelId: "l-adequate",
        },
      ],
    },
  ],
  profileFallback: false,
  minPassLevelId: null,
  suggestedScaleId: performanceScaleId,
};

const capstoneMatrix: RubricMatrix = weighted(
  [
    { id: "c-proposal", name: "Proposal Clarity & Scope Realism", weight: 1 },
    { id: "c-architecture", name: "System Architecture & Design Decisions", weight: 2 },
    { id: "c-implementation", name: "Implementation Quality & Code Health", weight: 2 },
    { id: "c-testing", name: "Testing Strategy & Coverage", weight: 1 },
    { id: "c-documentation", name: "Documentation & Handoff Readiness", weight: 1 },
    { id: "c-presentation", name: "Final Demo & Reflective Defense", weight: 1 },
  ],
  [
    { id: "l-exemplary", name: "Exemplary", type: "single", value: 5 },
    { id: "l-strong", name: "Strong", type: "range", min: 4, max: 4.5 },
    { id: "l-competent", name: "Competent", type: "range", min: 3, max: 3.9 },
    { id: "l-developing", name: "Developing", type: "range", min: 2, max: 2.9 },
    { id: "l-emerging", name: "Emerging", type: "range", min: 0.5, max: 1.9 },
  ],
  nest({
    "c-proposal|l-exemplary": "Scope is realistic, novel, and well-motivated.",
    "c-proposal|l-strong": "Scope is realistic and well-motivated.",
    "c-proposal|l-competent": "Scope is realistic but ambitious.",
    "c-proposal|l-developing": "Scope is too broad or unclear.",
    "c-proposal|l-emerging": "Scope is missing or unworkable.",
    "c-architecture|l-exemplary": "Architecture is modular and explicitly justified.",
    "c-architecture|l-strong": "Architecture is justified with minor gaps.",
    "c-architecture|l-competent": "Architecture is present and reasonable.",
    "c-architecture|l-developing": "Architecture is inconsistent.",
    "c-architecture|l-emerging": "Architecture is missing.",
    "c-implementation|l-exemplary": "Code is clean, tested, and idiomatic.",
    "c-implementation|l-strong": "Code is clean with minor smells.",
    "c-implementation|l-competent": "Code functions but has notable smells.",
    "c-implementation|l-developing": "Code has structural problems.",
    "c-implementation|l-emerging": "Code is incomplete or non-functional.",
    "c-testing|l-exemplary": "Comprehensive unit + integration tests with high coverage.",
    "c-testing|l-strong": "Strong test coverage of critical paths.",
    "c-testing|l-competent": "Adequate test coverage.",
    "c-testing|l-developing": "Sparse test coverage.",
    "c-testing|l-emerging": "No meaningful tests.",
    "c-documentation|l-exemplary": "Reader can run and extend without assistance.",
    "c-documentation|l-strong": "Setup and usage clearly documented.",
    "c-documentation|l-competent": "Documentation is sufficient.",
    "c-documentation|l-developing": "Documentation is sparse.",
    "c-documentation|l-emerging": "Documentation is missing.",
    "c-presentation|l-exemplary": "Demo is polished and defense is reflective.",
    "c-presentation|l-strong": "Demo is clear with solid defense.",
    "c-presentation|l-competent": "Demo conveys the main idea.",
    "c-presentation|l-developing": "Demo is uneven.",
    "c-presentation|l-emerging": "Demo fails or defense is absent.",
  }),
  { suggestedScaleId: letterScaleId },
);

const peerReviewMatrix: RubricMatrix = {
  criteria: [
    { id: "c-thoughtful", name: "Thoughtful Engagement with Peer Work", weight: null },
    { id: "c-constructive", name: "Constructive & Specific Feedback", weight: null },
    { id: "c-timeliness", name: "Timely Submission of Review", weight: null },
  ],
  levels: [
    { id: "l-complete", name: "Complete", points: null },
    { id: "l-partial", name: "Partial", points: null },
  ],
  descriptions: nest({
    "c-thoughtful|l-complete": "Engages deeply with peer's ideas.",
    "c-thoughtful|l-partial": "Surface-level engagement.",
    "c-constructive|l-complete": "Feedback is specific and actionable.",
    "c-constructive|l-partial": "Feedback is generic.",
    "c-timeliness|l-complete": "Submitted on time.",
    "c-timeliness|l-partial": "Submitted late.",
  }),
  gradingMethod: "grade_profile",
  profileRules: [
    {
      id: "pr-complete",
      gradeLabel: "Complete",
      paths: [
        {
          tiers: [{ count: 3, levelId: "l-complete" }],
          floorLevelId: "l-complete",
        },
      ],
    },
  ],
  profileFallback: false,
  minPassLevelId: null,
  suggestedScaleId: performanceScaleId,
};

const dataAnalysisMatrix: RubricMatrix = weighted(
  [
    { id: "c-problem", name: "Problem Framing & Question Definition", weight: 1 },
    { id: "c-cleaning", name: "Data Cleaning & Preparation Quality", weight: 1 },
    { id: "c-method", name: "Methodological Rigor & Model Selection", weight: 1 },
    { id: "c-narrative", name: "Findings, Narrative & Recommendation Clarity", weight: 1 },
  ],
  [
    { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
    { id: "l-proficient", name: "Proficient", type: "range", min: 3, max: 3.9 },
    { id: "l-developing", name: "Developing", type: "range", min: 2, max: 2.9 },
    { id: "l-emerging", name: "Emerging", type: "range", min: 1, max: 1.9 },
  ],
  {},
  { suggestedScaleId: letterScaleId },
);

const graduateAdmissionsMatrix: RubricMatrix = weighted(
  [
    {
      id: "c-narrative",
      name: "Narrative Arc & Story Craft",
      weight: 2,
      description:
        "Coherent personal narrative with a clear throughline. Each paragraph advances the story rather than restating the resume.",
    },
    {
      id: "c-specificity",
      name: "Specificity & Reflective Depth",
      weight: 2,
      description:
        "Concrete anecdotes and reflections. Avoids generic statements and shows what the applicant actually did, felt, or learned.",
    },
    {
      id: "c-fit",
      name: "Program-Fit Articulation",
      weight: 2,
      description:
        "Demonstrates informed, specific reasons for choosing this program — faculty, courses, labs — and links them to the applicant's goals.",
    },
    {
      id: "c-mechanics",
      name: "Writing Mechanics & Polish",
      weight: 1,
      description:
        "Grammar, syntax, and pacing are clean. Sentences vary in length. The document reads as edited.",
    },
    {
      id: "c-research",
      name: "Research Questions & Trajectory",
      weight: 1,
      description:
        "Articulates a clear research interest or longer arc the applicant wants to pursue, with appropriate grounding.",
    },
  ],
  [
    { id: "l-compelling", name: "Compelling", type: "single", value: 4 },
    { id: "l-strong", name: "Strong", type: "range", min: 3, max: 3.9 },
    { id: "l-developing", name: "Developing", type: "range", min: 2, max: 2.9 },
    { id: "l-emerging", name: "Needs significant work", type: "range", min: 1, max: 1.9 },
  ],
  nest({
    "c-narrative|l-compelling":
      "The narrative is original, specific, and memorable. Each section earns its place.",
    "c-narrative|l-strong":
      "The story holds together; a reader can summarise it after one pass.",
    "c-narrative|l-developing":
      "The narrative is uneven — some sections reveal, others summarise the resume.",
    "c-narrative|l-emerging":
      "Reads like a chronological list. Identity and motivation don't land.",
    "c-specificity|l-compelling":
      "Anecdotes are concrete and reflect deeply. The applicant shows, not tells.",
    "c-specificity|l-strong":
      "Several concrete moments; reflection is present even if uneven.",
    "c-specificity|l-developing":
      "Mostly abstract or generic; few vivid details.",
    "c-specificity|l-emerging":
      "Generic statements throughout. No specific story emerges.",
    "c-fit|l-compelling":
      "Names specific faculty, courses, and labs. Fit argument is unmistakable.",
    "c-fit|l-strong":
      "Names program resources, but the link to applicant goals could be deeper.",
    "c-fit|l-developing":
      "Generic fit language; little program-specific evidence.",
    "c-fit|l-emerging":
      "No demonstrated research into the program.",
    "c-mechanics|l-compelling":
      "Reads as edited. Sentence rhythm is varied and intentional.",
    "c-mechanics|l-strong":
      "Clean prose with a few unpolished spots.",
    "c-mechanics|l-developing":
      "Frequent grammar slips or repetitive sentence shapes.",
    "c-mechanics|l-emerging":
      "Mechanical errors impede comprehension.",
    "c-research|l-compelling":
      "Sharp research focus tied to long-term arc and grounded literature.",
    "c-research|l-strong":
      "Clear research interest with a plausible next step.",
    "c-research|l-developing":
      "Research interest is vague or shifts across paragraphs.",
    "c-research|l-emerging":
      "No clear research focus or trajectory stated.",
  }),
  { minPassLevelId: "l-developing", suggestedScaleId: letterScaleId },
);

// ── Combination-record matrices (rb_0054 – rb_0060) ─────────────────────
// Each one is hand-built so the matrix fully matches the grading method
// declared on the list entry, and so a downstream tool can exercise
// every (GradingMethod, MinPass, Fallback) combination from the
// EDUBEX grading-flows document.

const combo1Matrix: RubricMatrix = weighted(
  [
    { id: "c-thesis", name: "Thesis Clarity & Argument Quality", weight: 2 },
    { id: "c-evidence", name: "Evidence Integration & Source Engagement", weight: 2 },
    { id: "c-organization", name: "Structural Organization & Flow", weight: 1 },
  ],
  [
    { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
    { id: "l-proficient", name: "Proficient", type: "single", value: 3 },
    { id: "l-developing", name: "Developing", type: "single", value: 2 },
    { id: "l-emerging", name: "Emerging", type: "single", value: 1 },
  ],
  nest({
    "c-thesis|l-excellent": "Thesis is original, precise, and convincingly argued.",
    "c-thesis|l-proficient": "Thesis is clear and supported with relevant reasoning.",
    "c-thesis|l-developing": "Thesis is identifiable but inconsistently defended.",
    "c-thesis|l-emerging": "Thesis is vague, missing, or contradicted by the body.",
    "c-evidence|l-excellent": "Sources are synthesized to advance the argument.",
    "c-evidence|l-proficient": "Sources support claims with minor relevance gaps.",
    "c-evidence|l-developing": "Sources are listed rather than integrated.",
    "c-evidence|l-emerging": "Sources are missing, misattributed, or unrelated.",
    "c-organization|l-excellent": "Structure reinforces the argument.",
    "c-organization|l-proficient": "Structure is logical with minor lapses.",
    "c-organization|l-developing": "Structure is uneven; transitions feel mechanical.",
    "c-organization|l-emerging": "Structure is hard to follow.",
  }),
  { minPassLevelId: null, suggestedScaleId: letterScaleId },
);

const combo2Matrix: RubricMatrix = weighted(
  [
    { id: "c-hypothesis", name: "Hypothesis Articulation", weight: 1 },
    { id: "c-method", name: "Methodology & Procedure", weight: 2 },
    { id: "c-data", name: "Data Presentation & Analysis", weight: 2 },
    { id: "c-discussion", name: "Discussion & Error Analysis", weight: 2 },
  ],
  [
    { id: "l-excellent", name: "Excellent", type: "range", min: 76, max: 100 },
    { id: "l-proficient", name: "Proficient", type: "range", min: 51, max: 75 },
    { id: "l-developing", name: "Developing", type: "range", min: 26, max: 50 },
    { id: "l-emerging", name: "Emerging", type: "range", min: 0, max: 25 },
  ],
  nest({
    "c-hypothesis|l-excellent": "Hypothesis is specific, testable, and grounded.",
    "c-hypothesis|l-proficient": "Hypothesis is clear with minor specificity issues.",
    "c-hypothesis|l-developing": "Hypothesis is vague or partially testable.",
    "c-hypothesis|l-emerging": "Hypothesis is missing or untestable.",
    "c-method|l-excellent": "Procedure is reproducible and well-justified.",
    "c-method|l-proficient": "Procedure is mostly clear.",
    "c-method|l-developing": "Procedure has notable gaps.",
    "c-method|l-emerging": "Procedure is missing or unreproducible.",
    "c-data|l-excellent": "Data is well-organized and rigorously analyzed.",
    "c-data|l-proficient": "Data is presented clearly with minor analytical gaps.",
    "c-data|l-developing": "Data presentation is uneven.",
    "c-data|l-emerging": "Data is missing or incorrectly interpreted.",
    "c-discussion|l-excellent": "Discussion connects results to theory and quantifies error.",
    "c-discussion|l-proficient": "Discussion addresses sources of error.",
    "c-discussion|l-developing": "Discussion is shallow.",
    "c-discussion|l-emerging": "Discussion is missing.",
  }),
  { minPassLevelId: "l-developing", suggestedScaleId: letterScaleId },
);

const profileLevelIds = ["l-excellent", "l-proficient", "l-developing", "l-emerging"] as const;

function gradeProfileMatrix(
  profileRules: import("@/types/rubric").GradeProfileRule[],
  profileFallback: boolean,
  minPassLevelId: string | null,
  criteria: { id: string; name: string; weight: number }[],
  descriptions: Record<string, Record<string, string>>,
  suggestedScaleId: string | null,
): RubricMatrix {
  return {
    criteria: criteria.map((c) => ({ id: c.id, name: c.name, weight: c.weight })),
    levels: [
      { id: "l-excellent", name: "Excellent", points: { type: "single", value: 4, min: null, max: null } },
      { id: "l-proficient", name: "Proficient", points: { type: "single", value: 3, min: null, max: null } },
      { id: "l-developing", name: "Developing", points: { type: "single", value: 2, min: null, max: null } },
      { id: "l-emerging", name: "Emerging", points: { type: "single", value: 1, min: null, max: null } },
    ],
    descriptions,
    gradingMethod: "grade_profile",
    profileRules,
    profileFallback,
    minPassLevelId,
    suggestedScaleId,
  };
}

const baseCombo3Descriptions = nest({
  "c-rigor|l-excellent": "Analysis is rigorous, systematic, and advances the field's understanding.",
  "c-rigor|l-proficient": "Analysis is generally rigorous with minor methodological gaps.",
  "c-rigor|l-developing": "Analysis has notable methodological gaps but the core idea is present.",
  "c-rigor|l-emerging": "Analysis is shallow or methodologically unsound.",
  "c-evidence|l-excellent": "Evidence is comprehensive, relevant, and well-integrated.",
  "c-evidence|l-proficient": "Evidence is relevant and mostly well-integrated.",
  "c-evidence|l-developing": "Evidence is partial or unevenly integrated.",
  "c-evidence|l-emerging": "Evidence is missing or off-topic.",
  "c-clarity|l-excellent": "Communication is precise, well-structured, and persuasive.",
  "c-clarity|l-proficient": "Communication is clear with minor structural issues.",
  "c-clarity|l-developing": "Communication is understandable but uneven.",
  "c-clarity|l-emerging": "Communication is unclear or disorganized.",
});

const combo3Matrix: RubricMatrix = gradeProfileMatrix(
  [
    {
      id: "pr-a",
      gradeLabel: "A",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-excellent" },
            { count: 1, levelId: "l-proficient" },
          ],
          floorLevelId: "l-proficient",
        },
        {
          tiers: [{ count: 3, levelId: "l-excellent" }],
          floorLevelId: "l-excellent",
        },
      ],
    },
    {
      id: "pr-b",
      gradeLabel: "B",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-proficient" },
            { count: 1, levelId: "l-developing" },
          ],
          floorLevelId: "l-developing",
        },
      ],
    },
    {
      id: "pr-c",
      gradeLabel: "C",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-developing" },
            { count: 1, levelId: "l-emerging" },
          ],
          floorLevelId: "l-emerging",
        },
      ],
    },
  ],
  false,
  null,
  [
    { id: "c-rigor", name: "Analytical Rigor", weight: 2 },
    { id: "c-evidence", name: "Evidence Quality", weight: 2 },
    { id: "c-clarity", name: "Communication Clarity", weight: 1 },
  ],
  baseCombo3Descriptions,
  letterScaleId,
);

const combo4Matrix: RubricMatrix = gradeProfileMatrix(
  [
    {
      id: "pr-a",
      gradeLabel: "Excellent",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-excellent" },
            { count: 1, levelId: "l-proficient" },
          ],
          floorLevelId: "l-proficient",
        },
        {
          tiers: [{ count: 3, levelId: "l-excellent" }],
          floorLevelId: "l-excellent",
        },
      ],
    },
    {
      id: "pr-b",
      gradeLabel: "Good",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-proficient" },
            { count: 1, levelId: "l-developing" },
          ],
          floorLevelId: "l-developing",
        },
      ],
    },
  ],
  true,
  "l-developing",
  [
    { id: "c-rigor", name: "Analytical Rigor", weight: 2 },
    { id: "c-evidence", name: "Evidence Quality", weight: 2 },
    { id: "c-clarity", name: "Communication Clarity", weight: 1 },
  ],
  baseCombo3Descriptions,
  performanceScaleId,
);

const combo5Matrix: RubricMatrix = gradeProfileMatrix(
  [
    {
      id: "pr-a",
      gradeLabel: "A",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-excellent" },
            { count: 1, levelId: "l-proficient" },
          ],
          floorLevelId: "l-proficient",
        },
      ],
    },
    {
      id: "pr-b",
      gradeLabel: "B",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-proficient" },
            { count: 1, levelId: "l-developing" },
          ],
          floorLevelId: "l-developing",
        },
      ],
    },
  ],
  false,
  "l-proficient",
  [
    { id: "c-rigor", name: "Analytical Rigor", weight: 2 },
    { id: "c-evidence", name: "Evidence Quality", weight: 2 },
    { id: "c-clarity", name: "Communication Clarity", weight: 1 },
  ],
  baseCombo3Descriptions,
  letterScaleId,
);

const combo6Matrix: RubricMatrix = gradeProfileMatrix(
  [
    {
      id: "pr-a",
      gradeLabel: "A",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-excellent" },
            { count: 1, levelId: "l-proficient" },
          ],
          floorLevelId: "l-proficient",
        },
      ],
    },
    {
      id: "pr-b",
      gradeLabel: "B",
      paths: [
        {
          tiers: [
            { count: 2, levelId: "l-proficient" },
            { count: 1, levelId: "l-developing" },
          ],
          floorLevelId: "l-developing",
        },
      ],
    },
  ],
  true,
  "l-proficient",
  [
    { id: "c-rigor", name: "Analytical Rigor", weight: 2 },
    { id: "c-evidence", name: "Evidence Quality", weight: 2 },
    { id: "c-clarity", name: "Communication Clarity", weight: 1 },
  ],
  baseCombo3Descriptions,
  letterScaleId,
);

// Combo 8 — Unscored · No Grade Profile. The engine reports
// `requiresManualOverride: true` whenever this combination is loaded:
// there is no points-based grade and no rule-based grade, so the
// evaluator must enter the final grade themselves.
const combo8Matrix: RubricMatrix = {
  criteria: [
    { id: "c-participation", name: "Class Participation & Engagement", weight: null },
    { id: "c-preparation", name: "Reading Preparation & Reflection", weight: null },
    { id: "c-collaboration", name: "Peer Collaboration & Discussion Quality", weight: null },
    { id: "c-attendance", name: "Consistent Attendance & Punctuality", weight: null },
  ],
  levels: [
    { id: "l-strong", name: "Strong", points: null },
    { id: "l-adequate", name: "Adequate", points: null },
    { id: "l-needs-work", name: "Needs Work", points: null },
  ],
  descriptions: nest({
    "c-participation|l-strong": "Engages actively in every session; raises the quality of discussion.",
    "c-participation|l-adequate": "Participates reliably; contributions are usually on-topic.",
    "c-participation|l-needs-work": "Rarely participates; engagement is inconsistent.",
    "c-preparation|l-strong": "Reads carefully and brings specific references into discussion.",
    "c-preparation|l-adequate": "Completes readings; reflections are mostly substantive.",
    "c-preparation|l-needs-work": "Preparation is uneven or surface-level.",
    "c-collaboration|l-strong": "Builds on peers' ideas and invites quieter voices in.",
    "c-collaboration|l-adequate": "Collaborates well with regular partners.",
    "c-collaboration|l-needs-work": "Struggles to collaborate; tends to work in isolation.",
    "c-attendance|l-strong": "Attends every session and arrives prepared.",
    "c-attendance|l-adequate": "Attendance is consistent with rare absences.",
    "c-attendance|l-needs-work": "Attendance is inconsistent or late.",
  }),
  gradingMethod: "weighted_average",
  profileRules: [],
  profileFallback: false,
  minPassLevelId: null,
  suggestedScaleId: performanceScaleId,
};

const combo7Matrix: RubricMatrix = {
  criteria: [
    { id: "c-content", name: "Content Mastery & Message Clarity", weight: null },
    { id: "c-delivery", name: "Verbal & Non-Verbal Delivery", weight: null },
    { id: "c-audience", name: "Audience Engagement & Q&A Handling", weight: null },
  ],
  levels: [
    { id: "l-effective", name: "Effective", points: null },
    { id: "l-adequate", name: "Adequate", points: null },
    { id: "l-emerging", name: "Emerging", points: null },
  ],
  descriptions: nest({
    "c-content|l-effective": "Demonstrates deep mastery of content and a clear message.",
    "c-content|l-adequate": "Covers required content with minor gaps.",
    "c-content|l-emerging": "Significant content gaps or unclear message.",
    "c-delivery|l-effective": "Polished delivery with confident body language.",
    "c-delivery|l-adequate": "Generally confident delivery.",
    "c-delivery|l-emerging": "Hesitant or distracting delivery.",
    "c-audience|l-effective": "Engages audience and answers questions with depth.",
    "c-audience|l-adequate": "Engages audience with adequate responses.",
    "c-audience|l-emerging": "Struggles to engage or answer clearly.",
  }),
  gradingMethod: "grade_profile",
  profileRules: [
    {
      id: "pr-effective",
      gradeLabel: "Excellent",
      paths: [
        {
          tiers: [{ count: 3, levelId: "l-effective" }],
          floorLevelId: "l-effective",
        },
        {
          tiers: [
            { count: 2, levelId: "l-effective" },
            { count: 1, levelId: "l-adequate" },
          ],
          floorLevelId: "l-adequate",
        },
      ],
    },
    {
      id: "pr-adequate",
      gradeLabel: "Good",
      paths: [
        {
          tiers: [{ count: 2, levelId: "l-adequate" }],
          floorLevelId: "l-adequate",
        },
      ],
    },
  ],
  profileFallback: false,
  minPassLevelId: null,
  suggestedScaleId: performanceScaleId,
};

export const FAKE_RUBRIC_DETAILS: Record<string, RubricDetail> = {
  // ── Combination records (rb_0054 – rb_0060) ───────────────────────────
  rb_0054: {
    id: "rb_0054",
    name: "Combo 1 – Scored · Weighted Average · Min Pass Off",
    description:
      "Canonical example of a Scored rubric using Weighted Average grading with the Minimum Pass rule disabled. Final grade comes from the weighted percentage falling in a band of the linked grade scale.",
    outcome:
      "<p>Students demonstrate competency across thesis, evidence, and structure; the final letter is determined by weighted percentage mapped to the Letter Grade Scale.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:00:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo1Matrix,
  },
  rb_0055: {
    id: "rb_0055",
    name: "Combo 2 – Scored · Weighted Average · Min Pass On",
    description:
      "Scored rubric using Weighted Average grading with the Minimum Pass rule enabled. If any criterion falls below the guaranteed level the calculated band is discarded and the lowest Fail band is forced.",
    outcome:
      "<p>Students demonstrate competency across hypothesis, method, data, and discussion; every criterion must reach at least the Developing level for the calculated band to stand.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:05:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo2Matrix,
  },
  rb_0056: {
    id: "rb_0056",
    name: "Combo 3 – Scored · Grade Profile · Min Pass Off · Fallback Off",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule disabled and weighted-average fallback disabled. If no profile rule matches, Manual Override is required.",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the final letter is the first Grade Profile rule whose OR'd paths match.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:10:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo3Matrix,
  },
  rb_0057: {
    id: "rb_0057",
    name: "Combo 4 – Scored · Grade Profile · Min Pass Off · Fallback On",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule disabled but weighted-average fallback enabled. If no profile rule matches, the engine silently re-runs Weighted Average and uses that band.",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the engine first tries Grade Profile rules and falls back to a weighted band if none match.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:15:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo4Matrix,
  },
  rb_0058: {
    id: "rb_0058",
    name: "Combo 5 – Scored · Grade Profile · Min Pass On · Fallback Off",
    description:
      "Scored rubric using Grade Profile grading with the Minimum Pass rule enabled. A matched profile rule is discarded if any criterion falls below the guaranteed level; otherwise Manual Override is required when no rule matches.",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; every criterion must reach at least the guaranteed level or the matched grade is force-overridden to the lowest Fail band.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:20:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo5Matrix,
  },
  rb_0059: {
    id: "rb_0059",
    name: "Combo 6 – Scored · Grade Profile · Min Pass On · Fallback On",
    description:
      "Scored rubric using Grade Profile grading with both the Minimum Pass rule and weighted-average fallback enabled. Combines Profile rule matching, Min Pass override, and Weighted Average fallback in one flow.",
    outcome:
      "<p>Students demonstrate mastery across rigor, evidence, and clarity; the engine first tries Grade Profile rules, then enforces the Min Pass floor, and finally falls back to a weighted band.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-08-01T08:25:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo6Matrix,
  },
  rb_0060: {
    id: "rb_0060",
    name: "Combo 7 – Unscored · Grade Profile",
    description:
      "Unscored rubric using Grade Profile grading only. There are no points, no Minimum Pass rule, and no weighted-average fallback. Either a profile rule matches and supplies a grade, or Manual Override is required.",
    outcome:
      "<p>Students demonstrate content mastery, delivery, and audience engagement; the final Performance level is the first Grade Profile rule whose OR'd paths match.</p>",
    status: "published",
    type: "unscored",
    criteriaCount: 3,
    levelsCount: 3,
    usedBy: 0,
    updatedAt: "2026-08-01T08:30:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo7Matrix,
  },
  rb_0061: {
    id: "rb_0061",
    name: "Combo 8 – Unscored · No Grade Profile",
    description:
      "Unscored rubric with Weighted Average grading and no Grade Profile. The engine has no points to score and no rules to match, so the evaluator must enter the final grade manually (Manual Override).",
    outcome:
      "<p>Students are observed across participation, preparation, collaboration, and attendance; the final grade is set by the instructor since no points or profile rules are defined.</p>",
    status: "published",
    type: "unscored",
    criteriaCount: 4,
    levelsCount: 3,
    usedBy: 0,
    updatedAt: "2026-08-04T09:00:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: combo8Matrix,
  },
};
