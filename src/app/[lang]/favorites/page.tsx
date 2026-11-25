import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllProperties, getPropertyDetails, toCard, type Property } from "@/lib/api";
import { listingPath } from "@/lib/catalog";
import { formatPrice, objects } from "@/lib/format";
import { cityName, districtName } from "@/lib/geo";
import { cardPath, objectName, roomsLabel } from "@/lib/paths";
import { R } from "@/lib/routes";
import PropertyCard from "@/components/PropertyCard";
import { Breadcrumbs } from "@/components/catalog-blocks";
import { FavActions, FavCompare, FavEmptyGate, FavSync, type CmpItem } from "@/components/FavTools";

export const metadata: Metadata = {
  title: { absolute: "Избранное | AZPO Estate" },
  description: "Сохранённые объекты: сравнение по цене, площади и расстоянию до моря, отправка подборки специалисту AZPO.",
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const parseIds = (v: unknown) =>
  [...new Set(String(v ?? "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 30);

const FEATURE_TAGS: [string, string][] = [
  ["Первая линия", "первая линия"], ["Вид на море", "вид на море"], ["Под Гражданство", "под гражданство"], ["Под ВНЖ", "под ВНЖ"],
  ["Новостройка", "новостройка"], ["Вторичное жилье", "вторичное жильё"], ["От застройщика", "от застройщика"],
];

/** "450 м" / "1.2 км" → metres, for "closest is best". */
function metres(v: string | null) {
  const m = v && /([\d.,]+)\s*(км|м)/i.exec(v);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) ? Math.round(m[2].toLowerCase() === "км" ? n * 1000 : n) : null;
}

const ROWS: { label: string; best?: "min" | "max" }[] = [
  { label: "Цена", best: "min" },
  { label: "Цена за м²", best: "min" },
  { label: "Район" },
  { label: "Тип" },
  { label: "Планировка" },
  { label: "Площадь", best: "max" },
  { label: "Санузлы" },
  { label: "Этажность" },
  { label: "Год сдачи" },
  { label: "До моря", best: "min" },
  { label: "До аэропорта", best: "min" },
  { label: "Мебель" },
  { label: "Особенности" },
];

export default async function Favorites({ searchParams }: Props) {
  const sp = await searchParams;
  const ids = parseIds(sp.ids);
  // A link without my=1 is a selection somebody sent: it is shown as is and can be saved.
  const shared = ids.length > 0 && sp.my !== "1";
  const all = await getAllProperties();
  const byId = new Map(all.map((p) => [p.id, p]));
  const list = ids.map((id) => byId.get(id)).filter((p): p is Property => Boolean(p));
  const gone = ids.length - list.length;

  const h1 = shared ? (list.length ? `Подборка: ${objects(list.length)}` : "Подборка") : list.length ? `Избранное · ${list.length}` : "Избранное";
  const crumbs = [{ name: "Главная", href: R.home }, { name: "Избранное", href: R.favorites }];

  if (!list.length) {
    const fresh = all.filter((p) => !p.isProject && p.images.length).slice(0, 3).map((p) => toCard(p));
    return (
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
        {!shared && <FavSync current="" />}
        <Breadcrumbs items={crumbs} />
        <h1 className="text-balance text-[2rem] font-black leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl">{h1}</h1>
        <div className="mt-8">
          <FavEmptyGate wait={!shared}>
            <div className="rounded-[28px_8px_28px_8px] bg-white p-6 sm:p-8">
              <p className="text-xl font-black text-ink">{shared ? "Объекты из подборки больше не продаются" : "В избранном пока пусто"}</p>
              <p className="mt-2 max-w-xl text-pretty text-slate-600">Нажимайте ♡ на карточках объектов: они появятся здесь, их можно будет сравнить и отправить специалисту AZPO одной ссылкой.</p>
              <Link href={R.sale} className="btn btn-primary mt-5">Перейти в каталог</Link>
            </div>
            {fresh.length > 0 && (
              <section aria-labelledby="fresh-h" className="mt-12">
                <h2 id="fresh-h" className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                  <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />Начните с этих объектов
                </h2>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{fresh.map((p) => <PropertyCard key={p.id} p={p} />)}</div>
              </section>
            )}
          </FavEmptyGate>
        </div>
      </div>
    );
  }

  const details = await Promise.all(list.map((p) => getPropertyDetails(p.id)));
  const items: CmpItem[] = list.map((p, i) => {
    const d = details[i];
    const fact = (label: string) => d?.facts.find(([k]) => k === label)?.[1] ?? null;
    const pm = p.priceEur && p.area && !p.priceMax ? Math.round(p.priceEur / p.area) : null;
    const where = p.districtSlug ? districtName(p.districtSlug, p.district) : cityName(p.city);
    const tags = FEATURE_TAGS.filter(([t]) => p.tags.includes(t)).map(([, l]) => l);
    const sea = fact("До моря"), air = fact("До аэропорта");
    return {
      id: p.id,
      chip: `ID ${p.id} · ${[roomsLabel(p), where].filter(Boolean).join(", ")}`,
      head: (
        <>
          <Link href={cardPath(p)} className="group block">
            <span className="relative block aspect-[4/3] overflow-hidden rounded-[18px_6px_18px_6px] bg-brand-100">
              {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="240px" className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]" />}
            </span>
            <span className="mt-3 line-clamp-2 block text-pretty font-black leading-snug text-ink group-hover:text-brand-500">{p.title}</span>
          </Link>
          <span className="mt-1 block text-xs font-bold tabular-nums text-slate-500">ID {p.id}</span>
        </>
      ),
      cells: [
        <>{p.priceMax ? "от " : ""}{formatPrice(p.price, p.currency)}</>,
        pm ? `${pm.toLocaleString("ru-RU")} €` : "—",
        <Link key="d" href={listingPath({ city: p.city, district: p.districtSlug ?? undefined })} className="font-bold text-brand-500 underline decoration-brand-500/30 underline-offset-4 hover:decoration-brand-500">
          {p.districtSlug ? `${where}, ${cityName(p.city)}` : where}
        </Link>,
        p.types.join(", ") || (p.isProject ? "Новостройка" : "—"),
        roomsLabel(p) || "—",
        p.area ? `${p.priceMax ? "от " : ""}${p.area} м²` : "—",
        p.bathrooms ? String(p.bathrooms) : "—",
        fact("Этажность") ?? "—",
        fact("Год сдачи") ?? "—",
        sea ?? "—",
        air ?? "—",
        fact("Мебель") ?? "—",
        tags.length ? tags.join(", ") : "—",
      ],
      vals: [p.priceEur, pm, null, null, null, p.priceMax ? null : p.area, null, null, null, metres(sea), metres(air), null, null],
    };
  });

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      {!shared && <FavSync current={ids.join(",")} />}
      <Breadcrumbs items={crumbs} />
      <h1 className="text-balance text-[2rem] font-black leading-[1.05] tracking-[-0.035em] text-ink sm:text-5xl">{h1}</h1>
      <p className="mt-3 max-w-2xl text-pretty text-lg text-ink/75">
        {shared
          ? "Вам прислали подборку объектов AZPO. Сохраните её в своё избранное, чтобы вернуться позже, или обсудите со специалистом."
          : "Сравните объекты по цене, площади и расстоянию до моря и отправьте подборку специалисту AZPO одной ссылкой."}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FavActions items={list.map((p) => ({ id: p.id, name: objectName(p), href: cardPath(p) }))} shared={shared} />
        {gone > 0 && <p className="text-sm text-slate-500">{gone === 1 ? "Один объект уже снят с продажи." : `Объектов снято с продажи: ${gone}.`}</p>}
      </div>

      {items.length >= 2 && (
        <section id="compare" aria-labelledby="cmp-h" className="mt-10 scroll-mt-24">
          <h2 id="cmp-h" className="flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
            <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />Сравнение
          </h2>
          <p className="mt-2 text-sm text-slate-600">{items.length > 2 ? "Отметьте до 4 объектов. " : ""}Лучшее значение в строке выделено.</p>
          <div className="mt-4"><FavCompare key={ids.join(",")} items={items} rows={ROWS} shared={shared} /></div>
        </section>
      )}

      <section aria-labelledby="list-h" className="mt-12">
        <h2 id="list-h" className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight text-ink sm:text-3xl">
          <span aria-hidden className="h-6 w-1.5 -skew-x-[20deg] bg-sky" />{shared ? "Объекты подборки" : "Сохранённые объекты"}
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <PropertyCard key={p.id} p={toCard(p)} />)}</div>
        {items.length === 1 && <p className="mt-6 text-slate-600">Добавьте ещё хотя бы один объект, чтобы сравнить их рядом. <Link href={R.sale} className="font-bold text-brand-500 underline decoration-sky decoration-2 underline-offset-4">Каталог</Link></p>}
      </section>
    </div>
  );
}
