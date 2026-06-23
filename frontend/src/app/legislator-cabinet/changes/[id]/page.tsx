"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, FileText, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { useForkDiff, useSubmitFork } from "@/hooks/useForks";
import { useProposal, useSubmitProposal } from "@/hooks/useProposals";
import { useDeleteAmendment, useUpdateAmendment } from "@/hooks/useAmendments";
import { getAmendmentById } from "@/lib/api/legislator";
import { notify } from "@/lib/toast";
import type { Proposal, Amendment } from "@/types/legislator";
import styles from "../page.module.scss";

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

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

/* ─── KPI strip (inline — not in changes/page.module.scss) ─────────────────── */

const kpiStripStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 24,
};

const kpiCardStyle: React.CSSProperties = {
  flex: "1 1 90px",
  minWidth: 90,
  padding: "12px 16px",
  background: "var(--color-surface, rgba(8,17,32,0.88))",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
};

const kpiLabelStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "0.7rem",
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "var(--color-smoke)",
  marginBottom: 4,
};

const kpiValueStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "1.5rem",
  fontWeight: 700,
  color: "#fff7e8",
  lineHeight: 1,
};

/* ─── Button styles ─────────────────────────────────────────────────────────── */

const btnPrimaryStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 6,
  border: "none",
  background: "#c8a843",
  color: "#060e1c",
  fontWeight: 600,
  fontSize: "0.875rem",
  cursor: "pointer",
};

const btnSecondaryStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 6,
  border: "1px solid var(--color-border)",
  background: "none",
  color: "var(--color-smoke)",
  fontSize: "0.875rem",
  cursor: "pointer",
};

const btnDeleteStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 6,
  border: "1px solid rgba(192,57,43,0.4)",
  background: "none",
  color: "#c0392b",
  fontSize: "0.875rem",
  cursor: "pointer",
};

/* ─── ForkDetail ────────────────────────────────────────────────────────────── */

function ForkDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useForkDiff(id);
  const submitFork = useSubmitFork();

  if (isLoading) {
    return (
      <p style={{ color: "var(--color-smoke)", fontSize: "0.9rem" }}>
        Завантаження...
      </p>
    );
  }

  if (error || !data) {
    return (
      <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>
        Форк не знайдено або немає доступу
      </p>
    );
  }

  const { fork, changes } = data;

  return (
    <>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЗМІНИ · ФОРК</span>

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
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FileText size={14} />
          {fork.law.title} ({fork.law.code})
        </p>
      )}

      {/* KPI */}
      <div style={kpiStripStyle}>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Змін</p>
          <strong style={kpiValueStyle}>{changes.length}</strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Редагувань</p>
          <strong style={kpiValueStyle}>
            {changes.filter((c) => c.operation === "edit").length}
          </strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Додавань</p>
          <strong style={kpiValueStyle}>
            {changes.filter((c) => c.operation === "add").length}
          </strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Видалень</p>
          <strong style={kpiValueStyle}>
            {changes.filter((c) => c.operation === "delete").length}
          </strong>
        </div>
      </div>

      {/* Diff list */}
      {changes.length === 0 ? (
        <div className={styles.emptyState}>
          <Zap size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Змін поки немає</p>
          <span style={{ fontSize: "0.85rem" }}>
            Додайте зміни через сторінку форків
          </span>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 8 }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
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

      {/* Submit action */}
      {fork.status === "draft" && (
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            type="button"
            style={{
              ...btnPrimaryStyle,
              opacity: submitFork.isPending ? 0.6 : 1,
              cursor: submitFork.isPending ? "not-allowed" : "pointer",
            }}
            disabled={submitFork.isPending}
            onClick={() =>
              submitFork
                .mutateAsync(id)
                .then(() => notify.success("Форк подано на розгляд"))
                .catch((e: Error) => notify.error(e.message))
            }
          >
            {submitFork.isPending ? "Подання..." : "Подати на розгляд"}
          </button>
        </div>
      )}

      {fork.status === "review" && (
        <p style={{ marginTop: 24, color: "var(--color-smoke)", fontSize: "0.9rem" }}>
          Очікує розгляду супервайзера
        </p>
      )}
    </>
  );
}

