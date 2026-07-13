<div align="center">

# DayCore

### A calm personal productivity system for planning, habits, focus, and progress

[![Demo](https://img.shields.io/badge/Demo-daycore--ibro.vercel.app-2563EB?style=for-the-badge)](https://daycore-ibro.vercel.app)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Status](https://img.shields.io/badge/status-active_development-22C55E?style=flat-square)

</div>

## Overview

DayCore is a personal productivity product designed to bring daily planning into one focused workspace. Instead of separating tasks, habits, calendar events, focus sessions, and progress into unrelated tools, DayCore connects them around the user's day.

The interface is built with Next.js and includes a companion Django REST API for authenticated, user-isolated data.

## Product capabilities

- Daily dashboard with plan completion and progress score
- Task creation, filtering, categories, dates, and completion states
- Weekly and calendar-based planning
- Habit tracking and weekly consistency views
- Focus timer and focus-session statistics
- Productivity insights and completion metrics
- Light and dark themes
- Responsive desktop and mobile layouts
- JWT-ready authentication flow
- Notifications and user settings in the companion API

## Technology

| Area | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS 4 and product-specific design system |
| Backend | Django REST Framework |
| Authentication | JWT access and refresh tokens |
| Database | PostgreSQL-ready backend |
| Delivery | Vercel frontend and Python-compatible backend deployment |

## Frontend structure

~~~text
app/
├── page.tsx            # daily dashboard
├── tasks/              # task management
├── calendar/           # calendar planning
├── categories/         # organization
├── habits/             # habit tracking
├── focus/              # focus timer
├── stats/              # productivity insights
└── lib/                # shared state and product logic
~~~

## Running locally

### Requirements

- Node.js 22.13 or newer
- npm

### Installation

~~~bash
npm install
npm run dev
~~~

Open http://localhost:3000.

### Environment

When connecting the frontend to the API, configure:

~~~env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
~~~

## Build and checks

~~~bash
npm run lint
npm run build
npm test
~~~

## Related repository

[DayCore backend](https://github.com/ibrodevs/Daycore-backend) — Django REST API with JWT authentication, user-isolated tasks, events, habits, focus sessions, settings, notifications, dashboard data, and OpenAPI documentation.

## Current product status

The frontend currently supports browser persistence for the main productivity experience. The companion API already models the server-side resources; full account synchronization and reminder delivery are active development areas.

## Roadmap

- Complete frontend-to-API synchronization
- Cross-device data consistency
- Scheduled reminders and push notifications
- Improved analytics and weekly reviews
- Mobile application experience

