import styles from "./AppHeader.module.scss";

export function WorkspaceIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10 2C7.79 2 6 3.79 6 6C6 8.21 7.79 10 10 10C12.21 10 14 8.21 14 6C14 3.79 12.21 2 10 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 18C3.86 14.85 6.74 12.75 9.98 12.75H10.02C13.26 12.75 16.14 14.85 17 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
