import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { districtSlug } from "./geo";
import { getEurPerUsd } from "./fx";
import { OBJECT_FACTS, getPublishedObject, isAdminObjectId, publishedObjects, type ObjectRow } from "./admin/objects";

// Data access for the AZPO public catalogue API.
// For the demo the site reads the live catalogue; later this module is the only
// place that has to change when the data moves to a new database.

export const API_BASE = process.env.AZPO_API_BASE ?? "https://api.azpo.ru/api";
export const IMAGE_BASE = `${API_BASE}/files/property-images/`;
const REVALIDATE = 600; // seconds

export type Currency = "dollar" | "euro" | string;

export interface RawProperty {
  id: number;
  title: string | null;
  bed_room: string | null;
  max_bed: number | null;
  bathroom: number | null;
  metrage: number | null;
  price: number | null;
  price_min: number | null;
  price_max: number | null;
  area: string | null;
  location: string | null;
  money_type: Currency;
  is_multi: number | null;
  images: { id: number; file_name: string; image_order: number }[];
  types?: { name: string; type_id: number }[];
  tags?: { name: string; tag_id: number }[];
}

export interface Property {
  id: number;
  title: string;
  city: string; // normalised key, e.g. "alanya"
  district: string | null; // name as in the catalogue, e.g. "Mahmutlar"
  districtSlug: string | null; // "mahmutlar"
  bedMin: number;
  bedMax: number;
  bathrooms: number | null;
  area: number | null;
  price: number | null;
  priceMax: number | null;
  currency: "USD" | "EUR";
  /** Price converted to euros, for "до 100 000 €" landings and statistics. */
  priceEur: number | null;
  isProject: boolean;
  types: string[];
  tags: string[];
  images: string[];
  photoCount: number;
}

export { CITIES, cityName, cityIn } from "./geo";
export { roomsLabel } from "./paths";
export { formatPrice, plural, objects } from "./format";
export { CONTACTS } from "./contacts";
import { cardPath, objectName } from "./paths";

export function imageUrl(fileName: string) {
  return IMAGE_BASE + encodeURIComponent(fileName);
}

function normalise(p: RawProperty): Property {
  const sorted = [...(p.images ?? [])].sort((a, b) => a.image_order - b.image_order || a.id - b.id);
  const bedMin = Number(p.bed_room ?? 0) || 0;
  const bedMax = Math.max(bedMin, Number(p.max_bed ?? 0) || 0);
  const price = p.price_min || p.price || null;
  const priceMax = p.price_max && price && p.price_max > price ? p.price_max : null;
  return {
    id: p.id,
    title: (p.title ?? "").trim() || `Объект ${p.id}`,
    city: (p.location ?? "").trim().toLowerCase(),
    district: districtSlug(p.area) ? p.area!.trim() : null,
    districtSlug: districtSlug(p.area),
    bedMin,
    bedMax,
    bathrooms: p.bathroom ?? null,
    area: p.metrage ?? null,
    price,
    priceMax,
    currency: p.money_type === "euro" ? "EUR" : "USD",
    priceEur: null,
    isProject: p.is_multi === 1,
    types: (p.types ?? []).map((t) => t.name),
    tags: (p.tags ?? []).map((t) => t.name),
    images: sorted.map((i) => imageUrl(i.file_name)),
    photoCount: sorted.length,
  };
}

