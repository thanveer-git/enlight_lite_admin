"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Search } from "lucide-react";

import { DataTable } from "@/components/composite/data-table/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { queryKeys } from "@/lib/query-keys";
import { useDebounce } from "@/hooks/use-debounce";
import { apiClient } from "@/services/api-client";
import { ListingPage } from "@/templates/listing-page";
import { toast } from "sonner";
import type { User } from "@/types/session";

const columns: ColumnDef<User>[] = [
  { accessorKey: "id", header: "ID", cell: (c) => <span className="font-mono text-xs">{c.getValue() as string}</span> },
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

export default function ListingsDemo() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<string>("all");
  const debounced = useDebounce(search, 250);

  const q = useQuery({
    queryKey: queryKeys.users.list({ search: debounced, role }),
    queryFn: () =>
      apiClient.listUsers({
        search: debounced,
        role: role === "all" ? undefined : (role as User["role"]),
        pageSize: 50,
      }),
  });

  const toolbarNode = useMemo(
    () => (
      <div className="flex w-full flex-wrap items-center gap-2 sm:max-w-md">
        <div className="relative w-full sm:flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger className="h-9 w-[140px]">
            <SelectValue placeholder="All roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="instructor">Instructor</SelectItem>
            <SelectItem value="student">Student</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    [search, role],
  );

  return (
    <ListingPage
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Listings" },
      ]}
      title="Users"
      description="Listing page demo — search filters the in-memory store with debounced input."
      actions={
        <Button
          size="sm"
          onClick={() => toast.success("User invited", { description: "(demo toast)" })}
        >
          <Plus className="mr-1.5 size-4" />
          Invite
        </Button>
      }
      toolbar={toolbarNode}
    >
      <DataTable
        columns={columns}
        data={q.data?.data ?? []}
        isLoading={q.isLoading}
        isError={q.isError}
        onRetry={() => q.refetch()}
        emptyTitle="No matching users"
        emptyDescription="Try a different search."
      />
    </ListingPage>
  );
}