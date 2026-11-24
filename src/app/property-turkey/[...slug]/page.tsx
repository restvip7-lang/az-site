import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CITIES, CONTACTS, cityName, formatPrice, getAllProperties, getPropertyDetails, getRelated, roomsLabel, toCard } from "@/lib/api";
import Catalog from "@/components/Catalog";
import Gallery from "@/components/Gallery";
import LeadForm from "@/components/LeadForm";
import PropertyCard from "@/components/PropertyCard";

export const revalidate = 600;
export async function generateStaticParams() {
  return [];
}

const TYPE_SLUGS: Record<string, string> = {
  apartments: "Квартиры",
  villas: "Виллы",
  penthouses: "Пентхаусы",
  duplexes: "Дуплексы",
};

type Params = { slug: string[] };

/** Old site URLs: /property-turkey/1044, /property-turkey/Alanya, /property-turkey/alanya/villas, /property-turkey/apartments */
function parse(slug: string[]): { id: number } | { filters: Record<string, string> } {
  const parts = slug.map((s) => decodeURIComponent(s).toLowerCase());
  if (parts.length === 1 && /^\d+$/.test(parts[0])) return { id: Number(parts[0]) };
  const filters: Record<string, string> = {};
  for (const p of parts) {
    const key = p.normalize("NFD").replace(/[̀-ͯ]/g, "").replace("ı", "i");
    if (CITIES[key]) filters.city = key;
    else if (TYPE_SLUGS[p]) filters.type = TYPE_SLUGS[p];
  }
  return { filters };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = parse((await params).slug);
  if ("id" in r) {
    const p = (await getPropertyDetails(r.id))?.property;
    if (!p) return {};
    return {
      title: p.title,
      description: `${p.title}. ${cityName(p.city)}${p.district ? `, ${p.district}` : ""}. ${roomsLabel(p)}, ${p.area ?? "—"} м², ${formatPrice(p.price, p.currency)}.`,
      openGraph: { images: p.images.slice(0, 1) },
    };
  }
  const { city, type } = r.filters ?? {};
  return { title: `${type ?? "Недвижимость"}${city ? ` в ${cityName(city)}` : " в Турции"} — купить` };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const r = parse((await params).slug);

  if (!("id" in r)) {
    const all = await getAllProperties();
    const types = [...new Set(all.flatMap((p) => p.types))].sort();
    const { city, type } = r.filters ?? {};
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h1 className="font-display mb-8 text-3xl font-bold text-brand-900 sm:text-4xl">
          {type ?? "Недвижимость"} {city ? `в ${CITIES[city]?.ru ?? city}` : "в Турции"}
        </h1>
        <Suspense>
          <Catalog items={all.map((p) => toCard(p, 3))} types={types} initial={r.filters} />
        </Suspense>
      </div>
    );
  }

  const details = await getPropertyDetails(r.id);
  if (!details) notFound();
  const p = details.property;
  const similar = (await getRelated(p)).map((x) => toCard(x));

  const facts: [string, string | null][] = [
    ["ID", String(p.id)],
    ["Город", cityName(p.city)],
    ["Район", p.district],
    ["Планировка", roomsLabel(p)],
    ["Площадь", p.area ? `${p.area} м²` : null],
    ["Санузлы", p.bathrooms ? String(p.bathrooms) : null],
    ...(details?.facts ?? []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-5 text-sm text-slate-500">
        <Link href="/" className="hover:text-brand-500">Главная</Link> / <Link href="/property-turkey" className="hover:text-brand-500">Каталог</Link> /{" "}
        <Link href={`/property-turkey?city=${p.city}`} className="hover:text-brand-500">{cityName(p.city)}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <Gallery images={p.images} title={p.title} />
          <h1 className="font-display mt-8 text-3xl font-bold leading-tight text-brand-900 sm:text-4xl">{p.title}</h1>
          <p className="mt-2 text-slate-600">{cityName(p.city)}{p.district ? `, ${p.district}` : ""}</p>
          {p.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {p.tags.map((t) => <span key={t} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">{t}</span>)}
            </div>
          )}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 sm:grid-cols-3">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="bg-white p-4">
                <dt className="text-xs uppercase tracking-wider text-slate-500">{k}</dt>
                <dd className="mt-1 font-semibold text-slate-900">{v}</dd>
              </div>
            ))}
          </dl>
          {details?.description && (
            <section className="mt-10">
              <h2 className="font-display mb-4 text-2xl font-bold text-brand-900">Описание</h2>
              <div className="prose max-w-none whitespace-pre-line leading-relaxed text-slate-700">{details.description}</div>
            </section>
          )}
          {details?.features && details.features.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display mb-4 text-2xl font-bold text-brand-900">Инфраструктура</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {details.features.map((f) => <li key={f} className="flex gap-2 text-slate-700"><span className="text-gold">✓</span>{f}</li>)}
              </ul>
            </section>
          )}
          {details?.map && (
            <a href={details.map} target="_blank" rel="noopener" className="mt-8 inline-flex items-center gap-2 rounded-full bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 hover:bg-brand-100">
              📍 Посмотреть на карте
            </a>
          )}
        </div>
        <aside className="h-fit space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl bg-brand-900 p-6 text-white">
            <p className="text-sm text-white/60">{p.priceMax ? "Цена от" : "Цена"}</p>
            <p className="mt-1 text-3xl font-bold">{formatPrice(p.price, p.currency)}</p>
            {p.priceMax && <p className="text-sm text-white/60">до {formatPrice(p.priceMax, p.currency)}</p>}
            <div className="my-5 h-px bg-white/10" />
            <LeadForm dark context={`объект ID ${p.id} — ${p.title}`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <a href={`${CONTACTS.whatsapp}?text=${encodeURIComponent(`Здравствуйте! Интересует объект ID ${p.id}`)}`} target="_blank" rel="noopener" className="rounded-xl bg-[#25D366] py-3 text-center text-sm font-semibold text-white">WhatsApp</a>
            <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="rounded-xl bg-[#229ED9] py-3 text-center text-sm font-semibold text-white">Telegram</a>
          </div>
          <a href={CONTACTS.phoneHref} className="block rounded-xl py-3 text-center text-sm font-semibold text-brand-700 ring-1 ring-brand-100">{CONTACTS.phone}</a>
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display mb-6 text-2xl font-bold text-brand-900">Похожие объекты</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{similar.map((s) => <PropertyCard key={s.id} p={s} />)}</div>
        </section>
      )}
    </div>
  );
}
