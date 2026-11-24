import Image from "next/image";
import Link from "next/link";
import { cityName, formatPrice, roomsLabel, type PropertyCard as Card } from "@/lib/api";

export default function PropertyCard({ p, priority = false }: { p: Card; priority?: boolean }) {
  const badge = p.types[0] ?? (p.isProject ? "Проект" : null);
  return (
    <Link
      href={`/property-turkey/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-900/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {p.images[0] && (
          <Image
            src={p.images[0]}
            alt={p.title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 400px"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {badge && <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-700">{badge}</span>}
          <span className="rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">ID {p.id}</span>
        </div>
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">{p.photoCount} фото</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {cityName(p.city)}{p.district ? ` · ${p.district}` : ""}
        </p>
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900 group-hover:text-brand-500">{p.title}</h3>
        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm text-slate-600">
          <span>{roomsLabel(p)}</span>
          {p.area ? <span>{p.area} м²</span> : null}
          {p.bathrooms ? <span>{p.bathrooms} с/у</span> : null}
        </div>
        <p className="text-lg font-black text-brand-700">
          {p.priceMax ? "от " : ""}{formatPrice(p.price, p.currency)}
        </p>
      </div>
    </Link>
  );
}
