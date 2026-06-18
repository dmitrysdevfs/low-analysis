"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Braces,
  Check,
  Copy,
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

function generateCurl(endpoint: ApiEndpointRecord, baseUrl: string): string {
  const qParams =
    (
      endpoint.operation.parameters as
        | Array<{ in: string; name: string; schema?: { type?: string } }>
        | undefined
    )?.filter((p) => p.in === "query") ?? [];

  const qs = qParams.length
    ? "?" +
      qParams.map((p) => `${p.name}=<${p.schema?.type ?? "value"}>`).join("&")
    : "";

  const parts: string[] = [`curl -X ${endpoint.method} \\`];
  parts.push(`  '${baseUrl}${endpoint.path}${qs}' \\`);
  if (endpoint.security !== "public") {
    parts.push(`  -H 'Authorization: Bearer YOUR_TOKEN' \\`);
  }
  if (endpoint.hasRequestBody) {
    parts.push(`  -H 'Content-Type: application/json' \\`);
    parts.push(`  -d '{}'`);
  } else {
    parts[parts.length - 1] = parts[parts.length - 1].replace(/ \\$/, "");
  }
  return parts.join("\n");
}

function generateJs(endpoint: ApiEndpointRecord, baseUrl: string): string {
  const needsAuth = endpoint.security !== "public";
  const hasBody = endpoint.hasRequestBody;
  const lines = [
    `const response = await fetch('${baseUrl}${endpoint.path}', {`,
    `  method: '${endpoint.method}',`,
    `  headers: {`,
  ];
  if (needsAuth) lines.push(`    'Authorization': 'Bearer YOUR_TOKEN',`);
  if (hasBody) lines.push(`    'Content-Type': 'application/json',`);
  lines.push(`  },`);
  if (hasBody) lines.push(`  body: JSON.stringify({}),`);
  lines.push(`});`);
  lines.push(`const data = await response.json();`);
  return lines.join("\n");
}

function buildSchemaExample(schema: Record<string, unknown>): unknown {
  if (schema.example !== undefined) return schema.example;
  if (schema.type === "object" && schema.properties) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(
      schema.properties as Record<string, Record<string, unknown>>,
    )) {
      out[k] = buildSchemaExample(v);
    }
    return out;
  }
  if (schema.type === "string")
    return Array.isArray(schema.enum) ? (schema.enum[0] as string) : "string";
  if (schema.type === "integer" || schema.type === "number") return 0;
  if (schema.type === "boolean") return false;
  if (schema.type === "array") return [];
  return null;
}

