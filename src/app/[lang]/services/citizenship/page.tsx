import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LeadForm from "@/components/LeadForm";
import { Arrow, SectionHead } from "@/components/ui";
import { listingPath } from "@/lib/catalog";
import { alternates } from "@/lib/i18n";
import { R } from "@/lib/routes";
import { JsonLd } from "@/lib/site";
import { SERVICE_BY_SLUG, serviceLd } from "@/lib/services";
import { Breadcrumbs } from "@/components/catalog-blocks";

const FOR_CITIZENSHIP = listingPath({ deal: "sale", type: "apartments", feature: "citizenship" });

// Texts, photos and structure come from the azpo.ru citizenship page.
export const metadata: Metadata = {
  title: "Гражданство Турции за инвестиции в недвижимость",
  description: "Получите турецкое гражданство через инвестиции в недвижимость. Гарантированное получение вида на жительство и паспорта за 2 месяца.",
  alternates: alternates(R.service("citizenship")),
};

const ORBIT = [
  { t: "Получить паспорт?", href: "#form-consul", a: -62 },
  { t: "Инвестировать?", href: FOR_CITIZENSHIP, a: 64 },
  { t: "Купить недвижимость?", href: R.sale, a: 196 },
];

const EXPERT_POINTS = [
  "Мы предоставляем капитальную логистику",
  "Собственный юридический офис",
  "Ответственное управление недвижимостью",
  "Комплексное послепродажное обслуживание",
  "Более 3000 объектов в портфолио",
];

const GIVES = [
  { t: "Гражданство для всей семьи", d: "Гражданство предоставляется не только заявителю, но и его супругу/супруге, а также всем детям." },
  { t: "Образование", d: "Школы с обучением на трех языках и европейские университеты." },
  { t: "Полный доступ к турецкой банковской системе", d: "Карты, счета, переводы по всему миру без ограничений." },
  { t: "Медицина", d: "Доступ ко всем государственным услугам" },
  { t: "Защита инвестиций", d: "Право владения недвижимостью на уровне гражданина Турецкой Республики" },
  { t: "Визы в США и Великобританию", d: "Упрощенная процедура получения бизнес-виз" },
];

const WAYS = ["По праву наследования", "Натурализация через право собственности на недвижимость", "Заключение брака с гражданином Турецкой Республики"];
const INVEST = [
  "Покупка недвижимости на сумму $400,000",
  "Вклад от $500,000 на турецкий банковский счет",
  "Инвестиции в турецкий бизнес от $500,000",
  "Открытие собственного бизнеса в Турции с трудоустройством 50 граждан Турции",
  "Покупка государственных облигаций на сумму $500,000",
  "Покупка доли в инвестиционном фонде недвижимости или венчурном инвестиционном фонде стоимостью не менее $500,000",
];

const EXPERTS = [
  { n: "Хайри Йылдырым", r: "Директор Аланийского офиса", img: "/citizenship/hayri.webp", q: "Как директор по продажам, я уделяю особое внимание не только стратегически выгодным локациям и высокому инвестиционному потенциалу, но и возможностям быстрой перепродажи объектов недвижимости в будущем, чтобы наши клиенты могли уверенно вкладываться с максимальной выгодой" },
  { n: "Бахтияр Акиф", r: "Руководитель отдела продаж в Анталии", img: "/citizenship/bakhtiyar.webp", q: "Как менеджер отдела продаж в Анталии, я, Бахтияр Акиф, стремлюсь предложить нашим клиентам объекты с высоким инвестиционным потенциалом, которые не только соответствуют требованиям для получения гражданства, но и обеспечивают уверенность в выгодной перепродаже и стабильном доходе в будущем." },
  { n: "Елена Мирошник", r: "Эксперт по недвижимости", img: "/citizenship/elena.webp", q: "Я живу в Турции более 10 лет и буду рада познакомить вас со всеми преимуществами жизни в этой стране" },
  { n: "Джафер Дуран", r: "Директор по послепродажному обслуживанию", img: "/citizenship/jafer.webp", q: "Для меня главное — внимание к каждому клиенту. Моя цель — не просто продать, а заслужить доверие и рекомендации" },
  { n: "Наталья Юдакова", r: "Эксперт по недвижимости", img: "/citizenship/natalya.webp", q: "Мой подход строится на честности и индивидуальном подходе. Я готова поддерживать вас на каждом этапе, чтобы ваша инвестиция в недвижимость стала максимально выгодной и долгосрочной" },
];

