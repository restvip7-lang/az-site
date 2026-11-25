"use client";
// Object editor: a developer's new-build project or a single listing. The fields are those of the AZPO
// catalogue (an object moved from azpo.ru shows every value it had there); field names match the server action.
import { useState } from "react";
import {
  OBJECT_DISTANCES, OBJECT_FEATURES, OBJECT_HEATING, OBJECT_LAYOUTS, OBJECT_TAGS, OBJECT_TYPES, OBJECT_VIEWS,
  withExtras, type DistanceKey, type FormState,
} from "@/lib/admin/forms";
import { ActionForm, PhotoField, Submit } from "./AdminUI";

export interface ObjectValues {
  id?: number;
  source?: string | null;
  published: boolean;
  is_project: boolean;
  title: string;
  developer: string;
  city: string;
  district: string;
  types: string[];
  layouts: string[];
  bed_min: string;
  bed_max: string;
  bathrooms: string;
  bathrooms_max: string;
  area: string;
  area_max: string;
  floor: string;
  floors: string;
  year: string;
  furnished: boolean;
  installments: string;
  price: string;
  price_max: string;
  currency: "EUR" | "USD";
  tags: string[];
  features: string[];
  views: string[];
  heating: string[];
  dist: Record<DistanceKey, { v: string; u: "m" | "km" }>;
  map_url: string;
  description: string;
  photos: string[];
}

export interface ObjectOptions {
  cities: { key: string; name: string; districts: { value: string; label: string }[] }[];
}

const label = (t: string) => (t === "Вторичное жилье" ? "Вторичное жильё" : t === "Охрана 24 7" ? "Охрана 24/7" : t.charAt(0).toUpperCase() + t.slice(1));

/** A group of on/off chips sending every checked value under one name. */
function Chips({ legend, name, vocab, values, hint }: { legend: string; name: string; vocab: string[]; values: string[]; hint?: string }) {
  return (
    <fieldset>
      <legend className="adm-label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {withExtras(vocab, values).map((t) => (
          <label key={t} className="adm-chip">
            <input type="checkbox" name={name} value={t} defaultChecked={values.includes(t)} className="peer sr-only" />
            <span className="peer-checked:bg-brand-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-sky">{label(t)}</span>
          </label>
        ))}
      </div>
      {hint && <span className="adm-hint">{hint}</span>}
    </fieldset>
  );
}

function Num({ name, label: text, value, placeholder, decimal }: { name: string; label: string; value: string; placeholder?: string; decimal?: boolean }) {
  return (
    <label>
      <span className="adm-label">{text}</span>
      <input name={name} inputMode={decimal ? "decimal" : "numeric"} defaultValue={value} placeholder={placeholder} className="adm-input tabular-nums" />
    </label>
  );
}

