import Image from "next/image";
import Link from "next/link";
import type { Crumb, LinkItem, SeoBlock } from "@/lib/catalog";
import { objects } from "@/lib/format";
import { JsonLd, SITE_URL } from "@/lib/site";

/** Breadcrumbs: visible <nav><ol> plus BreadcrumbList markup. The last item is the current page. */
export function Breadcrumbs({ items, current }: { items: Crumb[]; current?: string }) {
  const all = current ? [...items, { name: current, href: "" }] : items;
  return (
    <>
      <nav aria-label="Хлебные крошки" className="mb-5 text-sm font-bold text-slate-500">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {all.map((c, i) => (
            <li key={`${c.href}${i}`} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-slate-300">/</span>}
              {c.href && i < all.length - 1 ? (
                <Link href={c.href} className="transition-colors hover:text-brand-500">{c.name}</Link>
              ) : (
                <span aria-current="page" className="text-ink">{c.name}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.name,
            ...(c.href ? { item: `${SITE_URL}${c.href}` } : {}),
          })),
        }}
      />
    </>
  );
}

/** A block of interlinking chips: "Уточнить запрос", "Соседние районы"… */
export function LinkBlock({ title, items, id }: { title: string; items: LinkItem[]; id?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={id} className="mt-12">
      <h2 id={id} className="mb-4 flex items-center gap-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
        <span aria-hidden className="h-5 w-1.5 -skew-x-[20deg] bg-sky" />
        {title}
      </h2>
      <ul className="flex flex-wrap gap-2">
        {items.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow] hover:text-brand-500 hover:ring-brand-500/40 active:scale-[0.98]"
            >
              {l.label}
              <span className="rounded-full bg-sand px-2 py-0.5 text-xs tabular-nums text-brand-700">{l.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Child geo with a photo and object count (cities of Turkey, districts of a city). */
export function GeoCards({ title, items, images }: { title?: string; items: LinkItem[]; images: Record<string, string | undefined> }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby={title ? "geo-h" : undefined} aria-label={title ? undefined : "Районы"} className="mb-10">
      {title && (
        <h2 id="geo-h" className="mb-4 flex items-center gap-3 text-xl font-black tracking-tight text-ink sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 -skew-x-[20deg] bg-brand-500" />
          {title}
        </h2>
      )}
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
        {items.map((g, i) => (
          <li key={g.href} className="reveal w-[46%] shrink-0 snap-start sm:w-auto">
            <Link href={g.href} className={`group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden p-4 text-white ${i % 2 ? "rounded-[10px_26px_10px_26px]" : "rounded-[26px_10px_26px_10px]"}`}>
              {images[g.href] && <Image src={images[g.href]!} alt="" fill sizes="(max-width: 640px) 46vw, 240px" className="-z-20 object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
              <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/20 to-brand-700/30" />
              <span className="text-lg font-black leading-tight">{g.label}</span>
              <span className="mt-0.5 text-sm font-bold tabular-nums text-sky">{objects(g.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SeoText({ blocks }: { blocks: SeoBlock[] }) {
  return (
    <section aria-label="О подборке" className="mt-16 grid gap-8 rounded-[36px_10px_36px_10px] bg-white p-6 sm:p-10 lg:grid-cols-2">
      {blocks.map((b) => (
        <div key={b.h}>
          <h2 className="text-balance text-xl font-black tracking-tight text-ink sm:text-2xl">{b.h}</h2>
          {b.p.map((t, i) => <p key={i} className="mt-3 text-pretty leading-relaxed text-ink/80">{t}</p>)}
        </div>
      ))}
    </section>
  );
}

export function Faq({ items, title = "Частые вопросы" }: { items: { q: string; a: string }[]; title?: string }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="faq-h" className="mt-16">
      <h2 id="faq-h" className="mb-6 text-balance text-2xl font-black tracking-tight text-ink sm:text-4xl">{title}</h2>
      <div className="grid gap-3">
        {items.map((f) => (
          <details key={f.q} className="group rounded-[24px_8px_24px_8px] bg-white p-5 ring-1 ring-brand-500/8 open:ring-brand-500/25 sm:p-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-black text-ink [&::-webkit-details-marker]:hidden">
              <h3 className="text-pretty text-base sm:text-lg">{f.q}</h3>
              <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px_3px_10px_3px] bg-sand text-brand-500 transition-transform duration-200 ease-out group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-pretty leading-relaxed text-ink/80">{f.a}</p>
          </details>
        ))}
      </div>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
        }}
      />
    </section>
  );
}

/** Price statistics for geo hubs: rows by property type, values from the catalogue. */
export function PriceStats({ rows, title }: { rows: { label: string; n: number; from: string; avgM2: number | null }[]; title: string }) {
  if (!rows.length) return null;
  return (
    <section aria-labelledby="stats-h" className="mt-12">
      <h2 id="stats-h" className="mb-4 text-balance text-xl font-black tracking-tight text-ink sm:text-2xl">{title}</h2>
      <div className="overflow-x-auto rounded-[24px_8px_24px_8px] bg-white ring-1 ring-brand-500/8">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-sand text-xs uppercase tracking-wider text-brand-700">
            <tr>
              <th scope="col" className="px-5 py-3">Тип</th>
              <th scope="col" className="px-5 py-3">Объектов</th>
              <th scope="col" className="px-5 py-3">Цена от</th>
              <th scope="col" className="px-5 py-3">Средняя цена м²</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {rows.map((r) => (
              <tr key={r.label} className="border-t border-slate-100">
                <th scope="row" className="px-5 py-3 font-black text-ink">{r.label}</th>
                <td className="px-5 py-3">{r.n}</td>
                <td className="px-5 py-3">{r.from}</td>
                <td className="px-5 py-3">{r.avgM2 ? `≈ ${r.avgM2.toLocaleString("ru-RU")} €` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">По данным каталога AZPO на {new Date().toLocaleDateString("ru-RU")}. Цены в долларах пересчитаны в евро по курсу ЕЦБ; средняя цена м² — по готовым объектам с одной ценой.</p>
    </section>
  );
}
