import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllProperties, objects, toCard, type Property } from "@/lib/api";
import { INDEX_MIN, TYPES, geoIndex, listingPath, priceOf, select, stats, type Query } from "@/lib/catalog";
import { CITIES, cityName, districtName } from "@/lib/geo";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { REVIEWS } from "@/lib/content";
import { SERVICES } from "@/lib/services";
import PropertyCard from "@/components/PropertyCard";
import HeroSearch, { type HeroOptions } from "@/components/HeroSearch";
import LeadForm from "@/components/LeadForm";
import { DEST_IMG } from "@/components/CatalogHeader";
import { Faq, GeoCards } from "@/components/catalog-blocks";
import { Arrow, Check, MarkShapes, SectionHead } from "@/components/ui";

export const revalidate = 600;

export async function generateMetadata(): Promise<Metadata> {
  const all = await getAllProperties();
  const n = all.length;
  const title = "Недвижимость в Турции: квартиры и виллы у моря | AZPO Estate";
  const description = `Купить недвижимость в Турции с AZPO Estate: ${n ? `${n} объектов` : "сотни объектов"} в Алании, Анталии и Стамбуле, юридическая проверка, гражданство и ВНЖ, сопровождение до ключей.`;
  return {
    title: { absolute: title },
    description,
    alternates: alternates(R.home),
    openGraph: { type: "website", title, description, url: R.home },
  };
}

const HERO_POINTS = [
  { t: "25+ лет", d: "на рынке недвижимости Турции" },
  { t: "Юристы в штате", d: "собственный юридический офис" },
  { t: "До ключей", d: "сопровождение каждой сделки" },
  { t: "После покупки", d: "управление и сервис" },
];

/** Popular property types: the photos are the ones azpo.ru uses for the same set. */
const POPULAR_TYPES: { t: string; q: Omit<Query, "page">; img: string }[] = [
  { t: "Купить квартиру в Турции", q: { deal: "sale", type: "apartments" }, img: "/img/types/pop1.webp" },
  { t: "Купить виллу в Турции", q: { deal: "sale", type: "villas" }, img: "/img/types/pop2.webp" },
  { t: "Купить квартиру в Алании", q: { city: "alanya", deal: "sale", type: "apartments" }, img: "/img/types/pop3.webp" },
  { t: "Купить квартиру в Анталии", q: { city: "antalya", deal: "sale", type: "apartments" }, img: "/img/types/pop4.webp" },
  { t: "Виллы в Анталии", q: { city: "antalya", deal: "sale", type: "villas" }, img: "/img/types/pop5.webp" },
  { t: "Купить виллу в Алании", q: { city: "alanya", deal: "sale", type: "villas" }, img: "/img/types/pop6.webp" },
];

/** Quick chips under the hero: the top landings of the spec (Б.1, item 2). */
const QUICK: [string, Omit<Query, "page">][] = [
  ["Квартиры в Алании", { city: "alanya", deal: "sale", type: "apartments" }],
  ["Виллы в Алании", { city: "alanya", deal: "sale", type: "villas" }],
  ["С видом на море", { deal: "sale", type: "apartments", feature: "sea-view" }],
  ["На первой линии", { deal: "sale", type: "apartments", feature: "first-line" }],
  ["Новостройки от застройщиков", { deal: "sale", complexes: true }],
  ["Под гражданство", { deal: "sale", type: "apartments", feature: "citizenship" }],
  ["Квартиры до 100 000 €", { deal: "sale", type: "apartments", feature: "price-to-100000" }],
  ["Квартиры 1+1", { deal: "sale", type: "apartments", feature: "1-bedroom" }],
  ["Квартиры в Анталии", { city: "antalya", deal: "sale", type: "apartments" }],
  ["Недвижимость в Стамбуле", { city: "istanbul" }],
];


const PILLARS = [
  { t: "Собственный юридический офис", d: "Проверяем документы, ТАПУ, застройщика и условия покупки до задатка." },
  { t: "Ответственное управление", d: "Сдаём в аренду, следим за состоянием и оплачиваем счета, пока вас нет в Турции." },
  { t: "Послепродажный сервис", d: "Координируем ремонт и мебель, помогаем с ВНЖ, гражданством и документами." },
];


const eur = (n: number | null) => (n ? `${n.toLocaleString("ru-RU")} €` : "");

