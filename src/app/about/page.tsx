import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import { CONTACTS } from "@/lib/api";

export const metadata: Metadata = { title: "О компании AZPO" };

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-bold text-brand-900">О компании AZPO</h1>
      <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
        <div className="space-y-4 leading-relaxed text-slate-700">
          <p>AZPO Group работает на рынке недвижимости Турции с 2003 года. Мы помогаем покупателям из России, СНГ и Европы найти квартиру, виллу или коммерческий объект для жизни, отдыха и инвестиций.</p>
          <p>У нас офисы в Алании, Анталии и Стамбуле. Мы сопровождаем сделку от подбора объекта до получения ТАПУ, помогаем оформить ВНЖ и гражданство, открыть счёт в банке, обставить квартиру и сдавать её в аренду.</p>
          <p>Мы работаем напрямую с застройщиками и собственниками, поэтому клиенты покупают по ценам застройщика, без скрытых комиссий.</p>
          <h2 className="pt-6 text-2xl font-bold text-brand-900">Наши офисы</h2>
          <ul className="space-y-3">
            {CONTACTS.offices.map((o) => <li key={o.city}><b>{o.city}:</b> {o.address}</li>)}
          </ul>
        </div>
        <div className="h-fit rounded-2xl bg-white p-6"><h2 className="mb-4 font-semibold">Задать вопрос</h2><LeadForm /></div>
      </div>
    </div>
  );
}
