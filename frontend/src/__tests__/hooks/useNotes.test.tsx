import { act, renderHook } from "@testing-library/react";
import { useNotes } from "@/hooks/useNotes";
import { useAuth } from "@/components/auth/AuthProvider";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

describe("useNotes", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" },
    } as never);
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn(() => "note-uuid-1"),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("adds and queries article notes", () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.addNote({
        type: "article",
        color: "gold",
        noteText: "Pinned article note",
        lawId: "law-1",
        articleNum: "7",
        articleTitle: "Стаття 7",
      });
    });

    expect(result.current.notes).toHaveLength(1);
    expect(result.current.notes[0]?.id).toBe("note-uuid-1");
    expect(result.current.hasArticleNote("law-1", "7")).toBe(true);
  });

  it("updates and removes notes", () => {
    const { result } = renderHook(() => useNotes());

    act(() => {
      result.current.addNote({
        type: "selection",
        color: "blue",
        noteText: "Original",
        selectedText: "Quoted text",
        pageUrl: "/laws/law-1/articles/1",
      });
    });

    act(() => {
      result.current.updateNote("note-uuid-1", {
        noteText: "Updated",
        color: "green",
      });
    });

    expect(result.current.notes[0]?.noteText).toBe("Updated");
    expect(result.current.notes[0]?.color).toBe("green");

    act(() => {
      result.current.removeNote("note-uuid-1");
    });

    expect(result.current.notes).toEqual([]);
  });

  it("reloads notes when the active user changes", () => {
    window.localStorage.setItem(
      "law-analysis.notes.user-2",
      JSON.stringify([
        {
          id: "foreign-note",
          createdAt: "2026-05-21T00:00:00.000Z",
          updatedAt: "2026-05-21T00:00:00.000Z",
          type: "selection",
          color: "gold",
          noteText: "From another user",
        },
      ]),
    );

    const { result, rerender } = renderHook(() => useNotes());
    expect(result.current.notes).toEqual([]);

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-2" },
    } as never);

    rerender();
    expect(result.current.notes[0]?.id).toBe("foreign-note");
  });
});
