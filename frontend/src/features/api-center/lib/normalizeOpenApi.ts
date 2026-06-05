import type {
  ApiCenterModel,
  ApiEndpointRecord,
  ApiModuleSummary,
  ApiSecurityMode,
  HttpMethod,
  OpenApiOperation,
  OpenApiSpec,
} from "../types";

const METHODS: HttpMethod[] = ["get", "post", "put", "patch", "delete"];

export function getSecurityMode(
  security: OpenApiOperation["security"],
): ApiSecurityMode {
  if (!security || security.length === 0) {
    return "public";
  }

  const hasAnonymousVariant = security.some(
    (entry) => Object.keys(entry).length === 0,
  );
  const hasBearerVariant = security.some((entry) =>
    Object.keys(entry).includes("bearerAuth"),
  );

  if (hasAnonymousVariant && hasBearerVariant) {
    return "optional";
  }

  if (hasBearerVariant) {
    return "protected";
  }

  return "public";
}

export function createApiCenterModel(spec: OpenApiSpec | null): ApiCenterModel {
  if (!spec) {
    return {
      endpoints: [],
      modules: [],
      schemaCount: 0,
      protectedCount: 0,
      optionalCount: 0,
      publicCount: 0,
      tagDescriptions: {},
    };
  }

  const tagDescriptions = Object.fromEntries(
    (spec.tags ?? []).map((tag) => [tag.name, tag.description ?? ""]),
  );

  const endpoints: ApiEndpointRecord[] = [];

  for (const [path, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of METHODS) {
      const operation = pathItem?.[method];
      if (!operation) continue;

      const tags = operation.tags?.length ? operation.tags : ["General"];
      const group = tags[0] ?? "General";
      const summary = operation.summary?.trim() || `${method.toUpperCase()} ${path}`;
      const description =
        operation.description?.trim() ||
        "Опис для цього endpoint-а поки не вказано.";
      const security = getSecurityMode(operation.security);

      endpoints.push({
        id: `${method}:${path}`,
        method: method.toUpperCase() as Uppercase<HttpMethod>,
        path,
        summary,
        description,
        group,
        tags,
        security,
        parameterCount: operation.parameters?.length ?? 0,
        responseCodes: Object.keys(operation.responses ?? {}).sort(),
        hasRequestBody: Boolean(operation.requestBody),
        requestBodyRequired: Boolean(operation.requestBody?.required),
        deprecated: Boolean(operation.deprecated),
        operation,
      });
    }
  }

  endpoints.sort((left, right) => {
    if (left.group !== right.group) {
      return left.group.localeCompare(right.group);
    }

    if (left.path !== right.path) {
      return left.path.localeCompare(right.path);
    }

    return left.method.localeCompare(right.method);
  });

  const moduleMap = new Map<string, ApiModuleSummary>();

  for (const endpoint of endpoints) {
    const existing = moduleMap.get(endpoint.group);
    if (existing) {
      existing.count += 1;
      if (endpoint.security !== "public") {
        existing.protectedCount += 1;
      }
      continue;
    }

    moduleMap.set(endpoint.group, {
      name: endpoint.group,
      description:
        tagDescriptions[endpoint.group] ??
        "Опис модуля поки не додано до OpenAPI tags.",
      count: 1,
      protectedCount: endpoint.security === "public" ? 0 : 1,
    });
  }

  const protectedCount = endpoints.filter(
    (endpoint) => endpoint.security === "protected",
  ).length;
  const optionalCount = endpoints.filter(
    (endpoint) => endpoint.security === "optional",
  ).length;
  const publicCount = endpoints.filter(
    (endpoint) => endpoint.security === "public",
  ).length;

  return {
    endpoints,
    modules: [...moduleMap.values()].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    schemaCount: Object.keys(spec.components?.schemas ?? {}).length,
    protectedCount,
    optionalCount,
    publicCount,
    tagDescriptions,
  };
}
