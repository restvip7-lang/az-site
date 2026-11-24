import Link from "next/link";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/admin/auth";
import { storageHost } from "@/lib/admin/storage";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Обзор" };

export default async function Dashboard() {
  const me = await requireStaff();
  const sql = await db();
  const [c] = await sql`select
    (select count(*) from objects where published)::int as objects_live,
    (select count(*) from objects where not published)::int as objects_draft,
    (select count(*) from articles where published)::int as articles_live,
    (select count(*) from articles where not published)::int as articles_draft,
    (select count(*) from seo_pages)::int as seo,
    (select count(*) from redirects)::int as redirects`;
  const tiles: [string, string, number, string][] = [
    ["/admin/objects/", "Объекты на сайте", c.objects_live, `черновиков: ${c.objects_draft}`],
    ["/admin/articles/", "Статьи на сайте", c.articles_live, `черновиков: ${c.articles_draft}`],
    ["/admin/seo/", "Страниц с SEO-текстами", c.seo, "title, description, H1"],
    ["/admin/redirects/", "Редиректов", c.redirects, "старые адреса → новые"],
  ];
  return (
    <>
      <PageHead title={`Здравствуйте, ${me.name.split(" ")[0]}`} sub="Здесь добавляются новостройки застройщиков и объекты, статьи и новости, SEO-тексты страниц." />
      {!storageHost() && (
        <p className="mb-6 rounded-[18px_6px_18px_6px] bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">Хранилище фото не подключено: загрузка фотографий не заработает, пока в Vercel не появятся SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY.</p>
      )}
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(([href, label, n, sub]) => (
          <li key={href}>
            <Link href={href} className="adm-card block transition-shadow duration-200 hover:shadow-[0_1px_2px_rgb(22_52_87/0.06),0_24px_48px_-28px_rgb(22_52_87/0.7)]">
              <span className="block text-4xl font-black tabular-nums tracking-tight text-brand-500">{n}</span>
              <span className="mt-1 block font-bold text-ink">{label}</span>
              <span className="text-sm text-slate-500">{sub}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/objects/new/" className="adm-btn adm-btn-primary">+ Новостройка или объект</Link>
        <Link href="/admin/articles/new/" className="adm-btn adm-btn-ghost">+ Статья или новость</Link>
      </div>
      <section className="adm-card mt-8 max-w-3xl text-sm leading-relaxed text-slate-600">
        <h2 className="adm-h2">Как это связано с сайтом</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>Объекты из каталога AZPO подгружаются автоматически. Здесь добавляются новые: они появляются на сайте рядом с остальными, в своих городах, районах и подборках.</li>
          <li>Метки объекта («Вид на море», «Под гражданство»…) решают, в какие подборки он попадёт.</li>
          <li>Изменения видны на сайте примерно через минуту после сохранения.</li>
        </ul>
      </section>
    </>
  );
}
