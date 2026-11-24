import type { Metadata } from "next";
import { getAllProperties, objects, toCard } from "@/lib/api";
import Catalog from "@/components/Catalog";
import CatalogHeader from "@/components/CatalogHeader";

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
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <CatalogHeader title={<>Недвижимость в <span className="slant">Турции</span></>} sub={`${objects(all.length)}: квартиры, виллы и новостройки от застройщиков и собственников с полным сопровождением сделки.`} />
      <Catalog items={all.map((p) => toCard(p, 1))} types={types} />
    </div>
  );
}
