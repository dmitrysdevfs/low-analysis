export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export type ApiSecurityMode = "public" | "optional" | "protected";

export interface OpenApiTag {
  name: string;
  description?: string;
}

export interface OpenApiSchemaHint {
  type?: string;
  format?: string;
  enum?: unknown[];
  example?: unknown;
}

export interface OpenApiParameter {
  name: string;
  in?: string;
  required?: boolean;
  description?: string;
  schema?: OpenApiSchemaHint;
}

export interface OpenApiMediaType {
  schema?: unknown;
  example?: unknown;
  examples?: Record<string, unknown>;
}

export interface OpenApiRequestBody {
  required?: boolean;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiResponse {
  description?: string;
  content?: Record<string, OpenApiMediaType>;
}

export interface OpenApiInfo {
  title?: string;
  version?: string;
  description?: string;
}

export interface OpenApiOperation {
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: OpenApiParameter[];
  requestBody?: OpenApiRequestBody;
  responses?: Record<string, OpenApiResponse>;
  security?: Array<Record<string, string[]>>;
  deprecated?: boolean;
}

export type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>;

export interface OpenApiSpec {
  openapi?: string;
  info?: OpenApiInfo;
  tags?: OpenApiTag[];
  servers?: Array<{ url: string; description?: string }>;
  paths?: Record<string, OpenApiPathItem>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

export interface ApiEndpointRecord {
  id: string;
  method: Uppercase<HttpMethod>;
  path: string;
  summary: string;
  description: string;
  group: string;
  tags: string[];
  security: ApiSecurityMode;
  parameterCount: number;
  responseCodes: string[];
  hasRequestBody: boolean;
  requestBodyRequired: boolean;
  deprecated: boolean;
  operation: OpenApiOperation;
}

export interface ApiModuleSummary {
  name: string;
  description: string;
  count: number;
  protectedCount: number;
}

export interface ApiCenterModel {
  endpoints: ApiEndpointRecord[];
  modules: ApiModuleSummary[];
  schemaCount: number;
  protectedCount: number;
  optionalCount: number;
  publicCount: number;
  tagDescriptions: Record<string, string>;
}

export interface ApiCenterPayload {
  backendBaseUrl: string;
  swaggerUrl: string;
  openApiUrl: string;
  fetchedAt: string;
  spec: OpenApiSpec | null;
  error?: string;
}
