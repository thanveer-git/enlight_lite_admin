"use client";

import type { LucideIcon } from "lucide-react";
import {
  CircleDashed,
  FileCheck2,
  GraduationCap,
  Type,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { GradeScaleStatus } from "@/features/rubrics/constants";

export interface GradeScaleKpiSummaryProps {
  total: number;
  letterGradeCount: number;
  statusCounts: Record<GradeScaleStatus, number>;
}

interface KpiConfig {
  key: keyof Omit<GradeScaleKpiSummaryProps, "statusCounts"> | "published" | "draft";
  label: string;
  helper: string;
  icon: LucideIcon;
  iconTone: string;
  countTone: string;
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: "total",
    label: "Total Scales",
    helper: "Built-in and custom",
    icon: GraduationCap,
    iconTone: "bg-indigo-50 text-indigo-600",
    countTone: "text-indigo-600",
  },
  {
    key: "letterGradeCount",
    label: "Letter Grade",
    helper: "Admin-managed scales",
    icon: Type,
    iconTone: "bg-sky-50 text-sky-600",
    countTone: "text-sky-600",
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
    key: "draft",
    label: "Draft",
    helper: "Authoring in progress",
    icon: CircleDashed,
    iconTone: "bg-amber-50 text-amber-600",
    countTone: "text-amber-600",
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

export function GradeScaleKpiSummary({
  total,
  letterGradeCount,
  statusCounts,
}: GradeScaleKpiSummaryProps) {
  const valueFor = (key: KpiConfig["key"]): number => {
    switch (key) {
      case "total":
        return total;
      case "letterGradeCount":
        return letterGradeCount;
      case "published":
        return statusCounts.published;
      case "draft":
        return statusCounts.draft;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {KPI_CONFIG.map((kpi) => (
        <KpiCard
          key={kpi.key}
          value={valueFor(kpi.key)}
          label={kpi.label}
          icon={kpi.icon}
          iconTone={kpi.iconTone}
          countTone={kpi.countTone}
        />
      ))}
    </div>
  );
}
