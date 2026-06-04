"use client";

import { useState } from "react";
import {
  useAllAccessRequests,
  useApproveRequest,
  useRejectRequest,
} from "@/features/law-change";
import type { LegislatorAccessRequest } from "@/types/law-change.types";
import styles from "./AdminRequestsPanel.module.scss";

function RequestRow({ req }: { req: LegislatorAccessRequest }) {
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const approve = useApproveRequest();
  const reject = useRejectRequest();

  const userId =
    typeof req.user_id === "object" ? req.user_id._id : req.user_id;
  const displayName =
    typeof req.user_id === "object" ? req.user_id.displayName : req.user_id;

  const handleApprove = () => approve.mutate({ id: req._id, note });
  const handleReject = () => reject.mutate({ id: req._id, note });

  return (
    <div className={styles.row}>
      <div className={styles.info}>
        <span className={styles.user}>{displayName}</span>
        <span className={styles.meta}>
          {req.organization} ·{" "}
          {new Date(req.createdAt).toLocaleDateString("uk-UA")}
        </span>
        <p className={styles.reason}>{req.reason}</p>
      </div>
      <div className={styles.actions}>
        {req.status === "pending" ? (
          <>
            {showNote ? (
              <div className={styles.noteBlock}>
                <input
                  className={styles.noteInput}
                  placeholder="Примітка (необов'язково)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className={styles.btnRow}>
                  <button
                    className={styles.btnApprove}
                    onClick={handleApprove}
                    disabled={approve.isPending}
                  >
                    Схвалити
                  </button>
                  <button
                    className={styles.btnReject}
                    onClick={handleReject}
                    disabled={reject.isPending}
                  >
                    Відхилити
                  </button>
                  <button
                    className={styles.btnCancel}
                    onClick={() => setShowNote(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                className={styles.btnReview}
                onClick={() => setShowNote(true)}
              >
                Розглянути
              </button>
            )}
          </>
        ) : (
          <span className={`${styles.badge} ${styles[req.status]}`}>
            {req.status === "approved" ? "Схвалено" : "Відхилено"}
          </span>
        )}
      </div>
    </div>
  );
}

interface AdminRequestsPanelProps {
  filterStatus?: string;
}

export function AdminRequestsPanel({ filterStatus }: AdminRequestsPanelProps) {
  const [status, setStatus] = useState(filterStatus ?? "pending");
  const { data: requests, isLoading } = useAllAccessRequests(status);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Заявки на роль законотворця</h2>
        <select
          className={styles.filter}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Очікують</option>
          <option value="approved">Схвалені</option>
          <option value="rejected">Відхилені</option>
        </select>
      </div>
      {isLoading && <p className={styles.empty}>Завантаження...</p>}
      {!isLoading && !requests?.length && (
        <p className={styles.empty}>Заявок немає</p>
      )}
      <div className={styles.list}>
        {requests?.map((req) => (
          <RequestRow key={req._id} req={req} />
        ))}
      </div>
    </div>
  );
}
