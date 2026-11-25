"use client";
// "Где лучше жить": Alanya districts in one table. Chips narrow the list (several at once),
// a click on a column header sorts it. Everything happens in the browser, the page stays static.
import Link from "next/link";
import { useMemo, useState } from "react";
import { SCORE_LABELS, type ScoreKey } from "@/lib/district-scores";
import ScoreDots from "./ScoreDots";

export interface CompareRow {
  slug: string;
  name: string;
  guide: string | null;
  catalog: string;
  toCenter: number;
  sea: { label: string; m: number };
  note?: string;
  /** Average €/m² of apartments in the AZPO catalogue, null when there are too few. */
  pm: number | null;
  count: number;
  scores: Record<ScoreKey, number>;
}

type FilterKey = "sea" | "quiet" | "life" | "rent" | "center" | "budget";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "sea", label: "У моря" },
  { key: "quiet", label: "Тихие" },
  { key: "life", label: "Для жизни круглый год" },
  { key: "rent", label: "Для сдачи в аренду" },
  { key: "center", label: "До центра не больше 7 км" },
  { key: "budget", label: "Недорогие" },
];

type ColKey = "toCenter" | "sea" | "pm" | "count" | ScoreKey;
type Dir = "asc" | "desc";
const SCORE_KEYS: ScoreKey[] = ["life", "rent", "beach", "quiet"];
// "Better first" is ascending for distances and prices, descending for counts and scores.
const COLS: { key: ColKey; label: string; asc: boolean }[] = [
  { key: "toCenter", label: "До центра", asc: true },
  { key: "sea", label: "До моря", asc: true },
  { key: "pm", label: "Цена за м²", asc: true },
  { key: "count", label: "Объекты AZPO", asc: false },
  ...SCORE_KEYS.map((k) => ({ key: k, label: SCORE_LABELS[k], asc: false })),
];

const value = (r: CompareRow, k: ColKey): number | null =>
  k === "toCenter" ? r.toCenter : k === "sea" ? r.sea.m : k === "pm" ? r.pm : k === "count" ? r.count : r.scores[k];

const km = (n: number) => (n ? `${String(n).replace(".", ",")} км` : "центр");
const eur = (n: number) => `${n.toLocaleString("ru-RU")} €`;

