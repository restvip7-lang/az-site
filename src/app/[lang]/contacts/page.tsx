import type { Metadata } from "next";
import Image from "next/image";
import LeadForm from "@/components/LeadForm";
import { CONTACTS } from "@/lib/contacts";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { SectionHead } from "@/components/ui";

export const metadata: Metadata = {
  title: "Контакты",
  description: "Офисы AZPO Estate в Алании, Анталии и Стамбуле. Телефон, WhatsApp, Telegram и адреса.",
  alternates: alternates(R.contacts),
};

const MAPS: Record<string, [string, string]> = {
  "Алания": ["https://maps.app.goo.gl/dGDjgEvqdE6rVY8C8", "/img/about/maps/alanyamap.webp"],
  "Анталия": ["https://maps.app.goo.gl/uEwvNmATVzCg7hXm6", "/img/about/maps/antalyamap.webp"],
  "Стамбул": ["https://maps.app.goo.gl/D1cz5L6KG3MvNjZJ9", "/img/about/maps/istanbulmap.webp"],
};
const IN: Record<string, string> = { "Алания": "Алании", "Анталия": "Анталии", "Стамбул": "Стамбуле" };

export default function Contacts() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <section className="hatch grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white lg:grid-cols-[1.2fr_1fr]">
        <div className="p-6 sm:p-12">
          <p className="eyebrow text-brand-500">AZPO Estate</p>
          <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-[-0.045em] text-ink sm:text-7xl">
            <span className="slant">Контакты</span>
          </h1>
          <a href={CONTACTS.phoneHref} className="mt-8 block text-3xl font-black tabular-nums tracking-tight text-brand-500 sm:text-4xl">{CONTACTS.phone}</a>
          <a href={`mailto:${CONTACTS.email}`} className="mt-2 block text-lg font-bold text-ink/70 hover:text-brand-500">{CONTACTS.email}</a>
          <div className="mt-6 flex flex-wrap gap-2">
            <a href={CONTACTS.whatsapp} target="_blank" rel="noopener" className="btn bg-[#1f9e52] text-white hover:brightness-110">WhatsApp</a>
            <a href={CONTACTS.telegram} target="_blank" rel="noopener" className="btn bg-[#1a7fb0] text-white hover:brightness-110">Telegram</a>
            <a href={CONTACTS.instagram} target="_blank" rel="noopener" className="btn btn-ghost">Instagram</a>
          </div>
          <div className="mt-10 max-w-md">
            <p className="mb-4 text-xl font-black text-ink">Напишите нам удобным для вас способом</p>
            <LeadForm context="консультация" />
          </div>
        </div>
        <div className="relative min-h-[320px]">
          <Image src="/img/home/contactimg.webp" alt="Специалист AZPO на связи" fill priority sizes="(max-width: 1024px) 100vw, 560px" className="object-cover lg:[clip-path:polygon(18%_0,100%_0,100%_100%,0_100%)]" />
        </div>
      </section>

      <section className="pt-20">
        <SectionHead n="01" kicker="Офисы" title={<>Приходите в <span className="slant">гости</span></>} />
        <div className="grid gap-5 md:grid-cols-3">
          {CONTACTS.offices.map((o, i) => (
            <a key={o.city} href={MAPS[o.city]?.[0]} target="_blank" rel="noopener" className={`group overflow-hidden bg-white ${i % 2 ? "rounded-[10px_36px_10px_36px]" : "rounded-[36px_10px_36px_10px]"}`}>
              <div className="relative aspect-[16/10] bg-brand-100">
                {MAPS[o.city] && <Image src={MAPS[o.city][1]} alt="" fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover transition-transform duration-700 ease-out group-hover:scale-105" />}
              </div>
              <div className="p-6">
                <h2 className="text-2xl font-black tracking-tight text-ink">Офис в {IN[o.city] ?? o.city}</h2>
                <p className="mt-2 text-sm text-ink/70">{o.address}</p>
                <span className="mt-4 inline-block font-bold text-brand-500 underline decoration-sky decoration-2 underline-offset-4">Открыть на карте</span>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
