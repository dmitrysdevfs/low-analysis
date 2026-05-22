import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import {
  getArticle,
  getLawStats,
  getLaws,
  getLawTree,
  getSubjects,
  parseLaw,
} from "@/lib/api";
import { getSubjectElements } from "@/lib/api/subjects";
import { server } from "@/test/msw/server";

describe("API clients with MSW", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("returns laws from the shared MSW handlers", async () => {
    const laws = await getLaws();

    expect(laws).toHaveLength(3);
    expect(laws[0]?.title).toBe("КОНСТИТУЦІЯ УКРАЇНИ");
  });

  it("filters laws by query", async () => {
    const laws = await getLaws("освіту");

    expect(laws).toHaveLength(1);
    expect(laws[0]?.code).toBe("2145-19");
  });

  it("returns tree and article data for the selected law", async () => {
    const tree = await getLawTree("law-1");
    const article = await getArticle("law-1", "1");

    expect(tree.elements.length).toBeGreaterThan(3);
    expect(article.article.number).toBe("1");
    expect(article.children).toHaveLength(2);
  });

  it("returns stats and subjects metadata", async () => {
    const stats = await getLawStats("law-1");
    const subjects = await getSubjects();
    const elements = await getSubjectElements("subject-1");

    expect(stats.totalElements).toBe(6);
    expect(subjects).toHaveLength(3);
    expect(elements.subject.canonical_name).toBe("держава");
    expect(elements.elements.length).toBeGreaterThan(0);
  });

  it("surfaces backend validation messages from parse endpoint", async () => {
    server.use(
      http.post("/api/laws/parse", async () =>
        HttpResponse.json(
          { message: "URL законодавчого документа недійсний" },
          { status: 422 },
        ),
      ),
    );

    await expect(parseLaw("https://example.invalid/law")).rejects.toThrow(
      "URL законодавчого документа недійсний",
    );
  });
});
