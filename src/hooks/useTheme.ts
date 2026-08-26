import { useCallback, useEffect, useState } from "react";
import {
  getStoredTheme,
  setTheme as persistTheme,
  clearTheme,
  getSystemTheme,
} from "../lib/theme";

type Theme = "light" | "dark";
type ThemeMode = Theme | "system";

export function useTheme() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const stored = getStoredTheme();
    return stored ?? "system";
  });

  const resolved: Theme = mode === "system" ? getSystemTheme() : mode;

  // Sync class on mount (React strict mode safe)
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(resolved);
  }, [resolved]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (mode !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(getSystemTheme());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      persistTheme(next);
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(next);
      return next;
    });
  }, []);

  const setModeFn = useCallback((m: ThemeMode) => {
    setMode(m);
    if (m === "system") {
      clearTheme();
    } else {
      persistTheme(m);
    }
  }, []);

  return { mode, resolved, toggle, setMode: setModeFn };
}
