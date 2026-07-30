"use client";

import { useQuery } from "@tanstack/react-query";

import { ThemeToggle } from "@/components/composite/app-layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/hooks/use-session";
import { queryKeys } from "@/lib/query-keys";
import { apiClient } from "@/services/api-client";

export default function ProvidersPage() {
  const { user } = useSession();

  const usersQuery = useQuery({
    queryKey: queryKeys.users.list({ page: 1, pageSize: 5 }),
    queryFn: () => apiClient.listUsers({ page: 1, pageSize: 5 }),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-12">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-muted-foreground text-sm">Phase 3 — Providers & Services</p>
          <h1 className="font-semibold text-3xl tracking-tight">Providers verification</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
            Theme, TanStack Query, and Session contexts all wired. The query below resolves from
            the in-memory services stub with a simulated 250ms latency.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Session
              <Badge variant="success">OK</Badge>
            </CardTitle>
            <CardDescription>useSession() reads from SessionContext</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">id:</span>{" "}
              <span className="font-mono">{user.id}</span>
            </p>
            <p>
              <span className="text-muted-foreground">name:</span> {user.name}
            </p>
            <p>
              <span className="text-muted-foreground">email:</span>{" "}
              <span className="font-mono">{user.email}</span>
            </p>
            <p>
              <span className="text-muted-foreground">role:</span>{" "}
              <Badge variant="outline">{user.role}</Badge>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Query: users.list
              <Badge variant={usersQuery.isLoading ? "warning" : usersQuery.isError ? "destructive" : "success"}>
                {usersQuery.isLoading ? "loading" : usersQuery.isError ? "error" : "success"}
              </Badge>
            </CardTitle>
            <CardDescription>TanStack Query → services/api-client → in-memory store</CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : usersQuery.isError ? (
              <p className="text-destructive text-sm">Failed to load users.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {usersQuery.data?.data.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3">
                    <span>{u.name}</span>
                    <Badge variant="secondary">{u.role}</Badge>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted-foreground mt-3 text-xs">
              total: {usersQuery.data?.total ?? "—"} · page: {usersQuery.data?.page ?? "—"} ·{" "}
              pageSize: {usersQuery.data?.pageSize ?? "—"}
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
