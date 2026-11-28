# AZPO Estate — описание проекта

Новый сайт агентства недвижимости AZPO Estate (продажа недвижимости в Турции: Алания, Анталия, Стамбул, Фетхие, Белек, Мерсин, Бодрум). Должен заменить текущий azpo.ru. AZPO не застройщик: «проекты» в каталоге — новостройки застройщиков-партнёров.

Статус на 28.11.2026: демо на https://azpo-site.vercel.app (закрыто от индексации). Готовность к запуску — см. [AUDIT_REPORT.md](AUDIT_REPORT.md).

## Стек

- Next.js 15.5 (App Router, ISR, middleware), React 19.1, TypeScript, Tailwind CSS 4.
- Postgres (сейчас Supabase через интеграцию Vercel, Франкфурт) через `postgres.js`; миграции в `src/lib/db/schema.ts` выполняются лениво при первом запросе.
- Фото админки — Supabase Storage (бакет `media`), адаптер `src/lib/admin/storage.ts`.
- Хостинг: Vercel (проект `azpo-site`, регион функций `fra1`), auto-deploy из `main` — временно, для демонстрации; затем перенос на собственный сервер. Решения не завязывать на Vercel.
- Фото: свой ресайзер `/api/img/` (sharp → WebP), loader `src/lib/image-loader.ts`.
- Заявки: `/api/lead/` → таблица `leads`, раздел «Заявки» в админке, уведомления в Telegram.
- Тесты: vitest (`tests/`), CI — `.github/workflows/ci.yml`.
- Аналитика: Vercel Analytics, Speed Insights; Яндекс Метрика при `NEXT_PUBLIC_YM_ID` и только после согласия на cookies (`src/components/Consent.tsx`); цели в `src/lib/track.ts`.

## Источники данных

1. **Админка** (`/admin`, таблица `objects`): все 901 объект azpo.ru перенесены 25.11.2026; новые добавляют сотрудники.
2. **Фид azpo.ru** (`https://api.azpo.ru/api/real-estates/ru?limit=1000`, ~3 МБ) — для объектов, которых ещё нет в админке. Фото объектов пока отдаются с `api.azpo.ru/api/files/...`.
3. **Блог WordPress azpo.ru** — источник импорта статей.
4. Статический контент: `src/lib/content.ts`, `src/lib/services.ts`, `src/content/*.json`.

## Структура

```
src/
  middleware.ts            редиректы старых URL, слэш, noindex для фильтров
  app/[lang]/              публичные страницы (сейчас только ru)
    turkey/[[...seg]]      каталог: /ru/turkey/{city}/{district}/sale/{type}/{feature}/, карточки .../id{ID}/
    property-turkey/       старые URL azpo.ru → 301 на новые
    services/, blog/, about/, contacts/, team/, reviews/, favorites/
  app/admin/               админка (объекты, статьи, SEO, редиректы, сотрудники), API upload/import/diag
  app/api/                 listing (догрузка каталога), og (картинки для соцсетей), img (ресайз фото), lead (заявки)
  app/sitemap.xml, sitemaps/[name], robots.txt, llms.txt, manifest
  lib/                     api.ts (каталог), catalog.ts (URL-схема), admin/*, db/*, seo, i18n
  components/              UI
```

## Требования (из ТЗ и решений владельца)

- Языки: основные — русский и английский. Сейчас есть только RU (`/` → `/ru/`); EN — следующий этап (до этого `/en/` → `/ru/`).
- URL-схема по SEO-ТЗ, старые URL azpo.ru — 301.
- Фирменный стиль azpo.ru: цвета `#2E5A90`, `#3FB9E7`, шрифт Lato, фон `#EDF4FC`.
- Цены в валюте объекта ($ или €), пересчёт в € по курсу ЕЦБ.
- Роли админки: Владелец / Редактор / Просмотр.
- Индексация включается только на боевом домене: `NEXT_PUBLIC_INDEXABLE=1` + `NEXT_PUBLIC_SITE_URL`.

## Связанные системы

- azpo.ru — текущий сайт (Next.js + Node backend, VK Cloud 95.163.226.76), исходники у владельца локально.
- azpo.com, api.azpo.com, azpohealth.com — сервер FastVPS 49.13.105.38 (MySQL в Docker).
- План: перенос сайта на FastVPS в ветке `vps` (адаптер хранилища на диск, Postgres остаётся).

## Документы

- [AUDIT_REPORT.md](AUDIT_REPORT.md) — аудит готовности
- [TEST_REPORT.md](TEST_REPORT.md) — результаты тестов
- [KNOWN_ISSUES.md](KNOWN_ISSUES.md) — открытые проблемы
- [DEPLOYMENT.md](DEPLOYMENT.md) — публикация
- [CHANGELOG.md](CHANGELOG.md) — история изменений
