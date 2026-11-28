import Image from "next/image";
import Link from "next/link";
import { getAllProperties } from "@/lib/api";
import { geoIndex, listingPath, popular, type LinkItem } from "@/lib/catalog";
import { CONTACTS } from "@/lib/contacts";
import { cityName, districtName } from "@/lib/geo";
import { R } from "@/lib/routes";
import Logo from "./Logo";
import { MarkShapes } from "./ui";

const BUYER: [string, string][] = [
  [R.service("citizenship"), "Гражданство за инвестиции"],
  [R.service("residence-permit"), "ВНЖ при покупке"],
  [R.service("due-diligence"), "Юридическая проверка"],
  [R.service("after-sales"), "Сервис после покупки"],
  [R.complexes, "Новостройки от застройщиков"],
  [R.about, "О компании"],
  [R.team, "Команда"],
  [R.reviews, "Отзывы клиентов"],
  [R.blog, "Блог"],
  [R.contacts, "Контакты"],
];

function Col({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <nav aria-label={title}>
      <h3 className="eyebrow mb-4 text-white/60">{title}</h3>
      <ul className="space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}><Link href={href} className="text-white/85 transition-colors hover:text-sky">{label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

/** Mega footer (spec 6.3): top landings of Alanya, top districts, buyer pages, contacts. */
export default async function Footer({ lang = "ru" }: { lang?: string }) {
  const all = await getAllProperties(lang);
  const geo = geoIndex(all);
  const alanya: LinkItem[] = all.length ? popular(all, { city: "alanya", page: 1 }, geo).slice(0, 10) : [];
  const districts = [...geo.cities]
    .flatMap(([city, c]) => [...c.districts].map(([d, v]) => ({ city, d, name: v.name, count: v.count })))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <footer className="mt-20 px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="hatch-light relative isolate mx-auto max-w-[1600px] overflow-hidden rounded-[48px_14px_0_0] bg-brand-500 text-white sm:rounded-[88px_16px_88px_16px]">
        <MarkShapes light className="pointer-events-none absolute -right-24 -top-10 -z-10 w-[520px] opacity-60 sm:w-[760px]" />

        {/* Final call to action */}
        <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-10 sm:pt-20">
          <div className="grid items-end gap-8 border-b border-white/15 pb-12 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <p className="eyebrow text-sky">Бесплатная консультация</p>
              <p className="mt-4 text-balance text-3xl font-black leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Нужен безопасный выбор <span className="slant slant-white">недвижимости</span> в Турции?
              </p>
              <p className="mt-4 max-w-xl text-pretty text-white/80">
                Специалист AZPO сравнит районы, бюджеты и документы и пришлёт подборку в удобный мессенджер.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-sky">Написать в WhatsApp</a>
              <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="btn btn-ghost-light">Telegram</a>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.1fr]">
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
                className="mt-4 flex h-11 items-center justify-center gap-2 rounded-full bg-sand text-sm font-black text-[#00979A] transition-colors hover:bg-[#00979A] hover:text-white"
              >
                AZPOhealth.com
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M7 17 17 7M9 7h8v8" /></svg>
              </a>
            </div>
          </div>
          <Col title="Недвижимость в Алании" links={alanya.map((l) => [l.href, l.label.replace(/ в Алании$/, "")])} />
          <Col title="Районы" links={districts.map((d) => [listingPath({ city: d.city, district: d.d }), `${districtName(d.d, d.name)}, ${cityName(d.city)}`])} />
          <Col title="Покупателю" links={BUYER} />
          <div>
            <h3 className="eyebrow mb-4 text-white/60">Связаться</h3>
            <a href={CONTACTS.phoneHref} className="block text-xl font-black tabular-nums transition-colors hover:text-sky">{CONTACTS.phone}</a>
            <a href={`mailto:${CONTACTS.email}`} className="mt-1 block text-sm text-white/80 transition-colors hover:text-sky">{CONTACTS.email}</a>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm font-bold">
              {[["WhatsApp", CONTACTS.whatsapp], ["Telegram", CONTACTS.telegram], ["Instagram", CONTACTS.instagram], ["YouTube", CONTACTS.youtube]].map(([l, h]) => (
                <li key={l}>
                  <a href={h} target="_blank" rel="noopener" className="inline-block rounded-full px-3.5 py-1.5 ring-1 ring-white/30 transition-colors hover:bg-white hover:text-brand-500">{l}</a>
                </li>
              ))}
            </ul>
            <h3 className="eyebrow mb-3 mt-8 text-white/60">Офисы</h3>
            <ul className="space-y-3 text-sm">
              {CONTACTS.offices.map((o) => (
                <li key={o.city} className="text-white/80">
                  <span className="mb-0.5 block font-black text-white">{o.city}</span>
                  {o.address}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 pb-8 text-xs text-white/60 sm:flex-row sm:justify-between sm:px-10">
          <span>© AZPO Estate, {new Date().getFullYear()} · <Link href={R.privacy} className="underline underline-offset-2 transition-colors hover:text-sky">Политика конфиденциальности</Link></span>
          <span>Недвижимость в Турции: Алания, Анталия, Стамбул</span>
        </div>
      </div>
    </footer>
  );
}
