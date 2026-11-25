// Live prices for the district comparison and the guides: average €/m² of apartments in the AZPO
// catalogue (villas and land would skew it), for Alanya as a whole and for each compared district.
import { getAllProperties } from "@/lib/api";
import { stats } from "@/lib/catalog";
import { ALANYA_SCORES } from "@/lib/district-scores";

export async function alanyaFlatPrices() {
  const all = (await getAllProperties()).filter((p) => p.city === "alanya");
  const flats = all.filter((p) => p.types.includes("Квартиры"));
  const by: Record<string, number | null> = {};
  for (const d of ALANYA_SCORES) by[d.slug] = stats(flats.filter((p) => p.districtSlug === d.slug)).avgM2;
  // Districts with a price, cheapest first.
  const ranked = ALANYA_SCORES.map((d) => d.slug).filter((s) => by[s] != null).sort((a, b) => by[a]! - by[b]!);
  return { all, avg: stats(flats).avgM2, by, ranked };
}

export const eur = (n: number) => `${n.toLocaleString("ru-RU")} €`;

/** "Самый доступный метр в Алании" and the like, for one district. */
export function priceNote(slug: string, p: Awaited<ReturnType<typeof alanyaFlatPrices>>) {
  const pm = p.by[slug];
  if (pm == null) return null;
  const i = p.ranked.indexOf(slug);
  if (i === 0) return "самый доступный метр в Алании";
  if (i === p.ranked.length - 1) return "самый дорогой метр в Алании";
  if (!p.avg) return null;
  return pm < p.avg ? `ниже среднего по Алании (${eur(p.avg)})` : `выше среднего по Алании (${eur(p.avg)})`;
}
