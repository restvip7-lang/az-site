import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PASSWORD_MIN, requireStaff, type Staff } from "@/lib/admin/auth";
import { deleteStaffAction, updateStaffAction } from "../../../actions";
import { ActionForm, ConfirmButton, Submit } from "@/components/admin/AdminUI";
import PageHead from "@/components/admin/PageHead";
import RoleField from "@/components/admin/RoleField";

export const metadata = { title: "Сотрудник" };

export default async function EditStaff({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireStaff("owner");
  const id = Number((await params).id);
  const sql = await db();
  const [s] = Number.isInteger(id) ? await sql<Staff[]>`select id, email, name, role from staff where id = ${id}` : [];
  if (!s) notFound();
  const self = s.id === me.id;
  return (
    <>
      <PageHead title={s.name} sub={self ? "Это вы." : undefined} back={{ href: "/admin/staff/", label: "Все сотрудники" }} />
      <section className="adm-card mb-6 max-w-3xl">
        <ActionForm key={`${s.email}-${s.role}`} action={updateStaffAction} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="id" value={s.id} />
          <label><span className="adm-label">Имя</span><input name="name" required defaultValue={s.name} className="adm-input" /></label>
          <label><span className="adm-label">E-mail (логин)</span><input name="email" type="email" required defaultValue={s.email} autoComplete="off" className="adm-input" /></label>
          <RoleField value={s.role} disabled={self} note={self ? "Свою роль поменять нельзя, это может сделать другой владелец: так в админке всегда остаётся владелец." : undefined} />
          {!self && (
            <label className="sm:col-span-2">
              <span className="adm-label">Новый пароль</span>
              <input name="password" type="text" minLength={PASSWORD_MIN} autoComplete="new-password" className="adm-input max-w-sm font-mono" />
              <span className="adm-hint">Оставьте пустым, чтобы не менять. Не короче {PASSWORD_MIN} символов; после смены сотруднику нужно войти заново.</span>
            </label>
          )}
          <div className="sm:col-span-2"><Submit>Сохранить</Submit></div>
        </ActionForm>
      </section>
      {!self && (
        <form action={deleteStaffAction} className="border-t border-brand-500/10 pt-6">
          <input type="hidden" name="id" value={s.id} />
          <ConfirmButton message={`Закрыть доступ для ${s.name}? Войти в админку с этим e-mail больше не получится.`}>Закрыть доступ</ConfirmButton>
        </form>
      )}
    </>
  );
}
