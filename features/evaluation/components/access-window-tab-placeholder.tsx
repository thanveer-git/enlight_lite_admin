"use client";

import { EmptyState } from "@/components/composite/empty-state";
import { Clock } from "lucide-react";

export function AccessWindowTabPlaceholder() {
  return (
    <EmptyState
      icon={Clock}
      title="Access window editor coming next"
      description="Adjust the learner's Available From / Due / Until times when a submission needs to stay open longer."
    />
  );
}
