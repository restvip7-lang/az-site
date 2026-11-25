import Link from "next/link";
import type { Property } from "@/lib/api";
import { CONTACTS, toCard } from "@/lib/api";
import {
  FEATURES, INDEX_MIN, TYPES, crumbs, listingPath, select, type GeoIndex, type Query,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { cityIn, cityName, districtName } from "@/lib/geo";
import { objectName, roomsLabel } from "@/lib/paths";
import { R } from "@/lib/routes";
import { JsonLd, SITE_URL } from "@/lib/site";
import Gallery from "./Gallery";
import LeadForm from "./LeadForm";
import FavButton from "./FavButton";
import PropertyCard from "./PropertyCard";
import { Breadcrumbs } from "./catalog-blocks";
import { SectionHead } from "./ui";

export type Details = {
  property: Property;
  description: string | null;
  facts: [string, string | null][];
  features: string[];
  map: string | null;
};

export const typeOf = (p: Property) => TYPES.find((t) => p.types.includes(t.api));

/** "Квартира 2+1, 110 м², Махмутлар" — H1 template from the spec. */
export function objectH1(p: Property) {
  const where = p.districtSlug ? districtName(p.districtSlug, p.district) : cityName(p.city);
  return [objectName(p, { where: false }).replace(/, \d+ м²$/, ""), p.area ? `${p.area} м²` : null, where].filter(Boolean).join(", ");
}

/** Similar objects: same district and type within ±20% of the price, then the same city. */
function similar(all: Property[], p: Property) {
  const t = typeOf(p);
  const near = (x: Property) => !p.priceEur || !x.priceEur || Math.abs(x.priceEur - p.priceEur) <= p.priceEur * 0.2;
  const pool = all.filter((x) => x.id !== p.id && x.city === p.city && (!t || x.types.includes(t.api)));
  const ranked = [
    ...pool.filter((x) => x.districtSlug === p.districtSlug && near(x)),
    ...pool.filter((x) => x.districtSlug !== p.districtSlug && near(x)),
    ...pool.filter((x) => !near(x)),
  ];
  return ranked.slice(0, 8);
}

export default function ObjectPage({ d, all, geo }: { d: Details; all: Property[]; geo: GeoIndex }) {
  const p = d.property;
  const t = typeOf(p);
  const q: Query = { city: p.city, district: p.districtSlug ?? undefined, deal: "sale", type: t?.slug, page: 1 };
  const name = objectName(p);
  const geoQ = { city: p.city, district: p.districtSlug ?? undefined };

  // Chips from the object's characteristics to the matching landing pages (district level when it has enough objects).
  const landing = (extra: Omit<Query, "page" | "city" | "district">, label: string) => {
    const district = { ...geoQ, deal: "sale" as const, ...extra };
    const city = { city: p.city, deal: "sale" as const, ...extra };
    const qq = select(all, district).length >= INDEX_MIN ? district : city;
    return { href: listingPath(qq), label };
  };
  const chips = [
    p.districtSlug && { href: listingPath(geoQ), label: `Недвижимость: ${districtName(p.districtSlug, p.district)}` },
    t && landing({ type: t.slug }, `${t.name}: ${p.districtSlug ? districtName(p.districtSlug, p.district) : cityName(p.city)}`),
    ...(t?.residential
      ? FEATURES.filter((f) => !f.slug.startsWith("price-") && f.test(p)).slice(0, 6).map((f) => landing({ type: t.slug, feature: f.slug }, f.label))
      : []),
    p.isProject && landing({ complexes: true }, "Новостройки от застройщиков"),
  ].filter((x): x is { href: string; label: string } => !!x);

  const facts: [string, string | null][] = [
    ["ID", String(p.id)],
    ["Город", cityName(p.city)],
    ["Район", p.districtSlug ? districtName(p.districtSlug, p.district) : null],
    ["Тип", t?.sg ?? (p.isProject ? "Проект застройщика" : null)],
    ["Планировка", roomsLabel(p) || null],
    ["Площадь", p.area ? `${p.area} м²` : null],
    ["Санузлы", p.bathrooms ? String(p.bathrooms) : null],
    ["Статус", p.tags.includes("Новостройка") || p.isProject ? "Новостройка" : p.tags.includes("Вторичное жилье") ? "Вторичное жильё" : null],
    ...d.facts,
  ];

  const url = `${SITE_URL}${R.catalog}${p.city}/${p.districtSlug ? `${p.districtSlug}/` : ""}sale/id${p.id}/`;
  const house = t?.slug === "villas" ? "House" : t?.slug === "commercial" || t?.slug === "hotels" ? "Accommodation" : "Apartment";
  const listingLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${url}#listing`,
    name,
    url,
    image: p.images.slice(0, 10),
    description: d.description?.slice(0, 500) ?? name,
    offers: {
      "@type": p.priceMax ? "AggregateOffer" : "Offer",
      priceCurrency: p.currency,
      ...(p.priceMax ? { lowPrice: p.price, highPrice: p.priceMax } : { price: p.price }),
      availability: "https://schema.org/InStock",
      seller: { "@id": `${SITE_URL}/#organization` },
    },
    about: {
      "@type": house,
      name,
      ...(p.area ? { floorSize: { "@type": "QuantitativeValue", value: p.area, unitCode: "MTK" } } : {}),
      ...(p.bedMin ? { numberOfRooms: p.bedMin + 1, numberOfBedrooms: p.bedMin } : {}),
      ...(p.bathrooms ? { numberOfBathroomsTotal: p.bathrooms } : {}),
      address: {
        "@type": "PostalAddress",
        addressCountry: "TR",
        addressLocality: cityName(p.city),
        ...(p.districtSlug ? { addressRegion: districtName(p.districtSlug, p.district) } : {}),
      },
    },
  };
  const sim = similar(all, p).map((x) => toCard(x, 1));
  const h2 = "mb-5 flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl";

  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-6 sm:px-6">
      <JsonLd data={listingLd} />
      <Breadcrumbs items={crumbs(q, geo)} current={`ID ${p.id}`} />
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Gallery images={p.images} title={name} />
          <h1 className="mt-6 text-balance text-[1.7rem] font-black leading-[1.08] tracking-[-0.025em] text-ink sm:mt-8 sm:text-[2.6rem]">{objectH1(p)}</h1>
          <p className="mt-3 text-pretty text-lg text-ink/75">{p.title}</p>
          <p className="mt-2 flex items-center gap-2 font-bold text-brand-500">
            <span aria-hidden className="h-4 w-1.5 -skew-x-[20deg] bg-sky" />
            {cityName(p.city)}{p.districtSlug ? `, ${districtName(p.districtSlug, p.district)}` : ""}
            <span className="font-normal tabular-nums text-slate-500">· ID {p.id}</span>
          </p>
          <div className="mt-4"><FavButton id={p.id} variant="page" /></div>
          <p className="mt-4 text-3xl font-black tabular-nums tracking-tight text-brand-500 lg:hidden">
            {p.priceMax ? "от " : ""}{formatPrice(p.price, p.currency)}
            {p.priceMax && <span className="ml-2 text-base font-normal text-slate-600">до {formatPrice(p.priceMax, p.currency)}</span>}
          </p>
          {chips.length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-2" aria-label="Подборки с этим объектом">
              {chips.map((c) => (
                <li key={c.href + c.label}>
                  <Link href={c.href} className={`inline-block rounded-full px-3.5 py-2 text-xs font-bold transition-[box-shadow,color,filter] ${c.label === "Под гражданство" ? "bg-alert text-white ring-1 ring-alert hover:brightness-110" : "bg-white text-brand-500 ring-1 ring-brand-500/15 hover:ring-brand-500/50"}`}>{c.label}</Link>
                </li>
              ))}
            </ul>
          )}
          <section aria-labelledby="facts-h" className="mt-8">
            <h2 id="facts-h" className="sr-only">Характеристики</h2>
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px_8px_28px_8px] bg-brand-500/15 sm:grid-cols-3">
              {facts.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="bg-white p-4">
                  <dt className="eyebrow !text-[0.65rem] text-brand-500/70">{k}</dt>
                  <dd className="mt-1.5 font-black tabular-nums text-ink">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          {d.description && (
            <section className="mt-10">
              <h2 className={h2}><span aria-hidden className="h-6 w-2 -skew-x-[20deg] bg-brand-500" />Описание</h2>
              <div className="max-w-none whitespace-pre-line text-pretty text-[1.05rem] leading-relaxed text-ink/80">{d.description}</div>
            </section>
          )}
          {d.features.length > 0 && (
            <section className="mt-10">
              <h2 className={h2}><span aria-hidden className="h-6 w-2 -skew-x-[20deg] bg-brand-500" />Инфраструктура</h2>
              <ul className="flex flex-wrap gap-2">
                {d.features.map((f) => <li key={f} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-ink ring-1 ring-brand-500/10">{f}</li>)}
              </ul>
            </section>
          )}
          {d.map && (
            <a href={d.map} target="_blank" rel="noopener" className="btn btn-ghost mt-8">Район на карте</a>
          )}
          <section aria-labelledby="safe-h" className="hatch mt-10 rounded-[28px_8px_28px_8px] bg-white p-6 sm:p-8">
            <h2 id="safe-h" className="text-xl font-black tracking-tight text-ink sm:text-2xl">Купить безопасно</h2>
            <p className="mt-2 max-w-2xl text-pretty text-ink/80">
              До задатка юристы AZPO проверяют ТАПУ, обременения, искан и долги по объекту, а у новостроек — застройщика и разрешения на строительство.
            </p>
            <Link href={R.service("due-diligence")} className="mt-4 inline-flex items-center gap-2 font-bold text-brand-500 underline decoration-sky decoration-2 underline-offset-4">Как проходит проверка</Link>
          </section>
        </div>
        <aside className="h-fit space-y-3 lg:sticky lg:top-28" aria-label="Цена и заявка">
          <div className="hatch-light relative overflow-hidden rounded-[36px_10px_36px_10px] bg-brand-500 p-6 text-white sm:p-7">
            <p className="eyebrow text-sky">{p.priceMax ? "Цена от" : "Цена"}</p>
            <p className="mt-2 text-4xl font-black tabular-nums tracking-tight">{formatPrice(p.price, p.currency)}</p>
            {p.priceMax && <p className="mt-1 text-sm tabular-nums text-white/70">до {formatPrice(p.priceMax, p.currency)}</p>}
            <div className="my-6 h-px bg-white/15" />
            <LeadForm dark context={`объект ID ${p.id} — ${p.title}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={`${CONTACTS.whatsapp}?text=${encodeURIComponent(`Здравствуйте! Интересует объект ID ${p.id}`)}`} target="_blank" rel="noopener" className="btn bg-[#1f9e52] !py-3 text-sm text-white hover:brightness-110">WhatsApp</a>
            <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="btn bg-[#1a7fb0] !py-3 text-sm text-white hover:brightness-110">Telegram</a>
          </div>
          <a href={CONTACTS.phoneHref} className="btn btn-ghost w-full tabular-nums">{CONTACTS.phone}</a>
        </aside>
      </div>
      {sim.length > 0 && (
        <section className="mt-20" aria-label="Похожие объекты">
          <SectionHead title={<>Похожие <span className="slant">объекты</span></>} action={t ? <Link href={listingPath({ city: p.city, deal: "sale", type: t.slug })} className="btn btn-ghost">Все {t.lower} в {cityIn(p.city)}</Link> : undefined} />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{sim.map((s) => <li key={s.id}><PropertyCard p={s} /></li>)}</ul>
        </section>
      )}
    </div>
  );
}
