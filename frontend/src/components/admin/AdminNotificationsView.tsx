"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Bell,
  CheckCheck,
  Clock3,
  ExternalLink,
  EyeOff,
  Filter,
  Info,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRoundPlus,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { adminApi } from "@/lib/api/admin";
import { formatDateShort } from "@/lib/utils";
import { notify } from "@/lib/toast";
import { useAdminWorkspace } from "./useAdminWorkspace";
import styles from "./AdminNotifications.module.scss";

type NotificationSeverity = "info" | "warning" | "security";
type NotificationSource = "request" | "audit";
type NotificationCategory = "requests" | NotificationSeverity;
type ScopeFilter = "active" | "hidden" | "all";

type NotificationItem = {
  id: string;
  sourceId: string;
  sourceType: NotificationSource;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  detail: string;
  actor: string;
  meta: string;
  createdAt: string;
  href: string;
  hrefLabel: string;
  statusLabel: string;
  dismissible: boolean;
  isDismissed: boolean;
};

const SECURITY_ROUTE_MAP: Array<{ keywords: string[]; route: string }> = [
  {
    keywords: ["роль", "призначено", "legislator", "законодав", "supervisor"],
    route: ROUTES.adminUsers,
  },
  { keywords: ["код", "super code", "super-code"], route: ROUTES.adminCodes },
  { keywords: ["доступ", "access", "заявк"], route: ROUTES.adminAccess },
];

function resolveSecurityRoute(action: string, detail: string): string {
  const text = `${action} ${detail}`.toLowerCase();
  for (const { keywords, route } of SECURITY_ROUTE_MAP) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return route;
    }
  }
  return ROUTES.adminAudit;
}

function formatRelativeLabel(value: string) {
  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));

  if (diffMinutes < 60) return `${diffMinutes} хв тому`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} год тому`;

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн тому`;

  return formatDateShort(value);
}

function severityMeta(severity: NotificationSeverity) {
  if (severity === "security") {
    return {
      label: "Безпека",
      Icon: ShieldAlert,
      toneClass: styles.badgeSecurity,
      dotClass: styles.dotSecurity,
      iconClass: styles.iconSecurity,
    };
  }

  if (severity === "warning") {
    return {
      label: "Попередження",
      Icon: AlertTriangle,
      toneClass: styles.badgeWarning,
      dotClass: styles.dotWarning,
      iconClass: styles.iconWarning,
    };
  }

  return {
    label: "Інфо",
    Icon: Info,
    toneClass: styles.badgeInfo,
    dotClass: styles.dotInfo,
    iconClass: styles.iconInfo,
  };
}

function requestedRoleLabel(value: "legislator" | "supervisor") {
  return value === "supervisor" ? "супервайзера" : "законотворця";
}

