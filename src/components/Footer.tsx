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
