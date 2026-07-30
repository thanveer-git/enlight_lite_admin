import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { PageHeader } from "@/components/composite/page-header";
import { Toolbar } from "@/components/composite/toolbar";
import { cn } from "@/lib/utils";

export interface ListingPageProps {
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  toolbarFilters?: ReactNode;
  toolbarExtras?: ReactNode;
  /** Optional KPI cards rendered above the toolbar. */
  kpis?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ListingPage({
  breadcrumbs,
  title,
  description,
  actions,
  toolbar,
  toolbarFilters,
  toolbarExtras,
  kpis,
  children,
  className,
}: ListingPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      <PageHeader title={title} description={description} actions={actions} />
      {kpis}
      {(toolbar || toolbarFilters || toolbarExtras) && (
        <Toolbar search={toolbar} filters={toolbarFilters} actions={toolbarExtras} />
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}