/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin_modern" },
      { source: "/admin/listings", destination: "/admin_modern/listings" },
      { source: "/admin/forms", destination: "/admin_modern/forms" },
      { source: "/admin/wizards", destination: "/admin_modern/wizards" },
      { source: "/admin/settings", destination: "/admin_modern/settings" },
      { source: "/admin/v1", destination: "/admin_modern" },
      { source: "/admin/v1/:path*", destination: "/admin_modern/:path*" },
      { source: "/admin/submissions", destination: "/admin_modern/submissions" },
      { source: "/admin/submissions/:path*", destination: "/admin_modern/submissions/:path*" },
      { source: "/admin/assignments", destination: "/admin_modern/assignments" },
      { source: "/admin/assignments/:path*", destination: "/admin_modern/assignments/:path*" },
    ];
  },
};

export default nextConfig;
