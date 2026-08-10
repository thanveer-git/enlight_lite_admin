"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, GraduationCap, ListChecks, Users } from "lucide-react";

import { DataTable } from "@/components/composite/data-table/data-table";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EDatetimpicker } from "@/components/ui/edatetimpicker";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/services/api-client";
import { DashboardPage, type DashboardStat } from "@/templates/dashboard-page";
import type { User } from "@/types/session";

const stats: DashboardStat[] = [
  { label: "Users", value: 1248, delta: { value: "+12 this week", direction: "up" }, icon: Users },
  { label: "Courses", value: 32, delta: { value: "+2 this month", direction: "up" }, icon: BookOpen },
  { label: "Assessments", value: 184, delta: { value: "+5", direction: "up" }, icon: ListChecks },
  { label: "Certificates", value: 906, delta: { value: "−1", direction: "down" }, icon: GraduationCap },
];

const recentColumns: ColumnDef<User>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "email", header: "Email", cell: (c) => <span className="text-muted-foreground">{c.getValue() as string}</span> },
  {
    accessorKey: "role",
    header: "Role",
    cell: (c) => {
      const r = c.getValue() as User["role"];
      return <Badge variant={r === "admin" ? "default" : r === "instructor" ? "secondary" : "outline"}>{r}</Badge>;
    },
  },
];

export default function AdminDashboard() {
  const q = useQuery({
    queryKey: queryKeys.users.list({ page: 1, pageSize: 5 }),
    queryFn: () => apiClient.listUsers({ page: 1, pageSize: 5 }),
  });

  const [schedule, setSchedule] = useState<Date | undefined>();

  return (
    <DashboardPage
      stats={stats}
      quickActions={
        <Button size="sm">
          <Users className="mr-1.5 size-4" />
          Invite user
        </Button>
      }
      recent={
        <DataTable
          columns={recentColumns}
          data={q.data?.data ?? []}
          isLoading={q.isLoading}
          isError={q.isError}
          onRetry={() => q.refetch()}
          emptyTitle="No users yet"
          emptyDescription="Invite your first user to see them here."
        />
      }
    >
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Quick start
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span>Create a course</span>
            <Button variant="outline" size="sm">
              Start
            </Button>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Import students</span>
            <Button variant="outline" size="sm">
              Upload CSV
            </Button>
          </li>
          <li className="flex items-center justify-between gap-2">
            <span>Generate reports</span>
            <Button variant="outline" size="sm">
              Open
            </Button>
          </li>
        </ul>
      </div>

      <div className="space-y-3 border-t pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          EDatetimpicker
        </p>
        <EDatetimpicker
          value={schedule}
          onChange={setSchedule}
          placeholder="Schedule a date and time"
          hourFormat={12}
          timeInterval={15}
        />
        <p className="text-xs text-muted-foreground">
          {schedule ? schedule.toLocaleString() : "Nothing selected yet"}
        </p>
      </div>
    </DashboardPage>
  );
}