export default function ObjectForm({ action, values, options }: { action: (s: FormState, fd: FormData) => Promise<FormState>; values: ObjectValues; options: ObjectOptions }) {
  const [city, setCity] = useState(values.city || options.cities[0]?.key);
  const [isProject, setIsProject] = useState(values.is_project);
  const districts = options.cities.find((c) => c.key === city)?.districts ?? [];
  const known = districts.some((d) => d.value === values.district);
  const [district, setDistrict] = useState(values.district && !known ? "__other" : values.district);
  // "до" fields are for projects; a single object shows them only when it already has a value there.
  const range = (v: string) => isProject || Boolean(v);

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
            <label className="sm:col-span-2">
              <span className="adm-label">Застройщик</span>
              <input name="developer" defaultValue={values.developer} placeholder="Название компании" className="adm-input" />
            </label>
          </div>
          <Chips legend="Тип недвижимости" name="types" vocab={OBJECT_TYPES} values={values.types} hint="Можно выбрать несколько, например «Квартиры» и «Пентхаусы». Без типа объект не попадёт в разделы сайта по типам." />
        </section>

        <section className="adm-card space-y-5">
          <h2 className="adm-h2">Цена, планировки и площадь</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Num name="price" label={`Цена${isProject ? " от" : ""}`} value={values.price} placeholder="125 000" />
            {range(values.price_max) && <Num name="price_max" label="Цена до" value={values.price_max} />}
            <label>
              <span className="adm-label">Валюта</span>
              <select name="currency" defaultValue={values.currency} className="adm-input">
                <option value="EUR">€ евро</option>
                <option value="USD">$ доллары</option>
              </select>
            </label>
          </div>
          <p className="adm-hint -mt-2">Пустая цена — на сайте будет «Цена по запросу».</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Num name="bed_min" label={isProject ? "Спален от" : "Спален"} value={values.bed_min} placeholder="0 — студия" />
            {range(values.bed_max) && <Num name="bed_max" label="Спален до" value={values.bed_max} />}
            <Num name="bathrooms" label={isProject ? "Санузлов от" : "Санузлов"} value={values.bathrooms} />
            {range(values.bathrooms_max) && <Num name="bathrooms_max" label="Санузлов до" value={values.bathrooms_max} />}
            <Num name="area" label={`Площадь${isProject ? " от" : ""}, м²`} value={values.area} />
            {range(values.area_max) && <Num name="area_max" label="Площадь до, м²" value={values.area_max} />}
          </div>
          <Chips legend="Планировки" name="layouts" vocab={OBJECT_LAYOUTS} values={values.layouts} hint="Спальни + гостиные: 2+1 — две спальни и гостиная, 1+0 — студия. У новостройки отметьте все планировки комплекса." />
        </section>

        <section className="adm-card space-y-5">
          <h2 className="adm-h2">Дом и условия</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {(!isProject || values.floor) && <Num name="floor" label="Этаж" value={values.floor} />}
            <Num name="floors" label="Этажей в доме" value={values.floors} />
            <Num name="year" label="Год постройки или сдачи" value={values.year} placeholder="2026" />
            <label className="col-span-2 sm:col-span-3">
              <span className="adm-label">Рассрочка</span>
              <input name="installments" defaultValue={values.installments} placeholder="До 24 месяцев, первый взнос 50%" className="adm-input" />
            </label>
          </div>
          <label className="flex items-center gap-3">
            <input type="checkbox" name="furnished" defaultChecked={values.furnished} className="h-5 w-5 accent-brand-500" />
            <span className="font-bold text-ink">С мебелью</span>
          </label>
          <fieldset>
            <legend className="adm-label">Расстояния</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {OBJECT_DISTANCES.map(([k, text]) => (
                <div key={k} className="flex items-end gap-2">
                  <label className="flex-1">
                    <span className="adm-hint mb-1.5 mt-0">{text}</span>
                    <input name={`dist_${k}`} inputMode="decimal" defaultValue={values.dist[k].v} className="adm-input tabular-nums" />
                  </label>
                  <select name={`dist_${k}_unit`} defaultValue={values.dist[k].u} aria-label={`${text}: единица`} className="adm-input w-24">
                    <option value="m">м</option>
                    <option value="km">км</option>
                  </select>
                </div>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="adm-card space-y-6">
          <Chips legend="Метки (по ним объект попадает в подборки сайта)" name="tags" vocab={OBJECT_TAGS} values={values.tags} />
          <Chips legend="Инфраструктура" name="features" vocab={OBJECT_FEATURES} values={values.features} />
          <Chips legend="Вид из окон" name="views" vocab={OBJECT_VIEWS} values={values.views} />
          <Chips legend="Отопление и кондиционер" name="heating" vocab={OBJECT_HEATING} values={values.heating} />
        </section>

        <section className="adm-card space-y-5">
          <label className="block">
            <span className="adm-label">Описание</span>
            <textarea name="description" rows={10} defaultValue={values.description} className="adm-input leading-relaxed" placeholder="Расположение, инфраструктура комплекса, условия покупки. Каждый абзац с новой строки." />
          </label>
          <label className="block">
            <span className="adm-label">Ссылка на карту</span>
            <input name="map_url" type="url" defaultValue={values.map_url} placeholder="https://maps.app.goo.gl/…" className="adm-input" />
            <span className="adm-hint">Google или Яндекс Карты: на странице объекта будет кнопка «Район на карте».</span>
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
              <span className="text-sm text-slate-500">Без галочки объект сохраняется как черновик и пропадает с сайта.</span>
            </span>
          </label>
          <Submit className="w-full">{values.id ? "Сохранить изменения" : "Создать объект"}</Submit>
          <p className="adm-hint">После сохранения сайт обновляется в течение минуты.</p>
          {values.source && <p className="adm-hint">Перенесён из каталога {values.source}: дальше объект живёт только здесь, правки на старом сайте сюда не приходят.</p>}
        </div>
      </aside>
    </ActionForm>
  );
}
