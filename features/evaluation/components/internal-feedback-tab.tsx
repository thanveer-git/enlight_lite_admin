"use client";

/**
 * Internal Examiner Feedback tab.
 *
 * Renders the selected attempt's `feedback` array as a single-column
 * list of examiner notes plus a composer at the bottom. Unlike the
 * learner-facing Feedback tab, IE notes are written for the record by
 * the evaluating examiner and read by other reviewers, not by the
 * learner — a privacy banner makes that explicit.
 *
 * State is local (prototype limitation matching the rest of the
 * evaluation console — refresh resets).
 */
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Lock, NotebookPen, Paperclip, Send } from "lucide-react";

import { EmptyState } from "@/components/composite/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FAKE_CURRENT_USER } from "@/services/handlers/users";

import type { AttemptRecord, SubmissionMessage } from "../types";

interface InternalFeedbackTabProps {
  attempts: AttemptRecord[];
  initialAttemptNumber: number;
}

export function InternalFeedbackTab({
  attempts,
  initialAttemptNumber,
}: InternalFeedbackTabProps) {
  const attempt =
    attempts.find((a) => a.attemptNumber === initialAttemptNumber) ?? attempts[0];

  const [draft, setDraft] = useState("");
  /**
   * Locally appended notes. Seeded from the attempt on mount so an
   * attempt that already carries seed feedback renders those notes
   * alongside anything added in-session.
   */
  const [appended, setAppended] = useState<SubmissionMessage[]>([]);

  const notes = useMemo<SubmissionMessage[]>(
    () => (attempt ? [...attempt.feedback, ...appended] : appended),
    [attempt, appended],
  );

  if (!attempt) {
    return (
      <EmptyState
        title="No submission yet"
        description="The learner has not submitted work for this assignment."
      />
    );
  }

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0;

  const sendNote = () => {
    if (!canSend) return;
    const next: SubmissionMessage = {
      id: `ie_${attempt.attemptNumber}_${Date.now()}`,
      author: FAKE_CURRENT_USER,
      text: trimmed,
      sentAt: new Date().toISOString(),
    };
    setAppended((prev) => [...prev, next]);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Privacy banner — stays visible regardless of note count. */}
      <div className="flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold">Visible only to examiners</span> —
          the student never sees this thread.
        </p>
      </div>

      {/* Existing note list, or a soft empty hint above the composer. */}
      {notes.length === 0 ? (
        <p className="px-1 text-center text-xs text-muted-foreground">
          No private notes yet. Anything added here stays internal — the
          student never sees it.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <NotebookPen className="size-3.5" aria-hidden />
            Examiner notes · {notes.length}
          </div>
          <ol className="space-y-3">
            {notes.map((note) => (
              <li key={note.id}>
                <ExaminerNote message={note} />
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Composer — mirrors the public Feedback tab for visual parity. */}
      <div className="mt-2 space-y-1.5">
        <div className="flex items-center gap-2 rounded-2xl border border-primary/30 bg-background p-1.5 shadow-soft ring-1 ring-primary/20 transition-shadow focus-within:ring-2 focus-within:ring-primary/40">
          <button
            type="button"
            aria-label="Attach file"
            title="Attach file"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Paperclip className="size-4" aria-hidden />
          </button>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendNote();
              }
            }}
            placeholder="Add a private note…"
            rows={1}
            className="min-h-[2rem] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Add examiner note"
            title="Add examiner note"
            className="size-8 shrink-0 rounded-full"
            disabled={!canSend}
            onClick={sendNote}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="px-2 text-[10px] text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[9px] text-foreground">
            Enter
          </kbd>{" "}
          to add note ·{" "}
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[9px] text-foreground">
            Shift
          </kbd>
          {" + "}
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[9px] text-foreground">
            Enter
          </kbd>{" "}
          for a new line
        </p>
      </div>
    </div>
  );
}

function ExaminerNote({ message }: { message: SubmissionMessage }) {
  return (
    <article className="rounded-xl border border-border/60 bg-primary/5 p-4">
      <header className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-semibold text-foreground">{message.author.name}</span>
        <Badge
          variant="secondary"
          className="rounded-full px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
        >
          {message.author.role}
        </Badge>
        <span className="ml-auto text-[10px] text-muted-foreground">
          {format(new Date(message.sentAt), "MMM d, yyyy 'at' h:mm a")}
        </span>
      </header>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{message.text}</p>
    </article>
  );
}