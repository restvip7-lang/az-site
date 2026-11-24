import { requireStaff } from "@/lib/admin/auth";
import { listRedirects } from "@/lib/admin/seo";
import { deleteRedirectAction, saveRedirectAction } from "../../actions";
import { ActionForm, ConfirmButton, Submit } from "@/components/admin/AdminUI";
import PageHead, { fmtDate } from "@/components/admin/PageHead";

export const metadata = { title: "Редиректы" };

export default async function Redirects() {
  await requireStaff();
  const rows = await listRedirects();
  return (
    <>
      <PageHead title="Редиректы (301)" sub="Если страница переехала или удалена, поставьте редирект со старого адреса на новый: посетители и поисковики попадут куда нужно. Редиректы старых адресов каталога azpo.ru сайт делает сам." />
      <section className="adm-card mb-6 max-w-3xl">
        <ActionForm action={saveRedirectAction} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label>
            <span className="adm-label">Старый адрес</span>
            <input name="from" required placeholder="/ru/blog/old-post/" className="adm-input font-mono text-sm" />
          </label>
          <label>
            <span className="adm-label">Новый адрес</span>
            <input name="to" required placeholder="/ru/blog/news/new-post/" className="adm-input font-mono text-sm" />
          </label>
          <Submit>Добавить</Submit>
        </ActionForm>
      </section>
      {rows.length > 0 && (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <table className="adm-table min-w-[640px]">
            <thead><tr><th>Откуда</th><th>Куда</th><th>Добавлен</th><th /></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.from_path}>
                  <td className="break-all font-mono text-xs">{r.from_path}</td>
                  <td className="break-all font-mono text-xs"><a href={r.to_path} target="_blank" rel="noopener" className="text-brand-500 hover:underline">{r.to_path}</a></td>
                  <td className="whitespace-nowrap text-slate-500">{fmtDate(r.created_at)}</td>
                  <td className="text-right">
                    <form action={deleteRedirectAction}>
                      <input type="hidden" name="from" value={r.from_path} />
                      <ConfirmButton message={`Удалить редирект с ${r.from_path}?`} className="adm-btn adm-btn-danger px-3 py-1.5 text-xs">Удалить</ConfirmButton>
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
