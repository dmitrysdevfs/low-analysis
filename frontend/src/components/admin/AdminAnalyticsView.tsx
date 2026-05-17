"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { useLaws } from "@/hooks/useLaws";
import { useSubjects } from "@/hooks/useSubjects";
import { groupCounts, formatDateMedium } from "@/lib/utils";
import styles from "./AdminAnalyticsView.module.scss";

export function AdminAnalyticsView() {
  const { laws, loading: lawsLoading, error: lawsError } = useLaws();
  const {
    subjects,
    loading: subjectsLoading,
    error: subjectsError,
  } = useSubjects();

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
      laws.map((law) => law.status ?? "Unknown"),
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
            швидкого операційного огляду правового покриття та розподілу
            суб'єктів.
          </p>
        </div>

        <div className={styles.heroAside}>
          <span className={styles.tag}>Тільки фронтенд</span>
          <div className={styles.heroValue}>
            {laws.length + subjects.length} відстежуваних об'єктів
          </div>
          <div className={styles.heroMeta}>
            Закони, суб'єкти, глибина статей та метадані обчислюються на
            фронтенді з наявних API-запитів.
          </div>
          <Link href={ROUTES.admin} className={styles.heroLink}>
            Повернутися до панелі адміна
          </Link>
        </div>
      </div>

      <div className={styles.metricsGrid}>
        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Закони</span>
          <strong className={styles.metricValue}>{laws.length}</strong>
          <p className={styles.metricNote}>
            Всього правових документів з `/api/laws`.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Суб'єкти</span>
          <strong className={styles.metricValue}>{subjects.length}</strong>
          <p className={styles.metricNote}>
            Визначених правових суб'єктів з `/api/subjects`.
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
            Глибина абзаців в метаданих законів.
          </p>
        </article>

        <article className={styles.metricCard}>
          <span className={styles.metricLabel}>Сер. статей</span>
          <strong className={styles.metricValue}>
            {metrics.averageArticles}
          </strong>
          <p className={styles.metricNote}>
            Середня кількість статей на закон.
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
                <div key={label} className={styles.distributionRow}>
                  <div className={styles.distributionTopRow}>
                    <span className={styles.distributionLabel}>{label}</span>
                    <span className={styles.tag}>{count}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <span
                      className={styles.progressFill}
                      style={{
                        width: `${laws.length > 0 ? (count / laws.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className={styles.distributionMeta}>
                    {laws.length > 0
                      ? Math.round((count / laws.length) * 100)
                      : 0}
                    % законів
                  </div>
                </div>
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
                <div key={label} className={styles.distributionRow}>
                  <div className={styles.distributionTopRow}>
                    <span className={styles.distributionLabel}>{label}</span>
                    <span className={styles.tag}>{count}</span>
                  </div>
                  <div className={styles.progressTrack}>
                    <span
                      className={styles.progressFill}
                      style={{
                        width: `${subjects.length > 0 ? (count / subjects.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <div className={styles.distributionMeta}>
                    {subjects.length > 0
                      ? Math.round((count / subjects.length) * 100)
                      : 0}
                    % суб'єктів
                  </div>
                </div>
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
                        Created {formatDateMedium(law.createdAt)} ·{" "}
                        {law.totalArticles} articles · {law.totalSections}{" "}
                        sections
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
              Законів у поточній відповіді немає.
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
            <div className={styles.distributionRow}>
              <div className={styles.distributionTopRow}>
                <span className={styles.distributionLabel}>
                  Покриття підписантів
                </span>
                <span className={styles.tag}>{metrics.signatoryCoverage}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${laws.length > 0 ? (metrics.signatoryCoverage / laws.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className={styles.distributionMeta}>
                Закони з явними метаданими підписанта в наборі даних.
              </div>
            </div>

            <div className={styles.distributionRow}>
              <div className={styles.distributionTopRow}>
                <span className={styles.distributionLabel}>
                  Покриття преамбул
                </span>
                <span className={styles.tag}>{metrics.preambleCoverage}</span>
              </div>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressFill}
                  style={{
                    width: `${laws.length > 0 ? (metrics.preambleCoverage / laws.length) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className={styles.distributionMeta}>
                Закони де текст преамбули доступний для аналізу.
              </div>
            </div>
          </div>
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
