import Image from "next/image";
import type { Metadata } from "next";
import { TEAM } from "@/lib/content";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { JsonLd, SITE_URL } from "@/lib/site";
import { Breadcrumbs } from "@/components/catalog-blocks";

export const metadata: Metadata = {
  title: { absolute: "Команда AZPO Estate: эксперты по недвижимости в Турции" },
  description: "Эксперты по недвижимости, юристы, координаторы и специалисты по сервису AZPO Estate в Алании, Анталии и Стамбуле.",
  alternates: alternates(R.team),
};

const ld = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Команда AZPO Estate",
  itemListElement: TEAM.map((m, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: { "@type": "Person", name: m.name, jobTitle: m.role, image: `${SITE_URL}${m.photo}`, worksFor: { "@id": `${SITE_URL}/#organization` } },
  })),
};

export default function Team() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Команда", href: R.team }]} />
      <JsonLd data={ld} />
      <header className="mb-10 sm:mb-14">
        <p className="eyebrow text-brand-500">Команда AZPO</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-black leading-[1] tracking-[-0.04em] text-ink sm:text-6xl">Люди, которые <span className="slant">ведут</span> вашу сделку</h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-slate-600">Доверие и прозрачность — основа нашего бизнеса. Выбирая Azpo, вы сотрудничаете с командой, которая ставит ваши интересы на первое место.</p>
      </header>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {TEAM.map(({ name, role, photo }, i) => (
          <li key={photo} className="reveal group">
            <div className={`relative aspect-[4/5] overflow-hidden bg-brand-100 outline-1 -outline-offset-1 outline-ink/5 ${i % 2 ? "rounded-[8px_28px_8px_28px]" : "rounded-[28px_8px_28px_8px]"}`}>
              <Image src={photo} alt={name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />
            </div>
            <h2 className="mt-3 flex items-start gap-2 text-base font-black leading-tight text-ink">
              <span aria-hidden className="mt-0.5 h-4 w-1.5 shrink-0 -skew-x-[20deg] bg-sky" />{name}
            </h2>
            <p className="mt-1 pl-3.5 text-sm text-slate-600">{role}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
