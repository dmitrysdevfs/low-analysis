"use client";

import Link from "next/link";
import { motion, useInView, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLaws } from "@/hooks/useLaws";
import { useCountUp } from "@/hooks/useCountUp";
import { useAuth } from "@/components/auth/AuthProvider";
import { ROUTES } from "@/constants/routes";
import styles from "./Footer.module.scss";

const API_DOCS_URL = "https://low-analysis.onrender.com/api-docs";

const NAV = [
  { label: "Закони", href: ROUTES.laws },
  { label: "Суб'єкти", href: ROUTES.subjects },
  { label: "Пошук", href: ROUTES.search },
];

const ACCOUNT = [
  { label: "Акаунт", href: ROUTES.account },
  { label: "Увійти", href: ROUTES.authLogin },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function CursorBlink({ className, onClass }: { className: string; onClass: string }) {
  const [tick, setTick] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setTick((v) => !v), 700);
    return () => clearInterval(t);
  }, []);
  return <span className={`${className} ${tick ? onClass : ""}`}>▌</span>;
}

function StatCounter({
  value,
  label,
  active,
}: {
  value: number;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1400, active);
  return (
    <div className={styles.statItem}>
      <div className={`mono ${styles.statValue}`}>
        {count.toLocaleString("uk-UA")}
      </div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}

export default function Footer() {
  const { isAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { laws, loading, error: lawsError } = useLaws();
  const statsRef = useRef<HTMLDivElement>(null);
  const inView = useInView(statsRef, { once: true, amount: 0.4 });

  const stats = [
    { value: laws.length, label: "законів у базі" },
    { value: laws.reduce((s, l) => s + l.totalSections, 0), label: "розділів" },
    { value: laws.reduce((s, l) => s + l.totalArticles, 0), label: "статей" },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.scanLine} />
      <div className={styles.bgGrid} />
      <div className={styles.blobLeft} />
      <div className={styles.blobRight} />

      {/* 3D rotating cube */}
      <div className={styles.scene} aria-hidden>
        <div className={styles.cube}>
          <div className={`${styles.face} ${styles.front}`}>§</div>
          <div className={`${styles.face} ${styles.back}`}>LAW</div>
          <div className={`${styles.face} ${styles.right}`}>UA</div>
          <div className={`${styles.face} ${styles.left}`}>LEX</div>
          <div className={`${styles.face} ${styles.top}`}>•</div>
          <div className={`${styles.face} ${styles.bottom}`}>▣</div>
        </div>
      </div>

      {/* Stats band */}
      <div ref={statsRef} className={styles.statsBand}>
        <div className={styles.statsInner}>
          {lawsError ? (
            <div className={`mono ${styles.statsLoading}`} style={{ color: "rgba(200,100,100,0.7)", fontSize: "0.75rem" }}>
              Не вдалося завантажити статистику
            </div>
          ) : loading ? (
            <div className={styles.statsLoading}>
              {[90, 60, 72].map((w, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                  className={styles.statSkeleton}
                  style={{ width: w }}
                />
              ))}
            </div>
          ) : (
            <motion.div
              className={styles.statsRow}
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.4 }}
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                >
                  <StatCounter
                    value={s.value}
                    label={s.label}
                    active={inView}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Main 3-col grid */}
      <motion.div
        className={styles.grid}
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
      >
        {/* col 1 — brand */}
        <motion.div className={styles.col} variants={fadeUp}>
          <div className={`display ${styles.brand}`}>Law Analysis</div>
          <p className={`mono ${styles.brandDesc}`}>
            Реєстр суб&apos;єктів та норм
            <br />
            законодавства України
          </p>
          <div className={`mono ${styles.version}`}>v1.0.0 · 2026 · MIT</div>
        </motion.div>

        {/* col 2 — navigation */}
        <motion.div className={styles.col} variants={fadeUp}>
          <div className={`mono ${styles.colLabel}`}>Навігація</div>
          <ul className={styles.navList}>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  <span className={styles.navArrow}>→</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className={`mono ${styles.colLabel} ${styles.colLabelGap}`}>
            Акаунт
          </div>
          <ul className={styles.navList}>
            {ACCOUNT.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  <span className={styles.navArrow}>→</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* col 3 — status */}
        <motion.div className={styles.col} variants={fadeUp}>
          <div className={`mono ${styles.colLabel}`}>Статус системи</div>
          <ul className={styles.statusList}>
            {[
              { label: "API", status: "online", color: "green" },
              { label: "Database", status: "online", color: "green" },
              { label: "Build", status: "stable", color: "gold" },
            ].map((s) => (
              <li key={s.label} className={styles.statusItem}>
                <span
                  className={`${styles.dot} ${s.color === "green" ? styles.dotGreen : styles.dotGold}`}
                />
                <span className={`mono ${styles.statusLabel}`}>{s.label}</span>
                <span
                  className={`mono ${styles.statusValue} ${s.color === "green" ? styles.statusOnline : styles.statusStable}`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>

          <div className={`mono ${styles.terminal}`}>
            <span className={styles.prompt}>$</span>
            <span className={styles.cmd}>system ready</span>
            <CursorBlink className={styles.cursor} onClass={styles.cursorOn} />
          </div>

          {mounted && isAdmin && (
            <a
              href={API_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={`mono ${styles.docsLink}`}
            >
              Документація API →
            </a>
          )}
        </motion.div>
      </motion.div>

      {/* Bottom bar */}
      <motion.div
        className={`mono ${styles.bottom}`}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <span>© 2026 Law Analysis</span>
        <span className={styles.sep}>·</span>
        <span>Аналіз законодавства України</span>
        <span className={styles.sep}>·</span>
        <span>Open Source</span>
        <span className={styles.sep}>·</span>
        <Link href={ROUTES.legal} className={styles.legalLink}>
          Умови та конфіденційність
        </Link>
      </motion.div>
    </footer>
  );
}
