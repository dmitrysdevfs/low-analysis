import { act, renderHook, waitFor } from "@testing-library/react";
import { useArticle } from "@/hooks/useArticle";
import { __resetLawsCacheForTests, useLaws } from "@/hooks/useLaws";
import { useLawTree } from "@/hooks/useLawTree";
import { useSubjectDetail } from "@/hooks/useSubjectDetail";
import { __resetSubjectsCacheForTests, useSubjects } from "@/hooks/useSubjects";
import {
  getArticle,
  getLaws,
  getLawTree,
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

vi.mock("@/lib/api", () => ({
  getLaws: vi.fn(),
  getLawTree: vi.fn(),
  getArticle: vi.fn(),
  getSubjects: vi.fn(),
  getSubjectElements: vi.fn(),
}));

describe("frontend data hooks", () => {
  beforeEach(() => {
    vi.mocked(getLaws).mockReset();
    vi.mocked(getLawTree).mockReset();
    vi.mocked(getArticle).mockReset();
    vi.mocked(getSubjects).mockReset();
    vi.mocked(getSubjectElements).mockReset();
    __resetLawsCacheForTests();
    __resetSubjectsCacheForTests();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("useLaws fetches immediately for empty queries", async () => {
    vi.mocked(getLaws).mockResolvedValue([LAW_FIXTURE]);

    const { result } = renderHook(() => useLaws());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(getLaws).toHaveBeenCalledWith(
      "",
      expect.objectContaining({ signal: expect.any(Object) }),
    );
    expect(result.current.laws).toEqual([LAW_FIXTURE]);
    expect(result.current.error).toBeNull();
  });

  it("useLaws debounces non-empty queries", async () => {
    vi.useFakeTimers();
    vi.mocked(getLaws).mockResolvedValue([LAW_FIXTURE]);

    const { result } = renderHook(() => useLaws("конституція"));

    expect(result.current.loading).toBe(true);
    expect(getLaws).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(249);
    });
    expect(getLaws).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });

    expect(getLaws).toHaveBeenCalledWith(
      "конституція",
      expect.objectContaining({ signal: expect.any(Object) }),
    );

    vi.useRealTimers();
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it("useLaws exposes request errors", async () => {
    vi.mocked(getLaws).mockRejectedValue(new Error("laws failed"));

    const { result } = renderHook(() => useLaws("boom"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("laws failed");
    expect(result.current.laws).toEqual([]);
  });

  it("useLaws maps HTTP 404 to Ukrainian message", async () => {
    vi.mocked(getLaws).mockRejectedValue(new Error("HTTP 404 Not Found"));

    const { result } = renderHook(() => useLaws());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Дані не знайдено.");
    expect(result.current.laws).toEqual([]);
  });

  it("useLaws maps network TypeError to Ukrainian message", async () => {
    vi.mocked(getLaws).mockRejectedValue(new TypeError("Failed to fetch"));

    const { result } = renderHook(() => useLaws());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toMatch(/зв'язку з сервером/);
    expect(result.current.laws).toEqual([]);
  });

  it("useLaws maps HTTP 500 to server error message", async () => {
    vi.mocked(getLaws).mockRejectedValue(
      new Error("HTTP 500 Internal Server Error"),
    );

    const { result } = renderHook(() => useLaws());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Помилка сервера. Спробуйте пізніше.");
    expect(result.current.laws).toEqual([]);
  });

  it("useLaws does not update state when request is aborted", async () => {
    const abortErr = new DOMException("Aborted", "AbortError");
    vi.mocked(getLaws).mockRejectedValue(abortErr);

    const { result } = renderHook(() => useLaws());

    await act(async () => {
      await Promise.resolve();
    });

    // parseApiError returns "__ABORT__" → setState is skipped
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(result.current.laws).toEqual([]);
  });

  it("useLawTree does not fetch without an id", () => {
    const { result } = renderHook(() => useLawTree(undefined));

    expect(result.current.loading).toBe(false);
    expect(getLawTree).not.toHaveBeenCalled();
  });

  it("useLawTree returns the parsed tree for a law id", async () => {
    vi.mocked(getLawTree).mockResolvedValue(LAW_TREE_RESPONSE_FIXTURE);

    const { result } = renderHook(() => useLawTree("law-1"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.law).toEqual(LAW_FIXTURE);
    expect(result.current.tree).toEqual(LAW_TREE_RESPONSE_FIXTURE.elements);
    expect(result.current.error).toBeNull();
  });

  it("useArticle skips incomplete params and resolves article data", async () => {
    const empty = renderHook(() => useArticle("law-1", undefined));
    expect(empty.result.current.loading).toBe(false);
    expect(getArticle).not.toHaveBeenCalled();

    vi.mocked(getArticle).mockResolvedValue(ARTICLE_RESPONSE_FIXTURE);
    const full = renderHook(() => useArticle("law-1", "1"));

    await waitFor(() => expect(full.result.current.loading).toBe(false));

    expect(full.result.current.article).toEqual(
      ARTICLE_RESPONSE_FIXTURE.article,
    );
    expect(full.result.current.children).toEqual(
      ARTICLE_RESPONSE_FIXTURE.children,
    );
  });

  it("useArticle exposes request failures", async () => {
    vi.mocked(getArticle).mockRejectedValue(new Error("article failed"));

    const { result } = renderHook(() => useArticle("law-1", "9"));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("article failed");
    expect(result.current.article).toBeNull();
    expect(result.current.children).toEqual([]);
  });

  it("useSubjects returns subject lists and loading state", async () => {
    vi.mocked(getSubjects).mockResolvedValue([SUBJECT_FIXTURE]);

    const { result } = renderHook(() => useSubjects());

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subjects).toEqual([SUBJECT_FIXTURE]);
    expect(result.current.error).toBeNull();
  });

  it("useSubjects reports errors", async () => {
    vi.mocked(getSubjects).mockRejectedValue(new Error("subjects failed"));

    const { result } = renderHook(() => useSubjects());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subjects).toEqual([]);
    expect(result.current.error).toBe("subjects failed");
  });

  it("useSubjectDetail fetches subject and linked elements", async () => {
    vi.mocked(getSubjectElements).mockResolvedValue(SUBJECT_ELEMENTS_FIXTURE);

    const { result } = renderHook(() => useSubjectDetail(SUBJECT_FIXTURE._id));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subject).toEqual(SUBJECT_FIXTURE);
    expect(result.current.elements).toEqual(SUBJECT_ELEMENTS_FIXTURE.elements);
  });

  it("useSubjectDetail surfaces errors", async () => {
    vi.mocked(getSubjectElements).mockRejectedValue(
      new Error("subject detail failed"),
    );

    const { result } = renderHook(() => useSubjectDetail(SUBJECT_FIXTURE._id));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.subject).toBeNull();
    expect(result.current.elements).toEqual([]);
    expect(result.current.error).toBe("subject detail failed");
  });
});
