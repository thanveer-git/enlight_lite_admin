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
 * matrices in `FAKE_RUBRIC_DETAILS` (rb_0006, rb_0002, rb_0009).
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

const INSTRUCTOR = u("u_002");

const loremHtml = (topic: string) => `
  <p>This is my attempt at <strong>${topic}</strong>. I approached the task by first
  reviewing the brief and breaking it into three parts, then drafting each section in
  order. I revisited the introduction once the body was finished to make sure it set up
  the rest of the piece.</p>
  <p>Key challenges included balancing depth with brevity, and selecting evidence that
  supported the central argument without overwhelming the reader. I would tighten the
  transition between the second and third sections in a future revision.</p>
`;

export const SEED_SUBMISSIONS: Submission[] = [
  // ── S1: Percentage + No rubric (direct grade) ─────────────────────────
  {
    id: "sb_001",
    assignmentId: "asg_001",
    assignmentCode: "ASG-001",
    assignmentTitle: "Weekly Reflection — Module 1",
    courseId: "crs_001",
    courseName: "Intro to Educational Psychology",
    assignmentBriefHtml:
      "<p>Write a 400-word reflection on this week's reading on motivation theory.</p>",
    learner: u("u_003"),
    rubricId: null,
    gradeType: "Percentage",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-21T10:14:00Z",
        dueAt: "2026-07-22T23:59:00Z",
        wordCount: 412,
        wordLimit: 400,
        bodyHtml: loremHtml("weekly reflection on motivation theory"),
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S2: CGPA + No rubric (direct grade) ──────────────────────────────
  {
    id: "sb_002",
    assignmentId: "asg_002",
    assignmentCode: "ASG-002",
    assignmentTitle: "Lab Notebook — Week 3",
    courseId: "crs_002",
    courseName: "General Chemistry I",
    assignmentBriefHtml:
      "<p>Submit your lab notebook pages for the calorimetry experiment.</p>",
    learner: u("u_004"),
    rubricId: null,
    gradeType: "CGPA",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-23T16:42:00Z",
        dueAt: "2026-07-24T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        files: [
          { name: "lab_notebook_week3.pdf", size: 482310, mime: "application/pdf" },
        ],
        bodyHtml: "<p>See attached notebook pages.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S3: Marks + No rubric (direct grade, total=50) ──────────────────
  {
    id: "sb_003",
    assignmentId: "asg_003",
    assignmentCode: "ASG-003",
    assignmentTitle: "Problem Set 4 — Linear Systems",
    courseId: "crs_003",
    courseName: "Linear Algebra",
    assignmentBriefHtml:
      "<p>Solve the six linear-system problems. Show all work; partial credit awarded.</p>",
    learner: u("u_006"),
    rubricId: null,
    gradeType: "Marks",
    gradeScaleId: null,
    totalMarks: 50,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-25T22:05:00Z",
        dueAt: "2026-07-26T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        files: [
          { name: "pset4_solutions.pdf", size: 124_000, mime: "application/pdf" },
        ],
        bodyHtml: "<p>Solutions attached.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S4: Comp/Incomp + No rubric (direct status) ─────────────────────
  {
    id: "sb_004",
    assignmentId: "asg_004",
    assignmentCode: "ASG-004",
    assignmentTitle: "Attendance — Week 5",
    courseId: "crs_004",
    courseName: "Public Speaking",
    assignmentBriefHtml:
      "<p>Mark attendance for week 5 synchronous session.</p>",
    learner: u("u_008"),
    rubricId: null,
    gradeType: "Comp/Incomp",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-28T09:00:00Z",
        dueAt: "2026-07-28T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml: "<p>Attended week 5 synchronous session.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S5: Grade Scale (Letter) + No rubric (direct pick) ─────────────
  {
    id: "sb_005",
    assignmentId: "asg_005",
    assignmentCode: "ASG-005",
    assignmentTitle: "Capstone Pitch — Sign-up",
    courseId: "crs_005",
    courseName: "Senior Capstone",
    assignmentBriefHtml:
      "<p>Sign up for your capstone pitch slot.</p>",
    learner: u("u_003"),
    rubricId: null,
    gradeType: "NamedBand",
    gradeScaleId: "gs_letter",
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-29T14:30:00Z",
        dueAt: "2026-07-30T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml: "<p>Slot selected: Friday 2pm.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S6: Percentage + Scored rubric (rb_0054) ────────────────────────
  {
    id: "sb_006",
    assignmentId: "asg_006",
    assignmentCode: "ASG-006",
    assignmentTitle: "Argument-Driven Essay — Draft",
    courseId: "crs_006",
    courseName: "First-Year Writing Seminar",
    assignmentBriefHtml:
      "<p>Draft a 1,200-word argumentative essay responding to the prompt.</p>",
    learner: u("u_004"),
    rubricId: "rb_0054",
    gradeType: "Percentage",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-22T19:18:00Z",
        dueAt: "2026-07-23T23:59:00Z",
        wordCount: 1247,
        wordLimit: 1200,
        bodyHtml: loremHtml("argumentative essay draft"),
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S7: CGPA + Scored rubric (rb_0055) ──────────────────────────────
  {
    id: "sb_007",
    assignmentId: "asg_007",
    assignmentCode: "ASG-007",
    assignmentTitle: "Mid-term Lab Report",
    courseId: "crs_002",
    courseName: "General Chemistry I",
    assignmentBriefHtml:
      "<p>Submit a full lab report on the calorimetry experiment.</p>",
    learner: u("u_006"),
    rubricId: "rb_0055",
    gradeType: "CGPA",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-26T11:50:00Z",
        dueAt: "2026-07-27T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        files: [
          { name: "midterm_lab_report.pdf", size: 612_400, mime: "application/pdf" },
        ],
        bodyHtml: "<p>Full lab report attached.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S8: Marks + Scored rubric (rb_0056), total=100 ──────────────────
  {
    id: "sb_008",
    assignmentId: "asg_008",
    assignmentCode: "ASG-008",
    assignmentTitle: "Capstone Proposal — Draft",
    courseId: "crs_005",
    courseName: "Senior Capstone",
    assignmentBriefHtml:
      "<p>Submit a 2-page capstone proposal using the template.</p>",
    learner: u("u_008"),
    rubricId: "rb_0056",
    gradeType: "Marks",
    gradeScaleId: null,
    totalMarks: 50,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-27T20:11:00Z",
        dueAt: "2026-07-28T23:59:00Z",
        wordCount: 980,
        wordLimit: null,
        bodyHtml: loremHtml("capstone proposal draft"),
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S9: Comp/Incomp + Scored rubric (rb_0059) ───────────────────────
  {
    id: "sb_009",
    assignmentId: "asg_009",
    assignmentCode: "ASG-009",
    assignmentTitle: "Onboarding Module — Verification",
    courseId: "crs_007",
    courseName: "Orientation 2026",
    assignmentBriefHtml:
      "<p>Complete all onboarding verification checks.</p>",
    learner: u("u_003"),
    rubricId: "rb_0059",
    gradeType: "Comp/Incomp",
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-20T08:45:00Z",
        dueAt: "2026-07-21T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml: "<p>All onboarding checks completed.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S10: Grade Scale (Letter) + Scored rubric (rb_0057) ─────────────
  {
    id: "sb_010",
    assignmentId: "asg_010",
    assignmentCode: "ASG-010",
    assignmentTitle: "Case-Study Analysis — Final",
    courseId: "crs_008",
    courseName: "Organizational Behaviour",
    assignmentBriefHtml:
      "<p>Write a 2,000-word case-study analysis on the assigned organisation.</p>",
    learner: u("u_004"),
    rubricId: "rb_0057",
    gradeType: "gs_letter",
    gradeScaleId: "gs_letter",
    totalMarks: null,
    currentStatus: "pending",
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-30T17:02:00Z",
        dueAt: "2026-07-31T23:59:00Z",
        wordCount: 2054,
        wordLimit: 2000,
        bodyHtml: loremHtml("case-study analysis"),
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: null,
    evaluatedBy: null,
  },

  // ── S11: Suggested Grade Scale (Performance) + Unscored rubric (rb_0060) — PRE-GRADED
  {
    id: "sb_011",
    assignmentId: "asg_011",
    assignmentCode: "ASG-011",
    assignmentTitle: "Oral Presentation — Mid-term",
    courseId: "crs_004",
    courseName: "Public Speaking",
    assignmentBriefHtml:
      "<p>Deliver a 5-minute oral presentation on your chosen topic.</p>",
    learner: u("u_006"),
    rubricId: "rb_0060",
    gradeType: "gs_performance",
    gradeScaleId: "gs_performance",
    totalMarks: null,
    currentStatus: "graded",
    finalGrade: "Effective",
    finalPercentage: 88,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-24T15:00:00Z",
        dueAt: "2026-07-25T23:59:00Z",
        wordCount: 0,
        wordLimit: null,
        bodyHtml: "<p>Recording link submitted separately.</p>",
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: "2026-07-26T09:30:00Z",
    evaluatedBy: INSTRUCTOR,
  },

  // ── S12: No Grade Scale + Unscored rubric (rb_0060) — PRE-GRADED ─────
  {
    id: "sb_012",
    assignmentId: "asg_012",
    assignmentCode: "ASG-012",
    assignmentTitle: "Peer Review — Draft Workshop",
    courseId: "crs_006",
    courseName: "First-Year Writing Seminar",
    assignmentBriefHtml:
      "<p>Provide peer feedback on two classmates' drafts.</p>",
    learner: u("u_008"),
    rubricId: "rb_0060",
    gradeType: null,
    gradeScaleId: null,
    totalMarks: null,
    currentStatus: "graded",
    finalGrade: null,
    finalPercentage: null,
    attempts: [
      baseAttempt({
        attemptNumber: 1,
        submittedAt: "2026-07-22T13:20:00Z",
        dueAt: "2026-07-23T23:59:00Z",
        wordCount: 612,
        wordLimit: null,
        bodyHtml: loremHtml("peer review notes for two drafts"),
      }),
    ],
    viewingAttempt: 1,
    evaluatedAt: "2026-07-24T10:00:00Z",
    evaluatedBy: INSTRUCTOR,
  },
];