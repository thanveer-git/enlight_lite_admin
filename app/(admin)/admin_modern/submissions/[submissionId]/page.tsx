/**
 * Server entry for the evaluation detail page.
 *
 * Resolves the submission via `getSubmissionById` and hands it to the
 * client component. 404s when the id is unknown.
 */
import { notFound } from "next/navigation";

import { getSubmissionById } from "@/features/evaluation/selectors";
import { EvaluationDetailClient } from "./evaluation-detail-client";

interface PageProps {
  params: { submissionId: string };
}

export default function EvaluationDetailPage({ params }: PageProps) {
  const submission = getSubmissionById(params.submissionId);
  if (!submission) notFound();

  return <EvaluationDetailClient submission={submission} />;
}
