"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  UserCircle,
  Key,
  Zap,
  PowerOff,
  ArrowUpCircle,
  ShieldOff,
  Crown,
  LogOut,
} from "lucide-react";
import {
  adminApi,
  AdminUserRecord,
  AdminAuditEntry,
  UserActivityEntry,
  UserActivityStats,
} from "@/lib/api/admin";
import { getAllAccessRequests } from "@/lib/api/legislatorAccess";
import type { LegislatorAccessRequest } from "@/types/law-change.types";
import { notify } from "@/lib/toast";
import { formatDateShort, formatDateFull } from "@/lib/utils";
import { formatPlanLabel } from "./adminLabels";
import styles from "./AdminUserProfile.module.scss";

const AVATAR_COLORS = [
  { bg: "rgba(200,168,67,0.2)", text: "#c8a843" },
  { bg: "rgba(74,128,212,0.2)", text: "#4a80d4" },
  { bg: "rgba(82,183,136,0.2)", text: "#52b788" },
  { bg: "rgba(233,119,75,0.2)", text: "#e9774b" },
  { bg: "rgba(233,30,154,0.2)", text: "#e91e9a" },
  { bg: "rgba(139,195,74,0.2)", text: "#8bc34a" },
];

function hashColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const BILLING_PLANS = ["preview", "trial", "user", "plus", "pro"] as const;

const ROLE_LABELS: Record<string, string> = {
  user: "Клієнт",
  paid_user: "Платний клієнт",
  legislator: "Законотворець",
  supervisor: "Супервайзер",
  admin: "Адмін",
};

const SOURCE_LABELS: Record<string, string> = {
  direct: "Пряме відвідування",
  google: "Google Search",
  bing: "Bing Search",
  social: "Соціальні мережі",
  link: "Зовнішнє посилання",
  unknown: "Невідомо",
};

const SOURCE_COLORS: Record<string, string> = {
  direct: "#9eb5d9",
  google: "#4a80d4",
  bing: "#4a80d4",
  social: "#e91e9a",
  link: "#52b788",
  unknown: "rgba(158,181,217,0.4)",
};

const SEVERITY_COLORS: Record<string, string> = {
  info: styles.severityInfo,
  warning: styles.severityWarning,
  security: styles.severitySecurity,
};

type Tab = "profile" | "activity";

