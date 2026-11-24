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
  district: string | null;
  bedMin: number;
  bedMax: number;
  bathrooms: number | null;
  area: number | null;
  price: number | null;
  priceMax: number | null;
  currency: "USD" | "EUR";
  isProject: boolean;
  types: string[];
  tags: string[];
  images: string[];
  photoCount: number;
}

export const CITIES: Record<string, { ru: string; en: string; blurb: string }> = {
  alanya: { ru: "Алания", en: "Alanya", blurb: "Курорт с самым мягким климатом и доступными ценами" },
  antalya: { ru: "Анталия", en: "Antalya", blurb: "Столица Турецкой Ривьеры и крупный деловой центр" },
  istanbul: { ru: "Стамбул", en: "Istanbul", blurb: "Мегаполис на двух континентах, инвестиции и бизнес" },
  fethiye: { ru: "Фетхие", en: "Fethiye", blurb: "Бухты, горы и спокойная жизнь на Эгейском побережье" },
  belek: { ru: "Белек", en: "Belek", blurb: "Гольф-курорт премиум-класса рядом с Анталией" },
  mersin: { ru: "Мерсин", en: "Mersin", blurb: "Растущий портовый город с низким порогом входа" },
  bodrum: { ru: "Бодрум", en: "Bodrum", blurb: "Яхты, виллы и турецкий Сен-Тропе" },
  kemer: { ru: "Кемер", en: "Kemer", blurb: "Горы, сосны и чистое море" },
  kas: { ru: "Каш", en: "Kaş", blurb: "Живописный городок для ценителей тишины" },
};

export function cityName(key: string) {
  return CITIES[key]?.ru ?? key.charAt(0).toUpperCase() + key.slice(1);
}

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
    city: (p.location ?? "").toLowerCase(),
    district: p.area?.trim() || null,
    bedMin,
    bedMax,
    bathrooms: p.bathroom ?? null,
    area: p.metrage ?? null,
    price,
    priceMax,
    currency: p.money_type === "euro" ? "EUR" : "USD",
    isProject: p.is_multi === 1,
    types: (p.types ?? []).map((t) => t.name),
    tags: (p.tags ?? []).map((t) => t.name),
    images: sorted.map((i) => imageUrl(i.file_name)),
    photoCount: sorted.length,
  };
}

export async function getAllProperties(lang = "ru"): Promise<Property[]> {
  try {
    const res = await fetch(`${API_BASE}/real-estates/${lang}?limit=2000`, {
      next: { revalidate: REVALIDATE, tags: ["properties"] },
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const json = (await res.json()) as { realEstates: RawProperty[] | null };
    return (json.realEstates ?? []).map(normalise).sort((a, b) => b.id - a.id);
  } catch (err) {
    console.error("Failed to load properties", err);
    return [];
  }
}

export async function getProperty(id: number) {
  const all = await getAllProperties();
  return all.find((p) => p.id === id) ?? null;
}

/** Lightweight version for client-side catalogue filtering. */
export type PropertyCard = Omit<Property, "images"> & { images: string[] };
export function toCard(p: Property, maxImages = 5): PropertyCard {
  return { ...p, images: p.images.slice(0, maxImages) };
}

export function formatPrice(value: number | null, currency: "USD" | "EUR") {
  if (!value) return "Цена по запросу";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function roomsLabel(p: Pick<Property, "bedMin" | "bedMax">) {
  const f = (n: number) => `${n}+1`;
  if (p.bedMax > p.bedMin) return `${f(p.bedMin)} – ${f(p.bedMax)}`;
  return p.bedMin === 0 ? "Студия" : f(p.bedMin);
}

export const CONTACTS = {
  phone: "+90 545 555 0 555",
  phoneHref: "tel:+905455550555",
  whatsapp: "https://wa.me/905455550555",
  telegram: "https://t.me/AZPOproperties",
  email: "info@azpo.ru",
  instagram: "https://www.instagram.com/azpo_estate/",
  youtube: "https://www.youtube.com/@azpogroup",
  offices: [
    { city: "Алания", address: "Cumhuriyet Mah., Keykubat Bulvarı 270A/14, Alanya/Antalya" },
    { city: "Анталия", address: "Fener Mah., Bülent Ecevit Bulvarı, Özdemir Plaza № 42/1, 07230 Muratpaşa/Antalya" },
    { city: "Стамбул", address: "Kayabaşı Mah., Adnan Menderes Bulvarı No: 5/A, Blok B3, Kat 2, Daire 12, Başakşehir/İstanbul" },
  ],
};

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
