// The catalogue landing matrix from the SEO spec: geo (country | city | district) × deal (sale)
// × property type × at most one feature, plus project (new-build) listings and object cards.
// One module decides URLs, what a page lists, whether it is indexable, and its texts.

import type { Property } from "./api";
import { formatPrice, plural } from "./format";
import { CITIES, cityIn, cityName, districtName, geoIn, neighbours } from "./geo";

import { LANG } from "./paths";
export { LANG, cardPath } from "./paths";
export const PAGE_SIZE = 24;
/** Landing pages with fewer objects stay reachable but are noindex and left out of the sitemap. */
export const INDEX_MIN = 3;

export interface TypeDef {
  slug: string;
  api: string; // type name in the AZPO catalogue
  name: string; // "Квартиры"
  lower: string; // "квартиры"
  sg: string; // "Квартира"
  acc: string; // "купить квартиру"
  forms: [string, string, string];
  residential: boolean;
  about: string;
}

export const TYPES: TypeDef[] = [
  {
    slug: "apartments", api: "Квартиры", name: "Квартиры", lower: "квартиры", sg: "Квартира", acc: "квартиру",
    forms: ["квартира", "квартиры", "квартир"], residential: true,
    about: "Квартиры — самый ликвидный сегмент турецкого рынка: их проще сдать в аренду и при необходимости продать. Планировки в Турции обозначают по числу спален и гостиных: 1+1 — одна спальня и гостиная с кухней, 2+1 — две спальни и гостиная. В комплексах обычно есть бассейн, охрана и зоны отдыха, а ежемесячный взнос (айдат) покрывает их содержание.",
  },
  {
    slug: "villas", api: "Виллы", name: "Виллы", lower: "виллы", sg: "Вилла", acc: "виллу",
    forms: ["вилла", "виллы", "вилл"], residential: true,
    about: "Виллы выбирают для жизни всей семьёй и для посуточной аренды туристам. Как правило, это отдельный дом с участком, часто с собственным бассейном. Перед покупкой важно проверить статус земли и разрешения на строительство: это делает юридический отдел AZPO.",
  },
  {
    slug: "penthouses", api: "Пентхаусы", name: "Пентхаусы", lower: "пентхаусы", sg: "Пентхаус", acc: "пентхаус",
    forms: ["пентхаус", "пентхауса", "пентхаусов"], residential: true,
    about: "Пентхаусы — квартиры на верхних этажах с большими террасами и открытым видом. Их покупают как премиальное жильё для себя: предложений заметно меньше, чем обычных квартир, поэтому удачные варианты уходят быстро.",
  },
  {
    slug: "duplexes", api: "Дуплексы", name: "Дуплексы", lower: "дуплексы", sg: "Дуплекс", acc: "дуплекс",
    forms: ["дуплекс", "дуплекса", "дуплексов"], residential: true,
    about: "Дуплексы — двухуровневые квартиры: на одном уровне гостиная и кухня, на другом спальни или терраса. Это компромисс между квартирой и виллой: больше пространства при той же инфраструктуре комплекса.",
  },
  {
    slug: "commercial", api: "Коммерческая", name: "Коммерческая недвижимость", lower: "коммерческая недвижимость", sg: "Коммерческое помещение", acc: "коммерческую недвижимость",
    forms: ["объект", "объекта", "объектов"], residential: false,
    about: "Коммерческая недвижимость — магазины, офисы и помещения под бизнес. Доходность здесь зависит от трафика и арендатора, поэтому специалисты AZPO помогают оценить локацию и условия аренды.",
  },
  {
    slug: "hotels", api: "Отели", name: "Отели", lower: "отели", sg: "Отель", acc: "отель",
    forms: ["отель", "отеля", "отелей"], residential: false,
    about: "Отели и гостевые дома продаются как готовый бизнес. Перед сделкой важно проверить лицензии, загрузку и финансовые показатели.",
  },
];
export const TYPE_BY_SLUG = Object.fromEntries(TYPES.map((t) => [t.slug, t]));

export interface FeatureDef {
  slug: string;
  label: string; // chip text
  prefix?: string; // "Элитные квартиры"
  suffix?: string; // "квартиры с видом на море"
  test: (p: Property) => boolean;
  about: string;
}

const tag = (...names: string[]) => (p: Property) => p.tags.some((t) => names.includes(t));
const rooms = (n: number) => (p: Property) => p.bedMax >= n && p.bedMin <= n;
const priceTo = (n: number) => (p: Property) => p.priceEur !== null && p.priceEur > 0 && p.priceEur <= n;
const eur = (n: number) => `${n.toLocaleString("ru-RU")} €`;

