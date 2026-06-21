"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/constants/routes";
import styles from "./layout.module.scss";

const TABS = [
  { href: ROUTES.adminEmailCompose, label: "Нова розсилка" },
  { href: ROUTES.adminEmailTemplates, label: "Шаблони" },
  { href: ROUTES.adminEmailHistory, label: "Історія" },
  { href: ROUTES.adminEmailSegments, label: "Сегменти" },
  { href: ROUTES.adminEmailSettings, label: "Налаштування" },
];

export function EmailNavTabs() {
  const pathname = usePathname();
  return (
    <nav className={styles.tabs}>
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={styles.tab}
          data-active={pathname === tab.href ? "true" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
