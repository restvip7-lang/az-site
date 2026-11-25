"use client";
import Link from "next/link";
import { useState } from "react";
import { R } from "@/lib/routes";
import { toggleFav, useFavs } from "@/lib/favs";

export function Heart({ filled = false, size = 18 }: { filled?: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" aria-hidden>
      <path d="M12 20.5s-7.5-4.9-7.5-10.4A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.7c0 5.5-7.5 10.4-7.5 10.4z" />
    </svg>
  );
}

/** ♡ over a card photo, or the "В избранное" pill on an object page. */
export default function FavButton({ id, variant = "card" }: { id: number; variant?: "card" | "page" }) {
  const on = useFavs().includes(id);
  // Pop only after a click, not for hearts that are already on when the page loads.
  const [clicked, setClicked] = useState(false);
  if (variant === "page") {
    return (
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" aria-pressed={on} onClick={() => toggleFav(id)}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold ring-1 transition-[color,background-color,box-shadow,scale] duration-150 ease-out active:scale-[0.97] ${on ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-brand-500 ring-brand-500/25 hover:ring-brand-500/60"}`}>
          <Heart filled={on} />{on ? "В избранном" : "В избранное"}
        </button>
        {on && <Link href={R.favorites} className="text-sm font-bold text-brand-500 underline decoration-sky decoration-2 underline-offset-4">Сравнить с другими</Link>}
      </span>
    );
  }
  return (
    <button type="button" aria-pressed={on} aria-label={on ? `Убрать объект ID ${id} из избранного` : `Добавить объект ID ${id} в избранное`} onClick={() => { setClicked(true); toggleFav(id); }}
      className={`flex h-10 w-10 items-center justify-center rounded-full shadow-[0_4px_14px_-6px_rgb(22_52_87/0.6)] backdrop-blur transition-[color,background-color,scale] duration-150 ease-out active:scale-90 ${on ? "bg-white text-[#e0475b]" : "bg-white/85 text-brand-500 hover:bg-white hover:text-[#e0475b]"}`}>
      <span className={on && clicked ? "flex animate-pop motion-reduce:animate-none" : "flex"}><Heart filled={on} /></span>
    </button>
  );
}

/** Heart with a counter in the header. */
export function FavLink() {
  const n = useFavs().length;
  return (
    <Link href={R.favorites} aria-label={n ? `Избранное: ${n}` : "Избранное"}
      className="relative flex h-12 w-12 items-center justify-center rounded-[16px_6px_16px_6px] text-brand-500 ring-1 ring-brand-500/15 transition-[color,box-shadow] duration-150 hover:text-[#e0475b] hover:ring-brand-500/40">
      <Heart filled={n > 0} size={20} />
      {n > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky px-1 text-[11px] font-black tabular-nums text-ink">{n}</span>}
    </Link>
  );
}
