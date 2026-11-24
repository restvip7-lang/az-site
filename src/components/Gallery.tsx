"use client";
import { useCallback, useEffect, useState } from "react";

export default function Gallery({ images, title }: { images: string[]; title: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const n = images.length;
  const go = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);
  useEffect(() => {
    if (!full) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [full, go]);
  if (!n) return <div className="aspect-[16/9] rounded-2xl bg-slate-100" />;
  return (
    <div>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`${title} — фото ${i + 1}`} className="h-full w-full cursor-zoom-in object-cover" onClick={() => setFull(true)} />
        <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-3 py-1 text-xs text-white">{i + 1} / {n}</span>
        {n > 1 && (
          <>
            <button onClick={() => go(-1)} aria-label="Назад" className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow">‹</button>
            <button onClick={() => go(1)} aria-label="Вперёд" className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow">›</button>
          </>
        )}
      </div>
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
        {images.map((src, k) => (
          <button key={src + k} onClick={() => setI(k)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg ring-2 transition ${k === i ? "ring-brand-500" : "ring-transparent opacity-70 hover:opacity-100"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      {full && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" onClick={() => setFull(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[i]} alt="" className="max-h-[90vh] max-w-[95vw] object-contain" onClick={(e) => e.stopPropagation()} />
          <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Назад" className="absolute left-4 top-1/2 text-5xl text-white/80">‹</button>
          <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Вперёд" className="absolute right-4 top-1/2 text-5xl text-white/80">›</button>
          <button onClick={() => setFull(false)} aria-label="Закрыть" className="absolute right-5 top-4 text-3xl text-white/80">×</button>
        </div>
      )}
    </div>
  );
}
