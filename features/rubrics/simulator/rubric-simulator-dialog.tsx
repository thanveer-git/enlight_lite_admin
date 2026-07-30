"use client";

import { useEffect, useState } from "react";

import { GradeSimulator } from "@/features/rubrics/simulator/grade-simulator";
import { apiClient } from "@/services/api-client";
import type { RubricDetail, RubricType } from "@/types/rubric";

export function buildMatrixFromRowSummary(
  detail: RubricDetail,
): RubricDetail["matrix"] {
  return detail.matrix;
}

export interface RubricSimulatorDialogProps {
  rubricId: string;
  rubricName: string;
  rubricType: RubricType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RubricSimulatorDialog({
  rubricId,
  rubricName,
  rubricType,
  open,
  onOpenChange,
}: RubricSimulatorDialogProps) {
  const [detail, setDetail] = useState<RubricDetail | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (open) {
      apiClient.getRubric(rubricId).then((d) => {
        if (!cancelled) setDetail(d);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [open, rubricId]);

  const matrix = detail?.matrix ?? emptyMatrix;
  const displayName = detail?.name ?? rubricName;
  const type = detail?.type ?? rubricType;

  return (
    <GradeSimulator
      embeddedRubricId={rubricId}
      matrix={matrix}
      rubricType={type}
      rubricName={displayName}
      open={open}
      onOpenChange={onOpenChange}
      showTrigger={false}
    />
  );
}

const emptyMatrix = {
  criteria: [],
  levels: [],
  descriptions: {},
  gradingMethod: "weighted_average" as const,
  profileRules: [],
  profileFallback: false,
  minPassLevelId: null,
  suggestedScaleId: null,
};