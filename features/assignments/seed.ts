import type { AssignmentDraft } from "@/features/assignments/wizard/types";
import { FAKE_USERS } from "@/services/handlers/users";

export interface Section {
  id: string;
  name: string;
}

export const SECTIONS: Section[] = [
  { id: "sec_001", name: "Section A — Morning" },
  { id: "sec_002", name: "Section B — Afternoon" },
  { id: "sec_003", name: "Section C — Evening" },
  { id: "sec_004", name: "Online Cohort — Spring" },
  { id: "sec_005", name: "Bridge Program — Q1" },
  { id: "sec_006", name: "Remedial Workshop" },
];

/** Student pool derived from FAKE_USERS plus 2 extras so the multi-select
 *  picker has enough rows to demo. */
export interface StudentLite {
  id: string;
  name: string;
  email: string;
}

const baseStudents: StudentLite[] = FAKE_USERS.filter((u) => u.role === "student").map(
  (u) => ({ id: u.id, name: u.name, email: u.email }),
);

export const STUDENTS: StudentLite[] = [
  ...baseStudents,
  { id: "st_extra_1", name: "Diya Joshi", email: "diya.joshi@example.com" },
  { id: "st_extra_2", name: "Arjun Kapoor", email: "arjun.kapoor@example.com" },
];

/** Local persisted mock of created assignments. api-client pushes/reads
 *  here so reloads feel persistent in this prototype. */
