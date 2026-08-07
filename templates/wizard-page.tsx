import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { PageHeader } from "@/components/composite/page-header";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
}

export interface WizardPageProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  steps?: WizardStep[];
  currentStep?: string;
  content?: ReactNode;
  /** When provided, the built-in step rail is skipped in favor of the
   * caller's own (e.g. an embedded wizard that controls its own steps). */
  children?: ReactNode;
  actions?: ReactNode;
  className?: string;
  onStepClick?: (id: string) => void;
  isStepLocked?: (id: string) => boolean;
}

export function WizardPage({
  breadcrumbs,
  title,
  description,
  steps,
  currentStep,
  content,
  children,
  actions,
  className,
  onStepClick,
  isStepLocked,
}: WizardPageProps) {
  const currentIdx = steps ? steps.findIndex((s) => s.id === currentStep) : 0;
  const safeIdx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className={cn("flex min-w-0 flex-col gap-6", className)}>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <PageHeader title={title} description={description} />

      {!children && steps && currentStep && (
        <ol
          aria-label="Wizard steps"
          className="flex w-full items-center gap-2 overflow-x-auto rounded-lg border bg-card p-3 shadow-soft"
        >
          {steps.map((step, idx) => {
          const status = idx < safeIdx ? "done" : idx === safeIdx ? "current" : "upcoming";
          const isLast = idx === steps.length - 1;
          const locked = !!onStepClick && (isStepLocked?.(step.id) ?? false);
          const chip = (
            <>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  status === "done" && "bg-success text-success-foreground",
                  status === "current" && "bg-primary text-primary-foreground",
                  status === "upcoming" && "border bg-background text-muted-foreground",
                )}
                aria-hidden
              >
                {status === "done" ? "✓" : idx + 1}
              </span>
              <span
                className={cn(
                  "truncate text-sm",
                  status === "current" && "font-semibold text-foreground",
                  status === "done" && "font-medium text-foreground",
                  status === "upcoming" && "font-normal text-muted-foreground",
                )}
              >
                {step.title}
              </span>
            </>
          );
          return (
            <li
              key={step.id}
              aria-current={status === "current" ? "step" : undefined}
              className={cn("flex flex-1 items-center gap-3", !isLast && "pr-2")}
            >
              <div className="flex flex-1 items-center gap-3">
                {onStepClick ? (
                  <button
                    type="button"
                    onClick={() => onStepClick(step.id)}
                    disabled={locked}
                    aria-label={`${step.title}${locked ? " (locked)" : ""}`}
                    title={locked ? "Complete earlier steps to unlock" : undefined}
                    className={cn(
                      "flex flex-1 items-center gap-3 rounded-md text-left transition-colors",
                      !locked && "hover:bg-accent/40",
                      locked && "cursor-not-allowed opacity-60",
                    )}
                  >
                    {chip}
                  </button>
                ) : (
                  <div className="flex flex-1 items-center gap-3">{chip}</div>
                )}
              </div>
              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "h-px min-w-[24px] flex-1 border-t",
                    status === "done" ? "border-primary" : "border-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
      )}

      <div className="flex flex-col gap-4">
        {children ? (
          children
        ) : (
          <>
            <div className="space-y-6">{content}</div>
            {actions && (
              <div className="rounded-lg border bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between gap-2">{actions}</div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
