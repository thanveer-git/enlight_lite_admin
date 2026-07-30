import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { PageHeader } from "@/components/composite/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DashboardStat {
  label: string;
  value: string | number;
  delta?: { value: string; direction: "up" | "down" | "flat" };
  icon?: LucideIcon;
}

export interface DashboardPageProps {
  breadcrumbs?: BreadcrumbItem[];
  title?: string;
  description?: string;
  stats?: DashboardStat[];
  recent?: ReactNode;
  quickActions?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function DashboardPage({
  breadcrumbs = [{ label: "Dashboard" }],
  title = "Dashboard",
  description,
  stats = [],
  recent,
  quickActions,
  className,
  children,
}: DashboardPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Breadcrumb items={breadcrumbs} />
      <PageHeader title={title} description={description} actions={quickActions} />

      {stats.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="shadow-soft">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  {stat.icon && <stat.icon className="size-4 text-muted-foreground" aria-hidden />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold tabular-nums">{stat.value}</div>
                {stat.delta && (
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      stat.delta.direction === "up" && "text-success",
                      stat.delta.direction === "down" && "text-destructive",
                      stat.delta.direction === "flat" && "text-muted-foreground",
                    )}
                  >
                    {stat.delta.direction === "up" && "↑ "}
                    {stat.delta.direction === "down" && "↓ "}
                    {stat.delta.value}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {recent && (
          <Card className="shadow-soft lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>{recent}</CardContent>
          </Card>
        )}
        {children && (
          <Card className="shadow-soft">
            <CardContent className="pt-6">{children}</CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
