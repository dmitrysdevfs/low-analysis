"use client";

import { useState } from "react";
import { usePendingAccessRequests, useReviewAccessRequest } from "@/hooks/useAccessRequest";
import { notify } from "@/lib/toast";
import styles from "./AccessRequestsPanel.module.scss";

export function AccessRequestsPanel() {
  const { data: requests = [], isLoading, refetch } = usePendingAccessRequests();
  const reviewMutation = useReviewAccessRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await reviewMutation.mutateAsync({ id, action, adminNote: notes[id] ?? "" });
      notify.success(action === "approve" ? "Запит схвалено" : "Запит відхилено");
      refetch();
    } catch {
      notify.error("Помилка при обробці запиту");
    }
  };

  if (isLoading) return <p>Завантаження...</p>;
  if (!requests.length) return <p className={styles.empty}>Немає pending запитів</p>;

  return (
    <div className={styles.panel}>
      <h3 className={styles.title}>Запити на роль законотворця ({requests.length})</h3>
      {requests.map((req) => {
        const u = typeof req.userId === "object" ? req.userId : null;
        return (
          <div key={req._id} className={styles.card}>
            <div className={styles.userInfo}>
              <strong>{u?.fullName ?? "—"}</strong>
              <span>{u?.email ?? (typeof req.userId === "string" ? req.userId : req.userId._id)}</span>
              <span className={styles.date}>{new Date(req.createdAt).toLocaleDateString("uk-UA")}</span>
            </div>
            {req.message && <p className={styles.message}>{req.message}</p>}
            <div className={styles.actions}>
              <input
                type="text"
                placeholder="Примітка адміна (необов'язково)"
                value={notes[req._id] ?? ""}
                onChange={(e) => setNotes((prev) => ({ ...prev, [req._id]: e.target.value }))}
                className={styles.noteInput}
              />
              <button
                className={styles.btnApprove}
                onClick={() => handleAction(req._id, "approve")}
                disabled={reviewMutation.isPending}
              >
                Схвалити
              </button>
              <button
                className={styles.btnReject}
                onClick={() => handleAction(req._id, "reject")}
                disabled={reviewMutation.isPending}
              >
                Відхилити
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
