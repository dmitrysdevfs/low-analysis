"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileText, Zap } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useForkDiff } from "@/hooks/useForks";
import { ROUTES } from "@/constants/routes";
import styles from "../page.module.scss";

function getOperationLabel(op: "edit" | "add" | "delete"): string {
  if (op === "edit") return "Редагування";
  if (op === "add") return "Додавання";
  return "Видалення";
}

function getOperationColor(op: "edit" | "add" | "delete"): string {
  if (op === "edit") return "#e8b84b";
  if (op === "add") return "#2ea043";
  return "#c0392b";
}

function DiffContent({ forkId }: { forkId: string }) {
  const { data, isLoading, error } = useForkDiff(forkId);

  if (isLoading) {
    return <p className={styles.loadingState}>Завантаження...</p>;
  }

  if (error || !data) {
    return (
      <p className={styles.errorState}>Форк не знайдено або немає доступу</p>
    );
  }

  const { fork, changes } = data;

  return (
    <div className={styles.mainContent}>
      {/* Back link */}
      <Link
        href={ROUTES.legislatorCabinetForks}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--color-smoke)",
          fontSize: "0.85rem",
          marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} />
        Назад до форків
      </Link>

      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ФОРК · DIFF</span>

      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>{fork.title}</h1>
        <span
          style={{
            fontSize: "0.8rem",
            padding: "4px 10px",
            borderRadius: 4,
            background:
              fork.status === "approved"
                ? "#2ea043"
                : fork.status === "rejected"
                  ? "#c0392b"
                  : fork.status === "review"
                    ? "#e8b84b"
                    : "var(--color-border)",
            color: fork.status === "draft" ? "var(--color-text)" : "#fff",
          }}
        >
          {fork.status === "draft"
            ? "Чернетка"
            : fork.status === "review"
              ? "На розгляді"
              : fork.status === "approved"
                ? "Схвалено"
                : "Відхилено"}
        </span>
      </div>

      {fork.law && (
        <p
          style={{
            color: "var(--color-smoke)",
            fontSize: "0.9rem",
            marginBottom: 24,
          }}
        >
          <FileText size={14} style={{ marginRight: 6 }} />
          {fork.law.title} ({fork.law.code})
        </p>
      )}

      {/* KPI */}
      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Змін</p>
          <strong className={styles.kpiValue}>{changes.length}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Редагувань</p>
          <strong className={styles.kpiValue}>
            {changes.filter((c) => c.operation === "edit").length}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Додавань</p>
          <strong className={styles.kpiValue}>
            {changes.filter((c) => c.operation === "add").length}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Видалень</p>
          <strong className={styles.kpiValue}>
            {changes.filter((c) => c.operation === "delete").length}
          </strong>
        </div>
      </div>

      {/* Diff list */}
      {changes.length === 0 ? (
        <div className={styles.emptyState}>
          <Zap size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p className={styles.emptyTitle}>Змін поки немає</p>
          <span className={styles.emptyDesc}>
            Додайте зміни через сторінку форків
          </span>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginTop: 8,
          }}
        >
          {changes.map((change, idx) => (
            <div
              key={idx}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Change header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 16px",
                  background: "var(--color-surface)",
                  borderBottom: "1px solid var(--color-border)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontFamily: "monospace",
                    background: "var(--color-bg)",
                    padding: "2px 8px",
                    borderRadius: 4,
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {change.elementCode || `зміна ${idx + 1}`}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: getOperationColor(change.operation),
                  }}
                >
                  {getOperationLabel(change.operation)}
                </span>
                {change.rationale && (
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-smoke)",
                      marginLeft: "auto",
                    }}
                  >
                    {change.rationale}
                  </span>
                )}
              </div>

              {/* Diff body */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 0,
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderRight: "1px solid var(--color-border)",
                    background: "#1a0a0a",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#c0392b",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    − ОРИГІНАЛ
                  </p>
                  <pre
                    style={{
                      fontSize: "0.82rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                      color: "#f5c6c6",
                      fontFamily: "inherit",
                    }}
                  >
                    {change.originalText || "—"}
                  </pre>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    background: "#0a1a0a",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#2ea043",
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    + ПРОПОЗИЦІЯ
                  </p>
                  <pre
                    style={{
                      fontSize: "0.82rem",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      margin: 0,
                      color: "#c6f5c6",
                      fontFamily: "inherit",
                    }}
                  >
                    {change.proposedText || "—"}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ForkDiffPage() {
  const { user, isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();
  const params = useParams();
  const forkId = params?.id as string;

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <div className={styles.sidebar} />
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.loadingState}>Завантаження...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isLegislator && !isSupervisor && !isAdmin) {
    return (
      <div className={styles.workspace}>
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.errorState}>Доступ заборонено</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.workspace}>
      <main className={styles.mainScroll}>
        <DiffContent forkId={forkId} />
      </main>
    </div>
  );
}
