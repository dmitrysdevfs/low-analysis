import {
  getArticle,
  getLawTree,
  getLaws,
  getSubjectElements,
  getSubjects,
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
    expect(fetchMock).toHaveBeenCalledWith("/api/laws");
  });

  it("trims and encodes the search query when requesting laws", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [LAW_FIXTURE],
    });

    await getLaws("  конституція україни  ");

    expect(fetchMock).toHaveBeenCalledWith(
      `/api/laws?q=${encodeURIComponent("конституція україни")}`,
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
    expect(fetchMock).toHaveBeenCalledWith(`/api/laws/${LAW_FIXTURE._id}/tree`);
  });

  it("requests a single article by law id and article number", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ARTICLE_RESPONSE_FIXTURE,
    });

    await expect(getArticle("law-1", "1")).resolves.toEqual(
      ARTICLE_RESPONSE_FIXTURE,
    );
    expect(fetchMock).toHaveBeenCalledWith("/api/laws/law-1/articles/1");
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

    expect(fetchMock).toHaveBeenNthCalledWith(1, "/api/subjects");
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      `/api/subjects/${SUBJECT_FIXTURE._id}/elements`,
    );
  });
});