export const FEATURES: FeatureDef[] = [
  {
    slug: "sea-view", label: "С видом на море", suffix: "с видом на море", test: tag("Вид на море"),
    about: "Вид на море — один из главных факторов цены: такие объекты дороже, но быстрее сдаются и перепродаются. Перед покупкой стоит проверить, не закроет ли вид будущая застройка; специалисты AZPO подскажут по каждому объекту.",
  },
  {
    slug: "first-line", label: "На первой линии", suffix: "на первой линии", test: tag("Первая линия"),
    about: "Первая линия означает, что между домом и пляжем нет других жилых зданий, обычно только дорога или набережная. Таких объектов немного, они дороже остальных, но стабильно востребованы у арендаторов.",
  },
  {
    slug: "citizenship", label: "Под гражданство", suffix: "под гражданство", test: tag("Под Гражданство"),
    about: "Гражданство Турции можно получить при покупке недвижимости стоимостью от $400 000 с обязательством не продавать её три года. В подборку входят объекты, которые подходят под эту программу; юристы AZPO проверяют оценку и сопровождают оформление.",
  },
  {
    slug: "residence-permit", label: "Под ВНЖ", suffix: "под ВНЖ", test: tag("Под ВНЖ"),
    about: "Собственная недвижимость в Турции — основание для вида на жительство. Требования к стоимости объекта и району периодически меняются, поэтому перед покупкой юристы AZPO проверяют, подходит ли конкретный объект.",
  },
  {
    slug: "from-developer", label: "От застройщика", suffix: "от застройщика", test: tag("От застройщика"),
    about: "Покупка у застройщика на этапе строительства обычно выгоднее готового жилья, а оплата часто возможна в рассрочку. Важно проверить самого застройщика, разрешения и договор: это делает юридический отдел AZPO.",
  },
  {
    slug: "resale", label: "Вторичное жильё", suffix: "на вторичном рынке", test: tag("Вторичное жилье"),
    about: "Вторичное жильё можно увидеть вживую, заехать сразу после сделки и сразу сдавать в аренду. Перед покупкой проверяются ТАПУ, искан (разрешение на заселение), долги по коммунальным платежам и айдату.",
  },
  {
    slug: "new", label: "Новостройки", suffix: "в новостройках", test: tag("Новостройка"),
    about: "Новостройки — квартиры в недавно построенных или строящихся комплексах с бассейнами, спортзалами и охраной. Покупатель получает жильё без износа, а на ранних этапах строительства — и более низкую цену.",
  },
  {
    slug: "luxury", label: "Элитная", prefix: "Элитные", test: tag("Элитное", "Премиум класс"),
    about: "Элитная недвижимость — объекты премиум-класса: лучшие локации, качественные материалы, расширенная инфраструктура комплексов и видовые характеристики.",
  },
  {
    slug: "cheap", label: "Недорого", prefix: "Недорогие", test: tag("недорого"),
    about: "Недорогие объекты — удобный вход на рынок Турции для отдыха, сдачи в аренду или будущего переезда. Невысокая цена не означает риск: каждый объект проходит юридическую проверку.",
  },
  {
    slug: "investment", label: "Для инвестиций", suffix: "для инвестиций", test: tag("Инвестиции"),
    about: "Инвестиционные объекты специалисты AZPO отбирают по потенциалу роста цены и доходу от аренды: локация, ликвидность и стадия строительства.",
  },
  ...[1, 2, 3, 4].map((n): FeatureDef => ({
    slug: n === 1 ? "1-bedroom" : `${n}-bedrooms`,
    label: `${n}+1`,
    suffix: `${n}+1`,
    test: rooms(n),
    about: `Планировка ${n}+1 — ${n === 1 ? "одна спальня" : `${n} ${plural(n, ["спальня", "спальни", "спален"])}`} и гостиная, совмещённая с кухней. ${n === 1 ? "Такой формат чаще берут для отдыха и сдачи в аренду." : n === 2 ? "Самый популярный формат у семей и для круглогодичной жизни." : "Подходит большим семьям и тем, кому нужен кабинет или гостевая спальня."} У проектов застройщиков в подборку попадают объекты, где есть планировка ${n}+1.`,
  })),
  ...[100_000, 150_000, 200_000].map((n): FeatureDef => ({
    slug: `price-to-${n}`,
    label: `До ${eur(n)}`,
    suffix: `до ${eur(n)}`,
    test: priceTo(n),
    about: `В подборке объекты стоимостью до ${eur(n)}. Цены в долларах пересчитаны в евро по курсу ЕЦБ ориентировочно; точную стоимость и условия оплаты уточняйте у специалиста AZPO.`,
  })),
];
export const FEATURE_BY_SLUG = Object.fromEntries(FEATURES.map((f) => [f.slug, f]));

/* ───────────────────────── Query and URLs ───────────────────────── */

export interface Query {
  city?: string;
  district?: string;
  deal?: "sale";
  type?: string;
  complexes?: boolean;
  feature?: string;
  page: number;
}

export type Kind = "country" | "city" | "district" | "deal" | "type" | "feature" | "complexes";

export function kindOf(q: Query): Kind {
  if (q.complexes) return "complexes";
  if (q.feature) return "feature";
  if (q.type) return "type";
  if (q.deal) return "deal";
  if (q.district) return "district";
  if (q.city) return "city";
  return "country";
}

export const isHub = (k: Kind) => k === "country" || k === "city" || k === "district";

export interface GeoIndex {
  cities: Map<string, { count: number; districts: Map<string, { name: string; count: number }> }>;
}

