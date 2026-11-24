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
  const sel = "w-full rounded-full bg-white px-4 py-3 text-base sm:text-sm text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-brand-500";
  return (
    <form onSubmit={go} role="search" className="grid grid-cols-2 gap-2 rounded-3xl bg-white/95 p-3 shadow-2xl shadow-black/20 lg:grid-cols-6">
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
      <input aria-label="ID объекта" inputMode="numeric" placeholder="ID объекта" value={id} onChange={(e) => setId(e.target.value)} className={sel} />
      <button className="rounded-full bg-brand-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-600">
        Найти
      </button>
    </form>
  );
}
