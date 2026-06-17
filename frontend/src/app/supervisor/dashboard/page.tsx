"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Layout } from "@/components/layout/Layout";
import { useSupervisorDashboard, useCreateSupervisorGroup } from "@/hooks/useSupervisor";
import { notify } from "@/lib/toast";
import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.scss";

export default function SupervisorDashboardPage() {
  const { isSupervisor, isHydrated } = useAuth();

  if (!isHydrated) {
    return (
      <Layout>
        <div className={styles.loading}>Завантаження...</div>
      </Layout>
    );
  }

  if (!isSupervisor) {
    return (
      <Layout>
        <div className={styles.gate}>
          <h1>Доступ обмежено</h1>
          <p>
            Цей розділ доступний лише для супервайзерів. Якщо ви хочете отримати роль
            Супервайзера — зверніться до адміністратора платформи.
          </p>
          <div className={styles.gateActions}>
            <Link href="/roles/supervisor" className={styles.btnPrimary}>
              Про роль Супервайзера
            </Link>
            <Link href="/help" className={styles.btnSecondary}>
              Зв'язатися з адміном
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SupervisorDashboardView />
    </Layout>
  );
}

function SupervisorDashboardView() {
  const { data, isLoading, error } = useSupervisorDashboard();
  const createGroup = useCreateSupervisorGroup();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupCourse, setGroupCourse] = useState("");

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    try {
      await createGroup.mutateAsync({ name: groupName, course: groupCourse });
      notify.success("Групу створено");
      setGroupName("");
      setGroupCourse("");
      setShowCreateForm(false);
    } catch {
      notify.error("Не вдалося створити групу");
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Завантаження дашборду...</div>;
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <h2>Дашборд тимчасово недоступний</h2>
        <p>Бекенд API ще не розгорнуто або вимагає авторизації з роллю supervisor.</p>
        <p className={styles.hint}>Після пуша змін до репо — перезавантажте сторінку.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Кабінет супервайзера</h1>
        <div className={styles.headerMeta}>
          <span>{data?.totalMembers ?? 0} учасників</span>
          <span>{data?.totalTrackedLaws ?? 0} відстежуваних законів</span>
        </div>
        {!showCreateForm && (
          <button onClick={() => setShowCreateForm(true)} className={styles.btnCreate}>
            + Нова група
          </button>
        )}
      </header>

      {showCreateForm && (
        <section className={styles.formSection}>
          <h2>Створити групу</h2>
          <form onSubmit={handleCreateGroup} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Назва групи:</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Наприклад: Право 2026 — Група А"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label>Курс / програма:</label>
              <input
                type="text"
                value={groupCourse}
                onChange={(e) => setGroupCourse(e.target.value)}
                placeholder="Наприклад: Конституційне право"
              />
            </div>
            <div className={styles.formActions}>
              <button type="button" onClick={() => setShowCreateForm(false)}>
                Скасувати
              </button>
              <button type="submit" disabled={createGroup.isPending}>
                Зберегти
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.section}>
        <h2>Мої групи</h2>
        {!data?.groups?.length ? (
          <p className={styles.empty}>Ви ще не створили жодної групи. Натисніть «+ Нова група».</p>
        ) : (
          <div className={styles.groupsGrid}>
            {data.groups.map((group) => (
              <div key={group._id} className={styles.groupCard}>
                <h3>{group.name}</h3>
                {group.course && <p className={styles.course}>{group.course}</p>}
                <div className={styles.groupStats}>
                  <span>{group.memberIds.length} учасників</span>
                  <span>{group.trackedLawIds.length} законів</span>
                </div>
                {group.trackedLawIds.length > 0 && (
                  <div className={styles.lawTags}>
                    {group.trackedLawIds.slice(0, 3).map((law) => (
                      <span key={law._id} className={styles.lawTag}>
                        {law.code}
                      </span>
                    ))}
                    {group.trackedLawIds.length > 3 && (
                      <span className={styles.lawTag}>+{group.trackedLawIds.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Моніторинг законопроєктів</h2>
        {!data?.lawActivity?.length ? (
          <p className={styles.empty}>Поки немає активності по законах. Додайте учасників до груп.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Закон</th>
                  <th>Форки</th>
                  <th>Пропозиції</th>
                  <th>Остання активність</th>
                </tr>
              </thead>
              <tbody>
                {data.lawActivity.map((item) => (
                  <tr key={item.law._id}>
                    <td>
                      <Link href={`/laws/${item.law._id}`}>
                        {item.law.code} — {item.law.title?.slice(0, 40)}
                        {(item.law.title?.length ?? 0) > 40 ? "…" : ""}
                      </Link>
                    </td>
                    <td>{item.forkCount}</td>
                    <td>{item.proposalCount}</td>
                    <td>
                      {item.lastActivityAt
                        ? new Date(item.lastActivityAt).toLocaleDateString("uk-UA")
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.section}>
        <h2>Остання активність учасників</h2>
        {!data?.recentActivity?.length ? (
          <p className={styles.empty}>Активності поки немає. Запросіть учасників до груп.</p>
        ) : (
          <div className={styles.activityList}>
            {data.recentActivity.map((item, idx) => (
              <div key={idx} className={styles.activityItem}>
                <span className={styles.activityType}>
                  {item.type === "fork" ? "📄 Форк" : "✏️ Пропозиція"}
                </span>
                <div className={styles.activityContent}>
                  <strong>{item.title}</strong>
                  <span className={styles.activityMeta}>
                    {item.author} · {item.law} ·{" "}
                    <span className={`${styles.status} ${styles[`status_${item.status}`]}`}>
                      {item.status}
                    </span>
                  </span>
                </div>
                <span className={styles.activityDate}>
                  {new Date(item.updatedAt).toLocaleDateString("uk-UA")}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
