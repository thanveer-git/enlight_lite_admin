"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/stores/sidebar-store";
import type { NavItem, NavSubItem } from "@/types/navigation";

export interface SidebarNavProps {
  items: NavItem[];
}

function isSubItemActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const collapsed = useSidebarStore((s) => s.collapsed);

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive =
          isSubItemActive(pathname, item.href) ||
          (item.subItems?.some((s) => isSubItemActive(pathname, s.href)) ?? false);

        if (item.subItems && item.subItems.length > 0) {
          return (
            <NavItemWithSubItems
              key={item.href}
              item={item}
              isActive={isActive}
              collapsed={collapsed}
              pathname={pathname}
            />
          );
        }

        const link = (
          <Link
            href={item.disabled ? "#" : item.href}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={item.disabled}
            tabIndex={item.disabled ? -1 : 0}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
              item.disabled && "opacity-50 pointer-events-none",
              collapsed && "justify-center",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            {!collapsed && <span className="truncate">{item.title}</span>}
            {!collapsed && item.badge !== undefined && (
              <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {item.badge}
              </span>
            )}
          </Link>
        );

        if (collapsed) {
          return (
            <li key={item.href}>
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.title}</TooltipContent>
              </Tooltip>
            </li>
          );
        }

        return <li key={item.href}>{link}</li>;
      })}
    </ul>
  );
}

interface NavItemWithSubItemsProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  pathname: string | null;
}

function NavItemWithSubItems({
  item,
  isActive,
  collapsed,
  pathname,
}: NavItemWithSubItemsProps) {
  const [open, setOpen] = useState<boolean>(isActive);

  useEffect(() => {
    setOpen(isActive);
  }, [isActive]);

  const parent = (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-expanded={open}
      aria-disabled={item.disabled}
      disabled={item.disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors",
        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
        isActive &&
          "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
        item.disabled && "opacity-50 pointer-events-none",
        collapsed && "justify-center",
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.title}</span>}
      {!collapsed && (
        <ChevronRight
          className={cn(
            "ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-90",
          )}
          aria-hidden
        />
      )}
    </button>
  );

  return (
    <li>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{parent}</TooltipTrigger>
          <TooltipContent side="right">{item.title}</TooltipContent>
        </Tooltip>
      ) : (
        parent
      )}
      {!collapsed && (
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-in-out",
            open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
          aria-hidden={!open}
        >
          <ul className="mt-0.5 flex min-h-0 flex-col gap-0.5 overflow-hidden pl-6">
            {item.subItems!.map((sub) => (
              <SubNavItem
                key={sub.href}
                sub={sub}
                active={isSubItemActive(pathname, sub.href)}
              />
            ))}
          </ul>
        </div>
      )}
    </li>
  );
}

function SubNavItem({
  sub,
  active,
}: {
  sub: NavSubItem;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={sub.disabled ? "#" : sub.href}
        aria-current={active ? "page" : undefined}
        aria-disabled={sub.disabled}
        tabIndex={sub.disabled ? -1 : 0}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
          "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          active && "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          sub.disabled && "opacity-50 pointer-events-none",
        )}
      >
        {sub.icon ? <sub.icon className="size-3.5 shrink-0" aria-hidden /> : null}
        <span className="truncate">{sub.title}</span>
      </Link>
    </li>
  );
}
