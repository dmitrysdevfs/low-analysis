import { render, screen } from "@testing-library/react";
import HomePage from "@/app/page";
import { useLaws } from "@/hooks/useLaws";
import { LAW_FIXTURE, LAW_FIXTURE_2 } from "@/test/fixtures";

vi.mock("@/hooks/useLaws", () => ({
  useLaws: vi.fn(),
}));

describe("Home page", () => {
  it("renders the ukrainian hero and roadmap content", () => {
    vi.mocked(useLaws).mockReturnValue({
      laws: [LAW_FIXTURE, LAW_FIXTURE_2],
      error: null,
      loading: false,
    });

    render(<HomePage />);

    expect(screen.getByText("Law Analysis")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Правова екосистема для громадян, юристів та законотворців/i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Переглянути закони/i }),
    ).toHaveAttribute("href", "/laws");
    expect(screen.getByRole("link", { name: /Суб'єкти/i })).toHaveAttribute(
      "href",
      "/subjects",
    );
  });

  it("renders hero even when laws are loading", () => {
    vi.mocked(useLaws).mockReturnValue({
      laws: [],
      error: null,
      loading: true,
    });

    render(<HomePage />);

    expect(screen.getByText("Law Analysis")).toBeInTheDocument();
  });
});
