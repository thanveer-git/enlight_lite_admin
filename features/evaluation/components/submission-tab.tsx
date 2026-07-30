"use client";

/**
 * Submission tab — document §4.5.
 *
 * Renders the selected attempt's files, submission date, and body.
 * Lets the user switch between attempts via a dropdown in the top-right.
 */
import { useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";

import { EmptyState } from "@/components/composite/empty-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { AttemptRecord } from "../types";

interface SubmissionTabProps {
  attempts: AttemptRecord[];
  initialAttemptNumber: number;
}

export function SubmissionTab({
  attempts,
  initialAttemptNumber,
}: SubmissionTabProps) {
  const [selectedNumber, setSelectedNumber] = useState(initialAttemptNumber);

  if (attempts.length === 0) {
    return (
      <EmptyState
        title="No submission yet"
        description="The learner has not submitted work for this assignment."
      />
    );
  }

  const attempt =
    attempts.find((a) => a.attemptNumber === selectedNumber) ?? attempts[0]!;
  const attemptOptions = [...attempts].sort(
    (a, b) => b.attemptNumber - a.attemptNumber,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          Submitted{" "}
          <span className="font-medium text-foreground">
            {format(new Date(attempt.submittedAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </p>
        <Select
          value={String(attempt.attemptNumber)}
          onValueChange={(v) => setSelectedNumber(Number(v))}
        >
          <SelectTrigger
            aria-label="Switch submission version"
            className="h-7 w-auto min-w-[10rem] rounded-md border-border/60 bg-muted/30 px-2.5 text-xs font-medium text-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {attemptOptions.map((a) => (
              <SelectItem key={a.attemptNumber} value={String(a.attemptNumber)}>
                Attempt {a.attemptNumber} ·{" "}
                {format(new Date(a.submittedAt), "MMM d")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {attempt.files.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Attached files
          </p>
          <ul className="flex flex-wrap items-center gap-2">
            {attempt.files.map((file) => (
              <li key={file.name}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-muted/20 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  title={`Download ${file.name}`}
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="size-3.5 text-muted-foreground" aria-hidden />
                  <span className="max-w-[14rem] truncate">{file.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {attempt.bodyHtml && (
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <div dangerouslySetInnerHTML={{ __html: attempt.bodyHtml }} />
        </div>
      )}
    </div>
  );
}
