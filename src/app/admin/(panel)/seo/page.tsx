import Link from "next/link";
import { requireStaff } from "@/lib/admin/auth";
import { listSeo, normalisePath } from "@/lib/admin/seo";
import { deleteSeoAction, saveSeoAction } from "../../actions";
import { ActionForm, ConfirmButton, Submit } from "@/components/admin/AdminUI";
import PageHead, { fmtDate } from "@/components/admin/PageHead";

export const metadata = { title: "SEO-тексты" };

export default async function Seo({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  await requireStaff();
  const rows = await listSeo();
  const want = (await searchParams).path;
  const edit = want ? rows.find((r) => r.path === normalisePath(want)) : undefined;
  const v = edit ?? { path: want ? normalisePath(want) : "", title: "", description: "", h1: "", intro: "", noindex: false };
  return (
    <>
      <PageHead title="SEO-тексты страниц" sub="Свой title, description, H1 и вводный текст для любой страницы сайта: подборки, районы, услуги, главная. Пустое поле — остаётся текст, который сайт составляет сам." />
      <section className="adm-card mb-6 max-w-3xl">
        <h2 className="adm-h2">{edit ? "Изменить" : "Добавить страницу"}</h2>
        <ActionForm key={v.path} action={saveSeoAction} className="mt-4 space-y-4">
          <label className="block">
            <span className="adm-label">Адрес страницы *</span>
            <input name="path" required defaultValue={v.path} placeholder="/ru/turkey/alanya/mahmutlar/" className="adm-input font-mono text-sm" />
            <span className="adm-hint">Скопируйте из адресной строки, можно вместе с доменом.</span>
          </label>
          <label className="block">
            <span className="adm-label">Title</span>
            <input name="title" defaultValue={v.title ?? ""} maxLength={120} className="adm-input" />
          </label>
          <label className="block">
            <span className="adm-label">Description</span>
            <textarea name="description" rows={2} defaultValue={v.description ?? ""} maxLength={300} className="adm-input" />
          </label>
          <label className="block">
            <span className="adm-label">H1</span>
            <input name="h1" defaultValue={v.h1 ?? ""} maxLength={150} className="adm-input" />
          </label>
          <label className="block">
            <span className="adm-label">Вводный текст под заголовком</span>
            <textarea name="intro" rows={4} defaultValue={v.intro ?? ""} className="adm-input" />
          </label>
          <label className="flex items-center gap-3 text-sm font-bold text-ink">
            <input type="checkbox" name="noindex" defaultChecked={v.noindex} className="h-5 w-5 accent-brand-500" /> Закрыть страницу от индексации (noindex)
          </label>
          <div className="flex gap-3">
            <Submit>Сохранить</Submit>
            {edit && <Link href="/admin/seo/" className="adm-btn adm-btn-ghost">Новая страница</Link>}
          </div>
        </ActionForm>
      </section>
      {rows.length > 0 && (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <table className="adm-table min-w-[640px]">
            <thead><tr><th>Страница</th><th>Что задано</th><th>Изменено</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.path}>
                  <td><Link href={`/admin/seo/?path=${encodeURIComponent(r.path)}`} className="font-mono text-xs font-bold text-brand-500 hover:underline">{r.path}</Link></td>
                  <td className="text-slate-600">{[r.title && "title", r.description && "description", r.h1 && "H1", r.intro && "текст", r.noindex && "noindex"].filter(Boolean).join(", ")}</td>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(r.updated_at)}</td>
                  <td className="text-right">
                    <form action={deleteSeoAction}>
                      <input type="hidden" name="path" value={r.path} />
                      <ConfirmButton message={`Убрать настройки для ${r.path}? Вернутся тексты, которые сайт составляет сам.`} className="adm-btn adm-btn-danger px-3 py-1.5 text-xs">Убрать</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
