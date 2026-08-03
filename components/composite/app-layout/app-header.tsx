"use client";

import Image from "next/image";
import { Menu } from "lucide-react";

import { NavUser } from "@/components/composite/app-layout/nav-user";
import { Notifications } from "@/components/composite/app-layout/notifications";
import { Button } from "@/components/ui/button";
import { FAKE_SIDEBAR_RESPONSE } from "@/services/handlers/sidebar";
import { useSidebarStore } from "@/stores/sidebar-store";

export function AppHeader() {
  const setMobileOpen = useSidebarStore((s) => s.setMobileOpen);
  const logo = FAKE_SIDEBAR_RESPONSE.data.header.logo;

  return (
    <header className="fixed inset-x-0 top-0 z-sticky flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-white/75 px-4 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:bg-background/80 dark:shadow-none">
      <Image
        src={logo}
        alt="Brand logo"
        width={140}
        height={32}
        unoptimized
        className="h-8 w-auto shrink-0 object-contain"
        priority
      />

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
        <Notifications />
        <NavUser />
      </div>
    </header>
  );
}
