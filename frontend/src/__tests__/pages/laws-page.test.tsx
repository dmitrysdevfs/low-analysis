import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LawsPage from "@/app/laws/page";
import { useLaws } from "@/hooks/useLaws";
import { LAW_FIXTURE } from "@/test/fixtures";

vi.mock("@/hooks/useLaws", () => ({
  useLaws: vi.fn(),
}));

describe("Laws page", () => {
  it("renders the laws catalogue and reacts to search input", async () => {
    const user = userEvent.setup();

    vi.mocked(useLaws).mockImplementation((query = "", refreshKey = 0) => {
      void refreshKey;

      if (query === "zzz") {
        return {
          fetchedQ: "zzz",
          fetchedRefreshKey: null,
          laws: [],
          error: null,
          loading: false,
        };
      }

      return {
        fetchedQ: query,
        fetchedRefreshKey: null,
        laws: [LAW_FIXTURE],
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

    await vi.waitFor(() => expect(useLaws).toHaveBeenLastCalledWith("zzz", 0));
    await vi.waitFor(() =>
      expect(
        screen.getByText(/Нічого не знайдено за запитом «zzz»/i),
      ).toBeInTheDocument(),
    );
  });

  it("renders the request error state", () => {
    vi.mocked(useLaws).mockReturnValue({
      fetchedQ: "",
      fetchedRefreshKey: null,
      laws: [],
      error: "Помилка завантаження",
      loading: false,
    });

    render(<LawsPage />);

    expect(screen.getByText("Помилка завантаження")).toBeInTheDocument();
  });
});
