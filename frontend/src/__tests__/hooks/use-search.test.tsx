import { act, renderHook, waitFor } from "@testing-library/react";
import { useSearch } from "@/hooks/useSearch";
import { getLaws } from "@/lib/api";
import { LAW_FIXTURE, LAW_FIXTURE_2, LAW_FIXTURE_3 } from "@/test/fixtures";

vi.mock("@/lib/api", () => ({
  getLaws: vi.fn(),
}));

describe("useSearch", () => {
  beforeEach(() => {
    vi.mocked(getLaws).mockReset();
  });

  it("resets state for blank queries", () => {
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search({ q: "   ", sort: "relevance" });
    });

    expect(getLaws).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.searched).toBe(false);
  });

  it("filters by type and sorts by title", async () => {
    vi.mocked(getLaws).mockResolvedValue([
      LAW_FIXTURE_3,
      LAW_FIXTURE,
      LAW_FIXTURE_2,
    ]);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search({ q: "закон", type: "19", sort: "title" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.params).toMatchObject({
      q: "закон",
      docType: "19",
      sort: "title",
    });
    expect(result.current.results).toEqual([LAW_FIXTURE_3]);
    expect(result.current.searched).toBe(true);
  });

  it("sorts by createdAt when requested", async () => {
    vi.mocked(getLaws).mockResolvedValue([
      LAW_FIXTURE,
      LAW_FIXTURE_2,
      LAW_FIXTURE_3,
    ]);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search({ q: "кодекс", sort: "date" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.results).toEqual([
      LAW_FIXTURE_3,
      LAW_FIXTURE,
      LAW_FIXTURE_2,
    ]);
  });

  it("keeps server order for relevance sort", async () => {
    vi.mocked(getLaws).mockResolvedValue([
      LAW_FIXTURE_2,
      LAW_FIXTURE,
      LAW_FIXTURE_3,
    ]);

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search({ q: "право", sort: "relevance" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.results).toEqual([
      LAW_FIXTURE_2,
      LAW_FIXTURE,
      LAW_FIXTURE_3,
    ]);
  });

  it("exposes search errors", async () => {
    vi.mocked(getLaws).mockRejectedValue(new Error("search failed"));

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.search({ q: "boom", sort: "relevance" });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.results).toEqual([]);
    expect(result.current.error).toBe("search failed");
    expect(result.current.searched).toBe(true);
  });
});
