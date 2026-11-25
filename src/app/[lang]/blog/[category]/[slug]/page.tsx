import Link from "next/link";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { publishedArticles, type ArticleRow } from "@/lib/admin/articles";
import { getAllProperties, toCard } from "@/lib/api";
import { listingPath } from "@/lib/catalog";
import { CITIES, geoIn } from "@/lib/geo";
import { redirectFor, seoFor, withSeo } from "@/lib/admin/seo";
import { CATEGORY_BY_SLUG, blogPath, readingMinutes } from "@/lib/blog";
import { CONTACTS } from "@/lib/contacts";
import { alternates } from "@/lib/i18n";
import { Markdown, outline, parseBlocks, plainText } from "@/lib/markdown";
import { R } from "@/lib/routes";
import { JsonLd, SITE_URL } from "@/lib/site";
import LeadForm from "@/components/LeadForm";
import PropertyCard from "@/components/PropertyCard";
import { ArticleCard, Cover, articleDate } from "@/components/blog";
import { Breadcrumbs } from "@/components/catalog-blocks";
import { Arrow } from "@/components/ui";

export const revalidate = 600;
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ lang: string; category: string; slug: string }> };

async function find(category: string, slug: string) {
  return (await publishedArticles()).find((a) => a.category === category && a.slug === slug) ?? null;
}

/** "alanya/mahmutlar" → { city, district }, only for places the catalogue knows. */
function placeOf(a: ArticleRow) {
  const [city, district] = (a.geo ?? "").split("/");
  return city && CITIES[city] ? { city, district: district || undefined } : null;
}

/** Same section first; for a district guide, the nearest districts along the coast. */
function relatedTo(a: ArticleRow, all: ArticleRow[]) {
  const place = placeOf(a);
  const order = place ? CITIES[place.city].order ?? [] : [];
  const pos = (x: ArticleRow) => {
    const p = placeOf(x);
    const i = p && p.city === place?.city && p.district ? order.indexOf(p.district) : -1;
    const j = place?.district ? order.indexOf(place.district) : -1;
    return i < 0 || j < 0 ? 99 : Math.abs(i - j);
  };
  return all
    .filter((x) => x.id !== a.id)
    .map((x, i) => ({ x, rank: [Number(x.category !== a.category), pos(x), i] }))
    .sort((p, q) => p.rank[0] - q.rank[0] || p.rank[1] - q.rank[1] || p.rank[2] - q.rank[2])
    .slice(0, 3)
    .map((r) => r.x);
}

const describe = (a: { seo_description: string | null; excerpt: string | null; body: string }) =>
  a.seo_description || a.excerpt || plainText(a.body).replace(/\s+/g, " ").slice(0, 155).replace(/\s\S*$/, "") + "…";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const a = await find(category, slug);
  if (!a) return {};
  const url = blogPath(a.category, a.slug);
  const title = a.seo_title || a.title;
  const description = describe(a);
  return withSeo({
    title: { absolute: title.length > 55 ? title : `${title} | AZPO Estate` },
    description,
    alternates: alternates(url),
    openGraph: {
      type: "article", title, description, url, siteName: "AZPO Estate", locale: "ru_RU",
      publishedTime: a.published_at?.toISOString(), modifiedTime: a.updated_at.toISOString(),
      images: a.cover ? [{ url: a.cover }] : undefined,
    },
  }, await seoFor(url));
}

