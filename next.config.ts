import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  output: "standalone",
  async redirects() {
    return [
      { source: "/dashboard/admin", destination: "/dashboard/staff", permanent: true },
      { source: "/dashboard/admin/:path*", destination: "/dashboard/staff/:path*", permanent: true },
      { source: "/es/dashboard/admin", destination: "/es/dashboard/staff", permanent: true },
      { source: "/es/dashboard/admin/:path*", destination: "/es/dashboard/staff/:path*", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "/avatars/**",
      },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
    viewTransition: true,
  },
};

export default withNextIntl(nextConfig);
