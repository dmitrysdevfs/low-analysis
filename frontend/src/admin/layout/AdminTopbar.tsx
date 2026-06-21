"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { useAdminWorkspaceContext } from "@/components/admin/AdminWorkspaceContext";
import { adminApi } from "@/lib/api/admin";
import { ThemeSwitcher } from "./ThemeSwitcher";
import styles from "./AdminTopbar.module.scss";

const PAGE_TITLES = [
  {
    href: ROUTES.adminProjectPage,
    title: "Сторінка проєкту",
    subtitle: "Builder для сторінки «Інформація про проєкт»",
  },
  {
    href: ROUTES.adminApiCenter,
    title: "API Center",
    subtitle: "Ендпоїнти, Swagger, OpenAPI JSON та схеми бекенда",
  },
  {
    href: ROUTES.adminSupport,
    title: "Support",
    subtitle:
      "Live support chat, separate from Lex AI, with admin and Telegram delivery",
  },
  {
    href: ROUTES.adminInbox,
    title: "Inbox",
    subtitle: "Спільна Gmail-скринька, треди, синхронізація та відповіді",
  },
  {
    href: ROUTES.adminArchitecture,
    title: "Архітектура та Roadmap",
    subtitle: "Стан MVP, прийняті рішення та дорожня карта проєкту",
  },
  {
    href: ROUTES.adminAnalytics,
    title: "Аналітика",
    subtitle: "Поглиблений зріз даних сайту",
  },
  {
    href: ROUTES.adminBilling,
    title: "Білінг",
    subtitle: "Розподіл планів, квоти, призначення",
  },
  {
    href: ROUTES.adminAccess,
    title: "Матриця доступу",
    subtitle: "Права для маршрутів та захищена поверхня",
  },
  {
    href: ROUTES.adminCodes,
    title: "Супер-код",
    subtitle: "Ротація коду та журнал подій",
  },
  {
    href: ROUTES.adminAudit,
    title: "Журнал аудиту",
    subtitle: "Події безпеки та операційні зміни",
  },
  {
    href: ROUTES.adminUsers,
    title: "Користувачі",
    subtitle: "Реєстр акаунтів, ролі та дії",
  },
  {
    href: ROUTES.admin,
    title: "Дашборд",
    subtitle: "Ключові метрики та стан платформи",
  },
  {
    href: ROUTES.adminHelp,
    title: "Довідка",
    subtitle: "База знань для адміністраторів платформи",
  },
] as const;

const SECURITY_ROUTE_MAP: Array<{ keywords: string[]; route: string }> = [
  {
    keywords: ["роль", "призначено", "legislator", "законотворц"],
    route: ROUTES.adminUsers,
  },
  { keywords: ["код", "super code", "supercode"], route: ROUTES.adminCodes },
  { keywords: ["доступ", "access", "заявк"], route: ROUTES.adminAccess },
];

function resolveSecurityRoute(action: string, detail: string): string {
  const text = (action + " " + detail).toLowerCase();
  for (const { keywords, route } of SECURITY_ROUTE_MAP) {
    if (keywords.some((kw) => text.includes(kw))) return route;
  }
  return ROUTES.adminAudit;
}

function fmtTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function fmtRefreshed(date: Date): string {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

// Lookup table: IANA tz → { flag, country, city override }
const TZ_META: Record<
  string,
  { flag: string; country: string; city?: string }
> = {
  "Europe/Kyiv": { flag: "🇺🇦", country: "Україна", city: "Київ" },
  "Europe/Kiev": { flag: "🇺🇦", country: "Україна", city: "Київ" },
  "Europe/Uzhgorod": { flag: "🇺🇦", country: "Україна", city: "Ужгород" },
  "Europe/Zaporozhye": { flag: "🇺🇦", country: "Україна", city: "Запоріжжя" },
  "Europe/London": { flag: "🇬🇧", country: "Велика Британія" },
  "Europe/Paris": { flag: "🇫🇷", country: "Франція" },
  "Europe/Berlin": { flag: "🇩🇪", country: "Німеччина" },
  "Europe/Warsaw": { flag: "🇵🇱", country: "Польща", city: "Варшава" },
  "Europe/Prague": { flag: "🇨🇿", country: "Чехія", city: "Прага" },
  "Europe/Budapest": { flag: "🇭🇺", country: "Угорщина", city: "Будапешт" },
  "Europe/Bucharest": { flag: "🇷🇴", country: "Румунія", city: "Бухарест" },
  "Europe/Sofia": { flag: "🇧🇬", country: "Болгарія", city: "Софія" },
  "Europe/Istanbul": { flag: "🇹🇷", country: "Туреччина", city: "Стамбул" },
  "Europe/Athens": { flag: "🇬🇷", country: "Греція", city: "Афіни" },
  "Europe/Madrid": { flag: "🇪🇸", country: "Іспанія", city: "Мадрид" },
  "Europe/Rome": { flag: "🇮🇹", country: "Італія" },
  "Europe/Amsterdam": { flag: "🇳🇱", country: "Нідерланди", city: "Амстердам" },
  "Europe/Vienna": { flag: "🇦🇹", country: "Австрія", city: "Відень" },
  "Europe/Zurich": { flag: "🇨🇭", country: "Швейцарія" },
  "Europe/Lisbon": { flag: "🇵🇹", country: "Португалія", city: "Лісабон" },
  "Europe/Stockholm": { flag: "🇸🇪", country: "Швеція", city: "Стокгольм" },
  "Europe/Oslo": { flag: "🇳🇴", country: "Норвегія", city: "Осло" },
  "Europe/Helsinki": { flag: "🇫🇮", country: "Фінляндія", city: "Гельсінкі" },
  "Europe/Riga": { flag: "🇱🇻", country: "Латвія", city: "Рига" },
  "Europe/Tallinn": { flag: "🇪🇪", country: "Естонія", city: "Таллінн" },
  "Europe/Vilnius": { flag: "🇱🇹", country: "Литва", city: "Вільнюс" },
  "Europe/Minsk": { flag: "🇧🇾", country: "Білорусь", city: "Мінськ" },
  "Europe/Moscow": { flag: "🇷🇺", country: "Росія", city: "Москва" },
  "Europe/Brussels": { flag: "🇧🇪", country: "Бельгія", city: "Брюссель" },
  "Europe/Copenhagen": { flag: "🇩🇰", country: "Данія", city: "Копенгаген" },
  "America/New_York": { flag: "🇺🇸", country: "США", city: "Нью-Йорк" },
  "America/Chicago": { flag: "🇺🇸", country: "США", city: "Чикаго" },
  "America/Denver": { flag: "🇺🇸", country: "США", city: "Денвер" },
  "America/Los_Angeles": { flag: "🇺🇸", country: "США", city: "Лос-Анджелес" },
  "America/Phoenix": { flag: "🇺🇸", country: "США", city: "Фенікс" },
  "America/Toronto": { flag: "🇨🇦", country: "Канада", city: "Торонто" },
  "America/Vancouver": { flag: "🇨🇦", country: "Канада", city: "Ванкувер" },
  "America/Sao_Paulo": { flag: "🇧🇷", country: "Бразилія", city: "Сан-Паулу" },
  "America/Mexico_City": { flag: "🇲🇽", country: "Мексика", city: "Мехіко" },
  "Asia/Dubai": { flag: "🇦🇪", country: "ОАЕ", city: "Дубай" },
  "Asia/Tbilisi": { flag: "🇬🇪", country: "Грузія", city: "Тбілісі" },
  "Asia/Yerevan": { flag: "🇦🇲", country: "Вірменія", city: "Єреван" },
  "Asia/Baku": { flag: "🇦🇿", country: "Азербайджан", city: "Баку" },
  "Asia/Tokyo": { flag: "🇯🇵", country: "Японія", city: "Токіо" },
  "Asia/Shanghai": { flag: "🇨🇳", country: "Китай", city: "Шанхай" },
  "Asia/Seoul": { flag: "🇰🇷", country: "Корея", city: "Сеул" },
  "Asia/Kolkata": { flag: "🇮🇳", country: "Індія", city: "Колката" },
  "Asia/Singapore": { flag: "🇸🇬", country: "Сінгапур" },
  "Asia/Bangkok": { flag: "🇹🇭", country: "Таїланд", city: "Бангкок" },
  "Asia/Tel_Aviv": { flag: "🇮🇱", country: "Ізраїль", city: "Тель-Авів" },
  "Asia/Jerusalem": { flag: "🇮🇱", country: "Ізраїль", city: "Єрусалим" },
  "Australia/Sydney": { flag: "🇦🇺", country: "Австралія", city: "Сідней" },
  "Pacific/Auckland": { flag: "🇳🇿", country: "Нова Зеландія", city: "Окленд" },
};

function getLocalTzInfo() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const meta = TZ_META[tz];
  const rawCity = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
  return {
    tz,
    flag: meta?.flag ?? "📍",
    country: meta?.country ?? "",
    city: meta?.city ?? rawCity,
  };
}

