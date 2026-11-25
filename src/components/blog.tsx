import Image from "next/image";
import Link from "next/link";
import { BLOG_CATEGORIES, CATEGORY_BY_SLUG, blogPath, readingMinutes } from "@/lib/blog";
import type { ArticleRow } from "@/lib/admin/articles";
import { MarkShapes } from "./ui";

/** Photos in our storage go through the image optimiser; anything else is shown as is. */
const optimisable = (src: string) =>
  src.startsWith("/") || /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\//.test(src) || src.startsWith("https://images.unsplash.com/photo-");

export function Cover({ src, alt, sizes, priority = false, className = "" }: { src: string; alt: string; sizes: string; priority?: boolean; className?: string }) {
  if (optimisable(src)) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} decoding="async" className={`absolute inset-0 h-full w-full object-cover ${className}`} />;
}

export const articleDate = (d: Date | null) =>
  d ? d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Istanbul" }) : "";

export function CategoryNav({ current }: { current?: string }) {
  const items: [string, string][] = [[blogPath(), "Все статьи"], ...BLOG_CATEGORIES.map((c): [string, string] => [blogPath(c.slug), c.name])];
  return (
    <nav aria-label="Разделы блога" className="mb-8">
      <ul className="flex flex-wrap gap-2 text-sm font-bold">
        {items.map(([href, label]) => {
          const active = current ? href === blogPath(current) : href === blogPath();
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined}
                className={`inline-block rounded-full px-4 py-2.5 ring-1 transition-[color,background-color,box-shadow] duration-200 ease-out ${active ? "bg-brand-500 text-white ring-brand-500" : "bg-white text-ink ring-brand-500/10 hover:text-brand-500 hover:ring-brand-500/40"}`}>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function ArticleCard({ a, big = false }: { a: ArticleRow; big?: boolean }) {
  const href = blogPath(a.category, a.slug);
  return (
    <article className={`reveal group relative flex flex-col overflow-hidden rounded-[28px_8px_28px_8px] bg-white shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] ${big ? "lg:col-span-2 lg:grid lg:grid-cols-[1.2fr_1fr]" : ""}`}>
      <div className={`relative overflow-hidden bg-sand ${big ? "aspect-[16/10] lg:aspect-auto lg:min-h-[340px]" : "aspect-[16/10]"}`}>
        {a.cover ? (
          <Cover src={a.cover} alt="" sizes={big ? "(min-width:1024px) 640px, 100vw" : "(min-width:1024px) 400px, (min-width:640px) 50vw, 100vw"} priority={big} className="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div aria-hidden className="hatch-light absolute inset-0 bg-brand-500"><MarkShapes light className="absolute -bottom-4 -right-6 w-48 opacity-70" /></div>
        )}
      </div>
      <div className={`flex flex-1 flex-col p-6 ${big ? "lg:p-10" : ""}`}>
        <p className="eyebrow text-brand-500">{CATEGORY_BY_SLUG[a.category]?.name}</p>
        <h2 className={`mt-3 text-balance font-black leading-tight tracking-tight text-ink ${big ? "text-2xl sm:text-3xl" : "text-lg"}`}>
          <Link href={href} className="after:absolute after:inset-0 group-hover:text-brand-500">{a.title}</Link>
        </h2>
        {a.excerpt && <p className={`mt-3 text-pretty text-sm leading-relaxed text-slate-600 ${big ? "sm:text-base" : "line-clamp-3"}`}>{a.excerpt}</p>}
        <p className="mt-auto pt-5 text-xs font-bold text-slate-500">{articleDate(a.published_at)} · {readingMinutes(a.body)} мин чтения</p>
      </div>
    </article>
  );
}

/** The district guide, offered on the catalogue page of that district. */
export function GuideTeaser({ a }: { a: ArticleRow }) {
  return (
    <section aria-label="Гид по району" className="group relative mt-16 grid overflow-hidden rounded-[36px_10px_36px_10px] bg-white shadow-[0_1px_2px_rgb(22_52_87/0.06),0_18px_40px_-30px_rgb(22_52_87/0.6)] sm:grid-cols-[minmax(0,2fr)_3fr]">
      <div className="relative aspect-[16/9] overflow-hidden bg-sand sm:aspect-auto sm:min-h-[220px]">
        {a.cover ? (
          <Cover src={a.cover} alt="" sizes="(min-width:640px) 480px, 100vw" className="transition-transform duration-500 ease-out group-hover:scale-[1.03]" />
        ) : (
          <div aria-hidden className="hatch-light absolute inset-0 bg-brand-500"><MarkShapes light className="absolute -bottom-4 -right-6 w-48 opacity-70" /></div>
        )}
      </div>
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <p className="eyebrow text-brand-500">Гид по району</p>
        <h2 className="mt-3 text-balance text-2xl font-black leading-tight tracking-tight text-ink sm:text-3xl">
          <Link href={blogPath(a.category, a.slug)} className="after:absolute after:inset-0 group-hover:text-brand-500">{a.title}</Link>
        </h2>
        {a.excerpt && <p className="mt-3 max-w-xl text-pretty leading-relaxed text-slate-600">{a.excerpt}</p>}
        <p className="mt-5 text-sm font-black text-brand-500">Плюсы, минусы, пляжи, транспорт · {readingMinutes(a.body)} мин чтения →</p>
      </div>
    </section>
  );
}
