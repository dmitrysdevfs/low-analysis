"use client";

import styles from "./page.module.scss";

export default function AdminEmailSettingsPage() {
  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Відправник</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Email відправника</span>
            <span className={styles.fieldValue}>law.analysis.donate@gmail.com</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Ім&apos;я відправника</span>
            <span className={styles.fieldValue}>Law Analysis</span>
          </div>
        </div>
      </div>
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Провайдер</h2>
        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Сервіс</span>
            <span className={styles.fieldValue}>Brevo (Sendinblue)</span>
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>API ключ</span>
            <span className={styles.fieldValue}>xkeysib-••••••••••••</span>
          </div>
        </div>
      </div>
    </div>
  );
}
