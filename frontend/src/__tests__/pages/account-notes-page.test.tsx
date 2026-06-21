import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AccountNotesPage from "@/app/account/notes/page";
import type { Note } from "@/lib/notes/types";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNotes } from "@/hooks/useNotes";

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/hooks/useNotes", () => ({
  useNotes: vi.fn(),
}));

const NOTE_FIXTURES: Note[] = [
  {
    id: "note-1",
    createdAt: "2026-05-20T08:00:00.000Z",
    updatedAt: "2026-05-20T08:00:00.000Z",
    type: "selection",
    color: "gold",
    noteText: "Короткий коментар до виділеного фрагмента.",
    selectedText: "Цитата першого виділення.",
    pageUrl: "/laws/law-1/articles/1",
  },
  {
    id: "note-2",
    createdAt: "2026-05-21T08:00:00.000Z",
    updatedAt: "2026-05-21T08:00:00.000Z",
    type: "selection",
    color: "blue",
    noteText:
      "Дуже довгий коментар, який потрібен лише для того, щоб показати кнопку повного перегляду та модальне вікно з повним текстом нотатки.".repeat(
        2,
      ),
    selectedText:
      "Дуже довга цитата для перевірки розгортання та модального перегляду повного вмісту нотатки.".repeat(
        2,
      ),
    pageUrl: "/laws/law-2/articles/2",
  },
];

describe("Account notes page", () => {
  const removeNote = vi.fn();

  beforeEach(() => {
    removeNote.mockReset();
    vi.mocked(useAuth).mockReturnValue({
      user: {
        id: "user-1",
        displayName: "Тестовий користувач",
        email: "user@test.dev",
        roles: ["client"],
        accountType: "client",
        lastLoginAt: "2026-05-21T09:00:00.000Z",
      },
    } as never);
    vi.mocked(useNotes).mockReturnValue({
      notes: NOTE_FIXTURES,
      loading: false,
      addNote: vi.fn(),
      removeNote,
      updateNote: vi.fn(),
      togglePin: vi.fn(),
      hasArticleNote: vi.fn(),
    });
  });

  it("shows the login prompt when there is no active user", () => {
    vi.mocked(useAuth).mockReturnValue({ user: null } as never);

    render(<AccountNotesPage />);

    expect(
      screen.queryByRole("heading", { name: /нотатки/i }),
    ).not.toBeInTheDocument();
  });

  it("filters notes by color chips", async () => {
    const user = userEvent.setup();

    render(<AccountNotesPage />);

    expect(
      screen.getByText("Короткий коментар до виділеного фрагмента."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Дуже довгий коментар/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Синя/i }));

    expect(
      screen.queryByText("Короткий коментар до виділеного фрагмента."),
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Дуже довгий коментар/)).toBeInTheDocument();
  });

  it("opens the expanded modal for long notes", async () => {
    const user = userEvent.setup();

    render(<AccountNotesPage />);

    await user.click(screen.getByRole("button", { name: /Читати/i }));

    expect(screen.getAllByText(/Дуже довга цитата/).length).toBeGreaterThan(0);
  });

  it("confirms and removes a note", async () => {
    const user = userEvent.setup();

    render(<AccountNotesPage />);

    const targetCard = screen
      .getByText("Короткий коментар до виділеного фрагмента.")
      .closest("li");

    expect(targetCard).not.toBeNull();

    await user.click(within(targetCard as HTMLElement).getByTitle("Видалити"));
    expect(screen.getByText("Видалити нотатку?")).toBeInTheDocument();

    const confirmSub = screen.getByText("Цю дію не можна скасувати.");
    const confirmActions = confirmSub.nextElementSibling as HTMLElement;
    await user.click(
      within(confirmActions).getByRole("button", { name: "Видалити" }),
    );
    expect(removeNote).toHaveBeenCalledWith("note-1");
  });
});
