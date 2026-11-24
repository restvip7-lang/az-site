import { requireStaff } from "@/lib/admin/auth";
import { objectOptions } from "@/lib/admin/options";
import { saveObjectAction } from "../../../actions";
import ObjectForm from "@/components/admin/ObjectForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Новый объект" };

export default async function NewObject() {
  await requireStaff();
  const options = await objectOptions();
  return (
    <>
      <PageHead title="Новая новостройка или объект" back={{ href: "/admin/objects/", label: "Все объекты" }} />
      <ObjectForm
        action={saveObjectAction}
        options={options}
        values={{ published: false, is_project: true, title: "", developer: "", city: "alanya", district: "", type: "Квартиры", bed_min: "", bed_max: "", bathrooms: "", area: "", price: "", price_max: "", currency: "EUR", tags: ["Новостройка", "От застройщика"], description: "", facts: {}, photos: [] }}
      />
    </>
  );
}
