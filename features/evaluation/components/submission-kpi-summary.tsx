"use client";

/**
 * Status-based KPI cards for the submissions list page.
 *
 * One card per submission status plus a Total tile. Tiles use the
 * project's semantic colour tokens (`success`, `warning`, `destructive`)
 * and `bg-card` — no raw hex or arbitrary Tailwind values.
 */
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Inbox,
  RotateCw,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SubmissionStatus } from "@/features/evaluation/types";

export interface SubmissionKpiSummaryProps {
  total: number;
  counts: Record<SubmissionStatus, number>;
}

interface KpiConfig {
  key: SubmissionStatus | "total";
  label: string;
  helper: string;
  icon: LucideIcon;
  /** Background + text colour for the icon tile. Uses semantic tokens. */
  iconTile: string;
  /** Numeric value colour, also via tokens. */
  countTone: string;
}

const KPI_CONFIG: KpiConfig[] = [
  {
    key: "total",
    label: "Total submissions",
    helper: "All submissions in the queue",
    icon: Inbox,
    iconTile: "bg-primary/10 text-primary",
    countTone: "text-foreground",
  },
  {
    key: "pending",
    label: "Pending",
    helper: "Awaiting first review",
    icon: FileText,
    iconTile: "bg-warning/10 text-warning",
    countTone: "text-warning",
  },
  {
    key: "graded",
    label: "Graded",
    helper: "Score released to learner",
    icon: CheckCircle2,
    iconTile: "bg-success/10 text-success",
    countTone: "text-success",
  },
  {
    key: "resubmit",
    label: "Resubmission open",
    helper: "Learner can re-submit",
    icon: RotateCw,
    iconTile: "bg-destructive/10 text-destructive",
    countTone: "text-destructive",
  },
];

function KpiCard({
  value,
  label,
  helper,
  icon: Icon,
  iconTile,
  countTone,
}: {
  value: number;
  label: string;
  helper: string;
  icon: LucideIcon;
  iconTile: string;
  countTone: string;
}) {
  return (
    <div
      className={cn(
        "group flex h-full items-center gap-4 rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-soft",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-soft-lg",
      )}
    >
      <span
        className={cn(
          "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
          iconTile,
        )}
      >
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{helper}</p>
      </div>
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

export function SubmissionKpiSummary({
  total,
  counts,
}: SubmissionKpiSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((kpi) => {
        const value = kpi.key === "total" ? total : counts[kpi.key];
        return (
          <KpiCard
            key={kpi.key}
            value={value}
            label={kpi.label}
            helper={kpi.helper}
            icon={kpi.icon}
            iconTile={kpi.iconTile}
            countTone={kpi.countTone}
          />
        );
      })}
    </div>
  );
}
