"use client";

/**
 * Client orchestrator for the evaluation detail page.
 *
 * Pulls the rubric + grade scale, owns the local Zustand store
 * subscription, and composes the Assessment tab + left column tabs
 * inside the two-column template.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, FileText, Upload, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { prevNextForSubmission } from "@/features/evaluation/selectors";
import { emptyEvaluationDraft, type Submission } from "@/features/evaluation/types";
import { useEvaluation } from "@/features/evaluation/components/hooks/use-evaluation";
import { AssessmentTab } from "@/features/evaluation/components/assessment-tab";
import { AssignmentDescriptionTab } from "@/features/evaluation/components/assignment-description-tab";
import { CalculationExplanation } from "@/features/evaluation/components/calculation-explanation";
import { SubmissionTab } from "@/features/evaluation/components/submission-tab";
import { FeedbackTab } from "@/features/evaluation/components/feedback-tab";
import { InternalFeedbackTab } from "@/features/evaluation/components/internal-feedback-tab";
import { SubmissionOverviewCard } from "@/features/evaluation/components/submission-overview-card";
import { AccessWindowEditor, resolveAccessWindow } from "@/features/evaluation/components/access-window-tab";
import { EvaluationDetailPage } from "@/templates/evaluation-detail-page";
import { useEvaluationStore } from "@/stores/evaluation-store";

interface EvaluationDetailClientProps {
  submission: Submission;
  breadcrumbs?: { label: string; href?: string }[];
}

export function EvaluationDetailClient({
  submission,
  breadcrumbs,
}: EvaluationDetailClientProps) {
  const setOpen = useEvaluationStore((s) => s.setOpen);
  const savedStatuses = useEvaluationStore((s) => s.savedStatuses);

  useEffect(() => {
    setOpen(submission.id);
  }, [setOpen, submission.id]);

  const status = savedStatuses[submission.id] ?? submission.currentStatus;
  const liveSubmission = useMemo(
    () => ({ ...submission, currentStatus: status }),
    [submission, status],
  );

  const fallbackDraft = useMemo(() => emptyEvaluationDraft(), []);
  // Live 0–100 percentage reported by the direct-grade control while
  // the reviewer is dragging the slider / typing in the numeric input.
  // Used to surface the same number into the hero card's "Percentage:"
  // chip so it tracks what the reviewer is interacting with.
  const [liveDirectPercent, setLiveDirectPercent] = useState<number | null>(null);
  const {
    draft,
    derived,
    rubric,
    gradeScale,
    setRating,
    setDirectGrade,
    setOverride,
    setAccessWindow,
    setMarkComplete,
    setNotify,
    onSave,
  } = useEvaluation({ submission: liveSubmission, fallbackDraft });

  const { prev, next } = prevNextForSubmission(liveSubmission);

  // The attempt the Access Window editor is acting on. Falls back to
  // the first attempt when the viewingAttempt index points at nothing.
  const currentAttempt =
    liveSubmission.attempts.find(
      (a) => a.attemptNumber === liveSubmission.viewingAttempt,
    ) ?? liveSubmission.attempts[0];

  const handleSaveWithToast = () => {
    if (derived.saveBlocked) {
      toast.error(derived.saveBlockReason ?? "Cannot save yet.");
      return;
    }
    onSave();
    toast.success(
      derived.completionDecision === "complete"
        ? "Evaluation saved — submission graded"
        : "Evaluation saved — submission remains open",
      {
        description: `Effective grade: ${derived.effectiveGrade ?? "—"}`,
      },
    );
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="default"
        size="sm"
        asChild
        disabled={!prev}
      >
        {prev ? (
          <Link href={ROUTES.admin.submissions.detail(prev.id)}>
            <ArrowLeft className="mr-1.5 size-4" />
            {prev.learner.name.split(" ")[0]}
          </Link>
        ) : (
          <span>
            <ArrowLeft className="mr-1.5 size-4" />
            Prev
          </span>
        )}
      </Button>
      <Button
        variant="default"
        size="sm"
        asChild
        disabled={!next}
      >
        {next ? (
          <Link href={ROUTES.admin.submissions.detail(next.id)}>
            {next.learner.name.split(" ")[0]}
            <ArrowRight className="ml-1.5 size-4" />
          </Link>
        ) : (
          <span>
            Next
            <ArrowRight className="ml-1.5 size-4" />
          </span>
        )}
      </Button>
    </div>
  );

  const pageTitle = (
    <Button
      variant="default"
      size="sm"
      asChild
    >
      <Link href={ROUTES.admin.submissions.list}>
        <ArrowLeft className="mr-1.5 size-4" />
        All Submissions
      </Link>
    </Button>
  );

  const overview = (
    <SubmissionOverviewCard
      submission={liveSubmission}
      rubricName={rubric?.name ?? null}
      totalMarks={liveSubmission.totalMarks}
      gradeFormat={liveSubmission.gradeType}
      gradeScale={gradeScale}
      scorePercent={liveDirectPercent ?? derived.percentage ?? derived.engine?.percentage ?? null}
      passFail={derived.passFail}
      effectiveGrade={derived.effectiveGrade}
      hasGradeProfile={
        rubric?.matrix.gradingMethod === "grade_profile" &&
        rubric.matrix.profileRules.length > 0
      }
    />
  );

  const leftTabs = [
    {
      id: "assignment",
      label: "Assignment Description",
      icon: <FileText className="size-4" aria-hidden />,
      content: <AssignmentDescriptionTab submission={liveSubmission} />,
    },
    {
      id: "submission",
      label: "Submission",
      icon: <Upload className="size-4" aria-hidden />,
      content: (
        <SubmissionTab
          attempts={liveSubmission.attempts}
          initialAttemptNumber={liveSubmission.viewingAttempt}
        />
      ),
    },
    {
      id: "feedback",
      label: "Assignment Feedback",
      icon: <MessageSquare className="size-4" aria-hidden />,
      count:
        liveSubmission.attempts.find(
          (a) => a.attemptNumber === liveSubmission.viewingAttempt,
        )?.feedback.length ?? 0,
      content: (
        <FeedbackTab
          attempts={liveSubmission.attempts}
          initialAttemptNumber={liveSubmission.viewingAttempt}
        />
      ),
    },
  ];

  const rightTabs = [
    {
      id: "evaluation",
      label: "Evaluation",
      content: (
        <AssessmentTab
          submission={liveSubmission}
          draft={draft}
          derived={derived}
          rubric={rubric}
          gradeScale={gradeScale}
          onRatingChange={setRating}
          onDirectGradeChange={setDirectGrade}
          onLiveDirectPercentChange={setLiveDirectPercent}
          onOverridePatch={setOverride}
          onMarkCompleteChange={setMarkComplete}
          onNotifyChange={setNotify}
          onSave={handleSaveWithToast}
        />
      ),
    },
    {
      id: "ie-feedback",
      label: "IE Feedback",
      content: (
        <InternalFeedbackTab
          attempts={liveSubmission.attempts}
          initialAttemptNumber={liveSubmission.viewingAttempt}
        />
      ),
    },
  ];

  /**
   * Sibling cards rendered directly below the right-column tabbed
   * card. "How this was calculated" and "Access Window" live outside
   * the tabbed card so they stay visible to reviewers regardless of
   * which right-side tab they have open.
   */
  const belowRightTabs = (
    <>
      {/* "How this was calculated" only applies to rubric-graded
          submissions. Direct-grade assignments grade via the assignment's
          grade format alone, with no per-criterion breakdown to show. */}
      {rubric && (
        <CalculationExplanation
          derived={derived}
          rubric={rubric}
          gradeFormat={liveSubmission.gradeType}
          totalMarks={liveSubmission.totalMarks}
          directGradeValue={draft.directGrade}
        />
      )}
      {currentAttempt && (
        <AccessWindowTab
          attempt={currentAttempt}
          accessWindow={draft.accessWindow}
          onChange={setAccessWindow}
        />
      )}
    </>
  );

  return (
    <EvaluationDetailPage
      breadcrumbs={breadcrumbs}
      title={pageTitle}
      actions={headerActions}
      overview={overview}
      leftTabs={leftTabs}
      rightTabs={rightTabs}
      belowRightTabs={belowRightTabs}
    />
  );
}

/**
 * Thin wrapper around `AccessWindowEditor` that seeds the resolved
 * window from the current attempt the first time it's mounted, then
 * forwards subsequent edits into the EvaluationStore via
 * `setAccessWindow`. Once seeded, the store is the source of truth.
 */
function AccessWindowTab({
  attempt,
  accessWindow,
  onChange,
}: {
  attempt: Pick<
    import("@/features/evaluation/types").AttemptRecord,
    "attemptNumber" | "submittedAt" | "dueAt" | "availableAt" | "untilAt"
  >;
  accessWindow: import("@/features/evaluation/types").EvaluationDraft["accessWindow"];
  onChange: (
    next: NonNullable<import("@/features/evaluation/types").EvaluationDraft["accessWindow"]>,
  ) => void;
}) {
  // Resolve a complete window. Falls back to attempt fields; missing
  // fields stay null and the editor renders blanks for them.
  const seed = resolveAccessWindow(attempt);
  const model = accessWindow ?? seed;

  return (
    <AccessWindowEditor
      attempt={attempt}
      onChange={(next) => {
        // Promote the seed into the store on first edit so the page
        // state has a complete window from then on.
        if (!accessWindow) onChange(seed);
        onChange(next);
      }}
    />
  );
}
