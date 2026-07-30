"use client";

/**
 * Two-column shell for the evaluation page (document §4.3).
 *
 *   - Left: submission overview + 3 tabs (description, submission,
 *           feedback). Scrolls with the page.
 *   - Right: sticky grading console with 3 tabs (assessment, internal
 *           feedback, access window). Pins below the global app header
 *           (`top-20` = app header h-14 + breathing room) and owns its
 *           own vertical scroll so the Save button stays reachable no
 *           matter how long the rubric gets.
 *
 * Nested scroll contract:
 *   - Wheel events over the right panel scroll only the panel.
 *   - Once the panel reaches its top or bottom, the same gesture
 *     continues into the page (native scroll chaining) — no dead
 *     scroll at the panel boundary.
 *   - Wheel events outside the panel scroll the page normally.
 */
import type { ReactNode } from "react";

import { Breadcrumb, type BreadcrumbItem } from "@/components/composite/breadcrumb";
import { ECard } from "@/components/composite/e-card";
import { PageHeader } from "@/components/composite/page-header";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface LeftTab {
  id: string;
  label: string;
  icon: ReactNode;
  count?: number;
  content: ReactNode;
}

export interface EvaluationDetailPageProps {
  breadcrumbs?: BreadcrumbItem[];
  /** String title (rendered inside `<PageHeader>`) or a custom node for
   * richer headers (e.g. title with a leading back-arrow). */
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Rendered above the left tabs — typically the overview card. */
  overview: ReactNode;
  leftTabs: LeftTab[];
  rightTabs: { id: string; label: string; content: ReactNode }[];
  /**
   * Optional content rendered as one or more sibling cards directly
   * below the right-column tabbed card. Used by the Evaluation tab to
   * keep "How this was calculated" as its own card while leaving the
   * tabbed card focused on the grading inputs.
   */
  belowRightTabs?: ReactNode;
  defaultLeftTab?: string;
  defaultRightTab?: string;
  className?: string;
}

export function EvaluationDetailPage({
  breadcrumbs,
  title,
  description,
  actions,
  overview,
  leftTabs,
  rightTabs,
  belowRightTabs,
  defaultLeftTab,
  defaultRightTab,
  className,
}: EvaluationDetailPageProps) {
  const safeLeft = leftTabs.length > 0 ? leftTabs : [];
  const safeRight = rightTabs.length > 0 ? rightTabs : [];
  const initialLeft = defaultLeftTab ?? safeLeft[0]!.id;
  const initialRight = defaultRightTab ?? safeRight[0]!.id;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && <Breadcrumb items={breadcrumbs} />}
      <PageHeader title={title} description={description} actions={actions} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_28rem] lg:items-start">
        {/* Left column */}
        <div className="flex min-w-0 flex-col gap-4">
          {overview}
          <ECard variant="tabs" className="rounded-2xl border-border/60 shadow-soft">
            <Tabs defaultValue={initialLeft} className="w-full">
              <ECard.Header className="border-b border-border/60 px-4 py-2">
                <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0 shadow-none">
                  {safeLeft.map((tab) => (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="relative flex items-center gap-2 rounded-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                    >
                      <span className="inline-flex items-center gap-2">
                        {tab.icon}
                        {tab.label}
                      </span>
                      {tab.count != null && (
                        <Badge
                          variant="secondary"
                          className="rounded-full px-1.5 py-0 text-[10px] font-semibold"
                        >
                          {tab.count}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ECard.Header>
              <ECard.Body className="px-4 py-4">
                {safeLeft.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="mt-0">
                    {tab.content}
                  </TabsContent>
                ))}
              </ECard.Body>
            </Tabs>
          </ECard>
        </div>

        {/* Right column: sticky, independently-scrollable grading console.
            - `md:sticky md:top-20 md:self-start` keeps it pinned below the
              global app header (`h-14`) plus breathing room.
            - `md:max-h-[calc(100dvh-5rem)]` + `md:overflow-y-auto` give the
              panel its own scroll context.
            - Native scroll chaining is preserved (no `overscroll-contain`):
              the panel scrolls first; once it hits its top or bottom, the
              same gesture continues into the page with no dead scroll.
            - Mobile keeps the natural document flow (no sticky / no max
              height) so the right column scrolls with the page. */}
        <aside className="flex flex-col gap-4 md:sticky md:top-20 md:max-h-[calc(100dvh-5rem)] md:self-start md:overflow-y-auto md:pe-1">
          <ECard variant="tabs" className="rounded-2xl border-border/60 shadow-soft">
            {safeRight.length > 0 ? (
              <Tabs defaultValue={initialRight} className="w-full">
                <ECard.Header className="border-b border-border/60 px-4 py-2">
                  <TabsList className="flex h-auto w-full justify-start gap-6 rounded-none bg-transparent p-0 shadow-none">
                    {safeRight.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="relative flex items-center gap-2 rounded-none bg-transparent px-1 pb-2 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-[-1px] data-[state=active]:after:h-0.5 data-[state=active]:after:rounded-full data-[state=active]:after:bg-primary"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </ECard.Header>
                <ECard.Body className="px-4 py-4">
                  {safeRight.map((tab) => (
                    <TabsContent key={tab.id} value={tab.id} className="mt-0">
                      {tab.content}
                    </TabsContent>
                  ))}
                </ECard.Body>
              </Tabs>
            ) : (
              <ECard.Body className="px-4 py-4 text-sm text-muted-foreground">
                No content.
              </ECard.Body>
            )}
          </ECard>
          {belowRightTabs}
        </aside>
      </div>
    </div>
  );
}
