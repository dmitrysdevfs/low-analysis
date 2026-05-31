"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "./AuthProvider";
import styles from "./RouteAccessGate.module.scss";

function matchesRoute(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function AccessState({
  eyebrow,
  title,
  description,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref: string;
  secondaryLabel: string;
}) {
  return (
    <section className={styles.shell}>
      <div className={styles.glow} />
      <div className={styles.card}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        <div className={styles.actions}>
          <Link href={primaryHref} className={styles.primaryAction}>
            {primaryLabel}
          </Link>
          <Link href={secondaryHref} className={styles.secondaryAction}>
            {secondaryLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

export function RouteAccessGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, isAdmin, isLegislator, isHydrated, user } = useAuth();
  const isAdminRoute = matchesRoute(pathname, ROUTES.admin);
  const isClientProtectedRoute =
    matchesRoute(pathname, ROUTES.account) ||
    matchesRoute(pathname, "/legislator-cabinet");
  const isLegislatorRoute = matchesRoute(pathname, "/legislator-cabinet");

  if (!isHydrated && (isAdminRoute || isClientProtectedRoute)) {
    return (
      <section className={styles.shell}>
        <div className={styles.card}>
          <span className={styles.eyebrow}>Синхронізація доступу</span>
          <h1 className={styles.title}>Відновлення сесії</h1>
          <p className={styles.description}>
            Перевіряємо активну роль та відкриваємо відповідні розділи.
          </p>
        </div>
      </section>
    );
  }

  if (isAdminRoute && !isAuthenticated) {
    return (
      <AccessState
        eyebrow="Адмін-доступ"
        title="Панель адміна заблокована"
        description="Увійдіть як адміністратор, щоб відкрити центр керування та захищені інструменти."
        primaryHref={ROUTES.authLogin}
        primaryLabel="Вхід адміністратора"
        secondaryHref={`${ROUTES.authRegister}?role=admin`}
        secondaryLabel="Зареєструвати адміна"
      />
    );
  }

  if (isAdminRoute && isAuthenticated && !isAdmin) {
    return (
      <AccessState
        eyebrow="Обмежена зона"
        title="Клієнтська сесія не має доступу до панелі адміна"
        description={`Ви увійшли як ${user?.displayName ?? "клієнт"}. Перейдіть на адміністративний акаунт для керування захищеними операціями.`}
        primaryHref={ROUTES.home}
        primaryLabel="Повернутися на сайт"
        secondaryHref={`${ROUTES.authRegister}?role=admin`}
        secondaryLabel="Створити доступ адміна"
      />
    );
  }

  if (isClientProtectedRoute && !isAuthenticated) {
    return (
      <AccessState
        eyebrow="Клієнтський доступ"
        title="Цей розділ відкривається після входу"
        description="Закони, суб'єкти та пошук відкриті для гостей, але нотатки, збережені матеріали та налаштування акаунту доступні тільки після входу."
        primaryHref={ROUTES.authLogin}
        primaryLabel="Увійти"
        secondaryHref={`${ROUTES.authRegister}?role=client`}
        secondaryLabel="Створити акаунт"
      />
    );
  }

  if (isLegislatorRoute && isAuthenticated && !isLegislator) {
    return (
      <AccessState
        eyebrow="Обмежений доступ"
        title="Кабінет законотворця доступний тільки для фахівців"
        description="Для внесення поправок та створення пропозицій необхідний акаунт з роллю законотворця."
        primaryHref={ROUTES.home}
        primaryLabel="Повернутися на сайт"
        secondaryHref={ROUTES.accountBilling}
        secondaryLabel="Дізнатись про доступ"
      />
    );
  }

  return children;
}
