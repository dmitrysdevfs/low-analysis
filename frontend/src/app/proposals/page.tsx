"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  useProposals,
  useProposalVoteStats,
  useCastVote,
  useRemoveVote,
} from "@/hooks/useLawChangeProposals";
import { notify } from "@/lib/toast";
import { ROUTES } from "@/constants/routes";
import type { LawChangeProposal, LawChangeStatus, LawChangeType } from "@/types/law-change.types";
import styles from "./page.module.scss";

// ── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<LawChangeType, string> = {
  edit: "Редагування",
  add: "Додавання",
  delete: "Видалення",
  move: "Переміщення",
};

const STATUS_LABELS: Record<LawChangeStatus, string> = {
  draft: "Чернетка",
  active: "Активна",
  approved: "Схвалено",
  rejected: "Відхилено",
  withdrawn: "Відкликано",
  archived: "Архів",
  superseded: "Замінено",
};

function statusBadgeClass(status: LawChangeStatus): string {
  switch (status) {
    case "active":
      return styles.statusActive;
    case "approved":
      return styles.statusApproved;
    case "rejected":
      return styles.statusRejected;
    case "expired" as string:
    case "withdrawn":
    case "archived":
    case "superseded":
      return styles.statusExpired;
    default:
      return styles.statusExpired;
  }
}

function getLawName(
  law_id: LawChangeProposal["law_id"] | { _id: string; title: string },
): string {
  if (typeof law_id === "object" && law_id !== null && "title" in (law_id as object)) {
    return (law_id as { _id: string; title: string }).title;
  }
  return String(law_id);
}

function sortByDeadline(proposals: LawChangeProposal[]): LawChangeProposal[] {
  return [...proposals].sort((a, b) => {
    if (!a.voting_deadline && !b.voting_deadline) return 0;
    if (!a.voting_deadline) return 1;
    if (!b.voting_deadline) return -1;
    return new Date(a.voting_deadline).getTime() - new Date(b.voting_deadline).getTime();
  });
}

function getAuthorId(created_by: LawChangeProposal["created_by"]): string {
  if (typeof created_by === "object" && created_by !== null) {
    return created_by._id;
  }
  return String(created_by);
}

// ── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  isAuthenticated,
  userId,
}: {
  proposal: LawChangeProposal;
  isAuthenticated: boolean;
  userId: string | undefined;
}) {
  const castVote = useCastVote();
  const removeVote = useRemoveVote();

  const isActive = proposal.status === "active";
  const isAuthor = !!userId && getAuthorId(proposal.created_by) === userId;

  // Fetch per-card vote stats only for authenticated users on active proposals
  const { data: voteStats } = useProposalVoteStats(
    isAuthenticated && isActive ? proposal._id : null,
  );

  const myVote = voteStats?.my_vote ?? null;

  const handleVote = useCallback(
    async (direction: "for" | "against") => {
      if (isAuthor) return;
      try {
        if (myVote === direction) {
          await removeVote.mutateAsync(proposal._id);
          notify.success("Голос знято");
        } else {
          await castVote.mutateAsync({ proposalId: proposal._id, vote: direction });
          notify.success("Голос враховано");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Помилка";
        if (msg.includes("403") || msg.toLowerCase().includes("власн")) {
          notify.error("Ви не можете голосувати за власну пропозицію");
        } else {
          notify.error(msg);
        }
      }
    },
    [proposal._id, myVote, isAuthor, castVote, removeVote],
  );

  const handleAbstain = useCallback(async () => {
    if (!myVote || isAuthor) return;
    try {
      await removeVote.mutateAsync(proposal._id);
      notify.success("Голос знято");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Помилка");
    }
  }, [proposal._id, myVote, isAuthor, removeVote]);

  const isBusy = castVote.isPending || removeVote.isPending;

  const deadline = proposal.voting_deadline
    ? `До: ${new Date(proposal.voting_deadline).toLocaleDateString("uk-UA")}`
    : "Без дедлайну";

  return (
    <article className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <span className={styles.cardLawName}>{getLawName(proposal.law_id)}</span>
        <span className={styles.typeBadge}>{TYPE_LABELS[proposal.change_type]}</span>
        <span className={`${styles.statusBadge} ${statusBadgeClass(proposal.status)}`}>
          {STATUS_LABELS[proposal.status] ?? proposal.status}
        </span>
      </div>

      {/* Meta */}
      <div className={styles.cardMeta}>
        <span className={styles.cardAuthor}>Автор: {proposal.author_display_name}</span>
        <span>·</span>
        <span className={styles.cardDeadline}>{deadline}</span>
      </div>

      {/* Diff */}
      <div className={styles.diffBlock}>
        {proposal.change_type !== "add" && proposal.original_text && (
          <span className={styles.diffOriginal}>{proposal.original_text}</span>
        )}
        {proposal.change_type !== "add" && proposal.change_type !== "delete" && proposal.proposed_text && (
          <span className={styles.diffArrow}>→</span>
        )}
        {proposal.change_type !== "delete" && proposal.proposed_text && (
          <span className={styles.diffProposed}>{proposal.proposed_text}</span>
        )}
      </div>

      {/* Vote counts */}
      <div className={styles.voteCounts}>
        <span className={styles.voteFor}>
          За: {proposal.votes_for_weighted} очк. ({proposal.votes_for_count} осіб)
        </span>
        {" | "}
        <span className={styles.voteAgainst}>
          Проти: {proposal.votes_against_weighted} очк. ({proposal.votes_against_count} осіб)
        </span>
      </div>

      {/* Vote buttons */}
      {isAuthenticated ? (
        <div className={styles.voteRow}>
          <button
            type="button"
            title={isAuthor ? "Ви автор" : undefined}
            disabled={!isActive || isAuthor || isBusy}
            onClick={() => handleVote("for")}
            className={`${styles.voteBtn} ${styles.voteBtnFor} ${myVote === "for" ? styles.voteBtnActive : ""}`}
          >
            ✓ За
          </button>
          <button
            type="button"
            title={isAuthor ? "Ви автор" : undefined}
            disabled={!isActive || isAuthor || isBusy}
            onClick={() => handleVote("against")}
            className={`${styles.voteBtn} ${styles.voteBtnAgainst} ${myVote === "against" ? styles.voteBtnActive : ""}`}
          >
            ✗ Проти
          </button>
          <button
            type="button"
            disabled={!isActive || !myVote || isAuthor || isBusy}
            onClick={handleAbstain}
            className={styles.voteBtn}
          >
            — Утриматись
          </button>
        </div>
      ) : (
        <span className={styles.authBanner}>Увійдіть, щоб голосувати</span>
      )}
    </article>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = [
  { value: "", label: "Всі статуси" },
  { value: "active", label: "Активні" },
  { value: "approved", label: "Схвалені" },
  { value: "rejected", label: "Відхилені" },
  { value: "withdrawn", label: "Відкликані" },
  { value: "expired", label: "Прострочені" },
];

const TYPE_OPTIONS = [
  { value: "", label: "Всі типи" },
  { value: "edit", label: "Редагування" },
  { value: "add", label: "Додавання" },
  { value: "delete", label: "Видалення" },
  { value: "move", label: "Переміщення" },
];

const PAGE_LIMIT = 20;

export default function ProposalsPage() {
  const router = useRouter();
  const { isAuthenticated, isHydrated, user } = useAuth();

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.push(ROUTES.authLogin);
    }
  }, [isHydrated, isAuthenticated, router]);

  const { data, isLoading } = useProposals({
    status: statusFilter || undefined,
    page,
    limit: PAGE_LIMIT,
  });

  const allProposals = data?.proposals ?? [];
  const totalPages = data?.pages ?? 1;
  const currentPage = data?.page ?? 1;

  // Client-side type filter + sort by deadline
  const filtered = sortByDeadline(
    typeFilter ? allProposals.filter((p) => p.change_type === typeFilter) : allProposals,
  );

  if (!isHydrated) {
    return (
      <Layout>
        <div className={`section-pad ${styles.sectionInner}`}>
          <p className={styles.loadingState}>Завантаження...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className={styles.wrapper}>
        <div className={`section-pad ${styles.sectionInner}`}>
          <h1 className={styles.heading}>Пропозиції до Законів</h1>
          <p className={styles.subtitle}>
            Всі пропозиції змін до законодавства — голосуйте за або проти
          </p>

          {/* Filters */}
          <div className={styles.filtersRow}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          {isLoading ? (
            <p className={styles.loadingState}>Завантаження...</p>
          ) : filtered.length === 0 ? (
            <p className={styles.emptyState}>Пропозицій немає</p>
          ) : (
            <div className={styles.cardsList}>
              {filtered.map((proposal) => (
                <ProposalCard
                  key={proposal._id}
                  proposal={proposal}
                  isAuthenticated={isAuthenticated}
                  userId={user?.id}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Назад
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === currentPage ? styles.pageBtnActive : ""}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className={styles.pageBtn}
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Далі →
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
