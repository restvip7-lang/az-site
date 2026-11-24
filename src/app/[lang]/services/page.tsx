import Link from "next/link";
import type { Metadata } from "next";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { SERVICES } from "@/lib/services";
import { seoFor, withSeo } from "@/lib/admin/seo";
import { Breadcrumbs } from "@/components/catalog-blocks";
import { Arrow } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return withSeo({
    title: { absolute: "Услуги AZPO: покупка недвижимости в Турции под ключ | AZPO Estate" },
    description: "Гражданство и ВНЖ при покупке недвижимости в Турции, юридическая проверка объекта, сервис после покупки: аренда, управление, ремонт и мебель.",
    alternates: alternates(R.services),
  }, await seoFor(R.services));
}

export default function Services() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Услуги", href: R.services }]} />
      <header className="mb-10 sm:mb-14">
        <p className="eyebrow text-brand-500">Услуги AZPO</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-black leading-[1] tracking-[-0.04em] text-ink sm:text-6xl">Сопровождаем сделку <span className="slant">до ключей</span> и после</h1>
        <p className="mt-5 max-w-2xl text-pretty text-lg text-slate-600">Собственный юридический офис, отдел послепродажного обслуживания и специалисты по ВНЖ и гражданству в Алании, Анталии и Стамбуле.</p>
      </header>
      <ul className="grid gap-5 sm:grid-cols-2">
        {SERVICES.map((s, i) => (
          <li key={s.slug} className="reveal">
            <Link href={R.service(s.slug)} className={`group flex h-full flex-col bg-white p-7 shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] transition-[translate,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_1px_2px_rgb(22_52_87/0.06),0_28px_50px_-28px_rgb(22_52_87/0.55)] sm:p-9 ${i % 2 ? "rounded-[10px_36px_10px_36px]" : "rounded-[36px_10px_36px_10px]"}`}>
              <span className="text-sm font-black tabular-nums text-brand-500/60">0{i + 1}</span>
              <h2 className="mt-2 text-balance text-2xl font-black tracking-tight text-ink sm:text-3xl">{s.name}</h2>
              <p className="mt-3 flex-1 text-pretty leading-relaxed text-slate-600">{s.short}</p>
              <span className="mt-6 inline-flex items-center gap-2 font-bold text-brand-500">Подробнее <Arrow className="transition-transform duration-200 ease-out group-hover:translate-x-1" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
