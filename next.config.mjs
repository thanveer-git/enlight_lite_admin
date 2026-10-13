/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin_modern" },
      { source: "/admin/listings", destination: "/admin_modern/listings" },
      { source: "/admin/forms", destination: "/admin_modern/forms" },
      { source: "/admin/wizards", destination: "/admin_modern/wizards" },
      { source: "/admin/settings", destination: "/admin_modern/settings" },
      { source: "/admin/rubrics", destination: "/admin_modern/rubrics" },
      { source: "/admin/rubrics/:path*", destination: "/admin_modern/rubrics/:path*" },
      { source: "/admin/grading", destination: "/admin_modern/grading" },
      { source: "/admin/grading/:path*", destination: "/admin_modern/grading/:path*" },
      { source: "/admin/submissions", destination: "/admin_modern/submissions" },
      { source: "/admin/submissions/:path*", destination: "/admin_modern/submissions/:path*" },
      { source: "/admin/assignments", destination: "/admin_modern/assignments" },
      { source: "/admin/assignments/:path*", destination: "/admin_modern/assignments/:path*" },
    ];
  },
};

export default nextConfig;
