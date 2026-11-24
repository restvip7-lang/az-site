"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CITIES, type PropertyCard as Card } from "@/lib/api";
import PropertyCard from "./PropertyCard";

const PAGE = 24;
const SORTS = {
  new: "Сначала новые",
  cheap: "Сначала дешёвые",
  expensive: "Сначала дорогие",
  area: "По площади",
} as const;

export default function Catalog({ items, types, initial }: { items: Card[]; types: string[]; initial?: Record<string, string> }) {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const get = (k: string) => sp.get(k) ?? initial?.[k] ?? "";
  const [shown, setShown] = useState(PAGE);

  const city = get("city"), type = get("type"), rooms = get("rooms"), min = get("min"), max = get("max"), cur = get("cur");
  const sort = (get("sort") || "new") as keyof typeof SORTS;
  const q = get("q").toLowerCase();

  const set = (k: string, v: string) => {
    const n = new URLSearchParams(sp.toString());
    for (const [ik, iv] of Object.entries(initial ?? {})) if (!n.has(ik)) n.set(ik, iv);
    if (v) n.set(k, v); else n.delete(k);
    setShown(PAGE);
    router.replace(`${pathname}?${n}`, { scroll: false });
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

  const ctl = "rounded-xl bg-white px-3 py-2.5 text-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500";
  const any = city || type || rooms || min || max || cur || q;

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit space-y-4 rounded-2xl bg-sand p-5 lg:sticky lg:top-24">
        <input aria-label="Поиск" placeholder="Поиск по ID, названию, району" defaultValue={q} onChange={(e) => set("q", e.target.value)} className={`${ctl} w-full`} />
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Город
          <select value={city} onChange={(e) => set("city", e.target.value)} className={`${ctl} mt-1.5 w-full font-normal normal-case tracking-normal text-slate-800`}>
            <option value="">Все города</option>
            {Object.entries(CITIES).map(([k, v]) => <option key={k} value={k}>{v.ru}</option>)}
          </select>
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Тип
          <select value={type} onChange={(e) => set("type", e.target.value)} className={`${ctl} mt-1.5 w-full font-normal normal-case tracking-normal text-slate-800`}>
            <option value="">Все типы</option>
            {types.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Спальни</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {["", "1", "2", "3", "4", "5"].map((r) => (
              <button key={r} onClick={() => set("rooms", r)} className={`rounded-lg px-3 py-1.5 text-sm ring-1 transition ${rooms === r ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-slate-700 ring-slate-200 hover:ring-brand-500"}`}>
                {r === "" ? "Все" : r === "5" ? "5+" : r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Цена</p>
          <div className="mt-1.5 grid grid-cols-2 gap-2">
            <input aria-label="Цена от" inputMode="numeric" placeholder="от" defaultValue={min} onBlur={(e) => set("min", e.target.value.replace(/\D/g, ""))} className={ctl} />
            <input aria-label="Цена до" inputMode="numeric" placeholder="до" defaultValue={max} onBlur={(e) => set("max", e.target.value.replace(/\D/g, ""))} className={ctl} />
          </div>
          <div className="mt-2 flex gap-1.5">
            {[["", "Любая"], ["USD", "$"], ["EUR", "€"]].map(([v, l]) => (
              <button key={v} onClick={() => set("cur", v)} className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${cur === v ? "bg-brand-500 text-white ring-brand-500" : "bg-white ring-slate-200"}`}>{l}</button>
            ))}
          </div>
        </div>
        {any && (
          <button onClick={() => { setShown(PAGE); router.replace(pathname.startsWith("/property-turkey/") ? "/property-turkey" : pathname); }} className="text-sm font-semibold text-brand-500 hover:underline">
            Сбросить фильтры
          </button>
        )}
      </aside>

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">Найдено объектов: <b className="text-slate-900">{filtered.length}</b></p>
          <select aria-label="Сортировка" value={sort} onChange={(e) => set("sort", e.target.value)} className={ctl}>
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
            По этим условиям ничего не нашлось. Попробуйте изменить фильтры или напишите нам, и мы подберём варианты вручную.
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.slice(0, shown).map((p) => <PropertyCard key={p.id} p={p} />)}
            </div>
            {shown < filtered.length && (
              <div className="mt-10 text-center">
                <button onClick={() => setShown((s) => s + PAGE)} className="rounded-full bg-brand-500 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-600">
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
