"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";

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

function TryzubSvg({ size = 120 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      fill="none"
      aria-hidden="true"
    >
      <rect x="20" y="105" width="60" height="8" rx="2" fill="#C8A843" />
      <rect x="44" y="60" width="12" height="48" rx="2" fill="#C8A843" />
      <path d="M44 60 Q44 32 50 24 Q56 32 56 60 Z" fill="#C8A843" />
      <path
        d="M44 75 Q30 75 26 68 Q22 60 30 52 Q34 48 38 52 L44 58"
        stroke="#C8A843"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M26 68 Q22 58 28 50 Q32 44 36 50 Q38 54 36 60"
        stroke="#C8A843"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M56 75 Q70 75 74 68 Q78 60 70 52 Q66 48 62 52 L56 58"
        stroke="#C8A843"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M74 68 Q78 58 72 50 Q68 44 64 50 Q62 54 64 60"
        stroke="#C8A843"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

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

function HerbFlipCard() {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((value) => !value)}
      style={{
        perspective: 1000,
        cursor: "pointer",
        width: 300,
        height: 360,
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          transformStyle: "preserve-3d",
        }}
      >
        <div
          className="panel"
          style={{
            position: "absolute",
            inset: 0,
            backfaceVisibility: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <motion.div
            animate={{ scale: flipped ? 0.95 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <TryzubSvg size={110} />
          </motion.div>
          <div style={{ textAlign: "center" }}>
            <div
              className="display"
              style={{ fontSize: "1.05rem", color: "#FFFFFF" }}
            >
              Герб України
            </div>
            <div
              className="mono"
              style={{ fontSize: "0.6rem", color: "#4A80D4", marginTop: 6 }}
            >
              Тризуб · Символ держави
            </div>
          </div>
          <div
            className="mono"
            style={{ fontSize: "0.55rem", color: "#1C3260", marginTop: 8 }}
          >
            Наведи або натисни
          </div>
        </div>

        <div
          className="panel"
          style={{
            position: "absolute",
            inset: 0,
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          <div
            className="mono"
            style={{ fontSize: "0.6rem", color: "#C8A843", marginBottom: 16 }}
          >
            Конституція України · Розділ II
          </div>
          <div
            className="display"
            style={{ fontSize: "1rem", color: "#FFFFFF", marginBottom: 16 }}
          >
            Права і свободи людини
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              flex: 1,
            }}
          >
            {rights.map((right, index) => (
              <motion.div
                key={right.art}
                initial={{ opacity: 0, x: 12 }}
                animate={flipped ? { opacity: 1, x: 0 } : { opacity: 0, x: 12 }}
                transition={{
                  delay: flipped ? index * 0.07 : 0,
                  duration: 0.3,
                }}
                style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "0.6rem",
                    color: "#C8A843",
                    background: "rgba(200,168,67,0.1)",
                    border: "1px solid rgba(200,168,67,0.2)",
                    borderRadius: 3,
                    padding: "1px 5px",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  ст.{right.art}
                </span>
                <span
                  style={{
                    color: "#A8BEDD",
                    fontSize: "0.72rem",
                    lineHeight: 1.5,
                  }}
                >
                  {right.text}
                </span>
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
    <div style={{ textAlign: "center", padding: "0 32px" }}>
      <div
        className="mono"
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "#C8A843",
          lineHeight: 1,
        }}
      >
        {count.toLocaleString()}
      </div>
      <div
        className="mono"
        style={{
          fontSize: "0.72rem",
          color: "#7A98C0",
          marginTop: 6,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        {label}
      </div>
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
    desc: "REST API відкриває доступ до дерева будь-якого закону. Майбутнє — граф зв’язків між нормами.",
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
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: "72px 48px 80px",
          maxWidth: 1100,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 480,
            height: 480,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(26,62,138,0.35) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,168,67,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 64,
            flexWrap: "wrap",
          }}
        >
          <motion.div
            style={{ flex: "1 1 340px" }}
            variants={stagger}
            initial="initial"
            animate="animate"
          >
            <motion.div variants={childFade} style={{ marginBottom: 16 }}>
              <span className="eyebrow">v0.1 · MVP</span>
            </motion.div>

            <motion.h1
              variants={childFade}
              className="display"
              style={{
                fontSize: "clamp(2.6rem, 5vw, 4.4rem)",
                margin: "0 0 8px",
                lineHeight: 1.05,
              }}
            >
              Low Analysis
            </motion.h1>

            <motion.p
              variants={childFade}
              className="display"
              style={{
                fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
                fontStyle: "italic",
                color: "#C8A843",
                margin: "0 0 24px",
                lineHeight: 1.3,
              }}
            >
              Перетворення текстів законів на структуру
            </motion.p>

            <motion.p
              variants={childFade}
              style={{
                fontSize: "0.95rem",
                color: "#7A98C0",
                lineHeight: 1.75,
                maxWidth: 460,
                margin: "0 0 36px",
              }}
            >
              Закони України існують як неструктуровані текстові полотна. Low
              Analysis розбиває кожен закон на атомарні одиниці — розділ →
              стаття → абзац — де кожен елемент має унікальний ієрархічний код і
              зв&apos;язок із батьківським елементом.
            </motion.p>

            <motion.div
              variants={childFade}
              style={{ display: "flex", gap: 12, flexWrap: "wrap" }}
            >
              <Link
                href={ROUTES.laws}
                style={{
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "#C8A843",
                  background: "transparent",
                  border: "1px solid #C8A843",
                  borderRadius: 6,
                  padding: "11px 28px",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
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
              <Link
                href={ROUTES.subjects}
                style={{
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  color: "#4A80D4",
                  background: "rgba(74,128,212,0.08)",
                  border: "1px solid rgba(74,128,212,0.25)",
                  borderRadius: 6,
                  padding: "11px 22px",
                  textDecoration: "none",
                }}
              >
                Суб&apos;єкти
              </Link>
            </motion.div>
          </motion.div>

          <motion.div {...fadeUp(0.3)} style={{ flex: "0 1 auto" }}>
            <HerbFlipCard />
          </motion.div>
        </div>
      </section>

      <div
        ref={statsRef}
        style={{
          borderTop: "1px solid #1C3260",
          borderBottom: "1px solid #1C3260",
          background: "#0D1C3A",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "32px 48px",
            display: "flex",
            justifyContent: "space-around",
            flexWrap: "wrap",
            gap: 24,
            minHeight: 100,
            alignItems: "center",
          }}
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  gap: 48,
                  flexWrap: "wrap",
                  justifyContent: "center",
                }}
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
                    style={{
                      width,
                      height: 48,
                      background: "#1C3260",
                      borderRadius: 6,
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  justifyContent: "space-around",
                  flexWrap: "wrap",
                  gap: 24,
                  width: "100%",
                }}
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

      <section
        ref={stepsRef}
        style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px" }}
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={stepsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4 }}
          style={{ marginBottom: 48 }}
        >
          <div
            className="mono"
            style={{
              fontSize: "0.62rem",
              color: "#C8A843",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Як це працює
          </div>
          <h2
            className="display"
            style={{ fontSize: "2.2rem", margin: 0, lineHeight: 1.1 }}
          >
            Від HTML до структури
          </h2>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 24 }}
              animate={stepsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.12, duration: 0.45 }}
              whileHover={{ y: -4, borderColor: "rgba(200,168,67,0.4)" }}
              style={{
                background: "#0D1C3A",
                border: "1px solid #1C3260",
                borderRadius: 8,
                padding: "28px 24px",
                position: "relative",
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              <div
                className="mono"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 20,
                  fontSize: "2.5rem",
                  color: "rgba(28,50,96,0.8)",
                  lineHeight: 1,
                }}
              >
                {step.num}
              </div>
              <div
                className="mono"
                style={{
                  fontSize: "1.8rem",
                  color: "#C8A843",
                  marginBottom: 16,
                  lineHeight: 1,
                }}
              >
                {step.icon}
              </div>
              <h3
                className="display"
                style={{
                  fontSize: "1.3rem",
                  margin: "0 0 10px",
                  lineHeight: 1.2,
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontSize: "0.85rem",
                  color: "#7A98C0",
                  margin: 0,
                  lineHeight: 1.65,
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        ref={roadmapRef}
        style={{ borderTop: "1px solid #1C3260", background: "#0D1C3A" }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "72px 48px" }}>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={roadInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4 }}
            style={{ marginBottom: 40 }}
          >
            <div
              className="mono"
              style={{
                fontSize: "0.62rem",
                color: "#C8A843",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              Дорожня карта
            </div>
            <h2 className="display" style={{ fontSize: "2.2rem", margin: 0 }}>
              Що зроблено і що далі
            </h2>
          </motion.div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {roadmap.map((item, index) => (
              <motion.div
                key={item.text}
                initial={{ opacity: 0, x: -16 }}
                animate={roadInView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: index * 0.08, duration: 0.35 }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  padding: "12px 16px",
                  borderRadius: 6,
                  background: item.done
                    ? "rgba(200,168,67,0.04)"
                    : "transparent",
                  border: item.done
                    ? "1px solid rgba(200,168,67,0.12)"
                    : "1px solid transparent",
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "0.85rem",
                    flexShrink: 0,
                    color: item.done ? "#C8A843" : "#1C3260",
                    marginTop: 1,
                  }}
                >
                  {item.done ? "✓" : "○"}
                </span>
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: item.done ? "#D6E0F0" : "#7A98C0",
                    lineHeight: 1.5,
                  }}
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
            style={{
              marginTop: 48,
              paddingTop: 32,
              borderTop: "1px solid #1C3260",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <div>
              <p
                className="display"
                style={{
                  fontSize: "1.3rem",
                  color: "#FFFFFF",
                  margin: "0 0 4px",
                  fontStyle: "italic",
                }}
              >
                {loading
                  ? "Завантаження…"
                  : `${laws.length} закон${laws.length === 1 ? "" : "ів"} у базі`}
              </p>
              <p
                className="mono"
                style={{ fontSize: "0.65rem", color: "#7A98C0", margin: 0 }}
              >
                {loading ? "…" : laws.map((law) => law.code).join(" · ")}
              </p>
            </div>
            <Link
              href={ROUTES.laws}
              style={{
                fontWeight: 600,
                fontSize: "0.85rem",
                color: "#C8A843",
                background: "transparent",
                border: "1px solid #C8A843",
                borderRadius: 6,
                padding: "10px 22px",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Відкрити закони →
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