export function AdminUserProfileView({ userId }: { userId: string }) {
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<AdminUserRecord | null>(null);
  const [auditEntries, setAuditEntries] = useState<AdminAuditEntry[]>([]);
  const [activity, setActivity] = useState<UserActivityEntry[]>([]);
  const [activityStats, setActivityStats] = useState<UserActivityStats | null>(
    null,
  );
  const [requests, setRequests] = useState<LegislatorAccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actLoading, setActLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const data = await adminApi.getUserById(userId);
      setUser(data);
    } catch {
      try {
        const users = await adminApi.getUsers();
        const found = users.find((u) => u._id === userId);
        if (found) setUser(found);
        else setError("Користувача не знайдено.");
      } catch {
        setError("Не вдалося завантажити дані користувача.");
      }
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchActivity = useCallback(
    async (email: string) => {
      const [auditRes, activityRes, requestsRes] = await Promise.allSettled([
        adminApi.getAuditLogByTarget(email),
        adminApi.getUserActivity(userId),
        getAllAccessRequests(),
      ]);

      if (auditRes.status === "fulfilled")
        setAuditEntries(auditRes.value ?? []);

      if (activityRes.status === "fulfilled") {
        setActivity(activityRes.value.entries ?? []);
        setActivityStats(activityRes.value.stats ?? null);
      }

      if (requestsRes.status === "fulfilled") {
        const userReqs = (requestsRes.value ?? []).filter((r) => {
          const uid = typeof r.user_id === "string" ? r.user_id : r.user_id._id;
          return uid === userId;
        });
        setRequests(userReqs);
      }
    },
    [userId],
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (user?.email) fetchActivity(user.email);
  }, [user?.email, fetchActivity]);

  const act = useCallback(
    async (fn: () => Promise<unknown>, successMsg: string) => {
      setActLoading(true);
      try {
        await fn();
        notify.success(successMsg);
        await fetchUser();
      } catch {
        notify.warning("Дію не виконано. Спробуйте ще раз.");
      } finally {
        setActLoading(false);
      }
    },
    [fetchUser],
  );

  if (loading) {
    return (
      <div className={styles.stateScreen}>
        <div className={styles.stateText}>Завантаження…</div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className={styles.stateScreen}>
        <div className={styles.stateText}>
          {error ?? "Користувача не знайдено."}
        </div>
        <Link href="/admin/users" className={styles.backLink}>
          ← Повернутися до списку
        </Link>
      </div>
    );
  }

  const isAdmin = user.role === "admin";
  const isLegislator = user.role === "legislator";
  const isSupervisor = user.role === "supervisor";
  const isActive = user.status === "active";
  const avatarColor = hashColor(user.fullName);
  const regSource = user.registrationSource;

  const pageViews = activity.filter((e) => e.type === "page_view");
  const searches = activity.filter((e) => e.type === "search");

  return (
    <div className={styles.page}>
      <Link href="/admin/users" className={styles.backLink}>
        <ChevronLeft size={13} />
        Користувачі
      </Link>

      {/* Hero */}
      <div className={styles.hero}>
        <div
          className={styles.avatar}
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {user.fullName.charAt(0).toUpperCase()}
        </div>
        <div className={styles.heroInfo}>
          <div className={styles.heroNameRow}>
            <h1 className={styles.heroName}>{user.fullName}</h1>
            <span className={isActive ? styles.badgeAccent : styles.badgeDanger}>
              {isActive ? "Активний" : "Неактивний"}
            </span>
          </div>
          <div className={styles.heroEmail}>{user.email}</div>
          <div className={styles.heroId}>ID: …{user._id.slice(-8)}</div>
        </div>
        <div className={styles.heroBadges}>
          <span className={styles.badge}>
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tab} ${tab === "profile" ? styles.tabActive : ""}`}
          onClick={() => setTab("profile")}
        >
          Профіль
        </button>
        <button
          type="button"
          className={`${styles.tab} ${tab === "activity" ? styles.tabActive : ""}`}
          onClick={() => setTab("activity")}
        >
          Активність
          {activityStats &&
            activityStats.pageViews + activityStats.searches > 0 && (
              <span className={styles.tabCount}>
                {activityStats.pageViews + activityStats.searches}
              </span>
            )}
        </button>
      </div>

      {tab === "profile" && (
        <div className={styles.content}>
          <div className={styles.infoGrid}>
            {/* Account card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon} style={{ background: "rgba(74,128,212,0.12)", color: "#6aa1ff" }}>
                  <UserCircle size={13} />
                </span>
                Деталі акаунта
              </div>
              <dl className={styles.dl}>
                <dt>Роль</dt>
                <dd>{ROLE_LABELS[user.role] ?? user.role}</dd>
                <dt>Статус</dt>
                <dd className={isActive ? styles.accent : styles.danger}>
                  {isActive ? "Активний" : "Неактивний"}
                </dd>
                <dt>Зареєстровано</dt>
                <dd>{formatDateFull(user.createdAt)}</dd>
                <dt>Оновлено</dt>
                <dd>{formatDateShort(user.updatedAt)}</dd>
              </dl>
            </div>

            {/* Billing card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon} style={{ background: "rgba(200,168,67,0.12)", color: "#c8a843" }}>
                  <Key size={13} />
                </span>
                Доступ і план
              </div>
              <dl className={styles.dl}>
                <dt>Поточний план</dt>
                <dd className={styles.accent}>
                  {formatPlanLabel(user.billingPlan)}
                </dd>
              </dl>
              <div className={styles.modulesLabel}>Права та модулі</div>
              <div className={styles.planRow}>
                {BILLING_PLANS.map((plan) => (
                  <button
                    key={plan}
                    type="button"
                    disabled={actLoading || user.billingPlan === plan}
                    className={`${styles.planBtn} ${user.billingPlan === plan ? styles.planBtnActive : ""}`}
                    onClick={() =>
                      act(
                        () => adminApi.setUserBilling(user._id, plan),
                        `План змінено на «${formatPlanLabel(plan)}».`,
                      )
                    }
                  >
                    {formatPlanLabel(plan)}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions card */}
            <div className={styles.card}>
              <div className={styles.cardTitle}>
                <span className={styles.cardTitleIcon} style={{ background: "rgba(233,119,75,0.12)", color: "#ffb39b" }}>
                  <Zap size={13} />
                </span>
                Дії
              </div>
              <div className={styles.actionsList}>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () =>
                        adminApi.setUserStatus(
                          user._id,
                          isActive ? "inactive" : "active",
                        ),
                      isActive ? "Акаунт деактивовано." : "Акаунт активовано.",
                    )
                  }
                >
                  <PowerOff size={14} />
                  {isActive ? "Деактивувати" : "Активувати"}
                </button>
                <button
                  type="button"
                  className={styles.actionBtn}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () =>
                        adminApi.setUserRole(
                          user._id,
                          isAdmin ? "user" : "admin",
                        ),
                      isAdmin
                        ? "Права адміна знято."
                        : "Акаунт підвищено до адміна.",
                    )
                  }
                >
                  {isAdmin ? <ShieldOff size={14} /> : <ArrowUpCircle size={14} />}
                  {isAdmin ? "Знизити до клієнта" : "Підвищити до адміна"}
                </button>
                {!isAdmin && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={actLoading}
                    onClick={() =>
                      act(
                        () =>
                          adminApi.setUserRole(
                            user._id,
                            isLegislator ? "user" : "legislator",
                          ),
                        isLegislator
                          ? "Роль законотворця знято."
                          : "Призначено законотворцем.",
                      )
                    }
                  >
                    <ShieldOff size={14} />
                    {isLegislator
                      ? "Зняти роль законотворця"
                      : "Призначити законотворцем"}
                  </button>
                )}
                {!isAdmin && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={actLoading}
                    onClick={() =>
                      act(
                        () =>
                          adminApi.setUserRole(
                            user._id,
                            isSupervisor ? "user" : "supervisor",
                          ),
                        isSupervisor
                          ? "Роль супервайзера знято."
                          : "Призначено супервайзером.",
                      )
                    }
                  >
                    <Crown size={14} />
                    {isSupervisor
                      ? "Зняти роль супервайзера"
                      : "Призначити супервайзером"}
                  </button>
                )}
                <button
                  type="button"
                  className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                  disabled={actLoading}
                  onClick={() =>
                    act(
                      () => adminApi.forceLogout(user._id),
                      "Примусовий вихід виконано.",
                    )
                  }
                >
                  <LogOut size={14} />
                  Примусовий вихід
                </button>
              </div>
            </div>
          </div>

          {requests.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionTitle}>
                Заявки на доступ законотворця
              </div>
              <div className={styles.requestsList}>
                {requests.map((r) => (
                  <div key={r._id} className={styles.requestItem}>
                    <div className={styles.requestOrg}>{r.organization}</div>
                    <div className={styles.requestReason}>{r.reason}</div>
                    <div className={styles.requestMeta}>
                      <span
                        className={`${styles.requestStatus} ${
                          r.status === "approved"
                            ? styles.accent
                            : r.status === "rejected"
                              ? styles.danger
                              : styles.muted
                        }`}
                      >
                        {r.status === "approved"
                          ? "Схвалено"
                          : r.status === "rejected"
                            ? "Відхилено"
                            : "Очікує"}
                      </span>
                      <span className={styles.muted}>
                        {formatDateShort(r.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "activity" && (
        <div className={styles.content}>
          {/* Stats row */}
          {activityStats && (
            <div className={styles.statsRow}>
              <div className={styles.statChip}>
                <span className={styles.statNum}>
                  {activityStats.pageViews}
                </span>
                <span className={styles.statLabel}>переглядів</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statNum}>{activityStats.searches}</span>
                <span className={styles.statLabel}>пошуків</span>
              </div>
              <div className={styles.statChip}>
                <span className={styles.statNum}>{activityStats.lawViews}</span>
                <span className={styles.statLabel}>законів переглянуто</span>
              </div>
            </div>
          )}

          {/* Page views */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Перегляди сторінок</div>
            {pageViews.length === 0 ? (
              <div className={styles.emptyNote}>
                Переглядів ще немає — з&apos;являться після першого
                відвідування.
              </div>
            ) : (
              <div className={styles.activityTable}>
                <div className={styles.activityTableHead}>
                  <span>Сторінка</span>
                  <span>Час</span>
                </div>
                {pageViews.map((e) => (
                  <div key={e._id} className={styles.activityRow}>
                    <span className={styles.activityPath}>{e.path ?? "—"}</span>
                    <span className={styles.muted}>
                      {formatDateShort(e.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search activity */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Пошукова активність</div>
            {searches.length === 0 ? (
              <div className={styles.emptyNote}>
                Пошуків ще немає. Трекінг пошуку підключається окремо до
                компонента пошуку.
              </div>
            ) : (
              <div className={styles.activityTable}>
                <div className={styles.activityTableHead}>
                  <span>Запит</span>
                  <span>Час</span>
                </div>
                {searches.map((e) => (
                  <div key={e._id} className={styles.activityRow}>
                    <span className={styles.activityQuery}>
                      &ldquo;{e.query}&rdquo;
                    </span>
                    <span className={styles.muted}>
                      {formatDateShort(e.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Audit log */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Адмін-події</div>
            {auditEntries.length === 0 ? (
              <div className={styles.emptyNote}>
                Жодних адмін-подій для цього акаунта не знайдено.
              </div>
            ) : (
              <div className={styles.auditList}>
                {auditEntries.map((e) => (
                  <div key={e._id} className={styles.auditItem}>
                    <div
                      className={`${styles.auditSeverity} ${SEVERITY_COLORS[e.severity] ?? ""}`}
                    />
                    <div className={styles.auditBody}>
                      <div className={styles.auditAction}>{e.action}</div>
                      <div className={styles.auditDetail}>{e.detail}</div>
                      <div className={styles.auditMeta}>
                        <span>{e.actor}</span>
                        <span className={styles.muted}>
                          {formatDateShort(e.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Registration source */}
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Джерело реєстрації</div>
            {!regSource || regSource.source === "unknown" ? (
              <div className={styles.emptyNote}>
                Джерело не визначено — користувач зареєстрований до впровадження
                трекінгу.
              </div>
            ) : (
              <div className={styles.sourceCard}>
                <div
                  className={styles.sourceLabel}
                  style={{ color: SOURCE_COLORS[regSource.source] }}
                >
                  {SOURCE_LABELS[regSource.source]}
                </div>
                {regSource.referrer && (
                  <div className={styles.sourceReferrer}>
                    {regSource.referrer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
