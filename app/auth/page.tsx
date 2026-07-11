"use client";

import { FormEvent, useState } from "react";
import { apiEnabled, login, register } from "../lib/api";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "register") await register(username, email, password, firstName);
      else await login(username, password);
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next?.startsWith("/") && !next.startsWith("//") ? next : "/";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <form className="panel auth-card" onSubmit={submit}>
        <span className="brand-mark">D</span>
        <div><p className="eyebrow">DAYCORE</p><h1>{mode === "login" ? "Вход" : "Создать аккаунт"}</h1><p className="muted-copy">Ваши планы будут синхронизироваться через защищённый API.</p></div>
        {!apiEnabled && <p className="form-error">Укажите NEXT_PUBLIC_API_URL в .env.local</p>}
        {mode === "register" && <label>Имя<input value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></label>}
        <label>Логин<input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required /></label>
        {mode === "register" && <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>}
        <label>Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required /></label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary" disabled={loading || !apiEnabled} type="submit">{loading ? "Подождите…" : mode === "login" ? "Войти" : "Зарегистрироваться"}</button>
        <button className="text-action" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }} type="button">{mode === "login" ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Войти"}</button>
      </form>
    </main>
  );
}
