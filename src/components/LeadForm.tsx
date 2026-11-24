"use client";
import { useId, useState } from "react";
import { CONTACTS } from "@/lib/api";

/**
 * Demo lead form: opens WhatsApp with a pre-filled message.
 * After launch it will also save the lead to the admin panel.
 */
export default function LeadForm({ context, dark = false }: { context?: string; dark?: boolean }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Здравствуйте! Меня зовут ${name}, мой телефон ${phone}.${context ? ` Интересует: ${context}.` : ""}`;
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  const input = `w-full rounded-full px-5 py-3.5 text-base outline-none ring-1 transition focus:ring-2 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/60 ring-white/25 focus:ring-sky" : "bg-sand text-ink placeholder:text-slate-500 ring-brand-500/15 focus:ring-brand-500"}`;
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="sr-only" htmlFor={`${uid}-name`}>Имя</label>
      <input id={`${uid}-name`} required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" className={input} autoComplete="name" />
      <label className="sr-only" htmlFor={`${uid}-phone`}>Телефон</label>
      <input id={`${uid}-phone`} required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон или WhatsApp" className={input} type="tel" autoComplete="tel" />
      <button className={`btn w-full ${dark ? "btn-sky" : "btn-primary"}`}>Получить консультацию</button>
      <p className={`text-xs ${dark ? "text-white/60" : "text-slate-500"}`}>Нажимая кнопку, вы откроете WhatsApp с готовым сообщением и соглашаетесь на обработку персональных данных.</p>
    </form>
  );
}
