import type { Metadata } from "next";
import { REVIEWS } from "@/lib/content";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import LeadForm from "@/components/LeadForm";
import { Breadcrumbs } from "@/components/catalog-blocks";

export const metadata: Metadata = {
  title: { absolute: "Отзывы клиентов AZPO Estate о покупке недвижимости в Турции" },
  description: "Отзывы покупателей недвижимости в Турции о работе AZPO Estate: подбор объекта, сделка, ВНЖ и сервис после покупки.",
  alternates: alternates(R.reviews),
};

// No Review / AggregateRating markup: these are reviews of the company published by the company itself
// ("self-serving reviews"), which Google does not show as stars and treats as against its guidelines.
// The reviews stay on the page as plain text.
const avg = REVIEWS.reduce((s, r) => s + r.rating, 0) / REVIEWS.length;

export default function Reviews() {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6">
      <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Отзывы", href: R.reviews }]} />
      <header className="mb-10 sm:mb-14">
        <p className="eyebrow text-brand-500">Отзывы клиентов</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-black leading-[1] tracking-[-0.04em] text-ink sm:text-6xl">Нам <span className="slant">доверяют</span></h1>
        <p className="mt-5 flex items-center gap-3 text-lg text-slate-600">
          <span className="text-2xl font-black tabular-nums text-ink">{avg.toFixed(1)}</span>
          <span className="tracking-widest text-[#f5b301]" role="img" aria-label={`Средняя оценка ${avg.toFixed(1)} из 5`}>★★★★★</span>
          <span className="tabular-nums">{REVIEWS.length} отзыва</span>
        </p>
      </header>

      <ul className="grid gap-5 sm:grid-cols-2">
        {REVIEWS.map((r, i) => (
          <li key={r.name} className="reveal">
            <figure className={`relative h-full overflow-hidden bg-white p-7 sm:p-9 ${i % 2 ? "rounded-[10px_36px_10px_36px]" : "rounded-[36px_10px_36px_10px]"}`}>
              <span aria-hidden className="absolute -right-2 -top-10 select-none text-[11rem] font-black leading-none text-sky/25">”</span>
              <div className="text-lg tracking-widest text-[#f5b301]" role="img" aria-label={`Оценка ${r.rating} из 5`}>{"★".repeat(r.rating)}</div>
              <blockquote className="relative mt-4 text-pretty text-lg leading-relaxed text-ink/85">{r.text}</blockquote>
              <figcaption className="mt-6 flex items-center gap-3 font-black text-ink">
                <span aria-hidden className="h-5 w-2 -skew-x-[20deg] bg-brand-500" />{r.name}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <section aria-labelledby="rv-form-h" className="mt-16 grid overflow-hidden rounded-[36px_10px_36px_10px] bg-brand-500 text-white lg:grid-cols-[1.2fr_1fr]">
        <div className="hatch-light p-6 sm:p-10">
          <h2 id="rv-form-h" className="text-balance text-2xl font-black tracking-tight sm:text-4xl">Станьте следующим довольным клиентом</h2>
          <p className="mt-3 max-w-lg text-pretty text-white/80">Расскажите о задаче: специалист AZPO пришлёт подборку и ответит на вопросы о покупке.</p>
        </div>
        <div className="bg-brand-700/40 p-6 sm:p-10"><LeadForm dark context="отзывы" /></div>
      </section>
    </div>
  );
}
