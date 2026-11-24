import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { publishedArticles } from "@/lib/admin/articles";
import { redirectFor, seoFor, withSeo } from "@/lib/admin/seo";
import { BLOG_CATEGORIES, CATEGORY_BY_SLUG, blogPath } from "@/lib/blog";
import { alternates } from "@/lib/i18n";
import { INDEXABLE } from "@/lib/site";
import { R } from "@/lib/routes";
import CatalogHeader from "@/components/CatalogHeader";
import { ArticleCard, CategoryNav } from "@/components/blog";
import { Breadcrumbs } from "@/components/catalog-blocks";

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
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Блог", href: blogPath() }, { name: c.name, href: url }]} />
      <CatalogHeader eyebrow="Блог AZPO" title={seo?.h1 ?? c.h1} sub={seo?.intro ?? c.description} img="/img/dest/antalya.webp" />
      <CategoryNav current={c.slug} />
      {items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => <ArticleCard key={a.id} a={a} />)}
        </div>
      ) : (
        <p className="rounded-[28px_8px_28px_8px] bg-white p-8 text-slate-600">В этом разделе статьи скоро появятся.</p>
      )}
    </div>
  );
}
