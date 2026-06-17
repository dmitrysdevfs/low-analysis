"use client";

import { useForkDiff } from "@/hooks/useForks";
import styles from "./ForkDiffModal.module.scss";

function renderInlineDiff(
  original: string,
  proposed: string,
  operation: "edit" | "add" | "delete",
) {
  if (operation === "add") {
    return (
      <span
        style={{
          color: "#4caf50",
          background: "rgba(76,175,80,0.1)",
          padding: "2px 4px",
          borderRadius: 3,
        }}
      >
        {proposed}
      </span>
    );
  }
  if (operation === "delete") {
    return (
      <span
        style={{
          color: "#f44336",
          textDecoration: "line-through",
          background: "rgba(244,67,54,0.1)",
          padding: "2px 4px",
          borderRadius: 3,
        }}
      >
        {original}
      </span>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {original && (
        <span
          style={{
            color: "#f44336",
            textDecoration: "line-through",
            background: "rgba(244,67,54,0.08)",
            padding: "2px 4px",
            borderRadius: 3,
            fontSize: "0.82em",
          }}
        >
          {original}
        </span>
      )}
      {proposed && (
        <span
          style={{
            color: "#4caf50",
            background: "rgba(76,175,80,0.08)",
            padding: "2px 4px",
            borderRadius: 3,
            fontSize: "0.82em",
          }}
        >
          {proposed}
        </span>
      )}
    </div>
  );
}

interface Props {
  forkId: string;
  onClose: () => void;
}

export function ForkDiffModal({ forkId, onClose }: Props) {
  const { data, isLoading, error } = useForkDiff(forkId);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{data?.fork.title ?? "Diff форку"}</h2>
          <button className={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>

        {isLoading && <p className={styles.state}>Завантаження...</p>}
        {error && <p className={styles.state}>Помилка завантаження diff</p>}

        {data && data.changes.length === 0 && (
          <p className={styles.state}>Змін немає</p>
        )}

        {data && data.changes.length > 0 && (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Елемент</th>
                  <th>Тип</th>
                  <th>Оригінал</th>
                  <th>Пропозиція</th>
                  <th>Обґрунтування</th>
                </tr>
              </thead>
              <tbody>
                {data.changes.map((c, i) => (
                  <tr key={i}>
                    <td className={styles.code}>{c.elementCode}</td>
                    <td>
                      <span
                        className={`${styles.op} ${styles[("op_" + c.operation) as keyof typeof styles]}`}
                      >
                        {c.operation}
                      </span>
                    </td>
                    <td className={styles.text}>{c.originalText || "—"}</td>
                    <td className={styles.text}>{c.proposedText || "—"}</td>
                    <td className={styles.text}>{c.rationale || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <h3
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 12,
                  opacity: 0.7,
                }}
              >
                Візуальний перегляд змін
              </h3>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 10 }}
              >
                {data.changes.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 8,
                      borderLeft: "3px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        opacity: 0.5,
                        marginBottom: 6,
                        fontFamily: "monospace",
                      }}
                    >
                      {c.elementCode}
                    </div>
                    {renderInlineDiff(
                      c.originalText,
                      c.proposedText,
                      c.operation,
                    )}
                    {c.rationale && (
                      <div
                        style={{
                          fontSize: "0.75rem",
                          opacity: 0.5,
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        💬 {c.rationale}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
