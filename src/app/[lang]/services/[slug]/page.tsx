import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listingPath } from "@/lib/catalog";
import { CONTACTS } from "@/lib/contacts";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { SERVICES, SERVICE_BY_SLUG, serviceLd } from "@/lib/services";
import { JsonLd } from "@/lib/site";
import { seoFor, withSeo } from "@/lib/admin/seo";
import LeadForm from "@/components/LeadForm";
import { Breadcrumbs, Faq } from "@/components/catalog-blocks";
import { Arrow, Check, MarkShapes } from "@/components/ui";

// Citizenship has its own static page; the other services are rendered from lib/services.
export const dynamicParams = false;
export function generateStaticParams() {
  return SERVICES.filter((s) => s.slug !== "citizenship").map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = SERVICE_BY_SLUG[(await params).slug];
  if (!s) return {};
  const url = R.service(s.slug);
  return withSeo({ title: { absolute: `${s.title} | AZPO Estate` }, description: s.description, alternates: alternates(url), openGraph: { title: s.title, description: s.description, url } }, await seoFor(url));
}

/** Catalogue landings that fit each service. */
const RELATED: Record<string, [string, string][]> = {
  "residence-permit": [
    ["Квартиры под ВНЖ", listingPath({ deal: "sale", type: "apartments", feature: "residence-permit" })],
    ["Квартиры в Алании", listingPath({ city: "alanya", deal: "sale", type: "apartments" })],
    ["Квартиры в Анталии", listingPath({ city: "antalya", deal: "sale", type: "apartments" })],
  ],
  "due-diligence": [
    ["Вторичное жильё", listingPath({ deal: "sale", type: "apartments", feature: "resale" })],
    ["Квартиры от застройщика", listingPath({ deal: "sale", type: "apartments", feature: "from-developer" })],
    ["Новостройки от застройщиков", R.complexes],
  ],
  "after-sales": [
    ["Квартиры для инвестиций", listingPath({ deal: "sale", type: "apartments", feature: "investment" })],
    ["Квартиры 1+1", listingPath({ deal: "sale", type: "apartments", feature: "1-bedroom" })],
    ["Квартиры с видом на море", listingPath({ deal: "sale", type: "apartments", feature: "sea-view" })],
  ],
};

