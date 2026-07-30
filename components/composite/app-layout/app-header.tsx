"use client";

import { Menu } from "lucide-react";

import { NavUser } from "@/components/composite/app-layout/nav-user";
import { Button } from "@/components/ui/button";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppHeader() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);

  return (
    <header className="sticky top-0 z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-white/75 px-4 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-background/80 dark:shadow-none">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <NavUser />
      </div>
    </header>
  );
}
