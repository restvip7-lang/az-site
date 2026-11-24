import type { Metadata } from "next";
import Image from "next/image";
import { SectionHead } from "@/components/ui";
import { CONTACTS } from "@/lib/api";

// Texts, photos and structure come from azpo.ru/about: about the company, branches, team.
export const metadata: Metadata = {
  title: "О компании Azpo",
  description: "Azpo — ваш надежный партнер в сфере недвижимости. Узнайте о нашей компании, команде профессионалов и офисах в Алании, Анталии и Стамбуле.",
  alternates: { canonical: "/about" },
  openGraph: { images: ["/img/about/cover.webp"] },
};

const OFFICE = ["p1", "p3", "p2", "p5", "p4", "p6"].map((n) => `/img/about/office/${n}.webp`);
const GALLERY = ["p1", "armn-1", "p2", "armn-2", "p-4", "armn-3", "p3", "armn-4", "armn-5", "p-5", "armn-6", "armn-7", "armn-8", "p-6", "armn-9", "armn-10", "armn-11", "armn-12"].map((n) => `/img/about/gallery/${n}.webp`);

const BRANCHES = [
  {
    id: "istanbul",
    title: "Филиал в Стамбуле",
    desc: "Стамбул: город, в котором сочетаются история, культура и стремительное развитие. Благодаря своему стратегическому положению и богатому архитектурному наследию, он открывает широкие перспективы для инвестиций в недвижимость. Специалисты Azpo подберут для Вас идеальный объект — от стильных апартаментов в центре до уникальных исторических резиденций. Мы поможем Вам раскрыть весь инвестиционный потенциал этого яркого мегаполиса.",
    address: "Kayabaşı Mahallesi, Adnan Menderes Bulvarı, No: 5/A, Blok: B3, Kat: 2, Daire: 12. Başakşehir/Istanbul",
    map: "https://maps.app.goo.gl/D1cz5L6KG3MvNjZJ9",
    mapImg: "/img/about/maps/istanbulmap.webp",
    photos: [5, 9, 16, 2, 3, 4, 6, 7, 8, 10, 11, 12, 1, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25].map((n) => `/img/about/branch/istanbul/armn-${n}.webp`),
  },
  {
    id: "antalya",
    title: "Филиал в Анталии",
    desc: "Анталия: жемчужина Средиземноморья с живописной береговой линией, мягким климатом и особой атмосферой уюта. Этот регион гармонично сочетает комфорт курортной жизни с широкими возможностями для выгодных инвестиций в недвижимость. Офис Azpo в Анталии поможет Вам подобрать оптимальный объект, полностью соответствующий Вашим ожиданиям и целям.",
    address: "Fener mahallesi Bülent Ecevit Bulvarı Özdemir Plaza № 42/1, 07230 Muratpaşa/Antalya",
    map: "https://maps.app.goo.gl/uEwvNmATVzCg7hXm6",
    mapImg: "/img/about/maps/antalyamap.webp",
    photos: [14, 9, 1, 4, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15].map((n) => `/img/about/branch/antalya/antalya-${n}.webp`),
  },
  {
    id: "alanya",
    title: "Филиал в Алании",
    desc: "Аланья: известная своим тёплым климатом и высоким качеством жизни, является настоящим магнитом для инвестиций в недвижимость. Наша команда гарантирует, что Вы получите доступ к самым лучшим объектам недвижимости, которые может предложить этот прекрасный регион.",
    address: "Cumhuriyet Mahallesi Keykubat Bulvarı 270A/14 Alanya/Antalya",
    map: "https://maps.app.goo.gl/dGDjgEvqdE6rVY8C8",
    mapImg: "/img/about/maps/alanyamap.webp",
    photos: [15, 3, 1, 13, 16, 17, 14].map((n) => `/img/about/branch/alanya/${n}.webp`),
  },
];

