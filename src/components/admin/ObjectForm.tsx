"use client";
// Object editor: a developer's new-build project or a single listing. Field names match the
// server action; tags are the catalogue's own tag names, so the site's landings pick the object up.
import { useState } from "react";
import { OBJECT_FACTS, OBJECT_TAGS, type FormState } from "@/lib/admin/forms";
import { ActionForm, PhotoField, Submit } from "./AdminUI";

export interface ObjectValues {
  id?: number;
  published: boolean;
  is_project: boolean;
  title: string;
  developer: string;
  city: string;
  district: string;
  type: string;
  bed_min: string;
  bed_max: string;
  bathrooms: string;
  area: string;
  price: string;
  price_max: string;
  currency: "EUR" | "USD";
  tags: string[];
  description: string;
  facts: Record<string, string>;
  photos: string[];
}

export interface ObjectOptions {
  cities: { key: string; name: string; districts: { value: string; label: string }[] }[];
  types: { api: string; name: string }[];
}

const tagLabel = (t: string) => (t === "Вторичное жилье" ? "Вторичное жильё" : t.charAt(0).toUpperCase() + t.slice(1));

export default function ObjectForm({ action, values, options }: { action: (s: FormState, fd: FormData) => Promise<FormState>; values: ObjectValues; options: ObjectOptions }) {
  const [city, setCity] = useState(values.city || options.cities[0]?.key);
  const [isProject, setIsProject] = useState(values.is_project);
  const districts = options.cities.find((c) => c.key === city)?.districts ?? [];
  const known = districts.some((d) => d.value === values.district);
  const [district, setDistrict] = useState(values.district && !known ? "__other" : values.district);

  return (
    <ActionForm action={action} className="grid gap-6 xl:grid-cols-[1fr_340px]">
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <div className="space-y-6">
        <section className="adm-card space-y-5">
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Что это">
            {[["1", "Новостройка застройщика", "Комплекс с несколькими планировками"], ["0", "Отдельный объект", "Одна квартира, вилла или помещение"]].map(([v, h, d]) => (
              <label key={v} className={`flex-1 cursor-pointer rounded-[18px_6px_18px_6px] px-4 py-3 ring-1 transition-[box-shadow,background-color] duration-150 ${(v === "1") === isProject ? "bg-brand-50 ring-2 ring-brand-500" : "bg-white ring-brand-500/15 hover:ring-brand-500/40"}`}>
                <input type="radio" name="is_project" value={v} checked={(v === "1") === isProject} onChange={() => setIsProject(v === "1")} className="sr-only" />
                <span className="block font-black text-ink">{h}</span>
                <span className="text-sm text-slate-500">{d}</span>
              </label>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="adm-label">Название *</span>
              <input name="title" required defaultValue={values.title} placeholder={isProject ? "Например: ЖК Sea Pearl Residence" : "Например: Квартира 2+1 у моря"} className="adm-input" />
              <span className="adm-hint">Показывается на карточке и на странице объекта под заголовком.</span>
            </label>
            <label>
              <span className="adm-label">Застройщик</span>
              <input name="developer" defaultValue={values.developer} placeholder="Название компании" className="adm-input" />
            </label>
            <label>
              <span className="adm-label">Тип недвижимости *</span>
              <select name="type" required defaultValue={values.type || options.types[0]?.api} className="adm-input">
                {options.types.map((t) => <option key={t.api} value={t.api}>{t.name}</option>)}
              </select>
            </label>
            <label>
              <span className="adm-label">Город *</span>
              <select name="city" required value={city} onChange={(e) => { setCity(e.target.value); setDistrict(""); }} className="adm-input">
                {options.cities.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
              </select>
            </label>
            <label>
              <span className="adm-label">Район</span>
              <select value={district} onChange={(e) => setDistrict(e.target.value)} name={district === "__other" ? undefined : "district"} className="adm-input">
                <option value="">Без района</option>
                {districts.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                <option value="__other">Другой район…</option>
              </select>
            </label>
            {district === "__other" && (
              <label className="sm:col-span-2">
                <span className="adm-label">Название района латиницей</span>
                <input name="district" required defaultValue={known ? "" : values.district} placeholder="Например: Kargicak" className="adm-input" pattern="[A-Za-zÇçĞğİıÖöŞşÜü .'\-]+" />
                <span className="adm-hint">Как в турецком адресе: из него получается адрес страницы района.</span>
              </label>
            )}
          </div>
        </section>

        <section className="adm-card">
          <h2 className="adm-h2">Планировки, площадь и цена</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <label>
              <span className="adm-label">{isProject ? "Спален от" : "Спален"}</span>
              <input name="bed_min" inputMode="numeric" defaultValue={values.bed_min} placeholder="0 — студия" className="adm-input" />
            </label>
            {isProject && (
              <label>
                <span className="adm-label">Спален до</span>
                <input name="bed_max" inputMode="numeric" defaultValue={values.bed_max} placeholder="3" className="adm-input" />
              </label>
            )}
            <label>
              <span className="adm-label">Санузлов</span>
              <input name="bathrooms" inputMode="numeric" defaultValue={values.bathrooms} className="adm-input" />
            </label>
            <label>
              <span className="adm-label">Площадь{isProject ? " от" : ""}, м²</span>
              <input name="area" inputMode="numeric" defaultValue={values.area} className="adm-input" />
            </label>
            <label>
              <span className="adm-label">Цена{isProject ? " от" : ""}</span>
              <input name="price" inputMode="numeric" defaultValue={values.price} placeholder="125 000" className="adm-input tabular-nums" />
            </label>
            {isProject && (
              <label>
                <span className="adm-label">Цена до</span>
                <input name="price_max" inputMode="numeric" defaultValue={values.price_max} className="adm-input tabular-nums" />
              </label>
            )}
            <label>
              <span className="adm-label">Валюта</span>
              <select name="currency" defaultValue={values.currency} className="adm-input">
                <option value="EUR">€ евро</option>
                <option value="USD">$ доллары</option>
              </select>
            </label>
          </div>
          <p className="adm-hint mt-3">Пустая цена — на сайте будет «Цена по запросу».</p>
        </section>

        <section className="adm-card">
          <h2 className="adm-h2">Характеристики</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OBJECT_FACTS.map(([k, label, hint]) => (
              <label key={k}>
                <span className="adm-label">{label}</span>
                <input name={`fact_${k}`} defaultValue={values.facts[k] ?? ""} placeholder={hint} className="adm-input" />
              </label>
            ))}
          </div>
          <fieldset className="mt-6">
            <legend className="adm-label">Метки (по ним объект попадает в подборки сайта)</legend>
            <div className="flex flex-wrap gap-2">
              {OBJECT_TAGS.map((t) => (
                <label key={t} className="adm-chip">
                  <input type="checkbox" name="tags" value={t} defaultChecked={values.tags.includes(t)} className="peer sr-only" />
                  <span className="peer-checked:bg-brand-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sky">{tagLabel(t)}</span>
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="adm-card">
          <label>
            <span className="adm-label">Описание</span>
            <textarea name="description" rows={10} defaultValue={values.description} className="adm-input leading-relaxed" placeholder="Расположение, инфраструктура комплекса, условия покупки. Каждый абзац с новой строки." />
          </label>
        </section>

        <section className="adm-card">
          <PhotoField name="photos" initial={values.photos} folder="objects" label="Фотографии (первое — главное)" />
        </section>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
        <div className="adm-card space-y-4">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="published" defaultChecked={values.published} className="mt-1 h-5 w-5 accent-brand-500" />
            <span>
              <span className="block font-black text-ink">Опубликован на сайте</span>
              <span className="text-sm text-slate-500">Без галочки объект сохраняется как черновик.</span>
            </span>
          </label>
          <Submit className="w-full">{values.id ? "Сохранить изменения" : "Создать объект"}</Submit>
          <p className="adm-hint">После сохранения сайт обновляется в течение минуты.</p>
        </div>
      </aside>
    </ActionForm>
  );
}
