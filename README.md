# DayCore

Полноценный интерфейс персонального планировщика на Next.js: задачи, календарь, привычки, фокус-таймер, статистика, светлая и тёмная темы.

## Требования

- Node.js 22.13 или новее
- npm

## Запуск

```bash
npm install
npm run dev
```

После запуска откройте адрес, показанный в терминале (обычно `http://localhost:3000` или `http://localhost:5173`).

## Production-сборка

```bash
npm run build
npm run start
```

## Деплой на Vercel

Проект собирается нативным Next.js и создаёт каталог `.next`, который ожидает Vercel.

1. Выберите корневой каталог `Daycore-frontend`.
2. Framework Preset: `Next.js`.
3. Build Command: `npm run build`.
4. Output Directory не переопределяйте — Vercel определит `.next` автоматически.
5. Добавьте переменную `NEXT_PUBLIC_API_URL` с публичным HTTPS-адресом Django API.

Для прежней Cloudflare/vinext-сборки сохранены команды `npm run dev:vinext`, `npm run build:vinext` и `npm run start:vinext`.

## Основные страницы

- `/` — Мой день
- `/tasks` — Задачи
- `/calendar` — Календарь
- `/habits` — Привычки
- `/focus` — Фокус-таймер
- `/stats` — Статистика

Сейчас данные задач, привычек и тема сохраняются локально в `localStorage` браузера. Для синхронизации между устройствами потребуется подключить backend и базу данных.
