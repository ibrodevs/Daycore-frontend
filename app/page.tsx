"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDayCore } from "./lib/useDayCore";

export default function Home() {
  const {
    dark,
    setDark,
    dateLabel,
    currentWeek,
    todayKey,
    tasks,
    categories,
    settings,
    habits,
    focusState,
    taskStats,
    focusTodayStats,
    addTask,
    toggleTask,
    removeTask,
    toggleFocus,
    resetFocus,
  } = useDayCore();

  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("Все");
  const [activeDate, setActiveDate] = useState(todayKey);
  const [taskCategory, setTaskCategory] = useState(settings.defaultCategory);

  const dayTasks = useMemo(
    () => tasks.filter((task) => task.date === activeDate),
    [activeDate, tasks],
  );
  const visibleTasks = useMemo(
    () => dayTasks.filter((task) => filter === "Все" || (filter === "Готово" ? task.done : !task.done)),
    [dayTasks, filter],
  );
  const selectedDay = currentWeek.find((day) => day.key === activeDate);
  const completedHabitsToday = habits.filter((habit) => habit.week[(new Date().getDay() + 6) % 7]).length;

  const addTodayTask = () => {
    addTask(title, { date: activeDate, tag: taskCategory });
    setTitle("");
  };

  return (
    <main className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="DayCore">
          <span className="brand-mark">D</span>
          <span>DayCore</span>
        </Link>
        <nav className="nav" aria-label="Основная навигация">
          <Link className="nav-item active" href="/">
            <span>☀</span>
            Мой день
          </Link>
          <Link className="nav-item" href="/tasks">
            <span>✓</span>
            Задачи
            <b>{taskStats.active}</b>
          </Link>
          <Link className="nav-item" href="/calendar">
            <span>□</span>
            Календарь
          </Link>
          <Link className="nav-item" href="/categories">
            <span>●</span>
            Категории
          </Link>
          <Link className="nav-item" href="/habits">
            <span>↗</span>
            Привычки
          </Link>
          <Link className="nav-item" href="/focus">
            <span>◉</span>
            Фокус
          </Link>
          <Link className="nav-item" href="/stats">
            <span>▥</span>
            Статистика
          </Link>
          <Link className="nav-item" href="/settings">
            <span>⚙</span>
            Настройки
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDark((value) => !value)} aria-label="Переключить тему">
            <span>{dark ? "☀" : "☾"}</span>
            <span>{dark ? "Светлая тема" : "Тёмная тема"}</span>
          </button>
          <div className="profile">
            <div className="avatar">ИА</div>
            <div>
              <strong>{settings.displayName || "Пользователь"}</strong>
              <small>Твой лучший день</small>
            </div>
            <button type="button">•••</button>
          </div>
        </div>
      </aside>

      <section className="workspace" id="top">
        <header className="topbar">
          <button className="mobile-brand" type="button">
            <span className="brand-mark">D</span> DayCore
          </button>
          <div className="date-label">
            <strong>{dateLabel}</strong>
            <span>Твоя продуктивность в одном месте</span>
          </div>
          <div className="top-actions">
            <button title="Поиск" type="button">⌕</button>
            <Link className="top-action-link" href="/settings#notifications" title="Настройки уведомлений">♢<i /></Link>
            <button className="theme-icon" onClick={() => setDark((value) => !value)} type="button">
              {dark ? "☀" : "☾"}
            </button>
          </div>
        </header>

        <div className="content">
          <section className="welcome" id="today">
            <div>
              <p className="eyebrow">ТВОЙ ДЕНЬ</p>
              <h1>Добро пожаловать в рабочий ритм</h1>
              <p>Выбери день, фиксируй задачи и держи фокус без лишнего шума.</p>
            </div>
            <div className="day-score">
              <div className="score-ring" style={{ "--progress": `${taskStats.progress * 3.6}deg` } as React.CSSProperties}>
                <span>{taskStats.progress}%</span>
              </div>
              <div>
                <strong>План дня</strong>
                <small>{taskStats.done} из {taskStats.total} выполнено</small>
              </div>
            </div>
          </section>

          <section className="week-strip" id="calendar">
            <button className="week-arrow" aria-label="Предыдущая неделя" type="button">‹</button>
            {currentWeek.map((day) => (
              <button
                key={day.key}
                onClick={() => setActiveDate(day.key)}
                className={activeDate === day.key ? "day active" : "day"}
                type="button"
              >
                <span>{day.label}</span>
                <strong>{day.number}</strong>
                {day.isToday && <i />}
              </button>
            ))}
            <button className="week-arrow" aria-label="Следующая неделя" type="button">›</button>
          </section>

          <div className="dashboard-grid">
            <section className="panel tasks-panel" id="tasks">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">СЕГОДНЯ</p>
                  <h2>Задачи на {selectedDay?.number ?? ""}</h2>
                </div>
                <button className="link-button" onClick={() => document.getElementById("quick-add")?.focus()} type="button">
                  + Добавить
                </button>
              </div>
              <div className="filters">
                {["Все", "Активные", "Готово"].map((item) => (
                  <button key={item} className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} type="button">
                    {item}
                  </button>
                ))}
              </div>
              <div className="task-list">
                {visibleTasks.map((task) => (
                  <article className={task.done ? "task done" : "task"} key={task.id}>
                    <button className="check" onClick={() => toggleTask(task.id)} type="button">{task.done ? "✓" : ""}</button>
                    <div>
                      <strong>{task.title}</strong>
                      <span>{task.time} · <em>{task.tag}</em></span>
                    </div>
                    <button className="task-more" onClick={() => removeTask(task.id)} title="Удалить" type="button">×</button>
                  </article>
                ))}
                {!visibleTasks.length && <div className="empty">На выбранный день задач пока нет. Можно спокойно запланировать главное.</div>}
              </div>
              <div className="quick-add">
                <button onClick={addTodayTask} type="button">+</button>
                <input
                  id="quick-add"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  onKeyDown={(event) => event.key === "Enter" && addTodayTask()}
                  placeholder="Добавить новую задачу..."
                />
                <select className="tag-input" aria-label="Категория задачи" value={taskCategory} onChange={(event) => setTaskCategory(event.target.value)}>
                  {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                </select>
                <kbd>Enter</kbd>
              </div>
            </section>

            <aside className="right-column">
              <section className="panel focus-card" id="focus">
                <div className="focus-top">
                  <span className="focus-icon">◉</span>
                  <div>
                    <p className="eyebrow">ФОКУС</p>
                    <h3>Время глубокой работы</h3>
                  </div>
                </div>
                <div className="timer">
                  <strong>{String(Math.floor(focusState.remainingSeconds / 60)).padStart(2, "0")}:{String(focusState.remainingSeconds % 60).padStart(2, "0")}</strong>
                  <span>{focusState.mode}</span>
                </div>
                <button className="primary" onClick={toggleFocus} type="button">
                  {focusState.endAt ? "Поставить на паузу" : "Начать фокус"}
                </button>
                <button className="text-action" onClick={() => resetFocus()} type="button">Сбросить таймер</button>
              </section>
              <section className="panel habits-card" id="habits">
                <div className="panel-head">
                  <div>
                    <p className="eyebrow">ПРИВЫЧКИ</p>
                    <h3>Сегодня</h3>
                  </div>
                  <span className="streak">🔥 {completedHabitsToday}/{habits.length}</span>
                </div>
                {habits.slice(0, 3).map((habit) => {
                  const value = habit.week.filter(Boolean).length;
                  const amount = Math.round((value / habit.week.length) * 100);
                  return (
                    <div className="habit" key={habit.id}>
                      <div>
                        <strong>{habit.name}</strong>
                        <span>{value} из 7 дней</span>
                      </div>
                      <div className="progress"><i style={{ width: `${amount}%` }} /></div>
                    </div>
                  );
                })}
              </section>
            </aside>
          </div>

          <section className="insights" id="stats">
            <div>
              <p className="eyebrow">НЕДЕЛЯ В ЦИФРАХ</p>
              <h2>Прогресс отражается в цифрах</h2>
            </div>
            <div className="insight">
              <span>✓</span>
              <div>
                <strong>{taskStats.done}</strong>
                <small>задач завершено</small>
              </div>
            </div>
            <div className="insight">
              <span>◷</span>
              <div>
                <strong>{Math.floor(focusTodayStats.minutes / 60)}ч {focusTodayStats.minutes % 60}м</strong>
                <small>в фокусе</small>
              </div>
            </div>
            <div className="insight">
              <span>↗</span>
              <div>
                <strong>{Math.round((habits.reduce((sum, habit) => sum + habit.streak, 0) / Math.max(habits.length, 1)) || 0)}</strong>
                <small>средняя серия привычек</small>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
