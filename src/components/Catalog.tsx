"use client";
import { useEffect, useMemo, useState } from "react";
import { CITIES, objects, type PropertyCard as Card } from "@/lib/api";
import PropertyCard from "./PropertyCard";

const PAGE = 24;
const SORTS = {
  new: "Сначала новые",
  cheap: "Сначала дешёвые",
  expensive: "Сначала дорогие",
  area: "По площади",
} as const;

export default function Catalog({ items, types, initial }: { items: Card[]; types: string[]; initial?: Record<string, string> }) {
  // Filters live in component state (so the first 24 objects are rendered on the server for SEO)
  // and are mirrored to the URL so a filtered list can be shared.
  const [f, setF] = useState<Record<string, string>>(initial ?? {});
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    const fromUrl = Object.fromEntries(new URLSearchParams(window.location.search));
    if (Object.keys(fromUrl).length) setF((cur) => ({ ...cur, ...fromUrl }));
  }, []);
  const get = (k: string) => f[k] ?? "";

  const city = get("city"), type = get("type"), rooms = get("rooms"), min = get("min"), max = get("max"), cur = get("cur");
  const sort = (get("sort") || "new") as keyof typeof SORTS;
  const q = get("q").toLowerCase();

  const set = (k: string, v: string) => {
    const next = { ...f, [k]: v };
    if (!v) delete next[k];
    setF(next);
    setShown(PAGE);
    const qs = new URLSearchParams(Object.entries(next).filter(([key, val]) => val && initial?.[key] !== val)).toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };
  const reset = () => {
    setF({});
    setShown(PAGE);
    window.history.replaceState(null, "", "/property-turkey");
  };

  const filtered = useMemo(() => {
    const r = items.filter((p) => {
      if (city && p.city !== city) return false;
      if (type && !p.types.includes(type)) return false;
      if (cur && p.currency !== cur) return false;
      if (rooms) {
        const n = Number(rooms);
        if (n >= 5 ? p.bedMax < 5 : !(p.bedMin <= n && p.bedMax >= n)) return false;
      }
      if (min && (p.priceMax ?? p.price ?? 0) < Number(min)) return false;
      if (max && (!p.price || p.price > Number(max))) return false;
      if (q && !(`${p.id} ${p.title} ${p.district ?? ""}`.toLowerCase().includes(q))) return false;
      return true;
    });
    const by: Record<string, (a: Card, b: Card) => number> = {
      new: (a, b) => b.id - a.id,
      cheap: (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity),
      expensive: (a, b) => (b.price ?? 0) - (a.price ?? 0),
      area: (a, b) => (b.area ?? 0) - (a.area ?? 0),
    };
    return r.sort(by[sort] ?? by.new);
  }, [items, city, type, rooms, min, max, cur, q, sort]);

  const ctl = "w-full rounded-full bg-white px-4 py-2.5 text-base sm:text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500";
  const label = "block text-xs font-bold uppercase tracking-wider text-slate-600";
  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-sm ring-1 transition ${active ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-slate-700 ring-slate-200 hover:ring-brand-500"}`;
  const activeCount = [city, type, rooms, min, max, cur, q].filter(Boolean).length;

  const filters = (
    <div className="space-y-5">
      <input aria-label="Поиск" type="search" placeholder="Поиск по ID, названию, району" value={get("q")} onChange={(e) => set("q", e.target.value)} className={ctl} />
      <label className={label}>Город
        <select value={city} onChange={(e) => set("city", e.target.value)} className={`${ctl} mt-1.5 font-normal normal-case tracking-normal text-slate-800`}>
          <option value="">Все города</option>
          {Object.entries(CITIES).map(([k, v]) => <option key={k} value={k}>{v.ru}</option>)}
        </select>
      </label>
      <label className={label}>Тип
        <select value={type} onChange={(e) => set("type", e.target.value)} className={`${ctl} mt-1.5 font-normal normal-case tracking-normal text-slate-800`}>
          <option value="">Все типы</option>
          {types.map((t) => <option key={t}>{t}</option>)}
        </select>
      </label>
      <fieldset>
        <legend className={label}>Спальни</legend>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {["", "1", "2", "3", "4", "5"].map((r) => (
            <button type="button" key={r} aria-pressed={rooms === r} onClick={() => set("rooms", r)} className={chip(rooms === r)}>
              {r === "" ? "Все" : r === "5" ? "5+" : r}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={label}>Цена</legend>
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          <input aria-label="Цена от" inputMode="numeric" placeholder="от" value={min} onChange={(e) => set("min", e.target.value.replace(/\D/g, ""))} className={ctl} />
          <input aria-label="Цена до" inputMode="numeric" placeholder="до" value={max} onChange={(e) => set("max", e.target.value.replace(/\D/g, ""))} className={ctl} />
        </div>
        <div className="mt-2 flex gap-1.5">
          {[["", "Любая валюта"], ["USD", "$"], ["EUR", "€"]].map(([v, l]) => (
            <button type="button" key={v} aria-pressed={cur === v} onClick={() => set("cur", v)} className={chip(cur === v)}>{l}</button>
          ))}
        </div>
      </fieldset>
      {activeCount > 0 && (
        <button type="button" onClick={reset} className="text-sm font-bold text-brand-500 hover:underline">Сбросить фильтры</button>
      )}
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden h-fit rounded-2xl bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:block" aria-label="Фильтры">{filters}</aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Фильтры">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-black text-brand-900">Фильтры</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть" className="-mr-2 p-2 text-2xl leading-none text-slate-500">×</button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{filters}</div>
            <div className="border-t border-slate-100 p-4">
              <button type="button" onClick={() => setOpen(false)} className="w-full rounded-full bg-brand-500 py-3.5 font-bold text-white">
                Показать: {objects(filtered.length)}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-w-0">
        <div className="sticky top-16 z-30 -mx-4 mb-5 flex items-center gap-2 bg-sand/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0 lg:static lg:bg-transparent lg:py-0">
          <button type="button" onClick={() => setOpen(true)} className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-brand-700 ring-1 ring-slate-200 lg:hidden">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden><path d="M3 6h18M7 12h10M10 18h4" /></svg>
            Фильтры{activeCount ? ` · ${activeCount}` : ""}
          </button>
          <p className="hidden text-sm text-slate-600 sm:block">Найдено: <b className="text-slate-900">{filtered.length}</b></p>
          <select aria-label="Сортировка" value={sort} onChange={(e) => set("sort", e.target.value)} className="ml-auto rounded-full bg-white px-4 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <p className="mb-4 text-sm text-slate-600 sm:hidden">Найдено объектов: <b className="text-slate-900">{filtered.length}</b></p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-600">
            По этим условиям ничего не нашлось. Попробуйте изменить фильтры или напишите нам, и мы подберём варианты вручную.
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.slice(0, shown).map((p, i) => <PropertyCard key={p.id} p={p} priority={i < 2} />)}
            </div>
            {shown < filtered.length && (
              <div className="mt-10 text-center">
                <button type="button" onClick={() => setShown((s) => s + PAGE)} className="rounded-full bg-brand-500 px-8 py-3 text-sm font-bold text-white transition hover:bg-brand-600">
                  Показать ещё ({filtered.length - shown})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
