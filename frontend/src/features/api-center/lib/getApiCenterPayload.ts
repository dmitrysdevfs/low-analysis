import "server-only";

import type { ApiCenterPayload, OpenApiSpec } from "../types";

const DEFAULT_BACKEND_URL = "https://low-analysis.onrender.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function resolveBackendBaseUrl() {
  const rawValue =
    process.env.API_PROXY_TARGET_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    DEFAULT_BACKEND_URL;

  return trimTrailingSlash(rawValue);
}

export async function getApiCenterPayload(): Promise<ApiCenterPayload> {
  const backendBaseUrl = resolveBackendBaseUrl();
  const swaggerUrl = `${backendBaseUrl}/api-docs`;
  const openApiUrl = `${backendBaseUrl}/api-docs.json`;

  try {
    const response = await fetch(openApiUrl, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        backendBaseUrl,
        swaggerUrl,
        openApiUrl,
        fetchedAt: new Date().toISOString(),
        spec: null,
        error: `OpenAPI JSON returned ${response.status} ${response.statusText}.`,
      };
    }

    const spec = (await response.json()) as OpenApiSpec;
    const pathCount = Object.keys(spec.paths ?? {}).length;

    return {
      backendBaseUrl,
      swaggerUrl,
      openApiUrl,
      fetchedAt: new Date().toISOString(),
      spec,
      error:
        pathCount === 0
          ? "Специфікація завантажилась, але не містить жодного path. Перевірте backend Swagger globs або cwd."
          : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Невідома помилка під час завантаження OpenAPI JSON.";

    return {
      backendBaseUrl,
      swaggerUrl,
      openApiUrl,
      fetchedAt: new Date().toISOString(),
      spec: null,
      error: `Не вдалося завантажити OpenAPI JSON: ${message}`,
    };
  }
}
