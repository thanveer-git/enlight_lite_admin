"use client";

import { SidebarNav } from "@/components/composite/app-layout/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppSidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const navItems = useNavigation().flatMap((section) => section.items);

  return (
    <aside
      aria-label="Primary navigation"
      data-collapsed={collapsed}
      className={cn(
        "dark hidden md:flex h-full flex-col rounded-xl border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <ScrollArea className="flex-1 px-2 py-3">
        <SidebarNav items={navItems} />
      </ScrollArea>
    </aside>
  );
}