export function geoIndex(all: Property[]): GeoIndex {
  const cities: GeoIndex["cities"] = new Map();
  for (const p of all) {
    if (!CITIES[p.city]) continue;
    const c = cities.get(p.city) ?? { count: 0, districts: new Map() };
    c.count++;
    if (p.districtSlug) {
      const d = c.districts.get(p.districtSlug) ?? { name: p.district ?? p.districtSlug, count: 0 };
      d.count++;
      c.districts.set(p.districtSlug, d);
    }
    cities.set(p.city, c);
  }
  return { cities };
}

export type Parsed = { kind: "listing"; q: Query } | { kind: "card"; id: number; q: Query } | { kind: "redirect"; to: string } | null;

/** Parses the path after /ru/turkey/. Unknown or out-of-order segments → null (404). */
export function parseSegments(seg: string[], geo: GeoIndex): Parsed {
  const s = seg.map((x) => decodeURIComponent(x).toLowerCase());
  const q: Query = { page: 1 };
  let i = 0;
  if (s[i] && geo.cities.has(s[i])) {
    q.city = s[i++];
    if (s[i] && geo.cities.get(q.city)!.districts.has(s[i])) q.district = s[i++];
  }
  if (s[i] === "sale") {
    q.deal = "sale";
    i++;
    const id = s[i]?.match(/^id(\d+)$/);
    if (id && i === s.length - 1 && q.city) return { kind: "card", id: Number(id[1]), q };
    if (s[i] === "complexes") {
      q.complexes = true;
      i++;
    } else if (s[i] && TYPE_BY_SLUG[s[i]]) {
      q.type = s[i++];
      if (s[i] && FEATURE_BY_SLUG[s[i]] && TYPE_BY_SLUG[q.type].residential) q.feature = s[i++];
    }
  }
  const page = s[i]?.match(/^page-(\d+)$/);
  if (page) {
    const n = Number(page[1]);
    i++;
    if (i !== s.length || n < 1) return null;
    // /page-1/ duplicates the first page: send it to the base URL.
    if (n === 1) return { kind: "redirect", to: listingPath(q) };
    q.page = n;
  }
  return i === s.length ? { kind: "listing", q } : null;
}

export function listingPath(q: Omit<Partial<Query>, "page"> & { page?: number }) {
  const parts = [q.city, q.city && q.district];
  if (q.deal || q.type || q.complexes || q.feature) parts.push("sale");
  if (q.complexes) parts.push("complexes");
  else if (q.type) parts.push(q.type, q.feature);
  const path = `/${LANG}/turkey/${parts.filter(Boolean).map((p) => `${p}/`).join("")}`;
  return q.page && q.page > 1 ? `${path}page-${q.page}/` : path;
}

export function matches(p: Property, q: Omit<Query, "page">) {
  if (q.city && p.city !== q.city) return false;
  if (q.district && p.districtSlug !== q.district) return false;
  if (q.complexes && !p.isProject) return false;
  if (q.type && !p.types.includes(TYPE_BY_SLUG[q.type].api)) return false;
  if (q.feature && !FEATURE_BY_SLUG[q.feature].test(p)) return false;
  return true;
}

export const select = (all: Property[], q: Omit<Query, "page">) => all.filter((p) => matches(p, q));

/* ───────────────────────── Statistics ───────────────────────── */

export interface Stats {
  n: number;
  min: Property | null; // cheapest object, shown in its own currency
  max: Property | null;
  avgM2: number | null; // € per m², finished objects with a single price
  newCount: number;
  resaleCount: number;
  seaView: number;
  firstLine: number;
  citizenship: number;
  projects: number;
}

export function stats(items: Property[]): Stats {
  const priced = items.filter((p) => p.priceEur);
  const byEur = [...priced].sort((a, b) => a.priceEur! - b.priceEur!);
  const m2 = items.filter((p) => !p.isProject && !p.priceMax && p.priceEur && p.area && p.area >= 20);
  const avg = m2.length >= 3 ? Math.round(m2.reduce((s, p) => s + p.priceEur! / p.area!, 0) / m2.length / 10) * 10 : null;
  const has = (t: string) => items.filter((p) => p.tags.includes(t)).length;
  return {
    n: items.length,
    min: byEur[0] ?? null,
    max: byEur[byEur.length - 1] ?? null,
    avgM2: avg,
    newCount: has("Новостройка"),
    resaleCount: has("Вторичное жилье"),
    seaView: has("Вид на море"),
    firstLine: has("Первая линия"),
    citizenship: has("Под Гражданство"),
    projects: items.filter((p) => p.isProject).length,
  };
}

export const priceOf = (p: Property | null) => (p ? formatPrice(p.price, p.currency) : "");
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

/* ───────────────────────── Texts ───────────────────────── */

const offers = (n: number) => `${n} ${plural(n, ["предложение", "предложения", "предложений"])}`;
const objectsN = (n: number) => `${n} ${plural(n, ["объект", "объекта", "объектов"])}`;
const projectsN = (n: number) => `${n} ${plural(n, ["проект", "проекта", "проектов"])}`;
const MONTHS = ["январь", "февраль", "март", "апрель", "май", "июнь", "июль", "август", "сентябрь", "октябрь", "ноябрь", "декабрь"];

