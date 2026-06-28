"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronRight,
  Eye,
  FileText,
  GitGraph,
  History,
  MessageCircle,
  MessagesSquare,
  Network,
  PenLine,
  Radar,
  RefreshCcw,
  Scale,
  Shield,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import styles from "./SupervisorMobileNav.module.scss";

// Mirrors the desktop SupervisorSidebar rail (duplicated inline across the
// supervisor pages); kept here so the workspace stays navigable once that rail
// is hidden on tablet/mobile.
const NAV: { icon: React.ReactNode; label: string; href: string }[] = [
  {
    icon: <Eye size={18} />,
    label: "Нагляд",
    href: ROUTES.supervisorDashboard,
  },
  { icon: <Users size={18} />, label: "Групи", href: ROUTES.supervisorGroups },
  {
    icon: <FileText size={18} />,
    label: "Пропозиції",
    href: ROUTES.supervisorProposals,
  },
  {
    icon: <PenLine size={18} />,
    label: "Поправки",
    href: ROUTES.supervisorAmendments,
  },
  { icon: <Zap size={18} />, label: "Форки", href: ROUTES.supervisorForks },
  { icon: <Scale size={18} />, label: "Закони", href: ROUTES.laws },
  { icon: <Network size={18} />, label: "Граф", href: ROUTES.graph },
  {
    icon: <GitGraph size={18} />,
    label: "Пропоз. Граф",
    href: ROUTES.graphProposals,
  },
  {
    icon: <Radar size={18} />,
    label: "Пропоз. Радіант",
    href: ROUTES.radiantProposals,
  },
  {
    icon: <RefreshCcw size={18} />,
    label: "Зміни",
    href: ROUTES.supervisorChanges,
  },
  {
    icon: <MessagesSquare size={18} />,
    label: "Коментарі",
    href: ROUTES.supervisorComments,
  },
  {
    icon: <Shield size={18} />,
    label: "Правила",
    href: ROUTES.supervisorRules,
  },
  {
    icon: <BarChart3 size={18} />,
    label: "Аналітика",
    href: ROUTES.supervisorAnalytics,
  },
  {
    icon: <History size={18} />,
    label: "Історія",
    href: ROUTES.supervisorHistory,
  },
  {
    icon: <MessageCircle size={18} />,
    label: "Чат",
    href: ROUTES.supervisorChat,
  },
];

export function SupervisorMobileNav() {
  const { isSupervisor, isAdmin, isHydrated } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close the drawer whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!isHydrated || (!isSupervisor && !isAdmin)) return null;

  return (
    <>
      <button
        type="button"
        className={styles.handle}
        aria-label="Розділи супервізора"
        onClick={() => setOpen(true)}
      >
        <ChevronRight size={20} />
      </button>

      {open && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Закрити меню"
          onClick={() => setOpen(false)}
        />
      )}

      <nav
        className={`${styles.drawer} ${open ? styles.drawerOpen : ""}`}
        aria-label="Навігація супервізора"
      >
        <div className={styles.header}>
          <span>Розділи</span>
          <button
            type="button"
            className={styles.close}
            aria-label="Закрити"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <ul className={styles.list}>
          {NAV.map((item) => {
            const active =
              pathname.startsWith(item.href) &&
              (item.href !== ROUTES.laws || pathname === ROUTES.laws);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`${styles.item} ${active ? styles.itemActive : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
