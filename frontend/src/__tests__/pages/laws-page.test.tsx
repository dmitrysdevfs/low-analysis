import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LawsPage from "@/app/laws/page";
import { useLawsPaginated } from "@/hooks/useLawsPaginated";
import { LAW_FIXTURE } from "@/test/fixtures";

vi.mock("@/hooks/useLawsPaginated", () => ({
  useLawsPaginated: vi.fn(),
}));

const DEFAULT_PAGINATION = {
  total: 1,
  page: 1,
  limit: 20,
  totalPages: 1,
  hasPrevPage: false,
  hasNextPage: false,
};

describe("Laws page", () => {
  it("renders the laws catalogue and reacts to search input", async () => {
    const user = userEvent.setup();

    vi.mocked(useLawsPaginated).mockImplementation((query = {}) => {
      const q = query.q ?? "";

      if (q === "zzz") {
        return {
          laws: [],
          pagination: { ...DEFAULT_PAGINATION, total: 0 },
          error: null,
          loading: false,
        };
      }

      return {
        laws: [LAW_FIXTURE],
        pagination: DEFAULT_PAGINATION,
        error: null,
        loading: false,
      };
    });

    render(<LawsPage />);

    expect(screen.getByText("Закони")).toBeInTheDocument();
    expect(screen.getByText("України")).toBeInTheDocument();
    expect(screen.getByText(/1 документ/i)).toBeInTheDocument();
    expect(screen.getAllByText(LAW_FIXTURE.title).length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByRole("link")
        .some(
          (link) => link.getAttribute("href") === `/laws/${LAW_FIXTURE._id}`,
        ),
    ).toBe(true);

    const searchInput = screen.getByPlaceholderText("Пошук за назвою закону…");

    await user.clear(searchInput);
    fireEvent.change(searchInput, {
      target: { value: "zzz" },
    });

    await vi.waitFor(() =>
      expect(
        screen.getByText(/Нічого не знайдено за запитом «zzz»/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders the request error state", () => {
    vi.mocked(useLawsPaginated).mockReturnValue({
      laws: [],
      pagination: null,
      error: "Помилка завантаження",
      loading: false,
    });

    render(<LawsPage />);

    expect(screen.getByText("Помилка завантаження")).toBeInTheDocument();
  });
});
