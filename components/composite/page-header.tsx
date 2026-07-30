import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  /** String title (rendered inside an `<h1>`) or a custom node for richer
   * headers (e.g. title with a leading back-arrow). */
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="space-y-1.5">
        {typeof title === "string" ? (
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px] sm:leading-[1.2]">
            {title}
          </h1>
        ) : (
          title
        )}
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}