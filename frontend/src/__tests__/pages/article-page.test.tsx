import { render, screen } from "@testing-library/react";
import ArticlePage from "@/app/laws/[id]/articles/[num]/page";
import { useArticle } from "@/hooks/useArticle";
import { useLaws } from "@/hooks/useLaws";
import { ARTICLE_RESPONSE_FIXTURE, LAW_FIXTURE } from "@/test/fixtures";
import { setMockParams } from "@/test/mocks/next-navigation";

vi.mock("@/hooks/useLaws", () => ({
  useLaws: vi.fn(),
}));

vi.mock("@/hooks/useArticle", () => ({
  useArticle: vi.fn(),
}));

describe("Article page", () => {
  beforeEach(() => {
    setMockParams({ id: LAW_FIXTURE._id, num: "1" });
    vi.mocked(useLaws).mockReturnValue({
      fetchedQ: "",
      laws: [LAW_FIXTURE],
      error: null,
      loading: false,
    });
  });

  it("renders article content and nested children", () => {
    vi.mocked(useArticle).mockReturnValue({
      fetchedKey: `${LAW_FIXTURE._id}:1`,
      article: ARTICLE_RESPONSE_FIXTURE.article,
      children: ARTICLE_RESPONSE_FIXTURE.children,
      error: null,
      loading: false,
    });

    render(<ArticlePage />);

    expect(screen.getAllByText(LAW_FIXTURE.title).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("heading", { name: ARTICLE_RESPONSE_FIXTURE.article.title! }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Вміст статті/i)).toBeInTheDocument();
    expect(
      screen.getByText(ARTICLE_RESPONSE_FIXTURE.children[0].text!),
    ).toBeInTheDocument();
  });

  it("renders the not-found state when the article is absent", () => {
    vi.mocked(useArticle).mockReturnValue({
      fetchedKey: `${LAW_FIXTURE._id}:1`,
      article: null,
      children: [],
      error: null,
      loading: false,
    });

    render(<ArticlePage />);

    expect(screen.getByText(/Статтю не знайдено/i)).toBeInTheDocument();
  });
});
