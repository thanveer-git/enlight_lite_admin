import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { PageHeader } from "@/components/composite/page-header";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface SettingsNavItem {
  id: string;
  label: string;
  icon?: LucideIcon;
}

export interface SettingsPageProps {
  breadcrumbs: BreadcrumbItem[];
  title?: string;
  description?: string;
  nav: SettingsNavItem[];
  current: string;
  onSelect?: (id: string) => void;
  content: ReactNode;
  className?: string;
}

export function SettingsPage({
  breadcrumbs,
  title = "Settings",
  description,
  nav,
  current,
  onSelect,
  content,
  className,
}: SettingsPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Breadcrumb items={breadcrumbs} />
      <PageHeader title={title} description={description} />

      <div className="grid gap-6 md:grid-cols-[200px_1fr]">
        <aside aria-label="Settings sections" className="md:sticky md:top-20 md:self-start">
          <ScrollArea className="rounded-lg border bg-card p-2 shadow-soft">
            <nav className="flex flex-col gap-0.5">
              {nav.map((item) => {
                const isActive = item.id === current;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onSelect?.(item.id)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      isActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>
        </aside>

        <div className="flex flex-col gap-4">{content}</div>
      </div>
    </div>
  );
}
