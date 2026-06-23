"use client";

import { useState } from "react";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  History,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
  formatUkDate,
} from "@/features/role-workspace/roleWorkspace";
import { useSupervisorHistory } from "@/hooks/useHistory";
import type {
  SupervisorEventFilter,
  SupervisorEventType,
} from "@/lib/api/history";
import shellStyles from "@/features/role-workspace/roleWorkspace.module.scss";
import styles from "./page.module.scss";

const EVENT_OPTIONS: { value: SupervisorEventFilter; label: string }[] = [
  { value: "all", label: "Усі події" },
  { value: "join", label: "Join" },
  { value: "leave", label: "Leave" },
  { value: "approve", label: "Approve" },
  { value: "reject", label: "Reject" },
  { value: "create_group", label: "Create group" },
  { value: "archive_group", label: "Archive group" },
];

const EVENT_LABELS: Record<SupervisorEventType, string> = {
  join: "Join",
  leave: "Leave",
  approve: "Approve",
  reject: "Reject",
  create_group: "Create group",
  archive_group: "Archive group",
};

const PAGE_SIZE = 20;

export default function SupervisorHistoryPage() {
  const { user, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [eventType, setEventType] = useState<SupervisorEventFilter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSupervisorHistory({
    from: fromDate || undefined,
    to: toDate || undefined,
    type: eventType,
    page,
    limit: PAGE_SIZE,
  });

  const pageItems = data?.items ?? [];
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;
  const totalCount = data?.total ?? 0;

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="SUPERVISOR ACCESS"
        title="Журнал подій доступний лише для ролі Supervisor"
        text="У цьому просторі зібрано історію приєднань, погоджень, відхилень і дій по групах. Для доступу потрібна роль супервайзера або адміністратора."
        primaryHref={ROUTES.rolesSupervisor}
        primaryLabel="Про роль Supervisor"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "SV").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin ? "Адміністратор" : "Супервайзер";

  return (
    <RoleWorkspace
      role="supervisor"
      initials={initials}
      name={user?.displayName ?? "Supervisor"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>SUPERVISOR · ІСТОРІЯ</span>
              <h1 className={shellStyles.pageTitle}>Журнал подій</h1>
              <p className={shellStyles.pageSubtitle}>
                Відстежуйте, хто приєднався до груп, які рішення були ухвалені
                та які навчальні групи створено або заархівовано.
              </p>
            </div>
            <div className={styles.summaryCard}>
              <CalendarRange size={18} />
              <div>
                <strong>{isLoading ? "…" : totalCount}</strong>
                <span>подій у вибірці</span>
              </div>
            </div>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.filtersPanel}`}>
          <div className={shellStyles.filtersRow}>
            <label className={shellStyles.field}>
              <span className={shellStyles.fieldLabel}>Дата від</span>
              <input
                type="date"
                className={shellStyles.input}
                value={fromDate}
                onChange={(event) => {
                  setFromDate(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className={shellStyles.field}>
              <span className={shellStyles.fieldLabel}>Дата до</span>
              <input
                type="date"
                className={shellStyles.input}
                value={toDate}
                onChange={(event) => {
                  setToDate(event.target.value);
                  setPage(1);
                }}
              />
            </label>

            <label className={shellStyles.field}>
              <span className={shellStyles.fieldLabel}>Тип події</span>
              <select
                className={shellStyles.select}
                value={eventType}
                onChange={(event) => {
                  setEventType(event.target.value as SupervisorEventFilter);
                  setPage(1);
                }}
              >
                {EVENT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.tablePanel}`}>
          {isLoading ? (
            <div className={shellStyles.emptyState}>
              <p className={shellStyles.emptyTitle}>Завантаження...</p>
            </div>
          ) : error ? (
            <div className={shellStyles.emptyState}>
              <p className={shellStyles.emptyTitle}>
                Помилка завантаження журналу
              </p>
            </div>
          ) : pageItems.length === 0 ? (
            <div className={shellStyles.emptyState}>
              <History size={34} className={styles.emptyIcon} />
              <p className={shellStyles.emptyTitle}>Журнал подій порожній</p>
              <p className={shellStyles.emptyText}>
                Змініть фільтри або дочекайтеся нових дій у групах, щоб побачити
                записи в таймлайні.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.timelineTable}>
                  <thead>
                    <tr>
                      <th>Дата</th>
                      <th>Тип події</th>
                      <th>Учасник</th>
                      <th>Група</th>
                      <th>Деталі</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map((item) => (
                      <tr key={item.id}>
                        <td>{formatUkDate(item.date)}</td>
                        <td>
                          <span
                            className={`${shellStyles.badge} ${styles[`badge_${item.type}`]}`}
                          >
                            {EVENT_LABELS[item.type]}
                          </span>
                        </td>
                        <td>
                          <div className={styles.personCell}>
                            <Users size={14} />
                            <span>{item.participant}</span>
                          </div>
                        </td>
                        <td>{item.group}</td>
                        <td className={styles.detailsCell}>{item.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.pagination}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} />
                  Попередня
                </button>
                <span className={styles.pageStatus}>
                  Сторінка {currentPage} з {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Наступна
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </RoleWorkspace>
  );
}
