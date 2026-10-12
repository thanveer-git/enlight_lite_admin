/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // Public alias: local.edubex.com/admin/rubrics/* serves the existing
    // /admin_modern/rubrics/* pages. Rewrite (not redirect) so the address
    // bar keeps the LMS URL. App internals (ROUTES, sidebar, links) still
    // use the /admin_modern/* paths, which nginx also proxies.
    return [
      { source: "/admin/rubrics", destination: "/admin_modern/rubrics" },
      { source: "/admin/rubrics/:path*", destination: "/admin_modern/rubrics/:path*" },
      { source: "/admin/grading", destination: "/admin_modern/grading" },
      { source: "/admin/grading/:path*", destination: "/admin_modern/grading/:path*" },
    ];
  },
};

export default nextConfig;
