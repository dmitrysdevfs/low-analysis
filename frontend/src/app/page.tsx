"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Layout } from "@/components/Layout";
import { TryzubMark } from "@/components/TryzubMark";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import styles from "./page.module.scss";

function useWindowWidth() {
  const [w, setW] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1200,
  );
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function useCountUp(target: number, duration = 1400, active = false) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || target === 0) return;

    let start: number | null = null;

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration, active]);

  return active ? value : 0;
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: [0.25, 0.1, 0.25, 1] as const },
});

const stagger = { animate: { transition: { staggerChildren: 0.09 } } };

const childFade = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.1, 0.25, 1] as const },
  },
};

const rights = [
  { art: "21", text: "Усі люди є вільні і рівні у своїй гідності та правах" },
  { art: "27", text: "Кожна людина має невід'ємне право на життя" },
  { art: "34", text: "Кожному гарантується свобода думки і слова" },
  {
    art: "41",
    text: "Кожен має право володіти, користуватися і розпоряджатися своєю власністю",
  },
  { art: "55", text: "Права і свободи людини і громадянина захищаються судом" },
];

function HerbFlipCard({
  width = 300,
  height = 360,
}: {
  width?: number;
  height?: number;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((value) => !value)}
      className={styles.flipCardOuter}
      style={{ width, height }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        className={styles.flipCardInner}
      >
        <div className={`panel ${styles.flipFront}`}>
          <motion.div
            animate={{ scale: flipped ? 0.95 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <TryzubMark size={108} />
          </motion.div>
          <div className={styles.flipFrontTextCenter}>
            <div className={`display ${styles.flipFrontTitle}`}>
              Малий герб України
            </div>
            <div className={`mono ${styles.flipFrontMono}`}>
              Тризуб · державний символ
            </div>
          </div>
          <div className={`mono ${styles.flipFrontHint}`}>
            Наведіть або натисніть
          </div>
        </div>

        <div className={`panel ${styles.flipBack}`}>
          <div className={`mono ${styles.flipBackLabel}`}>
            Конституція України · Розділ II
          </div>
          <div className={`display ${styles.flipBackTitle}`}>
            Права і свободи людини
          </div>
          <div className={styles.flipBackRights}>
            {rights.map((right, index) => (
              <motion.div
                key={right.art}
                initial={{ opacity: 0, x: 12 }}
                animate={flipped ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                transition={{
                  delay: flipped ? index * 0.07 : 0,
                  duration: 0.3,
                }}
                className={styles.flipBackRightRow}
              >
                <span className={`mono ${styles.flipBackArticleBadge}`}>
                  ст.{right.art}
                </span>
                <span className={styles.flipBackRightText}>{right.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function StatItem({
  value,
  label,
  active,
}: {
  value: number;
  label: string;
  active: boolean;
}) {
  const count = useCountUp(value, 1200, active);

  return (
    <div className={styles.statItem}>
      <div className={`mono ${styles.statValue}`}>{count.toLocaleString()}</div>
      <div className={`mono ${styles.statLabel}`}>{label}</div>
    </div>
  );
}

const steps = [
  {
    num: "01",
    title: "Завантаження",
    desc: "Cheerio парсить HTML-фрейм з zakon.rada.gov.ua за data-tree атрибутами кожного вузла.",
    icon: "⟨/⟩",
  },
  {
    num: "02",
    title: "Структурування",
    desc: "Кожен елемент отримує ієрархічний код rz→st→ch і зберігається в MongoDB Atlas.",
    icon: "§",
  },
  {
    num: "03",
    title: "Аналіз",
    desc: "REST API відкриває доступ до дерева будь-якого закону. Майбутнє — граф зв'язків між нормами.",
    icon: "◈",
  },
];

const roadmap = [
  { done: true, text: "Парсинг HTML → MongoDB (Конституція — 481 елемент)" },
  { done: true, text: "REST API для читання структури законів" },
  { done: true, text: "Пошук по законах (назва, регістронезалежний)" },
  { done: false, text: "Інгест кодексів (КУпАП, ЦКУ, КК)" },
  { done: false, text: "AI-визначення суб'єктів регулювання" },
  { done: false, text: "Граф зв'язків між нормами різних законів" },
  { done: false, text: '"Радіант" — 3D-візуалізація законодавчої бази' },
];

export default function HomePage() {
  const w = useWindowWidth();
  const { laws, loading } = useLaws();
  const statsRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const roadmapRef = useRef<HTMLDivElement>(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 });
  const stepsInView = useInView(stepsRef, { once: true, amount: 0.2 });
  const roadInView = useInView(roadmapRef, { once: true, amount: 0.2 });

  const stats = [
    { value: laws.length, label: "законів у базі" },
    {
      value: laws.reduce((sum, law) => sum + law.totalSections, 0),
      label: "розділів",
    },
    {
      value: laws.reduce((sum, law) => sum + law.totalArticles, 0),
      label: "статей",
    },
  ];

  return (
    <Layout>
      <section className={styles.heroSection}>
        <div className={styles.blobTopRight} />
        <div className={styles.blobBottomLeft} />

        <div
          className={styles.heroInner}
          style={{
            flexDirection: w < 768 ? "column" : "row",
            gap: w < 768 ? 32 : 64,
          }}
        >
          <motion.div
            className={styles.heroText}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.h1
              variants={childFade}
              className={`display ${styles.heroH1}`}
            >
              Low Analysis
            </motion.h1>

            <motion.p
              variants={childFade}
              className={`display ${styles.heroSubtitle}`}
            >
              Перетворення текстів законів на структуру
            </motion.p>

            <motion.p variants={childFade} className={styles.heroDesc}>
              Закони України існують як неструктуровані текстові полотна. Low
              Analysis розбиває кожен закон на атомарні одиниці — розділ →
              стаття → абзац — де кожен елемент має унікальний ієрархічний код і
              зв&apos;язок із батьківським елементом.
            </motion.p>

            <motion.div variants={childFade} className={styles.heroBtns}>
              <Link
                href={ROUTES.laws}
                className={`btn btn-outline ${styles.btnWithIcon}`}
              >
                Переглянути закони
                <motion.span
                  animate={{ x: [0, 4, 0] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  →
                </motion.span>
              </Link>
              <Link href={ROUTES.subjects} className="btn btn-outline">
                Суб&apos;єкти
              </Link>
              <Link
                href={ROUTES.search}
                className={`btn btn-outline ${styles.btnWithIconSm}`}
              >
                ⌕ Пошук
              </Link>
            </motion.div>
          </motion.div>

          <motion.div {...fadeUp(0.3)} className={styles.heroCardWrapper}>
            <HerbFlipCard width={300} height={360} />
          </motion.div>
        </div>
      </section>

      <div ref={statsRef} className={styles.statsBand}>
        <div className={styles.statsInner}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.statsLoadingRow}
              >
                {[80, 56, 72].map((width, index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.4,
                      repeat: Infinity,
                      delay: index * 0.15,
                    }}
                    className={styles.skeletonBlock}
                    style={{ width }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={styles.statsRow}
              >
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={statsInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <StatItem
                      value={stat.value}
                      label={stat.label}
                      active={statsInView}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <section ref={stepsRef} className={styles.stepsSection}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={stepsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          className={styles.stepsSectionHeader}
        >
          <div className={`mono ${styles.stepsSectionLabel}`}>Як це працює</div>
          <h2 className={`display ${styles.stepsSectionH2}`}>
            Від HTML до структури
          </h2>
        </motion.div>

        <div className={styles.stepsGrid}>
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              animate={stepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.12, duration: 0.45 }}
              whileHover={{ y: -4, borderColor: "rgba(200,168,67,0.4)" }}
              className={styles.stepCard}
            >
              <div className={`mono ${styles.stepCardNum}`}>{step.num}</div>
              <div className={`mono ${styles.stepCardIcon}`}>{step.icon}</div>
              <h3 className={`display ${styles.stepCardTitle}`}>
                {step.title}
              </h3>
              <p className={styles.stepCardDesc}>{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section ref={roadmapRef} className={styles.roadmapSection}>
        <div className={styles.roadmapInner}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={roadInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            className={styles.roadmapHeader}
          >
            <div className={`mono ${styles.roadmapLabel}`}>Дорожня карта</div>
            <h2 className={`display ${styles.roadmapH2}`}>
              Що зроблено і що далі
            </h2>
          </motion.div>

          <div className={styles.roadmapList}>
            {roadmap.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -16 }}
                animate={roadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                className={styles.roadmapItem}
                style={{
                  background: item.done
                    ? "rgba(200,168,67,0.04)"
                    : "transparent",
                  border: item.done
                    ? "1px solid rgba(200,168,67,0.12)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className={`mono ${styles.roadmapCheckmark}`}
                  style={{ color: item.done ? "#C8A843" : "#1C3260" }}
                >
                  {item.done ? "✓" : "○"}
                </span>
                <span
                  className={styles.roadmapItemText}
                  style={{ color: item.done ? "#D6E0F0" : "#7A98C0" }}
                >
                  {item.text}
                </span>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={roadInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.7, duration: 0.4 }}
            className={styles.roadmapFooter}
          >
            <div>
              <p className={`display ${styles.roadmapFooterTitle}`}>
                {loading
                  ? "Завантаження…"
                  : `${laws.length} закон${laws.length === 1 ? "" : "ів"} у базі`}
              </p>
              <p className={`mono ${styles.roadmapFooterMono}`}>
                {loading ? "…" : laws.map((law) => law.code).join(" · ")}
              </p>
            </div>
            <Link href={ROUTES.laws} className={styles.roadmapFooterLink}>
              Відкрити закони →
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
