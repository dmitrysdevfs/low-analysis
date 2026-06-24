"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Copy,
  Database,
  Download,
  FileJson,
  FileSpreadsheet,
  Filter,
  LoaderCircle,
  Play,
  Search,
  Sparkles,
} from "lucide-react";
import { ROUTES } from "@/constants/routes";
import {
  adminDataToolsApi,
  type ParseAllReferencesResult,
  type ParseSingleReferencesResult,
} from "@/lib/api/adminDataTools";
import { getLaws } from "@/lib/api/laws";
import { notify } from "@/lib/toast";
import { formatDateFull, formatDateShort } from "@/lib/utils";
import type { Law } from "@/types";
import styles from "./AdminDataTools.module.scss";

const HISTORY_STORAGE_KEY = "low-analysis.admin.data-tools.history";

type ActionHistoryEntry = {
  id: string;
  kind: "export" | "parse-law" | "parse-all" | "copy-url";
  title: string;
  detail: string;
  createdAt: string;
  status: "done" | "error" | "download";
};

type ParseRunResult =
  | {
      type: "single";
      lawId: string;
      lawTitle: string;
      payload: ParseSingleReferencesResult;
      createdAt: string;
    }
  | {
      type: "all";
      payload: ParseAllReferencesResult;
      createdAt: string;
    };

function makeHistoryEntry(
  kind: ActionHistoryEntry["kind"],
  title: string,
  detail: string,
  status: ActionHistoryEntry["status"],
): ActionHistoryEntry {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind,
    title,
    detail,
    createdAt: new Date().toISOString(),
    status,
  };
}

function sanitizeDate(value: string) {
  return value.trim() || undefined;
}

