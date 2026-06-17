"use client";

import dynamic from "next/dynamic";
import type { LawChangeProposal } from "@/types/law-change.types";
import { useWithdrawProposal } from "@/features/law-change/hooks/useProposalMutations";
import { VotePanel } from "../VotePanel/VotePanel";
import styles from "./ProposalCard.module.scss";

const DiffHighlight = dynamic(
  () => import("../DiffHighlight/DiffHighlight").then(m => ({ default: m.DiffHighlight })),
  { ssr: false }
);

interface ProposalCardProps {
  proposal: LawChangeProposal;
  currentUserId?: string;
  isLegislator?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Чернетка",
  active: "Активна",
  approved: "Схвалено",
  rejected: "Відхилено",
  withdrawn: "Відкликано",
  archived: "Архів",
  superseded: "Замінено",
};

const CHANGE_LABELS: Record<string, string> = {
  edit: "Редагування",
  add: "Додавання",
  delete: "Видалення",
  move: "Переміщення",
};

export function ProposalCard({
  proposal,
  currentUserId,
  isLegislator,
}: ProposalCardProps) {
  const withdraw = useWithdrawProposal();

  const authorId =
    typeof proposal.created_by === "object"
      ? proposal.created_by._id
      : proposal.created_by;
  const isAuthor = !!currentUserId && authorId === currentUserId;
  const canWithdraw =
    isAuthor && (proposal.status === "draft" || proposal.status === "active");
  const showVoting = proposal.status === "active" && isLegislator;

  const date = new Date(proposal.createdAt).toLocaleDateString("uk-UA");

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.badges}>
          <span
            className={`${styles.statusBadge} ${styles[`status_${proposal.status}`]}`}
          >
            {STATUS_LABELS[proposal.status] ?? proposal.status}
          </span>
          <span
            className={`${styles.typeBadge} ${styles[`type_${proposal.change_type}`]}`}
          >
            {CHANGE_LABELS[proposal.change_type] ?? proposal.change_type}
          </span>
        </div>
        <div className={styles.meta}>
          <span>{proposal.author_display_name}</span>
          <span className={styles.dot}>·</span>
          <span>{date}</span>
        </div>
      </div>

      <div className={styles.diff}>
        <DiffHighlight
          changeType={proposal.change_type}
          originalText={proposal.original_text}
          proposedText={proposal.proposed_text ?? undefined}
        />
      </div>

      {proposal.reason && (
        <p className={styles.reason}>
          <em>Обґрунтування:</em> {proposal.reason}
        </p>
      )}

      {showVoting && (
        <div className={styles.voting}>
          <VotePanel proposalId={proposal._id} />
        </div>
      )}

      {canWithdraw && (
        <div className={styles.actions}>
          <button
            className={styles.withdrawBtn}
            onClick={() => withdraw.mutate(proposal._id)}
            disabled={withdraw.isPending}
          >
            Відкликати
          </button>
        </div>
      )}
    </div>
  );
}