export function geoOf(q: Query, geo?: GeoIndex) {
  const raw = q.city && q.district ? geo?.cities.get(q.city)?.districts.get(q.district)?.name : undefined;
  return {
    in: geoIn(q.city, q.district, raw), // "в Махмутларе"
    name: q.district ? districtName(q.district, raw) : q.city ? cityName(q.city) : "Турция",
  };
}

/** Noun phrase without "на продажу": "Элитные квартиры в Алании", "Квартиры 2+1 в Махмутларе". */
export function phrase(q: Query, geo?: GeoIndex) {
  const g = geoOf(q, geo).in;
  if (q.complexes) return `Новостройки от застройщиков ${g}`;
  const t = q.type ? TYPE_BY_SLUG[q.type] : null;
  const f = q.feature ? FEATURE_BY_SLUG[q.feature] : null;
  if (!t) return `Недвижимость ${g}`;
  if (f?.prefix) return `${f.prefix} ${t.lower} ${g}`;
  return `${t.name}${f?.suffix ? ` ${f.suffix}` : ""} ${g}`;
}

export function h1(q: Query, geo?: GeoIndex) {
  const k = kindOf(q);
  const g = geoOf(q, geo).in;
  if (isHub(k)) return `Недвижимость ${g}`;
  if (k === "deal") return `Продажа недвижимости ${g}`;
  if (k === "type") return `${TYPE_BY_SLUG[q.type!].name} ${g} на продажу`;
  return phrase(q, geo);
}

export function metaTitle(q: Query, st: Stats, geo?: GeoIndex) {
  const k = kindOf(q);
  const g = geoOf(q, geo);
  const year = new Date().getFullYear();
  const min = priceOf(st.min);
  const t = q.type ? TYPE_BY_SLUG[q.type] : null;
  let title: string;
  if (!st.n) title = `${h1(q, geo)} — AZPO Estate`;
  else if (k === "country") title = `Недвижимость в Турции — ${objectsN(st.n)} от AZPO Estate`;
  else if (k === "city") title = `Недвижимость ${g.in} (Турция) — ${objectsN(st.n)} от AZPO`;
  else if (k === "district") title = `Недвижимость ${g.in}, ${cityName(q.city!)} — цены ${year} от AZPO`;
  else if (k === "deal") title = `Купить недвижимость ${g.in} — ${objectsN(st.n)} от ${min}`;
  else if (k === "type") title = `Купить ${t!.acc} ${g.in} — ${st.n} ${plural(st.n, t!.forms)} от ${min}`;
  else if (k === "complexes") title = `Новостройки ${g.in} от застройщиков — ${projectsN(st.n)}`;
  else title = `${phrase(q, geo)} — купить, ${offers(st.n)}`;
  return q.page > 1 ? `${title} — страница ${q.page}` : title;
}

export function metaDescription(q: Query, st: Stats, geo?: GeoIndex) {
  const k = kindOf(q);
  const g = geoOf(q, geo).in;
  const min = priceOf(st.min);
  const now = new Date();
  const t = q.type ? TYPE_BY_SLUG[q.type] : null;
  if (!st.n) return `${h1(q, geo)}: подбор объектов по вашему запросу, проверка документов и сопровождение сделки AZPO Estate.`;
  if (isHub(k) || k === "deal")
    return `Продажа недвижимости ${g}: ${objectsN(st.n)}, цены от ${min}. Квартиры, виллы, новостройки и вторичка с юридическим сопровождением AZPO Estate.`;
  if (k === "type")
    return `${st.n} ${plural(st.n, t!.forms)} ${g} от собственников и застройщиков. Цены от ${min}, актуально на ${MONTHS[now.getMonth()]} ${now.getFullYear()}. Сопровождение сделки AZPO.`;
  if (k === "complexes")
    return `${projectsN(st.n)} застройщиков ${g}: цены от ${min}, строящиеся и сданные комплексы. Подбор, проверка застройщика и сопровождение сделки AZPO.`;
  return `${phrase(q, geo)}: ${offers(st.n)} от ${min}. Фото, цены, планировки, проверка документов и сопровождение сделки AZPO Estate.`;
}

export function lead(q: Query, st: Stats, geo?: GeoIndex) {
  const k = kindOf(q);
  const g = geoOf(q, geo).in;
  if (!st.n) return `Сейчас в этой подборке нет объектов. Ниже похожие варианты, а специалист AZPO подберёт объект под ваш запрос.`;
  const from = st.min ? ` от ${priceOf(st.min)}` : "";
  if (isHub(k)) return `${objectsN(st.n)} ${g}: квартиры, виллы и новостройки${from}. Подбор, проверка документов и сопровождение сделки до получения ТАПУ.`;
  if (k === "deal") return `${objectsN(st.n)} на продажу ${g}${from}.`;
  if (k === "type") {
    const t = TYPE_BY_SLUG[q.type!];
    return `${st.n} ${plural(st.n, t.forms)} на продажу ${g}${from}.`;
  }
  if (k === "complexes") return `${projectsN(st.n)} застройщиков ${g}${from}: цены по планировкам, сроки сдачи и условия оплаты.`;
  return `${phrase(q, geo)}: ${offers(st.n)}${from}.`;
}

