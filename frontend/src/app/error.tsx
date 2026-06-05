"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import styles from "./error.module.scss";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Error]", error);
  }, [error]);

  return (
    <div className={styles.container}>
      <div className={styles.glow} />

      <div className={styles.card}>
        <span className={styles.code}>500</span>
        <span className={styles.eyebrow}>Помилка сервера</span>
        <h1 className={styles.title}>Щось пішло не так</h1>
        <p className={styles.description}>
          Сторінка не змогла завантажитись через внутрішню помилку. Спробуйте
          оновити або поверніться на головну.
        </p>
        {error.digest && (
          <p className={styles.digest}>Код помилки: {error.digest}</p>
        )}
        <div className={styles.actions}>
          <button type="button" onClick={reset} className={styles.btnPrimary}>
            Спробувати знову
          </button>
          <Link href={ROUTES.home} className={styles.btnSecondary}>
            На головну
          </Link>
        </div>
      </div>
    </div>
  );
}