const FAQ = [
  ["Как быстро можно получить гражданство Турции?", "Сроки получения гражданства Турции зависят от выбранного способа. Гражданство через инвестиции — это самый быстрый способ, процесс занимает примерно 8+ месяцев. Гражданство через натурализацию требует 5 лет непрерывного проживания в Турции. Гражданство по происхождению может занять до 2 лет. Гражданство через брак возможно спустя 3 года после заключения брака с гражданином Турции."],
  ["В чем разница между видом на жительство и гражданством?", "Вид на жительство предоставляет временное право на законное пребывание с ограниченными правами и требует периодического продления. Гражданство же дарует постоянный статус с полным набором прав и обязанностей гражданина Турции."],
  ["Нужно ли учить турецкий?", "В целом, да, для получения гражданства через натурализацию знание турецкого языка является обязательным требованием. Для получения гражданства через инвестиции это не является формальным требованием, хотя знание языка полезно для интеграции. Требования к знанию языка при получении гражданства по происхождению менее строгие."],
  ["Как члены семьи могут получить гражданство?", "Супруги и несовершеннолетние дети до 18 лет могут быть включены в процесс получения гражданства через инвестиции. Супруги граждан Турции могут подать заявку спустя 3 года брака. Дети, рожденные от граждан Турции, получают гражданство по праву рождения. Для остальных членов семьи существуют дополнительные требования для получения гражданства."],
  ["Можно ли купить несколько квартир на общую сумму $400,000?", "Да, покупка одной или нескольких квартир с общей стоимостью не менее $400,000 возможна для получения гражданства через инвестиции, желательно по одному контракту."],
  ["Как долго нужно жить в Турции, чтобы получить гражданство?", "Для получения гражданства через инвестиции обязательного срока проживания нет. Для гражданства через натурализацию требуется 5 лет непрерывного легального проживания."],
  ["Проверяется ли стоимость приобретаемой недвижимости?", "Да, стоимость недвижимости проверяется через обязательные отчеты оценщиков, которые затем рассматриваются турецким правительством."],
  ["Нужно ли отказываться от старого гражданства?", "Нет, Турция позволяет двойное гражданство, поэтому отказ от прежнего гражданства не требуется."],
  ["Могут ли родители владельца получить гражданство?", "Как правило, нет. Родители инвестора, получившего гражданство через инвестиции, не могут напрямую получить гражданство на основании этой инвестиции, однако они могут иметь право на получение вида на жительство."],
  ["Есть ли требования к приобретенной недвижимости?", "Да, недвижимость должна иметь минимальную стоимость 400 000 долларов США, быть приобретена у гражданина Турции или турецкого юридического лица, не иметь обременений и не использоваться ранее для получения гражданства через инвестиции. Также требуется обязательство не продавать недвижимость в течение трех лет."],
];

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

function Bullet() {
  return (
    <span aria-hidden className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-500/50">
      <span className="h-2 w-2 rounded-full bg-brand-500" />
    </span>
  );
}

