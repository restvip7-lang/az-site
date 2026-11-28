// Sizes the image route agrees to make. A short fixed list keeps the cache small and stops anyone from
// asking the server to render arbitrary sizes. Covers next.config deviceSizes + imageSizes.
export const IMG_WIDTHS = [96, 256, 384, 640, 828, 1080, 1280, 1920] as const;
export const IMG_QUALITIES = [60, 70, 75, 85] as const;

/** Hosts the image route may fetch from (exact host, or a suffix starting with "."), with the allowed path prefix. */
export const IMG_SOURCES: { host: string; path: string }[] = [
  { host: "api.azpo.ru", path: "/api/files/" },
  { host: "api.azpo.com", path: "/api/files/" },
  { host: ".supabase.co", path: "/storage/v1/object/public/" },
  { host: "images.unsplash.com", path: "/" },
];

/** Whether an absolute image URL may be fetched by the image route. */
export function allowedSource(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || u.username || u.password || u.port) return null;
  const ok = IMG_SOURCES.some((s) =>
    (s.host.startsWith(".") ? u.hostname.endsWith(s.host) && u.hostname.length > s.host.length : u.hostname === s.host) && u.pathname.startsWith(s.path),
  );
  return ok ? u : null;
}

/** Whether a site-relative path points to one of our public image folders (no "..", no query tricks). */
export function allowedLocal(path: string): boolean {
  return /^\/(img|brand|citizenship)\/[A-Za-z0-9/_.-]+\.(webp|png|jpe?g|avif)$/.test(path) && !path.includes("..");
}
