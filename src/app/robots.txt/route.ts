import { INDEXABLE, SITE_URL } from "@/lib/site";

// robots.txt from spec 11.1. AI crawlers are allowed by the common "User-agent: *" group.
// The demo stays closed: every group also gets "Disallow: /" until NEXT_PUBLIC_INDEXABLE=1.
export const dynamic = "force-static";

export function GET() {
  const closed = INDEXABLE ? "" : "Disallow: /\n";
  const body = `${INDEXABLE ? "" : "# Demo: the whole site is closed until launch on the real domain.\n"}User-agent: *
${closed}Disallow: /favorites/
Disallow: /search/
Disallow: /*?*sort=
Disallow: /*?*view=
Disallow: /api/

User-agent: Yandex
${closed}Disallow: /favorites/
Disallow: /search/
Disallow: /api/
Clean-param: sort&view&utm_source&utm_medium&utm_campaign&utm_content&utm_term

Sitemap: ${SITE_URL}/sitemap.xml
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
