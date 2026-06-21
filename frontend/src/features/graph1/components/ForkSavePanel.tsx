"use client";

import { useState } from "react";
import { GitFork, Save, Upload, Trash2, Globe, Lock } from "lucide-react";
import type { GraphFork } from "../types/graph1.types";
import styles from "./ForkSavePanel.module.scss";

interface ForkSavePanelProps {
  forks: GraphFork[];
  isLoading: boolean;
  isCreating: boolean;
  isDeleting: boolean;
  onSave: (name: string, description: string, isPublic: boolean) => void;
  onLoad: (fork: GraphFork) => void;
  onDelete: (id: string) => void;
  canUseForks: boolean;
}

export function ForkSavePanel({
  forks,
  isLoading,
  isCreating,
  isDeleting,
  onSave,
  onLoad,
  onDelete,
  canUseForks,
}: ForkSavePanelProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!canUseForks) {
    return (
      <aside className={styles.panel}>
        <div className={styles.header}>
          <GitFork size={15} className={styles.headerIcon} />
          <span className={styles.headerTitle}>МОЇ ФОРКИ ГРАФУ</span>
        </div>
        <div className={styles.locked}>
          <Lock size={20} className={styles.lockedIcon} />
          <p className={styles.lockedText}>
            Збереження форків доступне для Законотворця та Супервайзера
          </p>
        </div>
      </aside>
    );
  }

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), description.trim(), isPublic);
    setName("");
    setDescription("");
    setIsPublic(false);
  };

  const handleDeleteConfirm = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteExecute = () => {
    if (!confirmDeleteId) return;
    onDelete(confirmDeleteId);
    setConfirmDeleteId(null);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("uk-UA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <GitFork size={15} className={styles.headerIcon} />
        <span className={styles.headerTitle}>МОЇ ФОРКИ ГРАФУ</span>
      </div>

      <div className={styles.saveSection}>
        <p className={styles.sectionLabel}>ЗБЕРЕГТИ СТАН</p>
        <input
          className={styles.input}
          type="text"
          placeholder="Назва форку"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <textarea
          className={styles.textarea}
          placeholder="Опис (необов'язково)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={300}
        />
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className={styles.checkbox}
          />
          <Globe size={12} />
          <span>Публічний</span>
        </label>
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!name.trim() || isCreating}
        >
          <Save size={13} />
          {isCreating ? "Збереження..." : "Зберегти поточний стан"}
        </button>
      </div>

      <div className={styles.listSection}>
        <p className={styles.sectionLabel}>
          ЗБЕРЕЖЕНІ ФОРКИ{" "}
          <span className={styles.count}>
            ({forks.length} / 20)
          </span>
        </p>

        {isLoading ? (
          <div className={styles.empty}>Завантаження...</div>
        ) : forks.length === 0 ? (
          <div className={styles.empty}>Немає збережених форків</div>
        ) : (
          <ul className={styles.forkList}>
            {forks.map((fork) => (
              <li key={fork._id} className={styles.forkItem}>
                <div className={styles.forkMeta}>
                  <span className={styles.forkName}>{fork.name}</span>
                  <div className={styles.forkBadges}>
                    {fork.isPublic && (
                      <span className={styles.publicBadge}>
                        <Globe size={10} />
                        публічний
                      </span>
                    )}
                    <span className={styles.forkDate}>
                      {formatDate(fork.updatedAt)}
                    </span>
                  </div>
                </div>

                {confirmDeleteId === fork._id ? (
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmText}>Видалити?</span>
                    <button
                      className={styles.confirmYes}
                      onClick={handleDeleteExecute}
                      disabled={isDeleting}
                    >
                      Так
                    </button>
                    <button
                      className={styles.confirmNo}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      Ні
                    </button>
                  </div>
                ) : (
                  <div className={styles.forkActions}>
                    <button
                      className={styles.loadBtn}
                      onClick={() => onLoad(fork)}
                      title="Завантажити цей форк"
                    >
                      <Upload size={12} />
                      Завантажити
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteConfirm(fork._id)}
                      title="Видалити форк"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
