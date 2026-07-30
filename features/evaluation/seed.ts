/**
 * Seeded submissions used by Phase 1.
 *
 * Twelve submissions, one per `(rubric, gradeType)` combination so the
 * evaluation surface area is fully exercised:
 *   - Four fixed grade formats × {No Rubric, Rubric} = 8 rows
 *   - Two named grade scales (Letter, Performance) split across the
 *     same six combinations, and explicitly anchored on the two
 *     graded submissions (`sb_011`, `sb_012`).
 *
 * Learners are taken from `FAKE_USERS`; rubrics reuse the existing
 * matrices in `FAKE_RUBRIC_DETAILS` (rb_006, rb_002, rb_009).
 *
 * `viewingAttempt` is the 1-based index into `attempts[]`. Only
 * `sb_011` and `sb_012` are pre-graded; the other ten remain pending
 * so the reviewer exercises the rubric / direct-grade flows.
 */
import { FAKE_USERS } from "@/services/handlers/users";
import type { Submission } from "./types";

const u = (id: string) => {
  const found = FAKE_USERS.find((x) => x.id === id);
  if (!found) throw new Error(`Seed references missing user ${id}`);
  return found;
};

const baseAttempt = (opts: {
  attemptNumber: number;
  submittedAt: string;
  dueAt: string;
  wordCount: number;
  wordLimit: number | null;
  bodyHtml: string;
  files?: { name: string; size: number; mime: string }[];
  feedback?: {
    id: string;
    author: ReturnType<typeof u>;
    text: string;
    sentAt: string;
    attachments?: { name: string; size: number; mime: string }[];
    pinned?: boolean;
  }[];
}) => ({
  feedback: opts.feedback ?? [],
  files: opts.files ?? [],
  ...opts,
});

