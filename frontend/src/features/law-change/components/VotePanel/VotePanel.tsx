"use client";

import { useVoteStats, useCastVote, useRemoveVote } from "@/features/law-change/hooks/useVoting";
import styles from "./VotePanel.module.scss";

interface VotePanelProps {
  proposalId: string;
  disabled?: boolean;
}

export function VotePanel({ proposalId, disabled }: VotePanelProps) {
  const { data: stats, isLoading } = useVoteStats(proposalId);
  const castVote = useCastVote(proposalId);
  const removeVote = useRemoveVote(proposalId);

  if (isLoading || !stats) {
    return <div className={styles.loading}>Завантаження голосів...</div>;
  }

  const total = stats.votes_for_weighted + stats.votes_against_weighted;
  const forPercent = total > 0 ? Math.round((stats.votes_for_weighted / total) * 100) : 50;

  const handleVote = (vote: "for" | "against") => {
    if (disabled) return;
    if (stats.my_vote === vote) return;
    castVote.mutate({ vote });
  };

  const handleRemove = () => {
    if (disabled) return;
    removeVote.mutate();
  };

  return (
    <div className={styles.panel}>
      <div className={styles.progressBar}>
        <div className={styles.forBar} style={{ width: `${forPercent}%` }} />
      </div>

      <div className={styles.counts}>
        <span className={styles.forCount}>За: {stats.votes_for_weighted.toFixed(1)}</span>
        <span className={styles.againstCount}>Проти: {stats.votes_against_weighted.toFixed(1)}</span>
      </div>

      <div className={styles.actions}>
        <button
          className={`${styles.voteBtn} ${styles.forBtn} ${stats.my_vote === "for" ? styles.active : ""}`}
          onClick={() => handleVote("for")}
          disabled={disabled || castVote.isPending}
        >
          За
        </button>
        <button
          className={`${styles.voteBtn} ${styles.againstBtn} ${stats.my_vote === "against" ? styles.active : ""}`}
          onClick={() => handleVote("against")}
          disabled={disabled || castVote.isPending}
        >
          Проти
        </button>
        {stats.my_vote && (
          <button
            className={styles.removeBtn}
            onClick={handleRemove}
            disabled={disabled || removeVote.isPending}
          >
            Скасувати голос
          </button>
        )}
      </div>
    </div>
  );
}
