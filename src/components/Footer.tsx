import Image from "next/image";
import Link from "next/link";
import Logo from "./Logo";
import { CONTACTS } from "@/lib/api";
import { MarkShapes } from "./ui";

const NAV = [
  ["/property-turkey", "Каталог недвижимости"],
  ["/property-turkey/alanya", "Недвижимость в Алании"],
  ["/property-turkey/antalya", "Недвижимость в Анталии"],
  ["/property-turkey/istanbul", "Недвижимость в Стамбуле"],
  ["/citizenship", "Гражданство Турции"],
  ["/about", "О компании"],
  ["/contact-us", "Контакты"],
];

export default function Footer() {
  return (
    <footer className="mt-20 px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="hatch-light relative isolate mx-auto max-w-[1600px] overflow-hidden rounded-[48px_14px_0_0] bg-brand-500 text-white sm:rounded-[88px_16px_88px_16px]">
        <MarkShapes light className="pointer-events-none absolute -right-24 -top-10 -z-10 w-[520px] opacity-60 sm:w-[760px]" />

        {/* Final call to action */}
        <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-10 sm:pt-20">
          <div className="grid items-end gap-8 border-b border-white/15 pb-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow text-sky">Бесплатная консультация</p>
              <p className="mt-4 text-3xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Нужен безопасный выбор <span className="slant slant-white">недвижимости</span> в Турции?
              </p>
              <p className="mt-4 max-w-xl text-white/80">
                Специалист AZPO сравнит районы, бюджеты и документы и пришлёт подборку в удобный мессенджер.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-sky">Написать в WhatsApp</a>
              <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="btn btn-ghost-light">Telegram</a>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-10 md:grid-cols-[1.2fr_1fr_1.3fr_1fr]">
          <div className="space-y-5">
            <Logo light />
            <p className="max-w-xs text-sm leading-relaxed text-white/75">
              Ваш ключ к успешным инвестициям в турецкую недвижимость с полным сопровождением.
            </p>

            {/* Sister company from the original azpo.ru footer: "Другие отделы" → AZPO Health */}
            <div className="glass max-w-xs rounded-[26px_8px_26px_8px] p-4">
              <p className="eyebrow text-white/60">Другие отделы</p>
              <div className="mt-3 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px_4px_12px_4px] bg-sand p-1.5">
                  <Image src="/brand/azpo-health.webp" alt="" width={32} height={32} />
                </span>
                <span className="leading-none">
                  <span className="block text-xl font-black tracking-[-0.02em]">AZPO</span>
                  <span className="block text-xs font-bold uppercase tracking-[0.2em] text-white/80">Health</span>
                </span>
              </div>
              <p className="mt-3 text-sm leading-snug text-white/80">
                Ищете первоклассную медицинскую помощь во время отпуска в Турции?
              </p>
              <a
                href="https://azpohealth.com"
                target="_blank"
                rel="noopener"
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-sand text-sm font-black text-[#00979A] transition hover:bg-[#00979A] hover:text-white"
              >
                AZPOhealth.com
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M7 17 17 7M9 7h8v8" /></svg>
              </a>
            </div>
          </div>
          <nav aria-label="Разделы сайта">
            <h3 className="eyebrow mb-4 text-white/60">Разделы</h3>
            <ul className="space-y-2.5 text-sm">
              {NAV.map(([href, label]) => (
                <li key={href}><Link href={href} className="text-white/85 transition hover:text-sky">{label}</Link></li>
              ))}
            </ul>
          </nav>
          <div>
            <h3 className="eyebrow mb-4 text-white/60">Офисы</h3>
            <ul className="space-y-4 text-sm">
              {CONTACTS.offices.map((o) => (
                <li key={o.city} className="text-white/80">
                  <span className="mb-0.5 block font-black text-white">{o.city}</span>
                  {o.address}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="eyebrow mb-4 text-white/60">Связаться</h3>
            <a href={CONTACTS.phoneHref} className="block text-xl font-black tabular-nums hover:text-sky">{CONTACTS.phone}</a>
            <a href={`mailto:${CONTACTS.email}`} className="mt-1 block text-sm text-white/80 hover:text-sky">{CONTACTS.email}</a>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
              {[["WhatsApp", CONTACTS.whatsapp], ["Telegram", CONTACTS.telegram], ["Instagram", CONTACTS.instagram], ["YouTube", CONTACTS.youtube]].map(([l, h]) => (
                <li key={l}>
                  <a href={h} target="_blank" rel="noopener" className="inline-block rounded-full px-3.5 py-1.5 ring-1 ring-white/30 transition hover:bg-white hover:text-brand-500">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 pb-8 text-xs text-white/60 sm:flex-row sm:justify-between sm:px-10">
          <span>© AZPO Estate, {new Date().getFullYear()}</span>
          <span>Недвижимость в Турции: Алания, Анталия, Стамбул</span>
        </div>
      </div>
    </footer>
  );
}
