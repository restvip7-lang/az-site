import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { CITIES, getAllProperties, objects, toCard } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import HeroSearch from "@/components/HeroSearch";
import LeadForm from "@/components/LeadForm";

export const revalidate = 600;
export const metadata: Metadata = { alternates: { canonical: "/" } };

const TRUST = ["Работаем с 2003 года", "Офисы в Алании, Анталии и Стамбуле", "Юридическая проверка объекта", "ВНЖ и гражданство под ключ"];

const REASONS = [
  { t: "Проверяем каждый объект", d: "Документы, ТАПУ, история объекта и надёжность застройщика проверяются до того, как вы внесёте задаток." },
  { t: "Сопровождаем до ключей", d: "Подбор, показы онлайн и вживую, переговоры, сделка, ТАПУ, подключение коммунальных услуг." },
  { t: "Цены застройщиков", d: "Работаем напрямую с застройщиками, без накруток. Помогаем с рассрочкой и ипотекой." },
  { t: "Сервис после покупки", d: "Мебель, управление, сдача в аренду, ВНЖ и гражданство. Всегда на связи на русском языке." },
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
  const hero = all.find((p) => p.types.includes("Виллы") && p.images.length > 5) ?? all[0];
  const cityImages: Record<string, string | undefined> = {};
  for (const p of all) if (!cityImages[p.city] && p.images[0] && p.photoCount > 8) cityImages[p.city] = p.images[0];
  const cities = Object.keys(CITIES).filter((k) => counts[k]);
  const citizenshipCoast = all.filter((p) => ["alanya", "antalya", "belek"].includes(p.city) && (p.price ?? 0) >= 400000).length;
  const citizenshipIst = all.filter((p) => p.city === "istanbul" && (p.price ?? 0) >= 400000).length;

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-900">
        {hero?.images[0] && (
          <Image src={hero.images[0]} alt="" fill priority fetchPriority="high" sizes="100vw" quality={60} className="-z-10 object-cover opacity-50" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-900/70 via-brand-900/40 to-brand-900/90" />
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-28">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-sky sm:text-sm">AZPO Estate · Недвижимость в Турции</p>
          <h1 className="max-w-3xl text-[2rem] font-black leading-tight text-white sm:text-6xl">
            Ваш ключ к успешным инвестициям в Турции
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            {all.length || 900}+ проверенных объектов у моря и в Стамбуле. Полное сопровождение сделки, ВНЖ и гражданство.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/property-turkey" className="rounded-full bg-sky px-7 py-3.5 text-center font-bold text-brand-900 transition hover:brightness-105">Смотреть каталог</Link>
            <a href="#consult" className="rounded-full bg-white/10 px-7 py-3.5 text-center font-bold text-white ring-1 ring-white/30 backdrop-blur transition hover:bg-white/20">Подобрать с экспертом</a>
          </div>
          <div className="mt-8 max-w-5xl"><HeroSearch types={types} /></div>
          <ul className="mt-6 grid grid-cols-2 gap-2 text-sm text-white/90 sm:flex sm:flex-wrap sm:gap-6">
            {TRUST.map((t) => (
              <li key={t} className="flex items-start gap-2"><span className="mt-0.5 text-sky" aria-hidden>✓</span>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-3xl font-black text-brand-900 sm:text-4xl">Направления</h2>
        <p className="mt-2 text-slate-600">Любимые города инвесторов в недвижимость Турции</p>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cities.map((k, i) => (
            <Link key={k} href={`/property-turkey/${k}`} className={`group relative isolate flex min-h-40 flex-col justify-end overflow-hidden rounded-2xl bg-brand-700 p-4 text-white ${i === 0 ? "col-span-2 row-span-2 min-h-72 lg:min-h-80" : ""}`}>
              {cityImages[k] && (
                <Image src={cityImages[k]!} alt="" fill sizes={i === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"} className="-z-10 object-cover transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <h3 className="text-xl font-black sm:text-2xl">{CITIES[k].ru}</h3>
              <p className="text-sm text-white/85">{objects(counts[k])}</p>
              {i === 0 && <p className="mt-1 hidden max-w-sm text-sm text-white/80 sm:block">{CITIES[k].blurb}</p>}
            </Link>
          ))}
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-brand-900 sm:text-4xl">Новые предложения</h2>
              <p className="mt-2 text-slate-600">Свежие объекты в нашем каталоге</p>
            </div>
            <Link href="/property-turkey" className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-brand-500 ring-1 ring-brand-500 transition hover:bg-brand-500 hover:text-white">
              Весь каталог →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-500">Гражданство Турции за инвестиции</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-black text-brand-900 sm:text-4xl">Выберите регион для покупки под гражданство</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {[
            { t: "Средиземноморское побережье", d: "Алания, Анталия и Белек: квартиры и виллы у моря от $400 000, которые подходят под программу.", n: citizenshipCoast, href: "/property-turkey?min=400000&cur=USD" },
            { t: "Стамбул", d: "Проекты и готовое жильё на европейской и азиатской сторонах города для гражданства и инвестиций.", n: citizenshipIst, href: "/property-turkey/istanbul?min=400000" },
          ].map((c) => (
            <Link key={c.t} href={c.href} className="group rounded-3xl bg-brand-500 p-7 text-white transition hover:bg-brand-600">
              <h3 className="text-2xl font-black">{c.t}</h3>
              <p className="mt-3 text-white/85">{c.d}</p>
              <p className="mt-6 font-bold text-white underline decoration-sky decoration-2 underline-offset-4">Смотреть подходящие: {c.n} →</p>
            </Link>
          ))}
        </div>
        <Link href="/citizenship" className="mt-5 inline-block font-bold text-brand-500 hover:underline">Как получить гражданство: пошаговая инструкция →</Link>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-black text-brand-900 sm:text-4xl">Почему AZPO</h2>
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[["2003", "год основания"], [`${all.length || 900}+`, "объектов в каталоге"], ["3", "офиса в Турции"], ["200+", "отзывов клиентов"]].map(([v, l]) => (
              <div key={l} className="rounded-2xl bg-sand p-5">
                <dt className="sr-only">{l}</dt>
                <dd className="text-3xl font-black text-brand-500 sm:text-4xl">{v}</dd>
                <dd className="mt-1 text-sm text-slate-600">{l}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {REASONS.map((r, i) => (
              <div key={r.t}>
                <span className="text-sm font-black text-brand-500">0{i + 1}</span>
                <h3 className="mt-2 font-black text-slate-900">{r.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <h2 className="text-3xl font-black text-brand-900 sm:text-4xl">Отзывы клиентов</h2>
        <div className="no-scrollbar -mx-4 mt-8 flex snap-x gap-4 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-4">
          {REVIEWS.map((r) => (
            <figure key={r.n} className="w-[80%] shrink-0 snap-start rounded-2xl bg-white p-6 shadow-sm sm:w-auto">
              <div className="text-[#f5b301]" aria-label="5 из 5">★★★★★</div>
              <blockquote className="mt-3 text-sm leading-relaxed text-slate-700">{r.t}</blockquote>
              <figcaption className="mt-4 font-bold text-slate-900">{r.n}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="consult" className="scroll-mt-20 bg-brand-500">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2">
          <div className="text-white">
            <h2 className="text-3xl font-black sm:text-4xl">Подберём недвижимость под вашу задачу</h2>
            <p className="mt-4 max-w-md text-white/85">
              Расскажите о бюджете и целях: для жизни, отдыха, аренды или гражданства. Специалист пришлёт подборку в WhatsApp или Telegram.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-6 ring-1 ring-white/20"><LeadForm dark /></div>
        </div>
      </section>
    </>
  );
}
