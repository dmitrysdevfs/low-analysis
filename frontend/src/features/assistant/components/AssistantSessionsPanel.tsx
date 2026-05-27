"use client";

import { Plus, Trash2 } from "lucide-react";
import styles from "./AssistantSessionsPanel.module.scss";

interface Session {
  id: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

interface Props {
  sessions: Session[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export function AssistantSessionsPanel({
  sessions,
  activeId,
  onSelect,
  onDelete,
  onNew,
}: Props) {
  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.heading}>Сесії</span>
        <button
          type="button"
          className={styles.newBtn}
          onClick={onNew}
          title="Нова сесія"
        >
          <Plus size={15} />
        </button>
      </div>

      <div className={styles.list}>
        {sessions.length === 0 && (
          <p className={styles.empty}>Ще немає збережених сесій</p>
        )}
        {sessions.map((s) => (
          <div
            key={s.id}
            className={`${styles.item} ${s.id === activeId ? styles.itemActive : ""}`}
          >
            <button
              type="button"
              className={styles.itemTitle}
              onClick={() => onSelect(s.id)}
            >
              {s.title}
              <span className={styles.itemMeta}>
                {new Date(s.updatedAt).toLocaleDateString("uk-UA")} ·{" "}
                {s.messageCount} повідомл.
              </span>
            </button>
            <button
              type="button"
              className={styles.deleteBtn}
              onClick={() => onDelete(s.id)}
              title="Видалити сесію"
              aria-label="Видалити"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
