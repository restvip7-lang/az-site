import type { MetadataRoute } from "next";
import { CITIES, getAllProperties } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const all = await getAllProperties();
  const now = new Date();
  const pages = ["", "/property-turkey", "/citizenship", "/about", "/contact-us"].map((p) => ({
    url: `${SITE_URL}${p}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const cities = Object.keys(CITIES)
    .filter((c) => all.some((p) => p.city === c))
    .flatMap((c) => [c, `${c}/apartments`, `${c}/villas`])
    .map((c) => ({ url: `${SITE_URL}/property-turkey/${c}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.7 }));
  const props = all.map((p) => ({
    url: `${SITE_URL}/property-turkey/${p.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    images: p.images.slice(0, 1),
  }));
  return [...pages, ...cities, ...props];
}
