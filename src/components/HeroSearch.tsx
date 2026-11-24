"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CITIES } from "@/lib/api";

export default function HeroSearch({ types }: { types: string[] }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [rooms, setRooms] = useState("");
  const [max, setMax] = useState("");
  const [id, setId] = useState("");
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    if (id.trim()) return router.push(`/property-turkey/${id.replace(/\D/g, "")}`);
    const q = new URLSearchParams();
    if (city) q.set("city", city);
    if (type) q.set("type", type);
    if (rooms) q.set("rooms", rooms);
    if (max) q.set("max", max);
    router.push(`/property-turkey?${q}`);
  };
  const sel = "w-full select-chevron rounded-full bg-white/95 py-3 pl-4 pr-9 text-base font-bold text-ink outline-none ring-1 ring-white/40 transition focus:ring-2 focus:ring-sky sm:text-sm";
  return (
    <form onSubmit={go} role="search" aria-label="Поиск недвижимости" className="glass grid grid-cols-2 gap-2 rounded-[30px_10px_30px_10px] p-2.5 ring-1 ring-white/30 lg:grid-cols-[repeat(5,1fr)_auto]">
      <select aria-label="Город" value={city} onChange={(e) => setCity(e.target.value)} className={sel}>
        <option value="">Любой город</option>
        {Object.entries(CITIES).map(([k, v]) => <option key={k} value={k}>{v.ru}</option>)}
      </select>
      <select aria-label="Тип" value={type} onChange={(e) => setType(e.target.value)} className={sel}>
        <option value="">Любой тип</option>
        {types.map((t) => <option key={t}>{t}</option>)}
      </select>
      <select aria-label="Комнаты" value={rooms} onChange={(e) => setRooms(e.target.value)} className={sel}>
        <option value="">Комнаты</option>
        {[1, 2, 3, 4, 5].map((r) => <option key={r} value={r}>{r}+1{r === 5 ? " и больше" : ""}</option>)}
      </select>
      <select aria-label="Бюджет" value={max} onChange={(e) => setMax(e.target.value)} className={sel}>
        <option value="">Бюджет до</option>
        {[100000, 150000, 200000, 300000, 500000, 1000000].map((v) => <option key={v} value={v}>{v.toLocaleString("ru-RU")}</option>)}
      </select>
      <input aria-label="ID объекта" inputMode="numeric" placeholder="ID объекта" value={id} onChange={(e) => setId(e.target.value)} className={`${sel} !bg-none !pr-4 placeholder:font-bold placeholder:text-slate-500`} />
      <button className="btn btn-sky !py-3 text-sm lg:px-8">
        Найти
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
      </button>
    </form>
  );
}
