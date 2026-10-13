"use client";

import Image from "next/image";

import { SidebarNav } from "@/components/composite/app-layout/sidebar-nav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigation } from "@/hooks/use-navigation";
import type { InitialData } from "@/services/handlers/sidebar";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppSidebarMobile({ data }: { data: InitialData }) {
  const mobileOpen = useSidebarStore((s) => s.mobileOpen);
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const navItems = useNavigation(data.sidebar).flatMap((section) => section.items);
  const logo = data.header.logo;

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <SheetContent side="left" className="dark w-72 bg-sidebar p-0 text-sidebar-foreground">
        <SheetHeader className="flex h-14 flex-row items-center gap-2 border-b border-sidebar-border px-3">
          <Image
            src={logo}
            alt="Brand logo"
            width={140}
            height={32}
            unoptimized
            className="h-8 w-auto object-contain"
            priority
          />
          <SheetTitle className="sr-only">Admin Modern</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-2 py-3">
          <SidebarNav items={navItems} />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
