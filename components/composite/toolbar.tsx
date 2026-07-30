import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface ToolbarProps {
  search?: ReactNode;
  filters?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Toolbar({ search, filters, actions, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {search && <div className="w-full sm:max-w-sm">{search}</div>}
        {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