export default async function ArticlePage({ params }: Props) {
  const { category, slug } = await params;
  const a = CATEGORY_BY_SLUG[category] ? await find(category, slug) : null;
  if (!a) {
    const to = await redirectFor(blogPath(category, slug));
    if (to) permanentRedirect(to);
    notFound();
  }
  const c = CATEGORY_BY_SLUG[a.category];
  const url = blogPath(a.category, a.slug);
  const blocks = parseBlocks(a.body);
  const toc = outline(blocks);
  const related = relatedTo(a, await publishedArticles());

  // Objects of the place the article is about: the guide ends with what can be bought there.
  const place = placeOf(a);
  const here = place ? (await getAllProperties()).filter((p) => p.city === place.city && (!place.district || p.districtSlug === place.district)) : [];
  const picks = [...here].sort((x, y) => Number(y.images.length > 0) - Number(x.images.length > 0)).slice(0, 3).map((p) => toCard(p));
  const where = place ? geoIn(place.city, place.district) : "";

  const ld = {
    "@context": "https://schema.org",
    "@type": a.category === "news" ? "NewsArticle" : "Article",
    headline: a.title,
    description: describe(a),
    image: a.cover ? [a.cover] : undefined,
    datePublished: a.published_at?.toISOString(),
    dateModified: a.updated_at.toISOString(),
    author: { "@type": "Organization", name: a.author || "AZPO Estate", url: SITE_URL },
    publisher: { "@id": `${SITE_URL}/#organization` },
    mainEntityOfPage: `${SITE_URL}${url}`,
    inLanguage: "ru",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Блог", href: blogPath() }, { name: c.name, href: blogPath(c.slug) }, { name: a.title, href: url }]} />
      <JsonLd data={ld} />

      <article>
        <header className="mx-auto max-w-4xl text-center">
          <p className="eyebrow animate-rise text-brand-500"><Link href={blogPath(c.slug)} className="hover:underline">{c.name}</Link></p>
          <h1 className="mt-4 animate-rise text-balance text-[2rem] font-black leading-[1.05] tracking-[-0.035em] text-ink [animation-delay:60ms] sm:text-5xl">{a.title}</h1>
          <p className="mt-5 animate-rise text-sm font-bold text-slate-500 [animation-delay:120ms]">
            <time dateTime={a.published_at?.toISOString()}>{articleDate(a.published_at)}</time> · {readingMinutes(a.body)} мин чтения{a.author ? ` · ${a.author}` : ""}
          </p>
        </header>

        {a.cover && (
          <div className="relative mx-auto mt-8 aspect-[16/9] max-w-5xl animate-fade overflow-hidden rounded-[40px_12px_40px_12px] bg-sand [animation-delay:160ms] sm:mt-10">
            <Cover src={a.cover} alt={a.title} sizes="(min-width:1024px) 1024px, 100vw" priority />
          </div>
        )}

        <div className="mx-auto mt-10 grid max-w-6xl gap-10 lg:grid-cols-[1fr_300px]">
          <div className="min-w-0 rounded-[32px_10px_32px_10px] bg-white px-5 py-8 sm:px-10 sm:py-10">
            {a.excerpt && <p className="mb-8 text-pretty text-xl font-bold leading-relaxed text-ink">{a.excerpt}</p>}
            <Markdown blocks={blocks} />
          </div>
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {toc.length >= 3 && (
              <nav aria-label="Содержание" className="rounded-[24px_8px_24px_8px] bg-white p-6">
                <p className="eyebrow text-brand-500">Содержание</p>
                <ol className="mt-4 space-y-2.5 text-sm">
                  {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="font-bold text-ink/80 transition-colors duration-150 hover:text-brand-500">{h.text}</a></li>)}
                </ol>
              </nav>
            )}
            <div className="hatch-light rounded-[24px_8px_24px_8px] bg-brand-500 p-6 text-white">
              <p className="text-xl font-black leading-tight">Нужна консультация по вашей ситуации?</p>
              <p className="mt-2 text-sm text-white/80">Специалист AZPO ответит в WhatsApp или Telegram.</p>
              <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-sky mt-5 w-full">Написать в WhatsApp <Arrow /></a>
            </div>
          </aside>
        </div>
      </article>

      {place && picks.length > 0 && (
        <section aria-labelledby="here-h" className="mt-16">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <h2 id="here-h" className="flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
              <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />Недвижимость {where}
            </h2>
            <Link href={listingPath(place)} className="btn btn-ghost">Все объекты: {here.length} <Arrow /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{picks.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
        </section>
      )}

      <section id="article-form" aria-labelledby="form-h" className="mt-16 grid scroll-mt-24 overflow-hidden rounded-[36px_10px_36px_10px] bg-brand-500 text-white lg:grid-cols-[1.2fr_1fr]">
        <div className="hatch-light p-6 sm:p-10">
          <h2 id="form-h" className="text-balance text-2xl font-black tracking-tight sm:text-4xl">Подберём объект и проверим документы</h2>
          <p className="mt-3 max-w-lg text-pretty text-white/80">Расскажите о задаче: специалист AZPO пришлёт подборку и ответит на вопросы о покупке.</p>
        </div>
        <div className="bg-brand-700/40 p-6 sm:p-10"><LeadForm dark context={a.title} /></div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-h" className="mt-16">
          <h2 id="related-h" className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />Читайте также
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <ArticleCard key={r.id} a={r} />)}</div>
        </section>
      )}
    </div>
  );
}