/* Geo descriptions for SEO texts. Kept factual and short; long copy for the top pages comes from the admin. */
const CITY_ABOUT: Record<string, string> = {
  alanya: "Алания — курортный город на востоке Анталийского побережья, примерно в двух часах езды от аэропорта Анталии и в 40 минутах от аэропорта Газипаша. Покупателей привлекают мягкий климат, длинная линия пляжей и одни из самых доступных цен на побережье, а большое русскоязычное сообщество упрощает переезд.",
  antalya: "Анталия — крупнейший город Турецкой Ривьеры с международным аэропортом, развитой медициной, университетами и круглогодичной городской жизнью. Здесь покупают и для переезда, и для сдачи в аренду: спрос держится весь год, а не только в сезон.",
  istanbul: "Стамбул — экономический центр Турции и самый большой рынок недвижимости страны. Здесь сосредоточены крупные проекты застройщиков, бизнес и транспортная инфраструктура, а покупку часто рассматривают как долгосрочное вложение и путь к гражданству.",
  fethiye: "Фетхие — город на стыке Средиземного и Эгейского морей с бухтами, островами и знаменитым пляжем Олюдениз. Рынок здесь спокойнее, чем в курортных мегаполисах, а основной спрос — на виллы и малоэтажные комплексы.",
  belek: "Белек — курортная зона недалеко от аэропорта Анталии, известная гольф-полями, отелями премиум-класса и песчаными пляжами. Здесь покупают виллы и квартиры для отдыха и сдачи в аренду туристам.",
  mersin: "Мерсин — крупный портовый город на востоке средиземноморского побережья с более низким порогом входа, чем в Анталии и Алании. Покупателей привлекают новые жилые комплексы у моря и потенциал роста цен.",
  bodrum: "Бодрум — престижный курорт Эгейского побережья с яхтенными маринами, бухтами и виллами. Здесь высокая доля дорогих объектов, а покупку чаще рассматривают как статусное жильё для отдыха.",
};

const DISTRICT_ABOUT: Record<string, string> = {
  "alanya/center": "Центр Алании — исторический район у крепости и пляжа Клеопатра: набережная, магазины, рестораны и вся городская инфраструктура в пешей доступности.",
  "alanya/oba": "Оба — зелёный жилой район к востоку от центра Алании с больницами, торговыми центрами и школами. Его выбирают те, кто переезжает жить круглый год.",
  "alanya/mahmutlar": "Махмутлар — один из самых популярных у русскоязычных покупателей районов Алании, к востоку от центра: длинная набережная, большой выбор комплексов с бассейнами и доступные цены.",
  "alanya/kargicak": "Каргыджак — район к востоку от Махмутлара с видовыми проектами на склонах и новыми комплексами премиум-класса.",
  "alanya/cikcili": "Джикджилли — район на холмах над Оба и Тосмуром с панорамными видами на море и крепость и спокойной жилой застройкой.",
  "alanya/kestel": "Кестель — прибрежный район между Тосмуром и Махмутларом с пляжами, новыми комплексами и спокойной атмосферой.",
  "alanya/tosmur": "Тосмур — небольшой район у реки Димчай рядом с центром Алании: пляж, тихие улицы и быстрая дорога в город.",
  "alanya/avsallar": "Авсаллар — курортный район к западу от Алании у песчаных пляжей Инджекума, с большим выбором новых комплексов по доступным ценам.",
  "alanya/kleopatra": "Район пляжа Клеопатра — западная часть центра Алании у одного из самых известных пляжей Турции.",
  "alanya/konakli": "Конаклы — район к западу от центра Алании с пляжами, новыми проектами и спокойной курортной жизнью.",
  "antalya/konyaalti": "Коньяалты — западный район Анталии вдоль одноимённого пляжа, с парками, набережной и видом на горы.",
  "antalya/muratpasa": "Муратпаша — центральный район Анталии со старым городом Калеичи, пляжем Лара и развитой городской инфраструктурой.",
  "antalya/aksu": "Аксу — восточный район Анталии рядом с аэропортом и курортной зоной Лары, где активно строятся новые комплексы.",
  "antalya/kepez": "Кепез — большой жилой район на севере Анталии с доступными ценами и новыми городскими проектами.",
  "antalya/dosemealti": "Дёшемеалты — район на севере Анталии с виллами и малоэтажной застройкой среди сосен.",
  "antalya/kemer": "Кемер — курортный район к юго-западу от Анталии между горами и морем.",
};

export function geoAbout(q: Query, geo?: GeoIndex) {
  if (q.city && q.district) {
    const raw = geo?.cities.get(q.city)?.districts.get(q.district)?.name;
    return DISTRICT_ABOUT[`${q.city}/${q.district}`] ?? `${districtName(q.district, raw)} — район ${cityIn(q.city) === CITIES[q.city]?.in ? `города ${cityName(q.city)}` : cityName(q.city)}, где AZPO подбирает квартиры, виллы и проекты застройщиков.`;
  }
  if (q.city) return CITY_ABOUT[q.city] ?? `${cityName(q.city)} — одно из направлений, где AZPO подбирает недвижимость.`;
  return "Турция — один из самых доступных рынков недвижимости у моря для иностранцев: покупка без ограничений для большинства стран, оформление права собственности (ТАПУ) за несколько недель, возможность получить ВНЖ, а при покупке от $400 000 — гражданство.";
}

