import { notFound } from "next/navigation";
import { canEdit, requireStaff } from "@/lib/admin/auth";
import ReadOnly from "@/components/admin/ReadOnly";
import { getObject } from "@/lib/admin/objects";
import { objectOptions } from "@/lib/admin/options";
import { districtSlug } from "@/lib/geo";
import { cardPath } from "@/lib/paths";
import { deleteObjectAction, saveObjectAction } from "../../../actions";
import { ConfirmButton } from "@/components/admin/AdminUI";
import ObjectForm, { type ObjectValues } from "@/components/admin/ObjectForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Объект" };

const s = (v: number | string | null) => (v === null ? "" : String(Number(v)));

export default async function EditObject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const me = await requireStaff();
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await getObject(id) : null;
  if (!o) notFound();
  const saved = (await searchParams).saved;
  const url = cardPath({ id: o.id, city: o.city, districtSlug: districtSlug(o.district) });
  const values: ObjectValues = {
    id: o.id, source: o.source, published: o.published, is_project: o.is_project, title: o.title, developer: o.developer ?? "",
    city: o.city, district: o.district ?? "", types: o.types, layouts: o.layouts,
    bed_min: s(o.bed_min), bed_max: o.bed_max > (o.bed_min ?? 0) ? s(o.bed_max) : "", bathrooms: s(o.bathrooms), bathrooms_max: s(o.bathrooms_max),
    area: s(o.area), area_max: s(o.area_max), floor: s(o.floor), floors: s(o.floors), year: s(o.year),
    furnished: o.furnished, installments: o.installments ?? "", price: s(o.price), price_max: s(o.price_max), currency: o.currency,
    tags: o.tags, features: o.features, views: o.views, heating: o.heating,
    dist: {
      sea: { v: s(o.dist_sea), u: o.dist_sea_unit },
      airport: { v: s(o.dist_airport), u: o.dist_airport_unit },
      hospital: { v: s(o.dist_hospital), u: o.dist_hospital_unit },
      shopping: { v: s(o.dist_shopping), u: o.dist_shopping_unit },
    },
    map_url: o.map_url ?? "", description: o.description ?? "", photos: o.photos,
  };
  return (
    <>
      <PageHead title={o.title} sub={`ID ${o.id}${o.published ? ` · на сайте: ${url}` : " · черновик"}${o.source ? ` · перенесён с ${o.source}` : ""}`} back={{ href: "/admin/objects/", label: "Все объекты" }} />
      {saved && (
        <p className="mb-6 rounded-[18px_6px_18px_6px] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          Сохранено.{o.published && <> <a href={url} target="_blank" rel="noopener" className="underline">Открыть на сайте ↗</a></>}
        </p>
      )}
      <ReadOnly when={!canEdit(me)}>
      <ObjectForm key={o.updated_at.toISOString()} action={saveObjectAction} options={await objectOptions()} values={values} />
      <form action={deleteObjectAction} className="mt-10 border-t border-brand-500/10 pt-6">
        <input type="hidden" name="id" value={o.id} />
        <ConfirmButton message={`Удалить «${o.title}»${o.source ? "" : " вместе с фотографиями"}? Это нельзя отменить.${o.source ? " Объект пропадёт с сайта и не вернётся при следующем переносе с azpo.ru. Чтобы только скрыть его, снимите галочку «Опубликован»." : ""}`}>Удалить объект</ConfirmButton>
      </form>
      </ReadOnly>
    </>
  );
}
