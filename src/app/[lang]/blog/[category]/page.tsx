import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { publishedArticles, type ArticleRow } from "@/lib/admin/articles";
import { listingPath } from "@/lib/catalog";
import { alanyaFlatPrices } from "@/lib/district-prices";
import { ALANYA_SCORES } from "@/lib/district-scores";
import { districtName } from "@/lib/geo";
import { redirectFor, seoFor, withSeo } from "@/lib/admin/seo";
import { BLOG_CATEGORIES, CATEGORY_BY_SLUG, blogPath } from "@/lib/blog";
import { alternates } from "@/lib/i18n";
import { INDEXABLE } from "@/lib/site";
import { R } from "@/lib/routes";
import CatalogHeader from "@/components/CatalogHeader";
import { ArticleCard, CategoryNav } from "@/components/blog";
import { Breadcrumbs, Faq } from "@/components/catalog-blocks";
import DistrictCompare, { type CompareRow } from "@/components/DistrictCompare";

export const revalidate = 600;
export function generateStaticParams() {
  return BLOG_CATEGORIES.map((c) => ({ category: c.slug }));
}

type Props = { params: Promise<{ lang: string; category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = CATEGORY_BY_SLUG[(await params).category];
  if (!c) return {};
  const url = blogPath(c.slug);
  const count = (await publishedArticles()).filter((a) => a.category === c.slug).length;
  return withSeo({
    title: { absolute: `${c.title} | AZPO Estate` },
    description: c.description,
    alternates: alternates(url),
    // An empty section stays out of the index until it has articles.
    robots: INDEXABLE && count > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: c.title, description: c.description, url },
  }, await seoFor(url));
}

/** Alanya districts for the comparison table: editorial scores plus live prices and counts of the catalogue. */
async function compareRows(guides: ArticleRow[]): Promise<CompareRow[]> {
  const prices = await alanyaFlatPrices();
  return ALANYA_SCORES.map((d) => {
    const here = prices.all.filter((p) => p.districtSlug === d.slug);
    const guide = guides.find((a) => a.geo === `alanya/${d.slug}`);
    return {
      slug: d.slug, name: districtName(d.slug), guide: guide ? blogPath(guide.category, guide.slug) : null,
      catalog: listingPath({ city: "alanya", district: d.slug }), toCenter: d.toCenter, sea: d.sea, note: d.note,
      pm: prices.by[d.slug], count: here.length, scores: d.scores,
    };
  });
}

/** Questions people ask about choosing a district, answered from the same table. */
function compareFaq(rows: CompareRow[]) {
  const names = (test: (r: CompareRow) => boolean) => rows.filter(test).map((r) => r.name).join(", ");
  const priced = rows.filter((r) => r.pm).sort((a, b) => a.pm! - b.pm!);
  const eur = (n: number) => `${n.toLocaleString("ru-RU")} €`;
  const items = [
    { q: "В каком районе Алании лучше жить круглый год?", a: `Для постоянной жизни удобнее всего ${names((r) => r.scores.life === 5)}: школы, клиники и магазины рядом и работают зимой. Немного спокойнее, но тоже с развитой инфраструктурой: ${names((r) => r.scores.life === 4)}.` },
    { q: "Где в Алании купить квартиру под аренду?", a: `Самый стабильный спрос на аренду в центре Алании. Хорошо сдаются также ${names((r) => r.scores.rent === 4)}. Для сдачи летом важны пляж и набережная рядом, для сдачи на долгий срок важнее инфраструктура.` },
    { q: "Какие районы Алании самые тихие?", a: `${names((r) => r.scores.quiet === 5)}. Взамен до центра дальше, а зимой там меньше открытых магазинов и кафе.` },
    { q: "Какие районы Алании не у моря?", a: `${names((r) => r.sea.m > 0)}: до пляжа оттуда от 700 м до 5 км. Джикджилли выбирают за школы, магазины и новые комплексы рядом, Тепе — за виды на море и крепость и за тишину.` },
  ];
  if (priced.length >= 4) {
    const cheap = priced.slice(0, 3).map((r) => `${r.name} (${eur(r.pm!)})`).join(", ");
    const top = priced.slice(-2).reverse().map((r) => `${r.name} (${eur(r.pm!)})`).join(" и ");
    items.push({ q: "Где в Алании самые доступные цены на квартиры?", a: `По каталогу AZPO самый низкий средний метр в квартирах сейчас в районах ${cheap}. Дороже всего ${top}. Цены обновляются вместе с каталогом.` });
  }
  return items;
}

export default async function Category({ params }: Props) {
  const slug = (await params).category;
  const c = CATEGORY_BY_SLUG[slug];
  if (!c) {
    // Old blog URLs (azpo.ru/ru/blog/<post>/) land here: send them to the article's new address.
    const to = await redirectFor(blogPath(slug));
    if (to) permanentRedirect(to);
    notFound();
  }
  const url = blogPath(c.slug);
  const [items, seo] = await Promise.all([publishedArticles().then((all) => all.filter((a) => a.category === c.slug)), seoFor(url)]);
  const compare = c.slug === "area-guides" ? await compareRows(items) : null;
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Блог", href: blogPath() }, { name: c.name, href: url }]} />
      <CatalogHeader eyebrow="Блог AZPO" title={seo?.h1 ?? c.h1} sub={seo?.intro ?? c.description} img="/img/dest/antalya.webp" />
      <CategoryNav current={c.slug} />
      {compare && <DistrictCompare rows={compare} />}
      {compare && items.length > 0 && (
        <h2 className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />Гиды по районам
        </h2>
      )}
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      ) : (
        <p className="rounded-[28px_8px_28px_8px] bg-white p-8 text-slate-600">В этом разделе статьи скоро появятся.</p>
      )}
      {compare && <Faq title="Как выбрать район в Алании" items={compareFaq(compare)} />}
    </div>
  );
}
