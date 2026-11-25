// Choices for the object form: cities and their districts (from the live catalogue and the geo dictionary).
import "server-only";
import { getAllProperties } from "@/lib/api";
import { geoIndex } from "@/lib/catalog";
import { CITIES, districtName } from "@/lib/geo";
import type { ObjectOptions } from "@/components/admin/ObjectForm";

export async function objectOptions(): Promise<ObjectOptions> {
  const geo = geoIndex(await getAllProperties());
  const cities = Object.entries(CITIES).map(([key, c]) => {
    const raw = new Map<string, string>(); // district slug → name as stored
    for (const [slug, v] of geo.cities.get(key)?.districts ?? []) raw.set(slug, v.name);
    for (const slug of c.order ?? []) if (!raw.has(slug)) raw.set(slug, slug);
    const districts = [...raw].map(([slug, value]) => ({ value, label: districtName(slug, value) })).sort((a, b) => a.label.localeCompare(b.label, "ru"));
    return { key, name: c.ru, districts };
  });
  return { cities };
}

/** Places an article can be about: "alanya" (the whole city) or "alanya/mahmutlar". */
export function geoOptions() {
  return Object.entries(CITIES).flatMap(([key, c]) => [
    { value: key, label: `${c.ru}: весь город` },
    ...(c.order ?? []).map((d) => ({ value: `${key}/${d}`, label: `${c.ru} · ${districtName(d)}` })),
  ]);
}

export const isGeo = (v: string) => {
  const [city, district, extra] = v.split("/");
  return !extra && Boolean(CITIES[city]) && (!district || (CITIES[city].order ?? []).includes(district));
};
