// Requests from the site's forms ("заявки"). Saved in the database first, then the manager is notified
// (Telegram, if TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set). The form offers WhatsApp only afterwards.
import "server-only";
import { createHash } from "node:crypto";
import { db, hasDb } from "@/lib/db";

export type LeadStatus = "new" | "in_work" | "done" | "spam";
export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "Новая" },
  { value: "in_work", label: "В работе" },
  { value: "done", label: "Обработана" },
  { value: "spam", label: "Спам" },
];
export const isLeadStatus = (v: unknown): v is LeadStatus => LEAD_STATUSES.some((s) => s.value === v);

export interface LeadInput { name: string; phone: string; message?: string; context?: string; page?: string; lang?: string }
export interface LeadRow extends LeadInput { id: number; created_at: Date; status: LeadStatus; notified: boolean }

const clip = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

/** Checks and tidies what the form sent. Returns the lead or an error text for the visitor. */
export function parseLead(body: Record<string, unknown>): { lead: LeadInput } | { error: string } {
  const name = clip(body.name, 80);
  const phone = clip(body.phone, 40);
  const digits = phone.replace(/\D/g, "");
  if (name.length < 2) return { error: "Укажите имя." };
  if (digits.length < 7 || digits.length > 15 || !/^[+\d\s()-]+$/.test(phone)) return { error: "Проверьте номер телефона: нужны цифры, можно с +." };
  if (body.consent !== true) return { error: "Нужно согласие на обработку персональных данных." };
  return {
    lead: {
      name,
      phone,
      message: clip(body.message, 1000) || undefined,
      context: clip(body.context, 200) || undefined,
      page: clip(body.page, 300) || undefined,
      lang: clip(body.lang, 5) || undefined,
    },
  };
}

/** One-way hash of the visitor's IP with a daily salt: enough to limit spam, useless for tracking a person. */
export function ipHash(ip: string, day = new Date().toISOString().slice(0, 10)) {
  return createHash("sha256").update(`${day}|${ip}|azpo-leads`).digest("hex").slice(0, 32);
}

const PER_IP_PER_HOUR = 5;

export async function saveLead(lead: LeadInput, ip: string): Promise<{ id: number } | { error: string; status: number }> {
  if (!hasDb()) return { error: "Заявки временно не принимаются. Напишите нам в WhatsApp.", status: 503 };
  const sql = await db();
  const hash = ipHash(ip);
  const [{ n }] = await sql`select count(*)::int as n from leads where ip_hash = ${hash} and created_at > now() - interval '1 hour'`;
  if (n >= PER_IP_PER_HOUR) return { error: "Слишком много заявок подряд. Напишите нам в WhatsApp или позвоните.", status: 429 };
  const [row] = await sql<{ id: number }[]>`
    insert into leads (name, phone, message, context, page, lang, ip_hash)
    values (${lead.name}, ${lead.phone}, ${lead.message ?? null}, ${lead.context ?? null}, ${lead.page ?? null}, ${lead.lang ?? null}, ${hash})
    returning id`;
  return { id: row.id };
}

/** Sends the lead to the managers' Telegram chat. Never throws: the lead is already saved. */
export async function notifyLead(id: number, lead: LeadInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return false;
  const text = [
    `Новая заявка №${id} с сайта`,
    `Имя: ${lead.name}`,
    `Телефон: ${lead.phone}`,
    lead.context && `Интересует: ${lead.context}`,
    lead.message && `Сообщение: ${lead.message}`,
    lead.page && `Страница: ${lead.page}`,
  ].filter(Boolean).join("\n");
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`Telegram ${res.status}`);
    const sql = await db();
    await sql`update leads set notified = true where id = ${id}`;
    return true;
  } catch (err) {
    console.error("Lead notification failed", id, err instanceof Error ? err.message : err);
    return false;
  }
}

export async function listLeads(limit = 200): Promise<LeadRow[]> {
  const sql = await db();
  return sql<LeadRow[]>`
    select id, created_at, name, phone, message, context, page, lang, status, notified
    from leads order by created_at desc limit ${limit}`;
}
