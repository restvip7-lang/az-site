// Blog sections (spec: laws, area guides, news) and article URLs. Shared by the site and the admin.
import { LANG } from "./paths";

export interface BlogCategory {
  slug: "laws" | "area-guides" | "news";
  name: string; // menu and breadcrumbs
  h1: string;
  title: string; // <title>
  description: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    slug: "laws",
    name: "Законы и оформление",
    h1: "Законы и оформление недвижимости в Турции",
    title: "Законы, налоги и документы при покупке недвижимости в Турции",
    description: "Как купить недвижимость в Турции по закону: ТАПУ, налоги, ВНЖ и гражданство, проверка объекта и изменения правил. Статьи юристов и специалистов AZPO.",
  },
  {
    slug: "area-guides",
    name: "Гайды по районам",
    h1: "Гайды по городам и районам Турции",
    title: "Гайды по районам Алании, Анталии, Стамбула и других городов Турции",
    description: "Где купить недвижимость в Турции: обзоры городов и районов, инфраструктура, пляжи, цены и для кого подходит каждый район. Гайды AZPO Estate.",
  },
  {
    slug: "news",
    name: "Новости",
    h1: "Новости рынка недвижимости Турции",
    title: "Новости недвижимости Турции и компании AZPO",
    description: "Новости рынка недвижимости Турции: цены, новые проекты застройщиков, изменения законов, события компании AZPO Estate.",
  },
];

export const CATEGORY_BY_SLUG: Record<string, BlogCategory> = Object.fromEntries(BLOG_CATEGORIES.map((c) => [c.slug, c]));
export const isCategory = (v: string): v is BlogCategory["slug"] => v in CATEGORY_BY_SLUG;

export const blogPath = (category?: string, slug?: string) =>
  `/${LANG}/blog/${category ? `${category}/` : ""}${category && slug ? `${slug}/` : ""}`;

const RU: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch",
  ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  ı: "i", ş: "s", ğ: "g", ü: "u", ö: "o", ç: "c",
};

/** URL slug from a Russian or Turkish title: "Налог на имущество в 2026" → "nalog-na-imuschestvo-v-2026". */
export function slugFromTitle(title: string, max = 80) {
  const s = [...title.toLowerCase()].map((c) => RU[c] ?? c).join("")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return s.length > max ? s.slice(0, max).replace(/-[^-]*$/, "") : s;
}

export const isSlug = (v: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);

/** Reading time in minutes, ~180 words a minute for Russian text. */
export const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 180));
