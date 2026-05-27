"use client";

import styles from "./AssistantFeedback.module.scss";

interface Props {
  messageId: string;
  feedback: 1 | -1 | null;
  onFeedback: (messageId: string, value: 1 | -1) => void;
}

export function AssistantFeedback({ messageId, feedback, onFeedback }: Props) {
  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.btn} ${feedback === 1 ? styles.active : ""}`}
        onClick={() => onFeedback(messageId, 1)}
        title="Корисна відповідь"
        aria-label="Позначити відповідь корисною"
      >
        👍
      </button>
      <button
        type="button"
        className={`${styles.btn} ${feedback === -1 ? styles.active : ""}`}
        onClick={() => onFeedback(messageId, -1)}
        title="Некорисна відповідь"
        aria-label="Позначити відповідь некорисною"
      >
        👎
      </button>
    </div>
  );
}
