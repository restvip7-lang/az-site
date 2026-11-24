"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { CONTACTS } from "@/lib/contacts";
import { R } from "@/lib/routes";

export interface MenuCity { href: string; label: string; count: number; districts: { href: string; label: string }[] }

const NAV = [
  { href: R.complexes, label: "Новостройки" },
  { href: R.services, label: "Услуги" },
  { href: R.about, label: "О компании" },
  { href: R.contacts, label: "Контакты" },
];

const link = "group relative px-3 py-2 text-[0.92rem] font-bold text-ink/80 transition-colors hover:text-brand-500 aria-[current=page]:text-brand-500";
const underline = "absolute inset-x-3 bottom-0.5 h-[3px] origin-left -skew-x-[30deg] scale-x-0 bg-sky transition-transform duration-300 ease-out group-hover:scale-x-100 group-aria-[current=page]:scale-x-100";

export default function Header({ cities }: { cities: MenuCity[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const active = (href: string) => path.startsWith(href);
  const inSale = path.startsWith(R.catalog) && !path.startsWith(R.complexes);

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[22px_8px_22px_8px] bg-white/90 pl-4 pr-2 shadow-[0_8px_30px_-18px_rgb(22_52_87/0.5)] ring-1 ring-brand-500/10 backdrop-blur-xl sm:pl-5">
        <Logo />
        <nav aria-label="Основное меню" className="hidden items-center gap-1 lg:flex">
          {/* "Продажа": cities → top districts */}
          <div className="group/menu relative">
            <Link href={R.sale} aria-current={inSale ? "page" : undefined} aria-haspopup="true" className={link}>
              Продажа
              <span aria-hidden className={underline} />
            </Link>
            <div className="invisible absolute left-1/2 top-full w-[min(92vw,760px)] -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-[opacity,translate,visibility] duration-200 ease-out group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 motion-reduce:transition-none">
              <div className="grid grid-cols-3 gap-x-6 gap-y-5 rounded-[24px_8px_24px_8px] bg-white p-6 shadow-[0_1px_2px_rgb(22_52_87/0.08),0_30px_60px_-30px_rgb(22_52_87/0.45)] ring-1 ring-brand-500/10">
                {cities.map((c) => (
                  <div key={c.href}>
                    <Link href={c.href} className="flex items-baseline gap-2 font-black text-ink transition-colors hover:text-brand-500">
                      {c.label}<span className="text-xs font-bold tabular-nums text-slate-400">{c.count}</span>
                    </Link>
                    {c.districts.length > 0 && (
                      <ul className="mt-1.5 space-y-1 text-sm">
                        {c.districts.map((d) => (
                          <li key={d.href}><Link href={d.href} className="text-slate-600 transition-colors hover:text-brand-500">{d.label}</Link></li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined} className={link}>
              {n.label}
              <span aria-hidden className={underline} />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={CONTACTS.phoneHref} className="hidden text-sm font-black tabular-nums text-brand-700 xl:block">{CONTACTS.phone}</a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-primary hidden !px-5 !py-2.5 text-sm lg:inline-flex">
            Консультация
          </a>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-[16px_6px_16px_6px] bg-brand-500 text-white transition-transform active:scale-95 lg:hidden"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M8 12h12M12 17h8"} />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="hatch-light fixed inset-x-2 bottom-2 top-[76px] z-40 flex animate-fade flex-col overflow-y-auto rounded-[28px_10px_28px_10px] bg-brand-500 p-6 text-white lg:hidden">
          <nav aria-label="Мобильное меню" className="flex flex-col">
            {[{ href: R.sale, label: "Продажа" }, ...NAV].map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active(n.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                style={{ animationDelay: `${i * 40}ms` }}
                className="flex animate-rise items-baseline gap-4 border-b border-white/15 py-3.5 text-2xl font-black tracking-tight aria-[current=page]:text-sky"
              >
                <span className="w-6 text-xs font-bold tabular-nums text-white/50">0{i + 1}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <ul className="mt-5 flex flex-wrap gap-2">
            {cities.map((c) => (
              <li key={c.href}>
                <Link href={c.href} onClick={() => setOpen(false)} className="inline-block rounded-full px-3.5 py-1.5 text-sm font-bold ring-1 ring-white/30">{c.label}</Link>
              </li>
            ))}
          </ul>
          <div className="mt-auto grid gap-2 pt-8">
            <a href={CONTACTS.phoneHref} className="text-2xl font-black tabular-nums">{CONTACTS.phone}</a>
            <a href={`mailto:${CONTACTS.email}`} className="text-white/75">{CONTACTS.email}</a>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-sky">WhatsApp</a>
              <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="btn btn-ghost-light">Telegram</a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
