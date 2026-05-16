import { useEffect, useState } from "react";
import type { Role } from "./mock-data";

const KEY = "talenthive.session";

export type Session = { name: string; email: string; role: Role } | null;

export function getSession(): Session {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; }
}

export function setSession(s: Session) {
  if (typeof window === "undefined") return;
  if (s) localStorage.setItem(KEY, JSON.stringify(s));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("session-change"));
}

export function useSession() {
  const [session, setS] = useState<Session>(null);
  useEffect(() => {
    setS(getSession());
    const h = () => setS(getSession());
    window.addEventListener("session-change", h);
    window.addEventListener("storage", h);
    return () => {
      window.removeEventListener("session-change", h);
      window.removeEventListener("storage", h);
    };
  }, []);
  return session;
}
