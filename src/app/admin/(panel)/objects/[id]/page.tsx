import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getObject } from "@/lib/admin/objects";
import { objectOptions } from "@/lib/admin/options";
import { districtSlug } from "@/lib/geo";
import { cardPath } from "@/lib/paths";
import { deleteObjectAction, saveObjectAction } from "../../../actions";
import { ConfirmButton } from "@/components/admin/AdminUI";
import ObjectForm from "@/components/admin/ObjectForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Объект" };

const s = (v: number | string | null) => (v === null ? "" : String(Number(v)));

export default async function EditObject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const id = Number((await params).id);
  const o = Number.isInteger(id) ? await getObject(id) : null;
  if (!o) notFound();
  const saved = (await searchParams).saved;
  const url = cardPath({ id: o.id, city: o.city, districtSlug: districtSlug(o.district) });
  return (
    <>
      <PageHead title={o.title} sub={`ID ${o.id}${o.published ? ` · на сайте: ${url}` : " · черновик"}`} back={{ href: "/admin/objects/", label: "Все объекты" }} />
      {saved && (
        <p className="mb-6 rounded-[18px_6px_18px_6px] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
          Сохранено.{o.published && <> <a href={url} target="_blank" rel="noopener" className="underline">Открыть на сайте ↗</a></>}
        </p>
      )}
      <ObjectForm
        key={o.updated_at.toISOString()}
        action={saveObjectAction}
        options={await objectOptions()}
        values={{
          id: o.id, published: o.published, is_project: o.is_project, title: o.title, developer: o.developer ?? "", city: o.city, district: o.district ?? "", type: o.type,
          bed_min: s(o.bed_min), bed_max: s(o.bed_max), bathrooms: s(o.bathrooms), area: s(o.area), price: s(o.price), price_max: s(o.price_max),
          currency: o.currency, tags: o.tags, description: o.description ?? "", facts: o.facts ?? {}, photos: o.photos,
        }}
      />
      <form action={deleteObjectAction} className="mt-10 border-t border-brand-500/10 pt-6">
        <input type="hidden" name="id" value={o.id} />
        <ConfirmButton message={`Удалить «${o.title}» вместе с фотографиями? Это нельзя отменить.`}>Удалить объект</ConfirmButton>
      </form>
    </>
  );
}
