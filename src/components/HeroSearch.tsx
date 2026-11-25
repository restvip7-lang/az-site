"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export interface HeroOptions {
  cities: { value: string; label: string }[];
  types: { value: string; label: string; residential: boolean }[];
}

const BUDGETS = [100_000, 150_000, 200_000, 300_000, 500_000, 1_000_000];
const LANDING_BUDGETS = [100_000, 150_000, 200_000];

/**
 * Hero search. Sends the visitor to the matching clean landing URL
 * (/ru/turkey/alanya/sale/apartments/2-bedrooms/), never to a ?query of the catalogue,
 * and adds GET parameters only for what has no landing page.
 */
export default function HeroSearch({ options }: { options: HeroOptions }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [rooms, setRooms] = useState("");
  const [max, setMax] = useState("");
  const [id, setId] = useState("");

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = id.replace(/\D/g, "");
    if (digits) return router.push(`/ru/property-turkey/${digits}/`);
    const t = options.types.find((x) => x.value === type);
    const params = new URLSearchParams();
    let feature = "";
    if (t?.residential && Number(rooms) >= 1 && Number(rooms) <= 4) feature = rooms === "1" ? "1-bedroom" : `${rooms}-bedrooms`;
    else if (rooms) params.set("rooms", rooms);
    if (t?.residential && !feature && max && LANDING_BUDGETS.includes(Number(max))) feature = `price-to-${max}`;
    else if (max) params.set("price_to", max);
    const parts = [city, (type || params.size) && "sale", type, feature].filter(Boolean);
    const path = `/ru/turkey/${parts.map((p) => `${p}/`).join("")}`;
    router.push(params.size ? `${path}?${params}` : path);
  };

  const sel = "w-full select-chevron rounded-full bg-white/95 py-3 pl-4 pr-9 text-base font-bold text-ink outline-none ring-1 ring-white/40 transition-shadow focus:ring-2 focus:ring-sky sm:text-sm";
  return (
    <form onSubmit={go} role="search" aria-label="Поиск недвижимости" className="glass grid grid-cols-2 gap-2 rounded-[30px_10px_30px_10px] p-2.5 ring-1 ring-white/30 lg:grid-cols-[repeat(5,1fr)_auto]">
      <select aria-label="Город" value={city} onChange={(e) => setCity(e.target.value)} className={sel}>
        <option value="">Любой город</option>
        {options.cities.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
      <select aria-label="Тип" value={type} onChange={(e) => setType(e.target.value)} className={sel}>
        <option value="">Любой тип</option>
        {options.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select aria-label="Спальни" value={rooms} onChange={(e) => setRooms(e.target.value)} className={sel}>
        <option value="">Спальни</option>
        <option value="0">0+1 (студия)</option>
        {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}+1{r === 5 ? " и больше" : ""}</option>)}
      </select>
      <select aria-label="Бюджет" value={max} onChange={(e) => setMax(e.target.value)} className={sel}>
        <option value="">Бюджет до</option>
        {BUDGETS.map((v) => <option key={v} value={v}>{v.toLocaleString("ru-RU")} €</option>)}
      </select>
      <input aria-label="ID объекта" inputMode="numeric" placeholder="ID объекта" value={id} onChange={(e) => setId(e.target.value)} className={`${sel} !bg-none !pr-4 placeholder:font-bold placeholder:text-slate-500`} />
      <button className="btn btn-sky !py-3 text-sm lg:px-8">
        Найти
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
      </button>
    </form>
  );
}