export const SEED_SUBMISSIONS: Submission[] = [
  // ── sb_001: Percentage + No Rubric ──────────────────────────────────────
  {
    id: "sb_001",
    assignmentCode: "PCT-201",
    assignmentId: "as_001",
    assignmentTitle: "Statistics Inference Worksheet",
    courseId: "course_stat_220",
    courseName: "Applied Statistics 220",
    assignmentBriefHtml:
      "<p>Solve the inference worksheet and upload your workings. Word limit does not apply.</p>",
    learner: u("u_003"),
    rubricId: null,
    gradeType: "Percentage",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-15T22:30:00Z",
        dueAt: "2026-07-15T23:59:00Z",
        wordCount: 260,
        wordLimit: null,
        bodyHtml:
          "<p>Worksheet on hypothesis testing only — confidence-interval section still needs work.</p>",
        files: [{ name: "inference-v2.pdf", size: 76_800, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_002: Percentage + Rubric ─────────────────────────────────────────
  {
    id: "sb_002",
    assignmentCode: "ASG-002",
    assignmentId: "as_002",
    assignmentTitle: "Argument-Driven Essay",
    courseId: "course_eng_201",
    courseName: "English Composition 201",
    assignmentBriefHtml:
      "<p>Write a 1,200-word argument-driven essay on a topic of your choice. Cite at least three sources.</p>",
    learner: u("u_004"),
    rubricId: "rb_006",
    gradeType: "Percentage",
    // Percentage + Rubric: the engine emits a percentage, which is
    // displayed directly without going through a named scale.
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-08T09:15:00Z",
        dueAt: "2026-07-12T23:59:00Z",
        wordCount: 1080,
        wordLimit: 1200,
        bodyHtml:
          "<p>Argument is clear; transitions could be smoother in the third section. Sources support the thesis with consistent but limited integration.</p>",
      }),
    ],
  },

  // ── sb_003: CGPA + No Rubric ────────────────────────────────────────────
  {
    id: "sb_003",
    assignmentCode: "MTH-301",
    assignmentId: "as_003",
    assignmentTitle: "Research Methodology Critique",
    courseId: "course_res_410",
    courseName: "Research Methods 410",
    assignmentBriefHtml:
      "<p>Critique the methodology section of the assigned paper in 800 words.</p>",
    learner: u("u_005"),
    rubricId: null,
    gradeType: "CGPA",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-10T14:20:00Z",
        dueAt: "2026-07-12T23:59:00Z",
        wordCount: 760,
        wordLimit: 800,
        bodyHtml:
          "<p>Critique focuses on sampling bias and missing control variables. Conclusion is that the study's claims are weakly supported.</p>",
        files: [{ name: "methodology-critique.pdf", size: 71_680, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_004: CGPA + Rubric ──────────────────────────────────────────────
  {
    id: "sb_004",
    assignmentCode: "ASG-005",
    assignmentId: "as_004",
    assignmentTitle: "Argument-Driven Essay (CGPA Section)",
    courseId: "course_eng_201",
    courseName: "English Composition 201",
    assignmentBriefHtml:
      "<p>Write a 1,500-word argument-driven essay. Section graded on a 0–10 CGPA scale.</p>",
    learner: u("u_006"),
    rubricId: "rb_006",
    gradeType: "CGPA",
    gradeScaleId: null, // CGPA is fixed; engine percentage drives the value.
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-11T18:00:00Z",
        dueAt: "2026-07-15T23:59:00Z",
        wordCount: 1410,
        wordLimit: 1500,
        bodyHtml:
          "<p>Argues for stronger source attribution requirements in lower-division essays. Sources are recent and well-integrated.</p>",
        files: [{ name: "essay-cgpa-section.pdf", size: 152_576, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_005: Marks + No Rubric ───────────────────────────────────────────
  {
    id: "sb_005",
    assignmentCode: "MTH-201",
    assignmentId: "as_005",
    assignmentTitle: "Mid-Term Written Examination",
    courseId: "course_calc_110",
    courseName: "Calculus I",
    assignmentBriefHtml:
      "<p>Closed-book written exam covering limits, derivatives, and basic integration.</p>",
    learner: u("u_007"),
    rubricId: null,
    gradeType: "Marks",
    gradeScaleId: null,
    totalMarks: 130,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-08T10:30:00Z",
        dueAt: "2026-07-08T11:00:00Z",
        wordCount: 540,
        wordLimit: 600,
        bodyHtml:
          "<p>Six-question written exam. All questions attempted; question 4 partially complete.</p>",
        files: [{ name: "midterm-answers.pdf", size: 88_064, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_006: Marks + Rubric ─────────────────────────────────────────────
  {
    id: "sb_006",
    assignmentCode: "LAB-201",
    assignmentId: "as_006",
    assignmentTitle: "Lab Report – Methodology",
    courseId: "course_chem_220",
    courseName: "General Chemistry II",
    assignmentBriefHtml:
      "<p>Write up the methodology, results, and error analysis for the calorimetry lab.</p>",
    learner: u("u_008"),
    rubricId: "rb_002",
    gradeType: "Marks",
    gradeScaleId: null, // Marks uses no named scale — totalMarks drives the conversion.
    totalMarks: 120,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-12T16:45:00Z",
        dueAt: "2026-07-14T23:59:00Z",
        wordCount: 1850,
        wordLimit: 2000,
        bodyHtml:
          "<p>Methods section is detailed and reproducible. Results table is clear; error analysis still needs the systematic-uncertainty discussion.</p>",
        files: [
          { name: "lab-report-methodology.pdf", size: 312_320, mime: "application/pdf" },
          { name: "lab-appendices.pdf", size: 96_768, mime: "application/pdf" },
        ],
      }),
    ],
  },

  // ── sb_007: Complete/Incomplete + No Rubric ────────────────────────────
  {
    id: "sb_007",
    assignmentCode: "ORI-100",
    assignmentId: "as_007",
    assignmentTitle: "Orientation Module Completion",
    courseId: "course_ori_001",
    courseName: "New Learner Orientation",
    assignmentBriefHtml:
      "<p>Complete the orientation checklist and submit the signed acknowledgement.</p>",
    learner: u("u_001"),
    rubricId: null,
    gradeType: "Comp/Incomp",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-01T09:00:00Z",
        dueAt: "2026-07-05T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml:
          "<p>Orientation checklist ticked and the acknowledgement form signed.</p>",
        files: [{ name: "orientation-checklist.pdf", size: 24_576, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_008: Complete/Incomplete + Rubric ──────────────────────────────
  {
    id: "sb_008",
    assignmentCode: "SAF-101",
    assignmentId: "as_008",
    assignmentTitle: "Workplace Safety Briefing",
    courseId: "course_safe_100",
    courseName: "Workplace Safety 101",
    assignmentBriefHtml:
      "<p>Deliver the safety briefing and pass the short oral assessment.</p>",
    learner: u("u_002"),
    rubricId: "rb_009",
    gradeType: "Comp/Incomp",
    gradeScaleId: null, // Comp/Incomp uses no named scale — threshold comes from configuration.
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-09T14:00:00Z",
        dueAt: "2026-07-09T17:00:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml:
          "<p>Slides uploaded; oral delivery recorded. Q&A covered the fire-evacuation sequence.</p>",
        files: [
          { name: "safety-briefing.pdf", size: 184_320, mime: "application/pdf" },
          { name: "safety-briefing-slides.pdf", size: 312_320, mime: "application/pdf" },
        ],
      }),
    ],
  },

  // ── sb_009: gs_letter + No Rubric ──────────────────────────────────────
  {
    id: "sb_009",
    assignmentCode: "SUS-110",
    assignmentId: "as_009",
    assignmentTitle: "Climate-Tech Reflection",
    courseId: "course_sus_310",
    courseName: "Sustainability Studies 310",
    assignmentBriefHtml:
      "<p>Short reflection (≤500 words) on the climate-tech reading from week 4.</p>",
    learner: u("u_003"),
    rubricId: null,
    // gs_letter assignment: gradeType carries the named scale's id directly.
    gradeType: "gs_letter",
    gradeScaleId: "gs_letter",
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-14T20:10:00Z",
        dueAt: "2026-07-15T23:59:00Z",
        wordCount: 470,
        wordLimit: 500,
        bodyHtml:
          "<p>Reflection connects the week's reading to current reporting on direct-air-capture deployment costs.</p>",
        files: [{ name: "climate-tech-reflection.pdf", size: 60_416, mime: "application/pdf" }],
      }),
    ],
  },

  // ── sb_010: gs_performance + Rubric ────────────────────────────────────
  {
    id: "sb_010",
    assignmentCode: "OPS-105",
    assignmentId: "as_010",
    assignmentTitle: "Oral Presentation – Climate Tech",
    courseId: "course_sus_310",
    courseName: "Sustainability Studies 310",
    assignmentBriefHtml:
      "<p>Deliver a 10-minute oral presentation on a climate-tech topic. Use no more than 8 slides.</p>",
    learner: u("u_004"),
    rubricId: "rb_009",
    gradeType: "gs_performance",
    gradeScaleId: "gs_performance",
    totalMarks: null,
    currentStatus: "pending",
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-17T13:45:00Z",
        dueAt: "2026-07-17T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml:
          "<p>Slide deck delivered crisply; Q&A covered the funding-risks section in depth.</p>",
        files: [
          { name: "climate-tech-overview.pptx", size: 2_457_600, mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
          { name: "climate-tech-overview.pdf", size: 763_000, mime: "application/pdf" },
          { name: "recording.mp4", size: 18_874_368, mime: "video/mp4" },
        ],
      }),
    ],
  },

  // ── sb_011 (graded): gs_letter + Rubric ────────────────────────────────
  {
    id: "sb_011",
    assignmentCode: "ASG-002",
    assignmentId: "as_002",
    assignmentTitle: "Argument-Driven Essay",
    courseId: "course_eng_201",
    courseName: "English Composition 201",
    assignmentBriefHtml:
      "<p>Write a 1,200-word argument-driven essay on a topic of your choice. Cite at least three sources.</p>",
    learner: u("u_005"),
    rubricId: "rb_006",
    gradeType: "Percentage",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "graded",
    finalGrade: "84%",
    finalPercentage: 84,
    viewingAttempt: 1,
    evaluatedAt: "2026-07-14T09:12:00Z",
    evaluatedBy: u("u_002"),
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-10T20:45:00Z",
        dueAt: "2026-07-12T23:59:00Z",
        wordCount: 1290,
        wordLimit: 1200,
        bodyHtml:
          "<p>Thesis is original and argued with precision. Sources are synthesized to actively advance the argument. Structure reinforces the line of reasoning. Prose is precise, varied, and largely free of grammar errors.</p>",
      }),
    ],
  },

  // ── sb_012 (graded): gs_performance + No Rubric ────────────────────────
  {
    id: "sb_012",
    assignmentCode: "OPS-105",
    assignmentId: "as_010",
    assignmentTitle: "Oral Presentation – Climate Tech",
    courseId: "course_sus_310",
    courseName: "Sustainability Studies 310",
    assignmentBriefHtml:
      "<p>Deliver a 10-minute oral presentation on a climate-tech topic. Use no more than 8 slides.</p>",
    learner: u("u_006"),
    rubricId: "rb_009",
    gradeType: "gs_performance",
    gradeScaleId: "gs_performance",
    totalMarks: null,
    currentStatus: "graded",
    finalGrade: "Very Good",
    finalPercentage: 85,
    viewingAttempt: 1,
    evaluatedAt: "2026-07-15T11:30:00Z",
    evaluatedBy: u("u_005"),
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-11T19:20:00Z",
        dueAt: "2026-07-17T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml:
          "<p>Slide deck delivered crisply; Q&A covered the funding-risks section in depth.</p>",
        files: [
          { name: "climate-tech-overview.pptx", size: 2_457_600, mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation" },
          { name: "climate-tech-overview.pdf", size: 763_000, mime: "application/pdf" },
          { name: "recording.mp4", size: 18_874_368, mime: "video/mp4" },
        ],
      }),
    ],
  },
];
