import Link from "next/link";
import { CITIES, getAllProperties, toCard } from "@/lib/api";
import PropertyCard from "@/components/PropertyCard";
import HeroSearch from "@/components/HeroSearch";
import LeadForm from "@/components/LeadForm";

export const revalidate = 600;

const REASONS = [
  { t: "С 2003 года на рынке", d: "Более 20 лет помогаем покупать недвижимость в Турции. Офисы в Алании, Анталии и Стамбуле." },
  { t: "Полное сопровождение", d: "Подбор, проверка документов, сделка, ТАПУ, ВНЖ и гражданство. Говорим по-русски." },
  { t: "Цены застройщиков", d: "Работаем напрямую с застройщиками, без накруток. Рассрочка и ипотека." },
  { t: "Сервис после покупки", d: "Управление и сдача в аренду, мебель, коммунальные услуги — берём на себя." },
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

  return (
    <>
      <section className="relative isolate overflow-hidden bg-brand-900">
        {hero?.images[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero.images[0]} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-900/60 via-brand-900/40 to-brand-900/90" />
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-gold">Недвижимость в Турции</p>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-white sm:text-6xl">
            Ваш ключ к успешным инвестициям в Турции
          </h1>
          <p className="mt-5 max-w-xl text-lg text-white/80">
            {all.length || 900}+ проверенных объектов: квартиры, виллы и новостройки у моря. Полное сопровождение сделки и гражданство.
          </p>
          <div className="mt-10 max-w-5xl"><HeroSearch types={types} /></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">Направления</h2>
            <p className="mt-2 text-slate-600">Любимые города инвесторов в недвижимость Турции</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cities.map((k, i) => (
            <Link key={k} href={`/property-turkey?city=${k}`} className={`group relative isolate flex min-h-44 flex-col justify-end overflow-hidden rounded-2xl bg-brand-700 p-4 text-white ${i === 0 ? "col-span-2 row-span-2 min-h-80" : ""}`}>
              {cityImages[k] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cityImages[k]} alt="" loading="lazy" className="absolute inset-0 -z-10 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
              )}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <h3 className="font-display text-2xl font-bold">{CITIES[k].ru}</h3>
              <p className="text-sm text-white/80">{counts[k]} объектов</p>
              {i === 0 && <p className="mt-1 max-w-sm text-sm text-white/70">{CITIES[k].blurb}</p>}
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-sand py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-bold text-brand-900 sm:text-4xl">Новые предложения</h2>
              <p className="mt-2 text-slate-600">Свежие объекты в нашем каталоге</p>
            </div>
            <Link href="/property-turkey" className="rounded-full border border-brand-500 px-5 py-2.5 text-sm font-semibold text-brand-500 transition hover:bg-brand-500 hover:text-white">
              Весь каталог →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {latest.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="font-display mb-10 text-3xl font-bold text-brand-900 sm:text-4xl">Почему AZPO</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((r, i) => (
            <div key={r.t} className="rounded-2xl border border-slate-100 p-6">
              <span className="font-display text-3xl font-bold text-gold">0{i + 1}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{r.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-700">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div className="text-white">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Бесплатная консультация</h2>
            <p className="mt-4 max-w-md text-white/75">
              Расскажите, что вы ищете, и наш специалист подберёт объекты под ваш бюджет и цели: для жизни, отдыха, аренды или гражданства.
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10"><LeadForm dark /></div>
        </div>
      </section>
    </>
  );
}
