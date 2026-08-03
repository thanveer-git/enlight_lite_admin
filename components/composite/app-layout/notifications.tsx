"use client";

import { useMemo, useState } from "react";
import { Bell, Check } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

type NotificationKind = "submission" | "rubric" | "mention" | "system";

type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  preview: string;
  actor: { name: string; avatar?: string };
  timestamp: string;
  read: boolean;
};

const SEED: NotificationItem[] = [
  {
    id: "n1",
    kind: "submission",
    title: "New submission graded",
    preview: "Avery Chen submitted Essay 2 — auto-graded B+.",
    actor: { name: "Avery Chen" },
    timestamp: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    kind: "mention",
    title: "You were mentioned",
    preview: "@you can you double-check the rubric on Q3?",
    actor: { name: "Priya Raman" },
    timestamp: "18 min ago",
    read: false,
  },
  {
    id: "n3",
    kind: "rubric",
    title: "Rubric published",
    preview: "Midterm Essay v3 is now live for 2 sections.",
    actor: { name: "Jordan Park" },
    timestamp: "1 h ago",
    read: false,
  },
  {
    id: "n4",
    kind: "submission",
    title: "Late submission received",
    preview: "Maya Patel turned in Lab 4 (12 min past deadline).",
    actor: { name: "Maya Patel" },
    timestamp: "3 h ago",
    read: true,
  },
  {
    id: "n5",
    kind: "system",
    title: "Weekly report ready",
    preview: "Your class performance digest is available.",
    actor: { name: "System" },
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "n6",
    kind: "submission",
    title: "Regrade requested",
    preview: "Noah Kim asked to review the Q2 score.",
    actor: { name: "Noah Kim" },
    timestamp: "2 d ago",
    read: true,
  },
];

const FILTERS: { key: "all" | "unread" | NotificationKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
];

function formatRelative(ts: string) {
  return ts;
}

export function Notifications() {
  const [items, setItems] = useState<NotificationItem[]>(SEED);
  const [filter, setFilter] = useState<"all" | "unread" | NotificationKind>("all");
  const [open, setOpen] = useState(false);

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const visible = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "unread") return items.filter((i) => !i.read);
    return items.filter((i) => i.kind === filter);
  }, [items, filter]);

  const markAllRead = () => setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  const toggleRead = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: !i.read } : i)));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
          className="relative"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-semibold leading-none text-destructive-foreground ring-2 ring-background">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-[380px] p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="mr-1 size-3.5" />
            Mark all read
          </Button>
        </div>

        <div className="flex items-center gap-1 px-3 pb-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Separator />

        <ScrollArea className="h-[380px]">
          {visible.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full bg-muted">
                <Bell className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">You're all caught up</p>
              <p className="text-xs text-muted-foreground">
                New notifications will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border/60">
              {visible.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => toggleRead(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50",
                      !n.read && "bg-primary/5 hover:bg-primary/10"
                    )}
                  >
                    <Avatar className="size-9 shrink-0">
                      {n.actor.avatar ? (
                        <AvatarImage src={n.actor.avatar} alt={n.actor.name} />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {n.actor.name === "System" ? "SY" : initials(n.actor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm",
                            !n.read ? "font-semibold" : "font-medium text-foreground/80"
                          )}
                        >
                          {n.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {formatRelative(n.timestamp)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.preview}
                      </p>
                    </div>
                    {!n.read && (
                      <span
                        className="mt-1.5 size-2 shrink-0 rounded-full bg-primary"
                        aria-label="Unread"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <Separator />
        <div className="px-2 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center text-xs"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