export function AdminDataToolsView() {
  const [laws, setLaws] = useState<Law[]>([]);
  const [lawsLoading, setLawsLoading] = useState(true);
  const [lawQuery, setLawQuery] = useState("");
  const [selectedLawId, setSelectedLawId] = useState("");
  const [manualLawId, setManualLawId] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [articleFilter, setArticleFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState<ActionHistoryEntry[]>([]);
  const [isParsingLaw, setIsParsingLaw] = useState(false);
  const [isParsingAll, setIsParsingAll] = useState(false);
  const [parseResult, setParseResult] = useState<ParseRunResult | null>(null);

  const writeHistory = useCallback(
    (updater: (prev: ActionHistoryEntry[]) => ActionHistoryEntry[]) => {
      setHistory((prev) => {
        const next = updater(prev).slice(0, 16);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            HISTORY_STORAGE_KEY,
            JSON.stringify(next),
          );
        }
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ActionHistoryEntry[];
      if (Array.isArray(parsed)) {
        setHistory(parsed);
      }
    } catch {
      window.localStorage.removeItem(HISTORY_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadLaws() {
      setLawsLoading(true);
      try {
        const data = await getLaws("");
        if (!cancelled) {
          setLaws(data);
        }
      } catch {
        if (!cancelled) {
          notify.warning(
            "Не вдалося завантажити список законів для Data tools.",
          );
        }
      } finally {
        if (!cancelled) {
          setLawsLoading(false);
        }
      }
    }
    void loadLaws();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredLaws = useMemo(() => {
    const q = lawQuery.trim().toLowerCase();
    const base = q
      ? laws.filter(
          (law) =>
            law.title.toLowerCase().includes(q) ||
            law.code.toLowerCase().includes(q),
        )
      : laws;
    return base.slice(0, 120);
  }, [lawQuery, laws]);

  const selectedLaw = useMemo(
    () => laws.find((law) => law._id === selectedLawId) ?? null,
    [laws, selectedLawId],
  );

  const effectiveLawId = manualLawId.trim() || selectedLaw?._id || "";

  const buildExportUrl = useCallback(
    (
      basePath: "/api/laws/export" | "/api/export/dataset",
      format: "json" | "xlsx",
      mode: "flat" | "nested" = "flat",
    ) => {
      const params = new URLSearchParams();
      if (effectiveLawId) params.set("lawId", effectiveLawId);
      params.set("format", format);
      if (format === "json") {
        params.set("mode", mode);
      }
      if (subjectFilter.trim()) params.set("subject", subjectFilter.trim());
      if (articleFilter.trim()) params.set("article", articleFilter.trim());
      const cleanStartDate = sanitizeDate(startDate);
      const cleanEndDate = sanitizeDate(endDate);
      if (cleanStartDate) params.set("startDate", cleanStartDate);
      if (cleanEndDate) params.set("endDate", cleanEndDate);
      return `${basePath}?${params.toString()}`;
    },
    [articleFilter, effectiveLawId, endDate, startDate, subjectFilter],
  );

  const exportPreview = useMemo(
    () => buildExportUrl("/api/laws/export", "json", "flat"),
    [buildExportUrl],
  );

  const recordHistory = useCallback(
    (
      kind: ActionHistoryEntry["kind"],
      title: string,
      detail: string,
      status: ActionHistoryEntry["status"],
    ) => {
      writeHistory((prev) => [
        makeHistoryEntry(kind, title, detail, status),
        ...prev,
      ]);
    },
    [writeHistory],
  );

  const copyText = useCallback(
    async (value: string, label: string) => {
      if (!effectiveLawId) {
        notify.warning("Спочатку оберіть закон або введіть lawId.");
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        recordHistory("copy-url", `Скопійовано ${label}`, value, "done");
        notify.success(`${label} скопійовано.`);
      } catch {
        notify.warning("Не вдалося скопіювати URL.");
      }
    },
    [effectiveLawId, recordHistory],
  );

  const handleExportClick = useCallback(
    (label: string, url: string) => {
      if (!effectiveLawId) {
        notify.warning("Для експорту потрібно обрати закон або ввести lawId.");
        return false;
      }
      recordHistory("export", `Експорт ${label}`, url, "download");
      return true;
    },
    [effectiveLawId, recordHistory],
  );

  const handleParseSingleLaw = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!effectiveLawId) {
        notify.warning("Для parse references по одному закону потрібен lawId.");
        return;
      }

      setIsParsingLaw(true);
      try {
        const payload =
          await adminDataToolsApi.parseSingleLawReferences(effectiveLawId);
        const lawTitle = selectedLaw?.title ?? "Обраний закон";
        setParseResult({
          type: "single",
          lawId: effectiveLawId,
          lawTitle,
          payload,
          createdAt: new Date().toISOString(),
        });
        recordHistory(
          "parse-law",
          "Parse references для закону",
          `${lawTitle} · parsed: ${payload.parsed}, created: ${payload.created}, updated: ${payload.updated}`,
          "done",
        );
        notify.success("Посилання для обраного закону успішно перепарсено.");
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Не вдалося виконати parse references.";
        recordHistory(
          "parse-law",
          "Помилка parse references",
          message,
          "error",
        );
        notify.warning(message);
      } finally {
        setIsParsingLaw(false);
      }
    },
    [effectiveLawId, recordHistory, selectedLaw],
  );

  const handleParseAllLaws = useCallback(async () => {
    const confirmed = window.confirm(
      "Запустити parse references для всіх законів? Це важка операція для всієї бази.",
    );
    if (!confirmed) return;

    setIsParsingAll(true);
    try {
      const payload = await adminDataToolsApi.parseAllReferences();
      setParseResult({
        type: "all",
        payload,
        createdAt: new Date().toISOString(),
      });
      recordHistory(
        "parse-all",
        "Parse references для всієї бази",
        `${payload.laws} законів · parsed: ${payload.totalParsed}, created: ${payload.totalCreated}, updated: ${payload.totalUpdated}`,
        "done",
      );
      notify.success("Повний parse references завершено.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Не вдалося обробити всю базу.";
      recordHistory(
        "parse-all",
        "Помилка parse all references",
        message,
        "error",
      );
      notify.warning(message);
    } finally {
      setIsParsingAll(false);
    }
  }, [recordHistory]);

  const metrics = useMemo(() => {
    return {
      lawsLoaded: laws.length,
      formats: 3,
      endpoints: 4,
      history: history.length,
    };
  }, [history.length, laws.length]);

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Data tools</span>
          <h2 className={styles.title}>
            Експорт датасетів і технічні операції по законах в одному центрі.
          </h2>
          <p className={styles.description}>
            Цей екран закриває робочі сценарії аналітика, бекенда та
            адміністратора: швидкий export dataset, parse references для одного
            закону або всієї бази, а також передача важких batch-операцій у
            queue-центр.
          </p>
          <div className={styles.heroActions}>
            <Link href={ROUTES.adminJobs} className={styles.primaryLink}>
              Перейти до Jobs
              <ArrowUpRight size={14} />
            </Link>
            <Link href={ROUTES.adminApiCenter} className={styles.secondaryLink}>
              Відкрити API Center
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <aside className={styles.heroStatus}>
          <div className={styles.heroStatusHeader}>
            <Sparkles size={18} />
            <span>Операційний контур</span>
          </div>
          <strong className={styles.heroStatusValue}>
            {metrics.endpoints} backend дії
          </strong>
          <p className={styles.heroStatusMeta}>
            Export через `/api/laws/export` і alias `/api/export/dataset`, admin
            parse references для `law/:lawId` та `all`.
          </p>
          <div className={styles.heroStatusRows}>
            <div className={styles.heroStatusRow}>
              <span>Закони в локальному селекторі</span>
              <strong>{lawsLoading ? "…" : metrics.lawsLoaded}</strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Формати експорту</span>
              <strong>JSON / JSON tree / XLSX</strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Локальна історія дій</span>
              <strong>{metrics.history}</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.kpiRow}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Закони</span>
          <strong className={styles.kpiValue}>
            {lawsLoading ? "…" : metrics.lawsLoaded}
          </strong>
          <span className={styles.kpiMeta}>
            Доступні в селекторі для export і parsing
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Формати</span>
          <strong className={styles.kpiValue}>{metrics.formats}</strong>
          <span className={styles.kpiMeta}>XLSX, JSON flat, JSON nested</span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Parse references</span>
          <strong className={styles.kpiValue}>2</strong>
          <span className={styles.kpiMeta}>
            По одному закону або по всій базі
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Batch handoff</span>
          <strong className={styles.kpiValue}>Jobs</strong>
          <span className={styles.kpiMeta}>
            Важкі чергові операції винесені окремо
          </span>
        </article>
      </section>

      <div className={styles.workspace}>
        <section className={styles.leftRail}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Law target</span>
                <h3 className={styles.sectionTitle}>
                  Оберіть закон для інструментів
                </h3>
              </div>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Пошук по title / code</span>
              <div className={styles.inputWrap}>
                <Search size={14} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  value={lawQuery}
                  onChange={(event) => setLawQuery(event.target.value)}
                  placeholder="Напр. 1700-18 або назва закону"
                />
              </div>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Результати пошуку</span>
              <select
                className={styles.select}
                value={selectedLawId}
                onChange={(event) => setSelectedLawId(event.target.value)}
              >
                <option value="">Оберіть закон зі списку</option>
                {filteredLaws.map((law) => (
                  <option key={law._id} value={law._id}>
                    {law.code} — {law.title}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>
                Або введіть lawId вручну
              </span>
              <input
                className={styles.input}
                value={manualLawId}
                onChange={(event) => setManualLawId(event.target.value)}
                placeholder="MongoDB lawId"
              />
            </label>

            {selectedLaw && (
              <div className={styles.lawCard}>
                <div className={styles.lawCardTop}>
                  <Database size={15} />
                  <span>{selectedLaw.code}</span>
                </div>
                <strong className={styles.lawCardTitle}>
                  {selectedLaw.title}
                </strong>
                <div className={styles.lawCardMeta}>
                  {selectedLaw.totalArticles} статей ·{" "}
                  {selectedLaw.totalSections} розділів
                </div>
                <div className={styles.lawCardMeta}>
                  {selectedLaw.adoptedDate
                    ? `Прийнято: ${formatDateShort(selectedLaw.adoptedDate)}`
                    : "Дата прийняття не вказана"}
                </div>
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Shared filters</span>
                <h3 className={styles.sectionTitle}>Фільтри експорту</h3>
              </div>
              <span className={styles.panelHeaderMeta}>
                <Filter size={12} />
                Спільні для всіх export-кнопок
              </span>
            </div>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Суб&apos;єкт</span>
              <input
                className={styles.input}
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                placeholder="Напр. громадянин"
              />
            </label>

            <label className={styles.field}>
              <span className={styles.fieldLabel}>Стаття</span>
              <input
                className={styles.input}
                value={articleFilter}
                onChange={(event) => setArticleFilter(event.target.value)}
                placeholder="Напр. 1 або 12-1"
              />
            </label>

            <div className={styles.dateGrid}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Дата від</span>
                <input
                  type="date"
                  className={styles.input}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                />
              </label>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>Дата до</span>
                <input
                  type="date"
                  className={styles.input}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                />
              </label>
            </div>

            <div className={styles.previewBox}>
              <span className={styles.previewLabel}>Preview endpoint</span>
              <code className={styles.previewCode}>
                {exportPreview || "Оберіть закон"}
              </code>
            </div>
          </article>
        </section>

        <section className={styles.centerRail}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Dataset export</span>
                <h3 className={styles.sectionTitle}>
                  Вивантаження закону в аналітичний датасет
                </h3>
              </div>
            </div>

            <div className={styles.exportGrid}>
              <a
                href={buildExportUrl("/api/laws/export", "xlsx")}
                className={styles.exportCard}
                onClick={(event) => {
                  if (
                    !handleExportClick(
                      "XLSX",
                      buildExportUrl("/api/laws/export", "xlsx"),
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <FileSpreadsheet size={18} />
                <strong>XLSX dataset</strong>
                <span>
                  Стрімінговий Excel для аналітики й зовнішніх команд.
                </span>
                <span className={styles.exportMeta}>/api/laws/export</span>
              </a>

              <a
                href={buildExportUrl("/api/laws/export", "json", "flat")}
                className={styles.exportCard}
                onClick={(event) => {
                  if (
                    !handleExportClick(
                      "JSON flat",
                      buildExportUrl("/api/laws/export", "json", "flat"),
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <FileJson size={18} />
                <strong>JSON flat</strong>
                <span>
                  Плаский список елементів із батьківським контекстом.
                </span>
                <span className={styles.exportMeta}>mode=flat</span>
              </a>

              <a
                href={buildExportUrl("/api/laws/export", "json", "nested")}
                className={styles.exportCard}
                onClick={(event) => {
                  if (
                    !handleExportClick(
                      "JSON nested",
                      buildExportUrl("/api/laws/export", "json", "nested"),
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <FileJson size={18} />
                <strong>JSON tree</strong>
                <span>Вкладена структура закону для graph/tree сценаріїв.</span>
                <span className={styles.exportMeta}>mode=nested</span>
              </a>
            </div>

            <div className={styles.inlineActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() =>
                  void copyText(
                    buildExportUrl("/api/laws/export", "json", "flat"),
                    "Canonical export URL",
                  )
                }
              >
                <Copy size={14} />
                Скопіювати canonical URL
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() =>
                  void copyText(
                    buildExportUrl("/api/export/dataset", "json", "flat"),
                    "Alias export URL",
                  )
                }
              >
                <Copy size={14} />
                Скопіювати alias URL
              </button>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Reference parser</span>
                <h3 className={styles.sectionTitle}>
                  Оновлення посилань між законами
                </h3>
              </div>
            </div>

            <form className={styles.parseCard} onSubmit={handleParseSingleLaw}>
              <div className={styles.parseTitleRow}>
                <Play size={15} />
                <strong>Parse references для одного закону</strong>
              </div>
              <p className={styles.parseHint}>
                Використовує `POST /api/admin/parse-references/law/:lawId` і
                повертає `parsed / created / updated`.
              </p>
              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={isParsingLaw || !effectiveLawId}
              >
                {isParsingLaw ? (
                  <LoaderCircle size={14} className={styles.spinningIcon} />
                ) : (
                  <Play size={14} />
                )}
                Запустити для обраного закону
              </button>
            </form>

            <div className={`${styles.parseCard} ${styles.parseCardDanger}`}>
              <div className={styles.parseTitleRow}>
                <Sparkles size={15} />
                <strong>Parse references для всієї бази</strong>
              </div>
              <p className={styles.parseHint}>
                Адмінська масова операція `POST
                /api/admin/parse-references/all`. Запускайте тільки коли треба
                перепобудувати reference layer глобально.
              </p>
              <button
                type="button"
                className={styles.dangerBtn}
                disabled={isParsingAll}
                onClick={() => void handleParseAllLaws()}
              >
                {isParsingAll ? (
                  <LoaderCircle size={14} className={styles.spinningIcon} />
                ) : (
                  <Play size={14} />
                )}
                Запустити для всієї бази
              </button>
            </div>
          </article>
        </section>

        <aside className={styles.rightRail}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Last result</span>
                <h3 className={styles.sectionTitle}>
                  Останній технічний результат
                </h3>
              </div>
            </div>

            {parseResult ? (
              <div className={styles.resultBlock}>
                <div className={styles.resultSummary}>
                  <CheckCircle2 size={15} />
                  <strong>
                    {parseResult.type === "single"
                      ? parseResult.lawTitle
                      : `Вся база · ${parseResult.payload.laws} законів`}
                  </strong>
                </div>
                <div className={styles.resultGrid}>
                  {parseResult.type === "single" ? (
                    <>
                      <div className={styles.resultMetric}>
                        <span>Parsed</span>
                        <strong>{parseResult.payload.parsed}</strong>
                      </div>
                      <div className={styles.resultMetric}>
                        <span>Created</span>
                        <strong>{parseResult.payload.created}</strong>
                      </div>
                      <div className={styles.resultMetric}>
                        <span>Updated</span>
                        <strong>{parseResult.payload.updated}</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className={styles.resultMetric}>
                        <span>Закони</span>
                        <strong>{parseResult.payload.laws}</strong>
                      </div>
                      <div className={styles.resultMetric}>
                        <span>Total parsed</span>
                        <strong>{parseResult.payload.totalParsed}</strong>
                      </div>
                      <div className={styles.resultMetric}>
                        <span>Total created</span>
                        <strong>{parseResult.payload.totalCreated}</strong>
                      </div>
                      <div className={styles.resultMetric}>
                        <span>Total updated</span>
                        <strong>{parseResult.payload.totalUpdated}</strong>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.resultTime}>
                  {formatDateFull(parseResult.createdAt)}
                </div>
                {parseResult.type === "all" &&
                  parseResult.payload.results.length > 0 && (
                    <div className={styles.resultPreviewList}>
                      {parseResult.payload.results.slice(0, 5).map((item) => (
                        <div
                          key={item.lawId}
                          className={styles.resultPreviewItem}
                        >
                          <span>{item.lawId}</span>
                          <strong>
                            p:{item.parsed} · c:{item.created} · u:
                            {item.updated}
                          </strong>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ) : (
              <div className={styles.emptyState}>
                Після export або parse тут з&apos;явиться короткий підсумок
                останньої дії.
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Quick links</span>
                <h3 className={styles.sectionTitle}>
                  Batch handoff і суміжні центри
                </h3>
              </div>
            </div>
            <div className={styles.quickLinks}>
              <Link href={ROUTES.adminJobs} className={styles.quickLink}>
                <span>Jobs & Operations</span>
                <ArrowUpRight size={12} />
              </Link>
              <Link href={ROUTES.adminApiCenter} className={styles.quickLink}>
                <span>API Center</span>
                <ArrowUpRight size={12} />
              </Link>
              <a
                href={buildExportUrl("/api/export/dataset", "json", "flat")}
                className={styles.quickLink}
                onClick={(event) => {
                  if (
                    !handleExportClick(
                      "Alias JSON flat",
                      buildExportUrl("/api/export/dataset", "json", "flat"),
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <span>Alias export endpoint</span>
                <Download size={12} />
              </a>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Local history</span>
                <h3 className={styles.sectionTitle}>
                  Останні дії в Data tools
                </h3>
              </div>
            </div>
            {history.length ? (
              <div className={styles.historyList}>
                {history.map((entry) => (
                  <div key={entry.id} className={styles.historyItem}>
                    <div className={styles.historyTop}>
                      <strong>{entry.title}</strong>
                      <span>{formatDateShort(entry.createdAt)}</span>
                    </div>
                    <p>{entry.detail}</p>
                    <span
                      className={`${styles.historyBadge} ${
                        entry.status === "error"
                          ? styles.historyBadgeError
                          : entry.status === "download"
                            ? styles.historyBadgeDownload
                            : styles.historyBadgeDone
                      }`}
                    >
                      {entry.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                Історія з&apos;явиться після першого export, copy URL або
                parse-run.
              </div>
            )}
          </article>
        </aside>
      </div>
    </section>
  );
}
