import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  serverExternalPackages: ["minio"],
  experimental: {
    proxyClientMaxBodySize: "10mb",
  },
  images: {
    qualities: [75, 90, 95, 100],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    // In production, files added to public/uploads at runtime are not served by Next.js.
    // Serve them via API route so uploads work after pnpm build && pnpm start.
    return [
      { source: "/uploads/:path*", destination: "/api/uploads/:path*" },
    ];
  },
};

export default nextConfig;
