import Link from "next/link";
import { listingPath } from "@/lib/catalog";
import { R } from "@/lib/routes";
import { MarkShapes } from "@/components/ui";

/** Popular categories for a lost visitor (spec: 404 with search and links, HTTP status 404). */
const POPULAR: [string, string][] = [
  ["Квартиры в Алании", listingPath({ city: "alanya", deal: "sale", type: "apartments" })],
  ["Виллы в Алании", listingPath({ city: "alanya", deal: "sale", type: "villas" })],
  ["Квартиры в Анталии", listingPath({ city: "antalya", deal: "sale", type: "apartments" })],
  ["Недвижимость в Стамбуле", listingPath({ city: "istanbul" })],
  ["Новостройки от застройщиков", R.complexes],
  ["Под гражданство", listingPath({ deal: "sale", type: "apartments", feature: "citizenship" })],
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-24">
      <MarkShapes className="mx-auto w-36 animate-fade" />
      <p className="eyebrow mt-8 text-brand-500">Ошибка 404</p>
      <h1 className="mt-3 text-balance text-4xl font-black tracking-tight text-ink sm:text-5xl">Страница <span className="slant">не найдена</span></h1>
      <p className="mt-4 text-pretty text-slate-600">Возможно, объект уже продан или ссылка устарела. Найдите похожее в каталоге или по номеру объекта.</p>

      <form action={R.sale} method="get" role="search" className="mx-auto mt-8 flex max-w-md gap-2 rounded-full bg-white p-1.5 shadow-[0_10px_30px_-18px_rgb(22_52_87/0.5)] ring-1 ring-brand-500/10">
        <label htmlFor="nf-q" className="sr-only">Поиск по каталогу</label>
        <input id="nf-q" name="q" type="search" placeholder="Район, комплекс или ID объекта" className="min-w-0 flex-1 rounded-full bg-transparent px-4 text-ink outline-none placeholder:text-slate-400" />
        <button type="submit" className="btn btn-primary !px-5 !py-2.5">Найти</button>
      </form>

      <ul className="mt-8 flex flex-wrap justify-center gap-2 text-sm font-bold">
        {POPULAR.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="inline-block rounded-full bg-white px-4 py-2.5 text-ink ring-1 ring-brand-500/10 transition-[color,box-shadow] duration-200 ease-out hover:text-brand-500 hover:ring-brand-500/40">{label}</Link>
          </li>
        ))}
      </ul>
      <Link href={R.home} className="btn btn-ghost mt-8">На главную</Link>
    </div>
  );
}
