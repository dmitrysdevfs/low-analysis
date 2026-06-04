"use client";

import { useState } from "react";
import { useChangeFeed } from "@/features/law-change";
import type { ApprovedChange } from "@/types/law-change.types";
import styles from "./ChangeFeed.module.scss";

const CHANGE_TYPE_LABEL = {
  edit: "Редагування",
  add: "Додавання",
  delete: "Видалення",
  move: "Переміщення",
} as const;

const ELEMENT_TYPE_LABEL = {
  article: "Стаття",
  clause: "Частина",
  point: "Пункт",
  subpoint: "Підпункт",
} as const;

function ChangeFeedCard({ change }: { change: ApprovedChange }) {
  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles[change.change_type]}`}>
            {CHANGE_TYPE_LABEL[change.change_type] ?? change.change_type}
          </span>
          {change.element_type && (
            <span className={styles.elementBadge}>
              {ELEMENT_TYPE_LABEL[change.element_type] ?? change.element_type}
            </span>
          )}
        </div>
        <span className={styles.date}>
          {new Date(change.approved_at).toLocaleDateString("uk-UA", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {change.new_text && (
        <p className={styles.text}>{change.new_text}</p>
      )}

      <div className={styles.cardMeta}>
        <span className={styles.votes}>
          За: <strong>{change.votes_for_weighted.toFixed(1)}</strong>
        </span>
        <span className={styles.lawRef}>Закон #{change.law_id.slice(-6)}</span>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export function ChangeFeed() {
  const [page, setPage] = useState(1);
  const { data: changes, isLoading } = useChangeFeed(page, PAGE_SIZE);

  const hasMore = (changes?.length ?? 0) === PAGE_SIZE;

  return (
    <div className={styles.feed}>
      {isLoading && <p className={styles.empty}>Завантаження...</p>}

      {!isLoading && !changes?.length && (
        <p className={styles.empty}>Змін ще немає</p>
      )}

      <div className={styles.list}>
        {changes?.map((change) => (
          <ChangeFeedCard key={change._id} change={change} />
        ))}
      </div>

      {hasMore && (
        <button
          className={styles.loadMore}
          onClick={() => setPage((p) => p + 1)}
        >
          Завантажити ще
        </button>
      )}
    </div>
  );
}
