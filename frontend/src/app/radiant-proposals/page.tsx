"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Layout } from "@/components/layout/Layout";
import {
  useRadiantProposals,
  useRadiantVoteStats,
  useCastRadiantVote,
  useRemoveRadiantVote,
  useCreateRadiantProposal,
} from "@/hooks/useRadiantProposals";
import {
  submitRadiantProposal,
  deleteRadiantProposal,
} from "@/lib/api/radiantProposals";
import type {
  RadiantProposal,
  RadiantProposalType,
} from "@/lib/api/radiantProposals";
import { notify } from "@/lib/toast";
import styles from "./page.module.scss";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLawName(
  ref: string | { title: string; _id: string; code: string } | undefined,
): string {
  if (!ref) return "-";
  if (typeof ref === "object") return ref.title;
  return ref;
}

function formatDeadline(value: string | null): string {
  if (!value) return "Без дедлайну";
  return new Date(value).toLocaleString("uk-UA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TYPE_LABELS: Record<RadiantProposalType, string> = {
  add_node: "Додати вузол",
  remove_node: "Видалити вузол",
  add_link: "Додати зв'язок",
  remove_link: "Видалити зв'язок",
};

const STATUS_TONE: Record<string, string> = {
  active: "active",
  approved: "approved",
  rejected: "rejected",
  expired: "gray",
  withdrawn: "gray",
  draft: "draft",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Активне",
  approved: "Затверджено",
  rejected: "Відхилено",
  expired: "Прострочено",
  withdrawn: "Скасовано",
  draft: "Чернетка",
};

// ── Vote buttons ──────────────────────────────────────────────────────────────

function ProposalVoteRow({ proposal }: { proposal: RadiantProposal }) {
  const { data: voteStats } = useRadiantVoteStats(
    proposal.status === "active" ? proposal._id : null,
  );
  const castVote = useCastRadiantVote();
  const removeVote = useRemoveRadiantVote();

  const myVote = voteStats?.my_vote ?? null;
  const isActive = proposal.status === "active";

  async function handleVote(direction: "for" | "against") {
    try {
      if (direction === myVote) {
        await removeVote.mutateAsync(proposal._id);
        notify.success("Голос знято");
      } else {
        await castVote.mutateAsync({ id: proposal._id, vote: direction });
        notify.success("Голос враховано");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Помилка голосування";
      if (msg.toLowerCase().includes("автор") || msg.includes("403")) {
        notify.error("Ви автор цієї пропозиції");
      } else {
        notify.error(msg);
      }
    }
  }

  async function handleAbstain() {
    if (!myVote) return;
    try {
      await removeVote.mutateAsync(proposal._id);
      notify.success("Голос знято");
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Помилка");
    }
  }

  const pending = castVote.isPending || removeVote.isPending;

  return (
    <div className={styles.voteRow}>
      <button
        type="button"
        className={`${styles.voteBtn} ${myVote === "for" ? styles.voteBtnActiveFor : ""}`}
        disabled={!isActive || pending}
        onClick={() => handleVote("for")}
      >
        ✓ За
      </button>
      <button
        type="button"
        className={`${styles.voteBtn} ${myVote === "against" ? styles.voteBtnActiveAgainst : ""}`}
        disabled={!isActive || pending}
        onClick={() => handleVote("against")}
      >
        ✗ Проти
      </button>
      <button
        type="button"
        className={`${styles.voteBtn} ${!myVote ? styles.voteBtnActiveNeutral : ""}`}
        disabled={!isActive || pending || !myVote}
        onClick={handleAbstain}
      >
        — Утриматись
      </button>
    </div>
  );
}

// ── Proposal card ─────────────────────────────────────────────────────────────

function ProposalCard({ proposal }: { proposal: RadiantProposal }) {
  const tone = STATUS_TONE[proposal.status] ?? "gray";

  function renderSubject() {
    if (
      proposal.proposal_type === "add_node" ||
      proposal.proposal_type === "remove_node"
    ) {
      return (
        <p className={styles.subject}>
          <span className={styles.subjectLabel}>Закон:</span>{" "}
          {getLawName(proposal.node_law_id)}
        </p>
      );
    }
    return (
      <p className={styles.subject}>
        <span className={styles.subjectLabel}>Зв'язок:</span>{" "}
        {getLawName(proposal.source_law_id)} →{" "}
        {getLawName(proposal.target_law_id)}
        {proposal.link_type ? ` (${proposal.link_type})` : ""}
      </p>
    );
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardHead}>
        <div className={styles.badges}>
          <span className={styles.typeBadge}>
            {TYPE_LABELS[proposal.proposal_type]}
          </span>
          <span
            className={`${styles.statusBadge} ${styles[`statusBadge_${tone}`]}`}
          >
            {STATUS_LABELS[proposal.status] ?? proposal.status}
          </span>
        </div>
        <span className={styles.deadline}>
          {formatDeadline(proposal.voting_deadline)}
        </span>
      </div>

      {renderSubject()}

      <p className={styles.reason}>{proposal.reason}</p>

      <div className={styles.meta}>
        <span>Автор: {proposal.author_display_name}</span>
        <span className={styles.votes}>
          За: {proposal.votes_for_weighted} очк. ({proposal.votes_for_count}) |
          Проти: {proposal.votes_against_weighted} очк. (
          {proposal.votes_against_count})
        </span>
      </div>

      <ProposalVoteRow proposal={proposal} />
    </article>
  );
}

// ── Create form ───────────────────────────────────────────────────────────────

function CreateProposalForm({ onClose }: { onClose: () => void }) {
  const createProposal = useCreateRadiantProposal();

  const [proposalType, setProposalType] =
    useState<RadiantProposalType>("add_node");
  const [nodeLawId, setNodeLawId] = useState("");
  const [sourceLawId, setSourceLawId] = useState("");
  const [targetLawId, setTargetLawId] = useState("");
  const [linkType, setLinkType] = useState("");
  const [reason, setReason] = useState("");

  const isLink = proposalType === "add_link" || proposalType === "remove_link";

  async function handleSaveDraft() {
    try {
      const data = buildPayload();
      await createProposal.mutateAsync(data);
      notify.success("Чернетку збережено");
      onClose();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : "Помилка збереження");
    }
  }

  async function handleSubmit() {
    if (!reason.trim()) {
      notify.error("Вкажіть причину пропозиції");
      return;
    }
    let created:
      | Awaited<ReturnType<typeof createProposal.mutateAsync>>
      | undefined;
    try {
      created = await createProposal.mutateAsync(buildPayload());
      await submitRadiantProposal(created._id, reason.trim());
      notify.success("Пропозицію подано на голосування");
      onClose();
    } catch (err) {
      if (created) {
        try {
          await deleteRadiantProposal(created._id);
        } catch {}
      }
      notify.error(err instanceof Error ? err.message : "Помилка подачі");
    }
  }

  function buildPayload() {
    if (isLink) {
      return {
        proposal_type: proposalType,
        source_law_id: sourceLawId.trim() || undefined,
        target_law_id: targetLawId.trim() || undefined,
        link_type: linkType.trim() || undefined,
        reason: reason.trim(),
      };
    }
    return {
      proposal_type: proposalType,
      node_law_id: nodeLawId.trim() || undefined,
      reason: reason.trim(),
    };
  }

  return (
    <div className={styles.formPanel}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Нова пропозиція до Радіанту</h2>
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          ✕
        </button>
      </div>

      <div className={styles.formBody}>
        <label className={styles.field}>
          <span>Тип пропозиції</span>
          <select
            className="form-control form-select"
            value={proposalType}
            onChange={(e) =>
              setProposalType(e.target.value as RadiantProposalType)
            }
          >
            <option value="add_node">Додати вузол</option>
            <option value="remove_node">Видалити вузол</option>
            <option value="add_link">Додати зв'язок</option>
            <option value="remove_link">Видалити зв'язок</option>
          </select>
        </label>

        {!isLink ? (
          <label className={styles.field}>
            <span>Закон (ID або назва)</span>
            <input
              className="form-control"
              type="text"
              value={nodeLawId}
              onChange={(e) => setNodeLawId(e.target.value)}
              placeholder="ID або назва закону"
            />
          </label>
        ) : (
          <>
            <label className={styles.field}>
              <span>ID закону-джерела</span>
              <input
                className="form-control"
                type="text"
                value={sourceLawId}
                onChange={(e) => setSourceLawId(e.target.value)}
                placeholder="ID закону-джерела"
              />
            </label>
            <label className={styles.field}>
              <span>ID закону-мети</span>
              <input
                className="form-control"
                type="text"
                value={targetLawId}
                onChange={(e) => setTargetLawId(e.target.value)}
                placeholder="ID закону-мети"
              />
            </label>
            <label className={styles.field}>
              <span>Тип зв'язку (необов'язково)</span>
              <input
                className="form-control"
                type="text"
                value={linkType}
                onChange={(e) => setLinkType(e.target.value)}
                placeholder="Наприклад: references, amends"
              />
            </label>
          </>
        )}

        <label className={styles.field}>
          <span>Причина</span>
          <textarea
            className="form-control"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Обгрунтуйте пропозицію"
          />
        </label>

        <div className={styles.formActions}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSaveDraft}
            disabled={createProposal.isPending}
          >
            Зберегти чернетку
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={createProposal.isPending}
          >
            Подати на голосування
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RadiantProposalsPage() {
  const { isAuthenticated, isHydrated, isLegislator, isSupervisor, isAdmin } =
    useAuth();
  const router = useRouter();

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useRadiantProposals({
    status: statusFilter || undefined,
    type: typeFilter || undefined,
    page,
    limit: 20,
  });

  if (isHydrated && !isAuthenticated) {
    router.replace("/login");
    return null;
  }

  const canCreate = isLegislator || isSupervisor || isAdmin;

  const proposals = data?.proposals ?? [];
  const pages = data?.pages ?? 1;

  const filtered = proposals.slice().sort((a, b) => {
    if (!a.voting_deadline && !b.voting_deadline) return 0;
    if (!a.voting_deadline) return 1;
    if (!b.voting_deadline) return -1;
    return (
      new Date(a.voting_deadline).getTime() -
      new Date(b.voting_deadline).getTime()
    );
  });

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Пропозиції до Радіанту</h1>
            <p className={styles.subtitle}>
              Голосування щодо змін у радіантній структурі вузлів та зв'язків
            </p>
          </div>
          {canCreate && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowForm((v) => !v)}
            >
              ＋ Нова пропозиція
            </button>
          )}
        </div>

        {showForm && <CreateProposalForm onClose={() => setShowForm(false)} />}

        <div className={styles.filters}>
          <select
            className="form-control form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Усі статуси</option>
            <option value="active">Активні</option>
            <option value="approved">Затверджені</option>
            <option value="rejected">Відхилені</option>
            <option value="expired">Прострочені</option>
          </select>
          <select
            className="form-control form-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Усі типи</option>
            <option value="add_node">Додати вузол</option>
            <option value="remove_node">Видалити вузол</option>
            <option value="add_link">Додати зв'язок</option>
            <option value="remove_link">Видалити зв'язок</option>
          </select>
        </div>

        {isLoading && <div className={styles.loading}>Завантаження...</div>}

        {error && (
          <div className={styles.errorBox}>
            Не вдалося завантажити пропозиції
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>⊘</div>
            <p>Пропозицій немає</p>
          </div>
        )}

        {!isLoading && filtered.length > 0 && (
          <div className={styles.list}>
            {filtered.map((p) => (
              <ProposalCard key={p._id} proposal={p} />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Назад
            </button>
            <span className={styles.pageInfo}>
              {page} / {pages}
            </span>
            <button
              className={styles.pageBtn}
              disabled={page >= pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Далі →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
