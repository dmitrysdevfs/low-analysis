"use client";

import { formatAccessRoleLabel, formatBooleanLabel } from "./adminLabels";
import { useAdminWorkspace } from "./useAdminWorkspace";
import { AdminRequestsPanel } from "@/features/law-change/components/AdminRequestsPanel/AdminRequestsPanel";
import styles from "./AdminWorkspace.module.scss";

export function AdminAccessView() {
  const { snapshot } = useAdminWorkspace();

  if (!snapshot) {
    return null;
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Доступ</span>
          <h2 className={styles.title}>Тримайте права доступу в полі зору.</h2>
          <p className={styles.description}>
            Модуль доступу лишається сумісним із поточним маршрутним захистом,
            але подає матрицю ролей як окрему контрольну сторінку з явним
            покриттям нового адмін-простору.
          </p>
        </div>

        <aside className={styles.heroAside}>
          <span className={styles.tag}>Захищені зони</span>
          <div className={styles.heroValue}>
            {snapshot.protectedRoutes} маршрутів
          </div>
          <div className={styles.heroMeta}>
            Тепер усі адмінські поверхні зібрані під однією оболонкою і однією
            родиною маршрутів.
          </div>
        </aside>
      </section>

      <section className={styles.metricsGrid}>
        {snapshot.accessMatrix.map((row) => {
          const allowed = [
            row.home,
            row.laws,
            row.subjects,
            row.search,
            row.account,
            row.adminPanel,
            row.legislatorCabinet,
          ].filter(Boolean).length;

          return (
            <article key={row.role} className={styles.metricCard}>
              <span className={styles.metricLabel}>
                {formatAccessRoleLabel(row.role)}
              </span>
              <strong className={styles.metricValue}>{allowed}</strong>
              <p className={styles.metricNote}>
                Увімкнені верхньорівневі поверхні для поточної моделі ролей.
              </p>
            </article>
          );
        })}
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Адмін-оболонка</span>
          <strong className={styles.metricValue}>
            {snapshot.protectedRoutes}
          </strong>
          <p className={styles.metricNote}>
            Окремі адмін-маршрути тепер ізольовані від оболонки публічного
            сайту.
          </p>
        </article>
      </section>

      <section className={styles.contentGrid}>
        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Матриця ролей</span>
              <h3 className={styles.panelTitle}>Хто що може відкрити</h3>
            </div>
          </div>

          <div className={styles.matrix}>
            <div className={styles.matrixHead}>
              <span>Роль</span>
              <span>Головна</span>
              <span>Закони</span>
              <span>Суб'єкти</span>
              <span>Пошук</span>
              <span>Акаунт</span>
              <span>Кабінет</span>
              <span>Адмін</span>
            </div>

            {snapshot.accessMatrix.map((row) => (
              <div key={row.role} className={styles.matrixRow}>
                <span className={styles.matrixRole}>
                  {formatAccessRoleLabel(row.role)}
                </span>
                <span>{formatBooleanLabel(row.home)}</span>
                <span>{formatBooleanLabel(row.laws)}</span>
                <span>{formatBooleanLabel(row.subjects)}</span>
                <span>{formatBooleanLabel(row.search)}</span>
                <span>{formatBooleanLabel(row.account)}</span>
                <span>{formatBooleanLabel(row.legislatorCabinet)}</span>
                <span>{formatBooleanLabel(row.adminPanel)}</span>
              </div>
            ))}
          </div>
        </article>

      </section>

      <AdminRequestsPanel />
    </section>
  );
}
