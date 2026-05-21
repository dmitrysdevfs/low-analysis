"use client";

import styles from "./ExpandingSearch.module.scss";

interface ExpandingSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function ExpandingSearch({
  value,
  onChange,
  placeholder = "Пошук...",
  className,
}: ExpandingSearchProps) {
  return (
    <div
      className={`${styles.wrap} ${value ? styles.expanded : ""} ${className ?? ""}`}
    >
      <span className={styles.icon}>⌕</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={styles.input}
      />
      {value && (
        <button className={styles.clear} onClick={() => onChange("")}>
          ✕
        </button>
      )}
    </div>
  );
}