export default function DistrictCompare({ rows }: { rows: CompareRow[] }) {
  const [on, setOn] = useState<FilterKey[]>([]);
  const [sort, setSort] = useState<{ key: ColKey; dir: Dir } | null>(null);

  // "Недорогие": the five lowest prices per m² among districts that have one.
  const budgetMax = useMemo(() => {
    const p = rows.map((r) => r.pm).filter((x): x is number => x != null).sort((a, b) => a - b);
    return p.length ? p[Math.min(4, p.length - 1)] : 0;
  }, [rows]);

  const test: Record<FilterKey, (r: CompareRow) => boolean> = {
    sea: (r) => r.sea.m === 0,
    quiet: (r) => r.scores.quiet >= 4,
    life: (r) => r.scores.life >= 4,
    rent: (r) => r.scores.rent >= 4,
    center: (r) => r.toCenter <= 7,
    budget: (r) => r.pm != null && r.pm <= budgetMax,
  };

  const shown = rows.filter((r) => on.every((f) => test[f](r)));
  const list = sort
    ? [...shown].sort((a, b) => {
        const x = value(a, sort.key), y = value(b, sort.key);
        if (x == null || y == null) return x == null ? (y == null ? 0 : 1) : -1; // no data: always last
        return (sort.dir === "asc" ? x - y : y - x) || rows.indexOf(a) - rows.indexOf(b);
      })
    : shown;

  const toggle = (f: FilterKey) => setOn((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const sortBy = (c: (typeof COLS)[number]) =>
    setSort((cur) => (cur?.key === c.key ? { key: c.key, dir: cur.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: c.asc ? "asc" : "desc" }));
  const sortedCol = COLS.find((c) => c.key === sort?.key);

  return (
    <section id="compare" aria-labelledby="compare-h" className="mb-14 scroll-mt-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div>
          <p className="eyebrow text-brand-500">Сравнение районов</p>
          <h2 id="compare-h" className="mt-2 text-balance text-2xl font-black tracking-tight text-ink sm:text-4xl">Где лучше жить в Алании</h2>
        </div>
        <p className="max-w-md text-pretty text-sm leading-relaxed text-slate-600">Отметьте, что для вас важно, или нажмите на заголовок столбца, чтобы отсортировать районы.</p>
      </div>

      <div role="group" aria-label="Что для вас важно" className="flex flex-wrap gap-2 text-sm font-bold">
        {FILTERS.map((f) => {
          const active = on.includes(f.key);
          return (
            <button key={f.key} type="button" aria-pressed={active} onClick={() => toggle(f.key)}
              className={`rounded-full px-4 py-2.5 ring-1 transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97] ${active ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-ink ring-brand-500/15 hover:text-brand-500 hover:ring-brand-500/40"}`}>
              {active && <span aria-hidden className="mr-1.5">✓</span>}{f.label}
            </button>
          );
        })}
        {(on.length > 0 || sort) && (
          <button type="button" onClick={() => { setOn([]); setSort(null); }} className="rounded-full px-4 py-2.5 text-slate-500 underline-offset-4 transition-colors duration-150 hover:text-brand-500 hover:underline">
            Сбросить
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-sm font-bold text-slate-500">
        {on.length > 0 && `Подходят ${list.length} из ${rows.length}`}
        {on.length > 0 && sortedCol && " · "}
        {sortedCol && `по столбцу «${sortedCol.label}»`}
      </p>

      <div className="mt-3 overflow-x-auto rounded-[24px_8px_24px_8px] bg-white shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)]">
        <table className="w-full min-w-max border-collapse whitespace-nowrap text-left text-[15px]">
          <caption className="sr-only">Сравнение районов Алании: расстояния, цены, число объектов и оценки</caption>
          <thead>
            <tr className="bg-brand-500 text-white">
              <th scope="col" className="sticky left-0 z-10 bg-brand-500 px-4 py-3 font-bold">Район</th>
              {COLS.map((c) => {
                const active = sort?.key === c.key;
                return (
                  <th key={c.key} scope="col" aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} className="px-2 py-1.5 font-bold">
                    <button type="button" onClick={() => sortBy(c)} className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-2 text-left leading-tight transition-colors duration-150 hover:bg-white/10 ${active ? "text-white" : "text-white/85"}`}>
                      {c.label}
                      <span aria-hidden className={active ? "text-sky" : "text-white/40"}>{active ? (sort!.dir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {list.map((r, i) => (
              <tr key={r.slug} className="group border-t border-brand-500/10 first:border-t-0">
                <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-3 text-left font-normal shadow-[1px_0_0_rgb(46_90_144/0.08)] transition-colors duration-150 group-hover:bg-brand-50">
                  <span className="flex items-center gap-2.5">
                    {sort && <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px_3px_8px_3px] text-xs font-black tabular-nums ${i < 3 ? "bg-sky text-white" : "bg-sand text-slate-500"}`}>{i + 1}</span>}
                    <span>
                      <Link href={r.guide ?? r.catalog} className="font-black text-ink hover:text-brand-500">{r.name}</Link>
                      {r.note && <span className="block text-xs text-slate-500">{r.note}</span>}
                    </span>
                  </span>
                </th>
                <td className="px-4 py-3 tabular-nums transition-colors duration-150 group-hover:bg-brand-50">{km(r.toCenter)}</td>
                <td className="px-4 py-3 tabular-nums transition-colors duration-150 group-hover:bg-brand-50">{r.sea.label}</td>
                <td className="px-4 py-3 tabular-nums transition-colors duration-150 group-hover:bg-brand-50">{r.pm ? eur(r.pm) : <span className="text-slate-400">—</span>}</td>
                <td className="px-4 py-3 tabular-nums transition-colors duration-150 group-hover:bg-brand-50">
                  {r.count ? <Link href={r.catalog} className="font-bold text-brand-500 underline decoration-brand-500/30 underline-offset-4 hover:decoration-brand-500">{r.count}</Link> : <span className="text-slate-400">0</span>}
                </td>
                {SCORE_KEYS.map((k) => (
                  <td key={k} className="px-4 py-3 transition-colors duration-150 group-hover:bg-brand-50"><ScoreDots n={r.scores[k]} label={SCORE_LABELS[k]} /></td>
                ))}
              </tr>
            ))}
            {!list.length && (
              <tr><td colSpan={COLS.length + 1} className="px-4 py-8 text-center text-slate-600">Таких районов нет. Снимите один из фильтров.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-pretty text-xs leading-relaxed text-slate-500">
        Цена за м² — средняя по квартирам в каталоге AZPO, обновляется вместе с каталогом. Оценки от 1 до 5 — редакционные, это не официальный рейтинг. На телефоне таблицу можно листать вбок.
      </p>
    </section>
  );
}
