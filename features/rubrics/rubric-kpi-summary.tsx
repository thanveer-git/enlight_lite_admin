"use client";

import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CircleDashed,
  FileCheck2,
  FileText,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { RubricStatus } from "@/types/rubric";

export interface RubricKpiSummaryProps {
  total: number;
  counts: Record<RubricStatus, number>;
}

interface KpiConfig {
  key: keyof RubricKpiSummaryProps["counts"] | "total";
  label: string;
  helper: string;
  icon: LucideIcon;
  iconTone: string; // icon tile bg + text
  countTone: string; // count text colour (matches status hue)
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: "total",
    label: "Total Rubrics",
    helper: "All rubrics in workspace",
    icon: FileText,
    iconTone: "bg-indigo-50 text-indigo-600",
    countTone: "text-indigo-600",
  },
  {
    key: "published",
    label: "Published",
    helper: "Ready to attach",
    icon: FileCheck2,
    iconTone: "bg-emerald-50 text-emerald-600",
    countTone: "text-emerald-600",
  },
  {
    key: "in_use",
    label: "In Use",
    helper: "Grading submissions",
    icon: Sparkles,
    iconTone: "bg-sky-50 text-sky-600",
    countTone: "text-sky-600",
  },
  {
    key: "draft",
    label: "Draft",
    helper: "Authoring in progress",
    icon: CircleDashed,
    iconTone: "bg-amber-50 text-amber-600",
    countTone: "text-amber-600",
  },
  {
    key: "archived",
    label: "Archived",
    helper: "Retired from use",
    icon: Archive,
    iconTone: "bg-zinc-100 text-zinc-600",
    countTone: "text-zinc-600",
  },
];

function KpiCard({
  value,
  label,
  icon: Icon,
  iconTone,
  countTone,
}: {
  value: number;
  label: string;
  icon: LucideIcon;
  iconTone: string;
  countTone: string;
}) {
  return (
    <div
      className={cn(
        "group flex h-full items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-soft transition-all duration-200",
        "hover:-translate-y-0.5 hover:border-border hover:shadow-soft-lg",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconTone,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {label}
      </p>
      <span
        className={cn(
          "shrink-0 text-2xl font-semibold leading-none tracking-tight tabular-nums",
          countTone,
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function RubricKpiSummary({ total, counts }: RubricKpiSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {KPI_CONFIG.map((kpi) => {
        const value = kpi.key === "total" ? total : counts[kpi.key];
        return (
          <KpiCard
            key={kpi.key}
            value={value}
            label={kpi.label}
            icon={kpi.icon}
            iconTone={kpi.iconTone}
            countTone={kpi.countTone}
          />
        );
      })}
    </div>
  );
}
