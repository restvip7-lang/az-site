// Receives the site's lead form. Saves the lead, then notifies the managers. Same-origin JSON only;
// a hidden "website" field catches simple bots (they get a normal answer and nothing is saved).
import { NextResponse, type NextRequest } from "next/server";
import { notifyLead, parseLead, saveLead } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return json({ error: "Запрос не с сайта." }, 403);
  if (!req.headers.get("content-type")?.includes("application/json")) return json({ error: "Неверный формат." }, 415);

  let body: Record<string, unknown>;
  try {
    const text = await req.text();
    if (text.length > 8000) return json({ error: "Слишком длинное сообщение." }, 413);
    body = JSON.parse(text);
  } catch {
    return json({ error: "Неверный формат." }, 400);
  }
  if (typeof body !== "object" || body === null) return json({ error: "Неверный формат." }, 400);
  if (typeof body.website === "string" && body.website.trim()) return json({ ok: true });

  const parsed = parseLead(body);
  if ("error" in parsed) return json({ error: parsed.error }, 422);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
  try {
    const saved = await saveLead(parsed.lead, ip);
    if ("error" in saved) return json({ error: saved.error }, saved.status);
    await notifyLead(saved.id, parsed.lead);
    return json({ ok: true, id: saved.id });
  } catch (err) {
    console.error("Lead not saved", err);
    return json({ error: "Не удалось отправить заявку. Напишите нам в WhatsApp или позвоните." }, 500);
  }
}
