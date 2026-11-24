"use client";
import Link from "next/link";
import { useState } from "react";
import { cityName, formatPrice, roomsLabel, type PropertyCard as Card } from "@/lib/api";

export default function PropertyCard({ p }: { p: Card }) {
  const [idx, setIdx] = useState(0);
  const imgs = p.images.length ? p.images : [];
  const step = (d: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setIdx((i) => (i + d + imgs.length) % imgs.length);
  };
  const badge = p.types[0] ?? (p.isProject ? "Проект" : null);
  return (
    <Link href={`/property-turkey/${p.id}`} className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-900/10">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {imgs[idx] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imgs[idx]} alt={p.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {badge && <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand-700">{badge}</span>}
          <span className="rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white">ID {p.id}</span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-xs text-white">{p.photoCount} фото</span>
        {imgs.length > 1 && (
          <>
            <button onClick={step(-1)} aria-label="Предыдущее фото" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 opacity-0 transition group-hover:opacity-100">‹</button>
            <button onClick={step(1)} aria-label="Следующее фото" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1.5 opacity-0 transition group-hover:opacity-100">›</button>
          </>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          {cityName(p.city)}{p.district ? ` · ${p.district}` : ""}
        </p>
        <h3 className="line-clamp-2 font-semibold leading-snug text-slate-900 group-hover:text-brand-500">{p.title}</h3>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-slate-600">
          <span>{roomsLabel(p)}</span>
          {p.area ? <span>{p.area} м²</span> : null}
          {p.bathrooms ? <span>{p.bathrooms} с/у</span> : null}
        </div>
        <p className="text-lg font-bold text-brand-700">
          {p.priceMax ? "от " : ""}{formatPrice(p.price, p.currency)}
        </p>
      </div>
    </Link>
  );
}
