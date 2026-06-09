import type { ReactNode } from "react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import styles from "./layout.module.scss";

const TABS = [
  { href: ROUTES.adminEmailCompose, label: "Нова розсилка" },
  { href: ROUTES.adminEmailTemplates, label: "Шаблони" },
  { href: ROUTES.adminEmailHistory, label: "Історія" },
  { href: ROUTES.adminEmailSettings, label: "Налаштування" },
];

export default function AdminEmailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Email Center</h1>
        <p className={styles.subtitle}>Управління розсилками та листами</p>
      </div>
      <nav className={styles.tabs}>
        {TABS.map((tab) => (
          <Link key={tab.href} href={tab.href} className={styles.tab}>
            {tab.label}
          </Link>
        ))}
      </nav>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
