"use client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyCard as Card } from "@/lib/api";
import { plural } from "@/lib/format";
import { FILTER_KEYS, SORTS } from "@/lib/listing";
import PropertyCard from "./PropertyCard";

export interface Option { value: string; label: string; href: string }
export interface Nav {
  cities: Option[];
  districts: Option[];
  types: Option[];
  features: Option[];
  current: { city?: string; district?: string; type?: string; feature?: string };
  /** Landing without geo/type/feature, used by "Сбросить". */
  reset: string;
}

const pagePath = (base: string, n: number) => (n > 1 ? `${base}page-${n}/` : base);

/**
 * Listing of a landing page. The first page arrives in the server HTML; whitelisted choices (city,
 * district, type, one feature) navigate to clean landing URLs, everything else (price, rooms, sort,
 * search) becomes GET parameters and is loaded from /api/listing. "Показать ещё" appends the next page
 * and moves the address to /page-N/.
 */
export default function CatalogListing({
  initial, total, page, pages, basePath, nav,
}: { initial: Card[]; total: number; page: number; pages: number; basePath: string; nav: Nav }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [count, setCount] = useState(total);
  const [last, setLast] = useState(page);
  const [lastPage, setLastPage] = useState(pages);
  const [params, setParams] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const firstNew = useRef(0);

  const load = useCallback(async (p: Record<string, string>, pageNo: number, append: boolean) => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ path: basePath, page: String(pageNo), ...p });
      const res = await fetch(`/api/listing/?${qs}`);
      const j = (await res.json()) as { items: Card[]; total: number; pages: number };
      firstNew.current = append ? items.length : 0;
      setItems((cur) => (append ? [...cur, ...j.items] : j.items));
      setCount(j.total);
      setLastPage(j.pages);
      setLast(pageNo);
    } finally {
      setLoading(false);
    }
  }, [basePath, items.length]);

  // A shared link with filters (?price_to=…) loads the filtered list after hydration.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = Object.fromEntries(FILTER_KEYS.filter((k) => sp.get(k)).map((k) => [k, sp.get(k)!]));
    if (Object.keys(p).length) {
      setParams(p);
      load(p, 1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = Object.keys(params).length > 0;
  const setParam = (k: string, v: string) => {
    const next = { ...params, [k]: v };
    if (!v) delete next[k];
    setParams(next);
    const qs = new URLSearchParams(next).toString();
    window.history.replaceState(null, "", `${basePath}${qs ? `?${qs}` : ""}`);
    load(next, 1, false);
  };

  const more = async () => {
    const n = last + 1;
    await load(params, n, true);
    if (!filtered) window.history.pushState(null, "", pagePath(basePath, n));
  };

  const go = (href: string) => router.push(href);
  const ctl = "w-full rounded-full bg-white py-2.5 pl-4 pr-9 text-base outline-none ring-1 ring-slate-200 transition-shadow focus:ring-2 focus:ring-brand-500 sm:text-sm";
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-600";

  const select = (name: string, opts: Option[], value: string | undefined, any: string, disabled = false) => (
    <label className="block min-w-0">
      <span className={label}>{name}</span>
      <select
        className={`${ctl} select-chevron`}
        value={opts.find((o) => o.value === value)?.href ?? ""}
        disabled={disabled}
        onChange={(e) => go(e.target.value || nav.reset)}
      >
        <option value="">{any}</option>
        {opts.map((o) => <option key={o.href} value={o.href}>{o.label}</option>)}
      </select>
    </label>
  );

  const panel = (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {select("Город", nav.cities, nav.current.city, "Вся Турция")}
      {select("Район", nav.districts, nav.current.district, nav.current.city ? "Все районы" : "Сначала город", !nav.current.city)}
      {select("Тип", nav.types, nav.current.type, "Любой тип")}
      {select("Особенность", nav.features, nav.current.feature, nav.current.type ? "Любая" : "Сначала тип", !nav.features.length)}
      <label className="block">
        <span className={label}>Цена от, €</span>
        <input inputMode="numeric" className={`${ctl} !pr-4`} placeholder="0" defaultValue={params.price_from}
          onBlur={(e) => e.target.value !== (params.price_from ?? "") && setParam("price_from", e.target.value.replace(/\D/g, ""))} />
      </label>
      <label className="block">
        <span className={label}>Цена до, €</span>
        <input inputMode="numeric" className={`${ctl} !pr-4`} placeholder="Без ограничений" defaultValue={params.price_to}
          onBlur={(e) => e.target.value !== (params.price_to ?? "") && setParam("price_to", e.target.value.replace(/\D/g, ""))} />
      </label>
      <label className="block">
        <span className={label}>Спальни</span>
        <select className={`${ctl} select-chevron`} value={params.rooms ?? ""} onChange={(e) => setParam("rooms", e.target.value)}>
          <option value="">Любое число</option>
          {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}+1{r === 5 ? " и больше" : ""}</option>)}
        </select>
      </label>
      <label className="block">
        <span className={label}>Поиск</span>
        <input type="search" className={`${ctl} !pr-4`} placeholder="ID или название" defaultValue={params.q}
          onKeyDown={(e) => e.key === "Enter" && setParam("q", (e.target as HTMLInputElement).value)}
          onBlur={(e) => e.target.value !== (params.q ?? "") && setParam("q", e.target.value)} />
      </label>
    </div>
  );

  return (
    <section aria-labelledby="listing-h" className="scroll-mt-28" id="listing">
      <h2 id="listing-h" className="sr-only">Объекты</h2>
      <div className="mb-6 rounded-[28px_8px_28px_8px] bg-white p-4 shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-34px_rgb(22_52_87/0.6)] sm:p-6">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls="filters" className="btn btn-primary !py-2.5 text-sm">
            Фильтры
          </button>
          <SortSelect value={params.sort} onChange={(v) => setParam("sort", v)} />
        </div>
        <div id="filters" className={`${open ? "mt-4 block" : "hidden"} lg:block`}>{panel}</div>
        <div className="mt-4 hidden items-center justify-between gap-4 border-t border-slate-100 pt-4 lg:flex">
          <p className="text-sm font-bold tabular-nums text-slate-600" aria-live="polite">
            {loading ? "Загружаем…" : `${count} ${plural(count, ["объект", "объекта", "объектов"])}`}
          </p>
          <div className="flex items-center gap-3">
            {filtered && <button type="button" className="text-sm font-bold text-brand-500 underline-offset-4 hover:underline" onClick={() => { setParams({}); window.history.replaceState(null, "", basePath); setItems(initial); setCount(total); setLast(page); setLastPage(pages); }}>Сбросить фильтры</button>}
            <SortSelect value={params.sort} onChange={(v) => setParam("sort", v)} />
          </div>
        </div>
      </div>

      {items.length ? (
        <ul className={`grid gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {items.map((p, i) => (
            <li key={p.id} className={i >= firstNew.current && firstNew.current > 0 ? "animate-rise" : ""} style={i >= firstNew.current && firstNew.current > 0 ? { animationDelay: `${Math.min(i - firstNew.current, 8) * 40}ms` } : undefined}>
              <PropertyCard p={p} priority={i < 3 && page === 1 && !filtered} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-[28px_8px_28px_8px] bg-white p-8 text-center text-slate-600">По этим условиям объектов нет. Измените фильтры или оставьте заявку ниже, и мы подберём варианты.</p>
      )}

      {last < lastPage && (
        <div className="mt-8 flex justify-center">
          <button type="button" onClick={more} disabled={loading} className="btn btn-primary min-w-56">
            {loading ? "Загружаем…" : "Показать ещё"}
          </button>
        </div>
      )}

      {!filtered && pages > 1 && (
        <nav aria-label="Страницы каталога" className="mt-8 flex flex-wrap justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
            <a
              key={n}
              href={pagePath(basePath, n)}
              aria-current={n === page ? "page" : undefined}
              className="flex h-10 min-w-10 items-center justify-center rounded-[12px_4px_12px_4px] bg-white px-3 text-sm font-bold tabular-nums text-ink ring-1 ring-slate-200 transition-colors hover:ring-brand-500 aria-[current=page]:bg-brand-500 aria-[current=page]:text-white aria-[current=page]:ring-brand-500"
            >
              {n}
            </a>
          ))}
        </nav>
      )}
    </section>
  );
}

function SortSelect({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="sr-only">Сортировка</span>
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="select-chevron rounded-full bg-sand py-2 pl-4 pr-9 text-sm font-bold text-ink outline-none ring-1 ring-transparent focus:ring-brand-500">
        <option value="">{SORTS.new}</option>
        {Object.entries(SORTS).filter(([k]) => k !== "new").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
    </label>
  );
}
