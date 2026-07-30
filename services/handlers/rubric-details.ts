import type { RubricDetail, RubricMatrix } from "@/types/rubric";

const letterScaleId = "1";
const performanceScaleId = "2";

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
          tiers: [
            { count: 3, levelId: "l-effective" },
          ],
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
          tiers: [
            { count: 2, levelId: "l-adequate" },
          ],
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

export const FAKE_RUBRIC_DETAILS: Record<string, RubricDetail> = {
  rb_001: {
    id: "rb_001",
    name: "AI/ML Case Study Evaluation",
    description:
      "Holistic rubric for grading AI/ML case study submissions across problem framing, methodology, and conclusions.",
    outcome: "<p>Students will demonstrate the ability to critically evaluate applied AI/ML case studies.</p>",
    status: "in_use",
    type: "scored",
    criteriaCount: 5,
    levelsCount: 4,
    usedBy: 3,
    updatedAt: "2026-07-18T10:30:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: weighted(
      [
        { id: "c-problem", name: "Problem Framing & Business Context", weight: 1 },
        { id: "c-data", name: "Data Strategy & Feature Engineering Quality", weight: 2 },
        { id: "c-method", name: "Modeling Choices & Justification", weight: 2 },
      ],
      [
        { id: "l-excellent", name: "Excellent", type: "single", value: 10 },
        { id: "l-proficient", name: "Proficient", type: "range", min: 6, max: 9 },
        { id: "l-developing", name: "Developing", type: "range", min: 3, max: 5 },
        { id: "l-emerging", name: "Emerging", type: "range", min: 1, max: 2 },
      ],
      nest({
        // Problem Framing & Business Context
        "c-problem|l-excellent":
          "The problem is framed with exceptional clarity and strong business context. Objectives, stakeholders, constraints, and success criteria are specific, compelling, and well connected.",
        "c-problem|l-proficient":
          "The problem is clearly defined with appropriate business context. Objectives and success criteria are mostly clear, though some assumptions or constraints could be explained further.",
        "c-problem|l-developing":
          "The problem statement is understandable but lacks sufficient business context, clarity, or justification. Important objectives or constraints are only partially addressed.",
        "c-problem|l-emerging":
          "The problem is vague, incomplete, or disconnected from the business context. Objectives, stakeholders, or intended outcomes are largely unclear.",

        // Data Strategy & Feature Engineering Quality
        "c-data|l-excellent":
          "Data selection, preparation, and feature engineering are thoughtful, well justified, and technically sound. Data quality issues are addressed systematically, and engineered features clearly improve the solution.",
        "c-data|l-proficient":
          "Data preparation and feature engineering are appropriate and generally well justified. Most relevant data quality issues are handled, with only minor opportunities for improvement.",
        "c-data|l-developing":
          "Basic preprocessing is present, but feature engineering or data preparation lacks depth, justification, or consistency. Important data quality considerations may be overlooked.",
        "c-data|l-emerging":
          "Data preparation is incomplete or inappropriate. Feature engineering is minimal or ineffective, and significant data quality issues remain unaddressed.",

        // Modeling Choices & Justification
        "c-method|l-excellent":
          "Model selection is well reasoned, technically appropriate, and supported by clear justification. Alternatives are considered, assumptions are discussed, and implementation reflects strong understanding.",
        "c-method|l-proficient":
          "The chosen model is appropriate and reasonably justified. Some discussion of alternatives or assumptions is included, although the rationale could be more comprehensive.",
        "c-method|l-developing":
          "The model is usable but only partially justified. Limited explanation is provided for model selection, assumptions, or alternative approaches.",
        "c-method|l-emerging":
          "Model selection appears arbitrary or inappropriate, with little or no justification. Key assumptions and methodological decisions are missing.",
      }),
      { suggestedScaleId: letterScaleId },
    ),
  },
  rb_002: {
    id: "rb_002",
    name: "Programming Fundamentals – End-to-End Software Delivery with Documentation, Testing, and Deployment",
    description:
      "Auto-mapped scoring rubric for introductory programming assignments covering correctness, style, and efficiency.",
    outcome: "<p>Students will deliver small software artifacts with clear documentation and tests.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-07-15T14:12:00Z",
    createdBy: "Priya Iyer",
    matrix: weighted(
      [
        { id: "c-correctness", name: "Correctness & Functional Completeness", weight: 2 },
        { id: "c-style", name: "Code Style & Idiomatic Patterns", weight: 1 },
        { id: "c-tests", name: "Test Coverage & Quality", weight: 1 },
        { id: "c-docs", name: "Documentation & README Quality", weight: 1 },
      ],
      [
        { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
        { id: "l-proficient", name: "Proficient", type: "single", value: 3 },
        { id: "l-developing", name: "Developing", type: "single", value: 2 },
        { id: "l-emerging", name: "Emerging", type: "single", value: 1 },
      ],
      nest({
        // Correctness & Functional Completeness
        "c-correctness|l-excellent":
          "The solution is fully functional and meets all specified requirements. Edge cases are handled appropriately, and the implementation is reliable and free of significant defects.",
        "c-correctness|l-proficient":
          "The solution satisfies most functional requirements with only minor issues. Core functionality works as expected, though some edge cases or refinements could be improved.",
        "c-correctness|l-developing":
          "The solution implements basic functionality but contains noticeable gaps, bugs, or incomplete features that limit its reliability.",
        "c-correctness|l-emerging":
          "The solution is incomplete or largely non-functional. Major requirements are missing, and significant defects prevent correct operation.",

        // Code Style & Idiomatic Patterns
        "c-style|l-excellent":
          "The code is clean, well organized, and consistently follows language conventions and idiomatic patterns. Naming, structure, and formatting make the implementation easy to understand and maintain.",
        "c-style|l-proficient":
          "The code is generally readable and follows appropriate conventions. Minor inconsistencies in style or organization do not significantly affect maintainability.",
        "c-style|l-developing":
          "The code is understandable but contains inconsistent formatting, weak naming, or non-idiomatic patterns that reduce readability and maintainability.",
        "c-style|l-emerging":
          "The code is difficult to read or maintain due to poor organization, inconsistent style, or disregard for language conventions.",

        // Test Coverage & Quality
        "c-tests|l-excellent":
          "Comprehensive tests verify core functionality, edge cases, and failure scenarios. Tests are well structured, maintainable, and provide strong confidence in correctness.",
        "c-tests|l-proficient":
          "Tests cover the main functionality and are generally well written. Some important edge cases or scenarios could be added to improve confidence.",
        "c-tests|l-developing":
          "Basic tests are present but cover only limited functionality. Important scenarios or edge cases are missing, reducing confidence in the implementation.",
        "c-tests|l-emerging":
          "Few or no meaningful tests are provided, or the tests do not adequately verify the solution's correctness.",

        // Documentation & README Quality
        "c-docs|l-excellent":
          "Documentation is clear, complete, and easy to follow. The README includes setup, usage, assumptions, and relevant implementation details that enable others to use and maintain the project.",
        "c-docs|l-proficient":
          "Documentation covers the essential information, including setup and usage. Minor details or explanations could be expanded for greater clarity.",
        "c-docs|l-developing":
          "Documentation is present but incomplete or difficult to follow. Important setup, usage, or implementation details are missing.",
        "c-docs|l-emerging":
          "Documentation is minimal, unclear, or absent, making it difficult to understand, run, or maintain the project.",
      }),
      { suggestedScaleId: letterScaleId },
    ),
  },
  rb_003: {
    id: "rb_003",
    name: "Capstone Project Review",
    description:
      "Comprehensive capstone review across proposal, implementation, presentation, and reflection sections.",
    outcome: "<p>Capstone demonstrates readiness for industry or research entry.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 6,
    levelsCount: 5,
    usedBy: 2,
    updatedAt: "2026-07-10T09:05:00Z",
    createdBy: "Vikram Patel",
    matrix: capstoneMatrix,
  },
  rb_004: {
    id: "rb_004",
    name: "Peer Review Checklist",
    description: "Lightweight unscored checklist used for peer feedback on weekly reading reflections.",
    outcome: "<p>Students will provide structured, constructive peer feedback.</p>",
    status: "draft",
    type: "unscored",
    criteriaCount: 3,
    levelsCount: 2,
    usedBy: 0,
    updatedAt: "2026-07-21T08:45:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: peerReviewMatrix,
  },
  rb_005: {
    id: "rb_005",
    name: "Data Analysis Assignment",
    description:
      "Profile-based rubric mapping raw scores to letter grades for data analysis homework.",
    outcome: "<p>Students analyze a real dataset and present findings.</p>",
    status: "in_use",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 5,
    updatedAt: "2026-07-05T16:20:00Z",
    createdBy: "Karan Singh",
    matrix: dataAnalysisMatrix,
  },
  rb_006: {
    id: "rb_006",
    name: "Essay Writing – Argument Quality",
    description: "Rubric focused on argument structure, evidence, and writing clarity for short essays.",
    outcome: "<p>Students write structured short essays with evidence-based arguments.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 4,
    usedBy: 1,
    updatedAt: "2026-06-28T11:11:00Z",
    createdBy: "Priya Iyer",
    matrix: weighted(
      [
        { id: "c-thesis", name: "Thesis & Argument Structure", weight: 2 },
        { id: "c-evidence", name: "Use of Evidence", weight: 1 },
        { id: "c-style", name: "Style & Mechanics", weight: 1 },
      ],
      [
        { id: "l-excellent", name: "Excellent", type: "single", value: 4 },
        { id: "l-proficient", name: "Proficient", type: "range", min: 3, max: 3.9 },
        { id: "l-developing", name: "Developing", type: "range", min: 2, max: 2.9 },
        { id: "l-emerging", name: "Emerging", type: "range", min: 1, max: 1.9 },
      ],
      nest({
        // Thesis & Argument Structure
        "c-thesis|l-excellent":
          "Scope is realistic, novel, and well-motivated. The thesis is original and argued with precision.",
        "c-thesis|l-proficient":
          "Thesis is clear and defensible, with one consistent line of reasoning running through the essay.",
        "c-thesis|l-developing":
          "Thesis is present but vague or partially defended; the argument drifts in places.",
        "c-thesis|l-emerging":
          "Thesis is missing or off-topic; the essay reads as a collection of points rather than a coherent argument.",
        // Use of Evidence
        "c-evidence|l-excellent":
          "Sources are selected, cited, and synthesised to actively advance the argument.",
        "c-evidence|l-proficient":
          "Sources are credible and consistently cited, with mostly relevant integration.",
        "c-evidence|l-developing":
          "Sources are listed but not integrated; citation is uneven across the essay.",
        "c-evidence|l-emerging":
          "Sources are missing, off-topic, or improperly cited.",
        // Style & Mechanics
        "c-style|l-excellent":
          "Prose is precise, varied, and largely free of grammar errors; citation style is consistent.",
        "c-style|l-proficient":
          "Prose is clear with minor grammar slips; citation style is consistent.",
        "c-style|l-developing":
          "Prose is understandable but repetitive, with occasional grammar errors that distract from the argument.",
        "c-style|l-emerging":
          "Prose has frequent grammar errors or unclear sentences that interfere with the argument.",
      }),
      { suggestedScaleId: letterScaleId },
    ),
  },
  rb_007: {
    id: "rb_007",
    name: "Lab Report (Deprecated)",
    description: "Earlier version of the lab report rubric. Retired after the new format was introduced.",
    outcome: "",
    status: "archived",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 3,
    usedBy: 0,
    updatedAt: "2026-05-12T13:40:00Z",
    createdBy: "Vikram Patel",
    matrix: labReportMatrix,
  },
  rb_008: {
    id: "rb_008",
    name: "Research Proposal – Methodology & Feasibility",
    description: "Evaluates clarity of research question, methodological rigor, and feasibility of proposed approach.",
    outcome: "<p>Students craft methodologically rigorous research proposals.</p>",
    status: "in_use",
    type: "scored",
    criteriaCount: 5,
    levelsCount: 5,
    usedBy: 4,
    updatedAt: "2026-07-12T09:00:00Z",
    createdBy: "Meera Nair",
    matrix: capstoneMatrix,
  },
  rb_009: {
    id: "rb_009",
    name: "Oral Presentation Skills",
    description: "Assesses clarity, pacing, slide design, and audience engagement for student presentations.",
    outcome: "<p>Students deliver effective oral presentations.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 6,
    updatedAt: "2026-06-30T15:45:00Z",
    createdBy: "Karan Singh",
    matrix: oralPresentationMatrix,
  },
  rb_010: {
    id: "rb_010",
    name: "Database Design – Schema & Normalization",
    description: "Scores entity-relationship modeling, normalization forms, and integrity constraints.",
    outcome: "<p>Students design normalized relational schemas with appropriate constraints.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 5,
    levelsCount: 4,
    usedBy: 2,
    updatedAt: "2026-07-02T11:20:00Z",
    createdBy: "Vikram Patel",
    matrix: dataAnalysisMatrix,
  },
  rb_011: {
    id: "rb_011",
    name: "Group Project – Collaboration",
    description: "Lightweight checklist for evaluating peer contribution and teamwork in group assignments.",
    outcome: "<p>Students reflect on their collaborative contribution.</p>",
    status: "draft",
    type: "unscored",
    criteriaCount: 4,
    levelsCount: 2,
    usedBy: 0,
    updatedAt: "2026-07-19T13:10:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: peerReviewMatrix,
  },
  rb_012: {
    id: "rb_012",
    name: "Web Development – Frontend Project",
    description: "Holistic rubric for HTML/CSS/JS projects covering responsiveness, accessibility, and code quality.",
    outcome: "<p>Students ship accessible, responsive web interfaces.</p>",
    status: "in_use",
    type: "scored",
    criteriaCount: 6,
    levelsCount: 4,
    usedBy: 4,
    updatedAt: "2026-07-08T10:15:00Z",
    createdBy: "Priya Iyer",
    matrix: capstoneMatrix,
  },
  rb_013: {
    id: "rb_013",
    name: "Mathematics Problem Set – Calculus I",
    description: "Auto-graded rubric mapping raw points to letter bands for first-semester calculus homework.",
    outcome: "<p>Students solve calculus problems with correct reasoning.</p>",
    status: "published",
    type: "scored",
    criteriaCount: 3,
    levelsCount: 5,
    usedBy: 8,
    updatedAt: "2026-06-22T08:30:00Z",
    createdBy: "Ananya Reddy",
    matrix: dataAnalysisMatrix,
  },
  rb_044: {
    id: "rb_044",
    name: "Comprehensive Final Project – End-to-End Software Delivery with Documentation, Testing, and Deployment",
    description: "End-of-term rubric covering requirements, implementation, tests, docs, CI/CD, and demo quality.",
    outcome: "<p>Students demonstrate end-to-end software delivery competence.</p>",
    status: "in_use",
    type: "scored",
    criteriaCount: 8,
    levelsCount: 5,
    usedBy: 6,
    updatedAt: "2026-07-17T08:20:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: capstoneMatrix,
  },
  rb_047: {
    id: "rb_047",
    name: "Critical Reading Response – Weekly Reflection on Assigned Scholarly Articles",
    description: "Holistic rubric for weekly reflections on assigned readings, weighting thesis clarity and source engagement.",
    outcome: "<p>Students articulate evidence-based reflections on scholarly readings.</p>",
    status: "draft",
    type: "scored",
    criteriaCount: 4,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-07-20T14:45:00Z",
    createdBy: "Thanveer Ahmed",
    matrix: essayWritingMatrix,
  },
  rb_050: {
    id: "rb_050",
    name: "Graduate Admissions Statement of Purpose Draft Review",
    description:
      "Evaluates narrative arc, specificity of reflection, program fit, writing mechanics, and the applicant's research trajectory in a draft statement of purpose.",
    outcome:
      "<p>Students articulate evidence-based reflections on scholarly readings and a coherent research trajectory.</p>",
    status: "draft",
    type: "scored",
    criteriaCount: 5,
    levelsCount: 4,
    usedBy: 0,
    updatedAt: "2026-07-21T07:30:00Z",
    createdBy: "Sara Khan",
    matrix: graduateAdmissionsMatrix,
  },
};
