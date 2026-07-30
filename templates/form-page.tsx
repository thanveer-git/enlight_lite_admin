import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { PageHeader } from "@/components/composite/page-header";
import { cn } from "@/lib/utils";

export interface FormPageProps {
  breadcrumbs: BreadcrumbItem[];
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function FormPage({
  breadcrumbs,
  title,
  description,
  actions,
  children,
  className,
}: FormPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Breadcrumb items={breadcrumbs} />
      <PageHeader title={title} description={description} actions={actions} />
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}
