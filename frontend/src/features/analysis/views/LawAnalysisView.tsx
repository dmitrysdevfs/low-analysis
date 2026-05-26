"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/admin/components/MetricCard/MetricCard";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useLawAnalysis } from "../hooks/useLawAnalysis";
import { AnalysisLawPicker } from "../components/AnalysisLawPicker";
import { AnalysisHeatmap } from "../components/AnalysisHeatmap";
import { AnalysisRegistry } from "../components/AnalysisRegistry";
import { AnalysisFilterPanel } from "../components/AnalysisFilterPanel";
import {
  HistogramChart,
  RiskMixChart,
  ScatterFactorChart,
} from "../components/AnalysisCharts";
import styles from "../Analysis.module.scss";
import type { FactorBand } from "../types";
import type { RiskLevel } from "@/lib/tree";

export function LawAnalysisView({ lawId }: { lawId: string }) {
  const router = useRouter();
  const [lawQuery, setLawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [risk, setRisk] = useState<"all" | RiskLevel>("all");
  const [factorBand, setFactorBand] = useState<"all" | FactorBand>("all");
  const [article, setArticle] = useState<"all" | string>("all");
  const [subjectsThreshold, setSubjectsThreshold] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { laws } = useLaws();
  const { dataset, loading, error } = useLawAnalysis(lawId, {
    query,
    risk,
    factorBand,
    article,
    subjectsThreshold,
  });

  useEffect(() => {
    if (!selectedId) return;
    const target = document.getElementById(`analysis-record-${selectedId}`);
    if (target && typeof target.scrollIntoView === "function") {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  useEffect(() => {
    setSelectedId(null);
  }, [lawId, query, risk, factorBand, article, subjectsThreshold]);

  const currentLaw = dataset?.law;
  const filterSummary = useMemo(() => {
    if (!dataset) return "Завантажуємо аналітичний профіль закону…";

    const pieces = [
      `${dataset.filteredRecords.length} з ${dataset.records.length} елементів`,
      `${dataset.uniqueSubjects} унікальних суб'єктів`,
      `${dataset.totalSubjectMentions} згадок`,
    ];

    return pieces.join(" · ");
  }, [dataset]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.blobGold} />
      <div className={styles.blobBlue} />

      <div className={styles.inner}>
        <motion.section
          className={styles.hero}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.34 }}
        >
          <div className={styles.heroCopy}>
            <span className={styles.heroEyebrow}>Аналіз закону</span>
            <h1 className={`display ${styles.heroTitle}`}>
              {currentLaw?.title ?? "Підбираємо аналітичний профіль…"}
            </h1>
            <p className={styles.heroDescription}>
              Цей режим показує щільність норми, концентрацію суб&apos;єктів,
              відхилення від середнього значення, фактор і карту потенційно
              навантажених елементів.
            </p>

            <div className={styles.heroLinks}>
              <Link href={ROUTES.analysis} className={styles.heroLink}>
                Вся база
              </Link>
              {currentLaw ? (
                <Link
                  href={ROUTES.law(currentLaw._id)}
                  className={styles.heroLink}
                >
                  До структури закону
                </Link>
              ) : null}
            </div>
          </div>

          <aside className={styles.heroAside}>
            <span className={styles.metaTag}>Теплова карта</span>
            <div className={styles.heroValue}>
              {dataset
                ? `${dataset.highRiskCount} елементів в зоні уваги`
                : "..."}
            </div>
            <p className={styles.heroMeta}>{filterSummary}</p>
            {currentLaw ? (
              <div className={styles.lawSummaryGrid}>
                <div className={styles.summaryTile}>
                  <span className={styles.mutedMono}>Код</span>
                  <span className={styles.summaryValue}>{currentLaw.code}</span>
                </div>
                <div className={styles.summaryTile}>
                  <span className={styles.mutedMono}>Сер. factor</span>
                  <span className={styles.summaryValue}>
                    {dataset?.averageFactor ?? 0}
                  </span>
                </div>
              </div>
            ) : null}
          </aside>
        </motion.section>

        {currentLaw ? (
          <section className={styles.kpiGrid}>
            <MetricCard
              label="Елементи"
              value={dataset?.stats.totalElements ?? 0}
              note="Усі нормотворчі вузли в межах закону."
              loading={loading}
              color="#4a80d4"
            />
            <MetricCard
              label="Сер. довжина"
              value={Math.round(dataset?.stats.meanChars ?? 0)}
              note="Середня кількість символів на елемент."
              loading={loading}
              color="#c8a843"
            />
            <MetricCard
              label="σ відхилення"
              value={Math.round(dataset?.stats.standardDeviation ?? 0)}
              note="Розкид за довжиною тексту."
              loading={loading}
              color="#93b7ff"
            />
            <MetricCard
              label="Суб'єкти"
              value={dataset?.uniqueSubjects ?? 0}
              note="Унікальні суб'єкти в межах закону."
              loading={loading}
              color="#9b5cd4"
            />
            <MetricCard
              label="Згадки"
              value={dataset?.totalSubjectMentions ?? 0}
              note="Загальна кількість входжень суб'єктів."
              loading={loading}
              color="#4aad7a"
            />
            <MetricCard
              label="Високий ризик"
              value={dataset?.highRiskCount ?? 0}
              note="Елементи з найвищим аналітичним навантаженням."
              loading={loading}
              color="#e9774b"
            />
          </section>
        ) : null}

        {error ? <div className={styles.emptyState}>{error}</div> : null}

        <section className={styles.shell}>
          <aside className={styles.shellSidebar}>
            <AnalysisLawPicker
              laws={laws}
              query={lawQuery}
              onQueryChange={setLawQuery}
              onSelect={(law) => router.push(ROUTES.analysisLaw(law._id))}
              label="Змінити закон"
              hint="Можна швидко переключитися на інший закон без виходу з аналізатора."
            />

            <AnalysisFilterPanel
              query={query}
              onQueryChange={setQuery}
              risk={risk}
              onRiskChange={setRisk}
              factorBand={factorBand}
              onFactorBandChange={setFactorBand}
              article={article}
              articleOptions={dataset?.articleOptions ?? []}
              onArticleChange={setArticle}
              subjectsThreshold={subjectsThreshold}
              onSubjectsThresholdChange={setSubjectsThreshold}
            />
          </aside>

          <main className={styles.shellMain}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Heatmap</span>
                  <h2 className={styles.panelTitle}>
                    Теплова карта по статтях
                  </h2>
                  <p className={styles.panelDescription}>
                    Кожен осередок відображає окремий елемент. Клік по осередку
                    підсвічує відповідний запис у реєстрі нижче.
                  </p>
                </div>
              </div>

              {dataset ? (
                <AnalysisHeatmap
                  lawId={lawId}
                  rows={dataset.heatmap}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              ) : (
                <div className={styles.emptyState}>Будуємо теплову карту…</div>
              )}
            </article>

            <div className={styles.overviewGrid}>
              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.panelEyebrow}>Розподіл ризику</span>
                    <h2 className={styles.panelTitle}>Світлофор норми</h2>
                  </div>
                </div>
                {dataset ? (
                  <RiskMixChart
                    green={dataset.stats.riskLevels.green}
                    yellow={dataset.stats.riskLevels.yellow}
                    red={dataset.stats.riskLevels.red}
                  />
                ) : (
                  <div className={styles.emptyState}>
                    Рахуємо ризиковий профіль…
                  </div>
                )}
              </article>

              <article className={styles.panel}>
                <div className={styles.panelHeader}>
                  <div>
                    <span className={styles.panelEyebrow}>Розкид довжин</span>
                    <h2 className={styles.panelTitle}>Гістограма символів</h2>
                  </div>
                </div>
                {dataset ? (
                  <HistogramChart data={dataset.histogram} />
                ) : (
                  <div className={styles.emptyState}>Будуємо гістограму…</div>
                )}
              </article>
            </div>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>
                    Фактор vs суб'єкти
                  </span>
                  <h2 className={styles.panelTitle}>Діаграма навантаження</h2>
                  <p className={styles.panelDescription}>
                    Допомагає швидко побачити довгі та перенасичені
                    суб&apos;єктами елементи.
                  </p>
                </div>
              </div>
              {dataset ? (
                <ScatterFactorChart data={dataset.scatter} />
              ) : (
                <div className={styles.emptyState}>
                  Готуємо точки для розсіювання…
                </div>
              )}
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Реєстр елементів</span>
                  <h2 className={styles.panelTitle}>Аналітична таблиця норм</h2>
                  <p className={styles.panelDescription}>
                    Повний список елементів із фактором, ризиком, кількістю
                    символів, суб&apos;єктами та копіюванням прямих посилань.
                  </p>
                </div>
              </div>

              {dataset ? (
                <AnalysisRegistry
                  lawId={lawId}
                  lawTitle={dataset.law.title}
                  records={dataset.filteredRecords}
                  selectedId={selectedId}
                />
              ) : (
                <div className={styles.emptyState}>
                  Збираємо реєстр елементів…
                </div>
              )}
            </article>
          </main>

          <aside className={styles.shellAside}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Суб'єкти</span>
                  <h2 className={styles.panelTitle}>Лідери за згадками</h2>
                </div>
              </div>

              <div className={styles.subjectLeaderboard}>
                {dataset?.topSubjects.map((subject) => (
                  <div key={subject.id} className={styles.subjectRow}>
                    <span className={styles.subjectName}>{subject.name}</span>
                    <span className={styles.subjectMeta}>
                      {subject.roles.join(", ")}
                    </span>
                    <span className={styles.leaderValue}>
                      {subject.mentions} згадок
                    </span>
                  </div>
                )) ?? (
                  <div className={styles.emptyState}>
                    Немає даних про суб&apos;єкти.
                  </div>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Аномалії</span>
                  <h2 className={styles.panelTitle}>Найгарячіші елементи</h2>
                </div>
              </div>

              <div className={styles.anomalyList}>
                {dataset?.anomalies.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={styles.stepButton}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className={styles.anomalyTitle}>
                      {item.articleLabel} · {item.badge}
                    </span>
                    <span className={styles.anomalyMeta}>
                      factor {item.factor} · {item.charsCount} символів ·{" "}
                      {item.subjectsCount} суб&apos;єктів
                    </span>
                    <span className={styles.insightText}>{item.excerpt}</span>
                  </button>
                )) ?? (
                  <div className={styles.emptyState}>
                    Аномалії ще не зібрані.
                  </div>
                )}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Пояснення</span>
                  <h2 className={styles.panelTitle}>Що означають кольори</h2>
                </div>
              </div>

              <div className={styles.insightList}>
                <div className={styles.insightRow}>
                  <span className={styles.riskPill + " " + styles.riskGreen}>
                    Зелений
                  </span>
                  <span className={styles.insightText}>
                    Елемент перебуває близько до середнього профілю закону.
                  </span>
                </div>
                <div className={styles.insightRow}>
                  <span className={styles.riskPill + " " + styles.riskYellow}>
                    Жовтий
                  </span>
                  <span className={styles.insightText}>
                    Є помітне відхилення за довжиною або концентрацією
                    суб&apos;єктів.
                  </span>
                </div>
                <div className={styles.insightRow}>
                  <span className={styles.riskPill + " " + styles.riskRed}>
                    Червоний
                  </span>
                  <span className={styles.insightText}>
                    Елемент виглядає як аномалія й потребує швидкого перегляду.
                  </span>
                </div>
              </div>
            </article>
          </aside>
        </section>
      </div>
    </div>
  );
}
