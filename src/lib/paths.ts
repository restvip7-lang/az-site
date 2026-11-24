// Object URLs and names, shared by server pages and client components (no data imports here).
import { CITIES, districtIn } from "./geo";

export const LANG = "ru";

type Loc = { id: number; city: string; districtSlug: string | null };

/** Card URL inside the geo hierarchy: /ru/turkey/alanya/mahmutlar/sale/id1046/ */
export function cardPath(p: Loc) {
  if (!CITIES[p.city]) return `/${LANG}/turkey/sale/id${p.id}/`;
  return `/${LANG}/turkey/${p.city}/${p.districtSlug ? `${p.districtSlug}/` : ""}sale/id${p.id}/`;
}

export function roomsLabel(p: { bedMin: number; bedMax: number }) {
  const f = (n: number) => `${n}+1`;
  if (p.bedMax > p.bedMin) return `${f(p.bedMin)} – ${f(p.bedMax)}`;
  return p.bedMin === 0 ? "Студия" : f(p.bedMin);
}

const SINGULAR: Record<string, string> = {
  Квартиры: "Квартира", Виллы: "Вилла", Пентхаусы: "Пентхаус", Дуплексы: "Дуплекс", Коммерческая: "Коммерческое помещение", Отели: "Отель",
};

type Named = Loc & { types: string[]; isProject: boolean; bedMin: number; bedMax: number; area: number | null; district: string | null };

/** "Квартира 2+1 в Махмутларе, 110 м²" — used for titles and image alt texts. */
export function objectName(p: Named, opts: { where?: boolean } = {}) {
  const kind = SINGULAR[p.types[0]] ?? (p.isProject ? "Новостройка" : "Недвижимость");
  const rooms = p.bedMin || p.bedMax ? ` ${roomsLabel(p)}` : "";
  const where = opts.where === false ? "" : p.districtSlug ? ` в ${districtIn(p.districtSlug, p.district)}` : CITIES[p.city] ? ` в ${CITIES[p.city].in}` : "";
  const area = p.area ? `, ${p.area} м²` : "";
  return `${kind}${rooms}${where}${area}`;
}
