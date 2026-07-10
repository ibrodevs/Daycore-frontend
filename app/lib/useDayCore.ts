"use client";

import { useEffect, useMemo, useState } from "react";

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

type FocusMode = "Фокус" | "Короткий перерыв" | "Длинный перерыв";

type FocusState = {
  mode: FocusMode;
  durationSeconds: number;
  remainingSeconds: number;
  endAt: number | null;
  completedSessions: number;
  completedMinutes: number;
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

const seedFocus: FocusState = {
  mode: "Фокус",
  durationSeconds: focusDurations["Фокус"],
  remainingSeconds: focusDurations["Фокус"],
  endAt: null,
  completedSessions: 3,
  completedMinutes: 75,
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

export function useDayCore() {
  const initialToday = useMemo(() => getInitialToday(), []);
  const initialTodayKey = useMemo(() => toDateKey(initialToday), [initialToday]);
  const [dark, setDark] = useState(() => getInitialDark());
  const [tasks, setTasks] = useState<Task[]>(() => getInitialTasks(initialTodayKey));
  const [habits, setHabits] = useState<Habit[]>(() => getInitialHabits());
  const [events, setEvents] = useState<CalendarEvent[]>(() => getInitialEvents(initialTodayKey));
  const [focusState, setFocusState] = useState<FocusState>(() => readStorage("daycore-focus", seedFocus, (value) => normalizeFocus((value ?? {}) as Partial<FocusState>)));
  const [today] = useState(initialToday);

  useEffect(() => {
    window.localStorage.setItem("daycore-theme", dark ? "dark" : "light");
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

  const focusProgress = Math.min(100, Math.round((focusState.completedMinutes / 120) * 100));
  const habitProgress = habitsTotal ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;

  const addTask = (title: string, options?: { date?: string; time?: string; tag?: string }) => {
    const value = title.trim();
    if (!value) return;

    setTasks((current) => [
      ...current,
      {
        id: Date.now(),
        title: value,
        time: options?.time?.trim() || "Сегодня",
        tag: options?.tag ?? "Личное",
        done: false,
        date: options?.date ?? todayKey,
      },
    ]);
  };

  const toggleTask = (taskId: number) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)));
  };

  const removeTask = (taskId: number) => {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  };

  const addHabit = (name: string, options?: { goal?: string; description?: string }) => {
    const value = name.trim();
    if (!value) return;

    setHabits((current) => [
      ...current,
      {
        id: Date.now(),
        name: value,
        goal: options?.goal?.trim() || "Ежедневно",
        description: options?.description?.trim() || "",
        streak: 0,
        week: [false, false, false, false, false, false, false],
      },
    ]);
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
  };

  const addEvent = (title: string, date: string, time: string, tag = "Личное") => {
    const value = title.trim();
    if (!value) return;

    setEvents((current) => [
      ...current,
      {
        id: Date.now(),
        title: value,
        date,
        time: time.trim() || "09:00",
        tag: tag.trim() || "Личное",
      },
    ]);
  };

  const removeEvent = (eventId: number) => {
    setEvents((current) => current.filter((event) => event.id !== eventId));
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

      return {
        ...current,
        endAt: Date.now() + current.remainingSeconds * 1000,
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
    focusState,
    taskStats,
    focusProgress,
    habitProgress,
    addTask,
    toggleTask,
    removeTask,
    addHabit,
    toggleHabitDay,
    addEvent,
    removeEvent,
    setFocusMode,
    toggleFocus,
    resetFocus,
  };
}
