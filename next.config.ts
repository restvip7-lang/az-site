import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Property photos are served by the existing AZPO backend.
    unoptimized: true,
  },
  async redirects() {
    return [
      // Old site used /ru/... and /en/... prefixes; keep those links working.
      { source: "/ru", destination: "/", permanent: true },
      { source: "/ru/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
