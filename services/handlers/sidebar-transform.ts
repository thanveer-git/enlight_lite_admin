import {
  Bell,
  BookOpen,
  Building2,
  CalendarRange,
  FileText,
  GraduationCap,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  Percent,
  ScrollText,
  Settings,
  ShieldCheck,
  Tag,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { ROUTES } from "@/constants/routes";
import type { Navigation, NavItem, NavSubItem } from "@/types/navigation";

import type { SidebarApiItem } from "@/services/handlers/sidebar";

const ICON_BY_CODE: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  products: BookOpen,
  questionpool: ListChecks,
  marketing: Megaphone,
  users: Users,
  manage: Building2,
  reports: ScrollText,
  website: Settings,
  settings: Settings,
  rubrics: ListChecks,
};

const ICON_BY_LABEL: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Products: BookOpen,
  "Question Pool": ListChecks,
  Marketing: Megaphone,
  Users: Users,
  Manage: Building2,
  Reports: ScrollText,
  Website: Settings,
  Settings: Settings,
  Courses: BookOpen,
  Bundles: BookOpen,
  "Live Classes": CalendarRange,
  "Send Notifications": Mail,
  "Flash Messages": Bell,
  "Discount coupons": Percent,
  "Email Templates": Tag,
  Learners: GraduationCap,
  Facilitator: Users,
  "Role Management": ShieldCheck,
  Branch: Building2,
  Batches: Users,
  Customization: Settings,
  Pages: FileText,
  SEO: ScrollText,
  "Category Manager": ListChecks,
  "News Feed": ScrollText,
  "Sales Management": ScrollText,
};

function pickIcon(item: SidebarApiItem): LucideIcon {
  if (item.code && ICON_BY_CODE[item.code]) return ICON_BY_CODE[item.code];
  if (ICON_BY_LABEL[item.label]) return ICON_BY_LABEL[item.label];
  return FileText;
}

const RUBRIC_SUBITEM_ICONS = {
  all: FileText,
  new: ListChecks,
};

function buildRubricItem(): NavItem {
  return {
    title: "Rubrics",
    href: ROUTES.admin.rubrics.root,
    icon: ListChecks,
    description: "Reusable assessment structures",
    subItems: [
      {
        title: "All Rubrics",
        href: ROUTES.admin.rubrics.all,
        icon: RUBRIC_SUBITEM_ICONS.all,
        description: "Library of existing rubrics",
      },
      {
        title: "New Rubric",
        href: ROUTES.admin.rubrics.form(0),
        icon: RUBRIC_SUBITEM_ICONS.new,
        description: "Create a new rubric",
      },
    ],
  };
}

function mapSubItem(child: SidebarApiItem): NavSubItem {
  return {
    title: child.label,
    href: child.link ?? "#",
    icon: pickIcon(child),
  };
}

function mapItem(item: SidebarApiItem): NavItem {
  return {
    title: item.label,
    href: item.link ?? "#",
    icon: pickIcon(item),
    description: undefined,
    subItems: item.children && item.children.length > 0 ? item.children.map(mapSubItem) : undefined,
  };
}

export function buildNavigationFromSidebar(items: SidebarApiItem[]): Navigation {
  const mapped = items
    .filter((i) => i.type === "item" && i.label !== "Settings")
    .map(mapItem);

  const rubricIndex = mapped.findIndex((i) => i.title === "Users");
  const rubricItem = buildRubricItem();
  if (rubricIndex >= 0) {
    mapped.splice(rubricIndex + 1, 0, rubricItem);
  } else {
    mapped.push(rubricItem);
  }

  const settingsItem = items.find((i) => i.label === "Settings");
  const settingsNav: NavItem | null = settingsItem
    ? {
        title: settingsItem.label,
        href: ROUTES.admin.settings,
        icon: Settings,
        description: "Workspace and account",
      }
    : null;

  return [
    {
      title: "Overview",
      items: mapped.filter((i) => i.title === "Dashboard"),
    },
    {
      title: "LMS",
      items: mapped.filter((i) => i.title !== "Dashboard"),
    },
    ...(settingsNav
      ? [
          {
            title: "Settings",
            items: [settingsNav],
          },
        ]
      : []),
  ];
}
