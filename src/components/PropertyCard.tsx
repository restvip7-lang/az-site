import Image from "next/image";
import Link from "next/link";
import type { PropertyCard as Card } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { cityName, districtName } from "@/lib/geo";
import { roomsLabel } from "@/lib/paths";
import FavButton from "./FavButton";

/** Coloured chips that always show: citizenship in red, residence permit in orange. */
export const HIGHLIGHT: Record<string, string> = {
  "Под гражданство": "bg-alert text-white",
  "Под ВНЖ": "bg-permit text-white",
};
/** Up to two feature chips per teaser (more only when both highlighted ones apply), most telling first. */
const CHIP_TAGS: [string, string][] = [
  ["Под Гражданство", "Под гражданство"],
  ["Под ВНЖ", "Под ВНЖ"],
  ["Первая линия", "Первая линия"],
  ["Вид на море", "Вид на море"],
  ["Новостройка", "Новостройка"],
  ["От застройщика", "От застройщика"],
  ["Вторичное жилье", "Вторичка"],
];

/** A catalogue teaser: a tile (default) or a wide row with the photo on the left (`list`). */
export default function PropertyCard({ p, priority = false, list = false }: { p: Card; priority?: boolean; list?: boolean }) {
  const badge = p.types[0] ?? (p.isProject ? "Проект" : null);
  const found = CHIP_TAGS.filter(([t]) => p.tags.includes(t)).map(([, l]) => l);
  const chips = found.slice(0, Math.max(2, found.filter((l) => HIGHLIGHT[l]).length));
  const rooms = roomsLabel(p);
  const where = `${cityName(p.city)}${p.districtSlug ? ` · ${districtName(p.districtSlug, p.district)}` : ""}`;
  return (
    <article className="group relative h-full">
      <Link
        href={p.href}
        className={`flex h-full ${list ? "flex-row" : "flex-col"} rounded-[30px_10px_30px_10px] bg-white p-2 shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] transition-[translate,box-shadow] duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_1px_2px_rgb(22_52_87/0.06),0_28px_50px_-28px_rgb(22_52_87/0.55)] active:translate-y-0`}
      >
        <div className={`relative overflow-hidden rounded-[24px_6px_24px_6px] bg-brand-100 outline-1 -outline-offset-1 outline-ink/5 ${list ? "min-h-36 w-[40%] shrink-0 sm:min-h-52 sm:w-72 lg:w-80" : "aspect-[4/3]"}`}>
          {p.images[0] && (
            <Image
              src={p.images[0]}
              alt={`${p.name} — фото 1`}
              fill
              priority={priority}
              sizes={list ? "(max-width: 640px) 40vw, 320px" : "(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            {badge && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-brand-500">{badge}</span>}
            <span className={`rounded-full bg-ink/55 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur ${list ? "hidden sm:inline" : ""}`}>ID {p.id}</span>
          </div>
          {!list && (
            <p className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold text-white">
              <span aria-hidden className="h-3 w-1.5 -skew-x-[20deg] bg-sky" />
              {where}
            </p>
          )}
          <span className="absolute bottom-3 right-3 text-[11px] font-bold tabular-nums text-white/85">{p.photoCount} фото</span>
        </div>
        <div className={`flex min-w-0 flex-1 flex-col ${list ? "py-1.5 pl-3 pr-1 sm:px-5 sm:py-3" : "px-3 pb-3 pt-4"}`}>
          <h3 className={`line-clamp-2 text-pretty font-black leading-snug tracking-[-0.01em] text-ink transition-colors group-hover:text-brand-500 ${list ? "pr-11 text-[0.95rem] sm:pr-14 sm:text-lg" : "text-[1.02rem]"}`}>{p.title}</h3>
          {list && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-brand-500 sm:text-sm">
              <span aria-hidden className="h-3 w-1.5 shrink-0 -skew-x-[20deg] bg-sky" />
              <span className="truncate">{where}</span>
              <span className="hidden font-normal tabular-nums text-slate-500 sm:inline">· ID {p.id}</span>
            </p>
          )}
          <div className={`flex flex-wrap gap-1.5 text-xs font-bold text-brand-700 ${list ? "mt-2 sm:mt-3" : "mt-3"}`}>
            {rooms && <span className="rounded-full bg-sand px-2.5 py-1">{rooms}</span>}
            {p.area ? <span className="rounded-full bg-sand px-2.5 py-1 tabular-nums">{p.area} м²</span> : null}
            {chips.map((c) => <span key={c} className={`rounded-full px-2.5 py-1 ${HIGHLIGHT[c] ?? "bg-sky/15 text-brand-700"}`}>{c}</span>)}
          </div>
          <div className={`mt-auto flex items-end justify-between gap-3 ${list ? "pt-2 sm:pt-4" : "pt-4"}`}>
            <p className={`font-black tabular-nums tracking-tight text-brand-500 ${list ? "text-lg sm:text-2xl" : "text-xl"}`}>
              {p.priceMax ? <span className="mr-1 text-sm font-bold text-slate-500">от</span> : null}
              {formatPrice(p.price, p.currency)}
            </p>
            <span aria-hidden className={`${list ? "hidden sm:flex" : "flex"} h-9 w-9 shrink-0 items-center justify-center rounded-[12px_4px_12px_4px] bg-brand-500 text-white transition-colors group-hover:bg-sky group-hover:text-ink`}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
            </span>
          </div>
        </div>
      </Link>
      {/* Outside the link: a button inside an <a> is not allowed. Sits over the photo's top-right corner and lifts with the card. */}
      <div className="absolute right-4 top-4 transition-[translate] duration-300 ease-out group-hover:-translate-y-1"><FavButton id={p.id} /></div>
    </article>
  );
}
