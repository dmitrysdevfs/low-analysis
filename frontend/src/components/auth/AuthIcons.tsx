import type { ReactNode } from "react";
import styles from "./AuthFormScreen.module.scss";

export function FieldIcon({ children }: { children: ReactNode }) {
  return <span className={styles.fieldIcon}>{children}</span>;
}

export function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M4 20C4.86 16.85 7.74 14.75 10.98 14.75H13.02C16.26 14.75 19.14 16.85 20 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 6.5H20V17.5H4V6.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 7L12 13L20 7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 3L18.5 5.6V10.6C18.5 14.69 15.81 18.41 12 19.75C8.19 18.41 5.5 14.69 5.5 10.6V5.6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.6 11.7L11.2 13.3L14.6 9.9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function EyeIcon({ off = false }: { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 12C4.88 8.79 8.18 6.75 12 6.75C15.82 6.75 19.12 8.79 21 12C19.12 15.21 15.82 17.25 12 17.25C8.18 17.25 4.88 15.21 3 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      {off ? (
        <path
          d="M4 4L20 20"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      ) : null}
    </svg>
  );
}

export function CheckIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle
        cx="10"
        cy="10"
        r="8"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
      />
      {active ? (
        <path
          d="M6.4 10.1L8.6 12.3L13.6 7.3"
          stroke="#081020"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </svg>
  );
}
