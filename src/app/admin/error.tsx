"use client";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-20">
      <div className="adm-card">
        <h1 className="text-2xl font-black text-ink">Что-то пошло не так</h1>
        <p className="mt-2 text-slate-600">Скорее всего, база данных не ответила. Попробуйте ещё раз через минуту.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Код ошибки: {error.digest}</p>}
        <button type="button" onClick={reset} className="adm-btn adm-btn-primary mt-5">Повторить</button>
      </div>
    </div>
  );
}
