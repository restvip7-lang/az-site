import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getAllProperties, getPropertyDetails, toCard, type Property } from "@/lib/api";
import {
  FEATURES, PAGE_SIZE, TYPES, cardPath, childGeo, crumbs, faq, geoIndex, geoOf, h1, isHub, isIndexable, kindOf, lead,
  listingPath, metaDescription, metaTitle, neighbourHubs, otherTypes, parseSegments, phrase, popular, priceOf, refine,
  sameElsewhere, select, seoText, stats, type GeoIndex, type Query,
} from "@/lib/catalog";
import { cityName, districtName } from "@/lib/geo";
import { alternates } from "@/lib/i18n";
import { objectName } from "@/lib/paths";
import { R } from "@/lib/routes";
import { INDEXABLE, JsonLd, SITE_URL } from "@/lib/site";
import { publishedArticles, type ArticleRow } from "@/lib/admin/articles";
import { redirectFor, seoFor, withSeo, type SeoRow } from "@/lib/admin/seo";
import CatalogHeader, { DEST_IMG } from "@/components/CatalogHeader";
import CatalogListing, { type Nav } from "@/components/CatalogListing";
import LeadForm from "@/components/LeadForm";
import ObjectPage, { objectH1 } from "@/components/ObjectPage";
import { GuideTeaser } from "@/components/blog";
import { Breadcrumbs, Faq, GeoCards, LinkBlock, PriceStats, SeoText } from "@/components/catalog-blocks";

// Landing pages and cards are regenerated in the background every 10 minutes (ISR);
// the first request to a page renders it, later ones get the cached HTML.
export const revalidate = 600;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ lang: string; seg?: string[] }> };

async function resolve(seg: string[] = []) {
  const all = await getAllProperties();
  const geo = geoIndex(all);
  return { all, geo, parsed: parseSegments(seg, geo) };
}

const robots = (index: boolean) => (INDEXABLE && index ? { index: true, follow: true } : { index: false, follow: true });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seg } = await params;
  const { all, geo, parsed } = await resolve(seg);
  if (!parsed || parsed.kind === "redirect") return {};

  if (parsed.kind === "card") {
    const d = await getPropertyDetails(parsed.id);
    if (!d) return {};
    const p = { ...d.property, priceEur: all.find((x) => x.id === parsed.id)?.priceEur ?? null };
    const price = priceOf(p);
    const base = objectName(p);
    let title = `${base} — купить за ${price} (ID ${p.id})`;
    if (title.length > 70) title = `${base} — ${price} (ID ${p.id})`;
    const desc = d.description ? d.description.replace(/\s+/g, " ").slice(0, 155).replace(/\s\S*$/, "") + "…" : `${objectH1(p)}. Цена ${price}. Фото, планировка и характеристики, проверка документов AZPO.`;
    const path = cardPath(p);
    return withSeo({
      title: { absolute: title },
      description: desc,
      alternates: alternates(path),
      robots: robots(true),
      openGraph: { type: "website", siteName: "AZPO Estate", locale: "ru_RU", title, description: desc, url: path, images: [{ url: `/api/og/${p.id}.jpg`, width: 1200, height: 630, alt: base }] },
    }, await seoFor(path));
  }

  const q = parsed.q;
  const items = select(all, q);
  const st = stats(items);
  const k = kindOf(q);
  const title = metaTitle(q, st, geo);
  const description = metaDescription(q, st, geo);
  const path = listingPath(q);
  return withSeo({
    title: { absolute: title },
    description,
    alternates: alternates(path),
    // Pages 2+ are indexable with a self canonical (spec 8.2); thresholds decide the rest (spec 5.2).
    robots: robots(isIndexable(k, st.n)),
    openGraph: { type: "website", siteName: "AZPO Estate", locale: "ru_RU", title, description, url: path },
  }, await seoFor(path));
}

/** A URL that matches nothing: a redirect from the admin, or the 404 page. */
async function missing(seg: string[] = []): Promise<never> {
  const to = await redirectFor(`${R.catalog}${seg.join("/")}/`);
  if (to) permanentRedirect(to);
  notFound();
}

