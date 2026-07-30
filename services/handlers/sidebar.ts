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

export interface SidebarApiResponse {
  message: string;
  status: boolean;
  status_code: number;
  data: {
    product: SidebarProduct[];
    products: SidebarProduct[];
    profile: SidebarProfile;
    header: SidebarHeader;
    sidebar: SidebarApiItem[];
  };
}

export const FAKE_SIDEBAR_RESPONSE: SidebarApiResponse = {
  message: "Success",
  status: true,
  status_code: 200,
  data: {
    product: [],
    products: [
      {
        id: "1",
        url: "https://local.edubex.com/dashboard",
        name: "Lifology",
        logo: "https://idp-enfin.enfinlabs.com/dashboard/enlightify.png",
        offer: "",
      },
    ],
    profile: {
      id: "1",
      us_name: "ABV Administrator",
      us_email: "akhil.c+admin@enfintechnologies.com",
      us_image:
        "https://dfl6wqqw7vd9p.cloudfront.net/uploads/local.edubex.com/items_org/user/1.jpg?v=314",
    },
    header: {
      fav_icon:
        "https://dfl6wqqw7vd9p.cloudfront.net/uploads/local.edubex.com/items_org/favicon.png?v=1.0.0_enlightify",
      logo: "https://dfl6wqqw7vd9p.cloudfront.net/uploads/local.edubex.com/items_org/logo/20001.webp?v=259",
      base_url: "https://local.edubex.com/",
      site_url: "https://local.edubex.com/",
      help_url: "#",
      message_url: "https://local.edubex.com/admin/messages/",
      notification_url: "https://local.edubex.com/admin/dashboard/notifications/",
      profile_url: "https://local.edubex.com/admin/profile/",
      subscription_url: "https://local.edubex.com/admin/dashboard/cb_account/",
      logout_url: "https://local.edubex.com/logout",
      account_settings_url: "https://local.idpedubex.com?login=123",
      live_site_url: "https://local.edubex.com/admin/user/admin_as_user/1/",
      zendesk_script_url:
        "https://static.zdassets.com/ekr/snippet.js?key=44dd05a4-ee1b-4fc8-8395-550ead2fa1d6",
      appcues_script_url: "https://fast.appcues.com/84246.js",
      analytics_script:
        "https://dfl6wqqw7vd9p.cloudfront.net/assets/js/feature_analytics.js?v=1784625770",
      scripts: "",
      all_product_url: "https://local.idpedubex.com/dashboard/mysubscription",
      acct_enterprise: "0",
    },
    sidebar: [
      {
        label: "Dashboard",
        link: "https://local.edubex.com/admin/dashboard/",
        code: "dashboard",
        type: "item",
        isReact: false,
        isDynamic: false,
      },
      {
        label: "Products",
        code: "products",
        type: "item",
        isReact: false,
        isDynamic: false,
        children: [
          {
            label: "Courses",
            link: "https://local.edubex.com/admin/course/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Bundles",
            link: "https://local.edubex.com/admin/bundle/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Live Classes",
            link: "https://local.edubex.com/admin/live/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
        ],
      },
      {
        label: "Question Pool",
        link: "https://local.edubex.com/admin/generate_test/",
        code: "questionpool",
        type: "item",
        isReact: false,
        isDynamic: false,
      },
      {
        label: "Marketing",
        code: "marketing",
        type: "item",
        isReact: false,
        isDynamic: false,
        children: [
          {
            label: "Send Notifications",
            link: "https://local.edubex.com/admin/messenger/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Flash Messages",
            link: "https://local.edubex.com/admin/notification/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Discount coupons",
            link: "https://local.edubex.com/admin/promo_code/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Email Templates",
            link: "https://local.edubex.com/admin/email_template/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
        ],
      },
      {
        label: "Users",
        code: "users",
        type: "item",
        isReact: false,
        isDynamic: false,
        children: [
          {
            label: "Learners",
            link: "https://local.edubex.com/admin/user/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Facilitator",
            link: "https://local.edubex.com/admin/faculties/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Role Management",
            link: "https://local.edubex.com/admin/role/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
        ],
      },
      {
        label: "Manage",
        code: "manage",
        type: "item",
        isReact: false,
        isDynamic: false,
        children: [
          {
            label: "Branch",
            link: "https://local.edubex.com/admin/institutes/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Batches",
            link: "https://local.edubex.com/admin/groups/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
        ],
      },
      {
        label: "Reports",
        link: "https://local.edubex.com/admin/enlightify/v2/reports/",
        code: "reports",
        type: "item",
        isReact: false,
        isDynamic: false,
      },
      {
        label: "Website",
        code: "website",
        type: "item",
        isReact: false,
        isDynamic: false,
        children: [
          {
            label: "Customization",
            link: "https://local.edubex.com/admin/page/navigation/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Pages",
            link: "https://local.edubex.com/admin/page/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "SEO",
            link: "https://local.edubex.com/admin/page/seo_website/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Category Manager",
            link: "https://local.edubex.com/admin/question_manager/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "News Feed",
            link: "https://local.edubex.com/admin/news/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
          {
            label: "Sales Management",
            link: "https://local.edubex.com/admin/sales_manager/",
            type: "item",
            isReact: false,
            isDynamic: false,
          },
        ],
      },
      {
        label: "Settings",
        link: "https://local.edubex.com/admin/environment/",
        code: "settings",
        type: "item",
        isReact: false,
        isDynamic: false,
        icon: "dash-s",
      },
    ],
  },
};
