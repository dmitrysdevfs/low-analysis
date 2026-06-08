import { act, renderHook } from "@testing-library/react";
import { useNotes } from "@/hooks/useNotes";
import { useAuth } from "@/components/auth/AuthProvider";
import { notesApi } from "@/lib/api/notes";
import type { Note } from "@/lib/notes/types";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/api/notes", () => ({
  notesApi: {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    togglePin: vi.fn(),
    migrate: vi.fn(),
  },
}));

const makeNote = (overrides: Partial<Note> = {}): Note => ({
  id: "note-uuid-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  type: "article",
  color: "gold",
  noteText: "Pinned article note",
  lawId: "law-1",
  articleNum: "7",
  articleTitle: "Стаття 7",
  ...overrides,
});

describe("useNotes", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-1" },
    } as never);
    vi.mocked(notesApi.getAll).mockResolvedValue([]);
    vi.mocked(notesApi.create).mockResolvedValue(makeNote());
    vi.mocked(notesApi.update).mockResolvedValue(
      makeNote({ noteText: "Updated", color: "green" }),
    );
    vi.mocked(notesApi.delete).mockResolvedValue(undefined);
    vi.mocked(notesApi.migrate).mockResolvedValue({ imported: 0 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("adds and queries article notes", async () => {
    const { result } = renderHook(() => useNotes());

    // flush initial useEffect (getAll) before calling addNote to avoid race
    await act(async () => {});

    await act(async () => {
      await result.current.addNote({
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

  it("updates and removes notes", async () => {
    const { result } = renderHook(() => useNotes());

    // flush initial useEffect (getAll) before interacting
    await act(async () => {});

    await act(async () => {
      await result.current.addNote({
        type: "selection",
        color: "blue",
        noteText: "Original",
        selectedText: "Quoted text",
        pageUrl: "/laws/law-1/articles/1",
      });
    });

    await act(async () => {
      await result.current.updateNote("note-uuid-1", {
        noteText: "Updated",
        color: "green",
      });
    });

    expect(result.current.notes[0]?.noteText).toBe("Updated");
    expect(result.current.notes[0]?.color).toBe("green");

    await act(async () => {
      await result.current.removeNote("note-uuid-1");
    });

    expect(result.current.notes).toEqual([]);
  });

  it("reloads notes when the active user changes", async () => {
    const user2Note = makeNote({
      id: "foreign-note",
      noteText: "From another user",
    });

    vi.mocked(notesApi.getAll)
      .mockResolvedValueOnce([]) // перший виклик — user-1
      .mockResolvedValueOnce([user2Note]); // другий виклик — user-2

    const { result, rerender } = renderHook(() => useNotes());

    await act(async () => {
      // чекаємо поки відпрацює useEffect для user-1
    });

    expect(result.current.notes).toEqual([]);

    vi.mocked(useAuth).mockReturnValue({
      user: { id: "user-2" },
    } as never);

    await act(async () => {
      rerender();
    });
    // flush second useEffect triggered by userId change
    await act(async () => {});

    expect(result.current.notes[0]?.id).toBe("foreign-note");
  });
});
