"use client";

import { PATREON_URL } from "@/constants/external";
import styles from "./PatreonButton.module.scss";

export function PatreonButton() {
  return (
    <a
      href={PATREON_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.btn}
      aria-label="Підтримати проект на Patreon"
    >
      <span className={styles.heart}>♥</span>
      <span className={styles.label}>Підтримати</span>
    </a>
  );
}
