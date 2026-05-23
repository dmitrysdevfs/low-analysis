"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { ROUTES } from "@/constants/routes";
import styles from "./AdminTopbar.module.scss";

const PAGE_TITLES = [
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
] as const;

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
  const [lastUpdated] = useState(() => new Date());
  const [renderedAt] = useState(() => Date.now());
  const [refreshing, setRefreshing] = useState(false);

  const pageCopy = useMemo(() => {
    const matched = PAGE_TITLES.find(
      (page) => pathname === page.href || pathname.startsWith(`${page.href}/`),
    );

    return matched ?? { title: "Адмін", subtitle: "" };
  }, [pathname]);

  const handleRefresh = useCallback(() => {
    if (!onRefresh) return;

    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 800);
  }, [onRefresh]);

  const minutesAgo = Math.floor((renderedAt - lastUpdated.getTime()) / 60000);
  const updatedText = minutesAgo === 0 ? "щойно" : `${minutesAgo} хв тому`;

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
        </nav>
        <h1 className={styles.title}>{pageCopy.title}</h1>
      </div>

      <div className={styles.actions}>
        <span className={styles.updatedText}>Оновлено: {updatedText}</span>
        {onRefresh && (
          <button
            type="button"
            className={`${styles.refreshBtn} ${refreshing ? styles.refreshBtnSpin : ""}`}
            onClick={handleRefresh}
            title="Оновити дані"
          >
            <RefreshCw size={14} />
          </button>
        )}
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
