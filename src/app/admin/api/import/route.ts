// The move of the azpo.ru catalogue into the admin, one step per request (see ObjectImport.tsx).
// A plain JSON endpoint rather than server actions: an action's answer also carries a fresh render of the
// admin page, and when that render waited on the database the whole move stood still. Every step here has
// its own time limit and answers with an error instead of hanging.
import { NextResponse, type NextRequest } from "next/server";
import { currentStaff } from "@/lib/admin/auth";
import { refreshCatalogue } from "@/lib/admin/catalogue";
import { importFetched, importObjects, importPlan, missingIds } from "@/lib/admin/object-import";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

type Step =
  | { step: "plan" }
  | { step: "missing"; ids: unknown }
  | { step: "save"; objects: unknown }
  | { step: "fetch"; ids: unknown }
  | { step: "done" };

const LIMIT_MS = { plan: 120_000, missing: 30_000, save: 60_000, fetch: 150_000, done: 10_000 } as const;

function within<T>(work: Promise<T>, ms: number): Promise<T> {
  return Promise.race([work, new Promise<T>((_, fail) => setTimeout(() => fail(new Error("Сервер не ответил вовремя")), ms))]);
}

const numbers = (v: unknown, max: number) => (Array.isArray(v) ? v.slice(0, max).map(Number) : null);

export async function POST(req: NextRequest) {
  // Only from the admin pages of this site, only for signed-in staff.
  const origin = req.headers.get("origin");
  if (!origin || new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Запрос не со страницы админки." }, { status: 403 });
  const me = await within(currentStaff(), 15_000).catch(() => null);
  if (!me) return NextResponse.json({ error: "Войдите в админку заново." }, { status: 401 });

  let body: Step;
  try {
    body = (await req.json()) as Step;
  } catch {
    return NextResponse.json({ error: "Неверный запрос." }, { status: 400 });
  }
  const step = body?.step;
  if (!step || !(step in LIMIT_MS)) return NextResponse.json({ error: "Неверный шаг." }, { status: 400 });

  try {
    const result = await within((async () => {
      switch (body.step) {
        case "plan":
          return importPlan();
        case "missing": {
          const ids = numbers(body.ids, 5000);
          if (!ids) throw new Error("Нет списка объектов.");
          return { missing: await missingIds(ids) };
        }
        case "save":
          if (!Array.isArray(body.objects)) throw new Error("Нет объектов.");
          return importFetched(body.objects);
        case "fetch": {
          const ids = numbers(body.ids, 25);
          if (!ids) throw new Error("Нет списка объектов.");
          return importObjects(ids);
        }
        case "done":
          // Once, at the end: the catalogue is built again with the moved objects (when the move is complete).
          await refreshCatalogue();
          return { ok: true };
      }
    })(), LIMIT_MS[step]);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(`Object import step ${step} failed`, err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Ошибка сервера" }, { status: 503 });
  }
}
