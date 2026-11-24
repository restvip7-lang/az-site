import type { Metadata } from "next";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";

export const metadata: Metadata = {
  title: "Гражданство Турции за инвестиции в недвижимость",
  description: "Как получить гражданство Турции при покупке недвижимости от $400 000: условия, сроки, документы и сопровождение AZPO.",
};

const STEPS = [
  ["Подбор объекта", "Подбираем недвижимость стоимостью от $400 000, которая подходит под программу гражданства."],
  ["Проверка и сделка", "Проверяем документы, оформляем ТАПУ с запретом продажи на 3 года и оценочный отчёт."],
  ["Сертификат соответствия", "Получаем в министерстве сертификат, подтверждающий инвестицию."],
  ["ВНЖ и подача документов", "Оформляем ВНЖ и подаём пакет документов на гражданство для всей семьи."],
  ["Паспорт", "Получаем решение и турецкие паспорта. Обычно процесс занимает от 4 до 8 месяцев."],
];

export default function Citizenship() {
  return (
    <div>
      <section className="bg-brand-500 py-16 text-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-sky">Программа инвестиций</p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">Гражданство Турции через покупку недвижимости</h1>
          <p className="mt-5 max-w-2xl text-white/75">Паспорт для всей семьи, включая супругов и детей до 18 лет, при покупке недвижимости от $400 000. Без требований к проживанию и знанию языка.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1fr_320px]">
        <ol className="space-y-6">
          {STEPS.map(([t, d], i) => (
            <li key={t} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-700">{i + 1}</span>
              <div><h2 className="font-semibold text-slate-900">{t}</h2><p className="mt-1 text-slate-600">{d}</p></div>
            </li>
          ))}
          <li><Link href="/property-turkey?min=400000" className="inline-block rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white">Объекты под гражданство →</Link></li>
        </ol>
        <div className="h-fit rounded-2xl bg-white p-6"><h2 className="mb-4 font-semibold">Бесплатная консультация по гражданству</h2><LeadForm context="гражданство" /></div>
      </div>
    </div>
  );
}
