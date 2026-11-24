import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CITIES, getAllProperties, objects, toCard } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import HeroSearch from "@/components/HeroSearch";
import LeadForm from "@/components/LeadForm";
import { Arrow, Check, MarkShapes, SectionHead } from "@/components/ui";

export const revalidate = 600;
export const metadata: Metadata = { alternates: { canonical: "/" } };

/** Destination photos from the azpo.ru assets. Kemer and Kaş fall back to a listing photo. */
const DEST_IMG: Record<string, string> = {
  alanya: "/img/dest/alanya.webp",
  antalya: "/img/dest/antalya.webp",
  istanbul: "/img/dest/istanbul.webp",
  fethiye: "/img/dest/fethiye.webp",
  belek: "/img/dest/belek.webp",
  mersin: "/img/dest/mersin.webp",
  bodrum: "/img/dest/bodrum.webp",
  kas: "/img/dest/kas.webp",
};

const HERO_POINTS = [
  { t: "25+ лет", d: "на рынке недвижимости Турции" },
  { t: "Юристы в штате", d: "собственный юридический офис" },
  { t: "До ключей", d: "сопровождение каждой сделки" },
  { t: "После покупки", d: "управление и сервис" },
];

/** Popular property types, same set and photos as on azpo.ru. */
const TYPES = [
  { t: "Купить квартиру в Турции", href: "/property-turkey/apartments", img: "/img/types/pop1.webp" },
  { t: "Купить виллу в Турции", href: "/property-turkey/villas", img: "/img/types/pop2.webp" },
  { t: "Купить квартиру в Алании", href: "/property-turkey/alanya/apartments", img: "/img/types/pop3.webp" },
  { t: "Купить квартиру в Анталии", href: "/property-turkey/antalya/apartments", img: "/img/types/pop4.webp" },
  { t: "Виллы в Анталии", href: "/property-turkey/antalya/villas", img: "/img/types/pop5.webp" },
  { t: "Купить виллу в Алании", href: "/property-turkey/alanya/villas", img: "/img/types/pop6.webp" },
];

const SERVICES = [
  { t: "Собственный юридический офис", d: "Проверяем документы, ТАПУ, застройщика и условия покупки до задатка." },
  { t: "Ответственное управление", d: "Сдаём в аренду, следим за состоянием и оплачиваем счета, пока вас нет в Турции." },
  { t: "Послепродажный сервис", d: "Координируем ремонт и мебель, помогаем с ВНЖ, гражданством и документами." },
];

const REVIEWS = [
  { n: "Сергей Альгин", t: "Покупал недвижимость через AZPO в 2022 году. Компания порадовала хорошей организацией всех процессов и сейчас не дистанцировалась от текущих вопросов." },
  { n: "Ольга Пикина", t: "Очень впечатлены работой компании AZPO! Начинали сотрудничать с несколькими фирмами, но такого профессионального подхода ни у кого нет." },
  { n: "Исаев", t: "Всё законно, качественно и честно. С компанией было приятно сотрудничать: если возникали вопросы, представители сразу же отвечали." },
  { n: "Анна Артёмова", t: "Получили наконец-то вид на жительство в Стамбуле. Компания не обманула и по срокам не затянула." },
];

