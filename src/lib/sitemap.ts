// XML sitemaps (spec 11.2): an index plus one file per page group and language,
// each <url> with its hreflang alternates. Only canonical, indexable 200 pages go in.
import { getAllProperties } from "./api";
import { allListings, geoIndex, isIndexable, kindOf, listingPath } from "./catalog";
import { LANGS, languageAlternates } from "./i18n";
import { cardPath } from "./paths";
import { R } from "./routes";
import { SERVICES } from "./services";
import { SITE_URL } from "./site";
import { publishedArticles } from "./admin/articles";
import { BLOG_CATEGORIES, blogPath } from "./blog";

export const GROUPS = ["categories", "objects", "complexes", "blog", "static"] as const;
export type Group = (typeof GROUPS)[number];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const abs = (path: string) => esc(`${SITE_URL}${path}`);

type Entry = string | { path: string; lastmod?: Date };

function urlset(entries: Entry[]) {
  const rows = entries.map((e) => {
    const p = typeof e === "string" ? e : e.path;
    const mod = typeof e === "string" || !e.lastmod || Number.isNaN(e.lastmod.getTime()) ? "" : `<lastmod>${e.lastmod.toISOString().slice(0, 10)}</lastmod>`;
    const rest = p.replace(/^\/[a-z]{2}(?=\/)/, "");
    const alts = Object.entries(languageAlternates(rest))
      .map(([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${abs(href)}"/>`)
      .join("");
    return `<url><loc>${abs(p)}</loc>${mod}${alts}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join("\n")}\n</urlset>\n`;
}

export function sitemapIndex() {
  const files = LANGS.flatMap((l) => GROUPS.map((g) => `/sitemap-${g}-${l}.xml`));
  const rows = files.map((f) => `<sitemap><loc>${abs(f)}</loc></sitemap>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</sitemapindex>\n`;
}

/**
 * Pages of one group. Articles carry <lastmod> (their last edit in the admin); objects don't have a reliable
 * change date yet (the azpo.ru API has none), so for them it is left out rather than invented.
 */
export async function groupPaths(group: Group): Promise<Entry[]> {
  if (group === "static") {
    return [R.home, R.services, ...SERVICES.map((s) => R.service(s.slug)), R.about, R.team, R.reviews, R.contacts, R.privacy];
  }
  if (group === "blog") {
    const articles = await publishedArticles();
    const sections = BLOG_CATEGORIES.filter((c) => articles.some((a) => a.category === c.slug)).map((c) => blogPath(c.slug));
    return [blogPath(), ...sections, ...articles.map((a) => ({ path: blogPath(a.category, a.slug), lastmod: new Date(a.updated_at) }))];
  }
  const all = await getAllProperties();
  if (group === "categories") {
    const geo = geoIndex(all);
    return [...new Set(allListings(all, geo).filter((l) => l.count > 0 && isIndexable(kindOf(l.q), l.count)).map((l) => listingPath(l.q)))];
  }
  return all.filter((p) => p.isProject === (group === "complexes")).map((p) => cardPath(p));
}

export async function sitemapXml(group: Group) {
  return urlset(await groupPaths(group));
}

export const xmlResponse = (body: string) =>
  new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=3600" } });
