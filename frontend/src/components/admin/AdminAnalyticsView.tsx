"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ROUTES } from "@/constants/routes";
import { formatDateMedium, groupCounts } from "@/lib/utils";
import { useAdminLaws } from "@/admin/data/_adapters/lawsAdapter";
import { useAdminSubjects } from "@/admin/data/_adapters/subjectsAdapter";
import { useAdminStats } from "@/admin/data/_adapters/statsAdapter";
import { SemanticProgressBar } from "@/admin/components/SemanticProgressBar/SemanticProgressBar";
import { useApiMetrics } from "@/hooks/useApiMetrics";
import styles from "./AdminAnalyticsView.module.scss";

const COST_LABEL: Record<string, string> = {
  light: "легкий",
  medium: "середній",
  heavy: "важкий",
  critical: "критичний",
};

const COST_CLASS: Record<string, string> = {
  light: styles.costLight,
  medium: styles.costMedium,
  heavy: styles.costHeavy,
  critical: styles.costCritical,
};

export function AdminAnalyticsView() {
  const {
    source,
    setSource,
    aggregated,
    duplicates,
    totalRequests,
    lastUpdatedAt,
    clear,
    backendError,
  } = useApiMetrics();

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

          {statsLoading ? (
            <div className={styles.emptyState}>Завантаження статистики…</div>
          ) : lawStatsMap.size === 0 ? (
            <div className={styles.emptyState}>
              Статистика недоступна — ендпоінт{" "}
              <code
                style={{ fontFamily: "var(--font-mono)", color: "#c8a843" }}
              >
                /api/laws/:id/stats
              </code>{" "}
              не відповідає. Дані будуть тут коли бекенд поверне stats.
            </div>
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
      {/* ─── API Load Monitor ─── */}
      <div className={styles.apiSection}>
        <div className={styles.apiSectionHeader}>
          <div>
            <span className={styles.panelEyebrow}>Навантаження на API</span>
            <h2 className={styles.panelTitle}>Живий моніторинг запитів</h2>
          </div>

          <div className={styles.apiControls}>
            <div className={styles.sourceToggle}>
              <button
                type="button"
                className={`${styles.sourcePill} ${source === "live" ? styles.sourcePillActive : ""}`}
                onClick={() => setSource("live")}
              >
                {source === "live" && <span className={styles.liveDot} />}
                Живі дані
              </button>
              <button
                type="button"
                className={`${styles.sourcePill} ${source === "backend" ? styles.sourcePillActive : ""}`}
                onClick={() => setSource("backend")}
              >
                Бекенд
              </button>
            </div>

            {source === "live" && (
              <button type="button" className={styles.clearBtn} onClick={clear}>
                Очистити
              </button>
            )}
          </div>
        </div>

        {source === "backend" && backendError && (
          <div className={`${styles.emptyState} ${styles.backendError}`}>
            <span className="mono" style={{ color: "#c0392b" }}>
              Бекенд недоступний:
            </span>{" "}
            {backendError}
            <br />
            <span style={{ color: "#8a9bbf", fontSize: "0.8rem" }}>
              Ендпоінт <code>/api/admin/metrics</code> буде підключений пізніше.
            </span>
          </div>
        )}

        <div className={styles.apiMetaRow}>
          <div className={styles.apiStatChip}>
            <span className={styles.apiStatValue}>{totalRequests}</span>
            <span className={styles.apiStatLabel}>запитів</span>
          </div>
          <div className={styles.apiStatChip}>
            <span className={styles.apiStatValue}>{aggregated.length}</span>
            <span className={styles.apiStatLabel}>унікальних ендпоінтів</span>
          </div>
          {duplicates.length > 0 && (
            <div className={`${styles.apiStatChip} ${styles.apiStatChipWarn}`}>
              <span className={styles.apiStatValue}>{duplicates.length}</span>
              <span className={styles.apiStatLabel}>повторних</span>
            </div>
          )}
          <span className={`mono ${styles.apiUpdated}`}>
            оновлено{" "}
            {new Date(lastUpdatedAt).toLocaleTimeString("uk-UA", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>

        {aggregated.length === 0 ? (
          <div className={styles.emptyState}>
            {source === "live"
              ? "Записів ще немає. Походіть по сторінках — дані з'являться тут."
              : "Немає даних від бекенду."}
          </div>
        ) : (
          <div className={styles.apiTable}>
            <div className={`${styles.apiRow} ${styles.apiRowHead}`}>
              <span>Ендпоінт</span>
              <span>Виклики</span>
              <span>Вартість</span>
              <span>Сторінки</span>
            </div>
            {aggregated.map((ep) => (
              <div
                key={ep.key}
                className={`${styles.apiRow} ${ep.count > 1 ? styles.apiRowDuplicate : ""}`}
              >
                <span className={`mono ${styles.apiEndpoint}`}>
                  <span className={styles.apiMethod}>{ep.method}</span>{" "}
                  {ep.normalizedPath}
                </span>
                <span className={`mono ${styles.apiCount}`}>{ep.count}</span>
                <span
                  className={`mono ${styles.costBadge} ${COST_CLASS[ep.costHint] ?? ""}`}
                >
                  {COST_LABEL[ep.costHint] ?? ep.costHint}
                </span>
                <span className={styles.apiPages}>
                  {ep.pages.map((p) => (
                    <span key={p} className={`mono ${styles.apiPage}`}>
                      {p}
                    </span>
                  ))}
                </span>
              </div>
            ))}
          </div>
        )}

        {duplicates.length > 0 && (
          <div className={styles.duplicatesAlert}>
            <span className={styles.duplicatesTitle}>
              Підозрілі повтори ({duplicates.length})
            </span>
            <div className={styles.duplicatesList}>
              {duplicates.map((ep) => (
                <span key={ep.key} className={`mono ${styles.duplicateItem}`}>
                  {ep.key} ×{ep.count}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
