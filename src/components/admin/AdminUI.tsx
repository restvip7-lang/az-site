"use client";
// Small building blocks of the admin: forms that keep what was typed when the server says "no",
// a submit button that shows progress, confirmation for deletes, photo upload, the side menu.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, startTransition, useActionState, useContext, useRef, useState, type ReactNode } from "react";
import type { FormState } from "@/lib/admin/forms";

const Pending = createContext(false);

/**
 * A form bound to a server action. React resets a form after its action runs; dispatching by hand
 * avoids that, so a validation error never wipes the fields. Without JavaScript the plain action still works.
 */
export function ActionForm({ action, children, className, id }: { action: (s: FormState, fd: FormData) => Promise<FormState>; children: ReactNode; className?: string; id?: string }) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <form
      id={id}
      action={formAction}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => formAction(fd));
      }}
    >
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      <div aria-live="polite">
        {state?.error && <p role="alert" className="mt-4 rounded-[14px_4px_14px_4px] bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{state.error}</p>}
        {state?.ok && <p className="mt-4 rounded-[14px_4px_14px_4px] bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">{state.ok}</p>}
      </div>
    </form>
  );
}

export function Submit({ children, busy = "Сохраняю…", className = "" }: { children: ReactNode; busy?: string; className?: string }) {
  const pending = useContext(Pending);
  return (
    <button type="submit" disabled={pending} className={`adm-btn adm-btn-primary ${className}`}>
      {pending && <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
      {pending ? busy : children}
    </button>
  );
}

/** A delete button inside a plain <form action={…}>: asks first. */
export function ConfirmButton({ children, message, className = "adm-btn adm-btn-danger" }: { children: ReactNode; message: string; className?: string }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}

const NAV: [string, string][] = [
  ["/admin/", "Обзор"],
  ["/admin/objects/", "Объекты"],
  ["/admin/articles/", "Статьи и новости"],
  ["/admin/seo/", "SEO-тексты"],
  ["/admin/redirects/", "Редиректы"],
  ["/admin/staff/", "Сотрудники"],
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Разделы админки" className="flex gap-1 overflow-x-auto lg:flex-col">
      {NAV.map(([href, label]) => {
        const active = href === "/admin/" ? path === "/admin/" || path === "/admin" : path.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap rounded-[14px_4px_14px_4px] px-3.5 py-2.5 text-sm font-bold transition-colors duration-150 ${active ? "bg-white text-brand-500" : "text-white/80 hover:bg-white/10 hover:text-white"}`}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ───────────── Photos ───────────── */

/** Shrinks a photo in the browser to at most 2400 px, so one upload stays well under the request limit. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 3.5e6 && ["image/jpeg", "image/png", "image/webp"].includes(file.type)) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    return await new Promise((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error("canvas"))), "image/jpeg", 0.88));
  } catch {
    return file;
  }
}

export function PhotoField({ name, initial, folder, multiple = true, label }: { name: string; initial: string[]; folder: "objects" | "articles"; multiple?: boolean; label: string }) {
  const [photos, setPhotos] = useState<string[]>(initial);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const drag = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function add(files: File[]) {
    const list = files.filter((f) => f.type.startsWith("image/")).slice(0, multiple ? 40 : 1);
    if (!list.length) return;
    setErrors([]);
    setProgress([0, list.length]);
    for (const [i, f] of list.entries()) {
      try {
        const blob = await shrink(f);
        const res = await fetch(`/admin/api/upload/?folder=${folder}`, { method: "POST", headers: { "Content-Type": blob.type || "image/jpeg" }, body: blob });
        const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
        if (!res.ok || !j.url) throw new Error(j.error ?? `ошибка ${res.status}`);
        setPhotos((p) => (multiple ? [...p, j.url!] : [j.url!]));
      } catch (e) {
        setErrors((x) => [...x, `${f.name}: ${e instanceof Error ? e.message : "не загрузилось"}`]);
      }
      setProgress([i + 1, list.length]);
    }
    setProgress(null);
    if (input.current) input.current.value = "";
  }
  const move = (from: number, to: number) =>
    setPhotos((p) => {
      if (to < 0 || to >= p.length) return p;
      const next = [...p];
      next.splice(to, 0, next.splice(from, 1)[0]);
      return next;
    });

  return (
    <fieldset>
      <legend className="adm-label">{label}</legend>
      <input type="hidden" name={name} value={multiple ? JSON.stringify(photos) : (photos[0] ?? "")} />
      {photos.length > 0 && (
        <ul className={`mb-3 grid gap-3 ${multiple ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "max-w-sm"}`}>
          {photos.map((src, i) => (
            <li key={src} draggable={multiple}
              onDragStart={() => (drag.current = i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); if (drag.current !== null) move(drag.current, i); drag.current = null; }}
              className="group relative overflow-hidden rounded-[18px_6px_18px_6px] bg-sand ring-1 ring-brand-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
              {multiple && i === 0 && <span className="absolute left-2 top-2 rounded-full bg-brand-500 px-2.5 py-1 text-[11px] font-bold text-white">Главное фото</span>}
              <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2">
                {multiple && <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="adm-icon" aria-label="Сдвинуть влево">←</button>}
                {multiple && <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} className="adm-icon" aria-label="Сдвинуть вправо">→</button>}
                <button type="button" onClick={() => setPhotos((p) => p.filter((x) => x !== src))} className="adm-icon" aria-label="Убрать фото">×</button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <label
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); if (drag.current === null) add([...e.dataTransfer.files]); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-[22px_6px_22px_6px] border-2 border-dashed px-4 py-7 text-center text-sm transition-colors duration-150 ${over ? "border-brand-500 bg-brand-50" : "border-brand-500/25 bg-white hover:border-brand-500/60"}`}>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} className="sr-only" onChange={(e) => add([...(e.target.files ?? [])])} />
        <span className="font-bold text-brand-500">{progress ? `Загружаю ${progress[0]} из ${progress[1]}…` : multiple ? "Добавить фото" : photos.length ? "Заменить фото" : "Загрузить фото"}</span>
        <span className="text-slate-500">{multiple ? "Перетащите сюда или выберите файлы. Порядок меняется перетаскиванием." : "JPG, PNG или WebP"}</span>
      </label>
      {errors.length > 0 && <ul role="alert" className="mt-2 space-y-1 text-sm font-bold text-red-700">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}
    </fieldset>
  );
}
