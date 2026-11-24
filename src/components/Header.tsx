"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { CONTACTS } from "@/lib/api";

const NAV = [
  { href: "/property-turkey", label: "Каталог" },
  { href: "/property-turkey/alanya", label: "Алания" },
  { href: "/property-turkey/antalya", label: "Анталия" },
  { href: "/property-turkey/istanbul", label: "Стамбул" },
  { href: "/citizenship", label: "Гражданство" },
  { href: "/about", label: "О компании" },
  { href: "/contact-us", label: "Контакты" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  const active = (href: string) => (href === "/property-turkey" ? path === href : path.startsWith(href));

  return (
    <header className="sticky top-0 z-40 px-2 pt-2 sm:px-4">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between rounded-[22px_8px_22px_8px] bg-white/90 pl-4 pr-2 shadow-[0_8px_30px_-18px_rgb(22_52_87/0.5)] ring-1 ring-brand-500/10 backdrop-blur-xl sm:pl-5">
        <Logo />
        <nav aria-label="Основное меню" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              aria-current={active(n.href) ? "page" : undefined}
              className="group relative px-3 py-2 text-[0.92rem] font-bold text-ink/80 transition hover:text-brand-500 aria-[current=page]:text-brand-500"
            >
              {n.label}
              <span aria-hidden className="absolute inset-x-3 bottom-0.5 h-[3px] origin-left -skew-x-[30deg] scale-x-0 bg-sky transition-transform duration-300 group-hover:scale-x-100 group-aria-[current=page]:scale-x-100" />
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={CONTACTS.phoneHref} className="hidden text-sm font-black tabular-nums text-brand-700 xl:block">{CONTACTS.phone}</a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-primary hidden !px-5 !py-2.5 text-sm lg:inline-flex">
            Консультация
          </a>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-[16px_6px_16px_6px] bg-brand-500 text-white lg:hidden"
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
            {NAV.map((n, i) => (
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
