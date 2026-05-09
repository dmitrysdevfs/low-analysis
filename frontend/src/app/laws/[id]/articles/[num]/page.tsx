"use client";

import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Layout } from "@/components/Layout";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useArticle } from "@/hooks/useArticle";

export default function ArticlePage() {
  const params = useParams<{ id: string; num: string }>();
  const lawId = params?.id;
  const articleNumber = params?.num;
  const { laws } = useLaws();
  const { article, children, loading, error } = useArticle(
    lawId,
    articleNumber,
  );
  const law = laws.find((item) => item._id === lawId);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          borderBottom: "1px solid #1C3260",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexShrink: 0,
          background: "rgba(13,28,58,0.9)",
          backdropFilter: "blur(6px)",
        }}
      >
        <Breadcrumb
          items={[
            { label: "Закони", href: ROUTES.laws },
            lawId
              ? { label: law?.title ?? lawId ?? "…", href: ROUTES.law(lawId) }
              : { label: law?.title ?? "…" },
            { label: `Стаття ${articleNumber ?? ""}` },
          ]}
        />
      </motion.div>

      <main
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          justifyContent: "center",
          padding: "48px 24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: 720 }}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{ display: "flex", flexDirection: "column", gap: 14 }}
              >
                {[85, 55, 70].map((width, index) => (
                  <motion.div
                    key={index}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: index * 0.15,
                    }}
                    style={{
                      height: index === 0 ? 28 : 14,
                      width: `${width}%`,
                      background: "#1C3260",
                      borderRadius: 4,
                    }}
                  />
                ))}
              </motion.div>
            ) : null}

            {!loading && error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                  paddingTop: 80,
                }}
              >
                <span style={{ fontSize: "2rem", color: "#1C3260" }}>!</span>
                <span
                  className="mono"
                  style={{ fontSize: "0.8rem", color: "#FCA5A5" }}
                >
                  {error}
                </span>
              </motion.div>
            ) : null}

            {!loading && !error && !article ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 100,
                  gap: 10,
                }}
              >
                <span style={{ fontSize: "2.5rem", color: "#1C3260" }}>§</span>
                <span
                  className="mono"
                  style={{ fontSize: "0.75rem", color: "#7A98C0" }}
                >
                  Статтю не знайдено
                </span>
              </motion.div>
            ) : null}

            {!loading && !error && article ? (
              <motion.div
                key={article.code}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: "0.68rem",
                    color: "#C8A843",
                    background: "rgba(200,168,67,0.08)",
                    border: "1px solid rgba(200,168,67,0.2)",
                    borderRadius: 4,
                    padding: "3px 10px",
                    display: "inline-block",
                    marginBottom: 18,
                    letterSpacing: "0.04em",
                  }}
                >
                  {article.code}
                </span>

                <h1
                  className="display"
                  style={{
                    fontSize: "2rem",
                    color: "#FFFFFF",
                    margin: "0 0 24px",
                    lineHeight: 1.2,
                  }}
                >
                  {article.title ?? `Стаття ${article.number ?? articleNumber}`}
                </h1>

                {article.text ? (
                  <p
                    style={{
                      fontSize: "1rem",
                      color: "#A8BEDD",
                      lineHeight: 1.8,
                      margin: "0 0 40px",
                      maxWidth: 680,
                      borderLeft: "3px solid rgba(200,168,67,0.3)",
                      paddingLeft: 20,
                    }}
                  >
                    {article.text}
                  </p>
                ) : null}

                {children.length > 0 ? (
                  <motion.section
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                  >
                    <h2
                      className="display"
                      style={{
                        fontSize: "1.1rem",
                        color: "#FFFFFF",
                        margin: "0 0 16px",
                        paddingBottom: 10,
                        borderBottom: "1px solid #1C3260",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Частини та абзаци
                    </h2>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      {children.map((child, index) => (
                        <motion.div
                          key={child.code}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.06, duration: 0.3 }}
                          style={{
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                            padding: "12px 0",
                            borderBottom: "1px solid rgba(28,50,96,0.5)",
                          }}
                        >
                          <span
                            className="mono"
                            style={{
                              fontSize: "0.65rem",
                              color: "#4A80D4",
                              background: "rgba(74,128,212,0.1)",
                              border: "1px solid rgba(74,128,212,0.2)",
                              borderRadius: 3,
                              padding: "2px 6px",
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          >
                            {child.code}
                          </span>
                          <span
                            style={{
                              fontSize: "0.9rem",
                              color: "#A8BEDD",
                              lineHeight: 1.65,
                            }}
                          >
                            {child.text ?? child.title}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.section>
                ) : (
                  <div style={{ color: "#7A98C0" }}>
                    У цієї статті немає вкладених елементів.
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </Layout>
  );
}