const TEAM = [
  ["Расул Чечен", "Владелец компании", "resul"],
  ["Шуле Гюнал", "Бухгалтер", "sule"],
  ["Наталия Юдакова", "Эксперт по недвижимости", "nataliya-yudakova"],
  ["Хайри Йылдырым", "Директор Аланийского офиса", "hayri-yildirim"],
  ["Ирина Кулагина", "Отдел социальных сетей", "irina-kulagina"],
  ["Рамазан Илькджан Шенсой", "Бухгалтер", "ramazan"],
  ["Умут Гюнал", "Координатор объектов", "umut"],
  ["Хюсейн Джанданай", "Координатор объектов", "hcanada"],
  ["Елена Гечер", "Эксперт по недвижимости", "elena-gecher"],
  ["Мехмет Наструла", "Водитель", "mehmet-nastrulla"],
  ["Эрхан Гюнал", "Менеджер по логистике", "erhan-gunal"],
  ["Джафер Дуран", "Специалист по послепродажному обслуживанию", "cafer-duran"],
  ["Андрей Касимов", "Видеооператор", "andrey-kasimov"],
  ["Асель Усманова", "Отдел аренды", "usmanova-asel"],
  ["Абдулла Дурсун", "Водитель", "abdullah-dursun"],
  ["Бахтияр Акиф", "Руководитель отдела продаж в Анталии", "bahtiyar-akif"],
  ["Гульнара Кая", "Эксперт по недвижимости", "gulnara-kaya"],
  ["Григорий Лазарев", "Эксперт по недвижимости", "grigory-lazarev"],
  ["Муслим Шаруддин", "Директор офиса в Анталии", "muslim"],
  ["Магомед Оздомиров", "Экономист", "magomed-ozdomirov"],
  ["Эмре Айдын", "Координатор объектов", "ogu"],
  ["Огузхан Каймакчы", "Координатор объектов", "empty"],
  ["Иса Той", "Бухгалтер", "isa"],
];

const TABS = [["#company", "О компании"], ["#branches", "Наши отделения"], ["#team", "Наша команда"]];

