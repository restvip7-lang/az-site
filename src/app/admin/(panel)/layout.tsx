import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { hasDb } from "@/lib/db";
import { canEdit, requireStaff, roleName } from "@/lib/admin/auth";
import { logoutAction } from "../actions";
import { AdminNav } from "@/components/admin/AdminUI";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  if (!hasDb()) redirect("/admin/login/");
  const me = await requireStaff();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hatch-light bg-brand-500 px-4 py-4 text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-5 lg:py-7">
        <div className="mb-4 flex items-center justify-between gap-3 lg:mb-8 lg:block">
          <Link href="/admin/" className="flex items-center gap-2">
            <Image src="/brand/azpo-mark-white.png" alt="" width={40} height={30} className="h-[30px] w-[40px] object-contain" />
            <span className="text-base leading-6"><span className="font-bold">AZPO</span><br /><span className="font-semibold">Админка</span></span>
          </Link>
        </div>
        <AdminNav />
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/15 pt-4 text-sm lg:mt-auto lg:block lg:space-y-3">
          <div>
            <p className="font-bold">{me.name}</p>
            <p className="text-white/60">{roleName(me.role)}</p>
          </div>
          <div className="flex gap-2 lg:flex-col">
            <a href="/ru/" target="_blank" rel="noopener" className="rounded-full px-3 py-1.5 font-bold text-white/80 ring-1 ring-white/30 transition-colors duration-150 hover:bg-white/10 hover:text-white">Сайт ↗</a>
            <form action={logoutAction}>
              <button type="submit" className="w-full rounded-full px-3 py-1.5 text-left font-bold text-white/80 ring-1 ring-white/30 transition-colors duration-150 hover:bg-white/10 hover:text-white">Выйти</button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">
        {!canEdit(me) && (
          <p className="mb-6 rounded-[14px_4px_14px_4px] bg-brand-50 px-4 py-3 text-sm font-bold text-brand-600">
            У вас доступ «Просмотр»: вы видите всё, но не можете ничего менять.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
