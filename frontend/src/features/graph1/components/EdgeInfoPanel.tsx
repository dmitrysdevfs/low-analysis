"use client";

import { X, Star } from "lucide-react";

import type {
  Graph1Edge,
  Graph1EdgeData,
  Graph1Node,
  Graph1NodeData,
  LawReferenceType,
} from "../types/graph1.types";
import styles from "./EdgeInfoPanel.module.scss";

const EDGE_TYPE_COLORS: Record<LawReferenceType, string> = {
  direct: "#4a80d4",
  blanket: "#f4a261",
  reflexive: "#52b788",
  subject: "#c8a843",
};

const EDGE_TYPE_META: Record<
  LawReferenceType,
  { label: string; desc: string }
> = {
  direct: {
    label: "Пряме посилання",
    desc: "Закон явно згадує інший нормативний акт",
  },
  blanket: {
    label: "Бланкетна норма",
    desc: "Закон відсилає до «відповідного законодавства»",
  },
  reflexive: {
    label: "Зворотне посилання",
    desc: "Взаємне або самовиключне посилання",
  },
  subject: {
    label: "Суб'єктний зв'язок",
    desc: "Пов'язані через спільний суб'єкт права",
  },
};

function getConfidenceColor(c: number): string {
  if (c >= 0.8) return "#52b788";
  if (c >= 0.5) return "#f4a261";
  return "#e05252";
}

interface EdgeInfoPanelProps {
  edge: Graph1Edge | null;
  sourceNode: Graph1Node | null;
  targetNode: Graph1Node | null;
  onClose: () => void;
  onToggleHighlight: (edgeId: string) => void;
  isHighlighted: boolean;
}

export function EdgeInfoPanel({
  edge,
  sourceNode,
  targetNode,
  onClose,
  onToggleHighlight,
  isHighlighted,
}: EdgeInfoPanelProps) {
  if (!edge) return null;

  const data = edge.data as Graph1EdgeData | undefined;
  const refType: LawReferenceType = data?.refType ?? "direct";
  const confidence = data?.confidence ?? 1;
  const fromArticle = data?.fromArticle ?? null;
  const toArticle = data?.toArticle ?? null;
  const rawText = data?.rawText ?? null;

  const typeColor = EDGE_TYPE_COLORS[refType];
  const typeMeta = EDGE_TYPE_META[refType];
  const confidenceColor = getConfidenceColor(confidence);

  const sourceData = sourceNode?.data as Graph1NodeData | undefined;
  const targetData = targetNode?.data as Graph1NodeData | undefined;

  return (
    <aside className={styles.panel}>
      {/* 1. Header */}
      <div className={styles.section}>
        <div className={styles.headerRow}>
          <span className={styles.headerTitle}>Зв'язок між законами</span>
          <button className={styles.closeBtn} onClick={onClose} title="Закрити">
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Type */}
      <div className={styles.section}>
        <div className={styles.typeBadgeRow}>
          <span
            className={styles.typeBadge}
            style={{ color: typeColor, borderColor: `${typeColor}40` }}
          >
            <span
              className={styles.typeDot}
              style={{ background: typeColor }}
            />
            {typeMeta.label}
          </span>
        </div>
        <p className={styles.typeDesc}>{typeMeta.desc}</p>
      </div>

      {/* 3. Confidence */}
      <div className={styles.section}>
        <div className={styles.confidenceRow}>
          <span className={styles.confidenceLabel}>Достовірність:</span>
          <div className={styles.confidenceBar}>
            <div
              className={styles.confidenceFill}
              style={{
                width: `${Math.round(confidence * 100)}%`,
                background: confidenceColor,
              }}
            />
          </div>
          <span className={styles.confidencePct}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
      </div>

      {/* 4. From / To */}
      <div className={styles.section}>
        <div className={styles.relationRow}>
          <div className={styles.relationItem}>
            <span className={styles.relationDir}>Від</span>
            <span className={styles.relationName}>
              {sourceData?.label ?? sourceNode?.id ?? "—"}
            </span>
          </div>
          <div className={styles.arrow}>↓</div>
          <div className={styles.relationItem}>
            <span className={styles.relationDir}>До</span>
            <span className={styles.relationName}>
              {targetData?.label ?? targetNode?.id ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Quote */}
      {(fromArticle || rawText) && (
        <div className={styles.section}>
          {(fromArticle || toArticle) && (
            <p className={styles.articleLine}>
              Стаття {fromArticle ?? "?"} → Стаття {toArticle ?? "?"}
            </p>
          )}
          {rawText && (
            <blockquote className={styles.quote}>{rawText}</blockquote>
          )}
        </div>
      )}

      {/* 6. Highlight action */}
      <div className={styles.section}>
        <button
          className={styles.ghostBtn}
          data-active={isHighlighted ? "true" : undefined}
          onClick={() => onToggleHighlight(edge.id)}
        >
          <Star size={13} />
          {isHighlighted ? "Зняти виділення зв'язку" : "Виділити зв'язок"}
        </button>
      </div>
    </aside>
  );
}
