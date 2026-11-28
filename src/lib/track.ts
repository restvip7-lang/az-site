"use client";
// Conversion goals, sent to Yandex Metrika (only when the visitor accepted analytics cookies and the
// counter is on) and to Vercel Web Analytics (cookieless). Goal names are the same in both.
import { track as vercelTrack } from "@vercel/analytics";

export type Goal = "lead_sent" | "lead_error" | "whatsapp_click" | "telegram_click" | "phone_click" | "email_click" | "favorite_add";

declare global {
  interface Window { ym?: (id: number, method: string, ...args: unknown[]) => void }
}

export function track(goal: Goal, params?: Record<string, string | number>) {
  try {
    const id = Number(process.env.NEXT_PUBLIC_YM_ID);
    if (id && typeof window.ym === "function") window.ym(id, "reachGoal", goal, params);
  } catch {}
  try {
    vercelTrack(goal, params);
  } catch {}
}

/** Goal for a click on a contact link, or null for any other link. */
export function contactGoal(href: string): Goal | null {
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return "whatsapp_click";
  if (/^https:\/\/t\.me\//.test(href)) return "telegram_click";
  if (href.startsWith("tel:")) return "phone_click";
  if (href.startsWith("mailto:")) return "email_click";
  return null;
}
