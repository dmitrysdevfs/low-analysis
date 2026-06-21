import type { ReactNode } from "react";
import { EmailNavTabs } from "./EmailNavTabs";
import styles from "./layout.module.scss";

export default function AdminEmailLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Email Center</h1>
          <p className={styles.subtitle}>Управління розсилками та листами</p>
        </div>
        <div className={styles.headerKpi}>
          <div className={styles.kpiChip}>
            <span className={styles.kpiChipNum}>1 248</span>
            <span className={styles.kpiChipLabel}>Розіслано</span>
          </div>
          <div className={styles.kpiChip}>
            <span className={styles.kpiChipNum}>64%</span>
            <span className={styles.kpiChipLabel}>Відкрито</span>
          </div>
          <div className={styles.kpiChip}>
            <span className={styles.kpiChipNum}>18%</span>
            <span className={styles.kpiChipLabel}>Кліки</span>
          </div>
          <div className={styles.kpiChip}>
            <span className={styles.kpiChipNum}>0</span>
            <span className={styles.kpiChipLabel}>У черзі</span>
          </div>
        </div>
      </div>
      <EmailNavTabs />
      <div className={styles.content}>{children}</div>
    </div>
  );
}
