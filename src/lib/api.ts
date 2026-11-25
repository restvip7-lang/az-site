import { unstable_cache } from "next/cache";
import { connection } from "next/server";
import { districtSlug } from "./geo";
import { getEurPerUsd } from "./fx";
import { catalogueObjects, siteObject, type CatalogueRow, type ObjectRow } from "./admin/objects";
import { API_BASE, layoutBeds, rowFromAzpo, type AzpoObject } from "./azpo-feed";

export { API_BASE, IMAGE_BASE, imageUrl, htmlToText } from "./azpo-feed";

// Data access for the catalogue. Objects live in the admin database; objects of the old azpo.ru catalogue
// (its public API) that have not been moved into the admin yet are still read from there.

const REVALIDATE = 600; // seconds

export type Currency = "dollar" | "euro" | string;

export interface Property {
  id: number;
  title: string;
  city: string; // normalised key, e.g. "alanya"
  district: string | null; // name as in the catalogue, e.g. "Mahmutlar"
  districtSlug: string | null; // "mahmutlar"
  bedMin: number;
  bedMax: number;
  /** False when the feed has no bedroom count and the title has none either: bedMin is then 0 but means "unknown". */
  bedKnown: boolean;
  /** A studio flat (0+1), or a project that has studios among its layouts. */
  studio: boolean;
  bathrooms: number | null;
  area: number | null;
  /** Largest layout of a project, m² (optional: lists cached before it existed lack it). */
  areaMax?: number | null;
  bathroomsMax?: number | null;
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

/** "Студия 1+0", "0+1", "студии": a studio whatever bed_room says ("10+1" is not one). */
const STUDIO = /студи|(?:^|\D)(?:1\+0|0\+1)(?!\d)/i;
/** "Квартиры 1+1 и 2+1" → [1, 2]: layouts written in the title. */
const titleRooms = (t: string) => [...t.matchAll(/(?:^|\D)(\d{1,2})\+[0-3](?!\d)/g)].map((m) => Number(m[1])).filter((n) => n > 0);

/**
 * Bedrooms: the feed's bed_room is often empty (most projects), and studios are entered as "1+0"
 * with bed_room 1. An empty count is taken from the layouts or the title when they name them, otherwise it stays unknown.
 */
function bedrooms(raw: string, maxBed: number, title: string, layouts: string[] = []) {
  let bedKnown = raw !== "" && Number.isFinite(Number(raw));
  let bedMin = bedKnown ? Math.max(0, Number(raw)) : 0;
  let bedMax = Math.max(bedMin, maxBed || 0);
  const fromLayouts = layouts.map(layoutBeds).filter((n) => Number.isFinite(n));
  const named = bedKnown ? [] : fromLayouts.length ? fromLayouts : titleRooms(title);
  if (named.length) {
    bedMin = Math.min(...named);
    bedMax = Math.max(bedMax, ...named);
    bedKnown = true;
  }
  const studio = STUDIO.test(title) || fromLayouts.includes(0) || (bedKnown && bedMin === 0);
  if (studio) {
    bedMin = 0;
    if (bedMax <= 1) bedMax = 0;
    bedKnown = true;
  }
  return { bedMin, bedMax, bedKnown, studio };
}

/** The old azpo.ru catalogue (public API). */
async function loadFeed(lang: string, attempts: number, timeout: number): Promise<AzpoObject[]> {
  // The raw list is ~3 MB (every photo of every object), above the 2 MB fetch-cache limit,
  // so we fetch it uncached and cache a slimmed version (first 8 photos per object) instead.
  // api.azpo.ru is in Russia and is often slow from Vercel's regions: retry with a timeout.
  let lastErr: unknown;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const res = await fetch(`${API_BASE}/real-estates/${lang}?limit=2000`, { cache: "no-store", signal: AbortSignal.timeout(timeout) });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const json = (await res.json()) as { realEstates: AzpoObject[] | null };
      if (json.realEstates?.length) return json.realEstates;
      lastErr = new Error("API returned no objects");
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

async function loadAllProperties(lang: string): Promise<Property[]> {
  const started = Date.now();
  const own = await catalogueObjects();
  // Once every azpo.ru object is in the admin, the old catalogue only adds objects that appeared there since:
  // the site does not wait long for it. Until then (nothing moved, or a move that stopped half-way) it holds
  // the rest of the catalogue and gets more time.
  const feed = await loadFeed(lang, own.complete ? 1 : 2, own.complete ? 8_000 : 25_000).catch((err: unknown) => (err instanceof Error ? err : new Error(String(err))));
  console.log(`catalogue: ${own.rows.length} from the admin (${own.complete ? "all moved" : `${own.imported} moved`}), azpo.ru list ${feed instanceof Error ? `failed (${feed.message})` : feed.length}, ${Date.now() - started} ms`);
  if (feed instanceof Error && !own.complete) {
    // Part of the catalogue is missing: throwing keeps a short list out of the cache (the previous list stays in use).
    throw feed;
  }
  const eurPerUsd = await getEurPerUsd();
  // Objects the admin owns (moved from azpo.ru, deleted there, or added by staff) come from the admin only.
  const old = feed instanceof Error ? [] : feed.filter((p) => !own.owned.has(p.id)).map((p) => fromAdmin(rowFromAzpo(p)));
  return [...old, ...own.rows.map(fromAdmin)]
    .map((p) => ({
      ...p,
      images: p.images.slice(0, 8),
      priceEur: p.price ? Math.round(p.currency === "EUR" ? p.price : p.price * eurPerUsd) : null,
    }))
    .sort((a, b) => b.id - a.id);
}

/** An object from the admin database in the shape of a catalogue object. */
export function fromAdmin(o: CatalogueRow | Omit<ObjectRow, "updated_at">): Property {
  const price = o.price ? Number(o.price) : null;
  const priceMax = o.price_max && price && Number(o.price_max) > price ? Number(o.price_max) : null;
  const beds = bedrooms(o.bed_min === null ? "" : String(o.bed_min), o.bed_max, o.title, o.layouts);
  return {
    id: o.id,
    title: o.title,
    city: o.city,
    district: districtSlug(o.district) ? o.district!.trim() : null,
    districtSlug: districtSlug(o.district),
    ...beds,
    bathrooms: o.bathrooms,
    bathroomsMax: o.bathrooms_max,
    area: o.area,
    areaMax: o.area_max,
    price,
    priceMax,
    currency: o.currency,
    priceEur: null,
    isProject: o.is_project,
    types: o.types,
    tags: o.tags,
    images: o.photos,
    photoCount: ("photo_count" in o && typeof o.photo_count === "number" ? o.photo_count : null) ?? o.photos.length,
  };
}

// The key stays "v4": the list cached under it is still valid (fields added since then are optional),
// and a new key would leave the site without any list while api.azpo.ru is slow to answer from Vercel.
const cachedAll = unstable_cache(loadAllProperties, ["all-properties-v4"], { revalidate: REVALIDATE, tags: ["properties"] });

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



/** The fact list and chips of an object page, from an admin row (or an azpo.ru object converted to one). */
const VIEW: Record<string, string> = { "Море": "Вид на море", "Горы": "Вид на горы", "Природа": "Вид на природу", "Город": "Вид на город", "Бассейн": "Вид на бассейн", "Двор": "Вид во двор" };
const HEATING: Record<string, string> = { "Газ": "Газовое отопление", "Подогрев пола": "Тёплый пол", "Комбинированный": "Комбинированное отопление" };
const distText = (v: string | number | null, u: string) => {
  const n = v === null ? null : Number(v);
  return n ? `${n.toLocaleString("ru-RU")} ${u === "km" ? "км" : "м"}` : null;
};

function detailsFromRow(o: Omit<ObjectRow, "updated_at">) {
  const thisYear = new Date().getFullYear();
  const facts: [string, string | null][] = [
    ["Этаж", !o.is_project && o.floor ? String(o.floor) : null],
    ["Этажность", o.floors ? String(o.floors) : null],
    [o.year && o.year > thisYear ? "Год сдачи" : "Год постройки", o.year ? String(o.year) : null],
    ["Планировки", o.is_project && o.layouts.length ? o.layouts.join(", ") : null],
    ["Мебель", o.furnished ? "С мебелью" : null],
    ["Рассрочка", o.installments?.trim() || null],
    ["До моря", distText(o.dist_sea, o.dist_sea_unit)],
    ["До аэропорта", distText(o.dist_airport, o.dist_airport_unit)],
    ["До больницы", distText(o.dist_hospital, o.dist_hospital_unit)],
    ["До магазинов", distText(o.dist_shopping, o.dist_shopping_unit)],
  ];
  return {
    property: fromAdmin(o),
    description: o.description?.trim() || null,
    facts,
    features: [
      ...(o.developer ? [`Застройщик: ${o.developer}`] : []),
      ...o.features,
      ...o.views.map((v) => VIEW[v] ?? v),
      ...o.heating.map((h) => HEATING[h] ?? h),
    ],
    map: o.map_url && /^https?:\/\//.test(o.map_url) ? o.map_url : null,
  };
}

export async function getPropertyDetails(id: number, lang = "ru") {
  // The admin decides about every object it has; the old catalogue only about the ones not moved yet.
  const own = await siteObject(id);
  if (own.owned) return own.row ? detailsFromRow(own.row) : null;
  try {
    const res = await fetch(`${API_BASE}/dashboard/properties/${id}/${lang}`, { next: { revalidate: REVALIDATE }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    const j = await res.json();
    const d = Array.isArray(j) ? j[0] : j;
    if (!d || d.id !== id) return null;
    return detailsFromRow(rowFromAzpo(d));
  } catch {
    return null;
  }
}
