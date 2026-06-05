"use client";

import { PATREON_URL } from "@/constants/external";
import styles from "./PatreonCard.module.scss";

export function PatreonCard() {
  return (
    <div className={styles.scene}>
      <div className={styles.cube}>
        {/* front — heart with glow */}
        <div className={`${styles.face} ${styles.front}`}>
          <span className={styles.faceHeart}>♥</span>
        </div>

        {/* back — title */}
        <div className={`${styles.face} ${styles.back}`}>
          <span className={styles.faceTitle}>
            Підтримайте
            <br />
            Law Analysis
          </span>
        </div>

        {/* right — description */}
        <div className={`${styles.face} ${styles.right}`}>
          <span className={styles.faceDesc}>
            Проект розвивається
            <br />
            силами ентузіастів
          </span>
        </div>

        {/* left — cta button */}
        <div className={`${styles.face} ${styles.left}`}>
          <a
            href={PATREON_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.faceBtn}
          >
            ♥ Patreon
          </a>
        </div>

        {/* top — eyebrow */}
        <div className={`${styles.face} ${styles.top}`}>
          <span className={styles.faceLabel}>Підтримка проекту</span>
        </div>

        {/* bottom — decorative */}
        <div className={`${styles.face} ${styles.bottom}`}>
          <span className={styles.faceDecor}>▣</span>
        </div>
      </div>
    </div>
  );
}