export const FAKE_ASSIGNMENTS: AssignmentDraft[] = [
  {
    id: "asg_001",
    title: "Essay: Argument Quality",
    wordLimit: 1500,
    lectureSlug: "essay-argument-quality",
    sectionId: "sec_001",
    content:
      "<p>Write a 1500-word essay arguing a position on the role of AI in higher education.</p>",
    files: [
      { id: "f_1", name: "rubric-summary.pdf", sizeKb: 124 },
      { id: "f_2", name: "lecture-notes.docx", sizeKb: 88 },
    ],
    useRubric: true,
    rubricId: "rb_0054",
    showEvalDetail: true,
    gradeKind: "scale",
    gradeType: null,
    totalMarks: null,
    gradeScaleId: "gs_letter_default",
    outcomeOverrideEnabled: false,
    outcome:
      "<p>Students demonstrate competency across thesis, evidence, and structure.</p>",
    accessRules: [
      {
        id: "rule_seed_1",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-09-01T09:00",
        dueAt: "2026-09-15T23:59",
        untilAt: "2026-09-22T23:59",
        notify: false,
        updatedAt: Date.now(),
      },
    ],
    status: "published",
  },
  {
    id: "asg_002",
    title: "Lab Report: Data Interpretation",
    wordLimit: 0,
    lectureSlug: "lab-data-interpretation",
    sectionId: "sec_002",
    content: "<p>Interpret the dataset in the attached CSV and produce a 4-page report.</p>",
    files: [{ id: "f_3", name: "dataset-week-3.csv", sizeKb: 412 }],
    useRubric: false,
    rubricId: null,
    showEvalDetail: true,
    gradeKind: "type",
    gradeType: "mark",
    totalMarks: 50,
    gradeScaleId: null,
    outcomeOverrideEnabled: true,
    outcome:
      "<p>Custom outcome for this assignment — describe what learners should demonstrate.</p>",
    accessRules: [
      {
        id: "rule_seed_2",
        audience: "single",
        studentIds: ["u_003"],
        fromAt: "2026-09-05T09:00",
        dueAt: null,
        untilAt: null,
        notify: false,
        updatedAt: Date.now(),
      },
      {
        id: "rule_seed_3",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-09-08T09:00",
        dueAt: "2026-09-20T23:59",
        untilAt: null,
        notify: true,
        updatedAt: Date.now() + 1,
      },
    ],
    status: "draft",
  },
  {
    id: "asg_003",
    title: "Problem Set 4: Linear Algebra",
    wordLimit: 0,
    lectureSlug: "linear-algebra-ps4",
    sectionId: "sec_003",
    content:
      "<p>Solve problems 1–10 from Chapter 4. Show all working; partial credit is awarded.</p>",
    files: [{ id: "f_4", name: "problem-set-4.pdf", sizeKb: 256 }],
    useRubric: false,
    rubricId: null,
    showEvalDetail: false,
    gradeKind: "type",
    gradeType: "percentage",
    totalMarks: null,
    gradeScaleId: null,
    outcomeOverrideEnabled: false,
    outcome: "",
    accessRules: [
      {
        id: "rule_seed_4",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-09-10T09:00",
        dueAt: "2026-09-17T23:59",
        untilAt: "2026-09-24T23:59",
        notify: true,
        updatedAt: Date.now() + 2,
      },
    ],
    status: "published",
  },
  {
    id: "asg_004",
    title: "Group Project: Market Analysis",
    wordLimit: 3000,
    lectureSlug: "market-analysis-group",
    sectionId: "sec_001",
    content:
      "<p>Form teams of 3–4 and produce a market analysis report for a chosen startup.</p>",
    files: [
      { id: "f_5", name: "project-brief.pdf", sizeKb: 198 },
      { id: "f_6", name: "team-formation.xlsx", sizeKb: 42 },
      { id: "f_7", name: "sample-analysis.pdf", sizeKb: 612 },
    ],
    useRubric: true,
    rubricId: "rb_0078",
    showEvalDetail: true,
    gradeKind: "scale",
    gradeType: null,
    totalMarks: null,
    gradeScaleId: "gs_letter_default",
    outcomeOverrideEnabled: false,
    outcome: "",
    accessRules: [
      {
        id: "rule_seed_5",
        audience: "multiple",
        studentIds: ["st_extra_1", "st_extra_2"],
        fromAt: "2026-09-12T09:00",
        dueAt: "2026-10-10T23:59",
        untilAt: "2026-10-17T23:59",
        notify: true,
        updatedAt: Date.now() + 3,
      },
      {
        id: "rule_seed_6",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-09-12T09:00",
        dueAt: "2026-10-10T23:59",
        untilAt: "2026-10-17T23:59",
        notify: false,
        updatedAt: Date.now() + 4,
      },
    ],
    status: "published",
  },
  {
    id: "asg_005",
    title: "Reading Reflection: Chapter 7",
    wordLimit: 800,
    lectureSlug: "chapter-7-reflection",
    sectionId: "sec_004",
    content:
      "<p>Reflect on the key arguments from Chapter 7 in 600–800 words.</p>",
    files: [],
    useRubric: false,
    rubricId: null,
    showEvalDetail: false,
    gradeKind: "type",
    gradeType: "complete_incomplete",
    totalMarks: null,
    gradeScaleId: null,
    outcomeOverrideEnabled: false,
    outcome: "",
    accessRules: [
      {
        id: "rule_seed_7",
        audience: "single",
        studentIds: ["u_003"],
        fromAt: "2026-09-15T09:00",
        dueAt: "2026-09-22T23:59",
        untilAt: null,
        notify: false,
        updatedAt: Date.now() + 5,
      },
    ],
    status: "draft",
  },
  {
    id: "asg_006",
    title: "Mid-term Exam: Calculus II",
    wordLimit: 0,
    lectureSlug: "calculus-ii-midterm",
    sectionId: "sec_002",
    content:
      "<p>Closed-book mid-term covering integration techniques and series convergence.</p>",
    files: [{ id: "f_8", name: "exam-coverage.pdf", sizeKb: 88 }],
    useRubric: true,
    rubricId: "rb_0112",
    showEvalDetail: true,
    gradeKind: "type",
    gradeType: "cgpa",
    totalMarks: null,
    gradeScaleId: null,
    outcomeOverrideEnabled: true,
    outcome:
      "<p>Students demonstrate competency in integration by parts, partial fractions, and series convergence tests.</p>",
    accessRules: [
      {
        id: "rule_seed_8",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-10-01T09:00",
        dueAt: "2026-10-01T12:00",
        untilAt: "2026-10-01T18:00",
        notify: true,
        updatedAt: Date.now() + 6,
      },
    ],
    status: "in_use",
  },
  {
    id: "asg_007",
    title: "Code Review: React Patterns",
    wordLimit: 0,
    lectureSlug: "react-patterns-review",
    sectionId: "sec_005",
    content:
      "<p>Review the provided codebase and submit a written critique of the React patterns used.</p>",
    files: [
      { id: "f_9", name: "codebase-snapshot.zip", sizeKb: 2048 },
      { id: "f_10", name: "review-template.docx", sizeKb: 32 },
    ],
    useRubric: false,
    rubricId: null,
    showEvalDetail: true,
    gradeKind: "type",
    gradeType: "mark",
    totalMarks: 30,
    gradeScaleId: null,
    outcomeOverrideEnabled: false,
    outcome: "",
    accessRules: [
      {
        id: "rule_seed_9",
        audience: "everyone",
        studentIds: [],
        fromAt: "2026-09-20T09:00",
        dueAt: "2026-09-30T23:59",
        untilAt: "2026-10-07T23:59",
        notify: true,
        updatedAt: Date.now() + 7,
      },
    ],
    status: "draft",
  },
];
