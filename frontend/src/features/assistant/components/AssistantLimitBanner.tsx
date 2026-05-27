"use client";

import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import styles from "./AssistantLimitBanner.module.scss";

interface Props {
  used: number;
  limit: number;
  resetAt?: number;
  warn?: boolean;
}

export function AssistantLimitBanner({ used, limit, resetAt, warn }: Props) {
  const resetDate = resetAt
    ? new Date(resetAt).toLocaleDateString("uk-UA")
    : null;

  if (warn) {
    const remaining = limit - used;
    return (
      <div className={`${styles.banner} ${styles.bannerWarn}`}>
        <span>
          Залишилось {remaining} з {limit} запитів AI на сьогодні.
        </span>
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.bannerBlock}`}>
      <p className={styles.title}>Ліміт запитів вичерпано</p>
      <p className={styles.description}>
        Використано {used} з {limit} запитів.
        {resetDate && ` Ліміт оновиться ${resetDate}.`}
      </p>
      <Link href={ROUTES.accountBilling} className={styles.cta}>
        Оновити план
      </Link>
    </div>
  );
}
