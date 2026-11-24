import { GROUPS, sitemapXml, xmlResponse, type Group } from "@/lib/sitemap";
import { LANGS } from "@/lib/i18n";

// Served as /sitemap-{group}-{lang}.xml through a rewrite in next.config.ts.
export const revalidate = 600;
export const dynamicParams = false;
export function generateStaticParams() {
  return LANGS.flatMap((l) => GROUPS.map((g) => ({ name: `${g}-${l}` })));
}

export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const [group, lang] = name.split("-") as [Group, string];
  if (!GROUPS.includes(group) || !(LANGS as readonly string[]).includes(lang)) return new Response("Not found", { status: 404 });
  return xmlResponse(await sitemapXml(group));
}