/* ─── ProposalDetail ────────────────────────────────────────────────────────── */

function ProposalDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useProposal(id);
  const submitProposal = useSubmitProposal();

  if (isLoading) {
    return (
      <p style={{ color: "var(--color-smoke)", fontSize: "0.9rem" }}>
        Завантаження...
      </p>
    );
  }

  if (error || !data) {
    return (
      <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>
        Законопроєкт не знайдено
      </p>
    );
  }

  const proposal = data as Proposal & { amendments?: Amendment[] };
  const amendments = proposal.amendments ?? [];
  const lawTitle =
    typeof proposal.law_id === "object" ? proposal.law_id?.title : "";

  return (
    <>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЗМІНИ · ПРОПОЗИЦІЯ</span>

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

      {/* KPI */}
      <div style={kpiStripStyle}>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Поправок</p>
          <strong style={kpiValueStyle}>{amendments.length}</strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>За</p>
          <strong style={kpiValueStyle}>
            {proposal.votes_summary?.positive ?? 0}
          </strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Проти</p>
          <strong style={kpiValueStyle}>
            {proposal.votes_summary?.negative ?? 0}
          </strong>
        </div>
      </div>

      {/* Amendments list */}
      {amendments.length > 0 && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}
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
                style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
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

      {amendments.length === 0 && (
        <div className={styles.emptyState}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Поправок немає</p>
          <span style={{ fontSize: "0.85rem" }}>
            До цього законопроєкту ще не додано поправок
          </span>
        </div>
      )}

      {/* Actions */}
      {proposal.status === "draft" && (
        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button
            type="button"
            style={{
              ...btnPrimaryStyle,
              opacity: submitProposal.isPending ? 0.6 : 1,
              cursor: submitProposal.isPending ? "not-allowed" : "pointer",
            }}
            disabled={submitProposal.isPending}
            onClick={() =>
              submitProposal
                .mutateAsync(id)
                .then(() => notify.success("Законопроєкт подано"))
                .catch((e: Error) => notify.error(e.message))
            }
          >
            {submitProposal.isPending ? "Подання..." : "Подати на розгляд"}
          </button>
        </div>
      )}

      {proposal.status === "review" && (
        <p
          style={{
            marginTop: 24,
            color: "var(--color-smoke)",
            fontSize: "0.9rem",
          }}
        >
          Очікує розгляду супервайзера
        </p>
      )}
    </>
  );
}

/* ─── AmendmentDetail ───────────────────────────────────────────────────────── */

