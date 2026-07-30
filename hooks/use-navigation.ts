import { buildNavigationFromSidebar } from "@/services/handlers/sidebar-transform";
import { FAKE_SIDEBAR_RESPONSE } from "@/services/handlers/sidebar";
import type { Navigation } from "@/types/navigation";

export function useNavigation(): Navigation {
  return buildNavigationFromSidebar(FAKE_SIDEBAR_RESPONSE.data.sidebar);
}
