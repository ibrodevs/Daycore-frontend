"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiEnabled, apiRequest, getTokens } from "./api";

export type Task = {
  id: number;
  title: string;
  time: string;
  tag: string;
  done: boolean;
  date: string;
};

export type Habit = {
  id: number;
  name: string;
  goal: string;
  description: string;
  streak: number;
  week: boolean[];
};

export type CalendarEvent = {
  id: number;
  title: string;
  time: string;
  tag: string;
  date: string;
};

export type Category = {
  id: number;
  name: string;
  color: string;
};

export type DayCoreSettings = {
  displayName: string;
  dayStart: string;
  defaultTaskTime: string;
  defaultCategory: string;
  notificationsEnabled: boolean;
  taskReminders: boolean;
  dailySummary: boolean;
  habitReminders: boolean;
  reminderMinutes: number;
};

type FocusMode = "Фокус" | "Короткий перерыв" | "Длинный перерыв";

type FocusState = {
  mode: FocusMode;
  durationSeconds: number;
  remainingSeconds: number;
  endAt: number | null;
  completedSessions: number;
  completedMinutes: number;
};

type FocusSessionSummary = {
  id: number;
  startedAt: string;
  durationMinutes: number;
  completed: boolean;
};

const FALLBACK_DATE = "2026-07-10";

const focusDurations: Record<FocusMode, number> = {
  "Фокус": 25 * 60,
  "Короткий перерыв": 5 * 60,
  "Длинный перерыв": 15 * 60,
};

const seedTasks: Task[] = [
  { id: 1, title: "Утренняя зарядка", time: "08:00", tag: "Здоровье", done: true, date: FALLBACK_DATE },
  { id: 2, title: "Подготовить презентацию", time: "10:30", tag: "Работа", done: false, date: FALLBACK_DATE },
  { id: 3, title: "Практика английского", time: "14:00", tag: "Учёба", done: false, date: FALLBACK_DATE },
  { id: 4, title: "Прогулка без телефона", time: "18:30", tag: "Личное", done: false, date: FALLBACK_DATE },
];

const seedHabits: Habit[] = [
  { id: 1, name: "Пить воду", goal: "8 стаканов", description: "Поддерживать энергию в течение дня.", streak: 8, week: [true, true, true, true, true, false, false] },
  { id: 2, name: "Читать", goal: "20 минут", description: "Минимум одна спокойная сессия чтения.", streak: 5, week: [true, true, false, true, true, false, false] },
  { id: 3, name: "Английский", goal: "1 урок", description: "Повторение слов и короткая практика.", streak: 12, week: [true, true, true, true, true, false, false] },
  { id: 4, name: "Без соцсетей утром", goal: "до 10:00", description: "Первый час дня без отвлечений.", streak: 3, week: [false, true, true, true, false, false, false] },
];

const seedEvents: CalendarEvent[] = [
  { id: 11, title: "Встреча по спринту", time: "09:30", tag: "Работа", date: FALLBACK_DATE },
  { id: 12, title: "Тренировка", time: "19:00", tag: "Здоровье", date: FALLBACK_DATE },
];

const seedCategories: Category[] = [
  { id: 101, name: "Личное", color: "#2878f0" },
  { id: 102, name: "Работа", color: "#8b5cf6" },
  { id: 103, name: "Учёба", color: "#f59e0b" },
  { id: 104, name: "Здоровье", color: "#10b981" },
  { id: 105, name: "План", color: "#ef4444" },
];

const seedSettings: DayCoreSettings = {
  displayName: "Иброхим",
  dayStart: "08:00",
  defaultTaskTime: "09:00",
  defaultCategory: "Личное",
  notificationsEnabled: false,
  taskReminders: true,
  dailySummary: true,
  habitReminders: false,
  reminderMinutes: 15,
};

