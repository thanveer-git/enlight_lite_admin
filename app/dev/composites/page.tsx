"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Inbox, Plus, Search } from "lucide-react";

import { FileText, MessageSquare, Upload } from "lucide-react";

import { AppLayout } from "@/components/composite/app-layout/app-layout";
import { Breadcrumb } from "@/components/composite/breadcrumb";
import { DataTable } from "@/components/composite/data-table/data-table";
import { ECard } from "@/components/composite/e-card";
import { EmptyState } from "@/components/composite/empty-state";
import { FormSection } from "@/components/composite/form-section";
import { PageHeader } from "@/components/composite/page-header";
import { Toolbar } from "@/components/composite/toolbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/services/api-client";
import type { User } from "@/types/session";

const userColumns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID", cell: (c) => <span className="font-mono text-xs">{c.getValue() as string}</span> },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email", cell: (c) => <span className="text-muted-foreground">{c.getValue() as string}</span> },
  {
    accessorKey: "role",
    header: "Role",
    cell: (c) => {
      const r = c.getValue() as User["role"];
      const variant = r === "admin" ? "default" : r === "instructor" ? "secondary" : "outline";
      return <Badge variant={variant as never}>{r}</Badge>;
    },
  },
];

export default function CompositesPage() {
  const [search, setSearch] = useState("");

  const q = useQuery({
    queryKey: queryKeys.users.list({ page: 1, pageSize: 8 }),
    queryFn: () => apiClient.listUsers({ page: 1, pageSize: 8 }),
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: "Dev", href: "/dev" }, { label: "Composites" }]} />
        <PageHeader
          title="Composites"
          description="AppLayout, Breadcrumb, PageHeader, Toolbar, DataTable, EmptyState, FormSection, Pagination."
        />

        {/* PageHeader / Breadcrumb / Toolbar demo */}
        <Card>
          <CardHeader>
            <CardTitle>Page chrome</CardTitle>
            <CardDescription>PageHeader with actions, Breadcrumb above, Toolbar below.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Toolbar
              search={
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search users…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              }
              filters={
                <>
                  <Badge variant="secondary">Filter: role</Badge>
                  <Badge variant="secondary">Filter: status</Badge>
                </>
              }
              actions={
                <Button size="sm">
                  <Plus className="mr-1.5 size-4" />
                  New
                </Button>
              }
            />
          </CardContent>
        </Card>

        {/* DataTable demo */}
        <Card>
          <CardHeader>
            <CardTitle>DataTable</CardTitle>
            <CardDescription>
              Sortable headers, selectable rows, bulk-action bar, paginated footer. Try selecting rows.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={userColumns}
              data={q.data?.data ?? []}
              isLoading={q.isLoading}
              isError={q.isError}
              onRetry={() => q.refetch()}
              emptyTitle="No users"
              emptyDescription="Try adjusting your search or filters."
            />
          </CardContent>
        </Card>

        {/* EmptyState demo */}
        <Card>
          <CardHeader>
            <CardTitle>EmptyState</CardTitle>
            <CardDescription>Two variants — default and destructive.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <EmptyState
              icon={Inbox}
              title="Nothing here yet"
              description="Add your first item to get started."
              action={{ label: "Add item", onClick: () => {} }}
            />
            <EmptyState
              variant="destructive"
              icon={Inbox}
              title="Couldn't load data"
              description="Check your connection and try again."
              action={{ label: "Retry", onClick: () => {} }}
            />
          </CardContent>
        </Card>

        {/* FormSection demo */}
        <FormSection
          title="Profile"
          description="Update how your name appears across the workspace."
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button>Save changes</Button>
            </div>
          }
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Display name</Label>
            <Input id="name" placeholder="Your name" defaultValue="Aarav Sharma" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
        </FormSection>

        {/* ECard demo */}
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">ECard</h2>
            <p className="text-sm text-muted-foreground">
              Slot-based layout primitive. Outer container, dividers, and
              padding are owned by ECard — sections accept arbitrary children.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* 1. Standard variant */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                1. Standard
              </p>
              <ECard>
                <ECard.Header>
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <FileText className="size-4" aria-hidden />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold leading-none">Card Header</p>
                      <p className="text-sm text-muted-foreground">
                        This is an optional header. You can place any content here.
                      </p>
                    </div>
                  </div>
                </ECard.Header>
                <ECard.Body>
                  <p className="font-semibold leading-none">Card Body</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is the main content area.
                    <br />
                    Add any components, text, tables, forms, charts, or custom content here.
                  </p>
                </ECard.Body>
                <ECard.Footer>
                  <p className="font-semibold leading-none">Card Footer</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is an optional footer section. Add any content here.
                  </p>
                </ECard.Footer>
              </ECard>
            </div>

            {/* 2. Tabs variant */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                2. Tabs
              </p>
              <ECard variant="tabs">
                <ECard.Header>
                  <Tabs defaultValue="description">
                    <TabsList className="bg-transparent p-0">
                      <TabsTrigger
                        value="description"
                        className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        <FileText className="size-4" aria-hidden />
                        Assignment Description
                      </TabsTrigger>
                      <TabsTrigger
                        value="submission"
                        className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        <Upload className="size-4" aria-hidden />
                        Submission
                      </TabsTrigger>
                      <TabsTrigger
                        value="feedback"
                        className="relative gap-2 rounded-none border-b-2 border-transparent bg-transparent px-3 py-3 shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
                      >
                        <MessageSquare className="size-4" aria-hidden />
                        Assignment Feedback
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5">
                          0
                        </Badge>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </ECard.Header>
                <ECard.Body>
                  <p className="font-semibold leading-none">Card Body</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is the main content area for the selected tab.
                    <br />
                    Add any components, text, tables, forms, charts, or custom content here.
                  </p>
                </ECard.Body>
                <ECard.Footer>
                  <p className="font-semibold leading-none">Card Footer</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    This is an optional footer section.
                  </p>
                </ECard.Footer>
              </ECard>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