export default function About() {
  return (
    <div className="overflow-x-clip">
      {/* ───────────── Hero ───────────── */}
      <section className="px-2 pt-3 sm:px-4">
        <div className="relative isolate mx-auto flex min-h-[460px] max-w-[1600px] flex-col justify-end overflow-hidden rounded-[40px_12px_40px_12px] bg-brand-900 sm:min-h-[620px] lg:rounded-[88px_16px_88px_16px]">
          <Image src="/img/about/cover.webp" alt="Команда AZPO Estate" fill priority sizes="100vw" className="-z-20 object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/10" />
          <div aria-hidden className="absolute -bottom-2 right-[8%] -z-10 hidden h-[45%] w-[9%] -skew-x-[14deg] bg-gradient-to-b from-brand-500 to-brand-700 opacity-90 lg:block" />
          <div aria-hidden className="absolute -bottom-2 right-[2%] -z-10 hidden h-[22%] w-[7%] skew-x-[14deg] bg-gradient-to-b from-brand-200 to-sand opacity-90 lg:block" />
          <div className="mx-auto w-full max-w-7xl px-5 pb-8 text-white sm:px-10 sm:pb-14">
            <p className="eyebrow animate-rise text-sky">AZPO Estate</p>
            <h1 className="mt-3 border-l-4 border-sky pl-4 text-5xl font-black leading-[0.95] tracking-[-0.045em] sm:text-7xl">
              О компании <span className="font-light">Azpo</span>
            </h1>
            <p className="mt-5 max-w-xl animate-rise text-lg text-white/85 [animation-delay:120ms] sm:text-2xl">Ваш путь к выгодным инвестициям и дому мечты</p>
          </div>
        </div>
      </section>

      {/* ───────────── Section tabs ───────────── */}
      <nav aria-label="Разделы страницы" className="sticky top-[80px] z-30 mx-auto mt-6 flex max-w-7xl justify-center px-4 sm:px-6">
        <ul className="no-scrollbar flex gap-1 overflow-x-auto rounded-full bg-white/90 p-1.5 shadow-[0_10px_30px_-18px_rgb(22_52_87/0.5)] ring-1 ring-brand-500/10 backdrop-blur">
          {TABS.map(([href, label]) => (
            <li key={href}>
              <a href={href} className="block whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-black sm:text-sm text-brand-500 transition hover:bg-brand-500 hover:text-white sm:px-6">{label}</a>
            </li>
          ))}
        </ul>
      </nav>

      {/* ───────────── About ───────────── */}
      <section id="company" className="mx-auto max-w-7xl scroll-mt-36 px-4 pt-16 sm:px-6 sm:pt-24">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
          <div>
            <SectionHead n="01" kicker="О компании" title={<>Более 25 лет на рынке <span className="slant">Турции</span></>} />
            <p className="text-lg leading-relaxed text-brand-500 sm:text-xl">
              Уже более 25 лет Azpo занимает лидирующие позиции на рынке недвижимости Турции, помогая тысячам клиентов приобретать дома мечты и делать прибыльные инвестиции. Выбирая Azpo, Вы доверяете не просто агентству — Вы становитесь партнёром команды, которая делает всё, чтобы Ваш путь к недвижимости был комфортным, безопасным и успешным.
            </p>
            <p className="mt-5 leading-relaxed text-ink/75">
              Мы понимаем, что покупка недвижимости — это важный этап в жизни, и стремимся сделать этот процесс максимально простым. От первого обращения и просмотров объектов до переговоров и оформления документов, мы сопровождаем Вас на каждом этапе, предоставляя поддержку и профессиональные рекомендации.
            </p>
          </div>
          <div className="grid grid-cols-6 grid-rows-[repeat(4,92px)] gap-2 sm:grid-rows-[repeat(4,120px)] sm:gap-3">
            {OFFICE.slice(0, 4).map((src, i) => (
              <div key={src} className={`relative overflow-hidden ${["col-span-4 row-span-2 rounded-[30px_8px_8px_8px]", "col-span-2 row-span-2 rounded-[8px_8px_30px_8px]", "col-span-2 row-span-2 rounded-[8px_8px_8px_30px]", "col-span-4 row-span-2 rounded-[8px_8px_30px_8px]"][i]}`}>
                <Image src={src} alt="Офис AZPO" fill sizes="(max-width: 1024px) 60vw, 420px" className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────── Video ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead n="02" kicker="Вводное видео о Azpo" title={<>Этапы приобретения <span className="slant">недвижимости</span></>} align="right" />
        {/* The intro video file is missing on api.azpo.ru (azpo.ru shows an empty player), so the block leads to the AZPO YouTube channel. */}
        <a href={CONTACTS.youtube} target="_blank" rel="noopener" className="group relative block aspect-video overflow-hidden rounded-[40px_12px_40px_12px] bg-ink lg:rounded-[72px_14px_72px_14px]">
          <Image src="/img/about/video.webp" alt="Видео о компании AZPO" fill sizes="(max-width: 1280px) 100vw, 1232px" className="object-cover transition duration-700 group-hover:scale-[1.03]" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
          <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-[26px_8px_26px_8px] bg-white text-brand-500 shadow-2xl transition group-hover:bg-sky group-hover:text-ink sm:h-24 sm:w-24">
            <svg viewBox="0 0 24 24" width="34" height="34" fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
          </span>
          <span className="absolute bottom-5 left-6 font-black text-white sm:bottom-8 sm:left-10 sm:text-xl">Смотреть видео на YouTube-канале AZPO</span>
        </a>
      </section>

      {/* ───────────── Why AZPO ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead n="03" kicker="Наши ценности" title={<>Зачем работать с <span className="slant">Azpo Estate</span>?</>} />
        <div className="relative pr-0 lg:pr-48">
          <div aria-hidden className="absolute bottom-0 right-16 hidden h-full w-28 -skew-x-[20deg] rounded-[40px_0_40px_0] bg-brand-500 lg:block" />
          <div aria-hidden className="absolute bottom-0 right-0 hidden h-1/2 w-24 skew-x-[15deg] rounded-[0_20px_0_20px] bg-sky lg:block" />
          <p className="hatch-light relative z-10 rounded-[60px_10px_60px_10px] bg-brand-500 p-8 text-lg font-bold leading-relaxed text-white sm:p-12 sm:text-xl lg:rounded-[70px_10px_70px_10px]">
            Доверие и прозрачность — основа нашей работы. Эти ценности лежат в её фундаменте. Мы придерживаемся чёткой коммуникации и профессионального сопровождения на каждом этапе сделки, гарантируя безопасность, юридическую чистоту и отсутствие лишних волнений. Наша главная цель — чтобы Вы чувствовали уверенность в каждом Своём решении. В агентстве недвижимости AZPO мы создаём для Вас комфортный и надёжный путь к успешной сделке. Позвольте нам помочь Вам найти идеальный объект и выгодно инвестировать в динамично развивающийся рынок недвижимости Турции!
          </p>
        </div>
      </section>

      {/* ───────────── Gallery ───────────── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead n="04" kicker="Azpo галерея" title={<>Наши <span className="slant">офисы</span> изнутри</>} align="right" />
        <div className="columns-2 gap-2 sm:gap-3 lg:columns-3">
          {GALLERY.map((src, i) => (
            <div key={src} className={`reveal relative mb-2 break-inside-avoid overflow-hidden sm:mb-3 ${i % 2 ? "rounded-[8px_24px_8px_24px]" : "rounded-[24px_8px_24px_8px]"} ${i % 3 === 0 ? "aspect-[3/4]" : "aspect-[4/3]"}`}>
              <Image src={src} alt="Офис AZPO" fill sizes="(max-width: 1024px) 50vw, 400px" className="object-cover transition duration-700 hover:scale-105" />
            </div>
          ))}
        </div>
      </section>

      {/* ───────────── Branches ───────────── */}
      <section id="branches" className="mx-auto max-w-7xl scroll-mt-36 px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead
          n="05"
          kicker="Наши отделения"
          title={<>Три офиса на <span className="slant">побережье</span> и в Стамбуле</>}
          sub="Наши обязательства не заканчиваются после покупки недвижимости. Мы предоставляем широкий спектр послепродажных услуг, включая управление недвижимостью, координацию ремонта и помощь с юридическими документами. В Azpo мы не просто продаём квартиры — мы строим долгосрочные отношения, основанные на доверии, внимании к деталям и искренней заботе о Ваших интересах."
        />
        <div className="grid gap-10 sm:gap-14">
          {BRANCHES.map((b, i) => (
            <article key={b.id} id={b.id} className="reveal scroll-mt-36 overflow-hidden rounded-[36px_10px_36px_10px] bg-white">
              <div className={`grid lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="p-6 sm:p-10">
                  <p className="eyebrow text-brand-500/70">0{i + 1} / 03</p>
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-ink sm:text-4xl">{b.title}</h3>
                  <p className="mt-4 leading-relaxed text-ink/75">{b.desc}</p>
                  <dl className="mt-6 space-y-3 text-sm">
                    <div>
                      <dt className="eyebrow text-brand-500/70">Адрес</dt>
                      <dd className="mt-1 font-bold text-ink">{b.address}</dd>
                    </div>
                    <div>
                      <dt className="eyebrow text-brand-500/70">Телефон</dt>
                      <dd className="mt-1"><a href="tel:+905455550555" className="font-black tabular-nums text-brand-500">+90 545 555 0 555</a></dd>
                    </div>
                  </dl>
                  <a href={b.map} target="_blank" rel="noopener" className="btn btn-primary mt-6">Открыть на карте</a>
                </div>
                <a href={b.map} target="_blank" rel="noopener" aria-label={`${b.title} на карте`} className="relative block min-h-[240px] bg-brand-100">
                  <Image src={b.mapImg} alt="" fill sizes="(max-width: 1024px) 100vw, 640px" className="object-cover" />
                </a>
              </div>
              <ul className="no-scrollbar flex snap-x gap-2 overflow-x-auto p-2" aria-label={`Фото: ${b.title}`}>
                {b.photos.map((src) => (
                  <li key={src} className="relative aspect-[4/3] w-60 shrink-0 snap-start overflow-hidden rounded-[18px_6px_18px_6px] sm:w-72">
                    <Image src={src} alt={b.title} fill sizes="288px" className="object-cover" />
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      {/* ───────────── Team ───────────── */}
      <section id="team" className="mx-auto max-w-7xl scroll-mt-36 px-4 pt-20 sm:px-6 sm:pt-28">
        <SectionHead
          n="06"
          kicker="Наша команда"
          title={<>Люди, которые <span className="slant">ведут</span> вашу сделку</>}
          align="right"
          sub="Доверие и прозрачность — основа нашего бизнеса. Выбирая Azpo, Вы сотрудничаете с командой, которая ставит Ваши интересы на первое место. Мы здесь, чтобы помочь Вам принимать взвешенные решения, делать ценные инвестиции и достигать Ваших целей."
        />
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {TEAM.map(([name, role, img], i) => (
            <li key={img} className="reveal group">
              <div className={`relative aspect-[4/5] overflow-hidden bg-brand-100 ${i % 2 ? "rounded-[8px_28px_8px_28px]" : "rounded-[28px_8px_28px_8px]"}`}>
                <Image src={`/img/about/team/${img}.webp`} alt={name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px" className="object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-brand-900/80 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
              <p className="mt-3 flex items-start gap-2 font-black leading-tight text-ink">
                <span aria-hidden className="mt-0.5 h-4 w-1.5 shrink-0 -skew-x-[20deg] bg-sky" />{name}
              </p>
              <p className="mt-1 pl-3.5 text-sm text-slate-600">{role}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
