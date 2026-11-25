// The old azpo.ru catalogue (its public API): addresses, and how one of its objects becomes a row of the
// admin's objects table. The site uses the same conversion for objects that have not been moved yet,
// so an object looks the same before and after the move.
import { OBJECT_TYPES } from "./admin/forms";
import type { ObjectRow, Unit } from "./admin/objects";

export const API_BASE = process.env.AZPO_API_BASE ?? "https://api.azpo.ru/api";
export const IMAGE_BASE = `${API_BASE}/files/property-images/`;
export const SOURCE_AZPO = "azpo.ru";

export function imageUrl(fileName: string) {
  return IMAGE_BASE + encodeURIComponent(fileName);
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

interface Named { name?: string | null }
export interface AzpoObject {
  id: number;
  title?: string | null;
  location?: string | null;
  area?: string | null;
  price?: number | null;
  price_min?: number | null;
  price_max?: number | null;
  money_type?: string | null;
  bathroom?: number | null;
  max_bath?: number | null;
  bed_room?: string | number | null;
  max_bed?: number | null;
  metrage?: number | null;
  max_sqt?: number | null;
  max_floor?: number | null;
  building_floor?: number | null;
  age_of_the_building?: number | null;
  furnished_sale?: number | null;
  is_multi?: number | null;
  type?: string | null;
  details?: string | null;
  location_map?: string | null;
  dist_sea?: number | null; dist_sea_type?: string | null;
  dist_airport?: number | null; dist_airport_type?: string | null;
  dist_hospital?: number | null; dist_hospital_type?: string | null;
  dist_shopping?: number | null; dist_shopping_type?: string | null;
  images?: { id: number; file_name: string; image_order: number }[] | null;
  types?: Named[] | null;
  tags?: Named[] | null;
  features?: Named[] | null;
  landscapes?: Named[] | null;
  heatingTypes?: Named[] | null;
  houseTypes?: Named[] | null;
}

const pos = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);
const int = (v: unknown) => (pos(v) === null ? null : Math.round(v as number));
export const unique = <T,>(a: T[]) => [...new Set(a)];
/** Spelling fixes for vocabulary values of the old database. */
const FIX: Record<string, string> = { "Видионаблюдение": "Видеонаблюдение" };
const names = (a?: Named[] | null) => unique((a ?? []).map((x) => (x?.name ?? "").trim()).filter(Boolean).map((v) => FIX[v] ?? v));

/** Bedrooms of a layout: "2+1" → 2, "1+0" (a studio) → 0. */
export const layoutBeds = (l: string) => (/^(1\+0|0\+1)$/.test(l.trim()) ? 0 : Math.floor(parseFloat(l)));

/**
 * The unit of a distance. The old database often has none; then a small number is kilometres
 * (an airport 40 away is 40 km, a beach 850 away is 850 m).
 */
function unit(v: number | null, t: string | null | undefined, kmBelow: number): Unit {
  if (t === "km" || t === "m") return t;
  return v !== null && v < kmBelow ? "km" : "m";
}

/** One AZPO object as a row of the objects table. */
export function rowFromAzpo(d: AzpoObject): Omit<ObjectRow, "updated_at"> {
  const isProject = d.is_multi === 1;
  const layouts = names(d.houseTypes);
  const beds = layouts.map(layoutBeds).filter((n) => Number.isFinite(n));
  // bed_room is text: "2", "", "3+1", "+5". A plain number wins; otherwise the layouts; otherwise its first number.
  const raw = String(d.bed_room ?? "").trim();
  let bedMin: number | null = /^\d+$/.test(raw) ? Number(raw) : beds.length ? Math.min(...beds) : /\d+/.test(raw) ? Number(raw.match(/\d+/)![0]) : null;
  if (bedMin !== null && bedMin <= 1 && beds.length && Math.min(...beds) === 0) bedMin = 0; // a studio entered as 1+0
  const bedMax = Math.max(bedMin ?? 0, int(d.max_bed) ?? 0, ...(isProject ? beds : []));

  const price = pos(d.price_min) ?? pos(d.price);
  const priceMax = pos(d.price_max);
  const bathrooms = int(d.bathroom), bathMax = int(d.max_bath);
  const area = int(d.metrage), areaMax = int(d.max_sqt);
  const scalarType = (d.type ?? "").trim();
  const dist = (v: unknown, t: string | null | undefined, kmBelow: number) => {
    const n = pos(v);
    return [n, unit(n, t, kmBelow)] as const;
  };
  const [sea, seaU] = dist(d.dist_sea, d.dist_sea_type, 50);
  const [air, airU] = dist(d.dist_airport, d.dist_airport_type, 500);
  const [hosp, hospU] = dist(d.dist_hospital, d.dist_hospital_type, 50);
  const [shop, shopU] = dist(d.dist_shopping, d.dist_shopping_type, 50);
  const year = int(d.age_of_the_building);
  const map = (d.location_map ?? "").trim();
  const district = (d.area ?? "").trim();
  const photos = [...(d.images ?? [])].sort((a, b) => a.image_order - b.image_order || a.id - b.id).map((i) => imageUrl(i.file_name));

  return {
    id: d.id,
    source: SOURCE_AZPO,
    published: true,
    is_project: isProject,
    title: (d.title ?? "").trim() || `Объект ${d.id}`,
    developer: null,
    city: (d.location ?? "").trim().toLowerCase(),
    district: district && district !== "0" ? district : null,
    types: unique([...names(d.types), ...(OBJECT_TYPES.includes(scalarType) ? [scalarType] : [])]),
    layouts,
    bed_min: bedMin,
    bed_max: bedMax,
    bathrooms,
    bathrooms_max: bathMax && bathrooms !== null && bathMax > bathrooms ? bathMax : null,
    area,
    area_max: areaMax && area !== null && areaMax > area ? areaMax : null,
    floor: int(d.building_floor),
    floors: int(d.max_floor),
    year: year && year >= 1900 && year <= 2100 ? year : null,
    furnished: d.furnished_sale === 1,
    installments: null,
    price,
    price_max: priceMax && price && priceMax > price ? priceMax : null,
    currency: d.money_type === "euro" ? "EUR" : "USD",
    tags: names(d.tags),
    features: names(d.features),
    views: names(d.landscapes),
    heating: names(d.heatingTypes),
    dist_sea: sea, dist_sea_unit: seaU,
    dist_airport: air, dist_airport_unit: airU,
    dist_hospital: hosp, dist_hospital_unit: hospU,
    dist_shopping: shop, dist_shopping_unit: shopU,
    map_url: /^https?:\/\/\S+$/.test(map) ? map : null,
    description: d.details ? htmlToText(d.details) || null : null,
    photos,
  };
}

