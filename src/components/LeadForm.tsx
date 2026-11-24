"use client";
import { useState } from "react";
import { CONTACTS } from "@/lib/api";

/**
 * Demo lead form: opens WhatsApp with a pre-filled message.
 * After launch it will also save the lead to the admin panel.
 */
export default function LeadForm({ context, dark = false }: { context?: string; dark?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Здравствуйте! Меня зовут ${name}, мой телефон ${phone}.${context ? ` Интересует: ${context}.` : ""}`;
    window.open(`${CONTACTS.whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };
  const input = `w-full rounded-xl px-4 py-3 text-sm outline-none ring-1 transition focus:ring-2 ${dark ? "bg-white/10 text-white placeholder:text-white/50 ring-white/20 focus:ring-gold" : "bg-white ring-slate-200 focus:ring-brand-500"}`;
  return (
    <form onSubmit={submit} className="space-y-3">
      <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" className={input} autoComplete="name" />
      <input required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон или WhatsApp" className={input} type="tel" autoComplete="tel" />
      <button className="w-full rounded-xl bg-gold px-4 py-3 text-sm font-semibold text-brand-900 transition hover:brightness-105">
        Получить консультацию
      </button>
      <p className={`text-xs ${dark ? "text-white/50" : "text-slate-500"}`}>Ответим в течение 15 минут в рабочее время.</p>
    </form>
  );
}
