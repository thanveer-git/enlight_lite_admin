import type { GradeScale } from "@/features/rubrics/constants";
import { evaluateRubric } from "@/features/rubrics/evaluation";
import type { CriterionRating, EvaluateRubricInput } from "@/features/rubrics/evaluation";
import type {
  GradeProfileRule,
  MatrixCriterion,
  MatrixLevel,
  RubricMatrix,
} from "@/types/rubric";

const scale: GradeScale = {
  id: "1",
  apiId: 1,
  name: "Letter Grade Scale",
  bands: ["A", "B", "C", "D", "E", "F"],
  ranges: [
    { grade: "A", minMarks: 91, maxMarks: 100 },
    { grade: "B", minMarks: 81, maxMarks: 90 },
    { grade: "C", minMarks: 71, maxMarks: 80 },
    { grade: "D", minMarks: 61, maxMarks: 70 },
    { grade: "E", minMarks: 50, maxMarks: 60 },
    { grade: "F", minMarks: 0, maxMarks: 49 },
  ],
};

function makeCriteria(): MatrixCriterion[] {
  return [
    { id: "c1", name: "Thesis", weight: 30 },
    { id: "c2", name: "Evidence", weight: 30 },
    { id: "c3", name: "Structure", weight: 20 },
    { id: "c4", name: "Style", weight: 20 },
  ];
}

function essayLevels(): MatrixLevel[] {
  return [
    { id: "l1", name: "Excellent", points: { type: "range", value: null, min: 4, max: 4 } },
    { id: "l2", name: "Proficient", points: { type: "range", value: null, min: 3, max: 3.9 } },
    { id: "l3", name: "Developing", points: { type: "range", value: null, min: 2, max: 2.9 } },
    { id: "l4", name: "Beginning", points: { type: "range", value: null, min: 0, max: 1.9 } },
  ];
}

function labReportLevels(): MatrixLevel[] {
  return [
    { id: "l1", name: "Excellent", points: { type: "single", value: 4, min: null, max: null } },
    { id: "l2", name: "Proficient", points: { type: "range", value: null, min: 3, max: 3.9 } },
    { id: "l3", name: "Developing", points: { type: "single", value: 2, min: null, max: null } },
    { id: "l4", name: "Beginning", points: { type: "single", value: 1, min: null, max: null } },
  ];
}

function oralLevels(): MatrixLevel[] {
  return [
    { id: "l1", name: "Excellent", points: null },
    { id: "l2", name: "Proficient", points: null },
    { id: "l3", name: "Developing", points: null },
    { id: "l4", name: "Beginning", points: null },
  ];
}

