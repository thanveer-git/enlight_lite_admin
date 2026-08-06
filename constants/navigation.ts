import {
  BookOpen,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  PlusCircle,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { Navigation } from "@/types/navigation";

export const NAV_ITEMS: Navigation = [
  {
    title: "Overview",
    items: [
      {
        title: "Dashboard",
        href: ROUTES.admin.root,
        icon: LayoutDashboard,
        description: "High-level overview of activity",
      },
    ],
  },
  {
    title: "LMS",
    items: [
      {
        title: "Users",
        href: `${ROUTES.admin.root}/users`,
        icon: Users,
        description: "Students, instructors, admins",
      },
      {
        title: "Courses",
        href: `${ROUTES.admin.root}/courses`,
        icon: BookOpen,
        description: "Course catalog and content",
      },
      {
        title: "Rubrics",
        href: ROUTES.admin.rubrics.root,
        icon: ListChecks,
        description: "Reusable assessment structures",
        subItems: [
          {
            title: "All Rubrics",
            href: ROUTES.admin.rubrics.all,
            icon: FileText,
            description: "Library of existing rubrics",
          },
          {
            title: "New Rubric",
            href: ROUTES.admin.rubrics.form(0),
            icon: PlusCircle,
            description: "Create a new rubric",
          },
        ],
      },
      {
        title: "Grading",
        href: ROUTES.admin.grading.root,
        icon: GraduationCap,
        description: "Grade scales and band definitions",
        subItems: [
          {
            title: "All Grades",
            href: ROUTES.admin.grading.all,
            icon: FileText,
            description: "Built-in and custom grade scales",
          },
          {
            title: "New Grade",
            href: ROUTES.admin.grading.form(0),
            icon: PlusCircle,
            description: "Create a new letter-grade scale",
          },
        ],
      },
      {
        title: "Assessments",
        href: `${ROUTES.admin.root}/assessments`,
        icon: ListChecks,
        description: "Quizzes, tests, exams",
      },
      {
        title: "Evaluations",
        href: ROUTES.admin.submissions.root,
        icon: ScrollText,
        description: "Grade learner submissions",
        subItems: [
          {
            title: "All Submissions",
            href: ROUTES.admin.submissions.list,
            icon: FileText,
            description: "Browse submissions across assignments",
          },
        ],
      },
      {
        title: "Certificates",
        href: `${ROUTES.admin.root}/certificates`,
        icon: GraduationCap,
        description: "Issued and pending",
      },
      {
        title: "Reports",
        href: `${ROUTES.admin.root}/reports`,
        icon: ScrollText,
        description: "Analytics and exports",
      },
      {
        title: "Organizations",
        href: `${ROUTES.admin.root}/organizations`,
        icon: ShieldCheck,
        description: "Tenants and access",
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        title: "Settings",
        href: ROUTES.admin.settings,
        icon: Settings,
        description: "Workspace and account",
      },
    ],
  },
];

export const SECONDARY_NAV_ITEMS = [
  {
    title: "Listings (demo)",
    href: ROUTES.admin.listings,
    icon: ListChecks,
  },
  {
    title: "Forms (demo)",
    href: ROUTES.admin.forms,
    icon: ScrollText,
  },
  {
    title: "Wizards (demo)",
    href: ROUTES.admin.wizards,
    icon: BookOpen,
  },
] as const;
