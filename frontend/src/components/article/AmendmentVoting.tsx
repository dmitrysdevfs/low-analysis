"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useVoteSummary, useMyVote, useCastVote } from "@/hooks/useVotes";
import { notify } from "@/lib/toast";
import styles from "./AmendmentVoting.module.scss";

interface AmendmentVotingProps {
  amendmentId: string;
}

export function AmendmentVoting({ amendmentId }: AmendmentVotingProps) {
  const { user } = useAuth();

  const canVote =
    user?.accountType === "admin" ||
    !!user?.roles?.includes("legislator");

  const { data: summary } = useVoteSummary(amendmentId);
  const { data: myVote } = useMyVote(canVote ? amendmentId : "");

  const castVoteMutation = useCastVote();

  const handleVote = async (value: "positive" | "neutral" | "negative") => {
    if (!user) {
      notify.error("Будь ласка, увійдіть, щоб проголосувати");
      return;
    }
    if (!canVote) {
      notify.error("У вас немає прав для голосування за поправки");
      return;
    }

    try {
      await castVoteMutation.mutateAsync({ amendment_id: amendmentId, value });
      notify.success("Голос враховано");
    } catch {
      notify.error("Не вдалося проголосувати");
    }
  };

  const positiveCount = summary?.positive ?? 0;
  const neutralCount = summary?.neutral ?? 0;
  const negativeCount = summary?.negative ?? 0;
  const currentVoteValue = myVote?.value;

  return (
    <div className={styles.votingContainer}>
      <span className={styles.votingLabel}>Голосування:</span>
      <div className={styles.votingButtons}>
        <button
          onClick={() => handleVote("positive")}
          className={`${styles.voteBtn} ${styles.positive} ${
            currentVoteValue === "positive" ? styles.active : ""
          }`}
          disabled={castVoteMutation.isPending || !canVote}
          title="За"
        >
          👍 За ({positiveCount})
        </button>
        <button
          onClick={() => handleVote("neutral")}
          className={`${styles.voteBtn} ${styles.neutral} ${
            currentVoteValue === "neutral" ? styles.active : ""
          }`}
          disabled={castVoteMutation.isPending || !canVote}
          title="Утримуюсь"
        >
          😐 Утримуюсь ({neutralCount})
        </button>
        <button
          onClick={() => handleVote("negative")}
          className={`${styles.voteBtn} ${styles.negative} ${
            currentVoteValue === "negative" ? styles.active : ""
          }`}
          disabled={castVoteMutation.isPending || !canVote}
          title="Проти"
        >
          👎 Проти ({negativeCount})
        </button>
      </div>
      {!canVote && user && (
        <span className={styles.votingTip}>Голосувати можуть лише законотворці</span>
      )}
    </div>
  );
}
