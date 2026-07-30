"use client";

/**
 * Assignment tab — renders the assignment's question as rich text.
 *
 * The richer `assignmentQuestion` field is shown when present, falling
 * back to the simpler `assignmentBriefHtml` for submissions that
 * haven't been migrated to the new field yet.
 */
import { EmptyState } from "@/components/composite/empty-state";

import type { Submission } from "../types";

interface AssignmentDescriptionTabProps {
  submission: Submission;
}

export function AssignmentDescriptionTab({ submission }: AssignmentDescriptionTabProps) {
  const html = submission.assignmentQuestion ?? submission.assignmentBriefHtml;
  const isQuestion = submission.assignmentQuestion != null;

  if (!html) {
    return (
      <EmptyState
        title="No assignment question"
        description="This submission is not linked to a question yet."
      />
    );
  }

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
