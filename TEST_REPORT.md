# Test Report — AZPO Estate

Дата: 28.11.2026, 11:55–12:10 UTC. Коммит: `b49a923`. Production-деплой: `dpl_7cC2DsKh83tMCNaKDFpFUJw1mM8D` (azpo-site.vercel.app).
Все результаты ниже получены реально; где проверки не было — **Not Tested**.

## Окружение

- Облачный контейнер: Node v22.23.5, `npm ci`, сборка и статический анализ. Сеть контейнера не достаёт azpo.ru, azpo.com, api.azpo.ru и azpo-site.vercel.app.
- Встроенный браузер Claude (Chromium) на компьютере пользователя: проверки живых сайтов через `fetch` + `DOMParser` на том же домене, вьюпорты 360/768/1280, консоль.
- PageSpeed Insights (pagespeed.web.dev), Lighthouse 13.6.0, Moto G Power / 4G и desktop.
- Vercel API: runtime errors за 7 дней, список деплоев.

## 1. Сборка и статический анализ

| Тест | Команда | Результат |
|---|---|---|
| Установка | `npm ci` | OK |
| Типы | `npx tsc --noEmit` | 0 ошибок |
| Линт | `npx eslint .` | 0 ошибок, 0 предупреждений |
| Production build | `AZPO_API_BASE=<пустой мок> npx next build` | exit 0; 40 маршрутов, First Load JS 103–123 kB, middleware 34,5 kB. При пустом API в логе «Failed to load properties: API returned no objects», но сборка не падает |
| Аудит зависимостей | `npm audit` | 1 high (postcss <8.5.x через next), 1 moderate (next). Фикс: next 16.4.6 (major) |
| Устаревшие пакеты | `npm outdated` | next 15.5.29 → 16.4.6, react 19.1.0 → 19.3.1, postgres 3.4.7 → 3.4.9 и др. |
| Автотесты | — | **тестов нет** (0 файлов `*.test.*`/`*.spec.*`, нет скрипта `test`, нет CI) |

## 2. Lighthouse / PageSpeed Insights

| URL | Форм-фактор | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|---|
| azpo-site.vercel.app/ru/ | mobile | 97 | 97 | 96 | 69 | 1,1 с | 2,6 с | 0 мс | 0 | 2,0 с |
| azpo-site.vercel.app/ru/ | desktop | 100 | 97 | 100 | 69 | 0,3 с | 0,8 с | 20 мс | 0 | 0,6 с |
| …/ru/turkey/alanya/ | mobile | 92 | 97 | 96 | 69 | 1,6 с | 2,8 с | 110 мс | 0 | 4,6 с |
| …/ru/turkey/antalya/konyaalti/sale/id1046/ | mobile | 86 | 97 | 96 | 69 | 1,1 с | 4,1 с | 40 мс | 0 | 3,7 с |
| azpo.ru/ru | mobile | 53 | 83 | 77 | 85 | 2,3 с | 17,1 с | 430 мс | 0,004 | 9,5 с |
| azpo.ru/ru | desktop | 70 | 83 | 77 | 85 | 0,4 с | 0,4 с | 670 мс | 0,003 | 2,2 с |
| azpo.ru/ru/property-turkey/1046 | mobile | 45 | 87 | 73 | 54 | 1,1 с | 7,3 с | 300 мс | 0,486 | 5,2 с |

Замечания Lighthouse (демо): блокирующие запросы ~530 мс (мобильный), «Улучшите загрузку изображений» 27–119 КиБ, устаревший JS 12 КиБ, недостаточный контраст, «одинаковые ссылки — одно назначение», «ошибки браузера в консоли» (моб.), CSP неэффективна против XSS, нет COOP, нет Trusted Types. SEO 69 — только `noindex` (намеренно).
Замечания Lighthouse (azpo.ru): кеш-политика (6 037 КиБ), изображения (4 211 КиБ), нет HSTS, нет защиты от кликджекинга, кнопки и ссылки без имени, ARIA-ошибки, нет валидного canonical и hreflang, карточка «недоступна для индексации».
Полевые данные CrUX: «Нет данных» для обоих сайтов. INP — **Not Tested**.

## 3. SEO-проверка страниц (fetch + DOMParser)

### Демо (25 URL)
Все страницы 200, кроме `/ru/nonexistent-xyz/` → 404. Каждая страница: один H1, canonical абсолютный на azpo-site.vercel.app, hreflang `ru` + `x-default`, `robots: noindex, follow` (режим демо), JSON-LD парсится без ошибок.
- Типы JSON-LD: главная `FAQPage, RealEstateAgent`; каталог `BreadcrumbList, ItemList, FAQPage, RealEstateAgent`; карточка `RealEstateListing, BreadcrumbList, RealEstateAgent`; гражданство `FAQPage, Service, BreadcrumbList`; отзывы `BreadcrumbList, RealEstateAgent ×2`.
- Редиректы: `/property-turkey/1046` и `/en/property-turkey/1046` → `/ru/turkey/antalya/konyaalti/sale/id1046/`; `/citizenship` → `/ru/services/citizenship/`; `/en/` → `/ru/`; `/admin/` → `/admin/login/` (X-Robots-Tag noindex).
- 404: статус верный, но `lang=""`, title главной, 0 ссылок навигации.
- robots.txt: `Disallow: /` (демо) + правила для фильтров/избранного/api/admin.
- sitemap.xml: индекс из 5 файлов, 1 978 URL (категории 1 051, объекты 668, комплексы 233, блог 16, статика 10), дублей 0, `<lastmod>` 0, hreflang-аннотации есть.

