"use client";
import Link from "next/link";
import { useId, useState } from "react";
import { CONTACTS } from "@/lib/contacts";
import { R } from "@/lib/routes";
import { track } from "@/lib/track";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; text: string };

/**
 * Lead form: the request is saved on the server (/api/lead) and the managers are notified.
 * WhatsApp is offered after sending, and as the way out if saving fails, so a lead is never lost.
 */
export default function LeadForm({ context, dark = false }: { context?: string; dark?: boolean }) {
  const uid = useId();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot, hidden from people
  const [state, setState] = useState<State>({ kind: "idle" });

  const waText = `Здравствуйте! Меня зовут ${name}, мой телефон ${phone}.${context ? ` Интересует: ${context}.` : ""}`;
  const waHref = `${CONTACTS.whatsapp}?text=${encodeURIComponent(waText)}`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.kind === "sending") return;
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/lead/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, consent, website, context, page: location.pathname, lang: document.documentElement.lang }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось отправить заявку.");
      track("lead_sent", { context: context ?? "" });
      setState({ kind: "sent" });
    } catch (err) {
      track("lead_error");
      setState({ kind: "error", text: err instanceof Error ? err.message : "Не удалось отправить заявку." });
    }
  };

  const muted = dark ? "text-white/70" : "text-slate-600";
  const link = dark ? "font-bold text-white underline underline-offset-2" : "font-bold text-brand-500 underline underline-offset-2";

  if (state.kind === "sent") {
    return (
      <div role="status" className="space-y-3">
        <p className={`text-xl font-black ${dark ? "text-white" : "text-ink"}`}>Спасибо, {name}! Заявка отправлена.</p>
        <p className={`text-sm ${muted}`}>Менеджер AZPO свяжется с вами по номеру {phone} в рабочее время. Если удобнее, напишите нам сразу:</p>
        <a href={waHref} target="_blank" rel="noopener" className={`btn w-full ${dark ? "btn-sky" : "btn-primary"}`}>Написать в WhatsApp</a>
      </div>
    );
  }

  const input = `w-full rounded-full px-5 py-3.5 text-base outline-none ring-1 transition-[box-shadow,background-color] duration-150 ease-out focus:ring-2 sm:text-sm ${dark ? "bg-white/10 text-white placeholder:text-white/60 ring-white/25 focus:ring-sky" : "bg-sand text-ink placeholder:text-slate-500 ring-brand-500/15 focus:ring-brand-500"}`;
  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="sr-only" htmlFor={`${uid}-name`}>Имя</label>
      <input id={`${uid}-name`} required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ваше имя" className={input} autoComplete="name" />
      <label className="sr-only" htmlFor={`${uid}-phone`}>Телефон</label>
      <input id={`${uid}-phone`} required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Телефон или WhatsApp" className={input} type="tel" inputMode="tel" pattern="[+\d\s()\-]{7,25}" title="Цифры, можно с + и пробелами" autoComplete="tel" />
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${uid}-website`}>Сайт</label>
        <input id={`${uid}-website`} tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
      </div>
      <label className={`flex items-start gap-2.5 text-xs leading-snug ${muted}`}>
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-brand-500" />
        <span>Согласен на обработку персональных данных в соответствии с <Link href={R.privacy} className={link}>политикой конфиденциальности</Link></span>
      </label>
      <button disabled={state.kind === "sending"} className={`btn w-full disabled:opacity-60 ${dark ? "btn-sky" : "btn-primary"}`}>
        {state.kind === "sending" ? "Отправляем…" : "Получить консультацию"}
      </button>
      {state.kind === "error" && (
        <p role="alert" className={`text-sm ${dark ? "text-white" : "text-alert"}`}>
          {state.text}{" "}
          <a href={waHref} target="_blank" rel="noopener" className={link}>Написать в WhatsApp</a>
        </p>
      )}
    </form>
  );
}
