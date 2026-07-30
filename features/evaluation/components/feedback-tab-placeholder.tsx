"use client";

import { EmptyState } from "@/components/composite/empty-state";
import { MessageSquare } from "lucide-react";

export function FeedbackTabPlaceholder() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="Public feedback coming next"
      description="The learner-visible message thread composer lands in the next phase. Saved evaluation results will start a thread automatically."
    />
  );
}
