"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { AssistantSource } from "../types";
import styles from "./AssistantSourcesPanel.module.scss";

interface Props {
  sources: AssistantSource[];
}

export function AssistantSourcesPanel({ sources }: Props) {
  const unique = sources.filter(
    (s, i, arr) => arr.findIndex((x) => x.href === s.href) === i,
  );

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.heading}>Джерела</span>
      </div>

      <div className={styles.list}>
        {unique.length === 0 ? (
          <p className={styles.empty}>Джерела з'являться після відповіді</p>
        ) : (
          unique.map((s, i) => (
            <div key={i} className={styles.card}>
              <span className={`${styles.badge} ${styles[`badge_${s.type}`]}`}>
                {s.type === "faq"
                  ? "FAQ"
                  : s.type === "law"
                    ? "Закон"
                    : "Стаття"}
              </span>
              {s.href ? (
                <Link href={s.href} className={styles.title} target="_blank">
                  {s.title}
                  <ExternalLink size={11} className={styles.ext} />
                </Link>
              ) : (
                <span className={styles.title}>{s.title}</span>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
