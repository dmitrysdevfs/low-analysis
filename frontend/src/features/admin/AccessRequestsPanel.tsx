"use client";
// v2
import { useState } from "react";
import { ClipboardList, UserCheck } from "lucide-react";
import {
  usePendingAccessRequests,
  useReviewAccessRequest,
} from "@/hooks/useAccessRequest";
import { notify } from "@/lib/toast";
import styles from "./AccessRequestsPanel.module.scss";

export function AccessRequestsPanel() {
  const {
    data: requests = [],
    isLoading,
    refetch,
  } = usePendingAccessRequests();
  const reviewMutation = useReviewAccessRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const handleAction = async (id: string, action: "approve" | "reject") => {
    try {
      await reviewMutation.mutateAsync({
        id,
        action,
        adminNote: notes[id] ?? "",
      });
      notify.success(
        action === "approve" ? "Запит схвалено" : "Запит відхилено",
      );
      refetch();
    } catch {
      notify.error("Помилка при обробці запиту");
    }
  };

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Доступ</span>
          <h3 className={styles.title}>Запити на роль законотворця</h3>
        </div>
        {requests.length > 0 && (
          <span className={styles.badge}>{requests.length}</span>
        )}
      </div>

      {isLoading ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>
            <ClipboardList size={20} />
          </div>
          <p className={styles.emptyTitle}>Завантаження...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyWrap}>
          <div className={styles.emptyIcon}>
            <UserCheck size={18} />
          </div>
          <div className={styles.emptyText}>
            <p className={styles.emptyTitle}>Нових заявок немає</p>
            <p className={styles.emptyNote}>
              Коли користувачі подаватимуть заявки — вони з'являться тут.
            </p>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {requests.map((req) => {
            const u = typeof req.userId === "object" ? req.userId : null;
            const initials = u?.fullName
              ? u.fullName
                  .split(" ")
                  .map((w: string) => w[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase()
              : "?";

            return (
              <div key={req._id} className={styles.card}>
                <div className={styles.cardTop}>
                  <span className={styles.avatar}>{initials}</span>
                  <span className={styles.name}>{u?.fullName ?? "—"}</span>
                  <span className={styles.email}>
                    {u?.email ??
                      (typeof req.userId === "string"
                        ? req.userId
                        : req.userId._id)}
                  </span>
                  <span className={styles.date}>
                    {new Date(req.createdAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>
                {req.message && <p className={styles.message}>{req.message}</p>}
                <div className={styles.actions}>
                  <input
                    type="text"
                    placeholder="Примітка адміна (необов'язково)"
                    value={notes[req._id] ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [req._id]: e.target.value,
                      }))
                    }
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
      )}
    </section>
  );
}