export interface SeoBlock { h: string; p: string[] }

/** SEO text under the listing: geo, prices from the catalogue, the segment, and how AZPO helps. */
export function seoText(q: Query, items: Property[], st: Stats, geo?: GeoIndex): SeoBlock[] {
  const k = kindOf(q);
  const g = geoOf(q, geo);
  const t = q.type ? TYPE_BY_SLUG[q.type] : null;
  const f = q.feature ? FEATURE_BY_SLUG[q.feature] : null;
  const out: SeoBlock[] = [];

  const byType = TYPES.map((tt) => [tt, items.filter((p) => p.types.includes(tt.api)).length] as const).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const mix = byType.slice(0, 4).map(([tt, n]) => `${n} ${plural(n, tt.forms)}`.replace(/^(\d+) объект/, "$1 коммерческих объект"));

  out.push({
    h: k === "complexes" ? `Проекты застройщиков ${g.in}` : `${t ? t.name : "Недвижимость"} ${g.in}${f ? `: ${f.label.toLowerCase()}` : ""}`,
    p: [
      geoAbout(q, geo),
      st.n
        ? `Сейчас в каталоге AZPO ${objectsN(st.n)} ${g.in}${!t && mix.length > 1 ? `, из них ${mix.join(", ")}` : ""}. ${st.projects && k !== "complexes" ? `${projectsN(st.projects)} — новостройки от застройщиков с ценами по планировкам. ` : ""}Каталог обновляется ежедневно: проданные объекты снимаются, новые появляются в подборке автоматически.`
        : `Сейчас в этой подборке нет объектов, но каталог AZPO обновляется каждый день. Оставьте заявку, и специалист пришлёт подходящие варианты, как только они появятся.`,
    ],
  });

  if (st.n) {
    const parts = [`Цены ${g.in} начинаются от ${priceOf(st.min)}${st.max && st.max !== st.min ? `, самые дорогие предложения — до ${formatPrice(st.max.priceMax ?? st.max.price, st.max.currency)}` : ""}.`];
    if (st.avgM2) parts.push(`Средняя цена квадратного метра в готовых объектах — около ${st.avgM2.toLocaleString("ru-RU")} € (доллары пересчитаны в евро по курсу ЕЦБ).`);
    const shares = [
      st.newCount && `${pct(st.newCount, st.n)}% — новостройки`,
      st.resaleCount && `${pct(st.resaleCount, st.n)}% — вторичное жильё`,
      st.seaView && `${pct(st.seaView, st.n)}% — с видом на море`,
    ].filter(Boolean);
    if (shares.length) parts.push(`Из всех предложений ${shares.join(", ")}.`);
    if (st.citizenship) parts.push(`${objectsN(st.citizenship)} ${plural(st.citizenship, ["подходит", "подходят", "подходят"])} для получения гражданства Турции.`);
    out.push({ h: `Цены на ${t ? t.lower : "недвижимость"} ${g.in}`, p: [parts.join(" ")] });
  }

  const segment = [f?.about, t?.about, k === "complexes" ? "Проекты застройщиков — жилые комплексы на этапе строительства или недавно сданные. Цены указаны «от» и «до» по планировкам, оплата часто возможна в рассрочку до сдачи дома. Перед покупкой юристы AZPO проверяют застройщика, разрешения на строительство и договор." : null].filter((x): x is string => !!x);
  if (!segment.length) segment.push("В каталоге представлены квартиры, виллы, пентхаусы и дуплексы — как готовое жильё, так и проекты застройщиков на этапе строительства. Используйте подборки ниже, чтобы сузить выбор по типу, бюджету и особенностям объекта.");
  out.push({ h: f ? `Что важно знать: ${f.label.toLowerCase()}` : t ? `Что важно знать при покупке: ${t.lower}` : "Что можно купить", p: segment });

  out.push({
    h: "Как купить с AZPO",
    p: [
      "AZPO работает на рынке Турции больше 25 лет, у компании офисы в Алании, Анталии и Стамбуле. Специалист подбирает объекты под бюджет и цель покупки, проводит показ вживую или по видеосвязи, а юридический отдел проверяет ТАПУ, обременения, искан и долги по объекту до внесения задатка.",
      "После сделки AZPO помогает с ВНЖ, подключением коммунальных услуг, ремонтом и мебелью, а также со сдачей объекта в аренду.",
    ],
  });
  return out;
}

