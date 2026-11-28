"use client";
// Cookie banner and the analytics it controls. Yandex Metrika (cookies, Webvisor) starts only after
// "Принять"; with "Только необходимые" it never loads. Vercel Web Analytics uses no cookies and is always on.
// Also reports clicks on WhatsApp / Telegram / phone / e-mail links as goals.
import Link from "next/link";
import { useEffect, useState } from "react";
import { contactGoal, track } from "@/lib/track";

const KEY = "azpo_consent";
type Choice = "all" | "necessary";

function readChoice(): Choice | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "all" || v === "necessary" ? v : null;
  } catch {
    return null;
  }
}

function loadMetrika(id: number) {
  if (typeof window.ym === "function" || document.getElementById("ym-tag")) return;
  const w = window as unknown as { ym: ((...a: unknown[]) => void) & { a?: unknown[][]; l?: number } };
  w.ym = Object.assign((...args: unknown[]) => { (w.ym.a = w.ym.a || []).push(args); }, { l: Date.now() });
  const s = document.createElement("script");
  s.id = "ym-tag";
  s.async = true;
  s.src = "https://mc.yandex.ru/metrika/tag.js";
  document.head.appendChild(s);
  w.ym(id, "init", { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
}

export default function Consent({ privacyHref }: { privacyHref: string }) {
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined);

  useEffect(() => setChoice(readChoice()), []);

  useEffect(() => {
    const id = Number(process.env.NEXT_PUBLIC_YM_ID);
    if (choice === "all" && id) loadMetrika(id);
  }, [choice]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.("a[href]");
      const goal = a && contactGoal(a.getAttribute("href") ?? "");
      if (goal) track(goal, { page: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  const decide = (c: Choice) => {
    try {
      localStorage.setItem(KEY, c);
    } catch {}
    setChoice(c);
  };

  if (choice !== null) return null;
  return (
    <div role="region" aria-label="Файлы cookie" className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-xl rounded-[22px_6px_22px_6px] bg-white p-4 text-sm text-ink shadow-[0_18px_50px_-20px_rgb(22_52_87/0.55)] ring-1 ring-brand-500/15 md:bottom-4 sm:p-5">
      <p className="text-pretty">
        Мы используем файлы cookie для аналитики (Яндекс Метрика), чтобы улучшать сайт. Подробнее — в{" "}
        <Link href={privacyHref} className="font-bold text-brand-500 underline underline-offset-2">политике конфиденциальности</Link>.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => decide("all")} className="btn btn-primary min-h-11 px-5 py-2.5 text-sm">Принять</button>
        <button type="button" onClick={() => decide("necessary")} className="min-h-11 rounded-full px-5 py-2.5 text-sm font-bold text-brand-500 ring-1 ring-brand-500/30 transition-colors duration-150 hover:bg-sand">Только необходимые</button>
      </div>
    </div>
  );
}
