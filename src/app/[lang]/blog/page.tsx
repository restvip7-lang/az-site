import type { Metadata } from "next";
import { publishedArticles } from "@/lib/admin/articles";
import { seoFor, withSeo } from "@/lib/admin/seo";
import { blogPath } from "@/lib/blog";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import CatalogHeader from "@/components/CatalogHeader";
import { ArticleCard, CategoryNav } from "@/components/blog";
import { Breadcrumbs } from "@/components/catalog-blocks";

export const revalidate = 600;

const TITLE = "Блог о недвижимости в Турции: законы, районы, новости";
const DESC = "Статьи AZPO Estate о покупке недвижимости в Турции: законы и оформление, ВНЖ и гражданство, гайды по городам и районам, новости рынка.";

export async function generateMetadata(): Promise<Metadata> {
  const url = blogPath();
  return withSeo({ title: { absolute: `${TITLE} | AZPO Estate` }, description: DESC, alternates: alternates(url), openGraph: { title: TITLE, description: DESC, url } }, await seoFor(url));
}

export default async function Blog() {
  const [all, seo] = await Promise.all([publishedArticles(), seoFor(blogPath())]);
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Блог", href: blogPath() }]} />
      <CatalogHeader eyebrow="Блог AZPO" title={seo?.h1 ?? "Блог о недвижимости в Турции"} sub={seo?.intro ?? "Как купить квартиру или виллу по закону, оформить ВНЖ и гражданство, выбрать город и район. Пишут юристы и специалисты AZPO."} img="/img/dest/antalya.webp" />
      <CategoryNav />
      {all.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((a, i) => <ArticleCard key={a.id} a={a} big={i === 0} />)}
        </div>
      ) : (
        <p className="rounded-[28px_8px_28px_8px] bg-white p-8 text-slate-600">Статьи скоро появятся.</p>
      )}
    </div>
  );
}