export default function Citizenship() {
  return (
    <div className="overflow-x-clip">
      <JsonLd data={faqLd} />
      <JsonLd data={serviceLd({ ...SERVICE_BY_SLUG.citizenship, description: metadata.description as string }, R.service("citizenship"))} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <Breadcrumbs items={[{ name: "Главная", href: R.home }, { name: "Услуги", href: R.services }, { name: "Гражданство за инвестиции", href: R.service("citizenship") }]} />
      </div>

      {/* ───────────── Hero with orbiting earth ───────────── */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:pt-8">
        <div className="order-2 lg:order-1">
          <h1 className="text-5xl font-black leading-[0.95] tracking-[-0.045em] text-brand-500 sm:text-7xl lg:text-[5.6rem]">
            <span className="slant !px-[0.22em]">Турецкое</span>
            <br />
            <span className="font-light">гражданство</span>
          </h1>
          <p className="mt-8 max-w-xl text-xl font-black leading-snug text-brand-500 sm:text-2xl">
            Обезопасьте свои инвестиции в недвижимость, получив гражданство Турции.
          </p>
          <p className="mt-4 max-w-xl text-lg text-ink/75">
            Гарантия получения вида на жительство для инвесторов на период оформления гражданства. Опередите сроки, получите паспорт всего за 2 месяца.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={FOR_CITIZENSHIP} className="btn btn-primary">Объекты недвижимости <Arrow /></Link>
            <a href="#form-consul" className="btn btn-ghost">Получить консультацию</a>
          </div>
        </div>
        <div className="order-1 flex justify-center lg:order-2">
          <div className="group relative aspect-square w-[230px] [--r:108px] sm:w-[340px] sm:[--r:190px] lg:w-[440px] lg:[--r:240px]">
            <div className="absolute inset-0 animate-orbit group-hover:[animation-play-state:paused]">
              <Image src="/citizenship/earth.webp" alt="" fill priority sizes="(max-width: 640px) 230px, 440px" className="object-contain" />
              {ORBIT.map((o) => (
                <Link
                  key={o.t}
                  href={o.href}
                  className="absolute left-1/2 top-1/2"
                  style={{ transform: `translate(-50%, -50%) rotate(${o.a}deg) translateY(calc(var(--r) * -1)) rotate(${-o.a}deg)` }}
                >
                  <span className="glass block animate-orbit-rev whitespace-nowrap rounded-full bg-white/80 px-4 py-2 text-sm font-black text-ink shadow-[0_10px_30px_-12px_rgb(22_52_87/0.5)] ring-1 ring-white transition-colors hover:bg-sky group-hover:[animation-play-state:paused] sm:px-5 sm:py-3 sm:text-lg">
                    {o.t}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────── Expert selection ───────────── */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 pt-20 sm:px-6 lg:grid-cols-2 lg:pt-28" aria-labelledby="expert-selection">
        <div>
          <h2 id="expert-selection" className="text-[2rem] font-black leading-[1.02] tracking-[-0.03em] text-brand-500 sm:text-5xl">
            Экспертный подбор <span className="slant">недвижимости</span>
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-ink/80">
            Мы не риэлторы, мы брокеры, обладающие глубокой экспертизой в области данных и аналитики. В мире инвестиций всегда есть те, кто выигрывает, и те, кто теряет. Мы предлагаем только те объекты, в которые верим сами и которые обладают реальным инвестиционным потенциалом.
          </p>
          <hr className="my-8 border-brand-500/60" />
          <ul className="relative space-y-4 pl-12">
            <li aria-hidden className="absolute bottom-0 left-0 top-0 flex w-8 flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-slate-400"><path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5" /></svg>
              <span className="w-0 flex-1 border-l-2 border-dashed border-brand-500" />
            </li>
            {EXPERT_POINTS.map((p) => (
              <li key={p} className="reveal text-lg font-bold text-brand-500 sm:text-xl">{p}</li>
            ))}
          </ul>
        </div>
        <div className="relative mx-auto w-full max-w-[540px]">
          <Image src="/citizenship/expert-selection.webp" alt="Экспертный подбор недвижимости" width={1200} height={1281} sizes="(max-width: 1024px) 90vw, 540px" className="hidden h-auto w-full lg:block" />
          <Image src="/citizenship/expert-selection-phone.webp" alt="Экспертный подбор недвижимости" width={900} height={1095} sizes="90vw" className="h-auto w-full lg:hidden" />
        </div>
      </section>

      {/* ───────────── What citizenship gives ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:pt-32">
        <h2 className="text-center text-[2rem] font-black leading-[1.05] tracking-[-0.03em] text-brand-500 sm:text-5xl lg:text-right">
          Что дает турецкое <span className="slant">гражданство</span>
        </h2>
        <div className="mt-12 grid items-center gap-4 lg:grid-cols-[1fr_1.15fr_1fr] lg:gap-6">
          <div className="order-2 grid gap-4 lg:order-1">
            {GIVES.slice(0, 3).map((g) => <GiveCard key={g.t} {...g} />)}
          </div>
          <div className="relative order-1 mx-auto aspect-[1400/966] w-full max-w-[560px] lg:order-2">
            <Image src="/citizenship/azpo-sign.webp" alt="" fill sizes="(max-width: 1024px) 90vw, 480px" className="object-contain" />
            <div className="absolute bottom-0 left-1/2 aspect-[900/1196] w-[52%] -translate-x-1/2">
              <Image src="/citizenship/support-woman.webp" alt="Специалист AZPO по гражданству" fill sizes="(max-width: 1024px) 50vw, 260px" className="object-contain object-bottom" />
            </div>
          </div>
          <div className="order-3 grid gap-4">
            {GIVES.slice(3).map((g) => <GiveCard key={g.t} {...g} />)}
          </div>
        </div>
      </section>

      {/* ───────────── Ways to get citizenship ───────────── */}
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pt-24 sm:px-6 lg:grid-cols-[7fr_5fr] lg:pt-32">
        <div className="grid gap-5">
          <div className="hatch rounded-[36px_10px_36px_10px] bg-white/80 p-6 sm:p-8">
            <h3 className="text-xl font-black text-ink sm:text-2xl">Как получить гражданство Турции?</h3>
            <ul className="mt-5 space-y-3 text-ink/85">
              {WAYS.map((w) => <li key={w} className="flex gap-3"><Bullet />{w}</li>)}
            </ul>
          </div>
          <div className="rounded-[10px_36px_10px_36px] bg-brand-500 p-6 text-white sm:p-8">
            <h3 className="text-xl font-black sm:text-2xl">Гражданство через инвестиции</h3>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {INVEST.map((w, i) => (
                <li key={w} className={`flex gap-3 rounded-[18px_6px_18px_6px] p-3 ${i === 0 ? "bg-sky text-ink" : "bg-white/10"}`}>
                  <span className="text-sm font-black tabular-nums opacity-70">0{i + 1}</span>
                  <span className="font-bold leading-snug">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="relative mx-auto aspect-[1200/1171] w-full max-w-[480px]">
          <Image src="/citizenship/azpo-reflex.webp" alt="" fill sizes="(max-width: 1024px) 90vw, 480px" className="object-contain" />
          <div className="absolute left-1/2 top-[48%] aspect-[900/1108] w-[78%] -translate-x-1/2 -translate-y-1/2">
            <Image src="/citizenship/support-man.webp" alt="Консультант AZPO" fill sizes="(max-width: 1024px) 70vw, 380px" className="object-contain" />
          </div>
        </div>
      </section>

      {/* ───────────── Expert opinion ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:pt-32">
        <SectionHead title="Мнение эксперта" />
        <div className="grid gap-8 lg:gap-6">
          {EXPERTS.map((e, i) => (
            <figure key={e.n} className={`reveal flex flex-col items-center lg:items-center ${i % 2 ? "lg:flex-row-reverse" : "lg:flex-row"}`}>
              <div className="relative z-10 shrink-0 rounded-full border-4 border-dashed border-brand-500/50 p-2 sm:p-3">
                <div className="relative h-40 w-40 overflow-hidden rounded-full bg-brand-500/25 sm:h-52 sm:w-52 lg:h-60 lg:w-60">
                  <Image src={e.img} alt={e.n} fill sizes="240px" className="object-cover object-top" />
                </div>
              </div>
              <div className={`-mt-6 flex w-full flex-col gap-4 bg-gradient-to-r from-brand-200 to-sand p-6 sm:flex-row sm:items-center lg:mt-0 lg:py-8 ${i % 2 ? "rounded-[36px] lg:-mr-10 lg:rounded-r-none lg:bg-gradient-to-l lg:pl-10 lg:pr-16" : "rounded-[36px] lg:-ml-10 lg:rounded-l-none lg:pl-16"}`}>
                <figcaption className="shrink-0 text-brand-500 sm:w-56">
                  <b className="block text-xl font-black">{e.n}</b>
                  <span className="text-sm font-bold">{e.r}</span>
                </figcaption>
                <span aria-hidden className="hidden h-16 w-0.5 shrink-0 bg-brand-500 sm:block" />
                <blockquote className="text-brand-500/90 sm:text-lg">
                  <span aria-hidden className="mr-1 text-3xl font-black leading-none text-brand-500">“</span>
                  {e.q}
                </blockquote>
              </div>
            </figure>
          ))}
        </div>
      </section>

      {/* ───────────── FAQ ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:pt-32">
        <SectionHead title="Вопросы и ответы" />
        <div className="grid items-start gap-4 lg:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group rounded-[28px_8px_28px_8px] bg-white p-5 ring-1 ring-brand-500/10 open:ring-brand-500/40 sm:p-6">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 font-black text-ink [&::-webkit-details-marker]:hidden">
                {q}
                <span aria-hidden className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px_3px_10px_3px] bg-brand-500 text-white transition-[rotate,background-color,color] duration-200 ease-out group-open:rotate-45 group-open:bg-sky group-open:text-ink">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </span>
              </summary>
              <p className="mt-4 leading-relaxed text-ink/75">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ───────────── Consultation form ───────────── */}
      <section id="form-consul" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6 lg:pt-32">
        <SectionHead title="Оставить заявку на консультацию" align="right" />
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="order-2 rounded-[36px_10px_36px_10px] bg-white p-6 sm:p-10 lg:order-1">
            <p className="mb-6 text-xl font-black text-brand-500">Напишите нам удобным для вас способом</p>
            <LeadForm context="гражданство Турции" />
          </div>
          <div className="relative order-1 mx-auto aspect-square w-full max-w-[440px] lg:order-2">
            <Image src="/citizenship/form.webp" alt="" fill sizes="(max-width: 1024px) 90vw, 440px" className="object-contain" />
            <p className="glass absolute left-0 top-6 rounded-full bg-white/75 px-4 py-2.5 text-sm font-black text-ink ring-1 ring-white sm:text-base">Не нашли ответ на ваш вопрос?</p>
            <p className="glass absolute right-0 top-1/2 max-w-[15rem] -translate-y-1/2 rounded-[22px] bg-white/75 px-4 py-2.5 text-sm font-black text-ink ring-1 ring-white sm:text-base">Наши специалисты ответят на все ваши вопросы</p>
            <a href="#form-consul" className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-500 px-5 py-2.5 text-sm font-black text-white sm:text-base">Оставить заявку на консультацию</a>
          </div>
        </div>
      </section>
    </div>
  );
}

function GiveCard({ t, d }: { t: string; d: string }) {
  return (
    <div className="reveal rounded-[28px_8px_28px_8px] bg-white/80 p-5 ring-1 ring-white backdrop-blur">
      <h3 className="font-black text-brand-500 sm:text-lg">{t}</h3>
      <p className="mt-1 text-ink/80">{d}</p>
    </div>
  );
}
