"use client";
// The move of the azpo.ru catalogue into the admin: asks which objects are missing, then moves them
// in batches and shows the progress. It can be stopped and run again: moved objects are skipped.
// The page reads azpo.ru itself (from the staff member's browser azpo.ru answers in a second, from Vercel's
// servers it can take minutes) and hands the objects to the server; whatever it cannot read, the server tries.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { objectImportBatchAction, objectImportMissingAction, objectImportPlanAction, objectImportSaveAction } from "@/app/admin/actions";

type Run =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "running" | "stopped" | "done"; total: number; todo: number; done: number; imported: number; failed: number[] }
  | { step: "error"; error: string };

const BATCH = 20;

async function getJson(url: string, ms: number): Promise<unknown> {
  const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

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
    const fail = (e: unknown) => ({ error: e instanceof Error ? e.message : "Сеть недоступна" });
    // The list from this browser; if azpo.ru does not answer here, the server reads it.
    const ids = await getJson(`${api}/real-estates/ru?limit=2000`, 30_000)
      .then((j) => ((j as { realEstates?: { id: number }[] }).realEstates ?? []).map((p) => p.id).filter(Number.isInteger))
      .catch(() => [] as number[]);
    const direct = ids.length > 0;
    const plan = direct
      ? await objectImportMissingAction(ids).then((r) => ("error" in r ? r : { total: ids.length, missing: r.missing })).catch(fail)
      : await objectImportPlanAction().catch(fail);
    if ("error" in plan) return setRun({ step: "error", error: plan.error });
    const state = { total: plan.total, todo: plan.missing.length, done: 0, imported: 0, failed: [] as number[] };
    setRun({ step: plan.missing.length ? "running" : "done", ...state });
    for (let i = 0; i < plan.missing.length; i += BATCH) {
      if (stop.current) {
        setRun({ step: "stopped", ...state });
        router.refresh();
        return;
      }
      const batch = plan.missing.slice(i, i + BATCH);
      let rest = batch;
      if (direct) {
        const got = (await pool(batch, 6, (id) => getJson(`${api}/dashboard/properties/${id}/ru`, 20_000)
          .then((j) => (Array.isArray(j) ? j[0] : j) as { id?: number } | undefined)
          .catch(() => undefined))).filter((d): d is { id: number } => d?.id !== undefined && batch.includes(d.id));
        if (got.length) {
          const r = await objectImportSaveAction(got).catch(fail);
          if ("error" in r) state.failed.push(...got.map((d) => d.id));
          else { state.imported += r.imported; state.failed.push(...r.failed); }
        }
        rest = batch.filter((id) => !got.some((d) => d.id === id));
      }
      if (rest.length) {
        const r = await objectImportBatchAction(rest).catch(fail);
        if ("error" in r) state.failed.push(...rest);
        else { state.imported += r.imported; state.failed.push(...r.failed); }
      }
      state.done += batch.length;
      setRun({ step: "running", ...state });
    }
    setRun({ step: "done", ...state });
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
            {run.step === "running" ? `Переношу: ${run.done} из ${run.todo}…` : run.step === "stopped" ? `Остановлено: обработано ${run.done} из ${run.todo}.` : "Готово."}{" "}
            Добавлено {run.imported}.{run.failed.length > 0 && <span className="text-red-700"> Не получилось: {run.failed.length} (ID {run.failed.slice(0, 12).join(", ")}{run.failed.length > 12 ? "…" : ""}), нажмите кнопку ещё раз.</span>}
          </p>
        </div>
      )}
      {run.step === "done" && run.todo === 0 && <p className="text-sm font-bold text-emerald-800" aria-live="polite">Новых объектов на azpo.ru нет (всего там {run.total}).</p>}
      {run.step === "error" && <p role="alert" className="rounded-[14px_4px_14px_4px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{run.error}</p>}
    </section>
  );
}
