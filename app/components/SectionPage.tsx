"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useDayCore } from "../lib/useDayCore";
import { apiEnabled, getTokens, logout } from "../lib/api";

const nav = [
  ["/", "☀", "Мой день", "home"],
  ["/tasks", "✓", "Задачи", "tasks"],
  ["/calendar", "□", "Календарь", "calendar"],
  ["/categories", "●", "Категории", "categories"],
  ["/habits", "↗", "Привычки", "habits"],
  ["/focus", "◉", "Фокус", "focus"],
  ["/stats", "▥", "Статистика", "stats"],
  ["/settings", "⚙", "Настройки", "settings"],
] as const;

const titles: Record<string, [string, string]> = {
  tasks: ["Задачи", "Собери всё важное в одном месте."],
  calendar: ["Календарь", "Планируй неделю и сохраняй баланс."],
  categories: ["Категории", "Создавай категории один раз и используй их в планах."],
  habits: ["Привычки", "Маленькие действия создают большие изменения."],
  focus: ["Фокус", "Выключи шум и сделай главное."],
  stats: ["Статистика", "Посмотри, как растёт твоя продуктивность."],
  settings: ["Настройки", "Настрой DayCore под свой ритм."],
};

function formatMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}ч ${minutes}м`;
}

export default function SectionPage({ section }: { section: string }) {
  const {
    dark,
    setDark,
    today,
    todayKey,
    dateLabel,
    calendarMonthLabel,
    currentWeek,
    tasks,
    habits,
    events,
    categories,
    settings,
    focusState,
    taskStats,
    focusProgress,
    focusTodayStats,
    focusWeekStats,
    habitProgress,
    addTask,
    toggleTask,
    removeTask,
    addHabit,
    toggleHabitDay,
    removeHabit,
    addEvent,
    removeEvent,
    addCategory,
    removeCategory,
    updateSettings,
    setFocusMode,
    toggleFocus,
    resetFocus,
  } = useDayCore();

  const [filter, setFilter] = useState("Все");
  const [query, setQuery] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newHabit, setNewHabit] = useState("");
  const [newTaskTime, setNewTaskTime] = useState(settings.defaultTaskTime);
  const [newTaskTag, setNewTaskTag] = useState(settings.defaultCategory);
  const [newHabitGoal, setNewHabitGoal] = useState("");
  const [newHabitDescription, setNewHabitDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [eventTitle, setEventTitle] = useState("");
  const [eventTime, setEventTime] = useState(settings.defaultTaskTime);
  const [eventTag, setEventTag] = useState(settings.defaultCategory);
  const [newCategory, setNewCategory] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#2878f0");
  const [categoryError, setCategoryError] = useState("");
  const [notificationPermission, setNotificationPermission] = useState(() => typeof Notification === "undefined" ? "unsupported" : Notification.permission);

  const sectionTitle = titles[section] ?? titles.tasks;
  const visibleTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          (filter === "Все" || (filter === "Готово" ? task.done : !task.done)) &&
          task.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [filter, query, tasks],
  );
  const selectedDayTasks = useMemo(
    () => tasks.filter((task) => task.date === selectedDate),
    [selectedDate, tasks],
  );
  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate),
    [events, selectedDate],
  );
  const todayHabitCount = habits.filter((habit) => habit.week[(today.getDay() + 6) % 7]).length;
  const bestStreak = habits.reduce((best, habit) => Math.max(best, habit.streak), 0);
  const weekTasks = useMemo(() => {
    const start = currentWeek[0]?.key;
    const end = currentWeek[6]?.key;
    return start && end ? tasks.filter((task) => task.date >= start && task.date <= end) : [];
  }, [currentWeek, tasks]);
  const weeklyTasksDone = weekTasks.filter((task) => task.done).length;
  const weeklyTaskProgress = weekTasks.length ? Math.round((weeklyTasksDone / weekTasks.length) * 100) : 0;
  const maxDailyCompleted = Math.max(1, ...currentWeek.map((day) => tasks.filter((task) => task.date === day.key && task.done).length));
  const categorySummary = useMemo(() => {
    const totals = weekTasks.reduce<Record<string, number>>((map, task) => {
      map[task.tag] = (map[task.tag] ?? 0) + 1;
      return map;
    }, {});
    const total = Math.max(weekTasks.length, 1);

    return Object.entries(totals)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
      .map(([name, count], index) => ({
        name,
        percent: Math.round((count / total) * 100),
        color: ["#2878f0", "#8b5cf6", "#10b981", "#f59e0b"][index],
      }));
  }, [weekTasks]);

  const addTaskFromPage = () => {
    addTask(newTask, { date: selectedDate, time: newTaskTime, tag: newTaskTag });
    setNewTask("");
    setNewTaskTime(settings.defaultTaskTime);
    setNewTaskTag(settings.defaultCategory);
  };

  const addHabitFromPage = () => {
    addHabit(newHabit, { goal: newHabitGoal, description: newHabitDescription });
    setNewHabit("");
    setNewHabitGoal("");
    setNewHabitDescription("");
  };

  const addEventFromPage = () => {
    addEvent(eventTitle, selectedDate, eventTime, eventTag);
    setEventTitle("");
    setEventTime(settings.defaultTaskTime);
    setEventTag(settings.defaultCategory);
  };

  const addCategoryFromPage = () => {
    if (!addCategory(newCategory, newCategoryColor)) {
      setCategoryError(newCategory.trim() ? "Такая категория уже существует" : "Введите название категории");
      return;
    }
    setNewTaskTag(newCategory.trim());
    setEventTag(newCategory.trim());
    setNewCategory("");
    setCategoryError("");
  };

  const enableBrowserNotifications = async () => {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    updateSettings({ notificationsEnabled: permission === "granted" });
    if (permission === "granted") new Notification("DayCore", { body: "Уведомления включены — всё готово." });
  };

  return (
    <main className={dark ? "app dark" : "app"}>
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-mark">D</span>
          <span>DayCore</span>
        </Link>
        <nav className="nav">
          {nav.map(([href, icon, label, key]) => (
            <Link key={key} className={`nav-item ${section === key ? "active" : ""}`} href={href}>
              <span>{icon}</span>
              {label}
              {key === "tasks" && <b>{taskStats.active}</b>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="theme-toggle" onClick={() => setDark((value) => !value)} type="button">
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
      <section className="workspace">
        <header className="topbar">
          <Link className="mobile-brand" href="/">
            <span className="brand-mark">D</span> DayCore
          </Link>
          <div className="date-label">
            <strong>{dateLabel}</strong>
            <span>Все разделы работают на одном состоянии</span>
          </div>
          <div className="top-actions">
            <button type="button">⌕</button>
            <Link className="top-action-link" href="/settings#notifications" title="Настройки уведомлений">♢<i /></Link>
            <button className="theme-icon" onClick={() => setDark((value) => !value)} type="button">{dark ? "☀" : "☾"}</button>
          </div>
        </header>
        <div className="content section-content">
          <section className="page-title">
            <div>
              <p className="eyebrow">DAYCORE</p>
              <h1>{sectionTitle[0]}</h1>
              <p>{sectionTitle[1]}</p>
            </div>
            {section === "tasks" && <button className="primary compact" onClick={() => document.getElementById("new-task")?.focus()} type="button">+ Новая задача</button>}
            {section === "habits" && <button className="primary compact" onClick={() => document.getElementById("new-habit")?.focus()} type="button">+ Новая привычка</button>}
            {section === "calendar" && <button className="primary compact" onClick={() => document.getElementById("new-event")?.focus()} type="button">+ Новое событие</button>}
            {section === "categories" && <button className="primary compact" onClick={() => document.getElementById("new-category")?.focus()} type="button">+ Новая категория</button>}
          </section>
          {section === "tasks" && (
            <div className="two-layout">
              <section className="panel">
                <div className="toolbar">
                  <div className="searchbox">⌕<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск задач" /></div>
                  <div className="filters inline">
                    {["Все", "Активные", "Готово"].map((item) => (
                      <button className={filter === item ? "selected" : ""} onClick={() => setFilter(item)} key={item} type="button">{item}</button>
                    ))}
                  </div>
                </div>
                <div className="task-list large">
                  {visibleTasks.map((task) => (
                    <article className={task.done ? "task done" : "task"} key={task.id}>
                      <button className="check" onClick={() => toggleTask(task.id)} type="button">{task.done ? "✓" : ""}</button>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.time} · <em>{task.tag}</em> · {task.date}</span>
                      </div>
                      <button className="task-more" onClick={() => removeTask(task.id)} type="button">×</button>
                    </article>
                  ))}
                </div>
                <div className="quick-add">
                  <button onClick={addTaskFromPage} type="button">+</button>
                  <input id="new-task" value={newTask} onChange={(event) => setNewTask(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addTaskFromPage()} placeholder="Что нужно сделать?" />
                  <input className="time-input" type="time" value={newTaskTime} onChange={(event) => setNewTaskTime(event.target.value)} />
                  <select className="tag-input" aria-label="Категория задачи" value={newTaskTag} onChange={(event) => setNewTaskTag(event.target.value)}>
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                  <kbd>Enter</kbd>
                </div>
              </section>
              <aside className="panel summary-card">
                <p className="eyebrow">ПРОГРЕСС</p>
                <h3>Сегодня</h3>
                <div className="big-ring" style={{ "--progress": `${taskStats.progress * 3.6}deg` } as React.CSSProperties}><span>{taskStats.done}/{taskStats.total}</span></div>
                <p>Состояние задач теперь единое для главной страницы, календаря и статистики.</p>
                <div className="mini-stat"><span>●</span><div><strong>{taskStats.active}</strong><small>активных задач</small></div></div>
              </aside>
            </div>
          )}
          {section === "calendar" && (
            <>
              <section className="panel calendar-panel">
                <div className="calendar-head">
                  <button type="button">‹</button>
                  <h2>{calendarMonthLabel}</h2>
                  <button type="button">›</button>
                </div>
                <div className="calendar-grid weeknames">{["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((item) => <b key={item}>{item}</b>)}</div>
                <div className="calendar-grid">
                  {currentWeek.map((day) => (
                    <button
                      className={`${day.key === todayKey ? "today-cell" : ""} ${day.key === selectedDate ? "selected-cell" : ""}`}
                      key={day.key}
                      onClick={() => setSelectedDate(day.key)}
                      type="button"
                    >
                      <span>{day.number}</span>
                      {(tasks.some((task) => task.date === day.key) || events.some((event) => event.date === day.key)) && <i />}
                      <small>{tasks.filter((task) => task.date === day.key).length + events.filter((event) => event.date === day.key).length} записей</small>
                    </button>
                  ))}
                </div>
              </section>
              <section className="agenda">
                <div>
                  <p className="eyebrow">ВЫБРАННЫЙ ДЕНЬ</p>
                  <h2>{selectedDate}</h2>
                </div>
                {[...selectedDayEvents, ...selectedDayTasks.map((task) => ({ ...task, tag: `${task.tag} · задача` }))].map((item, index) => (
                  <article className="agenda-item" key={item.id}>
                    <time>{item.time}</time>
                    <span style={{ background: ["#2878f0", "#8b5cf6", "#10b981", "#f59e0b"][index % 4] }} />
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.tag}</small>
                    </div>
                  </article>
                ))}
                {!selectedDayEvents.length && !selectedDayTasks.length && <p className="muted-copy">На этот день пока нет событий и задач.</p>}
                <div className="quick-add event-add">
                  <button onClick={addEventFromPage} type="button">+</button>
                  <input id="new-event" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addEventFromPage()} placeholder="Новое событие" />
                  <input className="time-input" type="time" value={eventTime} onChange={(event) => setEventTime(event.target.value)} />
                  <select className="tag-input" aria-label="Категория события" value={eventTag} onChange={(event) => setEventTag(event.target.value)}>
                    {categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}
                  </select>
                  <button className="task-more static" onClick={() => selectedDayEvents[0] && removeEvent(selectedDayEvents[0].id)} title="Удалить первое событие дня" type="button">×</button>
                </div>
              </section>
            </>
          )}
          {section === "categories" && (
            <section className="panel categories-panel">
              <div className="category-create">
                <input id="new-category" value={newCategory} onChange={(event) => { setNewCategory(event.target.value); setCategoryError(""); }} onKeyDown={(event) => event.key === "Enter" && addCategoryFromPage()} placeholder="Название категории" />
                <label className="color-picker">Цвет <input type="color" value={newCategoryColor} onChange={(event) => setNewCategoryColor(event.target.value)} /></label>
                <button className="primary compact" onClick={addCategoryFromPage} type="button">Создать</button>
              </div>
              {categoryError && <p className="form-error" role="alert">{categoryError}</p>}
              <div className="category-list">
                {categories.map((category) => {
                  const usageCount = tasks.filter((task) => task.tag === category.name).length + events.filter((event) => event.tag === category.name).length;
                  return (
                    <article key={category.id}>
                      <i style={{ background: category.color }} />
                      <div><strong>{category.name}</strong><small>{usageCount} {usageCount === 1 ? "запись" : "записей"}</small></div>
                      <button disabled={usageCount > 0} onClick={() => removeCategory(category.id)} title={usageCount > 0 ? "Категория используется — сначала удалите или перенесите записи" : "Удалить категорию"} type="button">×</button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
          {section === "settings" && (
            <div className="settings-grid">
              <section className="panel settings-card">
                <p className="eyebrow">ПРОФИЛЬ И ДЕНЬ</p>
                <h2>Основные настройки</h2>
                <label>Ваше имя<input value={settings.displayName} onChange={(event) => updateSettings({ displayName: event.target.value })} /></label>
                <label>Начало дня<input type="time" value={settings.dayStart} onChange={(event) => updateSettings({ dayStart: event.target.value })} /></label>
                <label>Время новой задачи<input type="time" value={settings.defaultTaskTime} onChange={(event) => updateSettings({ defaultTaskTime: event.target.value })} /></label>
                <label>Категория по умолчанию<select value={settings.defaultCategory} onChange={(event) => updateSettings({ defaultCategory: event.target.value })}>{categories.map((category) => <option key={category.id} value={category.name}>{category.name}</option>)}</select></label>
                <div className="setting-row"><div><strong>Синхронизация</strong><small>{apiEnabled && getTokens() ? "Backend подключён, данные синхронизируются" : "Локальный режим — войдите для синхронизации"}</small></div>{apiEnabled && getTokens() ? <button className="text-action danger-action" onClick={logout} type="button">Выйти</button> : <Link className="period-pill" href="/auth">Войти</Link>}</div>
              </section>
              <section className="panel settings-card">
                <p className="eyebrow">ОФОРМЛЕНИЕ</p>
                <h2>Внешний вид</h2>
                <div className="setting-row"><div><strong>Тёмная тема</strong><small>Более спокойные цвета для вечерней работы</small></div><button className={dark ? "switch on" : "switch"} onClick={() => setDark((value) => !value)} aria-pressed={dark} type="button"><i /></button></div>
              </section>
              <section className="panel settings-card notifications-card" id="notifications">
                <p className="eyebrow">УВЕДОМЛЕНИЯ</p>
                <h2>Напоминания</h2>
                <div className="permission-box"><div><strong>Системные уведомления</strong><small>{notificationPermission === "granted" ? "Разрешены в браузере" : notificationPermission === "denied" ? "Заблокированы в настройках браузера" : notificationPermission === "unsupported" ? "Не поддерживаются браузером" : "Нужно разрешение браузера"}</small></div><button className="primary compact" disabled={notificationPermission === "granted" || notificationPermission === "unsupported"} onClick={enableBrowserNotifications} type="button">{notificationPermission === "granted" ? "Включены" : "Разрешить"}</button></div>
                <div className="setting-row"><div><strong>Напоминать о задачах</strong><small>Уведомление перед временем задачи</small></div><button className={settings.taskReminders ? "switch on" : "switch"} onClick={() => updateSettings({ taskReminders: !settings.taskReminders })} aria-pressed={settings.taskReminders} type="button"><i /></button></div>
                <label>Напоминать заранее<select value={settings.reminderMinutes} onChange={(event) => updateSettings({ reminderMinutes: Number(event.target.value) })}><option value={5}>За 5 минут</option><option value={15}>За 15 минут</option><option value={30}>За 30 минут</option><option value={60}>За 1 час</option></select></label>
                <div className="setting-row"><div><strong>Итоги дня</strong><small>Сводка выполненных задач и привычек</small></div><button className={settings.dailySummary ? "switch on" : "switch"} onClick={() => updateSettings({ dailySummary: !settings.dailySummary })} aria-pressed={settings.dailySummary} type="button"><i /></button></div>
                <div className="setting-row"><div><strong>Напоминания о привычках</strong><small>Не забыть отметить ежедневный прогресс</small></div><button className={settings.habitReminders ? "switch on" : "switch"} onClick={() => updateSettings({ habitReminders: !settings.habitReminders })} aria-pressed={settings.habitReminders} type="button"><i /></button></div>
              </section>
            </div>
          )}
          {section === "habits" && (
            <div className="habits-layout">
              <section className="panel habit-table">
                <div className="habit-table-head"><span>Привычка</span>{["ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"].map((item) => <b key={item}>{item}</b>)}<span>Серия</span><span /> </div>
                {habits.map((habit) => (
                  <article key={habit.id}>
                    <div><strong>{habit.name}</strong><small>{habit.goal}{habit.description ? ` · ${habit.description}` : ""}</small></div>
                    {habit.week.map((done, index) => (
                      <button className={done ? "habit-check checked" : "habit-check"} key={index} onClick={() => toggleHabitDay(habit.id, index)} type="button">{done ? "✓" : ""}</button>
                    ))}
                    <span className="streak">🔥 {habit.streak}</span>
                    <button className="habit-delete" onClick={() => removeHabit(habit.id)} title={`Удалить привычку «${habit.name}»`} aria-label={`Удалить привычку «${habit.name}»`} type="button">×</button>
                  </article>
                ))}
                <div className="quick-add">
                  <button onClick={addHabitFromPage} type="button">+</button>
                  <input id="new-habit" value={newHabit} onChange={(event) => setNewHabit(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addHabitFromPage()} placeholder="Добавить новую привычку..." />
                  <input className="tag-input" value={newHabitGoal} onChange={(event) => setNewHabitGoal(event.target.value)} placeholder="Цель" />
                  <input className="wide-input" value={newHabitDescription} onChange={(event) => setNewHabitDescription(event.target.value)} placeholder="Описание" />
                  <kbd>Enter</kbd>
                </div>
              </section>
              <aside className="panel habit-motivation">
                <span className="trophy">◆</span>
                <p className="eyebrow">ЛУЧШАЯ СЕРИЯ</p>
                <strong>{bestStreak} дней</strong>
                <p>Сегодня выполнено {todayHabitCount} из {habits.length} привычек. Серии теперь обновляются автоматически.</p>
              </aside>
            </div>
          )}
          {section === "focus" && (
            <div className="focus-page">
              <section className="panel focus-main">
                <div className="mode-tabs">
                  {[
                    ["Фокус", 25],
                    ["Короткий перерыв", 5],
                    ["Длинный перерыв", 15],
                  ].map(([label]) => (
                    <button className={focusState.mode === label ? "active" : ""} onClick={() => setFocusMode(label as "Фокус" | "Короткий перерыв" | "Длинный перерыв")} key={label} type="button">
                      {label}
                    </button>
                  ))}
                </div>
                <div className="focus-orbit">
                  <div>
                    <strong>{String(Math.floor(focusState.remainingSeconds / 60)).padStart(2, "0")}:{String(focusState.remainingSeconds % 60).padStart(2, "0")}</strong>
                    <span>{focusState.mode}</span>
                  </div>
                </div>
                <div className="focus-controls">
                  <button className="secondary-circle" onClick={() => resetFocus()} type="button">↺</button>
                  <button className="primary focus-start" onClick={toggleFocus} type="button">{focusState.endAt ? "Пауза" : "Начать"}</button>
                  <button className="secondary-circle" onClick={() => resetFocus(true)} type="button">■</button>
                </div>
              </section>
              <section className="focus-side">
                <article className="panel">
                  <p className="eyebrow">СЕГОДНЯ</p>
                  <h3>Фокус-сессии</h3>
                  <div className="focus-number">{focusTodayStats.sessions} <small>сессии</small></div>
                  <div className="progress"><i style={{ width: `${focusProgress}%` }} /></div>
                  <p className="muted-copy">{formatMinutes(focusTodayStats.minutes)} из цели 2ч</p>
                </article>
                <article className="panel">
                  <p className="eyebrow">СОВЕТ</p>
                  <h3>Убери отвлечения</h3>
                  <p className="muted-copy">Таймер теперь сохраняется между перезагрузками и продолжает отсчёт корректно.</p>
                </article>
              </section>
            </div>
          )}
          {section === "stats" && (
            <>
              <section className="stat-cards">
                <article className="panel"><span>✓</span><strong>{weeklyTasksDone}</strong><small>задач выполнено за неделю</small><em>{weeklyTaskProgress}% недельного списка</em></article>
                <article className="panel"><span>◷</span><strong>{formatMinutes(focusWeekStats.minutes)}</strong><small>в фокусе за неделю</small><em>{focusWeekStats.sessions} завершённых сессий</em></article>
                <article className="panel"><span>↗</span><strong>{habitProgress}%</strong><small>привычек закрыто</small><em>{bestStreak} дней лучшая серия</em></article>
              </section>
              <div className="stats-grid">
                <section className="panel chart-panel">
                  <div className="panel-head">
                    <div><p className="eyebrow">ПРОДУКТИВНОСТЬ</p><h2>Текущая неделя</h2></div>
                    <button className="period-pill" type="button">Неделя⌄</button>
                  </div>
                  <div className="bar-chart">
                    {currentWeek.map((day) => {
                      const count = tasks.filter((task) => task.date === day.key && task.done).length;
                      const height = count ? Math.max(12, Math.round((count / maxDailyCompleted) * 100)) : 0;
                      return (
                        <div key={day.key}>
                          <span style={{ height: `${height}%` }} />
                          <small>{day.label}</small>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="panel">
                  <p className="eyebrow">ПО КАТЕГОРИЯМ</p>
                  <h2>Куда ушло время</h2>
                  {categorySummary.map((item) => (
                    <div className="category-row" key={item.name}>
                      <div><i style={{ background: item.color }} /><strong>{item.name}</strong><span>{item.percent}%</span></div>
                      <div className="progress"><i style={{ width: `${item.percent}%`, background: item.color }} /></div>
                    </div>
                  ))}
                </section>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
