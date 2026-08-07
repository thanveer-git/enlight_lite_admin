"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/composite/app-layout/app-header";
import { AppSidebar } from "@/components/composite/app-layout/app-sidebar";
import { AppSidebarMobile } from "@/components/composite/app-layout/app-sidebar-mobile";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface AppLayoutProps {
  children: ReactNode;
}

/**
 * Pathname patterns that should render header-only (no sidebar).
 * Detail-style pages get a wider canvas.
 */
const HEADER_ONLY_PATTERNS: RegExp[] = [
  /^\/admin_modern\/submissions\/[^/]+(?:\/.*)?$/,
];

function shouldHideSidebar(pathname: string | null): boolean {
  if (!pathname) return false;
  return HEADER_ONLY_PATTERNS.some((re) => re.test(pathname));
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const hideSidebar = shouldHideSidebar(pathname);

  return (
    <TooltipProvider delayDuration={150}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-tooltip focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-primary-foreground focus:text-sm focus:shadow-soft-lg"
      >
        Skip to content
      </a>
      <div className="flex h-dvh w-full flex-col bg-background">
        <AppHeader />
        <div className="flex min-h-0 min-w-0 flex-1 gap-2 overflow-hidden p-2 pt-16">
          {!hideSidebar && <AppSidebar />}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
            <main id="main" className="min-w-0 flex-1">
              <div
                className={
                  hideSidebar
                    ? "w-full min-w-0 px-4 py-6 sm:px-6 lg:px-8"
                    : "mx-auto w-full min-w-0 max-w-7xl px-4 py-6 sm:px-6 lg:px-8"
                }
              >
                {children}
              </div>
            </main>
          </div>
          {!hideSidebar && <AppSidebarMobile />}
        </div>
      </div>
    </TooltipProvider>
  );
}