function AmendmentDetail({ id }: { id: string }) {
  const { data: amendment, isLoading, error } = useQuery({
    queryKey: ["amendment", id],
    queryFn: () => getAmendmentById(id),
    enabled: !!id,
  });
  const deleteAmendment = useDeleteAmendment();
  const updateAmendment = useUpdateAmendment();
  const [editing, setEditing] = useState(false);
  const [proposedText, setProposedText] = useState("");

  if (isLoading) {
    return (
      <p style={{ color: "var(--color-smoke)", fontSize: "0.9rem" }}>
        Завантаження...
      </p>
    );
  }

  if (error || !amendment) {
    return (
      <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>
        Поправку не знайдено
      </p>
    );
  }

  const articleNum = amendment.context?.article_num ?? "—";
  const lawTitle =
    typeof amendment.law_id === "object" ? amendment.law_id?.title : "";
  const changeLabel =
    amendment.change_type === "edit"
      ? "Редагування"
      : amendment.change_type === "add"
        ? "Додавання"
        : "Видалення";

  return (
    <>
      <span className={styles.eyebrow}>ЗАКОНОТВОРЕЦЬ · ЗМІНИ · ПОПРАВКА</span>

      <div className={styles.heroRow}>
        <h1 className={styles.pageTitle}>
          Ст. {articleNum} · {changeLabel}
        </h1>
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

      {/* KPI */}
      <div style={kpiStripStyle}>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Тип</p>
          <strong
            style={{
              ...kpiValueStyle,
              fontSize: "1rem",
              color: getOperationColor(amendment.change_type),
            }}
          >
            {changeLabel}
          </strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>За</p>
          <strong style={kpiValueStyle}>
            {amendment.votes_summary?.positive ?? 0}
          </strong>
        </div>
        <div style={kpiCardStyle}>
          <p style={kpiLabelStyle}>Проти</p>
          <strong style={kpiValueStyle}>
            {amendment.votes_summary?.negative ?? 0}
          </strong>
        </div>
      </div>

      {/* Diff */}
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
          {editing ? (
            <textarea
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#c6f5c6",
                fontFamily: "inherit",
                fontSize: "0.82rem",
                resize: "vertical",
                minHeight: 80,
                outline: "none",
              }}
              value={proposedText}
              onChange={(e) => setProposedText(e.target.value)}
            />
          ) : (
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
          )}
        </div>
      </div>

      {amendment.reason && (
        <p style={{ marginTop: 16, fontSize: "0.9rem" }}>
          <strong>Причина:</strong> {amendment.reason}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        {editing ? (
          <>
            <button
              type="button"
              style={{
                ...btnPrimaryStyle,
                opacity: updateAmendment.isPending ? 0.6 : 1,
                cursor: updateAmendment.isPending ? "not-allowed" : "pointer",
              }}
              disabled={updateAmendment.isPending}
              onClick={() => {
                updateAmendment
                  .mutateAsync({ id, data: { proposed_text: proposedText } })
                  .then(() => {
                    notify.success("Збережено");
                    setEditing(false);
                  })
                  .catch((e: Error) => notify.error(e.message));
              }}
            >
              {updateAmendment.isPending ? "Збереження..." : "Зберегти"}
            </button>
            <button
              type="button"
              style={btnSecondaryStyle}
              onClick={() => setEditing(false)}
            >
              Скасувати
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              style={btnSecondaryStyle}
              onClick={() => {
                setProposedText(amendment.proposed_text ?? "");
                setEditing(true);
              }}
            >
              Редагувати
            </button>
            <button
              type="button"
              style={{
                ...btnDeleteStyle,
                opacity: deleteAmendment.isPending ? 0.6 : 1,
                cursor: deleteAmendment.isPending ? "not-allowed" : "pointer",
              }}
              disabled={deleteAmendment.isPending}
              onClick={() => {
                deleteAmendment
                  .mutateAsync(id)
                  .then(() => {
                    notify.success("Поправку видалено");
                    window.history.back();
                  })
                  .catch((e: Error) => notify.error(e.message));
              }}
            >
              {deleteAmendment.isPending ? "Видалення..." : "Видалити"}
            </button>
          </>
        )}
      </div>
    </>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function ChangeDetailPage() {
  const { isLegislator, isSupervisor, isAdmin, isHydrated } = useAuth();
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
            <p style={{ color: "var(--color-smoke)", fontSize: "0.9rem" }}>
              Завантаження...
            </p>
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
            <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>
              Доступ заборонено
            </p>
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
            href="/legislator-cabinet/changes"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--color-smoke)",
              fontSize: "0.85rem",
              marginBottom: 20,
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} />
            Назад до Змін
          </Link>

          {type === "fork" && <ForkDetail id={id} />}
          {type === "proposal" && <ProposalDetail id={id} />}
          {type === "amendment" && <AmendmentDetail id={id} />}
          {!type && (
            <p style={{ color: "#c0392b", fontSize: "0.9rem" }}>
              Невідомий тип зміни
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
