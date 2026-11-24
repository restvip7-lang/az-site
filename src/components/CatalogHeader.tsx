import Image from "next/image";
import type { ReactNode } from "react";
import { MarkShapes } from "./ui";

const DEST_IMG: Record<string, string> = {
  alanya: "/img/dest/alanya.webp",
  antalya: "/img/dest/antalya.webp",
  istanbul: "/img/dest/istanbul.webp",
  fethiye: "/img/dest/fethiye.webp",
  belek: "/img/dest/belek.webp",
  mersin: "/img/dest/mersin.webp",
  bodrum: "/img/dest/bodrum.webp",
  kas: "/img/dest/kas.webp",
};

/** Catalog page header: title on a hatched leaf card, with the city photo cut as a parallelogram. */
export default function CatalogHeader({ title, sub, city }: { title: ReactNode; sub?: string; city?: string }) {
  const img = (city && DEST_IMG[city]) || "/img/dest/alanya.webp";
  return (
    <header className="hatch relative mb-8 grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white md:grid-cols-[1.4fr_1fr]">
      <div className="relative z-10 p-6 sm:p-10">
        <p className="eyebrow text-brand-500">Каталог AZPO</p>
        <h1 className="mt-3 text-[2.1rem] font-black leading-[1.02] tracking-[-0.035em] text-ink sm:text-6xl">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-slate-600 sm:text-lg">{sub}</p>}
      </div>
      <div className="relative hidden md:block">
        <Image src={img} alt="" fill priority sizes="40vw" className="object-cover [clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)]" />
        <MarkShapes className="absolute -bottom-2 left-[2%] w-28 opacity-95" />
      </div>
    </header>
  );
}
