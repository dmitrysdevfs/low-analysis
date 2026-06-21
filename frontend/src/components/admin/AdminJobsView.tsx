"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Wrench,
} from "lucide-react";
import {
  queueApi,
  type QueueEnqueueResponse,
  type QueueJobStatus,
} from "@/lib/api/queue";
import { formatDateFull, formatDateShort } from "@/lib/utils";
import { notify } from "@/lib/toast";
import styles from "./AdminJobs.module.scss";

const STORAGE_KEY = "low-analysis.admin.jobs-center";
const POLL_MS = 8000;

type JobTask = "parse-law" | "analyze-subjects" | "batch-update-law-tree";
type ScopeFilter = "all" | "live" | "completed" | "failed";

type JobPayload =
  | { task: "parse-law"; url: string }
  | { task: "analyze-subjects"; lawId: string; force: boolean }
  | { task: "batch-update-law-tree"; codes: string[] };

type TrackedJob = {
  localId: string;
  jobId: string;
  queue: string;
  task: JobTask;
  label: string;
  summary: string;
  createdAt: string;
  payload: JobPayload | null;
  status: QueueJobStatus | null;
  lastCheckedAt: string | null;
  statusError: string | null;
};

function isLiveState(state?: string | null) {
  return state === "waiting" || state === "active" || state === "delayed";
}

function stateLabel(state?: string | null) {
  switch (state) {
    case "waiting":
      return "У черзі";
    case "active":
      return "Виконується";
    case "completed":
      return "Завершено";
    case "failed":
      return "Помилка";
    case "delayed":
      return "Відкладено";
    default:
      return state || "Невідомо";
  }
}

function normalizeProgress(status: QueueJobStatus | null) {
  if (!status) return 0;
  if (typeof status.progress === "number" && Number.isFinite(status.progress)) {
    return Math.max(0, Math.min(100, status.progress));
  }
  if (status.state === "completed") return 100;
  if (status.state === "active") return 55;
  if (status.state === "waiting") return 12;
  if (status.state === "delayed") return 20;
  return 0;
}

function inferTaskFromQueue(queue: string): JobTask {
  if (queue === "analyze_subjects") return "analyze-subjects";
  if (queue === "batch_update_law_tree") return "batch-update-law-tree";
  return "parse-law";
}

function taskTitle(task: JobTask) {
  switch (task) {
    case "parse-law":
      return "Парсинг закону";
    case "analyze-subjects":
      return "Аналіз суб'єктів";
    case "batch-update-law-tree":
      return "Масове оновлення дерева";
  }
}

function buildJobSummary(payload: JobPayload | null, queue: string) {
  if (!payload) {
    return `Зовнішній job із черги ${queue}`;
  }
  if (payload.task === "parse-law") {
    return `URL / код: ${payload.url}`;
  }
  if (payload.task === "analyze-subjects") {
    return `lawId: ${payload.lawId}${payload.force ? " · force" : ""}`;
  }
  return `${payload.codes.length} кодів для re-ingest`;
}

function createTrackedJob(
  response: QueueEnqueueResponse,
  payload: JobPayload | null,
): TrackedJob {
  const task = payload?.task ?? inferTaskFromQueue(response.queue);
  return {
    localId: `${response.jobId}-${Date.now()}`,
    jobId: response.jobId,
    queue: response.queue,
    task,
    label: taskTitle(task),
    summary: buildJobSummary(payload, response.queue),
    createdAt: new Date().toISOString(),
    payload,
    status: {
      jobId: response.jobId,
      queue: response.queue,
      state: response.state,
      progress: 0,
      attemptsMade: 0,
      returnvalue: null,
      failedReason: null,
    },
    lastCheckedAt: null,
    statusError: null,
  };
}

