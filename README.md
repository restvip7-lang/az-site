# AZPO Estate — новый сайт (демо)

Новая версия сайта azpo.ru на Next.js 15 + Tailwind CSS.

Сейчас сайт читает объекты из действующего каталога AZPO (`https://api.azpo.ru/api`) только на чтение.
Формы в демо открывают WhatsApp с готовым сообщением и никуда не отправляют данные.

## Страницы
- `/` — главная: поиск, направления, новые объекты, консультация
- `/property-turkey` — каталог с фильтрами (город, тип, спальни, цена, валюта, сортировка)
- `/property-turkey/<id>` — карточка объекта (старые ссылки вида `/property-turkey/1044` работают)
- `/property-turkey/Alanya`, `/property-turkey/alanya/villas`, `/property-turkey/apartments` — старые ссылки на подборки
- `/citizenship`, `/about`, `/contact-us`

## Запуск
```bash
npm install
npm run dev
```

Переменные окружения (необязательно):
- `AZPO_API_BASE` — адрес API каталога, по умолчанию `https://api.azpo.ru/api`
- `SITE_URL` — адрес сайта для метатегов

Все запросы к данным собраны в `src/lib/api.ts`: при переезде на новую базу меняется только этот файл.
