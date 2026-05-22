import type { Page, Route } from "@playwright/test";
import {
  mswArticleResponses,
  mswLawStats,
  mswLawTrees,
  mswParseResponse,
  mswSubjectElements,
  mswSubjects,
  searchLaws,
} from "../../../src/test/msw/data";
import type { ApiRequestProfiler } from "./api-profiler";

function jsonResponse(route: Route, body: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(body),
  });
}

export async function installApiMocking(
  page: Page,
  profiler?: ApiRequestProfiler,
) {
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = new URL(request.url());
    const requestPath = url.pathname;

    profiler?.record(method, request.url());

    if (method === "GET" && requestPath === "/api/laws") {
      const q = url.searchParams.get("q") ?? "";
      return jsonResponse(route, searchLaws(q));
    }

    if (
      method === "GET" &&
      requestPath.startsWith("/api/laws/") &&
      requestPath.endsWith("/tree")
    ) {
      const id = requestPath.split("/")[3] ?? "";
      const payload = mswLawTrees[id];
      return payload
        ? jsonResponse(route, payload)
        : jsonResponse(route, { message: "Law tree not found" }, 404);
    }

    if (
      method === "GET" &&
      requestPath.startsWith("/api/laws/") &&
      requestPath.endsWith("/stats")
    ) {
      const id = requestPath.split("/")[3] ?? "";
      const payload = mswLawStats[id];
      return payload
        ? jsonResponse(route, payload)
        : jsonResponse(route, { message: "Law stats not found" }, 404);
    }

    if (
      method === "GET" &&
      /^\/api\/laws\/[^/]+\/articles\/[^/]+$/u.test(requestPath)
    ) {
      const [, , , lawId, , articleNum] = requestPath.split("/");
      const payload = mswArticleResponses[`${lawId}:${articleNum}`];
      return payload
        ? jsonResponse(route, payload)
        : jsonResponse(route, { message: "Article not found" }, 404);
    }

    if (method === "POST" && requestPath === "/api/laws/parse") {
      return jsonResponse(route, mswParseResponse);
    }

    if (method === "GET" && requestPath === "/api/subjects") {
      return jsonResponse(route, mswSubjects);
    }

    if (
      method === "GET" &&
      /^\/api\/subjects\/[^/]+\/elements$/u.test(requestPath)
    ) {
      const [, , , subjectId] = requestPath.split("/");
      const payload = mswSubjectElements[subjectId ?? ""];
      return payload
        ? jsonResponse(route, payload)
        : jsonResponse(route, { message: "Subject not found" }, 404);
    }

    return jsonResponse(
      route,
      {
        message: `No Playwright API mock registered for ${method} ${requestPath}`,
      },
      404,
    );
  });
}