function parseCodesInput(value: string) {
  return [
    ...new Set(
      value
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function formatRelativeTime(value: string) {
  const date = new Date(value);
  const diffMinutes = Math.max(
    1,
    Math.round((Date.now() - date.getTime()) / 60000),
  );
  if (diffMinutes < 60) return `${diffMinutes} хв тому`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} год тому`;
  return formatDateShort(value);
}

function stringifyResult(value: unknown) {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminJobsView() {
  const [jobs, setJobs] = useState<TrackedJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [lookupJobId, setLookupJobId] = useState("");
  const [scope, setScope] = useState<ScopeFilter>("all");
  const [submittingTask, setSubmittingTask] = useState<JobTask | null>(null);
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  const [parseUrl, setParseUrl] = useState("");
  const [analyzeLawId, setAnalyzeLawId] = useState("");
  const [analyzeForce, setAnalyzeForce] = useState(false);
  const [batchCodesInput, setBatchCodesInput] = useState("");

  const writeJobs = useCallback(
    (updater: (prev: TrackedJob[]) => TrackedJob[]) => {
      setJobs((prev) => {
        const next = updater(prev).slice(0, 30);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
        return next;
      });
    },
    [],
  );

  const mergeStatuses = useCallback(
    async (targetJobs?: TrackedJob[]) => {
      const source = targetJobs ?? jobs;
      if (!source.length) return;

      const nextStatuses = await Promise.all(
        source.map(async (job) => {
          try {
            const status = await queueApi.getJobStatus(job.jobId);
            return {
              localId: job.localId,
              status,
              lastCheckedAt: new Date().toISOString(),
              statusError: null,
            };
          } catch (error) {
            return {
              localId: job.localId,
              status: job.status,
              lastCheckedAt: new Date().toISOString(),
              statusError:
                error instanceof Error
                  ? error.message
                  : "Не вдалося отримати статус",
            };
          }
        }),
      );

      writeJobs((prev) =>
        prev.map((job) => {
          const match = nextStatuses.find(
            (item) => item.localId === job.localId,
          );
          return match
            ? {
                ...job,
                status: match.status,
                lastCheckedAt: match.lastCheckedAt,
                statusError: match.statusError,
                queue: match.status?.queue ?? job.queue,
              }
            : job;
        }),
      );
    },
    [jobs, writeJobs],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TrackedJob[];
      setJobs(Array.isArray(parsed) ? parsed : []);
      if (Array.isArray(parsed) && parsed[0]) {
        setSelectedJobId(parsed[0].localId);
        void mergeStatuses(parsed);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [mergeStatuses]);

  const liveJobsFingerprint = useMemo(
    () =>
      jobs
        .filter((job) => isLiveState(job.status?.state))
        .map((job) => job.jobId)
        .join("|"),
    [jobs],
  );

  useEffect(() => {
    if (!liveJobsFingerprint) return;
    const intervalId = window.setInterval(() => {
      void mergeStatuses();
    }, POLL_MS);
    return () => window.clearInterval(intervalId);
  }, [liveJobsFingerprint, mergeStatuses]);

  useEffect(() => {
    if (!jobs.length) {
      if (selectedJobId !== null) setSelectedJobId(null);
      return;
    }
    if (!selectedJobId || !jobs.some((job) => job.localId === selectedJobId)) {
      setSelectedJobId(jobs[0].localId);
    }
  }, [jobs, selectedJobId]);

  const enqueueAndTrack = useCallback(
    async (response: QueueEnqueueResponse, payload: JobPayload | null) => {
      const trackedJob = createTrackedJob(response, payload);
      writeJobs((prev) => [
        trackedJob,
        ...prev.filter((job) => job.jobId !== response.jobId),
      ]);
      setSelectedJobId(trackedJob.localId);
      await mergeStatuses([trackedJob]);
      notify.success(`Job ${response.jobId} поставлено в чергу.`);
    },
    [mergeStatuses, writeJobs],
  );

  const handleParseLaw = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const url = parseUrl.trim();
      if (!url) {
        notify.warning("Вкажіть URL або код закону.");
        return;
      }

      setSubmittingTask("parse-law");
      try {
        const response = await queueApi.enqueueParseLaw(url);
        await enqueueAndTrack(response, { task: "parse-law", url });
        setParseUrl("");
      } catch (error) {
        notify.warning(
          error instanceof Error ? error.message : "Не вдалося створити job.",
        );
      } finally {
        setSubmittingTask(null);
      }
    },
    [enqueueAndTrack, parseUrl],
  );

  const handleAnalyzeSubjects = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const lawId = analyzeLawId.trim();
      if (!lawId) {
        notify.warning("Вкажіть lawId для аналізу.");
        return;
      }

      setSubmittingTask("analyze-subjects");
      try {
        const response = await queueApi.enqueueAnalyzeSubjects(
          lawId,
          analyzeForce,
        );
        await enqueueAndTrack(response, {
          task: "analyze-subjects",
          lawId,
          force: analyzeForce,
        });
        setAnalyzeLawId("");
        setAnalyzeForce(false);
      } catch (error) {
        notify.warning(
          error instanceof Error ? error.message : "Не вдалося створити job.",
        );
      } finally {
        setSubmittingTask(null);
      }
    },
    [analyzeForce, analyzeLawId, enqueueAndTrack],
  );

  const handleBatchUpdate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const codes = parseCodesInput(batchCodesInput);
      if (!codes.length) {
        notify.warning("Додайте хоча б один код закону.");
        return;
      }
      if (codes.length > 100) {
        notify.warning("Batch-оновлення підтримує до 100 кодів за один job.");
        return;
      }

      setSubmittingTask("batch-update-law-tree");
      try {
        const response = await queueApi.enqueueBatchUpdateLawTree(codes);
        await enqueueAndTrack(response, {
          task: "batch-update-law-tree",
          codes,
        });
        setBatchCodesInput("");
      } catch (error) {
        notify.warning(
          error instanceof Error ? error.message : "Не вдалося створити job.",
        );
      } finally {
        setSubmittingTask(null);
      }
    },
    [batchCodesInput, enqueueAndTrack],
  );

  const handleLookupJob = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const jobId = lookupJobId.trim();
      if (!jobId) {
        notify.warning("Вкажіть існуючий jobId.");
        return;
      }

      setIsRefreshingAll(true);
      try {
        const status = await queueApi.getJobStatus(jobId);
        const trackedJob = createTrackedJob(
          { jobId: status.jobId, queue: status.queue, state: status.state },
          null,
        );
        trackedJob.status = status;
        trackedJob.lastCheckedAt = new Date().toISOString();
        trackedJob.summary = `Імпортований job з черги ${status.queue}`;

        writeJobs((prev) => [
          trackedJob,
          ...prev.filter((job) => job.jobId !== status.jobId),
        ]);
        setSelectedJobId(trackedJob.localId);
        setLookupJobId("");
      } catch (error) {
        notify.warning(
          error instanceof Error ? error.message : "Job не знайдено.",
        );
      } finally {
        setIsRefreshingAll(false);
      }
    },
    [lookupJobId, writeJobs],
  );

  const handleRefreshAll = useCallback(async () => {
    setIsRefreshingAll(true);
    try {
      await mergeStatuses();
    } finally {
      setIsRefreshingAll(false);
    }
  }, [mergeStatuses]);

  const handleRetry = useCallback(
    async (job: TrackedJob) => {
      if (!job.payload) {
        notify.info(
          "Для імпортованого job немає payload, тому повторний запуск недоступний.",
        );
        return;
      }

      setSubmittingTask(job.task);
      try {
        let response: QueueEnqueueResponse;
        if (job.payload.task === "parse-law") {
          response = await queueApi.enqueueParseLaw(job.payload.url);
        } else if (job.payload.task === "analyze-subjects") {
          response = await queueApi.enqueueAnalyzeSubjects(
            job.payload.lawId,
            job.payload.force,
          );
        } else {
          response = await queueApi.enqueueBatchUpdateLawTree(
            job.payload.codes,
          );
        }
        await enqueueAndTrack(response, job.payload);
      } catch (error) {
        notify.warning(
          error instanceof Error
            ? error.message
            : "Не вдалося повторно поставити job у чергу.",
        );
      } finally {
        setSubmittingTask(null);
      }
    },
    [enqueueAndTrack],
  );

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (scope === "live") return isLiveState(job.status?.state);
      if (scope === "completed") return job.status?.state === "completed";
      if (scope === "failed") return job.status?.state === "failed";
      return true;
    });
  }, [jobs, scope]);

  const selectedJob =
    jobs.find((job) => job.localId === selectedJobId) ??
    filteredJobs[0] ??
    null;

  const metrics = useMemo(() => {
    const live = jobs.filter((job) => isLiveState(job.status?.state)).length;
    const completed = jobs.filter(
      (job) => job.status?.state === "completed",
    ).length;
    const failed = jobs.filter((job) => job.status?.state === "failed").length;
    const retryable = jobs.filter((job) => job.payload).length;
    return {
      total: jobs.length,
      live,
      completed,
      failed,
      retryable,
    };
  }, [jobs]);

  return (
    <section className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>Queue operations</span>
          <h2 className={styles.title}>
            Один центр для jobs, статусів і повторних запусків.
          </h2>
          <p className={styles.description}>
            Екран для адміністратора та технічної команди: запуск парсингу,
            аналізу суб&apos;єктів і масового re-ingest, моніторинг прогресу,
            помилок та ручний retry без переходу в Swagger.
          </p>
          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => void handleRefreshAll()}
              disabled={isRefreshingAll}
            >
              <RefreshCw
                size={14}
                className={isRefreshingAll ? styles.spinningIcon : ""}
              />
              Оновити всі jobs
            </button>
            <a
              href="/api/queue/status/example-job-id"
              className={styles.secondaryLink}
            >
              Queue API
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>

        <aside className={styles.heroStatus}>
          <div className={styles.heroStatusHeader}>
            <Server size={18} />
            <span>Черга під наглядом</span>
          </div>
          <strong className={styles.heroStatusValue}>
            {metrics.live} активних job
          </strong>
          <p className={styles.heroStatusMeta}>
            {metrics.total} відстежуваних задач, {metrics.completed} завершених,
            {metrics.failed} з помилкою, {metrics.retryable} можна
            перевиставити.
          </p>
          <div className={styles.heroStatusRows}>
            <div className={styles.heroStatusRow}>
              <span>Polling</span>
              <strong>{POLL_MS / 1000} сек</strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Максимум у локальному реєстрі</span>
              <strong>30 job</strong>
            </div>
            <div className={styles.heroStatusRow}>
              <span>Джерело даних</span>
              <strong>/api/queue/*</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className={styles.kpiRow}>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Активні</span>
          <strong className={styles.kpiValue}>{metrics.live}</strong>
          <span className={styles.kpiMeta}>waiting, active або delayed</span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Завершені</span>
          <strong className={styles.kpiValue}>{metrics.completed}</strong>
          <span className={styles.kpiMeta}>
            completed jobs у локальному центрі
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Помилки</span>
          <strong className={styles.kpiValue}>{metrics.failed}</strong>
          <span className={styles.kpiMeta}>
            failed jobs, які потребують уваги
          </span>
        </article>
        <article className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Повторний запуск</span>
          <strong className={styles.kpiValue}>{metrics.retryable}</strong>
          <span className={styles.kpiMeta}>
            payload збережено локально для retry
          </span>
        </article>
      </section>

      <div className={styles.workspace}>
        <section className={styles.formsRail}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Операції</span>
                <h3 className={styles.sectionTitle}>Створити новий job</h3>
              </div>
            </div>

            <form className={styles.operationCard} onSubmit={handleParseLaw}>
              <div className={styles.operationTitleRow}>
                <Database size={15} />
                <strong>Парсинг закону</strong>
              </div>
              <p className={styles.operationHint}>
                Підходить для URL із `zakon.rada.gov.ua` або коду закону.
              </p>
              <input
                className={styles.input}
                value={parseUrl}
                onChange={(event) => setParseUrl(event.target.value)}
                placeholder="Напр. 580-19 або повний URL"
              />
              <button
                type="submit"
                className={styles.actionBtn}
                disabled={submittingTask === "parse-law"}
              >
                <Play size={14} />
                Запустити
              </button>
            </form>

            <form
              className={styles.operationCard}
              onSubmit={handleAnalyzeSubjects}
            >
              <div className={styles.operationTitleRow}>
                <Search size={15} />
                <strong>Аналіз суб&apos;єктів</strong>
              </div>
              <p className={styles.operationHint}>
                Довга задача для SRL/LLM аналізу елементів конкретного закону.
              </p>
              <input
                className={styles.input}
                value={analyzeLawId}
                onChange={(event) => setAnalyzeLawId(event.target.value)}
                placeholder="MongoDB lawId"
              />
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={analyzeForce}
                  onChange={(event) => setAnalyzeForce(event.target.checked)}
                />
                <span>force re-run для вже оброблених елементів</span>
              </label>
              <button
                type="submit"
                className={styles.actionBtn}
                disabled={submittingTask === "analyze-subjects"}
              >
                <Play size={14} />
                Запустити
              </button>
            </form>

            <form className={styles.operationCard} onSubmit={handleBatchUpdate}>
              <div className={styles.operationTitleRow}>
                <Wrench size={15} />
                <strong>Batch update law tree</strong>
              </div>
              <p className={styles.operationHint}>
                Масовий re-ingest до 100 кодів. Один код на рядок або через
                кому.
              </p>
              <textarea
                className={styles.textarea}
                rows={6}
                value={batchCodesInput}
                onChange={(event) => setBatchCodesInput(event.target.value)}
                placeholder={"254к/96-вр\n580-19\n1700-18"}
              />
              <div className={styles.operationFootnote}>
                {parseCodesInput(batchCodesInput).length} кодів підготовлено
              </div>
              <button
                type="submit"
                className={styles.actionBtn}
                disabled={submittingTask === "batch-update-law-tree"}
              >
                <Play size={14} />
                Запустити
              </button>
            </form>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Lookup</span>
                <h3 className={styles.sectionTitle}>Підтягнути існуючий job</h3>
              </div>
            </div>
            <form className={styles.lookupForm} onSubmit={handleLookupJob}>
              <input
                className={styles.input}
                value={lookupJobId}
                onChange={(event) => setLookupJobId(event.target.value)}
                placeholder="Вставте jobId з логів або Swagger"
              />
              <button
                type="submit"
                className={styles.secondaryBtn}
                disabled={isRefreshingAll}
              >
                <Search size={14} />
                Перевірити статус
              </button>
            </form>
          </article>
        </section>

        <section className={styles.feedPanel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.sectionEyebrow}>Job stream</span>
              <h3 className={styles.sectionTitle}>Черга задач</h3>
            </div>
            <select
              className={styles.select}
              value={scope}
              onChange={(event) => setScope(event.target.value as ScopeFilter)}
            >
              <option value="all">Усі jobs</option>
              <option value="live">Активні</option>
              <option value="completed">Завершені</option>
              <option value="failed">Помилки</option>
            </select>
          </div>

          {filteredJobs.length ? (
            <div className={styles.jobsList}>
              {filteredJobs.map((job) => {
                const progress = normalizeProgress(job.status);
                const selected = job.localId === selectedJobId;
                const failed = job.status?.state === "failed";
                const completed = job.status?.state === "completed";

                return (
                  <button
                    key={job.localId}
                    type="button"
                    className={`${styles.jobItem} ${selected ? styles.jobItemActive : ""}`}
                    onClick={() => setSelectedJobId(job.localId)}
                  >
                    <div className={styles.jobItemTop}>
                      <div>
                        <span className={styles.jobItemQueue}>{job.queue}</span>
                        <strong className={styles.jobItemTitle}>
                          {job.label}
                        </strong>
                      </div>
                      <span
                        className={`${styles.stateBadge} ${
                          failed
                            ? styles.stateFailed
                            : completed
                              ? styles.stateCompleted
                              : styles.stateLive
                        }`}
                      >
                        {failed ? (
                          <AlertTriangle size={12} />
                        ) : completed ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock3 size={12} />
                        )}
                        {stateLabel(job.status?.state)}
                      </span>
                    </div>

                    <p className={styles.jobSummary}>{job.summary}</p>

                    <div className={styles.progressTrack}>
                      <span
                        className={styles.progressFill}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className={styles.jobMeta}>
                      <span>{job.jobId}</span>
                      <span>·</span>
                      <span>{formatRelativeTime(job.createdAt)}</span>
                      <span>·</span>
                      <span>{progress}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              Поки що немає job для цього фільтра. Запустіть задачу або
              імпортуйте існуючий `jobId`.
            </div>
          )}
        </section>

        <aside className={styles.detailRail}>
          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Деталі</span>
                <h3 className={styles.sectionTitle}>Обраний job</h3>
              </div>
            </div>

            {selectedJob ? (
              <div className={styles.detailBody}>
                <div className={styles.detailHeader}>
                  <div>
                    <strong className={styles.detailTitle}>
                      {selectedJob.label}
                    </strong>
                    <span className={styles.detailQueue}>
                      {selectedJob.queue}
                    </span>
                  </div>
                  <span className={styles.detailState}>
                    {stateLabel(selectedJob.status?.state)}
                  </span>
                </div>

                <div className={styles.detailGrid}>
                  <div className={styles.metricRow}>
                    <span>Job ID</span>
                    <strong>{selectedJob.jobId}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Створено</span>
                    <strong>{formatDateFull(selectedJob.createdAt)}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Остання перевірка</span>
                    <strong>
                      {selectedJob.lastCheckedAt
                        ? formatDateShort(selectedJob.lastCheckedAt)
                        : "—"}
                    </strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Спроб</span>
                    <strong>{selectedJob.status?.attemptsMade ?? 0}</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Прогрес</span>
                    <strong>{normalizeProgress(selectedJob.status)}%</strong>
                  </div>
                  <div className={styles.metricRow}>
                    <span>Резюме</span>
                    <strong>{selectedJob.summary}</strong>
                  </div>
                </div>

                <div className={styles.detailActions}>
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() => void mergeStatuses([selectedJob])}
                  >
                    <RefreshCw size={14} />
                    Оновити status
                  </button>
                  <button
                    type="button"
                    className={styles.actionBtn}
                    disabled={
                      !selectedJob.payload ||
                      submittingTask === selectedJob.task
                    }
                    onClick={() => void handleRetry(selectedJob)}
                  >
                    <RotateCcw size={14} />
                    Повторити job
                  </button>
                </div>

                <div className={styles.detailSection}>
                  <span className={styles.detailLabel}>
                    Результат / returnvalue
                  </span>
                  <pre className={styles.codeBlock}>
                    {stringifyResult(selectedJob.status?.returnvalue)}
                  </pre>
                </div>

                <div className={styles.detailSection}>
                  <span className={styles.detailLabel}>
                    Помилка / failedReason
                  </span>
                  <pre className={styles.codeBlock}>
                    {selectedJob.statusError ||
                      selectedJob.status?.failedReason ||
                      "Помилок не зафіксовано."}
                  </pre>
                </div>
              </div>
            ) : (
              <div className={styles.emptyState}>
                Оберіть job зі списку, щоб побачити прогрес, результат та
                причину помилки.
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>Runbook</span>
                <h3 className={styles.sectionTitle}>Що тут можна робити</h3>
              </div>
            </div>
            <div className={styles.runbookList}>
              <div className={styles.runbookItem}>
                <CheckCircle2 size={14} />
                <span>
                  Запускати parse-law, analyze-subjects і batch update без
                  Swagger.
                </span>
              </div>
              <div className={styles.runbookItem}>
                <CheckCircle2 size={14} />
                <span>
                  Відстежувати зовнішні jobId, якщо задачу створили в іншому
                  місці.
                </span>
              </div>
              <div className={styles.runbookItem}>
                <CheckCircle2 size={14} />
                <span>
                  Бачити attempts, progress, failedReason і returnvalue в одному
                  екрані.
                </span>
              </div>
              <div className={styles.runbookItem}>
                <CheckCircle2 size={14} />
                <span>
                  Повторно ставити job у чергу на основі збереженого payload.
                </span>
              </div>
            </div>
            <div className={styles.runbookFooter}>
              Для глобального списку всіх jobs у системі в майбутньому
              знадобиться окремий backend endpoint-реєстр черги.
            </div>
          </article>
        </aside>
      </div>
    </section>
  );
}
