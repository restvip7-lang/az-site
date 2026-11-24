import type { Metadata } from "next";
import LeadForm from "@/components/LeadForm";
import { CONTACTS } from "@/lib/api";

export const metadata: Metadata = { title: "Контакты" };

export default function Contacts() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-brand-900">Контакты</h1>
      <div className="mt-8 grid gap-10 md:grid-cols-2">
        <div className="space-y-5 text-slate-700">
          <p><a href={CONTACTS.phoneHref} className="text-2xl font-bold text-brand-700">{CONTACTS.phone}</a></p>
          <p><a href={`mailto:${CONTACTS.email}`} className="text-brand-500">{CONTACTS.email}</a></p>
          <div className="flex gap-2">
            <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="rounded-xl bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white">WhatsApp</a>
            <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="rounded-xl bg-[#229ED9] px-5 py-2.5 text-sm font-semibold text-white">Telegram</a>
          </div>
          {CONTACTS.offices.map((o) => (
            <div key={o.city}><h2 className="font-semibold text-slate-900">Офис в {o.city === "Стамбул" ? "Стамбуле" : o.city === "Алания" ? "Алании" : "Анталии"}</h2><p className="text-sm">{o.address}</p></div>
          ))}
        </div>
        <div className="h-fit rounded-2xl bg-sand p-6"><h2 className="mb-4 font-semibold">Напишите нам</h2><LeadForm /></div>
      </div>
    </div>
  );
}