interface AdminTopbarProps {
  userDisplayName?: string;
  userEmail?: string;
  onRefresh?: () => void;
}

export function AdminTopbar({
  userDisplayName,
  userEmail,
  onRefresh,
}: AdminTopbarProps) {
  const pathname = usePathname();
  const { snapshot, pendingRequests, lastRefreshedAt, refreshSnapshot } =
    useAdminWorkspaceContext();

  const [refreshing, setRefreshing] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const tzInfo = useMemo(() => getLocalTzInfo(), []);
  const bellRef = useRef<HTMLDivElement>(null);

  const env = process.env.NODE_ENV;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    adminApi
      .getDismissedNotifications()
      .then(({ dismissedIds: ids }) => setDismissedIds(new Set(ids)))
      .catch(() => {});
  }, []);

  const handleDismissItems = useCallback(
    async (items: Array<{ sourceType: string; sourceId: string }>) => {
      if (!items.length) return;
      setDismissedIds((prev) => {
        const next = new Set(prev);
        items.forEach((i) => next.add(i.sourceId));
        return next;
      });
      await adminApi.dismissNotifications(items).catch(() => {});
    },
    [],
  );

  const handleClearSecurity = useCallback(
    (secItems: Array<{ id: string; group: "requests" | "security" }>) => {
      const items = secItems
        .filter((n) => n.group === "security")
        .map((n) => ({ sourceType: "security", sourceId: n.id }));
      handleDismissItems(items);
    },
    [handleDismissItems],
  );

  // Close notif panel on outside click
  useEffect(() => {
    if (!notifOpen) return;
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [notifOpen]);

  const pageCopy = useMemo(() => {
    const matched = PAGE_TITLES.find(
      (page) => pathname === page.href || pathname.startsWith(`${page.href}/`),
    );
    return matched ?? { title: "Адмін", subtitle: "" };
  }, [pathname]);

  const visibleNotifItems = useMemo(() => {
    const requests = (pendingRequests ?? []).map((r) => {
      const userObj = typeof r.userId === "object" ? r.userId : null;
      return {
        id: r._id,
        group: "requests" as const,
        title: "Заявка на роль законотворця",
        detail: r.organization || r.reason || "",
        meta: userObj?.email ?? userObj?.displayName ?? "Невідомий",
        href: ROUTES.adminAccess,
      };
    });

    const security = (snapshot?.auditLog ?? [])
      .filter((e) => e.severity === "security")
      .map((e) => ({
        id: e.id,
        group: "security" as const,
        title: e.action,
        detail: e.detail,
        meta: e.actor,
        href: resolveSecurityRoute(e.action, e.detail),
      }));

    return [...requests, ...security].filter((n) => !dismissedIds.has(n.id));
  }, [pendingRequests, snapshot?.auditLog, dismissedIds]);

  const badgeCount = visibleNotifItems.length;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshSnapshot();
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 600);
  }, [refreshSnapshot, onRefresh]);

  const requestItems = visibleNotifItems.filter((n) => n.group === "requests");
  const securityItems = visibleNotifItems.filter((n) => n.group === "security");

  return (
    <header className={styles.topbar}>
      <div className={styles.titleBlock}>
        <nav className={styles.breadcrumb}>
          <Link href={ROUTES.admin} className={styles.breadcrumbLink}>
            Адмін
          </Link>
          {pathname !== ROUTES.admin && (
            <>
              <span className={styles.breadcrumbSep}>›</span>
              <span className={styles.breadcrumbCurrent}>{pageCopy.title}</span>
            </>
          )}
          <span
            className={`${styles.envBadge} ${env === "production" ? styles.envBadgeProd : styles.envBadgeDev}`}
          >
            {env === "production" ? "PROD" : "DEV"}
          </span>
        </nav>
        <h1 className={styles.title}>{pageCopy.title}</h1>
        {pageCopy.subtitle && (
          <p className={styles.subtitle}>{pageCopy.subtitle}</p>
        )}
      </div>

      <div className={styles.actions}>
        {/* Theme switcher */}
        <ThemeSwitcher />

        {/* Auto-detected local clock */}
        <div className={styles.clockRow}>
          <span className={styles.clockFlag}>{tzInfo.flag}</span>
          <span className={styles.clockLocation}>
            {tzInfo.city}
            {tzInfo.country && (
              <span className={styles.clockCountry}>, {tzInfo.country}</span>
            )}
          </span>
          <span className={styles.clockDivider}>·</span>
          <span className={styles.clockTime}>{fmtTime(now, tzInfo.tz)}</span>
        </div>

        {/* Last refreshed */}
        <span className={styles.updatedText}>
          {lastRefreshedAt
            ? `Оновлено: ${fmtRefreshed(lastRefreshedAt)}`
            : "Оновлено: —"}
        </span>

        {/* Refresh button */}
        <button
          type="button"
          className={`${styles.refreshBtn} ${refreshing ? styles.refreshBtnSpin : ""}`}
          onClick={handleRefresh}
          title="Оновити всі дані"
          disabled={refreshing}
        >
          <RefreshCw size={14} />
        </button>

        {/* Bell */}
        <div className={styles.bellWrapper} ref={bellRef}>
          <button
            type="button"
            className={`${styles.bellBtn} ${badgeCount > 0 ? styles.bellBtnActive : ""}`}
            onClick={() => setNotifOpen((prev) => !prev)}
            title="Сповіщення"
          >
            <Bell size={14} />
            {badgeCount > 0 && (
              <span className={styles.bellBadge}>
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className={styles.notifPanel}>
              <div className={styles.notifPanelHeader}>
                <span className={styles.notifPanelTitle}>
                  Сповіщення
                  {badgeCount > 0 && (
                    <span className={styles.notifPanelCount}>{badgeCount}</span>
                  )}
                </span>
                {securityItems.length > 0 && (
                  <button
                    type="button"
                    className={styles.notifMarkAllBtn}
                    onClick={() => handleClearSecurity(visibleNotifItems)}
                  >
                    Позначити як переглянуте
                  </button>
                )}
              </div>

              {visibleNotifItems.length === 0 ? (
                <p className={styles.notifEmpty}>Немає нових сповіщень</p>
              ) : (
                <>
                  {requestItems.length > 0 && (
                    <div className={styles.notifGroup}>
                      <div className={styles.notifGroupHeader}>
                        <span className={styles.notifGroupTitle}>
                          Заявки ({requestItems.length})
                        </span>
                        <Link
                          href={ROUTES.adminAccess}
                          className={styles.notifGroupAction}
                          onClick={() => setNotifOpen(false)}
                        >
                          Обробити →
                        </Link>
                      </div>
                      {requestItems.map((item) => (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.notifItem}
                          onClick={() => setNotifOpen(false)}
                        >
                          <span className={styles.notifItemTitle}>
                            {item.title}
                          </span>
                          {item.detail && (
                            <span className={styles.notifItemDetail}>
                              {item.detail}
                            </span>
                          )}
                          <span className={styles.notifItemMeta}>
                            {item.meta}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                  {securityItems.length > 0 && (
                    <div className={styles.notifGroup}>
                      <div className={styles.notifGroupHeader}>
                        <span className={styles.notifGroupTitle}>
                          Безпека ({securityItems.length})
                        </span>
                        <button
                          type="button"
                          className={styles.notifGroupAction}
                          onClick={() => handleClearSecurity(visibleNotifItems)}
                        >
                          Очистити
                        </button>
                      </div>
                      {securityItems.map((item) => (
                        <a
                          key={item.id}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.notifItem}
                          onClick={() => setNotifOpen(false)}
                        >
                          <span className={styles.notifItemTitle}>
                            {item.title}
                          </span>
                          {item.detail && (
                            <span className={styles.notifItemDetail}>
                              {item.detail}
                            </span>
                          )}
                          <span className={styles.notifItemMeta}>
                            {item.meta}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* User chip */}
        <div className={styles.userChip}>
          <span className={styles.userAvatar}>
            {(userDisplayName ?? "A").charAt(0).toUpperCase()}
          </span>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {userDisplayName ?? "Адмін"}
            </span>
            {userEmail && <span className={styles.userEmail}>{userEmail}</span>}
          </div>
        </div>
      </div>
    </header>
  );
}
