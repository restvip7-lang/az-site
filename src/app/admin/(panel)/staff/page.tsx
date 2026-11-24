import { db } from "@/lib/db";
import { PASSWORD_MIN, requireStaff, type Staff } from "@/lib/admin/auth";
import { addStaffAction, changePasswordAction, deleteStaffAction } from "../../actions";
import { ActionForm, ConfirmButton, Submit } from "@/components/admin/AdminUI";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Сотрудники" };

export default async function StaffPage() {
  const me = await requireStaff();
  const owner = me.role === "owner";
  const sql = await db();
  const rows = owner ? await sql<Staff[]>`select id, email, name, role from staff order by id` : [];
  return (
    <>
      <PageHead title="Сотрудники" sub={owner ? "Кто может входить в админку. Редактор работает с объектами, статьями и SEO; владелец ещё и добавляет сотрудников." : undefined} />
      {owner && (
        <>
          <div className="adm-card mb-6 overflow-x-auto p-2 sm:p-3">
            <table className="adm-table min-w-[560px]">
              <thead><tr><th>Имя</th><th>E-mail</th><th>Роль</th><th /></tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td className="font-bold text-ink">{s.name}{s.id === me.id && <span className="ml-2 text-xs font-normal text-slate-400">это вы</span>}</td>
                    <td>{s.email}</td>
                    <td>{s.role === "owner" ? "Владелец" : "Редактор"}</td>
                    <td className="text-right">
                      {s.id !== me.id && (
                        <form action={deleteStaffAction}>
                          <input type="hidden" name="id" value={s.id} />
                          <ConfirmButton message={`Закрыть доступ для ${s.name}?`} className="adm-btn adm-btn-danger px-3 py-1.5 text-xs">Закрыть доступ</ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <section className="adm-card mb-6 max-w-3xl">
            <h2 className="adm-h2">Добавить сотрудника</h2>
            <ActionForm action={addStaffAction} className="mt-4 grid gap-4 sm:grid-cols-2">
              <label><span className="adm-label">Имя</span><input name="name" required className="adm-input" /></label>
              <label><span className="adm-label">E-mail (логин)</span><input name="email" type="email" required autoComplete="off" className="adm-input" /></label>
              <label><span className="adm-label">Пароль</span><input name="password" type="text" required minLength={PASSWORD_MIN} autoComplete="new-password" className="adm-input font-mono" /><span className="adm-hint">Не короче {PASSWORD_MIN} символов. Сотрудник сможет сменить его сам.</span></label>
              <label><span className="adm-label">Роль</span><select name="role" defaultValue="editor" className="adm-input"><option value="editor">Редактор</option><option value="owner">Владелец</option></select></label>
              <div className="sm:col-span-2"><Submit>Добавить</Submit></div>
            </ActionForm>
          </section>
        </>
      )}
      <section className="adm-card max-w-xl">
        <h2 className="adm-h2">Сменить свой пароль</h2>
        <ActionForm action={changePasswordAction} className="mt-4 space-y-4">
          <input type="text" name="username" value={me.email} autoComplete="username" readOnly hidden />
          <label className="block"><span className="adm-label">Текущий пароль</span><input name="current" type="password" required autoComplete="current-password" className="adm-input" /></label>
          <label className="block"><span className="adm-label">Новый пароль</span><input name="password" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" className="adm-input" /></label>
          <Submit>Сменить пароль</Submit>
        </ActionForm>
      </section>
    </>
  );
}
