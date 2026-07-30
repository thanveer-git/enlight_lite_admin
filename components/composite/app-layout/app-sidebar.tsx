"use client";

import Image from "next/image";

import { SidebarNav } from "@/components/composite/app-layout/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNavigation } from "@/hooks/use-navigation";
import { cn } from "@/lib/utils";
import { FAKE_SIDEBAR_RESPONSE } from "@/services/handlers/sidebar";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppSidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const navItems = useNavigation().flatMap((section) => section.items);
  const logo = FAKE_SIDEBAR_RESPONSE.data.header.logo;

  return (
    <aside
      aria-label="Primary navigation"
      data-collapsed={collapsed}
      className={cn(
        "dark hidden md:flex h-full flex-col border-r bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center border-b border-sidebar-border px-3",
          collapsed ? "justify-center" : "justify-start",
        )}
      >
        {collapsed ? (
          <Image
            src={logo}
            alt="Brand logo"
            width={28}
            height={28}
            unoptimized
            className="size-7 object-contain"
            priority
          />
        ) : (
          <Image
            src={logo}
            alt="Brand logo"
            width={140}
            height={32}
            unoptimized
            className="h-8 w-auto object-contain"
            priority
          />
        )}
      </div>

      <ScrollArea className="flex-1 px-2 py-3">
        <SidebarNav items={navItems} />
      </ScrollArea>

      <Separator className="bg-sidebar-border" />
    </aside>
  );
}
