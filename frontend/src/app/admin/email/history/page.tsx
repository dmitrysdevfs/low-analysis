"use client";

import { useQuery } from "@tanstack/react-query";
import { adminApi, type EmailCampaign } from "@/lib/api/admin";
import styles from "./page.module.scss";

const STATUS_LABELS: Record<EmailCampaign["status"], string> = {
  draft: "Чернетка",
  sending: "Надсилання...",
  sent: "Надіслано",
  failed: "Помилка",
};

export default function AdminEmailHistoryPage() {
  const { data: campaigns, isLoading } = useQuery({
    queryKey: ["email-campaigns"],
    queryFn: () => adminApi.getEmailCampaigns(),
  });

  if (isLoading) return <div className={styles.loading}>Завантаження...</div>;

  return (
    <div className={styles.root}>
      {!campaigns?.length && (
        <div className={styles.empty}>Розсилок поки немає</div>
      )}
      <div className={styles.list}>
        {campaigns?.map((c) => (
          <div key={c._id} className={styles.row}>
            <div className={styles.rowMain}>
              <div className={styles.subject}>{c.subject}</div>
              <div className={styles.meta}>
                Шаблон: {c.templateSlug} · Тема: {c.theme}
              </div>
            </div>
            <div className={styles.stats}>
              <span className={styles.stat}>
                {c.recipientCount} отримувачів
              </span>
              <span className={styles.stat}>{c.deliveredCount} доставлено</span>
              {c.openCount > 0 && (
                <span className={styles.stat}>{c.openCount} відкрито</span>
              )}
            </div>
            <div className={`${styles.badge} ${styles[`badge_${c.status}`]}`}>
              {STATUS_LABELS[c.status]}
            </div>
            <div className={styles.date}>
              {c.sentAt
                ? new Date(c.sentAt).toLocaleDateString("uk-UA")
                : new Date(c.createdAt).toLocaleDateString("uk-UA")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
