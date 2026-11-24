import { redirect } from "next/navigation";
import { hasDb } from "@/lib/db";
import { PASSWORD_MIN, staffCount } from "@/lib/admin/auth";
import { setupAction } from "../../actions";
import { ActionForm, Submit } from "@/components/admin/AdminUI";

export const dynamic = "force-dynamic";
export const metadata = { title: "Первый вход" };

// Creates the first (owner) account with a one-time code. Closed as soon as any account exists.
export default async function Setup() {
  if (!hasDb()) redirect("/admin/login/");
  if ((await staffCount()) > 0) redirect("/admin/login/");
  return (
    <div className="adm-card">
      <h1 className="text-2xl font-black tracking-tight text-ink">Первый вход</h1>
      <p className="mt-2 text-sm text-slate-600">Создайте учётную запись владельца. Код одноразовый: после создания эта страница закрывается, остальных сотрудников владелец добавляет сам.</p>
      <ActionForm action={setupAction} className="mt-5 space-y-4">
        <label className="block">
          <span className="adm-label">Код доступа</span>
          <input name="code" required autoComplete="off" spellCheck={false} placeholder="XXXXX-XXXXX-XXXXX-XXXXX" className="adm-input font-mono uppercase tracking-wider" />
        </label>
        <label className="block">
          <span className="adm-label">Имя</span>
          <input name="name" required autoComplete="name" className="adm-input" />
        </label>
        <label className="block">
          <span className="adm-label">E-mail (логин)</span>
          <input name="email" type="email" required autoComplete="username" className="adm-input" />
        </label>
        <label className="block">
          <span className="adm-label">Пароль</span>
          <input name="password" type="password" required minLength={PASSWORD_MIN} autoComplete="new-password" className="adm-input" />
          <span className="adm-hint">Не короче {PASSWORD_MIN} символов.</span>
        </label>
        <Submit busy="Создаю…" className="w-full">Создать и войти</Submit>
      </ActionForm>
    </div>
  );
}
