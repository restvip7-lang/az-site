import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { listArticles } from "@/lib/admin/articles";
import { CATEGORY_BY_SLUG, blogPath } from "@/lib/blog";
import { importBlogAction } from "../../actions";
import { ActionForm, Submit } from "@/components/admin/AdminUI";
import PageHead, { fmtDate } from "@/components/admin/PageHead";

export const metadata = { title: "Статьи и новости" };
// Importing a batch of posts with their photos can take a while.
export const maxDuration = 300;

export default async function Articles() {
  await requireStaff();
  const rows = await listArticles();
  const imported = rows.filter((r) => r.source_url).length;
  return (
    <>
      <PageHead title="Статьи и новости" sub="Блог сайта: законы и оформление, гайды по районам, новости." action={{ href: "/admin/articles/new/", label: "+ Написать" }} />
      <section className="adm-card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="adm-h2">Перенос блога с azpo.ru</h2>
          <p className="mt-1 text-sm text-slate-600">Забирает статьи из блога azpo.ru вместе с фото (по 5 за раз), раскладывает по разделам и ставит редиректы со старых адресов. Уже перенесённые повторно не добавляются. Перенесено: {imported}.</p>
        </div>
        <ActionForm action={importBlogAction} className="max-w-md">
          <Submit busy="Переношу, это займёт до минуты…">Перенести следующие 5</Submit>
        </ActionForm>
      </section>
      {rows.length === 0 ? (
        <div className="adm-card text-slate-600">Статей пока нет.</div>
      ) : (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <table className="adm-table min-w-[680px]">
            <thead><tr><th>Заголовок</th><th>Раздел</th><th>Статус</th><th>Дата</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <Link href={`/admin/articles/${a.id}/`} className="font-bold text-ink hover:text-brand-500">{a.title}</Link>
                    <span className="block font-mono text-xs text-slate-400">{blogPath(a.category, a.slug)}</span>
                  </td>
                  <td className="whitespace-nowrap">{CATEGORY_BY_SLUG[a.category]?.name}</td>
                  <td>
                    {a.published
                      ? <a href={blogPath(a.category, a.slug)} target="_blank" rel="noopener" className="adm-badge bg-emerald-50 text-emerald-800 hover:underline">На сайте ↗</a>
                      : <span className="adm-badge bg-slate-100 text-slate-600">Черновик</span>}
                  </td>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(a.published_at ?? a.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
