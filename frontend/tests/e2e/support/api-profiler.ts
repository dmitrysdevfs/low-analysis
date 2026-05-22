import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

type EndpointCostHint = "light" | "medium" | "heavy" | "critical";

type RequestEvent = {
  method: string;
  rawPath: string;
  normalizedPath: string;
  costHint: EndpointCostHint;
  atMs: number;
};

export type ApiEndpointSummary = {
  key: string;
  method: string;
  endpoint: string;
  count: number;
  costHint: EndpointCostHint;
  firstSeenMs: number;
  lastSeenMs: number;
};

export type ApiScenarioMetrics = {
  scenario: string;
  totalRequests: number;
  generatedAt: string;
  endpoints: ApiEndpointSummary[];
  timeline: RequestEvent[];
};

const ENDPOINT_HINTS: Array<{
  test: (path: string) => boolean;
  normalized: string;
  costHint: EndpointCostHint;
}> = [
  {
    test: (requestPath) => requestPath === "/api/laws",
    normalized: "/api/laws",
    costHint: "light",
  },
  {
    test: (requestPath) =>
      requestPath.startsWith("/api/laws/") && requestPath.endsWith("/tree"),
    normalized: "/api/laws/:id/tree",
    costHint: "heavy",
  },
  {
    test: (requestPath) =>
      requestPath.startsWith("/api/laws/") && requestPath.endsWith("/stats"),
    normalized: "/api/laws/:id/stats",
    costHint: "medium",
  },
  {
    test: (requestPath) =>
      /^\/api\/laws\/[^/]+\/articles\/[^/]+$/u.test(requestPath),
    normalized: "/api/laws/:id/articles/:num",
    costHint: "medium",
  },
  {
    test: (requestPath) => requestPath === "/api/laws/parse",
    normalized: "/api/laws/parse",
    costHint: "critical",
  },
  {
    test: (requestPath) => requestPath === "/api/subjects",
    normalized: "/api/subjects",
    costHint: "light",
  },
  {
    test: (requestPath) =>
      /^\/api\/subjects\/[^/]+\/elements$/u.test(requestPath),
    normalized: "/api/subjects/:id/elements",
    costHint: "heavy",
  },
  {
    test: (requestPath) => /^\/api\/subjects\/[^/]+$/u.test(requestPath),
    normalized: "/api/subjects/:id",
    costHint: "medium",
  },
];

function normalizeRequest(method: string, rawPath: string, search: string) {
  const matched =
    ENDPOINT_HINTS.find((candidate) => candidate.test(rawPath)) ?? null;

  if (matched && matched.normalized === "/api/laws" && search) {
    return {
      endpoint: "/api/laws?q",
      costHint: matched.costHint,
    };
  }

  if (matched) {
    return {
      endpoint: matched.normalized,
      costHint: matched.costHint,
    };
  }

  return {
    endpoint: rawPath,
    costHint: "medium" as const,
  };
}

export class ApiRequestProfiler {
  private readonly startedAt = Date.now();

  private readonly events: RequestEvent[] = [];

  constructor(private readonly scenario: string) {}

  record(method: string, requestUrl: string) {
    const url = new URL(requestUrl);
    const { endpoint, costHint } = normalizeRequest(
      method.toUpperCase(),
      url.pathname,
      url.search,
    );

    this.events.push({
      method: method.toUpperCase(),
      rawPath: `${url.pathname}${url.search}`,
      normalizedPath: endpoint,
      costHint,
      atMs: Date.now() - this.startedAt,
    });
  }

  snapshot(): ApiScenarioMetrics {
    const aggregate = new Map<string, ApiEndpointSummary>();

    for (const event of this.events) {
      const key = `${event.method} ${event.normalizedPath}`;
      const existing = aggregate.get(key);

      if (!existing) {
        aggregate.set(key, {
          key,
          method: event.method,
          endpoint: event.normalizedPath,
          count: 1,
          costHint: event.costHint,
          firstSeenMs: event.atMs,
          lastSeenMs: event.atMs,
        });
        continue;
      }

      existing.count += 1;
      existing.lastSeenMs = event.atMs;
    }

    return {
      scenario: this.scenario,
      totalRequests: this.events.length,
      generatedAt: new Date().toISOString(),
      endpoints: [...aggregate.values()].sort((left, right) =>
        left.key.localeCompare(right.key, "uk"),
      ),
      timeline: [...this.events],
    };
  }
}

export async function writeApiMetricsReport(
  reportName: string,
  scenarios: ApiScenarioMetrics[],
) {
  const targetDirectory = path.resolve(
    process.cwd(),
    "test-results",
    "api-request-metrics",
  );
  await mkdir(targetDirectory, { recursive: true });
  const targetFile = path.join(targetDirectory, reportName);

  await writeFile(
    targetFile,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        scenarios,
      },
      null,
      2,
    ),
    "utf8",
  );

  return targetFile;
}
