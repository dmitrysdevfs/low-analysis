"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MetricCard } from "@/admin/components/MetricCard/MetricCard";
import { ROUTES } from "@/constants/routes";
import { useGlobalAnalysis } from "../hooks/useGlobalAnalysis";
import { AnalysisLawPicker } from "../components/AnalysisLawPicker";
import {
  GlobalTimelineChart,
  GlobalTopLawsChart,
  SubjectDistributionChart,
} from "../components/AnalysisCharts";
import styles from "../Analysis.module.scss";

export function GlobalAnalysisView() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { dataset, laws, loading, error } = useGlobalAnalysis();

  const recentLaws = useMemo(
    () =>
      [...laws]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
    [laws],
  );

  const timelineLawTrend = dataset.timeline.map((point) => point.cumulativeLaws);
  const timelineArticleTrend = dataset.timeline.map(
    (point) => point.cumulativeArticles,
  );

  const handleSelectLaw = (lawId: string) => {
    router.push(ROUTES.analysisLaw(lawId));
  };

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
            <span className={styles.heroEyebrow}>Аналізатор законодавства</span>
            <h1 className={`display ${styles.heroTitle}`}>
              Бачимо всю
              <br />
              <span className={styles.heroAccent}>нормативну систему.</span>
            </h1>
            <p className={styles.heroDescription}>
              Цей режим збирає аналітичний зріз по всьому корпусу законів:
              структуру, інтенсивність, суб&apos;єктів регулювання, розподіл
              ризику та швидкий перехід до детального аналізу кожного закону.
            </p>

            <div className={styles.heroActions}>
              <Link href={ROUTES.laws} className={`${styles.heroLink} ${styles.heroPrimary}`}>
                Каталог законів
              </Link>
              <Link href={ROUTES.search} className={styles.heroLink}>
                Розширений пошук
              </Link>
            </div>
          </div>

          <aside className={styles.heroAside}>
            <span className={styles.metaTag}>Охоплення бази</span>
            <div className={styles.heroValue}>
              {dataset.totalSections + dataset.totalArticles + dataset.totalSubjects} структурних
              та регуляторних одиниць
            </div>
            <p className={styles.heroMeta}>
              {laws.length} законів · {dataset.totalArticles} статей ·{" "}
              {dataset.totalParagraphs} абзаців · {dataset.totalSubjects} суб&apos;єктів.
            </p>

            <div className={styles.stepList}>
              {[
                "Оцінює масштаб і щільність корпусу.",
                "Показує закони з найбільшим навантаженням.",
                "Дозволяє перейти до глибокого аналізу одного акта.",
              ].map((item) => (
                <div key={item} className={styles.summaryTile}>
                  <span className={styles.mutedMono}>Що бачить аналізатор</span>
                  <span className={styles.insightText}>{item}</span>
                </div>
              ))}
            </div>
          </aside>
        </motion.section>

        <AnalysisLawPicker
          laws={laws}
          query={query}
          onQueryChange={setQuery}
          onSelect={(law) => handleSelectLaw(law._id)}
          label="Обрати закон для deep-dive"
          hint="Після вибору система переключається в детальний режим із heatmap, factor та аномаліями."
        />

        <section className={styles.kpiGrid}>
          <MetricCard
            label="Закони"
            value={laws.length}
            note="Повний корпус доступних актів."
            trend={timelineLawTrend}
            color="#4a80d4"
            loading={loading}
          />
          <MetricCard
            label="Статті"
            value={dataset.totalArticles}
            note="Загальна кількість статей у базі."
            trend={timelineArticleTrend}
            color="#c8a843"
            loading={loading}
          />
          <MetricCard
            label="Розділи"
            value={dataset.totalSections}
            note="Секційна карта корпусу."
            loading={loading}
            color="#6aa1ff"
          />
          <MetricCard
            label="Абзаци"
            value={dataset.totalParagraphs}
            note="Глибина деталізації по нормах."
            loading={loading}
            color="#4aad7a"
          />
          <MetricCard
            label="Суб'єкти"
            value={dataset.totalSubjects}
            note="Визначені регуляторні суб'єкти."
            loading={loading}
            color="#9b5cd4"
          />
          <MetricCard
            label="Сер. статей / закон"
            value={dataset.meanArticlesPerLaw}
            note="Середня структурна насиченість."
            loading={loading}
            color="#e9774b"
          />
        </section>

        {error ? <div className={styles.emptyState}>{error}</div> : null}

        <section className={styles.overviewGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Зростання корпусу</span>
                <h2 className={styles.panelTitle}>Динаміка заповнення бази</h2>
                <p className={styles.panelDescription}>
                  Кумулятивне нарощення законів і статей у доступному корпусі.
                </p>
              </div>
            </div>

            <GlobalTimelineChart points={dataset.timeline} />
          </article>

          <div className={styles.overviewAside}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Ландшафт суб'єктів</span>
                  <h2 className={styles.panelTitle}>Розподіл за статусами</h2>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <SubjectDistributionChart
                  segments={dataset.subjectDistribution}
                />
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <span className={styles.panelEyebrow}>Покриття</span>
                  <h2 className={styles.panelTitle}>Якість метаданих</h2>
                </div>
              </div>

              <div className={styles.lawSummaryGrid}>
                <div className={styles.summaryTile}>
                  <span className={styles.mutedMono}>Підписанти</span>
                  <span className={styles.summaryValue}>
                    {dataset.coverage.signatory}/{laws.length}
                  </span>
                  <span className={styles.insightText}>
                    Законів мають заповнений блок підписанта.
                  </span>
                </div>
                <div className={styles.summaryTile}>
                  <span className={styles.mutedMono}>Преамбули</span>
                  <span className={styles.summaryValue}>
                    {dataset.coverage.preamble}/{laws.length}
                  </span>
                  <span className={styles.insightText}>
                    Законів мають зафіксовану преамбулу.
                  </span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.overviewLowerGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Топ законів</span>
                <h2 className={styles.panelTitle}>Найбільш структурно насичені акти</h2>
              </div>
            </div>
            <GlobalTopLawsChart rows={dataset.topLaws} />
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Радар законів</span>
                <h2 className={styles.panelTitle}>Найпомітніші за щільністю</h2>
              </div>
            </div>

            <div className={styles.spotlightList}>
              {dataset.spotlightLaws.map((item) => (
                <button
                  key={item.law._id}
                  type="button"
                  className={styles.stepButton}
                  onClick={() => handleSelectLaw(item.law._id)}
                >
                  <div className={styles.spotlightTitle}>{item.law.title}</div>
                  <div className={styles.spotlightMeta}>
                    {item.law.code} · {item.meanPerArticle} абз./статтю · слід{" "}
                    {item.footprint}
                  </div>
                  <div className={styles.spotlightValue}>{item.densityScore}</div>
                </button>
              ))}
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.panelEyebrow}>Останні закони</span>
                <h2 className={styles.panelTitle}>Свіжі акти у корпусі</h2>
              </div>
            </div>

            <div className={styles.insightList}>
              {recentLaws.map((law) => (
                <Link
                  key={law._id}
                  href={ROUTES.analysisLaw(law._id)}
                  className={styles.lawPickerRow}
                >
                  <span className={styles.lawPickerBody}>
                    <span className={styles.lawPickerTitle}>{law.title}</span>
                    <span className={styles.lawPickerMeta}>
                      {law.code} · {law.totalArticles} статей · {law.totalParagraphs ?? 0} абзаців
                    </span>
                  </span>
                  <span className={styles.lawPickerArrow}>→</span>
                </Link>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}
