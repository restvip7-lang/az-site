import { sitemapIndex, xmlResponse } from "@/lib/sitemap";

export const revalidate = 600;

export function GET() {
  return xmlResponse(sitemapIndex());
}
