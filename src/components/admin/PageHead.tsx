import Link from "next/link";

/** Page title of an admin screen, with an optional main action on the right. */
export default function PageHead({ title, sub, action, back }: { title: string; sub?: string; action?: { href: string; label: string }; back?: { href: string; label: string } }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && <Link href={back.href} className="mb-2 inline-block text-sm font-bold text-brand-500 hover:underline">← {back.label}</Link>}
        <h1 className="text-balance text-2xl font-black tracking-tight text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-pretty text-slate-600">{sub}</p>}
      </div>
      {action && <Link href={action.href} className="adm-btn adm-btn-primary">{action.label}</Link>}
    </header>
  );
}

export const fmtDate = (d: Date | string | null) =>
  d ? new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Istanbul" }) : "—";
