"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Scale, Sparkles, Undo2 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import {
  RoleAccessGate,
  RoleHydrationShell,
  RoleWorkspace,
  formatUkDate,
  formatUkTime,
} from "@/features/role-workspace/roleWorkspace";
import { useLegislatorHistory } from "@/hooks/useHistory";
import type { LegislatorHistoryFilter } from "@/lib/api/history";
import shellStyles from "@/features/role-workspace/roleWorkspace.module.scss";
import styles from "./page.module.scss";

const HISTORY_FILTERS: { value: LegislatorHistoryFilter; label: string }[] = [
  { value: "all", label: "Усі типи" },
  { value: "fork_created", label: "Fork created" },
  { value: "fork_submitted", label: "Fork submitted" },
  { value: "proposal_created", label: "Proposal created" },
  { value: "proposal_approved", label: "Proposal approved" },
  { value: "proposal_rejected", label: "Proposal rejected" },
  { value: "amendment_created", label: "Amendment created" },
  { value: "group_joined", label: "Group joined" },
];

export default function LegislatorHistoryPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();
  const [eventType, setEventType] = useState<LegislatorHistoryFilter>("all");

  const { data, isLoading, error } = useLegislatorHistory(eventType);

  if (!isHydrated) {
    return <RoleHydrationShell />;
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <RoleAccessGate
        eyebrow="LAWMAKER ACCESS"
        title="Моя історія доступна лише для ролі Lawmaker"
        text="Тут зібрані ваші форки, поправки, пропозиції та події групової роботи. Для доступу потрібна роль законотворця, супервайзера або адміністратора."
        primaryHref={ROUTES.rolesLawmaker}
        primaryLabel="Про роль Lawmaker"
        secondaryHref={ROUTES.help}
        secondaryLabel="Як отримати доступ"
      />
    );
  }

  const initials = (user?.displayName ?? "LM").slice(0, 2).toUpperCase();
  const roleLabel = isAdmin
    ? "Адміністратор"
    : isSupervisor && !isLegislator
      ? "Супервайзер"
      : "Законотворець";

  return (
    <RoleWorkspace
      role="legislator"
      initials={initials}
      name={user?.displayName ?? "Законотворець"}
      roleLabel={roleLabel}
    >
      <div className={shellStyles.page}>
        <section className={`${shellStyles.panel} ${styles.heroPanel}`}>
          <div className={shellStyles.pageHeader}>
            <div className={shellStyles.pageHeaderLeft}>
              <span className={shellStyles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ІСТОРІЯ</span>
              <h1 className={shellStyles.pageTitle}>Моя історія</h1>
              <p className={shellStyles.pageSubtitle}>
                Відстежуйте власні дії по форках, поправках і пропозиціях, щоб
                бачити хронологію рішень та посилання на закони.
              </p>
            </div>
            <div className={styles.historyMeta}>
              <History size={18} />
              <div>
                <strong>{isLoading ? "…" : (data?.total ?? 0)}</strong>
                <span>записів у стрічці</span>
              </div>
            </div>
          </div>
        </section>

        <section className={`${shellStyles.panel} ${styles.filterPanel}`}>
          <label className={`${shellStyles.field} ${styles.filterField}`}>
            <span className={shellStyles.fieldLabel}>Тип дії</span>
            <select
              className={shellStyles.select}
              value={eventType}
              onChange={(event) =>
                setEventType(event.target.value as LegislatorHistoryFilter)
              }
            >
              {HISTORY_FILTERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className={`${shellStyles.panel} ${styles.timelinePanel}`}>
          {isLoading ? (
            <div className={shellStyles.emptyState}>
              <p className={shellStyles.emptyTitle}>Завантаження...</p>
            </div>
          ) : error ? (
            <div className={shellStyles.emptyState}>
              <p className={shellStyles.emptyTitle}>Помилка завантаження</p>
            </div>
          ) : !data?.items.length ? (
            <div className={shellStyles.emptyState}>
              <History size={34} className={styles.emptyIcon} />
              <p className={shellStyles.emptyTitle}>Історія ще порожня</p>
              <p className={shellStyles.emptyText}>
                Після створення форків, пропозицій або вступу до груп записи
                зʼявляться у цій вертикальній стрічці.
              </p>
            </div>
          ) : (
            <div className={styles.timeline}>
              {data.items.map((item) => (
                <article key={item.id} className={styles.timelineItem}>
                  <span
                    className={`${styles.timelineDot} ${styles[`timelineDot_${item.type}`]}`}
                    aria-hidden="true"
                  />

                  <div className={styles.timelineBody}>
                    <div className={styles.timelineTop}>
                      <div>
                        <p className={styles.timelineStamp}>
                          {formatUkDate(item.date)} · {formatUkTime(item.date)}
                        </p>
                        <h3 className={styles.timelineTitle}>{item.description}</h3>
                      </div>
                      <span
                        className={`${shellStyles.badge} ${styles[`typeBadge_${item.type}`]}`}
                      >
                        {item.type.replaceAll("_", " ")}
                      </span>
                    </div>

                    <div className={styles.timelineFooter}>
                      <Link href={ROUTES.law(item.lawId)} className={styles.lawLink}>
                        <Scale size={14} />
                        <span>{item.lawLabel}</span>
                      </Link>

                      {item.type === "fork_created" && item.status === "draft" && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => console.log("cancel draft history action", item.id)}
                        >
                          <Undo2 size={14} />
                          Скасувати
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={`${shellStyles.kpiGrid} ${styles.kpiGridCustom}`}>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Форки</p>
            <h2 className={shellStyles.kpiValue}>{data?.kpi.forks ?? "…"}</h2>
            <p className={shellStyles.kpiNote}>Чернетки та подані версії змін.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Пропозиції</p>
            <h2 className={shellStyles.kpiValue}>{data?.kpi.proposals ?? "…"}</h2>
            <p className={shellStyles.kpiNote}>Створені, погоджені та відхилені.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Поправки</p>
            <h2 className={shellStyles.kpiValue}>{data?.kpi.amendments ?? "…"}</h2>
            <p className={shellStyles.kpiNote}>Зміни, створені у вашому кабінеті.</p>
          </article>
          <article className={shellStyles.kpiCard}>
            <p className={shellStyles.kpiLabel}>Активність</p>
            <h2 className={shellStyles.kpiValue}>
              <Sparkles size={24} />
            </h2>
            <p className={shellStyles.kpiNote}>Вся персональна історія в одному місці.</p>
          </article>
        </section>
      </div>
    </RoleWorkspace>
  );
}
