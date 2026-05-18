import styles from "./AppHeader.module.scss";

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
      className={`${styles.chevronIcon} ${open ? styles.chevronIconOpen : ""}`}
    >
      <path
        d="M5.5 7.5L10 12L14.5 7.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}
