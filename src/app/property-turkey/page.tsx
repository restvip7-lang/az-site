import type { Metadata } from "next";
import { getAllProperties, toCard } from "@/lib/api";
import Catalog from "@/components/Catalog";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Купить недвижимость в Турции — каталог квартир и вилл",
  description: "Каталог квартир, вилл и новостроек в Турции с ценами и фото. Алания, Анталия, Стамбул, Фетхие, Мерсин, Бодрум.",
  alternates: { canonical: "/property-turkey" },
};

export default async function CatalogPage() {
  const all = await getAllProperties();
  const types = [...new Set(all.flatMap((p) => p.types))].sort();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-black text-brand-900 sm:text-4xl">Недвижимость в Турции</h1>
      <p className="mb-8 mt-2 text-slate-600">Квартиры, виллы и новостройки от застройщиков и собственников</p>
      <Catalog items={all.map((p) => toCard(p, 1))} types={types} />
    </div>
  );
}