function generateJsonExample(endpoint: ApiEndpointRecord): string {
  const rb = endpoint.operation.requestBody as
    | {
        content?: Record<string, { schema?: Record<string, unknown> }>;
      }
    | undefined;
  if (!rb) return "// No request body for this endpoint";
  const schema = rb.content?.["application/json"]?.schema;
  if (!schema) return "// Schema not defined in OpenAPI spec";
  return JSON.stringify(buildSchemaExample(schema), null, 2);
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
  const [moduleSearch, setModuleSearch] = useState("");
  const [inspectorTab, setInspectorTab] = useState<"curl" | "js" | "json">(
    "curl",
  );
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    setTimeout(
      () => setCopiedKey((prev) => (prev === key ? null : prev)),
      2000,
    );
  }

  const filteredModules = useMemo(() => {
    const term = moduleSearch.trim().toLowerCase();
    if (!term) return model.modules;
    return model.modules.filter((m) => m.name.toLowerCase().includes(term));
  }, [model.modules, moduleSearch]);

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

  useEffect(() => {
    setInspectorTab("curl");
  }, [selectedId]);

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
            <button
              type="button"
              className={styles.ghostAction}
              onClick={() => copyText(payload.backendBaseUrl, "baseUrl")}
            >
              {copiedKey === "baseUrl" ? (
                <Check size={16} />
              ) : (
                <Copy size={16} />
              )}
              {copiedKey === "baseUrl" ? "Скопійовано!" : "Base URL"}
            </button>
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

          <div className={styles.moduleSearch}>
            <label className={styles.searchField}>
              <Search size={13} />
              <input
                type="search"
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                placeholder="Пошук модуля..."
              />
            </label>
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
              <div className={styles.moduleMeta}>
                Public: {model.publicCount} · Auth:{" "}
                {model.protectedCount + model.optionalCount}
              </div>
            </button>

            {filteredModules.map((module) => (
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
                <div className={styles.moduleMeta}>
                  {module.protectedCount} захищених
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
                <span className={styles.selectLabel}>Auth</span>
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

              <label className={styles.selectField}>
                <span className={styles.selectLabel}>Модуль</span>
                <select
                  value={moduleFilter}
                  onChange={(event) => setModuleFilter(event.target.value)}
                >
                  <option value="all">Усі модулі</option>
                  {model.modules.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
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
                  className={`${styles.endpointRow} ${selectedEndpoint?.id === endpoint.id ? styles.endpointRowActive : ""}`}
                  onClick={() => setSelectedId(endpoint.id)}
                >
                  <span
                    className={`${styles.methodBadge} ${getMethodClass(endpoint.method)}`}
                  >
                    {endpoint.method}
                  </span>
                  <div className={styles.rowMain}>
                    <code className={styles.rowPath}>{endpoint.path}</code>
                    <span className={styles.rowSummary}>
                      {endpoint.summary}
                    </span>
                  </div>
                  <span className={styles.rowTag}>{endpoint.group}</span>
                  <span className={styles.rowParams}>
                    P:{endpoint.parameterCount}
                  </span>
                  <span className={styles.rowCodes}>
                    {endpoint.responseCodes.slice(0, 3).join(" ")}
                  </span>
                  <span
                    className={`${styles.rowSec} ${securityChipClass(endpoint.security)}`}
                  >
                    {endpoint.security === "protected"
                      ? "Auth"
                      : endpoint.security === "optional"
                        ? "Opt"
                        : "Pub"}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <aside className={styles.inspectorPanel}>
          <div className={styles.panelHeader}>
            <div>
              <div className={styles.eyebrow}>Деталі</div>
              <h2 className={styles.panelTitle}>Endpoint inspector</h2>
            </div>
            <div className={styles.countBadge}>
              {selectedEndpoint ? selectedEndpoint.method : "—"}
            </div>
          </div>

          {!selectedEndpoint ? (
            <div className={styles.emptyState}>
              <p className={styles.emptyTitle}>Оберіть endpoint</p>
              <p className={styles.emptyText}>
                Клікніть по маршруту в центральному списку.
              </p>
            </div>
          ) : (
            <div className={styles.inspBody}>
              <div className={styles.inspHead}>
                <span
                  className={`${styles.methodBadge} ${getMethodClass(selectedEndpoint.method)}`}
                >
                  {selectedEndpoint.method}
                </span>
                <code className={styles.inspPath}>{selectedEndpoint.path}</code>
                <span
                  className={`${styles.chip} ${securityChipClass(selectedEndpoint.security)}`}
                >
                  {securityText(selectedEndpoint.security)}
                </span>
              </div>

              <section className={styles.inspSection}>
                <div className={styles.inspSectionTitle}>ПАРАМЕТРИ ЗАПИТУ</div>
                {selectedEndpoint.operation.parameters?.length ? (
                  <table className={styles.paramTable}>
                    <thead>
                      <tr>
                        <th>Параметр</th>
                        <th>Тип</th>
                        <th>Опис</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedEndpoint.operation.parameters.map((p) => (
                        <tr key={`${p.in}:${p.name}`}>
                          <td>
                            <code>{p.name}</code>
                            {p.required && (
                              <span className={styles.reqStar}>*</span>
                            )}
                          </td>
                          <td className={styles.paramType}>
                            {p.schema?.type ?? "—"}
                          </td>
                          <td className={styles.paramDesc}>
                            {p.description ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className={styles.inspEmpty}>Параметри відсутні.</p>
                )}
              </section>

              <section className={styles.inspSection}>
                <div className={styles.inspSectionTitle}>REQUEST BODY</div>
                {selectedEndpoint.operation.requestBody ? (
                  <p className={styles.inspText}>
                    {selectedEndpoint.requestBodyRequired
                      ? "Body обов’язковий. "
                      : "Body опціональний. "}
                    <code className={styles.inlineCode}>
                      {Object.keys(
                        (
                          selectedEndpoint.operation.requestBody as {
                            content?: Record<string, unknown>;
                          }
                        ).content ?? {},
                      ).join(", ") || "application/json"}
                    </code>
                  </p>
                ) : (
                  <p className={styles.inspEmpty}>
                    Тіло запиту не використовується.
                  </p>
                )}
              </section>

              <section className={styles.inspSection}>
                <div className={styles.inspSectionTitle}>ВІДПОВІДІ</div>
                <div className={styles.responseList}>
                  {selectedEndpoint.responseCodes.map((code) => {
                    const resp = (
                      selectedEndpoint.operation.responses as Record<
                        string,
                        { description?: string }
                      >
                    )?.[code];
                    const cat = code.startsWith("2")
                      ? styles.resp2xx
                      : code.startsWith("4")
                        ? styles.resp4xx
                        : styles.resp5xx;
                    return (
                      <div key={code} className={styles.responseRow}>
                        <span className={`${styles.respCode} ${cat}`}>
                          {code}
                        </span>
                        <span className={styles.respDesc}>
                          {resp?.description ?? "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={styles.inspSection}>
                <div className={styles.inspSectionHeader}>
                  <span className={styles.inspSectionTitle}>
                    ПРИКЛАД ЗАПИТУ
                  </span>
                  <div className={styles.codeTabs}>
                    {(["curl", "js", "json"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        className={`${styles.codeTab} ${inspectorTab === tab ? styles.codeTabActive : ""}`}
                        onClick={() => setInspectorTab(tab)}
                      >
                        {tab === "curl"
                          ? "cURL"
                          : tab === "js"
                            ? "JavaScript"
                            : "JSON"}
                      </button>
                    ))}
                    <button
                      type="button"
                      className={styles.copyInline}
                      onClick={() => {
                        const code =
                          inspectorTab === "curl"
                            ? generateCurl(
                                selectedEndpoint,
                                payload.backendBaseUrl,
                              )
                            : inspectorTab === "js"
                              ? generateJs(
                                  selectedEndpoint,
                                  payload.backendBaseUrl,
                                )
                              : generateJsonExample(selectedEndpoint);
                        copyText(code, `code`);
                      }}
                    >
                      {copiedKey === "code" ? (
                        <Check size={11} />
                      ) : (
                        <Copy size={11} />
                      )}
                      {copiedKey === "code" ? "Скопійовано" : "Копіювати"}
                    </button>
                  </div>
                </div>
                <div className={styles.codeBlock}>
                  <pre>
                    {inspectorTab === "curl"
                      ? generateCurl(selectedEndpoint, payload.backendBaseUrl)
                      : inspectorTab === "js"
                        ? generateJs(selectedEndpoint, payload.backendBaseUrl)
                        : generateJsonExample(selectedEndpoint)}
                  </pre>
                </div>
              </section>

              <section className={styles.inspSection}>
                <div className={styles.inspSectionTitle}>ПОСИЛАННЯ</div>
                <div className={styles.linksList}>
                  <a
                    href={payload.swaggerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inspLink}
                  >
                    <ExternalLink size={12} />
                    Swagger UI — Відкрити Swagger
                  </a>
                  <a
                    href={payload.openApiUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.inspLink}
                  >
                    <FileCode2 size={12} />
                    OpenAPI JSON — Завантажити JSON
                  </a>
                </div>
              </section>
            </div>
          )}
        </aside>
      </section>

      <div className={styles.opsStrip}>
        <div className={styles.opsSection}>
          <span className={styles.opsSectionTitle}>ПОЛІТИКА АВТОРИЗАЦІЇ</span>
          <p className={styles.opsSectionValue}>
            <Lock size={11} />
            Bearer token (JWT)
          </p>
          <p className={styles.opsSectionSub}>
            Передавайте токен у заголовку Authorization.
          </p>
        </div>

        <div className={styles.opsSection}>
          <span className={styles.opsSectionTitle}>ЛІМІТИ ЗАПИТІВ</span>
          <p className={styles.opsSectionValue}>100 запитів/хв на IP</p>
          <p className={styles.opsSectionSub}>
            Базовий ліміт. Може бути змінено.
          </p>
        </div>

        <div className={styles.opsSection}>
          <span className={styles.opsSectionTitle}>СЕРЕДОВИЩЕ</span>
          <p className={styles.opsSectionValue}>
            <span className={styles.greenDot} />
            Production
          </p>
          <p className={styles.opsSectionSub}>{payload.backendBaseUrl}</p>
        </div>

        <div className={styles.opsSection}>
          <span className={styles.opsSectionTitle}>КОМПОНЕНТИ ТА СХЕМИ</span>
          <p className={styles.opsSectionValue}>
            <Braces size={11} />
            {model.schemaCount} схем компонентів
          </p>
          <a
            href={payload.openApiUrl}
            target="_blank"
            rel="noreferrer"
            className={styles.opsLink}
          >
            Переглянути schemas
          </a>
        </div>

        <div className={styles.opsSection}>
          <span className={styles.opsSectionTitle}>ШВИДКІ ДІЇ</span>
          <div className={styles.opsActions}>
            <button
              type="button"
              className={styles.opsActionBtn}
              onClick={() => copyText("Bearer test-token-dev-123", "testToken")}
            >
              {copiedKey === "testToken" ? (
                <Check size={11} />
              ) : (
                <Copy size={11} />
              )}
              {copiedKey === "testToken" ? "Скопійовано" : "Тестовий токен"}
            </button>
            <a
              href={`${payload.backendBaseUrl}/health`}
              target="_blank"
              rel="noreferrer"
              className={styles.opsActionBtn}
            >
              <ShieldCheck size={11} />
              Перевірити статус API
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
