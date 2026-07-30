"use client";

/**
 * Feedback tab — public message thread between evaluator and learner.
 *
 * Renders the selected attempt's `feedback` array as a chat-style list,
 * oldest first. Each message shows the author's name, role, timestamp,
 * and optional attachments (download pills). A composer at the bottom
 * lets the evaluator write a new message.
 */
import { useState } from "react";
import { format } from "date-fns";
import { Download, Paperclip, Send } from "lucide-react";

import { EmptyState } from "@/components/composite/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { AttemptRecord, SubmissionMessage } from "../types";

interface FeedbackTabProps {
  attempts: AttemptRecord[];
  initialAttemptNumber: number;
}

export function FeedbackTab({ attempts, initialAttemptNumber }: FeedbackTabProps) {
  const initialAttempt =
    attempts.find((a) => a.attemptNumber === initialAttemptNumber) ?? attempts[0];
  const [draft, setDraft] = useState("");

  if (!initialAttempt) {
    return (
      <EmptyState
        title="No submission yet"
        description="The learner has not submitted work for this assignment."
      />
    );
  }

  const messages = initialAttempt.feedback;

  return (
    <div className="flex flex-col gap-4">
      {messages.length === 0 ? (
        <EmptyState
          title="No feedback yet"
          description="Messages from the evaluator and learner will appear here."
        />
      ) : (
        messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
      )}

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
              }
            }}
            placeholder="Add a comment, or attach a rubric…"
            rows={1}
            className="min-h-[2rem] flex-1 resize-none border-0 bg-transparent px-1 py-1 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button
            type="button"
            size="icon"
            aria-label="Send feedback"
            title="Send feedback"
            className="size-8 shrink-0 rounded-full"
            disabled={!draft.trim()}
          >
            <Send className="size-4" aria-hidden />
          </Button>
        </div>
        <p className="px-2 text-[10px] text-muted-foreground">
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[9px] text-foreground">
            Enter
          </kbd>{" "}
          for a new line
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: SubmissionMessage }) {
  const isEvaluator = message.author.role === "instructor";
  const initials = message.author.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex gap-3",
        isEvaluator ? "flex-row" : "flex-row-reverse",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
          isEvaluator
            ? "bg-primary/10 text-primary"
            : "bg-muted text-foreground",
        )}
        aria-hidden
      >
        {initials}
      </div>
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1.5 rounded-2xl border border-border/60 px-4 py-3",
          isEvaluator
            ? "rounded-tl-sm bg-muted/20"
            : "rounded-tr-sm bg-primary/5",
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            {message.author.name}
          </span>
          <Badge
            variant="secondary"
            className="rounded-full px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider"
          >
            {message.author.role}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.sentAt), "MMM d, yyyy 'at' h:mm a")}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{message.text}</p>
        {message.attachments && message.attachments.length > 0 && (
          <ul className="flex flex-wrap items-center gap-2 pt-1">
            {message.attachments.map((file) => (
              <li key={file.name}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="inline-flex items-center gap-1.5 rounded-md border bg-background/60 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-background"
                  title={`Download ${file.name}`}
                  aria-label={`Download ${file.name}`}
                >
                  <Download className="size-3.5 text-muted-foreground" aria-hidden />
                  <span className="max-w-[14rem] truncate">{file.name}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
