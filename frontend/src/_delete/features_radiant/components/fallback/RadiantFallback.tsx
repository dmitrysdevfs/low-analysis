"use client";

import { Globe2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import styles from "./RadiantFallback.module.scss";

export function RadiantFallback() {
  const router = useRouter();

  return (
    <div className={styles.overlay}>
      <Globe2 className={styles.icon} size={72} />
      <h1 className={styles.title}>Радіант недоступний</h1>
      <p className={styles.subtitle}>
        Ваш пристрій або браузер не підтримує 3D-графіку (WebGL)
      </p>
      <div className={styles.actions}>
        <a href={ROUTES.graph} className={styles.primaryBtn}>
          Перейти до 2D Графу
        </a>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => router.back()}
        >
          Повернутись назад
        </button>
      </div>
    </div>
  );
}
