import type { LawChangeType } from "@/types/law-change.types";
import styles from "./DiffHighlight.module.scss";

interface DiffHighlightProps {
  changeType: LawChangeType;
  originalText?: string;
  proposedText?: string;
}

export function DiffHighlight({ changeType, originalText, proposedText }: DiffHighlightProps) {
  if (changeType === "edit") {
    return (
      <div className={styles.wrapper}>
        {originalText && (
          <div className={styles.original}>
            <span className={styles.label}>Було</span>
            <p className={styles.textOriginal}>{originalText}</p>
          </div>
        )}
        {proposedText && (
          <div className={styles.proposed}>
            <span className={styles.label}>Стане</span>
            <p className={styles.textProposed}>{proposedText}</p>
          </div>
        )}
      </div>
    );
  }

  if (changeType === "delete") {
    return (
      <div className={styles.deleteWrapper}>
        <span className={styles.label}>Видалити</span>
        <p className={styles.textDelete}>{originalText}</p>
      </div>
    );
  }

  if (changeType === "add") {
    return (
      <div className={styles.addWrapper}>
        <span className={styles.label}>+ Додати</span>
        <p className={styles.textAdd}>{proposedText}</p>
      </div>
    );
  }

  if (changeType === "move") {
    return (
      <div className={styles.moveWrapper}>
        <span className={styles.label}>→ Перемістити</span>
        <p className={styles.textMove}>{originalText}</p>
      </div>
    );
  }

  return null;
}