const seedFocus: FocusState = {
  mode: "Фокус",
  durationSeconds: focusDurations["Фокус"],
  remainingSeconds: focusDurations["Фокус"],
  endAt: null,
  completedSessions: 0,
  completedMinutes: 0,
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function normalizeTask(task: Partial<Task>, fallbackDate: string): Task {
  return {
    id: typeof task.id === "number" ? task.id : Date.now(),
    title: typeof task.title === "string" ? task.title : "Новая задача",
    time: typeof task.time === "string" ? task.time : "Сегодня",
    tag: typeof task.tag === "string" ? task.tag : "Личное",
    done: Boolean(task.done),
    date: typeof task.date === "string" ? task.date : fallbackDate,
  };
}

function normalizeHabit(habit: Partial<Habit>): Habit {
  const week = Array.isArray(habit.week) ? habit.week.slice(0, 7).map(Boolean) : [];
  while (week.length < 7) week.push(false);
  return {
    id: typeof habit.id === "number" ? habit.id : Date.now(),
    name: typeof habit.name === "string" ? habit.name : "Новая привычка",
    goal: typeof habit.goal === "string" ? habit.goal : "Ежедневно",
    description: typeof habit.description === "string" ? habit.description : "",
    streak: typeof habit.streak === "number" ? habit.streak : 0,
    week,
  };
}

function normalizeEvent(event: Partial<CalendarEvent>, fallbackDate: string): CalendarEvent {
  return {
    id: typeof event.id === "number" ? event.id : Date.now(),
    title: typeof event.title === "string" ? event.title : "Новое событие",
    time: typeof event.time === "string" ? event.time : "09:00",
    tag: typeof event.tag === "string" ? event.tag : "Личное",
    date: typeof event.date === "string" ? event.date : fallbackDate,
  };
}

function normalizeFocus(state: Partial<FocusState>): FocusState {
  const mode = state.mode === "Короткий перерыв" || state.mode === "Длинный перерыв" ? state.mode : "Фокус";
  const durationSeconds =
    typeof state.durationSeconds === "number" && state.durationSeconds > 0
      ? state.durationSeconds
      : focusDurations[mode];
  const remainingSeconds =
    typeof state.remainingSeconds === "number" && state.remainingSeconds >= 0
      ? state.remainingSeconds
      : durationSeconds;

  return {
    mode,
    durationSeconds,
    remainingSeconds,
    endAt: typeof state.endAt === "number" ? state.endAt : null,
    completedSessions: typeof state.completedSessions === "number" ? state.completedSessions : 0,
    completedMinutes: typeof state.completedMinutes === "number" ? state.completedMinutes : 0,
  };
}

function readStorage<T>(key: string, fallback: T, normalize: (value: unknown) => T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return normalize(JSON.parse(raw));
  } catch {
    return fallback;
  }
}

function saveStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage write issues so the UI keeps working.
  }
}

function countCurrentStreak(week: boolean[], todayIndex: number) {
  let streak = 0;
  for (let index = todayIndex; index >= 0; index -= 1) {
    if (!week[index]) break;
    streak += 1;
  }
  return streak;
}

function getInitialToday() {
  return typeof window === "undefined" ? parseDateKey(FALLBACK_DATE) : new Date();
}

function getInitialDark() {
  if (typeof window === "undefined") return false;

  const savedTheme = window.localStorage.getItem("daycore-theme");
  return savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);
}

function getInitialTasks(todayKey: string) {
  return readStorage("daycore-tasks", seedTasks.map((task) => ({ ...task, date: todayKey })), (value) =>
    Array.isArray(value)
      ? value.map((task) => normalizeTask(task as Partial<Task>, todayKey))
      : seedTasks.map((task) => ({ ...task, date: todayKey })),
  );
}

function getInitialHabits() {
  return readStorage("daycore-habits", seedHabits, (value) =>
    Array.isArray(value) ? value.map((habit) => normalizeHabit(habit as Partial<Habit>)) : seedHabits,
  );
}

function getInitialEvents(todayKey: string) {
  return readStorage("daycore-events", seedEvents.map((event) => ({ ...event, date: todayKey })), (value) =>
    Array.isArray(value)
      ? value.map((event) => normalizeEvent(event as Partial<CalendarEvent>, todayKey))
      : seedEvents.map((event) => ({ ...event, date: todayKey })),
  );
}

