import { notFound, permanentRedirect } from "next/navigation";
import { getAllProperties } from "@/lib/api";
import { FEATURES, TYPES, cardPath, geoIndex, listingPath, type Query } from "@/lib/catalog";
import { slugify } from "@/lib/geo";

// Old URLs of azpo.ru and of the first demo: /ru/property-turkey/1044, /property-turkey/alanya/villas,
// /en/property-turkey/Alanya/Mahmutlar/… They answer with one permanent redirect to the new structure.
export const dynamic = "force-dynamic";

export default async function Legacy({ params }: { params: Promise<{ slug?: string[] }> }) {
  const seg = ((await params).slug ?? []).map((s) => decodeURIComponent(s).trim().toLowerCase()).filter(Boolean);
  const all = await getAllProperties();
  const geo = geoIndex(all);

  if (seg.length === 1 && /^\d+$/.test(seg[0])) {
    const p = all.find((x) => x.id === Number(seg[0]));
    if (!p) notFound();
    permanentRedirect(cardPath(p));
  }

  const q: Omit<Query, "page"> = {};
  for (const s of seg) {
    const slug = slugify(s);
    if (!q.city && geo.cities.has(slug)) q.city = slug;
    else if (q.city && !q.district && geo.cities.get(q.city)!.districts.has(slug)) q.district = slug;
    else if (!q.type) {
      const t = TYPES.find((t) => t.slug === slug || t.api.toLowerCase() === s);
      if (t) q.type = t.slug;
      const f = FEATURES.find((f) => f.label.toLowerCase() === s);
      if (f) q.feature = f.slug;
    }
  }
  if (q.feature && !q.type) q.feature = undefined;
  if (q.type) q.deal = "sale";
  permanentRedirect(listingPath(q));
}