export default async function Home() {
  const all = await getAllProperties();
  const counts = all.reduce<Record<string, number>>((a, p) => ((a[p.city] = (a[p.city] ?? 0) + 1), a), {});
  const types = [...new Set(all.flatMap((p) => p.types))].sort();
  const latest = all.slice(0, 8).map((p) => toCard(p));
  const cities = Object.keys(CITIES).filter((k) => counts[k]).sort((a, b) => counts[b] - counts[a]);
  const fallback: Record<string, string | undefined> = {};
  for (const p of all) if (!fallback[p.city] && p.images[0] && p.photoCount > 8) fallback[p.city] = p.images[0];
  const coast = all.filter((p) => ["alanya", "antalya", "belek"].includes(p.city) && (p.price ?? 0) >= 400000).length;
  const ist = all.filter((p) => p.city === "istanbul" && (p.price ?? 0) >= 400000).length;
  const total = all.length || 900;

  return (
    <>
      {/* ───────────── Hero ───────────── */}
      <section className="px-2 pt-3 sm:px-4">
        <div className="relative isolate mx-auto flex min-h-[calc(100svh-104px)] max-w-[1600px] flex-col overflow-hidden rounded-[40px_12px_40px_12px] bg-brand-900 sm:min-h-[680px] lg:rounded-[88px_16px_88px_16px]">
          <Image src="/img/dest/istanbul.webp" alt="Стамбул, вид на мечеть и Босфорский мост" fill priority fetchPriority="high" sizes="100vw" quality={70} className="-z-30 object-cover" />
          {/* Brand parallelogram, slanted like the logo mark */}
          <div aria-hidden className="absolute inset-y-0 -left-[22%] -z-20 hidden w-[80%] origin-bottom-left animate-sweep bg-gradient-to-br from-brand-500 via-brand-500/95 to-brand-700/90 [transform:skewX(-14deg)] lg:block" />
          <div aria-hidden className="absolute bottom-0 left-[57%] -z-20 hidden h-[38%] w-[7%] origin-bottom-left bg-gradient-to-b from-brand-200 to-sand/90 [transform:skewX(-14deg)] lg:block" />
          <div aria-hidden className="absolute inset-x-0 top-0 -z-20 h-1/3 bg-gradient-to-b from-ink/60 to-transparent lg:hidden" />
          <div aria-hidden className="absolute inset-x-0 bottom-0 top-[22%] -z-20 bg-gradient-to-b from-brand-500/95 to-brand-700 [clip-path:polygon(0_7%,100%_0,100%_100%,0_100%)] lg:hidden" />
          <div aria-hidden className="hatch-light absolute inset-0 -z-10" />

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end gap-8 px-5 pb-5 pt-36 sm:px-10 sm:pb-8 lg:flex-row lg:items-center lg:justify-between lg:pt-16">
            <div className="max-w-2xl text-white">
              <p className="eyebrow animate-rise text-sky">AZPO Estate · Недвижимость в Турции</p>
              <h1 className="mt-4 text-[2.6rem] font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-[5.4rem]">
                Ваш ключ к <span className="font-light">успешным</span> инвестициям
              </h1>
              <p className="mt-5 max-w-lg animate-rise text-base text-white/85 [animation-delay:120ms] sm:text-xl">
                в турецкую недвижимость с полным сопровождением. {total}+ проверенных объектов у моря и в Стамбуле.
              </p>
              <div className="mt-7 flex animate-rise flex-col gap-3 [animation-delay:220ms] sm:flex-row">
                <Link href="/property-turkey" className="btn btn-sky">Смотреть каталог <Arrow /></Link>
                <Link href="/citizenship" className="btn btn-ghost-light">Гражданство за инвестиции</Link>
              </div>
            </div>
            <ul className="hidden w-72 shrink-0 flex-col gap-2.5 lg:flex">
              {HERO_POINTS.map((p, i) => (
                <li key={p.t} style={{ animationDelay: `${300 + i * 90}ms` }} className="glass flex animate-rise items-center gap-3 rounded-[20px_6px_20px_6px] p-3 text-white ring-1 ring-white/20">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px_4px_14px_4px] bg-white text-brand-500"><Check /></span>
                  <span className="leading-tight"><b className="block font-black">{p.t}</b><span className="text-sm text-white/80">{p.d}</span></span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-auto w-full max-w-7xl animate-rise px-3 pb-3 [animation-delay:350ms] sm:px-10 sm:pb-10">
            <HeroSearch types={types} />
          </div>
        </div>
      </section>

      {/* ───────────── Destinations ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead
          n="01"
          kicker="Топовые запросы"
          title={<>Любимые <span className="slant">направления</span> инвесторов</>}
          sub="Средиземноморское и Эгейское побережье, Стамбул. Наведите на город, чтобы узнать о нём больше."
        />
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:h-[480px] lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0">
          {cities.map((k, i) => {
            const img = DEST_IMG[k] ?? fallback[k];
            return (
              <Link
                key={k}
                href={`/property-turkey/${k}`}
                className="para-tile group relative isolate flex h-[400px] w-[74%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[30px_10px_30px_10px] bg-brand-700 p-5 text-white sm:w-[44%] lg:h-full lg:w-auto lg:flex-1 lg:rounded-none lg:px-16 lg:pb-8"
              >
                {img && <Image src={img} alt="" fill sizes="(max-width: 1024px) 75vw, 40vw" className="-z-20 object-cover transition duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                <span className="absolute left-5 top-5 text-xs font-bold tabular-nums text-white/70 lg:left-20">0{i + 1}</span>
                <h3 className="text-3xl font-black tracking-tight">{CITIES[k].ru}</h3>
                <p className="mt-1 text-sm font-bold text-sky">{objects(counts[k])}</p>
                <p className="mt-2 max-w-[16rem] text-sm text-white/80 lg:max-h-0 lg:overflow-hidden lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-24 lg:group-hover:opacity-100">{CITIES[k].blurb}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ───────────── Property types ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead
          n="02"
          kicker="Популярные типы"
          title={<>Начните с <span className="slant">типа</span> недвижимости</>}
          align="right"
          sub="Квартиры для жизни и аренды, виллы у моря, проекты под гражданство."
        />
        <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3 lg:gap-6">
          {TYPES.map((c, i) => (
            <Link key={c.href} href={c.href} className={`reveal group relative isolate flex aspect-[4/3] w-[80%] shrink-0 snap-start flex-col sm:w-auto justify-between overflow-hidden p-5 text-white ${i % 2 ? "rounded-[10px_36px_10px_36px]" : "rounded-[36px_10px_36px_10px]"} ${i % 3 === 1 ? "lg:translate-y-10" : ""}`}>
              <Image src={c.img} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="-z-20 object-cover transition duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />
              <span className="text-xs font-bold tabular-nums text-white/80">0{i + 1} / 06</span>
              <span className="flex items-end justify-between gap-4">
                <span className="text-2xl font-black leading-tight tracking-tight">{c.t}</span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px_4px_14px_4px] bg-white text-brand-500 transition group-hover:bg-sky group-hover:text-ink"><Arrow /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Latest ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead
          n="03"
          kicker="Новые объекты"
          title={<>Предложения <span className="slant">недвижимости</span> в Турции</>}
          action={<Link href="/property-turkey" className="btn btn-ghost">Весь каталог <Arrow /></Link>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((p) => <PropertyCard key={p.id} p={p} />)}
        </div>
      </section>

      {/* ───────────── Citizenship ───────────── */}
      <section className="px-2 pt-24 sm:px-4 sm:pt-32">
        <div className="hatch-light relative isolate mx-auto max-w-[1600px] overflow-hidden rounded-[40px_12px_40px_12px] bg-brand-500 px-5 py-14 text-white sm:px-10 sm:py-20 lg:rounded-[88px_16px_88px_16px]">
          <div aria-hidden className="absolute -right-40 -top-40 -z-10 h-[560px] w-[560px] animate-orbit opacity-30 sm:opacity-50">
            <Image src="/citizenship/earth.webp" alt="" fill sizes="560px" className="object-contain" />
          </div>
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center">
            <div>
              <SectionHead
                light
                n="04"
                kicker="Гражданство Турции за инвестиции"
                title={<>Выберите регион для покупки под <span className="slant slant-sky">гражданство</span></>}
                sub="Паспорт для всей семьи при покупке недвижимости от $400 000. Подберём объект, проверим документы и проведём через все этапы."
              />
              <Link href="/citizenship" className="btn btn-ghost-light -mt-2">Как получить гражданство <Arrow /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { t: "Средиземноморское побережье", d: "Алания, Анталия и Белек: квартиры и виллы у моря.", n: coast, href: "/property-turkey?min=400000&cur=USD", img: "/img/dest/antalya.webp" },
                { t: "Стамбул", d: "Проекты и готовое жильё на обоих берегах Босфора.", n: ist, href: "/property-turkey/istanbul?min=400000", img: "/img/dest/istanbul.webp" },
              ].map((c, i) => (
                <Link key={c.t} href={c.href} className={`group relative isolate flex min-h-[360px] flex-col justify-end overflow-hidden p-6 ${i ? "rounded-[10px_36px_10px_36px] sm:translate-y-10" : "rounded-[36px_10px_36px_10px]"}`}>
                  <Image src={c.img} alt="" fill sizes="(max-width: 640px) 100vw, 360px" className="-z-20 object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                  <span className="mb-auto w-fit rounded-full bg-white px-3 py-1 text-xs font-black text-brand-500">{objects(c.n)} от $400 000</span>
                  <h3 className="text-2xl font-black leading-tight">{c.t}</h3>
                  <p className="mt-2 text-sm text-white/80">{c.d}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-bold text-sky">Смотреть подходящие <Arrow /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Why AZPO ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead n="05" kicker="Почему нам доверяют" title={<>Зачем работать с <span className="slant">Azpo Estate</span>?</>} />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="hatch rounded-[36px_10px_36px_10px] bg-white p-6 sm:p-10">
            <p className="max-w-2xl text-lg leading-relaxed text-ink/85 sm:text-xl">
              <b className="font-black text-brand-500">Доверие и прозрачность — основа нашей работы.</b> Мы придерживаемся чёткой коммуникации и профессионального сопровождения на каждом этапе сделки, гарантируя безопасность, юридическую чистоту и отсутствие лишних волнений.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[24px_6px_24px_6px] bg-brand-500/15 sm:grid-cols-4">
              {[["25+", "лет на рынке Турции"], ["3000+", "объектов в портфолио"], [`${total}+`, "объектов в каталоге"], ["3", "офиса: Алания, Анталия, Стамбул"]].map(([v, l]) => (
                <div key={l} className="bg-white p-4 sm:p-5">
                  <dd className="text-3xl font-black tabular-nums tracking-tight text-brand-500 sm:text-4xl">{v}</dd>
                  <dt className="mt-1 text-sm leading-snug text-slate-600">{l}</dt>
                </div>
              ))}
            </dl>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {SERVICES.map((s, i) => (
                <li key={s.t} className="reveal">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px_4px_14px_4px] bg-brand-500 text-sm font-black text-white">0{i + 1}</span>
                  <h3 className="mt-3 font-black leading-snug text-ink">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{s.d}</p>
                </li>
              ))}
            </ul>
          </div>
          <figure className="relative isolate flex min-h-[460px] flex-col justify-end overflow-hidden rounded-[10px_36px_10px_36px] bg-brand-500 p-6 text-white sm:p-8">
            <Image src="/img/about/team/resul.webp" alt="Расул Чечен, владелец компании AZPO" fill sizes="(max-width: 1024px) 100vw, 420px" className="-z-20 object-cover object-top" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-brand-900 via-brand-900/30 to-transparent" />
            <MarkShapes light className="absolute right-4 top-4 -z-10 w-28 opacity-80" />
            <p className="eyebrow text-sky">Основатель компании</p>
            <figcaption className="mt-2 text-3xl font-black tracking-tight">Расул Чечен</figcaption>
            <p className="mt-1 text-white/80">Владелец AZPO Estate</p>
            <Link href="/about#team" className="mt-5 inline-flex w-fit items-center gap-2 font-bold text-white underline decoration-sky decoration-2 underline-offset-4">Вся команда AZPO <Arrow /></Link>
          </figure>
        </div>
      </section>

      {/* ───────────── Reviews ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead n="06" kicker="Отзывы клиентов" title={<>Нам <span className="slant">доверяют</span></>} align="right" />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0">
          {REVIEWS.map((r, i) => (
            <figure key={r.n} className={`reveal relative w-[86%] shrink-0 snap-start overflow-hidden bg-white p-7 sm:w-auto sm:p-9 ${i % 2 ? "rounded-[10px_36px_10px_36px] sm:translate-y-8" : "rounded-[36px_10px_36px_10px]"}`}>
              <span aria-hidden className="absolute -right-2 -top-10 select-none text-[11rem] font-black leading-none text-sky/25">”</span>
              <div className="text-lg tracking-widest text-[#f5b301]" aria-label="Оценка 5 из 5">★★★★★</div>
              <blockquote className="relative mt-4 text-lg leading-relaxed text-ink/85">{r.t}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 font-black text-ink">
                <span aria-hidden className="h-5 w-2 -skew-x-[20deg] bg-brand-500" />{r.n}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ───────────── Consultation ───────────── */}
      <section id="consult" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-36">
        <div className="grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white lg:grid-cols-2">
          <div className="p-6 sm:p-12">
            <p className="eyebrow text-brand-500">Запрос бесплатной консультации</p>
            <h2 className="mt-3 text-[2rem] font-black leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">
              Подберём недвижимость под <span className="slant">вашу задачу</span>
            </h2>
            <p className="mt-4 max-w-md text-slate-600">
              Расскажите о бюджете и целях: для жизни, отдыха, аренды или гражданства. Специалист пришлёт подборку в WhatsApp или Telegram.
            </p>
            <div className="mt-8 max-w-md"><LeadForm context="подбор недвижимости" /></div>
          </div>
          <div className="relative min-h-[320px] lg:min-h-full">
            <Image src="/img/home/contactimg.webp" alt="Специалист AZPO на связи" fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover lg:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" />
            <div aria-hidden className="absolute bottom-0 left-[6%] hidden h-1/3 w-[14%] origin-bottom-left -skew-x-[14deg] bg-gradient-to-b from-brand-200 to-sand lg:block" />
          </div>
        </div>
      </section>
    </>
  );
}
