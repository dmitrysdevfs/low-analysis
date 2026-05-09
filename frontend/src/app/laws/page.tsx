"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { LawCard } from "@/components/LawCard";
import { SkeletonCard } from "@/components/SkeletonCard";
import { useLaws } from "@/hooks/useLaws";

export default function LawsPage() {
  const [query, setQuery] = useState("");
  const { laws, loading, error } = useLaws(query);

  return (
    <Layout>
      <div style={{ position: "relative", overflow: "hidden", flex: 1 }}>
        <div
          style={{
            position: "absolute",
            top: -160,
            left: -160,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(200,168,67,0.06) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            right: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(26,62,138,0.25) 0%, transparent 65%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: "56px 24px 100px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
            style={{ marginBottom: 36 }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(200,168,67,0.08)",
                border: "1px solid rgba(200,168,67,0.2)",
                borderRadius: 4,
                padding: "4px 12px",
                marginBottom: 20,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#C8A843",
                  display: "inline-block",
                }}
              />
              <span
                className="mono"
                style={{
                  fontSize: "0.65rem",
                  color: "#C8A843",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Реєстр законів
              </span>
            </div>

            <h1
              className="display"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                margin: "0 0 14px",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
              }}
            >
              Закони
              <br />
              <span style={{ color: "#C8A843" }}>України</span>
            </h1>

            <p
              style={{
                fontSize: "0.95rem",
                color: "#7A98C0",
                margin: 0,
                maxWidth: 460,
                lineHeight: 1.65,
              }}
            >
              Структуровані тексти законів України — від лінійного полотна до
              ієрархічної бази атомарних елементів.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            style={{ position: "relative", marginBottom: 32 }}
          >
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
                color: "#4A80D4",
                pointerEvents: "none",
              }}
            >
              ⌕
            </span>
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Пошук за назвою закону…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                background: "#0D1C3A",
                border: "1px solid #1C3260",
                borderRadius: 6,
                padding: "13px 16px 13px 38px",
                fontSize: "0.92rem",
                color: "#D6E0F0",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(event) => {
                event.currentTarget.style.borderColor = "#4A80D4";
              }}
              onBlur={(event) => {
                event.currentTarget.style.borderColor = "#1C3260";
              }}
            />
            {query ? (
              <button
                onClick={() => setQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#7A98C0",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.8rem",
                  padding: 4,
                }}
              >
                ✕
              </button>
            ) : null}
          </motion.div>

          <AnimatePresence mode="wait">
            {!loading && !error ? (
              <motion.div
                key={`count-${laws.length}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mono"
                style={{
                  fontSize: "0.68rem",
                  color: "#7A98C0",
                  marginBottom: 16,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {query
                  ? `${laws.length} результат${laws.length === 1 ? "" : "ів"} для «${query}»`
                  : `${laws.length} документ${laws.length === 1 ? "" : "ів"} у базі`}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : null}

          {error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "rgba(239,68,68,0.07)",
                border: "1px solid rgba(239,68,68,0.18)",
                borderRadius: 6,
                padding: "16px 20px",
                color: "#FCA5A5",
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
              }}
            >
              {error}
            </motion.div>
          ) : null}

          {!loading && !error && laws.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                textAlign: "center",
                padding: "60px 0",
                color: "#7A98C0",
                fontFamily: "var(--font-mono)",
                fontSize: "0.8rem",
              }}
            >
              <div
                style={{ fontSize: "2rem", marginBottom: 12, color: "#1C3260" }}
              >
                §
              </div>
              {query
                ? `Нічого не знайдено за запитом «${query}»`
                : "Нічого не знайдено"}
            </motion.div>
          ) : null}

          {!loading && !error && laws.length > 0 ? (
            <AnimatePresence>
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {laws.map((law, index) => (
                  <LawCard key={law._id} law={law} index={index} />
                ))}
              </div>
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </Layout>
  );
}
