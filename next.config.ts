import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // A baseline policy that needs no list of script hosts: no plugins, no <base> hijacking,
  // forms only to this site, no framing by other sites.
  { key: "Content-Security-Policy", value: "object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // One URL form everywhere: sections and cards end with "/", the other form gets a 308.
  trailingSlash: true,
  // …but the redirect itself is done in middleware, so that old URLs reach their target in one hop.
  skipTrailingSlashRedirect: true,
  experimental: { globalNotFound: true },
  // A page built at deploy time may wait for the azpo.ru list (up to 2 × 25 s from Vercel while the move into
  // the admin is not finished) on top of the database: more than the default 60 s.
  staticPageGenerationTimeout: 180,
  // Fonts and the photo that the share-image routes read from disk at runtime.
  outputFileTracingIncludes: {
    "/api/og/[file]": ["./src/fonts/og/**", "./public/img/dest/**"],
    "/[lang]/opengraph-image": ["./src/fonts/og/**", "./public/img/dest/istanbul.webp"],
  },
  images: {
    // Every next/image goes through our own resizer /api/img/ (src/lib/image-loader.ts): works the same on
    // Vercel and on our own server, with no per-image quota. The patterns below document the allowed sources;
    // the route itself enforces them (src/lib/image-sizes.ts).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "api.azpo.ru", pathname: "/api/files/**" },
      { protocol: "https", hostname: "api.azpo.com", pathname: "/api/files/**" },
      // Photos uploaded in the admin (Supabase Storage, public bucket).
      { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" },
      // Cover photos of the district guides (Unsplash licence: free use, hotlinking allowed).
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
    deviceSizes: [640, 828, 1080, 1280, 1920],
    imageSizes: [96, 256, 384],
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