export default async function Catalog({ params }: Props) {
  const { seg } = await params;
  const { all, geo, parsed } = await resolve(seg);
  if (!parsed) return missing(seg);
  if (parsed.kind === "redirect") permanentRedirect(parsed.to);

  if (parsed.kind === "card") {
    const d = await getPropertyDetails(parsed.id);
    const listed = all.find((x) => x.id === parsed.id);
    if (!d || !listed) return missing(seg);
    const p: Property = { ...d.property, images: d.property.images, priceEur: listed.priceEur };
    // One canonical URL per object: a moved district or a wrong path answers with a redirect.
    const canonical = cardPath(p);
    const asked = `${R.catalog}${(seg ?? []).join("/")}/`;
    if (decodeURIComponent(asked) !== canonical) permanentRedirect(canonical);
    return <ObjectPage d={{ ...d, property: p }} all={all} geo={geo} />;
  }

  const q = parsed.q;
  // The district guide from the blog, if there is one for this district.
  const guide = q.district && q.page === 1
    ? (await publishedArticles()).find((a) => a.category === "area-guides" && a.geo === `${q.city}/${q.district}`) ?? null
    : null;
  return <Listing q={q} all={all} geo={geo} seo={await seoFor(listingPath(q))} guide={guide} />;
}

function Listing({ q, all, geo, seo, guide }: { q: Query; all: Property[]; geo: GeoIndex; seo: SeoRow | null; guide: ArticleRow | null }) {
  const k = kindOf(q);
  const items = select(all, q);
  const st = stats(items);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  if (q.page > pages) notFound();
  const pageItems = items.slice((q.page - 1) * PAGE_SIZE, q.page * PAGE_SIZE).map((p) => toCard(p, 1));
  const g = geoOf(q, geo);
  const basePath = listingPath({ ...q, page: 1 });

  // Filter navigation: every option is a clean landing URL.
  const rest = { deal: q.deal, type: q.type, feature: q.feature, complexes: q.complexes };
  const nav: Nav = {
    cities: [...geo.cities.keys()].map((c) => ({ value: c, label: cityName(c), href: listingPath({ city: c, ...rest }) })),
    districts: q.city
      ? [...(geo.cities.get(q.city)?.districts ?? [])].sort((a, b) => b[1].count - a[1].count).map(([d, v]) => ({ value: d, label: `${districtName(d, v.name)} (${v.count})`, href: listingPath({ city: q.city, district: d, ...rest }) }))
      : [],
    types: TYPES.filter((t) => all.some((p) => p.types.includes(t.api))).map((t) => ({ value: t.slug, label: t.name, href: listingPath({ city: q.city, district: q.district, deal: "sale", type: t.slug, feature: t.residential ? q.feature : undefined }) })),
    features: q.type && !q.complexes ? FEATURES.map((f) => ({ value: f.slug, label: f.label, href: listingPath({ city: q.city, district: q.district, deal: "sale", type: q.type, feature: f.slug }) })) : [],
    current: { city: q.city, district: q.district, type: q.type, feature: q.feature },
    reset: listingPath({ city: q.city, district: q.district, deal: q.deal }),
  };

  // Header photo: city photo, or the first listing photo of the district.
  const img = (q.city && !q.district && DEST_IMG[q.city]) || items.find((p) => p.images[0] && p.photoCount > 5)?.images[0] || (q.city ? DEST_IMG[q.city] : undefined);

  const children = isHub(k) ? childGeo(all, q, geo) : [];
  const childImages: Record<string, string | undefined> = {};
  for (const c of children) {
    const city = c.href.split("/")[3];
    childImages[c.href] = !q.city ? DEST_IMG[city] : all.find((p) => listingPath({ city: p.city, district: p.districtSlug ?? undefined }) === c.href && p.images[0])?.images[0];
  }

  const typeRows = isHub(k)
    ? TYPES.map((t) => {
        const its = items.filter((p) => p.types.includes(t.api));
        const s = stats(its);
        return { label: t.name, n: its.length, from: priceOf(s.min), avgM2: s.avgM2 };
      }).filter((r) => r.n > 0)
    : [];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: h1(q, geo),
    numberOfItems: items.length,
    itemListElement: pageItems.map((p, i) => ({ "@type": "ListItem", position: (q.page - 1) * PAGE_SIZE + i + 1, url: `${SITE_URL}${p.href}`, name: p.name })),
  };

  const parent = crumbs(q, geo).slice(-2)[0];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={crumbs(q, geo)} current={q.page > 1 ? `Страница ${q.page}` : undefined} />
      <JsonLd data={itemListLd} />
      <CatalogHeader title={seo?.h1 ?? h1(q, geo)} sub={seo?.intro ?? lead(q, st, geo)} img={img} eyebrow={q.page > 1 ? `Страница ${q.page} из ${pages}` : "Каталог AZPO"} />
      {children.length > 0 && <GeoCards title={q.city ? `Районы: ${cityName(q.city)}` : "Города"} items={children} images={childImages} />}

      <CatalogListing key={basePath} initial={pageItems} total={items.length} page={q.page} pages={pages} basePath={basePath} nav={nav} />

      {!items.length && parent && (
        <p className="mt-6"><Link href={parent.href} className="btn btn-ghost">Смотреть: {parent.name}</Link></p>
      )}

      {isHub(k) ? (
        <LinkBlock id="popular-h" title={`Популярное ${g.in}`} items={popular(all, q, geo)} />
      ) : (
        <LinkBlock id="refine-h" title="Уточнить запрос" items={refine(all, q)} />
      )}

      {guide && <GuideTeaser a={guide} />}
      {q.page === 1 && <SeoText blocks={seoText(q, items, st, geo)} />}
      {q.page === 1 && isHub(k) && <PriceStats title={`Цены на недвижимость ${g.in}`} rows={typeRows} />}
      {q.page === 1 && <Faq items={faq(q, st, geo)} />}

      <LinkBlock id="neighbours-h" title="Соседние районы" items={neighbourHubs(all, q, geo)} />
      <LinkBlock id="types-h" title={`Другие типы ${g.in}`} items={otherTypes(all, q)} />
      <LinkBlock
        id="elsewhere-h"
        title={q.district ? `${phrase({ ...q, district: undefined, city: undefined, page: 1 }, geo).replace(/ в Турции$/, "")} в соседних районах` : `${phrase({ ...q, city: undefined, district: undefined, page: 1 }, geo).replace(/ в Турции$/, "")} в других городах`}
        items={sameElsewhere(all, q, geo)}
      />

      <section aria-labelledby="useful-h" className="mt-12">
        <h2 id="useful-h" className="mb-4 flex items-center gap-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 -skew-x-[20deg] bg-sky" />Покупателю
        </h2>
        <ul className="flex flex-wrap gap-2 text-sm font-bold">
          {[["citizenship", "Гражданство за инвестиции"], ["residence-permit", "ВНЖ при покупке недвижимости"], ["due-diligence", "Юридическая проверка объекта"], ["after-sales", "Сервис после покупки"]].map(([s, l]) => (
            <li key={s}><Link href={R.service(s)} className="inline-block rounded-full bg-white px-4 py-2.5 text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow] hover:text-brand-500 hover:ring-brand-500/40">{l}</Link></li>
          ))}
        </ul>
      </section>

      <section className="mt-16 grid overflow-hidden rounded-[36px_10px_36px_10px] bg-brand-500 text-white lg:grid-cols-[1.2fr_1fr]" aria-labelledby="cta-h">
        <div className="hatch-light p-6 sm:p-10">
          <h2 id="cta-h" className="text-balance text-2xl font-black tracking-tight sm:text-4xl">Не нашли подходящий вариант? Подберём по запросу</h2>
          <p className="mt-3 max-w-lg text-pretty text-white/80">Расскажите о бюджете и задачах: специалист AZPO пришлёт подборку в WhatsApp или Telegram, включая объекты, которых ещё нет на сайте.</p>
        </div>
        <div className="bg-brand-700/40 p-6 sm:p-10"><LeadForm dark context={h1(q, geo)} /></div>
      </section>
    </div>
  );
}
