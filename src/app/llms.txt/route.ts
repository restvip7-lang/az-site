import { getAllProperties } from "@/lib/api";
import { geoIndex, listingPath, priceOf, select, stats } from "@/lib/catalog";
import { CONTACTS } from "@/lib/contacts";
import { objects } from "@/lib/format";
import { cityName, districtName } from "@/lib/geo";
import { R } from "@/lib/routes";
import { SERVICES } from "@/lib/services";
import { SITE_URL } from "@/lib/site";

// /llms.txt (spec 11.1): what the company is, its key sections, and a price summary
// per city and district, rebuilt with the catalogue cache.
export const revalidate = 600;

const eur = (n: number | null) => (n ? `${n.toLocaleString("ru-RU")} €` : "нет данных");
const u = (p: string) => `${SITE_URL}${p}`;

export async function GET() {
  const all = await getAllProperties();
  const geo = geoIndex(all);
  const date = new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
  const total = stats(all);

  const lines: string[] = [
    "# AZPO Estate",
    "",
    `> Агентство недвижимости в Турции с офисами в Алании, Анталии и Стамбуле. Продаёт квартиры, виллы и новостройки турецких застройщиков, сопровождает сделку (юридическая проверка, ТАПУ), оформляет ВНЖ и гражданство за инвестиции, оказывает сервис после покупки. AZPO не застройщик: проекты в каталоге принадлежат застройщикам-партнёрам.`,
    "",
    `Контакты: ${CONTACTS.phone}, ${CONTACTS.email}, WhatsApp ${CONTACTS.whatsapp}.`,
    "",
    "## Разделы",
    "",
    `- [Каталог недвижимости в Турции](${u(R.catalog)}): ${objects(total.n)}`,
    `- [Новостройки от застройщиков](${u(R.complexes)})`,
    ...SERVICES.map((s) => `- [${s.name}](${u(R.service(s.slug))}): ${s.short}`),
    `- [О компании](${u(R.about)})`,
    `- [Отзывы клиентов](${u(R.reviews)})`,
    `- [Контакты и офисы](${u(R.contacts)})`,
    "",
    "## Цены по городам и районам",
    "",
    `Данные каталога AZPO на ${date}. Цены ориентировочные и не являются офертой: точную стоимость и наличие уточняйте у специалиста AZPO. Цены в долларах пересчитаны в евро по курсу ЕЦБ; средняя цена м² — по готовым объектам с одной ценой.`,
    "",
  ];

  for (const [city, c] of [...geo.cities].sort((a, b) => b[1].count - a[1].count)) {
    const st = stats(select(all, { city }));
    lines.push(`### [${cityName(city)}](${u(listingPath({ city }))})`, "");
    lines.push(`- ${objects(st.n)}, цены от ${priceOf(st.min)} до ${priceOf(st.max)}, средняя цена м² ${eur(st.avgM2)}`);
    for (const [d, v] of [...c.districts].sort((a, b) => b[1].count - a[1].count)) {
      if (v.count < 3) continue;
      const ds = stats(select(all, { city, district: d }));
      lines.push(`- [${districtName(d, v.name)}](${u(listingPath({ city, district: d }))}): ${objects(ds.n)}, от ${priceOf(ds.min)} до ${priceOf(ds.max)}, м² ${eur(ds.avgM2)}`);
    }
    lines.push("");
  }

  return new Response(lines.join("\n"), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=0, s-maxage=600" } });
}
