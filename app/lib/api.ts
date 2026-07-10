const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const apiEnabled = Boolean(API_URL);

type Tokens = { access: string; refresh: string };

export function getTokens(): Tokens | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(window.localStorage.getItem("daycore-auth") ?? "null") as Tokens | null;
  } catch {
    return null;
  }
}

export function saveTokens(tokens: Tokens | null) {
  if (typeof window === "undefined") return;
  if (tokens) window.localStorage.setItem("daycore-auth", JSON.stringify(tokens));
  else window.localStorage.removeItem("daycore-auth");
}

async function refreshAccess(): Promise<string | null> {
  const tokens = getTokens();
  if (!tokens?.refresh) return null;
  const response = await fetch(`${API_URL}/api/auth/token/refresh/`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refresh: tokens.refresh }),
  });
  if (!response.ok) {
    saveTokens(null);
    return null;
  }
  const next = await response.json() as { access: string; refresh?: string };
  saveTokens({ access: next.access, refresh: next.refresh ?? tokens.refresh });
  return next.access;
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  if (!apiEnabled) throw new Error("API is not configured");
  const tokens = getTokens();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (tokens?.access) headers.set("Authorization", `Bearer ${tokens.access}`);
  const response = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (response.status === 401 && retry && await refreshAccess()) return apiRequest<T>(path, init, false);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Ошибка API" }));
    throw new Error(error.detail ?? JSON.stringify(error));
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const tokens = await apiRequest<Tokens>("/api/auth/token/", { method: "POST", body: JSON.stringify({ username, password }) });
  saveTokens(tokens);
}

export async function register(username: string, email: string, password: string, firstName: string) {
  await apiRequest("/api/auth/register/", { method: "POST", body: JSON.stringify({ username, email, password, first_name: firstName }) });
  await login(username, password);
}

export function logout() {
  saveTokens(null);
  window.location.href = "/auth";
}