function getInitialCategories() {
  return readStorage("daycore-categories", seedCategories, (value) => {
    const saved = Array.isArray(value)
      ? value.flatMap((item, index) => {
          if (!item || typeof item !== "object") return [];
          const category = item as Partial<Category>;
          const name = typeof category.name === "string" ? category.name.trim() : "";
          if (!name) return [];
          return [{
            id: typeof category.id === "number" ? category.id : Date.now() + index,
            name,
            color: typeof category.color === "string" ? category.color : "#2878f0",
          }];
        })
      : seedCategories;

    const legacyNames = ["daycore-tasks", "daycore-events"].flatMap((key) => {
      try {
        const items = JSON.parse(window.localStorage.getItem(key) ?? "[]");
        return Array.isArray(items)
          ? items.map((item) => (item && typeof item.tag === "string" ? item.tag.trim() : "")).filter(Boolean)
          : [];
      } catch {
        return [];
      }
    });

    const categories = [...saved];
    legacyNames.forEach((name, index) => {
      if (!categories.some((category) => category.name.toLocaleLowerCase("ru") === name.toLocaleLowerCase("ru"))) {
        categories.push({ id: Date.now() + 100 + index, name, color: "#64748b" });
      }
    });
    return categories.length ? categories : seedCategories;
  });
}

function getInitialSettings() {
  return readStorage("daycore-settings", seedSettings, (value) => {
    if (!value || typeof value !== "object") return seedSettings;
    const saved = value as Partial<DayCoreSettings>;
    return {
      ...seedSettings,
      ...saved,
      displayName: typeof saved.displayName === "string" ? saved.displayName : seedSettings.displayName,
      dayStart: typeof saved.dayStart === "string" ? saved.dayStart : seedSettings.dayStart,
      defaultTaskTime: typeof saved.defaultTaskTime === "string" ? saved.defaultTaskTime : seedSettings.defaultTaskTime,
      defaultCategory: typeof saved.defaultCategory === "string" ? saved.defaultCategory : seedSettings.defaultCategory,
      reminderMinutes: typeof saved.reminderMinutes === "number" ? saved.reminderMinutes : seedSettings.reminderMinutes,
    };
  });
}

function getInitialFocus() {
  const focus = readStorage("daycore-focus", seedFocus, (value) => normalizeFocus((value ?? {}) as Partial<FocusState>));
  if (typeof window !== "undefined" && !window.localStorage.getItem("daycore-focus-real-data-v1")) {
    window.localStorage.setItem("daycore-focus-real-data-v1", "1");
    return { ...focus, completedSessions: 0, completedMinutes: 0 };
  }
  return focus;
}