export function faq(q: Query, st: Stats, geo?: GeoIndex): { q: string; a: string }[] {
  const g = geoOf(q, geo).in;
  const t = q.type ? TYPE_BY_SLUG[q.type] : null;
  const what = q.complexes ? "квартира в новостройке" : t ? t.sg.toLowerCase() : "недвижимость";
  const items: { q: string; a: string }[] = [];
  if (st.n)
    items.push({
      q: `Сколько стоит ${what} ${g}?`,
      a: `Сейчас в каталоге AZPO ${objectsN(st.n)} ${g} по цене от ${priceOf(st.min)}${st.max && st.max !== st.min ? ` до ${formatPrice(st.max.priceMax ?? st.max.price, st.max.currency)}` : ""}.${st.avgM2 ? ` Средняя цена квадратного метра в готовых объектах — около ${st.avgM2.toLocaleString("ru-RU")} €.` : ""} Цену и условия оплаты конкретного объекта уточняйте у специалиста: застройщики периодически меняют прайс.`,
    });
  items.push({
    q: `Можно ли получить гражданство Турции при покупке недвижимости ${g}?`,
    a: `Да, если стоимость недвижимости не меньше $400 000 и вы обязуетесь не продавать её три года. ${st.citizenship ? `${objectsN(st.citizenship)} ${g} в каталоге AZPO ${plural(st.citizenship, ["подходит", "подходят", "подходят"])} под эту программу.` : "Специалист AZPO подберёт подходящие объекты."} Юристы компании сопровождают оформление от оценки до получения паспорта.`,
  });
  items.push({
    q: `Можно ли купить недвижимость ${g} дистанционно?`,
    a: "Да. Специалист AZPO проведёт онлайн-показ, юристы проверят документы объекта, а сделку можно оформить по нотариальной доверенности без поездки в Турцию.",
  });
  items.push({
    q: "Какие расходы есть при покупке, кроме цены объекта?",
    a: "Основной платёж — сбор за регистрацию права собственности (ТАПУ), 4% от стоимости, указанной в сделке; по закону он делится между покупателем и продавцом, но на практике его часто оплачивает покупатель. Дополнительно оплачиваются перевод и нотариус, обязательная страховка от землетрясений DASK и подключение коммунальных услуг. Точную смету специалист AZPO рассчитает для выбранного объекта.",
  });
  if (st.projects && !q.complexes)
    items.push({
      q: `Есть ли новостройки от застройщиков ${g}?`,
      a: `Да, в каталоге ${projectsN(st.projects)} застройщиков ${g}. У многих застройщиков можно купить квартиру на этапе строительства с рассрочкой до сдачи дома.`,
    });
  return items.slice(0, 6);
}

/* ───────────────────────── Interlinking ───────────────────────── */

export interface LinkItem { href: string; label: string; count: number; sub?: string }

const withCount = (all: Property[], q: Omit<Query, "page">, label: string, sub?: string): LinkItem => ({
  href: listingPath(q),
  label,
  count: select(all, q).length,
  sub,
});
const indexable = (l: LinkItem) => l.count >= INDEX_MIN;
const geoQ = (q: Query) => ({ city: q.city, district: q.district });

/** Child geo: cities of the country or districts of a city, with counts. */
export function childGeo(all: Property[], q: Query, geo: GeoIndex): LinkItem[] {
  if (q.district) return [];
  if (q.city) {
    const c = geo.cities.get(q.city);
    return [...(c?.districts ?? [])]
      .map(([slug, d]) => ({ href: listingPath({ city: q.city, district: slug }), label: districtName(slug, d.name), count: d.count }))
      .sort((a, b) => b.count - a.count);
  }
  return [...geo.cities]
    .map(([city, c]) => ({ href: listingPath({ city }), label: cityName(city), count: c.count }))
    .sort((a, b) => b.count - a.count);
}

/** "Популярное": 6–10 semantic landings of the geo. */
export function popular(all: Property[], q: Query, geo: GeoIndex): LinkItem[] {
  const base = geoQ(q);
  const g = geoOf(q, geo).in;
  const cand: [Omit<Query, "page">, string][] = [
    [{ ...base, deal: "sale", type: "apartments" }, `Квартиры ${g}`],
    [{ ...base, deal: "sale", type: "villas" }, `Виллы ${g}`],
    [{ ...base, deal: "sale", type: "apartments", feature: "sea-view" }, "Квартиры с видом на море"],
    [{ ...base, deal: "sale", type: "apartments", feature: "first-line" }, "Квартиры на первой линии"],
    [{ ...base, deal: "sale", type: "apartments", feature: "cheap" }, "Недорогие квартиры"],
    [{ ...base, deal: "sale", type: "apartments", feature: "luxury" }, "Элитные квартиры"],
    [{ ...base, deal: "sale", type: "apartments", feature: "from-developer" }, "Квартиры от застройщика"],
    [{ ...base, deal: "sale", type: "apartments", feature: "resale" }, "Вторичное жильё"],
    [{ ...base, deal: "sale", type: "apartments", feature: "citizenship" }, "Под гражданство"],
    [{ ...base, deal: "sale", complexes: true }, "Новостройки от застройщиков"],
    [{ ...base, deal: "sale", type: "penthouses" }, `Пентхаусы ${g}`],
    [{ ...base, deal: "sale", type: "duplexes" }, `Дуплексы ${g}`],
  ];
  return cand.map(([qq, l]) => withCount(all, qq, l)).filter(indexable).slice(0, 10);
}

