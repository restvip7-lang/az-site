import Image from "next/image";
import { MarkShapes } from "./ui";

export const DEST_IMG: Record<string, string> = {
  alanya: "/img/dest/alanya.webp",
  antalya: "/img/dest/antalya.webp",
  istanbul: "/img/dest/istanbul.webp",
  fethiye: "/img/dest/fethiye.webp",
  belek: "/img/dest/belek.webp",
  mersin: "/img/dest/mersin.webp",
  bodrum: "/img/dest/bodrum.webp",
};

/** Landing header: H1 and lead on a hatched leaf card, with a geo photo cut as a parallelogram. */
export default function CatalogHeader({ title, sub, img, eyebrow = "Каталог AZPO" }: { title: string; sub?: string; img?: string; eyebrow?: string }) {
  return (
    <header className="hatch relative mb-8 grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white md:grid-cols-[1.4fr_1fr]">
      <div className="relative z-10 p-6 sm:p-10">
        <p className="eyebrow text-brand-500">{eyebrow}</p>
        <h1 className="mt-3 text-balance text-[2rem] font-black leading-[1.04] tracking-[-0.035em] text-ink sm:text-5xl">{title}</h1>
        {sub && <p className="mt-4 max-w-2xl text-pretty text-slate-600 sm:text-lg">{sub}</p>}
      </div>
      <div className="relative hidden md:block">
        <Image src={img || DEST_IMG.alanya} alt="" fill priority sizes="40vw" className="object-cover [clip-path:polygon(22%_0,100%_0,100%_100%,0_100%)]" />
        <MarkShapes className="absolute -bottom-2 left-[2%] w-28 opacity-95" />
      </div>
    </header>
  );
}