### azpo.ru и azpo.com (по 8–12 URL)
- canonical `//`, `//property-turkey`, `//about` (на «Гражданстве»), hreflang `x-default=// | en=// | ru=//`.
- `og:image` = `http://localhost:3000/og-image.jpg` / `azpo.png`.
- Карточки объектов: `noindex, nofollow` на 18 из 18 (id 44, 100, 300, 500, 700, 900, 1000, 1040, 1046 × RU/EN на azpo.ru; 1020 RU/EN на azpo.com).
- EN-карточки 1040 и 1046: пустой H1, title «Property Details».
- `/sitemap.xml` → 200 HTML; `/llms.txt`, `/manifest.json`, `/sitemap-index.xml` → 200 HTML (soft 404); `/ru/nonexistent-page-xyz` → 200.
- Блог `/ru/blog/`: WordPress, `lang="en-US"` на русском блоге, нет H1, meta description = ссылки YouTube.
- Заголовки ответа: только `cache-control`, `etag`, `server: nginx/1.29.4`, `x-powered-by: Next.js`; нет HSTS/CSP/XFO/nosniff.

## 4. Ссылки

- Демо: собраны все внутренние ссылки с 25 страниц — 268 уникальных URL, все запрошены: **0 ошибок** (4xx/5xx). Внешние ссылки (9: wa.me, t.me, Instagram, YouTube, 4 Google Maps, azpohealth.com) — **Not Tested** (CORS не даёт проверить из браузера).
- Sitemap демо: 80 случайных URL → все 200 без редиректа, canonical совпадает с URL в sitemap (80/80).

## 5. Изображения

- `/_next/image` для фото с api.azpo.ru: 23 из 23 проверенных → **402**, `x-vercel-error: OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED`, `x-vercel-cache: MISS`. Логотипы из кеша → 200.
- Мобильный каталог Махмутлара: 8 фото объектов в DOM, 2 загружены, 6 битых (скриншот: alt-текст вместо фото).
- Консоль браузера: 73 ошибки `Failed to load resource: 402`.

## 6. Адаптивность

12 шаблонов (главная, каталог, район, карточка, гражданство, о компании, контакты, гайды, команда, избранное, отзывы, услуги) × ширины 360/768/1280 в iframe:
- горизонтальная прокрутка страницы: **0 случаев**; широкие элементы находятся внутри горизонтальных каруселей и таблицы сравнения (`min-w-[480px]` в обёртке со скроллом);
- кнопки/ссылки без доступного имени: 0;
- цели касания < 24 px: есть на 7 страницах (ссылки хлебных крошек, футера, телефоны в тексте).
Реальные устройства, Safari, Firefox — **Not Tested**.

## 7. Формы и сценарии

| Сценарий | Результат |
|---|---|
| Форма консультации (`LeadForm`) | Поля имя/телефон с `label` (sr-only), `required`, `autocomplete`. Отправка открывает wa.me с текстом. Нажатие **не выполнялось** (ушло бы в реальный WhatsApp компании). Сохранения на сервере нет (по коду) |
| Форма на azpo.ru | **Not Tested** (отправка уходит реальным менеджерам) |
| Вход в админку | Страница входа открывается; вход **Not Tested** (нет учётных данных и не нужно) |
| Избранное, сравнение, фильтры | Проверено только по коду и по наличию URL; ручной клик-тест **Not Tested** |

## 8. Логи production (Vercel, 7 дней)

| Ошибка | Кол-во | Последний раз |
|---|---|---|
| `admin objects: no answer in 8000 ms` | 94 (27 польз.) | 27.11 21:53 UTC |
| `DYNAMIC_SERVER_USAGE` в `/[lang]/turkey` | 72 + 25 | 25.11 12:48 (после исправления не повторялось) |
| `Task timed out after 300 seconds` | 42 | 25.11 12:21 |
| `Failed to load properties: TimeoutError` | 28 | 25.11 |
| `revalidating cache … all-properties-v4 TimeoutError` | 25 | 27.11 19:49 |
| `TimeoutNegativeWarning` | 23 | 27.11 09:53 |
| `EMAXCONN max client connections reached, limit: 200` | 18 | 26.11 15:08 |
| прочее (statement timeout, ETIMEDOUT) | 15 | 25.11 |

## 9. Безопасность (без активных атак)

- Заголовки демо: HSTS (2 года, preload), nosniff, XFO SAMEORIGIN, Referrer-Policy, Permissions-Policy, базовая CSP, без `x-powered-by`.
- `/admin/api/diag/` анонимно → 200 JSON (состояние БД, хранилища, фида, задержки). `?dates` анонимно не вызывался.
- Ревью кода: из 16 server actions все, кроме setup/login/logout, вызывают `requireStaff`/`canEdit`; upload и import проверяют Origin и роль; SQL только через tagged templates; JSON-LD экранирует `<`; markdown без сырого HTML.
- Подбор паролей, SQLi/XSS-фаззинг, нагрузочный тест — **Not Tested** (не согласовывались).

## Не выполнено

Cross-browser, реальные устройства, скринридер, Rich Results Test, нагрузочный тест, проверка бэкапов, отправка форм, проверка открытых портов сервера, вход в админку.