export default async function ServicePage({ params }: Props) {
  const s = SERVICE_BY_SLUG[(await params).slug];
  if (!s || s.slug === "citizenship") notFound();
  const url = R.service(s.slug);
  const others = SERVICES.filter((x) => x.slug !== s.slug);
  const seo = await seoFor(url);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Услуги", href: R.services }, { name: s.name, href: url }]} />
      <JsonLd data={serviceLd(s, url)} />

      {/* Hero */}
      <section className="hatch-light relative isolate overflow-hidden rounded-[40px_12px_40px_12px] bg-brand-500 px-6 py-12 text-white sm:px-12 sm:py-16 lg:rounded-[72px_14px_72px_14px]">
        <MarkShapes light className="pointer-events-none absolute -right-16 -top-10 -z-10 w-[360px] opacity-50 sm:w-[520px]" />
        <p className="eyebrow animate-rise text-sky">Услуги AZPO</p>
        <h1 className="mt-3 max-w-3xl animate-rise text-balance text-4xl font-black leading-[1] tracking-[-0.04em] [animation-delay:60ms] sm:text-6xl">{seo?.h1 ?? s.name}</h1>
        <p className="mt-5 max-w-2xl animate-rise text-pretty text-lg text-white/85 [animation-delay:120ms]">{seo?.intro ?? s.lead}</p>
        <div className="mt-8 flex animate-rise flex-col gap-3 [animation-delay:180ms] sm:flex-row">
          <a href="#service-form" className="btn btn-sky">Получить консультацию <Arrow /></a>
          <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn btn-ghost-light">Написать в WhatsApp</a>
        </div>
      </section>

      {/* What we check / what is included */}
      {s.checks && (
        <section aria-labelledby="checks-h" className="mt-16">
          <h2 id="checks-h" className="mb-6 text-balance text-2xl font-black tracking-tight text-ink sm:text-4xl">{s.checks.h}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.checks.items.map(([h, d], i) => (
              <li key={h} className={`reveal bg-white p-6 shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] ${i % 2 ? "rounded-[10px_28px_10px_28px]" : "rounded-[28px_10px_28px_10px]"}`}>
                <span className="flex h-10 w-10 items-center justify-center rounded-[14px_4px_14px_4px] bg-sand text-brand-500"><Check /></span>
                <h3 className="mt-4 text-lg font-black text-ink">{h}</h3>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">{d}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Steps */}
      <section aria-labelledby="steps-h" className="mt-16">
        <h2 id="steps-h" className="mb-6 text-balance text-2xl font-black tracking-tight text-ink sm:text-4xl">Как мы работаем</h2>
        <ol className="grid gap-px overflow-hidden rounded-[28px_8px_28px_8px] bg-brand-500/15 sm:grid-cols-2 lg:grid-cols-3">
          {s.steps.map(([h, d], i) => (
            <li key={h} className="bg-white p-6">
              <span className="text-3xl font-black tabular-nums tracking-tight text-brand-500">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-2 font-black text-ink">{h}</h3>
              <p className="mt-1.5 text-pretty text-sm leading-relaxed text-slate-600">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Timing and cost */}
      <section aria-labelledby="terms-h" className="mt-16 grid gap-4 lg:grid-cols-[1fr_2fr]">
        <h2 id="terms-h" className="text-balance text-2xl font-black tracking-tight text-ink sm:text-4xl">Сроки и стоимость</h2>
        <dl className="grid gap-4 sm:grid-cols-2">
          {s.terms.map(([h, d]) => (
            <div key={h} className="rounded-[24px_8px_24px_8px] bg-sand p-6">
              <dt className="eyebrow text-brand-500">{h}</dt>
              <dd className="mt-2 text-pretty leading-relaxed text-ink/85">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Related catalogue landings */}
      {RELATED[s.slug] && (
        <section aria-labelledby="related-h" className="mt-12">
          <h2 id="related-h" className="mb-4 flex items-center gap-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
            <span aria-hidden className="h-5 w-1.5 -skew-x-[20deg] bg-sky" />Подходящие объекты
          </h2>
          <ul className="flex flex-wrap gap-2 text-sm font-bold">
            {RELATED[s.slug].map(([l, h]) => (
              <li key={h}><Link href={h} className="inline-block rounded-full bg-white px-4 py-2.5 text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow] duration-200 ease-out hover:text-brand-500 hover:ring-brand-500/40">{l}</Link></li>
            ))}
          </ul>
        </section>
      )}

      <Faq items={s.faq} />

      {/* Form */}
      <section id="service-form" aria-labelledby="form-h" className="mt-16 grid scroll-mt-24 overflow-hidden rounded-[36px_10px_36px_10px] bg-brand-500 text-white lg:grid-cols-[1.2fr_1fr]">
        <div className="hatch-light p-6 sm:p-10">
          <h2 id="form-h" className="text-balance text-2xl font-black tracking-tight sm:text-4xl">Обсудим вашу ситуацию</h2>
          <p className="mt-3 max-w-lg text-pretty text-white/80">Опишите задачу: специалист AZPO ответит в WhatsApp или Telegram и назовёт сроки и стоимость для вашего случая.</p>
        </div>
        <div className="bg-brand-700/40 p-6 sm:p-10"><LeadForm dark context={s.name} /></div>
      </section>

      {/* Other services */}
      <section aria-labelledby="other-h" className="mt-12">
        <h2 id="other-h" className="mb-4 flex items-center gap-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 -skew-x-[20deg] bg-sky" />Другие услуги
        </h2>
        <ul className="flex flex-wrap gap-2 text-sm font-bold">
          {others.map((o) => (
            <li key={o.slug}><Link href={R.service(o.slug)} className="inline-block rounded-full bg-white px-4 py-2.5 text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow] duration-200 ease-out hover:text-brand-500 hover:ring-brand-500/40">{o.name}</Link></li>
          ))}
        </ul>
      </section>

      {s.draft && <p className="mt-10 text-xs text-slate-500">Текст страницы — черновик для демо, требует проверки юристами AZPO.</p>}
    </div>
  );
}