let pass = 0;
let fail = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name}`);
    if (detail !== undefined) console.log("        detail:", detail);
  }
}

function runCase(name: string, input: EvaluateRubricInput, assertions: (r: ReturnType<typeof evaluateRubric>) => void) {
  console.log(`\n[${name}]`);
  const result = evaluateRubric(input);
  assertions(result);
  return result;
}

function essayMatrix(levels: MatrixLevel[], minPassLevelId: string | null = null): RubricMatrix {
  return {
    criteria: makeCriteria(),
    levels,
    descriptions: {},
    gradingMethod: "weighted_average",
    profileRules: [],
    profileFallback: false,
    minPassLevelId,
    suggestedScaleId: "1",
  };
}

function oralMatrix(rules: GradeProfileRule[]): RubricMatrix {
  return {
    criteria: [
      { id: "c1", name: "Content", weight: null },
      { id: "c2", name: "Delivery", weight: null },
      { id: "c3", name: "Engagement", weight: null },
    ],
    levels: oralLevels(),
    descriptions: {},
    gradingMethod: "grade_profile",
    profileRules: rules,
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: "1",
  };
}

function allRated(cIds: string[], levelId: string): Record<string, CriterionRating> {
  return Object.fromEntries(cIds.map((id) => [id, { levelId }]));
}

console.log("=== Rubric Evaluation Engine Verification ===");

// CASE A: Essay Writing — all at range max (4) → ~100%, band "A"
{
  const matrix = essayMatrix(essayLevels());
  const ratings = allRated(["c1", "c2", "c3", "c4"], "l1");
  runCase("A: Essay Writing all-excellent", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("percentage ≈ 100", r.percentage !== null && Math.abs(r.percentage - 100) < 0.01, r.percentage);
    check("scaleBand A", r.scaleBand?.grade === "A", r.scaleBand);
    check("finalGrade A", r.finalGrade === "A", r.finalGrade);
    check("passFail pass", r.passFail === "pass");
  });
}

// CASE B: all at lowest level (Beginning, l4) with explicit min points — gives lowest score
{
  const matrix = essayMatrix(essayLevels());
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l4", points: 0 },
    c2: { levelId: "l4", points: 0 },
    c3: { levelId: "l4", points: 0 },
    c4: { levelId: "l4", points: 0 },
  };
  runCase("B: Essay Writing all-lowest", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("percentage ≈ 0", r.percentage !== null && r.percentage < 5, r.percentage);
    check("scaleBand F", r.scaleBand?.grade === "F", r.scaleBand);
    check("finalGrade F", r.finalGrade === "F", r.finalGrade);
    check("passFail fail", r.passFail === "fail");
  });
}

// CASE C: one criterion unrated → incomplete
{
  const matrix = essayMatrix(essayLevels());
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l1" },
  };
  runCase("C: one criterion unrated", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("status incomplete", r.status === "incomplete");
    check("percentage null", r.percentage === null);
    check("finalGrade null", r.finalGrade === null);
  });
}

// CASE D: Lab Report — min-pass enabled at "Developing" (l3), one criterion below
{
  const matrix = essayMatrix(labReportLevels(), "l3");
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l3" },
    c2: { levelId: "l3" },
    c3: { levelId: "l3" },
    c4: { levelId: "l4" },
  };
  runCase("D: min-pass failure", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("minPassStatus failed", r.minPassStatus === "failed");
    check("minPassOverride populated", r.minPassOverride !== null, r.minPassOverride);
    check("override band F", r.minPassOverride?.band.grade === "F");
    check("finalGrade F (override)", r.finalGrade === "F", r.finalGrade);
    check("passFail fail", r.passFail === "fail");
  });
}

// CASE E: Oral Presentation — unscored, 3 rules, rate to match rule 2
{
  const rules: GradeProfileRule[] = [
    {
      id: "r1",
      gradeLabel: "Excellent",
      paths: [{ tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null }],
    },
    {
      id: "r2",
      gradeLabel: "Proficient",
      paths: [{ tiers: [{ count: 2, levelId: "l2" }], floorLevelId: null }],
    },
    {
      id: "r3",
      gradeLabel: "Developing",
      paths: [{ tiers: [{ count: 2, levelId: "l3" }], floorLevelId: null }],
    },
  ];
  const matrix = oralMatrix(rules);
  // 2 criteria at Proficient (l2), 1 at Developing (l3) — matches rule 2 only
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l2" },
    c2: { levelId: "l2" },
    c3: { levelId: "l3" },
  };
  runCase("E: unscored, matches rule 2", { rubric: matrix, rubricType: "unscored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("matchedRule r2", r.matchedRule?.ruleId === "r2", r.matchedRule);
    check("finalGrade Proficient", r.finalGrade === "Proficient", r.finalGrade);
    check("percentage null (unscored)", r.percentage === null);
  });
}

// CASE F: Oral Presentation — rate to match nothing
{
  const rules: GradeProfileRule[] = [
    {
      id: "r1",
      gradeLabel: "Excellent",
      paths: [{ tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null }],
    },
    {
      id: "r2",
      gradeLabel: "Proficient",
      paths: [{ tiers: [{ count: 3, levelId: "l2" }], floorLevelId: null }],
    },
  ];
  const matrix = oralMatrix(rules);
  // 2 at Excellent + 1 at Beginning → doesn't match any rule
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l4" },
  };
  runCase("F: unscored, no match → manual override", { rubric: matrix, rubricType: "unscored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("matchedRule null", r.matchedRule === null);
    check("requiresManualOverride true", r.requiresManualOverride === true);
    check("finalGrade null", r.finalGrade === null);
  });
}

// CASE G: AND-within-rule — every condition must hold.
// Rule "Excellent" needs ≥3 at Excellent AND ≥2 at-or-above Proficient.
// Ratings: 1 at Excellent + 1 at Developing + 1 at Beginning.
// Path 1 (≥3 at Excellent) fails; rule fails.
// Rule "Proficient" needs ≥2 at-or-above Proficient — only 1, fails.
// Rule "Developing" needs ≥3 at-or-above Developing — only 2, fails.
// All rules fail → manual override.
{
  const rules: GradeProfileRule[] = [
    {
      id: "r1",
      gradeLabel: "Excellent",
      paths: [
        { tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null },
        { tiers: [{ count: 2, levelId: "l2" }], floorLevelId: null },
      ],
    },
    {
      id: "r2",
      gradeLabel: "Proficient",
      paths: [{ tiers: [{ count: 2, levelId: "l2" }], floorLevelId: null }],
    },
    {
      id: "r3",
      gradeLabel: "Developing",
      paths: [{ tiers: [{ count: 3, levelId: "l3" }], floorLevelId: null }],
    },
  ];
  const matrix = oralMatrix(rules);
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l3" },
    c3: { levelId: "l4" },
  };
  runCase("G: AND-within-rule fails → manual override", { rubric: matrix, rubricType: "unscored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("matchedRule null", r.matchedRule === null, r.matchedRule);
    check("requiresManualOverride true", r.requiresManualOverride === true);
    check("finalGrade null", r.finalGrade === null);
  });
}

// CASE H: AND-within-rule succeeds — both conditions of rule r1 satisfied.
{
  const rules: GradeProfileRule[] = [
    {
      id: "r1",
      gradeLabel: "Excellent",
      paths: [
        { tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null },
        { tiers: [{ count: 2, levelId: "l2" }], floorLevelId: null },
      ],
    },
    {
      id: "r2",
      gradeLabel: "Proficient",
      paths: [{ tiers: [{ count: 3, levelId: "l2" }], floorLevelId: null }],
    },
  ];
  const matrix = oralMatrix(rules);
  // 3 at Excellent (l1) → first condition passes; second condition (≥2 at-or-above l2)
  // also passes because l1 is at-or-above l2 in the index ordering. Rule matches.
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l1" },
  };
  runCase("H: AND-within-rule succeeds", { rubric: matrix, rubricType: "unscored", ratings, gradeScale: scale }, (r) => {
    check("status complete", r.status === "complete");
    check("matchedRule r1", r.matchedRule?.ruleId === "r1", r.matchedRule);
    check("finalGrade Excellent", r.finalGrade === "Excellent", r.finalGrade);
  });
}

// CASE I: First-match-wins — two rules could match, top one wins.
{
  const rules: GradeProfileRule[] = [
    {
      id: "r1",
      gradeLabel: "Excellent",
      paths: [{ tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null }],
    },
    {
      id: "r2",
      gradeLabel: "Proficient",
      paths: [{ tiers: [{ count: 2, levelId: "l2" }], floorLevelId: null }],
    },
  ];
  const matrix = oralMatrix(rules);
  // All 3 at Excellent (l1) → satisfies both rules, but r1 (top) wins.
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l1" },
  };
  runCase("I: first matching rule wins", { rubric: matrix, rubricType: "unscored", ratings, gradeScale: scale }, (r) => {
    check("matchedRule r1", r.matchedRule?.ruleId === "r1", r.matchedRule);
    check("finalGrade Excellent", r.finalGrade === "Excellent", r.finalGrade);
  });
}

// CASE J: Grade Profile requires a Grade Scale — without scale, ignore rules.
// Use a scored rubric so we have a weighted fallback.
{
  const matrix: RubricMatrix = {
    criteria: makeCriteria(),
    levels: essayLevels(),
    descriptions: {},
    gradingMethod: "grade_profile",
    profileRules: [
      {
        id: "r1",
        gradeLabel: "A",
        paths: [{ tiers: [{ count: 4, levelId: "l1" }], floorLevelId: null }],
      },
    ],
    profileFallback: false,
    minPassLevelId: null,
    suggestedScaleId: null,
  };
  const ratings = allRated(["c1", "c2", "c3", "c4"], "l1");
  // gradeScale is null → engine should ignore Grade Profile and compute weighted.
  runCase("J: Grade Profile without scale → weighted fallback", { rubric: matrix, rubricType: "scored", ratings, gradeScale: null }, (r) => {
    check("status complete", r.status === "complete");
    check("method downgraded to weighted_average", r.method === "weighted_average", r.method);
    check("matchedRule null", r.matchedRule === null, r.matchedRule);
    check("percentage ≈ 100", r.percentage !== null && Math.abs(r.percentage - 100) < 0.01, r.percentage);
    check("requiresManualOverride false", r.requiresManualOverride === false);
  });
}

// CASE K: No matching rule + fallback enabled + scored → maps via grade scale.
{
  const matrix: RubricMatrix = {
    criteria: makeCriteria(),
    levels: essayLevels(),
    descriptions: {},
    gradingMethod: "grade_profile",
    profileRules: [
      {
        id: "r1",
        gradeLabel: "A",
        paths: [{ tiers: [{ count: 4, levelId: "l1" }], floorLevelId: null }],
      },
    ],
    profileFallback: true,
    minPassLevelId: null,
    suggestedScaleId: "1",
  };
  // Only 1 criterion at Excellent; rule needs 4 at Excellent → no match.
  // Fallback kicks in: weighted ≈ 25% → band "F" (0–49).
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l4", points: 0 },
    c3: { levelId: "l4", points: 0 },
    c4: { levelId: "l4", points: 0 },
  };
  runCase("K: no rule + fallback enabled → scale mapping", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("matchedRule null", r.matchedRule === null, r.matchedRule);
    check("scaleBand F", r.scaleBand?.grade === "F", r.scaleBand);
    check("finalGrade F", r.finalGrade === "F", r.finalGrade);
  });
}

// CASE L: Min-pass failure overrides everything to lowest failing band.
{
  const matrix: RubricMatrix = {
    criteria: makeCriteria(),
    levels: essayLevels(),
    descriptions: {},
    gradingMethod: "grade_profile",
    profileRules: [
      {
        id: "r1",
        gradeLabel: "A",
        paths: [{ tiers: [{ count: 4, levelId: "l1" }], floorLevelId: null }],
      },
    ],
    profileFallback: false,
    minPassLevelId: "l2", // every criterion must reach Proficient (l2) or higher
    suggestedScaleId: "1",
  };
  // 3 at Excellent + 1 at Developing. Only 3 at Excellent, rule r1 needs 4 → no match.
  // Min-pass then sees c4 below l2 → fails → overrides to lowest failing band F.
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l1" },
    c4: { levelId: "l3" },
  };
  runCase("L: min-pass failure overrides to F", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("matchedRule null (rule didn't match)", r.matchedRule === null);
    check("minPassStatus failed", r.minPassStatus === "failed");
    check("minPassOverride band F", r.minPassOverride?.band.grade === "F");
    check("finalGrade F (override)", r.finalGrade === "F", r.finalGrade);
    check("passFail fail", r.passFail === "fail");
  });
}

// CASE M: Min-pass overrides even a matching rule to lowest failing band.
{
  const matrix: RubricMatrix = {
    criteria: makeCriteria(),
    levels: essayLevels(),
    descriptions: {},
    gradingMethod: "grade_profile",
    profileRules: [
      {
        id: "r1",
        gradeLabel: "A",
        paths: [{ tiers: [{ count: 3, levelId: "l1" }], floorLevelId: null }],
      },
    ],
    profileFallback: false,
    minPassLevelId: "l1", // every criterion must reach Excellent (l1)
    suggestedScaleId: "1",
  };
  // 4 at Excellent (l1) — rule r1 matches (≥3 Excellent). But min-pass requires all at l1.
  // Wait — c4 also at l1. Pass min-pass. So this should NOT override.
  // Use mixed ratings to make min-pass fail while rule matches.
  const ratings: Record<string, CriterionRating> = {
    c1: { levelId: "l1" },
    c2: { levelId: "l1" },
    c3: { levelId: "l1" },
    c4: { levelId: "l2" }, // below l1 → min-pass fails
  };
  runCase("M: min-pass overrides matching rule", { rubric: matrix, rubricType: "scored", ratings, gradeScale: scale }, (r) => {
    check("matchedRule r1 (rule matches first)", r.matchedRule?.ruleId === "r1", r.matchedRule);
    check("minPassStatus failed", r.minPassStatus === "failed");
    check("minPassOverride band F", r.minPassOverride?.band.grade === "F", r.minPassOverride);
    check("finalGrade F (override wins over rule)", r.finalGrade === "F", r.finalGrade);
    check("passFail fail", r.passFail === "fail");
  });
}

console.log(`\n=== Results: ${pass} passed, ${fail} failed ===`);
if (fail > 0) process.exit(1);