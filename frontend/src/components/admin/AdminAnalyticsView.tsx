"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { formatDateMedium, groupCounts } from "@/lib/utils";
import { useAdminLaws } from "@/admin/data/_adapters/lawsAdapter";
import { useAdminSubjects } from "@/admin/data/_adapters/subjectsAdapter";
import { useAdminStats } from "@/admin/data/_adapters/statsAdapter";
import { SemanticProgressBar } from "@/admin/components/SemanticProgressBar/SemanticProgressBar";
import styles from "./AdminAnalyticsView.module.scss";

export function AdminAnalyticsView() {
  const { laws, loading: lawsLoading, error: lawsError } = useAdminLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useAdminSubjects();

  const { statsMap: lawStatsMap, loading: statsLoading } = useAdminStats(laws);

  const metrics = useMemo(() => {
    const totalSections = laws.reduce((sum, law) => sum + law.totalSections, 0);
    const totalArticles = laws.reduce((sum, law) => sum + law.totalArticles, 0);
    const totalParagraphs = laws.reduce(
      (sum, law) => sum + (law.totalParagraphs ?? 0),
      0,
    );
    const averageArticles =
      laws.length > 0 ? (totalArticles / laws.length).toFixed(1) : "0";
    const statusDistribution = groupCounts(
      laws.map((law) => law.status ?? "Невідомо"),
    );
    const subjectStatusDistribution = groupCounts(
      subjects.map((subject) => subject.legal_status),
    );
    const signatoryCoverage = laws.filter((law) =>
      Boolean(law.signatory),
    ).length;
    const preambleCoverage = laws.filter((law) => Boolean(law.preamble)).length;
    const recentLaws = [...laws]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 5);

    return {
      totalSections,
      totalArticles,
      totalParagraphs,
      averageArticles,
      statusDistribution,
      subjectStatusDistribution,
      signatoryCoverage,
      preambleCoverage,
      recentLaws,
    };
  }, [laws, subjects]);

  return (
    <section className={styles.page}>
      <div className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>Аналітика адміна</span>
          <h1 className={styles.title}>
            Операційні метрики з поточних запитів
          </h1>
          <p className={styles.description}>
            Цей огляд агрегує відповіді `/api/laws` та `/api/subjects` для
            швидкого операційного зрізу правового покриття, глибини структури та
            розподілу суб'єктів.
          </p>
        </div>

        <div className={styles.heroAside}>
          <span className={styles.tag}>Лише клієнтський рівень</span>
          <div className={styles.heroValue}>
            {laws.length + subjects.length} відстежуваних об'єктів
          </div>
          <div className={styles.heroMeta}>
            Закони, суб'єкти, глибина статей і метадані обчислюються у
            клієнтському застосунку з наявних API-запитів.
          </div>
          <Link href={ROUTES.admin} className={styles.heroLink}>
            Повернутися до адмін-панелі
          </Link>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Закони</span>
          <strong className={styles.metricValue}>{laws.length}</strong>
          <p className={styles.metricNote}>
            Усього правових документів з поточного запиту законів.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Суб'єкти</span>
          <strong className={styles.metricValue}>{subjects.length}</strong>
          <p className={styles.metricNote}>
            Визначених правових суб'єктів з поточного запиту суб'єктів.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Розділи</span>
          <strong className={styles.metricValue}>
            {metrics.totalSections}
          </strong>
          <p className={styles.metricNote}>
            Структуровані розділи по всіх законах.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Статті</span>
          <strong className={styles.metricValue}>
            {metrics.totalArticles}
          </strong>
          <p className={styles.metricNote}>
            Загальна кількість статей у наборі даних.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Абзаци</span>
          <strong className={styles.metricValue}>
            {metrics.totalParagraphs}
          </strong>
          <p className={styles.metricNote}>
            Глибина абзаців у метаданих законів.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Сер. статей</span>
          <strong className={styles.metricValue}>
            {metrics.averageArticles}
          </strong>
          <p className={styles.metricNote}>
            Середня кількість статей на один закон.
          </p>
        </article>
      </div>

      <div className={styles.contentGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Статус законів</span>
              <h2 className={styles.panelTitle}>Розподіл за статусом</h2>
            </div>
          </div>

          {lawsLoading ? (
            <div className={styles.emptyState}>
              Завантаження розподілу статусів…
            </div>
          ) : lawsError ? (
            <div className={styles.emptyState}>{lawsError}</div>
          ) : (
            <div className={styles.distributionList}>
              {metrics.statusDistribution.map(([label, count]) => (
                <SemanticProgressBar
                  key={label}
                  value={count}
                  max={laws.length}
                  label={label}
                  meta={`${laws.length > 0 ? Math.round((count / laws.length) * 100) : 0}% законів`}
                />
              ))}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Статус суб'єктів</span>
              <h2 className={styles.panelTitle}>Правові категорії суб'єктів</h2>
            </div>
          </div>

          {subjectsLoading ? (
            <div className={styles.emptyState}>
              Завантаження розподілу суб'єктів…
            </div>
          ) : subjectsError ? (
            <div className={styles.emptyState}>{subjectsError}</div>
          ) : (
            <div className={styles.distributionList}>
              {metrics.subjectStatusDistribution.map(([label, count]) => (
                <SemanticProgressBar
                  key={label}
                  value={count}
                  max={subjects.length}
                  label={label}
                  meta={`${subjects.length > 0 ? Math.round((count / subjects.length) * 100) : 0}% суб'єктів`}
                />
              ))}
            </div>
          )}
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Нові закони</span>
              <h2 className={styles.panelTitle}>
                Найновіші документи в наборі даних
              </h2>
            </div>
          </div>

          {metrics.recentLaws.length > 0 ? (
            <div className={styles.list}>
              {metrics.recentLaws.map((law) => (
                <div key={law._id} className={styles.listRow}>
                  <div className={styles.listTopRow}>
                    <div>
                      <span className={styles.listCode}>{law.code}</span>
                      <div className={styles.listTitle}>{law.title}</div>
                      <div className={styles.listMeta}>
                        Створено {formatDateMedium(law.createdAt)},{" "}
                        {law.totalArticles} статей, {law.totalSections} розділів
                      </div>
                    </div>
                    <Link
                      href={ROUTES.law(law._id)}
                      className={styles.heroLink}
                    >
                      Відкрити
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              У поточній відповіді немає жодного закону.
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Якість метаданих</span>
              <h2 className={styles.panelTitle}>
                Покриття необов'язкових полів
              </h2>
            </div>
          </div>

          <div className={styles.distributionList}>
            <SemanticProgressBar
              value={metrics.signatoryCoverage}
              max={laws.length}
              label="Покриття підписантів"
              meta="Закони з явними метаданими підписанта."
            />
            <SemanticProgressBar
              value={metrics.preambleCoverage}
              max={laws.length}
              label="Покриття преамбул"
              meta="Закони де текст преамбули доступний."
            />
          </div>
        </article>

        <article className={`${styles.panel} ${styles.panelWide}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Статистичний аналіз</span>
              <h2 className={styles.panelTitle}>Складність норм по законах</h2>
            </div>
          </div>

          {statsLoading || lawStatsMap.size === 0 ? (
            <div className={styles.emptyState}>Завантаження статистики…</div>
          ) : (
            <div className={styles.statsTable}>
              <div className={`${styles.statsRow} ${styles.statsRowHead}`}>
                <span>Закон</span>
                <span>Елементів</span>
                <span>Розподіл</span>
                <span className={styles.statsColRed}>Об'ємних</span>
                <span>Сер. симв.</span>
              </div>
              {[...laws]
                .filter((l) => lawStatsMap.has(l._id))
                .sort((a, b) => {
                  const sa = lawStatsMap.get(a._id)!;
                  const sb = lawStatsMap.get(b._id)!;
                  const pctA =
                    sa.totalElements > 0
                      ? sa.riskLevels.red / sa.totalElements
                      : 0;
                  const pctB =
                    sb.totalElements > 0
                      ? sb.riskLevels.red / sb.totalElements
                      : 0;
                  return pctB - pctA;
                })
                .map((law) => {
                  const s = lawStatsMap.get(law._id)!;
                  const counted =
                    s.riskLevels.green + s.riskLevels.yellow + s.riskLevels.red;
                  const gPct =
                    counted > 0
                      ? Math.round((s.riskLevels.green / counted) * 100)
                      : 0;
                  const yPct =
                    counted > 0
                      ? Math.round((s.riskLevels.yellow / counted) * 100)
                      : 0;
                  const rPct =
                    counted > 0
                      ? Math.round((s.riskLevels.red / counted) * 100)
                      : 0;
                  return (
                    <div key={law._id} className={styles.statsRow}>
                      <Link
                        href={ROUTES.law(law._id)}
                        className={styles.statsLawTitle}
                      >
                        {law.title}
                      </Link>
                      <span className={`mono ${styles.statsNum}`}>
                        {s.totalElements}
                      </span>
                      <div className={styles.statsMiniBar}>
                        {gPct > 0 && (
                          <span
                            className={styles.statsSegGreen}
                            style={{ width: `${gPct}%` }}
                          />
                        )}
                        {yPct > 0 && (
                          <span
                            className={styles.statsSegYellow}
                            style={{ width: `${yPct}%` }}
                          />
                        )}
                        {rPct > 0 && (
                          <span
                            className={styles.statsSegRed}
                            style={{ width: `${rPct}%` }}
                          />
                        )}
                      </div>
                      <span
                        className={`mono ${rPct > 5 ? styles.statsNumRed : styles.statsNum}`}
                      >
                        {s.riskLevels.red} ({rPct}%)
                      </span>
                      <span className={`mono ${styles.statsNum}`}>
                        {Math.round(s.meanChars)}
                      </span>
                    </div>
                  );
                })}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>Стан запитів</span>
              <h2 className={styles.panelTitle}>Стан отримання даних</h2>
            </div>
          </div>

          <div className={styles.list}>
            <div className={styles.listRow}>
              <div className={styles.listTitle}>Запит законів</div>
              <div className={styles.listMeta}>
                {lawsLoading
                  ? "Завантаження…"
                  : lawsError
                    ? lawsError
                    : "Готово"}
              </div>
            </div>
            <div className={styles.listRow}>
              <div className={styles.listTitle}>Запит суб'єктів</div>
              <div className={styles.listMeta}>
                {subjectsLoading
                  ? "Завантаження…"
                  : subjectsError
                    ? subjectsError
                    : "Готово"}
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
