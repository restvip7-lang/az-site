# Deployment

Как сейчас публикуется сайт и что сделать перед запуском на azpo.ru. Описание основано на коде и настройках, видимых снаружи; настройки Vercel-дашборда аудитор не видел.

## Как работает сейчас

- Хостинг: Vercel, проект `azpo-site`, команда «Anuar's projects». Домены: `azpo-site.vercel.app`, `azpo.usmanov.biz`.
- Каждый push в `main` автоматически собирается и сразу становится production. Тестов и CI нет. Отдельно `create_deployment` не вызывать — получится двойная сборка.
- Откат: Vercel → Deployments → нужный деплой → Promote / Instant Rollback.
- Сборка: `npm ci && next build`. Во время сборки читается фид api.azpo.ru и база; при пустом ответе сборка не падает (см. M8).

## Переменные окружения

| Переменная | Назначение |
|---|---|
| `POSTGRES_URL` (или `DATABASE_URL`, любые `*_POSTGRES_URL`) | база админки |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SECRET_KEY` | хранилище фото |
| `AZPO_API_BASE` | фид каталога, по умолчанию `https://api.azpo.ru/api` |
| `AZPO_BLOG_API` | WordPress API для импорта блога |
| `NEXT_PUBLIC_SITE_URL` / `SITE_URL` | абсолютные URL в canonical, sitemap, OG |
| `NEXT_PUBLIC_INDEXABLE=1` | открыть индексацию (только на боевом домене) |
| `NEXT_PUBLIC_YM_ID` | Яндекс Метрика (сейчас не задан) |
| `NEXT_PUBLIC_GOOGLE_VERIFICATION`, `NEXT_PUBLIC_YANDEX_VERIFICATION` | подтверждение в консолях |

Значения секретов в репозиторий не коммитить.

## Локальный запуск

```bash
npm ci
npm run dev        # http://localhost:3000
npm run build && npm start   # production-режим
```
Без доступа к api.azpo.ru укажите `AZPO_API_BASE` на мок-сервер; без `POSTGRES_URL` админка не работает, каталог берётся из фида.

## Чек-лист перед переключением домена azpo.ru

1. Закрыть Critical из [KNOWN_ISSUES.md](KNOWN_ISSUES.md): фото (402), сохранение заявок, политика конфиденциальности.
2. Регион функций Vercel = `fra1` (рядом с базой); проверить лимиты тарифа (Pro для коммерческого сайта и оптимизации изображений).
3. Настроить бэкап базы и бакета `media`, проверить восстановление.
4. Решить вопрос EN-версии: перевести или оставить англоязычные URL на старом сайте/azpo.com.
5. Задать `NEXT_PUBLIC_SITE_URL=https://azpo.ru`, `NEXT_PUBLIC_INDEXABLE=1`, `NEXT_PUBLIC_YM_ID`, коды верификации.
6. Проверить 301 со старых URL azpo.ru (`/ru/property-turkey/<id>`, `/ru/citizenship`, `/ru/about`, `/ru/contact-us`, блог `/ru/blog/...`), выгрузить список URL старого сайта и прогнать.
7. Снизить TTL DNS заранее, переключить A/CNAME azpo.ru на Vercel, выпустить сертификат.
8. После переключения: отправить sitemap в Google Search Console и Яндекс Вебмастер, проверить robots.txt (без `Disallow: /`), повторить Lighthouse и проверку ссылок из [TEST_REPORT.md](TEST_REPORT.md).
9. Закрыть публичный доступ к `/admin/api/diag/`, сделать репозиторий приватным.

## Переезд на VPS (план)

Ветка `vps`: заменить адаптер хранилища (`src/lib/admin/storage.ts`) на диск, оставить Postgres, `next build && next start` за nginx, HTTPS, systemd/pm2, бэкапы cron. Не начато.
