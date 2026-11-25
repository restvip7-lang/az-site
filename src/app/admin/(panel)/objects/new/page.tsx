import { requireStaff } from "@/lib/admin/auth";
import { objectOptions } from "@/lib/admin/options";
import { saveObjectAction } from "../../../actions";
import ObjectForm from "@/components/admin/ObjectForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Новый объект" };

const none = { v: "", u: "m" as const };

export default async function NewObject() {
  await requireStaff("editor");
  const options = await objectOptions();
  return (
    <>
      <PageHead title="Новая новостройка или объект" back={{ href: "/admin/objects/", label: "Все объекты" }} />
      <ObjectForm
        action={saveObjectAction}
        options={options}
        values={{
          published: false, is_project: true, title: "", developer: "", city: "alanya", district: "", types: ["Квартиры"], layouts: [],
          bed_min: "", bed_max: "", bathrooms: "", bathrooms_max: "", area: "", area_max: "", floor: "", floors: "", year: "",
          furnished: false, installments: "", price: "", price_max: "", currency: "EUR",
          tags: ["Новостройка", "От застройщика"], features: [], views: [], heating: [],
          dist: { sea: none, airport: { v: "", u: "km" }, hospital: { v: "", u: "km" }, shopping: none },
          map_url: "", description: "", photos: [],
        }}
      />
    </>
  );
}
