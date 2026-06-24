"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { useForkDiff } from "@/hooks/useForks";
import { useProposal } from "@/hooks/useProposals";
import { getAmendmentById } from "@/lib/api/legislator";
import { useReviewGroupFork, useReviewProposal } from "@/hooks/useSupervisor";
import { notify } from "@/lib/toast";
import type { Proposal, Amendment } from "@/types/legislator";
import styles from "../page.module.scss";

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "approved"
      ? "#2ea043"
      : status === "rejected"
        ? "#c0392b"
        : status === "review"
          ? "#e8b84b"
          : "var(--color-border)";
  const label =
    status === "approved"
      ? "Схвалено"
      : status === "rejected"
        ? "Відхилено"
        : status === "review"
          ? "На розгляді"
          : "Чернетка";
  return (
    <span
      style={{
        fontSize: "0.8rem",
        padding: "4px 10px",
        borderRadius: 4,
        background: color,
        color: ["approved", "rejected", "review"].includes(status)
          ? "#fff"
          : "var(--color-text)",
      }}
    >
      {label}
    </span>
  );
}

// ─── ForkDetail ───────────────────────────────────────────────────────────────

function ForkDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useForkDiff(id);
  const reviewFork = useReviewGroupFork();
  const [reviewNote, setReviewNote] = useState("");

  if (isLoading) return <p className={styles.loadingState}>Завантаження...</p>;
  if (error || !data)
    return <p className={styles.errorState}>Форк не знайдено</p>;

  const { fork, changes } = data;

  const handleReview = async (action: "approve" | "reject") => {
    try {
      await reviewFork.mutateAsync({ forkId: id, action, reviewNote });
      notify.success(action === "approve" ? "Форк схвалено" : "Форк відхилено");
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Помилка");
    }
  };

  return (
    <>
      <span className={styles.eyebrow}>СУПЕРВАЙЗЕР · ЗМІНИ · ФОРК</span>
      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>{fork.title}</h1>
        <StatusBadge status={fork.status} />
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
          <p className={styles.emptyTitle}>Змін немає</p>
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
                    color:
                      change.operation === "add"
                        ? "#2ea043"
                        : change.operation === "delete"
                          ? "#c0392b"
                          : "#e8b84b",
                  }}
                >
                  {change.operation === "edit"
                    ? "Редагування"
                    : change.operation === "add"
                      ? "Додавання"
                      : "Видалення"}
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
                <div style={{ padding: "12px 16px", background: "#0a1a0a" }}>
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

      {/* Supervisor review panel */}
      {fork.status === "review" && (
        <div
          style={{
            marginTop: 32,
            padding: 20,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            background: "var(--color-surface)",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 12 }}>
            Рішення супервайзера
          </p>
          <textarea
            style={{
              width: "100%",
              minHeight: 72,
              padding: 10,
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
              borderRadius: 6,
              color: "var(--color-text)",
              fontSize: "0.9rem",
              resize: "vertical",
            }}
            placeholder="Коментар (необов'язково)..."
            value={reviewNote}
            onChange={(e) => setReviewNote(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <button
              type="button"
              style={{
                padding: "8px 20px",
                background: "#2ea043",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={reviewFork.isPending}
              onClick={() => handleReview("approve")}
            >
              {reviewFork.isPending ? "..." : "Схвалити"}
            </button>
            <button
              type="button"
              style={{
                padding: "8px 20px",
                background: "#c0392b",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={reviewFork.isPending}
              onClick={() => handleReview("reject")}
            >
              {reviewFork.isPending ? "..." : "Відхилити"}
            </button>
          </div>
        </div>
      )}
      {fork.status !== "review" && (
        <p
          style={{
            marginTop: 24,
            color: "var(--color-smoke)",
            fontSize: "0.9rem",
          }}
        >
          Статус: <StatusBadge status={fork.status} />
        </p>
      )}
    </>
  );
}

// ─── ProposalDetail ───────────────────────────────────────────────────────────

function ProposalDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useProposal(id);
  const reviewProposalMutation = useReviewProposal();

  if (isLoading) return <p className={styles.loadingState}>Завантаження...</p>;
  if (error || !data)
    return <p className={styles.errorState}>Законопроєкт не знайдено</p>;

  const proposal = data as Proposal & { amendments?: Amendment[] };
  const amendments = proposal.amendments ?? [];
  const lawTitle =
    typeof proposal.law_id === "object" ? proposal.law_id?.title : "";

  const handleReview = async (action: "approve" | "reject") => {
    try {
      await reviewProposalMutation.mutateAsync({ id, action });
      notify.success(
        action === "approve"
          ? "Законопроєкт схвалено"
          : "Законопроєкт відхилено",
      );
    } catch (e) {
      notify.error(e instanceof Error ? e.message : "Помилка");
    }
  };

  return (
    <>
      <span className={styles.eyebrow}>СУПЕРВАЙЗЕР · ЗМІНИ · ПРОПОЗИЦІЯ</span>
      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>{proposal.title}</h1>
        <StatusBadge status={proposal.status} />
      </div>
      {lawTitle && (
        <p
          style={{
            color: "var(--color-smoke)",
            fontSize: "0.9rem",
            marginBottom: 16,
          }}
        >
          {lawTitle}
        </p>
      )}
      {proposal.description && (
        <p style={{ marginBottom: 24, fontSize: "0.9rem" }}>
          {proposal.description}
        </p>
      )}

      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Поправок</p>
          <strong className={styles.kpiValue}>{amendments.length}</strong>
        </div>
      </div>

      {amendments.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginTop: 16,
          }}
        >
          {amendments.map((a, idx) => (
            <div
              key={a._id}
              style={{
                border: "1px solid var(--color-border)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-smoke)",
                  marginBottom: 8,
                }}
              >
                Ст. {a.context?.article_num ?? idx + 1} · {a.change_type}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#c0392b",
                      marginBottom: 4,
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
                    }}
                  >
                    {a.original_text || "—"}
                  </pre>
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "0.7rem",
                      color: "#2ea043",
                      marginBottom: 4,
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
                    }}
                  >
                    {a.proposed_text || "—"}
                  </pre>
                </div>
              </div>
              {a.reason && (
                <p
                  style={{
                    fontSize: "0.85rem",
                    marginTop: 8,
                    color: "var(--color-smoke)",
                  }}
                >
                  <strong>Причина:</strong> {a.reason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {proposal.status === "review" && (
        <div
          style={{
            marginTop: 32,
            padding: 20,
            border: "1px solid var(--color-border)",
            borderRadius: 8,
            background: "var(--color-surface)",
          }}
        >
          <p style={{ fontWeight: 600, marginBottom: 12 }}>
            Рішення супервайзера
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              style={{
                padding: "8px 20px",
                background: "#2ea043",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={reviewProposalMutation.isPending}
              onClick={() => handleReview("approve")}
            >
              Схвалити
            </button>
            <button
              type="button"
              style={{
                padding: "8px 20px",
                background: "#c0392b",
                border: "none",
                borderRadius: 6,
                color: "#fff",
                fontWeight: 600,
                cursor: "pointer",
              }}
              disabled={reviewProposalMutation.isPending}
              onClick={() => handleReview("reject")}
            >
              Відхилити
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── AmendmentDetail ──────────────────────────────────────────────────────────

function AmendmentDetail({ id }: { id: string }) {
  const {
    data: amendment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["amendment", id],
    queryFn: () => getAmendmentById(id),
    enabled: !!id,
  });

  if (isLoading) return <p className={styles.loadingState}>Завантаження...</p>;
  if (error || !amendment)
    return <p className={styles.errorState}>Поправку не знайдено</p>;

  const articleNum = amendment.context?.article_num ?? "—";
  const lawTitle =
    typeof amendment.law_id === "object" ? amendment.law_id?.title : "";

  return (
    <>
      <span className={styles.eyebrow}>СУПЕРВАЙЗЕР · ЗМІНИ · ПОПРАВКА</span>
      <h1 className={styles.pageTitle}>
        Ст. {articleNum} ·{" "}
        {amendment.change_type === "edit"
          ? "Редагування"
          : amendment.change_type === "add"
            ? "Додавання"
            : "Видалення"}
      </h1>
      {lawTitle && (
        <p
          style={{
            color: "var(--color-smoke)",
            fontSize: "0.9rem",
            marginBottom: 16,
          }}
        >
          {lawTitle}
        </p>
      )}

      <div className={styles.kpiStrip}>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Тип</p>
          <strong className={styles.kpiValue}>{amendment.change_type}</strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>За</p>
          <strong className={styles.kpiValue}>
            {amendment.votes_summary?.positive ?? 0}
          </strong>
        </div>
        <div className={styles.kpiCard}>
          <p className={styles.kpiLabel}>Проти</p>
          <strong className={styles.kpiValue}>
            {amendment.votes_summary?.negative ?? 0}
          </strong>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          border: "1px solid var(--color-border)",
          borderRadius: 8,
          overflow: "hidden",
          marginTop: 16,
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            background: "#1a0a0a",
            borderRight: "1px solid var(--color-border)",
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
            {amendment.original_text || "—"}
          </pre>
        </div>
        <div style={{ padding: "12px 16px", background: "#0a1a0a" }}>
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
            {amendment.proposed_text || "—"}
          </pre>
        </div>
      </div>

      {amendment.reason && (
        <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
          <strong>Причина:</strong> {amendment.reason}
        </p>
      )}
      <p
        style={{
          marginTop: 24,
          color: "var(--color-smoke)",
          fontSize: "0.85rem",
        }}
      >
        Поправки не потребують окремого схвалення супервайзером
      </p>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SupervisorChangeDetailPage() {
  const { isSupervisor, isAdmin, isHydrated } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;
  const type = searchParams?.get("type") as
    | "fork"
    | "proposal"
    | "amendment"
    | null;

  if (!isHydrated) {
    return (
      <div className={styles.workspace}>
        <main className={styles.mainScroll}>
          <div className={styles.mainContent}>
            <p className={styles.loadingState}>Завантаження...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isSupervisor && !isAdmin) {
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
        <div className={styles.mainContent}>
          <Link
            href="/supervisor/changes"
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
            Назад до Змін
          </Link>
          {type === "fork" && <ForkDetail id={id} />}
          {type === "proposal" && <ProposalDetail id={id} />}
          {type === "amendment" && <AmendmentDetail id={id} />}
          {!type && <p className={styles.errorState}>Невідомий тип зміни</p>}
        </div>
      </main>
    </div>
  );
}
