"use client";
// The move of the azpo.ru catalogue into the admin: asks which objects are missing, then moves them
// in batches of 25 and shows the progress. It can be stopped and run again: moved objects are skipped.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { objectImportBatchAction, objectImportPlanAction } from "@/app/admin/actions";

type Run =
  | { step: "idle" }
  | { step: "checking" }
  | { step: "running" | "stopped" | "done"; total: number; todo: number; done: number; imported: number; failed: number[] }
  | { step: "error"; error: string };

const BATCH = 25;

export default function ObjectImport({ moved }: { moved: number }) {
  const router = useRouter();
  const [run, setRun] = useState<Run>({ step: "idle" });
  const stop = useRef(false);

  async function start() {
    stop.current = false;
    setRun({ step: "checking" });
    const plan = await objectImportPlanAction().catch((e: unknown) => ({ error: e instanceof Error ? e.message : "Сеть недоступна" }));
    if ("error" in plan) return setRun({ step: "error", error: plan.error });
    const state = { total: plan.total, todo: plan.missing.length, done: 0, imported: 0, failed: [] as number[] };
    setRun({ step: plan.missing.length ? "running" : "done", ...state });
    for (let i = 0; i < plan.missing.length; i += BATCH) {
      if (stop.current) {
        setRun({ step: "stopped", ...state });
        router.refresh();
        return;
      }
      const ids = plan.missing.slice(i, i + BATCH);
      const r = await objectImportBatchAction(ids).catch((e: unknown) => ({ error: e instanceof Error ? e.message : "Сеть недоступна" }));
      if ("error" in r) {
        state.failed.push(...ids);
      } else {
        state.imported += r.imported;
        state.failed.push(...r.failed);
      }
      state.done += ids.length;
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
