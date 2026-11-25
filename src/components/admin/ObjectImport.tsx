"use client";
// The move of the azpo.ru catalogue into the admin: asks which objects are missing, then moves them
// in batches and shows the progress. It can be stopped and run again: moved objects are skipped.
// The page reads azpo.ru itself (from the staff member's browser azpo.ru answers in a second, from Vercel's
// servers it can take minutes) and hands the objects to the server; whatever it cannot read, the server tries.
// Every request has a time limit, so one slow answer costs a batch, never the whole move.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

type Run =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "running" | "stopped" | "done" | "halted"; total: number; todo: number; done: number; imported: number; failed: number[] }
  | { step: "error"; error: string };

const BATCH = 20;
/** After this many batches in a row that the server did not take, the move stops and says so. */
const MAX_FAILED_BATCHES = 3;

async function getJson(url: string, ms: number): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

/** One step of the move on the server (src/app/admin/api/import/route.ts). */
async function step<T>(body: object, ms: number): Promise<T> {
  let res: Response;
  try {
    res = await fetch("/admin/api/import/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(ms),
    });
  } catch (err) {
    throw new Error(err instanceof Error && err.name === "TimeoutError" ? "Сервер не ответил вовремя" : "Сеть недоступна");
  }
  const json = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok || json.error) throw new Error(json.error ?? `Ошибка сервера ${res.status}`);
  return json;
}

type Saved = { imported: number; failed: number[] };

/** Runs `fn` over the items, `n` at a time. */
async function pool<T, R>(items: T[], n: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  }));
  return out;
}

export default function ObjectImport({ moved, api }: { moved: number; api: string }) {
  const router = useRouter();
  const [run, setRun] = useState<Run>({ step: "idle" });
  const stop = useRef(false);

  async function start() {
    stop.current = false;
    setRun({ step: "checking" });
    const message = (e: unknown) => (e instanceof Error ? e.message : "Сеть недоступна");
    // The list from this browser; if azpo.ru does not answer here, the server reads it.
    const ids = await getJson(`${api}/real-estates/ru?limit=2000`, 30_000)
      .then((j) => ((j as { realEstates?: { id: number }[] }).realEstates ?? []).map((p) => p.id).filter(Number.isInteger))
      .catch(() => [] as number[]);
    const direct = ids.length > 0;
    let plan: { total: number; missing: number[] };
    try {
      plan = direct
        ? { total: ids.length, ...(await step<{ missing: number[] }>({ step: "missing", ids }, 40_000)) }
        : await step<{ total: number; missing: number[] }>({ step: "plan" }, 130_000);
    } catch (e) {
      return setRun({ step: "error", error: message(e) });
    }
    const state = { total: plan.total, todo: plan.missing.length, done: 0, imported: 0, failed: [] as number[] };
    setRun({ step: plan.missing.length ? "running" : "done", ...state });
    let failedInRow = 0;
    for (let i = 0; i < plan.missing.length; i += BATCH) {
      if (stop.current || failedInRow >= MAX_FAILED_BATCHES) break;
      const batch = plan.missing.slice(i, i + BATCH);
      let rest = batch;
      let ok = false;
      if (direct) {
        const got = (await pool(batch, 6, (id) => getJson(`${api}/dashboard/properties/${id}/ru`, 20_000)
          .then((j) => (Array.isArray(j) ? j[0] : j) as { id?: number } | undefined)
          .catch(() => undefined))).filter((d): d is { id: number } => d?.id !== undefined && batch.includes(d.id));
        if (got.length) {
          try {
            const r = await step<Saved>({ step: "save", objects: got }, 70_000);
            state.imported += r.imported;
            state.failed.push(...r.failed);
            ok = true;
          } catch {
            state.failed.push(...got.map((d) => d.id));
          }
        }
        rest = batch.filter((id) => !got.some((d) => d.id === id));
      }
      if (rest.length) {
        try {
          const r = await step<Saved>({ step: "fetch", ids: rest }, 160_000);
          state.imported += r.imported;
          state.failed.push(...r.failed);
          ok = true;
        } catch {
          state.failed.push(...rest);
        }
      }
      failedInRow = ok ? 0 : failedInRow + 1;
      state.done += batch.length;
      setRun({ step: "running", ...state });
    }
    // The catalogue is built again once, with everything moved so far.
    if (state.imported) await step({ step: "done" }, 15_000).catch(() => undefined);
    setRun({ step: stop.current ? "stopped" : failedInRow >= MAX_FAILED_BATCHES ? "halted" : "done", ...state });
    router.refresh();
  }

  const busy = run.step === "checking" || run.step === "running";
  const pct = "todo" in run && run.todo ? Math.round((run.done / run.todo) * 100) : 0;

  return (
    <section className="adm-card mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="adm-h2">Перенос объектов с azpo.ru</h2>
          <p className="mt-1 text-pretty text-sm text-slate-600">
            Забирает объекты каталога azpo.ru со всеми полями, описанием и фото. Они сразу публикуются, адреса страниц не меняются.
            Уже перенесённые и удалённые здесь повторно не добавляются, так что кнопку можно нажимать снова: она добавит только новые.
            Перенесено: {moved}.
          </p>
        </div>
        {busy ? (
          <button type="button" onClick={() => { stop.current = true; }} disabled={run.step === "checking"} className="adm-btn adm-btn-ghost">
            {run.step === "checking" ? "Проверяю каталог…" : "Остановить"}
          </button>
        ) : (
          <button type="button" onClick={start} className="adm-btn adm-btn-primary">{moved ? "Проверить новые" : "Перенести объекты"}</button>
        )}
      </div>
      {"todo" in run && run.todo > 0 && (
        <div aria-live="polite">
          <div className="h-2 overflow-hidden rounded-full bg-brand-50" role="progressbar" aria-valuemin={0} aria-valuemax={run.todo} aria-valuenow={run.done} aria-label="Перенос объектов">
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-300 ease-out" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-sm font-bold tabular-nums text-ink">
            {run.step === "running" ? `Переношу: ${run.done} из ${run.todo}…`
              : run.step === "stopped" ? `Остановлено: обработано ${run.done} из ${run.todo}.`
              : run.step === "halted" ? `Сервер не отвечает, перенос приостановлен: обработано ${run.done} из ${run.todo}.`
              : "Готово."}{" "}
            Добавлено {run.imported}.{run.failed.length > 0 && <span className="text-red-700"> Не получилось: {run.failed.length} (ID {run.failed.slice(0, 12).join(", ")}{run.failed.length > 12 ? "…" : ""}), нажмите кнопку ещё раз.</span>}
          </p>
        </div>
      )}
      {run.step === "done" && run.todo === 0 && <p className="text-sm font-bold text-emerald-800" aria-live="polite">Новых объектов на azpo.ru нет (всего там {run.total}).</p>}
      {run.step === "error" && <p role="alert" className="rounded-[14px_4px_14px_4px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{run.error}</p>}
    </section>
  );
}
