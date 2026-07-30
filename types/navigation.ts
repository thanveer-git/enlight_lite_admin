import type { LucideIcon } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: string | number;
  disabled?: boolean;
  subItems?: NavSubItem[];
}

export interface NavSubItem {
  title: string;
  href: string;
  icon?: LucideIcon;
  description?: string;
  disabled?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export type Navigation = NavSection[];
