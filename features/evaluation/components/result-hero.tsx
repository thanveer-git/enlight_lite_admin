"use client";

/**
 * Compact result hero card with the effective grade and pass/fail
 * signal. Re-implements the simulator's `ResultHero` pattern within
 * the project's tokens.
 */
import {
  Award,
  CheckCircle2,
  Scale,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DerivedEvaluation } from "@/features/evaluation/derive";

interface ResultHeroProps {
  derived: DerivedEvaluation;
  rubricName: string | null;
}

export function ResultHero({ derived, rubricName }: ResultHeroProps) {
  const grade = derived.effectiveGrade ?? "—";
  const passFail = derived.passFail;
  const isPass = passFail === "pass";
  const isFail = passFail === "fail";
  const overrideApplied = derived.overrideApplied;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 shadow-soft">
      <CardContent className="space-y-3 p-4">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Effective grade
            </p>
            <p
              className={cn(
                "text-2xl font-semibold leading-tight tabular-nums",
                isPass && "text-success",
                isFail && "text-destructive",
                !isPass && !isFail && "text-foreground",
              )}
            >
              {grade}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {overrideApplied && (
              <Badge variant="secondary" className="rounded-full text-[10px]">
                Override
              </Badge>
            )}
            <Badge
              variant={isPass ? "success" : isFail ? "destructive" : "secondary"}
              className="rounded-full"
            >
              {isPass ? (
                <CheckCircle2 className="mr-1 size-3" aria-hidden />
              ) : isFail ? (
                <XCircle className="mr-1 size-3" aria-hidden />
              ) : (
                <Award className="mr-1 size-3" aria-hidden />
              )}
              {isPass ? "Pass" : isFail ? "Fail" : "Pending"}
            </Badge>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <Stat label="Rubric" value={rubricName ?? "Direct grade"} />
          <Stat
            label="Weighted %"
            value={
              derived.engine?.percentage != null
                ? `${derived.engine.percentage.toFixed(1)}%`
                : "—"
            }
          />
          <Stat
            label="Scale band"
            value={derived.engine?.scaleBand?.grade ?? "—"}
          />
          <Stat
            label="Min-pass"
            value={
              derived.engine?.minPassStatus
                ? derived.engine.minPassStatus
                : "off"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-2.5 py-1.5">
      <div className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="truncate text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}
