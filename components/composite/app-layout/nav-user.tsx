"use client";

import { Monitor, Moon, Sun, ChevronDown, LogOut } from "lucide-react";
import { useTheme } from "next-themes";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import type { SidebarProfile } from "@/services/handlers/sidebar";

export function NavUser({ profile, logoutUrl }: { profile: SidebarProfile; logoutUrl: string }) {
  const { setTheme, theme } = useTheme();
  const user = {
    name: profile.us_name,
    email: profile.us_email,
    image: profile.us_image,
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2"
          aria-label="Open profile menu"
        >
          <Avatar className="size-7">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden truncate text-sm font-medium sm:inline-block">
            {user.name}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground break-all">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 size-4 dark:hidden" />
            <Moon className="mr-2 size-4 hidden dark:block" />
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setTheme("light")}
                aria-selected={theme === "light"}
              >
                <Sun className="mr-2 size-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("dark")}
                aria-selected={theme === "dark"}
              >
                <Moon className="mr-2 size-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme("system")}
                aria-selected={theme === "system"}
              >
                <Monitor className="mr-2 size-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-destructive focus:text-destructive">
          <a href={logoutUrl}>
            <LogOut className="mr-2 size-4" />
            Sign out
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
