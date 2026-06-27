"use client";

import { useState } from "react";
import { useMyProposals } from "@/features/law-change";
import type {
  LawChangeProposal,
  LawChangeStatus,
} from "@/types/law-change.types";
import styles from "./MyProposalsList.module.scss";

const STATUS_LABELS: Record<LawChangeStatus, string> = {
  draft: "Чернетка",
  active: "Активна",
  approved: "Схвалено",
  rejected: "Відхилено",
  withdrawn: "Відкликано",
  archived: "Архів",
  superseded: "Замінено",
};

const STATUS_COLORS: Record<LawChangeStatus, string> = {
  draft: "#7a98c0",
  active: "#4a80d4",
  approved: "#86efac",
  rejected: "#fca5a5",
  withdrawn: "#7a98c0",
  archived: "#4a5568",
  superseded: "#4a5568",
};

function ProposalCard({ proposal }: { proposal: LawChangeProposal }) {
  const color = STATUS_COLORS[proposal.status] ?? "#7a98c0";
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.changeType}>{proposal.change_type}</span>
        <span className={styles.status} style={{ color }}>
          {STATUS_LABELS[proposal.status] ?? proposal.status}
        </span>
      </div>
      {proposal.element_type && (
        <span className={styles.changeType} style={{ marginBottom: 4, opacity: 0.7 }}>
          {proposal.element_type}
        </span>
      )}
      <p className={styles.reason}>{proposal.reason || "Без опису"}</p>
      <div className={styles.cardMeta}>
        <span>
          За: <strong>{proposal.votes_for_weighted.toFixed(1)}</strong>
        </span>
        <span>
          Проти: <strong>{proposal.votes_against_weighted.toFixed(1)}</strong>
        </span>
        <span className={styles.date}>
          {new Date(proposal.createdAt).toLocaleDateString("uk-UA")}
        </span>
      </div>
    </div>
  );
}

const ALL_STATUSES: Array<LawChangeStatus | "all"> = [
  "all",
  "draft",
  "active",
  "approved",
  "rejected",
  "withdrawn",
];

export function MyProposalsList() {
  const { data: proposals, isLoading } = useMyProposals();
  const [filter, setFilter] = useState<LawChangeStatus | "all">("all");

  const filtered =
    filter === "all"
      ? proposals
      : proposals?.filter((p) => p.status === filter);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Мої пропозиції змін</h2>
        <div className={styles.filters}>
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.active : ""}`}
              onClick={() => setFilter(s)}
            >
              {s === "all" ? "Всі" : STATUS_LABELS[s as LawChangeStatus]}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className={styles.empty}>Завантаження...</p>}

      {!isLoading && !filtered?.length && (
        <p className={styles.empty}>Ще немає пропозицій</p>
      )}

      <div className={styles.grid}>
        {filtered?.map((p) => (
          <ProposalCard key={p._id} proposal={p} />
        ))}
      </div>
    </div>
  );
}
