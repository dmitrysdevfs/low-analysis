"use client";

import type React from "react";
import { useTheme, THEME_META, type Theme } from "@/hooks/useTheme";
import styles from "./ThemeSwitcher.module.scss";

const THEME_ORDER: readonly Theme[] = ["default", "teal", "violet", "sun"];

export function ThemeSwitcher() {
  const { theme, changeTheme } = useTheme();

  return (
    <div className={styles.root} role="group" aria-label="Кольорова тема">
      {THEME_ORDER.map((t) => (
        <button
          key={t}
          type="button"
          className={`${styles.swatch} ${theme === t ? styles.swatchActive : ""}`}
          style={
            { "--swatch-color": THEME_META[t].color } as React.CSSProperties
          }
          onClick={() => changeTheme(t)}
          title={THEME_META[t].label}
          aria-label={THEME_META[t].label}
          aria-pressed={theme === t}
        />
      ))}
    </div>
  );
}
