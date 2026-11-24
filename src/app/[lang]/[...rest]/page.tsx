import { notFound, permanentRedirect } from "next/navigation";
import { redirectFor } from "@/lib/admin/seo";

// Any URL without its own route: a redirect set in the admin, otherwise the site's 404 page
// (with header and footer) and status 404. URLs outside /ru/ arrive here from the middleware
// as /ru/_old/<original path>.
export const revalidate = 600;

export default async function CatchAll({ params }: { params: Promise<{ lang: string; rest: string[] }> }) {
  const { lang, rest } = await params;
  const path = rest[0] === "_old" ? `/${rest.slice(1).join("/")}/` : `/${lang}/${rest.join("/")}/`;
  const to = await redirectFor(path);
  if (to) permanentRedirect(to);
  notFound();
}
