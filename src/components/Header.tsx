"use client";
import Link from "next/link";
import { useState } from "react";
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
  return (
    <header className="sticky top-0 z-40 border-b border-black/5 bg-white/95 backdrop-blur rounded-b-[10px]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-slate-700 transition hover:text-brand-500">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <a href={CONTACTS.phoneHref} className="text-sm font-semibold text-brand-700">{CONTACTS.phone}</a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600">
            Консультация
          </a>
        </div>
        <button className="p-2 lg:hidden" aria-label="Меню" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      {open && (
        <nav className="border-t border-black/5 bg-white px-4 py-3 lg:hidden">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block py-2.5 text-base font-medium text-slate-800">
              {n.label}
            </Link>
          ))}
          <a href={CONTACTS.phoneHref} className="mt-2 block py-2 font-semibold text-brand-700">{CONTACTS.phone}</a>
        </nav>
      )}
    </header>
  );
}
