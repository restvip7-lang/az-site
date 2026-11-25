import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { OBJECTS_PER_PAGE, listObjects, objectStats, type ObjectFilter } from "@/lib/admin/objects";
import { formatPrice } from "@/lib/format";
import { CITIES, cityName, districtName, districtSlug } from "@/lib/geo";
import { cardPath } from "@/lib/paths";
import ObjectImport from "@/components/admin/ObjectImport";
import PageHead, { fmtDate } from "@/components/admin/PageHead";

export const metadata = { title: "Объекты" };
// The move from azpo.ru runs here in batches; one batch reads up to 25 objects from the old catalogue.
export const maxDuration = 300;

type Search = { q?: string; city?: string; status?: string; source?: string; page?: string };

export default async function Objects({ searchParams }: { searchParams: Promise<Search> }) {
  await requireStaff();
  const sp = await searchParams;
  const filter: ObjectFilter = {
    q: sp.q?.slice(0, 100),
    city: sp.city && CITIES[sp.city] ? sp.city : undefined,
    status: sp.status === "published" || sp.status === "draft" ? sp.status : undefined,
    source: sp.source === "azpo" || sp.source === "own" ? sp.source : undefined,
    page: Math.max(1, Number(sp.page) || 1),
  };
  const [{ rows, total, page }, stats] = await Promise.all([listObjects(filter), objectStats()]);
  const pages = Math.max(1, Math.ceil(total / OBJECTS_PER_PAGE));
  const filtered = Boolean(filter.q || filter.city || filter.status || filter.source);
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries({ ...sp, page: p > 1 ? String(p) : "" }).filter(([, v]) => v) as [string, string][]);
    return `/admin/objects/${q.size ? `?${q}` : ""}`;
  };

  return (
    <>
      <PageHead
        title="Объекты"
        sub={`Весь каталог сайта: новостройки застройщиков и отдельные объекты. Всего ${stats.total}, на сайте ${stats.published}.`}
        action={{ href: "/admin/objects/new/", label: "+ Добавить" }}
      />
      <ObjectImport moved={stats.azpo} />

      <form className="adm-card mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]" role="search">
        <label>
          <span className="sr-only">Поиск</span>
          <input name="q" type="search" defaultValue={filter.q} placeholder="Название, ID, район или застройщик" className="adm-input" />
        </label>
        <label>
          <span className="sr-only">Город</span>
          <select name="city" defaultValue={filter.city ?? ""} className="adm-input">
            <option value="">Все города</option>
            {Object.entries(CITIES).map(([k, c]) => <option key={k} value={k}>{c.ru}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Статус</span>
          <select name="status" defaultValue={filter.status ?? ""} className="adm-input">
            <option value="">Любой статус</option>
            <option value="published">На сайте</option>
            <option value="draft">Черновики</option>
          </select>
        </label>
        <label>
          <span className="sr-only">Откуда</span>
          <select name="source" defaultValue={filter.source ?? ""} className="adm-input">
            <option value="">Все объекты</option>
            <option value="azpo">С azpo.ru</option>
            <option value="own">Добавлены здесь</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className="adm-btn adm-btn-primary">Найти</button>
          {filtered && <Link href="/admin/objects/" className="adm-btn adm-btn-ghost">Сбросить</Link>}
        </div>
      </form>

      {rows.length === 0 ? (
        <div className="adm-card text-slate-600">
          {filtered ? "По этим условиям объектов нет." : <>Пока ничего нет. Перенесите объекты с azpo.ru кнопкой выше или <Link href="/admin/objects/new/" className="font-bold text-brand-500 hover:underline">добавьте первый объект</Link>.</>}
        </div>
      ) : (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <p className="px-3 pb-2 pt-1 text-sm text-slate-500 tabular-nums">{filtered ? `Найдено: ${total}` : `Всего: ${total}`}{pages > 1 ? ` · страница ${page} из ${pages}` : ""}</p>
          <table className="adm-table min-w-[760px]">
            <thead><tr><th className="w-20">Фото</th><th>Название</th><th>Где</th><th>Цена</th><th>Статус</th><th>Изменён</th></tr></thead>
            <tbody>
              {rows.map((o) => {
                const slug = districtSlug(o.district);
                return (
                  <tr key={o.id}>
                    <td>
                      {o.photos[0]
                        ? <Image src={o.photos[0]} alt="" width={64} height={48} sizes="64px" className="h-12 w-16 rounded-[10px_3px_10px_3px] object-cover" />
                        : <span className="block h-12 w-16 rounded-[10px_3px_10px_3px] bg-sand" />}
                    </td>
                    <td>
                      <Link href={`/admin/objects/${o.id}/`} className="font-bold text-ink hover:text-brand-500">{o.title}</Link>
                      <span className="block text-xs text-slate-500">
                        {[o.is_project ? "Новостройка" : "Объект", o.types.join(", "), o.developer, `ID ${o.id}`, o.source ? `с ${o.source}` : null].filter(Boolean).join(" · ")}
                      </span>
                    </td>
                    <td>{cityName(o.city)}{slug ? `, ${districtName(slug, o.district)}` : ""}</td>
                    <td className="whitespace-nowrap tabular-nums">{o.price ? `${o.is_project ? "от " : ""}${formatPrice(Number(o.price), o.currency)}` : "по запросу"}</td>
                    <td>
                      {o.published
                        ? <a href={cardPath({ id: o.id, city: o.city, districtSlug: slug })} target="_blank" rel="noopener" className="adm-badge bg-emerald-50 text-emerald-800 hover:underline">На сайте ↗</a>
                        : <span className="adm-badge bg-slate-100 text-slate-600">Черновик</span>}
                    </td>
                    <td className="whitespace-nowrap text-slate-500">{fmtDate(o.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {pages > 1 && (
            <nav aria-label="Страницы" className="flex flex-wrap items-center justify-between gap-3 px-3 pb-1 pt-4">
              {page > 1 ? <Link href={href(page - 1)} className="adm-btn adm-btn-ghost">← Назад</Link> : <span />}
              <span className="text-sm tabular-nums text-slate-500">{page} / {pages}</span>
              {page < pages ? <Link href={href(page + 1)} className="adm-btn adm-btn-ghost">Дальше →</Link> : <span />}
            </nav>
          )}
        </div>
      )}
    </>
  );
}
