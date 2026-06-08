"use client";

import { useEffect, useState } from "react";

export type Theme = "default" | "teal" | "violet" | "sun";

const THEMES: readonly Theme[] = ["default", "teal", "violet", "sun"];
const STORAGE_KEY = "law-analysis.admin.theme";

export const THEME_META: Record<Theme, { label: string; color: string }> = {
  default: { label: "Navy · Gold", color: "#c8a843" },
  teal: { label: "Teal · Jet Stream", color: "#bdd9d7" },
  violet: { label: "Violet · Lavender", color: "#6260ff" },
  sun: { label: "Sun · Big Stone", color: "#fcdb32" },
};

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "default";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (THEMES.includes(stored as Theme) ? stored : "default") as Theme;
  } catch {
    return "default";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "default") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  const changeTheme = (next: Theme) => {
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  return { theme, changeTheme, themes: THEMES, themeMeta: THEME_META };
}
