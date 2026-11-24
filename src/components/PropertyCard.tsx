import Image from "next/image";
import Link from "next/link";
import { cityName, formatPrice, roomsLabel, type PropertyCard as Card } from "@/lib/api";

export default function PropertyCard({ p, priority = false }: { p: Card; priority?: boolean }) {
  const badge = p.types[0] ?? (p.isProject ? "Проект" : null);
  return (
    <Link href={`/property-turkey/${p.id}`} className="group flex flex-col rounded-[30px_10px_30px_10px] bg-white p-2 shadow-[0_18px_40px_-30px_rgb(22_52_87/0.6)] ring-1 ring-brand-500/8 transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgb(22_52_87/0.55)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[24px_6px_24px_6px] bg-brand-100">
        {p.images[0] && (
          <Image
            src={p.images[0]}
            alt={p.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
            className="object-cover transition duration-700 group-hover:scale-[1.06]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {badge && <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-brand-500">{badge}</span>}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-ink/55 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur">ID {p.id}</span>
        <p className="absolute bottom-3 left-3 flex items-center gap-1.5 text-xs font-bold text-white">
          <span aria-hidden className="h-3 w-1.5 -skew-x-[20deg] bg-sky" />
          {cityName(p.city)}{p.district ? ` · ${p.district}` : ""}
        </p>
        <span className="absolute bottom-3 right-3 text-[11px] font-bold text-white/85">{p.photoCount} фото</span>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-3 pt-4">
        <h3 className="line-clamp-2 text-[1.02rem] font-black leading-snug tracking-[-0.01em] text-ink transition group-hover:text-brand-500">{p.title}</h3>
        <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-bold text-brand-700">
          <span className="rounded-full bg-sand px-2.5 py-1">{roomsLabel(p)}</span>
          {p.area ? <span className="rounded-full bg-sand px-2.5 py-1">{p.area} м²</span> : null}
          {p.bathrooms ? <span className="rounded-full bg-sand px-2.5 py-1">{p.bathrooms} с/у</span> : null}
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <p className="text-xl font-black tabular-nums tracking-tight text-brand-500">
            {p.priceMax ? <span className="mr-1 text-sm font-bold text-slate-500">от</span> : null}
            {formatPrice(p.price, p.currency)}
          </p>
          <span aria-hidden className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px_4px_12px_4px] bg-brand-500 text-white transition group-hover:bg-sky group-hover:text-ink">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M9 7h8v8" /></svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