/** "Уточнить запрос": feature landings of this type in this geo; for deal pages — types. */
export function refine(all: Property[], q: Query): LinkItem[] {
  const base = geoQ(q);
  if (q.type && TYPE_BY_SLUG[q.type].residential)
    return FEATURES.filter((f) => f.slug !== q.feature)
      .map((f) => withCount(all, { ...base, deal: "sale", type: q.type, feature: f.slug }, f.label))
      .filter(indexable);
  return TYPES.map((t) => withCount(all, { ...base, deal: "sale", type: t.slug }, t.name)).filter(indexable);
}

export function otherTypes(all: Property[], q: Query): LinkItem[] {
  if (!q.type) return [];
  return TYPES.filter((t) => t.slug !== q.type)
    .map((t) => withCount(all, { ...geoQ(q), deal: "sale", type: t.slug, feature: t.residential ? q.feature : undefined }, t.name))
    .filter(indexable);
}

/** The same category in neighbouring districts (district pages) or in other cities (city pages). */
export function sameElsewhere(all: Property[], q: Query, geo: GeoIndex): LinkItem[] {
  const rest = { deal: q.deal, type: q.type, feature: q.feature, complexes: q.complexes };
  if (!q.deal) return [];
  if (q.city && q.district) {
    const avail = [...(geo.cities.get(q.city)?.districts.keys() ?? [])];
    return neighbours(q.city, q.district, avail)
      .map((d) => withCount(all, { city: q.city, district: d, ...rest }, `${phrase({ ...rest, city: q.city, district: d, page: 1 }, geo)}`))
      .filter(indexable)
      .slice(0, 8);
  }
  return [...geo.cities.keys()]
    .filter((c) => c !== q.city)
    .map((c) => withCount(all, { city: c, ...rest }, phrase({ ...rest, city: c, page: 1 }, geo)))
    .filter(indexable)
    .slice(0, 8);
}

export function neighbourHubs(all: Property[], q: Query, geo: GeoIndex): LinkItem[] {
  if (!q.city || !q.district || q.deal) return [];
  const c = geo.cities.get(q.city);
  const avail = [...(c?.districts.keys() ?? [])];
  return neighbours(q.city, q.district, avail)
    .slice(0, 8)
    .map((d) => ({ href: listingPath({ city: q.city, district: d }), label: districtName(d, c?.districts.get(d)?.name), count: c?.districts.get(d)?.count ?? 0 }));
}

/* ───────────────────────── Breadcrumbs ───────────────────────── */

export interface Crumb { name: string; href: string }

export function crumbs(q: Query, geo?: GeoIndex): Crumb[] {
  const out: Crumb[] = [{ name: "Главная", href: `/${LANG}/` }, { name: "Турция", href: listingPath({}) }];
  if (q.city) out.push({ name: cityName(q.city), href: listingPath({ city: q.city }) });
  if (q.city && q.district) {
    const raw = geo?.cities.get(q.city)?.districts.get(q.district)?.name;
    out.push({ name: districtName(q.district, raw), href: listingPath({ city: q.city, district: q.district }) });
  }
  const base = geoQ(q);
  if (q.deal) out.push({ name: "Продажа", href: listingPath({ ...base, deal: "sale" }) });
  if (q.complexes) out.push({ name: "Новостройки", href: listingPath({ ...base, complexes: true }) });
  if (q.type) out.push({ name: TYPE_BY_SLUG[q.type].name, href: listingPath({ ...base, type: q.type }) });
  if (q.type && q.feature) out.push({ name: phrase({ ...base, type: q.type, feature: q.feature, page: 1 }, geo).replace(/ (в|на) .*$/, ""), href: listingPath({ ...base, type: q.type, feature: q.feature }) });
  return out;
}

/** The whole set of listing pages, for the sitemap and static generation. */
export function allListings(all: Property[], geo: GeoIndex) {
  const geos: { city?: string; district?: string }[] = [{}];
  for (const [city, c] of geo.cities) {
    geos.push({ city });
    for (const d of c.districts.keys()) geos.push({ city, district: d });
  }
  const out: { q: Query; count: number; hub: boolean }[] = [];
  for (const g of geos) {
    const inGeo = select(all, g);
    out.push({ q: { ...g, page: 1 }, count: inGeo.length, hub: true });
    if (!inGeo.length) continue;
    out.push({ q: { ...g, deal: "sale", page: 1 }, count: inGeo.length, hub: false });
    out.push({ q: { ...g, deal: "sale", complexes: true, page: 1 }, count: inGeo.filter((p) => p.isProject).length, hub: false });
    for (const t of TYPES) {
      const inType = inGeo.filter((p) => p.types.includes(t.api));
      if (!inType.length) continue;
      out.push({ q: { ...g, deal: "sale", type: t.slug, page: 1 }, count: inType.length, hub: false });
      if (!t.residential) continue;
      for (const f of FEATURES) out.push({ q: { ...g, deal: "sale", type: t.slug, feature: f.slug, page: 1 }, count: inType.filter(f.test).length, hub: false });
    }
  }
  return out;
}

/** Index rule from the spec: hubs always, other landings from 3 objects. */
export const isIndexable = (k: Kind, count: number) => isHub(k) || count >= INDEX_MIN;
