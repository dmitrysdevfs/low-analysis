import {
  createApiCenterModel,
  getSecurityMode,
} from "@/features/api-center/lib/normalizeOpenApi";
import type { OpenApiSpec } from "@/features/api-center";

describe("api center OpenAPI normalization", () => {
  const spec: OpenApiSpec = {
    tags: [
      { name: "Auth", description: "Authentication" },
      { name: "Assistant", description: "Lex AI" },
    ],
    components: {
      schemas: {
        AuthResponse: {},
        Session: {},
      },
    },
    paths: {
      "/api/auth/login": {
        post: {
          summary: "Login user",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": {},
            },
          },
          responses: {
            "200": { description: "OK" },
            "401": { description: "Unauthorized" },
          },
          security: [],
        },
      },
      "/api/assistant/chat/stream": {
        post: {
          summary: "Stream AI reply",
          tags: ["Assistant"],
          responses: {
            "200": { description: "SSE stream" },
          },
          security: [{}, { bearerAuth: [] }],
        },
      },
      "/api/assistant/sessions": {
        get: {
          summary: "Get sessions",
          tags: ["Assistant"],
          responses: {
            "200": { description: "Sessions" },
          },
          security: [{ bearerAuth: [] }],
        },
      },
    },
  };

  it("classifies OpenAPI security modes", () => {
    expect(getSecurityMode(undefined)).toBe("public");
    expect(getSecurityMode([])).toBe("public");
    expect(getSecurityMode([{}, { bearerAuth: [] }])).toBe("optional");
    expect(getSecurityMode([{ bearerAuth: [] }])).toBe("protected");
  });

  it("builds endpoint and module summaries", () => {
    const model = createApiCenterModel(spec);

    expect(model.endpoints).toHaveLength(3);
    expect(model.modules).toEqual([
      expect.objectContaining({
        name: "Assistant",
        count: 2,
        protectedCount: 2,
      }),
      expect.objectContaining({ name: "Auth", count: 1, protectedCount: 0 }),
    ]);
    expect(model.schemaCount).toBe(2);
    expect(model.publicCount).toBe(1);
    expect(model.optionalCount).toBe(1);
    expect(model.protectedCount).toBe(1);
  });
});
