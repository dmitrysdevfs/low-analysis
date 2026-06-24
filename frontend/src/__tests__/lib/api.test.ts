import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getArticle,
  getLawTree,
  getLaws,
  getSubjectElements,
  getSubjects,
  parseLaw,
  searchSubjects,
} from "@/lib/api";
import {
  ARTICLE_RESPONSE_FIXTURE,
  LAW_FIXTURE,
  LAW_TREE_RESPONSE_FIXTURE,
  SUBJECT_ELEMENTS_FIXTURE,
  SUBJECT_FIXTURE,
} from "@/test/fixtures";

describe("frontend API client", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("requests laws without a query", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [LAW_FIXTURE],
    });

    await expect(getLaws()).resolves.toEqual([LAW_FIXTURE]);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/laws?limit=500",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("trims and encodes the search query when requesting laws", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [LAW_FIXTURE],
    });

    await getLaws("  конституція україни  ");

    const params = new URLSearchParams({ limit: "500" });
    params.set("q", "конституція україни");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/laws?${params.toString()}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws a descriptive error on non-ok responses", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
    });

    await expect(getLaws("boom")).rejects.toThrow(
      "HTTP 500: Internal Server Error",
    );
  });

  it("returns the law tree response with law metadata and elements", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => LAW_TREE_RESPONSE_FIXTURE,
    });

    await expect(getLawTree(LAW_FIXTURE._id)).resolves.toEqual(
      LAW_TREE_RESPONSE_FIXTURE,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/laws/${LAW_FIXTURE._id}/tree`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("requests a single article by law id and article number", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ARTICLE_RESPONSE_FIXTURE,
    });

    await expect(getArticle("law-1", "1")).resolves.toEqual(
      ARTICLE_RESPONSE_FIXTURE,
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/laws/law-1/articles/1",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("requests subjects and subject elements", async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [SUBJECT_FIXTURE],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => SUBJECT_ELEMENTS_FIXTURE,
      });

    await expect(getSubjects()).resolves.toEqual([SUBJECT_FIXTURE]);
    await expect(getSubjectElements(SUBJECT_FIXTURE._id)).resolves.toEqual(
      SUBJECT_ELEMENTS_FIXTURE,
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/subjects",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/subjects/${SUBJECT_FIXTURE._id}/elements`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("passes subjectId when requesting laws", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [LAW_FIXTURE],
    });

    await getLaws("фінанси", undefined, {
      subjectId: "507f1f77bcf86cd799439011",
    });

    const params = new URLSearchParams({ limit: "500" });
    params.set("q", "фінанси");
    params.set("subjectId", "507f1f77bcf86cd799439011");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/laws?${params.toString()}`,
      expect.anything(),
    );
  });

  it("searches subjects via the autocomplete endpoint", async () => {
    const data = [{ _id: "1", name: "Національний банк України", count: 152 }];
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data }),
    });

    await expect(searchSubjects("  банк  ")).resolves.toEqual(data);

    const params = new URLSearchParams({ q: "банк" });
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/subjects/search?${params.toString()}`,
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("skips the request for a blank subject query", async () => {
    await expect(searchSubjects("   ")).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a POST request to parse a law by URL", async () => {
    const response = {
      message: "Law successfully parsed and saved",
      lawId: "law-1",
      elementsCount: 42,
    };

    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => response,
    });

    await expect(
      parseLaw("https://zakon.rada.gov.ua/laws/show/254к/96-вр"),
    ).resolves.toEqual(response);

    expect(fetchMock).toHaveBeenCalledWith("/api/laws/parse", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: "https://zakon.rada.gov.ua/laws/show/254к/96-вр",
      }),
    });
  });

  it("uses backend error message for parseLaw when available", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({
        message: "Could not extract valid law code",
      }),
    });

    await expect(parseLaw("invalid-url")).rejects.toThrow(
      "Could not extract valid law code",
    );
  });
});