async function loadAllProperties(lang: string): Promise<Property[]> {
  // The raw list is ~4 MB (every photo of every object), above the 2 MB fetch-cache limit,
  // so we fetch it uncached and cache a slimmed version (first 8 photos per object) instead.
  // api.azpo.ru is in Russia and is sometimes slow from Vercel's US region: retry with a timeout.
  let json: { realEstates: RawProperty[] | null } | null = null;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3 && !json; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/real-estates/${lang}?limit=2000`, { cache: "no-store", signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`API ${res.status}`);
      json = await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  // Throwing (instead of returning []) keeps an empty list out of the cache.
  if (!json?.realEstates?.length) throw lastErr ?? new Error("API returned no objects");
  const eurPerUsd = await getEurPerUsd();
  // Objects added in the admin join the catalogue; their ids (900001+) sort them first, as the newest.
  const own = (await publishedObjects()).map(fromAdmin);
  return [...json.realEstates.map(normalise), ...own]
    .map((p) => ({
      ...p,
      images: p.images.slice(0, 8),
      priceEur: p.price ? Math.round(p.currency === "EUR" ? p.price : p.price * eurPerUsd) : null,
    }))
    .sort((a, b) => b.id - a.id);
}

/** An object from the admin database in the shape of a catalogue object. */
export function fromAdmin(o: ObjectRow): Property {
  const price = o.price ? Number(o.price) : null;
  const priceMax = o.price_max && price && Number(o.price_max) > price ? Number(o.price_max) : null;
  return {
    id: o.id,
    title: o.title,
    city: o.city,
    district: districtSlug(o.district) ? o.district!.trim() : null,
    districtSlug: districtSlug(o.district),
    bedMin: o.bed_min,
    bedMax: Math.max(o.bed_min, o.bed_max),
    bathrooms: o.bathrooms,
    area: o.area,
    price,
    priceMax,
    currency: o.currency,
    priceEur: null,
    isProject: o.is_project,
    types: [o.type],
    tags: o.tags,
    images: o.photos,
    photoCount: o.photos.length,
  };
}

const cachedAll = unstable_cache(loadAllProperties, ["all-properties-v3"], { revalidate: REVALIDATE, tags: ["properties"] });

export async function getAllProperties(lang = "ru"): Promise<Property[]> {
  try {
    return await cachedAll(lang);
  } catch (err) {
    console.error("Failed to load properties", err);
    // Opt this render out of static caching, so a failed load is never stored as an empty page:
    // at build time the page becomes dynamic, during revalidation the previous page is kept.
    await connection();
    return [];
  }
}

export async function getProperty(id: number) {
  const all = await getAllProperties();
  return all.find((p) => p.id === id) ?? null;
}

/** Lightweight version for listings (server-rendered and client-side "show more"). */
export type PropertyCard = Omit<Property, "images"> & { images: string[]; href: string; name: string };
export function toCard(p: Property, maxImages = 1): PropertyCard {
  return { ...p, images: p.images.slice(0, maxImages), href: cardPath(p), name: objectName(p) };
}



interface RawDetails extends RawProperty {
  details?: string | null;
  max_floor?: number | null;
  building_floor?: number | null;
  age_of_the_building?: number | null;
  furnished_sale?: number | null;
  location_map?: string | null;
  dist_sea?: number | null; dist_sea_type?: string | null;
  dist_airport?: number | null; dist_airport_type?: string | null;
  dist_hospital?: number | null; dist_hospital_type?: string | null;
  dist_shopping?: number | null; dist_shopping_type?: string | null;
  features?: { name: string }[];
  landscapes?: { name: string }[];
  heatingTypes?: { name: string }[];
}

const ENTITIES: Record<string, string> = {
  "&nbsp;": " ", "&mdash;": "—", "&ndash;": "–", "&laquo;": "«", "&raquo;": "»", "&quot;": '"',
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&#39;": "'", "&rsquo;": "’", "&lsquo;": "‘", "&hellip;": "…",
};

/** Turns the CMS HTML into plain paragraphs (no raw HTML is rendered on the page). */
export function htmlToText(html: string) {
  return html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h\d)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? m)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const dist = (v?: number | null, t?: string | null) => (v ? `${v} ${t === "km" ? "км" : "м"}` : null);

export async function getPropertyDetails(id: number, lang = "ru") {
  if (isAdminObjectId(id)) {
    const o = await getPublishedObject(id);
    if (!o) return null;
    return {
      property: fromAdmin(o),
      prevId: null,
      nextId: null,
      description: o.description?.trim() || null,
      facts: OBJECT_FACTS.map(([k, label]): [string, string | null] => [label, o.facts?.[k]?.trim() || null]),
      features: o.developer ? [`Застройщик: ${o.developer}`] : [],
      map: null,
    };
  }
  try {
    const res = await fetch(`${API_BASE}/dashboard/properties/${id}/${lang}`, { next: { revalidate: REVALIDATE } });
    if (!res.ok) return null;
    const j = await res.json();
    const d: RawDetails = Array.isArray(j) ? j[0] : j;
    if (!d || !d.id) return null;
    const facts: [string, string | null][] = [
      ["Этажность", d.max_floor ? String(d.max_floor) : null],
      ["Год сдачи", d.age_of_the_building ? String(d.age_of_the_building) : null],
      ["Мебель", d.furnished_sale ? "С мебелью" : null],
      ["До моря", dist(d.dist_sea, d.dist_sea_type)],
      ["До аэропорта", dist(d.dist_airport, d.dist_airport_type)],
      ["До больницы", dist(d.dist_hospital, d.dist_hospital_type)],
      ["До магазинов", dist(d.dist_shopping, d.dist_shopping_type)],
    ];
    return {
      property: normalise(d),
      prevId: (d as { prevId?: number }).prevId ?? null,
      nextId: (d as { nextId?: number }).nextId ?? null,
      description: d.details ? htmlToText(d.details) : null,
      facts,
      features: [...(d.features ?? []), ...(d.landscapes ?? []), ...(d.heatingTypes ?? [])].map((f) => f.name).filter(Boolean),
      map: d.location_map || null,
    };
  } catch {
    return null;
  }
}

export async function getRelated(p: Property, lang = "ru") {
  try {
    const res = await fetch(`${API_BASE}/real-estates/${lang}?relatedProperties=${p.id},${p.price ?? 0}`, {
      next: { revalidate: REVALIDATE },
    });
    const json = (await res.json()) as { realEstates: RawProperty[] | null };
    const list = (json.realEstates ?? []).map(normalise).filter((x) => x.id !== p.id);
    return [...list.filter((x) => x.city === p.city), ...list.filter((x) => x.city !== p.city)].slice(0, 3);
  } catch {
    return [];
  }
}