/** Projects for the "Новостройки" block: one per district, with enough photos. */
function pickProjects(all: Property[], n: number) {
  const seen = new Set<string>();
  const out: Property[] = [];
  for (const p of all) {
    if (!p.isProject || !p.images[0] || p.photoCount < 6) continue;
    const key = `${p.city}/${p.districtSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
    if (out.length === n) break;
  }
  return out;
}

function homeFaq(all: Property[]) {
  const st = stats(all);
  const ala = stats(select(all, { city: "alanya" }));
  return [
    {
      q: "Может ли иностранец купить недвижимость в Турции?",
      a: "Да. Граждане большинства стран, включая Россию, Казахстан и страны СНГ, покупают жильё в Турции на тех же условиях, что и местные жители. Право собственности оформляется в кадастре и подтверждается документом ТАПУ. Ограничения есть только для отдельных военных и пограничных зон: юристы AZPO проверяют это по каждому объекту.",
    },
    {
      q: "Сколько стоит недвижимость в Турции?",
      a: `В каталоге AZPO ${objects(st.n)} в разных городах, цены от ${priceOf(st.min)}.${st.avgM2 ? ` Средняя цена квадратного метра по готовым объектам около ${eur(st.avgM2)}.` : ""}${ala.min ? ` В Алании объекты начинаются от ${priceOf(ala.min)}.` : ""} Цена зависит от расстояния до моря, вида, инфраструктуры комплекса и стадии строительства.`,
    },
    {
      q: "Какие налоги и расходы есть при покупке?",
      a: "Основной разовый расход — сбор за регистрацию права собственности (ТАПУ), около 4% от стоимости объекта по оценке. Также оплачиваются обязательная оценка объекта, страховка от землетрясений DASK, присяжный переводчик и нотариус. После покупки остаются ежегодный налог на имущество и коммунальные платежи. Точный расчёт специалист AZPO сделает под конкретный объект.",
    },
    {
      q: "Можно ли получить ВНЖ или гражданство при покупке?",
      a: "Да. Собственная недвижимость — основание для вида на жительство, требования к объекту периодически меняются, поэтому его проверяют до покупки. Гражданство Турции можно получить при покупке недвижимости от $400 000 с обязательством не продавать её три года. AZPO сопровождает оба процесса.",
    },
    {
      q: "Можно ли купить недвижимость дистанционно?",
      a: "Да. Объект можно выбрать по видео и онлайн-показу, а сделку провести по нотариальной доверенности. Налоговый номер, счёт в банке, проверку документов и регистрацию ТАПУ AZPO берёт на себя; приезжать в Турцию для сделки не обязательно.",
    },
    {
      q: "Где лучше купить недвижимость в Турции?",
      a: "Алания — самый популярный у русскоязычных покупателей курорт: тёплое море, доступные цены и большой выбор новостроек. Анталия — крупный город с аэропортом, клиниками и школами для круглогодичной жизни. Стамбул выбирают для бизнеса и под гражданство. Специалисты AZPO подберут город и район под вашу задачу.",
    },
  ];
}

export default async function Home() {
  const all = await getAllProperties();
  const geo = geoIndex(all);
  const count = (q: Omit<Query, "page">) => select(all, q).length;
  const total = all.length || 900;

  const cities = [...geo.cities.entries()].sort((a, b) => b[1].count - a[1].count);
  const fallback: Record<string, string | undefined> = {};
  for (const p of all) if (!fallback[p.city] && p.images[0] && p.photoCount > 8) fallback[p.city] = p.images[0];

  const options: HeroOptions = {
    cities: cities.filter(([k]) => CITIES[k]).map(([k]) => ({ value: k, label: cityName(k) })),
    types: TYPES.filter((t) => all.some((p) => p.types.includes(t.api))).map((t) => ({ value: t.slug, label: t.name, residential: t.residential })),
  };

  const quick = QUICK.map(([label, q]) => ({ label, href: listingPath(q), n: count(q) })).filter((l) => l.n >= INDEX_MIN);
  const latest = all.filter((p) => !p.isProject).slice(0, 8).map((p) => toCard(p));
  const projects = pickProjects(all, 4).map((p) => toCard(p));
  const projectsTotal = count({ deal: "sale", complexes: true });

  // Alanya districts with a listing photo each (spec Б.1, item 5).
  const alanya = geo.cities.get("alanya");
  const districts = [...(alanya?.districts ?? [])]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([slug, d]) => ({ href: listingPath({ city: "alanya", district: slug }), label: districtName(slug, d.name), count: d.count, slug }));
  const districtImages: Record<string, string | undefined> = {};
  for (const d of districts) districtImages[d.href] = all.find((p) => p.city === "alanya" && p.districtSlug === d.slug && p.images[0] && p.photoCount > 5)?.images[0];

  const citizenship = [
    { t: "Алания", d: "Квартиры и виллы у моря, которые подходят под программу гражданства.", q: { city: "alanya", deal: "sale" as const, type: "apartments", feature: "citizenship" }, img: "/img/dest/antalya.webp" },
    { t: "Стамбул", d: "Проекты и готовое жильё на обоих берегах Босфора.", q: { city: "istanbul", deal: "sale" as const, type: "apartments", feature: "citizenship" }, img: "/img/dest/istanbul.webp" },
  ].map((c) => ({ ...c, n: count(c.q), href: listingPath(c.q) }));

  const st = stats(all);
  const alaStats = stats(select(all, { city: "alanya" }));
  const topDistricts = districts.slice(0, 4);
  const faq = homeFaq(all);
  const L = "font-bold text-brand-500 underline decoration-brand-500/30 decoration-2 underline-offset-4 transition-colors hover:decoration-brand-500";

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
              <p className="eyebrow animate-rise text-sky">AZPO Estate · с полным сопровождением</p>
              <h1 className="mt-4 text-balance text-[2.6rem] font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl lg:text-[5.4rem]">
                Недвижимость в Турции<span className="mt-3 block text-[0.5em] font-light leading-[1.05] tracking-[-0.03em] text-white/90">ваш ключ к успешным инвестициям</span>
              </h1>
              <p className="mt-5 max-w-lg animate-rise text-pretty text-base text-white/85 [animation-delay:120ms] sm:text-xl">
                {total}+ проверенных объектов у моря и в Стамбуле. Юристы в штате, сделка под ключ и сервис после покупки.
              </p>
              <div className="mt-7 flex animate-rise flex-col gap-3 [animation-delay:220ms] sm:flex-row">
                <Link href={R.sale} className="btn btn-sky">Смотреть каталог <Arrow /></Link>
                <Link href={R.service("citizenship")} className="btn btn-ghost-light">Гражданство за инвестиции</Link>
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
            <HeroSearch options={options} />
          </div>
        </div>
      </section>

      {/* ───────────── Quick links to the top landings ───────────── */}
      {quick.length > 0 && (
        <nav aria-label="Популярные запросы" className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {quick.map((l) => (
              <li key={l.href} className="shrink-0">
                <Link href={l.href} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow,scale] duration-200 ease-out hover:text-brand-500 hover:ring-brand-500/40 active:scale-[0.97]">
                  {l.label}
                  <span className="rounded-full bg-sand px-2 py-0.5 text-xs tabular-nums text-brand-700">{l.n}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {/* ───────────── Destinations ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead
          n="01"
          kicker="Топовые запросы"
          title={<>Любимые <span className="slant">направления</span> инвесторов</>}
          sub="Средиземноморское и Эгейское побережье, Стамбул. Наведите на город, чтобы узнать о нём больше."
        />
        <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:h-[480px] lg:gap-0 lg:overflow-visible lg:px-0 lg:pb-0">
          {cities.filter(([k]) => CITIES[k]).map(([k, c], i) => {
            const img = DEST_IMG[k] ?? fallback[k];
            return (
              <Link
                key={k}
                href={listingPath({ city: k })}
                className="para-tile group relative isolate flex h-[400px] w-[74%] shrink-0 snap-start flex-col justify-end overflow-hidden rounded-[30px_10px_30px_10px] bg-brand-700 p-5 text-white sm:w-[44%] lg:h-full lg:w-auto lg:flex-1 lg:rounded-none lg:pb-8 lg:pl-6 lg:pr-20"
              >
                {img && <Image src={img} alt="" fill sizes="(max-width: 1024px) 75vw, 40vw" className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent" />
                <span className="absolute left-5 top-5 text-xs font-bold tabular-nums text-white/70 lg:left-20">0{i + 1}</span>
                <h3 className="text-3xl font-black tracking-tight lg:text-2xl">{CITIES[k].ru}</h3>
                <p className="mt-1 text-sm font-bold tabular-nums text-sky">{objects(c.count)}</p>
                <p className="mt-2 max-w-[16rem] text-pretty text-sm text-white/80 lg:h-[3.75rem] lg:overflow-hidden lg:translate-y-2 lg:opacity-0 lg:transition-[opacity,translate] lg:duration-300 lg:ease-out lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-hover:delay-150 lg:group-focus-visible:translate-y-0 lg:group-focus-visible:opacity-100">{CITIES[k].blurb}</p>
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
          {POPULAR_TYPES.map((c, i) => (
            <Link key={c.t} href={listingPath(c.q)} className={`reveal group relative isolate flex aspect-[4/3] w-[80%] shrink-0 snap-start flex-col justify-between overflow-hidden p-5 text-white sm:w-auto ${i % 2 ? "rounded-[10px_36px_10px_36px]" : "rounded-[36px_10px_36px_10px]"} ${i % 3 === 1 ? "lg:translate-y-10" : ""}`}>
              <Image src={c.img} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px" className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/30" />
              <span className="text-xs font-bold tabular-nums text-white/80">0{i + 1} / 06 · {objects(count(c.q))}</span>
              <span className="flex items-end justify-between gap-4">
                <span className="text-balance text-2xl font-black leading-tight tracking-tight">{c.t}</span>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px_4px_14px_4px] bg-white text-brand-500 transition-[background-color,color,translate] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:bg-sky group-hover:text-ink"><Arrow /></span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ───────────── Latest ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead
          n="03"
          kicker="Новые поступления"
          title={<>Предложения <span className="slant">недвижимости</span> в Турции</>}
          action={<Link href={R.sale} className="btn btn-ghost">Все объекты <Arrow /></Link>}
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((p) => <div key={p.id} className="reveal h-full"><PropertyCard p={p} /></div>)}
        </div>
      </section>

      {/* ───────────── New builds from developers ───────────── */}
      {projects.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHead
            n="04"
            kicker="Жилые комплексы"
            title={<>Новостройки <span className="slant">от застройщиков</span></>}
            align="right"
            sub="Проекты турецких застройщиков, которые продаёт AZPO: квартиры на этапе строительства и в сданных домах, часто с рассрочкой."
            action={<Link href={R.complexes} className="btn btn-ghost">{projectsTotal ? `Все новостройки · ${projectsTotal}` : "Все новостройки"} <Arrow /></Link>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {projects.map((p) => <div key={p.id} className="reveal h-full"><PropertyCard p={p} /></div>)}
          </div>
        </section>
      )}

      {/* ───────────── Districts of Alanya ───────────── */}
      {districts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-32">
          <SectionHead
            n="05"
            kicker="Алания по районам"
            title={<>Районы <span className="slant">Алании</span></>}
            sub="У каждого района своя инфраструктура, расстояние до моря и уровень цен."
            action={<Link href={listingPath({ city: "alanya" })} className="btn btn-ghost">Вся Алания{alanya?.count ? ` · ${alanya.count}` : ""} <Arrow /></Link>}
          />
          <GeoCards items={districts} images={districtImages} />
        </section>
      )}

      {/* ───────────── Citizenship ───────────── */}
      <section className="px-2 pt-16 sm:px-4 sm:pt-24">
        <div className="hatch-light relative isolate mx-auto max-w-[1600px] overflow-hidden rounded-[40px_12px_40px_12px] bg-brand-500 px-5 py-14 text-white sm:px-10 sm:py-20 lg:rounded-[88px_16px_88px_16px]">
          <div aria-hidden className="absolute -right-40 -top-40 -z-10 h-[560px] w-[560px] animate-orbit opacity-30 sm:opacity-50">
            <Image src="/citizenship/earth.webp" alt="" fill sizes="560px" className="object-contain" />
          </div>
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_1.25fr] lg:items-center">
            <div>
              <SectionHead
                light
                n="06"
                kicker="Гражданство Турции за инвестиции"
                title={<>Выберите регион для покупки под <span className="slant slant-sky">гражданство</span></>}
                sub="Паспорт для всей семьи при покупке недвижимости от $400 000. Подберём объект, проверим документы и проведём через все этапы."
              />
              <Link href={R.service("citizenship")} className="btn btn-ghost-light -mt-2">Как получить гражданство <Arrow /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {citizenship.map((c, i) => (
                <Link key={c.t} href={c.href} className={`group relative isolate flex min-h-[360px] flex-col justify-end overflow-hidden p-6 ${i ? "rounded-[10px_36px_10px_36px] sm:translate-y-10" : "rounded-[36px_10px_36px_10px]"}`}>
                  <Image src={c.img} alt="" fill sizes="(max-width: 640px) 100vw, 360px" className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
                  <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                  <span className="mb-auto w-fit rounded-full bg-white px-3 py-1 text-xs font-black tabular-nums text-brand-500">{c.n ? `${objects(c.n)} под гражданство` : "Подбор под гражданство"}</span>
                  <h3 className="text-2xl font-black leading-tight">{c.t}</h3>
                  <p className="mt-2 text-pretty text-sm text-white/80">{c.d}</p>
                  <span className="mt-4 inline-flex items-center gap-2 font-bold text-sky">Смотреть подходящие <Arrow className="transition-transform duration-200 ease-out group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Services ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36" aria-labelledby="services-h">
        <SectionHead
          n="07"
          kicker="Услуги"
          title={<span id="services-h">Сопровождаем до ключей <span className="slant">и после</span></span>}
          action={<Link href={R.services} className="btn btn-ghost">Все услуги <Arrow /></Link>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <li key={s.slug} className="reveal">
              <Link href={R.service(s.slug)} className={`group flex h-full flex-col bg-white p-6 shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(22_52_87/0.06),0_28px_50px_-28px_rgb(22_52_87/0.55)] ${i % 2 ? "rounded-[10px_30px_10px_30px]" : "rounded-[30px_10px_30px_10px]"}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px_4px_14px_4px] bg-brand-500 text-sm font-black tabular-nums text-white">0{i + 1}</span>
                <h3 className="mt-4 text-balance text-lg font-black leading-snug text-ink">{s.name}</h3>
                <p className="mt-2 flex-1 text-pretty text-sm leading-relaxed text-slate-600">{s.short}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-brand-500">Подробнее <Arrow className="transition-transform duration-200 ease-out group-hover:translate-x-1" /></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ───────────── Why AZPO ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead n="08" kicker="Почему нам доверяют" title={<>Зачем работать с <span className="slant">Azpo Estate</span>?</>} />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="hatch rounded-[36px_10px_36px_10px] bg-white p-6 sm:p-10">
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-ink/85 sm:text-xl">
              <b className="font-black text-brand-500">Доверие и прозрачность — основа нашей работы.</b> Мы придерживаемся чёткой коммуникации и профессионального сопровождения на каждом этапе сделки, гарантируя безопасность, юридическую чистоту и отсутствие лишних волнений.
            </p>
            <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[24px_6px_24px_6px] bg-brand-500/15 sm:grid-cols-4">
              {[["25+", "лет на рынке Турции"], ["3000+", "объектов в портфолио"], [`${total}+`, "объектов в каталоге"], ["3", "офиса: Алания, Анталия, Стамбул"]].map(([v, l]) => (
                <div key={l} className="flex flex-col-reverse bg-white p-4 sm:p-5">
                  <dt className="mt-1 text-sm leading-snug text-slate-600">{l}</dt>
                  <dd className="text-3xl font-black tabular-nums tracking-tight text-brand-500 sm:text-4xl">{v}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-8 grid gap-4 sm:grid-cols-3">
              {PILLARS.map((s, i) => (
                <li key={s.t} className="reveal">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[14px_4px_14px_4px] bg-brand-500 text-sm font-black tabular-nums text-white">0{i + 1}</span>
                  <h3 className="mt-3 font-black leading-snug text-ink">{s.t}</h3>
                  <p className="mt-1.5 text-pretty text-sm leading-relaxed text-slate-600">{s.d}</p>
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
            <Link href={R.team} className="mt-5 inline-flex w-fit items-center gap-2 font-bold text-white underline decoration-sky decoration-2 underline-offset-4">Вся команда AZPO <Arrow /></Link>
          </figure>
        </div>
      </section>

      {/* ───────────── Reviews ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <SectionHead
          n="09"
          kicker="Отзывы клиентов"
          title={<>Нам <span className="slant">доверяют</span></>}
          align="right"
          action={<Link href={R.reviews} className="btn btn-ghost">Все отзывы <Arrow /></Link>}
        />
        <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-8">
          {REVIEWS.map((r, i) => (
            <figure key={r.name} className={`reveal relative w-[86%] shrink-0 snap-start overflow-hidden bg-white p-7 sm:w-auto sm:p-9 ${i % 2 ? "rounded-[10px_36px_10px_36px] sm:translate-y-8" : "rounded-[36px_10px_36px_10px]"}`}>
              <span aria-hidden className="absolute -right-2 -top-10 select-none text-[11rem] font-black leading-none text-sky/25">”</span>
              <div className="text-lg tracking-widest text-[#f5b301]" role="img" aria-label="Оценка 5 из 5">★★★★★</div>
              <blockquote className="relative mt-4 text-pretty text-lg leading-relaxed text-ink/85">{r.text}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 font-black text-ink">
                <span aria-hidden className="h-5 w-2 -skew-x-[20deg] bg-brand-500" />{r.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* ───────────── About the market (SEO text, a draft for review) ───────────── */}
      <section aria-labelledby="market-h" className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 sm:pt-36">
        <div className="grid gap-8 rounded-[36px_10px_36px_10px] bg-white p-6 sm:p-10 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <p className="eyebrow text-brand-500">О рынке</p>
            <h2 id="market-h" className="mt-3 text-balance text-2xl font-black leading-tight tracking-tight text-ink sm:text-4xl">Как купить недвижимость в Турции и не ошибиться</h2>
          </div>
          <div className="space-y-4 text-pretty leading-relaxed text-ink/80">
            <p>
              Турция остаётся одним из самых понятных рынков для иностранного покупателя: право собственности регистрируется в государственном кадастре, а купить жильё можно и на этапе строительства, и на вторичном рынке. В каталоге AZPO {objects(st.n)}{st.min ? `, цены от ${priceOf(st.min)}` : ""}. Больше всего предложений на Средиземноморском побережье: <Link href={listingPath({ city: "alanya" })} className={L}>недвижимость в Алании</Link>, <Link href={listingPath({ city: "antalya" })} className={L}>Анталии</Link> и Белеке, а также в <Link href={listingPath({ city: "istanbul" })} className={L}>Стамбуле</Link>.
            </p>
            <p>
              Алания — курорт с длинной береговой линией и большим выбором новостроек. {alaStats.min ? `Здесь объекты начинаются от ${priceOf(alaStats.min)}. ` : ""}Популярные районы — {topDistricts.map((d, i) => (
                <span key={d.href}>{i > 0 && (i === topDistricts.length - 1 ? " и " : ", ")}<Link href={d.href} className={L}>{districtName(d.slug, d.label)}</Link></span>
              ))}: в каждом своя инфраструктура, расстояние до моря и уровень цен. Для отдыха и сдачи в аренду чаще берут <Link href={listingPath({ city: "alanya", deal: "sale", type: "apartments", feature: "1-bedroom" })} className={L}>квартиры 1+1</Link>, для жизни с семьёй — 2+1 и <Link href={listingPath({ city: "alanya", deal: "sale", type: "villas" })} className={L}>виллы</Link>.
            </p>
            <p>
              Новостройки от застройщиков обычно продаются с рассрочкой до сдачи дома, а цена на старте строительства ниже, чем в готовом комплексе. Готовое жильё на вторичном рынке можно увидеть вживую и сразу заехать или сдавать. Посмотрите <Link href={R.complexes} className={L}>новостройки от застройщиков</Link> и <Link href={listingPath({ deal: "sale", type: "apartments", feature: "sea-view" })} className={L}>квартиры с видом на море</Link>: это самые востребованные запросы наших клиентов.
            </p>
            <p>
              Перед задатком важно проверить ТАПУ, разрешение на заселение (искан), отсутствие долгов и обременений, а у новостроек — самого застройщика и договор. Это делает собственный <Link href={R.service("due-diligence")} className={L}>юридический отдел AZPO</Link>. Покупка от $400 000 даёт право на <Link href={R.service("citizenship")} className={L}>гражданство Турции</Link>, а собственная квартира — основание для <Link href={R.service("residence-permit")} className={L}>вида на жительство</Link>. После сделки мы помогаем с ремонтом, мебелью, арендой и коммунальными платежами.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Faq items={faq} title="Частые вопросы о покупке" />
      </div>

      {/* ───────────── Consultation ───────────── */}
      <section id="consult" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6 sm:pt-32">
        <div className="grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white lg:grid-cols-2">
          <div className="p-6 sm:p-12">
            <p className="eyebrow text-brand-500">Запрос бесплатной консультации</p>
            <h2 className="mt-3 text-balance text-[2rem] font-black leading-[1.02] tracking-[-0.03em] text-ink sm:text-5xl">
              Подберём недвижимость под <span className="slant">вашу задачу</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-slate-600">
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
