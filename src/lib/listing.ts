// GET filters on top of a landing page (?price_from=&price_to=&rooms=&sort=&q=).
// They never create indexable URLs: such pages are noindex with a canonical to the clean URL.
import type { Property } from "./api";

export const SORTS = {
  new: "Сначала новые",
  cheap: "Сначала дешёвые",
  expensive: "Сначала дорогие",
  area: "По площади",
} as const;
export type Sort = keyof typeof SORTS;

export interface Filters {
  price_from?: number;
  price_to?: number;
  rooms?: number;
  sort?: Sort;
  q?: string;
}

export const FILTER_KEYS = ["price_from", "price_to", "rooms", "sort", "q"] as const;

export function parseFilters(sp: URLSearchParams): Filters {
  const num = (k: string) => {
    const v = Number(sp.get(k));
    return Number.isFinite(v) && v > 0 ? v : undefined;
  };
  const sort = sp.get("sort");
  return {
    price_from: num("price_from"),
    price_to: num("price_to"),
    rooms: num("rooms"),
    sort: sort && sort in SORTS ? (sort as Sort) : undefined,
    q: sp.get("q")?.trim().toLowerCase() || undefined,
  };
}

export function applyFilters(items: Property[], f: Filters) {
  const r = items.filter((p) => {
    if (f.price_from && (p.priceEur ?? 0) < f.price_from) return false;
    if (f.price_to && (!p.priceEur || p.priceEur > f.price_to)) return false;
    if (f.rooms) {
      if (f.rooms >= 5 ? p.bedMax < 5 : !(p.bedMin <= f.rooms && p.bedMax >= f.rooms)) return false;
    }
    if (f.q && !`${p.id} ${p.title} ${p.district ?? ""}`.toLowerCase().includes(f.q)) return false;
    return true;
  });
  const by: Record<Sort, (a: Property, b: Property) => number> = {
    new: (a, b) => b.id - a.id,
    cheap: (a, b) => (a.priceEur ?? Infinity) - (b.priceEur ?? Infinity),
    expensive: (a, b) => (b.priceEur ?? 0) - (a.priceEur ?? 0),
    area: (a, b) => (b.area ?? 0) - (a.area ?? 0),
  };
  return r.sort(by[f.sort ?? "new"]);
}
