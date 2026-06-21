"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Focus, Star } from "lucide-react";

import type { Graph1Node, Graph1NodeData } from "../types/graph1.types";
import styles from "./Graph1InfoPanel.module.scss";

const LAW_TYPE_COLORS: Record<string, string> = {
  кодекс: "#c8a843",
  кримінальний: "#e05252",
  цивільний: "#4a80d4",
  адміністративний: "#7a98c0",
  трудовий: "#52b788",
  господарський: "#f4a261",
};

function getLawTypeColor(lawType: string): string {
  const lower = lawType.toLowerCase();
  for (const [key, color] of Object.entries(LAW_TYPE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "#9eb5d9";
}

interface Graph1InfoPanelProps {
  node: Graph1Node | null;
  onClose: () => void;
  onNavigate: (lawId: string) => void;
  onFocusOnLaw: (lawId: string) => void;
  onToggleHighlight: (nodeId: string) => void;
  onSetNote: (lawId: string, text: string) => void;
  isHighlighted: boolean;
}

export function Graph1InfoPanel({
  node,
  onClose,
  onNavigate,
  onFocusOnLaw,
  onToggleHighlight,
  onSetNote,
  isHighlighted,
}: Graph1InfoPanelProps) {
  const data = node?.data as Graph1NodeData | undefined;
  const [noteText, setNoteText] = useState(data?.note ?? "");

  useEffect(() => {
    setNoteText(data?.note ?? "");
  }, [node?.id, data?.note]);

  if (!node || !data) return null;

  const typeColor = getLawTypeColor(data.lawType);

  return (
    <aside className={styles.panel}>
      {/* 1. Header */}
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <span className={styles.codeLabel}>{data.code}</span>
          <button className={styles.closeBtn} onClick={onClose} title="Закрити">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Type badge */}
      <div className={styles.section}>
        <span
          className={styles.typeBadge}
          style={{ color: typeColor, borderColor: `${typeColor}40` }}
        >
          {data.lawType}
        </span>
      </div>

      {/* 3. Title */}
      <div className={styles.section}>
        <p className={styles.title}>{data.label}</p>
      </div>

      {/* 4. Meta */}
      <div className={styles.section}>
        <div className={styles.metaGrid}>
          <span className={styles.metaKey}>Рік:</span>
          <span className={styles.metaVal}>{data.adoptedYear ?? "—"}</span>
          <span className={styles.metaKey}>Статей:</span>
          <span className={styles.metaVal}>{data.totalArticles}</span>
        </div>
      </div>

      {/* 5. Actions */}
      <div className={styles.section}>
        <div className={styles.actionsCol}>
          <button
            className={styles.primaryBtn}
            onClick={() => onNavigate(data.id)}
          >
            <ExternalLink size={13} />
            Відкрити закон
          </button>
          <button
            className={styles.ghostBtn}
            onClick={() => onFocusOnLaw(data.id)}
          >
            <Focus size={13} />
            Показати у фокусі
          </button>
          <button
            className={styles.ghostBtn}
            data-active={isHighlighted ? "true" : undefined}
            onClick={() => onToggleHighlight(node.id)}
          >
            <Star size={13} />
            {isHighlighted ? "Зняти виділення" : "Виділити"}
          </button>
        </div>
      </div>

      {/* 6. Note */}
      <div className={styles.section}>
        <textarea
          className={styles.noteTextarea}
          placeholder="Додати нотатку…"
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <button
          className={styles.primaryBtn}
          onClick={() => onSetNote(data.id, noteText)}
        >
          Зберегти нотатку
        </button>
      </div>
    </aside>
  );
}
