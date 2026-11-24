"use client";
// Article editor with a live preview rendered by the same Markdown subset as the public page.
import { useMemo, useRef, useState } from "react";
import { BLOG_CATEGORIES, slugFromTitle } from "@/lib/blog";
import type { FormState } from "@/lib/admin/forms";
import { Markdown, parseBlocks } from "@/lib/markdown";
import { ActionForm, PhotoField, Submit } from "./AdminUI";

export interface ArticleValues {
  id?: number;
  category: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover: string;
  author: string;
  seo_title: string;
  seo_description: string;
  published: boolean;
  published_at: string; // yyyy-mm-dd
  url?: string; // public URL when published
}

const TOOLS: [string, string, string][] = [
  ["Подзаголовок", "\n## ", ""],
  ["Жирный", "**", "**"],
  ["Список", "\n- ", ""],
  ["Ссылка", "[", "](https://)"],
  ["Фото", "\n![Подпись](", ")\n"],
  ["Цитата", "\n> ", ""],
];

export default function ArticleForm({ action, values }: { action: (s: FormState, fd: FormData) => Promise<FormState>; values: ArticleValues }) {
  const [title, setTitle] = useState(values.title);
  const [slug, setSlug] = useState(values.slug);
  const [slugTouched, setSlugTouched] = useState(Boolean(values.id));
  const [body, setBody] = useState(values.body);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [seoTitle, setSeoTitle] = useState(values.seo_title);
  const [seoDesc, setSeoDesc] = useState(values.seo_description);
  const area = useRef<HTMLTextAreaElement>(null);
  const blocks = useMemo(() => (tab === "preview" ? parseBlocks(body) : []), [tab, body]);

  const wrap = (before: string, after: string) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const next = body.slice(0, s) + before + body.slice(s, e) + after + body.slice(e);
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, e + before.length);
    });
  };

  return (
    <ActionForm action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="space-y-6">
        <section className="adm-card space-y-4">
          <label className="block">
            <span className="adm-label">Заголовок (H1) *</span>
            <input name="title" required value={title} onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugFromTitle(e.target.value)); }} className="adm-input text-lg font-bold" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="adm-label">Раздел *</span>
              <select name="category" defaultValue={values.category || "news"} className="adm-input">
                {BLOG_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span className="adm-label">Адрес статьи</span>
              <input name="slug" value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }} pattern="[a-z0-9]+(-[a-z0-9]+)*" className="adm-input font-mono text-sm" />
              <span className="adm-hint">Латиницей, через дефис. Заполняется из заголовка.</span>
            </label>
          </div>
          <label className="block">
            <span className="adm-label">Анонс</span>
            <textarea name="excerpt" rows={2} defaultValue={values.excerpt} className="adm-input" placeholder="1–2 предложения для списка статей" />
          </label>
        </section>

        <section className="adm-card">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div role="tablist" className="flex gap-1 rounded-full bg-sand p-1 text-sm font-bold">
              {([["edit", "Текст"], ["preview", "Как на сайте"]] as const).map(([k, l]) => (
                <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 transition-colors duration-150 ${tab === k ? "bg-white text-brand-500 shadow-sm" : "text-slate-600 hover:text-ink"}`}>{l}</button>
              ))}
            </div>
            {tab === "edit" && (
              <div className="flex flex-wrap gap-1">
                {TOOLS.map(([l, b, a]) => <button key={l} type="button" onClick={() => wrap(b, a)} className="adm-btn adm-btn-ghost px-3 py-1.5 text-xs">{l}</button>)}
              </div>
            )}
          </div>
          <textarea ref={area} name="body" value={body} onChange={(e) => setBody(e.target.value)} rows={24} required hidden={tab !== "edit"}
            className="adm-input font-mono text-[13px] leading-relaxed" placeholder={"Абзацы разделяйте пустой строкой.\n\n## Подзаголовок\n\n- пункт списка\n- ещё пункт\n\n**жирный текст**, [ссылка](/ru/turkey/alanya/)"} />
          {tab === "preview" && <div className="min-h-64 rounded-[18px_6px_18px_6px] bg-white p-2 sm:p-6"><Markdown blocks={blocks} /></div>}
          <p className="adm-hint mt-2">Подзаголовки «## …» попадают в оглавление статьи. Ссылки на страницы сайта пишите без домена: /ru/turkey/alanya/.</p>
        </section>

        <section className="adm-card space-y-4">
          <h2 className="adm-h2">Поисковики</h2>
          <label className="block">
            <span className="adm-label">Title <span className={`tabular-nums ${seoTitle.length > 70 ? "text-red-600" : "text-slate-400"}`}>{seoTitle.length}/70</span></span>
            <input name="seo_title" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title} className="adm-input" />
          </label>
          <label className="block">
            <span className="adm-label">Description <span className={`tabular-nums ${seoDesc.length > 160 ? "text-red-600" : "text-slate-400"}`}>{seoDesc.length}/160</span></span>
            <textarea name="seo_description" rows={3} value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder="Если пусто — берётся анонс" className="adm-input" />
          </label>
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="adm-card space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="published" defaultChecked={values.published} className="mt-1 h-5 w-5 accent-brand-500" />
            <span>
              <span className="block font-black text-ink">Опубликована</span>
              <span className="text-sm text-slate-500">Без галочки — черновик, на сайте не видна.</span>
            </span>
          </label>
          <label className="block">
            <span className="adm-label">Дата публикации</span>
            <input type="date" name="published_at" defaultValue={values.published_at} className="adm-input" />
            <span className="adm-hint">Пусто — сегодня. Будущая дата: статья появится в этот день.</span>
          </label>
          <label className="block">
            <span className="adm-label">Автор</span>
            <input name="author" defaultValue={values.author} className="adm-input" />
          </label>
          <Submit className="w-full">{values.id ? "Сохранить" : "Создать статью"}</Submit>
          {values.url && <a href={values.url} target="_blank" rel="noopener" className="adm-btn adm-btn-ghost w-full">Открыть на сайте ↗</a>}
        </div>
        <div className="adm-card">
          <PhotoField name="cover" initial={values.cover ? [values.cover] : []} folder="articles" multiple={false} label="Обложка" />
        </div>
      </aside>
    </ActionForm>
  );
}
