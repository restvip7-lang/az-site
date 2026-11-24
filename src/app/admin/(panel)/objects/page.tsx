import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { listObjects } from "@/lib/admin/objects";
import { formatPrice } from "@/lib/format";
import { cityName, districtName, districtSlug } from "@/lib/geo";
import { cardPath } from "@/lib/paths";
import PageHead, { fmtDate } from "@/components/admin/PageHead";

export const metadata = { title: "Новостройки и объекты" };

export default async function Objects() {
  await requireStaff();
  const rows = await listObjects();
  return (
    <>
      <PageHead title="Новостройки и объекты" sub="Проекты застройщиков и отдельные объекты, которых нет в каталоге AZPO. Опубликованные показываются на сайте вместе с остальными." action={{ href: "/admin/objects/new/", label: "+ Добавить" }} />
      {rows.length === 0 ? (
        <div className="adm-card text-slate-600">Пока ничего не добавлено. <Link href="/admin/objects/new/" className="font-bold text-brand-500 hover:underline">Добавить первую новостройку</Link></div>
      ) : (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <table className="adm-table min-w-[720px]">
            <thead><tr><th className="w-20">Фото</th><th>Название</th><th>Где</th><th>Цена</th><th>Статус</th><th>Изменён</th></tr></thead>
            <tbody>
              {rows.map((o) => {
                const slug = districtSlug(o.district);
                return (
                  <tr key={o.id}>
                    <td>
                      {o.photos[0]
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={o.photos[0]} alt="" loading="lazy" className="h-12 w-16 rounded-[10px_3px_10px_3px] object-cover" />
                        : <span className="block h-12 w-16 rounded-[10px_3px_10px_3px] bg-sand" />}
                    </td>
                    <td>
                      <Link href={`/admin/objects/${o.id}/`} className="font-bold text-ink hover:text-brand-500">{o.title}</Link>
                      <span className="block text-xs text-slate-500">{o.is_project ? "Новостройка" : "Объект"} · {o.type}{o.developer ? ` · ${o.developer}` : ""} · ID {o.id}</span>
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
        </div>
      )}
    </>
  );
}
