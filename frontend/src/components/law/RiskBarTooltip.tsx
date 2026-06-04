"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./RiskBarTooltip.module.scss";

const TOOLTIP_TEXT: Record<"law" | "article", string> = {
  law: "Кожна стаття отримує оцінку за обсягом найбільшого елемента. Фільтр показує лише статті обраної категорії.",
  article:
    "Оцінка розраховується за кількістю знаків у кожному елементі. Фільтр показує елементи обраної категорії та їхні батьківські вузли — щоб зберегти ієрархічний контекст.",
};

export function RiskBarTooltip({ context }: { context: "law" | "article" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className={styles.wrap}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => setOpen((v) => !v)}
        aria-label="Довідка про аналізатор складності"
      >
        ⓘ
      </button>
      {open && (
        <div className={styles.popover} role="tooltip">
          {TOOLTIP_TEXT[context]}
        </div>
      )}
    </div>
  );
}
