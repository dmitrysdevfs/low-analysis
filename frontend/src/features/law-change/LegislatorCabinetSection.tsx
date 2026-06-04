"use client";

import { useState } from "react";
import { useMyAccessRequest, useSubmitAccessRequest } from "@/features/law-change";
import { MyProposalsList } from "./components/MyProposalsList/MyProposalsList";
import styles from "./LegislatorCabinetSection.module.scss";

function AccessRequestForm() {
  const { data: existing, isLoading } = useMyAccessRequest();
  const submit = useSubmitAccessRequest();
  const [org, setOrg] = useState("");
  const [reason, setReason] = useState("");

  if (isLoading) return null;

  if (existing) {
    const statusMap = {
      pending: "На розгляді",
      approved: "Схвалено",
      rejected: "Відхилено",
    };
    return (
      <div className={styles.requestStatus}>
        <span className={styles.requestLabel}>Запит на роль законотворця:</span>
        <span className={`${styles.badge} ${styles[existing.status]}`}>
          {statusMap[existing.status]}
        </span>
        {existing.review_note && (
          <p className={styles.reviewNote}>Примітка: {existing.review_note}</p>
        )}
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !reason) return;
    submit.mutate({ organization: org, reason });
  };

  return (
    <div className={styles.formCard}>
      <h3 className={styles.formTitle}>Запит на роль законотворця</h3>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>Організація</label>
          <input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="Назва організації або установи"
            required
          />
        </div>
        <div className={styles.field}>
          <label>Обґрунтування</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Чому ви хочете отримати роль законотворця?"
            required
          />
        </div>
        <button type="submit" className={styles.submitBtn} disabled={submit.isPending}>
          {submit.isPending ? "Надсилання..." : "Подати запит"}
        </button>
      </form>
    </div>
  );
}

interface LegislatorCabinetSectionProps {
  isLegislator: boolean;
}

export function LegislatorCabinetSection({ isLegislator }: LegislatorCabinetSectionProps) {
  return (
    <>
      {isLegislator ? (
        <section>
          <MyProposalsList />
        </section>
      ) : (
        <section>
          <AccessRequestForm />
        </section>
      )}
    </>
  );
}
