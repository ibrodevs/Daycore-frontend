"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest, getTokens, saveTokens } from "../lib/api";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthPage = pathname === "/auth";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const tokens = getTokens();

    if (!tokens) {
      if (!isAuthPage) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      return () => { active = false; };
    }

    apiRequest("/api/auth/me/")
      .then(() => {
        if (!active) return;
        if (isAuthPage) router.replace("/");
        else queueMicrotask(() => active && setReady(true));
      })
      .catch(() => {
        if (!active) return;
        saveTokens(null);
        if (!isAuthPage) router.replace(`/auth?next=${encodeURIComponent(pathname)}`);
      });

    return () => { active = false; };
  }, [isAuthPage, pathname, router]);

  if (!isAuthPage && !ready) return <main className="auth-loading"><span className="brand-mark">D</span><p>Проверяем аккаунт…</p></main>;
  return children;
}