export function AdminNotificationsView() {
  const { snapshot, pendingRequests, lastRefreshedAt, refreshSnapshot } =
    useAdminWorkspace();

  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [isDismissedLoading, setIsDismissedLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | NotificationCategory>("all");
  const [scope, setScope] = useState<ScopeFilter>("active");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDismissed = useCallback(async () => {
    setIsDismissedLoading(true);
    try {
      const data = await adminApi.getDismissedNotifications();
      setDismissedIds(new Set(data.dismissedIds));
    } catch {
      notify.warning("Не вдалося завантажити стан прихованих сповіщень.");
    } finally {
      setIsDismissedLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDismissed();
  }, [loadDismissed]);

  const items = useMemo<NotificationItem[]>(() => {
    const requestItems: NotificationItem[] = pendingRequests.map((request) => {
      const user =
        typeof request.userId === "object"
          ? request.userId
          : { displayName: String(request.userId), email: "" };
      const roleLabel = requestedRoleLabel(request.requestedRole);
      const title =
        request.requestedRole === "supervisor"
          ? "Заявка на роль супервайзера"
          : "Заявка на роль законотворця";

      return {
        id: `request-${request._id}`,
        sourceId: request._id,
        sourceType: "request",
        category: "requests",
        severity: "warning",
        title,
        detail:
          request.reason?.trim() ||
          `Користувач просить доступ до ролі ${roleLabel}.`,
        actor: user.displayName || user.email || "Невідомий користувач",
        meta: [
          user.email || null,
          request.organization || "Без організації",
          `Очікує розгляду`,
        ]
          .filter(Boolean)
          .join(" · "),
        createdAt: request.createdAt,
        href: ROUTES.adminAccess,
        hrefLabel: "Відкрити доступ",
        statusLabel: "Очікує",
        dismissible: false,
        isDismissed: false,
      };
    });

    const auditItems: NotificationItem[] = (snapshot?.auditLog ?? []).map(
      (entry) => ({
        id: `audit-${entry.id}`,
        sourceId: entry.id,
        sourceType: "audit",
        category: entry.severity,
        severity: entry.severity,
        title: entry.action,
        detail: entry.detail,
        actor: entry.actor,
        meta: [entry.ipAddress || null, formatDateShort(entry.createdAt)]
          .filter(Boolean)
          .join(" · "),
        createdAt: entry.createdAt,
        href: resolveSecurityRoute(entry.action, entry.detail),
        hrefLabel: "Відкрити джерело",
        statusLabel: severityMeta(entry.severity).label,
        dismissible: true,
        isDismissed: dismissedIds.has(entry.id),
      }),
    );

    return [...requestItems, ...auditItems].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt),
    );
  }, [dismissedIds, pendingRequests, snapshot?.auditLog]);

  const activeItems = useMemo(
    () => items.filter((item) => !item.isDismissed),
    [items],
  );
  const hiddenItems = useMemo(
    () => items.filter((item) => item.isDismissed),
    [items],
  );

  const filteredItems = useMemo(() => {
    const source =
      scope === "active"
        ? activeItems
        : scope === "hidden"
          ? hiddenItems
          : items;
    const normalizedQuery = query.trim().toLowerCase();

    return source.filter((item) => {
      if (category !== "all" && item.category !== category) {
        return false;
      }

      if (!normalizedQuery) return true;

      return [
        item.title,
        item.detail,
        item.actor,
        item.meta,
        item.statusLabel,
      ].some((value) => value.toLowerCase().includes(normalizedQuery));
    });
  }, [activeItems, category, hiddenItems, items, query, scope]);

  const counts = useMemo(() => {
    return {
      active: activeItems.length,
      requests: items.filter((item) => item.category === "requests").length,
      security: activeItems.filter((item) => item.category === "security")
        .length,
      warnings: activeItems.filter((item) => item.category === "warning")
        .length,
      hidden: hiddenItems.length,
    };
  }, [activeItems, hiddenItems, items]);

  const dismissAuditItems = useCallback(
    async (auditItemsToDismiss: NotificationItem[]) => {
      const validItems = auditItemsToDismiss.filter(
        (item) => item.sourceType === "audit" && !item.isDismissed,
      );

      if (!validItems.length) return;

      const nextIds = validItems.map((item) => item.sourceId);
      setDismissedIds((prev) => new Set([...prev, ...nextIds]));

      try {
        await adminApi.dismissNotifications(
          validItems.map((item) => ({
            sourceType: "security",
            sourceId: item.sourceId,
          })),
        );
      } catch {
        setDismissedIds((prev) => {
          const next = new Set(prev);
          nextIds.forEach((id) => next.delete(id));
          return next;
        });
        notify.warning("Не вдалося приховати сповіщення.");
      }
    },
    [],
  );

  const handleDismissOne = useCallback(
    async (item: NotificationItem) => {
      await dismissAuditItems([item]);
    },
    [dismissAuditItems],
  );

  const handleDismissSecurity = useCallback(async () => {
    const securityItems = activeItems.filter(
      (item) => item.sourceType === "audit" && item.category === "security",
    );
    await dismissAuditItems(securityItems);
  }, [activeItems, dismissAuditItems]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refreshSnapshot(), loadDismissed()]);
    setIsRefreshing(false);
  }, [loadDismissed, refreshSnapshot]);

  if (!snapshot) {
    return (
      <section className={styles.page}>
        <section className={styles.loadingCard}>
          <span className={styles.eyebrow}>Сповіщення</span>
          <h2 className={styles.loadingTitle}>
            Завантаження центру сповіщень…
          </h2>
          <p className={styles.loadingText}>
            Підтягуємо сигнали безпеки, role-заявки та поточний потік уваги.
          </p>
        </section>
      </section>
    );
  }

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Сповіщення</span>
          <h2 className={styles.title}>Тримайте потік уваги в одному місці.</h2>
          <p className={styles.description}>
            Центр сповіщень збирає role-заявки, security-сигнали та операційні
            події, які потребують дії адміністратора. Тут видно, що нове, що вже
            приховано у bell-потоці, і куди саме треба перейти далі.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? styles.spinningIcon : ""}
              />
              Оновити потік
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={handleDismissSecurity}
              disabled={!counts.security}
            >
              <CheckCheck size={14} />
              Позначити безпеку як переглянуту
            </button>
          </div>
        </div>

        <aside className={styles.heroStatus}>
          <div className={styles.heroStatusHeader}>
            <Bell size={18} />
            <span>Поточний стан</span>
          </div>
          <strong className={styles.heroStatusValue}>
            {counts.active} активних сигналів
          </strong>
          <p className={styles.heroStatusMeta}>
            {counts.requests} role-заявок, {counts.security} security-сигналів,{" "}
            {counts.warnings} попереджень, {counts.hidden} прихованих для цього
            адміністратора.
          </p>
          <div className={styles.heroStatusRows}>
            <div className={styles.heroStatusRow}>
              <span>Останнє оновлення</span>
              <strong>
                {lastRefreshedAt
                  ? formatDateShort(lastRefreshedAt.toISOString())
                  : "—"}
              </strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Приховані елементи</span>
              <strong>{isDismissedLoading ? "…" : counts.hidden}</strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Поточний scope</span>
              <strong>
                {scope === "active"
                  ? "Активні"
                  : scope === "hidden"
                    ? "Приховані"
                    : "Усі"}
              </strong>
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.kpiRow}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Активні зараз</span>
          <strong className={styles.kpiValue}>{counts.active}</strong>
          <span className={styles.kpiMeta}>
            Сигнали, які ще залишаються в полі зору
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Role-заявки</span>
          <strong className={styles.kpiValue}>{counts.requests}</strong>
          <span className={styles.kpiMeta}>Очікують розгляду в доступі</span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Безпека</span>
          <strong className={styles.kpiValue}>{counts.security}</strong>
          <span className={styles.kpiMeta}>
            Поточні security-події у потоці
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Приховано</span>
          <strong className={styles.kpiValue}>{counts.hidden}</strong>
          <span className={styles.kpiMeta}>
            Сховано локально для цього admin
          </span>
        </article>
      </section>

      <div className={styles.workspace}>
        <section className={styles.feedPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Потік сповіщень</span>
              <h3 className={styles.sectionTitle}>Живий центр уваги</h3>
            </div>
            <div className={styles.panelHeaderMeta}>
              <Filter size={12} />
              <span>{filteredItems.length} елементів</span>
            </div>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <Search size={13} className={styles.searchIcon} />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Пошук за подією, актором або деталями…"
              />
            </label>

            <select
              className={styles.select}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as "all" | NotificationCategory)
              }
            >
              <option value="all">Усі категорії</option>
              <option value="requests">Role-заявки</option>
              <option value="security">Безпека</option>
              <option value="warning">Попередження</option>
              <option value="info">Інфо</option>
            </select>

            <select
              className={styles.select}
              value={scope}
              onChange={(event) => setScope(event.target.value as ScopeFilter)}
            >
              <option value="active">Активні</option>
              <option value="hidden">Приховані</option>
              <option value="all">Усі</option>
            </select>
          </div>

          {filteredItems.length ? (
            <div className={styles.feedList}>
              {filteredItems.map((item) => {
                const meta = severityMeta(item.severity);
                const MetaIcon =
                  item.sourceType === "request" ? UserRoundPlus : meta.Icon;

                return (
                  <article
                    key={item.id}
                    className={`${styles.feedItem} ${
                      item.isDismissed ? styles.feedItemDismissed : ""
                    }`}
                  >
                    <div className={styles.feedItemMain}>
                      <span
                        className={`${styles.feedIconWrap} ${meta.iconClass}`}
                      >
                        <MetaIcon size={14} />
                      </span>

                      <div className={styles.feedBody}>
                        <div className={styles.feedTop}>
                          <div className={styles.feedTitleBlock}>
                            <strong className={styles.feedTitle}>
                              {item.title}
                            </strong>
                            <span
                              className={`${styles.feedBadge} ${meta.toneClass}`}
                            >
                              <span
                                className={`${styles.feedDot} ${meta.dotClass}`}
                              />
                              {item.statusLabel}
                            </span>
                            {item.isDismissed && (
                              <span className={styles.hiddenBadge}>
                                Приховано у bell-потоці
                              </span>
                            )}
                          </div>
                          <span className={styles.feedTime}>
                            <Clock3 size={12} />
                            {formatRelativeLabel(item.createdAt)}
                          </span>
                        </div>

                        <p className={styles.feedDetail}>{item.detail}</p>

                        <div className={styles.feedMeta}>
                          <span>{item.actor}</span>
                          <span>·</span>
                          <span>{item.meta}</span>
                        </div>

                        <div className={styles.feedActions}>
                          <Link href={item.href} className={styles.linkBtn}>
                            {item.hrefLabel}
                            <ArrowUpRight size={13} />
                          </Link>
                          {item.dismissible && !item.isDismissed && (
                            <button
                              type="button"
                              className={styles.inlineBtn}
                              onClick={() => void handleDismissOne(item)}
                            >
                              <EyeOff size={13} />
                              Приховати зі стрічки
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              За поточним фільтром тут поки немає сповіщень.
            </div>
          )}
        </section>

        <aside className={styles.rail}>
          <article className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.railTitle}>Черги дій</span>
            </div>
            <div className={styles.queueList}>
              <div className={styles.queueRow}>
                <span>Role-заявки</span>
                <strong>{counts.requests}</strong>
              </div>
              <div className={styles.queueRow}>
                <span>Security-сигнали</span>
                <strong>{counts.security}</strong>
              </div>
              <div className={styles.queueRow}>
                <span>Попередження</span>
                <strong>{counts.warnings}</strong>
              </div>
              <div className={styles.queueRow}>
                <span>Приховані зараз</span>
                <strong>{counts.hidden}</strong>
              </div>
            </div>
            <div className={styles.quickLinks}>
              <Link href={ROUTES.adminAccess} className={styles.quickLink}>
                <span>Матриця доступу</span>
                <ExternalLink size={11} />
              </Link>
              <Link href={ROUTES.adminAudit} className={styles.quickLink}>
                <span>Журнал аудиту</span>
                <ExternalLink size={11} />
              </Link>
              <Link href={ROUTES.adminUsers} className={styles.quickLink}>
                <span>Користувачі</span>
                <ExternalLink size={11} />
              </Link>
            </div>
          </article>

          <article className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.railTitle}>Role-заявки у черзі</span>
            </div>
            {pendingRequests.length ? (
              <div className={styles.requestList}>
                {pendingRequests.slice(0, 5).map((request) => {
                  const user =
                    typeof request.userId === "object"
                      ? request.userId
                      : { displayName: String(request.userId), email: "" };
                  return (
                    <div key={request._id} className={styles.requestItem}>
                      <div className={styles.requestTop}>
                        <strong>
                          {user.displayName || user.email || "Користувач"}
                        </strong>
                        <span>{formatRelativeLabel(request.createdAt)}</span>
                      </div>
                      <p className={styles.requestRole}>
                        Роль: {requestedRoleLabel(request.requestedRole)}
                      </p>
                      <p className={styles.requestReason}>
                        {request.organization || "Без організації"}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.railEmpty}>Нових role-заявок зараз немає.</p>
            )}
            <Link href={ROUTES.adminAccess} className={styles.railAction}>
              Відкрити розгляд заявок
              <ArrowUpRight size={12} />
            </Link>
          </article>

          <article className={styles.railCard}>
            <div className={styles.railHeader}>
              <span className={styles.railTitle}>Стан центру</span>
            </div>
            <div className={styles.statusList}>
              <div className={styles.statusRow}>
                <span>Дані dashboard</span>
                <strong>Підключено</strong>
              </div>
              <div className={styles.statusRow}>
                <span>Стан прихованих</span>
                <strong>{isDismissedLoading ? "sync…" : "Готово"}</strong>
              </div>
              <div className={styles.statusRow}>
                <span>Потік аудиту</span>
                <strong>{snapshot.auditLog.length} записів</strong>
              </div>
              <div className={styles.statusRow}>
                <span>Поточний режим</span>
                <strong>
                  {scope === "active"
                    ? "Активні"
                    : scope === "hidden"
                      ? "Приховані"
                      : "Усі"}
                </strong>
              </div>
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
