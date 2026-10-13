"use client";

import { SidebarNav } from "@/components/composite/app-layout/sidebar-nav";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";
import type { SidebarApiItem } from "@/services/handlers/sidebar";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppSidebar({ items }: { items: SidebarApiItem[] }) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const navItems = useNavigation(items).flatMap((section) => section.items);

  return (
    <aside
      aria-label="Primary navigation"
      data-collapsed={collapsed}
      className={cn(
        "hidden md:flex h-full flex-col overflow-hidden rounded-xl border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <SidebarNav items={navItems} />
      </nav>
    </aside>
  );
}
