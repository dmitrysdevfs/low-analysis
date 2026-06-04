"use client";

import { useState } from "react";
import {
  useMyAccessRequest,
  useSubmitAccessRequest,
} from "@/features/law-change/hooks/useLegislatorAccess";
import styles from "./LegislatorAccessRequestForm.module.scss";

const STATUS_MESSAGES = {
  pending: "Ваш запит на розгляді. Очікуйте відповіді адміністратора.",
  approved: "Ви вже законотворець. Запит схвалено.",
  rejected: "Ваш запит відхилено. Зверніться до адміністратора для уточнень.",
};

export function LegislatorAccessRequestForm() {
  const { data: request, isLoading } = useMyAccessRequest();
  const submit = useSubmitAccessRequest();

  const [organization, setOrganization] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization.trim() || !reason.trim()) return;
    await submit.mutateAsync({ organization, reason });
  };

  if (isLoading) {
    return <div className={styles.loading}>Завантаження...</div>;
  }

  if (request) {
    return (
      <div
        className={`${styles.statusBox} ${styles[`status_${request.status}`]}`}
      >
        <span className={styles.statusIcon}>
          {request.status === "approved"
            ? "✓"
            : request.status === "rejected"
              ? "✕"
              : "⏳"}
        </span>
        <div>
          <p className={styles.statusText}>{STATUS_MESSAGES[request.status]}</p>
          {request.review_note && (
            <p className={styles.reviewNote}>Примітка: {request.review_note}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h3 className={styles.title}>Запит ролі законотворця</h3>
      <p className={styles.description}>
        Заповніть форму, щоб отримати доступ до функцій законотворця — подачі
        пропозицій та голосування.
      </p>

      <div className={styles.field}>
        <label className={styles.label}>Організація</label>
        <input
          type="text"
          className={styles.input}
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Назва організації або установи"
          required
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label}>Обґрунтування</label>
        <textarea
          className={styles.textarea}
          rows={4}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Поясніть, чому вам потрібен доступ законотворця..."
          required
        />
      </div>

      {submit.isError && (
        <p className={styles.error}>{(submit.error as Error).message}</p>
      )}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={submit.isPending}
      >
        {submit.isPending ? "Надсилання..." : "Надіслати запит"}
      </button>
    </form>
  );
}
