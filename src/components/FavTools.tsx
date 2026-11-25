"use client";
// Client parts of the favourites page: syncing the browser's list into the URL (so the server can render
// the cards), the action bar, and the side-by-side comparison of 2–4 objects.
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { CONTACTS } from "@/lib/contacts";
import { getFavs, setFavs, toggleFav, useFavs } from "@/lib/favs";
import { R } from "@/lib/routes";

const useHydrated = () => useSyncExternalStore(() => () => {}, () => true, () => false);

/** Own favourites: keeps ?my=1&ids=… in step with the list in the browser. */
export function FavSync({ current }: { current: string }) {
  const router = useRouter();
  const favs = useFavs();
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    const ids = getFavs().join(",");
    if (ids === current) return;
    router.replace(ids ? `${R.favorites}?my=1&ids=${ids}` : R.favorites, { scroll: false });
  }, [favs, current, hydrated, router]);
  return null;
}

/** Own favourites: the empty state is shown only once we know the browser has none either. */
export function FavEmptyGate({ wait, children }: { wait: boolean; children: ReactNode }) {
  const favs = useFavs();
  const hydrated = useHydrated();
  if (wait && (!hydrated || favs.length)) {
    return <p className="rounded-[28px_8px_28px_8px] bg-white p-8 text-slate-500" role="status">Загружаем избранное…</p>;
  }
  return <>{children}</>;
}

export function FavActions({ items, shared }: { items: { id: number; name: string; href: string }[]; shared: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 2200);
  };
  const ids = items.map((i) => i.id).join(",");
  const send = () => {
    const lines = items.map((i) => `• ID ${i.id} — ${i.name} — ${location.origin}${i.href}`).join("\n");
    const text = `Здравствуйте! Хочу обсудить подборку объектов:\n${lines}`;
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${R.favorites}?ids=${ids}`);
      flash("Ссылка скопирована");
    } catch {
      flash("Не получилось скопировать");
    }
  };
  const ghost = "btn btn-ghost !px-4 !py-2.5 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={send} className="btn !px-4 !py-2.5 text-sm bg-[#1f9e52] text-white hover:brightness-110">Отправить подборку в WhatsApp</button>
      <button type="button" onClick={copy} className={ghost}>Ссылка на подборку</button>
      {shared ? (
        <button type="button" className="btn btn-primary !px-4 !py-2.5 text-sm" onClick={() => { setFavs([...getFavs(), ...items.map((i) => i.id)]); router.push(R.favorites); }}>
          Сохранить в моё избранное
        </button>
      ) : (
        <button type="button" className={ghost} onClick={() => { if (confirm("Убрать все объекты из избранного?")) setFavs([]); }}>Очистить</button>
      )}
      <span role="status" className="text-sm font-bold text-brand-500">{msg}</span>
    </div>
  );
}

export interface CmpItem {
  id: number;
  chip: string;
  head: ReactNode;
  cells: ReactNode[];
  /** Numbers for "best in row" (null where the row has no number or the object has no value). */
  vals: (number | null)[];
}

/** Up to four objects side by side; the best value of a row is highlighted. */
export function FavCompare({ items, rows, shared }: { items: CmpItem[]; rows: { label: string; best?: "min" | "max" }[]; shared: boolean }) {
  const [sel, setSel] = useState<number[]>(() => items.slice(0, 4).map((i) => i.id));
  const [note, setNote] = useState("");
  const picked = sel.map((id) => items.find((i) => i.id === id)).filter((i): i is CmpItem => Boolean(i));
  const cols = picked.length >= 2 ? picked : items.slice(0, 4);
  const pick = (id: number) => {
    const ids = cols.map((c) => c.id);
    if (ids.includes(id)) {
      if (ids.length <= 2) return setNote("Для сравнения нужно хотя бы 2 объекта.");
      setSel(ids.filter((x) => x !== id));
    } else {
      if (ids.length >= 4) return setNote("Сравнить можно до 4 объектов: снимите отметку с одного.");
      setSel([...ids, id]);
    }
    setNote("");
  };
  const bestOf = (r: number) => {
    const kind = rows[r].best;
    if (!kind) return null;
    const v = cols.map((c) => c.vals[r]).filter((x): x is number => x != null);
    if (v.length < 2 || new Set(v).size < 2) return null;
    return kind === "min" ? Math.min(...v) : Math.max(...v);
  };

  return (
    <>
      {items.length > 2 && (
        <div role="group" aria-label="Какие объекты сравнивать" className="flex flex-wrap gap-2 text-sm font-bold">
          {items.map((i) => {
            const on = cols.some((c) => c.id === i.id);
            return (
              <button key={i.id} type="button" aria-pressed={on} onClick={() => pick(i.id)}
                className={`rounded-full px-4 py-2.5 ring-1 transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97] ${on ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-ink ring-brand-500/15 hover:text-brand-500 hover:ring-brand-500/40"}`}>
                {on && <span aria-hidden className="mr-1.5">✓</span>}{i.chip}
              </button>
            );
          })}
        </div>
      )}
      <p role="status" className="mt-2 min-h-5 text-sm font-bold text-brand-500">{note}</p>
      <div className="mt-2 overflow-x-auto rounded-[24px_8px_24px_8px] bg-white shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)]">
        <table className="w-full min-w-max border-collapse text-left text-[15px]">
          <caption className="sr-only">Сравнение объектов из избранного</caption>
          <colgroup><col className="w-28 sm:w-40" />{cols.map((c) => <col key={c.id} className="w-44 sm:w-60" />)}</colgroup>
          <thead>
            <tr>
              <td className="sticky left-0 z-10 bg-white" />
              {cols.map((c) => (
                <th key={c.id} scope="col" className="min-w-44 max-w-64 px-3 pb-4 pt-4 align-top font-normal sm:min-w-52 sm:px-4">
                  {c.head}
                  {!shared && (
                    <button type="button" onClick={() => toggleFav(c.id)} className="mt-2 text-xs font-bold text-slate-500 underline-offset-4 transition-colors duration-150 hover:text-[#e0475b] hover:underline">
                      Убрать из избранного
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => {
              const b = bestOf(ri);
              return (
                <tr key={r.label} className="border-t border-brand-500/10">
                  <th scope="row" className="sticky left-0 z-10 bg-white px-3 py-3 text-sm font-bold text-ink/70 sm:px-4 shadow-[1px_0_0_rgb(46_90_144/0.08)]">{r.label}</th>
                  {cols.map((c) => {
                    const best = b != null && c.vals[ri] === b;
                    return (
                      <td key={c.id} className={`px-3 py-3 align-top tabular-nums sm:px-4 ${best ? "bg-sky/15 font-black text-brand-700" : "text-ink"}`}>
                        {c.cells[ri]}
                        {best && <span className="sr-only"> (лучшее значение)</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {cols.length > 1 && <p className="mt-3 text-xs text-slate-500 sm:hidden">Таблицу можно листать вбок.</p>}
    </>
  );
}
