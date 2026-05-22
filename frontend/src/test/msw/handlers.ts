import { http, HttpResponse } from "msw";
import {
  mswArticleResponses,
  mswLawStats,
  mswLawTrees,
  mswParseResponse,
  mswSubjectElements,
  mswSubjects,
  searchLaws,
} from "./data";

export const handlers = [
  http.get("/api/laws", ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";

    return HttpResponse.json(searchLaws(q));
  }),

  http.get("/api/laws/:id/tree", ({ params }) => {
    const payload = mswLawTrees[String(params.id)];

    if (!payload) {
      return HttpResponse.json(
        { message: "Law tree not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(payload);
  }),

  http.get("/api/laws/:id/stats", ({ params }) => {
    const payload = mswLawStats[String(params.id)];

    if (!payload) {
      return HttpResponse.json(
        { message: "Law stats not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(payload);
  }),

  http.get("/api/laws/:id/articles/:num", ({ params }) => {
    const payload =
      mswArticleResponses[`${String(params.id)}:${String(params.num)}`];

    if (!payload) {
      return HttpResponse.json(
        { message: "Article not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(payload);
  }),

  http.post("/api/laws/parse", async () => {
    return HttpResponse.json(mswParseResponse);
  }),

  http.get("/api/subjects", () => {
    return HttpResponse.json(mswSubjects);
  }),

  http.get("/api/subjects/:id/elements", ({ params }) => {
    const payload = mswSubjectElements[String(params.id)];

    if (!payload) {
      return HttpResponse.json(
        { message: "Subject not found" },
        { status: 404 },
      );
    }

    return HttpResponse.json(payload);
  }),
];
