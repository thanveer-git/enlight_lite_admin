import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "destructive";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center",
        variant === "destructive" && "border-destructive/40 bg-destructive/5",
        className,
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full bg-muted",
            variant === "destructive" && "bg-destructive/10 text-destructive",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </div>
      )}
      <div className="space-y-1">
        <p
          className={cn(
            "font-medium text-sm",
            variant === "destructive" && "text-destructive",
          )}
        >
          {title}
        </p>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="outline" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
