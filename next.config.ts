import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // One URL form everywhere: sections and cards end with "/", the other form gets a 308.
  trailingSlash: true,
  // …but the redirect itself is done in middleware, so that old URLs reach their target in one hop.
  skipTrailingSlashRedirect: true,
  experimental: { globalNotFound: true },
  // Fonts and the photo that the share-image routes read from disk at runtime.
  outputFileTracingIncludes: {
    "/api/og/[file]": ["./src/fonts/og/**", "./public/img/dest/**"],
    "/[lang]/opengraph-image": ["./src/fonts/og/**", "./public/img/dest/istanbul.webp"],
  },
  images: {
    // Property photos are served by the AZPO backend; Next resizes them and serves AVIF/WebP.
    remotePatterns: [
      { protocol: "https", hostname: "api.azpo.ru", pathname: "/api/files/**" },
      { protocol: "https", hostname: "api.azpo.com", pathname: "/api/files/**" },
      // Photos uploaded in the admin (Supabase Storage, public bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Cover photos of the district guides (Unsplash licence: free use, hotlinking allowed).
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [96, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
  async rewrites() {
    // Sitemap children named as in the spec: /sitemap-categories-ru.xml → route handler.
    return [{ source: "/sitemap-:name.xml", destination: "/sitemaps/:name" }];
  },
};

export default nextConfig;
