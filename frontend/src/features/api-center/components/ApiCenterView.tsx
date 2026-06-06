"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Braces,
  ExternalLink,
  FileCode2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { createApiCenterModel } from "../lib/normalizeOpenApi";
import type {
  ApiCenterPayload,
  ApiEndpointRecord,
  ApiSecurityMode,
} from "../types";
import styles from "./ApiCenterView.module.scss";

type MethodFilter = "all" | ApiEndpointRecord["method"];
type SecurityFilter = "all" | ApiSecurityMode;

const METHOD_FILTERS: MethodFilter[] = [
  "all",
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
];
const SECURITY_LABELS: Record<SecurityFilter, string> = {
  all: "Усі",
  public: "Публічні",
  optional: "Опціональна auth",
  protected: "Потрібен токен",
};

function formatFetchedAt(value: string) {
  return new Intl.DateTimeFormat("uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getMethodClass(method: ApiEndpointRecord["method"]) {
  switch (method) {
    case "GET":
      return styles.methodGet;
    case "POST":
      return styles.methodPost;
    case "PUT":
      return styles.methodPut;
    case "PATCH":
      return styles.methodPatch;
    case "DELETE":
      return styles.methodDelete;
    default:
      return "";
  }
}

function securityChipClass(security: ApiSecurityMode) {
  switch (security) {
    case "protected":
      return styles.chipProtected;
    case "optional":
      return styles.chipOptional;
    default:
      return styles.chipPublic;
  }
}

function securityText(security: ApiSecurityMode) {
  switch (security) {
    case "protected":
      return "Потрібен Bearer token";
    case "optional":
      return "Гість або Bearer token";
    default:
      return "Публічний доступ";
  }
}

function compact(value: string) {
  return value.length > 160 ? `${value.slice(0, 157)}…` : value;
}

export function ApiCenterView({ payload }: { payload: ApiCenterPayload }) {
  const model = useMemo(
    () => createApiCenterModel(payload.spec),
    [payload.spec],
  );
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [securityFilter, setSecurityFilter] = useState<SecurityFilter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredEndpoints = useMemo(() => {
    const term = search.trim().toLowerCase();

    return model.endpoints.filter((endpoint) => {
      if (moduleFilter !== "all" && endpoint.group !== moduleFilter) {
        return false;
      }

      if (methodFilter !== "all" && endpoint.method !== methodFilter) {
        return false;
      }

      if (securityFilter !== "all" && endpoint.security !== securityFilter) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        endpoint.path,
        endpoint.summary,
        endpoint.description,
        endpoint.group,
        endpoint.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [methodFilter, model.endpoints, moduleFilter, search, securityFilter]);

  useEffect(() => {
    if (!filteredEndpoints.length) {
      setSelectedId(null);
      return;
    }

    setSelectedId((current) =>
      current && filteredEndpoints.some((endpoint) => endpoint.id === current)
        ? current
        : (filteredEndpoints[0]?.id ?? null),
    );
  }, [filteredEndpoints]);

  const selectedEndpoint =
    filteredEndpoints.find((endpoint) => endpoint.id === selectedId) ??
    filteredEndpoints[0] ??
    null;

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroTop}>
          <div>
            <div className={styles.eyebrow}>
              <Sparkles size={14} />
              API Center
            </div>
            <h1 className={styles.title}>Документація та контроль API</h1>
            <p className={styles.subtitle}>
              Єдиний центр для Swagger, OpenAPI JSON, схем, маршрутів і швидкого
              технічного огляду backend surface без виходу з адмінки.
            </p>
          </div>

          <div className={styles.heroActions}>
            <a
              className={styles.primaryAction}
              href={payload.swaggerUrl}
              target="_blank"
              rel="noreferrer"
            >
              <BookOpen size={16} />
              Відкрити Swagger
            </a>
            <a
              className={styles.secondaryAction}
              href={payload.openApiUrl}
              target="_blank"
              rel="noreferrer"
            >
              <FileCode2 size={16} />
              OpenAPI JSON
            </a>
          </div>
        </div>

        <div className={styles.heroMeta}>
          <span className={styles.metaChip}>
            <Workflow size={14} />
            {payload.spec?.info?.title ?? "Low Analysis API"}
          </span>
          <span className={styles.metaChip}>
            <Braces size={14} />
            Version {payload.spec?.info?.version ?? "n/a"}
          </span>
          <span className={styles.metaChip}>
            <ShieldCheck size={14} />
            Source: {payload.backendBaseUrl}
          </span>
          <span className={styles.metaChip}>
            <ExternalLink size={14} />
            Оновлено {formatFetchedAt(payload.fetchedAt)}
          </span>
        </div>
      </header>

      {payload.error && (
        <section className={styles.warningBanner}>
          <div className={styles.warningTitle}>
            <AlertTriangle size={16} />
            Swagger потребує уваги
          </div>
          <div>{payload.error}</div>
        </section>
      )}

      <section className={styles.metrics}>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <Workflow size={14} />
            Endpoint-ів
          </div>
          <div className={styles.metricValue}>{model.endpoints.length}</div>
          <div className={styles.metricMeta}>
            Усі маршрути, що потрапили в OpenAPI.
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <BookOpen size={14} />
            Модулі
          </div>
          <div className={styles.metricValue}>{model.modules.length}</div>
          <div className={styles.metricMeta}>Групи з tags у Swagger.</div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <Lock size={14} />
            Захищені
          </div>
          <div className={styles.metricValue}>
            {model.protectedCount + model.optionalCount}
          </div>
          <div className={styles.metricMeta}>
            {model.protectedCount} strict + {model.optionalCount} optional auth.
          </div>
        </article>
        <article className={styles.metricCard}>
          <div className={styles.metricLabel}>
            <Braces size={14} />
            Схеми
          </div>
          <div className={styles.metricValue}>{model.schemaCount}</div>
          <div className={styles.metricMeta}>
            components.schemas у поточному OpenAPI JSON.
          </div>
        </article>
      </section>

      <section className={styles.workspace}>
        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.eyebrow}>Модулі</div>
              <h2 className={styles.panelTitle}>API surface</h2>
              <p className={styles.panelSubtitle}>
                Швидка навігація по групах endpoint-ів із кількістю маршрутів і
                захищених викликів.
              </p>
            </div>
            <div className={styles.countBadge}>{model.modules.length}</div>
          </div>

          <div className={styles.moduleList}>
            <button
              type="button"
              className={`${styles.moduleButton} ${moduleFilter === "all" ? styles.moduleButtonActive : ""}`}
              onClick={() => setModuleFilter("all")}
            >
              <div className={styles.moduleTop}>
                <span className={styles.moduleName}>Усі endpoint-и</span>
                <span className={styles.moduleCount}>
                  {model.endpoints.length}
                </span>
              </div>
              <div className={styles.moduleDescription}>
                Повний список маршрутів зі Swagger-специфікації.
              </div>
              <div className={styles.moduleMeta}>
                Public: {model.publicCount} · Auth:{" "}
                {model.protectedCount + model.optionalCount}
              </div>
            </button>

            {model.modules.map((module) => (
              <button
                key={module.name}
                type="button"
                className={`${styles.moduleButton} ${moduleFilter === module.name ? styles.moduleButtonActive : ""}`}
                onClick={() => setModuleFilter(module.name)}
              >
                <div className={styles.moduleTop}>
                  <span className={styles.moduleName}>{module.name}</span>
                  <span className={styles.moduleCount}>{module.count}</span>
                </div>
                <div className={styles.moduleDescription}>
                  {module.description}
                </div>
                <div className={styles.moduleMeta}>
                  Захищених викликів: {module.protectedCount}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.eyebrow}>Маршрути</div>
              <h2 className={styles.panelTitle}>Список endpoint-ів</h2>
              <p className={styles.panelSubtitle}>
                Пошук по path, summary та tags. Фільтри не змінюють backend,
                лише допомагають швидко читати специфікацію.
              </p>
            </div>
            <div className={styles.countBadge}>{filteredEndpoints.length}</div>
          </div>

          <div className={styles.filters}>
            <div className={styles.searchRow}>
              <label className={styles.searchField}>
                <Search size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Пошук за path, summary або tag..."
                />
              </label>
            </div>

            <div className={styles.filterGrid}>
              <label className={styles.selectField}>
                <span className={styles.selectLabel}>Метод</span>
                <select
                  value={methodFilter}
                  onChange={(event) =>
                    setMethodFilter(event.target.value as MethodFilter)
                  }
                >
                  {METHOD_FILTERS.map((value) => (
                    <option key={value} value={value}>
                      {value === "all" ? "Усі методи" : value}
                    </option>
                  ))}
                </select>
              </label>

              <label className={styles.selectField}>
                <span className={styles.selectLabel}>Доступ</span>
                <select
                  value={securityFilter}
                  onChange={(event) =>
                    setSecurityFilter(event.target.value as SecurityFilter)
                  }
                >
                  {Object.entries(SECURITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={styles.endpointList}>
            {filteredEndpoints.length === 0 ? (
              <div className={styles.emptyState}>
                <p className={styles.emptyTitle}>Нічого не знайдено</p>
                <p className={styles.emptyText}>
                  Спробуйте скинути фільтри або змінити пошуковий запит.
                </p>
              </div>
            ) : (
              filteredEndpoints.map((endpoint) => (
                <button
                  key={endpoint.id}
                  type="button"
                  className={`${styles.endpointCard} ${selectedEndpoint?.id === endpoint.id ? styles.endpointCardActive : ""}`}
                  onClick={() => setSelectedId(endpoint.id)}
                >
                  <div className={styles.endpointTop}>
                    <span
                      className={`${styles.methodBadge} ${getMethodClass(endpoint.method)}`}
                    >
                      {endpoint.method}
                    </span>
                    <span
                      className={`${styles.chip} ${securityChipClass(endpoint.security)}`}
                    >
                      {securityText(endpoint.security)}
                    </span>
                  </div>

                  <p className={styles.endpointPath}>{endpoint.path}</p>
                  <p className={styles.endpointSummary}>{endpoint.summary}</p>
                  <p className={styles.endpointDescription}>
                    {compact(endpoint.description)}
                  </p>

                  <div className={styles.chipRow}>
                    <span className={styles.chip}>Tag: {endpoint.group}</span>
                    <span className={styles.chip}>
                      Params: {endpoint.parameterCount}
                    </span>
                    <span className={styles.chip}>
                      Responses: {endpoint.responseCodes.join(", ")}
                    </span>
                    {endpoint.hasRequestBody && (
                      <span className={styles.chip}>
                        Body{" "}
                        {endpoint.requestBodyRequired ? "required" : "optional"}
                      </span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.eyebrow}>Деталі</div>
              <h2 className={styles.panelTitle}>Endpoint inspector</h2>
              <p className={styles.panelSubtitle}>
                Summary, auth, params, body та response-коди для вибраного
                маршруту.
              </p>
            </div>
            <div className={styles.countBadge}>
              {selectedEndpoint ? selectedEndpoint.method : "—"}
            </div>
          </div>

          {!selectedEndpoint ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Оберіть endpoint</p>
              <p className={styles.emptyText}>
                Клікніть по маршруту в центральному списку, щоб подивитися його
                структуру детальніше.
              </p>
            </div>
          ) : (
            <div className={styles.detailBody}>
              <div className={styles.detailHeadline}>
                <span
                  className={`${styles.methodBadge} ${getMethodClass(selectedEndpoint.method)}`}
                >
                  {selectedEndpoint.method}
                </span>
                <p className={styles.endpointPath}>{selectedEndpoint.path}</p>
                <p className={styles.endpointSummary}>
                  {selectedEndpoint.summary}
                </p>
                <p className={styles.detailText}>
                  {selectedEndpoint.description}
                </p>
              </div>

              <div className={styles.chipRow}>
                {selectedEndpoint.tags.map((tag) => (
                  <span key={tag} className={styles.chip}>
                    {tag}
                  </span>
                ))}
                <span
                  className={`${styles.chip} ${securityChipClass(selectedEndpoint.security)}`}
                >
                  {securityText(selectedEndpoint.security)}
                </span>
                {selectedEndpoint.deprecated && (
                  <span className={styles.chip}>Deprecated</span>
                )}
              </div>

              <div className={styles.detailGrid}>
                <article className={styles.detailCard}>
                  <span className={styles.detailLabel}>Parameters</span>
                  {selectedEndpoint.operation.parameters?.length ? (
                    <ul className={styles.list}>
                      {selectedEndpoint.operation.parameters.map(
                        (parameter) => (
                          <li key={`${parameter.in}:${parameter.name}`}>
                            <strong>{parameter.name}</strong>
                            {parameter.in ? ` · ${parameter.in}` : ""}
                            {parameter.required ? " · required" : ""}
                            {parameter.schema?.type
                              ? ` · ${parameter.schema.type}`
                              : ""}
                            {parameter.description
                              ? ` — ${parameter.description}`
                              : ""}
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className={styles.detailText}>Параметри не вказані.</p>
                  )}
                </article>

                <article className={styles.detailCard}>
                  <span className={styles.detailLabel}>Request body</span>
                  {selectedEndpoint.operation.requestBody ? (
                    <>
                      <p className={styles.detailText}>
                        {selectedEndpoint.requestBodyRequired
                          ? "Body є обов’язковим для цього виклику."
                          : "Body підтримується, але не позначений як required."}
                      </p>
                      <p className={styles.detailMono}>
                        {Object.keys(
                          selectedEndpoint.operation.requestBody.content ?? {},
                        ).join(", ") || "Content types не вказані"}
                      </p>
                    </>
                  ) : (
                    <p className={styles.detailText}>
                      Body для цього endpoint-а не описаний.
                    </p>
                  )}
                </article>

                <article className={styles.detailCard}>
                  <span className={styles.detailLabel}>Responses</span>
                  {selectedEndpoint.responseCodes.length ? (
                    <ul className={styles.list}>
                      {selectedEndpoint.responseCodes.map((statusCode) => {
                        const response =
                          selectedEndpoint.operation.responses?.[statusCode];
                        return (
                          <li key={statusCode}>
                            <strong>{statusCode}</strong>
                            {response?.description
                              ? ` — ${response.description}`
                              : ""}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className={styles.detailText}>
                      Response-коди не вказані.
                    </p>
                  )}
                </article>

                <article className={styles.detailCard}>
                  <span className={styles.detailLabel}>Links</span>
                  <p className={styles.detailMono}>
                    Swagger UI: {payload.swaggerUrl}
                  </p>
                  <p className={styles.detailMono}>
                    OpenAPI JSON: {payload.openApiUrl}
                  </p>
                </article>
              </div>
            </div>
          )}
        </aside>
      </section>
    </section>
  );
}
