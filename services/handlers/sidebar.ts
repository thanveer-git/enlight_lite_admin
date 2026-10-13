export interface SidebarProfile {
  id: string;
  us_name: string;
  us_email: string;
  us_image: string;
}

export interface SidebarHeader {
  fav_icon: string;
  logo: string;
  base_url: string;
  site_url: string;
  help_url: string;
  message_url: string;
  notification_url: string;
  profile_url: string;
  subscription_url: string;
  logout_url: string;
  account_settings_url: string;
  live_site_url: string;
  zendesk_script_url: string;
  appcues_script_url: string;
  analytics_script: string;
  scripts: string;
  all_product_url: string;
  acct_enterprise: string;
}

export interface SidebarProduct {
  id: string;
  url: string;
  name: string;
  logo: string;
  offer: string;
}

export interface SidebarApiItem {
  label: string;
  link?: string;
  code?: string;
  type: "item" | "group";
  isReact?: boolean;
  isDynamic?: boolean;
  icon?: string;
  children?: SidebarApiItem[];
}

export interface InitialData {
  product: SidebarProduct | Record<string, never>;
  products: SidebarProduct[];
  profile: SidebarProfile;
  header: SidebarHeader;
  sidebar: SidebarApiItem[];
}

export interface InitialDataResponse {
  message: string;
  status: boolean;
  status_code: number;
  data: InitialData;
}
