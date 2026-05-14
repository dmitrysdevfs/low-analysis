import styles from "./LawCard.module.scss";

export function LawCardStat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className={`mono ${styles.statValue}`}>{value}</div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}
