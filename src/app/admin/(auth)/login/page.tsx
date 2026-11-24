import { redirect } from "next/navigation";
import { hasDb } from "@/lib/db";
import { currentStaff, staffCount } from "@/lib/admin/auth";
import { loginAction } from "../../actions";
import { ActionForm, Submit } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";
export const metadata = { title: "Вход" };

export default async function Login() {
  if (!hasDb()) {
    return (
      <div className="adm-card">
        <h1 className="text-2xl font-black text-ink">База данных не подключена</h1>
        <p className="mt-2 text-slate-600">Подключите базу в настройках проекта на Vercel (раздел Storage), затем обновите страницу.</p>
      </div>
    );
  }
  if ((await staffCount()) === 0) redirect("/admin/setup/");
  if (await currentStaff()) redirect("/admin/");
  return (
    <div className="adm-card">
      <h1 className="text-2xl font-black tracking-tight text-ink">Вход для сотрудников</h1>
      <ActionForm action={loginAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="adm-label">E-mail</span>
          <input name="email" type="email" autoComplete="username" required className="adm-input" />
        </label>
        <label className="block">
          <span className="adm-label">Пароль</span>
          <input name="password" type="password" autoComplete="current-password" required className="adm-input" />
        </label>
        <Submit busy="Вхожу…" className="w-full">Войти</Submit>
      </ActionForm>
      <p className="adm-hint mt-4">Забыли пароль? Попросите владельца админки задать новый.</p>
    </div>
  );
}
