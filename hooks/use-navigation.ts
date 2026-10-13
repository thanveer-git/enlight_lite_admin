import { buildNavigationFromSidebar } from "@/services/handlers/sidebar-transform";
import type { SidebarApiItem } from "@/services/handlers/sidebar";
import type { Navigation } from "@/types/navigation";

export function useNavigation(items: SidebarApiItem[]): Navigation {
  return buildNavigationFromSidebar(items);
}
