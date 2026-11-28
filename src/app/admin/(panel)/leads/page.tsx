import { canEdit, requireStaff } from "@/lib/admin/auth";
import { LEAD_STATUSES, listLeads } from "@/lib/leads";
import PageHead from "@/components/admin/PageHead";
import { setLeadStatusAction } from "../../actions";

export const metadata = { title: "Заявки" };
export const dynamic = "force-dynamic";

const when = (d: Date) =>
  new Date(d).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Istanbul" });

export default async function Leads() {
  const me = await requireStaff();
  const rows = await listLeads();
  const edit = canEdit(me);
  return (
    <>
      <PageHead title="Заявки с сайта" sub="Каждая отправленная форма сохраняется здесь, даже если посетитель потом не написал в WhatsApp. Время — стамбульское. Последние 200." />
      {!process.env.TELEGRAM_BOT_TOKEN && (
        <p className="mb-6 rounded-[18px_6px_18px_6px] bg-amber-50 px-5 py-4 text-sm font-bold text-amber-900">
          Уведомления о новых заявках не настроены: добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в настройки сервера, и заявки будут приходить в чат менеджеров.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="adm-card text-slate-600">Заявок пока нет.</p>
      ) : (
        <div className="adm-card overflow-x-auto p-2 sm:p-3">
          <table className="adm-table min-w-[760px]">
            <thead><tr><th>№</th><th>Когда</th><th>Имя и телефон</th><th>Интересует</th><th>Статус</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="tabular-nums text-slate-500">{r.id}</td>
                  <td className="whitespace-nowrap text-slate-500">{when(r.created_at)}</td>
                  <td>
                    <p className="font-bold text-ink">{r.name}</p>
                    <a href={`tel:${r.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums text-brand-500 hover:underline">{r.phone}</a>
                    {" · "}
                    <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-brand-500 hover:underline">WhatsApp</a>
                  </td>
                  <td className="max-w-xs text-sm">
                    {r.context && <p>{r.context}</p>}
                    {r.message && <p className="text-slate-600">{r.message}</p>}
                    {r.page && <a href={r.page} target="_blank" rel="noopener" className="break-all font-mono text-xs text-slate-500 hover:underline">{r.page}</a>}
                  </td>
                  <td>
                    {edit ? (
                      <form action={setLeadStatusAction} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={r.id} />
                        <select name="status" defaultValue={r.status} aria-label={`Статус заявки ${r.id}`} className="adm-input py-1.5 text-sm">
                          {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                        <button type="submit" className="adm-btn adm-btn-ghost px-3 py-1.5 text-xs">OK</button>
                      </form>
                    ) : (
                      LEAD_STATUSES.find((s) => s.value === r.status)?.label
                    )}
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
