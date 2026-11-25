"use client";
// Last resort when the page itself breaks in the browser (for example, the server cut an answer off half-way):
// instead of the browser's bare "Application error" the visitor gets a way back.
import "./globals.css";

export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="ru">
      <body className="flex min-h-screen flex-col items-center justify-center bg-sand px-4 py-16 text-center font-sans text-ink antialiased">
        <h1 className="text-balance text-3xl font-black">Страница не загрузилась</h1>
        <p className="mt-3 max-w-md text-pretty text-slate-600">Сервер ответил не полностью. Обновите страницу: обычно со второго раза всё открывается.</p>
        {error.digest && <p className="mt-2 font-mono text-xs text-slate-400">Код ошибки: {error.digest}</p>}
        {/* A full reload, not reset(): the broken part came from the server and must be fetched again. */}
        <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-[14px_4px_14px_4px] bg-brand-500 px-6 py-3 font-bold text-white transition-[background-color,scale] duration-150 ease-out hover:bg-brand-600 active:scale-[0.97]">
          Обновить страницу
        </button>
      </body>
    </html>
  );
}