export function useDayCore() {
  const initialToday = useMemo(() => getInitialToday(), []);
  const initialTodayKey = useMemo(() => toDateKey(initialToday), [initialToday]);
  const [dark, setDark] = useState(() => getInitialDark());
  const [tasks, setTasks] = useState<Task[]>(() => getInitialTasks(initialTodayKey));
  const [habits, setHabits] = useState<Habit[]>(() => getInitialHabits());
  const [events, setEvents] = useState<CalendarEvent[]>(() => getInitialEvents(initialTodayKey));
  const [categories, setCategories] = useState<Category[]>(() => getInitialCategories());
  const [settings, setSettings] = useState<DayCoreSettings>(() => getInitialSettings());
  const [focusState, setFocusState] = useState<FocusState>(() => getInitialFocus());
  const [focusSessions, setFocusSessions] = useState<FocusSessionSummary[]>([]);
  const [focusSynced, setFocusSynced] = useState(false);
  const [today] = useState(initialToday);
  const didMountDark = useRef(false);

  useEffect(() => {
    if (!apiEnabled || !getTokens()) return;
    type Page<T> = { results: T[] };
    type ApiCategory = { id: number; name: string; color: string };
    type ApiTask = { id: number; title: string; category_name: string | null; date: string; time: string | null; done: boolean };
    type ApiEvent = { id: number; title: string; category_name: string | null; date: string; time: string | null };
    type ApiHabit = { id: number; name: string; goal: string; description: string; current_streak: number; completed_dates: string[] };
    type ApiFocusSession = { id: number; started_at: string; duration_minutes: number; completed: boolean };
    type ApiSettings = { display_name: string; day_start: string; default_task_time: string; default_category: number | null; dark_theme: boolean; notifications_enabled: boolean; task_reminders: boolean; daily_summary: boolean; habit_reminders: boolean; reminder_minutes: number };

    Promise.all([
      apiRequest<Page<ApiCategory>>("/api/categories/?page_size=200"),
      apiRequest<Page<ApiTask>>("/api/tasks/?page_size=200"),
      apiRequest<Page<ApiEvent>>("/api/events/?page_size=200"),
      apiRequest<Page<ApiHabit>>("/api/habits/?page_size=200"),
      apiRequest<Page<ApiFocusSession>>("/api/focus-sessions/?page_size=200&ordering=-started_at"),
      apiRequest<ApiSettings>("/api/settings/"),
    ]).then(([categoryPage, taskPage, eventPage, habitPage, focusPage, apiSettings]) => {
      const monday = new Date(initialToday);
      monday.setDate(initialToday.getDate() - ((initialToday.getDay() + 6) % 7));
      const weekKeys = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday);
        date.setDate(monday.getDate() + index);
        return toDateKey(date);
      });
      setCategories(categoryPage.results);
      setTasks(taskPage.results.map((task) => ({ id: task.id, title: task.title, tag: task.category_name ?? "Без категории", date: task.date, time: task.time?.slice(0, 5) ?? "Сегодня", done: task.done })));
      setEvents(eventPage.results.map((event) => ({ id: event.id, title: event.title, tag: event.category_name ?? "Без категории", date: event.date, time: event.time?.slice(0, 5) ?? "09:00" })));
      setHabits(habitPage.results.map((habit) => ({
        id: habit.id, name: habit.name, goal: habit.goal, description: habit.description, streak: habit.current_streak,
        week: weekKeys.map((key) => habit.completed_dates.includes(key)),
      })));
      setFocusSessions(focusPage.results.map((session) => ({ id: session.id, startedAt: session.started_at, durationMinutes: session.duration_minutes, completed: session.completed })));
      setFocusSynced(true);
      const defaultCategory = categoryPage.results.find((category) => category.id === apiSettings.default_category)?.name ?? categoryPage.results[0]?.name ?? "Личное";
      setDark(apiSettings.dark_theme);
      setSettings({ displayName: apiSettings.display_name, dayStart: apiSettings.day_start.slice(0, 5), defaultTaskTime: apiSettings.default_task_time.slice(0, 5), defaultCategory, notificationsEnabled: apiSettings.notifications_enabled, taskReminders: apiSettings.task_reminders, dailySummary: apiSettings.daily_summary, habitReminders: apiSettings.habit_reminders, reminderMinutes: apiSettings.reminder_minutes });
    }).catch(() => {
      // Keep the local data available when the API is offline.
    });
  // Initial synchronization only; subsequent changes are sent by mutations below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem("daycore-theme", dark ? "dark" : "light");
    if (!didMountDark.current) {
      didMountDark.current = true;
      return;
    }
    if (apiEnabled && getTokens()) apiRequest("/api/settings/", { method: "PATCH", body: JSON.stringify({ dark_theme: dark }) }).catch(() => undefined);
  }, [dark]);

  useEffect(() => {
    saveStorage("daycore-tasks", tasks);
  }, [tasks]);

  useEffect(() => {
    saveStorage("daycore-habits", habits);
  }, [habits]);

  useEffect(() => {
    saveStorage("daycore-events", events);
  }, [events]);

  useEffect(() => {
    saveStorage("daycore-categories", categories);
  }, [categories]);

  useEffect(() => {
    saveStorage("daycore-settings", settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.notificationsEnabled || !settings.taskReminders || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    const timers = tasks.flatMap((task) => {
      if (task.done || task.date !== initialTodayKey || !/^\d{2}:\d{2}$/.test(task.time)) return [];
      const [hours, minutes] = task.time.split(":").map(Number);
      const notifyAt = new Date();
      notifyAt.setHours(hours, minutes - settings.reminderMinutes, 0, 0);
      const delay = notifyAt.getTime() - Date.now();
      if (delay <= 0 || delay > 86_400_000) return [];
      return [window.setTimeout(() => {
        new Notification(`Скоро: ${task.title}`, { body: `${task.time} · ${task.tag}` });
      }, delay)];
    });

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [initialTodayKey, settings.notificationsEnabled, settings.reminderMinutes, settings.taskReminders, tasks]);

  useEffect(() => {
    saveStorage("daycore-focus", focusState);
  }, [focusState]);

  useEffect(() => {
    if (!focusState.endAt) return;

    const tick = () => {
      setFocusState((current) => {
        if (!current.endAt) return current;
        const remainingSeconds = Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000));

        if (remainingSeconds > 0) {
          return { ...current, remainingSeconds };
        }

        if (apiEnabled && getTokens() && current.mode === "Фокус") {
          const endedAt = new Date();
          const startedAt = new Date(endedAt.getTime() - current.durationSeconds * 1000);
          apiRequest<{ id: number; started_at: string; duration_minutes: number; completed: boolean }>("/api/focus-sessions/", {
            method: "POST",
            body: JSON.stringify({ mode: "focus", started_at: startedAt.toISOString(), ended_at: endedAt.toISOString(), duration_minutes: Math.round(current.durationSeconds / 60), completed: true }),
          }).then((session) => setFocusSessions((sessions) => [{ id: session.id, startedAt: session.started_at, durationMinutes: session.duration_minutes, completed: session.completed }, ...sessions])).catch(() => undefined);
        }

        return {
          ...current,
          endAt: null,
          remainingSeconds: 0,
          completedSessions: current.mode === "Фокус" ? current.completedSessions + 1 : current.completedSessions,
          completedMinutes: current.mode === "Фокус" ? current.completedMinutes + current.durationSeconds / 60 : current.completedMinutes,
        };
      });
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [focusState.endAt]);

  const todayKey = toDateKey(today);
  const currentWeek = useMemo(() => {
    const monday = new Date(today);
    const weekday = (today.getDay() + 6) % 7;
    monday.setDate(today.getDate() - weekday);

    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      return {
        key: toDateKey(date),
        label: new Intl.DateTimeFormat("ru-RU", { weekday: "short" }).format(date).slice(0, 2).toUpperCase(),
        number: String(date.getDate()),
        isToday: toDateKey(date) === todayKey,
        fullDate: date,
      };
    });
  }, [today, todayKey]);

  const dateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(today),
    [today],
  );

  const calendarMonthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("ru-RU", {
        month: "long",
        year: "numeric",
      }).format(today),
    [today],
  );

  const todayIndex = (today.getDay() + 6) % 7;
  const tasksDone = tasks.filter((task) => task.done).length;
  const habitsCompleted = habits.reduce((sum, habit) => sum + habit.week.filter(Boolean).length, 0);
  const habitsTotal = habits.length * 7;

  const taskStats = {
    total: tasks.length,
    done: tasksDone,
    active: tasks.filter((task) => !task.done).length,
    progress: tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0,
  };

  const habitProgress = habitsTotal ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;
  const weekStartKey = currentWeek[0]?.key ?? todayKey;
  const weekEndKey = currentWeek[6]?.key ?? todayKey;
  const completedFocusSessions = focusSessions.filter((session) => session.completed);
  const focusTodaySessions = completedFocusSessions.filter((session) => toDateKey(new Date(session.startedAt)) === todayKey);
  const focusWeekSessions = completedFocusSessions.filter((session) => {
    const key = toDateKey(new Date(session.startedAt));
    return key >= weekStartKey && key <= weekEndKey;
  });
  const remoteFocusTodayStats = {
    sessions: focusTodaySessions.length,
    minutes: focusTodaySessions.reduce((sum, session) => sum + session.durationMinutes, 0),
  };
  const remoteFocusWeekStats = {
    sessions: focusWeekSessions.length,
    minutes: focusWeekSessions.reduce((sum, session) => sum + session.durationMinutes, 0),
  };
  const focusTodayStats = focusSynced ? remoteFocusTodayStats : { sessions: focusState.completedSessions, minutes: focusState.completedMinutes };
  const focusWeekStats = focusSynced ? remoteFocusWeekStats : { sessions: focusState.completedSessions, minutes: focusState.completedMinutes };
  const focusProgress = Math.min(100, Math.round((focusTodayStats.minutes / 120) * 100));

  const addTask = (title: string, options?: { date?: string; time?: string; tag?: string }) => {
    const value = title.trim();
    if (!value) return;
    const task = { id: Date.now(), title: value, time: options?.time?.trim() || "Сегодня", tag: options?.tag ?? settings.defaultCategory, done: false, date: options?.date ?? todayKey };
    setTasks((current) => [...current, task]);
    const category = categories.find((item) => item.name === task.tag);
    if (apiEnabled && getTokens()) apiRequest<{ id: number }>("/api/tasks/", { method: "POST", body: JSON.stringify({ title: task.title, time: task.time === "Сегодня" ? null : task.time, date: task.date, category: category?.id ?? null }) })
      .then((created) => setTasks((current) => current.map((item) => item.id === task.id ? { ...item, id: created.id } : item))).catch(() => undefined);
  };

  const toggleTask = (taskId: number) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)));
    if (apiEnabled && getTokens()) apiRequest(`/api/tasks/${taskId}/toggle/`, { method: "POST" }).catch(() => undefined);
  };

  const removeTask = (taskId: number) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
    if (apiEnabled && getTokens()) apiRequest(`/api/tasks/${taskId}/`, { method: "DELETE" }).catch(() => undefined);
  };

  const addHabit = (name: string, options?: { goal?: string; description?: string }) => {
    const value = name.trim();
    if (!value) return;

    const habit = { id: Date.now(), name: value, goal: options?.goal?.trim() || "Ежедневно", description: options?.description?.trim() || "", streak: 0, week: [false, false, false, false, false, false, false] };
    setHabits((current) => [...current, habit]);
    if (apiEnabled && getTokens()) apiRequest<{ id: number }>("/api/habits/", { method: "POST", body: JSON.stringify({ name: habit.name, goal: habit.goal, description: habit.description }) })
      .then((created) => setHabits((current) => current.map((item) => item.id === habit.id ? { ...item, id: created.id } : item))).catch(() => undefined);
  };

  const toggleHabitDay = (habitId: number, dayIndex: number) => {
    setHabits((current) =>
      current.map((habit) => {
        if (habit.id !== habitId) return habit;

        const week = habit.week.map((done, index) => (index === dayIndex ? !done : done));
        return {
          ...habit,
          week,
          streak: countCurrentStreak(week, todayIndex),
        };
      }),
    );
    if (apiEnabled && getTokens()) apiRequest(`/api/habits/${habitId}/toggle-completion/`, { method: "POST", body: JSON.stringify({ date: currentWeek[dayIndex]?.key ?? todayKey }) }).catch(() => undefined);
  };

  const addEvent = (title: string, date: string, time: string, tag = "Личное") => {
    const value = title.trim();
    if (!value) return;

    const calendarEvent = { id: Date.now(), title: value, date, time: time.trim() || settings.defaultTaskTime, tag: tag.trim() || settings.defaultCategory };
    setEvents((current) => [...current, calendarEvent]);
    const category = categories.find((item) => item.name === calendarEvent.tag);
    if (apiEnabled && getTokens()) apiRequest<{ id: number }>("/api/events/", { method: "POST", body: JSON.stringify({ title: calendarEvent.title, date, time: calendarEvent.time, category: category?.id ?? null }) })
      .then((created) => setEvents((current) => current.map((item) => item.id === calendarEvent.id ? { ...item, id: created.id } : item))).catch(() => undefined);
  };

  const removeEvent = (eventId: number) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
    if (apiEnabled && getTokens()) apiRequest(`/api/events/${eventId}/`, { method: "DELETE" }).catch(() => undefined);
  };

  const addCategory = (name: string, color: string) => {
    const value = name.trim();
    if (!value) return false;
    if (categories.some((category) => category.name.toLocaleLowerCase("ru") === value.toLocaleLowerCase("ru"))) return false;
    const category = { id: Date.now(), name: value, color };
    setCategories((current) => [...current, category]);
    if (apiEnabled && getTokens()) apiRequest<Category>("/api/categories/", { method: "POST", body: JSON.stringify({ name: value, color }) })
      .then((created) => setCategories((current) => current.map((item) => item.id === category.id ? created : item))).catch(() => undefined);
    return true;
  };

  const removeCategory = (categoryId: number) => {
    setCategories((current) => current.filter((category) => category.id !== categoryId));
    if (apiEnabled && getTokens()) apiRequest(`/api/categories/${categoryId}/`, { method: "DELETE" }).catch(() => undefined);
  };

  const updateSettings = (changes: Partial<DayCoreSettings>) => {
    setSettings((current) => ({ ...current, ...changes }));
    if (apiEnabled && getTokens()) {
      const payload: Record<string, unknown> = {};
      if (changes.displayName !== undefined) payload.display_name = changes.displayName;
      if (changes.dayStart !== undefined) payload.day_start = changes.dayStart;
      if (changes.defaultTaskTime !== undefined) payload.default_task_time = changes.defaultTaskTime;
      if (changes.defaultCategory !== undefined) payload.default_category = categories.find((category) => category.name === changes.defaultCategory)?.id ?? null;
      if (changes.notificationsEnabled !== undefined) payload.notifications_enabled = changes.notificationsEnabled;
      if (changes.taskReminders !== undefined) payload.task_reminders = changes.taskReminders;
      if (changes.dailySummary !== undefined) payload.daily_summary = changes.dailySummary;
      if (changes.habitReminders !== undefined) payload.habit_reminders = changes.habitReminders;
      if (changes.reminderMinutes !== undefined) payload.reminder_minutes = changes.reminderMinutes;
      apiRequest("/api/settings/", { method: "PATCH", body: JSON.stringify(payload) }).catch(() => undefined);
    }
  };

  const setFocusMode = (mode: FocusMode) => {
    setFocusState((current) => ({
      ...current,
      mode,
      durationSeconds: focusDurations[mode],
      remainingSeconds: focusDurations[mode],
      endAt: null,
    }));
  };

  const toggleFocus = () => {
    setFocusState((current) => {
      if (current.endAt) {
        const remainingSeconds = Math.max(0, Math.ceil((current.endAt - Date.now()) / 1000));
        return { ...current, endAt: null, remainingSeconds };
      }

      const remainingSeconds = current.remainingSeconds > 0 ? current.remainingSeconds : current.durationSeconds;
      return {
        ...current,
        remainingSeconds,
        endAt: Date.now() + remainingSeconds * 1000,
      };
    });
  };

  const resetFocus = (clear = false) => {
    setFocusState((current) => ({
      ...current,
      endAt: null,
      remainingSeconds: clear ? 0 : current.durationSeconds,
    }));
  };

  return {
    dark,
    setDark,
    today,
    todayKey,
    currentWeek,
    dateLabel,
    calendarMonthLabel,
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
    addEvent,
    removeEvent,
    addCategory,
    removeCategory,
    updateSettings,
    setFocusMode,
    toggleFocus,
    resetFocus,
  };
}
